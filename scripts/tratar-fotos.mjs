/**
 * Direção de arte única nas fotos de exemplo.
 *
 * A queixa era que cada foto tinha uma temperatura, uma luz e um contraste
 * diferentes, então a fileira de negócios lia como banco de imagem, e não como
 * uma marca. Aqui todas passam pelo mesmo tratamento: um pouco menos de
 * saturação, um contraste suave e um toque quente, para casar com a base areia.
 *
 * Roda sobre os arquivos já baixados, no lugar. É reversível pelo git (as fotos
 * são versionadas), e o logo fica de fora, porque é monograma, e não foto.
 *
 *   node scripts/tratar-fotos.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const DIR = "public/exemplo/";

const fotos = (await readdir(DIR)).filter(
  (f) => f.endsWith(".jpg") && !f.includes("-logo"),
);

let feitas = 0;
for (const nome of fotos) {
  const entrada = await readFile(DIR + nome);
  let pipe = sharp(entrada)
    // Menos saturação e um respiro de brilho: tira o estouro do banco de imagem.
    .modulate({ saturation: 0.88, brightness: 1.02 })
    // Contraste suave, para dar corpo sem virar filtro.
    .linear(1.06, -8);

  // Um toque quente: mais vermelho, menos azul, para casar com o areia. Se a
  // versão do sharp recusar a matriz, segue sem o calor, que é o item menos
  // importante do tratamento.
  try {
    pipe = pipe.recomb([
      [1.03, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, 0.0, 0.95],
    ]);
  } catch {
    // sem o calor
  }

  const saida = await pipe
    .sharpen({ sigma: 0.5 })
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  await writeFile(DIR + nome, saida);
  feitas++;
}

console.log(`Tratadas ${feitas} fotos em ${DIR}`);
