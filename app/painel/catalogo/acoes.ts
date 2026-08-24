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

/**
 * A recusa carrega o endereço dela, e é isso que a tira do alto da tela.
 *
 * **Relato de uso, nas palavras da dona: "o aviso ficou em cima, sem dar a
 * entender que é sobre esse item".** Ela salvou uma lista de seis itens, um
 * deles chegou torto, e a frase saiu no topo da página. Medido no monitor de
 * 1440: a frase nasceu a 222 pixels do topo e o item que a levantou estava a
 * 1133, fechado, fora da janela de 900. Numa lista, aviso no alto conta que
 * algo deu errado e esconde qual.
 *
 * Então a recusa passa a dizer QUAL linha, e a tela usa isso para abrir aquele
 * cartão, pôr a frase dentro dele e levar o cursor ao campo recusado. `onde` é
 * o índice da linha, ou "novo" para o formulário de acrescentar, que é a outra
 * origem de recusa desta tela.
 */
type Recusa = { erro: string; onde: string };

type Leitura = { ok: true; itens: Item[] } | ({ ok: false } & Recusa);

/** O caminho de volta de uma recusa: a linha aberta, com a frase dentro dela. */
function paraRecusa({ erro, onde }: Recusa): string {
  const ancora = onde === "novo" ? "#acrescentar" : `#item-${onde}`;
  return `${TELA}?erro=${erro}&emItem=${encodeURIComponent(onde)}${ancora}`;
}

/**
 * O preço do item, com a escolha de "sob consulta" mandando na frente.
 *
 * **Preço em branco e preço sob consulta eram a mesma coisa na tela, e são duas
 * coisas para quem escreve.** A dona do produto pediu "alguma opção sob
 * consulta ou pra pessoa que não quer preencher o preço": o campo vazio parecia
 * esquecimento, e ela salvava sem saber se o item tinha ficado do jeito que ela
 * queria.
 *
 * O banco continua igual, e é de propósito: `preco_centavos` já aceita nulo, e
 * nulo já significa que a linha do preço sai de cena na página pública. O que
 * faltava era a pergunta ficar escrita na tela. A escolha vira a mesma coluna
 * nula, então nenhuma correção de SQL entra no caminho e o catálogo de quem já
 * tem item sem preço abre com "sob consulta" marcado, que é o que a página dele
 * já mostra hoje.
 *
 * `mostrarPrecos` é outra pergunta, e continua sendo: ela esconde o preço de
 * todos os itens de uma vez, e vive na linha do negócio.
 */
function precoDoItem(
  f: FormData,
  prefixo: string,
): { ok: true; centavos: number | null } | { ok: false } {
  if (f.get(`${prefixo}-preco-modo`) === "consulta") {
    return { ok: true, centavos: null };
  }
  const lido = lerPreco(String(f.get(`${prefixo}-preco`) ?? ""));
  return lido.ok ? { ok: true, centavos: lido.centavos } : { ok: false };
}

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
    if (titulo === null) return { ok: false, erro: "titulo", onde: String(i) };

    const preco = precoDoItem(f, `item-${i}`);
    if (!preco.ok) return { ok: false, erro: "preco", onde: String(i) };

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

/**
 * A chave de mostrar preço, agora respondida também aqui.
 *
 * Ela mora na linha do negócio e a tela de informações continua perguntando por
 * ela. A dona do produto pediu para ela aparecer junto do catálogo: "eu sei que
 * ela preenche isso na outra tela mas eu traria pra tela de catálogo pra ficar
 * mais clara a navegação". É a mesma coluna nas duas telas, então as duas leem
 * e escrevem o mesmo valor.
 *
 * O campo escondido é o que separa "a pessoa desmarcou" de "este formulário nem
 * pergunta isso": caixa de marcar em repouso simplesmente some do envio, e sem a
 * marca de presença toda gravação daqui apagaria a escolha feita na outra tela.
 */
function mostrarPrecos(f: FormData, negocio: Negocio): boolean {
  if (!f.has("mostrarPrecos-escolhido")) return negocio.mostrarPrecos;
  return f.get("mostrarPrecos") === "on";
}

/** A lista lida, ou o desvio pronto quando o formulário veio com algo torto. */
async function lista(f: FormData): Promise<{ negocio: Negocio; itens: Item[] }> {
  const negocio = await doDono();
  const lido = lerItens(f, negocio.itens);
  if (!lido.ok) redirect(paraRecusa(lido));
  return {
    negocio: { ...negocio, mostrarPrecos: mostrarPrecos(f, negocio) },
    itens: lido.itens,
  };
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
 *
 * `escolhido` é o Salvar que mora dentro de um cartão: ele diz de qual item se
 * trata, e passa na frente do campo escondido, que aponta para a linha que
 * estava aberta antes do toque.
 */
function linhaAberta(
  itens: Item[],
  formData: FormData,
  escolhido?: string,
): { pedaco: string; ancora: string } {
  const alvo = escolhido ?? texto(formData, "novo");
  const i = alvo === null || alvo === undefined ? -1 : itens.findIndex((item) => item.id === alvo);
  if (alvo === null || alvo === undefined || i < 0) return { pedaco: "", ancora: "" };
  return { pedaco: `&aberto=${encodeURIComponent(alvo)}`, ancora: naLinha(i) };
}

/** Grava a lista e devolve a pessoa para a linha que ela estava olhando. */
async function gravarLista(formData: FormData, escolhido?: string) {
  const { negocio, itens } = await lista(formData);
  await guardar({ ...negocio, itens }, TELA);
  const volta = linhaAberta(itens, formData, escolhido);
  redirect(`${TELA}?salvo=1${volta.pedaco}${volta.ancora}`);
}

export async function salvarItens(formData: FormData) {
  await gravarLista(formData);
}

/**
 * O Salvar que mora dentro de um item.
 *
 * **É o pedido da dona do produto, e ele é do computador antes de ser do
 * celular.** No celular o Salvar fica preso na base da tela, a um toque de
 * qualquer campo. No monitor a barra vira o fim do formulário: medido em 1440,
 * o único Salvar da tela nascia a 1640 pixels do topo, depois dos seis cartões
 * e do bloco de acrescentar, e quem estava escrevendo a descrição do item 2
 * lia um botão que parecia responder pela página inteira.
 *
 * Ele grava a lista inteira, igual ao de baixo, porque é o mesmo formulário e é
 * isso que mantém intacto o que foi digitado nos outros cartões. O que muda é o
 * endereço de volta: a tela reabre no item em que a pessoa tocou, com a
 * confirmação dentro dele.
 *
 * O id chega por `bind`, e nunca por `name` no botão, pelo mesmo motivo de
 * componentes/painel/Ordem.tsx: o React reserva o `name` de um botão com
 * `formAction` de função para codificar qual ação chamar.
 */
export async function salvarItem(id: string, formData: FormData) {
  await gravarLista(formData, id);
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
  if (titulo === null) redirect(paraRecusa({ erro: "titulo", onde: "novo" }));

  const preco = precoDoItem(formData, "novo");
  if (!preco.ok) redirect(paraRecusa({ erro: "preco", onde: "novo" }));

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
