import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { salvar } from "@/lib/dados";
import { motivoDaRecusa } from "@/lib/dados/erros";
import type { Negocio } from "@/lib/tipos";

/**
 * Salva e refaz o cache da página pública.
 *
 * A `tela` é para onde a pessoa volta quando o banco recusa a escrita. Os
 * limites do produto moram em gatilho, de propósito, porque o painel escreve
 * direto pelo navegador; o preço é que a recusa chega como exceção do Postgres
 * e, solta, vira 500 com "this page couldn't load" na frente de quem estava
 * salvando. Aqui ela vira `?erro=<motivo>` na URL, e o `Aviso` da tela mostra a
 * frase, que em caso de limite termina no caminho do plano pago.
 *
 * `motivoDaRecusa` devolve nulo para o que veio de outro lugar, e aí a exceção
 * continua subindo. É isso que impede este catch de engolir bug de código e a
 * navegação do próprio `redirect`, que também trabalha levantando exceção.
 *
 * Mora fora de app/painel/acoes.ts, e num arquivo comum em vez de "use server",
 * por dois motivos. As telas de catálogo e de links têm as ações delas em
 * arquivo próprio, e as três precisam desta função. E num arquivo "use server"
 * toda exportação vira endereço público: `guardar` recebe um `Negocio` inteiro,
 * então exportá-la de lá abriria uma porta para escrever campo que a tela
 * nenhuma oferece.
 */
export async function guardar(negocio: Negocio, tela: string) {
  try {
    await salvar(negocio);
  } catch (erro) {
    const motivo = motivoDaRecusa(erro);
    if (motivo === null) throw erro;
    redirect(`${tela}?erro=${motivo}`);
  }

  revalidatePath(`/${negocio.slug}`);
  revalidatePath("/painel");
}
