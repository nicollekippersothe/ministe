"use client";

import { useState, type ReactNode } from "react";
import { Vitrine, VitrineAvulsa } from "./Vitrine";
import { Catalogo } from "@/componentes/Catalogo";
import { lerPreco } from "@/lib/formato";
import type { Item, Negocio } from "@/lib/tipos";

/**
 * Os campos de um item, com o cartão que eles montam ao lado.
 *
 * **É o conserto de "o catálogo é uma lista de campos".** Nome, descrição e
 * preço em três caixas brancas empilhadas descrevem um formulário, e o que a
 * pessoa está montando é uma vitrine. Ela escrevia, salvava, abria a prévia,
 * rolava até o catálogo, voltava e corrigia a descrição que tinha ficado grande
 * demais. Quatro telas para conferir uma linha de texto.
 *
 * O cartão daqui é o `Catalogo` da página pública, o mesmo componente, com o
 * `negocio` de verdade por baixo: então o preço só aparece se a pessoa escolheu
 * mostrar preço, o botão de pedido só aparece se existe WhatsApp gravado, e a
 * frase do botão é a que ela escreveu na tela do negócio. Cópia desenhada à mão
 * acertaria hoje e mentiria no primeiro ajuste da página.
 *
 * **A leitura dos campos é por evento, e não por estado controlado.** Os campos
 * continuam sendo os `Texto`, `AreaTexto` e `Marcar` do painel, renderizados no
 * servidor com `defaultValue`, e chegam aqui como `children`. Esta camada só
 * escuta o que sobe deles e copia para a prévia. É o que permite mostrar o
 * resultado sem transformar a tela inteira num formulário controlado, e é o que
 * mantém a lista funcionando igual com o JavaScript ainda a caminho: sem ele os
 * campos gravam do mesmo jeito, e o que falta é o espelho.
 *
 * O preço passa pelo `lerPreco` do produto, que é quem entende vírgula e ponto.
 * Enquanto o que está digitado ainda não é um preço ("74,"), a prévia segura o
 * último valor bom em vez de piscar: a pessoa está no meio de digitar, e não
 * errando.
 */
export function PreviaDoItem({
  negocio,
  prefixo,
  item,
  chamada,
  children,
}: {
  negocio: Negocio;
  /** O começo do `name` dos campos desta linha: "item-3", ou "novo". */
  prefixo: string;
  item: Item;
  /** A frase acima do recorte. Muda entre a linha da lista e o acrescentar. */
  chamada: string;
  children: ReactNode;
}) {
  const [atual, setAtual] = useState<Item>(item);

  function ler(evento: React.FormEvent<HTMLDivElement>) {
    const alvo = evento.target;
    if (
      !(alvo instanceof HTMLInputElement) &&
      !(alvo instanceof HTMLTextAreaElement)
    ) {
      return;
    }

    if (!alvo.name.startsWith(`${prefixo}-`)) return;
    const campo = alvo.name.slice(prefixo.length + 1);
    const valor = alvo.value;

    setAtual((a) => {
      if (campo === "titulo") return { ...a, titulo: valor };
      if (campo === "descricao") return { ...a, descricao: valor || null };
      if (campo === "ativo" && alvo instanceof HTMLInputElement) {
        return { ...a, ativo: alvo.checked };
      }
      if (campo === "preco") {
        const lido = lerPreco(valor);
        return lido.ok ? { ...a, precoCentavos: lido.centavos } : a;
      }
      return a;
    });
  }

  /*
   * As fotos saem da cópia porque a foto do item ocupa a moldura inteira e o
   * assunto aqui é o texto. O envio de foto de produto tem tela própria pela
   * frente, e quando ela existir esta linha é o lugar de mostrar a foto junto.
   */
  const recorte: Negocio = {
    ...negocio,
    itens: [{ ...atual, fotos: [] }],
  };

  const temNome = atual.titulo.trim() !== "";

  return (
    <div onInput={ler} onChange={ler} className="flex flex-col gap-4">
      {children}

      {temNome && atual.ativo ? (
        <Vitrine chamada={chamada}>
          <Catalogo negocio={recorte} />
        </Vitrine>
      ) : (
        <VitrineAvulsa>
          {temNome
            ? "Guardado com você. A sua página mostra os itens marcados, e este volta para lá quando você marcar de novo."
            : "Escreva o nome e o item aparece aqui, do mesmo jeito que ele sai na sua página."}
        </VitrineAvulsa>
      )}
    </div>
  );
}
