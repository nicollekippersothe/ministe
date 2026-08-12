/**
 * Monta as peças de portfólio.
 *
 * A tela dentro do aparelho não é desenho: é a página de verdade, aberta num
 * iPhone 15 emulado e fotografada em 3x. Então a peça nunca promete uma
 * interface que o produto não tem, que é o defeito de todo mockup feito à mão.
 *
 * A moldura, o texto e o fundo seguem o guia de marca, não o design system do
 * app. São duas coisas diferentes e o guia é explícito: dentro do produto vale
 * a fonte do aparelho, mas em material de marca (site, posts, cartão de
 * prévia) valem Archivo e IBM Plex Sans. Uma peça de portfólio é material de
 * marca, então ela usa a letra da marca. Os arquivos ficam versionados em
 * scripts/fontes-marca e entram embutidos, sem depender de rede.
 *
 * Como rodar:
 *   npm run build && npm start   (num terminal)
 *   npm run mockup               (no outro)
 */
import { chromium, devices } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { simboloSvg } from "../lib/simbolo.ts";

const BASE = process.env.BASE ?? "http://localhost:3000";
const EXECUTAVEL = process.env.CHROMIUM;
const SAIDA = process.env.SAIDA ?? "/tmp/mockup";
const AQUI = fileURLToPath(new URL(".", import.meta.url));

/*
 * Paleta do guia, com os nomes dele. A proporção de uso também é do guia:
 * Areia 44, Branco 28, Tinta 18, Pedra 5, Barro 3, Conversa 2. Por isso o
 * fundo é Areia, a moldura é Tinta, e Barro aparece uma vez só na peça.
 */
const AREIA = "#f4f0e8";
const BRANCO = "#ffffff";
const TINTA = "#1c1917";
const BARRO = "#7a4a2b";
const PEDRA = "#736c67";

/*
 * Cada aparelho mostra uma parte diferente. Três fotos do topo da página
 * mostrariam três vezes a mesma coisa, e o produto tem mais do que capa.
 */
const TELAS = [
  { slug: "studio-raiz", rotulo: "Estúdio de yoga", local: "Florianópolis" },
  { slug: "demo", rotulo: "Confeitaria", local: "São Paulo" },
  {
    slug: "marina-nutricao",
    rotulo: "Nutricionista",
    local: "Curitiba",
    // Ancorar na seção, e não num número de pixel, é o que impede a foto de
    // sair cortada no meio de um item quando o conteúdo do exemplo mudar.
    ancora: "#catalogo-titulo",
  },
];

/*
 * Altura da barra de status. Ela é desenhada por cima do site, então a foto
 * rolada precisa parar com o respiro da seção encostando no topo: assim o que
 * fica debaixo da barra é espaço em branco, e não meia linha de texto.
 */
const BARRA = 54;

/* iPhone 15: 393 x 852 de tela. O preset do Playwright traz 659 de altura,
 * que é a área útil do Safari, e no mockup ela deixaria uma faixa branca. */
const TELA = { largura: 393, altura: 852 };

async function fonteEmbutida(arquivo) {
  const dados = await readFile(join(AQUI, "fontes-marca", arquivo));
  return `url(data:font/woff2;base64,${dados.toString("base64")}) format('woff2')`;
}

const [ARCHIVO, PLEX] = await Promise.all([
  fonteEmbutida("archivo-700.woff2"),
  fonteEmbutida("ibm-plex-sans.woff2"),
]);

const navegador = await chromium.launch(
  EXECUTAVEL ? { executablePath: EXECUTAVEL } : {},
);

const contexto = await navegador.newContext({
  ...devices["iPhone 15"],
  viewport: { width: TELA.largura, height: TELA.altura },
  deviceScaleFactor: 3,
});

const capturas = [];
for (const tela of TELAS) {
  const p = await contexto.newPage();
  await p.goto(`${BASE}/${tela.slug}`, { waitUntil: "load" });
  // Fonte sem pré-carregamento chega depois do CSS aplicar.
  await p.waitForTimeout(1500);
  if (tela.ancora) {
    await p.evaluate(({ sel }) => {
      const alvo = document.querySelector(sel);
      if (!alvo) return;
      const secao = alvo.closest("section") ?? alvo;
      const respiro = parseFloat(getComputedStyle(secao).paddingTop) || 0;
      scrollTo(0, secao.getBoundingClientRect().top + scrollY - respiro);
    }, { sel: tela.ancora });
    await p.waitForTimeout(500);
  }
  const png = await p.screenshot();
  await p.close();
  capturas.push({ ...tela, dados: png.toString("base64") });
  console.log(`  capturou /${tela.slug}`);
}

/*
 * A tela inicial num monitor. Duas vezes o tamanho, para o texto aguentar
 * recorte e tela retina sem borrar.
 */
const MONITOR = { largura: 1440, altura: 900 };
const contextoMonitor = await navegador.newContext({
  viewport: { width: MONITOR.largura, height: MONITOR.altura },
  deviceScaleFactor: 2,
});
const paginaDesktop = await contextoMonitor.newPage();
await paginaDesktop.goto(`${BASE}/`, { waitUntil: "load" });
await paginaDesktop.waitForTimeout(1800);
const DESKTOP = (await paginaDesktop.screenshot()).toString("base64");

/* A página do cliente no monitor: duas colunas, que é o desenho novo. */
const paginaCliente = await contextoMonitor.newPage();
await paginaCliente.goto(`${BASE}/demo`, { waitUntil: "load" });
await paginaCliente.waitForTimeout(1800);
const CLIENTE = (await paginaCliente.screenshot()).toString("base64");
await contextoMonitor.close();
console.log("  capturou / e /demo no monitor");

/**
 * A barra de status. O sistema desenha ela por cima do site, então sem ela a
 * peça parece um navegador, não um telefone.
 */
const BARRA_STATUS = `
  <div class="status">
    <span class="hora">9:41</span>
    <span class="sinais">
      <svg width="19" height="12" viewBox="0 0 19 12" aria-hidden="true">
        <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7"/>
        <rect x="4.8" y="5" width="3.2" height="7" rx="0.7"/>
        <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7"/>
        <rect x="14.4" y="0" width="3.2" height="12" rx="0.7"/>
      </svg>
      <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden="true">
        <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z"/>
        <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z"/>
        <circle cx="8.5" cy="10.5" r="1.5"/>
      </svg>
      <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true">
        <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-opacity="0.35"/>
        <rect x="2" y="2" width="20" height="9" rx="2"/>
        <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill-opacity="0.4"/>
      </svg>
    </span>
  </div>`;

/**
 * Janela de navegador.
 *
 * Sem menu, sem abas, sem botão de voltar: só o suficiente para o olho
 * entender que aquilo é a internet. Barra de navegador cheia de detalhe rouba
 * atenção do que interessa, que é a página dentro dela.
 */
function janela(dados, endereco) {
  return `
  <div class="janela">
    <div class="cromo">
      <span class="bolinhas" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="endereco">${endereco}</span>
    </div>
    <img src="data:image/png;base64,${dados}" alt="Tela inicial do entrais num monitor">
  </div>`;
}

function aparelho(captura, comRotulo) {
  return `
  <figure class="coluna">
    <div class="aparelho chao">
      <div class="tela">
        <img src="data:image/png;base64,${captura.dados}" alt="Página de ${captura.rotulo} aberta no celular">
        ${BARRA_STATUS}
        <span class="ilha" aria-hidden="true"></span>
        <span class="indicador" aria-hidden="true"></span>
      </div>
    </div>
    ${comRotulo ? `<figcaption class="rotulo">${captura.rotulo} · ${captura.local}</figcaption>` : ""}
  </figure>`;
}

const ESTILO = `
  @font-face {
    font-family: 'Archivo';
    font-weight: 700;
    font-style: normal;
    src: ${ARCHIVO};
  }
  @font-face {
    font-family: 'IBM Plex Sans';
    font-weight: 400 600;
    font-style: normal;
    src: ${PLEX};
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${AREIA};
    color: ${TINTA};
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .peca { display: flex; flex-direction: column; background: ${AREIA}; }

  /* Cabeçalho: a voz da marca, na escala do guia. */
  .cabeca { padding: 76px 72px 0; }

  /* Rótulo 12/1.4/600 caps. É a única aparição de Barro na peça. */
  .sobrancelha {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 12px;
    line-height: 1.4;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${BARRO};
  }
  .sobrancelha svg { display: block; }

  /* Display 48/1.1/700, Archivo, sempre com tracking negativo em corpo grande. */
  .manifesto {
    margin-top: 20px;
    font-family: 'Archivo', sans-serif;
    font-weight: 700;
    font-size: 48px;
    line-height: 1.1;
    letter-spacing: -0.035em;
    max-width: 15ch;
  }
  .manifesto .segunda { color: ${BARRO}; }

  /* Corpo 16/1.6/400. Concreto antes de aspiracional. */
  .concreto {
    margin-top: 16px;
    font-size: 16px;
    line-height: 1.6;
    color: ${PEDRA};
    max-width: 46ch;
  }

  .palco {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 56px 60px 0;
  }
  .coluna { display: flex; flex-direction: column; align-items: center; }

  /*
   * A moldura. Proporção do iPhone 15: tela de 393 x 852 com raio de 55.
   * Borda fina de propósito, porque moldura grossa data a peça.
   */
  .aparelho {
    width: ${TELA.largura}px;
    flex: none;
    border-radius: 61px;
    padding: 6px;
    background: linear-gradient(160deg, #3b3733 0%, ${TINTA} 42%, #0b0a09 100%);
    box-shadow:
      0 2px 4px rgba(28, 25, 23, 0.28),
      0 40px 70px -30px rgba(28, 25, 23, 0.5);
  }

  .tela {
    position: relative;
    width: 100%;
    height: ${TELA.altura}px;
    overflow: hidden;
    border-radius: 55px;
    background: ${BRANCO};
  }
  .tela img { display: block; width: 100%; height: auto; }

  .status {
    position: absolute;
    inset: 0 0 auto;
    height: ${BARRA}px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px 0 36px;
    color: ${TINTA};
    fill: currentColor;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
  }
  .hora { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
  .sinais { display: flex; align-items: center; gap: 7px; }

  .ilha {
    position: absolute;
    top: 11px;
    left: 50%;
    transform: translateX(-50%);
    width: 125px;
    height: 36px;
    border-radius: 999px;
    background: #000;
  }

  .indicador {
    position: absolute;
    bottom: 9px;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 5px;
    border-radius: 999px;
    background: ${TINTA};
    opacity: 0.35;
  }

  /* Janela de navegador. Cantos de 10px, como o guia pede para superfície. */
  .janela {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    background: ${BRANCO};
    border: 1px solid #e0d9cc;
    box-shadow:
      0 1px 2px rgba(28, 25, 23, 0.06),
      0 36px 64px -28px rgba(28, 25, 23, 0.42);
  }
  .janela img { display: block; width: 100%; height: auto; }

  .cromo {
    position: relative;
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 14px;
    background: #efe9df;
    border-bottom: 1px solid #e0d9cc;
  }
  .bolinhas { display: flex; gap: 7px; }
  .bolinhas i {
    width: 11px;
    height: 11px;
    border-radius: 999px;
    background: #d3cabb;
  }
  .endereco {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    letter-spacing: 0.01em;
    color: ${PEDRA};
    background: ${BRANCO};
    border-radius: 999px;
    padding: 4px 16px;
  }

  /* Sombra de chão: o que faz o aparelho pousar em vez de flutuar. */
  .chao {
    position: relative;
  }
  .chao::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -26px;
    transform: translateX(-50%);
    width: 78%;
    height: 34px;
    border-radius: 50%;
    background: rgba(28, 25, 23, 0.14);
    filter: blur(22px);
    z-index: -1;
  }

  /*
   * O site com um celular encostado no canto.
   *
   * A tela inicial já mostra um telefone dentro dela, de propósito, então o
   * nosso precisa sair da janela em vez de pousar em cima do outro. Encostado
   * na quina, com mais da metade do corpo para fora, ele lê como "e no
   * celular" em vez de virar telefone sobre telefone.
   */
  .conjunto { position: relative; padding: 56px 72px 0; }
  .conjunto .telefone {
    position: absolute;
    right: 16px;
    bottom: -132px;
    width: 250px;
    z-index: 2;
  }
  .conjunto .telefone .aparelho {
    width: 100%;
    border-radius: 42px;
    padding: 4px;
  }
  .conjunto .telefone .tela {
    height: 542px;
    border-radius: 38px;
  }
  .conjunto .telefone .status { height: 37px; padding: 0 22px 0 25px; }
  .conjunto .telefone .hora { font-size: 12px; }
  .conjunto .telefone .ilha { top: 8px; width: 85px; height: 25px; }
  .conjunto .telefone .indicador { bottom: 6px; width: 95px; height: 4px; }

  /* Rótulo 12/1.4/600 caps, o mesmo da sobrancelha, em Pedra. */
  .rotulo {
    margin-top: 20px;
    font-size: 12px;
    line-height: 1.4;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${PEDRA};
    white-space: nowrap;
  }

  /*
   * Três aparelhos: o do meio na frente e mais alto. Grade de três iguais é
   * uma das armadilhas de layout que a gente evita, então eles se sobrepõem
   * e ficam em alturas diferentes, como telefone largado em cima da mesa.
   */
  .trio .coluna { margin-inline: -16px; }
  /*
   * A transformação é do aparelho, não da coluna. Transformando a coluna, o
   * rótulo desce junto e os três param em alturas quase iguais, que é o pior
   * dos mundos: parece desalinhamento, não escolha. Assim os telefones se
   * escalonam e as legendas ficam numa linha só.
   */
  .trio .coluna:nth-child(1) .aparelho { transform: translateY(52px) scale(0.95); }
  .trio .coluna:nth-child(1) { z-index: 1; }
  .trio .coluna:nth-child(2) { z-index: 3; }
  .trio .coluna:nth-child(3) .aparelho { transform: translateY(52px) scale(0.95); }
  .trio .coluna:nth-child(3) { z-index: 2; }
  .trio .rotulo { margin-top: 96px; }

  /* Assinatura de etiqueta: o símbolo e a palavra, e mais nada. */
  .conjunto + .assinatura { padding-top: 196px; }

  .assinatura {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    padding: 64px 60px 60px;
  }
  .assinatura svg { display: block; }
  .marca {
    font-family: 'Archivo', sans-serif;
    font-weight: 700;
    font-size: 26px;
    letter-spacing: -0.015em;
    color: ${TINTA};
  }
`;

function pagina(corpo, largura) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${ESTILO}\nbody { width: ${largura}px; }</style></head><body>
<div class="peca">
  <header class="cabeca">
    <p class="sobrancelha">${simboloSvg(BARRO, 14)} Presença profissional</p>
    <h1 class="manifesto">O endereço do seu negócio<br><span class="segunda">na internet.</span></h1>
    <p class="concreto">
      Um lugar seu, com o seu nome, que aparece no Google e apresenta o
      trabalho a quem procura. Pronto em minutos, feito do celular.
    </p>
  </header>
  ${corpo}
  <p class="assinatura">${simboloSvg(TINTA, 26)}<span class="marca">entrais</span></p>
</div>
</body></html>`;
}

await mkdir(SAIDA, { recursive: true });

const pecas = [
  {
    arquivo: "entrais-celular.png",
    largura: 760,
    corpo: `<div class="palco">${aparelho(capturas[1], false)}</div>`,
  },
  {
    arquivo: "entrais-celular-trio.png",
    largura: 1300,
    corpo: `<div class="palco trio">${capturas
      .map((c) => aparelho(c, true))
      .join("")}</div>`,
  },
  {
    arquivo: "entrais-site.png",
    largura: 1400,
    corpo: `<div class="palco"><div class="chao" style="width:100%">${janela(
      DESKTOP,
      "entrais.app",
    )}</div></div>`,
  },
  {
    arquivo: "entrais-app-monitor.png",
    largura: 1400,
    // A página do cliente no monitor. É a peça que prova que o produto
    // entrega presença profissional, e não uma coluna de celular esticada.
    corpo: `<div class="palco"><div class="chao" style="width:100%">${janela(
      CLIENTE,
      `${"entrais.app"}/cafealecrim`,
    )}</div></div>`,
  },
  {
    arquivo: "entrais-site-e-celular.png",
    largura: 1400,
    // O par clássico de portfólio: a tela grande atrás, o celular encostado
    // no canto. Prova numa imagem só que a mesma página serve os dois.
    corpo: `<div class="conjunto">
      <div class="chao">${janela(DESKTOP, "entrais.app")}</div>
      <!-- Outro negócio de propósito: a tela inicial já mostra o café dentro
           dela, e repetir o mesmo cliente nos dois aparelhos parece erro de
           montagem. Assim a peça prova que o mesmo produto serve os dois. -->
      <div class="telefone">${aparelho(capturas[0], false)}</div>
    </div>`,
  },
];

const folha = await navegador.newPage();
for (const peca of pecas) {
  const html = join(SAIDA, peca.arquivo.replace(".png", ".html"));
  await writeFile(html, pagina(peca.corpo, peca.largura), "utf8");
  await folha.setViewportSize({ width: peca.largura, height: 900 });
  await folha.goto(`file://${html}`, { waitUntil: "load" });
  // A fonte embutida ainda assim é aplicada depois do primeiro desenho.
  await folha.evaluate(() => document.fonts.ready);
  await folha.waitForTimeout(400);
  await folha.screenshot({
    path: join(SAIDA, peca.arquivo),
    fullPage: true,
    type: "png",
  });
  console.log(`  montou ${peca.arquivo}`);
}

await navegador.close();
console.log(`\nprontos em ${SAIDA}`);
