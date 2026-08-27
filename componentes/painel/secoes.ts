import {
  IconeCardapio,
  IconeElo,
  IconeLetras,
  IconeLoja,
  IconeRelogio,
} from "@/componentes/Icones";

/**
 * As cinco partes editáveis da página.
 *
 * Em arquivo próprio porque a lista é lida do servidor (a coluna do painel) e
 * do navegador (a marcação da seção aberta). Deixá-la junto de um dos dois
 * arrastaria o outro para o mesmo lado por acidente.
 *
 * **Eram seis, e duas delas viraram uma.** "Botões da página" e "Links extras"
 * punham as duas botão com link, e por isso pareciam a mesma coisa: "WhatsApp,
 * iFood, agenda ou o link que você quiser" e "Instagram, cardápio, catálogo, o
 * que você apontar" são duas listas de destino, e nenhuma das duas dizia o que
 * separa uma da outra. Primeiro o resumo passou a dizer a posição, depois as
 * duas telas passaram a abrir com o desenho da página, e no fim ficou claro que
 * a divisão era o problema: quem chega ao painel procura "os links da minha
 * página", e escolher entre duas linhas antes de ver as duas coisas é uma
 * decisão que a lista pedia sem precisar. Agora é uma entrada só, e a diferença
 * entre os dois lugares fica desenhada lá dentro, em
 * componentes/painel/MapaDaPagina.tsx.
 *
 * **Cada resumo diz ONDE aquilo cai na página**, que é o que ficou de pé da
 * primeira tentativa.
 */
export const SECOES = [
  {
    href: "/painel/negocio",
    titulo: "Informações do negócio",
    resumo: "Nome, frase, WhatsApp e onde você atende",
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
    href: "/painel/links",
    titulo: "Links e botões",
    resumo: "O botão preso no rodapé e a lista no corpo da página",
    Icone: IconeElo,
  },
  {
    href: "/painel/aparencia",
    titulo: "Letras da página",
    resumo: "Cinco combinações, com o nome do seu negócio em cada uma",
    Icone: IconeLetras,
  },
];
