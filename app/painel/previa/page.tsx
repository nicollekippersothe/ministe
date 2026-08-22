import type { Metadata } from "next";
import Link from "next/link";
import { PaginaPublica } from "@/componentes/PaginaPublica";
import { doDono } from "@/lib/dados";
import { urlBase } from "@/lib/site";

/**
 * Pré-visualização do dono.
 *
 * Existe porque a página pública só entrega negócio publicado, então sem isto
 * o dono ficaria no escuro até apertar publicar. É a mesma página, com uma
 * faixa em cima dizendo quem está enxergando aquilo. A faixa fala de quem vê,
 * e não de "rascunho": a página pode estar pronta e apenas guardada, e o que
 * publicar muda é quem consegue abrir o endereço.
 */
import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prévia",
  robots: { index: false, follow: false },
};

export default async function Previa() {
  exigirLogin();
  const negocio = await doDono();

  return (
    <>
      <div className="sticky top-0 z-50 bg-texto px-4 py-2.5 text-center text-sm text-superficie">
        {negocio.publicado
          ? "Prévia da sua página"
          : "Prévia, visível apenas para você"}
        <Link href="/painel" className="ml-3 font-semibold underline">
          Voltar ao painel
        </Link>
      </div>
      <PaginaPublica negocio={negocio} urlBase={urlBase} />
    </>
  );
}
