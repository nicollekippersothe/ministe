import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { criarPagina } from "./acoes";
import { exigirLogin } from "@/app/painel/vitrine";
import { FormularioCriar } from "@/componentes/cadastro/FormularioCriar";
import { Moldura } from "@/componentes/cadastro/Moldura";
import { enderecoLivre, idDoNegocioDoDono } from "@/lib/dados";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { CADASTRO_ABERTO } from "@/lib/site";
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

  if (!CADASTRO_ABERTO) return <EnderecoConferido slug={slug ?? ""} />;
  exigirLogin();

  /*
   * Quem já tem página vai para o painel, em vez de ver o formulário.
   *
   * O limite do plano gratuito é uma página por conta, e quem passasse daqui
   * levaria a recusa do banco só depois de preencher tudo. Além disso `/criar`
   * é o destino do `doDono()` quando falta página, então alguém com página
   * chega aqui por engano de navegação, e não por vontade.
   *
   * Sem risco de laço: este desvio só acontece quando a página existe, que é
   * exatamente o caso em que o painel abre.
   */
  if ((await idDoNegocioDoDono()) !== null) redirect("/painel");

  const mensagem =
    erro === "nome"
      ? "Informe o nome do negócio."
      : erro === "limite"
        ? "Sua conta já tem uma página no plano gratuito. Abra o painel para editá-la, ou veja os planos para ter mais de uma."
        : (MOTIVOS[erro as Recusa] ?? null);

  return (
    <FormularioCriar
      acao={criarPagina}
      nomeInicial={nome ?? ""}
      mensagem={mensagem}
    />
  );
}
