"use client";

import { categoriaPorId, receitaDe } from "@/lib/categorias";
import { DOMINIO_PUBLICO } from "@/lib/marca";

/**
 * A página nascendo, ao lado do formulário.
 *
 * Mostra o que a categoria monta, e não uma página de mentira. Ao escolher
 * Fotografia, o nome da seção vira Ensaios e a galeria sobe para antes do
 * catálogo; ao escolher Confeitaria, vira Cardápio e o preço aparece. É a
 * mesma receita que vai montar a página de verdade, lida do mesmo lugar.
 *
 * Encher de bolo e preço faria esta tela vender melhor e mentiria sobre o que a
 * pessoa recebe, que é uma página vazia esperando ela preencher. Mesma regra de
 * nunca inventar dado na página publicada, aplicada antes de a página existir.
 *
 * O que mudou foi o desenho do vazio, e só ele. Blocos cinzentos empilhados
 * liam como carregamento travado: a pessoa via defeito onde deveria ver a
 * galeria dela. Agora cada espaço é uma moldura de verdade, com o quadro
 * desenhado dentro, do tamanho que a foto vai ter. Continua vazio, continua
 * honesto, e passa a parecer parede de exposição esperando o trabalho.
 *
 * Só aparece no computador. No celular ela roubaria a tela do formulário, que
 * é o que a pessoa veio fazer, e o cadastro inteiro cabe em duas perguntas.
 *
 * `escolhido` é separado de `categoria` por causa de "Outro": ali a receita é
 * a padrão e a categoria é nula, e a frase de baixo ficava pedindo um ramo que
 * a pessoa acabara de escrever.
 */
export function PreviaViva({
  nome,
  slug,
  categoria,
  escolhido = false,
}: {
  nome: string;
  slug: string;
  categoria: string | null;
  escolhido?: boolean;
}) {
  const receita = receitaDe(categoria);
  const inicial = nome.trim().charAt(0).toUpperCase();
  /*
   * O nome do ramo escolhido, que é o que a plaquinha anuncia. Quem marcou
   * "Outro" cai em nulo aqui de propósito: ali a receita é a padrão, e escrever
   * o texto livre da pessoa na plaquinha faria a prévia prometer uma receita
   * própria para um ramo que ainda não tem nenhuma.
   */
  const rotuloDaPeca = categoriaPorId(categoria)?.nome ?? "Sua galeria";

  const catalogo = (
    <Secao titulo={receita.tituloCatalogo}>
      <div className="flex flex-col gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <EspacoDeFoto className="h-11 w-11 shrink-0 rounded-lg" />
            <div className="flex-1">
              <Linha className="w-2/3" />
              {receita.mostrarPrecos ? <Linha className="mt-2 w-10" /> : null}
            </div>
          </div>
        ))}
      </div>
    </Secao>
  );

  const galeria = (
    <Secao titulo="Fotos">
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <EspacoDeFoto key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    </Secao>
  );

  return (
    <div data-previa className="w-[20rem]">
      {/*
        O aparelho, pendurado na parede.

        A moldura veste o tema da parede, e o miolo devolve o tema `areia`: na
        parede escura ela vira um passe-partout claro em volta da página, e a
        página continua com a cor que a pessoa vai receber de verdade. Sem essa
        volta, o miolo escureceria junto e a prévia passaria a prometer uma
        página escura para quem escolheu a clara.
      */}
      <div className="relative rounded-[2.2rem] border border-borda bg-texto/90 p-2.5 shadow-[0_24px_50px_-24px_rgba(28,25,23,0.5)]">
        {/*
          O fio entre o passe-partout e a página.

          Sem ele, o creme da moldura e o creme da capa vazia encostavam num
          bloco só, e o aparelho perdia o contorno justo na parte de cima. O
          fio é a tinta do próprio tema claro, bem diluída: separa sem virar
          mais uma borda forte.
        */}
        <div
          data-tema="areia"
          className="relative rounded-[1.7rem] ring-1 ring-texto/12"
        >
          {/*
            A página continua abaixo da dobra, e o corte seco parecia defeito de
            renderização. O esmaecido diz que ali tem mais, que é a verdade.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 rounded-b-[1.7rem] bg-gradient-to-t from-superficie to-transparent"
          />
          <div className="h-[31rem] overflow-hidden rounded-[1.7rem] bg-superficie">
            {/* A capa, que é a primeira coisa que a pessoa sobe. */}
            <EspacoDeFoto className="h-24 w-full rounded-none border-x-0 border-t-0" />

            <div className="px-4 pb-5">
              <div className="-mt-7 mb-3 flex h-14 w-14 items-center justify-center rounded-full border-4 border-superficie bg-fundo text-lg font-semibold text-suave">
                {inicial === "" ? <Retrato /> : inicial}
              </div>

              {nome.trim() === "" ? (
                <Linha className="h-3 w-2/3" />
              ) : (
                <p className="text-[1.05rem] leading-tight font-semibold text-balance text-texto">
                  {nome.trim()}
                </p>
              )}

              <p className="mt-1.5 truncate text-[0.7rem] text-suave">
                {DOMINIO_PUBLICO}/{slug || "..."}
              </p>

              {/* Onde entra o botão que abre a conversa. */}
              <div className="mt-4 h-8 rounded-full border border-borda bg-fundo" />

              {receita.galeriaPrimeiro ? (
                <>
                  {galeria}
                  {catalogo}
                </>
              ) : (
                <>
                  {catalogo}
                  {galeria}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*
        A plaquinha da peça, do jeito que museu escreve: uma linha em caixa
        alta com o nome do que está pendurado, e a explicação embaixo. Ela
        substitui a frase centralizada em cinza, que era mais uma legenda solta
        de tela gerada.
      */}
      <div className="mt-5 border-t border-borda pt-3.5">
        <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-suave uppercase">
          {rotuloDaPeca}
        </p>
        <p
          aria-live="polite"
          className="mt-1.5 text-[0.9rem] leading-relaxed text-suave"
        >
          {escolhido
            ? "Nasce assim, com as seções do seu ramo já no lugar. O resto é com você."
            : "Escolha o seu ramo, e ela se monta aqui."}
        </p>
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-[0.78rem] font-semibold text-texto">{titulo}</p>
      {children}
    </div>
  );
}

/**
 * Espaço de imagem, do tamanho que a imagem vai ter.
 *
 * A moldura com o quadro desenhado dentro diz "aqui entra uma foto sua" sem
 * pôr foto nenhuma. O retângulo cinza chapado dizia "carregando".
 */
function EspacoDeFoto({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center border border-borda bg-fundo ${className ?? ""}`}
    >
      <Quadro />
    </div>
  );
}

/** Quadro pendurado, desenhado. Ícone é vetor próprio, e nunca emoji. */
function Quadro() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-1/3 max-h-6 min-h-3.5 w-auto text-borda"
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M5 16.5 9.5 12l3 3 2.5-2.5 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="9.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** O retrato, no lugar da inicial, enquanto o nome está por vir. */
function Retrato() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 text-borda"
    >
      <circle
        cx="12"
        cy="9"
        r="3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.8 20a7.2 7.2 0 0 1 14.4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Linha de texto por vir. Fica warm, e nunca cinza de carregamento. */
function Linha({ className }: { className?: string }) {
  return <div className={`h-2 rounded-full bg-borda/70 ${className ?? ""}`} />;
}
