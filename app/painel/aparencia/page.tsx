import Link from "next/link";
import { salvarAparencia } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import { BarraSalvar, Botao } from "@/componentes/painel/Campos";
import { doDono } from "@/lib/dados";
import { FONTE_PADRAO, LISTA_COMBINACOES, podeEscolherFonte } from "@/lib/fontes";
import { preco } from "@/lib/formato";
import { PLANOS } from "@/lib/pagamento";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

export default async function Aparencia({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);
  const pode = podeEscolherFonte(negocio.plano);
  const atual = pode ? negocio.fonte : FONTE_PADRAO;

  return (
    <main className="mt-6">
      {/*
        No computador a coluna da esquerda fica sempre à vista, com as seções
        e o estado da página, então o Voltar seria um segundo caminho
        para onde já dá para ir com um clique.
      */}
      <Link href="/painel" className="text-sm text-suave lg:hidden">
        Voltar
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-texto">
        Letras da sua página
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
        Cada opção aparece escrita com a própria letra e com o nome do seu
        negócio. Apenas a escolhida é carregada por quem visita a página.
      </p>

      {!pode ? (
        <p className="mt-4 rounded-xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
          <strong className="font-semibold text-texto">
            Sua página usa a letra padrão.
          </strong>{" "}
          Escolher outra faz parte do plano pago, a partir de{" "}
          {preco(PLANOS.mensal.valorCentavos)} por mês. As opções abaixo mostram
          como o nome do seu negócio ficaria em cada uma.{" "}
          <Link
            href="/painel/plano"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Ver os planos
          </Link>
          .
        </p>
      ) : null}

      <Aviso salvo={params.salvo === "1"} erro={params.erro} />

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
                  atual === c.chave ? "border-destaque" : "border-borda"
                } ${!pode && atual !== c.chave ? "opacity-60" : ""}`}
              >
                <label
                  htmlFor={id}
                  className={`flex gap-3 p-4 ${pode ? "cursor-pointer" : ""}`}
                >
                  <input
                    id={id}
                    type="radio"
                    name="fonte"
                    value={c.chave}
                    defaultChecked={atual === c.chave}
                    disabled={!pode}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--c-destaque)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="titulo block text-[1.6rem] leading-tight text-texto">
                      {negocio.nome}
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-destaque uppercase">
                      {c.nome}
                      {!pode && c.chave === FONTE_PADRAO ? (
                        <span className="rounded-full bg-aberto-fundo px-2 py-0.5 tracking-normal text-aberto-texto normal-case">
                          sua letra
                        </span>
                      ) : null}
                      {!pode && c.chave !== FONTE_PADRAO ? (
                        <span className="rounded-full bg-fechado-fundo px-2 py-0.5 tracking-normal text-fechado-texto normal-case">
                          plano pago
                        </span>
                      ) : null}
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

        {pode ? (
          <BarraSalvar>
            <Botao type="submit">Salvar</Botao>
          </BarraSalvar>
        ) : null}
      </form>
    </main>
  );
}
