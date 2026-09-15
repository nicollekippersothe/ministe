/**
 * A estrutura do blog: o modelo de uma matéria e a lista delas.
 *
 * Por enquanto a lista fica vazia, de propósito. É a regra 6 do AGENTS.md: um
 * campo vazio faz a seção sumir, e vale aqui igual às outras. A página do blog
 * abre inteira com o texto que já existe, e a lista de matérias aparece assim
 * que a primeira entrar neste arquivo. Enquanto MATERIAS estiver vazio, a lista
 * some e o endereço de cada matéria responde como página que ainda não existe.
 *
 * Publicar a primeira é acrescentar um objeto em MATERIAS, com o corpo em
 * blocos. O resto (a listagem, a página própria, o mapa do site) já lê daqui.
 */

/** Um pedaço do corpo de uma matéria. Texto puro, montado em blocos. */
export type BlocoMateria =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string };

export type Materia = {
  /** O endereço da matéria, em /blog/<slug>. Só letras, números e hífen. */
  slug: string;
  titulo: string;
  /** A frase de chamada, mostrada na listagem e na prévia de link. */
  resumo: string;
  /** ISO, só a data: "2026-09-14". */
  publicadoEm: string;
  corpo: BlocoMateria[];
};

/**
 * As matérias publicadas, da mais nova para a mais velha na tela.
 *
 * Vazia enquanto o blog está sendo montado. Ordenar fica com quem lê, por
 * `materiasPublicadas()`, para a fonte da verdade ser só a data de cada uma.
 */
export const MATERIAS: Materia[] = [];

/** As matérias em ordem de publicação, da mais nova para a mais velha. */
export function materiasPublicadas(): Materia[] {
  return [...MATERIAS].sort((a, b) =>
    b.publicadoEm.localeCompare(a.publicadoEm),
  );
}

/** A matéria de um endereço, ou indefinida quando ele ainda não existe. */
export function materiaPorSlug(slug: string): Materia | undefined {
  return MATERIAS.find((materia) => materia.slug === slug);
}

/** A data de publicação por extenso, no formato que o resto do site usa. */
export function dataPorExtenso(publicadoEm: string): string {
  return new Date(`${publicadoEm}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
