import Image from "next/image";
import { categoriaPorId } from "@/lib/categorias";
import { posicaoDoFoco } from "@/lib/supabase/imagens";
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

  /*
   * A legenda de parede: o ofício e a cidade, como a plaquinha ao pé de uma
   * obra numa mostra. É a mesma linha que o herói da tela inicial usa, trazida
   * para a página de verdade, e a que dá o ar de exposição. O ofício sai do que
   * a pessoa escreveu quando marcou "outro", senão do nome da categoria que ela
   * escolheu; some inteira quando nem um nem outro existe, sem virar rótulo
   * vazio.
   */
  const oficio =
    negocio.categoriaLivre ?? categoriaPorId(negocio.categoria)?.nome ?? null;
  const legenda = [oficio, negocio.cidade].filter(Boolean).join(" · ");

  return (
    <header className="relative">
      {/*
        No monitor a capa vira faixa. Mantida em 16/9 dentro de um container
        de 5xl ela passa de 500px de altura e empurra o negocio para fora da
        primeira tela, que e o oposto do que uma capa deveria fazer.

        16 por 5 e o meio termo medido: da 320px de altura num container de
        1024, e a identidade inteira (retrato, nome, frase, selo, endereco e os
        botoes) ainda cabe na primeira tela de um monitor de 900. Em 64 por 15,
        que era a proporcao anterior, a faixa tinha 240px e lia como cabecalho
        de rede social, com a foto espremida a ponto de nao se ver o que e.
      */}
      {mostrarCapa && negocio.capa ? (
        /* O ponto que a dona escolheu no painel manda no corte, e o mesmo par
           de números serve as duas molduras desta faixa: 16 por 9 no celular e
           16 por 5 no monitor. Capa sem ponto gravado sai centralizada, que é
           o corte de sempre. */
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-borda lg:aspect-[16/5]">
          <Image
            src={negocio.capa.url}
            alt={negocio.capa.alt}
            width={negocio.capa.largura}
            height={negocio.capa.altura}
            priority
            fetchPriority="high"
            sizes="(max-width: 560px) 100vw, (max-width: 1024px) 560px, 1152px"
            style={{ objectPosition: posicaoDoFoco(negocio.capa.foco) }}
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
          className={`flex flex-col items-center px-5 pb-3 text-center lg:items-start lg:text-left ${
            negocio.capa ? "" : "pt-8"
          }`}
        >
          {temLogo && negocio.logo ? (
            /*
              O retrato sobe metade da propria altura para cima da capa, e por
              isso a margem negativa acompanha o tamanho: 44 de 88 no celular,
              52 de 104 no monitor. Fora de sincronia, ele encosta na foto de um
              lado e sobra do outro.
            */
            <div
              className={`relative ${
                negocio.capa ? "-mt-11 lg:-mt-13" : ""
              } retrato h-22 w-22 overflow-hidden rounded-full border-4 border-superficie bg-superficie lg:h-26 lg:w-26`}
            >
              <Image
                src={negocio.logo.url}
                alt={negocio.logo.alt}
                width={negocio.logo.largura}
                height={negocio.logo.altura}
                loading="eager"
                sizes="(min-width: 1024px) 104px, 88px"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          {/*
            A plaquinha da parede, acima do nome: um fio curto de latão e, sob
            ele, o ofício e a cidade em maiúsculas espaçadas, como a legenda de
            uma obra. O latão vem de `--c-ouro`, que existe em todos os temas e
            é o mesmo detalhe do herói da tela inicial.
          */}
          {legenda ? (
            <div className="mt-4 flex flex-col items-center gap-2 lg:items-start">
              <span
                aria-hidden
                className="block h-px w-8"
                style={{ background: "var(--c-ouro)" }}
              />
              <p className="text-[0.72rem] font-semibold tracking-[0.16em] text-suave uppercase">
                {legenda}
              </p>
            </div>
          ) : null}

          {/*
            O nome e a unica aparicao da letra de titulo do tema na pagina, e
            por isso ele tem escala de verdade. Escolher a letra e recurso pago,
            e ela precisa se ver de longe para valer o que custa.
          */}
          <Titulo
            className={`titulo ${
              legenda ? "mt-2.5" : "mt-3.5"
            } text-[2.05rem] leading-[1.1] text-balance text-texto lg:text-[2.5rem]`}
          >
            {negocio.nome}
          </Titulo>

          {negocio.frase ? (
            <p className="mt-2.5 max-w-[34ch] text-[1rem] leading-relaxed text-balance text-suave">
              {negocio.frase}
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
