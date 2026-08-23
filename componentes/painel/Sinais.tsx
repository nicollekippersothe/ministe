/**
 * Os dois sinais que o painel usa para dizer o que está acontecendo agora.
 *
 * Desenho vetorial próprio, e nunca emoji fazendo papel de ícone, que é a
 * regra de layout do projeto. Ficam aqui, e não em `componentes/Icones.tsx`,
 * porque só existem para tela de trabalho: a página pública nunca mostra
 * andamento de escrita nenhuma, e o arquivo de lá é carregado por ela.
 */

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
