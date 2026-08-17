import { preco } from "../formato.ts";
import type { Ciclo } from "./tipos.ts";

/**
 * A tabela de preços, num lugar só e sem I/O.
 *
 * Tudo em centavos inteiros. A conversão para o decimal que o Mercado Pago
 * espera acontece dentro de `mercadopago.ts` e termina lá: assim nenhuma soma
 * de dinheiro no produto inteiro roda em ponto flutuante, e a diferença de um
 * centavo que aparece em `19.90 * 3` nunca chega ao extrato de ninguém.
 */

/**
 * Dias de teste grátis, só no crédito.
 *
 * O teste sai no crédito porque ali o banco autoriza a cobrança futura junto
 * com a autorização de hoje: a assinatura já nasce de pé e cobra sozinha
 * quando o teste acaba. No Pix e no débito, cada ciclo é uma decisão nova da
 * pessoa, então um teste ali seria só uma semana de graça seguida de silêncio.
 */
export const DIAS_DE_TESTE = 7;

export type PrecoDoPlano = {
  ciclo: Ciclo;
  /** Inteiro, em centavos. */
  valorCentavos: number;
  /** O nome do plano na tela de escolha. */
  rotulo: string;
  /** A linha embaixo do nome, com o preço já formatado em real. */
  descricao: string;
};

/** Quantos meses o ciclo cobre. Serve para a conta de vencimento e de economia. */
export const MESES_DO_CICLO: Record<Ciclo, number> = {
  mensal: 1,
  anual: 12,
};

const MENSAL_CENTAVOS = 1990;
const ANUAL_CENTAVOS = 17900;

/**
 * Quantos meses a frase de venda promete de cortesia no plano anual.
 *
 * Esta constante é a promessa, e `mesesDeCortesia()` é o que os preços de fato
 * entregam. O teste segura os dois juntos: mexeu num preço e a conta ficou
 * menor que a promessa, o teste cai antes de a frase virar mentira na tela.
 */
export const MESES_DE_CORTESIA_PROMETIDOS = 3;

export const PLANOS: Record<Ciclo, PrecoDoPlano> = {
  mensal: {
    ciclo: "mensal",
    valorCentavos: MENSAL_CENTAVOS,
    rotulo: "Mensal",
    descricao: `${preco(MENSAL_CENTAVOS)} por mês, renovando a cada mês.`,
  },
  anual: {
    ciclo: "anual",
    valorCentavos: ANUAL_CENTAVOS,
    rotulo: "Anual",
    descricao: `${preco(ANUAL_CENTAVOS)} por ano, com três meses por conta nossa.`,
  },
};

/** O que o plano anual poupa em um ano, em centavos. */
export function economiaAnualEmCentavos(): number {
  const doze = PLANOS.mensal.valorCentavos * MESES_DO_CICLO.anual;
  return doze - PLANOS.anual.valorCentavos;
}

/**
 * Quantos meses inteiros a economia do anual paga, pelo preço mensal.
 *
 * Conta feita em inteiro de propósito. Com float, `17900 / 1990` já aparece
 * com cauda binária, e uma promessa comercial decidida por arredondamento é
 * exatamente o tipo de coisa que ninguém revisa depois.
 */
export function mesesDeCortesia(): number {
  return Math.floor(economiaAnualEmCentavos() / PLANOS.mensal.valorCentavos);
}
