import Link from "next/link";
import { alternarPublicacao } from "@/app/painel/acoes";
import { BotaoCopiar } from "./BotaoCopiar";
import { BotaoDeAcao } from "./BotaoDeAcao";
import { EstadoDaPagina } from "./EstadoDaPagina";
import { ListaSecoes } from "./ListaSecoes";
import { nomesDosPassos, passosParaOAr } from "./prontidao";
import { IconeAvancar, IconeSeta } from "@/componentes/Icones";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import type { Negocio } from "@/lib/tipos";

/**
 * O estado da página e o caminho para cada parte dela.
 *
 * No celular é o conteúdo de /painel, e a pessoa volta para cá entre uma edição
 * e outra. No computador vira a coluna da esquerda, sempre à vista, e esse
 * vaivém desaparece: dá para ir de Horários direto para Links, e o link da
 * página continua na tela enquanto se edita.
 *
 * Mesmo componente nos dois, e de propósito. Duas versões do estado da página
 * seriam duas chances de uma delas mentir sobre quem enxerga o link.
 */

/**
 * O cartão de cima: o link da página, quem o enxerga, e o que fazer em seguida.
 *
 * **Ele tem duas formas, e a escolha é de `passosParaOAr`.** Enquanto a página
 * ainda estiver crua, quem ocupa o lugar de destaque é o próximo passo de
 * verdade ("Informar o WhatsApp"), com publicar logo abaixo em peso de texto.
 * Assim que a página tem nome, jeito de falar com a dona e algo dizendo o que
 * ela faz, publicar volta a ser a oferta principal, porque aí a pergunta
 * "publica?" passou a ter resposta.
 *
 * Publicar continua alcançável nas duas formas, com o mesmo rótulo em ambas: o
 * que muda é o peso, e nunca a existência. Quem quiser pôr no ar uma página de
 * uma linha só continua a um toque de distância, e o painel deixou de sugerir
 * que essa é a coisa a fazer agora.
 */
export function CartaoEstado({
  negocio,
  provisoria,
}: {
  negocio: Negocio;
  provisoria: boolean;
}) {
  const noAr = negocio.publicado;
  const passos = passosParaOAr(negocio);
  const emMontagem = !noAr && passos.length > 0;
  const proximo = passos[0];

  /**
   * O rótulo de publicar, e por que ele parou de começar com "Entrar".
   *
   * "Entrar e publicar" descrevia o mecanismo pela porta errada: quem lê está
   * dentro do painel, editando a própria página, e "entrar" ali soa como um
   * login que ela já fez. A conta provisória é verdadeira, e nasceu sozinha no
   * primeiro clique de montar a página, então a palavra que faltava é a de
   * quem guarda: o Google. "Publicar com o Google" mantém o verbo do
   * resultado na frente, nomeia o único passo do meio e continua sendo a mesma
   * palavra do começo ao fim do caminho, inclusive na frase de baixo e na tela
   * do plano, que já tinha resolvido esta mesma confusão.
   */
  const publicar = provisoria ? "Publicar com o Google" : "Publicar";

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4">
      <EstadoDaPagina negocio={negocio} />

      {/*
        O mesmo link que está escrito logo acima, inteiro e com o esquema, que
        é o que cola num aplicativo de conversa e abre. O que a tela mostra vem
        do mesmo `DOMINIO_PUBLICO` do `EstadoDaPagina`, então o botão copia o
        link que a pessoa está lendo.
      */}
      <div className="mt-3">
        <BotaoCopiar link={`https://${DOMINIO_PUBLICO}/${negocio.slug}`} />
      </div>

      {emMontagem && proximo ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-suave">
            Com {nomesDosPassos(passos)}, a sua página já pode ir para o ar.
          </p>

          <Link
            href={proximo.href}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-texto px-5 font-semibold text-superficie transition-transform duration-75 active:scale-[0.97]"
          >
            {proximo.rotulo}
            <IconeAvancar className="h-4 w-4" />
          </Link>

          {/*
            Os dois em peso de texto, lado a lado. A prévia de uma página crua
            mostra uma página crua, e publicar agora põe essa mesma página no
            ar: as duas continuam a um toque, e nenhuma das duas se apresenta
            como o que fazer agora.
          */}
          <div className="flex flex-wrap items-center gap-x-6">
            <Link
              href="/painel/previa"
              className="inline-flex min-h-11 items-center text-sm font-medium text-suave underline decoration-borda underline-offset-4 hover:decoration-current"
            >
              Ver a prévia
            </Link>
            <form action={alternarPublicacao}>
              <BotaoDeAcao className="inline-flex min-h-11 items-center text-sm font-medium text-suave underline decoration-borda underline-offset-4 hover:decoration-current">
                {publicar}
              </BotaoDeAcao>
            </form>
          </div>
        </div>
      ) : noAr ? (
        /*
          Página no ar: quem manda é abrir a página, e tirar do ar desce para
          peso de texto.

          **Os dois vinham em botão de altura cheia, um debaixo do outro**, e a
          tela abria oferecendo duas decisões do mesmo tamanho, uma delas sendo
          desfazer a publicação. Quem volta ao painel com a página no ar quer
          ver como ela ficou, ou pegar o link para mandar para alguém. Tirar
          do ar é decisão rara, e rara continua a um toque de distância, com o
          mesmo rótulo, embaixo.
        */
        <div className="mt-4 flex flex-col gap-3">
          <Link
            href={`/${negocio.slug}`}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-borda bg-fundo px-5 font-semibold text-texto transition-transform duration-75 active:scale-[0.97]"
          >
            Ver a página
            <IconeSeta className="h-4 w-4" />
          </Link>

          <form action={alternarPublicacao}>
            <BotaoDeAcao className="inline-flex min-h-11 items-center text-sm font-medium text-suave underline decoration-borda underline-offset-4 hover:decoration-current">
              Tirar do ar
            </BotaoDeAcao>
          </form>
        </div>
      ) : (
        /* Página inteira e guardada: publicar é a resposta, e a prévia
           acompanha em peso de texto. */
        <div className="mt-4 flex flex-col gap-3">
          <form action={alternarPublicacao}>
            <BotaoDeAcao className="flex h-12 w-full items-center justify-center rounded-full bg-texto px-5 font-semibold text-superficie transition-transform duration-75 active:scale-[0.97]">
              {publicar}
            </BotaoDeAcao>
          </form>

          <Link
            href="/painel/previa"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-suave underline decoration-borda underline-offset-4 hover:decoration-current"
          >
            Ver a prévia
          </Link>
        </div>
      )}

      {/*
        A frase nomeia o estado em que a pessoa está, em vez de pedir uma coisa
        que ela acha que já fez. Mesma explicação da tela do plano, com as
        mesmas palavras: uma conta provisória que nasceu no começo da montagem,
        e o Google como o lugar onde a página passa a ser dela.
      */}
      {!noAr && provisoria ? (
        <p className="mt-3 text-xs leading-relaxed text-suave">
          A sua página está numa conta provisória, criada quando você começou a
          montar. O Google guarda ela na sua conta de sempre, e aí o link da sua
          página abre para qualquer pessoa.
        </p>
      ) : null}
    </div>
  );
}

export function Navegacao({
  negocio,
  provisoria,
}: {
  negocio: Negocio;
  provisoria: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <CartaoEstado negocio={negocio} provisoria={provisoria} />
      <nav aria-label="Partes da sua página">
        <ListaSecoes />
      </nav>

      {/* Fora de SECOES de propósito: aquela lista é das partes editáveis da
          página, e nem número nem plano são conteúdo de página.

          Altura de 44 pixels em cada um, e não o espaçamento de 6 que estava
          aqui: eram dois links de 20 pixels de altura, e a coluna também é
          usada no celular deitado. O respiro agora vem de dentro do alvo. */}
      <div className="flex flex-col text-sm">
        <Link
          href="/painel/numeros"
          className="flex min-h-11 items-center text-suave underline-offset-4 hover:underline"
        >
          Números da página
        </Link>
        <Link
          href="/painel/plano"
          className="flex min-h-11 items-center text-suave underline-offset-4 hover:underline"
        >
          Plano e cobrança
        </Link>
      </div>
    </div>
  );
}
