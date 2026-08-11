import assert from "node:assert/strict";
import { test } from "node:test";
import { acoesDoRodape } from "./acoes.ts";
import { doceria, estudio, psicologia } from "./exemplos.ts";
import type { Negocio } from "./tipos.ts";

test("sem configurar nada, o botão é o WhatsApp", () => {
  const [a, ...resto] = acoesDoRodape(psicologia);
  assert.equal(a.whatsapp, true);
  assert.ok(a.href.startsWith("https://wa.me/5511977775555"));
  assert.equal(resto.length, 0);
});

test("o botão secundário aparece depois do principal", () => {
  const acoes = acoesDoRodape(doceria);
  assert.equal(acoes.length, 2);
  assert.equal(acoes[0].whatsapp, true);
  assert.equal(acoes[1].rotulo, "Pedir pelo iFood");
  assert.equal(acoes[1].evento, "clique_acao");
});

test("dá para trocar o botão principal por um link", () => {
  const acoes = acoesDoRodape(estudio);
  assert.equal(acoes[0].rotulo, "Agendar aula experimental");
  assert.equal(acoes[0].whatsapp, false);
  assert.equal(acoes[0].href, "https://exemplo.com.br/agenda");
  // O WhatsApp desceu para segundo, e continua sendo WhatsApp.
  assert.equal(acoes[1].whatsapp, true);
});

test("negócio sem WhatsApp e sem ação não mostra barra", () => {
  const vazio: Negocio = { ...psicologia, whatsapp: null };
  assert.equal(acoesDoRodape(vazio).length, 0);
});

test("ação de link sem endereço é descartada, não quebra a página", () => {
  const torto: Negocio = {
    ...psicologia,
    acaoPrincipal: { tipo: "link", rotulo: "Comprar", url: null, icone: "loja" },
  };
  assert.equal(acoesDoRodape(torto).length, 0);
});

test("ligar usa o telefone quando existe, e cai no WhatsApp quando não", () => {
  const comFixo: Negocio = {
    ...psicologia,
    telefone: "551133334444",
    acaoPrincipal: { tipo: "telefone", rotulo: "Ligar agora", url: null, icone: "telefone" },
  };
  assert.equal(acoesDoRodape(comFixo)[0].href, "tel:+551133334444");

  const semFixo: Negocio = {
    ...psicologia,
    acaoPrincipal: { tipo: "telefone", rotulo: "Ligar", url: null, icone: "telefone" },
  };
  assert.equal(acoesDoRodape(semFixo)[0].href, "tel:+5511977775555");
});
