import type { ReactNode } from "react";

/**
 * O mais, desenhado. Ícone é vetor próprio, e nunca emoji, que é a regra 2 de
 * layout do AGENTS.md.
 */
export function IconeMais({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="M10 4.5v11M4.5 10h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * O atalho para o formulário de acrescentar, no alto da lista.
 *
 * **Existe porque acrescentar morava só no fim de tudo.** O formulário fica
 * embaixo da lista, que é o lugar honesto: a linha nova nasce no fim, e o
 * formulário logo acima dela é o que faz causa e efeito ficarem no mesmo
 * enquadramento. O preço disso é que, com o catálogo cheio, quem chega no alto
 * da tela precisa atravessar a lista inteira para achar o botão, e no celular
 * isso são três telas de rolagem antes de escrever a primeira letra.
 *
 * Então o botão passa a existir também onde a pessoa está olhando quando ela
 * abre a tela. É âncora de HTML, e não script: leva para o mesmo formulário, e
 * o `scroll-mt` de lá é o que impede a barra de Salvar de cobrir o campo na
 * chegada.
 */
export function AtalhoDeAcrescentar({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-borda bg-superficie px-4 text-sm font-semibold text-texto transition-transform duration-75 active:scale-[0.97] hover:border-texto/25"
    >
      <IconeMais className="h-4 w-4 text-destaque" />
      {children}
    </a>
  );
}
