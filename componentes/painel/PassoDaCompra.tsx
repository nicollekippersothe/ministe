import type { ReactNode } from "react";

/**
 * Os dois passos da tela de plano, com o estado de cada um à vista.
 *
 * **Existe por um relato de uso.** A tela mostrava período e meio de pagamento
 * na mesma altura, quatro cartões de mesmo peso, e nada dizia que a segunda
 * escolha também era obrigatória. A dona leu como uma lista de quatro planos e
 * parou depois de tocar no primeiro. Como o período já nasce com o mensal
 * valendo, o clique dela era mesmo em algo que já estava escolhido, e a tela
 * ficava igual antes e depois: nenhum retorno, nenhuma pista de que faltava a
 * metade de baixo.
 *
 * Numerar aqui é honesto porque isto é uma sequência de verdade: o preço sai do
 * período, e o meio de pagamento cobra esse preço. O que cada passo carrega:
 *
 * - `feito` mostra o que ficou escolhido, com o sinal de conferido. É a única
 *   peça que dá retorno de que o toque no cartão valeu.
 * - `agora` marca o passo que está esperando alguém, com a palavra na frente.
 *
 * A diferença entre os dois passos também está no ícone dos cartões, e isso é
 * de propósito: no passo de escolher, o cartão marcado ganha um visto e fica
 * onde está; no passo de pagar, os cartões levam seta de avançar, porque cada
 * um abre outra tela. Um visto e uma seta dizem coisas diferentes, e antes os
 * quatro cartões estavam mudos.
 */
export function Passo({
  numero,
  titulo,
  estado,
  marca,
  children,
}: {
  numero: number;
  titulo: string;
  estado: "feito" | "agora";
  /** O que ficou escolhido, no passo já feito. */
  marca?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs font-semibold tracking-[0.14em] text-suave uppercase">
          Passo {numero} de 2
        </span>
        {estado === "agora" ? (
          <span className="rounded-full bg-destaque/12 px-2.5 py-0.5 text-xs font-semibold text-destaque">
            Agora
          </span>
        ) : marca ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-texto">
            <IconeConferido className="h-3.5 w-3.5" />
            {marca}
          </span>
        ) : null}
      </div>

      <h2 className="mt-1 text-lg font-semibold tracking-tight text-texto">
        {titulo}
      </h2>

      {children}
    </section>
  );
}

/**
 * O visto de escolhido.
 *
 * Desenho vetorial próprio, como todo ícone daqui, e nunca um emoji fazendo
 * papel de ícone.
 */
export function IconeConferido({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="m4 12.5 5.5 5.5L20 6" />
    </svg>
  );
}
