import assert from "node:assert/strict";
import { test } from "node:test";

/*
 * O endereço do projeto é lido uma vez, quando o módulo carrega, então ele
 * precisa existir antes do import. Por isso o import é dinâmico aqui, e é o
 * único jeito de exercitar `enderecoPublico` com um projeto configurado.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://projeto.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_teste";

const {
  caminhoDeImagem,
  caminhoGuardado,
  caminhoValido,
  conferirArquivo,
  ehPasta,
  enderecoPublico,
  LIMITE_BYTES,
} = await import("./imagens.ts");

const ID = "11111111-1111-4111-8111-111111111111";
const OUTRO = "22222222-2222-4222-8222-222222222222";

test("os três tipos do bucket passam, e o resto vira recusa de tipo", () => {
  assert.equal(conferirArquivo({ type: "image/webp", size: 10 }).ok, true);
  assert.equal(conferirArquivo({ type: "image/jpeg", size: 10 }).ok, true);
  assert.equal(conferirArquivo({ type: "image/png", size: 10 }).ok, true);

  const pdf = conferirArquivo({ type: "application/pdf", size: 10 });
  assert.equal(pdf.ok, false);
  assert.equal(pdf.ok === false && pdf.motivo, "tipo");

  const gif = conferirArquivo({ type: "image/gif", size: 10 });
  assert.equal(gif.ok === false && gif.motivo, "tipo");
});

test("o teto é o mesmo file_size_limit do bucket", () => {
  assert.equal(LIMITE_BYTES, 3145728);
  assert.equal(conferirArquivo({ type: "image/png", size: LIMITE_BYTES }).ok, true);

  const grande = conferirArquivo({ type: "image/png", size: LIMITE_BYTES + 1 });
  assert.equal(grande.ok, false);
  assert.equal(grande.ok === false && grande.motivo, "tamanho");
});

test("o caminho nasce no padrão que a restrição da 008 exige", () => {
  const caminho = caminhoDeImagem(ID, "logo", "image/jpeg");
  assert.match(
    caminho,
    /^[0-9a-f-]{36}\/logo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/,
  );
  assert.equal(caminhoValido(caminho, ID, "logo"), true);
});

test("cada tipo escolhe a extensão que o banco aceita", () => {
  assert.match(caminhoDeImagem(ID, "capa", "image/webp"), /\.webp$/);
  assert.match(caminhoDeImagem(ID, "capa", "image/png"), /\.png$/);
  assert.match(caminhoDeImagem(ID, "capa", "image/jpeg"), /\.jpg$/);
});

test("caminho da pasta de outro negócio é recusado", () => {
  const caminho = caminhoDeImagem(OUTRO, "logo", "image/png");
  assert.equal(caminhoValido(caminho, ID, "logo"), false);
});

test("a pasta faz parte do teste, como no banco", () => {
  const caminho = caminhoDeImagem(ID, "logo", "image/png");
  assert.equal(caminhoValido(caminho, ID, "capa"), false);
});

test("texto solto e endereço de fora ficam de fora da coluna", () => {
  assert.equal(caminhoValido("https://exemplo.com/foto.jpg", ID, "capa"), false);
  assert.equal(caminhoValido(`${ID}/capa/foto.jpg`, ID, "capa"), false);
  assert.equal(caminhoValido(`${ID}/capa/${ID}.gif`, ID, "capa"), false);
  assert.equal(caminhoValido(`../${ID}/capa/${ID}.png`, ID, "capa"), false);
});

test("o endereço público sai do caminho guardado", () => {
  assert.equal(
    enderecoPublico(`${ID}/capa/${ID}.webp`),
    `https://projeto.supabase.co/storage/v1/object/public/imagens/${ID}/capa/${ID}.webp`,
  );
});

/*
 * A ida e a volta, que é o que a gravação do painel faz a cada salvamento: a
 * leitura monta o endereço público, e a gravação precisa devolver o caminho.
 * Enquanto a volta faltou, a coluna recebia a URL inteira e a restrição
 * `capa_url_formato` recusava a linha toda.
 */
test("o endereço público volta a ser o caminho que a coluna aceita", () => {
  const guardado = `${ID}/capa/${ID}.webp`;
  const publico = enderecoPublico(guardado);

  assert.equal(caminhoValido(guardado, ID, "capa"), true);
  assert.equal(caminhoValido(String(publico), ID, "capa"), false);
  assert.equal(caminhoGuardado(publico), guardado);
  assert.equal(caminhoValido(String(caminhoGuardado(publico)), ID, "capa"), true);
});

test("a volta do caminho deixa passar o que já está no formato da coluna", () => {
  assert.equal(caminhoGuardado("/exemplo/spa-capa.jpg"), "/exemplo/spa-capa.jpg");
  assert.equal(caminhoGuardado(`${ID}/logo/${ID}.png`), `${ID}/logo/${ID}.png`);
  assert.equal(caminhoGuardado(null), null);
  assert.equal(caminhoGuardado(""), null);
});

test("endereço local continua sendo ele mesmo", () => {
  assert.equal(enderecoPublico("/exemplo/logo.jpg"), "/exemplo/logo.jpg");
});

test("coluna vazia vira nulo, e a tela mostra o lugar da imagem", () => {
  assert.equal(enderecoPublico(null), null);
  assert.equal(enderecoPublico(""), null);
  assert.equal(enderecoPublico("   "), null);
});

test("as duas pastas de hoje são logo e capa", () => {
  assert.equal(ehPasta("logo"), true);
  assert.equal(ehPasta("capa"), true);
  assert.equal(ehPasta("galeria"), false);
  assert.equal(ehPasta("../.."), false);
  assert.equal(ehPasta(null), false);
});
