"use client";

import Link from "next/link";
import { useState } from "react";
import { categoriaPorId } from "@/lib/categorias";
import { CampoCategoria } from "./CampoCategoria";
import { CampoEndereco } from "./CampoEndereco";
import { BotaoPrincipal, Moldura } from "./Moldura";
import { PreviaViva } from "./PreviaViva";

/**
 * A tela de criar página, com a prévia ao lado no computador.
 *
 * Segura o nome, o endereço e a categoria em estado só para alimentar a prévia.
 * Os campos continuam sendo `input` de verdade, com `name` e valor próprios,
 * então **o formulário envia igual com o JavaScript desligado**: a prévia é
 * enfeite, e nunca muleta. O teste de fluxo confere isso com o JavaScript
 * desligado de propósito.
 *
 * Vive num componente de cliente porque a prévia e os campos precisam do mesmo
 * estado, e o `lado` da Moldura é irmão do formulário, não filho.
 */
export function FormularioCriar({
  acao,
  nomeInicial,
  mensagem,
}: {
  acao: (formData: FormData) => void | Promise<void>;
  nomeInicial: string;
  mensagem: string | null;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [slug, setSlug] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  /*
   * O primeiro campo muda de nome conforme o ramo, e é a única pergunta do
   * cadastro que faz isso.
   *
   * Psicóloga, advogado, personal e fotógrafo assinam com o próprio nome.
   * "Nome do negócio" pede a eles uma coisa que não existe, e o autocomplete
   * de organização faz o navegador oferecer empresa para quem é pessoa.
   * Restaurante e salão são o contrário.
   *
   * Antes de a categoria ser escolhida o rótulo é neutro, porque chutar entre
   * os dois é pior do que perguntar direito: "nome que aparece na página" é
   * verdade nos dois casos, e é o que a prévia ao lado está mostrando.
   */
  const receita = categoriaPorId(categoria);
  const rotuloDoNome =
    receita === null
      ? "Nome que aparece na página"
      : receita.nomeDePessoa
        ? "Seu nome"
        : "Nome do negócio";

  return (
    <Moldura
      titulo="Criar sua página"
      subtitulo="Três respostas agora. O resto pode ser preenchido depois."
      lado={<PreviaViva nome={nome} slug={slug} categoria={categoria} />}
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
      <form action={acao} className="flex flex-col gap-7">
        {/*
          O ramo vem primeiro, e a ordem é a parte que mais muda esta tela.

          Ele é a única resposta que decide as outras: o tipo que vai para o
          Google, o nome da seção do catálogo, se preço aparece, se a galeria
          vem antes, se o endereço da rua faz sentido, e o rótulo do campo
          logo abaixo. Perguntado por último, ele chega quando a pessoa já
          respondeu tudo, e as respostas dela é que teriam que se ajustar.
          Perguntado primeiro, a tela se ajusta a ela.

          Ganha de quebra o momento em que a prévia ao lado sai do vazio: a
          pessoa escolhe "Fotografia" e a página aparece montada, antes de
          digitar uma letra.
        */}
        <CampoCategoria aoMudar={setCategoria} />

        <div>
          <label htmlFor="nome" className="text-[0.95rem] font-medium text-texto">
            {rotuloDoNome}
          </label>
          <input
            id="nome"
            name="nome"
            required
            maxLength={80}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete={receita?.nomeDePessoa ? "name" : "organization"}
            className="mt-3 w-full rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-[1.05rem] text-texto focus:border-destaque focus:outline-none"
          />
        </div>

        <CampoEndereco aoMudar={setSlug} />

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
          A página começa como rascunho, e vai para o ar quando você quiser.
        </p>
      </form>
    </Moldura>
  );
}
