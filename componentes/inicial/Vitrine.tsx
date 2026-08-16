import Image from "next/image";
import Link from "next/link";
import { VITRINE } from "@/lib/exemplos";

/**
 * As páginas prontas, de tipos de negócio bem diferentes.
 *
 * Existe para responder a dúvida que aparece em dois segundos na cabeça de
 * quem chega: "serve para o meu caso?". Cada cartão leva para a página de
 * verdade, que dá para abrir e usar.
 *
 * O layout aceita qualquer quantidade de exemplos. Grade de colunas fixas
 * dependia de a conta fechar: os sete de hoje em quatro colunas deixavam a
 * segunda fileira com três cartões e um vão à direita, e cada exemplo novo
 * mudava onde o vão caía. Aqui os cartões têm todos a mesma largura e a
 * fileira incompleta fica centrada, então o oitavo exemplo entra sem ninguém
 * precisar lembrar de contar as colunas.
 */
export function Vitrine() {
  return (
    <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
      {VITRINE.map(({ negocio, tipo }) => (
        <li
          key={negocio.slug}
          /* Dois por fileira a partir de sm, quatro no monitor, descontando o gap. */
          className="w-[15rem] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
        >
          <Link
            href={`/${negocio.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-borda bg-superficie"
          >
            {negocio.capa ? (
              <Image
                src={negocio.capa.url}
                alt=""
                width={negocio.capa.largura}
                height={negocio.capa.altura}
                sizes="(max-width: 640px) 60vw, 260px"
                className="aspect-[16/10] w-full object-cover"
              />
            ) : null}
            <div className="flex flex-1 flex-col gap-1 px-4 py-3.5">
              <span className="text-xs font-semibold tracking-[0.12em] text-destaque uppercase">
                {tipo}
              </span>
              <span className="font-semibold text-texto">{negocio.nome}</span>
              <span className="text-sm leading-snug text-suave">
                {negocio.cidade}
                {negocio.estado ? `, ${negocio.estado}` : null}
              </span>
              <span className="mt-2 text-sm font-medium text-destaque group-hover:underline">
                Abrir a página
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
