import Image from "next/image";
import type { Foto, Negocio } from "@/lib/tipos";

/**
 * A galeria da pagina publica: a parede da exposicao.
 *
 * Aqui aparece o trabalho da pessoa, e e por ele que o visitante decide. Antes
 * eram tres quadrados iguais por fileira, com pouco mais de cem pixels de lado
 * no celular, e o resto da fileira em branco quando a conta sobrava. Uma folha
 * de contato, que e o material bruto que o fotografo separa e joga fora.
 *
 * Tres decisoes mudaram isso, e as tres saem do mesmo lugar: quem manda no
 * arranjo e a quantidade de fotos.
 *
 * 1. Uma foto so vira peca emoldurada, inteira e sem corte nenhum. E o caso de
 *    quem acabou de publicar, e era o pior: um selo sozinho no canto de uma
 *    fileira le como defeito, e a moldura le como escolha.
 * 2. Duas fotos viram diptico, os dois paineis ocupando a largura inteira.
 * 3. Tres ou mais viram parede pendurada, com uma peca grande abrindo cada
 *    bloco e as outras em volta. O ritmo esta em nth-child, no globals.css, e a
 *    ultima peca de cada cauda estica para fechar a fileira. Vale igual para
 *    tres fotos e para vinte.
 *
 * As proporcoes sao retrato e paisagem, e nunca o quadrado: foto de celular
 * nasce em pe, e o corte quadrado come justo a cabeca e o pe do enquadramento.
 * Cada peca ganha um fio por dentro, que devolve a borda que a foto de luz de
 * teto perde no branco estourado.
 *
 * Tudo em CSS. A pagina publica continua com o mesmo JavaScript proprio de
 * antes, que sao o selo de horario e a contagem.
 *
 * Sem revelacao na rolagem aqui, e a razao vale a pena guardar: a classe
 * `surge` se pendura em `animation-timeline: view()`, e quem pinta a pagina
 * inteira de uma vez (captura de tela, impressao, a imagem de previa do link)
 * pega as pecas de baixo com opacidade zero. Numa secao de texto isso passa
 * despercebido, numa parede de fotos ela some. Movimento que apaga o conteudo
 * nao e movimento, e defeito.
 */

/** Um recorte fechado, do tamanho que a parede pedir. */
function Obra({ foto, sizes }: { foto: Foto; sizes: string }) {
  return (
    <li className="obra">
      <Image
        src={foto.url}
        alt={foto.alt}
        width={foto.largura}
        height={foto.altura}
        sizes={sizes}
        className="h-full w-full object-cover"
      />
    </li>
  );
}

export function Galeria({ negocio }: { negocio: Negocio }) {
  const fotos = negocio.galeria;
  if (fotos.length === 0) return null;

  /*
   * A peca unica entra pela altura, e nao pela largura: o que decide o tamanho
   * dela e o teto da moldura, no CSS. Por isso a medida declarada aqui e a
   * maior que ela pode ocupar em cada tela, e a foto em pe sempre pede menos.
   */
  if (fotos.length === 1) {
    const foto = fotos[0];
    return (
      <figure className="quadro">
        <Image
          src={foto.url}
          alt={foto.alt}
          width={foto.largura}
          height={foto.altura}
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 460px, 620px"
        />
      </figure>
    );
  }

  if (fotos.length === 2) {
    return (
      <ul className="diptico">
        {fotos.map((foto, i) => (
          <Obra
            key={`${foto.url}-${i}`}
            foto={foto}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 250px, 340px"
          />
        ))}
      </ul>
    );
  }

  return (
    <ul className="parede-obras">
      {fotos.map((foto, i) => (
        <Obra
          key={`${foto.url}-${i}`}
          foto={foto}
          /*
           * A peca de abertura chega a duas colunas e a companheira fica com
           * uma. Como o arranjo muda por posicao e por largura de tela, a
           * medida declarada e a da maior peca: o navegador nunca busca arquivo
           * menor do que o recorte precisa, e nunca fica foto borrada.
           */
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 500px, 460px"
        />
      ))}
    </ul>
  );
}
