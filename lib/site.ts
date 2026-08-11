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

/**
 * Modo vitrine.
 *
 * Enquanto o login não existe, o painel não pode ir para a internet: quem
 * chegasse no endereço editaria a página dos outros. Com MODO_VITRINE=1 a
 * publicação fica segura: as páginas de exemplo e a tela inicial funcionam,
 * e as rotas de painel e cadastro respondem 404.
 *
 * Também deixa os dados só de leitura, o que resolve o outro problema: na
 * Vercel o disco é somente leitura, então gravar em arquivo falharia.
 *
 * Sai quando o Supabase Auth entrar.
 */
export const MODO_VITRINE = process.env.MODO_VITRINE === "1";
