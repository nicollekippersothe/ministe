"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { doDono, salvar } from "@/lib/dados";
import { combinacao, FONTE_PADRAO, podeEscolherFonte } from "@/lib/fontes";
import { normalizarWhatsapp } from "@/lib/formato";
import type { Acao, Intervalo, Negocio } from "@/lib/tipos";

const LIMITE_INTERVALOS = 3;

function texto(f: FormData, campo: string): string | null {
  const v = f.get(campo);
  if (typeof v !== "string") return null;
  const limpo = v.trim();
  return limpo === "" ? null : limpo;
}

function marcado(f: FormData, campo: string): boolean {
  return f.get(campo) === "on";
}

/** Depois de salvar, a página pública precisa refazer o cache. */
async function guardar(negocio: Negocio) {
  await salvar(negocio);
  revalidatePath(`/${negocio.slug}`);
  revalidatePath("/painel");
}

export async function salvarBasico(formData: FormData) {
  const negocio = await doDono();

  const nome = texto(formData, "nome");
  if (!nome) redirect("/painel/negocio?erro=nome");

  const bruto = texto(formData, "whatsapp");
  const whatsapp = bruto ? normalizarWhatsapp(bruto) : null;
  if (whatsapp && (whatsapp.length < 12 || whatsapp.length > 15)) {
    redirect("/painel/negocio?erro=whatsapp");
  }

  const estado = texto(formData, "estado");
  if (estado && !/^[A-Za-z]{2}$/.test(estado)) {
    redirect("/painel/negocio?erro=estado");
  }

  const cep = texto(formData, "cep");
  if (cep && !/^[0-9]{5}-?[0-9]{3}$/.test(cep)) {
    redirect("/painel/negocio?erro=cep");
  }

  await guardar({
    ...negocio,
    nome,
    frase: texto(formData, "frase"),
    whatsapp,
    mensagemPadrao: texto(formData, "mensagemPadrao"),
    mensagemItem: texto(formData, "mensagemItem"),
    mostrarPrecos: marcado(formData, "mostrarPrecos"),
    tituloCatalogo: texto(formData, "tituloCatalogo") ?? "Catálogo",
    endereco: texto(formData, "endereco"),
    cidade: texto(formData, "cidade"),
    estado: estado ? estado.toUpperCase() : null,
    cep,
    mapsUrl: texto(formData, "mapsUrl"),
    fuso: texto(formData, "fuso") ?? "America/Sao_Paulo",
  });

  redirect("/painel/negocio?salvo=1");
}

/**
 * Lê os sete dias de uma vez. Par de horários em branco significa que aquele
 * turno não existe, e dia sem nenhum turno é dia fechado. É a mesma regra do
 * banco, onde não existe campo "fechado".
 */
function lerHorarios(formData: FormData): Intervalo[] {
  const horarios: Intervalo[] = [];

  for (let dia = 0; dia <= 6; dia++) {
    for (let slot = 0; slot < LIMITE_INTERVALOS; slot++) {
      const abre = texto(formData, `h-${dia}-${slot}-abre`);
      const fecha = texto(formData, `h-${dia}-${slot}-fecha`);
      if (!abre || !fecha || abre === fecha) continue;
      horarios.push({ dia, abre, fecha });
    }
  }

  return horarios;
}

export async function salvarHorarios(formData: FormData) {
  const negocio = await doDono();
  await guardar({ ...negocio, horarios: lerHorarios(formData) });
  redirect("/painel/horarios?salvo=1");
}

/**
 * O "aplicar a todos" para horário: copia a segunda para terça a sexta, que é
 * o caso de quase todo negócio e evita preencher dez campos no celular.
 */
export async function copiarSegundaParaSemana(formData: FormData) {
  const negocio = await doDono();
  const atuais = lerHorarios(formData);
  const segunda = atuais.filter((h) => h.dia === 1);

  const semSemana = atuais.filter((h) => h.dia < 1 || h.dia > 5);
  const copiados = [2, 3, 4, 5].flatMap((dia) =>
    segunda.map((h) => ({ ...h, dia })),
  );

  await guardar({
    ...negocio,
    horarios: [...semSemana, ...segunda, ...copiados],
  });

  redirect("/painel/horarios?copiado=1");
}

export async function salvarAparencia(formData: FormData) {
  const negocio = await doDono();

  // A escolha de letra é do plano pago. Quem está no gratuito fica com a
  // padrão, e o servidor decide isso, não a tela.
  if (!podeEscolherFonte(negocio.plano)) {
    await guardar({ ...negocio, fonte: FONTE_PADRAO });
    redirect("/painel/aparencia?salvo=1");
  }

  const escolha = texto(formData, "fonte");
  await guardar({ ...negocio, fonte: combinacao(escolha).chave });
  redirect("/painel/aparencia?salvo=1");
}

/** Lê um dos dois botões do rodapé. "nenhum" apaga o botão. */
function lerAcao(formData: FormData, prefixo: string): Acao | null {
  const tipo = texto(formData, `${prefixo}-tipo`);
  if (!tipo || tipo === "nenhum") return null;
  if (tipo !== "whatsapp" && tipo !== "link" && tipo !== "telefone") return null;

  const url = texto(formData, `${prefixo}-url`);
  if (tipo === "link" && !url) return null;

  const padroes: Record<string, string> = {
    whatsapp: "Chamar no WhatsApp",
    telefone: "Ligar",
    link: "Abrir",
  };

  return {
    tipo,
    rotulo: texto(formData, `${prefixo}-rotulo`) ?? padroes[tipo],
    url: tipo === "link" ? url : null,
    icone: (texto(formData, `${prefixo}-icone`) ?? "link") as Acao["icone"],
  };
}

export async function salvarAcoes(formData: FormData) {
  const negocio = await doDono();
  await guardar({
    ...negocio,
    acaoPrincipal: lerAcao(formData, "principal"),
    acaoSecundaria: lerAcao(formData, "secundaria"),
  });
  redirect("/painel/acoes-botoes?salvo=1");
}

export async function alternarPublicacao() {
  const negocio = await doDono();
  await guardar({ ...negocio, publicado: !negocio.publicado });
  redirect("/painel");
}
