import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { urlBase } from "@/lib/site";
import "./globals.css";

const corpo = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--f-corpo",
});

// Uma fonte de titulo, um peso so. Cada peso extra e um arquivo a mais
// competindo com a foto de capa na primeira tela, no 4G.
const titulo = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: "700",
  variable: "--f-titulo",
});

export const metadata: Metadata = {
  metadataBase: new URL(urlBase),
  title: "Banca",
  description:
    "Uma página pronta para o negócio local que hoje só tem Instagram.",
};

export const viewport: Viewport = {
  themeColor: "#f4f0e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${titulo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
