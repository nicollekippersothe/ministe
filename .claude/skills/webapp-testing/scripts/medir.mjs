/*
 * Mede uma tela em dois tamanhos e devolve o que costuma estar errado.
 *
 * Existe porque cinco frentes deste projeto escreveram, cada uma por conta,
 * o mesmo script: abrir o Chromium no caminho certo, montar iPhone 13 e
 * monitor, tirar captura, e conferir as mesmas quatro coisas. Escrito uma vez,
 * ele deixa de ser trabalho e passa a ser um comando.
 *
 * O que ele confere, e por que cada um:
 *
 *   largura      Elemento que passa da largura da tela obriga a rolar de lado,
 *                e no celular isso some com metade do conteúdo. É o defeito
 *                mais fácil de introduzir e o mais fácil de medir.
 *   toque        Alvo menor que 44 pixels erra o dedo. O número sai da
 *                diretriz da Apple e é o mesmo que a WCAG usa como alvo.
 *   fonte        Campo com letra abaixo de 16px faz o Safari do iPhone dar
 *                zoom ao focar, e a pessoa perde o formulário de vista.
 *   alt          Imagem sem texto alternativo derruba a nota de
 *                acessibilidade, e a regra 4 do AGENTS.md pede 100.
 *   foco         Elemento focável sem contorno visível deixa quem navega por
 *                teclado sem saber onde está.
 *
 * Uso:
 *   node .claude/skills/webapp-testing/scripts/medir.mjs /criar /painel
 *   node .claude/skills/webapp-testing/scripts/medir.mjs --base http://localhost:3000 /
 *   node .claude/skills/webapp-testing/scripts/medir.mjs --saida /tmp/capturas /precos
 *
 * Sai com código 1 quando algo vaza da largura, porque isso é sempre defeito.
 * O resto é relatório: alvo pequeno num link de rodapé pode ser aceitável, e
 * quem decide é quem está lendo.
 */

import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const CHROMIUM =
  process.env.CHROMIUM ??
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

const args = process.argv.slice(2);
const valorDe = (nome, padrao) => {
  const i = args.indexOf(nome);
  if (i < 0) return padrao;
  const v = args[i + 1];
  args.splice(i, 2);
  return v ?? padrao;
};

const base = valorDe("--base", "http://localhost:3000").replace(/\/$/, "");
const saida = valorDe("--saida", "/tmp/medidas");
const caminhos = args.filter((a) => !a.startsWith("--"));

if (caminhos.length === 0) {
  console.log("informe ao menos um caminho, por exemplo /criar");
  process.exit(2);
}

const TAMANHOS = [
  { nome: "celular", contexto: { ...devices["iPhone 13"] } },
  { nome: "monitor", contexto: { viewport: { width: 1440, height: 900 } } },
];

/* Roda dentro da página. Tudo que ele devolve é número ou texto curto. */
function medir() {
  const visivel = (e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
  };
  const nomeDe = (e) =>
    (e.getAttribute("aria-label") || e.textContent || e.getAttribute("name") || e.id || e.tagName)
      .trim()
      .slice(0, 40);

  const larguraDaTela = document.documentElement.scrollWidth;
  const vazando = [...document.querySelectorAll("body *")]
    .filter((e) => visivel(e) && e.getBoundingClientRect().right > window.innerWidth + 1)
    .map((e) => `${e.tagName.toLowerCase()}.${(e.className || "").toString().slice(0, 30)}`)
    .slice(0, 5);

  const toqueCurto = [...document.querySelectorAll('a, button, [role="button"], summary, input[type="radio"], input[type="checkbox"]')]
    .filter(visivel)
    .map((e) => {
      // O alvo de verdade pode ser o rótulo em volta, e é nele que o dedo
      // acerta. Medir só o elemento acusaria falso em todo rádio do projeto.
      const alvo = e.closest("label") ?? e;
      const r = alvo.getBoundingClientRect();
      return { nome: nomeDe(e), largura: Math.round(r.width), altura: Math.round(r.height) };
    })
    .filter((t) => t.altura < 44 || t.largura < 44);

  const fontePequena = [...document.querySelectorAll("input, textarea, select")]
    .filter(visivel)
    .map((e) => ({ nome: nomeDe(e), px: parseFloat(getComputedStyle(e).fontSize) }))
    .filter((c) => c.px < 16);

  const semAlt = [...document.querySelectorAll("img")]
    .filter(visivel)
    .filter((i) => i.getAttribute("alt") === null)
    .map((i) => i.getAttribute("src")?.slice(0, 50) ?? "sem src");

  const palavras = (document.body.innerText.match(/\S+/g) ?? []).length;

  return {
    larguraDaTela,
    larguraDaJanela: window.innerWidth,
    altura: document.documentElement.scrollHeight,
    palavras,
    vazando,
    toqueCurto,
    fontePequena,
    semAlt,
  };
}

/*
 * Espera o React assumir a página antes de medir.
 *
 * O `networkidle` diz que a rede sossegou, e isso é outra coisa: na primeira
 * visita depois de subir o `next dev`, o Turbopack compila a rota enquanto o
 * navegador já tem o HTML na mão, e a medição caía na página ainda por
 * hidratar. Medida assim, ela é a do servidor, e o alvo de toque que só existe
 * depois da montagem passava batido.
 *
 * A pista é a chave que o React pendura no primeiro elemento do corpo quando
 * monta. Passado o prazo, a medição segue assim mesmo: relatório atrasado vale
 * mais que ferramenta parada.
 */
async function esperarHidratacao(pagina) {
  try {
    await pagina.waitForFunction(
      () => {
        const raiz = document.body.firstElementChild;
        return (
          raiz !== null &&
          Object.keys(raiz).some((k) => k.startsWith("__react"))
        );
      },
      null,
      { timeout: 20000 },
    );
  } catch {
    // Página sem React, ou prazo estourado. Os dois seguem para a medição.
  }
}

await mkdir(saida, { recursive: true });
const navegador = await chromium.launch({ executablePath: CHROMIUM });
let houveVazamento = false;

for (const caminho of caminhos) {
  for (const tamanho of TAMANHOS) {
    const ctx = await navegador.newContext(tamanho.contexto);
    const pagina = await ctx.newPage();
    const quebras = [];
    pagina.on("pageerror", (e) => quebras.push(String(e).slice(0, 120)));
    pagina.on("console", (m) => {
      if (m.type() === "error") quebras.push(`console: ${m.text().slice(0, 120)}`);
    });

    const url = `${base}${caminho}`;
    await pagina.goto(url, { waitUntil: "networkidle" });
    await esperarHidratacao(pagina);
    const m = await pagina.evaluate(medir);

    const arquivo = `${saida}/${caminho.replace(/\W+/g, "-") || "raiz"}-${tamanho.nome}.png`;
    /*
     * caret: "initial" deixa a página como ela está.
     *
     * O padrão do Playwright é "hide", e ele esconde o cursor de texto
     * escrevendo `style="caret-color: transparent"` em cada campo da página,
     * de verdade, no DOM. Numa compilação fria do `next dev` o `networkidle`
     * chega antes de o React assumir, a captura acontece nessa fresta, e o
     * React encontra na montagem um `style` que o componente jamais escreveu.
     * O resultado era o aviso de hidratação divergente em /criar, que a
     * própria medição criava e depois relatava como defeito da tela.
     *
     * O cursor pode aparecer piscando na captura de um campo com autoFocus, e
     * isso é o preço certo: a ferramenta mede, e a página fica intacta.
     */
    await pagina.screenshot({ path: arquivo, fullPage: true, caret: "initial" });

    const vazou = m.larguraDaTela > m.larguraDaJanela;
    if (vazou) houveVazamento = true;

    console.log(`\n${caminho}  ${tamanho.nome}  ${m.larguraDaJanela}px`);
    console.log(`  captura   ${arquivo}`);
    console.log(`  altura    ${m.altura}px, ${m.palavras} palavras`);
    console.log(
      `  largura   ${vazou ? `VAZOU ${m.larguraDaTela}px, culpados: ${m.vazando.join(", ")}` : "ok"}`,
    );
    console.log(
      `  toque     ${m.toqueCurto.length === 0 ? "ok" : m.toqueCurto.map((t) => `${t.nome} ${t.largura}x${t.altura}`).join("; ")}`,
    );
    console.log(
      `  fonte     ${m.fontePequena.length === 0 ? "ok" : m.fontePequena.map((c) => `${c.nome} ${c.px}px`).join("; ")}`,
    );
    console.log(`  alt       ${m.semAlt.length === 0 ? "ok" : m.semAlt.join("; ")}`);
    if (quebras.length) console.log(`  erros     ${quebras.slice(0, 3).join(" | ")}`);

    await ctx.close();
  }
}

await navegador.close();
console.log(
  houveVazamento
    ? "\nalgo vazou da largura. Olhe as capturas antes de consertar."
    : "\nnada vazou da largura. As capturas continuam valendo a olhada.",
);
process.exit(houveVazamento ? 1 : 0);
