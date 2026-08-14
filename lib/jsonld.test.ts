import { ok, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { doceria, psicologia } from "./exemplos.ts";
import { localBusiness } from "./jsonld.ts";

const BASE = "https://entrais.com.br";

test("o @type sai da categoria, e não de um LocalBusiness fixo", () => {
  strictEqual(localBusiness(doceria, BASE)["@type"], "Bakery");
  strictEqual(localBusiness(psicologia, BASE)["@type"], "MedicalBusiness");
});

test("categoria desconhecida ou vazia cai em LocalBusiness, sem quebrar", () => {
  for (const c of [null, "inexistente"]) {
    strictEqual(
      localBusiness({ ...doceria, categoria: c }, BASE)["@type"],
      "LocalBusiness",
    );
  }
});

test("campo vazio fica de fora, em vez de virar string vazia", () => {
  // A psicóloga é o exemplo sem endereço na rua e sem mapa, de propósito.
  const dados = localBusiness(psicologia, BASE) as Record<string, unknown>;
  ok(!("hasMap" in dados), "mapa vazio entrou");
  const endereco = dados.address as Record<string, string> | undefined;
  ok(endereco === undefined || !("streetAddress" in endereco));
});

test("o endereço da página é o url, montado a partir do slug", () => {
  strictEqual(
    (localBusiness(doceria, BASE) as Record<string, unknown>).url,
    `${BASE}/${doceria.slug}`,
  );
});
