import { IconeSeta } from "./Icones";
import type { Negocio } from "@/lib/tipos";

/*
 * O endereço deixou de ser o cartão emoldurado, que lia como um item de ajustes
 * do aplicativo, e virou a legenda de parede: o fio de latão, o rótulo "Onde me
 * encontrar" em maiúsculas espaçadas e, sob ele, as linhas do endereço, como a
 * ficha de localização de uma mostra. O mapa vira um link discreto no fim, e não
 * uma caixa inteira clicável, para o endereço poder ser lido e copiado.
 */
export function Endereco({ negocio }: { negocio: Negocio }) {
  if (!negocio.endereco && !negocio.cidade) return null;

  const cidadeEstado = [negocio.cidade, negocio.estado]
    .filter(Boolean)
    .join(", ");
  const linhas = [negocio.endereco, cidadeEstado, negocio.cep].filter(Boolean);

  return (
    <div className="px-5 py-6">
      <span
        aria-hidden
        className="block h-px w-8"
        style={{ background: "var(--c-ouro)" }}
      />
      <p className="mt-2.5 text-[0.72rem] font-semibold tracking-[0.16em] text-suave uppercase">
        Onde me encontrar
      </p>

      <address className="mt-3 text-sm leading-relaxed text-texto not-italic">
        {linhas.map((linha) => (
          <span key={linha} className="block">
            {linha}
          </span>
        ))}
      </address>

      {negocio.mapsUrl ? (
        <a
          href={negocio.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 -mx-2 inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium text-destaque underline-offset-4 hover:underline focus-visible:underline"
        >
          Ver no mapa
          <IconeSeta className="h-3.5 w-3.5" />
          <span className="sr-only">, abre em outra aba</span>
        </a>
      ) : null}
    </div>
  );
}
