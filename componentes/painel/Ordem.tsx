import type { ReactNode } from "react";
import { IconeAvancar, IconeDescer, IconeSubir } from "@/componentes/Icones";

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
}) {
  const quadrado =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-borda bg-fundo text-texto disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-borda px-4 py-3">
      <button
        type="submit"
        formAction={subir.bind(null, indice)}
        disabled={indice === 0}
        aria-label={`Subir ${nome}`}
        className={quadrado}
      >
        <IconeSubir className="h-5 w-5" />
      </button>

      <button
        type="submit"
        formAction={descer.bind(null, indice)}
        disabled={indice === total - 1}
        aria-label={`Descer ${nome}`}
        className={quadrado}
      >
        <IconeDescer className="h-5 w-5" />
      </button>

      <p className="text-xs tabular-nums text-suave">
        {indice + 1} de {total}
      </p>

      <details className="ml-auto">
        <summary className="flex h-11 cursor-pointer list-none items-center rounded-full px-3 text-sm font-medium text-suave">
          Remover
        </summary>
        <button
          type="submit"
          formAction={remover.bind(null, indice)}
          className="mt-1 h-11 rounded-full border border-borda bg-fundo px-4 text-sm font-semibold text-texto"
        >
          Remover este {prefixo}
          <span className="sr-only">, {nome}</span>
        </button>
      </details>
    </div>
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
  subir,
  descer,
  remover,
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
  subir: Alvo;
  descer: Alvo;
  remover: Alvo;
  children: ReactNode;
}) {
  return (
    <fieldset
      id={id}
      className="scroll-mt-4 rounded-2xl border border-borda bg-superficie"
    >
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
            <span className="block truncate font-medium text-texto">{nome}</span>
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
      />
    </fieldset>
  );
}
