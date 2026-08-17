/**
 * Manda um aviso assinado para o webhook de pagamento, como o Mercado Pago
 * mandaria.
 *
 * Serve para duas coisas ao mesmo tempo, e a segunda é a que vale mais:
 *
 *   1. Exercitar o webhook sem depender de cartão, de sandbox nem de túnel
 *      para a internet. Roda contra `npm run dev` na sua máquina.
 *   2. Testar o código da assinatura pelo lado de fora. O HMAC daqui é
 *      calculado de forma independente, com `node:crypto` direto, e não
 *      importa nada de `lib/pagamento`. Se o manifesto de lá tiver um ponto e
 *      vírgula a mais, este script recebe 401, que é exatamente o sintoma que
 *      apareceria em produção e que nenhum teste de unidade pega, porque o
 *      teste de unidade compara o manifesto com ele mesmo.
 *
 * Como rodar:
 *
 *   npm run dev                        (num terminal)
 *   MERCADOPAGO_WEBHOOK_SECRET=... npm run aviso -- payment 123456
 *
 * O segredo tem que ser o mesmo que está no `.env.local`, senão o webhook
 * recusa com 401, e recusar é o comportamento certo.
 *
 * Rodar duas vezes com o mesmo id de evento é o teste de idempotência: a
 * segunda tem que voltar 200 sem tocar em nada, pela trava de
 * `avisos_pagamento`. Com `--novo` a cada chamada o id muda, e aí o webhook
 * processa de novo, que é o caminho para conferir o `greatest`.
 */
import { createHmac, randomUUID } from "node:crypto";

const TOPICOS = {
  payment: "payment",
  assinatura: "subscription_preapproval",
  recorrente: "subscription_authorized_payment",
};

const args = process.argv.slice(2).filter((a) => a !== "--novo");
const novo = process.argv.includes("--novo");

const apelido = args[0] ?? "payment";
const topico = TOPICOS[apelido];
const dataId = args[1] ?? "1234567890";

if (!topico) {
  console.error(
    `Tópico desconhecido: ${apelido}. Use um destes: ${Object.keys(TOPICOS).join(", ")}`,
  );
  process.exit(1);
}

const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
if (!segredo) {
  console.error(
    "Falta MERCADOPAGO_WEBHOOK_SECRET. É o mesmo valor do .env.local, e ele nunca entra neste arquivo.",
  );
  process.exit(1);
}

const base = process.env.BASE ?? "http://localhost:3000";
const endereco = `${base}/api/pagamento/webhook`;

// O id do aviso, que é o que trava a idempotência. Fixo por padrão, de
// propósito: rodar duas vezes tem que dar "aviso repetido".
const idDoEvento = novo ? randomUUID() : `aviso-falso-${apelido}-${dataId}`;
const requestId = `pedido-falso-${dataId}`;
const ts = String(Math.floor(Date.now() / 1000));

const corpo = JSON.stringify({
  id: idDoEvento,
  type: topico,
  action: `${topico}.updated`,
  date_created: new Date().toISOString(),
  live_mode: false,
  data: { id: dataId },
});

/**
 * O manifesto, escrito à mão a partir da documentação do Mercado Pago.
 *
 * Três detalhes, e os três são causa conhecida de assinatura que nunca bate: a
 * ordem dos campos, o ponto e vírgula no fim, e o `data.id` em minúsculas.
 * Estar escrito duas vezes no repositório, em arquivos que não se importam, é
 * o ponto: é isso que faz o teste ser um teste.
 */
const manifesto = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
const v1 = createHmac("sha256", segredo).update(manifesto, "utf8").digest("hex");

console.log(`aviso   ${apelido} (${topico})`);
console.log(`objeto  ${dataId}`);
console.log(`evento  ${idDoEvento}`);
console.log(`destino ${endereco}`);

const resposta = await fetch(endereco, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-signature": `ts=${ts},v1=${v1}`,
    "x-request-id": requestId,
  },
  body: corpo,
});

const texto = await resposta.text();
console.log(`\nresposta ${resposta.status}${texto ? ` ${texto}` : ""}`);

if (resposta.status === 401) {
  console.log(
    "\n401 quer dizer que o HMAC saiu diferente. Ou o segredo daqui é outro,\n" +
      "ou o manifesto de lib/pagamento/assinatura.ts mudou de formato.",
  );
}

// 200 é o esperado em quase tudo: aplicado, repetido, ou ignorado de propósito.
// 500 é reentrega, e aí o motivo está no log do servidor.
process.exit(resposta.ok ? 0 : 1);
