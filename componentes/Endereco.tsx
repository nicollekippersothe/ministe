import { IconePin, IconeSeta } from "./Icones";
import type { Negocio } from "@/lib/tipos";

export function Endereco({ negocio }: { negocio: Negocio }) {
  if (!negocio.endereco && !negocio.cidade) return null;

  const cidadeEstado = [negocio.cidade, negocio.estado]
    .filter(Boolean)
    .join(", ");
  const linhas = [negocio.endereco, cidadeEstado, negocio.cep].filter(Boolean);

  const conteudo = (
    <>
      <IconePin className="mt-0.5 h-5 w-5 shrink-0 text-destaque" />
      <span className="flex-1 text-sm leading-relaxed text-suave">
        {linhas.map((linha) => (
          <span key={linha} className="block">
            {linha}
          </span>
        ))}
      </span>
      {negocio.mapsUrl ? (
        <IconeSeta className="mt-0.5 h-4 w-4 shrink-0 text-suave" />
      ) : null}
    </>
  );

  return (
    <div className="px-5 py-6">
      {negocio.mapsUrl ? (
        <a
          href={negocio.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-xl border border-borda bg-fundo p-4 transition-colors hover:border-destaque/40"
        >
          {conteudo}
          <span className="sr-only">Abrir no mapa, abre em outra aba</span>
        </a>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-borda bg-fundo p-4">
          {conteudo}
        </div>
      )}
    </div>
  );
}
