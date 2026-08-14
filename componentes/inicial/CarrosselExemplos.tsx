import Link from "next/link";
import { Carrossel } from "@/componentes/inicial/Carrossel";
import { Telefone } from "@/componentes/inicial/Telefone";
import { VITRINE } from "@/lib/exemplos";

/**
 * As páginas de exemplo passando, uma de cada vez.
 *
 * Mora no topo de "Tudo o que o seu negócio precisa mostrar", antes da grade
 * de recursos. A grade já mistura peças de negócios diferentes, mas nenhum
 * cartão diz isso: o nome só aparece pequeno, dentro da prévia de link. Aqui
 * o negócio é o assunto da vez, com nome, ofício e o que a página resolve
 * para aquele tipo específico.
 *
 * O aparelho é o mesmo componente da abertura, com os mesmos dados de
 * verdade, então herda de graça a rolagem, o respeito a menos movimento e o
 * fato de nunca divergir do produto. Só a largura do quadro muda: a abertura
 * pede um aparelho sozinho, e aqui cabe o aparelho ao lado do texto.
 */
export function CarrosselExemplos() {
  return (
    <Carrossel
      largura="max-w-3xl"
      item="negócio"
      /*
       * 19.125rem é o centro do aparelho, não do quadro: 2rem do respiro
       * (py-8) do cartão mais metade dos 34.25rem que o Telefone ocupa (as
       * 33rem da tela mais o aro de 0.625rem dos dois lados). Abaixo de lg o
       * cartão empilha aparelho e texto, e aí é o aparelho que precisa da
       * seta ao lado. A partir de lg os dois ficam lado a lado, o cartão fica
       * bem mais baixo, e o centro do quadro volta a ser o lugar certo.
       */
      topoSeta="top-[19.125rem] lg:top-1/2"
    >
      {VITRINE.map(({ negocio, tipo, resolve }) => (
        <div
          key={negocio.slug}
          className="flex flex-col items-center gap-8 rounded-[2rem] border border-borda bg-superficie px-6 py-8 sm:px-8 lg:flex-row lg:items-stretch lg:gap-10 lg:px-12 lg:py-10"
        >
          <div className="shrink-0">
            <Telefone negocio={negocio} leve prioridade={false} />
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-destaque/10 px-3.5 py-1.5 text-[0.8rem] font-semibold tracking-[-0.01em] text-destaque">
              {tipo}
            </span>
            <p className="mt-4 text-xl font-semibold tracking-[-0.02em] text-texto">
              {negocio.nome}
            </p>
            <p className="mt-3 leading-relaxed text-suave text-pretty">
              {resolve}
            </p>
            <Link
              href={`/${negocio.slug}`}
              className="mt-6 w-fit text-[0.95rem] font-semibold text-destaque underline-offset-4 hover:underline"
            >
              Abrir a página
            </Link>
          </div>
        </div>
      ))}
    </Carrossel>
  );
}
