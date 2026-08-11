import { IconeWhatsapp } from "./Icones";
import { linkWhatsapp } from "@/lib/formato";
import type { Negocio } from "@/lib/tipos";

/**
 * Barra fixa no rodape. E o unico botao que fica sempre na tela.
 * O atributo data-evento e o gancho da etapa 7, quando entrar a contagem
 * de cliques. Por enquanto nao carrega nenhum JavaScript.
 */
/**
 * Só o botão. Separado do container fixo porque a tela inicial mostra este
 * botão de verdade, e não uma cópia parecida.
 */
export function BotaoWhatsapp({
  negocio,
  interativo = true,
}: {
  negocio: Negocio;
  interativo?: boolean;
}) {
  if (!negocio.whatsapp) return null;

  const classes =
    "flex h-13 w-full items-center justify-center gap-2.5 rounded-full bg-zap px-5 text-[1.02rem] font-semibold text-white shadow-[0_2px_12px_rgba(14,122,85,0.28)] transition-colors hover:bg-zap-forte active:bg-zap-forte";

  const miolo = (
    <>
      <IconeWhatsapp className="h-5.5 w-5.5" />
      Chamar no WhatsApp
    </>
  );

  if (!interativo) {
    return (
      <span className={classes} aria-hidden>
        {miolo}
      </span>
    );
  }

  return (
    <a
      href={linkWhatsapp(negocio.whatsapp, negocio.mensagemPadrao)}
      target="_blank"
      rel="noopener noreferrer"
      data-evento="clique_whatsapp"
      className={classes}
    >
      {miolo}
      <span className="sr-only">, abre a conversa em outra aba</span>
    </a>
  );
}

export function BarraWhatsapp({ negocio }: { negocio: Negocio }) {
  if (!negocio.whatsapp) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-fundo/92 backdrop-blur-sm">
      <div
        className="mx-auto w-full max-w-[34rem] px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <BotaoWhatsapp negocio={negocio} />
      </div>
    </div>
  );
}
