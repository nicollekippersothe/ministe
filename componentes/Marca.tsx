import Link from "next/link";
import { NOME_PRODUTO } from "@/lib/marca";
import { SIMBOLO_CAIXA, SIMBOLO_CAMINHO } from "@/lib/simbolo";

/**
 * O logotipo, num lugar só.
 *
 * Caixa baixa e tracking negativo, como manda o guia. Antes estava em caixa
 * alta com tracking aberto em três telas diferentes, que é o desenho oposto
 * ao da marca e ainda por cima repetido.
 *
 * Cor Tinta, não Barro: o guia reserva Barro para uma aparição por tela, e
 * essa aparição vale mais num link que a pessoa vai tocar do que no logotipo,
 * que ela já sabe onde fica.
 *
 * A fonte é a do aparelho. O guia pede Archivo Bold no material de marca, mas
 * também diz que dentro do produto a versão de sistema é oficial, e o produto
 * inteiro depende de não baixar fonte nenhuma fora da página do cliente.
 */
export function Marca({
  href = "/",
  className = "",
}: {
  href?: string | null;
  className?: string;
}) {
  const estilo = `inline-flex items-center gap-2 text-[0.95rem] font-bold tracking-[-0.015em] text-texto ${className}`;

  /*
   * O símbolo vem de lib/simbolo, o mesmo caminho que o favicon e as peças de
   * portfólio usam. Desenho só existe num lugar, senão a marca diverge entre a
   * tela e o material impresso sem ninguém perceber.
   *
   * fillRule evenodd é o que mantém o vão do arco vazio. Sem ele o miolo
   * fecha e o símbolo vira um bloco.
   */
  const miolo = (
    <>
      <svg
        viewBox={SIMBOLO_CAIXA}
        fill="currentColor"
        fillRule="evenodd"
        aria-hidden
        className="h-[1.15rem] w-[1.15rem]"
      >
        <path d={SIMBOLO_CAMINHO} />
      </svg>
      {NOME_PRODUTO}
    </>
  );

  if (href === null) return <span className={estilo}>{miolo}</span>;
  return (
    <Link href={href} className={estilo}>
      {miolo}
    </Link>
  );
}
