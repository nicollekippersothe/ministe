/**
 * Regras do endereço público.
 *
 * A mesma lista de reservados existe no banco, em supabase/schema.sql. Aqui ela
 * serve para avisar a pessoa antes de mandar, com uma mensagem em português.
 * Quem manda de verdade é o banco.
 */

export const RESERVADOS = new Set([
  "painel", "api", "login", "entrar", "sair", "cadastro", "criar",
  "admin", "conta", "assinar", "assinatura", "cobranca", "suporte",
  "ajuda", "sobre", "precos", "termos", "privacidade",
  "denunciar", "contato", "blog", "demo", "exemplo",
  "entrais", "app", "www", "static", "assets", "public",
  "_next", "favicon", "robots", "sitemap", "opengraph-image", "icon",
  // Os endereços das páginas de exemplo. Elas são o portfólio do produto e
  // abrem direto de lib/exemplos.ts, então o nome delas fica fora do sorteio.
  "camila-reis", "nara-bittencourt", "teo-sarmento",
  "lia-prado", "bia-marconi", "alecrim-confeitaria",
]);

/**
 * Palavras que fazem o endereço parecer oficial.
 *
 * O golpe não precisa de site falso: basta um endereço nosso que soe como
 * banco, cobrança ou atendimento, e o link circula no WhatsApp sozinho. É por
 * isso que as concorrentes reservam essa família de palavras.
 *
 * A regra é o pedaço, não o endereço inteiro: "pix-caixa" e "central-pix"
 * precisam cair junto com "pix". Por isso a conferência é por pedaço separado
 * por hífen, e não por igualdade. Negócio de verdade quase nunca se chama
 * assim, e quem se chamar fala com o suporte.
 */
export const PEDACOS_BLOQUEADOS = new Set([
  "pix", "banco", "banco-central", "bacen", "boleto", "pagamento",
  "pagamentos", "pagar", "cobranca", "fatura", "cartao", "credito",
  "emprestimo", "financeira", "investimento", "receita", "gov",
  "seguranca", "verificado", "verificacao", "oficial", "atendimento",
  "central", "reembolso", "estorno", "premio", "sorteio", "ganhou",
  "promocao-oficial", "senha", "token", "cpf", "desbloqueio",
  "recadastramento", "atualizacao", "confirmar", "validar",
]);

/** O golpe mais direto é se passar por nós. "entrais-suporte" é isso. */
const MARCA = "entrais";

export const TAMANHO_MINIMO = 3;
export const TAMANHO_MAXIMO = 30;

/** Transforma o que a pessoa digitou num endereço válido, sem reclamar. */
export function normalizar(entrada: string): string {
  return entrada
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, TAMANHO_MAXIMO)
    .replace(/-+$/g, "");
}

export type Recusa =
  | "curto"
  | "longo"
  | "formato"
  | "reservado"
  | "restrito"
  | "ocupado";

/**
 * As frases que a tela diz quando recusa.
 *
 * Elas nomeiam a URL da página, e a palavra dela no produto é "link": endereço
 * ficou reservado para a rua onde a pessoa atende, que é outra coisa e mora
 * noutra tela. As três telas que mostram estas frases falam todas da URL: a
 * linha de link do cadastro, o campo da abertura e a conferência de /criar.
 */
export const MOTIVOS: Record<Recusa, string> = {
  curto: `Use pelo menos ${TAMANHO_MINIMO} caracteres.`,
  longo: `Use no máximo ${TAMANHO_MAXIMO} caracteres.`,
  formato: "Use só letras, números e hífen.",
  reservado: "Esse endereço é reservado. Escolha outro.",
  restrito: "Esse endereço lembra banco ou cobrança. Escolha outro.",
  ocupado: "Esse endereço já está em uso. Tente outro nome.",
};

/** Confere só o formato. Se está ocupado é o banco que sabe. */
export function conferirFormato(slug: string): Recusa | null {
  if (slug.length < TAMANHO_MINIMO) return "curto";
  if (slug.length > TAMANHO_MAXIMO) return "longo";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) return "formato";
  if (RESERVADOS.has(slug)) return "reservado";

  const pedacos = slug.split("-");
  if (pedacos.some((p) => PEDACOS_BLOQUEADOS.has(p))) return "restrito";
  if (pedacos.includes(MARCA)) return "restrito";

  return null;
}
