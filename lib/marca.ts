/**
 * Nome da marca.
 *
 * Escrito assim, com uma maiúscula só. O cabeçalho e a assinatura aplicam
 * caixa alta pelo CSS, então aparece ENTRAIS onde é logo e Entrais dentro de
 * frase, como em "feito com Entrais". Guardar em caixa alta quebraria a frase.
 */
export const NOME_PRODUTO = "Entrais";

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
