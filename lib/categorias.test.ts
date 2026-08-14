import { deepStrictEqual, ok, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import {
  CATEGORIAS,
  categoriaPorId,
  GRUPOS,
  procurar,
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

test("acha pelo jeito que a pessoa fala, e não pelo nome que a gente deu", () => {
  const casos: [string, string][] = [
    ["inglês", "aulas"],
    ["ingles", "aulas"],
    ["violão", "aulas"],
    ["reforço escolar", "aulas"],
    ["marmita", "comida-caseira"],
    ["bolo", "confeitaria"],
    ["crochê", "artesanato"],
    ["diarista", "limpeza"],
    ["pedreiro", "reformas"],
    ["imposto de renda", "contabilidade"],
    ["banho e tosa", "pet"],
    ["personal", "personal"],
    ["investimentos", "consultoria"],
    ["brechó", "loja-roupas"],
    ["newborn", "fotografia"],
  ];
  for (const [digitado, esperado] of casos) {
    const achados = procurar(digitado);
    ok(
      achados.some((c) => c.id === esperado),
      `"${digitado}" tinha que achar ${esperado}, achou ${achados.map((c) => c.id).join(", ") || "nada"}`,
    );
  }
});

test("quem começa com o termo vem antes de quem só contém", () => {
  strictEqual(procurar("caf")[0].id, "cafeteria");
});

test("busca vazia devolve a lista inteira", () => {
  strictEqual(procurar("").length, CATEGORIAS.length);
  strictEqual(procurar("   ").length, CATEGORIAS.length);
});

test("termo em dois ramos devolve os dois, para a pessoa escolher", () => {
  // Casamento é dos dois mesmo: fotógrafo cobre casamento, cerimonialista
  // organiza casamento. Devolver os dois e deixar a pessoa escolher é melhor
  // que decidir por ela.
  const achados = procurar("casamento").map((c) => c.id);
  ok(achados.includes("fotografia"), achados.join(", "));
  ok(achados.includes("eventos"), achados.join(", "));
});

test("uma letra só devolve tudo, em vez de fingir que filtrou", () => {
  strictEqual(procurar("a").length, CATEGORIAS.length);
});

test("a partir de duas letras a lista encolhe de verdade", () => {
  ok(procurar("ta").length < CATEGORIAS.length);
  ok(procurar("bolo").length < 5);
});
