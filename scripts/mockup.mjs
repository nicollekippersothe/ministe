/**
 * Monta os mockups de celular para portfólio.
 *
 * A tela dentro do aparelho não é desenho: é a página de verdade, aberta num
 * navegador de verdade num iPhone 15 emulado e fotografada em 3x. Então o
 * mockup nunca promete uma interface que o produto não tem, que é o defeito
 * de todo mockup feito à mão.
 *
 * A moldura, a barra de status e o fundo são HTML e CSS, montados aqui e
 * fotografados junto. Nada de biblioteca de composição de imagem.
 *
 * Como rodar:
 *   npm run build && npm start   (num terminal)
 *   npm run mockup               (no outro)
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const EXECUTAVEL = process.env.CHROMIUM;
const SAIDA = process.env.SAIDA ?? "/tmp/mockup";

/* Cores do guia de marca. */
const AREIA = "#f4f0e8";
const TINTA = "#1c1917";
const BRANCO = "#ffffff";
const PEDRA = "#736c67";

/*
 * Cada aparelho mostra uma parte diferente. Três fotos do topo da página
 * mostrariam três vezes a mesma coisa, e o produto tem mais do que capa.
 */
const TELAS = [
  { slug: "studio-raiz", rotulo: "Estúdio de yoga" },
  { slug: "demo", rotulo: "Doceria" },
  // Ancorar na seção, e não num número de pixel, é o que impede a foto de
  // sair cortada no meio de um item quando o conteúdo do exemplo mudar.
  { slug: "marina-nutricao", rotulo: "Nutricionista", ancora: "#catalogo-titulo" },
];

/*
 * Altura da barra de status. Ela é desenhada por cima do site, então a foto
 * rolada precisa parar com a divisória da seção logo acima dela: assim o que
 * fica debaixo da barra é espaço em branco, e não meia linha de texto.
 */
const BARRA = 54;

/* iPhone 15: 393 x 852 de tela. O preset do Playwright traz 659 de altura,
 * que é a área útil do Safari, e no mockup ela deixaria uma faixa branca. */
const TELA = { largura: 393, altura: 852 };

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
      // Para com o respiro de cima da seção encostando no topo: o texto da
      // seção anterior fica de fora e o título nasce logo abaixo da barra.
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

/**
 * A barra de status. O sistema desenha ela por cima do site, então sem ela o
 * mockup parece um navegador, não um telefone.
 */
function barraDeStatus() {
  return `
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
}

function aparelho(captura) {
  return `
  <div class="aparelho">
    <div class="tela">
      <img src="data:image/png;base64,${captura.dados}" alt="Página de ${captura.rotulo} aberta no celular">
      ${barraDeStatus()}
      <span class="ilha" aria-hidden="true"></span>
      <span class="indicador" aria-hidden="true"></span>
    </div>
  </div>`;
}

const ESTILO = `
  @page { margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${AREIA};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: ${TINTA};
    -webkit-font-smoothing: antialiased;
  }

  .palco {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: ${AREIA};
  }

  /*
   * A moldura. Proporção do iPhone 15: tela de 393 x 852 com raio de 55.
   * A borda preta é fina de propósito, porque moldura grossa data o mockup.
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

  /* Um aparelho: respiro igual dos quatro lados. */
  .solo { padding: 96px 96px 0; }

  /*
   * Três aparelhos: o do meio na frente e mais alto. Grade de três iguais é
   * uma das armadilhas de layout que a gente evita, então eles se sobrepõem
   * e ficam em alturas diferentes, como telefone largado em cima da mesa.
   */
  .trio { padding: 96px 60px 58px; gap: 0; }
  .trio .aparelho { margin-inline: -16px; }
  .trio .aparelho:nth-child(1) { transform: translateY(52px) scale(0.95); z-index: 1; }
  .trio .aparelho:nth-child(2) { z-index: 3; }
  .trio .aparelho:nth-child(3) { transform: translateY(52px) scale(0.95); z-index: 2; }

  .assinatura {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 4px 10px;
    padding: 44px 48px 48px;
    background: ${AREIA};
  }
  .marca { font-size: 17px; font-weight: 700; letter-spacing: -0.015em; }
  .dizer { font-size: 15px; color: ${PEDRA}; }
`;

function pagina(corpo, largura) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${ESTILO}\nbody { width: ${largura}px; }</style></head><body>
${corpo}
<div class="assinatura">
  <span class="marca">entrais</span>
  <span class="dizer">Você não é um link. É um endereço.</span>
</div>
</body></html>`;
}

await mkdir(SAIDA, { recursive: true });

const pecas = [
  {
    arquivo: "entrais-celular.png",
    largura: 585,
    corpo: `<div class="palco solo">${aparelho(capturas[1])}</div>`,
  },
  {
    arquivo: "entrais-celular-trio.png",
    largura: 1300,
    corpo: `<div class="palco trio">${capturas.map(aparelho).join("")}</div>`,
  },
];

const folha = await navegador.newPage();
for (const peca of pecas) {
  const html = join(SAIDA, peca.arquivo.replace(".png", ".html"));
  await writeFile(html, pagina(peca.corpo, peca.largura), "utf8");
  await folha.setViewportSize({ width: peca.largura, height: 900 });
  await folha.goto(`file://${html}`, { waitUntil: "load" });
  await folha.waitForTimeout(300);
  // 2x: um PNG que aguenta tela retina e recorte sem borrar.
  await folha.screenshot({
    path: join(SAIDA, peca.arquivo),
    fullPage: true,
    scale: "css",
    type: "png",
  });
  console.log(`  montou ${peca.arquivo}`);
}

await navegador.close();
console.log(`\nprontos em ${SAIDA}`);
