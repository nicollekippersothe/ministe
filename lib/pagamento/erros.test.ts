import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MOTIVOS_PAGAMENTO,
  mensagemDeRecusa,
  mensagemDoStatusDetail,
  motivoDoStatusDetail,
  normalizarDetalhe,
} from "./erros.ts";

const mensagens = Object.entries(MOTIVOS_PAGAMENTO);

/*
 * A regra de escrita do projeto, virada em teste.
 *
 * O AGENTS.md diz que texto de tela conta o que existe, e a tela de recusa é
 * onde essa regra é mais fácil de esquecer: a pessoa acabou de levar um
 * "rejected" do banco, e a tentação de repassar a palavra é enorme.
 *
 * A busca usa `\p{L}` nas bordas em vez de `\b`, porque `\b` em JavaScript
 * enxerga só `[A-Za-z0-9_]`, e aí "não" ficaria com uma borda no meio da
 * palavra por causa do til. Com o limite em letra Unicode, "sem" é pego e
 * "sempre" passaria, "erro" é pego e "ferro" passaria, que é o comportamento
 * certo para uma busca por palavra.
 */
const NEGATIVA =
  /(?<!\p{L})(não|nao|sem|nunca|falh\p{L}*|erro\p{L}*|recusad\p{L}*|inválid\p{L}*|invalid\p{L}*)(?!\p{L})/iu;

test("nenhuma frase de recusa usa palavra negativa", () => {
  for (const [motivo, frase] of mensagens) {
    const achado = frase.match(NEGATIVA);
    assert.equal(
      achado,
      null,
      `${motivo} usa "${achado?.[0]}" na frase: ${frase}`,
    );
  }
});

test("a regra pega o que tem que pegar", () => {
  // Guarda a própria regex: sem isto, um erro de escrita nela deixaria tudo
  // passar e o teste de cima viraria enfeite.
  assert.ok(NEGATIVA.test("o cartão não passou"));
  assert.ok(NEGATIVA.test("pagamento sem saldo"));
  assert.ok(NEGATIVA.test("isso nunca acontece"));
  assert.ok(NEGATIVA.test("falha ao cobrar"));
  assert.ok(NEGATIVA.test("houve um erro"));
  assert.ok(NEGATIVA.test("cartão recusado"));
  assert.ok(NEGATIVA.test("dado inválido"));
  // E deixa passar as palavras que só contêm as proibidas por dentro.
  assert.equal(NEGATIVA.test("sempre que possível"), false);
  assert.equal(NEGATIVA.test("portão de ferro"), false);
});

test("toda frase é uma frase de verdade, com saída", () => {
  for (const [motivo, frase] of mensagens) {
    assert.ok(frase.length > 20, `${motivo} ficou curto demais`);
    assert.match(frase, /[.!?]$/, `${motivo} ficou sem ponto final`);
    assert.equal(frase, frase.trim(), `${motivo} veio com espaço sobrando`);
  }
});

test("nenhuma frase usa travessão", () => {
  for (const [motivo, frase] of mensagens) {
    assert.equal(/[–—]/.test(frase), false, `${motivo} usa travessão`);
  }
});

test("os detalhes do enunciado viram as frases combinadas", () => {
  assert.equal(
    mensagemDoStatusDetail("cc_rejected_bad_filled_security_code"),
    "Confira o código de segurança, os três dígitos do verso.",
  );
  assert.equal(
    mensagemDoStatusDetail("cc_rejected_insufficient_amount"),
    "O banco pediu outro cartão para este valor. O Pix aprova na hora.",
  );
  assert.equal(
    mensagemDoStatusDetail("cc_rejected_call_for_authorize"),
    "O banco pede a sua autorização para este valor. Ligue para o número do verso do cartão e tente de novo.",
  );
});

test("o desconhecido cai no guarda-chuva, com as duas saídas", () => {
  const esperado =
    "O pagamento voltou do banco. Tente outro cartão ou pague com Pix, que aprova na hora.";
  assert.equal(mensagemDoStatusDetail("cc_rejected_algo_que_nem_existe"), esperado);
  assert.equal(mensagemDoStatusDetail("cc_rejected_other_reason"), esperado);
  assert.equal(mensagemDoStatusDetail(null), esperado);
  assert.equal(mensagemDoStatusDetail(undefined), esperado);
  assert.equal(mensagemDoStatusDetail(""), esperado);
});

test("cada status_detail conhecido vira o motivo certo", () => {
  const esperados: Array<[string, string]> = [
    ["cc_rejected_bad_filled_security_code", "codigo_seguranca"],
    ["cc_rejected_bad_filled_date", "data_do_cartao"],
    ["cc_rejected_bad_filled_card_number", "numero_do_cartao"],
    ["cc_rejected_bad_filled_other", "dados_incompletos"],
    ["cc_rejected_insufficient_amount", "valor_alto_para_o_cartao"],
    ["cc_rejected_call_for_authorize", "autorizacao_do_banco"],
    ["cc_rejected_high_risk", "risco"],
    ["cc_rejected_blacklist", "risco"],
    ["cc_rejected_max_attempts", "tentativas"],
    ["cc_rejected_card_disabled", "cartao_bloqueado"],
    ["cc_rejected_duplicated_payment", "cobranca_repetida"],
    ["cc_rejected_card_error", "recusa_do_banco"],
    ["cc_rejected_invalid_installments", "dados_incompletos"],
    ["rejected_insufficient_data", "dados_incompletos"],
    ["cc_amount_rate_limit_exceeded", "valor_alto_para_o_cartao"],
  ];

  for (const [detalhe, motivo] of esperados) {
    assert.equal(motivoDoStatusDetail(detalhe), motivo, detalhe);
  }
});

/*
 * O mesmo detalhe chega com prefixo diferente conforme a rota, e o Mercado
 * Pago já mandou tudo em maiúscula em alguns avisos. A tabela é indexada pelo
 * sufixo justamente para uma variação de prefixo continuar caindo no lugar
 * certo em vez de escorregar para o guarda-chuva.
 */
test("prefixo, maiúscula e espaço não mudam o destino", () => {
  assert.equal(motivoDoStatusDetail("rejected_high_risk"), "risco");
  assert.equal(motivoDoStatusDetail("high_risk"), "risco");
  assert.equal(motivoDoStatusDetail("  CC_REJECTED_HIGH_RISK  "), "risco");
  assert.equal(normalizarDetalhe("cc_rejected_max_attempts"), "max_attempts");
  assert.equal(normalizarDetalhe("rejected_max_attempts"), "max_attempts");
  assert.equal(normalizarDetalhe(null), "");
});

test("todo motivo do tipo tem frase, e nenhuma frase se repete", () => {
  const frases = mensagens.map(([, f]) => f);
  assert.ok(frases.length >= 14, "algum motivo ficou de fora da tabela");
  for (const frase of frases) {
    assert.ok(frase.trim().length > 0);
  }

  // Frase repetida em dois motivos é sinal de que um dos dois motivos existe
  // só no tipo e nunca diz nada de novo para quem lê.
  assert.equal(new Set(frases).size, frases.length);
});

test("mensagemDeRecusa é o mesmo caminho, a partir do motivo", () => {
  assert.equal(
    mensagemDeRecusa("codigo_seguranca"),
    MOTIVOS_PAGAMENTO.codigo_seguranca,
  );
  assert.equal(mensagemDeRecusa("provedor_fora"), MOTIVOS_PAGAMENTO.provedor_fora);
});
