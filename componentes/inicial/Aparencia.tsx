"use client";

import { useEffect, useRef, useState } from "react";
import type { Fundo, Tema } from "@/lib/tipos";

/**
 * O console de aparência.
 *
 * É a única parte da tela inicial que roda no navegador além da placa. A
 * página de exemplo chega pronta do servidor, feita com os componentes de
 * verdade, e aqui só se trocam três atributos nela (`data-tema`, `data-fundo`
 * e `data-fonte`), que é exatamente o que a página do cliente faz. Nenhuma
 * peça é redesenhada: o CSS do produto repinta tudo.
 *
 * As letras vêm do servidor com a classe de cada uma, porque o carregador de
 * fontes do Next só roda lá. Nenhuma é baixada antes do clique, já que só o
 * CSS aplicado puxa o arquivo (ver `lib/fontes.ts`).
 */

export type OpcaoDeLetra = { chave: string; nome: string; classe: string };

const TEMAS: { chave: Tema; nome: string }[] = [
  { chave: "areia", nome: "Areia" },
  { chave: "minimal", nome: "Minimal" },
  { chave: "menta", nome: "Menta" },
  { chave: "noite", nome: "Noite" },
  { chave: "cosmico", nome: "Cósmico" },
];

const FUNDOS: { chave: Fundo; nome: string }[] = [
  { chave: "liso", nome: "Liso" },
  { chave: "papel", nome: "Papel" },
  { chave: "tinta", nome: "Tinta" },
  { chave: "degrade", nome: "Degradê" },
  { chave: "vinheta", nome: "Vinheta" },
];

function Opcao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
        ativo
          ? "border-texto bg-texto text-fundo"
          : "border-borda bg-superficie text-texto hover:border-suave"
      }`}
    >
      {children}
    </button>
  );
}

function Grupo({
  rotulo,
  nota,
  children,
}: {
  rotulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-col gap-2">
      <p className="text-sm text-suave">
        <span className="font-semibold text-texto">{rotulo}</span>
        {nota ? <> · {nota}</> : null}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Aparencia({
  inicial,
  letras,
  children,
}: {
  inicial: { tema: Tema; fundo: Fundo; fonte: string };
  letras: OpcaoDeLetra[];
  /** A página de exemplo, pronta do servidor, dentro de `[data-pagina-demo]`. */
  children: React.ReactNode;
}) {
  const [tema, setTema] = useState<Tema>(inicial.tema);
  const [fundo, setFundo] = useState<Fundo>(inicial.fundo);
  const [fonte, setFonte] = useState(inicial.fonte);
  const palco = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = palco.current?.querySelector<HTMLElement>("[data-pagina-demo]");
    if (!alvo) return;
    alvo.setAttribute("data-tema", tema);
    if (fundo === "liso") alvo.removeAttribute("data-fundo");
    else alvo.setAttribute("data-fundo", fundo);
    alvo.setAttribute("data-fonte", fonte);
    // Troca só as classes das letras, e deixa as demais intactas.
    for (const l of letras) alvo.classList.remove(...l.classe.split(" "));
    const escolhida = letras.find((l) => l.chave === fonte);
    if (escolhida) alvo.classList.add(...escolhida.classe.split(" "));
  }, [tema, fundo, fonte, letras]);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-20">
      <div className="order-2 flex flex-col gap-8 lg:sticky lg:top-8 lg:order-1">
        <Grupo rotulo="Tema" nota="grátis">
          {TEMAS.map((t) => (
            <Opcao key={t.chave} ativo={tema === t.chave} onClick={() => setTema(t.chave)}>
              <span
                data-tema={t.chave}
                aria-hidden
                style={{
                  background:
                    "linear-gradient(135deg, var(--c-fundo) 50%, var(--c-destaque) 50%)",
                }}
                className="h-4 w-4 rounded-full border border-suave/40"
              />
              {t.nome}
            </Opcao>
          ))}
        </Grupo>
        <Grupo rotulo="Textura" nota="grátis">
          {FUNDOS.map((f) => (
            <Opcao key={f.chave} ativo={fundo === f.chave} onClick={() => setFundo(f.chave)}>
              {f.nome}
            </Opcao>
          ))}
        </Grupo>
        <Grupo rotulo="Letra" nota="plano Completo">
          {letras.map((l) => (
            <Opcao key={l.chave} ativo={fonte === l.chave} onClick={() => setFonte(l.chave)}>
              {l.nome}
            </Opcao>
          ))}
        </Grupo>
      </div>

      <div ref={palco} className="order-1 lg:order-2">
        {children}
      </div>
    </div>
  );
}
