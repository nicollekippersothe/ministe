import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { doceria, EXEMPLOS } from "./exemplos";
import { MODO_VITRINE } from "./site";
import type { Negocio } from "./tipos";

/**
 * Camada de dados.
 *
 * Hoje guarda num arquivo local, para dar para percorrer o fluxo inteiro
 * (editar no painel, abrir a página, ver a mudança) sem depender do Supabase.
 * Quando o banco entrar, só este arquivo muda: quem chama continua igual.
 *
 * O arquivo fica fora do git. Se não existir, nasce com o negócio de exemplo.
 */

const ARQUIVO = join(process.cwd(), ".dados", "negocios.json");

async function ler(): Promise<Negocio[]> {
  if (MODO_VITRINE) return EXEMPLOS;
  try {
    return JSON.parse(await readFile(ARQUIVO, "utf8")) as Negocio[];
  } catch {
    return EXEMPLOS.map((n) => ({ ...n }));
  }
}

async function gravar(negocios: Negocio[]): Promise<void> {
  if (MODO_VITRINE) {
    throw new Error("modo vitrine: os dados são somente leitura");
  }
  await mkdir(dirname(ARQUIVO), { recursive: true });
  await writeFile(ARQUIVO, JSON.stringify(negocios, null, 2), "utf8");
}

export async function porSlug(slug: string): Promise<Negocio | null> {
  const todos = await ler();
  return todos.find((n) => n.slug === slug) ?? null;
}

/**
 * O negócio do dono logado. Enquanto não existe login, devolve o único que
 * há. Quando o link mágico entrar, isto passa a receber o id do usuário.
 */
export async function doDono(): Promise<Negocio> {
  const todos = await ler();
  return todos[0] ?? doceria;
}

/** Um endereço só está livre se ninguém pegou. Formato é conferido em lib/slug.ts. */
export async function enderecoLivre(slug: string): Promise<boolean> {
  const todos = await ler();
  return !todos.some((n) => n.slug === slug || n.slugAnterior === slug);
}

export async function criar(slug: string, nome: string): Promise<Negocio> {
  const novo: Negocio = {
    ...doceria,
    slug,
    nome,
    slugAnterior: null,
    acaoPrincipal: null,
    acaoSecundaria: null,
    frase: null,
    logo: null,
    capa: null,
    publicado: false,
    whatsapp: null,
    mensagemPadrao: null,
    mensagemItem: null,
    telefone: null,
    endereco: null,
    cidade: null,
    estado: null,
    cep: null,
    mapsUrl: null,
    horarios: [],
    itens: [],
    galeria: [],
    links: [],
  };

  const todos = await ler();
  todos.push(novo);
  await gravar(todos);
  return novo;
}

export async function salvar(negocio: Negocio): Promise<void> {
  const todos = await ler();
  const i = todos.findIndex((n) => n.slug === negocio.slug);
  if (i >= 0) todos[i] = negocio;
  else todos.push(negocio);
  await gravar(todos);
}

/**
 * Denúncia de página.
 *
 * O destino de verdade é a tabela `denuncias`, com a função
 * `registrar_denuncia` do schema. Enquanto o Supabase não entra, grava no
 * mesmo arquivo local, e em modo vitrine (onde o disco é somente leitura)
 * escreve no log do servidor.
 *
 * O log não é enfeite: na Vercel ele é lido, então a denúncia chega em
 * algum lugar de verdade. O que não dá é fingir que gravou.
 */
export async function registrarDenuncia(denuncia: {
  slug: string;
  motivo: string;
  detalhe: string | null;
}): Promise<void> {
  const linha = { ...denuncia, criadoEm: new Date().toISOString() };

  if (MODO_VITRINE) {
    console.error("DENUNCIA", JSON.stringify(linha));
    return;
  }

  const arquivo = join(process.cwd(), ".dados", "denuncias.json");
  let fila: unknown[] = [];
  try {
    fila = JSON.parse(await readFile(arquivo, "utf8")) as unknown[];
  } catch {
    fila = [];
  }
  fila.push(linha);
  await mkdir(dirname(arquivo), { recursive: true });
  await writeFile(arquivo, JSON.stringify(fila, null, 2), "utf8");
}
