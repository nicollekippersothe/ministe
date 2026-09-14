import type { Metadata } from "next";
import Link from "next/link";
import { NOME_PRODUTO } from "@/lib/marca";
import { CADASTRO_ABERTO } from "@/lib/site";
import { dataPorExtenso, materiasPublicadas } from "@/lib/blog";

export const metadata: Metadata = {
  title: `Blog, ${NOME_PRODUTO}`,
  description:
    "Histórias de quem vive do próprio trabalho e guias diretos para a sua página render mais.",
};

/**
 * A capa do blog.
 *
 * A estrutura já está pronta e lê de lib/blog.ts. A abertura conta o que o blog
 * é, e a lista de matérias entra abaixo assim que a primeira for publicada. Com
 * a lista vazia, a seção some inteira, pela regra 6 do AGENTS.md, e a capa segue
 * de pé com a abertura e o convite.
 */
export default function Blog() {
  const materias = materiasPublicadas();

  return (
    <main
      data-tema="areia"
      className="mx-auto w-full max-w-[42rem] px-5 py-10"
    >
      <Link href="/" className="text-sm text-suave">
        {NOME_PRODUTO}
      </Link>

      <h1 className="mt-3 text-[2.4rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-texto">
        O trabalho de perto
      </h1>
      <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-balance text-suave">
        Histórias de gente que vive do próprio ofício e guias diretos para
        aproveitar cada canto da sua página. Escrito para quem atende sozinho e
        toca o negócio no dia a dia.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-borda p-5">
          <h2 className="font-semibold tracking-tight text-texto">
            Histórias reais
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-suave">
            Quem transformou o perfil numa página e o trabalho num negócio, com
            o caminho que trilhou por dentro.
          </p>
        </div>
        <div className="rounded-2xl border border-borda p-5">
          <h2 className="font-semibold tracking-tight text-texto">
            Guias da página
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-suave">
            O catálogo que vende, o horário que organiza a agenda e o botão de
            WhatsApp que aproxima o cliente.
          </p>
        </div>
      </div>

      {materias.length > 0 ? (
        <ul className="mt-12 flex flex-col divide-y divide-borda border-t border-borda">
          {materias.map((materia) => (
            <li key={materia.slug}>
              <Link
                href={`/blog/${materia.slug}`}
                className="group flex flex-col gap-1.5 py-6"
              >
                <time
                  dateTime={materia.publicadoEm}
                  className="text-xs tracking-wide text-suave uppercase"
                >
                  {dataPorExtenso(materia.publicadoEm)}
                </time>
                <span className="text-xl font-semibold tracking-tight text-texto group-hover:text-destaque">
                  {materia.titulo}
                </span>
                <span className="leading-relaxed text-suave">
                  {materia.resumo}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-12 border-t border-borda pt-8">
        <p className="leading-relaxed text-suave">
          {CADASTRO_ABERTO
            ? "A sua página começa com o seu nome num endereço só seu."
            : `Conheça o ${NOME_PRODUTO} e o que ele monta para o seu negócio.`}
        </p>
        <Link
          href={CADASTRO_ABERTO ? "/criar" : "/"}
          className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-texto px-7 font-semibold text-superficie"
        >
          {CADASTRO_ABERTO ? "Criar a minha página" : `Conhecer o ${NOME_PRODUTO}`}
        </Link>
      </div>
    </main>
  );
}
