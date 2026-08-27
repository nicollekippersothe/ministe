import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { criarPagina } from "./acoes";
import { exigirLogin } from "@/app/painel/vitrine";
import { FormularioCriar } from "@/componentes/cadastro/FormularioCriar";
import { Moldura } from "@/componentes/cadastro/Moldura";
import { enderecoLivre, idDoNegocioDoDono } from "@/lib/dados";
import { contaProvisoria, usuarioAtual } from "@/lib/supabase/servidor";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { CADASTRO_ABERTO } from "@/lib/site";
import { conferirFormato, MOTIVOS, normalizar, type Recusa } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Criar sua página",
  robots: { index: false, follow: false },
};

/**
 * O que a tela inicial mostra quando alguém usa o campo de link da abertura
 * antes do cadastro existir.
 *
 * Some quando o login entrar. Até lá, quem digita um nome e aperta o botão
 * precisa de uma resposta: dizer que o link está livre é verdade e é útil, e
 * dizer quando o cadastro abre é melhor do que uma página de erro.
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
          : "Confira outro link"
      }
      subtitulo={
        livre
          ? "Comece por ele quando o cadastro abrir."
          : pedido === ""
            ? "Volte e escreva o nome do seu trabalho."
            : (MOTIVOS[recusa as Recusa] ?? MOTIVOS.ocupado)
      }
      /* A volta mora no cabeçalho, e uma vez basta. */
      voltar={{ href: "/", rotulo: "Escolher outro" }}
    >
      <div className="flex flex-col gap-6">
        <p className="leading-relaxed text-suave">
          O cadastro abre junto com o login. Enquanto isso, veja uma galeria
          por dentro.
        </p>

        <Link
          href="/demo"
          className="flex h-13 w-full items-center justify-center rounded-full bg-texto px-6 text-[1.05rem] font-semibold text-superficie"
        >
          Abrir uma galeria
        </Link>
      </div>
    </Moldura>
  );
}

/**
 * Onde cada recusa do servidor aparece na tela.
 *
 * Uma mensagem só, colada no botão, era o que existia antes: no celular ela
 * nascia a 1260px do topo, fora da tela, e falava de um campo que ficava
 * quatrocentos pixels acima. Agora o motivo do link vai para debaixo da linha
 * do link, o do nome para debaixo do nome, e sobra o aviso de conta, que é o
 * único que fala do formulário inteiro e por isso abre no alto.
 */
function ondeMostrar(erro: string | undefined): "nome" | "endereco" | "geral" {
  if (erro === "nome") return "nome";
  if (erro === "limite") return "geral";
  return "endereco";
}

export default async function Criar({
  searchParams,
}: {
  searchParams: Promise<{
    erro?: string;
    nome?: string;
    slug?: string;
    categoria?: string;
    livre?: string;
  }>;
}) {
  const { erro, nome, slug, categoria, livre } = await searchParams;

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
      ? "Escreva o nome que vai na página."
      : erro === "limite"
        ? "Sua conta já tem uma página no plano gratuito. Abra o painel para editar."
        : (MOTIVOS[erro as Recusa] ?? null);
  const onde = ondeMostrar(erro);

  /*
   * O aviso de conta é o único que fala do formulário inteiro, e o único que
   * termina mandando a pessoa embora desta tela. Então ele leva o caminho
   * junto: dizer "abra o painel" e deixar a pessoa procurar o painel é meio
   * recado. O desvio no alto desta função pega quase todo mundo nesse caso,
   * mas quem manda o formulário e só aí passa do limite chega aqui, e chega
   * com o formulário preenchido na frente.
   */
  const geral =
    onde === "geral" && mensagem !== null ? (
      <>
        {mensagem}{" "}
        <Link
          href="/painel"
          className="font-semibold underline underline-offset-4"
        >
          Abrir o painel
        </Link>
      </>
    ) : null;

  /*
   * Quem já entrou com o Google fica sem a linha de "já tem uma página?
   * entrar". Ela é a porta de quem chegou deslogado, e para quem já está
   * dentro ela aponta para o lugar de onde a pessoa veio.
   */
  const [conta, provisoria] = await Promise.all([
    usuarioAtual(),
    contaProvisoria(),
  ]);

  return (
    <FormularioCriar
      acao={criarPagina}
      nomeInicial={nome ?? ""}
      slugInicial={slug ?? ""}
      categoriaInicial={categoria ?? ""}
      livreInicial={livre ?? ""}
      erroNome={onde === "nome" ? mensagem : null}
      erroEndereco={onde === "endereco" ? mensagem : null}
      erroGeral={geral}
      jaEntrou={conta !== null && !provisoria}
    />
  );
}
