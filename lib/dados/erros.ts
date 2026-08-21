/**
 * A recusa do banco virando frase de tela.
 *
 * Os limites do produto moram no banco de propósito. O painel escreve direto
 * pelo navegador, então limite que morasse na tela seria enfeite: bastaria um
 * PATCH no PostgREST para passar por cima. O preço disso é que a recusa chega
 * como exceção do Postgres, com um texto escrito para quem lê log.
 *
 * Enquanto essa exceção subia crua, ela virava 500, e o navegador mostrava
 * "this page couldn't load". Aconteceu de verdade com o limite de páginas por
 * conta, e o remendo de app/criar/acoes.ts nasceu dali. Este arquivo é o
 * remendo virando peça: um lugar só onde a mensagem crua do banco vira motivo
 * nosso, e o motivo vira frase.
 *
 * O molde é o `MOTIVOS_LINK` de lib/links.ts: um registro fechado, com o
 * compilador cobrando uma frase para cada motivo que existir. Mesmo desenho de
 * lib/pagamento/erros.ts, e pelo mesmo motivo: regra e explicação no mesmo
 * arquivo, e um teste só varrendo todas as frases.
 *
 * Duas regras valem em cada linha do registro de frases.
 *
 * A primeira é a do AGENTS.md: a frase diz o que existe e termina numa saída.
 * A tela de limite é o pior lugar do produto para escorregar nisso, porque ela
 * é o melhor momento de venda que o produto tem. Quem chegou aos 20 itens do
 * catálogo é justamente quem usou o produto até o fim do plano gratuito, e a
 * frase que essa pessoa lê decide entre uma assinatura e uma desistência.
 *
 * A segunda é de número: cada frase de limite diz quanto o plano guarda hoje e
 * quanto o plano pago guarda. Os números espelham `public.limite_do_plano()`,
 * de supabase/schema.sql, que é quem manda. Mudou lá, muda aqui.
 */

export type RecusaDados =
  /** checa_limite_itens: a parede dos 20 itens do catálogo. */
  | "limite_itens"
  /** checa_limite_fotos_item */
  | "limite_fotos_item"
  /** checa_limite_galeria */
  | "limite_galeria"
  /** checa_limite_links */
  | "limite_links"
  /** checa_limite_horarios */
  | "limite_horarios"
  /** checa_limite_negocios, e a mesma conta repetida em migrar_rascunho. */
  | "limite_paginas"
  /** checa_slug, contra a lista de slugs_reservados. */
  | "endereco_reservado"
  /** checa_slug, contra a lista de pedacos_bloqueados. */
  | "endereco_restrito"
  /** checa_slug, e a chave única de negocios.slug. */
  | "endereco_ocupado"
  /** protege_publicacao: conta provisória pede o Google antes de publicar. */
  | "conta_confirmada"
  /** Coluna obrigatória em branco, ou uma constraint `_preenchido`. */
  | "campo_obrigatorio"
  /** Uma constraint `_tamanho`, ou texto maior do que a coluna guarda. */
  | "campo_tamanho"
  /** Qualquer outra check constraint: formato, lista fechada, faixa. */
  | "campo_formato"
  /** A RLS respondeu: a linha é de outra conta. */
  | "so_do_dono"
  /** O token da sessão venceu no meio do caminho. */
  | "sessao"
  /** O guarda-chuva. Recusa desconhecida cai aqui em vez de virar 500. */
  | "escrita_recusada";

/**
 * Uma frase por motivo, do jeito que ela aparece na tela.
 *
 * Os números do plano gratuito vêm de `limite_do_plano`: 20 itens, 3 fotos por
 * item, 12 fotos de galeria, 8 links, 3 turnos por dia e uma página por conta.
 * Os do plano pago são os mesmos da outra metade daquela função.
 */
export const MOTIVOS_DADOS: Record<RecusaDados, string> = {
  limite_itens:
    "O plano gratuito guarda 20 itens no catálogo. O plano pago guarda 500, e o seu catálogo cresce junto.",
  limite_fotos_item:
    "Cada item mostra 3 fotos no plano gratuito. Troque uma das fotos deste item, ou abra 10 por item no plano pago.",
  limite_galeria:
    "A galeria mostra 12 fotos no plano gratuito. Troque uma das fotos, ou abra 100 fotos no plano pago.",
  limite_links:
    "A página mostra 8 links no plano gratuito. Troque um dos links, ou abra 30 links no plano pago.",
  limite_horarios:
    "Cada dia guarda 3 turnos no plano gratuito. Junte dois turnos num só, ou abra 4 turnos por dia no plano pago.",
  limite_paginas:
    "A sua conta guarda uma página no plano gratuito. Abra o painel para editá-la, ou tenha até 5 páginas no plano pago.",
  endereco_reservado:
    "Este endereço fica guardado para as páginas do próprio site. Escolha outro e siga.",
  endereco_restrito:
    "Este endereço tem uma palavra que fica reservada para banco e cobrança. Troque essa palavra e siga.",
  endereco_ocupado:
    "Este endereço já tem dono. Escolha outro, como o nome do negócio com a cidade junto.",
  conta_confirmada:
    "Publicar pede a conta confirmada. Entre com o Google e a página vai ao ar em seguida.",
  campo_obrigatorio:
    "Escreva um texto neste campo para salvar. Ele aparece na sua página.",
  campo_tamanho:
    "Este texto passou do tamanho que a página guarda. Encurte um pouco e salve de novo.",
  campo_formato:
    "Confira o formato deste campo e salve de novo. A tela mostra um exemplo em cada um.",
  so_do_dono:
    "Esta página pertence a outra conta. Entre com a conta dona dela para editar.",
  sessao: "Sua sessão de hoje terminou. Entre de novo e continue de onde parou.",
  escrita_recusada:
    "As suas alterações continuam aqui na tela. Confira os campos e envie de novo.",
};

/**
 * Para onde a frase manda quem leu.
 *
 * A frase de limite fica de pé sozinha, e o link é o que transforma a parede em
 * porta. É por isso que o limite de itens tem endereço: quem chegou nele é
 * quem já provou que o produto serve.
 *
 * Motivo que se resolve na própria tela (formato de campo, tamanho de texto)
 * fica de fora, porque mandar a pessoa embora da tela onde ela pode consertar
 * seria trabalho a mais para ela.
 */
export const SAIDA_DA_RECUSA: Partial<
  Record<RecusaDados, { rotulo: string; href: string }>
> = {
  limite_itens: { rotulo: "Ver o plano pago", href: "/painel/plano" },
  limite_fotos_item: { rotulo: "Ver o plano pago", href: "/painel/plano" },
  limite_galeria: { rotulo: "Ver o plano pago", href: "/painel/plano" },
  limite_links: { rotulo: "Ver o plano pago", href: "/painel/plano" },
  limite_horarios: { rotulo: "Ver o plano pago", href: "/painel/plano" },
  limite_paginas: { rotulo: "Ver o plano pago", href: "/painel/plano" },
  conta_confirmada: {
    rotulo: "Entrar com o Google",
    href: "/entrar?motivo=publicar",
  },
  so_do_dono: { rotulo: "Entrar", href: "/entrar" },
  sessao: { rotulo: "Entrar de novo", href: "/entrar" },
};

const MOTIVOS = new Set<string>(Object.keys(MOTIVOS_DADOS));

/** Serve para a tela conferir o `?erro=` da URL antes de confiar nele. */
export function ehRecusaDados(valor: string | null | undefined): valor is RecusaDados {
  return typeof valor === "string" && MOTIVOS.has(valor);
}

/** A frase pronta para a tela. */
export function mensagemDaRecusa(motivo: RecusaDados): string {
  return MOTIVOS_DADOS[motivo];
}

/**
 * O erro cru, do jeito que ele chega.
 *
 * Pelo PostgREST vem um objeto com `code`, `message`, `details` e `hint`, e o
 * `code` é o SQLSTATE do Postgres (23514 para check_violation, 23505 para
 * unique_violation, 42501 para insufficient_privilege), ou um código próprio
 * dele, como PGRST301 para token vencido. Pela conexão direta vem um Error com
 * o mesmo texto no `message`. As duas formas passam por aqui.
 */
type ErroCru = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
};

/**
 * Só o `message`, e nunca o `details`.
 *
 * O `details` de uma check constraint traz a linha inteira que o banco recusou,
 * incluindo o texto que o dono escreveu. Uma frase digitada no campo da página
 * conseguiria imitar o texto de um gatilho e mandar a tradução para o motivo
 * errado. O `message` é escrito pelo Postgres do começo ao fim, então é o único
 * pedaço em que dá para casar texto com segurança. O `details` continua indo
 * junto no erro que sobe, porque ali ele é o que o log precisa.
 */
function textoDoErro(erro: unknown): string {
  if (typeof erro === "string") return erro.toLowerCase();
  if (erro === null || typeof erro !== "object") return "";

  const mensagem = (erro as ErroCru).message;
  return typeof mensagem === "string" ? mensagem.toLowerCase() : "";
}

function codigoDoErro(erro: unknown): string {
  if (erro === null || typeof erro !== "object") return "";
  const codigo = (erro as ErroCru).code;
  return typeof codigo === "string" ? codigo.toUpperCase() : "";
}

/**
 * Os pedaços de texto que cada gatilho levanta, na ordem em que são olhados.
 *
 * A chave é um pedaço, e nunca a mensagem inteira: os gatilhos escrevem o
 * número no meio da frase (`limite de 20 itens no plano atual`), então casar a
 * frase toda amarraria o código ao limite de hoje. O pedaço escolhido é o que
 * sobra igual em qualquer plano.
 */
const POR_TEXTO: Array<[string, RecusaDados]> = [
  ["itens no plano", "limite_itens"],
  ["fotos por item", "limite_fotos_item"],
  ["fotos na galeria", "limite_galeria"],
  ["links no plano", "limite_links"],
  ["intervalos por dia", "limite_horarios"],
  ["por conta no plano", "limite_paginas"],
  ["endereço reservado", "endereco_reservado"],
  ["palavra restrita", "endereco_restrito"],
  ["endereço já usado", "endereco_ocupado"],
  ["duplicate key", "endereco_ocupado"],
  ["conta confirmada", "conta_confirmada"],
  ["row-level security", "so_do_dono"],
  ["row level security", "so_do_dono"],
  ["jwt expired", "sessao"],
];

/**
 * O nome da constraint, quando o Postgres o cita.
 *
 * A mensagem é `new row for relation "negocios" violates check constraint
 * "cep_formato"`, e o nome no fim é a única parte útil para quem lê a tela.
 */
const NOME_DA_CONSTRAINT = /constraint "([^"]+)"/;

/**
 * A convenção de nome das constraints do schema, virada em regra.
 *
 * Termina em `_preenchido` quando a coluna pede conteúdo, em `_tamanho` quando
 * o texto tem teto, e o resto é formato: `cep_formato`, `tema_conhecido`,
 * `fuso_valido`, `url_http`, `preco_nao_negativo`. Uma regra por sufixo, em vez
 * de uma lista com as trinta e poucas constraints, é o que faz constraint nova
 * já nascer com frase.
 */
function motivoDaConstraint(nome: string): RecusaDados {
  if (nome.endsWith("_preenchido")) return "campo_obrigatorio";
  if (nome.endsWith("_tamanho")) return "campo_tamanho";
  return "campo_formato";
}

/**
 * A recusa crua virando motivo nosso.
 *
 * Erro desconhecido cai em `escrita_recusada`, que é o guarda-chuva. A frase
 * dele serve para qualquer recusa: diz que o que a pessoa escreveu continua na
 * tela e pede o reenvio. Assim um gatilho novo, ou um SQLSTATE que ninguém
 * previu, aparece como frase em vez de virar tela de erro do Next.
 */
export function motivoDoErro(erro: unknown): RecusaDados {
  if (erro instanceof RecusaDoBanco) return erro.motivo;

  const texto = textoDoErro(erro);
  const codigo = codigoDoErro(erro);

  for (const [pedaco, motivo] of POR_TEXTO) {
    if (texto.includes(pedaco)) return motivo;
  }

  const nome = texto.match(NOME_DA_CONSTRAINT);
  if (nome) {
    // Chave única tem nome de constraint também, e ela já foi tratada acima
    // pelo "duplicate key". Aqui sobra a check constraint.
    if (codigo === "23505") return "endereco_ocupado";
    return motivoDaConstraint(nome[1]);
  }

  if (codigo === "23505") return "endereco_ocupado";
  if (codigo === "23502") return "campo_obrigatorio";
  if (codigo === "22001") return "campo_tamanho";
  if (codigo === "23514") return "campo_formato";
  if (codigo === "42501") return "so_do_dono";
  if (codigo === "PGRST301") return "sessao";

  return "escrita_recusada";
}

/**
 * A recusa do banco com o motivo já traduzido junto.
 *
 * A camada de dados levanta isto, e a ação de tela lê o `motivo` para montar o
 * `?erro=` da URL. O texto cru continua no `message`, porque ele é o que o log
 * da Vercel precisa ter para alguém entender o que o banco recusou.
 */
export class RecusaDoBanco extends Error {
  readonly motivo: RecusaDados;

  constructor(motivo: RecusaDados, cru: string) {
    super(cru === "" ? motivo : cru);
    this.name = "RecusaDoBanco";
    this.motivo = motivo;
  }
}

/** Embrulha o erro cru do banco na recusa já traduzida. */
export function recusaDoBanco(erro: unknown): RecusaDoBanco {
  if (erro instanceof RecusaDoBanco) return erro;

  const cru =
    typeof erro === "string"
      ? erro
      : erro !== null && typeof erro === "object"
        ? [
            (erro as ErroCru).message,
            (erro as ErroCru).details,
            (erro as ErroCru).hint,
          ]
            .filter((p): p is string => typeof p === "string" && p !== "")
            .join(" ")
        : "";

  return new RecusaDoBanco(motivoDoErro(erro), cru);
}

/**
 * O motivo de uma exceção que já subiu, ou nulo quando ela é outra coisa.
 *
 * Nulo importa. O `redirect()` do Next funciona levantando exceção, e bug de
 * código sobe como exceção também: os dois precisam continuar subindo. Quem
 * vira frase de tela é só o que a camada de dados marcou como recusa do banco.
 */
export function motivoDaRecusa(erro: unknown): RecusaDados | null {
  return erro instanceof RecusaDoBanco ? erro.motivo : null;
}
