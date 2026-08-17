import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { gateway } from "@/lib/pagamento";
import type { AssinaturaCriada, Aviso, MotivoRecusa } from "@/lib/pagamento";
import { fimDoPeriodoIso } from "@/lib/pagamento";
import { servico } from "@/lib/supabase/servico";

/**
 * O webhook do Mercado Pago. É aqui, e só aqui, que o plano pago é escrito.
 *
 * Node, e não edge, porque a conferência da assinatura usa `node:crypto`.
 *
 * A ordem dos passos abaixo é a coisa mais importante deste arquivo, e cada um
 * deles fecha um jeito conhecido de o dinheiro sair errado:
 *
 *   1. Ler o corpo como texto cru, antes de qualquer `JSON.parse`. O HMAC é
 *      sobre bytes, e reserializar o objeto muda os bytes.
 *   2. Conferir a assinatura. Este endereço é público: sem esta linha,
 *      qualquer pessoa manda um POST e ganha plano pago.
 *   3. Travar a idempotência antes de agir. O Mercado Pago reenvia o mesmo
 *      aviso quando a resposta demora.
 *   4. Buscar o recurso na API deles. O corpo do aviso é um cutucão, e nada
 *      dele vira dado: ele chegou pela internet aberta.
 *   5. Aplicar por tópico, sempre por função do banco.
 *   6. Revalidar a página pública e o painel, senão a pessoa paga e continua
 *      vendo a versão em cache do plano gratuito por até uma hora.
 *
 * Sobre os códigos de resposta: 200 quando entendemos e resolvemos, ou quando
 * ignoramos de propósito. 401 quando a assinatura saiu diferente, sem corpo,
 * porque mensagem de erro num endereço público é manual de como acertar o
 * HMAC. 500 só no transitório, para o gateway reentregar. Nunca 200 escondendo
 * falha nossa: aviso perdido no crédito é o cliente pagando sem receber.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Motivos que passam sozinhos, e por isso pedem reentrega.
 *
 * A distinção importa: `cobranca_ausente` é definitivo (o id não existe lá, e
 * insistir não muda isso), enquanto provedor fora do ar e chave de acesso
 * recusada voltam ao normal sem ninguém mexer no aviso.
 */
const PASSAGEIROS: ReadonlySet<MotivoRecusa> = new Set<MotivoRecusa>([
  "provedor_fora",
  "chave_ausente",
]);

/** Erro que faz o webhook devolver 500 para o Mercado Pago tentar de novo. */
class Passageiro extends Error {}

/** Erro que o webhook engole com 200, porque reentregar daria o mesmo. */
class Definitivo extends Error {}

/** Abre um resultado do gateway, ou levanta o erro do tipo certo. */
function exigir<T>(
  r: { ok: true; valor: T } | { ok: false; motivo: MotivoRecusa },
): T {
  if (r.ok) return r.valor;
  if (PASSAGEIROS.has(r.motivo)) throw new Passageiro(r.motivo);
  throw new Definitivo(r.motivo);
}

/**
 * Log estruturado, sem nada que seja segredo.
 *
 * O que entra: tópico, id do objeto no provedor, e o que foi decidido. O que
 * nunca entra: corpo do aviso, cabeçalho de assinatura, token de acesso e
 * qualquer dado do cartão. A cobrança recorrente é a parte menos estável da
 * API de assinaturas, e sem esta linha o dia em que ela mudar de formato vira
 * uma investigação às cegas.
 */
function registrar(campos: Record<string, string | number | null>) {
  console.log(JSON.stringify({ onde: "pagamento/webhook", ...campos }));
}

type Cliente = SupabaseClient;

export async function POST(pedido: Request) {
  // 1. Texto cru. Nada de `pedido.json()` aqui em cima.
  const corpo = await pedido.text();

  // 2. Assinatura. `lerAviso` devolve nulo tanto para HMAC diferente quanto
  //    para carimbo de tempo velho, que é a defesa contra reenvio gravado.
  const aviso = await gateway.lerAviso(corpo, pedido.headers);
  if (!aviso) return new Response(null, { status: 401 });

  if (aviso.tipo === "outro") {
    // Tópico que o produto não usa. Responder 200 encerra a reentrega, que é o
    // certo: o Mercado Pago manda avisos de coisas que a gente nunca assinou.
    registrar({ acao: aviso.acao, decisao: "topico ignorado" });
    return new Response(null, { status: 200 });
  }

  let sb: Cliente;
  try {
    sb = servico();
  } catch {
    // Chave de serviço ausente é configuração, e configuração se conserta. 500
    // para o Mercado Pago reentregar depois que ela existir.
    registrar({ topico: aviso.tipo, decisao: "sem chave de servico" });
    return new Response(null, { status: 500 });
  }

  // 3. A trava. Vem antes de agir, e o insert é a própria trava: a chave
  //    primária de avisos_pagamento é (provedor, id_evento).
  const trava = await sb.from("avisos_pagamento").insert({
    provedor: gateway.nome,
    id_evento: aviso.idDoEvento,
    topico: aviso.tipo,
  });

  if (trava.error) {
    if (trava.error.code === "23505") {
      registrar({ topico: aviso.tipo, decisao: "aviso repetido" });
      return new Response(null, { status: 200 });
    }
    registrar({ topico: aviso.tipo, decisao: "banco recusou a trava" });
    return new Response(null, { status: 500 });
  }

  try {
    const negocio = await aplicar(sb, aviso);
    if (negocio) await revalidar(sb, negocio);
    return new Response(null, { status: 200 });
  } catch (erro) {
    if (erro instanceof Definitivo) {
      // Aviso que a gente entende e resolve nada: 200, porque reentregar daria
      // o mesmo resultado e a trava já guardou que ele passou por aqui.
      registrar({ topico: aviso.tipo, decisao: `sem acao: ${erro.message}` });
      return new Response(null, { status: 200 });
    }

    // Falha passageira. A trava precisa sair, senão a reentrega bate nela e
    // devolve 200 sem nunca ter aplicado nada, e o cliente fica pago sem plano.
    await soltar(sb, aviso);
    registrar({ topico: aviso.tipo, decisao: "reentregar" });
    return new Response(null, { status: 500 });
  }
}

async function soltar(sb: Cliente, aviso: Aviso) {
  await sb
    .from("avisos_pagamento")
    .delete()
    .eq("provedor", gateway.nome)
    .eq("id_evento", aviso.idDoEvento);
}

/** Devolve o id do negócio afetado, para revalidar a página dele. */
async function aplicar(sb: Cliente, aviso: Aviso): Promise<string | null> {
  switch (aviso.tipo) {
    case "assinatura":
      return await daAssinatura(sb, aviso.idExterno);
    case "cobranca_da_assinatura":
      return await daCobrancaRecorrente(sb, aviso.idExterno);
    case "pagamento":
      return await doPagamentoAvulso(sb, aviso.idExterno);
    default:
      return null;
  }
}

/**
 * Tópico `subscription_preapproval`: a assinatura mudou de estado.
 *
 * É por aqui que o teste de sete dias vira plano pago, e é por aqui que o
 * cancelamento chega quando quem cancela é o Mercado Pago (cartão que sumiu,
 * assinatura pausada pelo titular no aplicativo deles).
 */
async function daAssinatura(sb: Cliente, idExterno: string) {
  const assinatura = exigir(await gateway.consultarAssinatura(idExterno));
  const negocio = assinatura.referencia;
  if (!negocio) throw new Definitivo("assinatura sem referencia");

  if (assinatura.situacao === "cancelada" || assinatura.situacao === "pausada") {
    const r = await sb.rpc("encerrar_assinatura", { p_negocio: negocio });
    if (r.error) throw new Passageiro(r.error.message);
    registrar({ topico: "assinatura", id: idExterno, decisao: "encerrada" });
    return negocio;
  }

  if (assinatura.situacao !== "autorizada") {
    // Pendente é assinatura que o Mercado Pago ainda está decidindo. O aviso da
    // decisão vem depois, e é ele que vale.
    throw new Definitivo("assinatura pendente");
  }

  await abrir(sb, assinatura, negocio);
  registrar({
    topico: "assinatura",
    id: idExterno,
    decisao: assinatura.cobrancasFeitas === 0 ? "teste aberto" : "ciclo ativo",
  });
  return negocio;
}

/**
 * Cria ou atualiza a linha da assinatura, e devolve o uuid dela.
 *
 * As duas datas saem da consulta, e nunca do nosso relógio. Enquanto nenhuma
 * cobrança saiu, a próxima data é o fim do teste; depois da primeira, a mesma
 * data passa a ser o fim do ciclo pago. Quem sabe disso é `cobrancasFeitas`,
 * que vem do provedor.
 */
async function abrir(
  sb: Cliente,
  assinatura: AssinaturaCriada,
  negocio: string,
): Promise<string | null> {
  const cobrou = assinatura.cobrancasFeitas > 0;
  const testeAte = assinatura.testeAte;
  const cicloAte = cobrou ? assinatura.proximaCobranca : null;

  if (!testeAte && !cicloAte) {
    // Assinatura autorizada, sem teste e sem cobrança nenhuma ainda. Não existe
    // nada pago para escrever, e inventar uma data aqui seria dar plano de
    // graça. O aviso da primeira cobrança vem em seguida.
    throw new Definitivo("assinatura sem periodo valido");
  }

  const r = await sb.rpc("abrir_assinatura", {
    p_negocio: negocio,
    p_id_externo: assinatura.idExterno,
    p_ciclo: assinatura.ciclo,
    p_meio: "credito",
    p_valor_centavos: assinatura.valorCentavos,
    p_teste_ate: testeAte,
    p_ciclo_ate: cicloAte,
  });
  if (r.error) throw new Passageiro(r.error.message);

  return typeof r.data === "string" ? r.data : null;
}

/**
 * Tópico `subscription_authorized_payment`: a fatura mensal da recorrência.
 *
 * É este que estende o plano todo mês de quem paga no crédito, e por isso é o
 * caminho mais importante do arquivo. Ele consulta a assinatura junto, de
 * propósito: a fatura sozinha diz o valor e o resultado, e a data do fim do
 * ciclo é a próxima cobrança, que só a assinatura sabe.
 */
async function daCobrancaRecorrente(sb: Cliente, idExterno: string) {
  const fatura = exigir(await gateway.consultarCobrancaDaAssinatura(idExterno));
  if (!fatura.idDaAssinatura) throw new Definitivo("fatura sem assinatura");

  const assinatura = exigir(
    await gateway.consultarAssinatura(fatura.idDaAssinatura),
  );
  const negocio = assinatura.referencia;
  if (!negocio) throw new Definitivo("assinatura sem referencia");

  if (fatura.situacao === "recusada") {
    // Carência de cinco dias. Tirar a página do ar na tarde em que o cartão
    // falhou é o pior momento possível, e o Mercado Pago ainda vai tentar de
    // novo sozinho.
    const r = await sb.rpc("marcar_atraso", {
      p_negocio: negocio,
      p_carencia_dias: 5,
    });
    if (r.error) throw new Passageiro(r.error.message);
    registrar({ topico: "recorrente", id: idExterno, decisao: "em atraso" });
    return negocio;
  }

  if (fatura.situacao !== "aprovada") {
    throw new Definitivo(`fatura ${fatura.situacao}`);
  }

  const linha = await abrir(sb, assinatura, negocio);
  const ate = assinatura.proximaCobranca ?? fimDoPeriodoIso(Date.now(), assinatura.ciclo);

  const r = await sb.rpc("registrar_cobranca_paga", {
    p_negocio: negocio,
    p_assinatura: linha,
    p_id_externo: fatura.idDoPagamento ?? fatura.idExterno,
    p_meio: "credito",
    p_valor_centavos: fatura.valorCentavos || assinatura.valorCentavos,
    p_ate: ate,
  });
  if (r.error) throw new Passageiro(r.error.message);

  registrar({ topico: "recorrente", id: idExterno, decisao: "ciclo estendido" });
  return negocio;
}

/**
 * Tópico `payment`: Pix, débito, e o estorno de qualquer meio.
 *
 * A cobrança que a assinatura gerou também chega aqui, e ela é ignorada na
 * aprovação de propósito: quem estende o ciclo do crédito é o tópico da
 * fatura, que sabe a data certa. Tratar os dois somaria um ciclo a mais. O
 * estorno, esse vale para os dois, porque é o único caminho que traz de volta
 * o dinheiro devolvido de uma cobrança recorrente.
 */
async function doPagamentoAvulso(sb: Cliente, idExterno: string) {
  const cobranca = exigir(await gateway.consultarCobranca(idExterno));
  const negocio = cobranca.referencia;
  if (!negocio) throw new Definitivo("pagamento sem referencia");

  if (cobranca.situacao === "devolvida") {
    const r = await sb.rpc("desfazer_cobranca", {
      p_id_externo: cobranca.idExterno || idExterno,
    });
    if (r.error) throw new Passageiro(r.error.message);
    registrar({ topico: "pagamento", id: idExterno, decisao: "devolvida" });
    return negocio;
  }

  if (cobranca.situacao !== "aprovada") {
    throw new Definitivo(`pagamento ${cobranca.situacao}`);
  }

  if (cobranca.daAssinatura) {
    throw new Definitivo("cobranca da assinatura, tratada no outro topico");
  }

  // Pix e débito compram um ciclo, contado do instante da aprovação. A conta é
  // civil e no fuso de São Paulo, e é a mesma de todo vencimento do produto.
  const ciclo = cobranca.ciclo ?? "mensal";
  const r = await sb.rpc("registrar_cobranca_paga", {
    p_negocio: negocio,
    p_assinatura: null,
    p_id_externo: cobranca.idExterno || idExterno,
    p_meio: cobranca.meio,
    p_valor_centavos: cobranca.valorCentavos,
    p_ate: fimDoPeriodoIso(Date.now(), ciclo),
  });
  if (r.error) throw new Passageiro(r.error.message);

  registrar({ topico: "pagamento", id: idExterno, decisao: `${cobranca.meio} pago` });
  return negocio;
}

/**
 * Tira do cache a página pública e o painel.
 *
 * Sem isto a pessoa paga e continua vendo a assinatura do rodapé por até uma
 * hora, que é o `revalidate` de `app/[slug]`. É o passo mais fácil de esquecer
 * e o mais visível para quem acabou de pagar.
 *
 * Falha aqui não derruba o webhook: o dinheiro já entrou e o plano já mudou, e
 * pedir reentrega por causa do cache faria a cobrança ser aplicada de novo.
 */
async function revalidar(sb: Cliente, negocio: string) {
  try {
    const { data } = await sb
      .from("negocios")
      .select("slug")
      .eq("id", negocio)
      .maybeSingle();

    const slug = typeof data?.slug === "string" ? data.slug : null;
    if (slug) revalidatePath(`/${slug}`);
    revalidatePath("/painel");
  } catch {
    registrar({ negocio, decisao: "revalidacao falhou" });
  }
}
