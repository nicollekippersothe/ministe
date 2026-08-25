import assert from "node:assert/strict";
import { test } from "node:test";
import { gateway } from "./index.ts";

/**
 * O que sai daqui para o Mercado Pago, conferido no corpo da requisição.
 *
 * Três coisas do corpo custam dinheiro quando somem, e as três somem em
 * silêncio: a chave de idempotência, que é o que faz clique duplo cobrar uma
 * vez só; a referência externa, que é como o webhook acha o negócio; e a url
 * de aviso, sem a qual o aviso da assinatura nascendo depende de uma caixa que
 * a tela de webhooks deles nem sempre oferece.
 *
 * O `fetch` é trocado por um espião. Nenhuma chamada de verdade sai daqui.
 */

type Espiada = {
  url: string;
  corpo: Record<string, unknown>;
  chave: string | null;
  aparelho: string | null;
};

async function espiar(
  resposta: Record<string, unknown>,
  agir: () => Promise<unknown>,
): Promise<Espiada> {
  const original = globalThis.fetch;
  const anterior = process.env.MERCADOPAGO_ACCESS_TOKEN;
  process.env.MERCADOPAGO_ACCESS_TOKEN = "token-de-teste";

  let visto: Espiada | null = null;

  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const cabecalhos = new Headers(init.headers);
    visto = {
      url: String(url),
      corpo: JSON.parse(String(init.body ?? "{}")),
      chave: cabecalhos.get("X-Idempotency-Key"),
      aparelho: cabecalhos.get("X-meli-session-id"),
    };
    return new Response(JSON.stringify(resposta), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;

  try {
    await agir();
  } finally {
    globalThis.fetch = original;
    if (anterior === undefined) delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    else process.env.MERCADOPAGO_ACCESS_TOKEN = anterior;
  }

  assert.ok(visto, "a chamada precisa ter acontecido");
  return visto as Espiada;
}

test("a assinatura no crédito leva a url do aviso, a referência e a chave", async () => {
  const visto = await espiar({ id: "pre-1", status: "authorized" }, () =>
    gateway.assinarComCartao({
      idempotencia: "chave-1",
      ciclo: "mensal",
      tokenDoCartao: "tok",
      emailDoPagador: "quem@paga.com",
      urlDeVolta: "https://exemplo.test/painel/plano",
      urlDeAviso: "https://exemplo.test/api/pagamento/webhook",
      referencia: "11111111-1111-1111-1111-111111111111",
      descricao: "Entrais mensal",
    }),
  );

  assert.ok(visto.url.endsWith("/preapproval"));
  assert.equal(
    visto.corpo.notification_url,
    "https://exemplo.test/api/pagamento/webhook",
  );
  assert.equal(visto.corpo.external_reference, "11111111-1111-1111-1111-111111111111");
  assert.equal(visto.chave, "chave-1");
});

test("o Pix leva a url do aviso, a referência e a chave", async () => {
  const visto = await espiar({ id: 7, status: "pending" }, () =>
    gateway.cobrarUmaVez({
      idempotencia: "chave-2",
      ciclo: "anual",
      meio: "pix",
      emailDoPagador: "quem@paga.com",
      urlDeAviso: "https://exemplo.test/api/pagamento/webhook",
      referencia: "22222222-2222-2222-2222-222222222222",
      descricao: "Entrais anual",
    }),
  );

  assert.ok(visto.url.endsWith("/v1/payments"));
  assert.equal(
    visto.corpo.notification_url,
    "https://exemplo.test/api/pagamento/webhook",
  );
  assert.equal(visto.corpo.payment_method_id, "pix");
  assert.equal(visto.chave, "chave-2");
});

/*
 * O que a qualidade da integração mede, conferido no corpo e no cabeçalho.
 *
 * A nota do painel deles mexe direto na taxa de aprovação do cartão, e todo
 * campo abaixo some em silêncio: a cobrança continua sendo criada sem eles, e
 * o preço aparece semanas depois, em recusa de cartão de cliente legítimo.
 */

test("o Pix leva o descritor da fatura, o item comprado e o nome de quem paga", async () => {
  const visto = await espiar({ id: 9, status: "pending" }, () =>
    gateway.cobrarUmaVez({
      idempotencia: "chave-4",
      ciclo: "mensal",
      meio: "pix",
      emailDoPagador: "quem@paga.com",
      nomeDoPagador: "Helena Vasques de Andrade",
      referencia: "44444444-4444-4444-4444-444444444444",
      descricao: "entrais mensal",
    }),
  );

  assert.equal(visto.corpo.statement_descriptor, "entrais");

  const adicional = visto.corpo.additional_info as Record<string, unknown>;
  const itens = adicional.items as Array<Record<string, unknown>>;
  assert.equal(itens.length, 1);
  assert.equal(itens[0].id, "plano-mensal");
  assert.equal(itens[0].title, "entrais mensal");
  assert.equal(itens[0].category_id, "service");
  assert.equal(itens[0].quantity, 1);
  // O mesmo decimal do valor cobrado, nascido do mesmo centavo inteiro.
  assert.equal(itens[0].unit_price, visto.corpo.transaction_amount);

  assert.deepEqual(adicional.payer, {
    first_name: "Helena",
    last_name: "Vasques de Andrade",
  });
});

test("sem nome de pagador, o bloco dele fica de fora em vez de ir vazio", async () => {
  const visto = await espiar({ id: 10, status: "pending" }, () =>
    gateway.cobrarUmaVez({
      idempotencia: "chave-5",
      ciclo: "anual",
      meio: "pix",
      emailDoPagador: "quem@paga.com",
      referencia: "55555555-5555-5555-5555-555555555555",
      descricao: "entrais anual",
    }),
  );

  const adicional = visto.corpo.additional_info as Record<string, unknown>;
  assert.ok(Array.isArray(adicional.items));
  assert.equal("payer" in adicional, false);
});

test("o identificador do aparelho vai por cabeçalho nas duas cobranças", async () => {
  const doPix = await espiar({ id: 11, status: "pending" }, () =>
    gateway.cobrarUmaVez({
      idempotencia: "chave-6",
      ciclo: "mensal",
      meio: "pix",
      emailDoPagador: "quem@paga.com",
      referencia: "66666666-6666-6666-6666-666666666666",
      descricao: "entrais mensal",
      idDoAparelho: "armor.5f3a1c9e-0b2d",
    }),
  );
  assert.equal(doPix.aparelho, "armor.5f3a1c9e-0b2d");

  const doCartao = await espiar({ id: "pre-2", status: "authorized" }, () =>
    gateway.assinarComCartao({
      idempotencia: "chave-7",
      ciclo: "mensal",
      tokenDoCartao: "tok",
      emailDoPagador: "quem@paga.com",
      urlDeVolta: "https://exemplo.test/painel/plano",
      referencia: "77777777-7777-7777-7777-777777777777",
      descricao: "entrais mensal",
      idDoAparelho: "armor.5f3a1c9e-0b2d",
    }),
  );
  assert.equal(doCartao.aparelho, "armor.5f3a1c9e-0b2d");

  // O `/preapproval` recebe oito campos contados, e estes dois ficam fora da
  // lista da API deles. Mandar assim mesmo engordaria o corpo por nada.
  assert.equal("additional_info" in doCartao.corpo, false);
  assert.equal("statement_descriptor" in doCartao.corpo, false);
});

test("aparelho com quebra de linha fica de fora do cabeçalho", async () => {
  const visto = await espiar({ id: 12, status: "pending" }, () =>
    gateway.cobrarUmaVez({
      idempotencia: "chave-8",
      ciclo: "mensal",
      meio: "pix",
      emailDoPagador: "quem@paga.com",
      referencia: "88888888-8888-8888-8888-888888888888",
      descricao: "entrais mensal",
      // Valor de navegador entrando em cabeçalho HTTP. Passar isto adiante é
      // injeção de cabeçalho, e o `fetch` levantaria antes de sair da máquina.
      idDoAparelho: "abc\r\nX-Idempotency-Key: outra",
    }),
  );

  assert.equal(visto.aparelho, null);
  assert.equal(visto.chave, "chave-8");
});

test("sem url de aviso o campo fica de fora, em vez de ir vazio", async () => {
  const visto = await espiar({ id: 8, status: "pending" }, () =>
    gateway.cobrarUmaVez({
      idempotencia: "chave-3",
      ciclo: "mensal",
      meio: "pix",
      emailDoPagador: "quem@paga.com",
      referencia: "33333333-3333-3333-3333-333333333333",
      descricao: "Entrais mensal",
    }),
  );

  assert.equal("notification_url" in visto.corpo, false);
});
