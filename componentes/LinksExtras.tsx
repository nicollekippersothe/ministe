import { IconeDoLink, IconeSeta } from "./Icones";
import type { Negocio } from "@/lib/tipos";

/**
 * Os links extras da página, numa chapa só.
 *
 * Eram N cartões idênticos empilhados, cada um com a própria moldura e o
 * próprio fundo, e a seção lia como lista de ajustes de aplicativo. Reunidos
 * numa chapa única, com um fio entre as linhas, eles leem como o quadro de
 * avisos que estão ali para ser: um objeto, várias linhas.
 *
 * A seta acompanha o toque do mouse em vez de ficar parada, e é ela que diz
 * que o destino fica fora desta página. O arredondamento e a passagem do mouse
 * moram no globals.css, junto do resto do desenho da página.
 */
export function LinksExtras({ negocio }: { negocio: Negocio }) {
  if (negocio.links.length === 0) return null;

  return (
    <ul className="chapa-lista rounded-2xl border border-borda bg-fundo">
      {negocio.links.map((link) => (
        <li key={link.id} className="border-t border-borda first:border-t-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="chapa flex min-h-14 items-center gap-3.5 px-4 py-3.5 text-texto"
          >
            <IconeDoLink
              icone={link.icone}
              className="h-[1.1rem] w-[1.1rem] shrink-0 text-destaque"
            />
            <span className="flex-1 text-[0.95rem] font-medium">
              {link.rotulo}
            </span>
            <IconeSeta className="seta h-4 w-4 shrink-0 text-suave" />
            <span className="sr-only">, abre em outra aba</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
