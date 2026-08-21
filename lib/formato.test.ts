import assert from "node:assert/strict";
import { test } from "node:test";
import {
  lerPreco,
  linkWhatsapp,
  mensagemDoItem,
  normalizarWhatsapp,
  preco,
  precoEditavel,
  telefoneE164,
  telefoneVisivel,
} from "./formato.ts";

test("preço sai no formato brasileiro", () => {
  assert.equal(preco(6800).replace(/ /g, " "), "R$ 68,00");
  assert.equal(preco(0).replace(/ /g, " "), "R$ 0,00");
  assert.equal(preco(150000).replace(/ /g, " "), "R$ 1.500,00");
});

test("WhatsApp digitado do jeito do brasileiro ganha o 55", () => {
  assert.equal(normalizarWhatsapp("(11) 98888-7777"), "5511988887777");
  assert.equal(normalizarWhatsapp("11988887777"), "5511988887777");
  assert.equal(normalizarWhatsapp("11 3333-4444"), "551133334444");
});

test("WhatsApp que já veio com o 55 não ganha outro", () => {
  assert.equal(normalizarWhatsapp("+55 11 98888-7777"), "5511988887777");
  assert.equal(normalizarWhatsapp("5511988887777"), "5511988887777");
});

test("o zero da operadora sai", () => {
  assert.equal(normalizarWhatsapp("011 98888-7777"), "5511988887777");
});

test("campo em branco vira nulo", () => {
  assert.equal(normalizarWhatsapp(""), null);
  assert.equal(normalizarWhatsapp("   "), null);
  assert.equal(normalizarWhatsapp("(  )  -"), null);
});

test("número de fora do Brasil passa como está", () => {
  assert.equal(normalizarWhatsapp("+351 912 345 678"), "351912345678");
});

test("o número aparece formatado para quem edita", () => {
  assert.equal(telefoneVisivel("5511988887777"), "(11) 98888-7777");
  assert.equal(telefoneVisivel("551133334444"), "(11) 3333-4444");
});

test("ida e volta entre o que se digita e o que se guarda", () => {
  const guardado = normalizarWhatsapp("(11) 98888-7777");
  assert.equal(normalizarWhatsapp(telefoneVisivel(guardado!)), guardado);
});

test("o JSON-LD recebe o telefone no padrão internacional", () => {
  assert.equal(telefoneE164("5511988887777"), "+5511988887777");
});

test("o link do WhatsApp já leva a mensagem escrita", () => {
  assert.equal(
    linkWhatsapp("5511988887777", "Oi! Vim pelo site."),
    "https://wa.me/5511988887777?text=Oi!%20Vim%20pelo%20site.",
  );
});

test("link sem mensagem não leva o ponto de interrogação", () => {
  assert.equal(linkWhatsapp("5511988887777"), "https://wa.me/5511988887777");
});

test("o modelo aplicado a todos troca o nome do item", () => {
  assert.equal(
    mensagemDoItem("Oi! Queria saber sobre: {item}", "Bolo de cenoura"),
    "Oi! Queria saber sobre: Bolo de cenoura",
  );
  assert.equal(mensagemDoItem(null, "Bolo"), null);
});

test("o preço volta para o campo em reais, com vírgula", () => {
  assert.equal(precoEditavel(7400), "74,00");
  assert.equal(precoEditavel(1250), "12,50");
  assert.equal(precoEditavel(150000), "1500,00");
  assert.equal(precoEditavel(5), "0,05");
});

test("item sem preço volta como campo vazio, e nunca como zero", () => {
  assert.equal(precoEditavel(null), "");
  assert.equal(precoEditavel(0), "0,00");
});

test("o campo de preço aceita como o brasileiro digita", () => {
  assert.deepEqual(lerPreco("74,90"), { ok: true, centavos: 7490 });
  assert.deepEqual(lerPreco("74"), { ok: true, centavos: 7400 });
  assert.deepEqual(lerPreco("R$ 74,90"), { ok: true, centavos: 7490 });
  assert.deepEqual(lerPreco(" 74,9 "), { ok: true, centavos: 7490 });
  assert.deepEqual(lerPreco(",50"), { ok: true, centavos: 50 });
  assert.deepEqual(lerPreco("12,"), { ok: true, centavos: 1200 });
});

test("o ponto do teclado do celular vale como vírgula", () => {
  assert.deepEqual(lerPreco("74.90"), { ok: true, centavos: 7490 });
  assert.deepEqual(lerPreco("74.9"), { ok: true, centavos: 7490 });
});

test("mas o ponto de milhar continua sendo milhar", () => {
  assert.deepEqual(lerPreco("1.500"), { ok: true, centavos: 150000 });
  assert.deepEqual(lerPreco("1.234,56"), { ok: true, centavos: 123456 });
});

test("campo de preço em branco é resposta, e vale item sem preço", () => {
  assert.deepEqual(lerPreco(""), { ok: true, centavos: null });
  assert.deepEqual(lerPreco("   "), { ok: true, centavos: null });
  assert.deepEqual(lerPreco(null), { ok: true, centavos: null });
});

test("texto que não é preço volta como recusa, e não como zero", () => {
  assert.deepEqual(lerPreco("combinar"), { ok: false });
  assert.deepEqual(lerPreco("-5"), { ok: false });
  assert.deepEqual(lerPreco(","), { ok: false });
  assert.deepEqual(lerPreco("."), { ok: false });
  assert.deepEqual(lerPreco("1,2,3"), { ok: false });
  assert.deepEqual(lerPreco("12,345"), { ok: false });
});

test("preço acima do que a coluna guarda é recusado no campo", () => {
  assert.deepEqual(lerPreco("999.999,99"), { ok: true, centavos: 99999999 });
  assert.deepEqual(lerPreco("1.000.000"), { ok: false });
});

test("ida e volta entre o que se digita e o que se guarda o preço", () => {
  const guardado = lerPreco("74,90");
  assert.ok(guardado.ok);
  assert.deepEqual(lerPreco(precoEditavel(guardado.centavos)), guardado);
});
