import assert from "node:assert/strict";
import { test } from "node:test";
import { completudeDe } from "./completude.ts";
import { montar } from "./novo.ts";
import { psicologia } from "./exemplos.ts";
import type { Negocio } from "./tipos.ts";

test("página recém-criada, com só o nome, fica em 20%", () => {
  const nova = montar("camila", "Camila Reis");
  const c = completudeDe(nova);
  assert.equal(c.feitas, 1);
  assert.equal(c.total, 5);
  assert.equal(c.pct, 20);
  assert.equal(c.completo, false);
  // A próxima peça destacada é a mais barata que ainda importa: falar.
  assert.equal(c.proxima?.chave, "falar");
});

test("página nascida sem nem o nome fica em 0%, e a próxima é o nome", () => {
  const nada = montar("x", "");
  const c = completudeDe(nada);
  assert.equal(c.pct, 0);
  assert.equal(c.proxima?.chave, "nome");
});

test("as três essenciais preenchidas já passam de 60%", () => {
  // nome + frase + um botão, sem imagem e sem catálogo.
  const base: Negocio = {
    ...montar("m", "Marina Yoga"),
    frase: "Aulas de yoga com hora marcada.",
    whatsapp: "5511999998888",
  };
  const c = completudeDe(base);
  assert.equal(c.feitas, 3);
  assert.equal(c.pct, 60);
  // Falta imagem e catálogo, e a próxima é a imagem.
  assert.deepEqual(
    c.faltando.map((p) => p.chave),
    ["imagem", "catalogo"],
  );
  assert.equal(c.proxima?.chave, "imagem");
});

test("um exemplo cheio chega a 100%, e a próxima peça some", () => {
  const c = completudeDe(psicologia);
  assert.equal(c.completo, true);
  assert.equal(c.pct, 100);
  assert.equal(c.proxima, null);
  assert.equal(c.faltando.length, 0);
});

test("o botão de falar conta pela ação resolvida, não pelo WhatsApp cru", () => {
  // Sem WhatsApp, mas com um botão de link no rodapé: a peça "falar" fecha.
  const comLink: Negocio = {
    ...montar("l", "Loja da Ana"),
    whatsapp: null,
    acaoPrincipal: {
      tipo: "link",
      rotulo: "Ver o catálogo",
      url: "https://exemplo.com",
      icone: "link",
    },
  };
  const c = completudeDe(comLink);
  assert.equal(
    c.pecas.find((p) => p.chave === "falar")?.feito,
    true,
  );
});
