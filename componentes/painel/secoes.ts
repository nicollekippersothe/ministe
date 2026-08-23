import {
  IconeCardapio,
  IconeElo,
  IconeLetras,
  IconeLoja,
  IconeRelogio,
  IconeWhatsapp,
} from "@/componentes/Icones";

/**
 * As seis partes editáveis da página.
 *
 * Em arquivo próprio porque a lista é lida do servidor (a coluna do painel) e
 * do navegador (a marcação da seção aberta). Deixá-la junto de um dos dois
 * arrastaria o outro para o mesmo lado por acidente.
 *
 * **Cada resumo diz ONDE aquilo cai na página.** Duas seções desta lista põem
 * botão com link, e por isso pareciam a mesma coisa: "WhatsApp, iFood, agenda ou
 * o link que você quiser" e "Instagram, cardápio, catálogo, o que você apontar"
 * são duas listas de destino, e nenhuma das duas dizia o que separa uma da
 * outra. O que separa é a posição: uma fica presa no rodapé o tempo todo, a
 * outra é uma seção no corpo. As telas mostram isso desenhado, em
 * componentes/painel/MapaDaPagina.tsx, e aqui a linha de resumo já adianta.
 */
export const SECOES = [
  {
    href: "/painel/negocio",
    titulo: "Informações do negócio",
    resumo: "Nome, frase, WhatsApp e endereço",
    Icone: IconeLoja,
  },
  {
    href: "/painel/catalogo",
    titulo: "Catálogo",
    resumo: "O que você vende, com preço e ordem",
    Icone: IconeCardapio,
  },
  {
    href: "/painel/horarios",
    titulo: "Horários",
    resumo: "Quando abre e quando fecha, dia por dia",
    Icone: IconeRelogio,
  },
  {
    href: "/painel/acoes-botoes",
    titulo: "Botões da página",
    resumo: "O botão de falar com você, preso no rodapé",
    Icone: IconeWhatsapp,
  },
  {
    href: "/painel/links",
    titulo: "Links extras",
    resumo: "A lista de links no corpo da página, perto do fim",
    Icone: IconeElo,
  },
  {
    href: "/painel/aparencia",
    titulo: "Letras da página",
    resumo: "Cinco combinações, com o nome do seu negócio em cada uma",
    Icone: IconeLetras,
  },
];
