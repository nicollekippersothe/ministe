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
 *
 * A largura de duas colunas é `4xl`, e não `5xl`, porque o par cabe em 800px:
 * com `5xl` sobravam 160px de vazio à direita da prévia, e o conjunto inteiro
 * ficava encostado à esquerda dentro da própria moldura. Medido em 1440.
 * A coluna do `lado` cresce e centraliza a prévia no que sobra, então a folga
 * fica igual dos dois lados em vez de toda de um lado só.
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
  const largura = lado ? "max-w-md lg:max-w-4xl" : "max-w-md";

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
      {/*
        O alvo do link da marca tem 23px de altura por conta da própria letra.
        A altura mínima vem por aqui, e não dentro de `Marca`, porque a marca
        também aparece em lugares onde ela não é alvo de toque.
      */}
      <header
        className={`mx-auto w-full ${largura} px-6 py-4 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center`}
      >
        <Marca />
      </header>

      <main
        className={`mx-auto flex w-full ${largura} flex-1 flex-col px-6 pt-6 pb-10`}
      >
        {lado ? (
          <div className="lg:flex lg:items-start lg:gap-12">
            {coluna}
            <div className="hidden lg:sticky lg:top-8 lg:flex lg:flex-1 lg:justify-center">
              {lado}
            </div>
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
