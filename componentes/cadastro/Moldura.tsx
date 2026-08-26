import Link from "next/link";
import type { ReactNode } from "react";
import { Marca } from "@/componentes/Marca";
import { LETRA_DE_ENTRADA } from "@/lib/fontes";
import { BotaoEnviar } from "./BotaoEnviar";

/**
 * Moldura das telas de entrada e cadastro. Uma coluna estreita, com bastante ar
 * em volta, e a letra do próprio aparelho no corpo.
 *
 * O título e o enunciado das perguntas saem na Gloock, a serifada de contraste
 * alto que a página pública já oferece na combinação "Marcante". Ver
 * `LETRA_DE_ENTRADA`, que também explica por que o corpo continua na letra do
 * aparelho.
 *
 * Com `lado`, vira duas faixas no computador: a coluna de sempre à esquerda, e
 * à direita uma parede que ocupa a faixa inteira, de cima a baixo. É o que o
 * cadastro usa para mostrar a página nascendo enquanto a pessoa preenche.
 *
 * **A parede é a resposta ao vazio do monitor, e ela é medida.** Antes as duas
 * colunas moravam dentro de um `max-w-4xl` centralizado: em 1440 sobravam 295px
 * de nada à esquerda e 296px à direita, 41% da largura da tela, e a prévia
 * terminava a 657px do topo enquanto o formulário seguia até 1339px, deixando
 * um retângulo de 392 por 682 pixels em branco no canto de baixo à direita. A
 * faixa da direita passa a ser um objeto, com fundo próprio e altura de tela
 * inteira, então o que sobra deixa de ser sobra e vira o ar em volta da peça
 * pendurada.
 *
 * A parede veste o tema `noite`, que existe no produto pelo motivo de museu
 * (ver o comentário dele em globals.css): parede escura, a peça avança. A
 * prévia devolve o tema `areia` para dentro do aparelho, senão ela mentiria
 * sobre a cor da página que a pessoa vai receber.
 *
 * O `lado` some no celular, e não encolhe. Ali a tela é do formulário, que é o
 * que a pessoa veio fazer, e uma prévia espremida em cima roubaria o espaço da
 * lista de ramos por nenhum ganho.
 *
 * Com `voltar`, o cabeçalho ganha a saída da tela, à esquerda, e a marca vai
 * para a direita. É um link de verdade, e não `history.back()`: funciona com o
 * JavaScript desligado, abre em nova aba se a pessoa quiser, e leva sempre
 * para o mesmo lugar, mesmo quando a pessoa chegou pelo endereço direto.
 */
export function Moldura({
  titulo,
  subtitulo,
  children,
  rodape,
  lado,
  voltar,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  rodape?: ReactNode;
  lado?: ReactNode;
  /** A saída da tela, no alto à esquerda. O rótulo padrão é "Voltar". */
  voltar?: { href: string; rotulo?: string };
}) {
  /*
   * A coluna cresce de 448 para 512px onde existe parede ao lado, e volta ao
   * tamanho de sempre onde ela é a tela inteira. Com a faixa da direita comendo
   * 42% do monitor, a coluna maior é o que devolve equilíbrio: a folga de cada
   * lado dela cai de 295 para 137 pixels em 1440.
   */
  const largura = lado ? "max-w-md xl:max-w-lg" : "max-w-md";

  /*
   * Sem parede ao lado, a coluna desce para o meio da altura.
   *
   * `/entrar` mede 351px de conteúdo numa tela de 900 e 371px numa de 664:
   * encostada no topo, ela deixava 449px de nada embaixo no monitor e 250px no
   * celular, e a tela de login parecia ter perdido um pedaço. No celular a
   * centralização também baixa o botão para a altura do polegar.
   *
   * `my-auto` continua seguro quando o conteúdo passa da altura da tela, que é
   * o caso da denúncia e da ajuda: margem automática só reparte folga que
   * existe, então ali ela vale zero e a coluna começa no topo. `justify-center`
   * cortaria o começo dessas duas.
   */
  const coluna = (
    <div className={`flex w-full flex-col ${lado ? "" : "my-auto"}`}>
      {/*
        O título desce um passo no celular. A serifada de contraste alto ocupa
        mais altura que a letra do aparelho no mesmo corpo, e a 2,35rem ela
        comia 190 dos 664 pixels do iPhone 13 antes da primeira pergunta.
      */}
      <h1 className="font-titulo text-[2.05rem] leading-[1.06] font-normal tracking-[-0.015em] text-balance text-texto sm:text-[2.35rem]">
        {titulo}
      </h1>
      {subtitulo ? (
        <p className="mt-3 text-[1.05rem] leading-relaxed text-suave">
          {subtitulo}
        </p>
      ) : null}

      <div className="mt-8">{children}</div>

      {rodape ? <div className="mt-8">{rodape}</div> : null}
    </div>
  );

  const faixaDaEsquerda = (
    <div className="flex min-h-dvh flex-col">
      {/*
        O alvo do link da marca tem 23px de altura por conta da própria letra.
        A altura mínima vem por aqui, e não dentro de `Marca`, porque a marca
        também aparece em lugares onde ela não é alvo de toque.
      */}
      <header
        className={`mx-auto w-full ${largura} px-6 py-4 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center`}
      >
        {voltar ? (
          <div className="flex items-center justify-between gap-4">
            {/*
              O -ml-2 devolve à seta o alinhamento com o texto da coluna: o
              alvo de dedo precisa de 44px de largura, e sem isso os 44px
              empurrariam o desenho para dentro da página.
            */}
            <Link
              href={voltar.href}
              className="-ml-2 min-w-11 justify-start gap-1.5 rounded-full px-2 text-[0.95rem] font-medium text-texto"
            >
              <Seta />
              {voltar.rotulo ?? "Voltar"}
            </Link>
            <Marca />
          </div>
        ) : (
          <Marca />
        )}
      </header>

      <main
        className={`mx-auto flex w-full ${largura} flex-1 flex-col px-6 pt-6 pb-10`}
      >
        {coluna}
      </main>
    </div>
  );

  if (!lado) {
    return (
      <div
        data-tema="areia"
        className={`${LETRA_DE_ENTRADA} min-h-dvh bg-fundo`}
      >
        {faixaDaEsquerda}
      </div>
    );
  }

  return (
    <div
      data-tema="areia"
      className={`${LETRA_DE_ENTRADA} min-h-dvh bg-fundo lg:grid lg:grid-cols-[minmax(0,1fr)_42%]`}
    >
      {faixaDaEsquerda}

      {/*
        A faixa escura ocupa a célula inteira da grade, então ela continua
        pintada por toda a rolagem. O que gruda é o miolo, com uma tela de
        altura, e é ele que mantém a peça no meio do campo de visão enquanto o
        formulário desce.
      */}
      <aside data-tema="noite" className="hidden bg-fundo lg:block">
        <div className="sticky top-0 flex h-dvh flex-col items-center justify-center px-8">
          {lado}
        </div>
      </aside>
    </div>
  );
}

/** A seta da saída. Desenho próprio, do tamanho da letra ao lado. */
function Seta() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4.5 w-4.5 shrink-0"
    >
      <path
        d="M12 4.5 6.5 10l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BotaoPrincipal({
  children,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <BotaoEnviar {...resto}>{children}</BotaoEnviar>;
}
