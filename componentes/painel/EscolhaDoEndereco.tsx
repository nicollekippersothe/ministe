"use client";

import { useState, type ReactNode } from "react";

/**
 * A pergunta do endereço, com as duas respostas à vista.
 *
 * ## O que estava acontecendo
 *
 * O endereço morava numa dobra fechada, com o título "Endereço" e uma linha
 * cinza embaixo. A dona da página olhou e disse: "o endereço não aparece algo
 * opcional pra marcar, tipo deseja informar endereço". Ela leu a dobra como um
 * campo que ela tinha deixado para trás, e a dobra estava fechada justamente
 * porque a receita do ramo dela diz que endereço na rua costuma ficar de fora.
 * A tela sabia a resposta e guardou a informação para si.
 *
 * Uma dobra diz "tem mais coisa aqui". Ela nunca diz "pular é uma resposta".
 * Então o desenho passou a ser a pergunta com as duas respostas lado a lado, e
 * uma delas já vem marcada: a que a receita do ramo indica, ou "sim" para quem
 * já tem endereço gravado. A pessoa lê uma escolha feita, e trocar é um toque.
 *
 * ## Por que os campos continuam montados
 *
 * Marcar "deixar de fora" apaga o endereço na hora do Salvar, e é `salvarBasico`
 * quem faz isso, lendo o `enderecoNaPagina` que sai daqui. Enquanto o Salvar
 * não acontece, o que já foi digitado fica onde está: os campos saem de cena
 * por `hidden`, e não por desmontagem, então voltar para "sim" devolve tudo o
 * que a pessoa tinha escrito.
 *
 * O `fieldset` desligado é o que evita a armadilha do meio do caminho: campo
 * escondido com conteúdo recusado pelo `pattern` faz o navegador barrar o envio
 * apontando para um campo que ninguém consegue ver, e o Salvar passa a não
 * fazer nada sem dizer por quê. Campo desligado sai da conferência e sai do
 * envio, e continua guardando o que tem dentro.
 */

const OPCOES = [
  {
    valor: "sim",
    rotulo: "Quero o endereço na minha página",
    dica: "Rua, cidade e link do mapa aparecem para quem abrir a sua página.",
  },
  {
    valor: "nao",
    rotulo: "Prefiro deixar o endereço de fora",
    dica: "A página segue com o resto inteiro. Serve para quem atende online, vai até o cliente ou trabalha de casa.",
  },
] as const;

function Marca({ escolhida }: { escolhida: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        escolhida ? "border-destaque" : "border-borda"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full bg-destaque transition-transform duration-150 ${
          escolhida ? "scale-100" : "scale-0"
        }`}
      />
    </span>
  );
}

export function EscolhaDoEndereco({
  inicial,
  children,
}: {
  /** A resposta que a tela já traz marcada. */
  inicial: "sim" | "nao";
  children: ReactNode;
}) {
  const [resposta, setResposta] = useState<"sim" | "nao">(inicial);
  const mostrar = resposta === "sim";

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-lg font-semibold tracking-tight text-texto">
        Endereço
      </legend>

      <p className="-mt-2 text-sm leading-relaxed text-suave">
        Quer que a sua página mostre onde você atende?
      </p>

      {/*
        Duas respostas na mesma linha no computador, empilhadas no celular. Elas
        têm o mesmo peso de propósito: uma pergunta com uma saída em letra
        miúda continua parecendo um campo por preencher.
      */}
      <div className="grid gap-3 sm:grid-cols-2">
        {OPCOES.map((o) => {
          const escolhida = resposta === o.valor;
          return (
            <label
              key={o.valor}
              /*
                O rádio de verdade fica só para o leitor de tela e para o
                teclado, e quem desenha o estado é a marca ao lado. O contorno
                de foco vem do `has-[:focus-visible]`, que põe no cartão inteiro
                o anel que o rádio escondido levaria: foco visível é regra do
                projeto, e um rádio em `sr-only` some com ele sem isto.
              */
              className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-superficie p-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-destaque ${
                escolhida ? "border-destaque" : "border-borda"
              }`}
            >
              <input
                type="radio"
                name="enderecoNaPagina"
                value={o.valor}
                checked={escolhida}
                onChange={() => setResposta(o.valor)}
                className="sr-only"
              />
              <Marca escolhida={escolhida} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-texto">
                  {o.rotulo}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-suave">
                  {o.dica}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {/*
        A classe é que tira do desenho, e nunca o atributo `hidden`: `display`
        vindo de uma classe ganha do `display: none` que o atributo carrega, e o
        bloco continuaria à mostra. Quem tira da conferência e do envio é o
        `disabled`, que vale para os campos de dentro de uma vez.
      */}
      <fieldset
        disabled={!mostrar}
        className={
          mostrar ? "flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-4" : "hidden"
        }
      >
        {children}
      </fieldset>
    </fieldset>
  );
}
