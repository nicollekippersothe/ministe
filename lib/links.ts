/**
 * Portão por onde passa todo link que o dono digita.
 *
 * O golpe que essa categoria de produto sofre é sempre o mesmo: a página é
 * montada com cara de negócio de verdade, e o botão leva para outro lugar.
 * Quem clica confia na página, não no endereço, porque o endereço nem aparece.
 *
 * As concorrentes (Linktree, Bio.link, Beacons) atacam isso em quatro
 * frentes, e três delas são código:
 *
 *   1. Só http e https. Sem isso, `javascript:` no botão vira script rodando
 *      na página de quem foi visitar uma doceria.
 *   2. Sem encurtador. O encurtador esconde o destino, então o link some do
 *      alcance de qualquer conferência, a nossa e a de quem clica.
 *   3. Sem os disfarces clássicos de endereço: usuário antes do arroba
 *      (`https://nubank.com.br@site-falso.net` abre site-falso.net), IP puro,
 *      e host sem ponto.
 *   4. Denúncia na própria página e uma lista de bloqueio automática. A
 *      denúncia está em app/denunciar. A lista automática precisa de chave,
 *      e está preparada em `conferirNaListaDeRisco`.
 *
 * O que este arquivo não faz: julgar conteúdo. Site legítimo com nome
 * estranho passa, e é assim mesmo. Bloqueio de conteúdo é trabalho da
 * denúncia e da lista de risco, com gente olhando.
 */

export type RecusaLink =
  | "vazio"
  | "invalido"
  | "esquema"
  | "encurtador"
  | "usuario"
  | "endereco_ip"
  | "sem_dominio";

export const MOTIVOS_LINK: Record<RecusaLink, string> = {
  vazio: "escreva o endereço",
  invalido: "endereço inválido",
  esquema: "só endereços que começam com https",
  encurtador: "use o endereço completo, não um link encurtado",
  usuario: "endereço inválido",
  endereco_ip: "use o endereço do site, não o número do servidor",
  sem_dominio: "falta o domínio, como .com.br",
};

/**
 * Encurtadores conhecidos.
 *
 * A lista nunca vai estar completa, e não precisa: encurtador novo não tem
 * tráfego, e o golpista usa o que a vítima reconhece. O que ela pega é o
 * caso comum, e o resto fica para a lista de risco e para a denúncia.
 *
 * `wa.me` não entra: é a própria WhatsApp, e é o link que o produto gera.
 * `linktr.ee` também não: é concorrente, não é golpe, e tem gente que
 * legitimamente aponta para lá enquanto migra.
 */
const ENCURTADORES = new Set([
  "bit.ly", "bitly.com", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
  "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy",
  "tiny.cc", "shorte.st", "adf.ly", "bl.ink", "s.id", "v.gd",
  "encurtador.com.br", "urlz.fr", "short.io", "t.ly", "shrtco.de",
]);

const SO_NUMERO_E_PONTO = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Caracteres invisíveis e de controle de direção do texto.
 *
 * Colados no meio do endereço, deixam o campo com uma cara e o destino com
 * outra. Saem antes de qualquer conferência.
 */
const INVISIVEIS =
  /[\u0000-\u001f\u007f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]/g;

export type ConferenciaLink =
  | { ok: true; url: string }
  | { ok: false; motivo: RecusaLink };

/**
 * Confere e arruma o link. Devolve o endereço já normalizado, que é o que
 * deve ser gravado: quem grava o texto cru grava o disfarce junto.
 */
export function conferirLink(entrada: string | null): ConferenciaLink {
  const limpo = (entrada ?? "").replace(INVISIVEIS, "").trim();
  if (limpo === "") return { ok: false, motivo: "vazio" };

  // Quase ninguém digita o https. Faltando esquema, assume https em vez de
  // recusar, senão o produto reprova a pessoa por um detalhe que ela não tem
  // obrigação de saber. Faltando só as barras, é erro de digitação.
  const comEsquema = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(limpo)
    ? limpo.replace(/^(https?):\/?\/?/i, "$1://")
    : `https://${limpo}`;

  let url: URL;
  try {
    url = new URL(comEsquema);
  } catch {
    return { ok: false, motivo: "invalido" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, motivo: "esquema" };
  }

  if (url.username !== "" || url.password !== "") {
    return { ok: false, motivo: "usuario" };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host === "") return { ok: false, motivo: "invalido" };
  if (host.startsWith("[") || SO_NUMERO_E_PONTO.test(host)) {
    return { ok: false, motivo: "endereco_ip" };
  }
  if (!host.includes(".")) return { ok: false, motivo: "sem_dominio" };
  if (ENCURTADORES.has(host) || ENCURTADORES.has(host.replace(/^www\./, ""))) {
    return { ok: false, motivo: "encurtador" };
  }

  // http vira https. Praticamente todo site atende nos dois, e o que não
  // atende é justamente o que não deveria receber ninguém.
  url.protocol = "https:";
  url.hostname = host;
  return { ok: true, url: url.toString() };
}

/**
 * Lista de risco automática, o quarto pedaço.
 *
 * A Google Safe Browsing é gratuita e é o que as concorrentes usam por baixo.
 * Falta a chave, que é uma chave de API do Google Cloud com a Safe Browsing
 * ligada. Sem chave, devolve "nao_conferido" e o link segue, porque derrubar
 * link de gente honesta por falta de configuração nossa é pior do que a
 * conferência não acontecer.
 *
 * Quando a chave existir, chamar na hora de salvar e na hora de publicar. Na
 * hora de salvar sozinha não basta: o site do outro lado pode virar golpe
 * depois, então uma varredura periódica de tudo que está no ar é o segundo
 * passo, e o `status = 'suspenso'` já existe para receber o resultado.
 */
export type Risco = "limpo" | "suspeito" | "nao_conferido";

export async function conferirNaListaDeRisco(url: string): Promise<Risco> {
  const chave = process.env.GOOGLE_SAFE_BROWSING;
  if (!chave) return "nao_conferido";

  try {
    const r = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${chave}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "entrais", clientVersion: "1" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      },
    );
    if (!r.ok) return "nao_conferido";
    const dados = await r.json();
    return dados.matches?.length ? "suspeito" : "limpo";
  } catch {
    // Google fora do ar não pode derrubar o cadastro de ninguém.
    return "nao_conferido";
  }
}
