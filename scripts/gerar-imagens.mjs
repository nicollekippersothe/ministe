/**
 * Gera as imagens de marcacao da pagina de exemplo.
 *
 * Nao sao fotos de verdade, sao placeholders desenhados de proposito, no mesmo
 * recorte que o produto vai usar (1:1 no catalogo e na galeria, 16:9 na capa).
 * Servem para julgar o acabamento do layout sem inventar foto de negocio real.
 *
 * Rodar com: node scripts/gerar-imagens.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SAIDA = new URL("../public/exemplo/", import.meta.url).pathname;

/** Aleatorio deterministico, para o mesmo nome gerar sempre a mesma imagem. */
function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

/*
 * Paleta por negocio, e nao sorteada pelo nome.
 *
 * Sorteada, a nutricionista saia roxa e o estudio de yoga tambem, o que le
 * como erro antes de ler como marcacao. Cada negocio agora tem a familia de
 * cor que combina com o que ele vende, e as fotos de um mesmo negocio ficam
 * parentes entre si, que e o que uma sessao de foto de verdade produz.
 */
const PALETAS = {
  doce: ["#e3c6a8", "#c08d62", "#7a4a2a"],
  verde: ["#c9d4b4", "#93a473", "#566642"],
  barro: ["#e6bfa6", "#c98460", "#8f4a2c"],
  sereno: ["#c2c9d6", "#8f9bb0", "#586479"],
  trigo: ["#e6d2a6", "#c5a666", "#8a6b33"],
};

const ICONES = {
  bolo: "M20 62h60v14a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4zM26 62V44a6 6 0 0 1 6-6h36a6 6 0 0 1 6 6v18M50 38V26M50 20v2",
  torta: "M16 58h68a34 34 0 0 0-68 0zM12 58h76M24 70h52",
  salgado: "M50 18c14 0 24 12 24 30S64 82 50 82 26 70 26 48 36 18 50 18zM50 30v40",
  doce: "M50 22a20 20 0 1 1 0 40 20 20 0 0 1 0-40zM30 72h40M34 82h32",
  pote: "M32 30h36l-4 50H36zM28 22h44v8H28z",
  loja: "M18 40h64v40H18zM14 26h72l-4 14H18zM40 80V58h20v22",
  cafe: "M24 34h44v22a22 22 0 0 1-44 0zM68 40h8a8 8 0 0 1 0 16h-8M18 84h56",
  vitrine: "M22 34h56v46H22zM22 48h56M40 80V60h20v20",
  folha: "M28 74C28 46 48 26 76 26c0 28-20 48-48 48zM28 74l24-24",
  caixa: "M20 36l30-14 30 14v34L50 84 20 70zM20 36l30 14 30-14M50 50v34",
  yoga: "M50 20a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM50 36v22M28 44l22 8 22-8M50 58 30 78M50 58l20 20",
  prato: "M50 24a26 26 0 1 1 0 52 26 26 0 0 1 0-52zM50 36a14 14 0 1 1 0 28 14 14 0 0 1 0-28M16 84h68",
  poltrona: "M28 46v-8a8 8 0 0 1 8-8h28a8 8 0 0 1 8 8v8M22 46a6 6 0 0 1 12 0v14h32V46a6 6 0 0 1 12 0v20H22zM30 76v8M70 76v8",
  planta: "M50 82V44M50 44c0-12 8-22 20-22 0 12-8 22-20 22zM50 52c0-10-7-18-17-18 0 10 7 18 17 18zM36 82h28",
  peso: "M22 40v20M32 34v32M68 34v32M78 40v20M32 50h36",
  agulha: "M30 70 70 30M62 22l16 16M26 74l-6 6M40 60l8 8M52 48l8 8",
};

function svg(nome, largura, altura, icone, familia) {
  const r = semente(nome);
  const [claro, medio, escuro] = PALETAS[familia] ?? PALETAS.barro;
  // A capa e 16:9 e ocupa a tela inteira; o icone no meio dela e o que
  // entrega que a imagem e marcacao. Sem ele, o campo de cor desfocado passa
  // por foto de pouca profundidade, que e o recorte que a capa vai receber.
  const capa = largura / altura > 1.5;
  const borroes = Array.from({ length: 4 }, () => {
    const cx = Math.round(r() * largura);
    const cy = Math.round(r() * altura);
    const rr = Math.round((0.22 + r() * 0.3) * Math.min(largura, altura));
    const cor = r() > 0.5 ? medio : escuro;
    return `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${cor}" opacity="0.55"/>`;
  }).join("");

  const escala = Math.min(largura, altura) * 0.0042;
  const desenho = ICONES[icone] ?? ICONES.vitrine;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="1" stop-color="${medio}"/>
    </linearGradient>
    <filter id="b" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${Math.round(Math.min(largura, altura) * 0.11)}"/>
    </filter>
  </defs>
  <rect width="${largura}" height="${altura}" fill="url(#f)"/>
  <g filter="url(#b)">${borroes}</g>
  ${capa ? "" : `<g transform="translate(${largura / 2} ${altura / 2}) scale(${escala}) translate(-50 -50)"
     fill="none" stroke="#fffdf9" stroke-opacity="0.62" stroke-width="3.6"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="${desenho}"/>
  </g>`}
</svg>`);
}

const IMAGENS = [
  // Estúdio de yoga e pilates
  ["raiz-capa", 1600, 900, "yoga", "verde"],
  ["raiz-logo", 512, 512, "planta", "verde"],
  ["raiz-1", 1000, 1000, "yoga", "verde"],
  ["raiz-2", 1000, 1000, "peso", "verde"],
  ["raiz-3", 1000, 1000, "folha", "verde"],
  ["raiz-g1", 1000, 1000, "planta", "verde"],
  ["raiz-g2", 1000, 1000, "yoga", "verde"],
  ["raiz-g3", 1000, 1000, "folha", "verde"],

  // Nutricionista
  ["nutri-capa", 1600, 900, "prato", "trigo"],
  ["nutri-logo", 512, 512, "folha", "trigo"],
  ["nutri-1", 1000, 1000, "prato", "trigo"],
  ["nutri-2", 1000, 1000, "planta", "trigo"],
  ["nutri-3", 1000, 1000, "caixa", "trigo"],
  ["nutri-g1", 1000, 1000, "prato", "trigo"],
  ["nutri-g2", 1000, 1000, "folha", "trigo"],
  ["nutri-g3", 1000, 1000, "planta", "trigo"],

  // Psicóloga
  ["psi-capa", 1600, 900, "poltrona", "sereno"],
  ["psi-logo", 512, 512, "planta", "sereno"],
  ["psi-1", 1000, 1000, "poltrona", "sereno"],
  ["psi-2", 1000, 1000, "folha", "sereno"],
  ["psi-3", 1000, 1000, "planta", "sereno"],
  ["psi-g1", 1000, 1000, "poltrona", "sereno"],
  ["psi-g2", 1000, 1000, "planta", "sereno"],

  ["capa", 1600, 900, "loja", "doce"],
  ["logo", 512, 512, "doce", "doce"],
  ["bolo-1", 1000, 1000, "bolo", "doce"],
  ["bolo-2", 1000, 1000, "bolo", "doce"],
  ["bolo-3", 1000, 1000, "doce", "doce"],
  ["torta-1", 1000, 1000, "torta", "doce"],
  ["torta-2", 1000, 1000, "torta", "doce"],
  ["coxinha-1", 1000, 1000, "salgado", "doce"],
  ["brigadeiro-1", 1000, 1000, "doce", "doce"],
  ["brigadeiro-2", 1000, 1000, "caixa", "doce"],
  ["pote-1", 1000, 1000, "pote", "doce"],
  ["galeria-1", 1000, 1000, "vitrine", "doce"],
  ["galeria-2", 1000, 1000, "cafe", "doce"],
  ["galeria-3", 1000, 1000, "loja", "doce"],
  ["galeria-4", 1000, 1000, "folha", "doce"],
  ["galeria-5", 1000, 1000, "caixa", "doce"],
  ["galeria-6", 1000, 1000, "bolo", "doce"],
];

await mkdir(SAIDA, { recursive: true });

for (const [nome, largura, altura, icone, familia] of IMAGENS) {
  await sharp(svg(nome, largura, altura, icone, familia))
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(`${SAIDA}${nome}.jpg`);
  console.log(`ok ${nome}.jpg ${largura}x${altura}`);
}
