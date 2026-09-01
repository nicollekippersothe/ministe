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
    /*
      O estado deixou de ser a pílula de aplicativo e virou linha de placa: o
      ponto vivo, o rótulo em maiúsculas e o horário ao lado, sem fundo chapado.
      O ponto e a cor do rótulo carregam o estado; o texto continua dizendo tudo,
      então quem não distingue a cor lê a mesma coisa.
    */
    <p
      id={id}
      data-aberto={estado.aberto ? "1" : "0"}
      className={`selo inline-flex items-center gap-2 text-sm ${className}`}
    >
      <span className="bolinha h-2 w-2 shrink-0 rounded-full" aria-hidden />
      <strong data-t className="font-semibold">
        {estado.titulo}
      </strong>
      <span data-u className="text-suave">
        {estado.detalhe}
      </span>
    </p>
  );
}
