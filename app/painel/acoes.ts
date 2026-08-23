"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { doDono, publicar, salvar } from "@/lib/dados";
import { MOTIVOS_DADOS, motivoDaRecusa, type RecusaDados } from "@/lib/dados/erros";
import { guardar } from "./guardar";
import { configurado } from "@/lib/supabase/config";
import {
  caminhoDeImagem,
  caminhoValido,
  conferirArquivo,
  ehPasta,
  limitarFoco,
  MEDIDAS,
  MOTIVOS_IMAGEM,
  type PastaDeImagem,
  type RecusaImagem,
} from "@/lib/supabase/imagens";
import { contaProvisoria, servidor, usuarioAtual } from "@/lib/supabase/servidor";
import { combinacao, FONTE_PADRAO, podeEscolherFonte } from "@/lib/fontes";
import { normalizarWhatsapp } from "@/lib/formato";
import { conferirLink, type RecusaLink } from "@/lib/links";
import type { Acao, Foto, Intervalo, Negocio } from "@/lib/tipos";

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

export async function salvarBasico(formData: FormData) {
  const negocio = await doDono();

  const nome = texto(formData, "nome");
  if (!nome) redirect("/painel/negocio?erro=nome");

  const bruto = texto(formData, "whatsapp");
  const whatsapp = bruto ? normalizarWhatsapp(bruto) : null;
  if (whatsapp && (whatsapp.length < 12 || whatsapp.length > 15)) {
    redirect("/painel/negocio?erro=whatsapp");
  }

  /*
   * A resposta da pergunta do endereço, que a tela faz com duas opções à vista.
   *
   * "Deixar de fora" é uma resposta, e não um campo em branco: ela tira o
   * endereço da página mesmo quando havia um gravado, que é o que a pessoa
   * espera de uma escolha marcada. Os campos chegam desligados nesse caso e o
   * formulário nem os manda, então ler tudo como nulo aqui é o mesmo resultado
   * por dois caminhos, e ficar explícito é o que impede um campo esquecido de
   * voltar sozinho para a página no dia em que a tela mudar.
   */
  const enderecoNaPagina = texto(formData, "enderecoNaPagina") !== "nao";

  const estado = enderecoNaPagina ? texto(formData, "estado") : null;
  if (estado && !/^[A-Za-z]{2}$/.test(estado)) {
    redirect("/painel/negocio?erro=estado");
  }

  const cep = enderecoNaPagina ? texto(formData, "cep") : null;
  if (cep && !/^[0-9]{5}-?[0-9]{3}$/.test(cep)) {
    redirect("/painel/negocio?erro=cep");
  }

  const mapaBruto = enderecoNaPagina ? texto(formData, "mapsUrl") : null;
  let mapsUrl: string | null = null;
  if (mapaBruto) {
    const conferido = conferirLink(mapaBruto);
    if (!conferido.ok) redirect(`/painel/negocio?erro=mapa_${conferido.motivo}`);
    mapsUrl = conferido.url;
  }

  await guardar(
    {
      ...negocio,
      nome,
      frase: texto(formData, "frase"),
      whatsapp,
      mensagemPadrao: texto(formData, "mensagemPadrao"),
      mensagemItem: texto(formData, "mensagemItem"),
      mostrarPrecos: marcado(formData, "mostrarPrecos"),
      tituloCatalogo: texto(formData, "tituloCatalogo") ?? "Catálogo",
      endereco: enderecoNaPagina ? texto(formData, "endereco") : null,
      cidade: enderecoNaPagina ? texto(formData, "cidade") : null,
      estado: estado ? estado.toUpperCase() : null,
      cep,
      mapsUrl,
      fuso: texto(formData, "fuso") ?? "America/Sao_Paulo",
    },
    "/painel/negocio",
  );

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
  await guardar({ ...negocio, horarios: lerHorarios(formData) }, "/painel/horarios");
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

  await guardar(
    { ...negocio, horarios: [...semSemana, ...segunda, ...copiados] },
    "/painel/horarios",
  );

  redirect("/painel/horarios?copiado=1");
}

export async function salvarAparencia(formData: FormData) {
  const negocio = await doDono();

  // A escolha de letra é do plano pago. Quem está no gratuito fica com a
  // padrão, e o servidor decide isso, não a tela.
  if (!podeEscolherFonte(negocio.plano)) {
    await guardar({ ...negocio, fonte: FONTE_PADRAO }, "/painel/aparencia");
    redirect("/painel/aparencia?salvo=1");
  }

  const escolha = texto(formData, "fonte");
  await guardar(
    { ...negocio, fonte: combinacao(escolha).chave },
    "/painel/aparencia",
  );
  redirect("/painel/aparencia?salvo=1");
}

/**
 * Lê um dos dois botões do rodapé. "nenhum" apaga o botão.
 *
 * O link passa pelo portão de lib/links.ts antes de virar dado. É o campo
 * mais perigoso do produto: quem clica está confiando na página, e o endereço
 * de destino nem aparece para ele.
 */
function lerAcao(
  formData: FormData,
  prefixo: string,
): { acao: Acao | null } | { erro: RecusaLink } {
  const tipo = texto(formData, `${prefixo}-tipo`);
  if (!tipo || tipo === "nenhum") return { acao: null };
  if (tipo !== "whatsapp" && tipo !== "link" && tipo !== "telefone") {
    return { acao: null };
  }

  let url: string | null = null;
  if (tipo === "link") {
    const bruto = texto(formData, `${prefixo}-url`);
    // Botão de link sem link nenhum simplesmente não existe, e apagar o
    // endereço é como a pessoa tira o botão. Não é erro.
    if (!bruto) return { acao: null };
    const conferido = conferirLink(bruto);
    if (!conferido.ok) return { erro: conferido.motivo };
    url = conferido.url;
  }

  const padroes: Record<string, string> = {
    whatsapp: "Chamar no WhatsApp",
    telefone: "Ligar",
    link: "Abrir",
  };

  return {
    acao: {
      tipo,
      rotulo: texto(formData, `${prefixo}-rotulo`) ?? padroes[tipo],
      url,
      icone: (texto(formData, `${prefixo}-icone`) ?? "link") as Acao["icone"],
    },
  };
}

export async function salvarAcoes(formData: FormData) {
  const negocio = await doDono();

  const principal = lerAcao(formData, "principal");
  if ("erro" in principal) {
    redirect(`/painel/acoes-botoes?erro=link_${principal.erro}`);
  }
  const secundaria = lerAcao(formData, "secundaria");
  if ("erro" in secundaria) {
    redirect(`/painel/acoes-botoes?erro=link_${secundaria.erro}`);
  }

  await guardar(
    {
      ...negocio,
      acaoPrincipal: principal.acao,
      acaoSecundaria: secundaria.acao,
    },
    "/painel/acoes-botoes",
  );
  redirect("/painel/acoes-botoes?salvo=1");
}

/**
 * Põe a página no ar, ou tira.
 *
 * Publicar de conta provisória é recusado pelo banco. A tela manda a pessoa
 * entrar com o Google antes de chegar aqui, e este desvio é para quem apertar
 * o botão com a sessão em outro estado do que a tela mostrava.
 *
 * O gatilho protege_publicacao é a mesma regra escrita no banco, e quem chega
 * nela por fora da tela cai no `conta_confirmada`. A saída dos dois caminhos é
 * a mesma, o Google, então os dois levam para o mesmo lugar. Qualquer outra
 * recusa vira `?erro=<motivo>` no painel.
 */
export async function alternarPublicacao() {
  const negocio = await doDono();
  const noArAgora = !negocio.publicado;

  if (noArAgora && (await contaProvisoria())) {
    redirect("/entrar?motivo=publicar");
  }

  try {
    await publicar(noArAgora);
  } catch (erro) {
    const motivo = motivoDaRecusa(erro);
    if (motivo === null) throw erro;
    if (motivo === "conta_confirmada") redirect("/entrar?motivo=publicar");
    redirect(`/painel?erro=${motivo}`);
  }

  revalidatePath(`/${negocio.slug}`);
  revalidatePath("/painel");
  redirect("/painel");
}

/**
 * O envio da foto de perfil e da capa.
 *
 * O arquivo sobe PELO NAVEGADOR, direto para o Storage, e é decisão de
 * tamanho: o bucket aceita até 3 MB por arquivo (`file_size_limit` em
 * supabase/storage.sql) e o corpo de uma Server Action é limitado a 1 MB por
 * padrão no Next, configurável em `serverActions.bodySizeLimit`. Uma foto de
 * celular passa de 1 MB com facilidade, então mandar o arquivo por aqui
 * recusaria o caso comum, e o remendo (esticar o limite do corpo) faria a foto
 * atravessar a nossa função só para ser reenviada ao Supabase: dobra o tráfego,
 * ocupa a função pelo tempo do upload e ainda esbarra no teto de corpo da
 * Vercel. O caminho curto é o navegador falar com o Storage, que é para onde o
 * arquivo vai de qualquer jeito, com a mesma sessão e a mesma RLS.
 *
 * O que sobra para o servidor são estes dois passos, que são de dado e não de
 * byte: dizer QUAL caminho o arquivo pode ocupar, e gravar esse caminho na
 * coluna depois que ele chegou.
 */

/** Quem manda no caminho é o id da linha, e ele mora só no banco. */
async function idDoNegocio(): Promise<string | null> {
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

  return typeof data?.id === "string" ? data.id : null;
}

export type RespostaDeImagem =
  | { ok: true; caminho: string }
  | { ok: false; recusa: "imagem"; motivo: RecusaImagem };

export type GravacaoDeImagem =
  | { ok: true; anterior: string | null }
  | { ok: false; recusa: "imagem"; motivo: RecusaImagem }
  | { ok: false; recusa: "banco"; motivo: RecusaDados };

/**
 * O caminho que o navegador vai ocupar no bucket.
 *
 * Sai daqui, e nunca da tela, porque ele carrega o id do negócio: a política de
 * escrita do Storage exige que a primeira pasta seja um negócio de quem está
 * enviando, e a restrição da 008 exige que seja o id da própria linha. Montar o
 * caminho no servidor é o que mantém as duas exigências satisfeitas de saída.
 *
 * O tipo e o tamanho passam pela mesma conferência da tela. A tela confere para
 * a pessoa saber na hora; aqui confere porque Server Action é endereço público.
 */
export async function prepararEnvioDeImagem(
  pasta: string,
  tipo: string,
  bytes: number,
): Promise<RespostaDeImagem> {
  if (!ehPasta(pasta)) return { ok: false, recusa: "imagem", motivo: "envio" };

  const conferido = conferirArquivo({ type: tipo, size: bytes });
  if (!conferido.ok) {
    return { ok: false, recusa: "imagem", motivo: conferido.motivo };
  }

  const id = await idDoNegocio();
  if (id === null) return { ok: false, recusa: "imagem", motivo: "envio" };

  return { ok: true, caminho: caminhoDeImagem(id, pasta, conferido.tipo) };
}

/**
 * Grava na coluna o caminho do arquivo que acabou de subir, ou limpa a coluna
 * quando a pessoa remove a imagem.
 *
 * Devolve o caminho anterior para a tela apagar aquele arquivo do bucket logo
 * em seguida, que é o caminho feliz descrito na 008. A rede embaixo é do banco:
 * o gatilho `negocios_enfileira_removida` escreve o caminho que saiu de cena em
 * `imagens_para_apagar`, então o arquivo continua com destino marcado mesmo
 * quando a aba fecha no meio.
 *
 * O texto alternativo sai do nome do negócio, seguindo o comentário no topo de
 * lib/supabase/mapa.ts, que é quem traduz a linha do banco em `Foto`. A 008
 * criou `logo_alt` e `capa_alt` para o dia em que a pessoa puder escrever o
 * texto dela; enquanto `mapa.ts` deriva o alt do nome, um campo de alt no
 * painel guardaria um texto que a página pública ignoraria.
 */
export async function salvarImagemDoNegocio(
  pasta: string,
  caminho: string | null,
): Promise<GravacaoDeImagem> {
  if (!ehPasta(pasta)) return { ok: false, recusa: "imagem", motivo: "guardar" };

  const negocio = await doDono();
  const atual = pasta === "logo" ? negocio.logo : negocio.capa;

  let foto: Foto | null = null;
  if (caminho !== null) {
    const id = await idDoNegocio();
    if (id === null || !caminhoValido(caminho, id, pasta)) {
      return { ok: false, recusa: "imagem", motivo: "guardar" };
    }
    foto = { url: caminho, alt: negocio.nome, ...MEDIDAS[pasta] };
  }

  const atualizado: Negocio =
    pasta === "logo" ? { ...negocio, logo: foto } : { ...negocio, capa: foto };

  try {
    await salvar(atualizado);
  } catch (erro) {
    const motivo = motivoDaRecusa(erro);
    if (motivo === null) throw erro;
    return { ok: false, recusa: "banco", motivo };
  }

  revalidatePath(`/${negocio.slug}`);
  revalidatePath("/painel");

  // Endereço que começa com barra é arquivo do projeto (as páginas de exemplo),
  // e não do bucket: só o caminho do bucket volta para a tela apagar.
  const anterior = atual?.url ?? null;
  return {
    ok: true,
    anterior: anterior !== null && !anterior.startsWith("/") ? anterior : null,
  };
}

/**
 * O ponto da capa que precisa aparecer.
 *
 * Grava sozinho, junto do envio da imagem, e fora do Salvar do rodapé: quem
 * arrasta o ponto está olhando a prévia da capa, e o resultado do arraste é a
 * própria prévia mudando. Fazer o ajuste esperar um botão lá embaixo colocaria
 * um segundo momento no meio de uma coisa que já se explica na tela.
 *
 * Os dois números são conferidos aqui porque Server Action é endereço público,
 * e a mesma conta está escrita na restrição `capa_foco_faixa` da correção 014.
 * Capa vazia recusa: ponto focal de foto nenhuma seria um par de números que
 * página nenhuma lê.
 */
export async function salvarFocoDaCapa(
  x: number,
  y: number,
): Promise<{ ok: true } | { ok: false; motivo: string }> {
  const negocio = await doDono();
  if (!negocio.capa) return { ok: false, motivo: MOTIVOS_IMAGEM.guardar };

  const capa: Foto = {
    ...negocio.capa,
    foco: { x: limitarFoco(x), y: limitarFoco(y) },
  };

  try {
    await salvar({ ...negocio, capa });
  } catch (erro) {
    const motivo = motivoDaRecusa(erro);
    if (motivo === null) throw erro;
    return { ok: false, motivo: MOTIVOS_DADOS[motivo] };
  }

  revalidatePath(`/${negocio.slug}`);
  revalidatePath("/painel");
  return { ok: true };
}
