import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaPublica } from "@/componentes/PaginaPublica";
import { porSlug } from "@/lib/dados";
import { urlBase } from "@/lib/site";

/**
 * A página pública, por endereço.
 *
 * Só entrega negócio publicado. Rascunho não abre nem para quem souber o
 * endereço: a pré-visualização do dono vive em /painel/previa.
 *
 * O HTML é estático, mas o selo de horário é calculado no servidor e a linha
 * do tempo cobre poucos dias, então uma hora de validade mantém tudo fresco
 * sem tirar a página do cache. Salvar no painel refaz o cache na hora.
 */
export const revalidate = 3600;

/**
 * Vazio de propósito. Sem isto o Next trata a rota como totalmente dinâmica e
 * refaz a página a cada visita. Com a lista vazia, nenhuma página é gerada no
 * build (não dá para saber os endereços que ainda vão existir), mas a primeira
 * visita de cada endereço fica em cache e as seguintes saem prontas.
 */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const negocio = await porSlug(slug);
  if (!negocio || !negocio.publicado) return { title: "Endereço disponível" };

  const local = [negocio.cidade, negocio.estado].filter(Boolean).join(", ");
  const titulo = local ? `${negocio.nome} em ${local}` : negocio.nome;
  const descricao =
    negocio.frase ??
    `Horário, endereço e contato de ${negocio.nome}${local ? ` em ${local}` : ""}.`;

  return {
    metadataBase: new URL(urlBase),
    title: titulo,
    description: descricao,
    alternates: { canonical: `/${negocio.slug}` },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: negocio.nome,
      title: titulo,
      description: descricao,
      url: `${urlBase}/${negocio.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descricao,
    },
  };
}

export default async function Pagina({ params }: Props) {
  const { slug } = await params;
  const negocio = await porSlug(slug);
  if (!negocio || !negocio.publicado) notFound();

  return <PaginaPublica negocio={negocio} urlBase={urlBase} />;
}
