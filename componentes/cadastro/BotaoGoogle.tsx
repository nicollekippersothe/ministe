"use client";

import { useState } from "react";
import { navegador } from "@/lib/supabase/navegador";

/**
 * O único botão de login do produto.
 *
 * Faz duas coisas parecidas por fora e diferentes por dentro:
 *
 * - Quem já montou uma página está numa conta provisória, e aí o Google é
 *   *ligado* nessa conta (`linkIdentity`). O `auth.uid()` continua o mesmo, e
 *   a página que a pessoa acabou de montar continua sendo dela.
 * - Quem chega direto entra normalmente (`signInWithOAuth`).
 *
 * A diferença importa: entrar por cima da conta provisória criaria uma conta
 * nova e deixaria o rascunho para trás, que é exatamente o que este fluxo
 * existe para evitar.
 */
export function BotaoGoogle({
  rotulo = "Entrar com o Google",
  para = "/painel",
}: {
  rotulo?: string;
  para?: string;
}) {
  const [indo, setIndo] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);

  async function ir() {
    setIndo(true);
    setRecado(null);

    const sb = navegador();
    const destino = `${location.origin}/auth/retorno?para=${encodeURIComponent(para)}`;
    const opcoes = { redirectTo: destino };

    const { data: quem } = await sb.auth.getUser();

    if (quem.user?.is_anonymous) {
      const { data, error } = await sb.auth.linkIdentity({
        provider: "google",
        options: opcoes,
      });
      if (!error) {
        if (data?.url) location.assign(data.url);
        return;
      }
      // Cai aqui quando este Google já tem uma conta aqui dentro. Entrar nela é
      // o caminho certo, e a pessoa precisa saber que a página que ela estava
      // montando agora está fora, em vez de descobrir sozinha depois.
      setRecado(
        "Este Google já tem uma página aqui. Entrando nela, a que você montou agora fica guardada neste aparelho.",
      );
    }

    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: opcoes,
    });
    if (error) {
      setRecado("Tente de novo em um instante.");
      setIndo(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={ir}
        disabled={indo}
        className="flex h-13 w-full items-center justify-center gap-3 rounded-full bg-texto px-6 text-[1.05rem] font-semibold text-superficie disabled:opacity-70"
      >
        <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
          <path
            fill="#4285F4"
            d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l-.1.3 6.6 5.1.4.1c4.2-3.9 6.6-9.6 6.6-15.8"
          />
          <path
            fill="#34A853"
            d="M24 46c6 0 11-2 14.6-5.4l-7-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-.3.1-6.8 5.3-.1.3C7.9 41 15.4 46 24 46"
          />
          <path
            fill="#FBBC05"
            d="M11.5 28.3c-.5-1.4-.7-2.9-.7-4.3s.3-3 .7-4.3v-.4l-6.9-5.4-.2.1a22 22 0 0 0 0 19.9z"
          />
          <path
            fill="#EA4335"
            d="M24 10.4c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.1 30 2 24 2 15.4 2 7.9 7 4.4 14.2l7.1 5.5c1.8-5.3 6.7-9.3 12.5-9.3"
          />
        </svg>
        {indo ? "Abrindo o Google..." : rotulo}
      </button>

      {recado ? (
        <p role="alert" className="text-center text-sm leading-relaxed text-suave">
          {recado}
        </p>
      ) : null}
    </div>
  );
}
