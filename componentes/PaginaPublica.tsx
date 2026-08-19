import { BarraAcoes, BotaoAcao, respiroDaBarra } from "./BarraAcoes";
import { Contagem } from "./Contagem";
import { Capa } from "./Capa";
import { Catalogo } from "./Catalogo";
import { Endereco } from "./Endereco";
import { Galeria } from "./Galeria";
import { Horarios } from "./Horarios";
import { LinksExtras } from "./LinksExtras";
import { Rodape } from "./Rodape";
import { Divisor, Secao } from "./Secao";
import { acoesDoRodape } from "@/lib/acoes";
import { receitaDe } from "@/lib/categorias";
import { combinacao, FONTE_PADRAO, podeEscolherFonte } from "@/lib/fontes";
import { localBusiness } from "@/lib/jsonld";
import type { Negocio } from "@/lib/tipos";

/**
 * A pagina publica inteira. Na etapa 3 a rota /[slug] passa a chamar isto
 * com o negocio vindo do Supabase, e nada aqui precisa mudar.
 *
 * Nenhuma secao aparece sem conteudo. Se o dono nao preencheu, some.
 *
 * Dois desenhos, mesmo HTML. No celular e uma coluna so, com a barra de acao
 * presa embaixo, no alcance do polegar. A partir de 1024px vira duas colunas:
 * identidade, horario, endereco e acoes a esquerda, e o que a pessoa veio ver
 * (catalogo, fotos, links) a direita, com a coluna da esquerda acompanhando a
 * rolagem. Uma coluna estreita de 34rem centralizada num monitor de 27
 * polegadas parece celular esquecido no meio da tela, e o produto se vende
 * como presenca profissional.
 *
 * A troca e so de layout: nenhuma secao aparece, some ou muda de conteudo
 * entre os dois. Assim o que foi testado no celular continua valendo.
 */
export function PaginaPublica({
  negocio,
  urlBase,
  contar = false,
}: {
  negocio: Negocio;
  urlBase: string;
  /**
   * Liga a contagem de visitas e cliques.
   *
   * Só `app/[slug]/page.tsx` passa. A prévia do painel renderiza esta mesma
   * página, com os botões de verdade, e sem esta trava o dono inflaria os
   * próprios números só de conferir antes de publicar.
   */
  contar?: boolean;
}) {
  const temItens = negocio.itens.some((i) => i.ativo);
  const temGaleria = negocio.galeria.length > 0;
  const temLinks = negocio.links.length > 0;
  /*
   * A letra e conferida no render, e nao so na hora de salvar.
   *
   * O gatilho protege_cobranca devolve a fonte antiga num UPDATE de quem esta
   * no gratuito, mas o que ja esta gravado continua gravado. Entao quem
   * assinou, escolheu outra letra e deixou o plano vencer seguiria com ela
   * para sempre, porque ninguem mais toca na coluna. Com sete dias de teste
   * gratis, seriam sete dias comprando uma letra vitalicia.
   *
   * Conferir aqui nao apaga a escolha: a coluna guarda o que a pessoa
   * escolheu, e volta a valer no dia em que ela assinar de novo.
   */
  const fonte = combinacao(
    podeEscolherFonte(negocio.plano) ? negocio.fonte : FONTE_PADRAO,
  );
  const respiro = respiroDaBarra(negocio);
  const acoes = acoesDoRodape(negocio);

  /*
   * Quem vende pelo olho mostra o trabalho antes da lista de serviços: no
   * fotógrafo, na tatuagem e no crochê, a foto é o argumento e o catálogo vem
   * depois de a pessoa gostar do que viu. Quem vende por item mantém o
   * catálogo na frente. A ordem sai da categoria, e a página é a mesma nos
   * dois casos: só a sequência das duas seções muda.
   */
  const galeriaNaFrente = receitaDe(negocio.categoria).galeriaPrimeiro;

  const catalogo = (
    <>
      {temItens ? <Divisor /> : null}
      <Secao id="catalogo" titulo={negocio.tituloCatalogo} vazia={!temItens}>
        <Catalogo negocio={negocio} />
      </Secao>
    </>
  );

  const galeria = (
    <>
      {temGaleria ? <Divisor /> : null}
      <Secao id="galeria" titulo="Fotos" vazia={!temGaleria}>
        <Galeria negocio={negocio} />
      </Secao>
    </>
  );

  return (
    <div
      data-tema={negocio.tema}
      data-fonte={fonte.chave}
      data-conta={contar ? negocio.slug : undefined}
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

      <main
        className={`mx-auto w-full max-w-[34rem] overflow-hidden bg-superficie ${respiro} sm:my-8 sm:rounded-3xl sm:border sm:border-borda sm:shadow-[0_1px_3px_rgba(28,25,23,0.06),0_12px_36px_-12px_rgba(28,25,23,0.14)] lg:max-w-5xl lg:pb-0`}
      >
        <div className="lg:grid lg:grid-cols-[19rem_1fr] lg:items-start lg:gap-0">
          <div className="lg:col-span-2">
            <Capa negocio={negocio} apenasCapa />
          </div>

          {/*
            Coluna da identidade. No celular ela e simplesmente o comeco da
            pagina; no monitor acompanha a rolagem, entao horario, endereco e
            o botao de conversa continuam a vista enquanto a pessoa percorre o
            catalogo, que e onde a decisao acontece.
          */}
          <div className="lg:sticky lg:top-8 lg:self-start lg:border-r lg:border-borda lg:pb-8">
            <Capa negocio={negocio} apenasIdentidade />
            <Horarios negocio={negocio} />
            <Divisor />
            <Endereco negocio={negocio} />

            {acoes.length > 0 ? (
              <div className="hidden lg:block">
                <Divisor />
                <div className="flex flex-col gap-2.5 px-5 py-7">
                  {acoes.map((a, i) => (
                    <BotaoAcao key={a.rotulo} acao={a} principal={i === 0} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:min-w-0">
            {galeriaNaFrente ? (
              <>
                {galeria}
                {catalogo}
              </>
            ) : (
              <>
                {catalogo}
                {galeria}
              </>
            )}

            {temLinks ? <Divisor /> : null}
            <Secao id="links" titulo="Links" vazia={!temLinks}>
              <LinksExtras negocio={negocio} />
            </Secao>
          </div>
        </div>

        <div className="lg:border-t lg:border-borda">
          <Rodape negocio={negocio} />
        </div>
      </main>

      {/* No monitor as acoes ja estao na coluna da esquerda, sempre a vista. */}
      <div className="lg:hidden">
        <BarraAcoes negocio={negocio} />
      </div>

      {contar ? <Contagem /> : null}
    </div>
  );
}
