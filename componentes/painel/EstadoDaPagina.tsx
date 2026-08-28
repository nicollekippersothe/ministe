import Link from "next/link";
import { IconeSeta } from "@/componentes/Icones";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import type { Negocio } from "@/lib/tipos";

/**
 * O link da página, e quem consegue abrir esse link.
 *
 * **A palavra é "link" desde esta rodada.** "Endereço" nomeava três coisas
 * diferentes no mesmo painel: este link, a rua onde a pessoa atende e o destino
 * de um link extra. Cada uma ficou com um nome só, e este é o link da sua
 * página.
 *
 * **Por que isto deixou de ser uma pílula com bolinha.** O painel dizia o
 * estado numa cápsula colorida com um pontinho do lado, verde para publicada e
 * bege para o resto. Três problemas, e o terceiro é o que decidiu:
 *
 * 1. É o vocabulário de painel administrativo genérico, da mesma família dos
 *    seis padrões que o AGENTS.md já barra. A dona do produto reconheceu de
 *    longe, e disse que aquilo tinha cara de layout gerado.
 * 2. A cápsula verde com bolinha é o desenho do selo de "aberto agora" da
 *    página pública, que fala de horário de atendimento. A mesma peça queria
 *    dizer duas coisas diferentes no mesmo produto.
 * 3. Ela ocupava a posição de destaque para dizer o que o resto do cartão já
 *    diz melhor.
 *
 * **O que entrou no lugar.** O link é o assunto, então é ele que aparece
 * grande, e o estado desceu para uma frase curta embaixo, com as duas palavras
 * que importam em peso de tinta. A diferença que se enxerga de longe está no
 * próprio link: com a página no ar ele abre, sublinhado e com a seta de ir;
 * guardada, ele é texto. Vale mais que uma convenção de cor porque é o que
 * acontece de verdade quando alguém toca ali.
 *
 * **Sobre a palavra.** "Rascunho" descrevia o arquivo e julgava o conteúdo,
 * como se a página estivesse pela metade quando ela pode estar pronta e apenas
 * guardada. "Só para você" descreve o que a dona controla com aquele botão:
 * quem enxerga o link. Ela faz par direto com "No ar", e as duas respondem
 * à mesma pergunta, que é a única que o botão de publicar muda.
 */
export function EstadoDaPagina({
  negocio,
  grande = false,
}: {
  negocio: Negocio;
  grande?: boolean;
}) {
  const noAr = negocio.publicado;

  const link = (
    <>
      {DOMINIO_PUBLICO}/<span className="text-texto">{negocio.slug}</span>
    </>
  );

  const tamanho = grande
    ? "text-2xl leading-snug tracking-tight"
    : "text-[1.05rem] leading-snug";

  return (
    <div>
      {noAr ? (
        <Link
          href={`/${negocio.slug}`}
          /* Nova aba: espiar a página não pode custar a sessão de edição. */
          target="_blank"
          rel="noreferrer"
          className={`-my-2 inline-flex min-h-11 items-center gap-1.5 font-semibold break-all text-suave underline decoration-borda underline-offset-4 hover:decoration-texto ${tamanho}`}
        >
          <span>{link}</span>
          <IconeSeta className="h-4 w-4 shrink-0 text-suave" />
        </Link>
      ) : (
        <p className={`font-semibold break-all text-suave ${tamanho}`}>
          {link}
        </p>
      )}

      <p
        className={`mt-1.5 text-sm leading-relaxed text-suave ${grande ? "max-w-[54ch]" : ""}`}
      >
        <span className="font-semibold text-texto">
          {noAr ? "No ar" : "Só para você"}
        </span>
        .{" "}
        {noAr
          ? "Qualquer pessoa que abrir este link vê a sua página."
          : "Publicar abre este link para qualquer pessoa."}
        {/*
          A segunda frase só no tamanho grande. Ela é o que a coluna estreita
          do computador comporta mal e o resumo no meio da tela comporta bem, e
          é também o que impede as duas de serem a mesma peça duas vezes.
        */}
        {grande ? (
          <>
            {" "}
            {noAr
              ? "O que você salvar aqui aparece nela na mesma hora."
              : "Até lá ela fica guardada aqui com você."}
          </>
        ) : null}
      </p>
    </div>
  );
}
