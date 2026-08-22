"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * O botão que responde ao dedo antes de o servidor responder.
 *
 * **É o conserto do "pareciam que não tava nem funcionando".** Um botão de
 * Server Action fica igualzinho entre o toque e a tela seguinte: no celular,
 * onde `:hover` nem existe, a pessoa toca, olha para um botão idêntico ao de um
 * segundo atrás e conclui que o toque se perdeu. Aí ela toca de novo, e o
 * segundo toque vira uma segunda escrita.
 *
 * São três sinais, e cada um cobre um pedaço do intervalo:
 *
 * 1. `active:` responde no mesmo quadro do toque, porque é CSS puro e nem
 *    espera o JavaScript acordar. É o único retorno tátil que existe no celular.
 * 2. O anel girando aparece assim que o React marca o envio como pendente, e
 *    fica até a tela seguinte chegar. Só no botão que a pessoa tocou: os outros
 *    do mesmo formulário ficam desligados, e um botão desligado que também
 *    girasse diria que ele está fazendo alguma coisa.
 * 3. `aria-busy` e o recado ao lado dizem o mesmo para quem usa leitor de tela,
 *    que é justamente quem o anel deixa de fora.
 *
 * `useFormStatus` conta do formulário inteiro, e não de um botão: quando
 * qualquer envio está no ar, todos os botões daqui desligam. É o que impede o
 * toque duplo de virar duas escritas nas listas do catálogo e dos links, onde
 * subir, descer, remover e salvar dividem o mesmo formulário. Qual deles a
 * pessoa tocou fica no estado local, marcado no `onClick`, e volta ao normal
 * quando o envio termina.
 */
export function BotaoDeAcao({
  children,
  className = "",
  onClick,
  disabled,
  ...resto
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  const [meuEnvio, setMeuEnvio] = useState(false);

  useEffect(() => {
    if (!pending) setMeuEnvio(false);
  }, [pending]);

  const girando = pending && meuEnvio;

  return (
    <button
      {...resto}
      disabled={disabled || pending}
      aria-busy={girando || undefined}
      onClick={(evento) => {
        setMeuEnvio(true);
        onClick?.(evento);
      }}
      className={`transition-transform duration-75 active:scale-[0.97] disabled:opacity-60 ${className}`}
    >
      {girando ? (
        <>
          <span
            aria-hidden
            className="mr-2 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.2em]"
          />
          <span className="sr-only" role="status">
            Enviando.
          </span>
        </>
      ) : null}
      {children}
    </button>
  );
}
