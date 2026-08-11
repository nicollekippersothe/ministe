import type { Metadata } from "next";
import Link from "next/link";
import { IconeSeta } from "@/componentes/Icones";
import { Fragmentos } from "@/componentes/inicial/Fragmentos";
import { Telefone } from "@/componentes/inicial/Telefone";
import { NOME_PRODUTO } from "@/componentes/Rodape";
import { Vitrine } from "@/componentes/inicial/Vitrine";
import { porSlug } from "@/lib/dados";
import { doceria } from "@/lib/exemplos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${NOME_PRODUTO}, uma página pronta para o seu negócio`,
  description:
    "Endereço, horário, cardápio e um botão de WhatsApp que já abre a conversa escrita. No ar em minutos.",
};

const PASSOS = [
  {
    titulo: "Escolha seu endereço",
    texto: "Uma palavra só, do jeito que as pessoas conhecem o seu negócio.",
  },
  {
    titulo: "Preencha o básico",
    texto:
      "Nome, WhatsApp, horário e endereço. O resto pode ser preenchido depois.",
  },
  {
    titulo: "Publique e compartilhe",
    texto:
      "Cole na bio do Instagram e envie no WhatsApp para quem já é seu cliente.",
  },
];

export default async function Home() {
  const negocio = (await porSlug("demo")) ?? doceria;

  return (
    <div data-tema="areia" className="min-h-dvh bg-fundo">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-sm font-semibold tracking-[0.16em] text-destaque uppercase">
          {NOME_PRODUTO}
        </span>
        <Link
          href="/entrar"
          className="text-[0.95rem] font-medium text-texto underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </header>

      <main>
        {/* O produto aparece junto com a promessa, não depois dela. */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-6 pb-20 sm:pt-14">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-20">
            <div className="max-w-xl">
              <h1 className="text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.038em] text-balance text-texto sm:text-[3.4rem]">
                Sua vitrine profissional, pronta hoje.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-suave">
                Endereço, horário, serviços e um botão de WhatsApp que já abre a
                conversa escrita. Você preenche do celular e publica em minutos.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/criar"
                  className="flex h-13 items-center justify-center rounded-full bg-texto px-8 text-[1.05rem] font-semibold text-superficie"
                >
                  Criar minha página
                </Link>
                <Link
                  href={`/${negocio.slug}`}
                  className="flex h-13 items-center justify-center gap-1.5 rounded-full px-5 text-[1.05rem] font-medium text-destaque"
                >
                  Abrir esta página
                  <IconeSeta className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-6 text-sm text-suave">
                Sem instalar nada. Funciona pelo navegador do celular.
              </p>
            </div>

            <div className="lg:pl-4">
              <Telefone negocio={negocio} />
              <p className="mt-5 text-center text-sm text-suave lg:text-left">
                Uma página de verdade, feita aqui.{" "}
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

        <section aria-labelledby="vitrine" className="border-t border-borda">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
            <h2
              id="vitrine"
              className="max-w-lg text-2xl leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-3xl"
            >
              Serve para quem vende produto e para quem vende hora.
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-suave">
              Quatro páginas prontas, de negócios bem diferentes. Todas estão no ar e podem
              ser abertas agora.
            </p>
            <div className="mt-9">
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
              O que muda para quem procura você.
            </h2>
            <div className="mt-14 sm:mt-20">
              <Fragmentos negocio={negocio} />
            </div>
          </div>
        </section>

        <section aria-labelledby="passos" className="border-t border-borda">
          <div className="mx-auto w-full max-w-4xl px-6 py-20 sm:py-28">
            <h2
              id="passos"
              className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Três passos, e está no ar.
            </h2>

            <ol className="mt-12 border-l border-borda">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="relative pl-7 pb-10 last:pb-0">
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

            <div className="mt-14">
              <Link
                href="/criar"
                className="inline-flex h-13 items-center justify-center rounded-full bg-texto px-8 text-[1.05rem] font-semibold text-superficie"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-borda">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-suave">
          <p>{NOME_PRODUTO}, uma página pronta para o negócio local.</p>
          <Link href="/entrar" className="underline underline-offset-2">
            Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}
