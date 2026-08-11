import type { Intervalo } from "./tipos";

/**
 * Toda a conta de fuso acontece aqui, no servidor.
 *
 * A pagina publica fica em cache, entao "aberto agora" nao pode ser um valor
 * congelado no HTML. A solucao: o servidor monta uma linha do tempo dos
 * proximos dias em horario absoluto (epoch), e o navegador so compara numero.
 * Assim o cliente nao precisa saber nada de fuso, e o script fica minusculo.
 */

export const DIAS_CURTO = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

export const DIAS_LONGO = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export type Segmento = {
  /** epoch em segundos */
  inicio: number;
  /** epoch em segundos */
  fim: number;
  /** dias desde 1970 na data civil do negocio, para comparar "hoje" e "amanha" */
  diaCivil: number;
  abre: string;
  fecha: string;
  diaNome: string;
};

export type Estado = {
  aberto: boolean;
  titulo: string;
  detalhe: string;
};

export type DadosSelo = {
  /** deslocamento do fuso em ms, para o navegador saber que dia e la */
  o: number;
  /** [inicio, fim, diaCivil, abre, fecha, diaNome] */
  s: Array<[number, number, number, string, string, string]>;
};

type Partes = {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  min: number;
  seg: number;
};

function partes(ts: number, fuso: string): Partes {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = f.formatToParts(new Date(ts));
  const v = (tipo: string) => Number(p.find((x) => x.type === tipo)?.value ?? 0);
  return {
    ano: v("year"),
    mes: v("month"),
    dia: v("day"),
    hora: v("hour"),
    min: v("minute"),
    seg: v("second"),
  };
}

/** Quanto o fuso esta adiantado em relacao ao UTC, em ms, naquele instante. */
export function deslocamento(ts: number, fuso: string): number {
  const p = partes(ts, fuso);
  const comoUtc = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.min, p.seg);
  return comoUtc - (ts - (ts % 1000));
}

/** Converte uma data e hora local do negocio para epoch em ms. */
function epochDeCivil(
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  min: number,
  fuso: string,
): number {
  const alvo = Date.UTC(ano, mes - 1, dia, hora, min);
  const primeiro = deslocamento(alvo, fuso);
  let ts = alvo - primeiro;
  // Segunda passada resolve os casos de virada de horario de verao.
  const segundo = deslocamento(ts, fuso);
  if (segundo !== primeiro) ts = alvo - segundo;
  return ts;
}

function emMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Linha do tempo dos intervalos de funcionamento, de ontem ate `dias` a frente.
 * Comeca em ontem de proposito: quem fecha 00:30 ainda esta aberto de madrugada.
 */
export function montarJanela(
  horarios: Intervalo[],
  fuso: string,
  agoraMs: number,
  dias = 8,
): Segmento[] {
  const hoje = partes(agoraMs, fuso);
  const raiz = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia);
  const segmentos: Segmento[] = [];

  for (let i = -1; i < dias; i++) {
    const base = raiz + i * 86400000;
    const d = new Date(base);
    const ano = d.getUTCFullYear();
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();
    const semana = d.getUTCDay();
    const diaCivil = Math.floor(base / 86400000);

    for (const h of horarios.filter((x) => x.dia === semana)) {
      const ma = emMinutos(h.abre);
      const mf = emMinutos(h.fecha);
      const viraDia = mf <= ma;

      const inicio = epochDeCivil(
        ano,
        mes,
        dia,
        Math.floor(ma / 60),
        ma % 60,
        fuso,
      );
      const baseFim = new Date(base + (viraDia ? 86400000 : 0));
      const fim = epochDeCivil(
        baseFim.getUTCFullYear(),
        baseFim.getUTCMonth() + 1,
        baseFim.getUTCDate(),
        Math.floor(mf / 60),
        mf % 60,
        fuso,
      );

      segmentos.push({
        inicio: Math.floor(inicio / 1000),
        fim: Math.floor(fim / 1000),
        diaCivil,
        abre: h.abre,
        fecha: h.fecha,
        diaNome: DIAS_CURTO[semana],
      });
    }
  }

  return segmentos.sort((a, b) => a.inicio - b.inicio);
}

export function diaCivilDe(agoraMs: number, fuso: string): number {
  const p = partes(agoraMs, fuso);
  return Math.floor(Date.UTC(p.ano, p.mes - 1, p.dia) / 86400000);
}

export function estadoAgora(
  segmentos: Segmento[],
  agoraMs: number,
  diaCivilHoje: number,
): Estado {
  const agora = Math.floor(agoraMs / 1000);
  const atual = segmentos.find((s) => agora >= s.inicio && agora < s.fim);
  if (atual) {
    return { aberto: true, titulo: "Aberto", detalhe: `até ${atual.fecha}` };
  }

  const proximo = segmentos.find((s) => s.inicio > agora);
  if (!proximo) return { aberto: false, titulo: "Fechado", detalhe: "" };

  const distancia = proximo.diaCivil - diaCivilHoje;
  const quando =
    distancia <= 0 ? "" : distancia === 1 ? "amanhã " : `${proximo.diaNome} `;
  return {
    aberto: false,
    titulo: "Fechado",
    detalhe: `abre ${quando}${proximo.abre}`,
  };
}

export function dadosSelo(segmentos: Segmento[], fuso: string, agoraMs: number): DadosSelo {
  return {
    o: deslocamento(agoraMs, fuso),
    s: segmentos.map((s) => [
      s.inicio,
      s.fim,
      s.diaCivil,
      s.abre,
      s.fecha,
      s.diaNome,
    ]),
  };
}

/** Agrupa os intervalos por dia da semana, para a tabela da pagina. */
export function porDiaSemana(horarios: Intervalo[]): Intervalo[][] {
  const semana: Intervalo[][] = [[], [], [], [], [], [], []];
  for (const h of horarios) semana[h.dia]?.push(h);
  for (const dia of semana) dia.sort((a, b) => emMinutos(a.abre) - emMinutos(b.abre));
  return semana;
}
