"use client";

import { useEffect, useId, useState } from "react";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { conferirFormato, MOTIVOS, normalizar } from "@/lib/slug";

type Estado = "vazio" | "conferindo" | "livre" | "ocupado";

/**
 * O campo de endereço dentro da dobra.
 *
 * Pedir para a pessoa digitar o nome do negócio antes de qualquer cadastro é
 * o que transforma visita em intenção: ela vê o próprio nome no endereço e
 * passa a querer aquele endereço. É o mesmo movimento que o link.me faz na
 * abertura, e aqui ele é honesto, porque o endereço é único de verdade e a
 * conferência acontece na hora.
 *
 * Continua sendo o único pedaço do produto que roda no navegador, e ele fica
 * na tela inicial, longe da página do cliente.
 */
export function CampoAbertura() {
  const id = useId();
  const [valor, setValor] = useState("");
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
        // Sem internet ou pedido cancelado. O servidor confere de novo depois.
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
      <form
        action="/criar"
        method="get"
        className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:border sm:border-borda sm:bg-superficie sm:py-1.5 sm:pr-1.5 sm:pl-5"
      >
        <label htmlFor={id} className="sr-only">
          Endereço da sua página
        </label>
        <span className="flex flex-1 items-center rounded-full border border-borda bg-superficie px-5 py-3 sm:border-0 sm:bg-transparent sm:p-0">
          <span aria-hidden className="text-[1.05rem] text-suave">
            {DOMINIO_PUBLICO}/
          </span>
          <input
            id={id}
            name="slug"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="seunegocio"
            aria-describedby={`${id}-estado`}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[1.05rem] text-texto placeholder:text-suave/70 focus:outline-none"
          />
        </span>
        <button
          type="submit"
          className="flex h-13 shrink-0 items-center justify-center rounded-full bg-texto px-7 text-[1.02rem] font-semibold text-superficie"
        >
          Criar meu endereço
        </button>
      </form>

      <p
        id={`${id}-estado`}
        aria-live="polite"
        className="mt-3 min-h-5 text-sm text-suave"
      >
        {estado === "conferindo" ? "conferindo..." : null}
        {estado === "livre" ? (
          <span className="font-medium text-aberto-texto">
            {DOMINIO_PUBLICO}/{slug} está disponível
          </span>
        ) : null}
        {estado === "ocupado" ? (
          <span className="text-destaque">{motivo}</span>
        ) : null}
      </p>
    </div>
  );
}
