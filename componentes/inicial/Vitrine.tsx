import Image from "next/image";
import Link from "next/link";
import { VITRINE } from "@/lib/exemplos";

/**
 * Quatro páginas prontas, de tipos de negócio bem diferentes.
 *
 * Existe para responder a dúvida que aparece em dois segundos na cabeça de
 * quem chega: "serve para o meu caso?". Cada cartão leva para a página de
 * verdade, que dá para abrir e usar.
 */
export function Vitrine() {
  return (
    <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
      {VITRINE.map(({ negocio, tipo }) => (
        <li key={negocio.slug} className="w-[15rem] shrink-0 snap-start sm:w-auto">
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
