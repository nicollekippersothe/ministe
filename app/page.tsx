import type { Metadata } from "next";
import Link from "next/link";
import { IconeSeta } from "@/componentes/Icones";
import { CampoAbertura } from "@/componentes/inicial/CampoAbertura";
import { Fragmentos } from "@/componentes/inicial/Fragmentos";
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
    "Um lugar seu, com o seu nome, que aparece no Google e apresenta o seu trabalho a quem procura. Pronto em minutos, feito do celular.",
};

const PASSOS = [
  {
    titulo: "Escolha o seu endereço",
    texto: "Uma palavra, do jeito que as pessoas conhecem o seu negócio.",
  },
  {
    titulo: "Preencha o essencial",
    texto:
      "Nome, WhatsApp, horário e endereço. O resto entra quando você quiser.",
  },
  {
    titulo: "Publique e compartilhe",
    texto:
      "Na bio do Instagram, no WhatsApp, no cartão. O mesmo endereço em todo lugar.",
  },
];

/*
 * Benefícios em texto, sem ícone dentro de bolinha e sem grade de três
 * colunas iguais. Cada um afirma uma coisa que dá para conferir abrindo o
 * produto, que é o que o guia chama de concreto antes de aspiracional.
 */
const BENEFICIOS = [
  {
    titulo: "Atualizada por você",
    texto:
      "Mudou o horário de véspera de feriado? Você edita do celular e a página muda na hora, para todo mundo.",
  },
  {
    titulo: "Abre instantânea",
    texto:
      "Feita para a rede do interior. Chega inteira em menos de dois segundos.",
  },
  {
    titulo: "O endereço acompanha você",
    texto:
      "Mudou o nome do negócio? O anterior continua levando quem tem o link antigo.",
  },
  {
    titulo: "Preenchida do celular",
    texto:
      "Do começo ao fim pela tela do telefone, com uma pergunta por vez.",
  },
];

/*
 * Para quem serve, dito por segmento.
 *
 * A dúvida que aparece em dois segundos na cabeça de quem chega é "serve para
 * o meu caso?". Listar tipo de negócio responde isso mais rápido do que
 * qualquer promessa, e cada segmento tem um exemplo aberto logo abaixo.
 */
const PUBLICOS = [
  {
    titulo: "Quem vende",
    texto:
      "Restaurante, confeitaria, loja de bairro, ateliê. O catálogo com foto e preço fica à vista, e o pedido começa na hora.",
  },
  {
    titulo: "Quem atende",
    texto:
      "Consultório, estúdio, salão, clínica. Horário, endereço e serviços num lugar só, com a agenda a um toque.",
  },
  {
    titulo: "Quem mostra o trabalho",
    texto:
      "Portfólio, professor, fotógrafo, profissional autônomo. Um endereço com o seu nome para deixar em qualquer lugar.",
  },
];

export default async function Home() {
  const negocio = (await porSlug("demo")) ?? doceria;

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
                Crie o endereço do seu negócio na internet.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-suave">
                Um lugar seu, com o seu nome, que aparece no Google e apresenta
                o seu trabalho a quem procura. Pronto em minutos, feito do
                celular.
              </p>

              {/*
                O campo dentro da dobra é o que transforma visita em intenção:
                a pessoa digita o próprio nome e passa a querer aquele
                endereço. Enquanto o login não existe, o cadastro responde 404,
                então em modo vitrine entram os dois botões no lugar dele.
              */}
              <div className="mt-9 max-w-lg">
                {MODO_VITRINE ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      href={`/${negocio.slug}`}
                      className="flex h-13 items-center justify-center rounded-full bg-texto px-8 text-[1.05rem] font-semibold text-superficie"
                    >
                      Ver um endereço por dentro
                    </Link>
                    <Link
                      href="#tipos"
                      className="flex h-13 items-center justify-center gap-1.5 rounded-full px-5 text-[1.05rem] font-medium text-destaque"
                    >
                      Ver para quem serve
                      <IconeSeta className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <CampoAbertura />
                )}
              </div>

              <p className="mt-6 text-sm text-suave">
                {MODO_VITRINE
                  ? "Os endereços abaixo estão no ar e funcionam. O cadastro abre quando o login estiver pronto."
                  : "Funciona direto pelo navegador do celular."}
              </p>
            </div>

            <div className="lg:pl-4">
              <Telefone negocio={negocio} />
              <p className="mt-5 text-center text-sm text-suave lg:text-left">
                Publicada de verdade, feita aqui.{" "}
                <Link
                  href={`/${negocio.slug}`}
                  className="text-destaque underline underline-offset-2"
                >
                  Ver inteira
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section id="tipos" aria-labelledby="tipos-titulo" className="border-t border-borda">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
            <h2
              id="tipos-titulo"
              className="max-w-xl text-2xl leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-3xl"
            >
              Do restaurante da esquina ao portfólio de quem trabalha sozinho.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-suave">
              Qualquer trabalho que precise ser encontrado cabe num endereço
              próprio. Estes quatro estão no ar agora, e podem ser abertos.
            </p>

            <dl className="mt-10 grid gap-x-12 gap-y-7 sm:grid-cols-3">
              {PUBLICOS.map((p) => (
                <div key={p.titulo} className="surge">
                  <dt className="text-[1.05rem] font-semibold tracking-[-0.01em] text-texto">
                    {p.titulo}
                  </dt>
                  <dd className="mt-1.5 leading-relaxed text-suave">
                    {p.texto}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12">
              <Vitrine />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="muda"
          className="border-t border-borda bg-superficie"
        >
          <div className="mx-auto w-full max-w-4xl px-6 py-20 sm:py-28">
            <h2
              id="muda"
              className="max-w-lg text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              O que muda quando o endereço é seu.
            </h2>
            <div className="mt-14 sm:mt-20">
              <Fragmentos negocio={negocio} />
            </div>
          </div>
        </section>

        {/*
          Benefícios em texto corrido, em duas colunas assimétricas: o título
          de cada um puxa a linha, e o corpo explica. Sem ícone dentro de
          bolinha e sem grade de três colunas iguais, que são as duas formas
          mais rápidas de uma seção de benefício virar decoração.
        */}
        <section aria-labelledby="beneficios" className="border-t border-borda">
          <div className="mx-auto w-full max-w-4xl px-6 py-20 sm:py-24">
            <h2
              id="beneficios"
              className="max-w-md text-2xl leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-3xl"
            >
              O que vem junto.
            </h2>
            <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2 sm:mt-12">
              {BENEFICIOS.map((b) => (
                <div key={b.titulo} className="surge">
                  <dt className="text-[1.05rem] font-semibold tracking-[-0.01em] text-texto">
                    {b.titulo}
                  </dt>
                  <dd className="mt-1.5 leading-relaxed text-suave">
                    {b.texto}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="passos" className="border-t border-borda">
          <div className="mx-auto w-full max-w-4xl px-6 py-20 sm:py-28">
            <h2
              id="passos"
              className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Três passos até o ar.
            </h2>

            <ol className="mt-12 border-l border-borda">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="surge relative pl-7 pb-10 last:pb-0">
                  <span
                    className="absolute top-1 -left-px h-6 w-[3px] bg-destaque"
                    aria-hidden
                  />
                  <span className="text-xs font-semibold tracking-[0.14em] text-destaque uppercase">
                    Passo {i + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-texto">
                    {passo.titulo}
                  </h3>
                  <p className="mt-1.5 max-w-md leading-relaxed text-suave">
                    {passo.texto}
                  </p>
                </li>
              ))}
            </ol>

            {MODO_VITRINE ? null : (
              <div className="mt-14">
                <Link
                  href="/criar"
                  className="inline-flex h-13 items-center justify-center rounded-full bg-texto px-8 text-[1.05rem] font-semibold text-superficie"
                >
                  Publicar a minha página
                </Link>
              </div>
            )}
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
