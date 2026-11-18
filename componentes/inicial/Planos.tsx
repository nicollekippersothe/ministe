import Link from "next/link";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { preco } from "@/lib/formato";
import {
  DIAS_DE_TESTE,
  ITENS_NO_CATALOGO,
  MESES_DE_CORTESIA_PROMETIDOS,
  NOME_DO_PLANO,
  PLANOS,
} from "@/lib/pagamento/precos";

/**
 * Os planos na tela inicial: o que vende o completo.
 *
 * Duas caixas assimétricas, a paga maior porque carrega a decisão. Cada linha
 * diz o que existe: o grátis lista o que já entrega, e o completo lista só o
 * que ele soma por cima, sem repetir o de baixo e sem vender "por tirar" nada.
 *
 * Os valores saem de `lib/pagamento/precos`, a mesma tabela que o checkout usa,
 * então o preço da propaganda e o preço da cobrança nunca divergem. `precos.ts`
 * é puro (sem I/O), então importar aqui não arrasta o gateway para o servidor
 * da página.
 *
 * Os botões não assinam daqui: ninguém deslogado tem conta para cobrar. Os dois
 * levam para a placa da abertura, que é onde a página nasce. A assinatura fica a
 * um toque no painel, depois de existir uma página, e a nota embaixo diz isso
 * sem rodeio.
 */

const DO_GRATIS = [
  <>
    Endereço próprio, <b className="font-semibold text-texto">{DOMINIO_PUBLICO}/seu-nome</b>
  </>,
  <>
    Catálogo de até{" "}
    <b className="font-semibold text-texto">{ITENS_NO_CATALOGO.gratuito} itens</b>, com foto e preço
  </>,
  <>Galeria, horários e o botão do WhatsApp</>,
  <>Cinco temas e cinco texturas para escolher</>,
  <>Dois números dos últimos 7 dias: quem abriu e quem chamou</>,
];

const DO_COMPLETO = [
  <>
    <b className="font-semibold text-texto">Letra própria</b>, para a página ter a sua cara
  </>,
  <>
    Catálogo de até{" "}
    <b className="font-semibold text-texto">{ITENS_NO_CATALOGO.pago} itens</b>
  </>,
  <>
    <b className="font-semibold text-texto">Números completos</b>: de onde vêm as visitas, dia a
    dia, por botão, comparado ao período anterior
  </>,
  <>Cancelamento direto no painel, quando você quiser</>,
];

/** O tique de cada item. Desenhado, e não emoji, como o resto do produto. */
function Certo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mt-0.5 h-4 w-4 shrink-0 text-destaque"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Planos() {
  const anual = preco(PLANOS.anual.valorCentavos).replace(/,00$/, "");

  return (
    <div className="grid max-w-4xl gap-5 sm:grid-cols-[1fr_1.1fr] sm:items-stretch">
      {/* Grátis */}
      <div className="surge flex flex-col rounded-2xl border border-borda bg-superficie p-6 sm:p-8">
        <p className="titulo-venda text-[20px] text-texto">{NOME_DO_PLANO.gratuito}</p>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="titulo-venda text-[38px] leading-none text-texto">R$ 0</span>
          <span className="text-sm text-suave">para sempre</span>
        </p>
        <p className="mt-1 text-sm text-suave">Sua página pública, no ar hoje.</p>

        <ul className="mt-6 flex flex-1 flex-col gap-3 text-base leading-snug text-suave">
          {DO_GRATIS.map((linha, i) => (
            <li key={i} className="flex gap-2.5">
              <Certo />
              <span>{linha}</span>
            </li>
          ))}
        </ul>

        <Link
          href="#comecar"
          className="mt-7 flex h-12 items-center justify-center rounded-lg border border-borda bg-superficie px-6 text-base font-semibold text-texto transition-colors hover:border-suave"
        >
          Criar grátis
        </Link>
      </div>

      {/* Completo */}
      <div className="surge relative flex flex-col rounded-2xl border border-destaque bg-superficie p-6 sm:p-8">

        <p className="titulo-venda text-[20px] text-texto">{NOME_DO_PLANO.pago}</p>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="titulo-venda text-[38px] leading-none text-texto">
            {preco(PLANOS.mensal.valorCentavos)}
          </span>
          <span className="text-sm text-suave">por mês</span>
        </p>
        <p className="mt-1 text-sm text-suave">
          ou <b className="font-semibold text-destaque">{anual} no ano</b>, com{" "}
          {MESES_DE_CORTESIA_PROMETIDOS} meses por nossa conta.
        </p>

        <p className="mt-6 text-sm font-semibold text-texto">
          Tudo do grátis, e mais
        </p>
        <ul className="mt-3 flex flex-1 flex-col gap-3 text-base leading-snug text-suave">
          {DO_COMPLETO.map((linha, i) => (
            <li key={i} className="flex gap-2.5">
              <Certo />
              <span>{linha}</span>
            </li>
          ))}
        </ul>

        <Link
          href="#comecar"
          className="mt-7 flex h-12 items-center justify-center rounded-lg bg-texto px-6 text-base font-semibold text-fundo transition-opacity hover:opacity-90"
        >
          Assinar o Completo
        </Link>
        <p className="mt-3 text-center text-sm text-suave">
          {DIAS_DE_TESTE} dias de teste no cartão de crédito. A assinatura fica a um toque no seu
          painel, depois que a página existir.
        </p>
      </div>
    </div>
  );
}
