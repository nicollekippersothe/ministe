import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cache } from "react";
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
import { caminhoGuardado } from "./supabase/imagens";
import { paraLinha, paraNegocio, TUDO } from "./supabase/mapa";
import { publico } from "./supabase/publico";
import { garantirConta, servidor, usuarioAtual } from "./supabase/servidor";
import type { Foto, Intervalo, Item, LinkExtra, Negocio, Plano } from "./tipos";

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
 *
 * **Uma vez por pedido, pelo `cache` do React.** Toda tela do painel pede esta
 * mesma página duas vezes: uma no `app/painel/layout.tsx`, que monta a coluna
 * de navegação, e outra na própria tela. São duas idas ao banco em São Paulo
 * para a mesma linha, uma esperando a outra, e a segunda chega sempre com a
 * resposta da primeira. Com o `cache` a consulta sai uma vez e as duas leituras
 * recebem a mesma promessa.
 *
 * O `cache` nasce e morre com o pedido, então duas pessoas nunca compartilham
 * resposta. E como ele guarda a promessa, e não o valor, o `redirect` de dentro
 * continua interrompendo quem chamar depois.
 *
 * Escrita continua fora disto: `salvar` e `publicar` falam com o banco direto,
 * e quem chama uma delas está num pedido próprio, que termina em redirect.
 */
export const doDono = cache(async function doDono(): Promise<Negocio> {
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
});

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
    await gravarItens(sb, id, negocio.itens);
    await gravarLinks(sb, id, negocio.links);
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
 * Catálogo e links seguem logo abaixo, com o mesmo guarda e outro jeito de
 * escrever. O porquê da diferença está escrito lá.
 *
 * A galeria continua de fora até existir tela que a edite. Escrita sem chamador
 * é código que ninguém exercita. As fotos de item saíram dessa fila quando a
 * tela de catálogo passou a enviar foto, e vão junto do catálogo logo abaixo.
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
 * O catálogo, que também mora em tabela própria.
 *
 * Duas coisas separam esta escrita da dos horários, e as duas são o mesmo
 * risco visto de dois lados.
 *
 * **O guarda de igualdade aqui é obrigatório, e não economia de requisição.**
 * `salvar` é chamado por toda tela do painel, e a de letras e a de informações
 * passam por aqui com o catálogo intocado. O `delete` em `itens` cascateia para
 * `itens_fotos` pela chave composta de supabase/schema.sql, então uma escrita
 * cega apagaria as fotos dos produtos de quem só trocou a fonte da página. Sem
 * erro nenhum na tela, que é o pior tipo de perda: a mesma que existia quando
 * os horários não tinham escrita própria.
 *
 * **E o que muda quando o catálogo mudou de verdade: linha por linha, e nunca
 * apagar tudo para inserir tudo.** O molde dos horários serve lá porque a
 * semana é uma lista pequena, sem filha e sem limite que estoure no meio. Aqui
 * ele custaria caro duas vezes:
 *
 * 1. A cascata de novo. Reordenar o cardápio apagaria as fotos de todo item,
 *    desta vez com a tela de catálogo aberta na frente da pessoa.
 * 2. A parede dos 20 itens. O gatilho `checa_limite_itens` é `before insert`, e
 *    conta o que já está na tabela. Com o `delete` numa requisição e o `insert`
 *    noutra, sem transação entre elas, a recusa do item 21 chegaria depois de
 *    os 20 já terem sido apagados: a pessoa leria o convite do plano pago com o
 *    catálogo vazio atrás. O convite vira ameaça, e o melhor momento de venda
 *    do produto vira o pior momento do produto.
 *
 * Então: apaga só o que saiu, atualiza só o que mudou, insere só o que é novo.
 * O `insert` continua sendo o único que passa pelo gatilho, que é exatamente
 * quando o limite deve falar, e uma recusa dele deixa o catálogo como estava.
 *
 * O preço é uma requisição por item alterado, porque o PostgREST atualiza uma
 * linha de cada vez com valores próprios. Na prática é uma (editar um item) ou
 * duas (trocar dois de lugar), e o teto é o número de itens do plano.
 *
 * O id vem pronto de quem chamou, e não do `gen_random_uuid()` da coluna. É o
 * que permite reconhecer, na volta, qual linha é qual: item novo é o que ainda
 * não está no banco, e o resto é atualização. Ver `app/painel/catalogo/acoes.ts`.
 *
 * **As fotos dos itens vão junto, e vão pela mesma receita.** Elas entram na
 * leitura de cima, entram no guarda de igualdade e são escritas em
 * `gravarFotosDoItem`, uma linha por vez, depois de os itens existirem. A
 * cascata continua sendo o motivo de tudo isto: enquanto a tabela filha era
 * escrita por ninguém, o guarda protegia foto que só o banco de exemplo tinha;
 * agora ele protege a foto que a dona da página acabou de mandar do celular.
 */
type Cliente = Awaited<ReturnType<typeof servidor>>;

/** A linha do banco, do jeito que ela vai e volta. A ordem é a da lista. */
function linhaDoItem(item: Item, ordem: number) {
  return {
    ordem,
    titulo: item.titulo,
    descricao: item.descricao,
    preco_centavos: item.precoCentavos,
    ativo: item.ativo,
  };
}

/**
 * A linha de `itens_fotos`, do jeito que ela vai e volta.
 *
 * **A coluna guarda o CAMINHO do bucket, e nunca a URL inteira.** É a mesma
 * regra de `logo_url` e `capa_url`, escrita na correção 008 e explicada por
 * extenso em `caminhoGuardado`, e a `url_formato` de `itens_fotos` recusa a
 * linha toda quando ela chega como endereço. A passada por `caminhoGuardado`
 * acontece aqui, e não em quem chama, porque este é o único lugar por onde a
 * tabela filha é escrita: qualquer tela que mande uma foto lida de volta pela
 * leitura entra por esta porta e sai no formato da coluna.
 *
 * **A legenda é o título do item, e a decisão é essa mesma.** `alt_preenchido`
 * exige texto, e o produto exige alt em toda imagem (regra 4 do AGENTS.md). As
 * duas imagens da página derivam a legenda do nome do negócio, em
 * lib/supabase/mapa.ts; aqui o candidato equivalente é o título, que é o único
 * texto que a dona da página escreveu sobre aquela foto. Ele nasce obrigatório
 * e cabe de sobra: `titulo_preenchido` vai até 80 caracteres e `alt_preenchido`
 * até 160, então título válido é sempre legenda válida.
 *
 * E ela acompanha o título a cada gravação, de propósito. Legenda que mente é
 * pior do que legenda genérica, e a que envelhece é justamente a que mente: a
 * foto do item renomeado continuaria anunciada pelo nome antigo para quem lê a
 * página com leitor de tela. Enquanto tela nenhuma oferece campo de legenda,
 * toda legenda desta tabela saiu daqui, então acompanhar não sobrescreve texto
 * de ninguém. O dia em que existir esse campo, este é o lugar de parar.
 *
 * Largura e altura são nulas quando a linha não tem medida, que é o que a
 * coluna aceita, e vêm da convenção de `MEDIDAS` quando o envio as escreve.
 */
function linhaDaFoto(foto: Foto, titulo: string, ordem: number) {
  return {
    ordem,
    url: caminhoGuardado(foto.url) ?? foto.url,
    alt: titulo.trim().slice(0, 160),
    largura: foto.largura > 0 ? foto.largura : null,
    altura: foto.altura > 0 ? foto.altura : null,
  };
}

/** Uma linha virada em texto, para comparar guardado com o que chegou. */
const textoDaLinha = (l: Record<string, unknown>): string =>
  JSON.stringify(Object.keys(l).sort().map((c) => [c, l[c] ?? null]));

/** As fotos de um item viradas em texto, na mesma ordem dos dois lados. */
const textoDasFotos = (linhas: string[]): string =>
  JSON.stringify([...linhas].sort());

/** Uma foto guardada: o id, que é do banco, e a linha dela em texto. */
type FotoGuardada = { id: string; texto: string };

/**
 * As fotos que o banco já tem para um item, indexadas pelo caminho.
 *
 * O caminho é a identidade aqui, e não o id: `Foto` de lib/tipos.ts não carrega
 * id, porque é o mesmo tipo que a página pública usa, e o caminho já é único
 * por envio (uuid novo a cada arquivo, do jeito que a 008 pede). Foto trocada é
 * caminho novo, então a comparação enxerga a troca sem precisar de id nenhum.
 */
function fotosGuardadas(linhas: unknown): Map<string, FotoGuardada> {
  const fotos = new Map<string, FotoGuardada>();

  for (const f of (Array.isArray(linhas) ? linhas : []) as Record<
    string,
    unknown
  >[]) {
    fotos.set(String(f.url), {
      id: String(f.id),
      texto: textoDaLinha({
        ordem: Number(f.ordem ?? 0),
        url: String(f.url),
        alt: String(f.alt ?? ""),
        largura: f.largura === null || f.largura === undefined ? null : Number(f.largura),
        altura: f.altura === null || f.altura === undefined ? null : Number(f.altura),
      }),
    });
  }

  return fotos;
}

/**
 * As fotos de um item, pela mesma receita do catálogo: apaga só o que saiu,
 * atualiza só o que mudou, insere só o que é novo.
 *
 * A ordem das três é o que faz a troca de foto caber no plano gratuito.
 * `checa_limite_fotos_item` é `before insert` e conta o que já está na tabela,
 * com teto de 3 fotos por item no gratuito e 10 no pago (supabase/schema.sql):
 * inserir antes de apagar recusaria justamente a troca da terceira foto, que é
 * a mais comum de todas para quem já encheu o item.
 *
 * Apaga em `itens_fotos`, e nunca no item. O `delete` em `itens` cascateia, e
 * isso serve para o item que a pessoa removeu de verdade, com as fotos dele
 * junto; para trocar uma foto, o que sai de cena é a linha da foto.
 */
async function gravarFotosDoItem(
  sb: Cliente,
  negocioId: string,
  item: Item,
  guardadas: Map<string, FotoGuardada>,
): Promise<void> {
  const chegaram = item.fotos.map((foto, ordem) =>
    linhaDaFoto(foto, item.titulo, ordem),
  );
  const ficaram = new Set(chegaram.map((l) => l.url));

  const sairam = [...guardadas.entries()]
    .filter(([url]) => !ficaram.has(url))
    .map(([, f]) => f.id);

  if (sairam.length > 0) {
    const { error } = await sb
      .from("itens_fotos")
      .delete()
      .eq("negocio_id", negocioId)
      .in("id", sairam);
    if (error) throw recusaDoBanco(error);
  }

  const novas: ReturnType<typeof linhaDaFoto>[] = [];

  for (const linha of chegaram) {
    const antes = guardadas.get(linha.url);
    if (antes === undefined) {
      novas.push(linha);
      continue;
    }
    if (antes.texto === textoDaLinha(linha)) continue;

    const { error } = await sb
      .from("itens_fotos")
      .update(linha)
      .eq("id", antes.id)
      .eq("negocio_id", negocioId);
    if (error) throw recusaDoBanco(error);
  }

  if (novas.length === 0) return;

  const { error } = await sb
    .from("itens_fotos")
    .insert(
      novas.map((linha) => ({
        item_id: item.id,
        negocio_id: negocioId,
        ...linha,
      })),
    );

  if (error) throw recusaDoBanco(error);
}

async function gravarItens(
  sb: Cliente,
  negocioId: string,
  itens: Item[],
): Promise<void> {
  // As fotos vêm na mesma viagem, que é o mesmo desenho do `TUDO` da leitura.
  // Sem elas aqui, o guarda de igualdade não teria como enxergar a foto que
  // chegou, e a única mudança da tela de catálogo passaria em branco.
  const { data, error: erroDaLeitura } = await sb
    .from("itens")
    .select(
      "id, ordem, titulo, descricao, preco_centavos, ativo, itens_fotos(id, ordem, url, alt, largura, altura)",
    )
    .eq("negocio_id", negocioId);

  if (erroDaLeitura) throw recusaDoBanco(erroDaLeitura);

  const guardados = new Map(
    (data ?? []).map((i) => {
      const fotos = fotosGuardadas(i.itens_fotos);
      return [
        String(i.id),
        {
          linha: textoDaLinha({
            ordem: Number(i.ordem ?? 0),
            titulo: String(i.titulo ?? ""),
            descricao: i.descricao === null ? null : String(i.descricao),
            preco_centavos:
              i.preco_centavos === null ? null : Number(i.preco_centavos),
            ativo: i.ativo !== false,
          }),
          fotos,
          textoDasFotos: textoDasFotos([...fotos.values()].map((f) => f.texto)),
        },
      ];
    }),
  );

  const chegaram = itens.map((item, ordem) => ({
    item,
    linha: linhaDoItem(item, ordem),
    texto: textoDaLinha(linhaDoItem(item, ordem)),
    textoDasFotos: textoDasFotos(
      item.fotos.map((foto, i) => textoDaLinha(linhaDaFoto(foto, item.titulo, i))),
    ),
  }));

  /*
   * O guarda de igualdade. Ver o comentário acima: sem ele, salvar a letra da
   * página apaga a foto dos produtos.
   *
   * As fotos entram na comparação pelos dois lados da mesma propriedade. Uma
   * tela que nem edita catálogo devolve os itens do jeito que os leu, fotos
   * inclusive, e sai daqui sem escrever nada, que é o que protege a tabela
   * filha da cascata. E a tela que trocou só a foto, sem tocar em título nem em
   * preço, deixa de ser vista como "nada mudou": era o que aconteceria com a
   * comparação de antes, e o envio de foto terminaria em silêncio.
   */
  const igual =
    chegaram.length === guardados.size &&
    chegaram.every((c) => {
      const antes = guardados.get(c.item.id);
      return (
        antes !== undefined &&
        antes.linha === c.texto &&
        antes.textoDasFotos === c.textoDasFotos
      );
    });
  if (igual) return;

  const ficaram = new Set(chegaram.map((c) => c.item.id));
  const sairam = [...guardados.keys()].filter((id) => !ficaram.has(id));

  if (sairam.length > 0) {
    const { error } = await sb
      .from("itens")
      .delete()
      .eq("negocio_id", negocioId)
      .in("id", sairam);
    if (error) throw recusaDoBanco(error);
  }

  for (const c of chegaram) {
    const antes = guardados.get(c.item.id);
    if (antes === undefined || antes.linha === c.texto) continue;
    const { error } = await sb
      .from("itens")
      .update(c.linha)
      .eq("id", c.item.id)
      .eq("negocio_id", negocioId);
    if (error) throw recusaDoBanco(error);
  }

  const novos = chegaram.filter((c) => !guardados.has(c.item.id));

  if (novos.length > 0) {
    const { error } = await sb
      .from("itens")
      .insert(
        novos.map((c) => ({ id: c.item.id, negocio_id: negocioId, ...c.linha })),
      );

    if (error) throw recusaDoBanco(error);
  }

  /*
   * As fotos depois dos itens, e só as dos itens cujas fotos mudaram.
   *
   * Depois porque `itens_fotos` aponta para `itens` pela chave composta: a foto
   * de um item que acabou de nascer precisa da linha dele já no banco. E só as
   * que mudaram porque reordenar seis itens é seis atualizações de `ordem` e
   * nenhuma mexida em foto nenhuma.
   */
  for (const c of chegaram) {
    const antes = guardados.get(c.item.id);
    if (antes !== undefined && antes.textoDasFotos === c.textoDasFotos) continue;
    await gravarFotosDoItem(sb, negocioId, c.item, antes?.fotos ?? new Map());
  }
}

/**
 * Os links extras da página, pela mesma receita do catálogo.
 *
 * Aqui não há tabela filha para cascatear, então o guarda de igualdade só
 * economiza duas requisições em cada salvamento das outras telas. O que se
 * repete é o segundo motivo: `checa_limite_links` é `before insert`, e apagar
 * os oito links antes de tentar inserir o nono deixaria a página sem link
 * nenhum quando o banco recusasse. Escrita que se desfaz sozinha vale mais do
 * que escrita curta.
 *
 * Duas escritas irmãs com desenhos diferentes também seriam um convite a
 * corrigir uma e esquecer a outra.
 */
function linhaDoLink(link: LinkExtra, ordem: number) {
  return { ordem, rotulo: link.rotulo, url: link.url, icone: link.icone };
}

async function gravarLinks(
  sb: Cliente,
  negocioId: string,
  links: LinkExtra[],
): Promise<void> {
  const { data, error: erroDaLeitura } = await sb
    .from("links")
    .select("id, ordem, rotulo, url, icone")
    .eq("negocio_id", negocioId);

  if (erroDaLeitura) throw recusaDoBanco(erroDaLeitura);

  const guardados = new Map<string, string>(
    (data ?? []).map((l) => [
      String(l.id),
      textoDaLinha({
        ordem: Number(l.ordem ?? 0),
        rotulo: String(l.rotulo ?? ""),
        url: String(l.url ?? ""),
        icone: String(l.icone ?? "link"),
      }),
    ]),
  );

  const chegaram = links.map((link, ordem) => ({
    link,
    linha: linhaDoLink(link, ordem),
    texto: textoDaLinha(linhaDoLink(link, ordem)),
  }));

  const igual =
    chegaram.length === guardados.size &&
    chegaram.every((c) => guardados.get(c.link.id) === c.texto);
  if (igual) return;

  const ficaram = new Set(chegaram.map((c) => c.link.id));
  const sairam = [...guardados.keys()].filter((id) => !ficaram.has(id));

  if (sairam.length > 0) {
    const { error } = await sb
      .from("links")
      .delete()
      .eq("negocio_id", negocioId)
      .in("id", sairam);
    if (error) throw recusaDoBanco(error);
  }

  for (const c of chegaram) {
    const antes = guardados.get(c.link.id);
    if (antes === undefined || antes === c.texto) continue;
    const { error } = await sb
      .from("links")
      .update(c.linha)
      .eq("id", c.link.id)
      .eq("negocio_id", negocioId);
    if (error) throw recusaDoBanco(error);
  }

  const novos = chegaram.filter((c) => !guardados.has(c.link.id));
  if (novos.length === 0) return;

  const { error } = await sb
    .from("links")
    .insert(
      novos.map((c) => ({ id: c.link.id, negocio_id: negocioId, ...c.linha })),
    );

  if (error) throw recusaDoBanco(error);
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
  const linha = await linhaDaCobranca();
  const id = linha?.id;
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

/**
 * A linha de cobrança de quem está pedindo, uma vez por pedido.
 *
 * **Existe para o uuid e o estado da cobrança saírem da mesma ida ao banco.**
 * `idDoNegocioDoDono` fazia uma consulta própria só para pegar o `id`, e a tela
 * de números pedia as duas em fila: o estado do plano primeiro, para saber a
 * janela de dias, e o uuid depois, para pedir os eventos. Eram três idas a São
 * Paulo, uma esperando a outra, e a do meio pedia uma coluna que a de cima já
 * tinha trazido.
 *
 * Devolve nulo em vez de desviar, e é o que permite as duas leituras
 * compartilharem: `cobrancaDoDono` desvia para o cadastro porque é uma tela e
 * precisa de página; `idDoNegocioDoDono` responde nulo porque quem chama recusa
 * cobrar sozinho, e uma delas é a própria tela de cadastro, onde desviar para
 * o cadastro seria um laço.
 */
const linhaDaCobranca = cache(async function linhaDaCobranca() {
  if (!configurado) return null;

  const uid = await usuarioAtual();
  if (uid === null) return null;

  const { data } = await (await servidor())
    .from("negocios")
    .select(
      "id, plano, plano_expira_em, assinaturas(status, ciclo, meio, teste_termina_em, ciclo_termina_em, criado_em)",
    )
    .eq("dono_id", uid)
    .order("criado_em")
    .limit(1)
    .maybeSingle();

  return data ?? null;
});

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

  const data = await linhaDaCobranca();
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

  // As duas juntas: `doDono` já veio do cache da tela, e o uuid sai da mesma
  // linha de cobrança que a tela pediu antes.
  const [negocioId, negocio] = await Promise.all([
    idDoNegocioDoDono(),
    doDono(),
  ]);

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
