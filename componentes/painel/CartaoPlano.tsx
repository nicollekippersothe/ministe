import Link from "next/link";
import type { EstadoDaCobranca } from "@/lib/dados";
import { DIAS_DE_TESTE, PLANOS } from "@/lib/pagamento";

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

  const { titulo, dica, chamada } = conteudo(estado.plano, status, ate);

  return (
    <section className="rounded-2xl border border-borda bg-superficie p-4">
      <p className="text-[1.05rem] leading-snug font-medium text-texto">
        {titulo}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-suave">{dica}</p>
      <p className="mt-2 text-sm">
        <Link
          href="/painel/plano"
          className="inline-flex min-h-11 items-center font-medium text-destaque underline-offset-4 hover:underline"
        >
          {chamada}
        </Link>
      </p>
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
      titulo: "Seu plano é o gratuito",
      dica: `A página fica no ar do mesmo jeito. O plano pago abre a escolha da letra, os números completos e limites maiores, por ${PLANOS.mensal.descricao.split(",")[0]}.`,
      chamada: `Ver os planos e os ${DIAS_DE_TESTE} dias de teste`,
    };
  }

  if (status === "teste") {
    return {
      titulo: `Você está nos ${DIAS_DE_TESTE} dias de teste`,
      dica: ate
        ? `O teste vale até ${ate}, e a primeira cobrança acontece nesse dia.`
        : "Os recursos do plano pago estão liberados.",
      chamada: "Ver a assinatura",
    };
  }

  if (status === "em_atraso") {
    return {
      titulo: "O banco está tentando a cobrança de novo",
      dica: ate
        ? `Sua página segue no ar até ${ate}. Trocar o cartão resolve na hora.`
        : "Sua página segue no ar enquanto o banco tenta de novo.",
      chamada: "Conferir o pagamento",
    };
  }

  if (status === null || status === "encerrada") {
    return {
      titulo: "Seu plano pago vale até o fim do período",
      dica: ate
        ? `Os recursos do plano pago valem até ${ate}, e tudo o que você cadastrou continua salvo depois disso.`
        : "Os recursos do plano pago estão liberados.",
      chamada: "Ver os planos",
    };
  }

  return {
    titulo: "Seu plano é o pago",
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
