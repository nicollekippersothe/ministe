/**
 * O símbolo da marca: o arco entreaberto.
 *
 * Uma porta em arco com meia folha fechada e a outra metade já aberta, o
 * negócio que recebe quem chega. A folha carrega a maçaneta, e o vão vazio é
 * parte do desenho, nunca preenchido.
 *
 * O caminho vem do guia de marca, não foi redesenhado. Fica aqui, e não dentro
 * de um componente, porque quem precisa dele não é só o React: o ícone do app,
 * o favicon e as peças montadas por script leem daqui também. Assim existe um
 * desenho só, e ele não diverge entre a tela e o material de marca.
 *
 * Abaixo de 16px a maçaneta some sozinha, e é assim mesmo: o guia manda deixar
 * o arco falar em vez de redesenhar uma versão miúda.
 */
export const SIMBOLO_CAIXA = "0 0 24 24";

export const SIMBOLO_CAMINHO =
  "M4 21 V11 a8 8 0 0 1 8 -8 v18 z " +
  "M9.2 11 a1.3 1.3 0 0 1 -2.6 0 a1.3 1.3 0 0 1 2.6 0 z " +
  "M14.5 3.5 a8 8 0 0 1 5.5 7.5 V21 h-2.8 V11 a5.2 5.2 0 0 0 -2.7 -4.6 z";

/** SVG completo, para quem não renderiza React. */
export function simboloSvg(cor: string, altura: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SIMBOLO_CAIXA}" height="${altura}" fill="${cor}" fill-rule="evenodd" aria-hidden="true"><path d="${SIMBOLO_CAMINHO}"/></svg>`;
}
