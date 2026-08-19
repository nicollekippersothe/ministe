import assert from "node:assert/strict";
import { test } from "node:test";
import {
  anterior,
  diaCivil,
  diasDoPeriodo,
  montarSerie,
  pico,
  somar,
} from "./numeros.ts";

const SP = "America/Sao_Paulo";

/** 19 de agosto de 2026, 15h em São Paulo (18h UTC). */
const TARDE = Date.parse("2026-08-19T18:00:00Z");

test("a régua tem um dia por dia, terminando em hoje", () => {
  const regua = diasDoPeriodo(7, SP, TARDE);

  assert.equal(regua.length, 7);
  assert.equal(regua[6], "2026-08-19");
  assert.equal(regua[0], "2026-08-13");
});

/**
 * O caso que o fuso decide.
 *
 * 21h30 em São Paulo é 00h30 do dia seguinte em UTC. Se a régua fosse montada
 * em UTC, "hoje" viraria amanhã e o gráfico inteiro andaria um dia, com o
 * último evento caindo numa barra que ainda não existe.
 */
test("às 21h30 de São Paulo o dia ainda é hoje, e não o de amanhã em UTC", () => {
  const noite = Date.parse("2026-08-19T00:30:00Z"); // 21h30 do dia 18 em SP

  assert.equal(diaCivil(noite, SP), "2026-08-18");
  assert.equal(diaCivil(noite, "UTC"), "2026-08-19");

  const regua = diasDoPeriodo(7, SP, noite);
  assert.equal(regua[6], "2026-08-18");
});

test("dia sem evento entra zerado, em vez de sumir", () => {
  const serie = montarSerie(
    [
      { dia: "2026-08-13", tipo: "visita", total: 3 },
      { dia: "2026-08-19", tipo: "visita", total: 5 },
    ],
    7,
    SP,
    TARDE,
  );

  assert.equal(serie.length, 7);
  assert.equal(serie[0]?.visitas, 3);
  assert.equal(serie[6]?.visitas, 5);
  // Os cinco do meio existem, e existem zerados. Sem isso o gráfico colaria as
  // duas barras e diria que os dias foram seguidos.
  assert.deepEqual(
    serie.slice(1, 6).map((d) => d.visitas),
    [0, 0, 0, 0, 0],
  );
});

test("os três tipos caem em campos separados", () => {
  const serie = montarSerie(
    [
      { dia: "2026-08-19", tipo: "visita", total: 10 },
      { dia: "2026-08-19", tipo: "clique_whatsapp", total: 4 },
      { dia: "2026-08-19", tipo: "clique_acao", total: 1 },
    ],
    7,
    SP,
    TARDE,
  );

  assert.deepEqual(serie[6], {
    dia: "2026-08-19",
    visitas: 10,
    whatsapp: 4,
    acao: 1,
  });
});

/**
 * O banco tem uma restrição que só aceita os três tipos, então isto aqui é
 * cinto e suspensório. Ele existe porque o dia em que um quarto tipo entrar no
 * schema, esta camada precisa ignorar em silêncio em vez de somar no lugar
 * errado ou estourar a tela do dono.
 */
test("tipo desconhecido é ignorado, sem derrubar a série", () => {
  const serie = montarSerie(
    [
      { dia: "2026-08-19", tipo: "visita", total: 2 },
      { dia: "2026-08-19", tipo: "clique_carrinho", total: 99 },
    ],
    7,
    SP,
    TARDE,
  );

  assert.equal(serie[6]?.visitas, 2);
  assert.equal(somar(serie).visitas + somar(serie).whatsapp + somar(serie).acao, 2);
});

test("linha de dia fora da régua é descartada", () => {
  const serie = montarSerie(
    [{ dia: "2020-01-01", tipo: "visita", total: 500 }],
    7,
    SP,
    TARDE,
  );

  assert.equal(somar(serie).visitas, 0);
});

test("total negativo ou ilegível é descartado", () => {
  const serie = montarSerie(
    [
      { dia: "2026-08-19", tipo: "visita", total: -5 },
      { dia: "2026-08-19", tipo: "visita", total: Number.NaN },
      { dia: "2026-08-19", tipo: "visita", total: 7 },
    ],
    7,
    SP,
    TARDE,
  );

  assert.equal(serie[6]?.visitas, 7);
});

test("somar junta o período inteiro", () => {
  const serie = montarSerie(
    [
      { dia: "2026-08-17", tipo: "visita", total: 3 },
      { dia: "2026-08-18", tipo: "visita", total: 4 },
      { dia: "2026-08-18", tipo: "clique_whatsapp", total: 2 },
    ],
    7,
    SP,
    TARDE,
  );

  assert.deepEqual(somar(serie), { visitas: 7, whatsapp: 2, acao: 0 });
});

/**
 * A conta do período anterior.
 *
 * Duas janelas de instante e uma subtração. Cortar a janela dobrada pela data
 * civil erraria no dia da fronteira, que cai dos dois lados.
 */
test("o período anterior sai da subtração das duas janelas", () => {
  const trintaDias = { visitas: 100, whatsapp: 20, acao: 5 };
  const quinzeDias = { visitas: 70, whatsapp: 15, acao: 5 };

  assert.deepEqual(anterior(trintaDias, quinzeDias), {
    visitas: 30,
    whatsapp: 5,
    acao: 0,
  });
});

/**
 * Pode acontecer de a janela maior vir menor que a menor, se as duas consultas
 * caírem em lados opostos de uma escrita. Número negativo na tela seria pior
 * que zero, e a comparação com zero é honesta: o período anterior teve o que
 * a consulta conseguiu ver.
 */
test("a subtração nunca devolve negativo", () => {
  assert.deepEqual(
    anterior({ visitas: 1, whatsapp: 0, acao: 0 }, { visitas: 4, whatsapp: 0, acao: 0 }),
    { visitas: 0, whatsapp: 0, acao: 0 },
  );
});

test("o pico é o maior de qualquer tipo, e nunca zero", () => {
  const serie = montarSerie(
    [
      { dia: "2026-08-18", tipo: "visita", total: 9 },
      { dia: "2026-08-19", tipo: "clique_whatsapp", total: 12 },
    ],
    7,
    SP,
    TARDE,
  );

  assert.equal(pico(serie), 12);
  // Período sem evento nenhum é o estado mais comum, e é o que dividiria por
  // zero na conta de altura da barra.
  assert.equal(pico(montarSerie([], 7, SP, TARDE)), 1);
});

test("a régua de 90 dias tem 90 dias", () => {
  const regua = diasDoPeriodo(90, SP, TARDE);
  assert.equal(regua.length, 90);
  assert.equal(regua[0], "2026-05-22");
  assert.equal(regua[89], "2026-08-19");
});

/**
 * A virada de mês e de ano é onde aritmética de data caseira costuma quebrar.
 */
test("a régua atravessa a virada do ano", () => {
  const anoNovo = Date.parse("2027-01-02T15:00:00Z");
  const regua = diasDoPeriodo(5, SP, anoNovo);

  assert.deepEqual(regua, [
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
  ]);
});
