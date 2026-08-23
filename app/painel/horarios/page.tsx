import Link from "next/link";
import { copiarSegundaParaSemana, salvarHorarios } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import { BotaoDeAcao } from "@/componentes/painel/BotaoDeAcao";
import { BarraSalvar, Botao } from "@/componentes/painel/Campos";
import { IconeAvancar } from "@/componentes/Icones";
import { doDono } from "@/lib/dados";
import { DIAS_LONGO, porDiaSemana } from "@/lib/horarios";
import type { Intervalo } from "@/lib/tipos";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

/**
 * A seta de abrir, virada pelo `group-open`.
 *
 * Aponta para baixo, e nunca para o lado: seta de lado quer dizer "leva para
 * outra tela", e estes dois abrem ali mesmo. É o mesmo desenho do "Horários da
 * semana" da página pública, de propósito, porque é a mesma promessa.
 */
function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const ORDEM = [1, 2, 3, 4, 5, 6, 0];
const SLOTS = 3;

function Par({
  dia,
  slot,
  intervalo,
}: {
  dia: number;
  slot: number;
  intervalo?: Intervalo;
}) {
  const abre = `h-${dia}-${slot}-abre`;
  const fecha = `h-${dia}-${slot}-fecha`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <label htmlFor={abre} className="mb-1 block text-xs text-suave">
          Abre
        </label>
        <input
          id={abre}
          name={abre}
          type="time"
          defaultValue={intervalo?.abre ?? ""}
          className="w-full rounded-lg border border-borda bg-superficie px-3 py-2.5 text-[1rem] tabular-nums text-texto"
        />
      </div>
      <span className="mt-5 text-suave" aria-hidden>
        às
      </span>
      <div className="flex-1">
        <label htmlFor={fecha} className="mb-1 block text-xs text-suave">
          Fecha
        </label>
        <input
          id={fecha}
          name={fecha}
          type="time"
          defaultValue={intervalo?.fecha ?? ""}
          className="w-full rounded-lg border border-borda bg-superficie px-3 py-2.5 text-[1rem] tabular-nums text-texto"
        />
      </div>
    </div>
  );
}

/**
 * A semana inteira, do jeito que ela sempre foi.
 *
 * Continua empilhada no computador, e o formulário para de crescer junto com a
 * tela. Duas colunas de dias foi a primeira tentativa, e sobrava 125 pixels
 * para cada campo de hora: o navegador que escreve "09:00 AM" cortava o AM
 * dentro do campo. Sete dias em fila é a leitura natural de uma semana, e a
 * largura travada deixa cada par de horas do tamanho do que se digita nele.
 */
function Semana({ horarios }: { horarios: Intervalo[] }) {
  const semana = porDiaSemana(horarios);

  return (
    <form
      action={salvarHorarios}
      className="mt-6 flex flex-col gap-3 lg:max-w-md"
    >
      {ORDEM.map((dia) => {
        const intervalos = semana[dia];
        const extras = intervalos.slice(1);

        return (
          <fieldset
            key={dia}
            className="rounded-xl border border-borda bg-fundo p-4"
          >
            <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-texto">
              {DIAS_LONGO[dia]}
              {intervalos.length === 0 ? (
                <span className="rounded-full bg-fechado-fundo px-2 py-0.5 text-xs font-medium text-fechado-texto">
                  Fechado
                </span>
              ) : null}
            </legend>

            <div className="flex flex-col gap-3">
              <Par dia={dia} slot={0} intervalo={intervalos[0]} />

              <details open={extras.length > 0}>
                {/* Alvo de 44: no celular isto é um toque de dedo, e as vinte
                    pixels de altura do texto sozinho ficavam abaixo da medida. */}
                <summary className="-my-2 inline-flex min-h-11 cursor-pointer list-none items-center text-sm text-destaque">
                  Adicionar outro horário
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  {Array.from({ length: SLOTS - 1 }, (_, i) => (
                    <Par dia={dia} slot={i + 1} intervalo={extras[i]} key={i} />
                  ))}
                </div>
              </details>
            </div>
          </fieldset>
        );
      })}

      <BotaoDeAcao
        formAction={copiarSegundaParaSemana}
        className="mt-1 h-12 w-full rounded-full border border-borda bg-superficie px-5 font-semibold text-texto lg:w-auto lg:self-start lg:px-8"
      >
        Copiar segunda para terça a sexta
      </BotaoDeAcao>

      <BarraSalvar>
        <Botao type="submit">Salvar</Botao>
      </BarraSalvar>
    </form>
  );
}

/**
 * A saída de quem atende com hora marcada, do lado de quem já preencheu.
 *
 * Um formulário sem nenhum campo de hora, e é isso que faz o serviço:
 * `salvarHorarios` lê os sete dias do que chega, e o que chega aqui é vazio,
 * então a semana volta a ficar em branco. Fica dentro de um `details` para o
 * clique ser deliberado: apagar a semana inteira por engano custaria caro de
 * refazer no celular.
 */
function VirarHoraMarcada() {
  return (
    <details className="group mt-8 rounded-xl border border-borda bg-fundo p-4 lg:max-w-md">
      <summary className="-my-2 inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-destaque">
        Você atende com hora marcada?
        <Chevron />
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        A sua página passa a mostrar só o botão de falar com você, e quem chegar
        marca por ali. Os horários da semana voltam quando você preencher de
        novo.
      </p>
      <form action={salvarHorarios} className="mt-3">
        <BotaoDeAcao className="h-11 rounded-full border border-borda bg-superficie px-5 text-sm font-semibold text-texto">
          Passar a atender com hora marcada
        </BotaoDeAcao>
      </form>
    </details>
  );
}

/**
 * O estado de quem atende com hora marcada, que é a semana em branco.
 *
 * **Por que a escolha mora no próprio dado, e não numa coluna nova.** A semana
 * em branco já significa exatamente isto, dos dois lados: o painel enxerga
 * zero intervalos e a página pública some com a seção de horário. Uma coluna
 * "atende com hora marcada" seria um segundo lugar dizendo a mesma coisa, e
 * dois lugares que dizem a mesma coisa acabam discordando.
 *
 * **E por que a página pública continua calada sobre isso.** A regra do
 * produto é que campo em branco faz a seção sumir, e nunca vira frase nossa.
 * Escrever "atendimento com hora marcada" na página seria o produto falando
 * pela dona, e apareceria igualzinho para quem só ainda vai preencher a
 * semana. Quem diz isso na página é o botão que ela mesma nomeia, em
 * `/painel/acoes-botoes`: "Agendar horário", "Ver horários livres", "Marcar
 * pelo WhatsApp". A frase é dela, e por isso é verdade.
 */
function HoraMarcada() {
  return (
    <section className="mt-6 rounded-2xl border border-borda bg-superficie p-5 lg:max-w-md">
      <h2 className="text-[1.05rem] leading-snug font-semibold text-texto">
        Hoje a sua página atende com hora marcada
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        Quem abrir o seu endereço vê o botão de falar com você, e marca por ali.
        É como trabalha a maior parte de quem atende uma pessoa por vez:
        psicóloga, tatuador, professora particular.
      </p>
      <p className="mt-3 text-sm">
        <Link
          href="/painel/acoes-botoes"
          className="inline-flex min-h-11 items-center gap-1.5 font-medium text-destaque underline-offset-4 hover:underline"
        >
          Escolher o botão de agendar
          <IconeAvancar className="h-4 w-4" />
        </Link>
      </p>
    </section>
  );
}

export default async function Horarios({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; copiado?: string; erro?: string }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  /*
   * Duas telas, e quem decide é a semana que está guardada.
   *
   * Com a semana em branco, a tela abre dizendo o que a página faz hoje e
   * guarda os sete dias dentro de um `details` fechado. Antes ela abria com
   * quatorze campos vazios e sete selos de "Fechado", e para uma professora de
   * yoga isso lia como sete tarefas pendentes numa parte do produto que ela
   * jamais vai usar.
   *
   * Com a semana preenchida, a tela abre no formulário, como sempre foi, e a
   * saída para hora marcada fica no fim.
   */
  const horaMarcada = negocio.horarios.length === 0;

  return (
    <main className="mt-6">
      {/*
        No computador a coluna da esquerda fica sempre à vista, com as seções
        e o estado da página, então o Voltar seria um segundo caminho
        para onde já dá para ir com um clique.
      */}
      <Link
        href="/painel"
        /* O respiro vem de dentro do alvo, e a margem negativa devolve o
           alinhamento: o dedo ganha 44 de altura sem o desenho mudar. */
        className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm text-suave lg:hidden"
      >
        Voltar
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-texto">
        Horários
      </h1>

      <Aviso
        salvo={params.salvo === "1"}
        copiado={params.copiado === "1"}
        erro={params.erro}
      />

      {horaMarcada ? (
        <>
          <HoraMarcada />

          <details className="group mt-8">
            <summary className="-my-2 inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-[1.05rem] font-medium text-destaque">
              Mostrar quando abre e quando fecha, dia por dia
              <Chevron />
            </summary>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
              Dia em branco aparece como fechado. Para turnos que passam da meia
              noite, use 19:00 às 00:30.
            </p>
            <Semana horarios={negocio.horarios} />
          </details>
        </>
      ) : (
        <>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
            Dia em branco aparece como fechado. Para turnos que passam da meia
            noite, use 19:00 às 00:30.
          </p>
          <Semana horarios={negocio.horarios} />
          <VirarHoraMarcada />
        </>
      )}
    </main>
  );
}
