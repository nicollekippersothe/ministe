"use client";

import { useState } from "react";
import { Texto } from "./Campos";
import { MensagemDoBotao, MensagemDosItens } from "./PreviaDaMensagem";
import { normalizarWhatsapp, telefoneVisivel } from "@/lib/formato";
import type { Negocio } from "@/lib/tipos";

/**
 * O número do WhatsApp e as duas prévias que dependem dele.
 *
 * ## Por que os três moram juntos
 *
 * A dona da página contou assim: "o botão do whats apareceu agora, mas
 * demorou". Cronometrado, a demora tinha um motivo só, e nenhum deles era
 * lentidão: as prévias liam `negocio.whatsapp`, que é o valor gravado, então
 * digitar o número no campo mexia em nada. A única forma de o botão aparecer
 * era descer a tela inteira, tocar em Salvar, e esperar o servidor devolver a
 * página. A ida e volta do Salvar leva 194, 216 e 245 milissegundos nas três
 * medidas que fiz aqui; o que demorava era o caminho, e não a máquina.
 *
 * Com o campo e as prévias no mesmo estado, o número vale na hora em que é
 * digitado, do mesmo jeito que o texto das mensagens já valia. O Salvar
 * continua sendo quem grava, e continua sendo a mesma ida e volta.
 *
 * ## O que este componente cuida
 *
 * O campo continua sendo o `Texto` de sempre, com `defaultValue` e `name`, e
 * portanto continua indo no formulário como sempre foi: quem lê e normaliza no
 * fim é `salvarBasico`. O estado daqui serve para o desenho, e a conferência
 * abaixo é a mesma do servidor, para o botão só ganhar cor cheia quando o
 * número for de verdade.
 */

/** A mesma faixa que `salvarBasico` aceita, para os dois lados concordarem. */
function numeroPronto(digitado: string): string | null {
  const digitos = normalizarWhatsapp(digitado);
  if (digitos === null) return null;
  return digitos.length >= 12 && digitos.length <= 15 ? digitos : null;
}

export function BlocoDoWhatsapp({ negocio }: { negocio: Negocio }) {
  const [digitado, setDigitado] = useState(
    negocio.whatsapp ? telefoneVisivel(negocio.whatsapp) : "",
  );
  const whatsapp = numeroPronto(digitado);

  return (
    <>
      <Texto
        id="whatsapp"
        rotulo="Número do WhatsApp"
        dica="Com DDD. Pode digitar com parênteses e traço."
        valor={negocio.whatsapp ? telefoneVisivel(negocio.whatsapp) : null}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        onChange={(e) => setDigitado(e.target.value)}
      />

      <MensagemDoBotao
        negocio={negocio}
        whatsapp={whatsapp}
        rotulo="Mensagem que já vem escrita"
        dica="É o que o cliente vê digitado quando toca no botão."
      />

      <MensagemDosItens
        negocio={negocio}
        whatsapp={whatsapp}
        rotulo="Mensagem dos itens"
        dica="Vale para todos os itens de uma vez. O {item} vira o nome do produto."
      />
    </>
  );
}
