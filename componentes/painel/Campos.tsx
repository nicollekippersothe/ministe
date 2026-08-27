import type { ReactNode } from "react";
import { IconeAbrirLista } from "@/componentes/Icones";
import { BotaoDeAcao } from "./BotaoDeAcao";

/**
 * Campos do painel.
 *
 * Todo campo tem label de verdade, ligado pelo id. Nada de placeholder no
 * lugar de rótulo, que some quando a pessoa começa a digitar e deixa quem usa
 * leitor de tela sem saber o que preencher.
 */

const BASE =
  "w-full rounded-xl border border-borda bg-superficie px-3.5 py-3 text-[1rem] text-texto placeholder:text-suave/60";

function Rotulo({
  htmlFor,
  children,
  dica,
}: {
  htmlFor: string;
  children: ReactNode;
  dica?: string;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-texto">
        {children}
      </label>
      {dica ? (
        <p id={`${htmlFor}-dica`} className="mt-0.5 text-xs leading-relaxed text-suave">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

/*
 * O respiro do topo existe por causa do resumo do painel.
 *
 * Cada linha de lá leva ao campo por âncora, e âncora sem margem encosta o
 * campo no topo da janela, atrás do cabeçalho. Vinte e quatro deixa o rótulo à
 * vista junto com o campo, que é o que faz a pessoa reconhecer onde caiu.
 */
export function Texto({
  id,
  rotulo,
  dica,
  valor,
  ...resto
}: {
  id: string;
  rotulo: string;
  dica?: string;
  valor: string | null;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "defaultValue">) {
  return (
    <div className="scroll-mt-24">
      <Rotulo htmlFor={id} dica={dica}>
        {rotulo}
      </Rotulo>
      <input
        id={id}
        name={id}
        defaultValue={valor ?? ""}
        aria-describedby={dica ? `${id}-dica` : undefined}
        className={BASE}
        {...resto}
      />
    </div>
  );
}

export function AreaTexto({
  id,
  rotulo,
  dica,
  valor,
  ...resto
}: {
  id: string;
  rotulo: string;
  dica?: string;
  valor: string | null;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "defaultValue">) {
  return (
    // Num grupo de duas colunas, o texto longo pega a linha inteira: meia
    // largura transforma duas frases em seis linhas e engorda a coluna do lado
    // com espaço vazio. Fora da grade a classe fica sem efeito.
    <div className="lg:col-span-2">
      <Rotulo htmlFor={id} dica={dica}>
        {rotulo}
      </Rotulo>
      <textarea
        id={id}
        name={id}
        defaultValue={valor ?? ""}
        rows={2}
        aria-describedby={dica ? `${id}-dica` : undefined}
        className={`${BASE} resize-y`}
        {...resto}
      />
    </div>
  );
}

export function Escolha({
  id,
  rotulo,
  dica,
  valor,
  opcoes,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  valor: string;
  opcoes: Array<{ valor: string; rotulo: string }>;
}) {
  return (
    <div className="scroll-mt-24">
      <Rotulo htmlFor={id} dica={dica}>
        {rotulo}
      </Rotulo>
      <div className="relative">
      <select
        id={id}
        name={id}
        defaultValue={valor}
        aria-describedby={dica ? `${id}-dica` : undefined}
        /*
         * A altura vem escrita, e é o que põe o select na linha do campo de
         * digitar.
         *
         * Os dois já usavam a mesma classe de base, e mesmo assim saíam com
         * alturas diferentes: medido em 45 pixels contra 50. A diferença é a
         * entrelinha, que o navegador calcula sozinho dentro de um `select` e
         * devolve como `normal`, ignorando a classe de entrelinha que o resto
         * do formulário respeita. 3.125rem são os mesmos 50 pixels que o
         * `px-3.5 py-3` de cima produz num `input`, com a borda contada, e a
         * conta continua valendo se a caixa de base mudar de medida.
         */
        /*
         * `appearance-none` mais a seta desenhada por nós.
         *
         * A seta nativa fica encostada na borda direita, e a folga dela é
         * decisão do navegador: a classe de respiro do campo vale para o texto
         * e passa longe dela. Desenhando a seta, a distância até a borda passa
         * a ser a mesma dos outros campos, e o `pr-11` guarda o lugar dela para
         * um rótulo comprido parar antes em vez de correr por baixo.
         */
        className={`${BASE} h-[3.125rem] appearance-none pr-11`}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      <IconeAbrirLista className="pointer-events-none absolute top-1/2 right-3.5 h-5 w-5 -translate-y-1/2 text-suave" />
      </div>
    </div>
  );
}

export function Marcar({
  id,
  rotulo,
  dica,
  marcado,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  marcado: boolean;
}) {
  /*
   * O cartão inteiro é o alvo, e não só o quadradinho de 20 pixels.
   *
   * Medido em 20 por 20, que é metade do que o dedo precisa. Envolver tudo num
   * `label` resolve sem mudar um pixel do desenho: o toque em qualquer lugar do
   * cartão marca e desmarca, que é o comportamento que a pessoa já espera. O
   * rótulo de dentro vira `span` porque `label` dentro de `label` é inválido, e
   * quem passou a nomear o campo é o `label` de fora.
   */
  return (
    <label
      htmlFor={id}
      /*
       * A altura vem da linha da grade, e é por isso que o `Grupo` deixou de
       * usar `items-start`.
       *
       * Ao lado do "Nome dessa seção na página" este cartão começava 4 pixels
       * acima do rótulo do vizinho e terminava 25 acima do campo dele, porque
       * um cartão de marcar tem o rótulo dentro e um select tem o rótulo em
       * cima. Item de grade estica sozinho até a altura da linha, então as duas
       * caixas passam a começar e a terminar juntas sem nenhuma classe aqui.
       */
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-borda bg-superficie p-3.5"
    >
      <input
        id={id}
        name={id}
        type="checkbox"
        defaultChecked={marcado}
        aria-describedby={dica ? `${id}-dica` : undefined}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--c-destaque)]"
      />
      <div>
        <span className="block text-sm font-medium text-texto">
          {rotulo}
        </span>
        {dica ? (
          <p id={`${id}-dica`} className="mt-0.5 text-xs leading-relaxed text-suave">
            {dica}
          </p>
        ) : null}
      </div>
    </label>
  );
}

/**
 * Uma pergunta com duas ou três respostas à vista, e uma delas marcada.
 *
 * **Existe porque campo em branco é uma resposta ambígua.** No catálogo, preço
 * vazio queria dizer duas coisas ao mesmo tempo: "ainda vou preencher" e "este
 * eu combino na conversa". A dona do produto leu a própria tela e ficou em
 * dúvida sobre o que tinha salvado. Rádio resolve porque a escolha fica escrita:
 * uma das opções está sempre marcada, e a marcada é a resposta.
 *
 * Cartão inteiro como alvo, igual ao `Marcar` logo acima: o círculo tem 20
 * pixels e o dedo pede 44, e envolver tudo num `label` entrega os 44 sem mexer
 * num pixel do desenho. A opção marcada ganha borda e fundo próprios pelo
 * `has-[:checked]`, então a resposta se lê de longe, sem JavaScript nenhum.
 */
export function Opcoes({
  nome,
  rotulo,
  dica,
  valor,
  opcoes,
  className = "",
}: {
  /** O `name` do grupo. Um só para todas as opções, que é o que as junta. */
  nome: string;
  rotulo: string;
  dica?: string;
  /** A opção que chega marcada. */
  valor: string;
  opcoes: Array<{ valor: string; rotulo: string; dica?: string }>;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="text-sm font-medium text-texto">{rotulo}</legend>
      {dica ? (
        <p className="mt-0.5 text-xs leading-relaxed text-suave">{dica}</p>
      ) : null}

      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-borda bg-superficie p-3.5 has-[:checked]:border-texto/35 has-[:checked]:bg-texto/5"
          >
            <input
              type="radio"
              name={nome}
              value={o.valor}
              defaultChecked={o.valor === valor}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--c-destaque)]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-texto">
                {o.rotulo}
              </span>
              {o.dica ? (
                <span className="mt-0.5 block text-xs leading-relaxed text-suave">
                  {o.dica}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Um bloco de campos com título.
 *
 * `duplo` põe os campos lado a lado no computador. Vale para grupo de campo
 * curto, tipo cidade e UF: numa coluna só eles viram uma fita de mil pixels
 * com três letras dentro, e a pessoa rola a tela para preencher o que caberia
 * de uma vez. Onde o campo é longo, ou onde a ordem de leitura é a instrução,
 * o grupo continua em coluna.
 *
 * O legend fica de fora da grade sozinho: pelo HTML ele é a legenda da caixa,
 * e não filho da área de conteúdo, então continua ocupando a linha inteira.
 */
export function Grupo({
  titulo,
  duplo,
  children,
}: {
  titulo: string;
  duplo?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset
      /*
       * A grade fica em `stretch`, que é o padrão dela.
       *
       * Com `items-start` cada caixa da linha ficava na altura do próprio
       * conteúdo, e uma linha com um select de um lado e um cartão de marcar do
       * outro saía com quatro bordas em quatro alturas. Em `stretch` as caixas
       * da mesma linha começam e terminam juntas, e quem tem conteúdo curto
       * simplesmente sobra espaço embaixo, sem mexer no desenho.
       */
      className={`flex flex-col gap-4 ${
        duplo ? "lg:grid lg:grid-cols-2 lg:gap-4" : ""
      }`}
    >
      <legend className="mb-1 text-lg font-semibold tracking-tight text-texto">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Um grupo que começa recolhido, com o que está guardado à mostra na dobra.
 *
 * Existe para o endereço, e a regra de quando ele abre vem de `lib/categorias.ts`,
 * e não desta tela: a receita de cada ramo diz se o endereço na rua costuma
 * fazer sentido. Ver o comentário do campo `endereco` lá, que explica o motivo
 * por extenso: perguntar endereço como se fosse obrigatório faz travar no
 * cadastro quem atende online ou produz em casa.
 *
 * Recolhido não é escondido. O `resumo` mostra na dobra o que já está gravado,
 * então quem tem endereço continua lendo o endereço sem abrir nada, e quem
 * ainda não tem lê o convite para pôr um. E os campos continuam no formulário
 * mesmo com a dobra fechada, que é como o `details` do HTML funciona: o Salvar
 * do rodapé leva os mesmos valores das duas formas.
 *
 * `details` nativo, e não estado no React, por três motivos que valem a escolha:
 * abre sem JavaScript, o teclado já o alcança com Tab e Enter, e o leitor de
 * tela já o anuncia como uma dobra com estado.
 */
export function GrupoRecolhivel({
  titulo,
  resumo,
  aberto,
  duplo,
  children,
}: {
  titulo: string;
  /** O que aparece na dobra fechada: o valor guardado, ou o convite. */
  resumo: string;
  aberto: boolean;
  duplo?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={aberto}
      className="group rounded-xl border border-borda bg-superficie/40 px-4 open:pb-4"
    >
      <summary className="-mx-4 flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold tracking-tight text-texto">
            {titulo}
          </span>
          <span className="mt-0.5 block truncate text-xs leading-relaxed text-suave">
            {resumo}
          </span>
        </span>
        {/*
          Seta desenhada, e nunca emoji, que é a regra de layout do projeto. Ela
          gira meia volta quando a dobra abre, e é a única coisa na tela que diz
          se ela está aberta ou fechada para quem enxerga.
        */}
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-suave transition-transform duration-150 group-open:rotate-180"
        >
          <path
            d="M5 8l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <div
        className={`flex flex-col gap-4 ${
          duplo ? "lg:grid lg:grid-cols-2 lg:gap-4" : ""
        }`}
      >
        {children}
      </div>
    </details>
  );
}

/**
 * O Salvar do rodapé.
 *
 * No celular ele fica preso na base da tela, porque o formulário tem sempre
 * mais campos do que cabe e o botão precisa estar a um toque. No computador o
 * formulário inteiro cabe de uma vez, e aí a barra presa vira uma tarja parada
 * no meio da tela: ela volta a ser o fim do formulário, na largura do botão.
 */
export function BarraSalvar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky inset-x-0 bottom-0 -mx-5 mt-2 border-t border-borda bg-fundo/95 px-5 pt-3 backdrop-blur-sm lg:static lg:col-span-2 lg:mx-0 lg:px-0"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="lg:max-w-56">{children}</div>
    </div>
  );
}

export function Botao({
  children,
  tom = "forte",
  ...resto
}: {
  children: ReactNode;
  tom?: "forte" | "leve";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cor =
    tom === "forte"
      ? "bg-texto text-superficie"
      : "border border-borda bg-superficie text-texto";
  // Passa por BotaoDeAcao para o toque ter resposta na hora: afunda no dedo,
  // gira enquanto o servidor responde e desliga os irmãos do mesmo formulário.
  return (
    <BotaoDeAcao
      className={`flex h-12 w-full items-center justify-center rounded-full px-5 font-semibold ${cor}`}
      {...resto}
    >
      {children}
    </BotaoDeAcao>
  );
}
