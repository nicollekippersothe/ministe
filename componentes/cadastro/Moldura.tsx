import type { ReactNode } from "react";
import { Marca } from "@/componentes/Marca";

/**
 * Moldura das telas de entrada e cadastro. Uma coluna estreita, centralizada,
 * com bastante ar em volta e a fonte do próprio aparelho.
 *
 * Com `lado`, vira duas colunas no computador: a coluna de sempre à esquerda e
 * o que vier em `lado` à direita. É o que o cadastro usa para mostrar a página
 * nascendo enquanto a pessoa preenche.
 *
 * O `lado` some no celular, e não encolhe. Ali a tela é do formulário, que é o
 * que a pessoa veio fazer, e uma prévia espremida em cima roubaria o espaço da
 * lista de ramos por nenhum ganho.
 */
export function Moldura({
  titulo,
  subtitulo,
  children,
  rodape,
  lado,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  rodape?: ReactNode;
  lado?: ReactNode;
}) {
  const largura = lado ? "max-w-md lg:max-w-5xl" : "max-w-md";

  const coluna = (
    <div className="flex w-full max-w-md flex-col">
      <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto">
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

  return (
    <div data-tema="areia" className="flex min-h-dvh flex-col bg-fundo">
      <header className={`mx-auto w-full ${largura} px-6 py-5`}>
        <Marca />
      </header>

      <main
        className={`mx-auto flex w-full ${largura} flex-1 flex-col px-6 pt-6 pb-10`}
      >
        {lado ? (
          <div className="lg:flex lg:items-start lg:gap-16">
            {coluna}
            <div className="hidden lg:sticky lg:top-10 lg:block">{lado}</div>
          </div>
        ) : (
          coluna
        )}
      </main>
    </div>
  );
}

export function BotaoPrincipal({
  children,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex h-13 w-full items-center justify-center rounded-full bg-texto px-6 text-[1.05rem] font-semibold text-superficie"
      {...resto}
    >
      {children}
    </button>
  );
}
