/**
 * Endereço e chave do projeto Supabase.
 *
 * As duas são públicas por definição: vão dentro do JavaScript que qualquer
 * visitante baixa. Quem protege os dados é a RLS, e não o segredo da chave.
 * A chave secreta passa por cima da RLS e por isso nunca entra no projeto.
 *
 * Quando faltar configuração, `configurado` fica falso e o produto continua
 * lendo os exemplos do arquivo local. É o que deixa `npm run dev` e o teste de
 * fluxo rodarem sem depender de rede.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CHAVE =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const configurado = SUPABASE_URL !== "" && SUPABASE_CHAVE !== "";
