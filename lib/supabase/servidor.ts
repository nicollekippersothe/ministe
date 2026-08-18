import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { configurado, SUPABASE_CHAVE, SUPABASE_URL } from "./config";

/**
 * Cliente do Supabase para o servidor.
 *
 * Fala pelo cookie de sessão de quem está pedindo a página, então cada consulta
 * roda como aquela pessoa e a RLS decide o que ela enxerga. É de propósito que
 * não exista aqui nenhum caminho com a chave secreta: se algum dia um erro de
 * política deixar passar o que não devia, o erro aparece no produto em vez de
 * ficar escondido atrás de uma chave que ignora a RLS.
 */
export async function servidor() {
  const jar = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_CHAVE, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (novos) => {
        try {
          for (const { name, value, options } of novos) {
            jar.set(name, value, options);
          }
        } catch {
          // Server Component não escreve cookie. Quem renova a sessão é o
          // middleware, que roda antes e escreve na resposta.
        }
      },
    },
  });
}

/**
 * O uuid de quem está pedindo, ou nulo quando ainda ninguém entrou.
 *
 * Sem Supabase configurado devolve nulo em vez de estourar. As três funções
 * daqui são chamadas de dentro de páginas que também rodam no destino de
 * arquivo local, e uma delas derrubou o painel inteiro por criar cliente com
 * URL vazia. Quem escolhe o destino é lib/dados.ts, e aqui é só responder.
 */
export async function usuarioAtual(): Promise<string | null> {
  if (!configurado) return null;
  const sb = await servidor();
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Devolve o uuid de quem está pedindo, criando uma conta provisória se ainda
 * não houver nenhuma.
 *
 * É o começo do cadastro: a pessoa monta a página antes de entrar com o
 * Google, e para o banco ela precisa ser alguém desde o primeiro clique,
 * senão a RLS recusa e não teria onde guardar o rascunho.
 *
 * Só pode ser chamada de Server Action ou Route Handler, que é onde dá para
 * gravar cookie. De dentro de uma página o cookie da sessão nova se perderia.
 */
export async function garantirConta(): Promise<string | null> {
  if (!configurado) return null;
  const sb = await servidor();

  const { data: quem } = await sb.auth.getUser();
  if (quem.user) return quem.user.id;

  const { data, error } = await sb.auth.signInAnonymously();
  if (error) return null;
  return data.user?.id ?? null;
}

/**
 * Se a conta é provisória.
 *
 * Conta provisória monta a página e guarda rascunho. Publicar pede conta
 * confirmada, e quem recusa de verdade é o gatilho protege_publicacao no banco.
 * Isto aqui é só para a tela saber o que oferecer.
 */
export async function contaProvisoria(): Promise<boolean> {
  if (!configurado) return false;
  const sb = await servidor();
  const { data } = await sb.auth.getUser();
  return data.user?.is_anonymous === true;
}

/**
 * O e-mail de quem está pedindo, ou nulo.
 *
 * Existe para o checkout: o `/preapproval` do Mercado Pago pede `payer_email`,
 * e a conta provisória não tem nenhum, que é justamente por que assinar exige
 * entrar com o Google antes.
 */
export async function emailDoUsuario(): Promise<string | null> {
  if (!configurado) return null;
  const sb = await servidor();
  const { data } = await sb.auth.getUser();
  const email = data.user?.email;
  return typeof email === "string" && email !== "" ? email : null;
}
