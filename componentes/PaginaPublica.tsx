import { BarraAcoes } from "./BarraAcoes";
import { Capa } from "./Capa";
import { Catalogo } from "./Catalogo";
import { Endereco } from "./Endereco";
import { Galeria } from "./Galeria";
import { Horarios } from "./Horarios";
import { LinksExtras } from "./LinksExtras";
import { Rodape } from "./Rodape";
import { Divisor, Secao } from "./Secao";
import { combinacao } from "@/lib/fontes";
import { localBusiness } from "@/lib/jsonld";
import type { Negocio } from "@/lib/tipos";

/**
 * A pagina publica inteira. Na etapa 3 a rota /[slug] passa a chamar isto
 * com o negocio vindo do Supabase, e nada aqui precisa mudar.
 *
 * Nenhuma secao aparece sem conteudo. Se o dono nao preencheu, some.
 */
export function PaginaPublica({
  negocio,
  urlBase,
}: {
  negocio: Negocio;
  urlBase: string;
}) {
  const temItens = negocio.itens.some((i) => i.ativo);
  const fonte = combinacao(negocio.fonte);

  return (
    <div
      data-tema={negocio.tema}
      data-fonte={fonte.chave}
      className={`marca min-h-dvh bg-fundo ${fonte.classe}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusiness(negocio, urlBase)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      <main className="mx-auto w-full max-w-[34rem] overflow-hidden bg-superficie pb-24 sm:my-8 sm:rounded-3xl sm:border sm:border-borda sm:shadow-[0_1px_3px_rgba(28,25,23,0.06),0_12px_36px_-12px_rgba(28,25,23,0.14)]">
        <Capa negocio={negocio} />
        <Horarios negocio={negocio} />
        <Divisor />
        <Endereco negocio={negocio} />

        {temItens ? <Divisor /> : null}
        <Secao id="catalogo" titulo={negocio.tituloCatalogo} vazia={!temItens}>
          <Catalogo negocio={negocio} />
        </Secao>

        {negocio.galeria.length > 0 ? <Divisor /> : null}
        <Secao id="galeria" titulo="Fotos" vazia={negocio.galeria.length === 0}>
          <Galeria negocio={negocio} />
        </Secao>

        {negocio.links.length > 0 ? <Divisor /> : null}
        <Secao id="links" titulo="Links" vazia={negocio.links.length === 0}>
          <LinksExtras negocio={negocio} />
        </Secao>

        <Rodape negocio={negocio} />
      </main>

      <BarraAcoes negocio={negocio} />
    </div>
  );
}
