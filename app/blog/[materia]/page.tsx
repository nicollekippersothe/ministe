import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NOME_PRODUTO } from "@/lib/marca";
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
    <main
      data-tema="areia"
      className="mx-auto w-full max-w-[38rem] px-5 py-10"
    >
      <Link href="/blog" className="text-sm text-suave">
        {NOME_PRODUTO} · Blog
      </Link>

      <h1 className="mt-3 text-[2.1rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto">
        {materia.titulo}
      </h1>
      <time
        dateTime={materia.publicadoEm}
        className="mt-3 block text-sm text-suave"
      >
        {dataPorExtenso(materia.publicadoEm)}
      </time>

      <article className="mt-8 flex flex-col gap-5">
        {materia.corpo.map((bloco, i) =>
          bloco.tipo === "subtitulo" ? (
            <h2
              key={i}
              className="mt-2 text-lg font-semibold tracking-tight text-texto"
            >
              {bloco.texto}
            </h2>
          ) : (
            <p key={i} className="leading-relaxed text-suave">
              {bloco.texto}
            </p>
          ),
        )}
      </article>

      <p className="mt-12 border-t border-borda pt-8 text-sm text-suave">
        <Link href="/blog" className="underline underline-offset-2">
          Voltar para o blog
        </Link>
      </p>
    </main>
  );
}
