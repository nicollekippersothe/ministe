import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DIAS_DE_TESTE,
  MESES_DE_CORTESIA_PROMETIDOS,
  MESES_DO_CICLO,
  PLANOS,
  economiaAnualEmCentavos,
  mesesDeCortesia,
} from "./precos.ts";

test("os dois ciclos, em centavos inteiros", () => {
  assert.equal(PLANOS.mensal.valorCentavos, 1990);
  assert.equal(PLANOS.anual.valorCentavos, 17900);
  assert.equal(PLANOS.mensal.ciclo, "mensal");
  assert.equal(PLANOS.anual.ciclo, "anual");
});

test("dinheiro é sempre inteiro", () => {
  for (const plano of Object.values(PLANOS)) {
    assert.ok(
      Number.isInteger(plano.valorCentavos),
      `${plano.ciclo} chegou com casa decimal`,
    );
    assert.ok(plano.valorCentavos > 0, `${plano.ciclo} chegou com valor vazio`);
  }
});

test("o teste grátis dura sete dias", () => {
  assert.equal(DIAS_DE_TESTE, 7);
});

test("o preço formatado aparece na descrição, em real", () => {
  assert.match(PLANOS.mensal.descricao, /R\$\s?19,90/);
  assert.match(PLANOS.anual.descricao, /R\$\s?179,00/);
});

/*
 * A frase de venda do plano anual é "três meses por conta nossa", e esta é a
 * conta que a sustenta.
 *
 * Uma observação sobre o número exato, porque ele engana. A intuição diz que
 * três meses de cortesia em doze significa pagar 75% de doze mensalidades:
 * 12 * 1990 = 23880, e 75% disso é 17910. Só que o plano anual custa 17900,
 * dez centavos abaixo, porque R$ 179 é um preço redondo de vitrine e R$ 179,10
 * é um preço de planilha. Então a razão real é 17900 / 23880, que dá
 * 0,749581..., e nunca 0,75 exatamente.
 *
 * A promessa continua verdadeira, e é ela que o teste guarda: a economia
 * (5980 centavos) paga três mensalidades inteiras (5970 centavos) e ainda
 * sobra. Guardar a razão exata em 0,75 travaria o preço redondo, e é
 * justamente o preço redondo que a gente quer manter.
 *
 * A conta é feita com inteiro dos dois lados, multiplicando em cruz, para o
 * ponto flutuante ficar de fora de uma decisão comercial.
 */
test("o plano anual entrega os três meses que a frase de venda promete", () => {
  const mensal = PLANOS.mensal.valorCentavos;
  const anual = PLANOS.anual.valorCentavos;
  const mesesPagos = MESES_DO_CICLO.anual - MESES_DE_CORTESIA_PROMETIDOS;

  // anual <= 9 mensalidades, ou seja, três meses saem por conta nossa.
  assert.ok(
    anual <= mensal * mesesPagos,
    `o anual (${anual}) passou de ${mesesPagos} mensalidades (${mensal * mesesPagos})`,
  );

  // A razão fica em 3/4 ou abaixo, comparada em inteiro para o float ficar fora.
  assert.ok(
    anual * 4 <= mensal * MESES_DO_CICLO.anual * 3,
    "o anual passou de três quartos de doze mensalidades",
  );

  assert.equal(economiaAnualEmCentavos(), 5980);
  assert.equal(mesesDeCortesia(), 3);
  assert.ok(
    mesesDeCortesia() >= MESES_DE_CORTESIA_PROMETIDOS,
    "a frase promete mais meses do que os preços entregam",
  );
});

/*
 * O número que a intuição espera, registrado para quem vier depois entender de
 * onde vêm os dez centavos e evitar "consertar" o preço de vitrine.
 */
test("a razão exata fica logo abaixo de três quartos, pelos dez centavos", () => {
  const dozeMensalidades = PLANOS.mensal.valorCentavos * MESES_DO_CICLO.anual;
  assert.equal(dozeMensalidades, 23880);
  assert.equal(dozeMensalidades * 3 / 4, 17910);
  assert.equal(17910 - PLANOS.anual.valorCentavos, 10);
});

test("o ciclo anual cobre doze meses", () => {
  assert.equal(MESES_DO_CICLO.mensal, 1);
  assert.equal(MESES_DO_CICLO.anual, 12);
});
