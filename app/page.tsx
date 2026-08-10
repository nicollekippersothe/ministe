import type { Metadata } from "next";
import Link from "next/link";
import { NOME_PRODUTO } from "@/componentes/Rodape";

/**
 * Home provisoria. A pagina de venda entra depois, junto com o cadastro.
 * Por enquanto ela so leva para o exemplo, sem prometer nada que nao existe.
 */
export const metadata: Metadata = {
  title: `${NOME_PRODUTO}, uma página pronta para o negócio local`,
  description:
    "Endereço, horário, cardápio e um botão de WhatsApp que já abre a conversa escrita.",
};

export default function Home() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-fundo px-6 py-16">
      <main className="w-full max-w-md text-center">
        <p className="font-titulo text-sm font-semibold tracking-[0.18em] text-destaque uppercase">
          {NOME_PRODUTO}
        </p>
        <h1 className="mt-4 font-titulo text-3xl leading-tight font-bold tracking-tight text-balance text-texto">
          Uma página pronta para o negócio local
        </h1>
        <p className="mt-4 leading-relaxed text-balance text-suave">
          Endereço, horário, cardápio e um botão de WhatsApp que já abre a
          conversa escrita.
        </p>

        <Link
          href="/demo"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-texto px-7 font-semibold text-superficie transition-opacity hover:opacity-90"
        >
          Ver uma página de exemplo
        </Link>

        <p className="mt-10 text-xs leading-relaxed text-suave">
          Projeto em construção. Esta é a etapa 1, com uma página de exemplo e
          dados fictícios.
        </p>
      </main>
    </div>
  );
}
