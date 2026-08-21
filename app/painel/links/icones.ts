import type { IconeLink } from "@/lib/tipos";

/**
 * Os cinco ícones que um link extra pode ter.
 *
 * A lista é curta porque a coluna `icone` da tabela `links` é curta: a
 * constraint `icone_conhecido`, em supabase/schema.sql, aceita exatamente
 * estes cinco. O `IconeLink` do produto tem mais nomes, e eles servem aos
 * botões do rodapé, que moram em jsonb e não passam por essa constraint.
 * Oferecer aqui um ícone que a coluna recusa daria erro de formato na hora de
 * salvar, sem a tela ter como explicar o porquê.
 *
 * Em arquivo próprio, e fora de acoes.ts, porque num módulo "use server" toda
 * exportação precisa ser função assíncrona: uma lista exportada de lá vira erro
 * de compilação do próprio Next.
 */
export const ICONES_DE_LINK: Array<{ valor: IconeLink; rotulo: string }> = [
  { valor: "link", rotulo: "Genérico" },
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "site", rotulo: "Site" },
  { valor: "ifood", rotulo: "iFood ou delivery" },
  { valor: "mapa", rotulo: "Mapa" },
];

const CONHECIDOS = new Set<string>(ICONES_DE_LINK.map((i) => i.valor));

/** O ícone escolhido, ou o genérico, que é o padrão da coluna. */
export function iconeConhecido(escolha: string | null): IconeLink {
  return escolha !== null && CONHECIDOS.has(escolha)
    ? (escolha as IconeLink)
    : "link";
}
