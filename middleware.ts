import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configurado, SUPABASE_CHAVE, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Renova a sessão quando ela está perto de vencer.
 *
 * O token do Supabase vence em uma hora. Server Component consegue ler cookie
 * mas não escrever, então sem este passo a sessão venceria no meio do cadastro
 * e a pessoa perderia o que estava preenchendo. Aqui a resposta ainda está
 * sendo montada, e dá para gravar o cookie novo.
 *
 * Só nas rotas de cadastro e painel. A página pública fica de fora de propósito:
 * ela é estática com revalidação, e passar por middleware tiraria isso.
 *
 * **Por que `getSession` e não `getUser`.** Os dois renovam o token vencido, e
 * a renovação é a única coisa que este arquivo quer. A diferença está no preço
 * do caso comum: `getUser` pergunta ao servidor de auth em TODA navegação, o
 * que custa uma ida e volta ao Supabase antes de a página começar a ser
 * montada, mesmo com o token novinho; `getSession` lê o cookie e só sai na rede
 * quando o token está perto do fim (ver `__loadSession` no auth-js, que compara
 * `expires_at` com a margem de expiração antes de chamar o refresh). Numa
 * sessão de uma hora isso troca dezenas de idas por uma.
 *
 * A regra de ouro continua valendo, e é justamente por ela que a troca é
 * segura: `getSession` lê um cookie que quem tem o navegador consegue escrever,
 * então ele nunca decide nada. **E aqui nada é decidido.** O resultado é
 * ignorado de propósito: o middleware deixa toda página passar e quem confere
 * de verdade é a página, com `getUser`, e o banco, com a RLS. Se algum dia este
 * arquivo passar a barrar alguém, a conferência tem que voltar a ser `getUser`.
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

  await sb.auth.getSession();

  return resposta;
}

export const config = {
  matcher: ["/criar/:path*", "/painel/:path*", "/entrar/:path*"],
};
