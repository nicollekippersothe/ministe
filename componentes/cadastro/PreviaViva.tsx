"use client";

import { receitaDe } from "@/lib/categorias";
import { DOMINIO_PUBLICO } from "@/lib/marca";

/**
 * A página nascendo, ao lado do formulário.
 *
 * Mostra o ESQUELETO que a categoria monta, e não uma página de mentira. Ao
 * escolher Fotografia, o nome da seção vira Ensaios e a galeria sobe para
 * antes do catálogo; ao escolher Confeitaria, vira Cardápio e o preço aparece.
 * É a mesma receita que vai montar a página de verdade, lida do mesmo lugar.
 *
 * Encher de bolo e preço faria esta tela vender melhor e mentiria sobre o que a
 * pessoa recebe, que é uma página vazia esperando ela preencher. Mesma regra de
 * nunca inventar dado na página publicada, aplicada antes de a página existir.
 *
 * Só aparece no computador. No celular ela roubaria a tela do formulário, que
 * é o que a pessoa veio fazer, e o cadastro inteiro cabe em três respostas.
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

  const catalogo = (
    <Secao titulo={receita.tituloCatalogo}>
      <div className="flex flex-col gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Vazio className="h-11 w-11 shrink-0 rounded-lg" />
            <div className="flex-1">
              <Vazio className="h-2 w-2/3 rounded-full" />
              {receita.mostrarPrecos ? (
                <Vazio className="mt-1.5 h-2 w-10 rounded-full" />
              ) : null}
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
          <Vazio key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    </Secao>
  );

  return (
    <div data-previa className="w-[19rem]">
      {/* O aparelho. Desenho, e não imagem, para acompanhar o tema. */}
      <div className="relative rounded-[2.2rem] border border-borda bg-texto/90 p-2.5 shadow-[0_24px_50px_-24px_rgba(28,25,23,0.5)]">
        {/*
          A página continua abaixo da dobra, e o corte seco parecia defeito de
          renderização. O esmaecido diz que ali tem mais, que é a verdade.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-10 h-16 rounded-b-[1.7rem] bg-gradient-to-t from-superficie to-transparent"
        />
        <div className="h-[30rem] overflow-hidden rounded-[1.7rem] bg-superficie">
          {/* Capa */}
          <Vazio className="h-24 w-full rounded-none" />

          <div className="px-4 pb-5">
            <div className="-mt-7 mb-3 flex h-14 w-14 items-center justify-center rounded-full border-4 border-superficie bg-fundo text-lg font-semibold text-suave">
              {inicial === "" ? (
                <span className="h-5 w-5 rounded-full bg-borda" />
              ) : (
                inicial
              )}
            </div>

            {nome.trim() === "" ? (
              <Vazio className="h-3.5 w-2/3 rounded-full" />
            ) : (
              <p className="text-[1.05rem] leading-tight font-semibold text-balance text-texto">
                {nome.trim()}
              </p>
            )}

            <p className="mt-1.5 truncate text-[0.7rem] text-suave">
              {DOMINIO_PUBLICO}/{slug || "..."}
            </p>

            <div className="mt-4 h-8 rounded-full bg-texto/12" />

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

      <p
        aria-live="polite"
        className="mt-4 px-1 text-center text-sm leading-relaxed text-suave"
      >
        {escolhido
          ? "Sua página começa assim. Tudo muda depois, no painel."
          : "Escolha o seu ramo e a página se monta aqui do lado."}
      </p>
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

/** Espaço marcado, para dizer que ali cabe conteúdo sem inventar conteúdo. */
function Vazio({ className }: { className?: string }) {
  return <div className={`bg-borda/60 ${className ?? ""}`} />;
}
