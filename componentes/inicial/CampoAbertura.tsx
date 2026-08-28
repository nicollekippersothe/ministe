"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  rotulo = "Criar minha página grátis",
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

  // A dica que a placa mostra depois da barra enquanto o campo está vazio. Ela
  // começa fixa e a placa passa a escrevê-la sozinha logo abaixo. O gancho de
  // parar a demonstração fica num ref para os handlers do campo alcançarem sem
  // religar o efeito.
  const [dica, setDica] = useState("seunome");
  const pararDemo = useRef<() => void>(() => {});

  const slug = normalizar(valor);

  /*
   * A placa se escrevendo sozinha, o único gesto orquestrado da tela.
   *
   * Antes de qualquer toque, a placa demonstra "seu nome vira seu endereço":
   * escreve um exemplo depois da barra, letra a letra, segura, apaga e vai para
   * o próximo. É só a dica do campo que se move, na mesma cor suave do
   * "seunome"; o valor real fica intocado, nenhum endereço é conferido e nada é
   * inventado como livre. O que a pessoa vê é a forma do que vai acontecer com o
   * nome dela.
   *
   * A regra que importa: no instante em que a pessoa assume o campo (foco ou
   * primeira tecla), a demonstração para e some para sempre. Uma placa que
   * escrevesse por baixo de quem está digitando seria o pior defeito da tela.
   * E quem pediu menos movimento no sistema não vê nada disso: a placa nasce
   * com o "seunome" parado.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const exemplos = ["marina-tatua", "docesdaana", "atelie-rosa", "psi-joao"];
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;

    const parar = () => {
      vivo = false;
      clearTimeout(timer);
      setDica("seunome");
    };
    pararDemo.current = parar;

    let iExemplo = 0;
    const escrever = () => {
      const alvo = exemplos[iExemplo];

      const digitar = (n: number) => {
        if (!vivo) return;
        setDica(alvo.slice(0, n));
        if (n < alvo.length) {
          timer = setTimeout(() => digitar(n + 1), 95);
        } else {
          timer = setTimeout(() => apagar(alvo.length), 1500);
        }
      };

      const apagar = (n: number) => {
        if (!vivo) return;
        setDica(alvo.slice(0, n) || "seunome");
        if (n > 0) {
          timer = setTimeout(() => apagar(n - 1), 45);
        } else {
          iExemplo = (iExemplo + 1) % exemplos.length;
          timer = setTimeout(escrever, 500);
        }
      };

      digitar(1);
    };

    // Deixa a entrada (.acende) assentar antes de a placa se apresentar:
    // primeiro a tela chega, depois ela começa a escrever.
    timer = setTimeout(escrever, 800);

    return parar;
  }, []);

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
          Escolha o seu endereço
        </label>

        {/*
          A chapa. Borda e brilho entram por data-estado, em CSS, e não por
          classe montada aqui: assim o estado da placa é uma coisa só, legível
          na inspeção do navegador junto com o resto do produto. Estado nunca só
          por cor: a borda vem do CSS, o ícone e o texto abaixo vêm daqui, e os
          três dizem a mesma coisa ao mesmo tempo.
        */}
        <span
          className="placa flex flex-1 items-center rounded-2xl border border-suave/35 bg-superficie px-5 py-4"
          data-estado={estado}
        >
          <span
            aria-hidden
            className="text-[1.05rem] tracking-[-0.01em] text-texto/60"
          >
            {DOMINIO_PUBLICO}/
          </span>
          <input
            id={id}
            name="slug"
            value={valor}
            onChange={(e) => {
              pararDemo.current();
              setValor(e.target.value);
            }}
            onFocus={() => pararDemo.current()}
            placeholder={dica}
            aria-describedby={`${id}-estado`}
            aria-invalid={estado === "ocupado"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[1.05rem] font-semibold tracking-[-0.01em] text-texto placeholder:font-normal placeholder:text-suave focus:outline-none"
          />

          {/* O tique do endereço livre. Desenhado, nunca emoji. */}
          {estado === "livre" ? (
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 shrink-0 text-aberto-texto"
            >
              <path d="M4 10.5 8 14.5 16 5.5" />
            </svg>
          ) : null}

          {/* O alerta do endereço ocupado, no vermelho de erro próprio. */}
          {estado === "ocupado" ? (
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 shrink-0"
              style={{ color: "var(--c-erro)" }}
            >
              <path d="M10 3 18 16.5H2Z" />
              <path d="M10 8.5V11.5" />
              <path d="M10 14h.01" />
            </svg>
          ) : null}
        </span>

        <button
          type="submit"
          /* Só um endereço barrado (palavra reservada ou formato inválido)
             desliga o botão. Vazio e "conferindo" seguem com o botão cheio e
             convidativo, senão a abertura da tela mostra um CTA apagado, que é
             o pior primeiro quadro para uma página que vende. */
          disabled={estado === "ocupado"}
          className="flex h-13 shrink-0 items-center justify-center rounded-2xl bg-texto px-7 text-[1.02rem] font-semibold text-fundo transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 sm:h-auto sm:px-8"
        >
          {rotulo}
        </button>
      </form>

      {/*
        A mensagem fala com o leitor de tela (role="status" + aria-live) e mostra
        a normalização: vazio dá a ajuda fixa, e com texto aparece o endereço
        final embaixo, sem mexer no valor digitado. Verde em livre, o motivo em
        vermelho em ocupado, neutro em conferindo.
      */}
      <p
        id={`${id}-estado`}
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 text-sm"
      >
        {estado === "vazio" ? (
          <span className="text-suave">
            Letras, números e hífen. Mínimo de 3 caracteres.
          </span>
        ) : null}
        {estado === "conferindo" ? (
          <span className="font-semibold text-texto">
            A sua página vai ficar em {DOMINIO_PUBLICO}/{slug}
          </span>
        ) : null}
        {estado === "livre" ? (
          <span className="font-semibold text-aberto-texto">
            A sua página vai ficar em {DOMINIO_PUBLICO}/{slug}
          </span>
        ) : null}
        {estado === "ocupado" ? (
          <span className="font-semibold" style={{ color: "var(--c-erro)" }}>
            {motivo}
          </span>
        ) : null}
      </p>
    </div>
  );
}
