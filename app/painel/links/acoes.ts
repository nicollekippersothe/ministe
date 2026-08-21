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

const naLinha = (i: number) => `#link-${i}`;

export async function salvarLinks(formData: FormData) {
  const { negocio, links } = await lista(formData);
  await guardar({ ...negocio, links }, TELA);
  redirect(`${TELA}?salvo=1`);
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
  redirect(`${TELA}?acrescentado=1${naLinha(links.length)}`);
}

/** O número da linha chega por `bind`. O porquê está em catalogo/acoes.ts. */
const dentroDaLista = (alvo: number, total: number): boolean =>
  Number.isInteger(alvo) && alvo >= 0 && alvo < total;

async function mover(alvo: number, formData: FormData, passo: number) {
  const { negocio, links } = await lista(formData);
  const destino = alvo + passo;

  if (!dentroDaLista(alvo, links.length) || !dentroDaLista(destino, links.length)) {
    redirect(`${TELA}?salvo=1`);
  }

  const novos = [...links];
  [novos[alvo], novos[destino]] = [novos[destino], novos[alvo]];

  await guardar({ ...negocio, links: novos }, TELA);
  redirect(`${TELA}?movido=1${naLinha(destino)}`);
}

export async function subirLink(alvo: number, formData: FormData) {
  await mover(alvo, formData, -1);
}

export async function descerLink(alvo: number, formData: FormData) {
  await mover(alvo, formData, 1);
}

export async function removerLink(alvo: number, formData: FormData) {
  const { negocio, links } = await lista(formData);
  if (!dentroDaLista(alvo, links.length)) redirect(`${TELA}?salvo=1`);

  await guardar({ ...negocio, links: links.filter((_, i) => i !== alvo) }, TELA);
  redirect(`${TELA}?removido=1${naLinha(Math.max(0, alvo - 1))}`);
}
