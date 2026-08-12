/**
 * Regras do endereço público.
 *
 * A mesma lista de reservados existe no banco, em supabase/schema.sql. Aqui ela
 * serve para avisar a pessoa antes de mandar, com uma mensagem em português.
 * Quem manda de verdade é o banco.
 */

export const RESERVADOS = new Set([
  "painel", "api", "login", "entrar", "sair", "cadastro", "criar",
  "admin", "conta", "assinatura", "cobranca", "suporte",
  "ajuda", "sobre", "precos", "termos", "privacidade",
  "denunciar", "contato", "blog", "demo", "exemplo",
  "entrais", "app", "www", "static", "assets", "public",
  "_next", "favicon", "robots", "sitemap", "opengraph-image", "icon",
]);

export const TAMANHO_MINIMO = 3;
export const TAMANHO_MAXIMO = 30;

/** Transforma o que a pessoa digitou num endereço válido, sem reclamar. */
export function normalizar(entrada: string): string {
  return entrada
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, TAMANHO_MAXIMO)
    .replace(/-+$/g, "");
}

export type Recusa =
  | "curto"
  | "longo"
  | "formato"
  | "reservado"
  | "ocupado";

export const MOTIVOS: Record<Recusa, string> = {
  curto: `Precisa de pelo menos ${TAMANHO_MINIMO} letras.`,
  longo: `No máximo ${TAMANHO_MAXIMO} letras.`,
  formato: "Use só letras, números e hífen.",
  reservado: "Este endereço é reservado pelo sistema.",
  ocupado: "Este endereço já está em uso.",
};

/** Confere só o formato. Se está ocupado é o banco que sabe. */
export function conferirFormato(slug: string): Recusa | null {
  if (slug.length < TAMANHO_MINIMO) return "curto";
  if (slug.length > TAMANHO_MAXIMO) return "longo";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) return "formato";
  if (RESERVADOS.has(slug)) return "reservado";
  return null;
}
