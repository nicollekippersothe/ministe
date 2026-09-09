import type { Metadata } from "next";
import { Landing } from "@/componentes/inicial/Landing";
import { NOME_PRODUTO } from "@/lib/marca";
import { urlBase } from "@/lib/site";

export const revalidate = 3600;

/*
 * O título e a descrição carregam a palavra que a pessoa digita no Google
 * (página de negócio, catálogo, WhatsApp), e não a metáfora da marca: ninguém
 * busca "porta" nem "sala". O Open Graph e o Twitter card fazem o link colado no
 * WhatsApp chegar com prévia em vez de retângulo cinza. A imagem sai de
 * `app/opengraph-image.tsx`, ao lado desta rota.
 */
const TITULO_OG = `${NOME_PRODUTO}, a página do seu negócio`;
const DESCRICAO_OG =
  "Catálogo com preço, horário, galeria e botão de WhatsApp, num endereço com o seu nome. Grátis para publicar.";

export const metadata: Metadata = {
  title: `${NOME_PRODUTO} | Página do seu negócio com catálogo e WhatsApp`,
  description:
    "Crie a página do seu negócio em minutos: catálogo com preço, horário, galeria e botão de WhatsApp. Endereço com o seu nome. Grátis para publicar.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: urlBase,
    siteName: NOME_PRODUTO,
    title: TITULO_OG,
    description: DESCRICAO_OG,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO_OG,
    description: DESCRICAO_OG,
  },
};

/*
 * A tela inicial é a landing "fachada": herói com a porta em 3D, os exemplos
 * espiando por baixo num carrossel em arco, os componentes de verdade do app, e
 * o preço em dois painéis. Todo o movimento (three.js, GSAP, Lenis) vive dentro
 * de `componentes/inicial/Landing.tsx`, que é um componente de cliente.
 */
export default function Home() {
  return <Landing />;
}
