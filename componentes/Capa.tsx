import Image from "next/image";
import type { Negocio } from "@/lib/tipos";

export function Capa({ negocio }: { negocio: Negocio }) {
  const temLogo = Boolean(negocio.logo);

  return (
    <header className="relative">
      {negocio.capa ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-borda">
          <Image
            src={negocio.capa.url}
            alt={negocio.capa.alt}
            width={negocio.capa.largura}
            height={negocio.capa.altura}
            priority
            fetchPriority="high"
            sizes="(max-width: 560px) 100vw, 560px"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div
        className={`flex flex-col items-center px-5 pb-2 text-center ${
          negocio.capa ? "" : "pt-8"
        }`}
      >
        {temLogo && negocio.logo ? (
          <div
            className={`relative ${
              negocio.capa ? "-mt-11" : ""
            } h-22 w-22 overflow-hidden rounded-full border-4 border-superficie bg-superficie shadow-[0_2px_10px_rgba(28,25,23,0.12)]`}
          >
            <Image
              src={negocio.logo.url}
              alt={negocio.logo.alt}
              width={negocio.logo.largura}
              height={negocio.logo.altura}
              loading="eager"
              sizes="88px"
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <h1 className="titulo mt-3 text-[1.9rem] leading-[1.15] text-balance text-texto">
          {negocio.nome}
        </h1>

        {negocio.frase ? (
          <p className="mt-2 max-w-[32ch] text-[0.95rem] leading-relaxed text-balance text-suave">
            {negocio.frase}
          </p>
        ) : null}
      </div>
    </header>
  );
}
