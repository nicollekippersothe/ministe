"use client";

import { useEffect, useState } from "react";
import { IconeAvancar } from "@/componentes/Icones";

/**
 * O celular da abertura passando por vários negócios.
 *
 * Um exemplo só responde "que bonito". Vários respondem "é para mim", que é a
 * pergunta dos dois primeiros segundos.
 *
 * Desliza, não desaparece. A primeira versão trocava por opacidade, e no meio
 * da troca os dois aparelhos ficavam meio transparentes ao mesmo tempo: dava
 * para ver um através do outro e o conjunto lia como imagem borrada. Empilhar
 * duas superfícies opacas e cruzar a opacidade delas nunca fica limpo, porque
 * o fundo da página aparece no meio. Deslizando, cada aparelho está sempre
 * inteiro ou fora de vista.
 *
 * Os aparelhos são montados no servidor e chegam aqui como children, então o
 * JavaScript que desce é só o controle: índice, temporizador e botão.
 */
export function Carrossel({ children }: { children: React.ReactNode }) {
  const quadros = Array.isArray(children) ? children : [children];
  const total = quadros.length;
  const [atual, setAtual] = useState(0);
  const [parado, setParado] = useState(false);

  /*
   * Seis segundos por negócio, e o relógio reinicia a cada troca. Quem apertou
   * a seta ganha os seis segundos inteiros para olhar, em vez do resto do
   * tempo que sobrou do anterior.
   *
   * Não anda para quem pediu menos movimento no sistema, nem enquanto o
   * ponteiro está em cima: ali a pessoa está olhando de propósito.
   */
  useEffect(() => {
    if (total < 2 || parado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const relogio = setTimeout(() => setAtual((i) => (i + 1) % total), 6000);
    return () => clearTimeout(relogio);
  }, [atual, total, parado]);

  return (
    /*
     * A largura é exatamente a do aparelho, e não a da coluna. Duas coisas
     * dependem disso: a seta encosta na borda do aparelho em vez de flutuar
     * no vazio ao lado, e o corte do trilho cai no mesmo lugar da borda, então
     * o aparelho seguinte não espia pela direita.
     */
    <div
      className="relative mx-auto w-full max-w-[19rem]"
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
    >
      {/*
        Respiro só em cima e embaixo, porque a sombra do aparelho desce 34px e
        se espalha uns 6px para os lados. Respiro lateral aqui dentro viraria
        janela para o próximo aparelho aparecer. O botão fica FORA deste div,
        senão o overflow corta a metade dele que passa da borda.
      */}
      <div className="overflow-hidden py-8">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${atual * 100}%)` }}
        >
          {quadros.map((quadro, i) => (
            <div
              key={i}
              className={`w-full shrink-0 ${i === atual ? "rolando" : ""}`}
              /*
               * O que está fora de vista sai da árvore de acessibilidade e do
               * caminho do teclado. Os aparelhos já são decorativos, mas
               * inert evita que o leitor de tela anuncie quatro páginas
               * sobrepostas como se fossem conteúdo.
               */
              inert={i === atual ? undefined : true}
            >
              {quadro}
            </div>
          ))}
        </div>
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={() => setAtual((i) => (i + 1) % total)}
            aria-label="Ver o próximo exemplo"
            /*
             * Montado na borda do aparelho, metade dentro e metade fora. É a
             * posição que diz "isto avança aquilo ali", em vez de parecer um
             * botão qualquer perdido ao lado.
             */
            className="absolute top-1/2 right-0 z-10 flex h-12 w-12 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-borda bg-superficie text-texto shadow-[0_1px_2px_rgba(28,25,23,0.12),0_10px_24px_-10px_rgba(28,25,23,0.45)] transition-colors hover:border-texto/30 hover:bg-fundo"
          >
            <IconeAvancar className="h-5 w-5" />
          </button>

          {/* Onde estou e quantos faltam, sem precisar esperar para descobrir. */}
          <div className="-mt-2 flex justify-center gap-2">
            {quadros.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ver o exemplo ${i + 1} de ${total}`}
                aria-current={i === atual}
                className={`h-1.5 rounded-full transition-all ${
                  i === atual ? "w-5 bg-texto" : "w-1.5 bg-texto/25"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
