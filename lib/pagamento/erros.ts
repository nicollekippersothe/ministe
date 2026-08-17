import type { MotivoRecusa } from "./tipos.ts";

/**
 * A tradução da recusa para uma frase que a pessoa consegue usar.
 *
 * No molde de `MOTIVOS_LINK`, de `lib/links.ts`: um registro fechado, com o
 * compilador cobrando uma frase para cada motivo que existir.
 *
 * Duas regras de escrita valem em cada linha daqui.
 *
 * A primeira é a do projeto: a frase diz o que existe. O texto de recusa é o
 * pior lugar do produto para escorregar nisso, porque quem lê está com o
 * cartão na mão, já digitou tudo, e uma frase que só anuncia a derrota manda
 * a pessoa embora. Toda frase aqui termina numa saída: confira este campo,
 * ligue para o banco, use o Pix.
 *
 * A segunda é comercial: quando o cartão volta, o Pix é a saída que aprova na
 * hora e aprova quase sempre. Todo motivo em que insistir no cartão tende a
 * dar no mesmo lugar oferece o Pix na mesma frase.
 *
 * O que estas frases evitam de propósito: repetir o palavrório do banco. O
 * `status_detail` do Mercado Pago existe para o log e para a conciliação, e a
 * pessoa que está pagando ganha zero em ler "cc_rejected_high_risk".
 */
export const MOTIVOS_PAGAMENTO: Record<MotivoRecusa, string> = {
  codigo_seguranca: "Confira o código de segurança, os três dígitos do verso.",
  data_do_cartao:
    "Confira o mês e o ano de validade, do jeito que estão gravados no cartão.",
  numero_do_cartao: "Confira os números da frente do cartão, um a um.",
  valor_alto_para_o_cartao:
    "O banco pediu outro cartão para este valor. O Pix aprova na hora.",
  autorizacao_do_banco:
    "O banco pede a sua autorização para este valor. Ligue para o número do verso do cartão e tente de novo.",
  risco:
    "O banco segurou esta compra para conferir. Use outro cartão ou pague com Pix, que aprova na hora.",
  tentativas:
    "Este cartão chegou ao limite de tentativas de hoje. Use outro cartão ou pague com Pix, que aprova na hora.",
  cartao_bloqueado:
    "Este cartão está bloqueado para compra pela internet. Ligue para o banco para liberar, ou pague com Pix.",
  cobranca_repetida:
    "Esta cobrança já entrou há poucos minutos. Confira o seu extrato antes de tentar de novo.",
  recusa_do_banco:
    "O pagamento voltou do banco. Tente outro cartão ou pague com Pix, que aprova na hora.",
  dados_incompletos: "Confira os dados do cartão e envie de novo.",
  cobranca_ausente: "Comece um pagamento novo para seguir.",
  chave_ausente: "O pagamento volta em instantes. Tente de novo daqui a pouco.",
  provedor_fora: "O banco demorou para responder. Aguarde um instante e tente de novo.",
};

/**
 * O `status_detail` do Mercado Pago, já sem o prefixo, virando motivo nosso.
 *
 * A chave é o sufixo porque o mesmo detalhe chega com prefixo diferente
 * conforme a rota: `cc_rejected_high_risk` no cartão, `rejected_high_risk` em
 * outros meios, e `cc_amount_rate_limit_exceeded` sem o "rejected" no meio.
 * Guardar o sufixo evita uma linha por variação, e evita o dia em que uma
 * variação nova cai no caso guarda-chuva por causa de um prefixo.
 */
const POR_DETALHE: Record<string, MotivoRecusa> = {
  bad_filled_security_code: "codigo_seguranca",
  bad_filled_date: "data_do_cartao",
  bad_filled_card_number: "numero_do_cartao",
  bad_filled_other: "dados_incompletos",
  insufficient_amount: "valor_alto_para_o_cartao",
  amount_rate_limit_exceeded: "valor_alto_para_o_cartao",
  call_for_authorize: "autorizacao_do_banco",
  high_risk: "risco",
  blacklist: "risco",
  max_attempts: "tentativas",
  card_disabled: "cartao_bloqueado",
  card_type_not_allowed: "cartao_bloqueado",
  duplicated_payment: "cobranca_repetida",
  card_error: "recusa_do_banco",
  other_reason: "recusa_do_banco",
  by_bank: "recusa_do_banco",
  insufficient_data: "dados_incompletos",
  invalid_installments: "dados_incompletos",
};

const PREFIXOS = ["cc_rejected_", "rejected_", "cc_"];

/** Tira o prefixo de rota e deixa o detalhe na forma que a tabela conhece. */
export function normalizarDetalhe(detalhe: string | null | undefined): string {
  let s = (detalhe ?? "").trim().toLowerCase();
  for (const p of PREFIXOS) {
    if (s.startsWith(p)) {
      s = s.slice(p.length);
      break;
    }
  }
  return s;
}

/**
 * Traduz o `status_detail` do Mercado Pago para um motivo nosso.
 *
 * Detalhe desconhecido cai em `recusa_do_banco`, que é o guarda-chuva, e a
 * frase dele serve para qualquer recusa: diz que o banco respondeu e oferece
 * as duas saídas. Assim um código novo do provedor aparece na tela como uma
 * frase útil em vez de uma tela em branco.
 */
export function motivoDoStatusDetail(
  detalhe: string | null | undefined,
): MotivoRecusa {
  return POR_DETALHE[normalizarDetalhe(detalhe)] ?? "recusa_do_banco";
}

/** A frase pronta para a tela. */
export function mensagemDeRecusa(motivo: MotivoRecusa): string {
  return MOTIVOS_PAGAMENTO[motivo];
}

/** Atalho para quem tem o detalhe cru na mão e quer só a frase. */
export function mensagemDoStatusDetail(
  detalhe: string | null | undefined,
): string {
  return mensagemDeRecusa(motivoDoStatusDetail(detalhe));
}
