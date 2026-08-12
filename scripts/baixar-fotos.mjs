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

const BUSCAS = [
  {
    consulta: "cafe",
    arquivos: [
      ["capa", CAPA, 0],
      ["galeria-3", QUADRADA, 9],
    ],
  },
  {
    consulta: "cake",
    arquivos: [
      ["bolo-1", QUADRADA, 0],
      ["bolo-2", QUADRADA, 8],
      ["galeria-6", QUADRADA, 9],
    ],
  },
  {
    consulta: "chocolate",
    arquivos: [
      ["bolo-3", QUADRADA, 8],
      ["brigadeiro-1", QUADRADA, 6],
      ["galeria-7", QUADRADA, 7],
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
  {
    consulta: "yoga",
    arquivos: [
      ["raiz-capa", CAPA, 1],
      ["raiz-1", QUADRADA, 3],
      ["raiz-g2", QUADRADA, 2],
    ],
  },
  {
    consulta: "fitness",
    arquivos: [
      ["raiz-2", QUADRADA, 4],
      ["raiz-g1", QUADRADA, 9],
    ],
  },
  {
    consulta: "meditation",
    arquivos: [
      ["raiz-3", QUADRADA, 9],
      ["raiz-g3", QUADRADA, 6],
    ],
  },
  {
    consulta: "healthy food",
    arquivos: [
      ["nutri-capa", CAPA, 0],
      ["nutri-1", QUADRADA, 7],
      ["nutri-3", QUADRADA, 5],
      ["nutri-g1", QUADRADA, 11],
      ["nutri-g3", QUADRADA, 2],
    ],
  },
  {
    consulta: "vegetables",
    arquivos: [
      ["nutri-2", QUADRADA, 0],
      ["nutri-g2", QUADRADA, 5],
    ],
  },
  {
    consulta: "living room",
    arquivos: [
      ["psi-capa", CAPA, 5],
      ["psi-1", QUADRADA, 10],
      ["psi-2", QUADRADA, 8],
      ["psi-g1", QUADRADA, 4],
    ],
  },
  {
    consulta: "plant",
    arquivos: [
      ["psi-3", QUADRADA, 0],
      ["psi-g2", QUADRADA, 3],
      ["galeria-4", QUADRADA, 1],
    ],
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

  for (const [linha, { consulta }] of BUSCAS.entries()) {
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
      height: BUSCAS.length * (lado + rotulo),
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
