import type { ReactNode } from "react";

/**
 * Toda seção da página passa por aqui.
 *
 * Se não houver conteúdo, a seção some inteira, incluindo o título. É a regra
 * de nunca mostrar exemplo nem "em breve" para campo que o dono não preencheu.
 */
export function Secao({
  titulo,
  id,
  vazia,
  children,
}: {
  titulo: string;
  id: string;
  vazia?: boolean;
  children: ReactNode;
}) {
  if (vazia) return null;
  return (
    <section aria-labelledby={`${id}-titulo`} className="px-5 py-7">
      <h2
        id={`${id}-titulo`}
        className="titulo mb-4 text-xl text-texto"
      >
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Divisor() {
  return <hr className="mx-5 border-0 border-t border-borda" />;
}
