import Link from "next/link";
import { Telefone } from "@/componentes/inicial/Telefone";
import { IconeSeta } from "@/componentes/Icones";
import { VITRINE } from "@/lib/exemplos";

/**
 * A parede de exemplos: a galeria da tela inicial.
 *
 * Antes eram cartões brancos com a foto de capa e um "Abrir a página" embaixo,
 * um do lado do outro. Respondiam "serve para o meu caso?" só pela capa, e a
 * pergunta de verdade, "como fica o meu produto lá dentro?", ficava sem
 * resposta até a pessoa clicar.
 *
 * Aqui a resposta está à vista: cada exemplo é a página de verdade, montada com
 * o produto, pendurada e acesa numa parede escura. É o motivo de museu que o
 * tema noite carrega (ver globals.css): a parede recua e a peça avança. O
 * aparelho não é desenho nem captura, são os componentes de verdade com os
 * dados de verdade, calculados no servidor.
 *
 * Uma fileira que corre de lado, como quem passeia por uma mostra. No celular a
 * próxima peça já espia pela direita, convidando o polegar; no monitor três ou
 * quatro aparecem de uma vez e o resto vem ao arrastar. Sete ofícios bem
 * distantes entre si, porque a largura é a prova de que serve para muita gente.
 *
 * Os aparelhos ficam parados: aqui eles são a coleção, e sete telas rolando ao
 * mesmo tempo seria a definição de barulho. A rolagem viva mora numa peça só,
 * no carrossel do herói.
 */
export function Vitrine() {
  return (
    <ul className="trilho -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto px-6 pb-4 sm:gap-6">
      {VITRINE.map(({ negocio, tipo }, i) => (
        <li
          key={negocio.slug}
          className="surge w-[15.5rem] shrink-0 snap-start sm:w-[17rem]"
        >
          <Link
            href={`/${negocio.slug}`}
            aria-label={`Abrir a página de exemplo de ${negocio.nome}, ${tipo}, em ${negocio.cidade}`}
            className="group block"
          >
            {/*
              O aparelho pendurado. Sobe um fio ao passar o ponteiro, como quadro
              que se aproxima de quem chega perto. Só transform, resolvido na
              placa de vídeo, e some para quem pediu menos movimento.
            */}
            <div className="transition-transform duration-300 group-hover:-translate-y-1.5">
              <Telefone negocio={negocio} prioridade={false} leve />
            </div>

            {/*
              A plaquinha de parede, ao pé da peça. Só o ofício, que é o que a
              pessoa procura ("serve para o meu caso?"): o nome já está aceso na
              própria página logo acima, e repeti-lo aqui seria eco. A leitura
              de sete plaquinhas vira a lista de ofícios que o produto atende.
            */}
            <div className="mt-4 flex items-center justify-between gap-3 px-1">
              <p className="font-semibold text-texto">{tipo}</p>
              <IconeSeta className="h-4 w-4 shrink-0 text-suave transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-destaque" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
