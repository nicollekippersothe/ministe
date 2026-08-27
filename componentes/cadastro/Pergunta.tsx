import type { ReactNode } from "react";

/**
 * O cabeçalho de uma pergunta do cadastro.
 *
 * Existe para uma coisa só: fazer a pergunta pesar mais que a resposta. Antes
 * o rótulo tinha 15px e as opções da lista tinham 16, então a tela lia como
 * uma lista plana de trinta e cinco linhas com um bilhete em cima. Aqui a
 * pergunta ganha tamanho, e tudo em volta desce de peso.
 *
 * O peso vem do tamanho e do contraste de cor, e não de uma segunda letra. Uma
 * rodada tentou separar quem pergunta de quem responde com a serifada de
 * display do produto, e a dona leu a tela e recusou. O que separa aqui é a
 * escala: a pergunta em 1,35rem semibold contra o rótulo da opção em 1rem, com
 * a cor de apoio no que é secundário.
 *
 * O número fica em `aria-hidden` de propósito: para quem enxerga, ele dá o
 * ritmo de uma pergunta por vez; para quem ouve, ele viraria um "um" solto
 * antes de cada rótulo, e o leitor de tela já anuncia a posição do campo.
 *
 * A numeração se sustenta porque a ordem carrega informação de verdade: o ramo
 * é a primeira pergunta porque a receita dele monta a página antes de a pessoa
 * escrever qualquer coisa, e as duas seguintes dependem dele. Numerar uma lista
 * de campos independentes seria enfeite.
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
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span
        aria-hidden
        className="text-[1.15rem] text-suave tabular-nums"
      >
        {numero}
      </span>
      <span className="text-[1.35rem] leading-tight font-semibold tracking-[-0.015em] text-texto">
        {children}
      </span>
      {exemplo ? (
        <span className="text-[0.9rem] text-suave">{exemplo}</span>
      ) : null}
    </span>
  );
}
