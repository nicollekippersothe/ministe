"use server";

import { redirect } from "next/navigation";
import { guardar } from "../guardar";
import { doDono } from "@/lib/dados";
import { iconeConhecido } from "./icones";
import { conferirLink } from "@/lib/links";
import type { LinkExtra, Negocio } from "@/lib/tipos";

/**
 * As ações dos links extras.
 *
 * Mesmo desenho do catálogo, e de propósito: um formulário só, todos os botões
 * enviando ele, e a ordem sendo a posição na lista. Quem aprendeu a mexer numa
 * das duas telas já sabe mexer na outra.
 *
 * O que muda é o portão. Todo endereço digitado passa por `conferirLink` antes
 * de virar dado, que é a regra 7 do AGENTS.md, e aqui ela pesa mais do que em
 * qualquer outro campo: estes links viram botões na página pública, com o
 * rótulo escrito pelo dono e o destino invisível para quem clica.
 */

/*
 * A tela de volta, e por que estas cinco ações dispensam o `onde=` que
 * `salvarAcoes` escreve.
 *
 * A tela grava duas coisas, a lista e o botão do rodapé, e as duas voltam para
 * cá. Então ela precisa saber qual seção está respondendo, senão a mesma frase
 * de recusa de `conferirLink` apareceria nas duas ao mesmo tempo. A lista é o
 * padrão, porque são cinco ações daqui contra uma de lá, e quem escreve o
 * parâmetro é a exceção. O `salvo=lista` continua explícito, porque ele escolhe
 * em qual dos dois botões de Salvar a confirmação aparece.
 */
const TELA = "/painel/links";

function texto(f: FormData, campo: string): string | null {
  const v = f.get(campo);
  if (typeof v !== "string") return null;
  const limpo = v.trim();
  return limpo === "" ? null : limpo;
}

const icone = (f: FormData, campo: string): LinkExtra["icone"] =>
  iconeConhecido(texto(f, campo));

type Leitura = { ok: true; links: LinkExtra[] } | { ok: false; erro: string };

function lerLinks(f: FormData): Leitura {
  const links: LinkExtra[] = [];

  for (let i = 0; f.has(`link-${i}-id`); i++) {
    const rotulo = texto(f, `link-${i}-rotulo`);
    if (rotulo === null) return { ok: false, erro: "rotulo" };

    const conferido = conferirLink(texto(f, `link-${i}-url`) ?? "");
    if (!conferido.ok) return { ok: false, erro: `link_${conferido.motivo}` };

    links.push({
      id: String(f.get(`link-${i}-id`)),
      rotulo,
      url: conferido.url,
      icone: icone(f, `link-${i}-icone`),
    });
  }

  return { ok: true, links };
}

async function lista(f: FormData): Promise<{
  negocio: Negocio;
  links: LinkExtra[];
}> {
  const negocio = await doDono();
  const lido = lerLinks(f);
  if (!lido.ok) redirect(`${TELA}?erro=${lido.erro}`);
  return { negocio, links: lido.links };
}

/**
 * Os links já gravados, sem a conferência de `conferirLink`.
 *
 * Mesmo motivo do catálogo: remover e reordenar são estrutura, e não conteúdo.
 * Apagar um link não pode exigir que os outros estejam válidos, senão um
 * endereço meio digitado em outra linha barra o excluir com um erro que não é
 * o da linha que a pessoa quer apagar. A operação age sobre a lista que
 * `doDono` traz, pela posição, e uma edição não salva em outra linha se perde,
 * que é o esperado de uma ação de estrutura.
 */
async function listaSalva(f: FormData): Promise<{
  negocio: Negocio;
  links: LinkExtra[];
}> {
  const negocio = await doDono();
  return { negocio, links: negocio.links };
}

const naLinha = (i: number) => `#link-${i}`;

/**
 * A linha que a tela pediu para manter aberta, quando ela ainda existe.
 *
 * Mesmo mecanismo do catálogo, e pelo mesmo motivo: sem ele, salvar devolvia a
 * pessoa para o topo com todas as linhas fechadas, e o link que ela tinha
 * acabado de acrescentar ficava indistinguível dos outros sete. O porquê por
 * extenso está em app/painel/catalogo/acoes.ts.
 */
function linhaAberta(
  links: LinkExtra[],
  formData: FormData,
): { pedaco: string; ancora: string } {
  const alvo = texto(formData, "novo");
  const i = alvo === null ? -1 : links.findIndex((l) => l.id === alvo);
  if (alvo === null || i < 0) return { pedaco: "", ancora: "" };
  return { pedaco: `&aberto=${encodeURIComponent(alvo)}`, ancora: naLinha(i) };
}

export async function salvarLinks(formData: FormData) {
  const { negocio, links } = await lista(formData);
  await guardar({ ...negocio, links }, TELA);
  const volta = linhaAberta(links, formData);
  redirect(`${TELA}?salvo=lista${volta.pedaco}${volta.ancora}`);
}

/**
 * Acrescenta um link ao fim da lista.
 *
 * O nono link do plano gratuito é recusado pelo gatilho `checa_limite_links`, e
 * a recusa vira `?erro=limite_links` no caminho de volta, com a frase que
 * oferece o plano pago. Ver `gravarLinks` em lib/dados.ts: a gravação insere só
 * o que é novo, então uma recusa dessas deixa os oito de pé.
 */
export async function acrescentarLink(formData: FormData) {
  const { negocio, links } = await lista(formData);

  const rotulo = texto(formData, "novo-rotulo");
  if (rotulo === null) redirect(`${TELA}?erro=rotulo`);

  const conferido = conferirLink(texto(formData, "novo-url") ?? "");
  if (!conferido.ok) redirect(`${TELA}?erro=link_${conferido.motivo}`);

  const novo: LinkExtra = {
    id: crypto.randomUUID(),
    rotulo,
    url: conferido.url,
    icone: icone(formData, "novo-icone"),
  };

  await guardar({ ...negocio, links: [...links, novo] }, TELA);
  // O id, e não só um "acrescentado=1": a tela precisa saber QUAL linha nasceu
  // agora para abrir, marcar e parar a rolagem nela.
  redirect(
    `${TELA}?novo=${encodeURIComponent(novo.id)}${naLinha(links.length)}`,
  );
}

/** O número da linha chega por `bind`. O porquê está em catalogo/acoes.ts. */
const dentroDaLista = (alvo: number, total: number): boolean =>
  Number.isInteger(alvo) && alvo >= 0 && alvo < total;

async function mover(alvo: number, formData: FormData, passo: number) {
  const { negocio, links } = await listaSalva(formData);
  const destino = alvo + passo;

  if (!dentroDaLista(alvo, links.length) || !dentroDaLista(destino, links.length)) {
    redirect(`${TELA}?salvo=lista`);
  }

  const novos = [...links];
  [novos[alvo], novos[destino]] = [novos[destino], novos[alvo]];

  await guardar({ ...negocio, links: novos }, TELA);
  redirect(
    `${TELA}?movido=1${linhaAberta(novos, formData).pedaco}${naLinha(destino)}`,
  );
}

export async function subirLink(alvo: number, formData: FormData) {
  await mover(alvo, formData, -1);
}

export async function descerLink(alvo: number, formData: FormData) {
  await mover(alvo, formData, 1);
}

export async function removerLink(alvo: number, formData: FormData) {
  const { negocio, links } = await listaSalva(formData);
  if (!dentroDaLista(alvo, links.length)) redirect(`${TELA}?salvo=lista`);

  const novos = links.filter((_, i) => i !== alvo);
  await guardar({ ...negocio, links: novos }, TELA);
  redirect(
    `${TELA}?removido=1${linhaAberta(novos, formData).pedaco}${naLinha(Math.max(0, alvo - 1))}`,
  );
}
