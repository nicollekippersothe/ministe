import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configurado, SUPABASE_CHAVE, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Renova a sessão a cada pedido.
 *
 * O token do Supabase vence em uma hora. Server Component consegue ler cookie
 * mas não escrever, então sem este passo a sessão venceria no meio do cadastro
 * e a pessoa perderia o que estava preenchendo. Aqui a resposta ainda está
 * sendo montada, e dá para gravar o cookie novo.
 *
 * Só nas rotas de cadastro e painel. A página pública fica de fora de propósito:
 * ela é estática com revalidação, e passar por middleware tiraria isso.
 */
export async function middleware(pedido: NextRequest) {
  if (!configurado) return NextResponse.next();

  let resposta = NextResponse.next({ request: pedido });

  const sb = createServerClient(SUPABASE_URL, SUPABASE_CHAVE, {
    cookies: {
      getAll: () => pedido.cookies.getAll(),
      setAll: (novos) => {
        for (const { name, value } of novos) {
          pedido.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request: pedido });
        for (const { name, value, options } of novos) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser confere o token com o servidor de auth. getSession só lê o cookie,
  // que quem tem o navegador consegue escrever, então não serve para decidir
  // nada. Esta chamada é o que dispara a renovação.
  await sb.auth.getUser();

  return resposta;
}

export const config = {
  matcher: ["/criar/:path*", "/painel/:path*", "/entrar/:path*"],
};
