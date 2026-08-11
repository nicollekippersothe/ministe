/**
 * Monta uma página de revisão com as telas do produto.
 *
 * Captura cada tela no navegador, num celular emulado, e junta tudo num
 * arquivo HTML que se basta: as imagens vão embutidas, então dá para abrir
 * offline, mandar por link ou olhar no celular.
 *
 * Precisa do servidor de produção rodando:
 *   npm run build && npm start
 *   npm run revisao
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, devices } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SAIDA = process.env.SAIDA ?? "/tmp/revisao";
const EXECUTAVEL = process.env.CHROMIUM;

/**
 * O que cada tela é, o que já funciona e o que ainda não está ligado.
 * A nota é tão importante quanto a imagem: sem ela dá para reclamar de algo
 * que ainda nem foi construído.
 */
const TELAS = [
  {
    id: "inicial",
    rota: "/",
    nome: "Tela inicial",
    grupo: "Entrada",
    largura: "celular",
    nota: "O telefone da abertura e as três peças da segunda seção não são desenho: são os componentes de verdade da página publicada, montados no servidor. Se o botão mudar no produto, muda aqui junto.",
  },
  {
    id: "inicial-desktop",
    rota: "/",
    nome: "Tela inicial no computador",
    grupo: "Entrada",
    largura: "desktop",
    nota: "A mesma tela num monitor. A abertura vira duas colunas, com o texto de um lado e o aparelho do outro.",
  },
  {
    id: "criar",
    rota: "/criar",
    nome: "Criar página",
    grupo: "Entrada",
    largura: "celular",
    nota: "Funciona de verdade: o endereço é limpo enquanto você digita, e a página é criada mesmo. Acento e espaço viram hífen sozinhos.",
  },
  {
    id: "criar-ocupado",
    rota: "/criar",
    nome: "Endereço indisponível",
    grupo: "Entrada",
    largura: "celular",
    preparar: async (p) => {
      await p.fill("#nome", "Doceria da Ana");
      await p.fill("input[name=slug]", "painel");
      await p.waitForTimeout(900);
    },
    nota: "O aviso aparece enquanto a pessoa digita, sem precisar mandar o formulário. É o momento de maior atrito do cadastro, então vale o único pedaço de código que roda no navegador.",
  },
  {
    id: "entrar",
    rota: "/entrar",
    nome: "Entrar",
    grupo: "Entrada",
    largura: "celular",
    nota: "A tela está pronta, mas o e-mail ainda NÃO é enviado. Falta o Supabase Auth e um provedor de e-mail. Dá para julgar o desenho e o texto, não o funcionamento.",
    aviso: true,
  },
  {
    id: "enviado",
    rota: "/entrar/enviado?para=ana@exemplo.com",
    nome: "Confira seu e-mail",
    grupo: "Entrada",
    largura: "celular",
    nota: "O que a pessoa vê depois de pedir o link. Também não está ligado ainda.",
    aviso: true,
  },
  {
    id: "publica",
    rota: "/demo",
    nome: "Página do negócio",
    grupo: "O produto",
    largura: "celular",
    vitrine: "Doceria",
    nota: "É o produto de verdade. Tudo aqui funciona: o selo de aberto agora se atualiza sozinho, o botão de WhatsApp abre a conversa escrita, o endereço abre o mapa. As fotos são marcações geradas por script, não fotos de negócio real.",
  },
  {
    id: "publica-horarios",
    rota: "/demo",
    nome: "Horários abertos",
    grupo: "O produto",
    largura: "celular",
    recorte: 900,
    preparar: async (p) => {
      await p.click("summary");
      await p.waitForTimeout(400);
    },
    nota: "A tabela da semana abre com um toque, sem carregar JavaScript para isso. O dia de hoje aparece destacado.",
  },
  {
    id: "og",
    imagem: "/demo/opengraph-image",
    nome: "Prévia do link",
    grupo: "O produto",
    largura: "cartao",
    nota: "O que aparece quando o dono cola o link no WhatsApp ou na bio do Instagram. É a primeira impressão de quem nunca viu o negócio.",
  },
  {
    id: "raiz",
    rota: "/studio-raiz",
    nome: "Estúdio de yoga",
    grupo: "O produto",
    largura: "celular",
    vitrine: "Estúdio de yoga",
    nota: "Exemplo no plano pago: botão principal apontando para a agenda e WhatsApp como segundo botão, letra escolhida, e sem o rodapé feito com Banca. A seção do catálogo se chama Aulas e planos.",
  },
  {
    id: "nutri",
    rota: "/marina-nutricao",
    nome: "Nutricionista",
    grupo: "O produto",
    largura: "celular",
    vitrine: "Nutricionista",
    nota: "Profissional autônoma que vende hora, não produto. Consulta, retorno e atendimento online aparecem como itens, com preço.",
  },
  {
    id: "psi",
    rota: "/camila-psicologia",
    nome: "Psicóloga",
    grupo: "O produto",
    largura: "celular",
    vitrine: "Psicóloga",
    nota: "Sem endereço público e sem preço à mostra, que é o caso de muita gente da saúde. As duas seções somem sozinhas, sem deixar buraco no layout.",
  },
  {
    id: "nao-existe",
    rota: "/endereco-que-nao-existe",
    nome: "Endereço livre",
    grupo: "O produto",
    largura: "celular",
    nota: "Quem digita um endereço que não existe não leva erro seco: leva um convite. É aquisição de graça.",
  },
  {
    id: "painel",
    rota: "/painel",
    nome: "Painel",
    grupo: "Painel do dono",
    largura: "celular",
    nota: "Funciona de verdade, mas ainda SEM LOGIN: quem chegar no endereço edita. Por isso nada disso pode ir para a internet antes da etapa 4.",
    aviso: true,
  },
  {
    id: "negocio",
    rota: "/painel/negocio",
    nome: "Informações do negócio",
    grupo: "Painel do dono",
    largura: "celular",
    semFixos: true,
    nota: "Salva de verdade e a página pública muda na hora. O WhatsApp é arrumado sozinho: digite (11) 98888-7777 e ele guarda com o código do país.",
  },
  {
    id: "horarios",
    rota: "/painel/horarios",
    nome: "Horários",
    grupo: "Painel do dono",
    largura: "celular",
    semFixos: true,
    nota: "Três intervalos por dia, e turno que vira a madrugada (19:00 às 02:00) é aceito. Dia em branco aparece marcado como fechado.",
  },
  {
    id: "horarios-barra",
    rota: "/painel/horarios",
    nome: "Barra de salvar",
    grupo: "Painel do dono",
    largura: "celular",
    recorte: 844,
    rolar: 700,
    nota: "O botão Salvar fica preso no rodapé enquanto a pessoa rola. Num formulário longo, no celular, isso evita rolar até o fim para salvar.",
  },
  {
    id: "acoes",
    rota: "/painel/acoes-botoes",
    nome: "Botões da página",
    grupo: "Painel do dono",
    largura: "celular",
    semFixos: true,
    nota: "O botão do rodapé deixou de ser só WhatsApp. Pode virar iFood, agenda, link de parceiro ou uma ligação, e ainda cabe um segundo botão embaixo.",
  },
  {
    id: "aparencia",
    rota: "/painel/aparencia",
    nome: "Letras da página",
    grupo: "Painel do dono",
    largura: "celular",
    semFixos: true,
    nota: "Escolher a letra é do plano pago, então no gratuito as opções aparecem travadas, com a padrão marcada. Só a escolhida é baixada por quem visita.",
  },
  {
    id: "previa",
    rota: "/painel/previa",
    nome: "Prévia do rascunho",
    grupo: "Painel do dono",
    largura: "celular",
    nota: "Como o dono vê a própria página antes de publicar. A rota pública não entrega rascunho nem para quem souber o endereço, por isso esta tela existe.",
  },
];

async function capturar() {
  const navegador = await chromium.launch(
    EXECUTAVEL ? { executablePath: EXECUTAVEL } : {},
  );
  const celular = await navegador.newContext({
    ...devices["iPhone 13"],
    deviceScaleFactor: 2,
  });
  const monitor = await navegador.newContext({
    viewport: { width: 1440, height: 940 },
    deviceScaleFactor: 2,
  });

  const capturadas = [];

  for (const tela of TELAS) {
    const contexto = tela.largura === "desktop" ? monitor : celular;
    const p = await contexto.newPage();

    // Imagem gerada pelo servidor, tipo a prévia do link: busca direto,
    // sem passar pelo navegador.
    if (tela.imagem) {
      await p.close();
      let bruto = null;
      for (let tentativa = 0; tentativa < 4 && !bruto; tentativa++) {
        try {
          const r = await fetch(BASE + tela.imagem);
          if (!r.ok) throw new Error(`status ${r.status}`);
          bruto = Buffer.from(await r.arrayBuffer());
        } catch (erro) {
          if (tentativa === 3) throw erro;
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
      capturadas.push({ ...tela, bruto });
      console.log(`ok ${tela.id}`);
      continue;
    }

    // "load" e não "networkidle": o Next fica buscando as rotas dos links
    // que aparecem na tela, então a rede nunca fica parada de verdade.
    await p.goto(BASE + tela.rota, { waitUntil: "load" });
    await p.waitForTimeout(700);

    // Solta as barras presas, senão o retrato inteiro mostra elas no meio.
    if (tela.semFixos) {
      await p.addStyleTag({
        content:
          ".sticky, [class*='sticky'] { position: static !important; }",
      });
    }

    if (tela.preparar) await tela.preparar(p);

    // Rola até o fim para acordar as imagens que carregam sob demanda.
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(900);

    if (tela.rolar) {
      await p.evaluate((y) => window.scrollTo(0, y), tela.rolar);
      await p.waitForTimeout(400);
    }

    const bruto = await p.screenshot({
      fullPage: !tela.recorte,
      ...(tela.recorte
        ? { clip: { x: 0, y: 0, width: 390, height: tela.recorte } }
        : {}),
    });
    await p.close();
    capturadas.push({ ...tela, bruto });
    console.log(`ok ${tela.id}`);
  }

  await navegador.close();
  return capturadas;
}

const LARGURAS = { celular: 780, desktop: 1440, cartao: 1200 };

async function comprimir(capturadas) {
  const prontas = [];
  for (const t of capturadas) {
    const img = sharp(t.bruto).resize({
      width: LARGURAS[t.largura] ?? 780,
      withoutEnlargement: true,
    });
    const dados = await img.jpeg({ quality: 76, mozjpeg: true }).toBuffer();
    const meta = await sharp(dados).metadata();
    prontas.push({
      id: t.id,
      nome: t.nome,
      grupo: t.grupo,
      rota: t.rota ?? t.imagem,
      largura: t.largura,
      vitrine: t.vitrine ?? null,
      nota: t.nota,
      aviso: Boolean(t.aviso),
      w: meta.width,
      h: meta.height,
      src: `data:image/jpeg;base64,${dados.toString("base64")}`,
    });
    console.log(`  ${t.id} ${Math.round(dados.length / 1024)} KB`);
  }
  return prontas;
}

// ---------------------------------------------------------------------------
// A página de revisão
// ---------------------------------------------------------------------------

function montarPagina(telas) {
  const grupos = [...new Set(telas.map((t) => t.grupo))];
  const dados = JSON.stringify(telas).replace(/</g, "\\u003c");
  const vitrine = telas.filter((t) => t.vitrine);

  const familia = vitrine
    .map(
      (t) => `
      <li class="mini">
        <button class="mini-toque" type="button" data-id="${t.id}">
          <span class="mini-tela"><img src="${t.src}" alt="Página de ${t.nome}" loading="lazy" /></span>
          <span class="mini-rotulo">${t.vitrine}</span>
        </button>
      </li>`,
    )
    .join("");

  const menu = grupos
    .map(
      (g) => `
      <div class="grupo">
        <p class="eyebrow">${g}</p>
        <div class="lista">
          ${telas
            .filter((t) => t.grupo === g)
            .map(
              (t) => `<button class="aba" data-id="${t.id}" type="button">
                <span class="aba-nome">${t.nome}</span>
                <span class="aba-rota">${t.rota}</span>
              </button>`,
            )
            .join("")}
        </div>
      </div>`,
    )
    .join("");

  return `<title>Banca, telas para revisão</title>
<style>
  :root {
    --ground: #faf8f5;
    --surface: #ffffff;
    --line: #e6e0d7;
    --ink: #171412;
    --muted: #6b6259;
    --accent: #b4522f;
    --accent-fraco: #f6ebe5;
    --palco: #17151300;
    --palco-solido: #1a1714;
    --palco-linha: #2e2924;
    --palco-ink: #f3efe9;
    --palco-muted: #a9a097;
    --warn: #8a5a12;
    --warn-fundo: #f8eeda;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #131110;
      --surface: #1c1917;
      --line: #2e2924;
      --ink: #f3efe9;
      --muted: #a49a90;
      --accent: #e08a63;
      --accent-fraco: #2a201b;
      --palco-solido: #0c0a09;
      --palco-linha: #241f1b;
      --warn: #e0ac5c;
      --warn-fundo: #2b2115;
    }
  }

  :root[data-theme="dark"] {
    --ground: #131110;
    --surface: #1c1917;
    --line: #2e2924;
    --ink: #f3efe9;
    --muted: #a49a90;
    --accent: #e08a63;
    --accent-fraco: #2a201b;
    --palco-solido: #0c0a09;
    --palco-linha: #241f1b;
    --warn: #e0ac5c;
    --warn-fundo: #2b2115;
  }

  * { box-sizing: border-box; min-width: 0; }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: var(--sans);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  .eyebrow {
    font-family: var(--mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0;
  }

  .largura { max-width: 1120px; margin: 0 auto; padding-inline: 22px; }

  /* Abertura: a família de páginas, que é o que vende. */
  .abertura { padding: 40px 0 12px; }
  .abertura h1 {
    margin: 10px 0 0;
    font-size: clamp(1.9rem, 1.2rem + 2.6vw, 3rem);
    letter-spacing: -0.035em;
    line-height: 1.04;
    text-wrap: balance;
    max-width: 18ch;
  }
  .abertura .intro {
    margin: 14px 0 0;
    max-width: 56ch;
    color: var(--muted);
    font-size: 1.02rem;
  }

  .familia {
    list-style: none;
    display: flex;
    gap: 14px;
    margin: 34px 0 0;
    padding: 0 0 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .familia::-webkit-scrollbar { display: none; }
  .mini { flex: none; }
  .mini-toque {
    display: flex;
    flex-direction: column;
    gap: 9px;
    align-items: center;
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }
  .mini-tela {
    display: block;
    width: 132px;
    height: 268px;
    overflow: hidden;
    border-radius: 20px;
    background: #fff;
    border: 5px solid var(--palco-solido);
    box-shadow: 0 14px 26px -16px rgba(23, 20, 18, 0.6);
    transition: transform 0.18s ease;
  }
  .mini-toque:hover .mini-tela { transform: translateY(-3px); }
  .mini-tela img { display: block; width: 100%; height: auto; }
  .mini-rotulo { font-size: 0.82rem; color: var(--muted); }

  /* Bancada: o palco escuro faz a tela clara aparecer. */
  .bancada { padding: 46px 0 70px; }

  .cabeca-bancada {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid var(--line);
    padding-top: 26px;
  }
  .cabeca-bancada h2 {
    margin: 0;
    font-size: 1.35rem;
    letter-spacing: -0.02em;
  }

  .corpo { display: flex; flex-direction: column; gap: 22px; margin-top: 24px; }

  @media (min-width: 940px) {
    .corpo { flex-direction: row; align-items: flex-start; gap: 30px; }
    .navegador { width: 218px; flex: none; position: sticky; top: 18px; }
    .palco-col { flex: 1; min-width: 0; }
  }

  .navegador { display: flex; flex-direction: column; gap: 16px; }
  .grupo { display: flex; flex-direction: column; gap: 7px; }
  .lista { display: flex; flex-direction: column; gap: 3px; }

  @media (max-width: 939px) {
    .lista { flex-direction: row; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
    .lista::-webkit-scrollbar { display: none; }
    .aba { flex: none; }
  }

  .aba {
    display: flex;
    flex-direction: column;
    gap: 1px;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .aba:hover { background: var(--surface); }
  .aba[aria-current="true"] { background: var(--accent-fraco); border-color: var(--accent); }
  .aba-nome { font-size: 0.9rem; font-weight: 550; }
  .aba-rota { font-family: var(--mono); font-size: 0.66rem; color: var(--muted); white-space: nowrap; }
  .aba[aria-current="true"] .aba-rota { color: var(--accent); }

  .palco-col { display: flex; flex-direction: column; gap: 18px; }

  .palco {
    background: var(--palco-solido);
    border-radius: 20px;
    padding: 30px 18px;
    display: flex;
    justify-content: center;
  }

  .aparelho {
    width: 100%;
    max-width: 386px;
    border-radius: 36px;
    background: #000;
    padding: 9px;
    box-shadow: 0 30px 60px -28px rgba(0, 0, 0, 0.9);
  }
  .aparelho .janela {
    height: 620px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 28px;
    background: #fff;
    -webkit-overflow-scrolling: touch;
  }
  .palco[data-largura="desktop"] .aparelho,
  .palco[data-largura="cartao"] .aparelho {
    max-width: 100%;
    border-radius: 10px;
    padding: 5px;
  }
  .palco[data-largura="desktop"] .janela,
  .palco[data-largura="cartao"] .janela { height: auto; border-radius: 6px; }
  .janela img { display: block; width: 100%; height: auto; }

  .ficha { display: flex; flex-direction: column; gap: 9px; }
  .ficha h3 { margin: 0; font-size: 1.2rem; letter-spacing: -0.02em; }
  .ficha p { margin: 0; color: var(--muted); max-width: 66ch; }
  .marca-rota { font-family: var(--mono); font-size: 0.76rem; color: var(--accent); margin: 0; }

  .alerta {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    background: var(--warn-fundo);
    color: var(--warn);
    border-radius: 10px;
    padding: 10px 13px;
    font-size: 0.87rem;
    max-width: 66ch;
  }

  .rodape {
    border-top: 1px solid var(--line);
    margin-top: 12px;
    padding: 22px 0 60px;
    color: var(--muted);
    font-size: 0.87rem;
    max-width: 68ch;
  }
  .rodape p { margin: 0 0 8px; }
  .rodape code {
    font-family: var(--mono);
    font-size: 0.86em;
    background: var(--surface);
    border: 1px solid var(--line);
    padding: 1px 5px;
    border-radius: 5px;
  }

  :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
</style>

<div class="largura abertura">
  <p class="eyebrow">Banca, revisão de interface</p>
  <h1>Quatro negócios, a mesma página.</h1>
  <p class="intro">
    Uma doceria, um estúdio de yoga, uma nutricionista e uma psicóloga. Toque
    em qualquer uma para abrir a tela inteira e conferir o acabamento.
  </p>
  <ul class="familia">${familia}</ul>
</div>

<div class="largura bancada">
  <div class="cabeca-bancada">
    <h2>Todas as telas</h2>
    <p class="eyebrow" id="contagem"></p>
  </div>

  <div class="corpo">
    <nav class="navegador" aria-label="Telas">${menu}</nav>

    <div class="palco-col">
      <div class="palco" id="palco" data-largura="celular">
        <div class="aparelho">
          <div class="janela" id="janela"><img id="retrato" alt="" /></div>
        </div>
      </div>

      <div class="ficha">
        <p class="marca-rota" id="rota"></p>
        <h3 id="nome"></h3>
        <p id="nota"></p>
        <div class="alerta" id="alerta" hidden>
          <span id="alerta-texto"></span>
        </div>
      </div>
    </div>
  </div>

  <div class="rodape">
    <p>
      São retratos do build de produção, não o produto rodando: não dá para
      digitar nem tocar nos botões. O que dá para julgar é layout, espaçamento,
      hierarquia, tamanho de toque e texto.
    </p>
    <p>Regerado com <code>npm run revisao</code> a cada mudança.</p>
  </div>
</div>

<script>
  const TELAS = ${dados};
  const porId = Object.fromEntries(TELAS.map((t) => [t.id, t]));

  const retrato = document.getElementById("retrato");
  const janela = document.getElementById("janela");
  const palco = document.getElementById("palco");
  const alerta = document.getElementById("alerta");
  document.getElementById("contagem").textContent = TELAS.length + " telas";

  function mostrar(id, rolar) {
    const t = porId[id];
    if (!t) return;

    retrato.src = t.src;
    retrato.alt = "Tela: " + t.nome;
    retrato.width = t.w;
    retrato.height = t.h;
    janela.scrollTop = 0;
    palco.dataset.largura = t.largura;

    document.getElementById("rota").textContent = t.rota;
    document.getElementById("nome").textContent = t.nome;
    document.getElementById("nota").textContent = t.nota;

    alerta.hidden = !t.aviso;
    document.getElementById("alerta-texto").textContent = t.aviso
      ? "Ainda não está ligado. Dá para avaliar o desenho e o texto, mas o funcionamento depende do login, que ainda não existe."
      : "";

    for (const b of document.querySelectorAll(".aba")) {
      b.setAttribute("aria-current", String(b.dataset.id === id));
    }
    if (location.hash.slice(1) !== id) history.replaceState(null, "", "#" + id);
    if (rolar) palco.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  for (const b of document.querySelectorAll(".aba")) {
    b.addEventListener("click", () => mostrar(b.dataset.id, false));
  }
  for (const b of document.querySelectorAll(".mini-toque")) {
    b.addEventListener("click", () => mostrar(b.dataset.id, true));
  }

  mostrar(porId[location.hash.slice(1)] ? location.hash.slice(1) : TELAS[0].id, false);
</script>
`;
}

// ---------------------------------------------------------------------------

const capturadas = await capturar();
const prontas = await comprimir(capturadas);
const html = montarPagina(prontas);

await mkdir(SAIDA, { recursive: true });
await writeFile(`${SAIDA}/revisao.html`, html, "utf8");

console.log(
  `\n${prontas.length} telas, ${Math.round(Buffer.byteLength(html) / 1024)} KB em ${SAIDA}/revisao.html`,
);
