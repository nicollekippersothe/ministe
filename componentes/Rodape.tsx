import { NOME_PRODUTO } from "@/lib/marca";
import type { Negocio } from "@/lib/tipos";

/**
 * Duas coisas diferentes no mesmo rodapé.
 *
 * A assinatura só aparece no plano gratuito: é ela que faz o produto
 * circular, e tirar ela é o primeiro motivo para alguém pagar.
 *
 * A denúncia aparece em toda página, inclusive nas pagas. Golpista paga
 * assinatura sem pestanejar, e uma denúncia que só existe na página de quem
 * não pagou não serve para nada. Fica discreta, do tamanho de nota de rodapé,
 * porque a página é do negócio e não nossa.
 */
export function Rodape({ negocio }: { negocio: Negocio }) {
  return (
    <footer className="flex flex-col items-center gap-2 px-5 pt-2 pb-8 text-center">
      {negocio.plano === "gratuito" ? (
        <p className="text-xs text-suave">
          feito com{" "}
          <a
            href="/"
            className="font-medium text-suave underline decoration-borda underline-offset-2 hover:text-texto"
          >
            {NOME_PRODUTO}
          </a>
        </p>
      ) : null}

      <a
        href={`/denunciar?p=${encodeURIComponent(negocio.slug)}`}
        rel="nofollow"
        className="-mx-2 inline-flex min-h-11 items-center px-2 text-xs text-suave underline decoration-borda underline-offset-2 hover:text-texto"
      >
        Denunciar esta página
      </a>
    </footer>
  );
}
