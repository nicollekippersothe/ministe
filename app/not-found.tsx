import Link from "next/link";
import { NOME_PRODUTO } from "@/lib/marca";
import { MODO_VITRINE } from "@/lib/site";

/**
 * Endereço que não existe é oportunidade, não erro. Em vez de um 404 seco,
 * a pessoa que digitou errado (ou que ouviu falar do produto) vê que o
 * endereço está livre.
 */
export default function NaoEncontrado() {
  return (
    <div
      data-tema="areia"
      className="flex min-h-dvh items-center justify-center bg-fundo px-6 py-16"
    >
      <main className="w-full max-w-md text-center">
        <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto">
          Este endereço está disponível
        </h1>
        <p className="mt-3 leading-relaxed text-balance text-suave">
          Não existe página neste endereço. Se o negócio é seu, você pode
          registrá-lo agora.
        </p>

        <Link
          href={MODO_VITRINE ? "/" : "/criar"}
          className="mt-7 inline-flex h-13 items-center justify-center rounded-full bg-texto px-8 text-[1.05rem] font-semibold text-superficie"
        >
          {MODO_VITRINE ? `Conhecer o ${NOME_PRODUTO}` : "Pegar esse endereço"}
        </Link>
        {MODO_VITRINE ? null : (
          <p className="mt-4 text-sm text-suave">
            <Link href="/" className="underline underline-offset-2">
              Conhecer o {NOME_PRODUTO}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
