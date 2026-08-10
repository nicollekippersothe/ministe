import Image from "next/image";
import type { Negocio } from "@/lib/tipos";

export function Galeria({ negocio }: { negocio: Negocio }) {
  if (negocio.galeria.length === 0) return null;

  return (
    <ul className="grid grid-cols-3 gap-1.5">
      {negocio.galeria.map((foto) => (
        <li key={foto.url} className="overflow-hidden rounded-lg bg-borda">
          <Image
            src={foto.url}
            alt={foto.alt}
            width={foto.largura}
            height={foto.altura}
            sizes="(max-width: 640px) 32vw, 175px"
            className="aspect-square w-full object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
