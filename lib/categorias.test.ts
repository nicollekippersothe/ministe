import { deepStrictEqual, ok, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import {
  CATEGORIAS,
  categoriaPorId,
  GRUPOS,
  RECEITA_PADRAO,
  receitaDe,
} from "./categorias.ts";

test("todo id é único", () => {
  const ids = CATEGORIAS.map((c) => c.id);
  strictEqual(new Set(ids).size, ids.length);
});

test("todo id serve como valor de formulário", () => {
  for (const c of CATEGORIAS) {
    ok(/^[a-z][a-z0-9-]*$/.test(c.id), `id estranho: ${c.id}`);
  }
});

test("todo tipo de schema começa com maiúscula, como o schema.org escreve", () => {
  for (const c of CATEGORIAS) {
    ok(/^[A-Z][A-Za-z]+$/.test(c.schema), `${c.id}: ${c.schema}`);
  }
});

test("todo título de catálogo cabe no limite de 30 do banco", () => {
  for (const c of CATEGORIAS) {
    ok(c.tituloCatalogo.length <= 30, `${c.id}: ${c.tituloCatalogo}`);
  }
});

test("categoria desconhecida cai na receita padrão, sem quebrar", () => {
  deepStrictEqual(receitaDe("inexistente"), RECEITA_PADRAO);
  deepStrictEqual(receitaDe(null), RECEITA_PADRAO);
  strictEqual(categoriaPorId("inexistente"), null);
});

test("quem vende hora esconde preço por padrão", () => {
  for (const id of ["psicologia", "nutricao", "advocacia", "fotografia"]) {
    strictEqual(receitaDe(id).mostrarPrecos, false, id);
  }
});

test("quem vende pelo olho abre pela galeria", () => {
  for (const id of ["artesanato", "fotografia", "tatuagem", "floricultura"]) {
    strictEqual(receitaDe(id).galeriaPrimeiro, true, id);
  }
});

test("quem produz em casa não tem endereço como esperado", () => {
  for (const id of ["comida-caseira", "artesanato", "consultoria"]) {
    strictEqual(receitaDe(id).endereco, "opcional", id);
  }
});

test("os grupos saem na ordem da lista, sem repetir", () => {
  strictEqual(new Set(GRUPOS).size, GRUPOS.length);
  strictEqual(GRUPOS[0], "Comida e bebida");
});
