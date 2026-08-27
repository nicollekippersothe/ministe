"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Copia o link da página para a área de transferência.
 *
 * **Existe porque o painel mostrava o link e parava aí.** Quem quer mandar a
 * própria página para uma cliente no WhatsApp precisava abrir o link numa aba,
 * esperar carregar e copiar da barra do navegador, ou digitar na mão. No
 * celular esse caminho custa quatro toques e uma troca de aplicativo, e é o
 * gesto mais frequente que esta tela tem para oferecer.
 *
 * Fica colado no link, em peso de contorno, e por isso continua abaixo do
 * botão principal do cartão: ele acompanha o link, e não disputa com
 * publicar.
 *
 * **A palavra é "link", e nunca "endereço".** No painel, endereço passou a
 * nomear uma coisa só, a rua onde a pessoa atende, e este botão copia a outra:
 * o que se cola numa conversa e abre a página.
 *
 * O rótulo troca para "Copiado" por dois segundos e volta sozinho. A troca é
 * anunciada por `aria-live`, então quem usa leitor de tela ouve o mesmo retorno
 * que quem enxerga o botão mudar.
 */
export function BotaoCopiar({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

  // O prazo precisa morrer junto com o componente: sair da tela dentro dos dois
  // segundos deixaria um setState mirando um componente já desmontado.
  useEffect(() => {
    return () => {
      if (relogio.current !== null) clearTimeout(relogio.current);
    };
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Navegador antigo, ou permissão recusada pelo sistema. O link segue
      // escrito na tela, do lado, e continua dando para marcar e copiar na mão.
      return;
    }

    setCopiado(true);
    if (relogio.current !== null) clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-borda bg-fundo px-4 text-sm font-medium text-texto transition-transform duration-75 active:scale-[0.97]"
    >
      <span className="shrink-0 text-suave" aria-hidden>
        {copiado ? <IconeConferido /> : <IconeCopiar />}
      </span>
      <span aria-live="polite">{copiado ? "Copiado" : "Copiar o link"}</span>
    </button>
  );
}

/** Duas folhas sobrepostas, que é o desenho que todo mundo já lê como copiar. */
function IconeCopiar() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6.5A3.5 3.5 0 0 0 3 6.5v6A2.5 2.5 0 0 0 5.5 15" />
    </svg>
  );
}

function IconeConferido() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  );
}
