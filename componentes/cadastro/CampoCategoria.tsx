"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CATEGORIAS,
  GRUPOS,
  procurar,
  receitaDe,
  type Categoria,
  type Receita,
} from "@/lib/categorias";
import { Pergunta } from "./Pergunta";

/**
 * Valor enviado quando a pessoa escreve o ramo dela em vez de escolher um da
 * lista. O servidor traduz para categoria nula mais texto livre, que é como o
 * banco guarda. Fica aqui, e não solto no formulário, para os dois lados
 * combinarem pelo mesmo nome.
 */
export const OUTRO = "outro";

/** A partir de quantas letras a busca vale a pena. Espelha lib/categorias. */
const MINIMO_BUSCA = 2;

/**
 * O que a escolha muda na página, em uma linha.
 *
 * A categoria parece papelada de cadastro, e ler o efeito dela na hora muda
 * isso: a pessoa vê que escolher "Fotografia" já põe a galeria na frente e
 * guarda o preço para a conversa. Vale mais que qualquer texto de ajuda, e é
 * por isso que esta linha ficou no lugar da dica que explicava para que serve
 * escolher um ramo.
 */
function resumo(receita: Receita): string {
  const precos = receita.mostrarPrecos
    ? "preço à vista"
    : "preço combinado na conversa";
  const ordem = receita.galeriaPrimeiro ? ", fotos na frente" : "";
  return `Começa com ${receita.tituloCatalogo}${ordem} e ${precos}.`;
}

function Opcao({
  id,
  valor,
  rotulo,
  detalhe,
  marcada,
  exigir,
  aoEscolher,
}: {
  id: string;
  valor: string;
  rotulo: string;
  detalhe?: string;
  marcada: boolean;
  exigir: boolean;
  aoEscolher: (valor: string) => void;
}) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
        marcada ? "border-texto bg-texto/6" : "border-transparent bg-superficie"
      }`}
    >
      {/*
        O rádio fica visível de propósito. Escondido, o contorno de foco do
        globals.css cairia num elemento de zero pixel e quem navega pelo teclado
        perderia o rastro de onde está.
      */}
      <input
        id={id}
        type="radio"
        name="categoria"
        value={valor}
        checked={marcada}
        required={exigir}
        onChange={() => aoEscolher(valor)}
        className="h-5 w-5 shrink-0 accent-[var(--c-destaque)]"
      />
      <span className="min-w-0">
        <span className="block text-[1rem] leading-snug text-texto">
          {rotulo}
        </span>
        {detalhe ? (
          <span className="block text-xs text-suave">{detalhe}</span>
        ) : null}
      </span>
    </label>
  );
}

/** Lupa desenhada, para o campo de busca se anunciar como busca. */
function Lupa() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-suave"
    >
      <circle
        cx="8.5"
        cy="8.5"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12.8 12.8 17 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * O seletor de ramo do cadastro.
 *
 * Trinta e cinco opções cabem numa lista rolável, e a busca existe porque
 * ninguém procura pelo nome que nós demos: quem dá aula de inglês digita
 * "inglês", quem faz bolo digita "bolo". A lista responde por como a pessoa
 * fala, e o casamento com a categoria certa é trabalho de lib/categorias.ts.
 *
 * Funciona sem JavaScript: os rádios têm name e value próprios, então o
 * formulário envia a escolha do mesmo jeito. A busca é conforto por cima.
 *
 * Três decisões de tamanho, todas medidas no iPhone 13 (390x664):
 *
 * - A lista e a linha "Outro" moram na mesma caixa com borda. Em caixas
 *   separadas, a costura entre as duas parecia bloco desalinhado.
 * - A altura vai a 21rem no celular (era 26rem, 63% da tela) e volta a 26rem
 *   no computador, onde a altura sobra.
 * - O nome do grupo gruda no topo enquanto a lista rola, senão a pessoa perde
 *   de vista se está em Saúde ou em Comida no meio de trinta e cinco linhas.
 */
export function CampoCategoria({
  inicial = "",
  livreInicial = "",
  aoMudar,
  aoMudarLivre,
}: {
  inicial?: string;
  livreInicial?: string;
  /** O valor marcado: um id da lista, ou OUTRO. Vazio enquanto ninguém marcou. */
  aoMudar?: (escolha: string) => void;
  /** O ramo escrito à mão, para quem marcou Outro. */
  aoMudarLivre?: (livre: string) => void;
}) {
  const id = useId();
  const [termo, setTermo] = useState("");
  const [selecionada, setSelecionada] = useState(inicial);
  const [livre, setLivre] = useState(livreInicial);

  const filtrando = termo.trim().length >= MINIMO_BUSCA;
  const achados = useMemo(
    () => (filtrando ? procurar(termo) : CATEGORIAS),
    [termo, filtrando],
  );

  /*
   * A escolha some da tela quando a busca deixa de casar com ela. O rádio
   * desmontado leva o valor junto, então entra um campo oculto no lugar. Nesse
   * caso o required sai dos rádios: o navegador exigiria uma marcação num
   * grupo que a pessoa já respondeu, e apontaria para um campo fora da tela.
   */
  const escolhaVisivel =
    selecionada === "" ||
    selecionada === OUTRO ||
    achados.some((c) => c.id === selecionada);

  const receita = selecionada === "" ? null : receitaDe(selecionada);

  const grupos: Array<[string, Categoria[]]> = filtrando
    ? []
    : GRUPOS.map((g) => [g, CATEGORIAS.filter((c) => c.grupo === g)]);

  /** Sete linhas já passam da altura da caixa, no celular e no computador. */
  const podeRolar = filtrando === false || achados.length > 7;

  /*
   * Quando o formulário volta com o ramo já marcado, a lista abre no topo e a
   * marcação fica escondida trinta linhas abaixo: a pessoa vê um formulário que
   * parece vazio e responde tudo de novo. Aqui a caixa abre já na linha dela.
   *
   * Mexe no scrollTop da caixa, e nunca em scrollIntoView, que arrastaria a
   * página inteira junto e jogaria o título para fora da tela.
   */
  const rolador = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (inicial === "" || inicial === OUTRO) return;
    const caixa = rolador.current;
    const alvo = caixa
      ?.querySelector(`input[value="${inicial}"]`)
      ?.closest("label");
    if (!caixa || !alvo) return;
    const daBorda =
      alvo.getBoundingClientRect().top - caixa.getBoundingClientRect().top;
    caixa.scrollTop +=
      daBorda - caixa.clientHeight / 2 + alvo.getBoundingClientRect().height / 2;
    // Só na montagem: depois disso quem manda na rolagem é a pessoa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escolher = (valor: string) => {
    setSelecionada(valor);
    aoMudar?.(valor);
  };

  return (
    <fieldset>
      <legend>
        <Pergunta numero={1}>O que você faz?</Pergunta>
      </legend>

      <label htmlFor={`${id}-busca`} className="sr-only">
        Procure pelo seu ramo
      </label>
      <div className="relative mt-4">
        <Lupa />
        <input
          id={`${id}-busca`}
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          /*
           * Enter num campo solto dentro de um formulário com botão de enviar
           * manda o formulário. No celular a tecla do teclado vira "ir", e
           * quem procurava um ramo enviava o cadastro pela metade. Aqui o
           * Enter fecha o teclado e deixa a lista já filtrada na tela.
           */
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="tatuagem, unha, inglês, bolo"
          aria-describedby={`${id}-quantos`}
          className="w-full rounded-2xl border border-borda bg-superficie py-3 pr-4 pl-11 text-[1rem] text-texto placeholder:text-suave/70"
        />
      </div>

      <p id={`${id}-quantos`} aria-live="polite" className="sr-only">
        {filtrando
          ? `${achados.length} ${achados.length === 1 ? "opção" : "opções"}`
          : ""}
      </p>

      <div className="mt-2 rounded-2xl border border-borda bg-superficie">
        <div className="relative">
          <div
            ref={rolador}
            className="max-h-[21rem] overflow-y-auto overscroll-contain px-1.5 pb-1.5 lg:max-h-[26rem]"
          >
            {filtrando ? (
              <div className="flex flex-col gap-0.5 pt-1.5">
                {achados.map((c) => (
                  <Opcao
                    key={c.id}
                    id={`${id}-${c.id}`}
                    valor={c.id}
                    rotulo={c.nome}
                    detalhe={c.grupo}
                    marcada={selecionada === c.id}
                    exigir={escolhaVisivel}
                    aoEscolher={escolher}
                  />
                ))}
              </div>
            ) : (
              grupos.map(([grupo, lista]) => (
                <div key={grupo}>
                  <p className="sticky top-0 z-10 -mx-1.5 bg-superficie px-5 pt-3 pb-1.5 text-xs font-semibold tracking-wide text-suave uppercase">
                    {grupo}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {lista.map((c) => (
                      <Opcao
                        key={c.id}
                        id={`${id}-${c.id}`}
                        valor={c.id}
                        rotulo={c.nome}
                        marcada={selecionada === c.id}
                        exigir={escolhaVisivel}
                        aoEscolher={escolher}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {filtrando && achados.length === 0 ? (
              <p className="px-3.5 py-4 text-sm leading-relaxed text-suave">
                Escolha Outro e escreva com as suas palavras.
              </p>
            ) : null}
          </div>

          {/*
            A última linha aparece cortada ao meio, que é o que diz que a lista
            rola. Cortada seca ela parecia defeito de desenho, e o esmaecido
            resolve os dois: continua dizendo que tem mais, e parece de
            propósito. Só entra quando a lista passa da altura da caixa.
          */}
          {podeRolar ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-superficie to-transparent"
            />
          ) : null}
        </div>

        {/* "Outro" mora na mesma caixa da lista, embaixo de uma linha. */}
        <div className="border-t border-borda p-1.5">
          <Opcao
            id={`${id}-${OUTRO}`}
            valor={OUTRO}
            rotulo="Outro"
            detalhe="Escreva com as suas palavras"
            marcada={selecionada === OUTRO}
            exigir={escolhaVisivel}
            aoEscolher={escolher}
          />
        </div>
      </div>

      {!escolhaVisivel ? (
        <input type="hidden" name="categoria" value={selecionada} />
      ) : null}

      {selecionada === OUTRO ? (
        <div className="mt-3">
          <label
            htmlFor={`${id}-livre`}
            className="text-[0.95rem] font-medium text-texto"
          >
            O seu ramo
          </label>
          <input
            id={`${id}-livre`}
            name="categoria_livre"
            value={livre}
            onChange={(e) => {
              setLivre(e.target.value);
              aoMudarLivre?.(e.target.value);
            }}
            required
            minLength={2}
            maxLength={40}
            placeholder="apicultura"
            className="mt-2 w-full rounded-2xl border border-borda bg-superficie px-4 py-3 text-[1rem] text-texto placeholder:text-suave/70"
          />
        </div>
      ) : null}

      {/*
        Fica montado sempre, mesmo vazio, senão o leitor de tela perde o
        anúncio: região viva que nasce junto com o texto costuma passar batido.
        Vazio ele não reserva altura, e o espaço entre o ramo e o campo de nome
        fica do mesmo tamanho do espaço entre os outros campos.
      */}
      <p
        aria-live="polite"
        className={`text-sm text-suave ${receita ? "mt-2.5" : ""}`}
      >
        {receita ? resumo(receita) : ""}
      </p>
    </fieldset>
  );
}
