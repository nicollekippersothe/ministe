import Image from "next/image";
import type { Negocio } from "@/lib/tipos";

export function Capa({
  negocio,
  nivel = 1,
  apenasCapa = false,
  apenasIdentidade = false,
}: {
  negocio: Negocio;
  /** 2 na prévia da tela inicial, para não existirem dois h1 na mesma página. */
  nivel?: 1 | 2;
  /**
   * No monitor a capa atravessa as duas colunas e a identidade mora só na da
   * esquerda, então a página pede as duas metades separadas. No celular ela
   * continua sendo chamada inteira, de uma vez.
   */
  apenasCapa?: boolean;
  apenasIdentidade?: boolean;
}) {
  const temLogo = Boolean(negocio.logo);
  const Titulo = nivel === 1 ? "h1" : "h2";
  const mostrarCapa = !apenasIdentidade;
  const mostrarIdentidade = !apenasCapa;

  return (
    <header className="relative">
      {/*
        No monitor a capa vira faixa. Mantida em 16/9 dentro de um container
        de 5xl ela passa de 500px de altura e empurra o negocio para fora da
        primeira tela, que e o oposto do que uma capa deveria fazer.
      */}
      {mostrarCapa && negocio.capa ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-borda lg:aspect-[64/15]">
          <Image
            src={negocio.capa.url}
            alt={negocio.capa.alt}
            width={negocio.capa.largura}
            height={negocio.capa.altura}
            priority
            fetchPriority="high"
            sizes="(max-width: 560px) 100vw, (max-width: 1024px) 560px, 1024px"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      {/*
        Centralizado no celular, alinhado a esquerda no monitor: a identidade
        passa a morar na coluna estreita, e texto centralizado numa coluna de
        19rem le pior do que alinhado.
      */}
      {mostrarIdentidade ? (
      <div
        className={`flex flex-col items-center px-5 pb-2 text-center lg:items-start lg:text-left ${
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

        <Titulo className="titulo mt-3 text-[1.9rem] leading-[1.15] text-balance text-texto">
          {negocio.nome}
        </Titulo>

        {negocio.frase ? (
          <p className="mt-2 max-w-[32ch] text-[0.95rem] leading-relaxed text-balance text-suave">
            {negocio.frase}
          </p>
        ) : null}
      </div>
      ) : null}
    </header>
  );
}
