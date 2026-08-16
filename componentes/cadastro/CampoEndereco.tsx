"use client";

import { useEffect, useId, useState } from "react";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { conferirFormato, MOTIVOS, normalizar } from "@/lib/slug";

type Estado = "vazio" | "conferindo" | "livre" | "ocupado";

/**
 * O único pedaço do produto que roda no navegador.
 *
 * Escolher o endereço é o momento de maior atrito do cadastro: a pessoa
 * digita, envia, descobre que já era, e volta. Conferir enquanto ela digita
 * economiza essa ida e volta. A página pública não carrega nada disto.
 *
 * O domínio fica numa linha própria embaixo, e não colado dentro do campo:
 * no celular o prefixo dentro do campo come metade do espaço de digitação e
 * o texto acaba cortado no meio.
 */
export function CampoEndereco({
  inicial = "",
  aoMudar,
}: {
  inicial?: string;
  /** O endereço já limpo, para a prévia do cadastro acompanhar. */
  aoMudar?: (slug: string) => void;
}) {
  const id = useId();
  const [valor, setValor] = useState(inicial);
  const [estado, setEstado] = useState<Estado>("vazio");
  const [motivo, setMotivo] = useState<string | null>(null);

  const slug = normalizar(valor);

  useEffect(() => {
    aoMudar?.(slug);
    // aoMudar fica de fora: quem chama define a função no corpo do componente,
    // então ela é nova a cada render e entraria em laço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (slug === "") {
      setEstado("vazio");
      setMotivo(null);
      return;
    }

    const recusa = conferirFormato(slug);
    if (recusa) {
      setEstado("ocupado");
      setMotivo(MOTIVOS[recusa]);
      return;
    }

    setEstado("conferindo");
    setMotivo(null);

    const cancelar = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const r = await fetch(`/api/endereco?slug=${encodeURIComponent(slug)}`, {
          signal: cancelar.signal,
        });
        const dados = await r.json();
        setEstado(dados.livre ? "livre" : "ocupado");
        setMotivo(dados.motivo);
      } catch {
        // Sem internet ou pedido cancelado. O servidor confere de novo no envio.
        setEstado("vazio");
      }
    }, 350);

    return () => {
      clearTimeout(espera);
      cancelar.abort();
    };
  }, [slug]);

  const borda =
    estado === "livre"
      ? "border-aberto-texto"
      : estado === "ocupado"
        ? "border-destaque"
        : "border-borda focus-within:border-texto";

  return (
    <div>
      <label htmlFor={id} className="text-[0.95rem] font-medium text-texto">
        Endereço da sua página
      </label>
      <p id={`${id}-dica`} className="mt-1 text-sm text-suave">
        Use o nome pelo qual as pessoas conhecem seu negócio. Pode ser trocado
        depois.
      </p>

      <input
        id={id}
        name="slug"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        aria-describedby={`${id}-dica ${id}-estado`}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        placeholder="doceria da ana"
        className={`mt-3 w-full rounded-2xl border bg-superficie px-4 py-3.5 text-[1.05rem] text-texto outline-none ${borda}`}
      />

      <p
        id={`${id}-estado`}
        aria-live="polite"
        className="mt-2.5 flex min-h-6 flex-wrap items-center gap-x-2 text-sm"
      >
        {slug === "" ? (
          <span className="text-suave">
            Vai ficar em{" "}
            <span className="font-medium text-texto">{DOMINIO_PUBLICO}/</span>
          </span>
        ) : (
          <>
            <span className="font-medium break-all text-texto">
              {DOMINIO_PUBLICO}/{slug}
            </span>
            {estado === "conferindo" ? (
              <span className="text-suave">conferindo...</span>
            ) : null}
            {estado === "livre" ? (
              <span className="font-medium text-aberto-texto">disponível</span>
            ) : null}
            {estado === "ocupado" ? (
              <span className="text-destaque">{motivo}</span>
            ) : null}
          </>
        )}
      </p>
    </div>
  );
}
