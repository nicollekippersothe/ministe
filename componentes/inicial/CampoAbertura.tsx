"use client";

import { useEffect, useId, useState } from "react";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { conferirFormato, MOTIVOS, normalizar } from "@/lib/slug";

type Estado = "vazio" | "conferindo" | "livre" | "ocupado";

/**
 * A placa da porta.
 *
 * O nome da marca é o que se diz na porta, então o campo de endereço virou a
 * placa que fica ao lado dela. O domínio já vem gravado, e o nome do negócio
 * aparece depois da barra enquanto a pessoa digita. Quando o endereço está
 * livre, a placa acende em latão: é o único brilho da tela inicial, e ele
 * aparece exatamente no instante em que a pessoa passa a querer aquele
 * endereço.
 *
 * Pedir para escrever o nome antes de qualquer cadastro é o que transforma
 * visita em intenção: ela vê o próprio nome no endereço e passa a querer
 * aquele endereço. Aqui o movimento é honesto, porque o endereço é único de
 * verdade e a conferência acontece na hora.
 *
 * Continua sendo o único pedaço do produto que roda no navegador, e ele fica
 * na tela inicial, longe da página do cliente.
 */
export function CampoAbertura({
  rotulo = "Criar meu endereço",
}: {
  /**
   * Enquanto o cadastro não abre, o botão diz "Continuar": prometer criar e
   * cair numa tela que não cria seria pegar a pessoa de jeito.
   */
  rotulo?: string;
}) {
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
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <label htmlFor={id} className="sr-only">
          Endereço da sua página
        </label>

        {/*
          A chapa. O brilho de latão entra por data-livre, em CSS, e não por
          classe montada aqui: assim o estado da placa é uma coisa só, legível
          na inspeção do navegador junto com o resto do produto.
        */}
        <span
          className="placa flex flex-1 items-center rounded-2xl border border-borda bg-superficie px-5 py-4"
          data-livre={estado === "livre" ? "1" : "0"}
        >
          <span
            aria-hidden
            className="text-[1.05rem] tracking-[-0.01em] text-suave"
          >
            {DOMINIO_PUBLICO}/
          </span>
          <input
            id={id}
            name="slug"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="seunome"
            aria-describedby={`${id}-estado`}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[1.05rem] font-semibold tracking-[-0.01em] text-texto placeholder:font-normal placeholder:text-suave/60 focus:outline-none"
          />
        </span>

        <button
          type="submit"
          className="flex h-13 shrink-0 items-center justify-center rounded-2xl bg-texto px-7 text-[1.02rem] font-semibold text-fundo transition-opacity hover:opacity-90 sm:h-auto sm:px-8"
        >
          {rotulo}
        </button>
      </form>

      <p
        id={`${id}-estado`}
        aria-live="polite"
        className="mt-3 min-h-5 text-sm text-suave"
      >
        {estado === "conferindo" ? "conferindo..." : null}
        {estado === "livre" ? (
          <span className="font-semibold text-aberto-texto">
            {DOMINIO_PUBLICO}/{slug} está livre. É sua.
          </span>
        ) : null}
        {estado === "ocupado" ? (
          <span className="text-destaque">{motivo}</span>
        ) : null}
      </p>
    </div>
  );
}
