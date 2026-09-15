import Link from "next/link";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { BotaoCopiar } from "./BotaoCopiar";

/**
 * As peças visuais da tela de Números, na identidade do Entrais.
 *
 * Ficam aqui, puras e sem ida ao banco, por dois motivos: a página de Números
 * passa os dados por prop, e a prévia consegue montar as mesmas peças com
 * números de exemplo. O acento é o marsala da marca, o rótulo vem em
 * monoespaçada como na inicial, e o número grande herda a letra da marca pela
 * classe .titulo que o painel já liga.
 */

/** O rótulo em monoespaçada, no acento da marca. */
export function OlhoValor({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.72rem] font-medium tracking-[0.14em] text-destaque uppercase">
      {children}
    </span>
  );
}

/**
 * O número grande, o coração da tela.
 *
 * O valor herda a letra da marca (.titulo) e fica enorme, porque é a prova de
 * que a página trabalha. A comparação com o período anterior segue afirmando o
 * que houve, sem anunciar queda.
 */
export function CartaoNumero({
  rotulo,
  valor,
  antes,
}: {
  rotulo: string;
  valor: number;
  antes: number | null;
}) {
  return (
    <div className="rounded-2xl border border-borda bg-superficie p-5">
      <p className="titulo text-[3rem] leading-[0.95] text-texto tabular-nums">
        {valor}
      </p>
      <p className="mt-2 text-sm leading-snug font-medium text-texto">
        {rotulo}
      </p>
      {antes === null ? null : (
        <p className="mt-1.5 text-xs leading-snug text-suave">
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
export function comparacao(agora: number, antes: number): string {
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
 * começo. Sem número inventado e sem gráfico vazio com cara de defeito: o
 * endereço em destaque, com o botão de copiar do lado, porque circular o link é
 * exatamente o que falta para os números começarem.
 */
export function ComecoNumeros({
  slug,
  publicado,
}: {
  slug: string;
  publicado: boolean;
}) {
  const link = `https://${DOMINIO_PUBLICO}/${slug}`;
  const endereco = `${DOMINIO_PUBLICO}/${slug}`;

  return (
    <section className="mt-6 rounded-2xl border border-borda bg-superficie p-6">
      <OlhoValor>O começo</OlhoValor>
      <p className="titulo mt-2 text-xl leading-tight text-texto">
        {publicado
          ? "Os seus números começam quando as pessoas abrem a página"
          : "Publique a sua página para a contagem começar"}
      </p>

      {publicado ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-suave">
            Mande este link no seu WhatsApp, ponha na descrição do Instagram e no
            seu perfil do Google. Cada pessoa que abrir entra na conta.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="rounded-xl border border-borda bg-fundo px-4 py-3 text-[1.02rem] font-semibold break-all text-texto">
              {endereco}
            </span>
            <BotaoCopiar link={link} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-suave">
          A contagem vale para quem abre a página no endereço público. Enquanto
          ela estiver só para você, a conta espera.{" "}
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

/** Um item do que a assinatura abre, com o traço do cadeado. */
function ItemPago({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 border-t border-borda py-3 text-sm leading-relaxed text-texto first:border-t-0">
      <span className="mt-0.5 shrink-0 text-destaque" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor">
          <path d="M8 1a3 3 0 0 0-3 3v2H4.5A1.5 1.5 0 0 0 3 7.5v5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 6H11V4a3 3 0 0 0-3-3Zm1.5 5h-3V4a1.5 1.5 0 0 1 3 0v2Z" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}

/**
 * O convite do plano pago, mostrando a forma do que ele abre.
 *
 * Lista o que existe lá, e nada de gráfico de mentira com número inventado: a
 * regra 6 do AGENTS.md vale aqui também. O que já tenta é o gráfico de verdade
 * logo acima, dos dados da própria pessoa. O convite fecha na pílula verde, o
 * mesmo gesto da inicial.
 */
export function PreviaPago({ precoMensal }: { precoMensal: string }) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-borda bg-superficie">
      <div className="border-b border-borda bg-fundo p-6">
        <OlhoValor>Plano pago</OlhoValor>
        <p className="titulo mt-2 text-xl leading-tight text-texto">
          De onde vieram, e o que mudou
        </p>
      </div>
      <div className="p-6">
        <ul className="flex flex-col">
          <ItemPago>Trinta e noventa dias, além dos sete de agora.</ItemPago>
          <ItemPago>Os cliques separados por botão, e não só o do WhatsApp.</ItemPago>
          <ItemPago>A comparação com o período anterior, para ver o que mudou.</ItemPago>
        </ul>
        <Link
          href="/painel/plano"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#c4e64f] px-6 font-semibold text-[#1c2408] transition-[background] hover:bg-[#b6da3d]"
        >
          Ver os planos, a partir de {precoMensal} por mês
        </Link>
      </div>
    </section>
  );
}
