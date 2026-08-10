import assert from "node:assert/strict";
import { test } from "node:test";
import { diaCivilDe, estadoAgora, montarJanela } from "./horarios.ts";
import type { Intervalo } from "./tipos.ts";

const FUSO = "America/Sao_Paulo";

// Mesmos horarios do negocio de exemplo: terca a sexta corrido, sexta com um
// turno da noite que vira o dia, sabado partido pelo almoco, domingo e segunda
// fechado.
const HORARIOS: Intervalo[] = [
  { dia: 2, abre: "09:00", fecha: "18:00" },
  { dia: 3, abre: "09:00", fecha: "18:00" },
  { dia: 4, abre: "09:00", fecha: "18:00" },
  { dia: 5, abre: "09:00", fecha: "18:00" },
  { dia: 5, abre: "19:00", fecha: "00:30" },
  { dia: 6, abre: "09:00", fecha: "13:00" },
  { dia: 6, abre: "15:00", fecha: "19:00" },
];

/** Monta um instante a partir da hora local de Sao Paulo (UTC-3, sem verao). */
function emSaoPaulo(iso: string): number {
  return new Date(`${iso}-03:00`).getTime();
}

function selo(iso: string) {
  const agora = emSaoPaulo(iso);
  const janela = montarJanela(HORARIOS, FUSO, agora);
  return estadoAgora(janela, agora, diaCivilDe(agora, FUSO));
}

test("terça de manhã está aberto e mostra a hora de fechar", () => {
  // 2026-08-11 é uma terça.
  const e = selo("2026-08-11T10:00:00");
  assert.equal(e.aberto, true);
  assert.equal(e.titulo, "Aberto agora");
  assert.equal(e.detalhe, "Fecha às 18:00");
});

test("segunda fechada aponta a abertura de amanhã", () => {
  const e = selo("2026-08-10T10:00:00");
  assert.equal(e.aberto, false);
  assert.equal(e.detalhe, "Abre amanhã às 09:00");
});

test("domingo aponta o dia da semana, não amanhã", () => {
  const e = selo("2026-08-09T10:00:00");
  assert.equal(e.aberto, false);
  assert.equal(e.detalhe, "Abre terça às 09:00");
});

test("sexta às 23h continua aberto no turno que vira o dia", () => {
  const e = selo("2026-08-14T23:00:00");
  assert.equal(e.aberto, true);
  assert.equal(e.detalhe, "Fecha às 00:30");
});

test("sábado 00:10 ainda está aberto, vindo do turno de sexta", () => {
  const e = selo("2026-08-15T00:10:00");
  assert.equal(e.aberto, true);
  assert.equal(e.detalhe, "Fecha às 00:30");
});

test("sábado 00:40 já fechou e abre no mesmo dia", () => {
  const e = selo("2026-08-15T00:40:00");
  assert.equal(e.aberto, false);
  assert.equal(e.detalhe, "Abre às 09:00");
});

test("sábado no almoço mostra a volta do intervalo da tarde", () => {
  const e = selo("2026-08-15T14:00:00");
  assert.equal(e.aberto, false);
  assert.equal(e.detalhe, "Abre às 15:00");
});

test("sábado à noite pula domingo e segunda", () => {
  const e = selo("2026-08-15T20:00:00");
  assert.equal(e.aberto, false);
  assert.equal(e.detalhe, "Abre terça às 09:00");
});

test("sexta 18:30 está no intervalo entre os dois turnos", () => {
  const e = selo("2026-08-14T18:30:00");
  assert.equal(e.aberto, false);
  assert.equal(e.detalhe, "Abre às 19:00");
});

test("negócio sem horário cadastrado não gera segmento", () => {
  const agora = emSaoPaulo("2026-08-11T10:00:00");
  assert.equal(montarJanela([], FUSO, agora).length, 0);
});

test("o fuso do negócio manda, não o do servidor", () => {
  // Manaus é uma hora atrás de São Paulo. Às 09:30 em São Paulo ainda são
  // 08:30 em Manaus, então um negócio de lá continua fechado.
  const agora = emSaoPaulo("2026-08-11T09:30:00");
  const janela = montarJanela(HORARIOS, "America/Manaus", agora);
  const e = estadoAgora(janela, agora, diaCivilDe(agora, "America/Manaus"));
  assert.equal(e.aberto, false);
  assert.equal(e.detalhe, "Abre às 09:00");
});
