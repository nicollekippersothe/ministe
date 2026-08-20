import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * O cliente da chave de serviço. Só o webhook de pagamento importa daqui.
 *
 * Esta chave passa por cima da RLS inteira. Com ela, uma consulta lê a página
 * de qualquer pessoa, escreve na de qualquer pessoa, e chama as funções que dão
 * plano pago de graça. Tudo que o schema construiu em política, gatilho e
 * limite fica de lado.
 *
 * Por que ela existe mesmo assim: o gatilho `protege_cobranca` devolve o valor
 * anterior de `plano` e `plano_expira_em` em toda escrita que não venha do
 * serviço. É proteção certa, e o preço dela é que precisa existir exatamente
 * uma porta aberta. Essa porta é o webhook, que roda no servidor, é acionado
 * pelo Mercado Pago e nunca por um clique.
 *
 * As três regras, e a razão de cada uma:
 *
 *   1. **Nenhuma tela, Server Action ou rota que a pessoa alcança importa este
 *      arquivo.** Se um dia for mais fácil resolver um problema de RLS com a
 *      chave de serviço, o problema é a política, e não a chave.
 *
 *      A exceção é `app/auth/retorno`, e ela está escrita aqui para continuar
 *      sendo exceção. Aquela rota chama uma função só, `migrar_rascunho`, que
 *      existe porque `protege_cobranca` devolve `dono_id` ao valor anterior em
 *      toda escrita que não venha do serviço, e essa proteção é justamente o
 *      que impede alguém de apontar a página dos outros para si. A função tem
 *      quatro guardas próprios, o negócio que a rota passa vem de um cookie
 *      `httpOnly` que só o nosso servidor escreveu, e o destino é sempre a
 *      sessão de quem está pedindo. Uma segunda porta pede a mesma conversa.
 *   2. **A chave nunca sai daqui.** Nada de repassar o cliente para componente,
 *      nem de ler a variável em outro lugar.
 *   3. **O guarda abaixo é a última linha de defesa.** Se este módulo entrar
 *      num bundle de navegador, ele quebra a página em vez de publicar a chave
 *      no HTML. Barulhento é o comportamento certo: chave de serviço vazada é
 *      recuperável só trocando a chave, e ninguém troca o que não sabe que
 *      vazou.
 *
 * O nome da variável é `SUPABASE_SERVICE_ROLE_KEY`, sem `NEXT_PUBLIC_`. Isso é
 * o que faz o Next apagar o valor de qualquer bundle de cliente, e é a razão de
 * ela não estar em `config.ts` junto das outras duas, que são públicas por
 * definição.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "lib/supabase/servico.ts foi carregado no navegador. Este módulo é só do servidor.",
  );
}

const CHAVE_DE_SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Se dá para falar como serviço. Falso em desenvolvimento sem a chave. */
export const temChaveDeServico = SUPABASE_URL !== "" && CHAVE_DE_SERVICO !== "";

/**
 * Cliente com a chave de serviço, sem sessão e sem cookie.
 *
 * Lança quando a chave falta, em vez de devolver um cliente que responderia
 * como visitante: um webhook que silenciosamente vira `anon` recusa a escrita
 * do plano e responde 200, e o cliente paga sem receber nada.
 */
export function servico() {
  if (!temChaveDeServico) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente. O webhook de pagamento precisa dela para escrever o plano.",
    );
  }

  return createClient(SUPABASE_URL, CHAVE_DE_SERVICO, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
