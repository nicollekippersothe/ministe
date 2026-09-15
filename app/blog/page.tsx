import type { Metadata } from "next";
import Link from "next/link";
import { NOME_PRODUTO } from "@/lib/marca";
import { CADASTRO_ABERTO } from "@/lib/site";
import { MolduraBlog } from "@/componentes/blog/MolduraBlog";
import { dataPorExtenso, materiasPublicadas } from "@/lib/blog";

export const metadata: Metadata = {
  title: `Blog, ${NOME_PRODUTO}`,
  description:
    "Histórias de quem vive do próprio trabalho e guias diretos para a sua página render mais.",
};

/**
 * A capa do blog.
 *
 * Masthead editorial que ocupa a largura no monitor, as duas trilhas em banda,
 * e a lista de matérias abaixo, que lê de lib/blog.ts. Com a lista vazia a seção
 * some, pela regra 6 do AGENTS.md, e a capa segue de pé com a abertura, as
 * trilhas e o convite.
 */
export default function Blog() {
  const materias = materiasPublicadas();

  return (
    <MolduraBlog>
      <section className="blog-hero">
        <div className="blog-hero-grade">
          <div>
            <span className="blog-eyebrow">Blog</span>
            <h1 className="blog-titulo">
              O trabalho <em>de perto.</em>
            </h1>
          </div>
          <p className="blog-lead">
            Histórias de gente que vive do próprio ofício e guias diretos para
            aproveitar cada canto da sua página. Escrito para quem atende sozinho
            e toca o negócio no dia a dia.
          </p>
        </div>
      </section>

      <section className="blog-trilhas" aria-label="O que você encontra aqui">
        <div className="trilha">
          <span className="trilha-num">01</span>
          <h2>Histórias reais</h2>
          <p>
            Quem transformou o perfil numa página e o trabalho num negócio, com o
            caminho que trilhou por dentro.
          </p>
        </div>
        <div className="trilha">
          <span className="trilha-num">02</span>
          <h2>Guias da página</h2>
          <p>
            O catálogo que vende, o horário que organiza a agenda e o botão de
            WhatsApp que aproxima o cliente.
          </p>
        </div>
      </section>

      {materias.length > 0 ? (
        <ul className="blog-lista">
          {materias.map((materia) => (
            <li key={materia.slug}>
              <Link href={`/blog/${materia.slug}`} className="materia-link">
                <time dateTime={materia.publicadoEm} className="materia-data">
                  {dataPorExtenso(materia.publicadoEm)}
                </time>
                <div>
                  <div className="materia-titulo">{materia.titulo}</div>
                  <p className="materia-resumo">{materia.resumo}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="blog-fecho">
        <p>
          {CADASTRO_ABERTO ? (
            <>
              A sua página começa com <em>o seu nome.</em>
            </>
          ) : (
            <>
              Conheça o <em>{NOME_PRODUTO}.</em>
            </>
          )}
        </p>
        <Link href={CADASTRO_ABERTO ? "/criar" : "/"} className="pill">
          {CADASTRO_ABERTO ? "Criar a minha página" : `Conhecer o ${NOME_PRODUTO}`}
        </Link>
      </section>
    </MolduraBlog>
  );
}
