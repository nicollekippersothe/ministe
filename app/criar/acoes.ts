"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categoriaPorId } from "@/lib/categorias";
import { criar, enderecoLivre } from "@/lib/dados";
import { conferirFormato, normalizar } from "@/lib/slug";

/** O banco aceita entre 2 e 40 caracteres em categoria_livre. Ver o schema. */
const LIVRE_MINIMO = 2;
const LIVRE_MAXIMO = 40;

/**
 * O navegador confere o endereço enquanto a pessoa digita, mas quem decide é
 * aqui. Aquela conferência é conforto, não regra: dá para mandar o formulário
 * sem JavaScript, ou com o endereço tendo sido pego no meio do caminho.
 */
export async function criarPagina(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const slug = normalizar(String(formData.get("slug") ?? ""));

  const volta = (erro: string) =>
    redirect(`/criar?erro=${erro}&nome=${encodeURIComponent(nome)}`);

  if (nome === "") volta("nome");

  const recusa = conferirFormato(slug);
  if (recusa) volta(recusa);

  if (!(await enderecoLivre(slug))) volta("ocupado");

  /*
   * A categoria vale se estiver na lista. "Outro", valor inventado e campo
   * vazio caem todos em nulo, que é a receita padrão. Passar pela lista em vez
   * de aceitar o texto do formulário é o que garante o formato que o banco
   * exige, e o que impede uma categoria inventada de virar @type no JSON-LD.
   */
  const escolhida = categoriaPorId(String(formData.get("categoria") ?? ""));
  const livre = String(formData.get("categoria_livre") ?? "")
    .trim()
    .slice(0, LIVRE_MAXIMO);
  const categoriaLivre =
    escolhida === null && livre.length >= LIVRE_MINIMO ? livre : null;

  /*
   * O limite de páginas por conta é gatilho do banco, e não conferência de
   * tela: o painel escreve direto pelo navegador, então limite que morasse só
   * aqui não seria limite. O preço é que a recusa chega como exceção.
   *
   * Sem este try, ela subia como 500 e o navegador mostrava a tela de erro do
   * Next. Foi o que aconteceu de verdade: quem já tinha página e mandava o
   * formulário via "this page couldn't load", sem nenhuma pista do motivo.
   *
   * O try envolve só a criação, e nunca o `redirect` de baixo: o próprio
   * `redirect` funciona levantando uma exceção, e um catch em volta dele
   * engoliria a navegação.
   */
  try {
    await criar(slug, nome, escolhida?.id ?? null, categoriaLivre);
  } catch (erro) {
    const recado = erro instanceof Error ? erro.message : "";
    if (recado.includes("limite")) volta("limite");
    if (recado.includes("duplicate key") || recado.includes("negocios_slug"))
      volta("ocupado");
    throw erro;
  }

  revalidatePath("/painel");
  redirect("/painel?criado=1");
}
