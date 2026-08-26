import type { ReactNode } from "react";

/**
 * Toda seção da página passa por aqui.
 *
 * Se não houver conteúdo, a seção some inteira, incluindo o título. É a regra
 * de nunca mostrar exemplo nem "em breve" para campo que o dono não preencheu.
 *
 * O título é uma plaquinha, e não uma manchete. Todas as seções tinham o mesmo
 * título grosso no mesmo corpo, e o resultado era uma página onde a interface
 * falava mais alto que o trabalho exposto. Numa galeria o nome da sala fica do
 * tamanho de uma plaquinha de parede, e quem tem escala é a obra. O desenho da
 * letra de título do tema passa a aparecer uma vez só, no nome do negócio, que
 * é o que faz a escolha da letra valer alguma coisa.
 */
export function Secao({
  titulo,
  id,
  vazia,
  amplo = false,
  children,
}: {
  titulo: string;
  id: string;
  vazia?: boolean;
  /**
   * Mais respiro em volta. A galeria pede: obra pendurada perto demais da
   * seguinte lê como grade de aplicativo, e o espaço em volta é metade do que
   * faz uma parede parecer uma parede.
   */
  amplo?: boolean;
  children: ReactNode;
}) {
  if (vazia) return null;
  return (
    <section
      aria-labelledby={`${id}-titulo`}
      className={`px-5 ${amplo ? "py-9 lg:py-12" : "py-7"}`}
    >
      <h2
        id={`${id}-titulo`}
        className={`rotulo-parede ${amplo ? "mb-5 lg:mb-7" : "mb-4"}`}
      >
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Divisor() {
  return <hr className="mx-5 border-0 border-t border-borda" />;
}
