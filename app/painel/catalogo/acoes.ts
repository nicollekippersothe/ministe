"use server";

import { redirect } from "next/navigation";
import { guardar } from "../guardar";
import { doDono } from "@/lib/dados";
import { lerPreco } from "@/lib/formato";
import type { Item, Negocio } from "@/lib/tipos";

/**
 * As ações do catálogo.
 *
 * A tela inteira é um formulário só, e todos os botões dela enviam esse mesmo
 * formulário: salvar, subir, descer, remover e acrescentar. É o que garante que
 * o que a pessoa digitou continue vivo em qualquer toque. Botão de mexer na
 * ordem que mandasse só o número da linha jogaria fora a descrição que estava
 * sendo escrita três campos acima, e no celular esse é o caminho comum: a
 * pessoa escreve, olha a lista, reordena, e só então salva.
 *
 * Por isso cada ação lê a lista inteira, aplica uma mudança e grava. A ordem
 * não vai em campo nenhum: ela é a posição na lista, e a gravação numera a
 * coluna `ordem` a partir daí. Um campo de ordem editável seria mais um número
 * para o dono manter certo, e daria empate.
 */

const TELA = "/painel/catalogo";

function texto(f: FormData, campo: string): string | null {
  const v = f.get(campo);
  if (typeof v !== "string") return null;
  const limpo = v.trim();
  return limpo === "" ? null : limpo;
}

type Leitura = { ok: true; itens: Item[] } | { ok: false; erro: string };

/**
 * A lista inteira, do jeito que ela está na tela agora.
 *
 * As fotos de cada item vêm do que já estava gravado, e nunca do formulário:
 * esta tela edita texto, preço e ordem, e o envio de foto de produto tem tela
 * própria pela frente. Buscar pelo id é o que mantém a foto colada no item
 * certo mesmo depois de a pessoa trocar dois de lugar.
 */
function lerItens(f: FormData, atuais: Item[]): Leitura {
  const guardadas = new Map(atuais.map((i) => [i.id, i.fotos]));
  const itens: Item[] = [];

  for (let i = 0; f.has(`item-${i}-id`); i++) {
    const id = String(f.get(`item-${i}-id`));
    const titulo = texto(f, `item-${i}-titulo`);
    if (titulo === null) return { ok: false, erro: "titulo" };

    const preco = lerPreco(String(f.get(`item-${i}-preco`) ?? ""));
    if (!preco.ok) return { ok: false, erro: "preco" };

    itens.push({
      id,
      titulo,
      descricao: texto(f, `item-${i}-descricao`),
      precoCentavos: preco.centavos,
      fotos: guardadas.get(id) ?? [],
      ativo: f.get(`item-${i}-ativo`) === "on",
    });
  }

  return { ok: true, itens };
}

/** A lista lida, ou o desvio pronto quando o formulário veio com algo torto. */
async function lista(f: FormData): Promise<{ negocio: Negocio; itens: Item[] }> {
  const negocio = await doDono();
  const lido = lerItens(f, negocio.itens);
  if (!lido.ok) redirect(`${TELA}?erro=${lido.erro}`);
  return { negocio, itens: lido.itens };
}

/** Para onde a tela volta depois de mexer numa linha. Ver o comentário da tela. */
const naLinha = (i: number) => `#item-${i}`;

/**
 * O caminho de volta que devolve a pessoa para a linha em que ela estava.
 *
 * **É metade do conserto de "eu adiciono e ele some".** Antes disto, salvar
 * terminava num `?salvo=1` pelado: o navegador voltava para o topo, todas as
 * linhas fechavam, e a que estava sendo escrita ficava três telas abaixo,
 * fechada, sem nada dizendo qual era. Quem tinha acabado de acrescentar um item
 * e escrito a descrição dele salvava e encontrava a mesma lista de antes.
 *
 * O id vem do campo escondido que a tela manda junto, e é conferido contra a
 * lista: item removido, ou id que nunca existiu, cai no caminho comum em vez de
 * mandar a tela para uma âncora que não existe. Sai como `aberto`, e nunca como
 * `novo`, porque o selo e a cor são do instante do acrescentar e não se repetem
 * a cada gravação.
 */
function linhaAberta(
  itens: Item[],
  formData: FormData,
): { pedaco: string; ancora: string } {
  const alvo = texto(formData, "novo");
  const i = alvo === null ? -1 : itens.findIndex((item) => item.id === alvo);
  if (alvo === null || i < 0) return { pedaco: "", ancora: "" };
  return { pedaco: `&aberto=${encodeURIComponent(alvo)}`, ancora: naLinha(i) };
}

export async function salvarItens(formData: FormData) {
  const { negocio, itens } = await lista(formData);
  await guardar({ ...negocio, itens }, TELA);
  const volta = linhaAberta(itens, formData);
  redirect(`${TELA}?salvo=1${volta.pedaco}${volta.ancora}`);
}

/**
 * Acrescenta um item ao fim da lista.
 *
 * O id sai daqui, e não do banco. A coluna tem `gen_random_uuid()` de padrão,
 * mas quem grava precisa saber depois qual linha é qual para atualizar em vez
 * de apagar e recriar, e é o id que responde isso. Ver `gravarItens` em
 * lib/dados.ts.
 *
 * Passar dos 20 itens do plano gratuito é recusado pelo gatilho
 * `checa_limite_itens`, e a recusa chega aqui traduzida pelo `guardar`: vira
 * `?erro=limite_itens`, e a tela mostra a frase com o caminho do plano pago.
 * Contar antes, na tela, seria enfeite: o painel escreve direto pelo navegador,
 * então quem decide o limite é o banco.
 */
export async function acrescentarItem(formData: FormData) {
  const { negocio, itens } = await lista(formData);

  const titulo = texto(formData, "novo-titulo");
  if (titulo === null) redirect(`${TELA}?erro=titulo`);

  const preco = lerPreco(String(formData.get("novo-preco") ?? ""));
  if (!preco.ok) redirect(`${TELA}?erro=preco`);

  const novo: Item = {
    id: crypto.randomUUID(),
    titulo,
    descricao: null,
    precoCentavos: preco.centavos,
    fotos: [],
    ativo: true,
  };

  await guardar({ ...negocio, itens: [...itens, novo] }, TELA);
  /*
   * O id do item, e não só um "acrescentado=1". A tela precisa saber QUAL linha
   * nasceu agora para abrir ela, marcar ela e pôr o cursor dentro dela, e o
   * número da posição sozinho se perde no primeiro subir ou descer.
   */
  redirect(
    `${TELA}?novo=${encodeURIComponent(novo.id)}${naLinha(itens.length)}`,
  );
}

/**
 * O número da linha em que a pessoa tocou.
 *
 * Chega por `bind`, e nunca por um campo do formulário: um botão com
 * `formAction` de função tem o `name` reservado pelo React para codificar a
 * ação, e um `name="alvo"` ali é apagado em silêncio. Conferido contra o
 * tamanho da lista porque Server Action é endereço público.
 */
const dentroDaLista = (alvo: number, total: number): boolean =>
  Number.isInteger(alvo) && alvo >= 0 && alvo < total;

/**
 * Sobe e desce, que é como se reordena aqui. O porquê de a ordem ser dois
 * botões, e não um arrastar, está em componentes/painel/Ordem.tsx.
 *
 * Alvo fora da lista cai num salvar comum: a lista da tela já veio junto, então
 * o que a pessoa digitou é gravado do mesmo jeito.
 */
async function mover(alvo: number, formData: FormData, passo: number) {
  const { negocio, itens } = await lista(formData);
  const destino = alvo + passo;

  if (!dentroDaLista(alvo, itens.length) || !dentroDaLista(destino, itens.length)) {
    redirect(`${TELA}?salvo=1`);
  }

  const novos = [...itens];
  [novos[alvo], novos[destino]] = [novos[destino], novos[alvo]];

  await guardar({ ...negocio, itens: novos }, TELA);
  // A âncora é a linha que acabou de mudar de lugar, que é o que a pessoa está
  // olhando. O `aberto` continua sendo o id da linha em edição, e sem âncora
  // própria: com duas, a última venceria e a rolagem cairia no lugar errado.
  redirect(
    `${TELA}?movido=1${linhaAberta(novos, formData).pedaco}${naLinha(destino)}`,
  );
}

export async function subirItem(alvo: number, formData: FormData) {
  await mover(alvo, formData, -1);
}

export async function descerItem(alvo: number, formData: FormData) {
  await mover(alvo, formData, 1);
}

export async function removerItem(alvo: number, formData: FormData) {
  const { negocio, itens } = await lista(formData);
  if (!dentroDaLista(alvo, itens.length)) redirect(`${TELA}?salvo=1`);

  const novos = itens.filter((_, i) => i !== alvo);
  await guardar({ ...negocio, itens: novos }, TELA);
  // O `aberto` some quando a linha aberta era justamente a removida: `linhaAberta`
  // procura o id na lista já sem ele e devolve vazio.
  redirect(
    `${TELA}?removido=1${linhaAberta(novos, formData).pedaco}${naLinha(Math.max(0, alvo - 1))}`,
  );
}
