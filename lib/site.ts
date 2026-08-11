/** Endereço base do site, usado no JSON-LD, no canonical e no Open Graph. */
export const urlBase = (
  process.env.NEXT_PUBLIC_URL_BASE ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/**
 * E-mail de suporte. Fica nulo até existir de verdade: a tela de ajuda
 * simplesmente não mostra o bloco de contato, em vez de inventar um endereço
 * para o qual ninguém responde.
 */
export const CONTATO_SUPORTE: string | null =
  process.env.NEXT_PUBLIC_CONTATO_SUPORTE ?? null;
