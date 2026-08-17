import { conferirAssinatura } from "./assinatura.ts";
import { motivoDoStatusDetail } from "./erros.ts";
import { DIAS_DE_TESTE, MESES_DO_CICLO, PLANOS } from "./precos.ts";
import type {
  AssinaturaCriada,
  Aviso,
  Ciclo,
  CobrancaCriada,
  DadosAvulso,
  DadosCartao,
  Gateway,
  Meio,
  MotivoRecusa,
  Resultado,
  SituacaoAssinatura,
  SituacaoCobranca,
} from "./tipos.ts";

/**
 * O Mercado Pago por trás do contrato de `tipos.ts`.
 *
 * `fetch` direto, sem SDK de servidor. São seis chamadas HTTP no total, e o
 * SDK traria uma árvore de dependências inteira, com o próprio calendário de
 * atualização de segurança, para economizar umas trinta linhas. O
 * `package.json` de um produto que uma pessoa só mantém é um custo, e este
 * arquivo é o preço de deixá-lo magro.
 *
 * Quatro promessas que este módulo cumpre para quem chama:
 *
 *   1. Nenhuma exceção sai daqui. Rede caída, JSON quebrado, tempo esgotado,
 *      resposta com formato estranho: tudo vira `{ok:false, motivo}`. A rota
 *      do checkout nunca precisa de try/catch.
 *   2. Nenhum float atravessa a fronteira. Centavo inteiro entra, centavo
 *      inteiro sai. O decimal que a API do Mercado Pago pede nasce em
 *      `emReais` e morre no `JSON.stringify` da mesma chamada.
 *   3. Nenhuma chamada que cria dinheiro vai sem `X-Idempotency-Key`. A chave
 *      é o uuid da cobrança, criado e gravado por quem chama, antes de chamar.
 *      Clique duplo, retry do navegador e reenvio de fila cobram uma vez só.
 *   4. Nada é registrado em log. Nem o token de acesso, nem o segredo do
 *      webhook, nem o token do cartão. Este arquivo tem zero `console`, e é de
 *      propósito: log de gateway é onde credencial vaza, porque o log vai para
 *      um lugar que a revisão de segurança esqueceu que existia.
 */

const BASE = "https://api.mercadopago.com";

/**
 * Tempo limite de cada chamada.
 *
 * Doze segundos porque o autorizador do cartão passa de cinco em horário de
 * pico, e porque a rota do Next tem o próprio limite mais adiante. Melhor
 * responder "o banco demorou, tente de novo" do que ficar pendurado até o
 * limite da hospedagem e devolver uma tela de erro genérica.
 */
const TEMPO_LIMITE_MS = 12000;

type Registro = Record<string, unknown>;

function objeto(v: unknown): Registro {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Registro)
    : {};
}

/** Texto útil, ou nulo. Número vira texto porque o id do pagamento chega número. */
function texto(v: unknown): string | null {
  if (typeof v === "string") return v.trim() === "" ? null : v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/**
 * Centavo inteiro vira o decimal que a API espera.
 *
 * Fora de exportação de propósito. Este é o único ponto do produto em que
 * dinheiro é ponto flutuante, e ele vive por uma linha: o valor sai daqui
 * direto para o `JSON.stringify` do corpo da requisição.
 */
function emReais(centavos: number): number {
  return Math.round(centavos) / 100;
}

/** O caminho de volta: o decimal da resposta vira centavo inteiro de novo. */
function emCentavos(valor: unknown): number {
  const n = typeof valor === "number" ? valor : Number(valor);
  // O arredondamento é obrigatório: 179 * 100 dá 17899.999999999996 em algumas
  // combinações de valor, e um centavo perdido a cada cobrança vira diferença
  // de conciliação no fim do mês.
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Onde o Mercado Pago escondeu a explicação da recusa, nesta resposta. */
function detalheDoCorpo(d: Registro): string | null {
  const direto = texto(d.status_detail);
  if (direto) return direto;

  const causas = Array.isArray(d.cause) ? d.cause : [];
  for (const c of causas) {
    const item = objeto(c);
    const achado = texto(item.description) ?? texto(item.code);
    if (achado) return achado;
  }

  return texto(d.error) ?? texto(d.message);
}

function motivoDoHttp(status: number, d: Registro): MotivoRecusa {
  // 401 e 403 são sempre configuração nossa: token ausente, token de teste
  // apontado para produção, ou escopo faltando. Nunca é culpa de quem paga.
  if (status === 401 || status === 403) return "chave_ausente";
  if (status === 404) return "cobranca_ausente";
  if (status === 429 || status >= 500) return "provedor_fora";

  const detalhe = detalheDoCorpo(d);
  if (detalhe) return motivoDoStatusDetail(detalhe);
  return status >= 400 && status < 500 ? "dados_incompletos" : "recusa_do_banco";
}

/**
 * Uma chamada à API, com tudo que pode dar errado já traduzido.
 *
 * O token é lido a cada chamada, e não uma vez no topo do arquivo: assim um
 * ambiente sem a variável responde "chave_ausente" na hora da cobrança, em vez
 * de derrubar o processo inteiro na importação do módulo.
 */
async function pedir(
  metodo: "GET" | "POST" | "PUT",
  caminho: string,
  corpo?: Registro,
  idempotencia?: string,
): Promise<Resultado<Registro>> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return { ok: false, motivo: "chave_ausente" };

  const cabecalhos: Record<string, string> = {
    authorization: `Bearer ${token}`,
    accept: "application/json",
  };
  if (corpo !== undefined) cabecalhos["content-type"] = "application/json";
  if (idempotencia) cabecalhos["X-Idempotency-Key"] = idempotencia;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch {
    // DNS, TLS, socket fechado e tempo esgotado caem todos aqui, e todos
    // significam a mesma coisa para quem está pagando: tente de novo.
    return { ok: false, motivo: "provedor_fora" };
  }

  let dados: Registro = {};
  let lido = false;
  try {
    const cru = await resposta.text();
    dados = cru === "" ? {} : objeto(JSON.parse(cru));
    lido = true;
  } catch {
    lido = false;
  }

  if (resposta.ok) {
    // Resposta 200 que veio ilegível é o provedor com problema, e insistir na
    // leitura só produziria um objeto vazio com cara de cobrança criada.
    if (!lido) return { ok: false, motivo: "provedor_fora" };
    return { ok: true, valor: dados };
  }

  return { ok: false, motivo: motivoDoHttp(resposta.status, dados) };
}

function situacaoAssinatura(status: string | null): SituacaoAssinatura {
  switch (status) {
    case "authorized":
      return "autorizada";
    case "paused":
      return "pausada";
    case "cancelled":
      return "cancelada";
    default:
      return "pendente";
  }
}

function situacaoCobranca(status: string | null): SituacaoCobranca {
  switch (status) {
    case "approved":
    case "authorized":
      return "aprovada";
    case "in_process":
    case "in_mediation":
      return "em_analise";
    case "rejected":
      return "recusada";
    case "refunded":
    case "charged_back":
      return "devolvida";
    case "cancelled":
      return "cancelada";
    default:
      return "pendente";
  }
}

/** Qual dos dois planos tem este valor. Nulo quando a cobrança veio de fora. */
function cicloDoValor(centavos: number): Ciclo | null {
  if (centavos === PLANOS.anual.valorCentavos) return "anual";
  if (centavos === PLANOS.mensal.valorCentavos) return "mensal";
  return null;
}

function meioDaResposta(d: Registro): Meio {
  if (texto(d.payment_method_id) === "pix") return "pix";
  switch (texto(d.payment_type_id)) {
    case "debit_card":
      return "debito";
    case "bank_transfer":
      return "pix";
    default:
      return "credito";
  }
}

function lerCobranca(d: Registro, ciclo: Ciclo | null, meio: Meio): CobrancaCriada {
  const interacao = objeto(objeto(d.point_of_interaction).transaction_data);
  const situacao = situacaoCobranca(texto(d.status));
  const valorCentavos = emCentavos(d.transaction_amount);

  return {
    idExterno: texto(d.id) ?? "",
    situacao,
    valorCentavos,
    ciclo: ciclo ?? cicloDoValor(valorCentavos),
    meio,
    pixCopiaECola: texto(interacao.qr_code),
    pixQrBase64: texto(interacao.qr_code_base64),
    expiraEm: texto(d.date_of_expiration),
    motivo:
      situacao === "recusada" ? motivoDoStatusDetail(texto(d.status_detail)) : null,
  };
}

function lerAssinatura(
  d: Registro,
  ciclo: Ciclo,
  valorPedidoCentavos: number,
): AssinaturaCriada {
  const recorrente = objeto(d.auto_recurring);
  const temTeste = Object.keys(objeto(recorrente.free_trial)).length > 0;
  const proxima = texto(d.next_payment_date);
  const valor =
    recorrente.transaction_amount === undefined
      ? valorPedidoCentavos
      : emCentavos(recorrente.transaction_amount);

  return {
    idExterno: texto(d.id) ?? "",
    situacao: situacaoAssinatura(texto(d.status)),
    ciclo,
    valorCentavos: valor,
    // Com teste grátis, a próxima cobrança é justamente o fim do teste: o
    // Mercado Pago empurra a primeira fatura para o dia seguinte ao sétimo.
    testeAte: temTeste ? proxima : null,
    proximaCobranca: proxima,
  };
}

/**
 * Assinatura recorrente no crédito, com os sete dias de teste.
 *
 * `status: "authorized"` porque o cartão já vem autorizado pelo token: sem
 * isso a assinatura nasce pendente e fica esperando uma segunda confirmação
 * que o Checkout Transparente já resolveu no navegador.
 *
 * `frequency_type: "months"` nos dois ciclos. O anual é doze meses, e não
 * `frequency: 1, frequency_type: "years"`, porque o `/preapproval` só conhece
 * "days" e "months".
 */
async function assinarComCartao(
  p: DadosCartao,
): Promise<Resultado<AssinaturaCriada>> {
  const plano = PLANOS[p.ciclo];

  const corpo: Registro = {
    reason: p.descricao,
    external_reference: p.referencia,
    payer_email: p.emailDoPagador,
    card_token_id: p.tokenDoCartao,
    back_url: p.urlDeVolta,
    status: "authorized",
    auto_recurring: {
      frequency: MESES_DO_CICLO[p.ciclo],
      frequency_type: "months",
      transaction_amount: emReais(plano.valorCentavos),
      currency_id: "BRL",
      free_trial: { frequency: DIAS_DE_TESTE, frequency_type: "days" },
    },
  };

  const r = await pedir("POST", "/preapproval", corpo, p.idempotencia);
  if (!r.ok) return r;
  return { ok: true, valor: lerAssinatura(r.valor, p.ciclo, plano.valorCentavos) };
}

/**
 * Cobrança avulsa, que compra um ciclo e termina ali.
 *
 * O Pix volta pendente, com o código para colar, e vira aprovado pelo aviso do
 * webhook. O débito volta decidido na hora, e decidido pode ser recusado: aí a
 * função devolve `{ok:false}` com o motivo, para a tela ter a frase pronta. A
 * cobrança recusada continua existindo no Mercado Pago, e quem quiser guardar
 * a tentativa consulta pelo id depois.
 */
async function cobrarUmaVez(p: DadosAvulso): Promise<Resultado<CobrancaCriada>> {
  const plano = PLANOS[p.ciclo];

  const pagador: Registro = { email: p.emailDoPagador };
  if (p.documento) {
    pagador.identification = {
      type: p.documento.tipo,
      number: p.documento.numero,
    };
  }

  const corpo: Registro = {
    transaction_amount: emReais(plano.valorCentavos),
    description: p.descricao,
    external_reference: p.referencia,
    payer: pagador,
  };
  if (p.urlDeAviso) corpo.notification_url = p.urlDeAviso;

  if (p.meio === "pix") {
    corpo.payment_method_id = "pix";
  } else {
    // O débito também passa pelo token do navegador. Sem ele, a chamada iria
    // até o Mercado Pago só para voltar com 400, gastando doze segundos.
    if (!p.tokenDoCartao) return { ok: false, motivo: "dados_incompletos" };
    corpo.token = p.tokenDoCartao;
    corpo.installments = 1;
    if (p.idDoMeio) corpo.payment_method_id = p.idDoMeio;
  }

  const r = await pedir("POST", "/v1/payments", corpo, p.idempotencia);
  if (!r.ok) return r;

  const cobranca = lerCobranca(r.valor, p.ciclo, p.meio);
  if (cobranca.situacao === "recusada") {
    return { ok: false, motivo: cobranca.motivo ?? "recusa_do_banco" };
  }
  return { ok: true, valor: cobranca };
}

/**
 * O estado de uma cobrança, direto na fonte.
 *
 * É esta função que o webhook chama depois de conferir a assinatura do aviso.
 * O corpo do aviso diz apenas que algo mudou, e acreditar no corpo do aviso é
 * acreditar em texto que chegou pela internet aberta.
 *
 * Diferente de `cobrarUmaVez`, a recusa aqui volta como `{ok:true}` com
 * `situacao: "recusada"`: quem consulta quer o estado, inclusive o ruim, para
 * gravar. Quem cobra quer a frase para a tela.
 */
async function consultarCobranca(
  idExterno: string,
): Promise<Resultado<CobrancaCriada>> {
  if (!idExterno) return { ok: false, motivo: "cobranca_ausente" };

  const r = await pedir("GET", `/v1/payments/${encodeURIComponent(idExterno)}`);
  if (!r.ok) return r;
  return { ok: true, valor: lerCobranca(r.valor, null, meioDaResposta(r.valor)) };
}

/** Cancela a recorrência. O ciclo já pago segue valendo até vencer. */
async function cancelarAssinatura(idExterno: string): Promise<Resultado<void>> {
  if (!idExterno) return { ok: false, motivo: "cobranca_ausente" };

  const r = await pedir(
    "PUT",
    `/preapproval/${encodeURIComponent(idExterno)}`,
    { status: "cancelled" },
  );
  if (!r.ok) return r;
  return { ok: true, valor: undefined };
}

function tipoDoAviso(bruto: string | null): Aviso["tipo"] {
  switch (bruto) {
    case "payment":
      return "pagamento";
    case "subscription_preapproval":
    case "preapproval":
      return "assinatura";
    default:
      return "outro";
  }
}

/**
 * Confere o aviso do webhook e devolve o pouco que dá para confiar nele.
 *
 * `null` significa uma coisa só: a assinatura saiu diferente, ou o carimbo de
 * tempo é velho demais. Quem chama responde 401 e para, sem olhar o conteúdo.
 *
 * Sobre de onde sai o `data.id`: a documentação do Mercado Pago manda usar o
 * `data.id` da query da URL. Esta função recebe corpo e cabeçalhos, então lê o
 * `data.id` do corpo, que nos avisos de pagamento e de assinatura carrega o
 * mesmo valor (e o manifesto o coloca em minúsculas dos dois lados de
 * qualquer jeito). Quem quiser a conferência presa à query tem
 * `conferirAssinatura`, exportada e pura, e passa o valor que quiser.
 */
async function lerAviso(corpo: string, cabecalhos: Headers): Promise<Aviso | null> {
  try {
    let dados: Registro;
    try {
      dados = objeto(JSON.parse(corpo));
    } catch {
      return null;
    }

    const idExterno = texto(objeto(dados.data).id) ?? texto(dados.id);

    const confere = conferirAssinatura({
      xSignature: cabecalhos.get("x-signature"),
      xRequestId: cabecalhos.get("x-request-id"),
      dataId: idExterno,
      segredo: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      agoraMs: Date.now(),
    });
    if (!confere || !idExterno) return null;

    return {
      tipo: tipoDoAviso(texto(dados.type) ?? texto(dados.topic)),
      idExterno,
      acao: texto(dados.action),
      recebidoEm: texto(dados.date_created) ?? new Date().toISOString(),
    };
  } catch {
    // Cabeçalho estranho ou corpo com formato inesperado viram 401, que é o
    // mesmo destino de uma assinatura que saiu diferente.
    return null;
  }
}

export const mercadoPago: Gateway = {
  nome: "mercadopago",
  assinarComCartao,
  cobrarUmaVez,
  consultarCobranca,
  cancelarAssinatura,
  lerAviso,
};
