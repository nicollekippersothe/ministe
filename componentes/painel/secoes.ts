import {
  IconeLetras,
  IconeLoja,
  IconeRelogio,
  IconeWhatsapp,
} from "@/componentes/Icones";

/**
 * As quatro partes editáveis da página.
 *
 * Em arquivo próprio porque a lista é lida do servidor (a coluna do painel) e
 * do navegador (a marcação da seção aberta). Deixá-la junto de um dos dois
 * arrastaria o outro para o mesmo lado por acidente.
 */
export const SECOES = [
  {
    href: "/painel/negocio",
    titulo: "Informações do negócio",
    resumo: "Nome, frase, WhatsApp e endereço",
    Icone: IconeLoja,
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
    resumo: "WhatsApp, iFood, agenda ou o link que você quiser",
    Icone: IconeWhatsapp,
  },
  {
    href: "/painel/aparencia",
    titulo: "Letras da página",
    resumo: "Cinco combinações, com o nome do seu negócio em cada uma",
    Icone: IconeLetras,
  },
];
