import Link from "next/link";
import { copiarSegundaParaSemana, salvarHorarios } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import { BotaoDeAcao } from "@/componentes/painel/BotaoDeAcao";
import { BarraSalvar, Botao } from "@/componentes/painel/Campos";
import { doDono } from "@/lib/dados";
import { DIAS_LONGO, porDiaSemana } from "@/lib/horarios";
import type { Intervalo } from "@/lib/tipos";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

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

export default async function Horarios({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; copiado?: string; erro?: string }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);
  const semana = porDiaSemana(negocio.horarios);

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
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
        Dia sem horário preenchido aparece como fechado. Para turnos que passam
        da meia noite, use 19:00 às 00:30.
      </p>

      <Aviso
        salvo={params.salvo === "1"}
        copiado={params.copiado === "1"}
        erro={params.erro}
      />

      {/*
        A semana continua empilhada no computador, e o formulário para de
        crescer junto com a tela. Duas colunas de dias foi a primeira tentativa,
        e sobrava 125 pixels para cada campo de hora: o navegador que escreve
        "09:00 AM" cortava o AM dentro do campo. Sete dias em fila é a leitura
        natural de uma semana, e a largura travada deixa cada par de horas do
        tamanho do que se digita nele.
      */}
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
                  <summary className="cursor-pointer list-none text-sm text-destaque">
                    Adicionar outro horário
                  </summary>
                  <div className="mt-3 flex flex-col gap-3">
                    {Array.from({ length: SLOTS - 1 }, (_, i) => (
                      <Par
                        key={i}
                        dia={dia}
                        slot={i + 1}
                        intervalo={extras[i]}
                      />
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
    </main>
  );
}
