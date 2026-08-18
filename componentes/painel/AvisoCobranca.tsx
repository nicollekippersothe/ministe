import { MOTIVOS_DO_CHECKOUT, MOTIVOS_PAGAMENTO } from "@/lib/pagamento";
import type { MotivoRecusa } from "@/lib/pagamento";

/**
 * O aviso da tela do plano.
 *
 * Espelho de `Aviso.tsx`, com uma diferença que é o motivo de ele existir: os
 * códigos que chegam aqui já têm frase escrita em `lib/pagamento/erros.ts`,
 * guardada pelo teste que recusa palavra negativa. Procurar lá mantém a
 * explicação no mesmo lugar da regra, em vez de abrir um segundo lugar para
 * ela envelhecer.
 */
function mensagem(erro: string): string {
  return (
    MOTIVOS_DO_CHECKOUT[erro] ??
    MOTIVOS_PAGAMENTO[erro as MotivoRecusa] ??
    "Confira os dados e envie de novo."
  );
}

export function AvisoCobranca({ erro }: { erro?: string }) {
  if (!erro) return null;

  return (
    <p
      role="alert"
      className="mt-4 rounded-xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm leading-relaxed text-destaque"
    >
      {mensagem(erro)}
    </p>
  );
}
