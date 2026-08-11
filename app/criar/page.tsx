import type { Metadata } from "next";
import Link from "next/link";
import { criarPagina } from "./acoes";
import { CampoEndereco } from "@/componentes/cadastro/CampoEndereco";
import { BotaoPrincipal, Moldura } from "@/componentes/cadastro/Moldura";
import { MOTIVOS, type Recusa } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Criar sua página",
  robots: { index: false, follow: false },
};

export default async function Criar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; nome?: string }>;
}) {
  const { erro, nome } = await searchParams;
  const mensagem =
    erro === "nome"
      ? "Escreve o nome do negócio."
      : (MOTIVOS[erro as Recusa] ?? null);

  return (
    <Moldura
      titulo="Criar sua página"
      subtitulo="Duas informações agora. O resto você preenche depois, com calma."
      rodape={
        <p className="text-center text-[0.95rem] text-suave">
          Já tem uma página?{" "}
          <Link
            href="/entrar"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form action={criarPagina} className="flex flex-col gap-7">
        <div>
          <label htmlFor="nome" className="text-[0.95rem] font-medium text-texto">
            Nome do negócio
          </label>
          <input
            id="nome"
            name="nome"
            required
            maxLength={80}
            defaultValue={nome ?? ""}
            autoComplete="organization"
            className="mt-3 w-full rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-[1.05rem] text-texto focus:border-destaque focus:outline-none"
          />
        </div>

        <CampoEndereco />

        {mensagem ? (
          <p
            role="alert"
            className="rounded-2xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm text-destaque"
          >
            {mensagem}
          </p>
        ) : null}

        <BotaoPrincipal type="submit">Criar página</BotaoPrincipal>

        <p className="text-center text-sm leading-relaxed text-suave">
          Sua página nasce como rascunho. Ninguém vê até você publicar.
        </p>
      </form>
    </Moldura>
  );
}
