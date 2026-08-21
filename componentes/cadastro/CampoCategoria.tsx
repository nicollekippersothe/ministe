"use client";

import { useId, useMemo, useState } from "react";
import {
  CATEGORIAS,
  GRUPOS,
  procurar,
  receitaDe,
  type Categoria,
  type Receita,
} from "@/lib/categorias";

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
 * guarda o preço para a conversa. Vale mais que qualquer texto de ajuda.
 */
function resumo(receita: Receita): string {
  const precos = receita.mostrarPrecos
    ? "preço à vista"
    : "preço combinado na conversa";
  const ordem = receita.galeriaPrimeiro ? ", e a galeria vem na frente" : "";
  return `Começa com ${receita.tituloCatalogo}, ${precos}${ordem}.`;
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
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 ${
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
 */
export function CampoCategoria({
  inicial = "",
  aoMudar,
}: {
  inicial?: string;
  /** O id escolhido, ou nulo em "outro" e enquanto ninguém escolheu. */
  aoMudar?: (categoria: string | null) => void;
}) {
  const id = useId();
  const [termo, setTermo] = useState("");
  const [selecionada, setSelecionada] = useState(inicial);
  const [livre, setLivre] = useState("");

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

  const escolher = (valor: string) => {
    setSelecionada(valor);
    aoMudar?.(valor === OUTRO ? null : valor);
  };

  return (
    <fieldset>
      <legend className="text-[0.95rem] font-medium text-texto">
        Escolha o seu ramo
      </legend>
      <p id={`${id}-dica`} className="mt-1 text-sm leading-relaxed text-suave">
        A escolha monta a sua página e ajuda o buscador a mostrar você para quem
        procura pelo seu ramo. Dá para trocar depois.
      </p>

      <label htmlFor={`${id}-busca`} className="sr-only">
        Procure pelo seu ramo
      </label>
      <input
        id={`${id}-busca`}
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="terapia, unha, inglês, foto"
        aria-describedby={`${id}-quantos`}
        className="mt-3 w-full rounded-2xl border border-borda bg-superficie px-4 py-3 text-[1rem] text-texto placeholder:text-suave/70"
      />

      <p id={`${id}-quantos`} aria-live="polite" className="sr-only">
        {filtrando
          ? `${achados.length} ${achados.length === 1 ? "opção" : "opções"}`
          : ""}
      </p>

      <div className="mt-3 max-h-[26rem] overflow-y-auto overscroll-contain rounded-2xl border border-borda bg-superficie p-1.5">
        {filtrando ? (
          <div className="flex flex-col gap-0.5">
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
            <div key={grupo} className="mb-1 last:mb-0">
              <p className="px-3.5 pt-3 pb-1.5 text-xs font-semibold tracking-wide text-suave uppercase">
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
            Escolha Outro logo abaixo e escreva o seu ramo com as suas palavras.
          </p>
        ) : null}
      </div>

      <div className="mt-2">
        <Opcao
          id={`${id}-${OUTRO}`}
          valor={OUTRO}
          rotulo="Outro"
          detalhe="Escreva o seu ramo com as suas palavras"
          marcada={selecionada === OUTRO}
          exigir={escolhaVisivel}
          aoEscolher={escolher}
        />
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
            onChange={(e) => setLivre(e.target.value)}
            required
            minLength={2}
            maxLength={40}
            placeholder="apicultura"
            className="mt-2 w-full rounded-2xl border border-borda bg-superficie px-4 py-3 text-[1rem] text-texto placeholder:text-suave/70"
          />
        </div>
      ) : null}

      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-suave">
        {receita ? resumo(receita) : ""}
      </p>
    </fieldset>
  );
}
