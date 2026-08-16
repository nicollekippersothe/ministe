import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/app/painel/vitrine";
import { BotaoGoogle } from "@/componentes/cadastro/BotaoGoogle";
import { Moldura } from "@/componentes/cadastro/Moldura";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

/**
 * Uma porta só, e sem senha.
 *
 * Chega aqui quem vai publicar (a página está montada e falta pôr no ar) e
 * quem está voltando de outro aparelho. Nos dois casos o Google resolve, e por
 * isso a tela muda de texto conforme o motivo em vez de existir duas vezes.
 */
export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; motivo?: string }>;
}) {
  exigirLogin();
  const { erro, motivo } = await searchParams;
  const publicando = motivo === "publicar";

  return (
    <Moldura
      titulo={publicando ? "Falta uma etapa" : "Entrar"}
      subtitulo={
        publicando
          ? "Entre com o Google para pôr sua página no ar. A página que você montou continua sendo sua, com o mesmo endereço."
          : "Uma conta do Google, e sua página abre do jeito que você deixou."
      }
      rodape={
        <p className="text-center text-[0.95rem] text-suave">
          Quer começar uma página?{" "}
          <Link
            href="/criar"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Criar agora
          </Link>
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <BotaoGoogle
          rotulo={publicando ? "Entrar e publicar" : "Entrar com o Google"}
        />

        {erro ? (
          <p
            role="alert"
            className="rounded-2xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm leading-relaxed text-destaque"
          >
            O Google respondeu: {erro}. Tente de novo, e se continuar assim me
            conte o que apareceu aqui.
          </p>
        ) : null}

        <p className="text-center text-sm leading-relaxed text-suave">
          Usamos seu nome e seu e-mail para guardar a página no seu nome.
        </p>

        <p className="text-center text-sm text-suave">
          <Link href="/entrar/ajuda" className="underline underline-offset-2">
            Preciso de ajuda para entrar
          </Link>
        </p>
      </div>
    </Moldura>
  );
}
