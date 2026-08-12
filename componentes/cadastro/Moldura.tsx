import type { ReactNode } from "react";
import { Marca } from "@/componentes/Marca";

/**
 * Moldura das telas de entrada e cadastro. Uma coluna estreita, centralizada,
 * com bastante ar em volta e a fonte do próprio aparelho.
 */
export function Moldura({
  titulo,
  subtitulo,
  children,
  rodape,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <div data-tema="areia" className="flex min-h-dvh flex-col bg-fundo">
      <header className="mx-auto w-full max-w-md px-6 py-5">
        <Marca />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-6 pb-10">
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
