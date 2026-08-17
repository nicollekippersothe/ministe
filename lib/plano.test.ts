import assert from "node:assert/strict";
import { test } from "node:test";
import { planoValido } from "./plano.ts";

const UM_DIA = 24 * 60 * 60 * 1000;
const futuro = () => new Date(Date.now() + UM_DIA).toISOString();
const passado = () => new Date(Date.now() - UM_DIA).toISOString();

test("pago com vencimento no futuro vale pago", () => {
  assert.equal(planoValido("pago", futuro()), "pago");
});

test("pago sem vencimento vale pago", () => {
  assert.equal(planoValido("pago", null), "pago");
});

test("pago vencido volta a valer gratuito", () => {
  assert.equal(planoValido("pago", passado()), "gratuito");
});

test("gratuito continua gratuito, mesmo com data no futuro", () => {
  assert.equal(planoValido("gratuito", futuro()), "gratuito");
});

test("plano desconhecido vale gratuito", () => {
  assert.equal(planoValido("", futuro()), "gratuito");
  assert.equal(planoValido("premium", futuro()), "gratuito");
});

test("data quebrada cai no lado seguro", () => {
  assert.equal(planoValido("pago", "ontem"), "gratuito");
});

/*
 * O limite exato. plano_de() usa `plano_expira_em > now()`, então o instante
 * do vencimento já está fora. Um teste com a data igual a agora seria uma
 * corrida com o relógio, então a conferência usa um milissegundo de cada lado.
 */
test("o instante do vencimento já conta como vencido", () => {
  assert.equal(planoValido("pago", new Date(Date.now() - 1).toISOString()), "gratuito");
  assert.equal(planoValido("pago", new Date(Date.now() + 5000).toISOString()), "pago");
});
