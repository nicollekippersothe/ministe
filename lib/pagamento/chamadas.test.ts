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

type Espiada = { url: string; corpo: Record<string, unknown>; chave: string | null };

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
