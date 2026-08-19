import Link from "next/link";
import type { Metadata } from "next";
import { exigirLogin } from "@/app/painel/vitrine";
import { Barras, Legenda, type Faixa } from "@/componentes/painel/Barras";
import { cobrancaDoDono, doDono, numerosDoNegocio } from "@/lib/dados";
import { DOMINIO_PUBLICO } from "@/lib/marca";
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
    <div className="pb-16">
      <h1 className="text-2xl font-bold tracking-tight text-texto">Números</h1>
      <p className="mt-1 text-sm leading-relaxed text-suave">
        {pago
          ? "Quantas pessoas abriram a sua página e quantas clicaram nos botões."
          : `Quantas pessoas abriram a sua página e quantas clicaram no WhatsApp, nos últimos ${dias} dias.`}
      </p>

      {pago ? <Janelas atual={dias} /> : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Numero
          rotulo="Abriram a página"
          valor={numeros.totais.visitas}
          antes={numeros.anterior?.visitas ?? null}
        />
        <Numero
          rotulo="Clicaram no WhatsApp"
          valor={numeros.totais.whatsapp}
          antes={numeros.anterior?.whatsapp ?? null}
        />
      </div>

      {vazio ? (
        <Comeco slug={negocio.slug} publicado={negocio.publicado} />
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

      {pago ? null : <OQuePagoMostra />}

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
    <nav aria-label="Período" className="mt-4 flex gap-2">
      {JANELAS.map((d) => (
        <Link
          key={d}
          href={`/painel/numeros?dias=${d}`}
          aria-current={atual === d ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-sm ${
            atual === d
              ? "border-texto font-medium text-texto"
              : "border-borda text-suave"
          }`}
        >
          {d} dias
        </Link>
      ))}
    </nav>
  );
}

function Numero({
  rotulo,
  valor,
  antes,
}: {
  rotulo: string;
  valor: number;
  antes: number | null;
}) {
  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4">
      <p className="text-3xl leading-none font-bold tracking-tight text-texto tabular-nums">
        {valor}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-suave">{rotulo}</p>
      {antes === null ? null : (
        <p className="mt-2 text-xs leading-snug text-suave">
          {comparacao(valor, antes)}
        </p>
      )}
    </div>
  );
}

/**
 * A comparação com o período anterior, sempre afirmando o que houve.
 *
 * Número menor é informação, e não derrota, então a frase conta o que foi em
 * vez de anunciar queda. Período anterior zerado ganha frase própria, porque
 * "aumentou infinito por cento" é o tipo de número que só atrapalha.
 */
function comparacao(agora: number, antes: number): string {
  if (antes === 0 && agora === 0) return "Mesmo período anterior: também zero.";
  if (antes === 0) return "Primeiro período com movimento.";
  if (agora === antes) return `Igual ao período anterior, que teve ${antes}.`;

  const variacao = Math.round(((agora - antes) / antes) * 100);
  return agora > antes
    ? `${variacao}% acima do período anterior, que teve ${antes}.`
    : `Período anterior teve ${antes}.`;
}

/**
 * O estado sem nenhum evento.
 *
 * É a tela que todo dono vê na primeira semana, então ela precisa ler como
 * começo. Sem número inventado e sem gráfico vazio com cara de defeito: mostra
 * o endereço, que é o que falta circular, e diz o que vai acontecer.
 */
function Comeco({ slug, publicado }: { slug: string; publicado: boolean }) {
  const endereco = `${DOMINIO_PUBLICO}/${slug}`;

  return (
    <section className="mt-6 rounded-2xl border border-borda bg-superficie p-4">
      <p className="text-[1.05rem] leading-snug font-medium text-texto">
        {publicado
          ? "Os números aparecem aqui conforme as pessoas abrirem a sua página"
          : "Publique a sua página para a contagem começar"}
      </p>
      {publicado ? (
        <>
          <p className="mt-1 text-sm leading-relaxed text-suave">
            Mande este endereço no seu WhatsApp, ponha na descrição do Instagram
            e no seu perfil do Google. Cada pessoa que abrir entra na conta.
          </p>
          <p className="mt-3 text-[1.05rem] leading-snug font-semibold break-all text-texto">
            {endereco}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm leading-relaxed text-suave">
          A contagem vale para quem abre a página no endereço público. Enquanto
          ela estiver em rascunho, só você a enxerga.{" "}
          <Link
            href="/painel"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Ir para o painel
          </Link>
          .
        </p>
      )}
    </section>
  );
}

/**
 * O convite do plano pago.
 *
 * Lista o que existe lá, e nada de gráfico de mentira com número inventado: a
 * regra 6 do AGENTS.md vale aqui também. O que já tenta é o gráfico de verdade
 * logo acima, que é dos dados da própria pessoa.
 */
function OQuePagoMostra() {
  return (
    <section className="mt-8 rounded-2xl border border-borda bg-superficie p-4">
      <p className="text-[1.05rem] leading-snug font-medium text-texto">
        O plano pago abre o resto dos números
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-sm leading-relaxed text-suave">
        <li>Trinta e noventa dias, além dos sete de agora.</li>
        <li>Os cliques separados por botão, e não só o do WhatsApp.</li>
        <li>A comparação com o período anterior, para ver o que mudou.</li>
      </ul>
      <p className="mt-3 text-sm">
        <Link
          href="/painel/plano"
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          Ver os planos, a partir de {preco(PLANOS.mensal.valorCentavos)} por mês
        </Link>
      </p>
    </section>
  );
}
