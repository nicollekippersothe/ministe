import assert from "node:assert/strict";
import { test } from "node:test";

/*
 * O endereço do projeto é lido uma vez, quando o módulo carrega, então ele
 * precisa existir antes do import, do mesmo jeito que imagens.test.ts faz.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://projeto.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_teste";

const { paraLinha } = await import("./mapa.ts");
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
