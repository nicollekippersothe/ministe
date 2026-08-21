"use client";

import Link from "next/link";
import { useState } from "react";
import { categoriaPorId } from "@/lib/categorias";
import { CampoCategoria, OUTRO } from "./CampoCategoria";
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
 *
 * Os três `*Inicial` são o que a pessoa já tinha respondido quando o servidor
 * recusou o envio. Antes voltava só o nome, então quem errasse o endereço
 * perdia junto o ramo que tinha achado no meio de trinta e cinco, e recomeçava.
 */
export function FormularioCriar({
  acao,
  nomeInicial,
  slugInicial,
  categoriaInicial,
  livreInicial,
  erroNome,
  erroEndereco,
  erroGeral,
}: {
  acao: (formData: FormData) => void | Promise<void>;
  nomeInicial: string;
  slugInicial: string;
  categoriaInicial: string;
  livreInicial: string;
  erroNome: string | null;
  erroEndereco: string | null;
  erroGeral: string | null;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [slug, setSlug] = useState("");
  const [escolha, setEscolha] = useState(categoriaInicial);

  /*
   * A prévia lê a receita, e "outro" não tem receita: ali ela mostra a padrão.
   * Mas a frase embaixo dela precisa saber que a pessoa já respondeu, senão
   * quem escolhe "Outro" fica olhando "escolha o seu ramo" para sempre.
   */
  const categoria = escolha === "" || escolha === OUTRO ? null : escolha;

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
   * os dois é pior do que perguntar direito: "o nome que vai na página" é
   * verdade nos dois casos, e é o que a prévia ao lado está mostrando.
   */
  const receita = categoriaPorId(categoria);
  const rotuloDoNome =
    receita === null
      ? "O nome que vai na página"
      : receita.nomeDePessoa
        ? "Seu nome"
        : "Nome do negócio";
  /*
   * O exemplo acompanha o rótulo. No rótulo neutro ele puxa para pessoa, que é
   * quem está no centro do produto, e casa com o "camila reis" do endereço
   * logo abaixo: os dois juntos mostram como um vira o outro.
   */
  const exemploDoNome =
    receita === null || receita.nomeDePessoa ? "Camila Reis" : "Aurora Massas";

  return (
    <Moldura
      titulo="Criar sua página"
      subtitulo="Três respostas agora. O resto você preenche depois."
      lado={
        <PreviaViva
          nome={nome}
          slug={slug}
          categoria={categoria}
          escolhido={escolha !== ""}
        />
      }
      rodape={
        <p className="text-center text-[0.95rem] text-suave">
          Já tem uma página?{" "}
          <Link
            href="/entrar"
            className="inline-flex min-h-11 items-center px-1 font-medium text-destaque underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form action={acao} className="flex flex-col gap-7">
        {erroGeral ? (
          <p
            role="alert"
            className="rounded-2xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm leading-relaxed text-destaque"
          >
            {erroGeral}
          </p>
        ) : null}

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
        <CampoCategoria
          inicial={categoriaInicial}
          livreInicial={livreInicial}
          aoMudar={setEscolha}
        />

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
            placeholder={exemploDoNome}
            aria-invalid={erroNome !== null}
            aria-describedby={erroNome ? "nome-erro" : undefined}
            // Mesma ideia do endereço: a recusa põe o cursor no campo dela.
            autoFocus={erroNome !== null}
            /* scroll-mb deixa a barra do botão fora do caminho quando o
               navegador traz o campo focado para a tela. */
            className={`mt-3 w-full scroll-mb-24 rounded-2xl border bg-superficie px-4 py-3.5 text-[1.05rem] text-texto focus:outline-none ${
              erroNome
                ? "border-destaque"
                : "border-borda focus:border-destaque"
            }`}
          />
          {erroNome ? (
            <p id="nome-erro" role="alert" className="mt-2.5 text-sm text-destaque">
              {erroNome}
            </p>
          ) : null}
        </div>

        <CampoEndereco
          inicial={slugInicial}
          recusa={erroEndereco}
          aoMudar={setSlug}
        />

        <p className="text-center text-sm leading-relaxed text-suave">
          A página começa como rascunho, e vai para o ar quando você quiser.
        </p>

        {/*
          No celular o botão ficava a 1260px do topo, quase duas telas abaixo
          da dobra: a pessoa terminava de responder e tinha que ir procurar o
          botão. Grudado embaixo ele fica sempre à mão, e solta sozinho quando
          o formulário acaba, que é onde o rodapé precisa aparecer. No
          computador a tela inteira cabe de uma vez, e ele volta a ser um botão
          normal no fim da coluna.

          O esmaecido em cima da barra é o que faz o texto que passa por baixo
          sumir aos poucos. Com a borda sozinha, a linha de texto ficava
          cortada ao meio na altura da barra e parecia defeito.
        */}
        <div className="sticky bottom-0 z-20 -mx-6 lg:static lg:mx-0">
          <div
            aria-hidden
            className="pointer-events-none h-6 bg-gradient-to-t from-fundo to-transparent lg:hidden"
          />
          <div className="bg-fundo px-6 pb-3 lg:bg-transparent lg:p-0">
            <BotaoPrincipal type="submit">Criar página</BotaoPrincipal>
          </div>
        </div>
      </form>
    </Moldura>
  );
}
