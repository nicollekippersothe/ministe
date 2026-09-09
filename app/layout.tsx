import type { Metadata, Viewport } from "next";
import { NOME_PRODUTO } from "@/lib/marca";
import { urlBase } from "@/lib/site";
import "./globals.css";

/**
 * A fonte da marca não vem daqui.
 *
 * O painel, a tela inicial e o cadastro usam a fonte do próprio aparelho, que
 * no iPhone é a San Francisco e no Android é a Roboto. Custa zero byte, carrega
 * instantâneo e parece nativo.
 *
 * Só a página pública do negócio baixa fonte, e só a combinação que o dono
 * escolheu. Ver lib/fontes.ts.
 */

export const metadata: Metadata = {
  metadataBase: new URL(urlBase),
  title: NOME_PRODUTO,
  description:
    "Uma página pronta para o negócio local que hoje só tem Instagram.",
};

export const viewport: Viewport = {
  themeColor: "#f6f5f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
