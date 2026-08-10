import type { Metadata } from "next";
import { PaginaPublica } from "@/componentes/PaginaPublica";
import { negocioExemplo } from "@/lib/exemplo";
import { urlBase } from "@/lib/site";

/**
 * O HTML e estatico, mas o selo de horario e calculado no servidor e a
 * linha do tempo cobre poucos dias. Uma hora de validade mantem tudo fresco
 * sem tirar a pagina do cache.
 */
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const n = negocioExemplo;
  const local = [n.cidade, n.estado].filter(Boolean).join(", ");
  const titulo = local ? `${n.nome} em ${local}` : n.nome;
  const descricao =
    n.frase ??
    `Horário, endereço e contato de ${n.nome}${local ? ` em ${local}` : ""}.`;

  return {
    metadataBase: new URL(urlBase),
    title: titulo,
    description: descricao,
    alternates: { canonical: `/${n.slug}` },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: n.nome,
      title: titulo,
      description: descricao,
      url: `${urlBase}/${n.slug}`,
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao },
  };
}

export default function Pagina() {
  return <PaginaPublica negocio={negocioExemplo} urlBase={urlBase} />;
}
