import { Telefone } from "./Telefone";
import type { Negocio } from "@/lib/tipos";

/**
 * O celular da abertura passando por vários negócios.
 *
 * Um exemplo só responde "que bonito". Vários respondem "é para mim", que é a
 * pergunta que a pessoa faz nos dois primeiros segundos, e é por isso que o
 * carrossel vale a complicação a mais.
 *
 * Sem JavaScript. Os quatro aparelhos ficam empilhados na mesma célula de uma
 * grade, e a animação alterna a opacidade com um atraso por quadro. A rolagem
 * de cada um usa o mesmo ciclo e o mesmo atraso (o CSS está em globals.css),
 * então cada negócio entra no topo da página, desce até o fim enquanto está à
 * vista, e volta ao topo já invisível.
 *
 * Quem pediu menos movimento no sistema vê o primeiro negócio, parado. Por
 * isso o primeiro da lista é o caso mais representativo, e não o mais bonito.
 */
export function Carrossel({ negocios }: { negocios: Negocio[] }) {
  /*
   * Seis segundos por negócio. Menos que isso não dá tempo de ler o nome e
   * ver o catálogo descer; muito mais e quem chegou nunca vê o quarto.
   */
  const porNegocio = 6;
  const ciclo = negocios.length * porNegocio;

  return (
    <div
      className="carrossel"
      style={{ "--ciclo": `${ciclo}s` } as React.CSSProperties}
    >
      {negocios.map((negocio, i) => (
        <div
          key={negocio.slug}
          style={{ "--atraso": `${i * porNegocio}s` } as React.CSSProperties}
        >
          <Telefone negocio={negocio} prioridade={i === 0} leve />
        </div>
      ))}
    </div>
  );
}
