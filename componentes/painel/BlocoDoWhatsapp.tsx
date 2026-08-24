"use client";

import { useState } from "react";
import { Texto } from "./Campos";
import { MensagemDoBotao } from "./PreviaDaMensagem";
import { normalizarWhatsapp, telefoneVisivel } from "@/lib/formato";
import type { Negocio } from "@/lib/tipos";

/**
 * O número do WhatsApp e a prévia que depende dele.
 *
 * ## Por que os dois moram juntos
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
 * ## A mensagem dos itens saiu daqui
 *
 * Eram dois campos de mensagem seguidos, e a dona da página leu os dois e
 * disse: "a mensagem dos itens eu tiraria, ficou confuso no cadastro, e
 * perfumaria total". Ela está certa nas duas coisas. Perguntar duas vezes por
 * um texto de WhatsApp, sendo que um deles é um modelo com uma chave `{item}`
 * dentro, é pedir trabalho de programador a quem quer só pôr o preço da aula.
 *
 * A mensagem continua existindo na página pública, montada por
 * `mensagemDoItem` com o modelo padrão. Quem toca no botão de um item segue
 * chegando ao WhatsApp com o nome do item já escrito, que é o que faz aquele
 * botão converter. O que saiu foi a pergunta, e nunca o comportamento.
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
    </>
  );
}
