import Link from "next/link";
import { NOME_PRODUTO } from "@/lib/marca";

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
  const estilo = `text-[0.95rem] font-bold tracking-[-0.015em] text-texto ${className}`;
  if (href === null) return <span className={estilo}>{NOME_PRODUTO}</span>;
  return (
    <Link href={href} className={estilo}>
      {NOME_PRODUTO}
    </Link>
  );
}
