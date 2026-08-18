"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/app/painel/vitrine";
import { cobrancaDoDono, idDoNegocioDoDono } from "@/lib/dados";
import { NOME_PRODUTO } from "@/lib/marca";
import { PLANOS, gateway } from "@/lib/pagamento";
import type { Ciclo } from "@/lib/pagamento";
import { urlBase } from "@/lib/site";
import { contaProvisoria, emailDoUsuario, servidor } from "@/lib/supabase/servidor";
import { COOKIE_DO_PIX, VIDA_DO_PIX_S } from "./cookie";

/**
 * As três ações da tela do plano.
 *
 * Único arquivo de `app/` fora do webhook que importa `@/lib/pagamento`, de
 * propósito: assim a superfície que fala com o gateway cabe numa revisão.
 *
 * **Nenhuma delas escreve plano.** Nem plano, nem assinatura, nem cobrança. O
 * webhook é o único escritor, e a correção 011 explica por quê: duas mãos
 * escrevendo a mesma assinatura fazem o índice de assinatura viva recusar a
 * segunda, e o cliente fica pago com a página no gratuito. Ver COBRANCA.md.
 */

function cicloDoFormulario(formData: FormData): Ciclo | null {
  const bruto = String(formData.get("ciclo") ?? "");
  return bruto === "mensal" || bruto === "anual" ? bruto : null;
}

/**
 * Tudo que precisa ser verdade antes de qualquer cobrança começar.
 *
 * O uuid do negócio é o item mais importante daqui. Ele vira o
 * `external_reference` da cobrança, e é por ele que o webhook acha o negócio.
 * Chamar o gateway sem ele produz o pior desfecho possível: o dinheiro entra, o
 * webhook responde 200 em silêncio, e o plano fica no gratuito.
 */
async function conferirAntesDeCobrar(ciclo: Ciclo | null) {
  exigirLogin();

  if (ciclo === null) redirect("/painel/plano?erro=ciclo");

  if (await contaProvisoria()) redirect("/entrar?motivo=assinar");

  const email = await emailDoUsuario();
  if (email === null) redirect("/entrar?motivo=assinar");

  const negocioId = await idDoNegocioDoDono();
  if (negocioId === null) redirect("/painel/plano?erro=conta");

  return { ciclo, email, negocioId };
}

/**
 * A assinatura recorrente no crédito, com os sete dias de teste.
 *
 * O token do cartão vem do navegador. O número do cartão passa longe daqui.
 */
export async function assinarComCartao(formData: FormData) {
  const ciclo = cicloDoFormulario(formData);
  const token = String(formData.get("tokenDoCartao") ?? "").trim();

  const { email, negocioId } = await conferirAntesDeCobrar(ciclo);
  const escolhido = ciclo as Ciclo;

  if (token === "") {
    redirect(`/painel/plano?meio=credito&ciclo=${escolhido}&erro=dados_incompletos`);
  }

  /*
   * A trava contra a assinatura dobrada, do lado de cá.
   *
   * A chave de idempotência é gerada por tentativa, e a tela não tem onde
   * gravá-la antes de falar com o gateway (a 009 tira a escrita de `cobrancas`
   * de quem está logado, e a 011 diz que a tela não escreve a assinatura). Duas
   * tentativas viram dois preapproval, e no oitavo dia a pessoa paga duas
   * vezes.
   *
   * Esta leitura pega o caso comum. Ela perde uma corrida de duas requisições
   * simultâneas, e é por isso que o webhook também sabe reconhecer a duplicata
   * e cancelá-la no Mercado Pago.
   */
  const estado = await cobrancaDoDono();
  const viva =
    estado.assinatura !== null && estado.assinatura.status !== "encerrada";
  if (viva) redirect("/painel/plano?erro=assinatura_viva");

  // Sem try/catch: o gateway é contratualmente livre de exceção, e um catch
  // aqui engoliria o erro que o próprio `redirect` levanta.
  const r = await gateway.assinarComCartao({
    idempotencia: crypto.randomUUID(),
    ciclo: escolhido,
    tokenDoCartao: token,
    emailDoPagador: email,
    urlDeVolta: `${urlBase}/painel/plano`,
    referencia: negocioId,
    descricao: `${NOME_PRODUTO} ${PLANOS[escolhido].rotulo.toLowerCase()}`,
  });

  if (!r.ok) {
    // O meio e o ciclo continuam na URL para a pessoa cair de volta no
    // formulário com o plano que ela escolheu ainda escolhido.
    redirect(`/painel/plano?meio=credito&ciclo=${escolhido}&erro=${r.motivo}`);
  }

  // Para a tela de espera, e nunca para o painel: o plano só vira pago quando o
  // webhook chegar, daqui a alguns segundos, e mostrar o plano gratuito logo
  // depois de alguém pagar se lê como falha.
  redirect(
    `/painel/plano?aguardando=credito&ciclo=${escolhido}&desde=${Date.now()}`,
  );
}

/**
 * O Pix, que compra um ciclo à vista.
 *
 * O copia e cola do banco fica fora do banco de dados, por decisão da 009: é
 * segredo em repouso com ganho pequeno, e morre em trinta minutos. O que vai
 * no cookie é só o id do pagamento, e a tela relê o código no Mercado Pago a
 * cada recarga.
 */
export async function pagarComPix(formData: FormData) {
  const ciclo = cicloDoFormulario(formData);
  const { email, negocioId } = await conferirAntesDeCobrar(ciclo);
  const escolhido = ciclo as Ciclo;

  const estado = await cobrancaDoDono();
  const viva =
    estado.assinatura !== null && estado.assinatura.status !== "encerrada";
  if (viva) redirect("/painel/plano?erro=assinatura_viva");

  const r = await gateway.cobrarUmaVez({
    idempotencia: crypto.randomUUID(),
    ciclo: escolhido,
    meio: "pix",
    emailDoPagador: email,
    referencia: negocioId,
    descricao: `${NOME_PRODUTO} ${PLANOS[escolhido].rotulo.toLowerCase()}`,
  });

  if (!r.ok) {
    redirect(`/painel/plano?meio=pix&ciclo=${escolhido}&erro=${r.motivo}`);
  }

  const jar = await cookies();
  jar.set(COOKIE_DO_PIX, r.valor.idExterno, {
    httpOnly: true,
    sameSite: "lax",
    secure: urlBase.startsWith("https://"),
    path: "/painel/plano",
    maxAge: VIDA_DO_PIX_S,
  });

  redirect(`/painel/plano?meio=pix&ciclo=${escolhido}&codigo=1`);
}

/**
 * Cancelar, que o decreto do SAC manda ser tão fácil quanto assinar.
 *
 * Não mexe em `plano_expira_em`: quem cancela no dia 3 pagou até o dia 30, e
 * tirar a página do ar na hora seria cobrar por um mês e entregar três dias.
 * Quem rebaixa é o vencimento, sozinho.
 *
 * Quem escreve o encerramento é o webhook, quando o aviso do cancelamento
 * chegar. Aqui só o pedido sai.
 */
export async function cancelarPlano() {
  exigirLogin();

  const estado = await cobrancaDoDono();
  const assinatura = estado.assinatura;

  if (assinatura === null || assinatura.status === "encerrada") {
    redirect("/painel/plano");
  }

  const negocioId = await idDoNegocioDoDono();
  if (negocioId === null) redirect("/painel/plano?erro=conta");

  const externo = await idExternoDaAssinatura(negocioId);
  if (externo === null) {
    // Assinatura viva sem id no provedor é caminho que parou antes de chegar
    // lá. Aqui o cancelamento é do Pix ou do débito, que não renovam sozinhos:
    // o período pago segue valendo e a renovação simplesmente não acontece.
    redirect("/painel/plano?cancelado=1");
  }

  const r = await gateway.cancelarAssinatura(externo);
  if (!r.ok) redirect(`/painel/plano?erro=${r.motivo}`);

  redirect("/painel/plano?cancelado=1");
}

/** O id da assinatura viva no provedor, lido pela sessão do próprio dono. */
async function idExternoDaAssinatura(negocioId: string): Promise<string | null> {
  const sb = await servidor();
  const { data } = await sb
    .from("assinaturas")
    .select("id_externo")
    .eq("negocio_id", negocioId)
    .in("status", ["teste", "ativa", "em_atraso"])
    .maybeSingle();

  const externo = data?.id_externo;
  return typeof externo === "string" && externo !== "" ? externo : null;
}
