import { Telefone } from "./Telefone";
import type { Negocio } from "@/lib/tipos";

/**
 * A parede da galeria: as páginas de verdade penduradas como obras.
 *
 * Cada peça é o `Telefone`, o produto de verdade renderizado no servidor, no
 * tema que o dono escolheu. A parede se monta em movimento (a classe `pendura`
 * do globals.css), uma obra depois da outra, e depois respiram de leve; o
 * `--atraso` cresce por peça, então a montagem corre da esquerda para a direita.
 * A plaquinha de latão ao pé, com o ofício e a cidade, é a mesma legenda de
 * mostra que a página do cliente usa.
 *
 * No celular a parede vira um trilho que desliza, com a próxima obra espiando
 * pela direita; no monitor abre em três, penduradas em alturas diferentes, como
 * numa parede de verdade. Decorativa, então `aria-hidden` no conjunto: o que o
 * leitor de tela precisa (o nome do ofício) já está no texto das seções.
 */
export function Parede({
  pecas,
}: {
  pecas: { negocio: Negocio; tipo: string }[];
}) {
  return (
    <ul
      aria-hidden
      className="trilho -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:items-start lg:gap-7 lg:overflow-visible lg:px-0"
    >
      {pecas.map(({ negocio, tipo }, i) => (
        <li
          key={negocio.slug}
          /* A altura desigual do pendurar é layout (margem), não transform, para
             não brigar com a flutuação que também mexe no transform. */
          className={`pendura w-[16.5rem] shrink-0 snap-center sm:w-[19rem] lg:w-auto ${
            i === 1 ? "lg:mt-0" : i === 0 ? "lg:mt-9" : "lg:mt-16"
          }`}
          style={
            {
              "--atraso": `${480 + i * 160}ms`,
              "--respiro": `${6.4 + i * 0.9}s`,
            } as React.CSSProperties
          }
        >
          <Telefone negocio={negocio} prioridade={i === 0} leve />
          <div className="mt-5 text-center">
            <span
              aria-hidden
              className="mx-auto mb-2.5 block h-px w-8"
              style={{ background: "var(--c-ouro)" }}
            />
            <p className="text-[0.9rem] font-semibold text-texto">
              {negocio.nome}
            </p>
            <p className="mt-0.5 text-[0.7rem] tracking-[0.14em] text-suave uppercase">
              {tipo}
              {negocio.cidade ? ` · ${negocio.cidade}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
