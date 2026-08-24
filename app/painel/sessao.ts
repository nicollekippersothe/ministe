import { nomeDoUsuario } from "@/lib/supabase/servidor";

/**
 * Como o painel chama quem está do outro lado da tela.
 *
 * **Existe por causa de um relato da dona do produto:** voltar ao painel depois
 * de a página já estar montada caía numa tela que abria em "Sua página" e
 * seguia direto para a lista de campos. A tela servia a página e ignorava a
 * pessoa, e quem chegava ali levava alguns segundos só para reconhecer onde
 * tinha caído.
 *
 * O nome vem do login com o Google, em `user_metadata`, e chega inteiro
 * ("Helena Vasques de Andrade"). Quem cumprimenta usa o primeiro, que é como se
 * fala com alguém em português.
 */

/**
 * O primeiro nome de um nome inteiro, ou nulo quando o que veio serve mal.
 *
 * As regras existem porque `user_metadata` é escrito pelo provedor, e o que
 * cabe ali é qualquer texto:
 *
 * - Precisa de pelo menos uma letra, senão apelido feito só de símbolo viraria
 *   saudação ("Oi, ***").
 * - Arroba reprova a linha inteira: provedor que preenche o nome com o e-mail
 *   cumprimentaria "Oi, helena.vasques".
 * - Acima de 18 caracteres devolve nulo. Primeiro nome desse tamanho é raro, e
 *   o que costuma chegar assim é um nome inteiro colado ou um texto de máquina,
 *   que num título de 28 pixels ocupa a tela inteira do celular.
 *
 * A caixa é acertada só quando o nome inteiro veio em caixa alta ou em caixa
 * baixa, que é o que teclado de celular produz. "McCartney" e "d'Ávila" chegam
 * com maiúscula no meio e passam intactos, porque ali a pessoa escreveu a caixa
 * de propósito.
 */
export function primeiroNome(nomeInteiro: string | null): string | null {
  if (nomeInteiro === null) return null;

  const limpo = nomeInteiro.trim();
  if (limpo === "" || limpo.includes("@")) return null;

  const primeiro = limpo.split(/\s+/)[0].replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
  if (primeiro === "" || primeiro.length > 18) return null;
  if (!/\p{L}/u.test(primeiro)) return null;

  const uniforme =
    primeiro === primeiro.toLocaleLowerCase("pt-BR") ||
    primeiro === primeiro.toLocaleUpperCase("pt-BR");

  if (!uniforme) return primeiro;

  return (
    primeiro.slice(0, 1).toLocaleUpperCase("pt-BR") +
    primeiro.slice(1).toLocaleLowerCase("pt-BR")
  );
}

/**
 * A linha de cumprimento do topo do painel.
 *
 * Uma frase só, com ou sem nome. **A versão sem nome é o caso comum**, e não a
 * exceção: quem monta a página antes de entrar com o Google fica numa conta
 * provisória, que nasce sem `user_metadata` nenhum. Por isso a saudação curta é
 * uma saudação inteira, do mesmo tamanho e no mesmo lugar, em vez de um espaço
 * guardado para um nome que talvez chegue.
 */
export async function saudacao(): Promise<string> {
  const nome = primeiroNome(await nomeDoUsuario());
  return nome ? `Oi, ${nome}` : "Oi";
}
