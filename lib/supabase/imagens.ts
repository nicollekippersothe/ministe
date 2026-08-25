import { SUPABASE_URL } from "./config.ts";
import type { Foco } from "../tipos.ts";

/**
 * As regras do bucket de imagens, escritas uma vez do lado do código.
 *
 * Todo número e todo formato daqui é cópia do que o banco já exige, e o banco é
 * quem manda. Quando os dois divergirem, o certo é este arquivo se mexer:
 *
 * - `supabase/storage.sql` cria o bucket `imagens`, público na leitura, com
 *   `file_size_limit` de 3145728 bytes e `allowed_mime_types` em
 *   image/webp, image/jpeg e image/png. As quatro políticas de RLS amarram
 *   escrita, troca e remoção à primeira pasta do caminho, que precisa ser o id
 *   de um negócio de quem está enviando.
 * - `supabase/correcoes/003-fechar-listagem-do-bucket.sql` fecha a listagem: o
 *   arquivo continua abrindo pela URL pública, e enxergar a lista do bucket é
 *   coisa do dono.
 * - `supabase/correcoes/008-envio-de-imagem.sql` decide o que a coluna guarda:
 *   o CAMINHO DENTRO DO BUCKET, no padrão {negocio_id}/{pasta}/{uuid}.{ext},
 *   com a extensão na lista curta. A restrição compara a primeira pasta com o
 *   id da própria linha, então a linha e o arquivo ficam presos um ao outro.
 *   Quem monta o endereço público é o código, e é a função `enderecoPublico`
 *   daqui.
 *
 * O nome do arquivo é um uuid novo a cada envio, inclusive na troca. É de
 * propósito, e o motivo está escrito na 008: caminho novo é URL nova, e URL
 * nova aparece na hora, em vez de a CDN servir a imagem anterior por horas.
 */

/** O id do bucket, igual ao de storage.sql. */
export const BUCKET = "imagens";

/** O teto por arquivo, igual ao `file_size_limit` do bucket. */
export const LIMITE_BYTES = 3145728;

/** Em MB, do jeito que a frase de tela fala. */
export const LIMITE_MB = LIMITE_BYTES / 1024 / 1024;

/**
 * Os três tipos que o bucket aceita, com a extensão que vai para o caminho.
 *
 * image/jpeg vira `jpg` porque a restrição da 008 aceita jpg e jpeg, e um dos
 * dois basta para o caminho ser sempre previsível.
 */
export const TIPOS_ACEITOS = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type TipoAceito = keyof typeof TIPOS_ACEITOS;

/** O `accept` do campo de arquivo, para o celular já abrir na galeria certa. */
export const ACCEPT = Object.keys(TIPOS_ACEITOS).join(",");

/**
 * As duas pastas que moram numa coluna da linha do negócio, uma imagem cada.
 *
 * Continuam sendo duas de propósito, e o tipo continua com este nome: quem
 * escreve `Record<PastaDeImagem, ...>` está descrevendo as imagens da própria
 * página, uma por coluna, e é isso que `MEDIDAS` e o `LADO_MAXIMO` de
 * componentes/painel/reduzirImagem.ts fazem. A foto de item entra logo abaixo,
 * por outra porta, porque ela é linha de tabela filha e não coluna.
 */
export type PastaDeImagem = "logo" | "capa";

export function ehPasta(valor: unknown): valor is PastaDeImagem {
  return valor === "logo" || valor === "capa";
}

/**
 * A pasta da foto de produto.
 *
 * **O nome dela é `catalogo`, e quem decide isso é o banco.** A restrição
 * `url_formato` de `itens_fotos`, na correção 008, exige
 * `{negocio_id}/catalogo/{uuid}.{ext}` palavra por palavra, do mesmo jeito que
 * exige `/logo/` e `/capa/` nas duas colunas do negócio e `/galeria/` em
 * `fotos`. Qualquer outro nome de pasta sobe para o bucket e é recusado na hora
 * de virar linha, com o arquivo já ocupando o Storage. O cabeçalho deste
 * arquivo diz a regra: quando o código e o banco divergirem, quem se mexe é o
 * código.
 */
export const PASTA_DO_ITEM = "catalogo";

/** Toda pasta que o bucket recebe hoje: as duas do negócio, e a do catálogo. */
export type PastaDoBucket = PastaDeImagem | typeof PASTA_DO_ITEM;

export function ehPastaDoBucket(valor: unknown): valor is PastaDoBucket {
  return ehPasta(valor) || valor === PASTA_DO_ITEM;
}

/**
 * A medida de cada uma, igual à convenção de lib/supabase/mapa.ts: avatar
 * quadrado, capa em 16 por 9, foto de produto em 4 por 3.
 *
 * O 4 por 3 da foto de item é a moldura que componentes/Catalogo.tsx desenha
 * para ela, e `largura` e `altura` de `itens_fotos` aceitam nulo: elas dizem ao
 * next/image a proporção do cartão, e o corte fino fica com o `object-cover`.
 */
export const MEDIDAS: Record<PastaDoBucket, { largura: number; altura: number }> = {
  logo: { largura: 400, altura: 400 },
  capa: { largura: 1200, altura: 675 },
  [PASTA_DO_ITEM]: { largura: 1200, altura: 900 },
};

/** Como cada uma se chama na tela. */
export const ROTULOS: Record<PastaDoBucket, string> = {
  logo: "Foto de perfil",
  capa: "Capa da página",
  [PASTA_DO_ITEM]: "Foto do item",
};

/**
 * A legenda da foto de um item, derivada do título dele.
 *
 * Uma regra, e um lugar só. Ela estava escrita em três: na ação que envia, na
 * gravação do Postgres e na prévia do painel, com três recortes diferentes, e
 * a da ação era descartada no caminho do banco e valia no caminho de arquivo.
 * Ou seja, a mesma tela anunciava uma coisa para o leitor de tela e guardava
 * outra, dependendo de onde o dado estava.
 *
 * O corte é o da coluna `alt_preenchido`, que aceita 160. Como `titulo` para em
 * 80, título válido é sempre legenda válida, e o corte aqui é cinto.
 *
 * Enquanto tela nenhuma oferece campo de legenda, toda legenda desta tabela
 * saiu daqui, então derivar de novo a cada gravação sobrescreve texto de
 * ninguém. O dia em que existir esse campo, este é o lugar de parar.
 */
export function legendaDaFoto(titulo: string): string {
  return titulo.trim().slice(0, 160);
}

export type RecusaImagem = "tipo" | "tamanho" | "envio" | "guardar";

/**
 * Uma frase por motivo, do jeito que ela aparece na tela.
 *
 * Mesmo desenho de MOTIVOS_LINK e de MOTIVOS_DADOS: a frase mora junto da
 * regra que a levanta, diz o que existe e termina numa saída.
 */
export const MOTIVOS_IMAGEM: Record<RecusaImagem, string> = {
  tipo: "Esta tela guarda imagem em JPG, PNG ou WebP. Escolha um arquivo em um desses três e siga.",
  tamanho: `Cada imagem entra com até ${LIMITE_MB} MB. Escolha uma foto mais leve, ou reduza esta no próprio celular.`,
  envio:
    "A imagem continua aqui com você. Escolha o arquivo de novo e a página recebe a foto.",
  guardar:
    "O arquivo chegou, e a página segue com a imagem de agora. Escolha o arquivo de novo e siga.",
};

/**
 * A conferência que roda antes de subir qualquer byte.
 *
 * O bucket confere a mesma coisa do outro lado, e é ele quem manda: esta aqui
 * existe para a pessoa saber na hora, em vez de esperar 3 MB subirem para
 * receber um erro de API em inglês.
 */
export function conferirArquivo(arquivo: { type: string; size: number }):
  | { ok: true; tipo: TipoAceito }
  | { ok: false; motivo: RecusaImagem } {
  if (!(arquivo.type in TIPOS_ACEITOS)) return { ok: false, motivo: "tipo" };
  if (arquivo.size > LIMITE_BYTES) return { ok: false, motivo: "tamanho" };
  return { ok: true, tipo: arquivo.type as TipoAceito };
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const EXTENSOES = "webp|jpg|jpeg|png";

/** O caminho novo, no padrão que a restrição da 008 exige. */
export function caminhoDeImagem(
  negocioId: string,
  pasta: PastaDoBucket,
  tipo: TipoAceito,
): string {
  return `${negocioId}/${pasta}/${crypto.randomUUID()}.${TIPOS_ACEITOS[tipo]}`;
}

/**
 * O mesmo teste da restrição `logo_url_formato` e `capa_url_formato`, escrito
 * em JavaScript.
 *
 * A Server Action que grava a coluna recebe o caminho pela rede, e Server
 * Action é endereço público: sem este teste, um PATCH montado à mão poria
 * qualquer texto na coluna. O banco recusaria depois, com a 008 aplicada, e é
 * justamente por isso que a conferência daqui repete a de lá palavra por
 * palavra, incluindo a primeira pasta ter que ser o id da própria linha.
 *
 * Vale igual para `itens_fotos`: a restrição de lá é a mesma, com `/catalogo/`
 * no lugar de `/logo/`, e é por isso que a pasta é parâmetro em vez de estar
 * escrita no meio do padrão.
 */
export function caminhoValido(
  caminho: string,
  negocioId: string,
  pasta: PastaDoBucket,
): boolean {
  const padrao = new RegExp(`^${UUID}/${pasta}/${UUID}\\.(${EXTENSOES})$`);
  return padrao.test(caminho) && caminho.split("/")[0] === negocioId;
}

/**
 * O endereço que o navegador abre, montado a partir do caminho guardado.
 *
 * Duas formas entram, que são as duas que a 008 aceita na coluna: o endereço
 * local começando com barra, das páginas de exemplo e do modo de arquivo, que
 * já é um endereço; e o caminho do bucket, que vira a URL pública do Storage.
 *
 * O bucket é público na leitura, então este endereço abre para qualquer
 * visitante, com a listagem fechada do jeito que a 003 deixou.
 */
export function enderecoPublico(caminho: string | null | undefined): string | null {
  if (typeof caminho !== "string" || caminho.trim() === "") return null;
  if (caminho.startsWith("/")) return caminho;
  if (SUPABASE_URL === "") return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${caminho}`;
}

/**
 * O caminho de volta: o que a coluna precisa guardar, a partir do que a leitura
 * devolveu.
 *
 * **Isto existe porque a volta estava faltando, e a falta dela era gravação
 * recusada pelo banco.** `lib/supabase/mapa.ts` monta o endereço público na
 * leitura, então o `Negocio` que toda tela do painel tem na mão traz
 * `logo.url` e `capa.url` como URL inteira. Toda gravação do painel é ler,
 * mexer num campo e escrever o resto de volta, e o resto inclui essas duas
 * colunas. A restrição `capa_url_formato` da correção 008 aceita duas formas, o
 * caminho do bucket e o endereço local com barra, e uma URL inteira fica fora
 * das duas: o Postgres recusa a linha inteira, inclusive o campo que a pessoa
 * acabou de mexer.
 *
 * Medido com `caminhoValido`, que é a mesma restrição escrita em JavaScript: o
 * caminho guardado passa, e o endereço que `enderecoPublico` devolve para ele
 * volta falso.
 *
 * Três formas entram e cada uma sai do jeito que a coluna aceita: a URL pública
 * do nosso bucket volta a ser caminho, o endereço local com barra segue
 * inteiro, e o caminho do bucket já está no formato final.
 */
export function caminhoGuardado(
  valor: string | null | undefined,
): string | null {
  if (typeof valor !== "string" || valor.trim() === "") return null;
  const prefixo = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (SUPABASE_URL !== "" && valor.startsWith(prefixo)) {
    return valor.slice(prefixo.length);
  }
  return valor;
}

/**
 * O ponto da capa que precisa aparecer, virando CSS.
 *
 * `object-position` é o que faz o `object-cover` cortar por onde a dona da
 * página escolheu, em vez de sempre pelo centro. Vale para qualquer proporção
 * de tela e para qualquer proporção de foto, e custa dois números.
 *
 * Valor ausente devolve o centro, que é o mesmo corte de antes de a coluna
 * existir. É essa linha que deixa o código ir para o ar antes da correção 014
 * ser aplicada à mão: a página lê nulo e desenha o que sempre desenhou.
 */
export function posicaoDoFoco(foco: Foco | null | undefined): string {
  if (!foco) return "50% 50%";
  return `${limitarFoco(foco.x)}% ${limitarFoco(foco.y)}%`;
}

/** Mesma faixa da restrição `capa_foco_faixa` da 014: de 0 a 100, inteiro. */
export function limitarFoco(valor: number): number {
  if (!Number.isFinite(valor)) return 50;
  return Math.min(100, Math.max(0, Math.round(valor)));
}
