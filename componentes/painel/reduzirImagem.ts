"use client";

import { TIPOS_ACEITOS, type PastaDoBucket } from "@/lib/supabase/imagens";

/**
 * A foto do celular virando arquivo de página, no próprio celular.
 *
 * Isto é o que supabase/storage.sql descreve quando explica o teto do bucket:
 * "o navegador reduz a foto antes de subir e o arquivo real fica perto de
 * 150 KB, então 3 MB só serve para barrar quem tentar subir arquivo cru de
 * 40 MB". A câmera de um celular de hoje entrega de 3 a 8 MB por foto, então
 * sem esta etapa o teto do bucket deixaria de ser rede de segurança e viraria
 * a parede do caso comum.
 *
 * Reduzir aqui paga três contas de uma vez: o envio termina no 4G, o giga
 * gratuito do Storage dura, e a página pública carrega a imagem que ela de fato
 * mostra, em vez de 8 MB encolhidos pelo navegador de quem visita.
 *
 * Toda falha volta com o arquivo original na mão. Formato que o navegador não
 * decodifica, canvas bloqueado, memória curta: em qualquer um deles o envio
 * segue com o que a pessoa escolheu, e quem decide se aquilo cabe é a
 * conferência de tamanho, que roda depois desta função.
 */

/** O maior lado que cada imagem precisa ter para a página. */
export const LADO_MAXIMO: Record<PastaDoBucket, number> = {
  // O avatar aparece em 88 pixels na página e em 400 no mapa de medidas. 800
  // cobre tela de retina com folga.
  logo: 800,
  // A capa atravessa a tela inteira no monitor, e 2000 é o dobro da largura
  // máxima do container.
  capa: 2000,
  // O cartão do catálogo tem 340 pixels no monitor e 92 por cento da tela no
  // celular, então 1200 cobre retina com folga e ainda cabe nos 3 MB do bucket.
  catalogo: 1200,
};

/** Qualidade do WebP. 0.85 é o ponto em que a diferença some da tela. */
const QUALIDADE = 0.85;

export async function reduzirImagem(arquivo: File, lado: number): Promise<File> {
  try {
    const imagem = await createImageBitmap(arquivo);
    const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
    const largura = Math.max(1, Math.round(imagem.width * escala));
    const altura = Math.max(1, Math.round(imagem.height * escala));

    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;

    const pincel = tela.getContext("2d");
    if (pincel === null) return arquivo;

    pincel.drawImage(imagem, 0, 0, largura, altura);
    imagem.close();

    const menor = await new Promise<Blob | null>((pronto) => {
      // Safari antes da 16 devolve PNG aqui, e PNG também está na lista do
      // bucket, então o caminho continua válido com a extensão que vier.
      tela.toBlob(pronto, "image/webp", QUALIDADE);
    });

    if (menor === null) return arquivo;
    if (!(menor.type in TIPOS_ACEITOS)) return arquivo;
    // Imagem que já estava enxuta continua como está: reencodar uma logo de
    // 20 KB só a deixaria maior e mais borrada.
    if (menor.size >= arquivo.size) return arquivo;

    return new File([menor], arquivo.name, { type: menor.type });
  } catch {
    return arquivo;
  }
}
