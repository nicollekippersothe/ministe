import assert from "node:assert/strict";
import { test } from "node:test";
import { encaixa, horariosLivres, type Disponibilidade } from "./agenda.ts";
import { epochDeCivil } from "./horarios.ts";

const SP = "America/Sao_Paulo";

// 5 de janeiro de 2026 é uma segunda-feira. Todas as contas partem dela, no
// relógio de São Paulo, montadas pela mesma função de fuso que o código usa.
const seg = (h: number, m = 0) => epochDeCivil(2026, 1, 5, h, m, SP);
const SEGUNDA = 1;

const das9as12: Disponibilidade[] = [
  { diaSemana: SEGUNDA, abre: "09:00", fecha: "12:00" },
];

test("uma janela de três horas rende três horários de uma hora", () => {
  const livres = horariosLivres({
    duracaoMin: 60,
    disponibilidade: das9as12,
    ocupados: [],
    fuso: SP,
    agoraMs: seg(8),
    diasAFrente: 1,
  });

  assert.equal(livres.length, 1);
  assert.deepEqual(livres[0].inicios, [seg(9), seg(10), seg(11)]);
});

test("a antecedência mínima corta o horário que já passou da hora", () => {
  const livres = horariosLivres({
    duracaoMin: 60,
    disponibilidade: das9as12,
    ocupados: [],
    fuso: SP,
    agoraMs: seg(9, 30),
    diasAFrente: 1,
  });

  assert.deepEqual(livres[0].inicios, [seg(10), seg(11)]);
});

test("um horário ocupado some da lista, e os vizinhos ficam", () => {
  const livres = horariosLivres({
    duracaoMin: 60,
    disponibilidade: das9as12,
    ocupados: [{ inicioMs: seg(10), fimMs: seg(11) }],
    fuso: SP,
    agoraMs: seg(8),
    diasAFrente: 1,
  });

  assert.deepEqual(livres[0].inicios, [seg(9), seg(11)]);
});

test("o passo decide a granularidade dos horários", () => {
  const livres = horariosLivres({
    duracaoMin: 60,
    passoMin: 30,
    disponibilidade: [{ diaSemana: SEGUNDA, abre: "09:00", fecha: "11:00" }],
    ocupados: [],
    fuso: SP,
    agoraMs: seg(8),
    diasAFrente: 1,
  });

  // 09:00, 09:30 e 10:00 cabem inteiros antes das 11:00; 10:30 estouraria.
  assert.deepEqual(livres[0].inicios, [seg(9), seg(9, 30), seg(10)]);
});

test("dia sem disponibilidade não aparece na lista", () => {
  // Só segunda tem janela; olhando terça e quarta (2 dias a partir de terça),
  // a lista volta vazia em vez de trazer dias vazios.
  const livres = horariosLivres({
    duracaoMin: 60,
    disponibilidade: das9as12,
    ocupados: [],
    fuso: SP,
    agoraMs: epochDeCivil(2026, 1, 6, 8, 0, SP), // terça
    diasAFrente: 2,
  });

  assert.equal(livres.length, 0);
});

test("uma sobreposição parcial já barra o horário", () => {
  // Ocupado das 10:30 às 11:30 pega o fim do slot das 10:00 e o começo do das
  // 11:00, então os dois saem, e sobra só o das 09:00.
  const livres = horariosLivres({
    duracaoMin: 60,
    disponibilidade: das9as12,
    ocupados: [{ inicioMs: seg(10, 30), fimMs: seg(11, 30) }],
    fuso: SP,
    agoraMs: seg(8),
    diasAFrente: 1,
  });

  assert.deepEqual(livres[0].inicios, [seg(9)]);
});

test("encaixa aceita um início livre e devolve o fim", () => {
  const fim = encaixa({
    inicioMs: seg(10),
    duracaoMin: 60,
    disponibilidade: das9as12,
    ocupados: [],
    fuso: SP,
    agoraMs: seg(8),
  });
  assert.equal(fim, seg(11));
});

test("encaixa recusa início ocupado, fora da janela ou no passado", () => {
  const comum = {
    duracaoMin: 60,
    disponibilidade: das9as12,
    fuso: SP,
    agoraMs: seg(8),
  };

  // Ocupado no mesmo horário.
  assert.equal(
    encaixa({ ...comum, inicioMs: seg(10), ocupados: [{ inicioMs: seg(10), fimMs: seg(11) }] }),
    null,
  );
  // Fora da janela: 11:30 + 60min passa das 12:00.
  assert.equal(encaixa({ ...comum, inicioMs: seg(11, 30), ocupados: [] }), null);
  // No passado, antes de agora.
  assert.equal(encaixa({ ...comum, inicioMs: seg(9), ocupados: [], agoraMs: seg(9, 30) }), null);
});

test("a janela é lida no fuso do negócio, e não em UTC", () => {
  // 09:00 em São Paulo é 12:00 em UTC. Se a conta escorregasse para UTC, o
  // primeiro horário viria errado.
  const livres = horariosLivres({
    duracaoMin: 60,
    disponibilidade: das9as12,
    ocupados: [],
    fuso: SP,
    agoraMs: seg(8),
    diasAFrente: 1,
  });
  assert.equal(new Date(livres[0].inicios[0]).getUTCHours(), 12);
});
