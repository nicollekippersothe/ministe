import Link from "next/link";
import { IconeAvancar } from "@/componentes/Icones";
import { IconeConfirmado } from "./Sinais";
import { completudeDe } from "@/lib/completude";
import type { Negocio } from "@/lib/tipos";

/**
 * O quanto a página já está pronta, desenhado.
 *
 * **É a resposta ao "fica muito solto" da dona do produto.** Quem já preencheu
 * tudo raramente volta, e quem não preencheu não sabia o que fazer: os dois
 * abriam o mesmo formulário grande. O medidor dá ao painel um trabalho e à
 * pessoa uma direção. A conta e a escolha das peças moram em lib/completude.ts,
 * com o porquê de cada peça que entra e de cada uma que fica de fora.
 *
 * As leis de UX que ele encarna:
 *
 * - **Goal-Gradient**: a barra mostra o quanto já andou, e a contagem é "mais
 *   2", e não "3 de 5": perto da meta a vontade cresce, e o número pequeno é o
 *   que a alimenta.
 * - **Zeigarnik**: a tarefa aberta é a que aparece em texto. O que já foi vira
 *   estado calmo, o que falta vira o convite.
 * - **Von Restorff**: só a próxima peça recebe o cartão aceso e a seta. As
 *   outras que faltam ficam numa linha discreta, para a escolha não competir
 *   com o caminho mais curto.
 * - **Peak-End**: 100% não é o fim de uma lista, é uma comemoração curta. O
 *   estado cheio troca a barra por um "está pronta", que é o pico que a pessoa
 *   leva.
 * - **Fitts**: a próxima peça é um alvo de tela inteira, alto, e o mais perto
 *   do topo.
 *
 * A regra de escrita do produto vale aqui como em todo lugar: nenhuma palavra
 * de falta. "Mais 2 e ela fica completa" no lugar de "faltam 2", e cada peça
 * dita pelo que ela acrescenta.
 */

/** A barra que enche sozinha ao abrir, uma microinteração de Doherty. */
function Barra({ pct }: { pct: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-texto/8"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Página ${pct}% pronta`}
    >
      {/*
        A largura final vem numa variável, e o quadro de abertura sai de zero
        até ela. É o feedback imediato que a Doherty pede: a barra cresce na
        frente da pessoa em vez de aparecer parada no número.
      */}
      <style href="painel-medidor" precedence="default">{`
        @keyframes medidor-enche { from { width: 0 } }
        .medidor-barra { animation: medidor-enche 0.8s cubic-bezier(0.22,1,0.36,1); }
      `}</style>
      <div
        className="medidor-barra h-full rounded-full bg-destaque"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Medidor({ negocio }: { negocio: Negocio }) {
  const { pct, faltando, proxima, completo, feitas, total } =
    completudeDe(negocio);

  if (completo) {
    /*
     * O pico. Sem barra, sem lista: a página está pronta, e o painel para de
     * pedir. O selo verde é o mesmo do "salvo", então a pessoa reconhece o
     * estado sem ler.
     */
    return (
      <div className="rounded-2xl border border-aberto-texto/25 bg-aberto-fundo/50 p-4">
        <div className="flex items-center gap-3">
          <IconeConfirmado className="h-6 w-6 shrink-0 text-aberto-texto" />
          <div>
            <p className="font-semibold text-texto">Sua página está pronta.</p>
            <p className="mt-0.5 text-sm leading-relaxed text-suave">
              As cinco peças estão no lugar. Daqui, o painel guarda o que você
              quiser mudar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const restantes = faltando.length;
  const outras = faltando.slice(1);

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold text-texto">
          Sua página está {pct}% pronta.
        </p>
        <p className="shrink-0 text-sm tabular-nums text-suave">
          {feitas} de {total}
        </p>
      </div>

      <div className="mt-3">
        <Barra pct={pct} />
      </div>

      {/*
        Goal-Gradient: o número pequeno do que resta, e nunca o do que falta.
        Com uma peça só, a frase é a última empurradinha.
      */}
      <p className="mt-3 text-sm leading-relaxed text-suave">
        {restantes === 1
          ? "Mais uma peça e ela fica completa."
          : `Mais ${restantes} e ela fica completa.`}
      </p>

      {/* Von Restorff + Fitts: a próxima peça, alvo de tela inteira, aceso. */}
      {proxima ? (
        <Link
          href={proxima.href}
          className="mt-3 flex items-center gap-3 rounded-xl border border-destaque/30 bg-destaque/8 px-4 py-3.5 transition-transform duration-75 active:scale-[0.99]"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-destaque">
              {proxima.convite}
            </span>
            <span className="mt-0.5 block text-xs text-suave">
              {proxima.titulo}
            </span>
          </span>
          <IconeAvancar className="h-4 w-4 shrink-0 text-destaque" />
        </Link>
      ) : null}

      {/*
        O resto que falta, discreto: quem prefere começar por outra peça tem o
        caminho, sem que ele dispute com o destaque. As já feitas nem aparecem,
        que é o Zeigarnik: o painel fala do aberto, e cala sobre o fechado.
      */}
      {outras.length > 0 ? (
        <div className="mt-2 flex flex-col">
          {outras.map((p) => (
            <Link
              key={p.chave}
              href={p.href}
              className="flex min-h-11 items-center justify-between gap-3 text-sm text-suave underline-offset-4 hover:underline"
            >
              {p.convite}
              <IconeAvancar className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
