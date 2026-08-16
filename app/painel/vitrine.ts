import { notFound } from "next/navigation";
import { MODO_VITRINE } from "@/lib/site";
import { configurado } from "@/lib/supabase/config";

/**
 * Fecha as rotas que dependem de conta enquanto ainda não há para onde guardar
 * o que a pessoa escrever.
 *
 * Com o Supabase configurado, o cadastro e o painel abrem: cada pessoa tem a
 * própria conta, a RLS separa uma da outra, e quem manda para o cadastro quando
 * falta conta ou falta página é o `doDono`.
 *
 * Sem Supabase, o único destino é um arquivo no disco do servidor, que seria o
 * mesmo arquivo para todo mundo. Aí a rota responde 404, como se não
 * existisse, em vez de mostrar uma tela que qualquer pessoa poderia usar para
 * editar a página alheia.
 */
export function exigirLogin() {
  if (!configurado && MODO_VITRINE) notFound();
}
