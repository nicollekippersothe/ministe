import type { Metadata } from "next";
import Link from "next/link";
import { CampoAbertura } from "@/componentes/inicial/CampoAbertura";
import { Mosaico } from "@/componentes/inicial/Mosaico";
import { Telefone } from "@/componentes/inicial/Telefone";
import { Marca } from "@/componentes/Marca";
import { NOME_PRODUTO } from "@/lib/marca";
import { Vitrine } from "@/componentes/inicial/Vitrine";
import { porSlug } from "@/lib/dados";
import { MODO_VITRINE } from "@/lib/site";
import { doceria } from "@/lib/exemplos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${NOME_PRODUTO}, o endereço do seu negócio na internet`,
  description:
    "Catálogo, horário, localização e contato reunidos num endereço com o seu nome, que abre no celular e aparece na busca de quem procura o seu serviço.",
};

/*
 * Benefícios.
 *
 * Nenhum destes é sobre o que a página tem: isso já está no mosaico logo
 * acima, mostrado com as peças de verdade. Aqui é o que muda para o dono
 * depois de publicada, que é a parte que não dá para ver na tela.
 */
const BENEFICIOS = [
  {
    titulo: "O endereço é seu",
    texto:
      "As redes sociais mudam de regra e de alcance quando querem. O seu endereço fica onde está, com o mesmo nome.",
  },
  {
    titulo: "Abre em qualquer sinal",
    texto:
      "A página chega inteira em menos de dois segundos, e continua abrindo onde a internet é fraca.",
  },
  {
    titulo: "Trocar de nome não quebra o link",
    texto:
      "Se o negócio ganhar outro nome, quem guardou o endereço antigo chega no novo.",
  },
  {
    titulo: "Editou, já está no ar",
    texto:
      "Mudou o horário na véspera do feriado, ou o preço de um item? Você altera do celular e quem abrir em seguida já vê.",
  },
];

const PASSOS = [
  {
    titulo: "Escolha o endereço",
    texto: "Uma palavra, do jeito que as pessoas já chamam o seu negócio.",
  },
  {
    titulo: "Preencha o essencial",
    texto:
      "Nome, contato, horário e localização. O catálogo entra quando você quiser.",
  },
  {
    titulo: "Publique",
    texto:
      "O mesmo endereço na bio do Instagram, no WhatsApp e no cartão impresso.",
  },
];

export default async function Home() {
  const negocio = (await porSlug("demo")) ?? doceria;

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
                Catálogo, horário, localização e contato reunidos num endereço
                com o seu nome. Você manda para quem pergunta, e ele aparece na
                busca para quem ainda não conhece o seu trabalho.
              </p>

              <div className="mt-9 max-w-lg">
                <CampoAbertura rotulo={rotulo} />
              </div>
            </div>

            <div className="lg:pl-4">
              <Telefone negocio={negocio} />
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
              Quatro endereços no ar agora.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-suave">
              Todos abrem e funcionam. São de negócios bem diferentes, de
              propósito.
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
