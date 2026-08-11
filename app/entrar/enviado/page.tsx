import type { Metadata } from "next";
import Link from "next/link";
import { Moldura } from "@/componentes/cadastro/Moldura";

export const metadata: Metadata = {
  title: "Confira seu e-mail",
  robots: { index: false, follow: false },
};

export default async function Enviado({
  searchParams,
}: {
  searchParams: Promise<{ para?: string }>;
}) {
  const { para } = await searchParams;

  return (
    <Moldura
      titulo="Confira seu e-mail"
      subtitulo={
        para
          ? `Se existir uma conta para ${para}, o link de acesso chega em instantes.`
          : "Se existir uma conta para esse endereço, o link de acesso chega em instantes."
      }
      rodape={
        <p className="text-center text-[0.95rem] text-suave">
          Digitou o e-mail errado?{" "}
          <Link
            href="/entrar"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Tentar outro e-mail
          </Link>
        </p>
      }
    >
      <div className="rounded-2xl border border-borda bg-superficie p-5">
        <p className="leading-relaxed text-suave">
          O link vale por uma hora e abre direto no seu painel. Se não encontrar,
          verifique a caixa de spam e a aba de promoções.
        </p>
        <p className="mt-4 text-sm">
          <Link
            href="/entrar/ajuda"
            className="text-destaque underline underline-offset-2"
          >
            O link não chegou
          </Link>
        </p>
      </div>
    </Moldura>
  );
}
