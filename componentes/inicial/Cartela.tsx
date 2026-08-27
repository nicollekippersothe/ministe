import { DOMINIO_PUBLICO } from "@/lib/marca";
import type { Negocio } from "@/lib/tipos";

/**
 * A cartela, a etiqueta que fica na parede ao lado do que está pendurado.
 *
 * Numa exposição toda peça tem uma: quem assina, o que é, de onde vem. Aqui
 * ela faz o mesmo trabalho, e faz um trabalho a mais: diz que o celular ao
 * lado é a página de um negócio de verdade, com nome, cidade e endereço, e
 * não uma ilustração de página.
 *
 * Fio em cima, e nunca tarja na lateral: tarja colorida na borda esquerda é
 * uma das seis armadilhas do AGENTS.md, e o fio de topo já é o desenho de
 * etiqueta de museu de qualquer jeito.
 *
 * O conteúdo sai do próprio negócio. Se um exemplo mudar de cidade, a cartela
 * muda junto.
 */
export function Cartela({
  negocio,
  tipo,
  className = "",
}: {
  negocio: Negocio;
  /** O ofício, como a vitrine da tela inicial já nomeia cada exemplo. */
  tipo: string;
  className?: string;
}) {
  const local = [negocio.cidade, negocio.estado].filter(Boolean).join(", ");

  return (
    <div className={`border-t border-borda pt-3 ${className}`}>
      <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-suave uppercase">
        {tipo}
      </p>
      <p className="mt-1.5 font-semibold tracking-[-0.015em] text-texto">
        {negocio.nome}
      </p>
      <p className="mt-0.5 text-[0.85rem] leading-snug text-suave">
        {local ? `${local}. ` : null}
        {DOMINIO_PUBLICO}/{negocio.slug}
      </p>
    </div>
  );
}
