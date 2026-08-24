/**
 * O vocabulário do painel para dizer o que está acontecendo agora: os dois
 * sinais desenhados, e a faixa de recado que os usa.
 *
 * Desenho vetorial próprio, e nunca emoji fazendo papel de ícone, que é a
 * regra de layout do projeto. Ficam aqui, e não em `componentes/Icones.tsx`,
 * porque só existem para tela de trabalho: a página pública nunca mostra
 * andamento de escrita nenhuma, e o arquivo de lá é carregado por ela.
 */

import type { ReactNode } from "react";

type Props = { className?: string };

/** Roda enquanto a escrita acontece. Para de rodar para quem pediu menos movimento. */
export function IconeGirando({ className }: Props) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 8 8"
          to="360 8 8"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

/** O certo de que a escrita chegou ao fim. */
export function IconeConfirmado({ className }: Props) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.16" />
      <path
        d="M4.6 8.3l2.3 2.3 4.5-4.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Os cinco tons em que uma tela de painel conta o que aconteceu.
 *
 * `repouso` é a linha cinza que descreve o campo parado. `andamento` roda
 * enquanto a escrita acontece. `pronto` é o certo em verde de quem chegou ao
 * destino. `recusa` sai na cor de destaque, com o passo seguinte junto. `nota`
 * é a caixa neutra do que a tela precisa contar sem ser fim de gravação.
 */
export type Tom = "repouso" | "andamento" | "pronto" | "recusa" | "nota";

const CAIXA: Record<Tom, string> = {
  repouso: "text-suave",
  andamento: "rounded-lg border border-borda bg-fundo px-3 py-2 font-medium text-texto",
  pronto:
    "rounded-lg border border-aberto-texto/25 bg-aberto-fundo px-3 py-2 font-medium text-aberto-texto",
  recusa:
    "rounded-lg border border-destaque/30 bg-destaque/8 px-3 py-2 font-medium text-destaque",
  nota: "rounded-lg border border-borda bg-fundo px-3 py-2 text-suave",
};

/**
 * A faixa de recado, igual nos dois cartões de imagem.
 *
 * Ela existe como peça própria porque a tela inteira precisa falar a mesma
 * língua: quem acabou de mandar uma foto e quem acabou de mover o ponto da capa
 * veem o mesmo giro enquanto a escrita corre e o mesmo certo verde quando ela
 * chega. Duas cópias do mesmo `if` em dois arquivos viravam dois vocabulários
 * na mesma tela na primeira vez que uma delas mudasse.
 *
 * A cor sozinha diria pouco para quem enxerga pouco, então cada tom tem forma:
 * o giro do andamento, o certo do pronto, a caixa de destaque da recusa. E o
 * papel muda junto: recusa é `alert`, que o leitor de tela anuncia na hora, e o
 * resto é `status`, que ele lê quando terminar a frase de agora.
 */
export function FaixaDeRecado({
  tom,
  className = "",
  children,
}: {
  tom: Tom;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      role={tom === "recusa" ? "alert" : "status"}
      aria-live="polite"
      className={`flex items-start gap-2 text-xs leading-relaxed ${CAIXA[tom]} ${className}`}
    >
      {tom === "andamento" ? (
        <IconeGirando className="mt-px h-4 w-4 shrink-0 motion-reduce:hidden" />
      ) : null}
      {tom === "pronto" ? (
        <IconeConfirmado className="mt-px h-4 w-4 shrink-0" />
      ) : null}
      <span className="min-w-0">{children}</span>
    </p>
  );
}
