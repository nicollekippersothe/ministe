import type { Metadata } from "next";
import Link from "next/link";
import { CampoAbertura } from "@/componentes/inicial/CampoAbertura";
import { Carrossel } from "@/componentes/inicial/Carrossel";
import { Cartela } from "@/componentes/inicial/Cartela";
import { Mosaico } from "@/componentes/inicial/Mosaico";
import { Planos } from "@/componentes/inicial/Planos";
import { Salas, type Sala } from "@/componentes/inicial/Salas";
import { Telefone } from "@/componentes/inicial/Telefone";
import { Marca } from "@/componentes/Marca";
import { IconeEntrar } from "@/componentes/Icones";
import { combinacao } from "@/lib/fontes";
import { NOME_PRODUTO } from "@/lib/marca";
import { Vitrine } from "@/componentes/inicial/Vitrine";
import { porSlug } from "@/lib/dados";
import { CADASTRO_ABERTO, urlBase } from "@/lib/site";
import {
  atelie,
  canto,
  doceria,
  ilustracao,
  psicologia,
  tatuagem,
} from "@/lib/exemplos";

export const revalidate = 3600;

/*
 * O título e a descrição carregam a palavra que a pessoa digita no Google
 * (página de negócio, catálogo, WhatsApp), e não a metáfora da marca: ninguém
 * busca "porta" nem "sala". O Open Graph e o Twitter card fazem o link colado no
 * WhatsApp chegar com prévia em vez de retângulo cinza, que é justamente o que o
 * produto vende. A imagem sai de `app/opengraph-image.tsx`, ao lado desta rota.
 */
const TITULO_OG = `${NOME_PRODUTO}, a página do seu negócio`;
const DESCRICAO_OG =
  "Catálogo com preço, horário, galeria e botão de WhatsApp, num endereço com o seu nome. Grátis para publicar.";

export const metadata: Metadata = {
  title: `${NOME_PRODUTO} | Página do seu negócio com catálogo e WhatsApp`,
  description:
    "Crie a página do seu negócio em minutos: catálogo com preço, horário, galeria e botão de WhatsApp. Endereço com o seu nome. Grátis para publicar.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: urlBase,
    siteName: NOME_PRODUTO,
    title: TITULO_OG,
    description: DESCRICAO_OG,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO_OG,
    description: DESCRICAO_OG,
  },
};

/*
 * Benefícios.
 *
 * Nenhum destes é sobre o que a página tem: isso já está no mosaico, mostrado
 * com as peças de verdade. Aqui é o que muda para o dono depois de publicada,
 * que é a parte que não dá para ver na tela.
 *
 * Os dois primeiros são a diferença para o que a pessoa já usa hoje, dita sem
 * citar ninguém: uma lista de links só atende quem já chegou.
 *
 * Eram cinco e numerados de 01 a 05. A numeração saiu porque a lista não tem
 * ordem nenhuma, e numerar o que não é sequência é enfeite com cara de método.
 * O quinto saiu porque "você responde e a página se monta" já é um cartão do
 * mosaico, com o cadastro de verdade à vista.
 */
const BENEFICIOS = [
  {
    titulo: "Encontrada por quem procura agora",
    texto:
      "A marcação que o Google lê sai pronta: nome, categoria, cidade, horário e o que você oferece. Uma lista de links atende quem já chegou até você. Esta atende também quem ainda está atrás do serviço.",
  },
  {
    titulo: "Um endereço para colocar em tudo",
    texto:
      "Bio, anúncio pago, cartão, assinatura de e-mail. Quem toca cai direto no seu catálogo.",
  },
  {
    titulo: "Editou, já está no ar",
    texto:
      "Peça nova, ou o horário do feriado é outro? Você altera do celular e quem abrir em seguida já vê.",
  },
  {
    titulo: "O endereço é seu",
    texto:
      "As redes sociais mudam de regra e de alcance quando querem. O seu endereço fica onde está, com o mesmo nome, e continua abrindo.",
  },
];

const PASSOS = [
  {
    titulo: "Escreva o nome na placa",
    texto: "Se o endereço estiver livre, ele passa a ser seu na mesma hora.",
  },
  {
    titulo: "Responda o essencial",
    texto:
      "O que você vende, por quanto, quando atende e por onde falam com você.",
  },
  {
    titulo: "Abra a porta",
    texto:
      "O endereço fica pronto para colar na bio, no anúncio, no cartão e em toda conversa que termina com alguém pedindo o seu contato.",
  },
];

/*
 * As duas salas.
 *
 * A separação é a mesma que o produto já faz sozinho: a categoria escolhida no
 * cadastro decide se a página abre pela galeria ou pelo endereço, e decide se o
 * preço aparece à vista (ver lib/categorias.ts). Aqui isso vira duas portas,
 * para cada pessoa reconhecer a dela em vez de ler uma promessa dividida com
 * alguém que faz outra coisa da vida.
 *
 * Os exemplos são de ramos com receita oposta na tabela: `design` abre pela
 * galeria e trata o endereço como opcional, `confeitaria` espera endereço na
 * rua e mostra preço à vista.
 */
const SALA_CRIADOR: Sala = {
  publico: "Vende o próprio trabalho",
  titulo: "A galeria abre a página.",
  itens: [
    "As suas fotos em tamanho grande, na ordem que você escolher.",
    "Catálogo com preço, e um botão de WhatsApp em cada peça.",
    "Atendimento por chamada, com o horário calculado no seu fuso.",
  ],
  negocio: ilustracao,
  tipo: "Ilustradora",
};

const SALA_LOJA: Sala = {
  publico: "Tem porta na rua",
  titulo: "O endereço abre a página.",
  itens: [
    "Endereço com o mapa a um toque, e o aberto agora calculado na hora.",
    "Cardápio com foto e preço, e a encomenda saindo pelo WhatsApp.",
    "Botão principal apontado para o iFood, para a agenda ou para a loja.",
  ],
  negocio: doceria,
  tipo: "Confeitaria",
};

/*
 * Quem fica pendurado na abertura.
 *
 * Três, e não quatro: as outras duas páginas aparecem inteiras logo abaixo,
 * nas duas salas, e repetir negócio na mesma tela gasta imagem sem responder
 * nada de novo. Os três são de ofícios bem distantes entre si, porque a
 * pergunta dos dois primeiros segundos é "serve para mim".
 */
const EM_CARTAZ = [
  { negocio: tatuagem, tipo: "Tatuador" },
  { negocio: canto, tipo: "Professora de canto" },
  { negocio: psicologia, tipo: "Psicóloga" },
];

export default async function Home() {
  /*
   * O mosaico mostra as peças de um negócio só, com profundidade. O ateliê
   * serve melhor que os outros aí: tem preço, tem galeria cheia e é o caso
   * que o produto existe para atender.
   */
  const negocio = (await porSlug("lia-prado")) ?? atelie;

  /*
   * A placa fica na abertura em qualquer situação: é ela que transforma visita
   * em intenção, porque a pessoa vê o próprio nome no endereço e passa a querer
   * aquele endereço. Enquanto o cadastro está fechado, muda o rótulo do botão e
   * a tela seguinte diz o que acontece, em vez de prometer uma criação que
   * ainda não existe.
   */
  const rotulo = CADASTRO_ABERTO ? "Criar meu endereço" : "Continuar";

  /*
   * A letra dos títulos da tela inicial é a mesma que o plano gratuito entrega
   * a todo mundo. Duas razões, e as duas são do produto.
   *
   * A primeira é honestidade: a propaganda escreve com a letra que ela vende.
   * A segunda é peso. A prévia de celular aqui do lado já baixa essa
   * combinação, porque os exemplos usam ela; aplicar a mesma no título custa
   * zero arquivo novo, e o teste de fluxo continua contando duas fontes na
   * rota. Escolher qualquer outra letra baixaria uma terceira.
   */
  const letra = combinacao("moderno");

  return (
    /*
     * A parede da sala.
     *
     * O tema noite existe no produto pelo motivo de museu, escrito no
     * globals.css: parede escura faz a foto avançar e a parede recuar. A tela
     * inicial passa a ser essa sala, e cada página de cliente mostrada nela
     * aparece acesa, com a cor que o dono dela escolheu.
     */
    <div
      data-tema="areia"
      data-fonte={letra.chave}
      className={`min-h-dvh bg-fundo ${letra.classe}`}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Marca href={null} />
        {CADASTRO_ABERTO ? (
          <div className="-mr-3 flex items-center gap-1.5">
            <Link
              href="/entrar"
              className="flex h-11 items-center gap-2 rounded-full px-3 text-[0.95rem] font-medium text-texto hover:text-destaque"
            >
              <IconeEntrar className="h-5 w-5" />
              Entrar
            </Link>
            <Link
              href="#comecar"
              className="hidden h-11 items-center rounded-full bg-texto px-4 text-[0.9rem] font-semibold text-fundo transition-opacity hover:opacity-90 sm:flex"
            >
              Criar minha página
            </Link>
          </div>
        ) : null}
      </header>

      <main>
        {/*
          A abertura. A luz sobe uma vez e as quatro peças entram atrás dela, na
          ordem em que se lê: o verbo, o convite, a placa, e o que está em
          cartaz. É o único movimento orquestrado da página; o resto da rolagem
          usa o `surge`, que já existia.
        */}
        <section id="comecar" className="mx-auto w-full max-w-6xl px-6 pt-4 pb-12 sm:pt-10 sm:pb-24">
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_19rem] lg:gap-14">
            <div className="max-w-2xl">
              {/*
                A cartela do próprio nome da marca. O trocadilho fica debaixo do
                nariz do produto: entrais é o que se diz na porta, e a tela
                inicial passava longe disso. Dito uma vez, em letra pequena,
                ele arma o "Entrai" que vem logo abaixo em tamanho grande.
              */}
              <p
                className="acende border-t border-borda pt-3 text-[0.72rem] font-semibold tracking-[0.18em] text-destaque uppercase"
                style={{ "--atraso": "80ms" } as React.CSSProperties}
              >
                Para quem cria e empreende
              </p>

              <h1
                className="acende titulo mt-5 text-[2.5rem] leading-[0.96] text-balance text-texto sm:text-[3.4rem] lg:text-[4.1rem]"
                style={{ "--atraso": "160ms" } as React.CSSProperties}
              >
                <span className="block">Exponha o seu melhor.</span>
                Num endereço só seu.
              </h1>

              <p
                className="acende mt-6 max-w-md text-[1.05rem] leading-relaxed text-suave lg:text-[1.15rem]"
                style={{ "--atraso": "240ms" } as React.CSSProperties}
              >
                Reúna o seu portfólio, o catálogo e o contato numa página que
                apresenta o seu trabalho com o cuidado de uma galeria. Bonita no
                celular e no computador, pronta para receber quem chega.
              </p>

              <div
                className="acende mt-9"
                style={{ "--atraso": "320ms" } as React.CSSProperties}
              >
                <p className="mb-3 text-[1.05rem] font-semibold tracking-[-0.015em] text-texto">
                  Escreva o nome que vai na placa.
                </p>
                <CampoAbertura rotulo={rotulo} />
              </div>
            </div>

            {/*
              O que está pendurado, com a etiqueta embaixo. No celular ele vem
              logo depois da placa, e o vão entre os dois é de respiro, e não
              mais de meia tela vazia.
            */}
            <div
              className="acende"
              style={{ "--atraso": "400ms" } as React.CSSProperties}
            >
              <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-suave uppercase">
                Em cartaz agora
              </p>
              <Carrossel>
                {EM_CARTAZ.map(({ negocio: n, tipo }, i) => (
                  <div key={n.slug}>
                    <Telefone negocio={n} prioridade={i === 0} leve />
                    <Cartela negocio={n} tipo={tipo} className="mt-5" />
                  </div>
                ))}
              </Carrossel>
            </div>
          </div>
        </section>

        {/*
          As duas salas. A queixa era que os dois públicos vinham amontoados
          numa promessa só; aqui cada um tem porta, nome e uma página do ramo
          dele pendurada dentro.
        */}
        <section
          aria-labelledby="salas"
          className="border-t border-borda"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
            <h2
              id="salas"
              className="titulo max-w-xl text-[2rem] leading-[1.05] text-balance text-texto sm:text-[2.8rem]"
            >
              Duas salas, duas montagens.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-suave">
              A página se arruma pelo ramo que você escolhe: uma abre pela
              galeria, a outra abre pelo endereço e pelo horário.
            </p>

            <div className="mt-10 sm:mt-14">
              <Salas criador={SALA_CRIADOR} loja={SALA_LOJA} />
            </div>
          </div>
        </section>

        <section aria-labelledby="mosaico" className="border-t border-borda">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
            <h2
              id="mosaico"
              className="titulo max-w-2xl text-[2rem] leading-[1.05] text-balance text-texto sm:text-[2.8rem]"
            >
              O que cabe numa sala só.
            </h2>
            <div className="mt-10 sm:mt-14">
              <Mosaico
                negocio={negocio}
                paraCatalogo={canto}
                paraBotoes={atelie}
                paraGaleria={tatuagem}
              />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="exemplos"
          className="border-t border-borda"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
            <h2
              id="exemplos"
              className="titulo max-w-xl text-[2rem] leading-[1.05] text-balance text-texto sm:text-[2.8rem]"
            >
              Salas abertas agora.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-suave">
              Todas estas estão no ar. Abra a que mais parece com a sua e
              percorra até o fim.
            </p>

            <div className="mt-10 sm:mt-12">
              <Vitrine />
            </div>
          </div>
        </section>

        {/*
          Os planos. Vêm depois de a pessoa ter visto o produto de verdade nas
          seções acima, que é quando a pergunta passa a ser "quanto custa". O
          grátis lista o que já entrega, e o completo lista só o que soma, sem
          vender "por tirar" nada.
        */}
        <section aria-labelledby="planos" className="border-t border-borda">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
              <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-destaque uppercase">
                Planos
              </p>
              <h2
                id="planos"
                className="titulo mt-2 text-[2rem] leading-[1.05] text-balance text-texto sm:text-[2.8rem]"
              >
                Comece de graça. Cresça quando quiser.
              </h2>
              <p className="mt-4 leading-relaxed text-suave text-pretty">
                Sua página no ar sem pagar nada. Quando o trabalho pedir mais, o
                completo abre a personalização e os números de verdade de quem
                visita.
              </p>
            </div>

            <Planos />
          </div>
        </section>

        {/*
          Editorial: o título fica preso na coluna da esquerda enquanto a lista
          corre na direita. É o desenho de revista, e serve a um propósito
          prático: o "o que muda" continua à vista enquanto a pessoa lê os
          itens, então cada um se lê como resposta à pergunta do título.
        */}
        <section aria-labelledby="beneficios" className="border-t border-borda">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
            <div className="lg:grid lg:grid-cols-[20rem_1fr] lg:gap-16">
              <div className="lg:sticky lg:top-16 lg:self-start">
                <h2
                  id="beneficios"
                  className="titulo text-[2rem] leading-[1.05] text-balance text-texto sm:text-[2.8rem]"
                >
                  O que muda depois que a porta abre.
                </h2>
                <p className="mt-4 max-w-sm leading-relaxed text-suave">
                  Quatro coisas que só aparecem depois de publicar.
                </p>
              </div>

              <dl className="mt-10 lg:mt-0">
                {BENEFICIOS.map((b) => (
                  <div
                    key={b.titulo}
                    className="surge border-t border-borda py-6 first:border-t-0 first:pt-0 last:pb-0 lg:py-8"
                  >
                    <dt className="titulo text-[1.35rem] leading-tight text-balance text-texto sm:text-[1.6rem]">
                      {b.titulo}
                    </dt>
                    <dd className="mt-2 max-w-xl leading-relaxed text-suave text-pretty">
                      {b.texto}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="passos"
          className="border-t border-borda"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
            <h2
              id="passos"
              className="titulo max-w-lg text-[2rem] leading-[1.05] text-balance text-texto sm:text-[2.8rem]"
            >
              Do nome à porta aberta, em três passos.
            </h2>

            {/*
              Numeral grande em latão, fio em cima, texto embaixo. Aqui o número
              carrega ordem de verdade, então o rótulo "passo 1" some e sobra
              espaço para o que interessa.
            */}
            <ol className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-3 sm:gap-8">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="surge border-t border-borda pt-5">
                  <span
                    className="titulo block text-[2.4rem] leading-none tabular-nums text-destaque"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-balance text-texto">
                    {passo.titulo}
                  </h3>
                  <p className="mt-2 leading-relaxed text-suave text-pretty">
                    {passo.texto}
                  </p>
                </li>
              ))}
            </ol>

            {/* A mesma placa da abertura, ao alcance de quem leu até aqui. */}
            <div className="mt-14 max-w-xl">
              <p className="mb-3 text-[1.05rem] font-semibold tracking-[-0.015em] text-texto">
                Escreva o nome que vai na placa.
              </p>
              <CampoAbertura rotulo={rotulo} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-borda">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-suave">
          <p>{NOME_PRODUTO}, presença profissional para o negócio local.</p>
          {CADASTRO_ABERTO ? (
            <Link
              href="/entrar"
              className="-mx-2 flex h-11 items-center gap-2 rounded-full px-2 font-medium text-texto hover:text-destaque"
            >
              <IconeEntrar className="h-4 w-4" />
              Entrar
            </Link>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
