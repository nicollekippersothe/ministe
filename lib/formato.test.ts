import assert from "node:assert/strict";
import { test } from "node:test";
import {
  linkWhatsapp,
  mensagemDoItem,
  normalizarWhatsapp,
  preco,
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
