import type {
  Acao,
  Foto,
  Intervalo,
  Item,
  LinkExtra,
  Negocio,
} from "@/lib/tipos";

/**
 * Tradução entre a linha do banco e o Negocio que as telas usam.
 *
 * O banco fala snake_case porque é a convenção do Postgres, e o TypeScript fala
 * camelCase porque é a convenção dele. Traduzir num lugar só é o que permite
 * mudar um dos dois lados sem caçar nome espalhado por vinte arquivos.
 *
 * Logo e capa guardam só a URL no banco. A medida vem da convenção do produto
 * (avatar quadrado, capa em 16 por 9), que é o que o envio de imagem vai
 * garantir, e o texto alternativo sai do nome do negócio, que é o que essas
 * duas imagens de fato mostram. Foto de galeria e foto de item têm alt próprio
 * no banco, porque ali o texto é conteúdo e só o dono sabe escrever.
 */

const LOGO = { largura: 400, altura: 400 };
const CAPA = { largura: 1200, altura: 675 };

type Linha = Record<string, unknown>;

const texto = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v : null;

function foto(url: unknown, alt: string, medida: typeof LOGO): Foto | null {
  const u = texto(url);
  return u === null ? null : { url: u, alt, ...medida };
}

function acao(v: unknown): Acao | null {
  if (v === null || typeof v !== "object") return null;
  const a = v as Record<string, unknown>;
  const rotulo = texto(a.rotulo);
  if (rotulo === null) return null;
  return {
    tipo: (a.tipo as Acao["tipo"]) ?? "whatsapp",
    rotulo,
    url: texto(a.url),
    icone: (a.icone as Acao["icone"]) ?? "link",
  };
}

/** Ordena pela coluna `ordem`, que é como o dono arrastou as coisas no painel. */
const porOrdem = <T extends Linha>(l: T[]): T[] =>
  [...l].sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0));

function fotosDe(linhas: Linha[]): Foto[] {
  return porOrdem(linhas).map((f) => ({
    url: String(f.url),
    alt: String(f.alt ?? ""),
    largura: Number(f.largura ?? 0),
    altura: Number(f.altura ?? 0),
  }));
}

export function paraNegocio(linha: Linha): Negocio {
  const nome = String(linha.nome ?? "");

  const itens: Item[] = porOrdem((linha.itens as Linha[]) ?? []).map((i) => ({
    id: String(i.id),
    titulo: String(i.titulo ?? ""),
    descricao: texto(i.descricao),
    precoCentavos:
      i.preco_centavos === null || i.preco_centavos === undefined
        ? null
        : Number(i.preco_centavos),
    fotos: fotosDe((i.itens_fotos as Linha[]) ?? []),
    ativo: i.ativo !== false,
  }));

  const horarios: Intervalo[] = ((linha.horarios as Linha[]) ?? [])
    .map((h) => ({
      dia: Number(h.dia_semana),
      // O Postgres devolve time como "09:00:00". A tela usa "09:00".
      abre: String(h.abre).slice(0, 5),
      fecha: String(h.fecha).slice(0, 5),
    }))
    .sort((a, b) => a.dia - b.dia || a.abre.localeCompare(b.abre));

  const links: LinkExtra[] = porOrdem((linha.links as Linha[]) ?? []).map(
    (l) => ({
      id: String(l.id),
      rotulo: String(l.rotulo ?? ""),
      url: String(l.url ?? ""),
      icone: (l.icone as LinkExtra["icone"]) ?? "link",
    }),
  );

  return {
    slug: String(linha.slug ?? ""),
    slugAnterior: texto(linha.slug_anterior),
    nome,
    frase: texto(linha.frase),
    logo: foto(linha.logo_url, nome, LOGO),
    capa: foto(linha.capa_url, nome, CAPA),
    tema: (linha.tema as Negocio["tema"]) ?? "areia",
    fonte: (linha.fonte as Negocio["fonte"]) ?? "moderno",
    categoria: texto(linha.categoria),
    categoriaLivre: texto(linha.categoria_livre),
    plano: (linha.plano as Negocio["plano"]) ?? "gratuito",
    publicado: linha.publicado === true,
    acaoPrincipal: acao(linha.acao_principal),
    acaoSecundaria: acao(linha.acao_secundaria),
    whatsapp: texto(linha.whatsapp),
    mensagemPadrao: texto(linha.mensagem_padrao),
    telefone: texto(linha.telefone),
    endereco: texto(linha.endereco),
    cidade: texto(linha.cidade),
    estado: texto(linha.estado),
    cep: texto(linha.cep),
    mapsUrl: texto(linha.maps_url),
    fuso: String(linha.fuso ?? "America/Sao_Paulo"),
    mostrarPrecos: linha.mostrar_precos !== false,
    tituloCatalogo: String(linha.titulo_catalogo ?? "Catálogo"),
    mensagemItem: texto(linha.mensagem_item),
    horarios,
    itens,
    galeria: fotosDe((linha.fotos as Linha[]) ?? []),
    links,
  };
}

/**
 * O caminho de volta, só com o que o dono edita.
 *
 * Plano, status e validade ficam de fora de propósito: são campos de cobrança,
 * e o gatilho protege_cobranca devolveria o valor antigo em silêncio de
 * qualquer jeito. Mandar o que o banco vai ignorar só confunde quem lê depois.
 * Publicado também fica de fora: quem publica é uma ação própria.
 */
export function paraLinha(n: Negocio): Linha {
  return {
    slug: n.slug,
    nome: n.nome,
    frase: n.frase,
    logo_url: n.logo?.url ?? null,
    capa_url: n.capa?.url ?? null,
    tema: n.tema,
    fonte: n.fonte,
    categoria: n.categoria,
    categoria_livre: n.categoriaLivre,
    acao_principal: n.acaoPrincipal,
    acao_secundaria: n.acaoSecundaria,
    whatsapp: n.whatsapp,
    mensagem_padrao: n.mensagemPadrao,
    mensagem_item: n.mensagemItem,
    telefone: n.telefone,
    endereco: n.endereco,
    cidade: n.cidade,
    estado: n.estado,
    cep: n.cep,
    maps_url: n.mapsUrl,
    fuso: n.fuso,
    mostrar_precos: n.mostrarPrecos,
    titulo_catalogo: n.tituloCatalogo,
  };
}

/** O select que traz a página inteira numa viagem só. */
export const TUDO =
  "*, horarios(*), itens(*, itens_fotos(*)), fotos(*), links(*)";
