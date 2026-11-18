import Image from "next/image";
import Link from "next/link";
import { BotaoAcao } from "@/componentes/BarraAcoes";
import { Capa } from "@/componentes/Capa";
import { Catalogo } from "@/componentes/Catalogo";
import { Marca } from "@/componentes/Marca";
import { Secao } from "@/componentes/Secao";
import { Aparencia, type OpcaoDeLetra } from "@/componentes/inicial/Aparencia";
import { Cartela } from "@/componentes/inicial/Cartela";
import { CampoAbertura } from "@/componentes/inicial/CampoAbertura";
import { corpo, titulo } from "@/componentes/inicial/letras";
import { Planos } from "@/componentes/inicial/Planos";
import { Telefone } from "@/componentes/inicial/Telefone";
import { acoesDoRodape } from "@/lib/acoes";
import { doceria, ilustracao, tatuagem, VITRINE } from "@/lib/exemplos";
import { FONTE_PADRAO, LISTA_COMBINACOES } from "@/lib/fontes";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { DIAS_DE_TESTE, ITENS_NO_CATALOGO } from "@/lib/pagamento/precos";
import { CADASTRO_ABERTO } from "@/lib/site";

/**
 * A tela inicial, inteira no servidor.
 *
 * As peças são as da página do cliente (`Telefone`, `Capa`, `Catalogo`,
 * `BotaoAcao`), com os dados dos exemplos, então a propaganda não consegue
 * divergir do produto. Só duas ilhas rodam no navegador: a placa de endereço e
 * o console de aparência. Todo o resto é HTML.
 *
 * O movimento é de uma língua só: o `.surge` (opacidade e 12px de deslocamento,
 * ligado ao progresso da rolagem pelo próprio navegador, sem script), a rolagem
 * lenta do celular do herói e a troca de cor do console. Cada um some para quem
 * pediu menos movimento no sistema, e nenhum esconde conteúdo onde o CSS novo
 * não chega.
 *
 * Os preços e limites saem de `lib/pagamento/precos`, a tabela que o checkout
 * usa. Os fatos da faixa abaixo do herói também: nenhum número é digitado aqui.
 */

const FATOS = [
  { numero: "R$ 0", texto: "para publicar a página, com endereço próprio" },
  {
    numero: `${ITENS_NO_CATALOGO.gratuito} itens`,
    texto: `de catálogo no plano grátis, e ${ITENS_NO_CATALOGO.pago} no Completo`,
  },
  { numero: "5 temas", texto: "e 5 texturas para a página ficar com a sua cara" },
  { numero: `${DIAS_DE_TESTE} dias`, texto: "de teste do plano Completo, no cartão de crédito" },
];

const PERGUNTAS = [
  {
    quem: "O que você faz",
    texto: "Nome, frase e foto de capa. Quem abre entende o seu trabalho antes de rolar.",
  },
  {
    quem: "Quanto custa",
    texto: "Catálogo com foto e preço, ou o preço guardado para combinar pela conversa.",
  },
  {
    quem: "Quando atende",
    texto: "Os horários valem no seu fuso, e a página calcula se está aberto agora.",
  },
  {
    quem: "Onde fica",
    texto: "Endereço com botão de mapa. Quem atende em casa mostra só a cidade.",
  },
  {
    quem: "Como chamar",
    texto: "Um botão de WhatsApp que abre a conversa com a mensagem já escrita, e o item escolhido junto.",
  },
];

/** As cinco letras, com a classe que cada uma aplica, vindas do servidor. */
const LETRAS: OpcaoDeLetra[] = LISTA_COMBINACOES.map((c) => ({
  chave: c.chave,
  nome: c.nome,
  classe: c.classe,
}));

function Secao2({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-6 py-16 lg:py-20 ${className}`}>
      {children}
    </section>
  );
}

export function Landing() {
  const acaoDemo = acoesDoRodape(ilustracao)[0];
  const acaoCatalogo = acoesDoRodape(doceria)[0];

  return (
    <div
      data-tema="areia"
      className={`${titulo.variable} ${corpo.variable} min-h-dvh bg-fundo font-[family-name:var(--f-venda-corpo)] text-texto`}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Marca />
        <nav aria-label="Principal" className="flex items-center gap-2">
          {CADASTRO_ABERTO ? (
            <Link
              href="/entrar"
              className="inline-flex min-h-11 items-center px-3 text-base font-medium text-texto underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          ) : null}
          <Link
            href="/criar"
            className="inline-flex min-h-11 items-center rounded-full bg-texto px-5 text-base font-semibold text-fundo transition-opacity hover:opacity-90"
          >
            Criar grátis
          </Link>
        </nav>
      </header>

      <main>
        {/* ====== Herói: a promessa e o produto lado a lado ====== */}
        <section
          id="topo"
          className="mx-auto grid w-full max-w-6xl gap-12 px-6 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center lg:gap-20 lg:pt-16 lg:pb-20"
        >
          <div>
            <h1 className="titulo-venda max-w-[16ch] text-[38px] text-balance sm:text-[64px]">
              O seu trabalho numa página com preço, horário e WhatsApp.
            </h1>
            <p className="mt-6 max-w-[34rem] text-xl leading-snug text-suave">
              Você escreve o seu nome e a página já vem montada: o que você faz, quanto custa,
              quando atende e um botão que abre a conversa com a mensagem escrita.
            </p>
            <div className="mt-8 max-w-[34rem]">
              <CampoAbertura rotulo="Criar grátis" />
            </div>
          </div>

          <figure className="flex flex-col gap-4">
            <div className="rolando-sempre">
              <Telefone negocio={tatuagem} />
            </div>
            <figcaption className="mx-auto w-full max-w-[19rem]">
              <Cartela negocio={tatuagem} tipo="Exemplo que montamos" />
            </figcaption>
          </figure>
        </section>

        {/* ====== Fatos: o que dá para conferir ====== */}
        <div className="border-y border-borda">
          <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-6 py-8 lg:grid-cols-4">
            {FATOS.map((f) => (
              <div key={f.numero}>
                <dt className="titulo-venda text-[26px]">{f.numero}</dt>
                <dd className="mt-1 max-w-[16rem] text-sm leading-snug text-suave">{f.texto}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ====== O que fica na página: cinco perguntas e a resposta de verdade ====== */}
        <Secao2 id="dentro">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <div className="surge">
              <h2 className="titulo-venda max-w-[14ch] text-[26px] text-balance sm:text-[38px]">
                Cada parte da página responde uma pergunta de quem chega.
              </h2>
              <ul className="mt-8 flex flex-col">
                {PERGUNTAS.map((p) => (
                  <li key={p.quem} className="border-t border-borda py-4 first:border-t-0 first:pt-0">
                    <p className="text-base font-semibold">{p.quem}</p>
                    <p className="mt-1 text-base leading-snug text-suave">{p.texto}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surge flex flex-col gap-3">
              <div
                data-tema={doceria.tema}
                className="janela h-[34rem] rounded-2xl border border-borda bg-superficie"
              >
                <Secao id="demo-catalogo" titulo={doceria.tituloCatalogo}>
                  <Catalogo negocio={doceria} />
                </Secao>
              </div>
              {acaoCatalogo ? (
                <div data-tema={doceria.tema}>
                  <BotaoAcao acao={acaoCatalogo} principal interativo={false} />
                </div>
              ) : null}
              <p className="text-sm text-suave">
                O catálogo da {doceria.nome}, um exemplo que montamos. Cada item tem o botão que
                abre a conversa com o nome dele.
              </p>
            </div>
          </div>
        </Secao2>

        {/* ====== Aparência: a mesma página, trocando tema, textura e letra ====== */}
        <div className="border-y border-borda bg-superficie">
          <Secao2 id="aparencia">
            <div className="surge mb-12 max-w-[40rem]">
              <h2 className="titulo-venda text-[26px] text-balance sm:text-[38px]">
                A mesma página, com a cara de quem assina.
              </h2>
              <p className="mt-4 text-xl leading-snug text-suave">
                Troque o tema e a textura aqui embaixo, na própria página de exemplo, e veja ela se
                repintar. Tema e textura valem no plano grátis. A letra é do plano Completo.
              </p>
            </div>

            <Aparencia
              inicial={{ tema: ilustracao.tema, fundo: ilustracao.fundo, fonte: FONTE_PADRAO }}
              letras={LETRAS}
            >
              <div
                data-pagina-demo
                data-tema={ilustracao.tema}
                data-fonte={FONTE_PADRAO}
                className={`marca ${LETRAS.find((l) => l.chave === FONTE_PADRAO)?.classe ?? ""}`}
              >
                <div className="cartao-demo janela h-[26rem] rounded-2xl sm:h-[36rem] border border-borda bg-superficie">
                  <Capa negocio={ilustracao} nivel={2} />
                  <Secao id="demo-servicos" titulo={ilustracao.tituloCatalogo}>
                    <Catalogo negocio={ilustracao} />
                  </Secao>
                </div>
                {acaoDemo ? (
                  <div className="mt-3">
                    <BotaoAcao acao={acaoDemo} principal interativo={false} />
                  </div>
                ) : null}
              </div>
            </Aparencia>
          </Secao2>
        </div>

        {/* ====== Ofícios: a fileira de exemplos que passa sozinha ====== */}
        <section id="oficios" className="py-16 lg:py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="surge max-w-[40rem]">
              <h2 className="titulo-venda text-[26px] text-balance sm:text-[38px]">
                Serve para quem vende o próprio trabalho.
              </h2>
              <p className="mt-4 text-xl leading-snug text-suave">
                Sete exemplos que montamos para mostrar como fica. Cada um abre a página inteira,
                do jeito que o cliente dela vê.
              </p>
            </div>
          </div>

          <div className="passa mt-12">
            <ul className="passa-trilho">
              {[0, 1].map((copia) =>
                VITRINE.map(({ negocio, tipo }, i) => (
                  <li
                    key={`${copia}-${negocio.slug}`}
                    aria-hidden={copia === 1 ? true : undefined}
                    className={`w-[16rem] shrink-0 sm:w-[18rem] ${i % 2 === 1 ? "mt-8" : ""}`}
                  >
                    <Link
                      href={`/${negocio.slug}`}
                      tabIndex={copia === 1 ? -1 : undefined}
                      aria-label={`Abrir a página de exemplo de ${negocio.nome}, ${tipo}, em ${negocio.cidade}`}
                      className="group block"
                    >
                      {negocio.capa ? (
                        <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-borda">
                          <Image
                            src={negocio.capa.url}
                            alt=""
                            width={negocio.capa.largura}
                            height={negocio.capa.altura}
                            sizes="288px"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : null}
                      <p className="mt-3 text-base font-semibold">{tipo}</p>
                      <p className="text-sm text-suave">
                        {negocio.nome}, {negocio.cidade}
                      </p>
                    </Link>
                  </li>
                )),
              )}
            </ul>
          </div>
        </section>

        {/* ====== Preço ====== */}
        <div className="border-t border-borda">
          <Secao2 id="preco">
            <div className="surge mb-12 max-w-[40rem]">
              <h2 className="titulo-venda text-[26px] text-balance sm:text-[38px]">
                Publicar é grátis. O Completo abre a letra e os números inteiros.
              </h2>
            </div>
            <Planos />
            <p className="mt-8 text-sm">
              <Link href="/precos" className="font-medium text-destaque underline underline-offset-4">
                Ver a comparação completa
              </Link>
            </p>
          </Secao2>
        </div>

        {/* ====== Fecho ====== */}
        <Secao2 id="comecar" className="pb-24">
          <div className="surge max-w-[40rem]">
            <h2 className="titulo-venda text-[38px] text-balance sm:text-[64px]">
              Escolha o seu endereço.
            </h2>
            <p className="mt-4 text-xl leading-snug text-suave">
              {DOMINIO_PUBLICO}/seunome leva até a sua página, e ela já nasce montada.
            </p>
            <div className="mt-8">
              <CampoAbertura rotulo="Criar grátis" />
            </div>
          </div>
        </Secao2>
      </main>

      <footer className="border-t border-borda">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Marca />
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-2">
            {[
              ["/precos", "Preços"],
              ["/blog", "Blog"],
              ["/termos", "Termos"],
              ["/privacidade", "Privacidade"],
            ].map(([href, rotulo]) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center px-2 text-sm text-suave underline-offset-4 hover:text-texto hover:underline"
              >
                {rotulo}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
