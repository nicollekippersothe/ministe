import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { redirect } from "next/navigation";
import { doceria, EXEMPLOS } from "./exemplos";
import { montar } from "./novo";
import { MODO_VITRINE } from "./site";
import { configurado } from "./supabase/config";
import { paraLinha, paraNegocio, TUDO } from "./supabase/mapa";
import { garantirConta, servidor, usuarioAtual } from "./supabase/servidor";
import type { Negocio } from "./tipos";

/**
 * Camada de dados.
 *
 * Dois destinos, escolhidos por configuração e não por código espalhado:
 *
 * - Com o Supabase configurado, fala com o banco pelo cookie de sessão de quem
 *   está pedindo, então cada consulta roda como aquela pessoa e a RLS decide o
 *   que ela enxerga.
 * - Sem configuração, guarda num arquivo local. É o que deixa `npm run dev` e
 *   o teste de fluxo rodarem inteiros sem depender de rede, e é também o que
 *   segura a tela inicial com os exemplos.
 *
 * Quem chama não sabe a diferença, o que é o ponto: a troca de destino nunca
 * precisou mexer em página nenhuma.
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
  if (!configurado) {
    const todos = await ler();
    return todos.find((n) => n.slug === slug) ?? null;
  }

  const sb = await servidor();
  const { data } = await sb
    .from("negocios")
    .select(TUDO)
    .eq("slug", slug)
    .maybeSingle();

  return data ? paraNegocio(data) : null;
}

/**
 * A página de quem está logado.
 *
 * Sem conta, ou com conta mas ainda sem página, manda para o cadastro, que é o
 * lugar onde as duas coisas se resolvem. Por isso o retorno continua sendo um
 * negócio e não um talvez: `redirect` interrompe, então quem chama segue com
 * dado de verdade na mão.
 */
export async function doDono(): Promise<Negocio> {
  if (!configurado) {
    const todos = await ler();
    return todos[0] ?? doceria;
  }

  const uid = await usuarioAtual();
  if (uid === null) redirect("/criar");

  const sb = await servidor();
  const { data } = await sb
    .from("negocios")
    .select(TUDO)
    .eq("dono_id", uid)
    .order("criado_em")
    .limit(1)
    .maybeSingle();

  if (!data) redirect("/criar");
  return paraNegocio(data);
}

/**
 * Um endereço só está livre se ninguém pegou.
 *
 * Pelo banco, quem responde é a função `endereco_livre`, e não uma consulta na
 * tabela: a RLS esconde o rascunho dos outros, então uma consulta comum diria
 * que está livre um endereço que já tem dono. Formato é conferido em
 * lib/slug.ts, antes de chegar aqui.
 */
export async function enderecoLivre(slug: string): Promise<boolean> {
  if (!configurado) {
    const todos = await ler();
    return !todos.some((n) => n.slug === slug || n.slugAnterior === slug);
  }

  const sb = await servidor();
  const { data, error } = await sb.rpc("endereco_livre", { p_slug: slug });
  // Sem resposta, o cadastro segue e quem decide é a chave única na gravação.
  // Dizer "ocupado" por causa de uma falha de rede seria mentir sobre o motivo.
  return error ? true : data === true;
}

/**
 * A página nova nasce montada pela categoria. Ver lib/novo.ts.
 *
 * Cria a conta provisória se ainda não houver nenhuma, que é o que permite
 * montar a página antes de entrar com o Google.
 */
export async function criar(
  slug: string,
  nome: string,
  categoria: string | null = null,
  categoriaLivre: string | null = null,
): Promise<Negocio> {
  const novo = montar(slug, nome, categoria, categoriaLivre);

  if (!configurado) {
    const todos = await ler();
    todos.push(novo);
    await gravar(todos);
    return novo;
  }

  const dono = await garantirConta();
  if (dono === null) throw new Error("a conta provisória falhou");

  const sb = await servidor();
  const { data, error } = await sb
    .from("negocios")
    .insert({ ...paraLinha(novo), dono_id: dono })
    .select(TUDO)
    .single();

  if (error) throw new Error(error.message);
  return paraNegocio(data);
}

export async function salvar(negocio: Negocio): Promise<void> {
  if (!configurado) {
    const todos = await ler();
    const i = todos.findIndex((n) => n.slug === negocio.slug);
    if (i >= 0) todos[i] = negocio;
    else todos.push(negocio);
    await gravar(todos);
    return;
  }

  const uid = await usuarioAtual();
  if (uid === null) redirect("/criar");

  const sb = await servidor();
  // A RLS já limita ao dono. O filtro é escrito assim mesmo para o update ser
  // legível sozinho, sem precisar lembrar da política para saber o que ele pega.
  const { error } = await sb
    .from("negocios")
    .update(paraLinha(negocio))
    .eq("dono_id", uid);

  if (error) throw new Error(error.message);
}

/**
 * Põe a página no ar, ou tira.
 *
 * Publicar de conta provisória é recusado pelo banco, pelo gatilho
 * protege_publicacao. A tela leva para o Google antes disso, e o erro daqui é
 * a rede de segurança para quem tentar por fora.
 */
export async function publicar(publicado: boolean): Promise<void> {
  if (!configurado) {
    const todos = await ler();
    if (todos[0]) todos[0] = { ...todos[0], publicado };
    await gravar(todos);
    return;
  }

  const uid = await usuarioAtual();
  if (uid === null) redirect("/criar");

  const sb = await servidor();
  const { error } = await sb
    .from("negocios")
    .update({ publicado })
    .eq("dono_id", uid);

  if (error) throw new Error(error.message);
}

/**
 * Denúncia de página.
 *
 * Pelo banco vai na função `registrar_denuncia`, que é a única porta: a tabela
 * `denuncias` fica fechada até para o dono da página denunciada. Sem Supabase
 * grava no arquivo local, e em modo vitrine escreve no log do servidor, que na
 * Vercel é lido. O que não dá é fingir que gravou.
 */
export async function registrarDenuncia(denuncia: {
  slug: string;
  motivo: string;
  detalhe: string | null;
}): Promise<void> {
  if (configurado) {
    const sb = await servidor();
    const { error } = await sb.rpc("registrar_denuncia", {
      p_slug: denuncia.slug,
      p_motivo: denuncia.motivo,
      p_detalhe: denuncia.detalhe,
    });
    if (error) throw new Error(error.message);
    return;
  }

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
