/**
 * Nome da marca, em caixa baixa, como manda o guia.
 *
 * Vale nos dois usos: o logotipo é "entrais" e a assinatura é "feito com
 * entrais". Nenhuma tela aplica caixa alta por cima, senão o logotipo fica o
 * contrário do que a marca desenhou.
 */
export const NOME_PRODUTO = "entrais";

/**
 * Domínio mostrado na hora de escolher o endereço da página.
 *
 * Sai da mesma variável que o resto do site, então a tela nunca promete um
 * endereço diferente do que o link vai abrir. Em produção basta definir
 * NEXT_PUBLIC_URL_BASE. O valor de reserva é o domínio pretendido, usado
 * enquanto roda na máquina, onde mostrar "localhost" não ajudaria ninguém.
 *
 * NEXT_PUBLIC_ funciona no servidor e no navegador, o que importa porque o
 * campo de endereço é componente de cliente: se o valor divergisse entre os
 * dois lados, a hidratação acusaria.
 */
export const DOMINIO_PUBLICO = (
  process.env.NEXT_PUBLIC_URL_BASE ?? "https://entrais.app"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

/**
 * Quem assina os termos e a política de privacidade.
 *
 * Fica nulo até existir, pelo mesmo motivo do CONTATO_SUPORTE em lib/site.ts:
 * documento legal com identificação inventada é pior que documento sem ela. A
 * página mostra o bloco quando os dois estiverem definidos, e segue sem ele
 * enquanto o cadastro estiver em andamento.
 *
 * Preencher antes de cobrar o primeiro real. A LGPD pede o controlador
 * identificado, e o Decreto 7.962 pede o fornecedor identificado por "CNPJ ou
 * CPF", nessa ordem e com o CPF previsto para quem ainda é pessoa física.
 *
 * Serve para os dois: o Mercado Pago recebe tanto em conta de pessoa física
 * quanto de empresa, então dá para faturar antes de existir CNPJ. O rótulo sai
 * da contagem de dígitos, para a variável ser uma só.
 */
export const RESPONSAVEL: string | null =
  process.env.NEXT_PUBLIC_RESPONSAVEL ?? null;

/** CPF ou CNPJ, com ou sem pontuação. */
export const DOCUMENTO: string | null =
  process.env.NEXT_PUBLIC_DOCUMENTO ?? null;

/**
 * "CPF" para onze dígitos, "CNPJ" para quatorze, e nulo para qualquer outra
 * coisa, que é jeito de dizer que a variável está escrita errado. Rótulo errado
 * num documento legal atrapalha mais que rótulo ausente.
 */
export function tipoDeDocumento(documento: string): "CPF" | "CNPJ" | null {
  const digitos = documento.replace(/\D/g, "").length;
  if (digitos === 11) return "CPF";
  if (digitos === 14) return "CNPJ";
  return null;
}
