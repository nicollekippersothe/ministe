import { IconeDoLink, IconeSeta } from "./Icones";
import type { Negocio } from "@/lib/tipos";

export function LinksExtras({ negocio }: { negocio: Negocio }) {
  if (negocio.links.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2.5">
      {negocio.links.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-borda bg-fundo px-4 py-3.5 font-medium text-texto transition-colors hover:border-destaque/40"
          >
            <IconeDoLink icone={link.icone} className="h-5 w-5 text-destaque" />
            <span className="flex-1">{link.rotulo}</span>
            <IconeSeta className="h-4 w-4 text-suave" />
            <span className="sr-only">, abre em outra aba</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
