import type { Metadata } from "next";
import Link from "next/link";
import { criarPagina } from "./acoes";
import { CampoCategoria } from "@/componentes/cadastro/CampoCategoria";
import { CampoEndereco } from "@/componentes/cadastro/CampoEndereco";
import { exigirLogin } from "@/app/painel/vitrine";
import { BotaoPrincipal, Moldura } from "@/componentes/cadastro/Moldura";
import { enderecoLivre } from "@/lib/dados";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { MODO_VITRINE } from "@/lib/site";
import { conferirFormato, MOTIVOS, normalizar, type Recusa } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Criar sua página",
  robots: { index: false, follow: false },
};

/**
 * O que a tela inicial mostra quando alguém usa o campo de endereço da
 * abertura antes do cadastro existir.
 *
 * Some quando o login entrar. Até lá, quem digita um nome e aperta o botão
 * precisa de uma resposta: dizer que o endereço está livre é verdade e é útil,
 * e dizer quando o cadastro abre é melhor do que uma página de erro.
 */
async function EnderecoConferido({ slug }: { slug: string }) {
  const pedido = normalizar(slug);
  const recusa = pedido === "" ? null : conferirFormato(pedido);
  const livre = recusa === null && pedido !== "" && (await enderecoLivre(pedido));

  return (
    <Moldura
      titulo={
        livre
          ? `${DOMINIO_PUBLICO}/${pedido} está livre`
          : "Confira outro endereço"
      }
      subtitulo={
        livre
          ? "Ninguém está usando este endereço."
          : pedido === ""
            ? "Volte e escreva o nome do seu negócio."
            : (MOTIVOS[recusa as Recusa] ?? MOTIVOS.ocupado)
      }
      rodape={
        <p className="text-center text-[0.95rem] text-suave">
          <Link
            href="/"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Voltar e escolher outro
          </Link>
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="leading-relaxed text-suave">
          O cadastro abre junto com o login, que é a próxima etapa. Os endereços
          que já estão no ar continuam abrindo, e dá para percorrer um inteiro
          para ver como o seu vai ficar.
        </p>

        <Link
          href="/demo"
          className="flex h-13 w-full items-center justify-center rounded-full bg-texto px-6 text-[1.05rem] font-semibold text-superficie"
        >
          Ver um endereço por dentro
        </Link>
      </div>
    </Moldura>
  );
}

export default async function Criar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; nome?: string; slug?: string }>;
}) {
  const { erro, nome, slug } = await searchParams;

  if (MODO_VITRINE) return <EnderecoConferido slug={slug ?? ""} />;
  exigirLogin();
  const mensagem =
    erro === "nome"
      ? "Informe o nome do negócio."
      : (MOTIVOS[erro as Recusa] ?? null);

  return (
    <Moldura
      titulo="Criar sua página"
      subtitulo="Três respostas agora. O resto pode ser preenchido depois."
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

        <CampoCategoria />

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
          A página começa como rascunho. Ninguém vê até você publicar.
        </p>
      </form>
    </Moldura>
  );
}
