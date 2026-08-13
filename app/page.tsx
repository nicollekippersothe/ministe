import type { Metadata } from "next";
import Link from "next/link";
import { CampoAbertura } from "@/componentes/inicial/CampoAbertura";
import { Carrossel } from "@/componentes/inicial/Carrossel";
import { Mosaico } from "@/componentes/inicial/Mosaico";
import { Marca } from "@/componentes/Marca";
import { NOME_PRODUTO } from "@/lib/marca";
import { Vitrine } from "@/componentes/inicial/Vitrine";
import { porSlug } from "@/lib/dados";
import { MODO_VITRINE } from "@/lib/site";
import { atelie, VITRINE } from "@/lib/exemplos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${NOME_PRODUTO}, o endereço do seu negócio na internet`,
  description:
    "Um espaço para expor o seu trabalho: as fotos, o que você oferece e por onde falar com você. Num endereço com o seu nome, escrito para aparecer na busca.",
};

/*
 * Benefícios.
 *
 * Nenhum destes é sobre o que a página tem: isso já está no mosaico logo
 * acima, mostrado com as peças de verdade. Aqui é o que muda para o dono
 * depois de publicada, que é a parte que não dá para ver na tela.
 *
 * Os dois primeiros são a diferença para o que a pessoa já usa hoje, dita
 * sem citar ninguém: uma lista de links só atende quem já chegou, e catálogo
 * dentro de aplicativo de mensagem não existe fora dele.
 */
const BENEFICIOS = [
  {
    titulo: "Encontrada por quem ainda não conhece você",
    texto:
      "A página sai com a marcação que o Google lê: nome, categoria, cidade, horário e o que você oferece. Uma lista de links atende quem já chegou até você. Esta página aparece também para quem está procurando o serviço agora.",
  },
  {
    titulo: "Um endereço para colocar em tudo",
    texto:
      "Bio, anúncio pago, cartão, assinatura de e-mail. Quem clica cai no seu catálogo, que abre em qualquer navegador, sem depender de ter um aplicativo instalado.",
  },
  {
    titulo: "Você preenche, e a página sai pronta",
    texto:
      "A página já vem montada. Você responde perguntas em vez de escolher fonte, margem e cor, e o resultado sai no mesmo padrão em qualquer aparelho.",
  },
  {
    titulo: "Editou, já está no ar",
    texto:
      "Entrou peça nova, ou o horário do feriado é outro? Você altera do celular e quem abrir em seguida já vê.",
  },
  {
    titulo: "O endereço é seu",
    texto:
      "As redes sociais mudam de regra e de alcance quando querem. O seu endereço fica onde está, com o mesmo nome.",
  },
];

const PASSOS = [
  {
    titulo: "Escolha o seu endereço",
    texto: "Escreva o nome do negócio e veja na hora se ele está livre.",
  },
  {
    titulo: "Preencha o essencial",
    texto:
      "O que o cliente precisa saber antes de chamar você: o serviço ou a peça, o preço quando fizer sentido, o horário e o contato.",
  },
  {
    titulo: "Publique",
    texto:
      "O endereço fica pronto para colar na bio, no anúncio e onde mais alguém perguntar pelo seu trabalho.",
  },
];

export default async function Home() {
  /*
   * O mosaico mostra as peças de um negócio só, com profundidade. O ateliê
   * serve melhor que os outros aí: tem preço, tem galeria cheia e é o caso
   * que o produto existe para atender.
   */
  const negocio = (await porSlug("atelie-trama")) ?? atelie;

  /* Quatro no carrossel. O quinto ninguém chega a ver. */
  const naAbertura = VITRINE.slice(0, 4).map((v) => v.negocio);

  /*
   * O campo de endereço fica na abertura em qualquer situação: é ele que
   * transforma visita em intenção, porque a pessoa vê o próprio nome no
   * endereço e passa a querer aquele endereço. Enquanto o cadastro não abre,
   * muda o rótulo do botão e a tela seguinte diz o que acontece, em vez de
   * prometer uma criação que ainda não existe.
   */
  const rotulo = MODO_VITRINE ? "Continuar" : "Criar meu endereço";

  return (
    <div data-tema="areia" className="min-h-dvh bg-fundo">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Marca href={null} />
        {MODO_VITRINE ? null : (
          <Link
            href="/entrar"
            className="text-[0.95rem] font-medium text-texto underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        )}
      </header>

      <main>
        {/* O produto aparece junto com a promessa, não depois dela. */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-6 pb-20 sm:pt-14">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-20">
            <div className="max-w-xl">
              <h1 className="text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.038em] text-balance text-texto sm:text-[3.4rem]">
                <span className="block text-destaque">Presença profissional.</span>
                O endereço do seu negócio na internet.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-suave">
                Um espaço seu para expor o trabalho: as fotos, o que você
                oferece e por onde falar com você. Num endereço com o seu nome,
                escrito para aparecer na busca de quem procura o seu serviço.
              </p>

              <div className="mt-9 max-w-lg">
                <CampoAbertura rotulo={rotulo} />
              </div>
            </div>

            <div className="lg:pl-4">
              <Carrossel negocios={naAbertura} />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="mosaico"
          className="border-t border-borda bg-superficie"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <h2
              id="mosaico"
              className="max-w-2xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Tudo o que o seu negócio precisa mostrar.
            </h2>
            <div className="mt-12 sm:mt-14">
              <Mosaico negocio={negocio} />
            </div>
          </div>
        </section>

        <section aria-labelledby="exemplos" className="border-t border-borda">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <h2
              id="exemplos"
              className="max-w-xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Veja como fica a sua.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-suave">
              Estas estão no ar. Abra qualquer uma e percorra até o fim.
            </p>

            <div className="mt-12">
              <Vitrine />
            </div>
          </div>
        </section>

        {/*
          Benefícios em linhas com fio entre elas, título de um lado e texto do
          outro. Grade de cartões iguais é o formato em que uma seção de
          benefício vira decoração, e o mosaico logo acima já usa cartão.
        */}
        <section
          aria-labelledby="beneficios"
          className="border-t border-borda bg-superficie"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-24">
            <h2
              id="beneficios"
              className="max-w-lg text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              O que muda quando o endereço é seu.
            </h2>

            <dl className="mt-12 sm:mt-14">
              {BENEFICIOS.map((b) => (
                <div
                  key={b.titulo}
                  className="surge grid gap-2 border-t border-borda py-7 last:border-b sm:grid-cols-[16rem_1fr] sm:gap-10 sm:py-8"
                >
                  <dt className="text-[1.1rem] font-semibold tracking-[-0.015em] text-balance text-texto">
                    {b.titulo}
                  </dt>
                  <dd className="max-w-xl leading-relaxed text-suave text-pretty">
                    {b.texto}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="passos" className="border-t border-borda">
          <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-24">
            <h2
              id="passos"
              className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Três passos até o ar.
            </h2>

            <ol className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-7">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="surge border-t-2 border-destaque pt-5">
                  <span className="text-xs font-semibold tracking-[0.14em] text-destaque uppercase">
                    Passo {i + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-texto">
                    {passo.titulo}
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-suave text-pretty">
                    {passo.texto}
                  </p>
                </li>
              ))}
            </ol>

            {/* O mesmo campo da abertura, ao alcance de quem leu até aqui. */}
            <div className="mt-14 max-w-lg">
              <CampoAbertura rotulo={rotulo} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-borda">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-suave">
          <p>{NOME_PRODUTO}, presença profissional para o negócio local.</p>
          {MODO_VITRINE ? null : (
            <Link href="/entrar" className="underline underline-offset-2">
              Entrar
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
