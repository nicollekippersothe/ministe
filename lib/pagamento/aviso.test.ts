import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { gateway } from "./index.ts";

/**
 * A leitura do aviso do webhook, pela porta de fora.
 *
 * `assinatura.test.ts` já cobre o manifesto byte a byte. O que falta é o que o
 * webhook enxerga: qual tópico chegou, qual objeto mudou, e qual é a chave que
 * trava a repetição. Os três saem daqui, e errar qualquer um custa dinheiro de
 * um jeito diferente.
 *
 * Vai pelo `gateway` de propósito, e não por `mercadopago.ts`, que é a mesma
 * regra que o resto do produto segue: nada importa o provedor direto.
 */

const SEGREDO = "segredo-do-teste-de-aviso";

function assinar(dataId: string, requestId: string, ts: string, segredo = SEGREDO) {
  const manifesto = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  return createHmac("sha256", segredo).update(manifesto, "utf8").digest("hex");
}

/** Monta corpo e cabeçalhos como o Mercado Pago mandaria, agora. */
function avisoDe(
  corpoObjeto: Record<string, unknown>,
  opcoes: { dataId: string; segredo?: string; ts?: string },
) {
  const requestId = "pedido-de-teste";
  const ts = opcoes.ts ?? String(Math.floor(Date.now() / 1000));
  const v1 = assinar(opcoes.dataId, requestId, ts, opcoes.segredo);

  return {
    corpo: JSON.stringify(corpoObjeto),
    cabecalhos: new Headers({
      "x-signature": `ts=${ts},v1=${v1}`,
      "x-request-id": requestId,
    }),
  };
}

/**
 * Roda o corpo com a variável do segredo trocada, e devolve ao que era.
 *
 * O `await` dentro do try é obrigatório: sem ele o `finally` devolveria a
 * variável antes de a promessa resolver, e o teste do segredo ausente passaria
 * verde sem nunca ter tirado o segredo.
 */
async function comSegredo<T>(
  valor: string | undefined,
  corpo: () => Promise<T>,
): Promise<T> {
  const antes = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (valor === undefined) delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
  else process.env.MERCADOPAGO_WEBHOOK_SECRET = valor;
  try {
    return await corpo();
  } finally {
    if (antes === undefined) delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    else process.env.MERCADOPAGO_WEBHOOK_SECRET = antes;
  }
}

test("o aviso de pagamento chega com o tópico e o objeto separados", async () => {
  const { corpo, cabecalhos } = avisoDe(
    {
      id: "evento-1",
      type: "payment",
      action: "payment.updated",
      data: { id: "9876543210" },
    },
    { dataId: "9876543210" },
  );

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(corpo, cabecalhos),
  );

  assert.ok(aviso);
  assert.equal(aviso.tipo, "pagamento");
  assert.equal(aviso.idExterno, "9876543210");
  assert.equal(aviso.acao, "payment.updated");
});

test("a fatura da recorrência tem tópico próprio, que é quem estende o plano", async () => {
  const { corpo, cabecalhos } = avisoDe(
    {
      id: "evento-2",
      type: "subscription_authorized_payment",
      data: { id: "44556677" },
    },
    { dataId: "44556677" },
  );

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(corpo, cabecalhos),
  );

  assert.equal(aviso?.tipo, "cobranca_da_assinatura");
});

test("o preapproval chega como assinatura", async () => {
  const { corpo, cabecalhos } = avisoDe(
    {
      id: "evento-3",
      type: "subscription_preapproval",
      data: { id: "2c93808..." },
    },
    { dataId: "2c93808..." },
  );

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(corpo, cabecalhos),
  );

  assert.equal(aviso?.tipo, "assinatura");
});

/**
 * A distinção que custa dinheiro se sair errada.
 *
 * O mesmo pagamento gera vários avisos ao longo da vida: aprovado hoje,
 * estornado em outubro. Os dois carregam o mesmo `data.id`, e travar a
 * idempotência por ele faria o estorno ser engolido como repetição do
 * aprovado, deixando no ar quem pediu o dinheiro de volta.
 */
test("a chave da trava é o id do aviso, e não o do objeto", async () => {
  const dataId = "1111";

  const aprovado = avisoDe(
    { id: "evento-do-aprovado", type: "payment", data: { id: dataId } },
    { dataId },
  );
  const estornado = avisoDe(
    { id: "evento-do-estorno", type: "payment", data: { id: dataId } },
    { dataId },
  );

  const [a, b] = await comSegredo(SEGREDO, () =>
    Promise.all([
      gateway.lerAviso(aprovado.corpo, aprovado.cabecalhos),
      gateway.lerAviso(estornado.corpo, estornado.cabecalhos),
    ]),
  );

  assert.equal(a?.idExterno, b?.idExterno);
  assert.notEqual(a?.idDoEvento, b?.idDoEvento);
  assert.equal(a?.idDoEvento, "evento-do-aprovado");
});

test("aviso sem id no topo ainda separa aprovado de estornado", async () => {
  const dataId = "2222";

  const aprovado = avisoDe(
    { type: "payment", action: "payment.created", data: { id: dataId } },
    { dataId },
  );
  const estornado = avisoDe(
    { type: "payment", action: "payment.updated", data: { id: dataId } },
    { dataId },
  );

  const [a, b] = await comSegredo(SEGREDO, () =>
    Promise.all([
      gateway.lerAviso(aprovado.corpo, aprovado.cabecalhos),
      gateway.lerAviso(estornado.corpo, estornado.cabecalhos),
    ]),
  );

  assert.notEqual(a?.idDoEvento, b?.idDoEvento);
});

test("assinatura de outro segredo é recusada", async () => {
  const { corpo, cabecalhos } = avisoDe(
    { id: "evento-4", type: "payment", data: { id: "3333" } },
    { dataId: "3333", segredo: "outro-segredo" },
  );

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(corpo, cabecalhos),
  );

  assert.equal(aviso, null);
});

test("corpo adulterado depois de assinado é recusado", async () => {
  const { cabecalhos } = avisoDe(
    { id: "evento-5", type: "payment", data: { id: "4444" } },
    { dataId: "4444" },
  );

  // Mesma assinatura, outro objeto. É a tentativa mais óbvia: pegar um aviso
  // legítimo e trocar o id para o do próprio negócio.
  const trocado = JSON.stringify({
    id: "evento-5",
    type: "payment",
    data: { id: "5555" },
  });

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(trocado, cabecalhos),
  );

  assert.equal(aviso, null);
});

test("carimbo de tempo velho é recusado, contra reenvio gravado", async () => {
  const velho = String(Math.floor(Date.now() / 1000) - 60 * 60);
  const { corpo, cabecalhos } = avisoDe(
    { id: "evento-6", type: "payment", data: { id: "6666" } },
    { dataId: "6666", ts: velho },
  );

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(corpo, cabecalhos),
  );

  assert.equal(aviso, null);
});

/**
 * Fechar por falta de configuração é o lado certo deste erro: um webhook que
 * aceita tudo quando a variável some deixa qualquer um marcar a própria conta
 * como paga.
 */
test("sem segredo configurado, nenhum aviso passa", async () => {
  const { corpo, cabecalhos } = avisoDe(
    { id: "evento-7", type: "payment", data: { id: "7777" } },
    { dataId: "7777" },
  );

  const aviso = await comSegredo(undefined, () =>
    gateway.lerAviso(corpo, cabecalhos),
  );

  assert.equal(aviso, null);
});

test("tópico que o produto não usa chega marcado como outro", async () => {
  const { corpo, cabecalhos } = avisoDe(
    { id: "evento-8", type: "merchant_order", data: { id: "8888" } },
    { dataId: "8888" },
  );

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(corpo, cabecalhos),
  );

  assert.equal(aviso?.tipo, "outro");
});

/**
 * O manifesto lê o `data.id` do endereço quando ele vem por lá.
 *
 * A documentação do Mercado Pago descreve o manifesto com o id que chega na
 * URL, e o aviso de verdade traz `?data.id=...&type=payment` no endereço. O
 * corpo é a reserva, porque o simulador do painel manda sem parâmetro nenhum.
 * Os dois costumam trazer o mesmo valor, e quando divergem quem manda é a URL,
 * senão o HMAC sai diferente e o aviso legítimo vira 401.
 */
test("com data.id no endereço, o manifesto usa o do endereço", async () => {
  const { corpo, cabecalhos } = avisoDe(
    { id: "evento-2", type: "payment", data: { id: "do-corpo" } },
    { dataId: "do-endereco" },
  );

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(
      corpo,
      cabecalhos,
      "https://exemplo.test/api/pagamento/webhook?data.id=do-endereco&type=payment",
    ),
  );

  assert.ok(aviso);
  // O id do objeto continua saindo do corpo: quem muda é só o manifesto.
  assert.equal(aviso.idExterno, "do-corpo");
});

test("sem endereço, o manifesto continua saindo do corpo", async () => {
  const { corpo, cabecalhos } = avisoDe(
    { id: "evento-3", type: "payment", data: { id: "do-corpo" } },
    { dataId: "do-corpo" },
  );

  const aviso = await comSegredo(SEGREDO, () =>
    gateway.lerAviso(corpo, cabecalhos),
  );

  assert.ok(aviso);
  assert.equal(aviso.idExterno, "do-corpo");
});
