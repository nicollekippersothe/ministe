/**
 * Desenha os logotipos dos negócios de exemplo.
 *
 * Foto não serve de logotipo. Um logotipo precisa funcionar com 88 pixels de
 * lado, dentro de um círculo, em cima de uma capa qualquer, e foto recortada
 * nesse tamanho vira borrão colorido.
 *
 * Então cada exemplo ganha um monograma: as iniciais em Archivo 700 sobre uma
 * cor cheia. É o que uma marca pequena de verdade costuma ter antes de pagar
 * um designer, e sobrevive ao tamanho pequeno.
 *
 *   node scripts/gerar-logos.mjs
 *
 * A Archivo vem do repositório do Google Fonts na hora, e fica num cache fora
 * do projeto. É fonte de script, não vai para o navegador, e 650 KB dentro do
 * repositório por causa de quatro imagens não se paga.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import sharp from "sharp";

const SAIDA = "public/exemplo/";
const FONTE = "/tmp/fontes-entrais/Archivo.ttf";
const FONTE_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf";

const LADO = 512;

/**
 * Um por negócio de exemplo com nome de casa. A cor sai da paleta do próprio
 * negócio, não da paleta da entrais: o logotipo é do cliente.
 */
const LOGOS = [
  { arquivo: "logo", iniciais: "AC", fundo: "#7a4a2b" }, // Alecrim Confeitaria
];

/*
 * Os outros seis exemplos ficaram de fora de propósito, e hoje isso vale para
 * quase todos: quem vende o próprio nome põe o próprio rosto ali, e monograma
 * no lugar do retrato soa a papelada. Os avatares de Helena Vasques, Camila
 * Reis, Nara Bittencourt, Téo Sarmento, Lia Prado e Bia Marconi vêm de
 * scripts/baixar-fotos.mjs.
 */

if (!existsSync(FONTE)) {
  await mkdir("/tmp/fontes-entrais", { recursive: true });
  const r = await fetch(FONTE_URL);
  if (!r.ok) throw new Error(`Archivo: ${r.status}`);
  await writeFile(FONTE, Buffer.from(await r.arrayBuffer()));
  console.log("Archivo baixada");
}

await mkdir(SAIDA, { recursive: true });

for (const { arquivo, iniciais, fundo } of LOGOS) {
  const letras = await sharp({
    text: {
      // O espaçamento negativo aproxima as duas letras. Solto, monograma
      // parece etiqueta de arquivo; junto, parece marca.
      text: `<span weight="700" letter_spacing="-3000" foreground="#ffffff">${iniciais}</span>`,
      font: "Archivo",
      fontfile: FONTE,
      rgba: true,
      width: Math.round(LADO * 0.52),
      height: Math.round(LADO * 0.3),
      align: "center",
    },
  })
    .png()
    .toBuffer();

  await sharp({
    create: { width: LADO, height: LADO, channels: 4, background: fundo },
  })
    .composite([
      // Um clarão de canto muito de leve, para a cor não ficar chapada como
      // avatar de sistema.
      {
        input: Buffer.from(
          `<svg width="${LADO}" height="${LADO}">
             <defs>
               <radialGradient id="luz" cx="0.3" cy="0.24" r="0.85">
                 <stop offset="0" stop-color="#fff" stop-opacity="0.16"/>
                 <stop offset="1" stop-color="#fff" stop-opacity="0"/>
               </radialGradient>
             </defs>
             <rect width="${LADO}" height="${LADO}" fill="url(#luz)"/>
           </svg>`,
        ),
        top: 0,
        left: 0,
      },
      { input: letras, gravity: "centre" },
    ])
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(`${SAIDA}${arquivo}.jpg`);

  console.log(`ok ${arquivo}.jpg  ${iniciais}`);
}
