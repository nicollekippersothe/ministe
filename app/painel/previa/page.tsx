import type { Metadata } from "next";
import Link from "next/link";
import { PaginaPublica } from "@/componentes/PaginaPublica";
import { doDono } from "@/lib/dados";
import { urlBase } from "@/lib/site";

/**
 * Pré-visualização do dono.
 *
 * Existe porque a página pública só entrega negócio publicado, então sem isto
 * o dono ficaria no escuro até apertar publicar. É a mesma página, com uma
 * faixa em cima dizendo quem está enxergando aquilo. A faixa fala de quem vê,
 * e não de "rascunho": a página pode estar pronta e apenas guardada, e o que
 * publicar muda é quem consegue abrir o endereço.
 *
 * **Por que esta tela sai da coluna do painel, e por que isso é o conserto de
 * um defeito e não um enfeite.** A rota mora em `app/painel/`, então herda o
 * `app/painel/layout.tsx`: logotipo em cima, coluna de navegação à esquerda, e
 * o conteúdo espremido no que sobra. Medido no navegador, num monitor de
 * 1440 a página pública recebia 648 pixels de largura, e no iPhone 13 recebia
 * 350 dos 390 da tela. E as regras `lg:` da página pública olham a janela, e
 * nunca a caixa em que ela caiu: com 1440 na janela ela montava o desenho de
 * monitor, de duas colunas de 19rem mais o resto, dentro de 648 pixels. O
 * resultado é o que a dona descreveu: catálogo com foto cortada, texto de duas
 * palavras por linha e um vão enorme embaixo da identidade. Quanto mais
 * preenchida a página, pior, que é justamente quando ela é aberta.
 *
 * O conserto tem duas partes, e as duas ficam aqui dentro:
 *
 * 1. `fixed inset-0` tira a prévia da grade do painel e devolve a janela
 *    inteira, que é a medida em que a página pública foi desenhada. Um
 *    `layout.tsx` próprio herdaria o de cima do mesmo jeito, e mudar de rota
 *    trocaria o endereço que o teste de fluxo e o README já nomeiam.
 * 2. A regra de `:has()` abaixo esconde o logotipo e a coluna de navegação
 *    enquanto a prévia está aberta. Ela existe pelo teclado: cobertos, os
 *    links do painel continuariam recebendo foco atrás da prévia. Em navegador
 *    sem `:has()` a prévia continua inteira e por cima, e o que se perde é só
 *    essa ordem de foco.
 */
import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prévia",
  robots: { index: false, follow: false },
};

/**
 * Esconde tudo o que não está no caminho até a prévia.
 *
 * Lê-se: para cada elemento que contém a prévia, some com os filhos dele que
 * nem são a prévia nem levam até ela. Escrito por estrutura, e não por classe,
 * porque o desenho do painel é de outro arquivo e uma classe combinada entre
 * os dois envelheceria calada.
 */
const SEM_PAINEL_ATRAS = `body *:has([data-previa]) > *:not([data-previa], :has([data-previa])) { display: none }`;

export default async function Previa() {
  exigirLogin();
  const negocio = await doDono();

  return (
    <>
      <style>{SEM_PAINEL_ATRAS}</style>

      <div
        data-previa
        className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-fundo"
      >
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 bg-texto px-4 text-sm text-superficie">
          <span className="py-2.5">
            {negocio.publicado
              ? "Prévia da sua página"
              : "Prévia, visível apenas para você"}
          </span>
          {/* Alvo de 44 pixels: é o único caminho de volta desta tela, e a
              prévia é aberta no celular tanto quanto no computador. */}
          <Link
            href="/painel"
            className="-my-1 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
          >
            Voltar ao painel
          </Link>
        </div>

        <PaginaPublica negocio={negocio} urlBase={urlBase} />
      </div>
    </>
  );
}
