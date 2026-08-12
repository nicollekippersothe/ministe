import type { Metadata } from "next";
import Link from "next/link";
import { NOME_PRODUTO } from "@/lib/marca";

export const metadata: Metadata = {
  title: "Painel",
  // O painel nunca deve aparecer em busca.
  robots: { index: false, follow: false },
};

export default function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-tema="areia" className="min-h-dvh bg-fundo">
      <div className="mx-auto w-full max-w-[34rem] px-5 pt-5 pb-8">
        <Link
          href="/painel"
          className="text-sm font-semibold tracking-[0.16em] text-destaque uppercase"
        >
          {NOME_PRODUTO}
        </Link>
        {children}
      </div>
    </div>
  );
}
