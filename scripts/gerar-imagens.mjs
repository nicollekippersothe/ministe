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

const PALETAS = [
  ["#d9b99a", "#b07d55", "#7a4a2a"],
  ["#c3cdb0", "#8fa070", "#566642"],
  ["#e6bfa6", "#c98460", "#8f4a2c"],
  ["#b9c1d4", "#8592ae", "#525f7d"],
  ["#e3cb9c", "#c2a25f", "#8a6b33"],
  ["#cdb6cb", "#a3849f", "#6d5169"],
];

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
};

function svg(nome, largura, altura, icone) {
  const r = semente(nome);
  const paleta = PALETAS[Math.floor(r() * PALETAS.length)];
  const [claro, medio, escuro] = paleta;
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
  <g transform="translate(${largura / 2} ${altura / 2}) scale(${escala}) translate(-50 -50)"
     fill="none" stroke="#fffdf9" stroke-opacity="0.62" stroke-width="3.6"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="${desenho}"/>
  </g>
</svg>`);
}

const IMAGENS = [
  ["capa", 1600, 900, "loja"],
  ["logo", 512, 512, "doce"],
  ["bolo-1", 1000, 1000, "bolo"],
  ["bolo-2", 1000, 1000, "bolo"],
  ["bolo-3", 1000, 1000, "doce"],
  ["torta-1", 1000, 1000, "torta"],
  ["torta-2", 1000, 1000, "torta"],
  ["coxinha-1", 1000, 1000, "salgado"],
  ["brigadeiro-1", 1000, 1000, "doce"],
  ["brigadeiro-2", 1000, 1000, "caixa"],
  ["pote-1", 1000, 1000, "pote"],
  ["galeria-1", 1000, 1000, "vitrine"],
  ["galeria-2", 1000, 1000, "cafe"],
  ["galeria-3", 1000, 1000, "loja"],
  ["galeria-4", 1000, 1000, "folha"],
  ["galeria-5", 1000, 1000, "caixa"],
  ["galeria-6", 1000, 1000, "bolo"],
];

await mkdir(SAIDA, { recursive: true });

for (const [nome, largura, altura, icone] of IMAGENS) {
  await sharp(svg(nome, largura, altura, icone))
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(`${SAIDA}${nome}.jpg`);
  console.log(`ok ${nome}.jpg ${largura}x${altura}`);
}
