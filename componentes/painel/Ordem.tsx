import type { ReactNode } from "react";
import { IconeAvancar, IconeDescer, IconeSubir } from "@/componentes/Icones";
import { BotaoDeAcao } from "./BotaoDeAcao";

/** Uma ação de lista, que recebe o número da linha por `bind`. */
type Alvo = (alvo: number, formData: FormData) => void;

/**
 * Subir, descer e remover: o rodapé de uma linha de lista do painel.
 *
 * **Reordenar sem arrastar, e é decisão de produto.** Arrastar com o dedo é a
 * primeira ideia e a pior: exige JavaScript, briga com a rolagem da página no
 * celular (que é onde o painel é usado) e some inteiro para quem navega por
 * teclado ou por leitor de tela. Dois botões fazem o mesmo em HTML puro,
 * funcionam no toque, no clique e no teclado, e já nascem com nome próprio.
 *
 * Os três botões enviam o formulário da tela inteira, cada um com a ação dele.
 * Assim o que a pessoa acabou de digitar viaja junto e continua na tela depois,
 * em vez de ser trocado pelo que já estava gravado.
 *
 * O número da linha vai por `bind`, e nunca por `name` e `value` no botão. O
 * React usa justamente o `name` de um botão com `formAction` de função para
 * codificar qual ação chamar, e sobrescreve o que estiver ali: o formulário
 * chegava no servidor sem o alvo, e subir e descer viravam um salvar mudo.
 *
 * Remover pede dois toques, pelo `details`: o primeiro abre a confirmação e o
 * segundo apaga. É a única operação da tela que pede para a pessoa escrever
 * tudo de novo se ela errar o alvo, e no celular o dedo erra o alvo.
 */
function Botoes({
  indice,
  total,
  nome,
  prefixo,
  subir,
  descer,
  remover,
  salvar,
}: {
  indice: number;
  total: number;
  /** O que a pessoa escreveu nesta linha. Vira o nome de cada botão. */
  nome: string;
  /** "item" ou "link", para o texto do botão falar do que se trata. */
  prefixo: string;
  subir: Alvo;
  descer: Alvo;
  remover: Alvo;
  /** O Salvar desta linha, já amarrado a ela. Ver o comentário do `Cartao`. */
  salvar?: (formData: FormData) => void;
}) {
  const quadrado =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-borda bg-fundo text-texto disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-borda px-4 py-3">
      <BotaoDeAcao
        type="submit"
        formAction={subir.bind(null, indice)}
        disabled={indice === 0}
        aria-label={`Subir ${nome}`}
        className={quadrado}
      >
        <IconeSubir className="h-5 w-5" />
      </BotaoDeAcao>

      <BotaoDeAcao
        type="submit"
        formAction={descer.bind(null, indice)}
        disabled={indice === total - 1}
        aria-label={`Descer ${nome}`}
        className={quadrado}
      >
        <IconeDescer className="h-5 w-5" />
      </BotaoDeAcao>

      <p className="text-xs tabular-nums text-suave">
        {indice + 1} de {total}
      </p>

      <div className="ml-auto flex items-center gap-1">
        {salvar ? (
          /*
            **O Salvar da própria linha, e ele mora aqui de propósito.**

            A dona do produto salvou um item pelo botão do rodapé da tela e
            contou que ele "ficou em cima, sem dar a entender que é sobre esse
            item". No monitor a barra de Salvar deixa de ser presa e vira o fim
            do formulário: medido em 1440, o único Salvar da tela nascia a 1640
            pixels do topo, depois de seis cartões e do bloco de acrescentar.
            Quem estava escrevendo o item 2 lia um botão longe de tudo que ele
            tinha acabado de escrever.

            Fica fora da dobra, e não dentro dela, porque a linha fechada
            também é uma linha editável: subir, descer e remover já valem com o
            cartão fechado, e o Salvar é da mesma família. E é o que mantém uma
            resposta só para o dedo em qualquer estado do cartão.

            Ele grava a lista inteira, igual ao do rodapé, porque é o mesmo
            formulário: o que muda é o endereço de volta, que reabre esta linha
            com a confirmação dentro dela.
          */
          <BotaoDeAcao
            type="submit"
            formAction={salvar}
            className="flex h-11 items-center rounded-full border border-texto/25 bg-fundo px-4 text-sm font-semibold text-texto"
          >
            Salvar
            <span className="sr-only">
              {" "}
              este {prefixo}, {nome}
            </span>
          </BotaoDeAcao>
        ) : null}

        <details>
          <summary className="flex h-11 cursor-pointer list-none items-center rounded-full px-3 text-sm font-medium text-suave">
            Remover
          </summary>
          <BotaoDeAcao
            type="submit"
            formAction={remover.bind(null, indice)}
            className="mt-1 h-11 rounded-full border border-borda bg-fundo px-4 text-sm font-semibold text-texto"
          >
            Remover este {prefixo}
            <span className="sr-only">, {nome}</span>
          </BotaoDeAcao>
        </details>
      </div>
    </div>
  );
}

/**
 * A cor que confirma o acrescentar e sai sozinha.
 *
 * Mora aqui, e não em app/globals.css, porque é o único lugar que a usa: a
 * folha global é lida por toda página pública, e uma animação que só o painel
 * enxerga não tem por que viajar junto. O React 19 leva a tag para o topo do
 * documento e junta as repetições pelo `href`, então vinte linhas na tela
 * continuam com uma regra só.
 *
 * O `prefers-reduced-motion` de app/globals.css já derruba a duração para quase
 * zero, e aí a linha nova nasce direto no estado final, com o selo de pé.
 */
function Pulso() {
  return (
    <style href="painel-nasceu" precedence="default">{`
      @keyframes nasceu {
        from {
          background-color: var(--c-aberto-fundo);
          border-color: var(--c-aberto-texto);
        }
        to {
          background-color: var(--c-superficie);
          border-color: var(--c-borda);
        }
      }
      .nasceu { animation: nasceu 2.6s ease-out; }
    `}</style>
  );
}

/**
 * Uma linha da lista, fechada, com os campos dela dentro.
 *
 * Fechada é o que faz a lista caber no celular e o que faz a ordem existir: com
 * vinte itens abertos, a tela vira oito mil pixels de formulário e ninguém
 * consegue comparar a posição de dois itens, que é justamente o que se olha na
 * hora de reordenar. Fechada, cada item é uma linha com o número, o nome e o
 * preço, e a lista inteira se lê de uma vez.
 *
 * O `details` fechado continua enviando os campos de dentro, então salvar,
 * mover e remover valem para a lista toda, aberta ou fechada.
 *
 * **`novo` é o retorno de quem acabou de acrescentar.** A lista é longa, a linha
 * nova nasce no fim dela e a tela recarrega inteira: sem marca nenhuma, a
 * pessoa volta para uma lista parecida com a de antes e conclui que o toque se
 * perdeu. Então a linha recém-criada chega aberta, com o selo ao lado do número
 * e com dois segundos e meio de fundo na cor de confirmação, que é a mesma do
 * recado de sucesso. A cor sai sozinha; o selo fica até a próxima gravação, que
 * é o tempo em que ela ainda é "a que eu acabei de fazer".
 */
export function Cartao({
  id,
  numero,
  total,
  nome,
  detalhe,
  selo,
  prefixo,
  aberto,
  novo,
  subir,
  descer,
  remover,
  salvar,
  children,
}: {
  id: string;
  numero: number;
  total: number;
  nome: string;
  detalhe?: string | null;
  selo?: string | null;
  prefixo: string;
  aberto?: boolean;
  /** Linha recém-acrescentada: ganha o selo e a cor que somem sozinhas. */
  novo?: boolean;
  subir: Alvo;
  descer: Alvo;
  remover: Alvo;
  /**
   * O Salvar desta linha, quando a tela oferece um. Chega pronto, amarrado ao
   * id da linha por quem sabe qual ela é, e some quando a tela deixa de mandar:
   * a lista de links extras continua com um Salvar só, no rodapé, porque ali
   * são duas colunas por linha e o formulário inteiro cabe numa tela.
   */
  salvar?: (formData: FormData) => void;
  children: ReactNode;
}) {
  return (
    <fieldset
      id={id}
      className={`scroll-mt-20 rounded-2xl border bg-superficie lg:scroll-mt-8 ${
        novo ? "nasceu border-aberto-texto" : "border-borda"
      }`}
    >
      {novo ? <Pulso /> : null}
      {/* O leitor de tela anuncia "Item 3, Bolo de chocolate" ao entrar no
          grupo, que é o que dá contexto aos campos e aos botões de dentro. */}
      <legend className="sr-only">
        {prefixo.charAt(0).toUpperCase() + prefixo.slice(1)} {numero}: {nome}
      </legend>

      <details open={aberto} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-texto/8 px-1.5 text-xs font-semibold tabular-nums text-texto">
            {numero}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate font-medium text-texto">{nome}</span>
              {novo ? (
                <span className="shrink-0 rounded-full bg-aberto-fundo px-2 py-0.5 text-[0.7rem] font-semibold text-aberto-texto">
                  Novo
                </span>
              ) : null}
            </span>
            {detalhe || selo ? (
              <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-suave">
                {detalhe ? <span className="tabular-nums">{detalhe}</span> : null}
                {selo ? (
                  <span className="rounded-full bg-fechado-fundo px-2 py-0.5 font-medium text-fechado-texto">
                    {selo}
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>

          <IconeAvancar className="h-4 w-4 shrink-0 text-suave transition-transform group-open:rotate-90" />
          <span className="sr-only">Abrir para editar</span>
        </summary>

        <div className="flex flex-col gap-4 px-4 pb-4">{children}</div>
      </details>

      <Botoes
        indice={numero - 1}
        total={total}
        nome={nome}
        prefixo={prefixo}
        subir={subir}
        descer={descer}
        remover={remover}
        salvar={salvar}
      />
    </fieldset>
  );
}
