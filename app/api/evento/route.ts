import { registrarEvento } from "@/lib/dados";

/**
 * Onde a contagem de visitas e cliques chega.
 *
 * O script inline da página pública manda um `navigator.sendBeacon` para cá.
 * Existe uma rota nossa no meio, em vez de o navegador falar com o Supabase
 * direto, por dois motivos: evita o preflight de CORS numa chamada que precisa
 * sair durante a saída da página, e evita pôr o endereço do projeto no HTML de
 * toda página pública.
 *
 * **Responde 204 sempre**, inclusive para endereço que não existe. É a mesma
 * decisão de `registrar_denuncia`, e pelo mesmo motivo: dizer "esse endereço
 * não existe" transformaria a rota num jeito de descobrir quais páginas
 * existem. Quem recusa de verdade é `registrar_evento` no banco, que só escreve
 * para negócio publicado e ativo.
 *
 * O que ela guarda é o que a tabela `eventos` guarda, e nada mais: qual página,
 * que tipo, e quando. Sem IP, sem cookie, sem identificador de aparelho. A
 * política de privacidade publica isso no item 3, então acrescentar qualquer
 * coisa aqui faz aquele texto virar mentira.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = ["visita", "clique_whatsapp", "clique_acao"] as const;
type Tipo = (typeof TIPOS)[number];

/** Um slug plausível. O banco decide se ele existe; aqui é só o formato. */
const FORMATO = /^[a-z0-9-]{1,60}$/;

const NADA = new Response(null, { status: 204 });

export async function POST(pedido: Request) {
  // `sendBeacon` com string manda `text/plain`, então `.json()` recusaria o
  // corpo antes de olhar o conteúdo.
  let corpo: unknown;
  try {
    corpo = JSON.parse(await pedido.text());
  } catch {
    return NADA;
  }

  if (typeof corpo !== "object" || corpo === null) return NADA;

  const { s, t } = corpo as { s?: unknown; t?: unknown };
  const slug = typeof s === "string" ? s : "";
  const tipo = typeof t === "string" ? t : "";

  if (!FORMATO.test(slug)) return NADA;
  if (!TIPOS.includes(tipo as Tipo)) return NADA;

  try {
    await registrarEvento(slug, tipo as Tipo);
  } catch {
    // Banco fora do ar derruba a contagem, e nunca a página de quem está
    // visitando. O beacon já foi embora e ninguém está esperando resposta.
  }

  return NADA;
}
