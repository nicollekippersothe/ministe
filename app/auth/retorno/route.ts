import { NextResponse, type NextRequest } from "next/server";
import { configurado } from "@/lib/supabase/config";
import { servidor } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

/**
 * A volta do Google.
 *
 * O Google devolve para o Supabase, o Supabase devolve para cá com um código,
 * e é aqui que o código vira sessão gravada em cookie. Precisa ser rota de
 * servidor: página não grava cookie, e a sessão se perderia na hora.
 *
 * Serve tanto para quem está entrando pela primeira vez quanto para quem tinha
 * conta provisória e acabou de ligar o Google nela. Nos dois casos o destino é
 * o mesmo, porque o `auth.uid()` também é o mesmo dos dois lados.
 */
export async function GET(pedido: NextRequest) {
  const url = new URL(pedido.url);
  const codigo = url.searchParams.get("code");
  const erro = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  // Só caminho de dentro do próprio site, para o parâmetro não virar desvio
  // para fora. Quem controla a URL de volta é quem clicou no link, então ela
  // é entrada de fora como qualquer outra.
  const pedido_para = url.searchParams.get("para") ?? "/painel";
  const para = pedido_para.startsWith("/") && !pedido_para.startsWith("//")
    ? pedido_para
    : "/painel";

  if (!configurado || erro) {
    return NextResponse.redirect(
      new URL(`/entrar?erro=${encodeURIComponent(erro ?? "config")}`, url.origin),
    );
  }

  if (codigo) {
    const sb = await servidor();
    const { error } = await sb.auth.exchangeCodeForSession(codigo);
    if (error) {
      return NextResponse.redirect(
        new URL(`/entrar?erro=${encodeURIComponent(error.message)}`, url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(para, url.origin));
}
