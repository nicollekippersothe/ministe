import type { Estado } from "@/lib/horarios";

/**
 * O selo de aberto agora.
 *
 * Fica separado porque a tela inicial mostra o selo de verdade, não um
 * desenho parecido. Assim a propaganda não consegue divergir do produto.
 *
 * Quando recebe `id`, é a versão viva da página pública, que o script inline
 * atualiza. Sem `id`, é uma amostra parada.
 */
export function SeloHorario({
  estado,
  id,
  className = "",
}: {
  estado: Estado;
  id?: string;
  className?: string;
}) {
  return (
    <p
      id={id}
      data-aberto={estado.aberto ? "1" : "0"}
      className={`selo inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-3 text-sm ${className}`}
    >
      <span className="bolinha h-2 w-2 shrink-0 rounded-full" aria-hidden />
      <strong data-t className="font-semibold">
        {estado.titulo}
      </strong>
      <span data-u>{estado.detalhe}</span>
    </p>
  );
}
