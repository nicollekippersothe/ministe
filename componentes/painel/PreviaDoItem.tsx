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
  sobConsulta,
  children,
}: {
  negocio: Negocio;
  /** O começo do `name` dos campos desta linha: "item-3", ou "novo". */
  prefixo: string;
  item: Item;
  /** A frase acima do recorte. Muda entre a linha da lista e o acrescentar. */
  chamada: string;
  /**
   * Qual das duas respostas de preço chega marcada, do jeito que a tela a
   * desenhou. Vem de fora porque a linha da lista e o formulário de acrescentar
   * abrem em respostas diferentes, e a prévia precisa começar na mesma que o
   * rádio mostra: item guardado sem preço abre em "sob consulta", e item novo
   * abre em "preço em reais", que é o caminho de quase todo mundo.
   */
  sobConsulta: boolean;
  children: ReactNode;
}) {
  const [atual, setAtual] = useState<Item>(item);
  const [combinado, setCombinado] = useState(sobConsulta);

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

    /*
     * A resposta de preço é um grupo de rádios, e o evento chega dos dois: o
     * que acabou de ser marcado e o que acabou de ser solto. Só o marcado
     * responde, senão a prévia obedeceria à opção que a pessoa largou.
     */
    if (campo === "preco-modo" && alvo instanceof HTMLInputElement) {
      if (alvo.checked) setCombinado(valor === "consulta");
      return;
    }

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
   * **As fotos vêm da prop, e nunca do estado daqui.** Elas eram descartadas na
   * cópia, e a prévia mostrava o cartão sem a foto que a página já mostrava.
   *
   * Vir da prop é o que mantém a prévia certa depois de o envio gravar: o
   * cartão de imagem termina em `router.refresh()`, o servidor manda a linha
   * nova, e o `useState` daqui continuaria com a lista de fotos do primeiro
   * render. Título, descrição e preço são o contrário disso, porque quem está
   * digitando é a pessoa e o servidor ainda não sabe.
   *
   * A legenda acompanha o nome que está sendo digitado, que é a mesma conta que
   * `linhaDaFoto` de lib/dados.ts faz na hora de gravar. Assim o que o leitor de
   * tela ouve na prévia é o que a página vai dizer.
   */
  const fotos = item.fotos.map((foto) => ({
    ...foto,
    alt: atual.titulo.trim() === "" ? foto.alt : atual.titulo.trim(),
  }));

  const recorte: Negocio = {
    ...negocio,
    /*
     * Preço sob consulta chega na prévia como preço nulo, que é o que ele é no
     * banco e o que a página pública já entende: o item sai com nome e
     * descrição, e o valor fica para a conversa. Assim a pessoa marca a opção e
     * vê na hora o cartão que a página dela vai mostrar.
     */
    itens: [
      {
        ...atual,
        precoCentavos: combinado ? null : atual.precoCentavos,
        fotos,
      },
    ],
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
