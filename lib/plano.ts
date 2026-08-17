import type { Plano } from "./tipos";

/**
 * O plano que vale agora.
 *
 * Espelha `public.plano_de()`, de supabase/schema.sql, em TypeScript. Os dois
 * precisam concordar: o banco decide quem pode gravar, e isto aqui decide o
 * que a página mostra.
 *
 * A regra é a mesma dos dois lados: pago com vencimento no futuro vale pago,
 * pago sem vencimento vale pago (é a assinatura vitalícia dada na mão), e
 * qualquer outra combinação vale gratuito. Um plano pago que venceu volta a
 * valer como gratuito sozinho, então esquecer de rebaixar alguém nunca vira
 * plano pago para sempre.
 *
 * A coluna `plano` chega crua para quem visita a página: a política de leitura
 * pública entrega a linha inteira, e ela pode dizer "pago" com a data no
 * passado. Por isso a página nunca lê `negocio.plano` do banco direto, e sim o
 * resultado disto.
 *
 * Data que o `Date.parse` recusa cai em gratuito, e é de propósito: a coluna é
 * timestamptz e sempre chega válida, então string quebrada aqui significa bug,
 * e o lado seguro de um bug de cobrança é o gratuito.
 */
export function planoValido(plano: string, expiraEm: string | null): Plano {
  if (plano !== "pago") return "gratuito";
  if (expiraEm === null) return "pago";

  const ate = Date.parse(expiraEm);
  if (Number.isNaN(ate)) return "gratuito";

  return ate > Date.now() ? "pago" : "gratuito";
}
