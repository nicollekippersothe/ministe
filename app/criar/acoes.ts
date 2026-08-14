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

  await criar(slug, nome, escolhida?.id ?? null, categoriaLivre);
  revalidatePath("/painel");
  redirect("/painel?criado=1");
}
