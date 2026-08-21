import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
  JANELA_DO_AVISO_SEGUNDOS,
  conferirAssinatura,
  conferirAssinaturaDetalhe,
  lerCabecalhoDeAssinatura,
  montarManifesto,
} from "./assinatura.ts";

const SEGREDO = "segredo-de-teste-do-entrais";
const TS = "1735689600";
const AGORA = Number(TS) * 1000;
const ID = "123456789";
const PEDIDO = "b7b8c9d0-1111-2222-3333-444455556666";

/**
 * Assina do jeito que o Mercado Pago assina.
 *
 * Escrito à mão aqui em vez de chamar `montarManifesto`, de propósito: se a
 * montagem do manifesto mudar por acidente, este lado do teste continua com a
 * regra antiga e a conferência começa a falhar, que é exatamente o alarme que
 * a gente quer. Os textos de manifesto conferidos mais abaixo são o outro
 * lado do mesmo alarme.
 */
function assinar(
  dataId: string | null,
  requestId: string | null,
  ts: string,
  segredo = SEGREDO,
): string {
  const pedacos: string[] = [];
  if (dataId) pedacos.push(`id:${dataId.toLowerCase()}`);
  if (requestId) pedacos.push(`request-id:${requestId}`);
  pedacos.push(`ts:${ts}`);
  const manifesto = `${pedacos.join(";")};`;
  const v1 = createHmac("sha256", segredo).update(manifesto, "utf8").digest("hex");
  return `ts=${ts},v1=${v1}`;
}

/*
 * O manifesto, byte a byte.
 *
 * Estes valores vêm da documentação do Mercado Pago e batem com o código dos
 * SDKs oficiais de Node, Python, PHP, Ruby, Go, Java e C#, que constroem a
 * mesma string. Um espaço, um dois pontos ou o ponto e vírgula final fora do
 * lugar aqui derruba todo webhook do produto de uma vez.
 */
test("o manifesto sai no formato exato do Mercado Pago", () => {
  assert.equal(
    montarManifesto("123456789", "req-1", "1735689600"),
    "id:123456789;request-id:req-1;ts:1735689600;",
  );
});

test("o manifesto termina em ponto e vírgula, inclusive depois do ts", () => {
  assert.ok(montarManifesto("a", "b", "1").endsWith(";"));
  assert.equal(montarManifesto("a", "b", "1"), "id:a;request-id:b;ts:1;");
});

test("o data.id vai em minúsculas, que é o caso dos ids novos", () => {
  assert.equal(
    montarManifesto("ORD01JQ4S4KY8HWQ6NA5PXB65B3D3", "req-1", "1735689600"),
    "id:ord01jq4s4ky8hwq6na5pxb65b3d3;request-id:req-1;ts:1735689600;",
  );
});

/*
 * Pedaço com valor vazio sai inteiro: o rótulo e o ponto e vírgula dele somem
 * junto. É o que a documentação manda e o que os SDKs fazem. Deixar
 * "request-id:;" no meio é a variação mais comum de quem escreve isto de
 * cabeça, e o HMAC sai diferente sem nenhum aviso.
 */
test("pedaço ausente sai do manifesto junto com o rótulo", () => {
  assert.equal(montarManifesto("123", null, "1735689600"), "id:123;ts:1735689600;");
  assert.equal(
    montarManifesto(null, "req-1", "1735689600"),
    "request-id:req-1;ts:1735689600;",
  );
  assert.equal(montarManifesto(null, null, "1735689600"), "ts:1735689600;");
  assert.equal(montarManifesto("", "", "1735689600"), "ts:1735689600;");
  assert.equal(montarManifesto(undefined, undefined, "1"), "ts:1;");
});

test("o cabeçalho é lido por chave, e a ordem é do provedor", () => {
  assert.deepEqual(lerCabecalhoDeAssinatura("ts=1700,v1=abc"), {
    ts: "1700",
    v1: "abc",
  });
  assert.deepEqual(lerCabecalhoDeAssinatura("v1=abc,ts=1700"), {
    ts: "1700",
    v1: "abc",
  });
  assert.deepEqual(lerCabecalhoDeAssinatura(" ts = 1700 , v1 = ABC "), {
    ts: "1700",
    v1: "abc",
  });
  assert.deepEqual(lerCabecalhoDeAssinatura("ts=1700,v2=zzz,v1=abc"), {
    ts: "1700",
    v1: "abc",
  });
});

test("cabeçalho incompleto vira nulo, e nulo é 401", () => {
  assert.equal(lerCabecalhoDeAssinatura(null), null);
  assert.equal(lerCabecalhoDeAssinatura(undefined), null);
  assert.equal(lerCabecalhoDeAssinatura(""), null);
  assert.equal(lerCabecalhoDeAssinatura("ts=1700"), null);
  assert.equal(lerCabecalhoDeAssinatura("v1=abc"), null);
  assert.equal(lerCabecalhoDeAssinatura("qualquer coisa"), null);
});

const base = {
  xRequestId: PEDIDO,
  dataId: ID,
  segredo: SEGREDO,
  agoraMs: AGORA,
};

test("o aviso de verdade passa", () => {
  assert.equal(
    conferirAssinatura({ ...base, xSignature: assinar(ID, PEDIDO, TS) }),
    true,
  );
});

test("o v1 em maiúsculas continua passando", () => {
  const bruto = assinar(ID, PEDIDO, TS);
  const [parteTs, parteV1] = bruto.split(",");
  const gritando = `${parteTs},${parteV1.toUpperCase()}`;
  assert.equal(conferirAssinatura({ ...base, xSignature: gritando }), true);
});

test("segredo trocado reprova", () => {
  assert.equal(
    conferirAssinatura({
      ...base,
      xSignature: assinar(ID, PEDIDO, TS, "outro-segredo"),
    }),
    false,
  );
});

test("segredo em branco reprova, que é o lado certo de uma configuração faltando", () => {
  const xSignature = assinar(ID, PEDIDO, TS);
  assert.equal(conferirAssinatura({ ...base, xSignature, segredo: "" }), false);
  assert.equal(
    conferirAssinatura({ ...base, xSignature, segredo: undefined }),
    false,
  );
  assert.equal(conferirAssinatura({ ...base, xSignature, segredo: null }), false);
});

test("mexer no id, no pedido ou no ts reprova", () => {
  const xSignature = assinar(ID, PEDIDO, TS);
  assert.equal(conferirAssinatura({ ...base, xSignature, dataId: "999" }), false);
  assert.equal(
    conferirAssinatura({ ...base, xSignature, xRequestId: "outro" }),
    false,
  );
  assert.equal(conferirAssinatura({ ...base, xSignature, dataId: null }), false);
  assert.equal(conferirAssinatura({ ...base, xSignature, xRequestId: null }), false);
});

test("o id maiúsculo do aviso bate com o id minúsculo do manifesto", () => {
  const maiusculo = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";
  assert.equal(
    conferirAssinatura({
      ...base,
      dataId: maiusculo,
      xSignature: assinar(maiusculo, PEDIDO, TS),
    }),
    true,
  );
});

test("aviso sem x-request-id passa, desde que o manifesto também deixe fora", () => {
  assert.equal(
    conferirAssinatura({
      ...base,
      xRequestId: null,
      xSignature: assinar(ID, null, TS),
    }),
    true,
  );
});

/*
 * A janela contra repetição. Quem grampeia um aviso legítimo consegue reenviar
 * o pacote inteiro, com a assinatura certa, quantas vezes quiser: o carimbo de
 * tempo é a única coisa que envelhece.
 */
test("aviso velho demais reprova", () => {
  const xSignature = assinar(ID, PEDIDO, TS);
  const seisMinutos = AGORA + 6 * 60 * 1000;
  assert.equal(conferirAssinatura({ ...base, xSignature, agoraMs: seisMinutos }), false);
});

test("aviso carimbado no futuro reprova do mesmo jeito", () => {
  const xSignature = assinar(ID, PEDIDO, TS);
  const seisMinutosAntes = AGORA - 6 * 60 * 1000;
  assert.equal(
    conferirAssinatura({ ...base, xSignature, agoraMs: seisMinutosAntes }),
    false,
  );
});

test("a borda dos cinco minutos", () => {
  const xSignature = assinar(ID, PEDIDO, TS);
  const janela = JANELA_DO_AVISO_SEGUNDOS * 1000;
  assert.equal(JANELA_DO_AVISO_SEGUNDOS, 300);
  assert.equal(
    conferirAssinatura({ ...base, xSignature, agoraMs: AGORA + janela }),
    true,
  );
  assert.equal(
    conferirAssinatura({ ...base, xSignature, agoraMs: AGORA + janela + 1 }),
    false,
  );
});

test("a janela é ajustável, para o teste do provedor com carimbo fixo", () => {
  const xSignature = assinar(ID, PEDIDO, TS);
  assert.equal(
    conferirAssinatura({
      ...base,
      xSignature,
      agoraMs: AGORA + 60 * 60 * 1000,
      janelaSegundos: 2 * 60 * 60,
    }),
    true,
  );
});

test("carimbo de tempo ilegível reprova, sem exceção", () => {
  for (const ts of ["", "abc", "-1", "0", "1e9", "17356896001735689600123456"]) {
    const v1 = createHmac("sha256", SEGREDO)
      .update(`id:${ID};request-id:${PEDIDO};ts:${ts};`, "utf8")
      .digest("hex");
    assert.equal(
      conferirAssinatura({ ...base, xSignature: `ts=${ts},v1=${v1}` }),
      false,
      `ts ${ts} passou`,
    );
  }
});

/*
 * A documentação dos SDKs oficiais descreve o `ts` como milissegundo em alguns
 * lugares e o código deles trata como segundo. O manifesto usa a string crua
 * nos dois casos, então o HMAC fica igual, e a leitura em milissegundo muda só
 * a conta da janela. Aceitar os dois evita um webhook que reprova tudo se o
 * provedor mudar a unidade.
 */
test("carimbo em milissegundo também é entendido", () => {
  const tsMs = String(AGORA);
  assert.equal(
    conferirAssinatura({ ...base, xSignature: assinar(ID, PEDIDO, tsMs) }),
    true,
  );
});

test("v1 com tamanho estranho reprova, sem levantar exceção", () => {
  const curto = `ts=${TS},v1=abc`;
  const longo = `ts=${TS},v1=${"a".repeat(200)}`;
  assert.equal(conferirAssinatura({ ...base, xSignature: curto }), false);
  assert.equal(conferirAssinatura({ ...base, xSignature: longo }), false);
});

test("cabeçalho ausente reprova", () => {
  assert.equal(conferirAssinatura({ ...base, xSignature: null }), false);
  assert.equal(conferirAssinatura({ ...base, xSignature: undefined }), false);
  assert.equal(conferirAssinatura({ ...base, xSignature: "" }), false);
});

/* -------------------------------------------------------------------------- */
/* O motivo da recusa, que é o que vai para o log                             */
/* -------------------------------------------------------------------------- */

/**
 * Cada motivo aponta para um conserto diferente, e do lado de fora os quatro
 * parecem a mesma coisa: 401 sem corpo. O teste trava a separação, porque um
 * motivo que passasse a responder outro deixaria a próxima investigação
 * seguindo a pista errada.
 */

test("segredo ausente e HMAC diferente são motivos diferentes", () => {
  const agoraMs = 1_700_000_000_000;
  const ts = String(agoraMs / 1000);

  const semSegredo = conferirAssinaturaDetalhe({
    xSignature: `ts=${ts},v1=abc`,
    xRequestId: "req",
    dataId: "123",
    segredo: "",
    agoraMs,
  });
  assert.equal(semSegredo.motivo, "segredo_ausente");
  assert.equal(semSegredo.tamanhoDoSegredo, 0);

  const errado = conferirAssinaturaDetalhe({
    xSignature: `ts=${ts},v1=${"a".repeat(64)}`,
    xRequestId: "req",
    dataId: "123",
    segredo: "segredo-de-teste",
    agoraMs,
  });
  assert.equal(errado.motivo, "hmac_diferente");
  assert.equal(errado.manifesto, `id:123;request-id:req;ts:${ts};`);
  assert.equal(errado.tamanhoDoSegredo, 16);
});

test("carimbo velho vira fora_da_janela, com o atraso em segundos", () => {
  const agoraMs = 1_700_000_000_000;
  const ts = String(agoraMs / 1000 - 3600);

  const velho = conferirAssinaturaDetalhe({
    xSignature: `ts=${ts},v1=${"a".repeat(64)}`,
    xRequestId: "req",
    dataId: "123",
    segredo: "segredo-de-teste",
    agoraMs,
  });

  assert.equal(velho.motivo, "fora_da_janela");
  assert.equal(velho.atrasoS, 3600);
  // O manifesto fica de fora aqui de propósito: sem carimbo válido ele nem
  // chega a ser montado, e mostrar um manifesto de mentira no log confundiria.
  assert.equal(velho.manifesto, undefined);
});

test("cabeçalho ausente é o terceiro motivo, e nunca hmac_diferente", () => {
  const r = conferirAssinaturaDetalhe({
    xSignature: null,
    xRequestId: "req",
    dataId: "123",
    segredo: "segredo-de-teste",
    agoraMs: 1_700_000_000_000,
  });
  assert.equal(r.motivo, "cabecalho_ausente");
});

test("assinatura boa devolve conferida, e o mesmo manifesto do log", () => {
  const agoraMs = 1_700_000_000_000;
  const ts = String(agoraMs / 1000);
  const segredo = "segredo-de-teste";
  const manifesto = `id:abc123;request-id:req;ts:${ts};`;
  const v1 = createHmac("sha256", segredo).update(manifesto, "utf8").digest("hex");

  const r = conferirAssinaturaDetalhe({
    xSignature: `ts=${ts},v1=${v1}`,
    xRequestId: "req",
    dataId: "abc123",
    segredo,
    agoraMs,
  });

  assert.equal(r.ok, true);
  assert.equal(r.motivo, "conferida");
  assert.equal(r.manifesto, manifesto);
});
