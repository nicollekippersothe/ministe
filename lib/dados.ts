import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { redirect } from "next/navigation";
import { recusaDoBanco } from "./dados/erros";
import { doceria, EXEMPLOS } from "./exemplos";
import { montar } from "./novo";
import {
  anterior,
  montarSerie,
  somar,
  VAZIO,
  type Contagem,
  type DiaContado,
  type LinhaCrua,
} from "./numeros";
import { planoValido } from "./plano";
import { MODO_VITRINE } from "./site";
import { configurado } from "./supabase/config";
import { paraLinha, paraNegocio, TUDO } from "./supabase/mapa";
import { publico } from "./supabase/publico";
import { garantirConta, servidor, usuarioAtual } from "./supabase/servidor";
import type { Intervalo, Negocio, Plano } from "./tipos";

/**
 * Camada de dados.
 *
 * Dois destinos, escolhidos por configuração e não por código espalhado:
 *
 * - Com o Supabase configurado, fala com o banco. Sem configuração, guarda num
 *   arquivo local, que é o que deixa `npm run dev` e o teste de fluxo rodarem
 *   inteiros sem depender de rede.
 *
 * Quem chama não sabe a diferença, o que é o ponto: a troca de destino nunca
 * precisou mexer em página nenhuma.
 *
 * Do lado do Supabase são dois clientes, e a escolha entre eles tem regra:
 *
 * - `servidor()`, pelo cookie de sessão, para o que é de alguém. Painel,
 *   cadastro, publicação. A consulta roda como a pessoa e a RLS decide.
 * - `publico()`, sem sessão, para o que é igual para todo mundo. A página de um
 *   negócio, a conferência de endereço e a denúncia, que é anônima por desenho.
 *
 * A regra tem consequência prática, e não é preferência: ler cookie e guardar
 * em cache são incompatíveis no Next. A página pública declara uma hora de
 * cache, e enquanto ela falava pelo cliente de sessão, endereço desconhecido
 * respondia 500 em vez da tela de "este endereço está disponível".
 *
 * Toda escrita que o banco recusa sai daqui como `RecusaDoBanco`, de
 * lib/dados/erros.ts, com o motivo já traduzido. Antes disso a exceção do
 * Postgres subia crua e virava 500, e quem estava salvando via a tela de erro
 * do Next sem nenhuma pista. Quem chama lê o `motivo` e monta o `?erro=` da
 * URL; o texto cru continua no `message`, para o log.
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
  /*
   * Sem banco, quem responde é o arquivo local, mesmo para os exemplos: ele
   * nasce como cópia deles e é o que o painel edita. Deixar o exemplo passar na
   * frente aqui faria o painel salvar e a página pública mostrar o valor
   * antigo, que é exatamente o que aconteceu quando eu inverti estas duas
   * partes e deixei de rodar o teste de fluxo.
   */
  if (!configurado) {
    const todos = await ler();
    return todos.find((n) => n.slug === slug) ?? null;
  }

  /*
   * Com banco, as sete páginas de exemplo são do produto e não de ninguém.
   * Elas são o "veja como fica" que a tela inicial mostra e para onde ela
   * manda, e existem só em lib/exemplos.ts, então precisam responder antes da
   * consulta. Os endereços delas ficam em slugs_reservados, então linha nenhuma
   * do banco pode disputar esses nomes.
   */
  const exemplo = EXEMPLOS.find((n) => n.slug === slug);
  if (exemplo) return exemplo;

  const { data } = await publico()
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

  const { data, error } = await publico().rpc("endereco_livre", {
    p_slug: slug,
  });
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

  if (error) throw recusaDoBanco(error);
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
  // O `select` de volta traz o uuid, que é o que as tabelas filhas precisam.
  const { data, error } = await sb
    .from("negocios")
    .update(paraLinha(negocio))
    .eq("dono_id", uid)
    .select("id")
    .maybeSingle();

  if (error) throw recusaDoBanco(error);

  const id = data?.id;
  if (typeof id === "string" && id !== "") {
    await gravarHorarios(sb, id, negocio.horarios);
  }
}

/**
 * Os horários, que moram em tabela própria e por isso precisam de escrita
 * própria.
 *
 * **Isto existe porque a ausência dele era perda silenciosa de dado.** O
 * `paraLinha` traduz só as colunas de `negocios`, e o update mandava o objeto
 * inteiro para lá: a tela de horários dizia "Alterações salvas" e o banco ficava
 * exatamente como estava. Some com a informação mais importante da página
 * pública, o selo de aberto agora, e some sem erro nenhum na tela.
 *
 * Reescreve só quando mudou, e a comparação é o ponto: `salvarAparencia` e
 * `salvarBasico` também passam por aqui com os mesmos horários de sempre, e sem
 * o guarda cada troca de letra apagaria e recriaria a semana inteira.
 *
 * Apaga e insere, nesta ordem, porque o PostgREST tem uma requisição por vez e
 * transação entre requisições não existe. A janela entre as duas é real: se a
 * inserção falhar, a semana fica vazia e a pessoa refaz. É o preço de gravar
 * pelo navegador, e ele é pequeno aqui porque a lista tem no máximo vinte e uma
 * linhas e quem salvou está olhando para a tela.
 *
 * As outras quatro filhas (itens, fotos de item, galeria e links) ficam de fora
 * até existir tela que as edite. Escrita sem chamador é código que ninguém
 * exercita, e o dia em que a tela de catálogo chegar ela vem com o `delete` que
 * cascateia para `itens_fotos`, que pede o mesmo guarda de igualdade por outro
 * motivo: um `salvar` de outra tela apagaria as fotos dos produtos.
 */
async function gravarHorarios(
  sb: Awaited<ReturnType<typeof servidor>>,
  negocioId: string,
  horarios: Intervalo[],
): Promise<void> {
  const { data, error: erroDaLeitura } = await sb
    .from("horarios")
    .select("dia_semana, abre, fecha")
    .eq("negocio_id", negocioId);

  if (erroDaLeitura) throw recusaDoBanco(erroDaLeitura);

  const guardados = (data ?? [])
    .map((h) => `${h.dia_semana}|${String(h.abre).slice(0, 5)}|${String(h.fecha).slice(0, 5)}`)
    .sort();
  const novos = horarios.map((h) => `${h.dia}|${h.abre}|${h.fecha}`).sort();

  if (guardados.length === novos.length && guardados.every((v, i) => v === novos[i])) {
    return;
  }

  const { error: erroDaLimpeza } = await sb
    .from("horarios")
    .delete()
    .eq("negocio_id", negocioId);

  if (erroDaLimpeza) throw recusaDoBanco(erroDaLimpeza);
  if (horarios.length === 0) return;

  const { error: erroDaEscrita } = await sb.from("horarios").insert(
    horarios.map((h) => ({
      negocio_id: negocioId,
      dia_semana: h.dia,
      abre: h.abre,
      fecha: h.fecha,
    })),
  );

  if (erroDaEscrita) throw recusaDoBanco(erroDaEscrita);
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

  if (error) throw recusaDoBanco(error);
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
    const { error } = await publico().rpc("registrar_denuncia", {
      p_slug: denuncia.slug,
      p_motivo: denuncia.motivo,
      p_detalhe: denuncia.detalhe,
    });
    if (error) throw recusaDoBanco(error);
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

/**
 * O uuid do negócio de quem está logado.
 *
 * Existe separado do `doDono()` porque o `Negocio` não carrega o id de
 * propósito: ele é o tipo que a página pública também usa, e os sete exemplos
 * de lib/exemplos.ts precisariam inventar um uuid para servir uma tela só.
 *
 * Quem precisa disto é o checkout, e ele precisa exatamente. O uuid vira o
 * `external_reference` da assinatura no Mercado Pago, e é por ele que o webhook
 * acha o negócio: `abrir_assinatura(p_negocio uuid)`. Mandar o slug ali dá erro
 * de tipo no Postgres, que o webhook lê como falha passageira e reentrega para
 * sempre. Mandar vazio é pior, porque ele responde 200 em silêncio e o dinheiro
 * entra sem o plano mudar.
 *
 * Nulo no destino de arquivo local, onde uuid nenhum existe. Quem chama recusa
 * cobrar quando vier nulo, em vez de inventar um valor.
 */
export async function idDoNegocioDoDono(): Promise<string | null> {
  if (!configurado) return null;

  const uid = await usuarioAtual();
  if (uid === null) return null;

  const sb = await servidor();
  const { data } = await sb
    .from("negocios")
    .select("id")
    .eq("dono_id", uid)
    .order("criado_em")
    .limit(1)
    .maybeSingle();

  const id = data?.id;
  return typeof id === "string" && id !== "" ? id : null;
}

/**
 * O estado da cobrança do negócio de quem está logado.
 *
 * Junta numa consulta só o que a tela do plano precisa e que o `Negocio` não
 * carrega: o uuid, a validade crua do plano, e a assinatura viva se houver.
 * A política `assinaturas_leitura_dono` já permite exatamente isto, então roda
 * pelo cookie da pessoa e não pela chave de serviço.
 *
 * A assinatura vem só a mais recente. Encerrada convive com viva no banco, de
 * propósito (senão trocar de plano travaria), e quem manda na tela é a de cima.
 */
export type EstadoDaCobranca = {
  negocioId: string | null;
  /** O plano efetivo, já passado pelo `planoValido`. */
  plano: Plano;
  /** `plano_expira_em` cru, que o `paraNegocio` descarta. */
  expiraEm: string | null;
  assinatura: SituacaoDaAssinatura | null;
};

export type SituacaoDaAssinatura = {
  status: "teste" | "ativa" | "em_atraso" | "encerrada";
  ciclo: string | null;
  meio: string | null;
  testeTerminaEm: string | null;
  cicloTerminaEm: string | null;
};

const STATUS_DA_ASSINATURA = new Set([
  "teste",
  "ativa",
  "em_atraso",
  "encerrada",
]);

/** Status conhecido, ou "encerrada", que é o valor que entrega menos. */
function statusDaAssinatura(bruto: unknown): SituacaoDaAssinatura["status"] {
  const texto = String(bruto ?? "");
  return STATUS_DA_ASSINATURA.has(texto)
    ? (texto as SituacaoDaAssinatura["status"])
    : "encerrada";
}

export async function cobrancaDoDono(): Promise<EstadoDaCobranca> {
  if (!configurado) {
    // Sem banco a tela ainda abre, mostra os preços e explica o que falta. É o
    // mesmo espírito do resto do arquivo: o destino muda, a tela continua.
    const todos = await ler();
    const negocio = todos[0] ?? doceria;
    return {
      negocioId: null,
      plano: negocio.plano,
      expiraEm: null,
      assinatura: null,
    };
  }

  const uid = await usuarioAtual();
  if (uid === null) redirect("/criar");

  const sb = await servidor();
  const { data } = await sb
    .from("negocios")
    .select(
      "id, plano, plano_expira_em, assinaturas(status, ciclo, meio, teste_termina_em, ciclo_termina_em, criado_em)",
    )
    .eq("dono_id", uid)
    .order("criado_em")
    .limit(1)
    .maybeSingle();

  if (!data) redirect("/criar");

  const expiraEm =
    typeof data.plano_expira_em === "string" ? data.plano_expira_em : null;

  const linhas = Array.isArray(data.assinaturas) ? data.assinaturas : [];
  const recente = [...linhas].sort((a, b) =>
    String(b?.criado_em ?? "").localeCompare(String(a?.criado_em ?? "")),
  )[0];

  return {
    negocioId: typeof data.id === "string" ? data.id : null,
    plano: planoValido(String(data.plano ?? "gratuito"), expiraEm),
    expiraEm,
    assinatura: recente
      ? {
          status: statusDaAssinatura(recente.status),
          ciclo: recente.ciclo === null ? null : String(recente.ciclo),
          meio: recente.meio === null ? null : String(recente.meio),
          testeTerminaEm:
            typeof recente.teste_termina_em === "string"
              ? recente.teste_termina_em
              : null,
          cicloTerminaEm:
            typeof recente.ciclo_termina_em === "string"
              ? recente.ciclo_termina_em
              : null,
        }
      : null,
  };
}

/**
 * Registra uma visita ou um clique.
 *
 * Chamada por `/api/evento`, que é onde o sinal do navegador chega. Nunca
 * escreve na tabela direto: quem escreve é `registrar_evento`, que é security
 * definer e só aceita negócio publicado e ativo, com um dos três tipos. Assim
 * um visitante não consegue inflar o número de outro negócio nem inventar tipo.
 *
 * Pelo cliente público, e não pelo de sessão: quem visita a página de um
 * negócio quase nunca tem conta, e a função está liberada para `anon` desde a
 * correção 002.
 *
 * Sem banco, silêncio. Guardar visita num arquivo local seria trabalho para
 * produzir um número que ninguém vai ler.
 */
export async function registrarEvento(
  slug: string,
  tipo: "visita" | "clique_whatsapp" | "clique_acao",
): Promise<void> {
  if (!configurado) return;

  await publico().rpc("registrar_evento", { p_slug: slug, p_tipo: tipo });
}

export type NumerosDoPainel = {
  dias: number;
  serie: DiaContado[];
  totais: Contagem;
  /** O período de igual tamanho logo antes. Nulo quando ninguém pediu. */
  anterior: Contagem | null;
};

/**
 * Os números do negócio de quem está logado.
 *
 * Pela sessão da pessoa, de propósito. A função `numeros_do_negocio` é security
 * invoker e herda a RLS de `eventos`, então negócio de outra pessoa volta vazio
 * sozinho, sem esta camada repetir a regra.
 *
 * Quando `comparar` é verdadeiro, faz duas consultas, de `dias` e de `dias * 2`,
 * e o período anterior é a subtração. Pedir a janela dobrada e cortar no meio
 * pela data erraria, porque o dia da fronteira é data civil e o corte é um
 * instante. Ver `anterior()` em lib/numeros.ts.
 *
 * Sem banco devolve zeros, e nunca evento de mentira: a regra 6 do AGENTS.md
 * vale aqui igual. O efeito colateral é bom, porque deixa o desenvolvimento
 * local sempre no estado vazio, que é o que todo dono vive na primeira semana.
 */
export async function numerosDoNegocio(
  dias: number,
  comparar = false,
): Promise<NumerosDoPainel> {
  const agora = Date.now();

  if (!configurado) {
    const todos = await ler();
    const fuso = (todos[0] ?? doceria).fuso;
    const serie = montarSerie([], dias, fuso, agora);
    return {
      dias,
      serie,
      totais: somar(serie),
      anterior: comparar ? { ...VAZIO } : null,
    };
  }

  const negocioId = await idDoNegocioDoDono();
  const negocio = await doDono();

  if (negocioId === null) {
    const serie = montarSerie([], dias, negocio.fuso, agora);
    return {
      dias,
      serie,
      totais: somar(serie),
      anterior: comparar ? { ...VAZIO } : null,
    };
  }

  const sb = await servidor();
  const buscar = async (quantos: number): Promise<LinhaCrua[]> => {
    const { data } = await sb.rpc("numeros_do_negocio", {
      p_negocio: negocioId,
      p_dias: quantos,
    });
    return Array.isArray(data) ? (data as LinhaCrua[]) : [];
  };

  const [linhas, linhasDobro] = await Promise.all([
    buscar(dias),
    comparar ? buscar(dias * 2) : Promise.resolve([] as LinhaCrua[]),
  ]);

  const serie = montarSerie(linhas, dias, negocio.fuso, agora);
  const totais = somar(serie);

  return {
    dias,
    serie,
    totais,
    anterior: comparar
      ? anterior(somar(montarSerie(linhasDobro, dias * 2, negocio.fuso, agora)), totais)
      : null,
  };
}
