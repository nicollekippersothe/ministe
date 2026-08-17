import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FUSO_PADRAO,
  diasNoMes,
  fimDoPeriodo,
  fimDoPeriodoIso,
  fimDoTeste,
  somarDias,
  somarMeses,
} from "./ciclo.ts";

/**
 * Um instante a partir da hora do relógio em São Paulo.
 *
 * O Brasil largou o horário de verão em 2019, então o fuso é -03:00 fixo em
 * toda data que este teste usa, e escrever o deslocamento na mão deixa cada
 * caso legível sem depender da própria função que está sendo conferida.
 */
const spo = (civil: string) => Date.parse(`${civil}-03:00`);

const relogio = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_PADRAO,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** O instante de volta em "AAAA-MM-DD HH:MM:SS", na hora de São Paulo. */
function emSaoPaulo(ms: number): string {
  const p = relogio.formatToParts(new Date(ms));
  const v = (tipo: string) => p.find((x) => x.type === tipo)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")} ${v("hour")}:${v("minute")}:${v("second")}`;
}

test("mês cheio anda para o mesmo dia do mês seguinte", () => {
  assert.equal(
    emSaoPaulo(fimDoPeriodo(spo("2026-06-15T14:30:00"), "mensal")),
    "2026-07-15 14:30:00",
  );
});

test("31 de janeiro mais um mês cai no fim de fevereiro", () => {
  assert.equal(
    emSaoPaulo(fimDoPeriodo(spo("2026-01-31T10:00:00"), "mensal")),
    "2026-02-28 10:00:00",
  );
});

test("em ano bissexto o mesmo 31 de janeiro ganha o dia 29", () => {
  assert.equal(
    emSaoPaulo(fimDoPeriodo(spo("2024-01-31T10:00:00"), "mensal")),
    "2024-02-29 10:00:00",
  );
});

test("31 de março mais um mês cai em 30 de abril", () => {
  assert.equal(
    emSaoPaulo(fimDoPeriodo(spo("2026-03-31T08:00:00"), "mensal")),
    "2026-04-30 08:00:00",
  );
});

test("29 de fevereiro mais um ano cai em 28 de fevereiro", () => {
  assert.equal(
    emSaoPaulo(fimDoPeriodo(spo("2024-02-29T12:00:00"), "anual")),
    "2025-02-28 12:00:00",
  );
});

test("o anual anda doze meses e guarda a hora do relógio", () => {
  assert.equal(
    emSaoPaulo(fimDoPeriodo(spo("2026-06-15T14:30:00"), "anual")),
    "2027-06-15 14:30:00",
  );
});

test("dezembro vira o ano junto", () => {
  assert.equal(
    emSaoPaulo(fimDoPeriodo(spo("2026-12-31T23:40:00"), "mensal")),
    "2027-01-31 23:40:00",
  );
});

/*
 * O caso que separa a conta civil no fuso certo da conta feita em UTC.
 *
 * 30 de janeiro, 22:00 em São Paulo, é 31 de janeiro, 01:00 em UTC. Quem faz a
 * conta com as partes UTC soma um mês em cima do dia 31, prende no dia 28 e
 * chega em 27 de fevereiro na hora de São Paulo, um dia inteiro antes. Numa
 * assinatura, esse dia a menos é a página de alguém saindo do ar cedo.
 */
test("a conta é civil no fuso do negócio, e o UTC fica de fora", () => {
  const inicio = spo("2026-01-30T22:00:00");
  assert.equal(new Date(inicio).toISOString(), "2026-01-31T01:00:00.000Z");
  assert.equal(emSaoPaulo(fimDoPeriodo(inicio, "mensal")), "2026-02-28 22:00:00");
});

test("o fim do teste soma sete dias e mantém a hora", () => {
  assert.equal(
    emSaoPaulo(fimDoTeste(spo("2026-01-28T09:15:00"))),
    "2026-02-04 09:15:00",
  );
});

test("o teste que começa perto da virada do mês atravessa o mês", () => {
  assert.equal(
    emSaoPaulo(fimDoTeste(spo("2026-02-25T23:59:00"))),
    "2026-03-04 23:59:00",
  );
});

/*
 * O dia âncora é perdido no arredondamento, de propósito. Quem quer manter o
 * 31 conta sempre a partir da primeira cobrança, com o número de meses
 * acumulado, em vez de empilhar um período em cima do outro.
 */
test("encadear períodos anda diferente de contar da âncora", () => {
  const inicio = spo("2026-01-31T10:00:00");

  const primeiro = fimDoPeriodo(inicio, "mensal");
  const encadeado = fimDoPeriodo(primeiro, "mensal");
  assert.equal(emSaoPaulo(encadeado), "2026-03-28 10:00:00");

  const daAncora = somarMeses(inicio, 2);
  assert.equal(emSaoPaulo(daAncora), "2026-03-31 10:00:00");
});

test("somar zero mês devolve o mesmo instante", () => {
  const inicio = spo("2026-05-17T07:08:09");
  assert.equal(somarMeses(inicio, 0), inicio);
  assert.equal(somarDias(inicio, 0), inicio);
});

test("o milissegundo do instante sobrevive à conta", () => {
  const inicio = spo("2026-05-17T07:08:09") + 456;
  assert.equal(somarMeses(inicio, 1) % 1000, 456);
  assert.equal(somarDias(inicio, 7) % 1000, 456);
});

test("meses negativos andam para trás com a mesma regra", () => {
  assert.equal(
    emSaoPaulo(somarMeses(spo("2026-03-31T10:00:00"), -1)),
    "2026-02-28 10:00:00",
  );
});

test("o fuso é parâmetro, então dá para contar noutro lugar", () => {
  const inicio = Date.parse("2026-01-31T23:00:00Z");
  const fim = somarMeses(inicio, 1, "UTC");
  assert.equal(new Date(fim).toISOString(), "2026-02-28T23:00:00.000Z");
});

test("diasNoMes conhece bissexto, inclusive a regra dos centenários", () => {
  assert.equal(diasNoMes(2026, 2), 28);
  assert.equal(diasNoMes(2024, 2), 29);
  assert.equal(diasNoMes(2000, 2), 29);
  assert.equal(diasNoMes(1900, 2), 28);
  assert.equal(diasNoMes(2026, 4), 30);
  assert.equal(diasNoMes(2026, 12), 31);
});

test("a versão ISO é o que a coluna timestamptz espera", () => {
  const iso = fimDoPeriodoIso(spo("2026-01-31T10:00:00"), "mensal");
  assert.equal(iso, "2026-02-28T13:00:00.000Z");
  assert.ok(Number.isFinite(Date.parse(iso)));
});
