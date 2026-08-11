import { IconeDoLink, IconeWhatsapp } from "./Icones";
import { acoesDoRodape, type AcaoPronta } from "@/lib/acoes";
import type { Negocio } from "@/lib/tipos";

/**
 * A barra fixa no rodape da pagina publica.
 *
 * Ate duas acoes: a primeira cheia, a segunda contornada. So o WhatsApp usa o
 * verde, porque verde ali significa WhatsApp e nao "botao principal". Quando a
 * acao principal e o iFood ou uma agenda, ela sai na cor da marca.
 *
 * O data-evento e o gancho da contagem de cliques. Nao carrega JavaScript.
 */
export function BotaoAcao({
  acao,
  principal,
  interativo = true,
}: {
  acao: AcaoPronta;
  principal: boolean;
  interativo?: boolean;
}) {
  const base =
    "flex h-13 w-full items-center justify-center gap-2.5 rounded-full px-5 text-[1.02rem] font-semibold";

  const cor = !principal
    ? "border border-borda bg-superficie text-texto"
    : acao.whatsapp
      ? "bg-zap text-white shadow-[0_2px_12px_rgba(14,122,85,0.28)] hover:bg-zap-forte"
      : "bg-destaque text-white shadow-[0_2px_12px_rgba(164,69,42,0.26)]";

  const miolo = (
    <>
      {acao.whatsapp ? (
        <IconeWhatsapp className="h-5.5 w-5.5" />
      ) : (
        <IconeDoLink icone={acao.icone} className="h-5 w-5" />
      )}
      {acao.rotulo}
    </>
  );

  if (!interativo) {
    return (
      <span className={`${base} ${cor}`} aria-hidden>
        {miolo}
      </span>
    );
  }

  return (
    <a
      href={acao.href}
      target={acao.href.startsWith("tel:") ? undefined : "_blank"}
      rel="noopener noreferrer"
      data-evento={acao.evento}
      className={`${base} ${cor} transition-colors`}
    >
      {miolo}
      <span className="sr-only">, abre em outra aba</span>
    </a>
  );
}

export function BarraAcoes({ negocio }: { negocio: Negocio }) {
  const acoes = acoesDoRodape(negocio);
  if (acoes.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-fundo/92 backdrop-blur-sm">
      <div
        className="mx-auto flex w-full max-w-[34rem] flex-col gap-2 px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {acoes.map((a, i) => (
          <BotaoAcao key={a.rotulo} acao={a} principal={i === 0} />
        ))}
      </div>
    </div>
  );
}
