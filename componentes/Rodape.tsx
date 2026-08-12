import { NOME_PRODUTO } from "@/lib/marca";
import type { Negocio } from "@/lib/tipos";

/**
 * O rodape so aparece no plano gratuito. E a assinatura que faz o produto
 * circular, e tirar ela e o primeiro motivo para alguem pagar.
 */
export function Rodape({ negocio }: { negocio: Negocio }) {
  if (negocio.plano !== "gratuito") return null;

  return (
    <footer className="px-5 pt-2 pb-8 text-center">
      <p className="text-xs text-suave">
        feito com{" "}
        <a
          href="/"
          className="font-medium text-suave underline decoration-borda underline-offset-2 hover:text-texto"
        >
          {NOME_PRODUTO}
        </a>
      </p>
    </footer>
  );
}
