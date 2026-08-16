import assert from "node:assert/strict";
import { test } from "node:test";
import { EXEMPLOS } from "./exemplos.ts";
import { conferirFormato, normalizar } from "./slug.ts";

test("normaliza o que a pessoa digita sem reclamar", () => {
  assert.equal(normalizar("Doceria da Ana!!"), "doceria-da-ana");
  assert.equal(normalizar("Açaí do João"), "acai-do-joao");
  assert.equal(normalizar("  --Studio Raiz--  "), "studio-raiz");
});

test("endereço de negócio comum passa", () => {
  assert.equal(conferirFormato("doceria-da-ana"), null);
  assert.equal(conferirFormato("barbearia-do-bruno"), null);
  assert.equal(conferirFormato("ateliedaju"), null);
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

test("o endereço de toda página de exemplo fica reservado", () => {
  // As sete páginas de exemplo são o portfólio do produto: a tela inicial
  // mostra elas e o "ver por dentro" leva para uma. Elas abrem direto de
  // lib/exemplos.ts, antes de o banco ser consultado. Se alguém pudesse
  // cadastrar um desses endereços, a página cadastrada nunca abriria, porque o
  // exemplo vem na frente. Este teste é o que segura as duas listas juntas.
  for (const n of EXEMPLOS) {
    assert.equal(
      conferirFormato(n.slug),
      "reservado",
      `${n.slug} está solto e alguém pode cadastrar`,
    );
  }
});
