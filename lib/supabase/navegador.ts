"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CHAVE, SUPABASE_URL } from "./config";

/**
 * Cliente do Supabase para o navegador.
 *
 * Só entra na página onde a pessoa entra com o Google. A página pública passa
 * longe disto: ela é renderizada no servidor e não baixa cliente de banco
 * nenhum, que é o que segura o Lighthouse onde ele está.
 */
/**
 * O tipo do cliente, para quem o carrega sob demanda poder declarar o `useRef`
 * sem trazer o pacote junto no `import`.
 */
export type ClienteDoNavegador = ReturnType<typeof navegador>;

export function navegador() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_CHAVE);
}
