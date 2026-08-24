/**
 * Baixa as fotos dos negócios de exemplo.
 *
 * As manchas coloridas que estavam aqui antes diziam "isto é um exemplo" alto
 * demais. Quem chega na tela inicial precisa ver como fica uma página com
 * foto de verdade, senão o produto parece um esboço.
 *
 * As fotos vêm do Openverse filtradas em CC0, que é domínio público: uso
 * comercial liberado, sem exigência de crédito. Mesmo assim a procedência de
 * cada arquivo fica registrada em public/exemplo/fotos.json, para dar para
 * trocar uma foto sem ter que adivinhar de onde ela veio.
 *
 * Só StockSnap. As outras fontes CC0 misturam ilustração, imagem com marca
 * d'água e séries quase idênticas, e escolher no meio disso pela posição na
 * lista rende uma caixa de presente igual em nove lugares diferentes.
 *
 *   node scripts/baixar-fotos.mjs --folha   monta a folha de contato
 *   node scripts/baixar-fotos.mjs           baixa as escolhidas
 *
 * A posição escrita em cada arquivo abaixo saiu da folha de contato, olhando.
 * Para trocar uma foto: rode --folha, veja o número, mude aqui.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import sharp from "sharp";

const SAIDA = "public/exemplo/";
const CACHE = "/tmp/fotos-entrais/";
const API = "https://api.openverse.org/v1/images/";

/**
 * O CDN do StockSnap entrega no máximo 960 de largura, então os tamanhos aqui
 * são o que dá para tirar de uma foto dessas sem ampliar até borrar. Continua
 * folgado para o tamanho em que as imagens aparecem na tela: a capa ocupa no
 * máximo 1024 no monitor, e a foto do catálogo aparece com menos de 300.
 */
const CAPA = [1200, 675];
const QUADRADA = [800, 800];
const AVATAR = [400, 400];

const BUSCAS = [
  // Alecrim Confeitaria, o único exemplo de comida.
  {
    consulta: "cafe",
    arquivos: [
      ["capa", CAPA, 0],
      ["galeria-3", QUADRADA, 15],
    ],
  },
  {
    consulta: "cake",
    arquivos: [["galeria-6", QUADRADA, 13]],
  },
  {
    consulta: "cheesecake",
    arquivos: [
      ["bolo-2", QUADRADA, 6],
      ["bolo-1", QUADRADA, 5],
    ],
  },
  {
    consulta: "chocolate",
    arquivos: [
      ["bolo-3", QUADRADA, 8],
      ["brigadeiro-1", QUADRADA, 6],
      ["galeria-7", QUADRADA, 2],
    ],
  },
  {
    consulta: "pie",
    arquivos: [
      ["torta-1", QUADRADA, 1],
      ["torta-2", QUADRADA, 7],
    ],
  },
  {
    consulta: "bread",
    arquivos: [["pao-1", QUADRADA, 3]],
  },
  {
    consulta: "cookies",
    arquivos: [
      ["pote-1", QUADRADA, 1],
      ["galeria-5", QUADRADA, 11],
    ],
  },
  {
    consulta: "bakery",
    arquivos: [["galeria-1", QUADRADA, 3]],
  },
  {
    consulta: "coffee",
    arquivos: [["galeria-2", QUADRADA, 1]],
  },

  // Camila Reis, psicóloga. A sala de atendimento e as plantas.
  {
    consulta: "living room",
    arquivos: [
      ["psi-capa", CAPA, 5],
      ["psi-1", QUADRADA, 9],
      ["psi-2", QUADRADA, 8],
      ["psi-g1", QUADRADA, 4],
    ],
  },
  {
    consulta: "plant",
    arquivos: [
      ["psi-g2", QUADRADA, 3],
      ["galeria-4", QUADRADA, 1],
    ],
  },
  {
    consulta: "cozy",
    arquivos: [["psi-3", QUADRADA, 11]],
  },

  /*
   * Helena Vasques, massoterapeuta. É a página que abre em /demo, então é a
   * que mais gente vê.
   *
   * As consultas "massage", "spa" e "wellness" saíram daqui inteiras. Nas três
   * o que o StockSnap tem em CC0 é a mesma série de estúdio: a mesma modelo
   * deitada na maca, luz fria, rosto em close e sorriso de banco de imagem. É
   * foto que envelhece rápido e diz "exemplo" antes de dizer "massagem".
   *
   * No lugar delas vieram termos concretos, do material e do ambiente: linho,
   * vela, lavanda seca, cerâmica, madeira, chá. Rende luz natural, quadro
   * limpo e uma paleta que convive com o areia (#f4f0e8) e o barro (#7a4a2b)
   * do produto, em vez de brigar com eles.
   */
  {
    consulta: "curtain",
    arquivos: [["spa-capa", CAPA, 7]],
  },
  {
    consulta: "linen",
    arquivos: [["spa-1", QUADRADA, 9]],
  },
  {
    consulta: "candle",
    arquivos: [
      ["spa-2", QUADRADA, 19],
      ["spa-4", QUADRADA, 4],
      // Nara Bittencourt também tira daqui, ver mais abaixo.
      ["astro-3", QUADRADA, 13],
    ],
  },
  {
    consulta: "aromatherapy",
    arquivos: [["spa-3", QUADRADA, 8]],
  },
  {
    consulta: "smooth stones",
    arquivos: [["spa-5", QUADRADA, 4]],
  },
  {
    consulta: "towel",
    arquivos: [["spa-g1", QUADRADA, 0]],
  },
  {
    consulta: "lavender",
    arquivos: [["spa-g2", QUADRADA, 1]],
  },
  {
    consulta: "ceramic",
    arquivos: [["spa-g3", QUADRADA, 11]],
  },
  {
    consulta: "hot tea",
    arquivos: [["spa-g4", QUADRADA, 1]],
  },

  // Nara Bittencourt, astróloga. Céu, lua e a mesa da leitura.
  {
    consulta: "night sky",
    arquivos: [
      ["astro-capa", CAPA, 1],
      ["astro-g1", QUADRADA, 8],
    ],
  },
  {
    consulta: "stars sky",
    arquivos: [
      ["astro-1", QUADRADA, 13],
      ["astro-4", QUADRADA, 5],
    ],
  },
  {
    consulta: "moon",
    arquivos: [
      ["astro-2", QUADRADA, 5],
      ["astro-g3", QUADRADA, 9],
    ],
  },
  {
    consulta: "crystals",
    arquivos: [["astro-g2", QUADRADA, 14]],
  },

  /*
   * Téo Sarmento, tatuador. A categoria abre a página pela galeria, então ele
   * tem mais foto de galeria que de catálogo, ao contrário da maioria.
   *
   * O avatar sai daqui, e não da busca de retrato: a foto de quem está
   * tatuando diz o ramo antes de qualquer texto.
   */
  {
    consulta: "tattoo",
    arquivos: [
      ["tatu-capa", CAPA, 11],
      ["tatu-1", QUADRADA, 0],
      ["tatu-3", QUADRADA, 3],
      ["tatu-4", QUADRADA, 1],
      ["tatu-g1", QUADRADA, 8],
      ["tatu-g2", QUADRADA, 5],
      ["tatu-g3", QUADRADA, 9],
      ["tatu-g4", QUADRADA, 2],
      ["tatu-g6", QUADRADA, 4],
    ],
  },
  {
    consulta: "arm tattoo",
    arquivos: [
      ["tatu-2", QUADRADA, 8],
      ["tatu-g5", QUADRADA, 3],
      ["tatu-logo", AVATAR, 1],
    ],
  },

  /*
   * Lia Prado, ilustradora. Também abre pela galeria. O avatar sai da busca de
   * ateliê pelo mesmo motivo do tatuador: a mesa de trabalho aparece junto.
   */
  {
    consulta: "illustration",
    arquivos: [
      ["ilustra-capa", CAPA, 0],
      ["ilustra-g4", QUADRADA, 3],
    ],
  },
  {
    consulta: "drawing",
    arquivos: [
      ["ilustra-1", QUADRADA, 0],
      ["ilustra-2", QUADRADA, 2],
    ],
  },
  {
    consulta: "watercolor",
    arquivos: [
      ["ilustra-3", QUADRADA, 9],
      ["ilustra-g1", QUADRADA, 0],
      ["ilustra-g3", QUADRADA, 8],
    ],
  },
  {
    consulta: "art studio",
    arquivos: [
      ["ilustra-4", QUADRADA, 7],
      ["ilustra-g2", QUADRADA, 3],
      ["ilustra-logo", AVATAR, 0],
    ],
  },

  // Bia Marconi, professora de canto.
  {
    consulta: "microphone",
    arquivos: [
      ["canto-capa", CAPA, 14],
      ["canto-g1", QUADRADA, 3],
    ],
  },
  {
    consulta: "recording studio",
    arquivos: [["canto-1", QUADRADA, 1]],
  },
  {
    consulta: "singer stage",
    arquivos: [["canto-3", QUADRADA, 12]],
  },
  {
    consulta: "singing",
    arquivos: [
      ["canto-4", QUADRADA, 18],
      ["canto-g3", QUADRADA, 10],
    ],
  },
  {
    consulta: "piano",
    arquivos: [["canto-2", QUADRADA, 0]],
  },
  {
    consulta: "music",
    arquivos: [["canto-g2", QUADRADA, 8]],
  },

  /*
   * Retratos para os avatares.
   *
   * Quem vende o próprio nome coloca o próprio rosto no lugar do logotipo, e
   * monograma ali soa a papelada. Só a confeitaria tem nome de casa, e é a
   * única que continua com monograma, desenhado em scripts/gerar-logos.mjs.
   *
   * Os quadrados aqui são menores porque avatar aparece com 88px de lado.
   *
   * Quatro pessoas diferentes, de três buscas diferentes: a busca "portrait"
   * sozinha devolvia o mesmo enquadramento de estúdio quatro vezes, e o corte
   * por atenção ainda achava a boca no lugar dos olhos. Rosto de perfil, luz
   * de fim de tarde e fundo aberto sobrevivem melhor ao círculo de 88px.
   */
  {
    consulta: "woman profile",
    arquivos: [["spa-logo", AVATAR, 17]],
  },
  {
    consulta: "smiling woman",
    arquivos: [
      ["psi-logo", AVATAR, 14],
      ["canto-logo", AVATAR, 16],
    ],
  },
  {
    consulta: "portrait",
    arquivos: [["astro-logo", AVATAR, 14]],
  },
];

/** Quantos candidatos a folha de contato mostra por busca. */
const CANDIDATOS = 12;

async function buscar(consulta) {
  const cache = `${CACHE}busca-${consulta.replace(/\W+/g, "-")}.json`;
  if (existsSync(cache)) return JSON.parse(await readFile(cache, "utf8"));

  const url = new URL(API);
  url.searchParams.set("q", consulta);
  url.searchParams.set("license", "cc0");
  url.searchParams.set("source", "stocksnap");
  url.searchParams.set("page_size", "20");

  // A API anônima devolve 503 de vez em quando e volta sozinha logo depois.
  let dados = null;
  for (let tentativa = 0; ; tentativa += 1) {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (r.ok) {
      dados = await r.json();
      break;
    }
    if (tentativa === 3) throw new Error(`busca "${consulta}": ${r.status}`);
    await new Promise((s) => setTimeout(s, 2000 * 2 ** tentativa));
  }

  const uteis = (dados.results ?? []).map((f) => ({
    url: f.url,
    titulo: f.title ?? null,
    licenca: f.license,
    fonte: f.source ?? null,
    pagina: f.foreign_landing_url ?? null,
  }));

  await writeFile(cache, JSON.stringify(uteis, null, 2));
  return uteis;
}

async function baixar(url) {
  const chave = `${CACHE}${Buffer.from(url).toString("base64url").slice(0, 60)}`;
  if (existsSync(chave)) return readFile(chave);

  const r = await fetch(url);
  if (!r.ok) throw new Error(`baixar ${url}: ${r.status}`);
  const bytes = Buffer.from(await r.arrayBuffer());
  await writeFile(chave, bytes);
  return bytes;
}

await mkdir(CACHE, { recursive: true });
await mkdir(SAIDA, { recursive: true });

if (process.argv.includes("--folha")) {
  const lado = 132;
  const rotulo = 20;
  const pecas = [];

  /*
   * Dá para pedir só algumas buscas:
   *   node scripts/baixar-fotos.mjs --folha yarn knitting
   * A folha com todas fica grande demais para olhar quando o que mudou foi
   * um exemplo só.
   */
  const pedidas = process.argv.slice(process.argv.indexOf("--folha") + 1);
  const escolhidas = pedidas.length
    ? BUSCAS.filter((b) => pedidas.includes(b.consulta))
    : BUSCAS;

  for (const [linha, { consulta }] of escolhidas.entries()) {
    const achados = (await buscar(consulta)).slice(0, CANDIDATOS);
    const topo = linha * (lado + rotulo);

    pecas.push({
      input: Buffer.from(
        `<svg width="${CANDIDATOS * lado}" height="${rotulo}"><text x="4" y="14" font-family="monospace" font-size="13" fill="#111">${consulta}</text></svg>`,
      ),
      left: 0,
      top: topo,
    });

    for (const [coluna, foto] of achados.entries()) {
      const miniatura = await sharp(await baixar(foto.url))
        .resize(lado, lado, { fit: "cover" })
        .toBuffer();
      pecas.push({ input: miniatura, left: coluna * lado, top: topo + rotulo });
      pecas.push({
        input: Buffer.from(
          `<svg width="24" height="18"><rect width="24" height="18" fill="#fff"/><text x="4" y="13" font-family="monospace" font-size="12" fill="#111">${coluna}</text></svg>`,
        ),
        left: coluna * lado,
        top: topo + rotulo,
      });
    }
    console.log(`${consulta}: ${achados.length}`);
  }

  await sharp({
    create: {
      width: CANDIDATOS * lado,
      height: escolhidas.length * (lado + rotulo),
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(pecas)
    .jpeg({ quality: 78 })
    .toFile(`${CACHE}folha.jpg`);

  console.log(`\nfolha em ${CACHE}folha.jpg`);
} else {
  const registro = {};

  for (const { consulta, arquivos } of BUSCAS) {
    const achados = await buscar(consulta);

    for (const [nome, [largura, altura], posicao] of arquivos) {
      const foto = achados[posicao];
      if (!foto) {
        console.log(`faltou ${nome} (posição ${posicao} não existe)`);
        continue;
      }

      await sharp(await baixar(foto.url))
        // "attention" recorta onde a imagem tem mais contraste, que costuma
        // ser onde está o assunto. Corta melhor do que o centro em foto de
        // prato, onde o prato quase nunca está no meio do quadro.
        .resize(largura, altura, {
          fit: "cover",
          position: "attention",
          kernel: "lanczos3",
        })
        // O corte sobe um pouco de tamanho em relação ao original de 960, e
        // uma afiada leve devolve o contorno que a ampliação come.
        .sharpen({ sigma: 0.6 })
        .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" })
        .toFile(`${SAIDA}${nome}.jpg`);

      registro[`${nome}.jpg`] = foto;
      console.log(`ok ${nome}.jpg ${largura}x${altura}  ${foto.titulo ?? ""}`);
    }
  }

  await writeFile(`${SAIDA}fotos.json`, JSON.stringify(registro, null, 2) + "\n");
  console.log(`\n${Object.keys(registro).length} fotos, procedência em fotos.json`);
}
