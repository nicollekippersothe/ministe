import Link from "next/link";
import type { Metadata } from "next";
import { exigirLogin } from "@/app/painel/vitrine";
import { Barras, Legenda, type Faixa } from "@/componentes/painel/Barras";
import {
  CartaoNumero,
  ComecoNumeros,
  PreviaPago,
} from "@/componentes/painel/ValorNumeros";
import { cobrancaDoDono, doDono, numerosDoNegocio } from "@/lib/dados";
import { PLANOS } from "@/lib/pagamento";
import { preco } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Números",
  robots: { index: false, follow: false },
};

/**
 * Quantas pessoas abriram a página, e quantas clicaram.
 *
 * O que cada plano vê, e por quê:
 *
 * - Os dois números grandes e o gráfico dos últimos sete dias aparecem para
 *   todo mundo. É a única prova que o dono tem de que a página está
 *   trabalhando, e esconder isso atrás da assinatura tiraria justamente o que
 *   faria alguém assinar. Além disso são dados que ele já tem direito de ver.
 * - As janelas de trinta e noventa dias, a divisão por botão e a comparação com
 *   o período anterior são do plano pago. É onde mora a pergunta seguinte, que
 *   é de onde vieram.
 *
 * **O portão está na tela, e não no dado.** A tabela `eventos` tem política de
 * select para o dono, então ele lê tudo com o próprio JWT pelo navegador se
 * quiser. É coerente com o resto do painel, que escreve direto no banco pelo
 * navegador, e é melhor do que fingir que os dados dele não são dele. O que a
 * assinatura compra é o trabalho de organizar, e não o segredo do número.
 */
export const dynamic = "force-dynamic";

const JANELAS = [7, 30, 90] as const;

function janelaDaBusca(bruto: string | undefined, pago: boolean): number {
  if (!pago) return 7;
  const n = Number(bruto);
  return JANELAS.includes(n as (typeof JANELAS)[number]) ? n : 7;
}

export default async function Numeros({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  exigirLogin();

  const [params, negocio, cobranca] = await Promise.all([
    searchParams,
    doDono(),
    cobrancaDoDono(),
  ]);

  const pago = cobranca.plano === "pago";
  const dias = janelaDaBusca(params.dias, pago);
  const numeros = await numerosDoNegocio(dias, pago);

  const faixas: Faixa[] = pago
    ? ["visitas", "whatsapp", "acao"]
    : ["visitas", "whatsapp"];

  const vazio = numeros.totais.visitas === 0 && numeros.totais.whatsapp === 0;

  return (
    <div className="pb-16 lg:max-w-2xl">
      <h1 className="titulo text-[2rem] leading-tight text-texto">Números</h1>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        {pago
          ? "Quantas pessoas abriram a sua página e quantas clicaram nos botões."
          : `Quantas pessoas abriram a sua página e quantas clicaram no WhatsApp, nos últimos ${dias} dias.`}
      </p>

      {pago ? <Janelas atual={dias} /> : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <CartaoNumero
          rotulo="Abriram a página"
          valor={numeros.totais.visitas}
          antes={numeros.anterior?.visitas ?? null}
        />
        <CartaoNumero
          rotulo="Clicaram no WhatsApp"
          valor={numeros.totais.whatsapp}
          antes={numeros.anterior?.whatsapp ?? null}
        />
      </div>

      {vazio ? (
        <ComecoNumeros slug={negocio.slug} publicado={negocio.publicado} />
      ) : (
        <section className="mt-6">
          <Barras
            serie={numeros.serie}
            faixas={faixas}
            titulo={`Dia a dia dos últimos ${dias} dias`}
          />
          <Legenda faixas={faixas} />
        </section>
      )}

      {pago ? null : (
        <PreviaPago precoMensal={preco(PLANOS.mensal.valorCentavos)} />
      )}

      <p className="mt-8 text-sm leading-relaxed text-suave">
        A contagem guarda três coisas: qual página, que tipo de clique, e quando.
        Quem visita a sua página fica anônimo para você e para nós.{" "}
        <Link
          href="/privacidade"
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          Como funciona
        </Link>
        .
      </p>
    </div>
  );
}

/** As três janelas do plano pago, como navegação. */
function Janelas({ atual }: { atual: number }) {
  return (
    <nav aria-label="Período" className="mt-5 flex gap-2">
      {JANELAS.map((d) => (
        <Link
          key={d}
          href={`/painel/numeros?dias=${d}`}
          aria-current={atual === d ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            atual === d
              ? "border-destaque bg-destaque font-medium text-superficie"
              : "border-borda text-suave hover:border-texto hover:text-texto"
          }`}
        >
          {d} dias
        </Link>
      ))}
    </nav>
  );
}
