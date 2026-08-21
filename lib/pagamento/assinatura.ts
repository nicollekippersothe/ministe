import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Conferência da assinatura do aviso do Mercado Pago. Pura, sem rede.
 *
 * O endereço do webhook é público: qualquer pessoa na internet pode mandar um
 * POST dizendo que uma assinatura foi paga. A única coisa que separa o aviso
 * de verdade do aviso inventado é este HMAC, e é por isso que a conferência
 * mora num arquivo próprio, sem `fetch` e sem `process.env` no meio, com teste
 * byte a byte do manifesto.
 *
 * Como funciona: o Mercado Pago manda o cabeçalho `x-signature` no formato
 * `ts=<unix em segundos>,v1=<hex>`. Montamos um texto (o manifesto) com o id
 * do objeto, o `x-request-id` e o mesmo `ts`, tiramos o HMAC SHA256 com o
 * segredo da nossa integração, e o resultado tem que bater com o `v1`.
 *
 * O formato do manifesto foi conferido na documentação do Mercado Pago e no
 * código dos SDKs oficiais (Node, Python, PHP, Ruby, Go, Java e C#, que
 * concordam entre si):
 *
 *     id:<data.id em minúsculas>;request-id:<x-request-id>;ts:<ts>;
 *
 * Três detalhes que a documentação diz e que são a causa da assinatura vir
 * diferente quando alguém escreve isto de memória:
 *
 *   1. O ponto e vírgula final existe. O manifesto termina em ";", inclusive
 *      depois do `ts`.
 *   2. O `data.id` vai em minúsculas quando vem com letra maiúscula. Os ids
 *      novos, no formato ULID (`ORD01JQ4S...`), chegam maiúsculos.
 *   3. Pedaço com valor vazio sai fora inteiro, junto com o rótulo e com o
 *      ponto e vírgula dele. Aviso com `x-request-id` vazio tem manifesto
 *      `id:123;ts:456;`, e nunca `id:123;request-id:;ts:456;`.
 *
 * A comparação usa `timingSafeEqual` porque comparar hash com `===` vaza, pelo
 * tempo de resposta, quantos caracteres iniciais o palpite acertou, e com um
 * endereço público isso é um oráculo que responde a noite inteira.
 */

/**
 * Quanto tempo um aviso continua valendo, em segundos.
 *
 * Sem esta janela, quem grampeasse um aviso legítimo uma vez poderia reenviar
 * o mesmo pacote, com a mesma assinatura, para sempre. Cinco minutos dão folga
 * de sobra para atraso de rede e para relógio de servidor levemente adiantado,
 * e fecham a janela de repetição.
 */
export const JANELA_DO_AVISO_SEGUNDOS = 5 * 60;

export type CabecalhoAssinatura = {
  /** O carimbo de tempo, cru, do jeito que veio. Entra assim no manifesto. */
  ts: string;
  /** O HMAC em hexadecimal, em minúsculas. */
  v1: string;
};

/**
 * Quebra o `x-signature` nas duas partes.
 *
 * O cabeçalho é uma lista de `chave=valor` separada por vírgula. Lemos por
 * chave em vez de por posição, porque a ordem é do provedor e uma chave nova
 * no meio da lista quebraria a leitura por posição sem avisar.
 */
export function lerCabecalhoDeAssinatura(
  bruto: string | null | undefined,
): CabecalhoAssinatura | null {
  if (!bruto) return null;

  let ts = "";
  let v1 = "";
  for (const pedaco of bruto.split(",")) {
    const corte = pedaco.indexOf("=");
    if (corte < 0) continue;
    const chave = pedaco.slice(0, corte).trim().toLowerCase();
    const valor = pedaco.slice(corte + 1).trim();
    if (chave === "ts") ts = valor;
    if (chave === "v1") v1 = valor;
  }

  if (ts === "" || v1 === "") return null;
  return { ts, v1: v1.toLowerCase() };
}

/**
 * Monta o texto que vai ser assinado.
 *
 * Exportada de propósito, separada da conferência, para o teste comparar a
 * string inteira e travar o formato. Um espaço a mais aqui dentro derruba todo
 * webhook do produto, e é o tipo de coisa que só aparece em produção.
 */
export function montarManifesto(
  dataId: string | null | undefined,
  requestId: string | null | undefined,
  ts: string,
): string {
  const pedacos: string[] = [];
  if (dataId) pedacos.push(`id:${dataId.toLowerCase()}`);
  if (requestId) pedacos.push(`request-id:${requestId}`);
  pedacos.push(`ts:${ts}`);
  return `${pedacos.join(";")};`;
}

/** Compara dois hexadecimais em tempo constante. */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  // O tamanho é informação pública (o SHA256 em hexadecimal tem sempre 64
  // caracteres), então sair cedo aqui vaza zero e evita o `timingSafeEqual`
  // levantar exceção com tamanhos diferentes.
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/**
 * O carimbo de tempo em milissegundos, ou `null` se não der para ler.
 *
 * A documentação e os SDKs oficiais tratam o `ts` como unix em segundos, e é
 * assim que ele chega. Ainda assim, a própria documentação interna dos SDKs
 * descreve o campo como milissegundos em alguns lugares, então valor grande
 * demais para ser segundo é lido como milissegundo. Isto muda só a conta da
 * janela: o manifesto sempre usa a string crua, então o HMAC fica intacto de
 * qualquer jeito.
 */
function carimboEmMs(ts: string): number | null {
  if (!/^\d{1,17}$/.test(ts)) return null;
  const n = Number(ts);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n >= 1e12 ? n : n * 1000;
}

export type EntradaDeConferencia = {
  /** O cabeçalho `x-signature`, cru. */
  xSignature: string | null | undefined;
  /** O cabeçalho `x-request-id`, cru. */
  xRequestId: string | null | undefined;
  /** O `data.id` do aviso. */
  dataId: string | null | undefined;
  /** O segredo da integração, de `MERCADOPAGO_WEBHOOK_SECRET`. */
  segredo: string | null | undefined;
  /** O instante de agora, em milissegundos. Vem de quem chama, para dar teste. */
  agoraMs: number;
  janelaSegundos?: number;
};

/** Por que um aviso foi recusado. Vai para o log, nunca para a resposta. */
export type MotivoDaAssinatura =
  | "conferida"
  | "segredo_ausente"
  | "cabecalho_ausente"
  | "carimbo_ilegivel"
  | "fora_da_janela"
  | "hmac_diferente";

export type Conferencia = {
  ok: boolean;
  motivo: MotivoDaAssinatura;
  /** O manifesto montado. Carrega id e request-id, e nenhum segredo. */
  manifesto?: string;
  /** Quantos segundos de diferença entre o carimbo e agora. */
  atrasoS?: number;
  /** O tamanho do segredo configurado. Zero diz que a variável falta. */
  tamanhoDoSegredo: number;
};

/**
 * A conferência com o motivo, para o log de quem opera.
 *
 * A resposta do webhook continua sendo 401 sem corpo, e é isso que importa
 * para quem está do lado de fora: mensagem de erro num endereço público é
 * manual de como acertar a assinatura. O motivo vai para o log do servidor, e
 * é a diferença entre "a assinatura falhou" e "o carimbo veio quarenta minutos
 * atrasado", que apontam para lugares opostos.
 *
 * O manifesto vai junto porque ele é a causa número um de assinatura que nunca
 * bate, e porque ele carrega só o id do objeto e o id da requisição. O segredo
 * aparece pelo tamanho, que separa variável ausente de variável colada pela
 * metade sem revelar o valor.
 */
export function conferirAssinaturaDetalhe(e: EntradaDeConferencia): Conferencia {
  const tamanhoDoSegredo = e.segredo ? e.segredo.length : 0;

  if (!e.segredo) return { ok: false, motivo: "segredo_ausente", tamanhoDoSegredo };

  const cabecalho = lerCabecalhoDeAssinatura(e.xSignature);
  if (!cabecalho) {
    return { ok: false, motivo: "cabecalho_ausente", tamanhoDoSegredo };
  }

  const carimbo = carimboEmMs(cabecalho.ts);
  if (carimbo === null) {
    return { ok: false, motivo: "carimbo_ilegivel", tamanhoDoSegredo };
  }

  const atrasoS = Math.round((e.agoraMs - carimbo) / 1000);
  const janela = (e.janelaSegundos ?? JANELA_DO_AVISO_SEGUNDOS) * 1000;
  // Diferença absoluta: carimbo muito no futuro é tão suspeito quanto carimbo
  // velho, e ainda pega o caso do nosso relógio ter atrasado.
  if (Math.abs(e.agoraMs - carimbo) > janela) {
    return { ok: false, motivo: "fora_da_janela", atrasoS, tamanhoDoSegredo };
  }

  const manifesto = montarManifesto(e.dataId, e.xRequestId, cabecalho.ts);
  const esperado = createHmac("sha256", e.segredo)
    .update(manifesto, "utf8")
    .digest("hex");

  if (!iguaisEmTempoConstante(esperado, cabecalho.v1)) {
    return {
      ok: false,
      motivo: "hmac_diferente",
      manifesto,
      atrasoS,
      tamanhoDoSegredo,
    };
  }

  return { ok: true, motivo: "conferida", manifesto, atrasoS, tamanhoDoSegredo };
}

/**
 * Diz se o aviso veio mesmo do Mercado Pago e se chegou dentro da janela.
 *
 * Devolve booleano só, de propósito: quem chama responde 401 e para. Um
 * resultado detalhado aqui viraria mensagem de resposta, e mensagem de
 * resposta num endereço público é um manual de como acertar a assinatura.
 *
 * Segredo em branco devolve `false`. Fechar por falta de configuração é o lado
 * certo deste erro: um webhook que aceita tudo quando a variável de ambiente
 * some deixa qualquer um marcar a própria conta como paga.
 */
export function conferirAssinatura(e: EntradaDeConferencia): boolean {
  return conferirAssinaturaDetalhe(e).ok;
}
