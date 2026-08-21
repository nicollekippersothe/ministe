/**
 * O contrato da cobrança, escrito antes de qualquer provedor.
 *
 * A ideia é a mesma de `lib/links.ts`: quem chama recebe um resultado e trata
 * um resultado. Nenhuma exceção sobe daqui para cima, então a tela de checkout
 * nunca precisa de try/catch para mostrar uma frase à pessoa.
 *
 * Por que uma interface em vez de chamar o Mercado Pago direto: o gateway é a
 * peça mais difícil de testar do produto (tem rede, tem cartão de verdade, tem
 * ambiente de teste que se comporta diferente do de produção). Com o contrato
 * separado, todo o resto do sistema é testável com um gateway de mentira, e o
 * dia em que o Mercado Pago sair de cena troca um arquivo só.
 *
 * Dinheiro é sempre inteiro em centavos, em todo lugar deste diretório. É a
 * mesma regra de `itens.preco_centavos` no schema. Decimal existe dentro de
 * `mercadopago.ts` e morre lá dentro.
 */

/** Como a assinatura é cobrada. Mensal renova todo mês, anual renova todo ano. */
export type Ciclo = "mensal" | "anual";

/**
 * Como a pessoa paga.
 *
 * Crédito é o único que vira assinatura recorrente de verdade, e o único que
 * ganha o teste grátis: é o único meio em que o banco autoriza a cobrança
 * futura de uma vez. Pix e débito compram um ciclo e acabam ali, então o
 * vencimento é a data que manda e a renovação é uma decisão nova da pessoa.
 */
export type Meio = "credito" | "debito" | "pix";

/**
 * O que aconteceu quando a cobrança voltou.
 *
 * A lista é curta de propósito. O Mercado Pago devolve dezenas de
 * `status_detail`, e a maioria significa a mesma coisa para quem está com o
 * cartão na mão. O que importa é: dá para consertar digitando de novo, dá para
 * consertar ligando para o banco, ou é hora de oferecer o Pix. Ver `erros.ts`,
 * que traduz cada um numa frase.
 */
export type MotivoRecusa =
  /** Código de segurança digitado diferente do que está no verso. */
  | "codigo_seguranca"
  /** Mês e ano de validade digitados diferentes. */
  | "data_do_cartao"
  /** Número do cartão digitado diferente. */
  | "numero_do_cartao"
  /** O banco pediu outro cartão para este valor (saldo ou limite). */
  | "valor_alto_para_o_cartao"
  /** O banco quer a autorização da pessoa por telefone. */
  | "autorizacao_do_banco"
  /** O antifraude segurou a compra. */
  | "risco"
  /** O cartão bateu no limite de tentativas do dia. */
  | "tentativas"
  /** O cartão está bloqueado para compra pela internet. */
  | "cartao_bloqueado"
  /** A mesma cobrança já entrou há poucos minutos. */
  | "cobranca_repetida"
  /** O banco respondeu de um jeito que só ele explica. É o caso guarda-chuva. */
  | "recusa_do_banco"
  /** Algum campo chegou incompleto até o provedor. Culpa nossa ou do formulário. */
  | "dados_incompletos"
  /** O id consultado sumiu do provedor, ou nunca existiu. */
  | "cobranca_ausente"
  /** Falta `MERCADOPAGO_ACCESS_TOKEN` ou ele foi recusado. Culpa de configuração. */
  | "chave_ausente"
  /** Rede, tempo esgotado, 5xx. Tudo que é do provedor e passa sozinho. */
  | "provedor_fora";

/**
 * O resultado de toda operação de cobrança, no molde de `ConferenciaLink`.
 *
 * União discriminada em vez de exceção porque a recusa de cartão é o caminho
 * comum, não é caso excepcional: uma em cada cinco compras com cartão volta
 * recusada no Brasil. Erro que acontece o tempo todo merece um tipo, e o
 * compilador cobra o tratamento em vez de deixar passar.
 */
export type Resultado<T> =
  | { ok: true; valor: T }
  | { ok: false; motivo: MotivoRecusa };

/** Documento do pagador. O Pix pede, o cartão aceita. */
export type Documento = {
  tipo: "CPF" | "CNPJ";
  /** Somente dígitos. */
  numero: string;
};

/**
 * O que o checkout junta antes de chamar o crédito.
 *
 * `tokenDoCartao` é o token do Checkout Transparente, gerado no navegador da
 * pessoa. O número do cartão nunca passa pelo nosso servidor, e por isso o
 * token é a única coisa que chega aqui.
 */
export type DadosCartao = {
  /**
   * O uuid da cobrança, criado por quem chama e gravado antes da chamada.
   *
   * Vira o `X-Idempotency-Key`. Quem cria a chave é quem grava a linha, senão
   * um clique duplo, ou um retry do navegador, cobra duas vezes a mesma pessoa.
   */
  idempotencia: string;
  ciclo: Ciclo;
  tokenDoCartao: string;
  emailDoPagador: string;
  /** Para onde o Mercado Pago devolve a pessoa depois da autorização. */
  urlDeVolta: string;
  /** O nosso identificador da conta, para casar o aviso com o negócio. */
  referencia: string;
  /** Frase que aparece na fatura e no painel do Mercado Pago. */
  descricao: string;
  documento?: Documento | null;
  /** Para onde o provedor manda o aviso. Em branco, vale o painel do provedor. */
  urlDeAviso?: string | null;
};

/**
 * O que o checkout junta antes de chamar Pix ou débito.
 *
 * Pix e débito compram um ciclo só, então aqui a palavra assinatura não cabe:
 * é uma cobrança avulsa que empurra o vencimento para a frente.
 */
export type DadosAvulso = {
  /** O uuid da cobrança. Mesma regra do crédito. */
  idempotencia: string;
  ciclo: Ciclo;
  meio: Exclude<Meio, "credito">;
  emailDoPagador: string;
  referencia: string;
  descricao: string;
  documento?: Documento | null;
  /** Só no débito: o token do cartão, gerado no navegador. */
  tokenDoCartao?: string | null;
  /** Só no débito: o id do meio que o formulário do Mercado Pago devolve. */
  idDoMeio?: string | null;
  /** Para onde o provedor manda o aviso. Em branco, vale o painel do provedor. */
  urlDeAviso?: string | null;
};

/** Situação de uma assinatura recorrente, do jeito que o produto pensa nela. */
export type SituacaoAssinatura =
  | "autorizada"
  | "pendente"
  | "pausada"
  | "cancelada";

/** Situação de uma cobrança avulsa. */
export type SituacaoCobranca =
  | "pendente"
  | "em_analise"
  | "aprovada"
  | "recusada"
  | "devolvida"
  | "cancelada";

export type AssinaturaCriada = {
  /** O id no provedor. É a chave para consultar e para cancelar depois. */
  idExterno: string;
  situacao: SituacaoAssinatura;
  ciclo: Ciclo;
  valorCentavos: number;
  /** Fim do teste grátis, em ISO 8601. Nulo quando o teste ficou de fora. */
  testeAte: string | null;
  /** Quando o provedor cobra o próximo ciclo, em ISO 8601. */
  proximaCobranca: string | null;
  /**
   * O `referencia` que mandamos na criação, de volta.
   *
   * É por ele que o webhook descobre de quem é a assinatura. O aviso do
   * provedor carrega só um id, e o id sozinho não diz nada sobre o nosso banco.
   */
  referencia: string | null;
  /**
   * Quantas cobranças já saíram desta assinatura, segundo o provedor.
   *
   * Zero significa que a assinatura ainda está no teste grátis, e é assim que o
   * webhook decide entre "abriu o teste" e "cobrou o ciclo", sem depender do
   * nosso relógio nem de comparar datas.
   */
  cobrancasFeitas: number;
};

/**
 * Uma cobrança que a assinatura recorrente gerou sozinha.
 *
 * É a peça que estende o plano todo mês. Ela é um objeto próprio do provedor,
 * separado tanto do preapproval quanto do pagamento avulso, e por isso tem
 * consulta própria: o aviso dela chega no tópico
 * `subscription_authorized_payment`, e é o único que aparece sem ninguém ter
 * clicado em nada.
 */
export type CobrancaDaAssinatura = {
  /** O id da cobrança recorrente no provedor. */
  idExterno: string;
  /** A assinatura que a gerou, para achar o negócio pelo id_externo gravado. */
  idDaAssinatura: string | null;
  /** O pagamento por trás dela, quando já existe um. */
  idDoPagamento: string | null;
  situacao: SituacaoCobranca;
  valorCentavos: number;
  /** Preenchido quando a situação é "recusada". */
  motivo: MotivoRecusa | null;
};

export type CobrancaCriada = {
  idExterno: string;
  situacao: SituacaoCobranca;
  valorCentavos: number;
  ciclo: Ciclo | null;
  meio: Meio;
  /** Só no Pix: o texto que a pessoa cola no aplicativo do banco. */
  pixCopiaECola: string | null;
  /** Só no Pix: o mesmo código em PNG base64, para virar imagem na tela. */
  pixQrBase64: string | null;
  /** Quando o Pix expira, em ISO 8601. */
  expiraEm: string | null;
  /** O `referencia` de volta, pelo mesmo motivo da assinatura. */
  referencia: string | null;
  /**
   * Verdadeiro quando este pagamento nasceu de uma assinatura recorrente.
   *
   * Existe para o webhook desempatar: a cobrança mensal do crédito chega por
   * dois avisos, o da fatura da assinatura e o do pagamento em si. Sem esta
   * marca, o segundo seria tratado como compra avulsa e empurraria o
   * vencimento um ciclo além do que a pessoa pagou.
   */
  daAssinatura: boolean;
  /**
   * Preenchido quando `situacao` é "recusada", para a tela ter o que dizer.
   *
   * Só aparece em consulta. Na criação, a recusa volta como `{ok:false}`, que
   * é onde o motivo já mora.
   */
  motivo: MotivoRecusa | null;
};

/**
 * Um aviso do provedor que passou pela conferência da assinatura HMAC.
 *
 * De propósito, carrega quase nada: o aviso do Mercado Pago avisa que algo
 * mudou, ele não conta o que mudou. Quem recebe consulta o provedor com o
 * `idExterno` e acredita na consulta, não no corpo do aviso, que chega pela
 * internet aberta e pode ter sido remontado por qualquer um.
 */
export type Aviso = {
  /**
   * "pagamento" para /v1/payments, "assinatura" para /preapproval, e
   * "cobranca_da_assinatura" para a fatura que a recorrência gera sozinha.
   *
   * O terceiro parece detalhe e é o mais importante dos três: é ele que estende
   * o plano todo mês de quem paga no crédito. Os outros dois só aparecem quando
   * alguém clica em alguma coisa.
   */
  tipo: "pagamento" | "assinatura" | "cobranca_da_assinatura" | "outro";
  /**
   * O id do aviso em si, que é a chave da trava de idempotência.
   *
   * É diferente do `idExterno` de propósito, e a diferença é a razão de este
   * campo existir. O mesmo pagamento gera vários avisos ao longo da vida dele
   * (aprovado hoje, estornado em outubro), todos com o mesmo `data.id`. Travar
   * por `data.id` faria o estorno ser engolido como repetição do aprovado.
   */
  idDoEvento: string;
  /** O id do objeto que mudou, no provedor. */
  idExterno: string;
  /** O `action` cru do provedor, por exemplo "payment.updated". */
  acao: string | null;
  /** Quando o provedor carimbou o aviso, em ISO 8601. */
  recebidoEm: string;
};

/**
 * O que qualquer provedor de pagamento precisa saber fazer.
 *
 * `lerAviso` devolvendo `null` significa uma coisa só: a assinatura HMAC do
 * aviso saiu diferente da nossa conta, ou o carimbo de tempo é velho demais.
 * Quem chama responde 401 e para ali, sem olhar o conteúdo, porque conteúdo de
 * aviso com assinatura estranha é texto de estranho.
 */
export type Gateway = {
  nome: string;
  assinarComCartao(p: DadosCartao): Promise<Resultado<AssinaturaCriada>>;
  cobrarUmaVez(p: DadosAvulso): Promise<Resultado<CobrancaCriada>>;
  consultarCobranca(idExterno: string): Promise<Resultado<CobrancaCriada>>;
  consultarAssinatura(idExterno: string): Promise<Resultado<AssinaturaCriada>>;
  consultarCobrancaDaAssinatura(
    idExterno: string,
  ): Promise<Resultado<CobrancaDaAssinatura>>;
  cancelarAssinatura(idExterno: string): Promise<Resultado<void>>;
  lerAviso(
    corpo: string,
    cabecalhos: Headers,
    /** O endereço que recebeu o aviso. O manifesto do HMAC lê o `data.id` dele. */
    url?: string | null,
  ): Promise<Aviso | null>;
};
