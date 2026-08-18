/**
 * O cookie que carrega o Pix em andamento de uma recarga para a outra.
 *
 * A correção 009 recusa guardar o copia e cola do Pix no banco, de propósito:
 * é segredo em repouso, com ganho pequeno, e morto em trinta minutos. O que
 * fica aqui é só o id do pagamento, que sozinho não paga nada, e a tela relê o
 * código no Mercado Pago a cada recarga.
 *
 * `httpOnly` porque o navegador não tem o que fazer com ele, e `path` estreito
 * para ele nem viajar nos outros pedidos.
 *
 * Arquivo separado das ações porque em módulo com "use server" toda exportação
 * vira endereço que o navegador alcança, e constante não precisa disso.
 */
export const COOKIE_DO_PIX = "entrais_pix";

export const VIDA_DO_PIX_S = 30 * 60;
