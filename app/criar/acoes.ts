"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categoriaPorId } from "@/lib/categorias";
import { criar, enderecoLivre } from "@/lib/dados";
import { motivoDaRecusa, type RecusaDados } from "@/lib/dados/erros";
import { conferirFormato, normalizar } from "@/lib/slug";

/** O banco aceita entre 2 e 40 caracteres em categoria_livre. Ver o schema. */
const LIVRE_MINIMO = 2;
const LIVRE_MAXIMO = 40;

/** E entre 1 e 80 no nome, pela constraint nome_preenchido. */
const NOME_MAXIMO = 80;

/**
 * O motivo do banco virando a palavra que `/criar` já sabe dizer.
 *
 * O cadastro tem registro de frases próprio, o `MOTIVOS` de lib/slug.ts, porque
 * ele confere o endereço enquanto a pessoa digita e precisa das mesmas palavras
 * nos dois momentos. Então a recusa do banco entra ali pelo nome de lá, em vez
 * de o cadastro ganhar um segundo vocabulário. O painel, que abre depois, usa
 * o motivo direto: ver `Aviso`.
 */
const PALAVRA_DO_CADASTRO: Partial<Record<RecusaDados, string>> = {
  limite_paginas: "limite",
  endereco_ocupado: "ocupado",
  endereco_reservado: "reservado",
  endereco_restrito: "restrito",
  campo_obrigatorio: "nome",
};

/**
 * O navegador confere o endereço enquanto a pessoa digita, mas quem decide é
 * aqui. Aquela conferência é conforto, não regra: dá para mandar o formulário
 * sem JavaScript, ou com o endereço tendo sido pego no meio do caminho.
 */
export async function criarPagina(formData: FormData) {
  // O campo já vem com maxLength de 80, que é o teto da constraint
  // nome_preenchido. O corte aqui é para quem manda o formulário por fora do
  // navegador, do mesmo jeito que a categoria livre é cortada mais abaixo.
  const nome = String(formData.get("nome") ?? "")
    .trim()
    .slice(0, NOME_MAXIMO);
  const slug = normalizar(String(formData.get("slug") ?? ""));

  /*
   * A categoria vale se estiver na lista. "Outro", valor inventado e campo
   * vazio caem todos em nulo, que é a receita padrão. Passar pela lista em vez
   * de aceitar o texto do formulário é o que garante o formato que o banco
   * exige, e o que impede uma categoria inventada de virar @type no JSON-LD.
   */
  const marcada = String(formData.get("categoria") ?? "");
  const escolhida = categoriaPorId(marcada);
  const livre = String(formData.get("categoria_livre") ?? "")
    .trim()
    .slice(0, LIVRE_MAXIMO);
  const categoriaLivre =
    escolhida === null && livre.length >= LIVRE_MINIMO ? livre : null;

  /*
   * A volta leva de novo tudo o que a pessoa já respondeu.
   *
   * Levando só o nome, quem escolhia o ramo no meio de trinta e cinco, digitava
   * o endereço e via "este endereço já está em uso" voltava para um formulário
   * com o ramo em branco e o endereço apagado. O trabalho perdido era o de
   * achar o ramo, que é a resposta mais cara desta tela.
   *
   * O ramo volta como veio marcado, e não como categoria conferida: "outro" e
   * o texto livre também precisam sobreviver à recusa.
   */
  const volta = (erro: string) => {
    const campos = new URLSearchParams({ erro, nome });
    if (slug !== "") campos.set("slug", slug);
    if (marcada !== "") campos.set("categoria", marcada);
    if (livre !== "") campos.set("livre", livre);
    redirect(`/criar?${campos}`);
  };

  if (nome === "") volta("nome");

  const recusa = conferirFormato(slug);
  if (recusa) volta(recusa);

  if (!(await enderecoLivre(slug))) volta("ocupado");

  /*
   * O limite de páginas por conta é gatilho do banco, e não conferência de
   * tela: o painel escreve direto pelo navegador, então limite que morasse só
   * aqui não seria limite. O preço é que a recusa chega como exceção.
   *
   * Sem este try, ela subia como 500 e o navegador mostrava a tela de erro do
   * Next. Foi o que aconteceu de verdade: quem já tinha página e mandava o
   * formulário via "this page couldn't load", sem nenhuma pista do motivo.
   *
   * Quem lê a exceção agora é lib/dados/erros.ts, num lugar só, em vez do
   * `message.includes` que morava aqui. `motivoDaRecusa` devolve nulo para o
   * que veio de outro lugar, e aí a exceção segue subindo: bug de código e a
   * navegação do próprio `redirect` continuam sendo o que são.
   *
   * O try envolve só a criação, e nunca o `redirect` de baixo: o próprio
   * `redirect` funciona levantando uma exceção, e um catch em volta dele
   * engoliria a navegação.
   */
  try {
    await criar(slug, nome, escolhida?.id ?? null, categoriaLivre);
  } catch (erro) {
    const motivo = motivoDaRecusa(erro);
    const palavra = motivo === null ? undefined : PALAVRA_DO_CADASTRO[motivo];
    if (palavra) volta(palavra);
    throw erro;
  }

  revalidatePath("/painel");
  redirect("/painel?criado=1");
}
