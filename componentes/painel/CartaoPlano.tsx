import Link from "next/link";
import type { EstadoDaCobranca } from "@/lib/dados";
import { preco } from "@/lib/formato";
import { DIAS_DE_TESTE, NOME_DO_PLANO, PLANOS } from "@/lib/pagamento";

/**
 * O cartão do plano no painel.
 *
 * Cinco estados, e todos afirmam o que existe: gratuito, teste com a data, pago
 * com a renovação, em atraso, e encerrado dentro do ciclo. Nenhum deles conta o
 * que está faltando, que é a regra de escrita do projeto e é também o que
 * funciona melhor: quem está no gratuito lê uma oferta, e não uma cobrança.
 *
 * O de atraso é o mais importante de acertar. Ele aparece quando o cartão da
 * pessoa voltou do banco, e a coisa certa a dizer é que a página segue no ar
 * até tal dia, com a saída à mão. Falar de recusa ali manda embora justamente
 * quem ia resolver.
 */
export function CartaoPlano({ estado }: { estado: EstadoDaCobranca }) {
  const assinatura = estado.assinatura;
  const ate = dataCurta(estado.expiraEm);
  const status = assinatura?.status ?? null;

  const { olho, titulo, dica, chamada } = conteudo(estado.plano, status, ate);
  // Só o gratuito é convite de venda, e só ele ganha a pílula verde da inicial.
  // Os estados de quem já paga fecham num link discreto, porque ali não se
  // vende nada, se administra.
  const upsell = estado.plano !== "pago";

  return (
    <section className="rounded-2xl border border-borda bg-superficie p-5">
      <span className="font-mono text-[0.7rem] font-medium tracking-[0.14em] text-destaque uppercase">
        {olho}
      </span>
      <p className="titulo mt-2 text-[1.15rem] leading-snug text-texto">
        {titulo}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-suave">{dica}</p>
      {upsell ? (
        <Link
          href="/painel/plano"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#c4e64f] px-5 text-sm font-semibold text-[#1c2408] transition-[background] hover:bg-[#b6da3d]"
        >
          {chamada}
        </Link>
      ) : (
        <p className="mt-3 text-sm">
          <Link
            href="/painel/plano"
            className="inline-flex min-h-11 items-center font-medium text-destaque underline-offset-4 hover:underline"
          >
            {chamada}
          </Link>
        </p>
      )}
    </section>
  );
}

function conteudo(
  plano: EstadoDaCobranca["plano"],
  status: string | null,
  ate: string | null,
) {
  if (plano !== "pago") {
    return {
      olho: "Plano",
      titulo: `Seu plano é o ${NOME_DO_PLANO.gratuito}`,
      dica: `A página fica no ar do mesmo jeito. O ${NOME_DO_PLANO.pago} abre a escolha da letra, os números completos e limites maiores, por ${preco(PLANOS.mensal.valorCentavos)}, com ${DIAS_DE_TESTE} dias de teste.`,
      chamada: "Ver os planos",
    };
  }

  if (status === "teste") {
    return {
      olho: "Teste",
      titulo: `Você está nos ${DIAS_DE_TESTE} dias de teste`,
      dica: ate
        ? `O teste vale até ${ate}, e a primeira cobrança acontece nesse dia.`
        : "Os recursos do plano pago estão liberados.",
      chamada: "Ver a assinatura",
    };
  }

  if (status === "em_atraso") {
    return {
      olho: "Pagamento",
      titulo: "O banco está tentando a cobrança de novo",
      dica: ate
        ? `Sua página segue no ar até ${ate}. Trocar o cartão resolve na hora.`
        : "Sua página segue no ar enquanto o banco tenta de novo.",
      chamada: "Conferir o pagamento",
    };
  }

  if (status === null || status === "encerrada") {
    return {
      olho: "Plano pago",
      titulo: "Seu plano pago vale até o fim do período",
      dica: ate
        ? `Os recursos do plano pago valem até ${ate}, e tudo o que você cadastrou continua salvo depois disso.`
        : "Os recursos do plano pago estão liberados.",
      chamada: "Ver os planos",
    };
  }

  return {
    olho: "Assinatura",
    titulo: `Seu plano é o ${NOME_DO_PLANO.pago}`,
    dica: ate
      ? `A próxima renovação acontece em ${ate}.`
      : "Os recursos do plano pago estão liberados.",
    chamada: "Ver a assinatura",
  };
}

function dataCurta(iso: string | null): string | null {
  if (!iso) return null;
  const quando = Date.parse(iso);
  if (Number.isNaN(quando)) return null;
  return new Date(quando).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}
