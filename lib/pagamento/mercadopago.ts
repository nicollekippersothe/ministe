import {
  acharManifesto,
  conferirAssinaturaDetalhe,
  lerCabecalhoDeAssinatura,
  montarManifesto,
} from "./assinatura.ts";
import { NOME_PRODUTO } from "../marca.ts";
import { motivoDoStatusDetail } from "./erros.ts";
import { DIAS_DE_TESTE, MESES_DO_CICLO, PLANOS } from "./precos.ts";
import type {
  AssinaturaCriada,
  Aviso,
  Ciclo,
  CobrancaCriada,
  CobrancaDaAssinatura,
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
 *   4. Nenhuma credencial é registrada em log. Nem o token de acesso, nem o
 *      segredo do webhook, nem o token do cartão, nem o número do cartão, que
 *      nem chega aqui. Log de gateway é onde credencial vaza, porque o log vai
 *      para um lugar que a revisão de segurança esqueceu que existia.
 *
 *      O que vai para o log é só o suficiente para saber por que a chamada
 *      falhou: o caminho, o código HTTP, e a frase de erro do próprio Mercado
 *      Pago. Isso existe porque a primeira falha de verdade em produção deixou
 *      uma tela dizendo "o banco demorou" e nada mais, e descobrir o motivo
 *      virou adivinhação. Ver `anotar`, logo abaixo de `pedir`.
 *
 * SOBRE A QUALIDADE DA INTEGRAÇÃO
 *
 * O painel deles dá uma nota de 0 a 100 à integração, com 73 de mínimo, e a
 * nota mede o quanto o corpo da cobrança alimenta o antifraude. Ela paga em
 * dinheiro: integração magra recusa cartão de cliente legítimo. O que este
 * arquivo manda por causa disso, e onde:
 *
 *   `X-meli-session-id`   cabeçalho, nas duas chamadas que criam cobrança. É o
 *                         identificador do aparelho, colhido no navegador. A
 *                         documentação deles descreve exatamente este caminho,
 *                         e é o item de maior peso.
 *   `statement_descriptor` corpo do `/v1/payments`. O nome que sai na fatura.
 *   `additional_info`     corpo do `/v1/payments`. Os itens da compra e o nome
 *                         de quem paga.
 *
 * O `/preapproval` recebe menos: `reason`, `external_reference`, `payer_email`,
 * `card_token_id`, `back_url`, `status`, `auto_recurring` e `notification_url`,
 * e mais nada. `additional_info` e `statement_descriptor` ficam de fora dele
 * porque a referência da API deles nem lista os dois ali, e campo que a API
 * ignora só engorda o corpo. Quem faz o papel de descritor na assinatura é o
 * `reason`, que já vai. O cabeçalho do aparelho vale nos dois, porque é
 * transporte, e a cobrança recorrente vira pagamento do lado de lá.
 *
 * O que fica de fora de propósito: telefone e endereço do pagador. O produto
 * tem o e-mail do login, o nome do login e o CPF que a pessoa digita no
 * formulário do cartão, e mais nada sobre ela. Campo inventado é mentira sobre
 * uma pessoa, e a medição deles pune dado que não bate com o cadastro.
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
 * O identificador do aparelho, conferido antes de virar cabeçalho.
 *
 * O valor nasce no navegador de quem paga, e daqui ele vai para dentro de um
 * cabeçalho HTTP. Texto de navegador entrando em cabeçalho é injeção de
 * cabeçalho quando ninguém confere: basta uma quebra de linha para o pedido
 * sair com um cabeçalho a mais. O `fetch` levantaria, e a chamada apareceria
 * como provedor fora do ar, escondendo a causa.
 *
 * Por isso a régua é uma lista do que passa, e não uma lista do que barra: o
 * valor deles é hexadecimal com pontos, então letra, número, ponto, hífen e
 * sublinhado bastam. Qualquer outra coisa devolve nulo, e o campo some da
 * chamada, que é o desfecho certo para um valor em que não dá para confiar.
 */
function idDeAparelhoLimpo(bruto: string | null | undefined): string | null {
  if (typeof bruto !== "string") return null;
  const limpo = bruto.trim();
  return /^[A-Za-z0-9._-]{1,256}$/.test(limpo) ? limpo : null;
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
  idDoAparelho?: string | null,
): Promise<Resultado<Registro>> {
  // O `trim` é regra, e não zelo: painel de hospedagem guarda o valor com a
  // quebra de linha que veio junto na hora de colar, e um cabeçalho com quebra
  // de linha faz o `fetch` levantar antes de sair da máquina. O sintoma é a
  // chamada falhando na hora, com cara de provedor fora do ar.
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) return { ok: false, motivo: "chave_ausente" };

  const cabecalhos: Record<string, string> = {
    authorization: `Bearer ${token}`,
    accept: "application/json",
  };
  if (corpo !== undefined) cabecalhos["content-type"] = "application/json";
  if (idempotencia) cabecalhos["X-Idempotency-Key"] = idempotencia;

  const aparelho = idDeAparelhoLimpo(idDoAparelho);
  if (aparelho) cabecalhos["X-meli-session-id"] = aparelho;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch (e) {
    // DNS, TLS, socket fechado e tempo esgotado caem todos aqui, e todos
    // significam a mesma coisa para quem está pagando: tente de novo. Para
    // quem mantém, significam coisas bem diferentes, e por isso o log separa.
    anotar(caminho, { erro: semSegredo(e, token) });
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
    if (!lido) {
      anotar(caminho, { status: resposta.status, erro: "corpo ilegível" });
      return { ok: false, motivo: "provedor_fora" };
    }
    return { ok: true, valor: dados };
  }

  const motivo = motivoDoHttp(resposta.status, dados);
  anotar(caminho, { status: resposta.status, motivo, dizem: detalheDoCorpo(dados) });
  return { ok: false, motivo };
}

/**
 * A linha de log de uma chamada que falhou.
 *
 * Um `console.error` por falha, e nenhum por sucesso: o que interessa aqui é o
 * caminho, o código HTTP e a frase que o Mercado Pago devolveu. Nada de
 * cabeçalho, nada de corpo inteiro, nada de token. Sem isto, toda falha de
 * gateway chega como a mesma frase de tela e o motivo vira adivinhação.
 */
function anotar(caminho: string, dados: Record<string, unknown>) {
  console.error(`mercadopago ${caminho}`, JSON.stringify(dados));
}

/**
 * A mensagem de uma exceção, com o token apagado.
 *
 * Cinto e suspensório de uma linha: a exceção de cabeçalho inválido é
 * justamente a que pode carregar o valor do cabeçalho junto, e o valor do
 * cabeçalho é o token de acesso.
 */
function semSegredo(e: unknown, token: string): string {
  const bruto = e instanceof Error ? `${e.name}: ${e.message}` : "desconhecido";
  return bruto.split(token).join("***");
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

/**
 * O ciclo de uma assinatura consultada, lido do `auto_recurring`.
 *
 * O `/preapproval` só conhece "days" e "months", então o anual chega como doze
 * meses. Quando o formato vier de um jeito que não dá para ler, o valor decide,
 * e é por isso que os dois preços do produto são diferentes.
 */
function cicloDaRecorrencia(recorrente: Registro, centavos: number): Ciclo {
  const tipo = texto(recorrente.frequency_type);
  const quantos = Number(recorrente.frequency);
  if (tipo === "months" && Number.isFinite(quantos)) {
    return quantos >= 12 ? "anual" : "mensal";
  }
  return cicloDoValor(centavos) ?? "mensal";
}

/** Quantas cobranças o provedor diz que já saíram desta assinatura. */
function cobrancasFeitas(d: Registro): number {
  const resumo = objeto(d.summarized);
  const n = Number(resumo.charged_quantity);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
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
    referencia: texto(d.external_reference),
    // "recurring_payment" é o que o Mercado Pago escreve na cobrança que a
    // assinatura gerou sozinha. Compra avulsa vem "regular_payment".
    daAssinatura: texto(d.operation_type) === "recurring_payment",
    motivo:
      situacao === "recusada" ? motivoDoStatusDetail(texto(d.status_detail)) : null,
  };
}

/**
 * O `ciclo` entra nulo na consulta, porque ali ninguém sabe o que foi pedido, e
 * a resposta é a única fonte. Na criação vem preenchido, e vale mais que a
 * leitura, porque é o que a pessoa escolheu na tela.
 */
function lerAssinatura(
  d: Registro,
  ciclo: Ciclo | null,
  valorPedidoCentavos: number,
): AssinaturaCriada {
  const recorrente = objeto(d.auto_recurring);
  const temTeste = Object.keys(objeto(recorrente.free_trial)).length > 0;
  const proxima = texto(d.next_payment_date);
  const valor =
    recorrente.transaction_amount === undefined
      ? valorPedidoCentavos
      : emCentavos(recorrente.transaction_amount);
  const feitas = cobrancasFeitas(d);

  return {
    idExterno: texto(d.id) ?? "",
    situacao: situacaoAssinatura(texto(d.status)),
    ciclo: ciclo ?? cicloDaRecorrencia(recorrente, valor),
    valorCentavos: valor,
    // Com teste grátis, a próxima cobrança é justamente o fim do teste: o
    // Mercado Pago empurra a primeira fatura para o dia seguinte ao sétimo.
    //
    // Depois da primeira cobrança essa mesma data passa a ser a próxima fatura,
    // e aí ela deixa de ser fim de teste. É o que `cobrancasFeitas` resolve, e
    // é por isso que a conta é feita aqui e não em quem lê.
    testeAte: temTeste && feitas === 0 ? proxima : null,
    proximaCobranca: proxima,
    referencia: texto(d.external_reference),
    cobrancasFeitas: feitas,
  };
}

/** A fatura que a recorrência gerou sozinha, de `/authorized_payments/{id}`. */
function lerCobrancaDaAssinatura(d: Registro): CobrancaDaAssinatura {
  // O status que importa é o do pagamento por dentro, e não o do envelope: o
  // envelope diz "processed" tanto para o que foi aprovado quanto para o que o
  // banco recusou.
  const pagamento = objeto(d.payment);
  const situacao = situacaoCobranca(texto(pagamento.status));

  return {
    idExterno: texto(d.id) ?? "",
    idDaAssinatura: texto(d.preapproval_id),
    idDoPagamento: texto(pagamento.id),
    situacao,
    valorCentavos: emCentavos(d.transaction_amount),
    motivo:
      situacao === "recusada"
        ? motivoDoStatusDetail(texto(pagamento.status_detail))
        : null,
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
  // Pedido por cobrança, e não deixado para a configuração do painel deles. A
  // tela de webhooks do Mercado Pago oferece uma caixa só para assinatura, e
  // ela vale para a cobrança recorrente: o aviso da assinatura nascendo, que é
  // o que abre o teste de sete dias, chega por este campo. Sem ele, a pessoa
  // paga e o plano fica no gratuito até a primeira renovação.
  if (p.urlDeAviso) corpo.notification_url = p.urlDeAviso;

  // O identificador do aparelho vai por cabeçalho, e é por isso que ele cabe
  // aqui: o corpo do `/preapproval` aceita oito campos contados, e nenhum
  // deles é este. Ver a nota sobre qualidade da integração, no topo.
  const r = await pedir(
    "POST",
    "/preapproval",
    corpo,
    p.idempotencia,
    p.idDoAparelho,
  );
  if (!r.ok) return r;
  return { ok: true, valor: lerAssinatura(r.valor, p.ciclo, plano.valorCentavos) };
}

/**
 * O nome que sai na fatura de quem paga.
 *
 * Sai da marca, e nunca escrito à mão aqui: é o mesmo nome do logotipo, e a
 * regra do projeto é que ele viva num arquivo só. A caixa fica como a marca
 * escreve, porque quem coloca em maiúscula é o extrato do banco, e não nós.
 *
 * Curto de propósito: bandeira e banco cortam o descritor, e o pedaço que
 * sobra é o que a pessoa lê na hora de decidir se reconhece a compra. Nome que
 * ela reconhece é estorno que não acontece.
 */
const NOME_NA_FATURA = NOME_PRODUTO;

/**
 * O que foi comprado, do jeito que o antifraude deles lê.
 *
 * `category_id: "service"` é o valor que a documentação de dados de indústria
 * deles usa para serviço, e este produto é assinatura de serviço. Categoria
 * errada atrapalha mais que categoria ausente, então o valor sai de lá e não
 * de invenção nossa.
 *
 * `unit_price` é o único decimal daqui, e ele nasce em `emReais` na linha em
 * que o corpo é montado, como todo o resto do módulo.
 */
function itensDaCompra(ciclo: Ciclo, descricao: string): Registro[] {
  const plano = PLANOS[ciclo];
  return [
    {
      id: `plano-${ciclo}`,
      title: descricao,
      description: plano.descricao,
      category_id: "service",
      quantity: 1,
      unit_price: emReais(plano.valorCentavos),
    },
  ];
}

/**
 * O nome inteiro cortado em primeiro e resto, que é o formato deles.
 *
 * Quem tem um nome só fica com `first_name` e sem `last_name`, em vez de
 * repetir o mesmo pedaço nos dois campos: repetir seria inventar sobrenome.
 * Nome vazio devolve nulo, e o bloco inteiro sai da chamada.
 */
function nomeEmPartes(bruto: string | null | undefined): Registro | null {
  const inteiro = typeof bruto === "string" ? bruto.trim() : "";
  if (inteiro === "") return null;

  const partes = inteiro.split(/\s+/);
  const primeiro = partes[0];
  const resto = partes.slice(1).join(" ");

  const nome: Registro = { first_name: primeiro };
  if (resto !== "") nome.last_name = resto;
  return nome;
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

  // O que a medição de qualidade chama de informação do comprador e do
  // produto. Só entra o que existe de verdade: os itens saem da tabela de
  // preços, e o pagador leva o nome do login quando o login trouxe um.
  const adicional: Registro = {
    items: itensDaCompra(p.ciclo, p.descricao),
  };
  const nome = nomeEmPartes(p.nomeDoPagador);
  if (nome) adicional.payer = nome;

  const corpo: Registro = {
    transaction_amount: emReais(plano.valorCentavos),
    description: p.descricao,
    statement_descriptor: NOME_NA_FATURA,
    external_reference: p.referencia,
    payer: pagador,
    additional_info: adicional,
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

  const r = await pedir(
    "POST",
    "/v1/payments",
    corpo,
    p.idempotencia,
    p.idDoAparelho,
  );
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

/**
 * O estado de uma assinatura recorrente, direto na fonte.
 *
 * É o que o webhook chama quando chega um aviso de `subscription_preapproval`.
 * Traz o `external_reference` de volta, que é como o aviso vira um negócio do
 * nosso banco: o aviso em si carrega um id do Mercado Pago e mais nada.
 */
async function consultarAssinatura(
  idExterno: string,
): Promise<Resultado<AssinaturaCriada>> {
  if (!idExterno) return { ok: false, motivo: "cobranca_ausente" };

  const r = await pedir("GET", `/preapproval/${encodeURIComponent(idExterno)}`);
  if (!r.ok) return r;
  return { ok: true, valor: lerAssinatura(r.valor, null, 0) };
}

/**
 * A fatura mensal que a assinatura gerou sozinha.
 *
 * É a chamada menos estável da API de assinaturas, e é justamente ela que
 * estende o plano todo mês de quem paga no crédito. Quando ela sai do ar, o
 * webhook devolve 500 e o Mercado Pago reentrega, que é o comportamento certo:
 * melhor tentar de novo do que rebaixar quem pagou.
 */
async function consultarCobrancaDaAssinatura(
  idExterno: string,
): Promise<Resultado<CobrancaDaAssinatura>> {
  if (!idExterno) return { ok: false, motivo: "cobranca_ausente" };

  const r = await pedir(
    "GET",
    `/authorized_payments/${encodeURIComponent(idExterno)}`,
  );
  if (!r.ok) return r;
  return { ok: true, valor: lerCobrancaDaAssinatura(r.valor) };
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
    case "subscription_authorized_payment":
    case "authorized_payment":
      return "cobranca_da_assinatura";
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
async function lerAviso(
  corpo: string,
  cabecalhos: Headers,
  url?: string | null,
): Promise<Aviso | null> {
  try {
    let dados: Registro;
    try {
      dados = objeto(JSON.parse(corpo));
    } catch {
      anotar("aviso", { erro: "corpo ilegível" });
      return null;
    }

    const idExterno = texto(objeto(dados.data).id) ?? texto(dados.id);

    // O `data.id` do endereço, quando ele vem. A documentação deles descreve o
    // manifesto com o id que chega na URL, e o aviso de verdade traz
    // `?data.id=...&type=payment` no endereço. O corpo é a reserva, porque o
    // simulador do painel manda o aviso sem nenhum parâmetro.
    const idDaUrl = url ? new URL(url).searchParams.get("data.id") : null;

    const confere = conferirAssinaturaDetalhe({
      xSignature: cabecalhos.get("x-signature"),
      xRequestId: cabecalhos.get("x-request-id"),
      dataId: idDaUrl ?? idExterno,
      // O `trim` pela mesma razão do token de acesso: painel de hospedagem
      // guarda a quebra de linha que veio junto na hora de colar, e aqui ela
      // entraria no HMAC e faria toda assinatura sair diferente.
      segredo: process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim(),
      agoraMs: Date.now(),
    });

    if (!confere.ok || !idExterno) {
      // A resposta continua sendo 401 sem corpo. O motivo fica no log, porque
      // segredo ausente, carimbo velho e HMAC diferente pedem três conserto
      // bem diferentes, e do lado de fora os três parecem a mesma coisa.
      anotar("aviso", {
        motivo: idExterno ? confere.motivo : "sem data.id",
        manifesto: confere.manifesto ?? null,
        atrasoS: confere.atrasoS ?? null,
        tamanhoDoSegredo: confere.tamanhoDoSegredo,
        tipo: texto(dados.type) ?? texto(dados.topic),
        // Qual variação de manifesto bateria, se alguma. Nulo aqui quer dizer
        // que o problema está no segredo, e não no formato, que é a bifurcação
        // que sobra depois de o carimbo e o cabeçalho estarem certos.
        bateriaCom:
          confere.motivo === "hmac_diferente"
            ? diagnosticar(cabecalhos, dados, idExterno, idDaUrl)
            : null,
      });
      return null;
    }

    const tipo = tipoDoAviso(texto(dados.type) ?? texto(dados.topic));
    const acao = texto(dados.action);

    return {
      tipo,
      // O `id` do topo é o do aviso, e é ele que trava a idempotência. O
      // reserva existe porque nem todo aviso do Mercado Pago traz esse campo:
      // sem ele, o par ação mais objeto separa pelo menos o aprovado do
      // estornado, que é a confusão que custa dinheiro.
      idDoEvento: texto(dados.id) ?? `${tipo}:${acao ?? "?"}:${idExterno}`,
      idExterno,
      acao,
      recebidoEm: texto(dados.date_created) ?? new Date().toISOString(),
    };
  } catch {
    // Cabeçalho estranho ou corpo com formato inesperado viram 401, que é o
    // mesmo destino de uma assinatura que saiu diferente.
    return null;
  }
}

/**
 * Testa as variações conhecidas de manifesto contra a assinatura recebida.
 *
 * Roda só quando o HMAC saiu diferente, e o resultado é uma palavra no log.
 * Nada aqui muda o que o webhook aceita: a conferência de verdade continua
 * sendo o formato documentado, e uma variação que bata é motivo para corrigir
 * o código no dia seguinte, nunca para deixar o aviso passar hoje.
 */
function diagnosticar(
  cabecalhos: Headers,
  dados: Registro,
  idDoCorpo: string | null,
  idDaUrl: string | null,
): string | null {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  const cabecalho = lerCabecalhoDeAssinatura(cabecalhos.get("x-signature"));
  if (!segredo || !cabecalho) return null;

  const rid = cabecalhos.get("x-request-id");
  const ts = cabecalho.ts;

  return acharManifesto(
    [
      { nome: "id_do_corpo", manifesto: montarManifesto(idDoCorpo, rid, ts) },
      { nome: "id_da_url", manifesto: montarManifesto(idDaUrl, rid, ts) },
      { nome: "sem_id", manifesto: montarManifesto(null, rid, ts) },
      { nome: "sem_request_id", manifesto: montarManifesto(idDoCorpo, null, ts) },
      {
        nome: "id_do_aviso",
        manifesto: montarManifesto(texto(dados.id), rid, ts),
      },
      {
        nome: "id_sem_minuscula",
        manifesto: `id:${idDoCorpo ?? ""};request-id:${rid ?? ""};ts:${ts};`,
      },
      // A sétima variação muda a chave, e não o texto. O segredo deles vem
      // como 64 caracteres hexadecimais, que é o desenho de quem guarda 32
      // bytes: se o lado de lá assinar com os bytes em vez da string, o HMAC
      // sai diferente com todo manifesto do mundo, e nenhuma das seis acima
      // acharia nada.
      ...(/^[0-9a-f]{2,}$/i.test(segredo) && segredo.length % 2 === 0
        ? [
            {
              nome: "segredo_em_bytes",
              manifesto: montarManifesto(idDoCorpo, rid, ts),
              chave: Buffer.from(segredo, "hex"),
            },
          ]
        : []),
    ],
    cabecalho.v1,
    segredo,
  );
}

export const mercadoPago: Gateway = {
  nome: "mercadopago",
  assinarComCartao,
  cobrarUmaVez,
  consultarCobranca,
  consultarAssinatura,
  consultarCobrancaDaAssinatura,
  cancelarAssinatura,
  lerAviso,
};
