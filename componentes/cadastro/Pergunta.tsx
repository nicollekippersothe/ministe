import type { ReactNode } from "react";

/**
 * O cabeçalho de uma pergunta do cadastro.
 *
 * Existe para uma coisa só: fazer a pergunta pesar mais que a resposta. Antes
 * o rótulo tinha 15px e as opções da lista tinham 16, então a tela lia como
 * uma lista plana de trinta e cinco linhas com um bilhete em cima. Aqui a
 * pergunta vai a 22px e semibold, e tudo em volta desce de peso.
 *
 * O número fica em `aria-hidden` de propósito: para quem enxerga, ele dá o
 * ritmo de uma pergunta por vez; para quem ouve, ele viraria um "um" solto
 * antes de cada rótulo, e o leitor de tela já anuncia a posição do campo.
 *
 * Não é o elemento de rótulo, e sim o miolo dele. Quem chama põe por dentro do
 * `legend` (no grupo de rádio) ou do `label` (nos campos de texto), porque as
 * duas regras de acessibilidade continuam valendo e nenhuma das duas aceita
 * ser trocada por um `div` bonito.
 */
export function Pergunta({
  numero,
  children,
  exemplo,
}: {
  numero: number;
  children: ReactNode;
  /** Um exemplo curto, do lado da pergunta, em vez de uma linha de explicação. */
  exemplo?: ReactNode;
}) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span
        aria-hidden
        className="text-[0.9rem] font-medium text-suave tabular-nums"
      >
        {numero}
      </span>
      <span className="text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] text-texto">
        {children}
      </span>
      {exemplo ? (
        <span className="text-[0.9rem] text-suave">{exemplo}</span>
      ) : null}
    </span>
  );
}
