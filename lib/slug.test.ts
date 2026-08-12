import assert from "node:assert/strict";
import { test } from "node:test";
import { conferirFormato, normalizar } from "./slug.ts";

test("normaliza o que a pessoa digita sem reclamar", () => {
  assert.equal(normalizar("Doceria da Ana!!"), "doceria-da-ana");
  assert.equal(normalizar("Açaí do João"), "acai-do-joao");
  assert.equal(normalizar("  --Studio Raiz--  "), "studio-raiz");
});

test("endereço de negócio comum passa", () => {
  assert.equal(conferirFormato("doceria-da-ana"), null);
  assert.equal(conferirFormato("studio-raiz"), null);
  assert.equal(conferirFormato("marina-nutricao"), null);
  // "central" bloqueia, mas "centralina" é nome de cidade e não é pedaço.
  assert.equal(conferirFormato("padaria-centralina"), null);
});

test("tamanho e formato", () => {
  assert.equal(conferirFormato("ab"), "curto");
  assert.equal(conferirFormato("a".repeat(31)), "longo");
  assert.equal(conferirFormato("-doceria"), "formato");
  assert.equal(conferirFormato("doceria-"), "formato");
});

test("rota do sistema continua reservada", () => {
  assert.equal(conferirFormato("painel"), "reservado");
  assert.equal(conferirFormato("api"), "reservado");
  assert.equal(conferirFormato("entrais"), "reservado");
});

test("endereço com cara de banco ou cobrança é restrito", () => {
  assert.equal(conferirFormato("pix"), "restrito");
  assert.equal(conferirFormato("pix-caixa"), "restrito");
  assert.equal(conferirFormato("central-pix"), "restrito");
  assert.equal(conferirFormato("atendimento-nubank"), "restrito");
  assert.equal(conferirFormato("sorteio-do-mes"), "restrito");
  assert.equal(conferirFormato("regularizar-cpf"), "restrito");
});

test("se passar pela marca é o golpe mais direto", () => {
  assert.equal(conferirFormato("entrais-suporte"), "restrito");
  assert.equal(conferirFormato("suporte-entrais"), "restrito");
});
