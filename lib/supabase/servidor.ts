import { cache } from "react";
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
export const servidor = cache(async function servidor() {
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
});

/**
 * Quem está pedindo esta página, perguntado uma vez por pedido.
 *
 * **Isto é a maior conta de rede do painel, e por isso ele mora sozinho aqui.**
 * `getUser` é uma ida e volta ao servidor de auth do Supabase, que fica em São
 * Paulo. As quatro funções abaixo precisavam da mesma resposta, e cada uma
 * perguntava por conta própria: uma tela que chamasse `usuarioAtual`,
 * `contaProvisoria` e `emailDoUsuario` fazia a mesma pergunta três vezes, uma
 * esperando a outra. Com o `cache` do React a pergunta sai uma vez por pedido e
 * as outras chamadas recebem a mesma promessa, inclusive as que acontecem em
 * paralelo.
 *
 * O `cache` é por pedido, e não entre pedidos: ele nasce e morre com o render,
 * então ninguém enxerga a sessão de outra pessoa. É a diferença entre este e
 * qualquer cache de verdade, e é o que o torna seguro para dado de sessão.
 *
 * Continua sendo `getUser`, e não `getSession`: aqui a resposta decide o que a
 * pessoa enxerga, então ela precisa vir conferida pelo servidor de auth.
 */
const quemEstaPedindo = cache(async function quemEstaPedindo() {
  if (!configurado) return null;
  const sb = await servidor();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
});

/**
 * O uuid de quem está pedindo, ou nulo quando ainda ninguém entrou.
 *
 * Sem Supabase configurado devolve nulo em vez de estourar, e o mesmo vale
 * para as duas de baixo. Elas são chamadas de dentro de páginas que também
 * rodam no destino de arquivo local, e uma delas derrubou o painel inteiro por
 * criar cliente com URL vazia. Quem escolhe o destino é lib/dados.ts, e aqui é
 * só responder.
 */
export async function usuarioAtual(): Promise<string | null> {
  return (await quemEstaPedindo())?.id ?? null;
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
 *
 * Pergunta pelo próprio `getUser`, fora do `quemEstaPedindo` de cima, e é de
 * propósito: o `cache` do React guarda a resposta pelo pedido inteiro, e esta
 * função é a única que muda quem está pedindo no meio do caminho. Quem chamar
 * `usuarioAtual` depois desta, no mesmo pedido, recebe a resposta de antes, que
 * seria nula. O jeito seguro é o de hoje, e ele está em `criar()`: usar o uuid
 * que sai daqui, direto, em vez de perguntar de novo.
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
 *
 * **Lê o mesmo campo que o gatilho lê, e isso é regra e não coincidência.** O
 * `protege_publicacao` da correção 005 decide por `auth.jwt() ->> 'is_anonymous'`,
 * que é o valor gravado dentro do token. Se esta função passasse a decidir por
 * outra coisa, por exemplo pela existência de e-mail, a tela ofereceria publicar
 * para quem o banco vai recusar, e a pessoa levaria um erro no lugar de um
 * convite. Quando os dois lados discordam, quem está errado é o token, e o
 * conserto é renová-lo: ver `app/auth/retorno/route.ts`.
 */
export async function contaProvisoria(): Promise<boolean> {
  return (await quemEstaPedindo())?.is_anonymous === true;
}

/**
 * O e-mail de quem está pedindo, ou nulo.
 *
 * Existe para o checkout: o `/preapproval` do Mercado Pago pede `payer_email`,
 * e a conta provisória não tem nenhum, que é justamente por que assinar exige
 * entrar com o Google antes.
 */
export async function emailDoUsuario(): Promise<string | null> {
  const email = (await quemEstaPedindo())?.email;
  return typeof email === "string" && email !== "" ? email : null;
}
