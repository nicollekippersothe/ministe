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
    id: "aparencia",
    rota: "/painel/aparencia",
    nome: "Letras da página",
    grupo: "Painel do dono",
    largura: "celular",
    semFixos: true,
    nota: "Cada opção aparece escrita com a própria letra, usando o nome do negócio, não texto de amostra. Só a escolhida é baixada por quem visita.",
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
    --ground: #e8ebf1;
    --surface: #ffffff;
    --sunken: #dde1ea;
    --line: #cfd5e1;
    --ink: #12151b;
    --muted: #565d6d;
    --accent: #1b4fd8;
    --accent-suave: #e6ecfd;
    --warn: #7d5200;
    --warn-fundo: #fbf1dd;
    --raio: 14px;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #0d1016;
      --surface: #161a22;
      --sunken: #10141b;
      --line: #262c38;
      --ink: #e7eaf1;
      --muted: #949cac;
      --accent: #8fa8ff;
      --accent-suave: #1c2438;
      --warn: #e3ad4d;
      --warn-fundo: #2a2115;
    }
  }

  :root[data-theme="dark"] {
    --ground: #0d1016;
    --surface: #161a22;
    --sunken: #10141b;
    --line: #262c38;
    --ink: #e7eaf1;
    --muted: #949cac;
    --accent: #8fa8ff;
    --accent-suave: #1c2438;
    --warn: #e3ad4d;
    --warn-fundo: #2a2115;
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

  .bancada {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 20px 64px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  header .eyebrow { margin: 0 0 6px; }

  h1 {
    margin: 0;
    font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2.1rem);
    letter-spacing: -0.03em;
    line-height: 1.1;
    text-wrap: balance;
  }

  .intro {
    margin: 10px 0 0;
    max-width: 62ch;
    color: var(--muted);
  }

  .eyebrow {
    font-family: var(--mono);
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0;
  }

  .corpo { display: flex; flex-direction: column; gap: 24px; }

  @media (min-width: 900px) {
    .corpo { flex-direction: row; align-items: flex-start; gap: 32px; }
    .navegador { width: 232px; flex: none; position: sticky; top: 20px; }
    .palco { flex: 1; min-width: 0; }
  }

  .navegador { display: flex; flex-direction: column; gap: 18px; }
  .grupo { display: flex; flex-direction: column; gap: 8px; }
  .lista { display: flex; flex-direction: column; gap: 4px; }

  @media (max-width: 899px) {
    .lista { flex-direction: row; overflow-x: auto; padding-bottom: 4px; }
    .aba { flex: none; }
  }

  .aba {
    display: flex;
    flex-direction: column;
    gap: 1px;
    text-align: left;
    padding: 8px 11px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .aba:hover { background: var(--surface); }
  .aba[aria-current="true"] {
    background: var(--accent-suave);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .aba-nome { font-size: 0.92rem; font-weight: 550; }
  .aba-rota {
    font-family: var(--mono);
    font-size: 0.68rem;
    color: var(--muted);
    white-space: nowrap;
  }
  .aba[aria-current="true"] .aba-rota { color: var(--accent); }

  .palco { display: flex; flex-direction: column; gap: 18px; }

  .quadro {
    background: var(--sunken);
    border: 1px solid var(--line);
    border-radius: var(--raio);
    padding: 22px 16px;
    display: flex;
    justify-content: center;
  }

  /* O aparelho. A moldura é discreta de propósito: quem tem que aparecer
     é a tela dentro dela. */
  .aparelho {
    width: 100%;
    max-width: 390px;
    border-radius: 34px;
    background: #0b0d12;
    padding: 9px;
    box-shadow: 0 1px 2px rgba(10, 12, 18, 0.2), 0 24px 50px -22px rgba(10, 12, 18, 0.55);
  }
  .aparelho .janela {
    height: 640px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 26px;
    background: #fff;
    -webkit-overflow-scrolling: touch;
  }
  .quadro[data-largura="desktop"] .aparelho,
  .quadro[data-largura="cartao"] .aparelho {
    max-width: 100%;
    border-radius: 12px;
    padding: 6px;
  }
  .quadro[data-largura="desktop"] .janela,
  .quadro[data-largura="cartao"] .janela {
    height: auto;
    border-radius: 8px;
  }

  .janela img { display: block; width: 100%; height: auto; }

  .ficha { display: flex; flex-direction: column; gap: 10px; }
  .ficha h2 {
    margin: 0;
    font-size: 1.15rem;
    letter-spacing: -0.02em;
  }
  .ficha p { margin: 0; color: var(--muted); max-width: 68ch; }

  .marca-rota {
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--accent);
  }

  .alerta {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    background: var(--warn-fundo);
    color: var(--warn);
    border-radius: 10px;
    padding: 10px 13px;
    font-size: 0.88rem;
    max-width: 68ch;
  }
  .alerta strong { font-weight: 650; }

  .rodape {
    border-top: 1px solid var(--line);
    padding-top: 18px;
    color: var(--muted);
    font-size: 0.88rem;
    max-width: 70ch;
  }
  .rodape p { margin: 0 0 8px; }
  .rodape code {
    font-family: var(--mono);
    font-size: 0.85em;
    background: var(--surface);
    padding: 1px 5px;
    border-radius: 5px;
  }

  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
</style>

<div class="bancada">
  <header>
    <p class="eyebrow">Banca, revisão de interface</p>
    <h1>As telas do produto, para você apontar o que melhorar.</h1>
    <p class="intro">
      Cada tela abaixo é um retrato fiel do que está construído, capturado num
      iPhone 13. Role dentro do aparelho para ver a tela inteira. A nota ao
      lado diz o que já funciona e o que ainda não está ligado, para você saber
      o que é justo criticar.
    </p>
  </header>

  <div class="corpo">
    <nav class="navegador" aria-label="Telas">${menu}</nav>

    <div class="palco">
      <div class="quadro" id="quadro" data-largura="celular">
        <div class="aparelho">
          <div class="janela" id="janela"><img id="retrato" alt="" /></div>
        </div>
      </div>

      <div class="ficha">
        <p class="marca-rota" id="rota"></p>
        <h2 id="nome"></h2>
        <p id="nota"></p>
        <div class="alerta" id="alerta" hidden>
          <strong>Ainda não está ligado.</strong>
          <span id="alerta-texto"></span>
        </div>
      </div>
    </div>
  </div>

  <div class="rodape">
    <p>
      Isto é um retrato, não o produto rodando: não dá para digitar nem tocar
      nos botões. O que dá para julgar é layout, espaçamento, hierarquia,
      tamanho de toque e texto, que é onde estão as melhorias que eu preciso
      de você.
    </p>
    <p>
      Gerado a partir do build de produção com <code>npm run revisao</code>.
      Para regerar depois de qualquer mudança, é o mesmo comando.
    </p>
  </div>
</div>

<script>
  const TELAS = ${dados};
  const porId = Object.fromEntries(TELAS.map((t) => [t.id, t]));

  const retrato = document.getElementById("retrato");
  const janela = document.getElementById("janela");
  const quadro = document.getElementById("quadro");
  const alerta = document.getElementById("alerta");

  function mostrar(id) {
    const t = porId[id];
    if (!t) return;

    retrato.src = t.src;
    retrato.alt = "Tela: " + t.nome;
    retrato.width = t.w;
    retrato.height = t.h;
    janela.scrollTop = 0;
    quadro.dataset.largura = t.largura;

    document.getElementById("rota").textContent = t.rota;
    document.getElementById("nome").textContent = t.nome;
    document.getElementById("nota").textContent = t.nota;

    alerta.hidden = !t.aviso;
    document.getElementById("alerta-texto").textContent = t.aviso
      ? "Dá para avaliar o desenho e o texto desta tela, mas o funcionamento depende do login, que ainda não existe."
      : "";

    for (const b of document.querySelectorAll(".aba")) {
      b.setAttribute("aria-current", String(b.dataset.id === id));
    }
    if (location.hash.slice(1) !== id) history.replaceState(null, "", "#" + id);
  }

  for (const b of document.querySelectorAll(".aba")) {
    b.addEventListener("click", () => mostrar(b.dataset.id));
  }

  mostrar(porId[location.hash.slice(1)] ? location.hash.slice(1) : TELAS[0].id);
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
