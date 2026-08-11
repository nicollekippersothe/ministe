import { notFound } from "next/navigation";
import { MODO_VITRINE } from "@/lib/site";

/**
 * Fecha as rotas que dependem de login enquanto o login não existe.
 *
 * Chamada no começo de cada página de painel e de cadastro. Em modo vitrine
 * a rota responde 404, como se não existisse, em vez de mostrar uma tela que
 * qualquer pessoa poderia usar.
 */
export function exigirLogin() {
  if (MODO_VITRINE) notFound();
}
