import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { configurado } from "@/lib/supabase/config";
import { servico, temChaveDeServico } from "@/lib/supabase/servico";
import { servidor } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

/**
 * Onde fica o rascunho entre as duas idas ao Google.
 *
 * Precisa de cookie porque entre a primeira volta e a segunda a sessão troca de
 * dono: depois do `signInWithOAuth` o `auth.uid()` já é o da conta antiga, e a
 * rota perderia a referência do que estava movendo. `httpOnly` e caminho
 * `/auth` porque a única coisa que lê isto é esta rota, dez minutos depois.
 */
const RASCUNHO = "entrais_rascunho";

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
 *
 * O terceiro caso é o do `identity_already_exists`, tratado abaixo, e é o mais
 * comum de todos depois que o produto tem gente com conta: quem já tem página
 * abre o site deslogado, monta um rascunho, e o Google que ela usa já pertence
 * à conta antiga.
 */
export async function GET(pedido: NextRequest) {
  const url = new URL(pedido.url);
  const codigo = url.searchParams.get("code");
  const codigoDoErro = url.searchParams.get("error_code");
  const erro = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  // Só caminho de dentro do próprio site, para o parâmetro não virar desvio
  // para fora. Quem controla a URL de volta é quem clicou no link, então ela
  // é entrada de fora como qualquer outra.
  const pedido_para = url.searchParams.get("para") ?? "/painel";
  const para = pedido_para.startsWith("/") && !pedido_para.startsWith("//")
    ? pedido_para
    : "/painel";

  if (!configurado) {
    return NextResponse.redirect(new URL("/entrar?erro=config", url.origin));
  }

  // Este Google já pertence a outra conta daqui. O login em si deu certo: o que
  // o Supabase recusou foi *ligar* a identidade numa segunda conta, porque uma
  // identidade do Google pertence a uma conta só. A sessão provisória continua
  // inteira, e é isso que torna a recuperação possível.
  if (codigoDoErro === "identity_already_exists") {
    return await entrarNaContaDeAntes(url, para);
  }

  if (erro) {
    return NextResponse.redirect(
      new URL(`/entrar?erro=${encodeURIComponent(erro)}`, url.origin),
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

    return NextResponse.redirect(new URL(await levarORascunho(para), url.origin));
  }

  return NextResponse.redirect(new URL(para, url.origin));
}

/**
 * Passo 1 da recuperação: guardar o rascunho e entrar na conta que já existe.
 *
 * `linkIdentity` só descobre que a identidade está tomada depois que o Google
 * responde, então esta recusa chega aqui e nunca no clique do botão. Daqui a
 * pessoa segue para o mesmo Google, agora entrando em vez de ligando, e volta
 * logada na conta dela.
 */
async function entrarNaContaDeAntes(url: URL, para: string) {
  const sb = await servidor();
  const { data: quem } = await sb.auth.getUser();
  const de = quem.user?.is_anonymous === true ? quem.user.id : null;

  if (de !== null) {
    // O rascunho, e só ele: página no ar tem endereço divulgado e fica onde
    // está, que é o mesmo guarda que a `migrar_rascunho` repete no banco.
    const { data } = await sb
      .from("negocios")
      .select("id")
      .eq("dono_id", de)
      .eq("publicado", false)
      .order("criado_em")
      .limit(1)
      .maybeSingle();

    const rascunho = typeof data?.id === "string" ? data.id : null;

    if (rascunho !== null) {
      const jar = await cookies();
      jar.set(RASCUNHO, `${rascunho}:${de}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: url.protocol === "https:",
        path: "/auth",
        maxAge: 600,
      });
    }
  }

  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${url.origin}/auth/retorno?para=${encodeURIComponent(para)}`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(
      new URL("/entrar?erro=identity_already_exists", url.origin),
    );
  }

  return NextResponse.redirect(data.url);
}

/**
 * Passo 2 da recuperação: a página montada agora passa para a conta de sempre.
 *
 * Roda depois do `exchangeCodeForSession`, que é quando `auth.uid()` já é o da
 * conta de verdade. Devolve o destino, porque o resultado muda o que o painel
 * tem para dizer.
 *
 * Por que a chave de serviço aqui, sendo que a regra do `servico.ts` é que
 * nenhuma rota de gente a use: `protege_cobranca` devolve `dono_id` ao valor
 * anterior em toda escrita que não venha do serviço, e é essa proteção que
 * impede alguém de apontar a página dos outros para si. A exceção é uma função
 * só, com quatro guardas próprios, e o que esta rota escolhe dela vem de um
 * cookie que só o nosso servidor escreveu, depois de conferir que aquela conta
 * provisória era mesmo a dona do rascunho. O destino é sempre a sessão de quem
 * está pedindo, então ninguém consegue mover página para conta alheia.
 */
async function levarORascunho(para: string): Promise<string> {
  const jar = await cookies();
  const guardado = jar.get(RASCUNHO)?.value;
  if (!guardado) return para;

  jar.delete({ name: RASCUNHO, path: "/auth" });

  const [negocio, de] = guardado.split(":");
  if (!negocio || !de) return para;

  const sb = await servidor();
  const { data: quem } = await sb.auth.getUser();
  const destino = quem.user?.id;
  if (!destino || destino === de) return para;

  if (!temChaveDeServico) return "/painel?rascunho=cheio";

  const { error } = await servico().rpc("migrar_rascunho", {
    p_negocio: negocio,
    p_de: de,
    p_para: destino,
  });

  // O caso que recusa na prática é o do limite: a conta de sempre já tem a
  // página que o plano gratuito permite. O painel diz isso em uma linha, e o
  // resto dos guardas termina no mesmo lugar, porque para quem está olhando a
  // tela o desfecho é o mesmo.
  return error ? "/painel?rascunho=cheio" : "/painel?rascunho=veio";
}
