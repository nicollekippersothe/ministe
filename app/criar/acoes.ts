"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criar, enderecoLivre } from "@/lib/dados";
import { conferirFormato, normalizar } from "@/lib/slug";

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

  await criar(slug, nome);
  revalidatePath("/painel");
  redirect("/painel?criado=1");
}
