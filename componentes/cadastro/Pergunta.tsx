import type { ReactNode } from "react";

/**
 * O cabeçalho de uma pergunta do cadastro.
 *
 * Existe para uma coisa só: fazer a pergunta pesar mais que a resposta. Antes
 * o rótulo tinha 15px e as opções da lista tinham 16, então a tela lia como
 * uma lista plana de trinta e cinco linhas com um bilhete em cima. Aqui a
 * pergunta ganha tamanho, e tudo em volta desce de peso.
 *
 * O peso passou a vir da letra, e não do negrito. A pergunta sai na serifada de
 * contraste alto do produto (ver `LETRA_DE_ENTRADA`), em peso normal: com o
 * semibold da fonte do aparelho, a pergunta e o rótulo da opção logo abaixo
 * eram o mesmo desenho em dois tamanhos, e a tela inteira lia como um
 * formulário de sistema. Duas letras diferentes separam quem pergunta de quem
 * responde sem precisar engrossar nada.
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
        className="font-titulo text-[1.15rem] text-suave tabular-nums"
      >
        {numero}
      </span>
      <span className="font-titulo text-[1.5rem] leading-tight font-normal tracking-[-0.005em] text-texto">
        {children}
      </span>
      {exemplo ? (
        <span className="text-[0.9rem] text-suave">{exemplo}</span>
      ) : null}
    </span>
  );
}
