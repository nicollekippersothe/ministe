import assert from "node:assert/strict";
import { test } from "node:test";

/*
 * O endereço do projeto é lido uma vez, quando o módulo carrega, então ele
 * precisa existir antes do import, do mesmo jeito que imagens.test.ts faz.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://projeto.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_teste";

const { paraLinha, paraNegocio } = await import("./mapa.ts");
const { caminhoValido, enderecoPublico } = await import("./imagens.ts");
const { massagem } = await import("../exemplos.ts");

const ID = "11111111-1111-4111-8111-111111111111";
const CAPA = `${ID}/capa/22222222-2222-4222-8222-222222222222.webp`;
const LOGO = `${ID}/logo/33333333-3333-4333-8333-333333333333.jpg`;

/*
 * O defeito que este teste guarda: a leitura monta o endereço público, o painel
 * carrega esse endereço no `Negocio`, e a gravação devolvia ele para a coluna.
 * A restrição da 008 aceita caminho, e nunca URL inteira, então a primeira capa
 * enviada travava todo salvamento seguinte do painel, inclusive o do nome.
 */
test("a capa enviada volta para a coluna como caminho, e não como URL", () => {
  const url = enderecoPublico(CAPA);
  assert.equal(url, `https://projeto.supabase.co/storage/v1/object/public/imagens/${CAPA}`);

  const linha = paraLinha({
    ...massagem,
    capa: { url: url as string, alt: "capa", largura: 1200, altura: 675 },
    logo: { url: enderecoPublico(LOGO) as string, alt: "logo", largura: 400, altura: 400 },
  });

  assert.equal(linha.capa_url, CAPA);
  assert.equal(linha.logo_url, LOGO);
  assert.equal(caminhoValido(linha.capa_url as string, ID, "capa"), true);
  assert.equal(caminhoValido(linha.logo_url as string, ID, "logo"), true);
});

test("a imagem de exemplo, que já é endereço local, atravessa inteira", () => {
  const linha = paraLinha(massagem);
  assert.equal(linha.capa_url, massagem.capa?.url ?? null);
  assert.equal(linha.logo_url, massagem.logo?.url ?? null);
});

test("página sem imagem continua gravando nulo nas duas colunas", () => {
  const linha = paraLinha({ ...massagem, capa: null, logo: null });
  assert.equal(linha.capa_url, null);
  assert.equal(linha.logo_url, null);
});

/*
 * O buraco que a leitura tinha: a foto de item e a da galeria voltavam com o
 * caminho cru do bucket, enquanto a logo e a capa voltavam como endereço. Com
 * o Supabase ligado, isso é a foto do produto saindo quebrada na página com o
 * arquivo inteiro no lugar certo do Storage.
 */
test("a foto do item volta da leitura como endereço, e não como caminho", () => {
  const linha = {
    id: ID,
    slug: "teste",
    nome: "Teste",
    itens: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        titulo: "Bolo",
        ordem: 0,
        ativo: true,
        itens_fotos: [
          {
            url: `${ID}/catalogo/55555555-5555-4555-8555-555555555555.webp`,
            alt: "Bolo",
            largura: 800,
            altura: 600,
            ordem: 0,
          },
        ],
      },
    ],
  };

  const negocio = paraNegocio(linha);
  assert.equal(
    negocio.itens[0].fotos[0].url,
    `https://projeto.supabase.co/storage/v1/object/public/imagens/${ID}/catalogo/55555555-5555-4555-8555-555555555555.webp`,
  );
});

test("a foto de exemplo, que já é endereço local, atravessa inteira", () => {
  const linha = {
    id: ID,
    slug: "teste",
    nome: "Teste",
    itens: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        titulo: "Bolo",
        ordem: 0,
        ativo: true,
        itens_fotos: [
          { url: "/exemplo/bolo-1.jpg", alt: "Bolo", largura: 800, altura: 800, ordem: 0 },
        ],
      },
    ],
  };

  assert.equal(paraNegocio(linha).itens[0].fotos[0].url, "/exemplo/bolo-1.jpg");
});
