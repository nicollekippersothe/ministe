import { planoValido } from "../plano.ts";
import { caminhoGuardado, enderecoPublico, limitarFoco } from "./imagens.ts";
import type {
  Acao,
  Foco,
  Foto,
  Intervalo,
  Item,
  LinkExtra,
  Negocio,
} from "../tipos.ts";

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

/**
 * A imagem de logo ou de capa, com o endereço já montado.
 *
 * A coluna guarda o **caminho dentro do bucket**, e não a URL, que é o desenho
 * da correção 008: o dia em que o projeto do Supabase mudar de endereço, ou o
 * bucket sair para outro provedor, nenhuma linha do banco precisa ser reescrita.
 * O preço é que alguém precisa montar o endereço, e é aqui, no único lugar por
 * onde toda leitura passa.
 *
 * `enderecoPublico` devolve o caminho intacto quando ele já começa com barra,
 * que é o caso dos exemplos e do destino de arquivo local. Assim as duas fontes
 * convivem sem a página pública saber de qual delas a imagem veio.
 */
function foto(url: unknown, alt: string, medida: typeof LOGO): Foto | null {
  const u = enderecoPublico(texto(url));
  return u === null ? null : { url: u, alt, ...medida };
}

/**
 * O ponto focal da capa, quando as duas colunas trazem número.
 *
 * As colunas nascem na correção 014, e ela é aplicada à mão. Enquanto ela não
 * roda, a linha chega sem as duas chaves, isto devolve nulo, e a página corta a
 * capa pelo centro, do jeito que sempre cortou. Um número só, sem o par, também
 * cai no centro: meio ponto focal não é ponto focal.
 */
function foco(x: unknown, y: unknown): Foco | null {
  if (typeof x !== "number" || typeof y !== "number") return null;
  return { x: limitarFoco(x), y: limitarFoco(y) };
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
    /*
     * O endereço público montado aqui, do mesmo jeito que `foto()` faz com a
     * logo e a capa logo abaixo.
     *
     * As tabelas filhas guardam o CAMINHO do bucket, que é o que a restrição
     * da correção 008 exige, e caminho cru é endereço de lugar nenhum: o
     * `next/image` recusa endereço sem barra inicial, e a foto do item sairia
     * quebrada na página com o arquivo inteiro no lugar certo do Storage.
     * O `??` deixa passar o endereço local dos exemplos, que já começa com
     * barra e atravessa a função intacto.
     */
    url: enderecoPublico(String(f.url)) ?? String(f.url),
    alt: String(f.alt ?? ""),
    largura: Number(f.largura ?? 0),
    altura: Number(f.altura ?? 0),
  }));
}

export function paraNegocio(linha: Linha): Negocio {
  const nome = String(linha.nome ?? "");

  const capa = foto(linha.capa_url, nome, CAPA);
  if (capa) capa.foco = foco(linha.capa_foco_x, linha.capa_foco_y);

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
    capa,
    tema: (linha.tema as Negocio["tema"]) ?? "areia",
    fonte: (linha.fonte as Negocio["fonte"]) ?? "moderno",
    categoria: texto(linha.categoria),
    categoriaLivre: texto(linha.categoria_livre),
    /*
     * O plano efetivo, e nunca a coluna crua.
     *
     * A leitura pública entrega `plano` do jeito que está gravado, e ele pode
     * dizer "pago" com `plano_expira_em` no passado. Quem rebaixa no banco é a
     * `plano_de()`, e quem consulta a coluna direto passa longe dela. Ver
     * lib/plano.ts, que é o espelho dessa função.
     */
    plano: planoValido(
      String(linha.plano ?? "gratuito"),
      typeof linha.plano_expira_em === "string" ? linha.plano_expira_em : null,
    ),
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
    /*
     * As duas colunas de imagem voltam a ser caminho antes de entrar no banco.
     *
     * A leitura monta o endereço público, então o `Negocio` que toda tela do
     * painel tem na mão traz a URL inteira. Toda gravação daqui é ler, mexer
     * num campo e escrever o resto de volta, e o resto inclui estas duas. A
     * restrição `capa_url_formato` da correção 008 aceita o caminho do bucket
     * e o endereço local com barra, e uma URL inteira fica fora das duas: o
     * Postgres recusaria a linha toda, inclusive o campo que a pessoa acabou
     * de mexer. Ou seja, a primeira capa enviada travava todo salvamento
     * seguinte do painel.
     */
    logo_url: caminhoGuardado(n.logo?.url),
    capa_url: caminhoGuardado(n.capa?.url),
    /*
     * As duas colunas do ponto focal só entram no update quando existe um ponto
     * gravado, e é proteção contra a ordem das coisas: a correção 014 é aplicada
     * à mão, então o código pode estar no ar antes dela. Mandar coluna que ainda
     * não existe faria o Postgres recusar TODO salvamento desta tela, inclusive
     * o do nome. Como só a tela do ponto focal preenche `foco`, quem nunca tocou
     * nele segue salvando exatamente como salvava.
     */
    ...(n.capa?.foco
      ? { capa_foco_x: n.capa.foco.x, capa_foco_y: n.capa.foco.y }
      : {}),
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
