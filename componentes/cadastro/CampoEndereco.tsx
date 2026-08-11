"use client";

import { useEffect, useId, useState } from "react";
import { conferirFormato, MOTIVOS, normalizar } from "@/lib/slug";

type Estado = "vazio" | "conferindo" | "livre" | "ocupado";

/**
 * O único pedaço do produto que roda no navegador.
 *
 * Escolher o endereço é o momento de maior atrito do cadastro: a pessoa
 * digita, manda, descobre que já era, e volta. Conferir enquanto ela digita
 * economiza essa ida e volta. A página pública não carrega nada disto.
 */
export function CampoEndereco({ inicial = "" }: { inicial?: string }) {
  const id = useId();
  const [valor, setValor] = useState(inicial);
  const [estado, setEstado] = useState<Estado>("vazio");
  const [motivo, setMotivo] = useState<string | null>(null);

  const slug = normalizar(valor);

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

  return (
    <div>
      <label htmlFor={id} className="text-[0.95rem] font-medium text-texto">
        Endereço da sua página
      </label>
      <p id={`${id}-dica`} className="mt-1 text-sm text-suave">
        Como as pessoas conhecem seu negócio. Pode trocar depois.
      </p>

      <div className="mt-3 flex items-center gap-0 overflow-hidden rounded-2xl border border-borda bg-superficie focus-within:border-destaque">
        <span className="pl-4 text-[1.05rem] text-suave select-none">banca.app/</span>
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
          className="w-full bg-transparent py-3.5 pr-4 pl-0.5 text-[1.05rem] text-texto outline-none"
        />
      </div>

      <p
        id={`${id}-estado`}
        aria-live="polite"
        className={`mt-2 min-h-5 text-sm ${
          estado === "livre" ? "text-aberto-texto" : "text-suave"
        }`}
      >
        {estado === "conferindo" ? "Conferindo..." : null}
        {estado === "livre" ? `banca.app/${slug} está livre` : null}
        {estado === "ocupado" ? motivo : null}
      </p>
    </div>
  );
}
