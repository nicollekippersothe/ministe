import { Bricolage_Grotesque, Inter } from "next/font/google";

/**
 * As duas letras da tela inicial, declaradas, e as únicas que ela baixa.
 *
 * O texto de venda atravessa Mac, Windows e Android, e a fonte do aparelho
 * muda de desenho em cada um. Declarar a face garante que o título é o mesmo
 * em todo lugar. Bricolage Grotesque vai só nos títulos, Inter no resto.
 *
 * Aqui o pré-carregamento fica ligado, ao contrário de `lib/fontes.ts`: este
 * módulo só é alcançado pela rota `/`, então não vaza para as outras, e o
 * título é o maior elemento de texto da primeira pintura.
 */
export const titulo = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--f-venda-titulo",
});

export const corpo = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--f-venda-corpo",
});
