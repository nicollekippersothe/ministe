import { diaCivilDe, epochDeCivil } from "./horarios.ts";

/**
 * O núcleo do agendamento: a conta dos horários livres, pura e testável.
 *
 * A regra de fuso mora em `lib/horarios.ts`, e aqui a gente só usa `epochDeCivil`
 * (converte dia e hora do negócio em epoch) e `diaCivilDe` (o dia civil de hoje
 * no fuso dele). O resto é aritmética de sobreposição em epoch, que não depende
 * de fuso nenhum.
 *
 * Este arquivo não fala com banco nem com rede. A tela pública e o painel
 * passam os dados já lidos, e a rota `/api/agenda` embrulha isto para devolver
 * os horários ao vivo sem tirar a página pública do cache.
 */

/** Um serviço que a pessoa oferece, com a duração que ele ocupa na agenda. */
export type Servico = {
  id: string;
  nome: string;
  duracaoMin: number;
  /** Preço opcional. Campo vazio faz o preço sumir da tela, nunca vira zero. */
  precoCentavos: number | null;
  ativo: boolean;
  ordem: number;
};

/** Uma janela semanal em que o negócio aceita agendamento. */
export type Disponibilidade = {
  /** 0 é domingo, como `Date.getUTCDay`. */
  diaSemana: number;
  /** "HH:MM", no relógio do negócio. `fecha` maior que `abre`. */
  abre: string;
  fecha: string;
};

/**
 * Um pedaço de tempo já tomado: agendamento vivo ou bloqueio de folga.
 *
 * Os dois entram na mesma lista de propósito, porque para a conta de horário
 * livre tanto faz o motivo: o que importa é que aquele intervalo está ocupado.
 */
export type Ocupado = {
  inicioMs: number;
  fimMs: number;
};

/** Os horários livres de um dia, em epoch ms, do mais cedo para o mais tarde. */
export type DiaLivre = {
  diaCivil: number;
  inicios: number[];
};

function emMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

const MS_MIN = 60_000;

/**
 * Os horários livres para um serviço, agrupados por dia.
 *
 * Para cada dia à frente, pega as janelas de disponibilidade daquele dia da
 * semana, e dentro de cada janela caminha de `passoMin` em `passoMin`, oferecendo
 * todo início em que o serviço inteiro cabe antes do fim da janela. Descarta o
 * que colide com um intervalo ocupado e o que começa cedo demais, pela
 * antecedência mínima. Dia sem horário livre some da lista, nunca vira dia vazio.
 *
 * `passoMin` decide a granularidade dos horários oferecidos, e por padrão é a
 * própria duração, o que enfileira os horários um encostado no outro.
 */
export function horariosLivres(params: {
  duracaoMin: number;
  disponibilidade: Disponibilidade[];
  ocupados: Ocupado[];
  fuso: string;
  agoraMs: number;
  /** Quantos dias à frente olhar, contando hoje. Padrão 14. */
  diasAFrente?: number;
  /** Granularidade dos horários. Padrão: a duração do serviço. */
  passoMin?: number;
  /** Só oferece horário que começa daqui a pelo menos tantos minutos. */
  antecedenciaMin?: number;
}): DiaLivre[] {
  const { duracaoMin, disponibilidade, ocupados, fuso, agoraMs } = params;
  const dias = params.diasAFrente ?? 14;
  const passo = params.passoMin ?? duracaoMin;
  const cedoDemais = agoraMs + (params.antecedenciaMin ?? 0) * MS_MIN;

  if (duracaoMin <= 0 || passo <= 0 || dias <= 0) return [];

  const duracaoMs = duracaoMin * MS_MIN;
  const passoMs = passo * MS_MIN;
  // A meia-noite UTC do dia de hoje no fuso do negócio, que é a âncora para
  // caminhar dia a dia sem carregar fuso na conta dos dias.
  const raiz = diaCivilDe(agoraMs, fuso) * 86_400_000;
  const resultado: DiaLivre[] = [];

  for (let i = 0; i < dias; i++) {
    const base = raiz + i * 86_400_000;
    const d = new Date(base);
    const ano = d.getUTCFullYear();
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();
    const semana = d.getUTCDay();
    const diaCivil = Math.floor(base / 86_400_000);

    const inicios: number[] = [];

    for (const janela of disponibilidade.filter((j) => j.diaSemana === semana)) {
      const ma = emMinutos(janela.abre);
      const mf = emMinutos(janela.fecha);
      // Janela só vale quando fecha depois de abrir. Agendamento que vira a
      // meia-noite fica de fora da v1, porque ninguém marca corte às 2 da manhã.
      if (mf <= ma) continue;

      const janelaInicio = epochDeCivil(
        ano,
        mes,
        dia,
        Math.floor(ma / 60),
        ma % 60,
        fuso,
      );
      const janelaFim = epochDeCivil(
        ano,
        mes,
        dia,
        Math.floor(mf / 60),
        mf % 60,
        fuso,
      );

      for (let t = janelaInicio; t + duracaoMs <= janelaFim; t += passoMs) {
        if (t < cedoDemais) continue;
        const fimSlot = t + duracaoMs;
        const chocou = ocupados.some(
          (o) => t < o.fimMs && o.inicioMs < fimSlot,
        );
        if (!chocou) inicios.push(t);
      }
    }

    if (inicios.length > 0) {
      inicios.sort((a, b) => a - b);
      resultado.push({ diaCivil, inicios });
    }
  }

  return resultado;
}

/**
 * Se um início cabe mesmo, conferido no servidor antes de gravar.
 *
 * A tela oferece horários livres, mas entre ver e tocar alguém pode ter pegado
 * o mesmo minuto. Esta função é a segunda conferência, e o índice de
 * sobreposição no banco é a terceira e definitiva. Devolve o fim do
 * agendamento em ms quando cabe, e nulo quando não cabe.
 */
export function encaixa(params: {
  inicioMs: number;
  duracaoMin: number;
  disponibilidade: Disponibilidade[];
  ocupados: Ocupado[];
  fuso: string;
  agoraMs: number;
  antecedenciaMin?: number;
}): number | null {
  const {
    inicioMs,
    duracaoMin,
    disponibilidade,
    ocupados,
    fuso,
    agoraMs,
  } = params;
  if (duracaoMin <= 0) return null;
  if (inicioMs < agoraMs + (params.antecedenciaMin ?? 0) * MS_MIN) return null;

  const fimMs = inicioMs + duracaoMin * MS_MIN;

  const d = new Date(diaCivilDe(inicioMs, fuso) * 86_400_000);
  const ano = d.getUTCFullYear();
  const mes = d.getUTCMonth() + 1;
  const dia = d.getUTCDate();
  const semana = d.getUTCDay();

  const dentroDeJanela = disponibilidade
    .filter((j) => j.diaSemana === semana)
    .some((j) => {
      const ma = emMinutos(j.abre);
      const mf = emMinutos(j.fecha);
      if (mf <= ma) return false;
      const ini = epochDeCivil(ano, mes, dia, Math.floor(ma / 60), ma % 60, fuso);
      const fim = epochDeCivil(ano, mes, dia, Math.floor(mf / 60), mf % 60, fuso);
      return inicioMs >= ini && fimMs <= fim;
    });

  if (!dentroDeJanela) return null;

  const chocou = ocupados.some((o) => inicioMs < o.fimMs && o.inicioMs < fimMs);
  if (chocou) return null;

  return fimMs;
}
