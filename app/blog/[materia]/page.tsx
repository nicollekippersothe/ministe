import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NOME_PRODUTO } from "@/lib/marca";
import { MolduraBlog } from "@/componentes/blog/MolduraBlog";
import { MATERIAS, dataPorExtenso, materiaPorSlug } from "@/lib/blog";

/**
 * A página de uma matéria do blog.
 *
 * Lê tudo de lib/blog.ts. Enquanto MATERIAS estiver vazio,
 * generateStaticParams devolve lista vazia e qualquer endereço aqui embaixo
 * responde como página que ainda não existe, sem inventar conteúdo. A primeira
 * matéria acrescentada ao arquivo passa a valer sozinha.
 */
export function generateStaticParams() {
  return MATERIAS.map((materia) => ({ materia: materia.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ materia: string }>;
}): Promise<Metadata> {
  const { materia: slug } = await params;
  const materia = materiaPorSlug(slug);
  if (!materia) return {};

  return {
    title: `${materia.titulo}, ${NOME_PRODUTO}`,
    description: materia.resumo,
  };
}

export default async function PaginaMateria({
  params,
}: {
  params: Promise<{ materia: string }>;
}) {
  const { materia: slug } = await params;
  const materia = materiaPorSlug(slug);
  if (!materia) notFound();

  return (
    <MolduraBlog>
      <article className="blog-artigo">
        <span className="blog-eyebrow">Blog</span>
        <h1 className="blog-artigo-titulo">{materia.titulo}</h1>
        <time dateTime={materia.publicadoEm} className="blog-artigo-data">
          {dataPorExtenso(materia.publicadoEm)}
        </time>

        <div className="blog-artigo-corpo">
          {materia.corpo.map((bloco, i) =>
            bloco.tipo === "subtitulo" ? (
              <h2 key={i}>{bloco.texto}</h2>
            ) : (
              <p key={i}>{bloco.texto}</p>
            ),
          )}
        </div>

        <Link href="/blog" className="blog-voltar">
          Voltar para o blog
        </Link>
      </article>
    </MolduraBlog>
  );
}
