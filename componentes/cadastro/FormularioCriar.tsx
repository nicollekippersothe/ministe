"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categoriaPorId } from "@/lib/categorias";
import { CampoCategoria, OUTRO } from "./CampoCategoria";
import { CampoEndereco } from "./CampoEndereco";
import { BotaoPrincipal, Moldura } from "./Moldura";
import { Pergunta } from "./Pergunta";
import { PreviaViva } from "./PreviaViva";

/** O que a aba guarda enquanto a pessoa responde. */
type Guardado = {
  categoria: string;
  livre: string;
  nome: string;
  slug: string;
};

const CHAVE = "entrais:cadastro";

function lerGuardado(): Guardado | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    if (bruto === null) return null;
    const dados = JSON.parse(bruto) as Partial<Guardado>;
    const guardado: Guardado = {
      categoria: typeof dados.categoria === "string" ? dados.categoria : "",
      livre: typeof dados.livre === "string" ? dados.livre : "",
      nome: typeof dados.nome === "string" ? dados.nome : "",
      slug: typeof dados.slug === "string" ? dados.slug : "",
    };
    const vazio = Object.values(guardado).every((v) => v === "");
    return vazio ? null : guardado;
  } catch {
    // Aba anônima com armazenamento fechado, ou conteúdo estragado. Segue sem.
    return null;
  }
}

function guardar(dados: Guardado) {
  try {
    const vazio = Object.values(dados).every((v) => v === "");
    if (vazio) sessionStorage.removeItem(CHAVE);
    else sessionStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // Guardar é conforto. O formulário funciona igual sem ele.
  }
}

function esquecer() {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {
    // idem
  }
}

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
  const [livre, setLivre] = useState(livreInicial);

  /*
   * As respostas ficam guardadas na aba enquanto a pessoa preenche, e é isso
   * que faz a seta de voltar ser segura.
   *
   * Quem sai daqui e volta pelo histórico do navegador chega numa página nova,
   * montada no servidor: o estado de React que segurava o ramo, o nome e o
   * endereço morreu na saída, e voltar para um formulário em branco é pior do
   * que ficar sem voltar.
   *
   * O endereço da página seria o lugar bonito para guardar, e foi a primeira
   * tentativa. Ela morreu medida: `window.history.replaceState` troca a barra
   * de endereço, e o Next guarda a busca que ele renderizou dentro do próprio
   * `history.state` (`renderedSearch`). No `popstate` ele restaura a dele, e a
   * pessoa volta para `/criar` em branco, com as respostas que estavam na barra
   * jogadas fora. Chamar `router.replace` a cada pausa arruma isso e cobra uma
   * ida ao servidor por pausa de digitação, com leitura de banco junto.
   *
   * Então o lugar é o `sessionStorage`: vive o tempo da aba, some sozinho
   * quando ela fecha, e serve para os três caminhos de volta (a seta, o botão
   * do navegador e a recarga). O que o servidor mandou tem preferência: quando
   * um envio volta recusado, quem manda é a resposta dele.
   */
  const [restaurado, setRestaurado] = useState<Guardado | null>(null);
  const primeira = useRef(true);

  useEffect(() => {
    if (categoriaInicial !== "" || nomeInicial !== "" || slugInicial !== "") {
      return;
    }
    /*
     * A tela pode receber resposta antes de o React assumir: o HTML já sai
     * pronto do servidor, e quem digita rápido (ou um teste de navegador)
     * escreve no campo enquanto o JavaScript ainda carrega. Devolver o que
     * estava guardado por cima disso apagaria o que a pessoa acabou de
     * escrever, então a leitura é do DOM, e não do estado.
     */
    const campo = (seletor: string) =>
      (document.querySelector(seletor) as HTMLInputElement | null)?.value ?? "";
    const jaRespondido =
      campo('input[name="nome"]') !== "" ||
      campo('input[name="slug"]') !== "" ||
      document.querySelector('input[name="categoria"]:checked') !== null;
    if (jaRespondido) return;

    const guardado = lerGuardado();
    if (guardado === null) return;
    setRestaurado(guardado);
    setNome(guardado.nome);
    setEscolha(guardado.categoria);
    setLivre(guardado.livre);
    // Só na montagem: daí em diante quem escreve é a pessoa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const espera = setTimeout(
      () => guardar({ categoria: escolha, livre, nome, slug }),
      300,
    );
    return () => clearTimeout(espera);
  }, [escolha, livre, nome, slug]);

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
  const nomeDe = receita?.nomeDe ?? "qualquer";
  const rotuloDoNome =
    nomeDe === "pessoa"
      ? "Qual é o seu nome?"
      : nomeDe === "lugar"
        ? "Qual é o nome do negócio?"
        : "Que nome vai na página?";
  /*
   * O exemplo acompanha o rótulo. No rótulo neutro ele puxa para pessoa, que é
   * quem está no centro do produto, e casa com o "camila reis" do endereço
   * logo abaixo: os dois juntos mostram como um vira o outro.
   */
  const exemploDoNome =
    nomeDe === "lugar" ? "Aurora Massas" : "Camila Reis";

  const ramoGuardado =
    (restaurado?.categoria ?? "") !== "" || (restaurado?.livre ?? "") !== "";
  const enderecoGuardado = (restaurado?.slug ?? "") !== "";

  return (
    <Moldura
      titulo="Sua galeria em três perguntas"
      voltar={{ href: "/" }}
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
      {/* Enviou, a resposta guardada perdeu a função: a página passa a existir. */}
      <form action={acao} onSubmit={esquecer} className="flex flex-col gap-10">
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
        {/*
          A chave só muda quando existe resposta guardada para este campo:
          remontar por causa do campo vizinho jogaria fora o que a pessoa
          respondeu aqui enquanto a tela terminava de acordar.
        */}
        <CampoCategoria
          key={ramoGuardado ? "ramo-guardado" : "ramo-novo"}
          inicial={restaurado?.categoria ?? categoriaInicial}
          livreInicial={restaurado?.livre ?? livreInicial}
          aoMudar={setEscolha}
          aoMudarLivre={setLivre}
        />

        <div>
          <label htmlFor="nome">
            <Pergunta numero={2}>{rotuloDoNome}</Pergunta>
          </label>
          <input
            id="nome"
            name="nome"
            required
            maxLength={80}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete={nomeDe === "pessoa" ? "name" : nomeDe === "lugar" ? "organization" : undefined}
            placeholder={exemploDoNome}
            aria-invalid={erroNome !== null}
            aria-describedby={erroNome ? "nome-erro" : undefined}
            // Mesma ideia do endereço: a recusa põe o cursor no campo dela.
            autoFocus={erroNome !== null}
            /* scroll-mb deixa a barra do botão fora do caminho quando o
               navegador traz o campo focado para a tela. */
            className={`mt-4 w-full scroll-mb-24 rounded-2xl border bg-superficie px-4 py-3.5 text-[1.05rem] text-texto placeholder:text-suave/70 focus:outline-none ${
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
          key={enderecoGuardado ? "endereco-guardado" : "endereco-novo"}
          inicial={restaurado?.slug ?? slugInicial}
          recusa={erroEndereco}
          aoMudar={setSlug}
        />

        {/*
          As duas dúvidas que aparecem com o dedo em cima do botão, respondidas
          onde elas aparecem, e não numa seção de preços a três telas daqui:
          quanto custa começar, e o que acontece com a página no segundo
          seguinte.
        */}
        <p className="text-center text-sm text-suave">
          Começa de graça, e fica em rascunho até você mandar para o ar.
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
