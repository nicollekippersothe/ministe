import { deslocamento } from "../horarios.ts";
import { DIAS_DE_TESTE } from "./precos.ts";
import type { Ciclo } from "./tipos.ts";

/**
 * Aritmética de data do vencimento. Pura, sem relógio próprio e sem I/O.
 *
 * Quem manda o instante é quem chama, sempre. Função de cobrança que lê
 * `Date.now()` por dentro é função que só dá para testar esperando o tempo
 * passar, e conta de vencimento errada é a única categoria de bug deste
 * produto que tira a página de alguém do ar sem ninguém ter feito nada.
 *
 * Três armadilhas moram aqui:
 *
 *   1. Mês tem tamanho variável. 31 de janeiro mais um mês cai em 28 ou 29 de
 *      fevereiro, e somar 30 dias daria 2 ou 3 de março, que é outro mês de
 *      cobrança. A conta é civil (ano, mês, dia), com o dia preso ao último
 *      dia do mês de destino.
 *   2. Ano bissexto. 29 de fevereiro mais um ano cai em 28 de fevereiro.
 *   3. Fuso. O vencimento é uma data civil no `America/Sao_Paulo`, então
 *      alguém que assina 23:40 do dia 31 tem que vencer 23:40, e nunca no dia
 *      seguinte por causa das três horas de diferença para o UTC. O Brasil
 *      largou o horário de verão em 2019, mas a conta faz a segunda passada
 *      mesmo assim, porque a regra pode voltar e porque o fuso é parâmetro.
 *
 * O dia âncora é perdido no arredondamento, e isso é de propósito: quem
 * assinou dia 31 e caiu em 28 de fevereiro renova dia 28 dali em diante. A
 * alternativa (guardar o 31 e ressuscitar em março) rende meses de 28 dias
 * seguidos de meses de 31, e ninguém entende a própria fatura. Para manter a
 * âncora, quem chama passa sempre a data da primeira cobrança, com o número de
 * meses acumulado, em vez de encadear um período em cima do outro.
 */

export const FUSO_PADRAO = "America/Sao_Paulo";

type Civil = {
  ano: number;
  /** 1 a 12. */
  mes: number;
  dia: number;
  hora: number;
  min: number;
  seg: number;
  ms: number;
};

/**
 * Quebra um instante nas partes civis daquele fuso.
 *
 * Mesma técnica de `lib/horarios.ts`, que é a única forma de fazer conta de
 * fuso em JavaScript sem trazer uma biblioteca inteira: o `Intl` conhece a
 * base de fusos, e o `Date` conhece só o local da máquina, que num servidor é
 * sempre UTC e num navegador é qualquer coisa.
 */
function partesCivis(ts: number, fuso: string): Civil {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = f.formatToParts(new Date(ts));
  const v = (tipo: string) => Number(p.find((x) => x.type === tipo)?.value ?? 0);
  return {
    ano: v("year"),
    mes: v("month"),
    dia: v("day"),
    hora: v("hour"),
    min: v("minute"),
    seg: v("second"),
    // O Intl entrega até o segundo. O resto do milissegundo vem do próprio
    // instante, para o vencimento cair no mesmo ponto do relógio.
    ms: ((ts % 1000) + 1000) % 1000,
  };
}

/** Quantos dias tem o mês. `mes` vai de 1 a 12. */
export function diasNoMes(ano: number, mes: number): number {
  // Dia zero do mês seguinte é o último dia deste. Pega bissexto de graça,
  // inclusive a regra dos centenários, que o Date já conhece.
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Junta as partes civis de volta num instante, respeitando o fuso. */
function epochDeCivil(c: Civil, fuso: string): number {
  const alvo = Date.UTC(c.ano, c.mes - 1, c.dia, c.hora, c.min, c.seg, c.ms);
  const primeiro = deslocamento(alvo, fuso);
  let ts = alvo - primeiro;
  // Segunda passada resolve a virada de horário de verão, quando existir: o
  // deslocamento do palpite pode ser diferente do deslocamento do alvo.
  const segundo = deslocamento(ts, fuso);
  if (segundo !== primeiro) ts = alvo - segundo;
  return ts;
}

/**
 * Soma meses civis, prendendo o dia ao último dia do mês de destino.
 *
 * 31 de janeiro mais um mês dá 28 de fevereiro (29 em ano bissexto), 31 de
 * março mais um mês dá 30 de abril, e a hora do relógio fica onde estava.
 */
export function somarMeses(
  inicioMs: number,
  meses: number,
  fuso: string = FUSO_PADRAO,
): number {
  const c = partesCivis(inicioMs, fuso);
  const total = c.ano * 12 + (c.mes - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const dia = Math.min(c.dia, diasNoMes(ano, mes));
  return epochDeCivil({ ...c, ano, mes, dia }, fuso);
}

/**
 * Soma dias civis, mantendo a hora do relógio local.
 *
 * Diferente de somar `dias * 86400000`: num dia de virada de horário de verão
 * o dia civil tem 23 ou 25 horas, e quem soma milissegundo desloca a hora do
 * vencimento junto.
 */
export function somarDias(
  inicioMs: number,
  dias: number,
  fuso: string = FUSO_PADRAO,
): number {
  const c = partesCivis(inicioMs, fuso);
  // O Date normaliza dia fora da faixa sozinho, então 31 de janeiro mais 7
  // vira 7 de fevereiro sem nenhuma conta de tamanho de mês aqui.
  const alvo = new Date(Date.UTC(c.ano, c.mes - 1, c.dia + dias));
  return epochDeCivil(
    {
      ...c,
      ano: alvo.getUTCFullYear(),
      mes: alvo.getUTCMonth() + 1,
      dia: alvo.getUTCDate(),
    },
    fuso,
  );
}

/** O instante em que o ciclo pago termina, contado do instante de início. */
export function fimDoPeriodo(
  inicioMs: number,
  ciclo: Ciclo,
  fuso: string = FUSO_PADRAO,
): number {
  return somarMeses(inicioMs, ciclo === "anual" ? 12 : 1, fuso);
}

/** O instante em que o teste grátis do crédito termina. */
export function fimDoTeste(inicioMs: number, fuso: string = FUSO_PADRAO): number {
  return somarDias(inicioMs, DIAS_DE_TESTE, fuso);
}

/**
 * O fim do período em ISO 8601, que é o formato que a coluna
 * `plano_expira_em` (timestamptz) e o `planoValido` de `lib/plano.ts` leem.
 */
export function fimDoPeriodoIso(
  inicioMs: number,
  ciclo: Ciclo,
  fuso: string = FUSO_PADRAO,
): string {
  return new Date(fimDoPeriodo(inicioMs, ciclo, fuso)).toISOString();
}
