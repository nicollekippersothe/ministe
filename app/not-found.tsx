import Link from "next/link";
import { NOME_PRODUTO } from "@/componentes/Rodape";

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
        <h1 className="font-titulo text-2xl leading-tight font-bold tracking-tight text-balance text-texto">
          Esse endereço ainda está livre
        </h1>
        <p className="mt-3 leading-relaxed text-balance text-suave">
          Não existe nenhuma página aqui. Se o negócio é seu, dá para pegar esse
          endereço.
        </p>

        <Link
          href="/"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-texto px-7 font-semibold text-superficie"
        >
          Conhecer o {NOME_PRODUTO}
        </Link>
      </main>
    </div>
  );
}
