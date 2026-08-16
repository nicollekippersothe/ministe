import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CHAVE, SUPABASE_URL } from "./config";

/**
 * Cliente para o que é público, sem sessão e sem cookie.
 *
 * Existe por dois motivos, e o segundo é o que quebrou de verdade.
 *
 * O primeiro é de desenho: a página de um negócio é a mesma para todo mundo.
 * Ler cookie ali seria dizer que ela varia por visitante, o que não é verdade e
 * atrapalharia o cache.
 *
 * O segundo é que ler cookie e guardar em cache são incompatíveis, e o Next
 * trata isso como erro. A rota pública declara `revalidate = 3600`, e a versão
 * que falava pelo cliente de sessão estourava DYNAMIC_SERVER_USAGE: endereço
 * desconhecido respondia 500 em vez da tela de "este endereço está disponível".
 * O erro passou despercebido porque as sete páginas de exemplo respondem antes
 * de chegar no banco, então tudo que se costuma abrir para conferir funcionava.
 *
 * Aqui a chave publicável entra sem sessão, o que vale dizer como papel `anon`.
 * A RLS já governa exatamente isso: negócio publicado e ativo, e nada de
 * rascunho. A prévia do dono é outro caminho, pelo cliente de sessão.
 */
export function publico() {
  return createClient(SUPABASE_URL, SUPABASE_CHAVE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
