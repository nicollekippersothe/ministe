"use client";

import { BotaoDeAcao } from "@/componentes/painel/BotaoDeAcao";

/**
 * O botão que envia o cadastro e a denúncia, com o sinal de que o toque pegou.
 *
 * Existe como arquivo próprio para `Moldura` continuar sendo componente de
 * servidor. `BotaoDeAcao` lê `useFormStatus`, que só roda no navegador, e pôr o
 * "use client" na Moldura arrastaria para o navegador as quatro telas que ela
 * veste. Aqui a fronteira fica do tamanho do botão.
 *
 * O motivo de o cadastro precisar disto está escrito em `BotaoDeAcao`: entre o
 * toque e a tela seguinte o botão fica idêntico, e no celular a pessoa toca de
 * novo. No cadastro o segundo toque é caro, porque a Server Action já pegou o
 * endereço no primeiro: o segundo envio volta dizendo que o endereço está em
 * uso, e quem tomou foi ela mesma.
 *
 * Fora de formulário, `useFormStatus` responde que ninguém está enviando, e o
 * botão se comporta como qualquer outro. Com o JavaScript desligado o HTML sai
 * com um `button` comum, que é o que o teste de fluxo aperta.
 */
export function BotaoEnviar({
  children,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BotaoDeAcao
      {...resto}
      className="flex h-13 w-full items-center justify-center rounded-full bg-texto px-6 text-[1.05rem] font-semibold text-superficie"
    >
      {children}
    </BotaoDeAcao>
  );
}
