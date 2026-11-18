/**
 * Prepara as fotos do carrossel em arco da tela inicial.
 *
 * Saem de public/exemplo, que já tem as fotos CC0 do projeto (a procedência de
 * cada uma está em public/exemplo/fotos.json). Aqui só muda o corte (4:5,
 * centrado) e o ajuste de cor, igual para as doze, para a fileira ter uma
 * direção de arte só em vez de doze exposições diferentes.
 *
 *   node scripts/tratar-vitrine.mjs
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const FOTOS = [
  ["tatu-2", "tatuagem"],
  ["ilustra-3", "ilustracao"],
  ["canto-g1", "canto"],
  ["astro-g2", "astrologia"],
  ["spa-2", "massagem"],
  ["psi-3", "psicologia"],
  ["brigadeiro-1", "confeitaria"],
  ["spa-g3", "ceramica"],
  ["galeria-2", "cafe"],
  ["ilustra-g4", "interiores"],
  ["spa-5", "yoga"],
  ["tatu-4", "caligrafia"],
];

await mkdir("public/vitrine", { recursive: true });
for (const [origem, nome] of FOTOS) {
  await sharp(`public/exemplo/${origem}.jpg`)
    .resize(480, 600, { fit: "cover", position: "attention" })
    .modulate({ saturation: 0.94 })
    .linear(1.04, -4)
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(`public/vitrine/${nome}.jpg`);
}
console.log(FOTOS.length, "fotos prontas");
