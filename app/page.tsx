import type { Metadata } from "next";
import Link from "next/link";
import { IconeRelogio, IconeSeta, IconeWhatsapp } from "@/componentes/Icones";
import { NOME_PRODUTO } from "@/componentes/Rodape";

export const metadata: Metadata = {
  title: `${NOME_PRODUTO}, uma página pronta para o seu negócio`,
  description:
    "Endereço, horário, cardápio e um botão de WhatsApp que já abre a conversa escrita. No ar em minutos.",
};

function Passo({
  numero,
  titulo,
  texto,
}: {
  numero: string;
  titulo: string;
  texto: string;
}) {
  return (
    <li className="flex gap-4">
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-texto text-[0.8rem] font-semibold text-superficie"
        aria-hidden
      >
        {numero}
      </span>
      <span>
        <span className="block font-semibold text-texto">{titulo}</span>
        <span className="mt-1 block leading-relaxed text-suave">{texto}</span>
      </span>
    </li>
  );
}

function Recurso({
  icone,
  titulo,
  texto,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <li className="rounded-3xl border border-borda bg-superficie p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-fundo text-destaque">
        {icone}
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-texto">
        {titulo}
      </h3>
      <p className="mt-1.5 leading-relaxed text-suave">{texto}</p>
    </li>
  );
}

export default function Home() {
  return (
    <div data-tema="areia" className="min-h-dvh bg-fundo">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
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
        <section className="mx-auto w-full max-w-2xl px-6 pt-14 pb-20 text-center sm:pt-24">
          <h1 className="text-[2.6rem] leading-[1.03] font-semibold tracking-[-0.035em] text-balance text-texto sm:text-6xl">
            Seu negócio merece mais que um link na bio.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-balance text-suave sm:text-xl">
            Endereço, horário, cardápio e um botão de WhatsApp que já abre a
            conversa escrita. Pronto em minutos, direto do celular.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/criar"
              className="flex h-13 w-full max-w-xs items-center justify-center rounded-full bg-texto px-8 text-[1.05rem] font-semibold text-superficie sm:w-auto"
            >
              Criar minha página
            </Link>
            <Link
              href="/demo"
              className="flex h-13 w-full max-w-xs items-center justify-center gap-1.5 rounded-full px-6 text-[1.05rem] font-medium text-destaque sm:w-auto"
            >
              Ver um exemplo
              <IconeSeta className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-6 text-sm text-suave">
            De graça, sem cartão, sem instalar nada.
          </p>
        </section>

        <section
          aria-labelledby="recursos"
          className="mx-auto w-full max-w-5xl px-6 pb-20"
        >
          <h2 id="recursos" className="sr-only">
            O que a página tem
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            <Recurso
              icone={<IconeWhatsapp className="h-5 w-5" />}
              titulo="O botão que vende"
              texto="Fixo na tela, sempre visível, e já abre a conversa com a mensagem escrita."
            />
            <Recurso
              icone={<IconeRelogio className="h-5 w-5" />}
              titulo="Aberto agora"
              texto="Quem chega vê na hora se você está aberto, ou a que horas você abre."
            />
            <Recurso
              icone={<IconeSeta className="h-5 w-5" />}
              titulo="Um link que não quebra"
              texto="Cardápio, fotos, endereço com mapa e seus outros links, tudo num lugar só."
            />
          </ul>
        </section>

        <section
          aria-labelledby="como"
          className="mx-auto w-full max-w-2xl px-6 pb-24"
        >
          <h2
            id="como"
            className="text-center text-3xl font-semibold tracking-[-0.025em] text-balance text-texto"
          >
            Três passos e está no ar
          </h2>
          <ol className="mt-10 flex flex-col gap-7">
            <Passo
              numero="1"
              titulo="Escolha seu endereço"
              texto="Uma palavra só, do jeito que as pessoas conhecem o seu negócio."
            />
            <Passo
              numero="2"
              titulo="Preencha o básico"
              texto="Nome, WhatsApp, horário e endereço. Dá para deixar o resto para depois."
            />
            <Passo
              numero="3"
              titulo="Publique e compartilhe"
              texto="Cole o link na bio do Instagram e mande no WhatsApp para quem já é cliente."
            />
          </ol>

          <div className="mt-12 text-center">
            <Link
              href="/criar"
              className="inline-flex h-13 items-center justify-center rounded-full bg-texto px-8 text-[1.05rem] font-semibold text-superficie"
            >
              Começar agora
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-borda">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 text-sm text-suave">
          <p>
            {NOME_PRODUTO}, uma página pronta para o negócio local.{" "}
            <Link href="/demo" className="underline underline-offset-2">
              Ver exemplo
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
