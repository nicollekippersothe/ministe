/**
 * A conta dos números do painel. Pura, sem relógio próprio e sem I/O.
 *
 * Quem manda o instante é quem chama, sempre, pela mesma razão de
 * `lib/pagamento/ciclo.ts`: função que lê `Date.now()` por dentro só dá para
 * testar esperando o tempo passar.
 *
 * Duas coisas moram aqui, e as duas existem por um motivo concreto.
 *
 * A primeira é o preenchimento dos dias vazios. A função `numeros_do_negocio`
 * devolve uma linha por dia que teve movimento, e mais nada. Um gráfico montado
 * direto em cima disso mente sobre o intervalo: três dias com evento viram três
 * barras coladas, como se fossem seguidos, quando na verdade tinha uma semana
 * de silêncio entre eles.
 *
 * A segunda é o dia civil. O dia de um evento é o dia do fuso do negócio, e não
 * o do UTC. No Brasil a diferença muda a conta de verdade: visita das 21h30
 * cairia no dia seguinte. Quem já resolve isso do lado do banco é a própria
 * função, que faz `at time zone n.fuso`; aqui a mesma regra precisa valer para
 * montar a régua de dias, senão a régua e os dados discordam.
 */

/** Os três tipos que a tabela `eventos` aceita, do jeito que a tela pensa. */
export type Contagem = {
  visitas: number;
  whatsapp: number;
  acao: number;
};

export type DiaContado = Contagem & {
  /** Data civil no fuso do negócio, em ISO: "2026-08-19". */
  dia: string;
};

/** Uma linha do jeito que `numeros_do_negocio` devolve. */
export type LinhaCrua = {
  dia: string;
  tipo: string;
  total: number;
};

export const VAZIO: Contagem = { visitas: 0, whatsapp: 0, acao: 0 };

/**
 * A data civil de um instante, no fuso pedido, em ISO.
 *
 * `en-CA` porque essa localidade formata data como "2026-08-19", que é
 * exatamente o ISO que a coluna `date` do Postgres devolve. Formatar em pt-BR e
 * remontar daria o mesmo com três linhas a mais para errar.
 */
export function diaCivil(ts: number, fuso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

/**
 * A régua de dias do período, da mais velha para a mais nova.
 *
 * A conta anda para trás em cima da data civil, e nunca em cima do instante.
 * Subtrair 24 horas do relógio erraria num dia de mudança de horário de verão,
 * repetindo ou pulando uma data. O Brasil largou o horário de verão em 2019, e
 * a regra pode voltar, e o fuso é parâmetro: a conta em calendário está certa
 * nos três casos.
 */
export function diasDoPeriodo(
  dias: number,
  fuso: string,
  agoraMs: number,
): string[] {
  const quantos = Math.max(1, Math.trunc(dias));
  const hoje = diaCivil(agoraMs, fuso);
  const [ano, mes, dia] = hoje.split("-").map(Number);

  // Meio-dia UTC como âncora, e não meia-noite: assim somar e subtrair dias
  // nunca esbarra numa borda de fuso, e o `toISOString` devolve a mesma data.
  const base = Date.UTC(ano ?? 1970, (mes ?? 1) - 1, dia ?? 1, 12);

  const regua: string[] = [];
  for (let i = quantos - 1; i >= 0; i--) {
    regua.push(new Date(base - i * 86400000).toISOString().slice(0, 10));
  }
  return regua;
}

/** O tipo do banco vira o campo da contagem. Desconhecido é ignorado. */
function campoDoTipo(tipo: string): keyof Contagem | null {
  if (tipo === "visita") return "visitas";
  if (tipo === "clique_whatsapp") return "whatsapp";
  if (tipo === "clique_acao") return "acao";
  return null;
}

/**
 * As linhas do banco viram uma série contínua, um item por dia do período.
 *
 * Dia sem evento entra zerado em vez de sumir. Linha de um dia fora da régua é
 * descartada: pode acontecer na virada, quando a consulta pega um instante e a
 * régua pega outro, e uma barra solta no fim do gráfico confunde mais do que
 * ajuda.
 */
export function montarSerie(
  linhas: LinhaCrua[],
  dias: number,
  fuso: string,
  agoraMs: number,
): DiaContado[] {
  const regua = diasDoPeriodo(dias, fuso, agoraMs);
  const porDia = new Map<string, DiaContado>();
  for (const dia of regua) porDia.set(dia, { dia, ...VAZIO });

  for (const linha of linhas) {
    const item = porDia.get(linha.dia);
    if (!item) continue;

    const campo = campoDoTipo(linha.tipo);
    if (!campo) continue;

    const total = Number(linha.total);
    if (!Number.isFinite(total) || total < 0) continue;

    item[campo] += Math.trunc(total);
  }

  return regua.map((dia) => porDia.get(dia) as DiaContado);
}

/** Os totais do período. */
export function somar(serie: DiaContado[]): Contagem {
  const total = { ...VAZIO };
  for (const dia of serie) {
    total.visitas += dia.visitas;
    total.whatsapp += dia.whatsapp;
    total.acao += dia.acao;
  }
  return total;
}

/**
 * O período anterior, pela subtração de duas janelas.
 *
 * A função do banco só sabe responder "os últimos N dias". Para comparar com o
 * período anterior, a tentação é pedir 2N e cortar no meio pela data, e isso
 * erra: o dia da fronteira é data civil e o corte é um instante, então ele cai
 * dos dois lados e uma das metades ganha eventos da outra.
 *
 * Duas janelas e uma subtração é exato, porque as duas são janelas de instante
 * e a diferença entre elas é exatamente o período de antes.
 */
export function anterior(dobro: Contagem, atual: Contagem): Contagem {
  return {
    visitas: Math.max(0, dobro.visitas - atual.visitas),
    whatsapp: Math.max(0, dobro.whatsapp - atual.whatsapp),
    acao: Math.max(0, dobro.acao - atual.acao),
  };
}

/**
 * A maior contagem de um dia da série, para o gráfico ter escala.
 *
 * Devolve 1 no mínimo, para o cálculo de altura nunca dividir por zero num
 * período sem evento nenhum, que é justamente o estado mais comum.
 */
export function pico(serie: DiaContado[]): number {
  let maior = 0;
  for (const dia of serie) {
    maior = Math.max(maior, dia.visitas, dia.whatsapp, dia.acao);
  }
  return Math.max(1, maior);
}
