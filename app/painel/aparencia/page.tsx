import Link from "next/link";
import { salvarAparencia } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import { BarraSalvar, Botao } from "@/componentes/painel/Campos";
import { doDono } from "@/lib/dados";
import { LISTA_COMBINACOES } from "@/lib/fontes";

export const dynamic = "force-dynamic";

export default async function Aparencia({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string }>;
}) {
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  return (
    <main className="mt-6">
      <Link href="/painel" className="text-sm text-suave">
        Voltar
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-texto">
        Letras da sua página
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        Cada opção aparece escrita com a própria letra e com o nome do seu
        negócio. Apenas a escolhida é carregada por quem visita a página.
      </p>

      <Aviso salvo={params.salvo === "1"} />

      <form action={salvarAparencia} className="mt-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Escolha a combinação de letras</legend>

          {LISTA_COMBINACOES.map((c) => {
            const id = `fonte-${c.chave}`;
            return (
              <div
                key={c.chave}
                data-fonte={c.chave}
                className={`rounded-2xl border bg-superficie ${c.classe} ${
                  negocio.fonte === c.chave
                    ? "border-destaque"
                    : "border-borda"
                }`}
              >
                <label htmlFor={id} className="flex cursor-pointer gap-3 p-4">
                  <input
                    id={id}
                    type="radio"
                    name="fonte"
                    value={c.chave}
                    defaultChecked={negocio.fonte === c.chave}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--c-destaque)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="titulo block text-[1.6rem] leading-tight text-texto">
                      {negocio.nome}
                    </span>
                    <span className="mt-2 block text-xs font-semibold tracking-[0.1em] text-destaque uppercase">
                      {c.nome}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-suave">
                      {c.descricao}
                    </span>
                  </span>
                </label>
              </div>
            );
          })}
        </fieldset>

        <BarraSalvar>
          <Botao type="submit">Salvar</Botao>
        </BarraSalvar>
      </form>
    </main>
  );
}
