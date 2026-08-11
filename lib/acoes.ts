// A extensão explícita permite que o teste rode direto no Node, que não
// resolve extensão sozinho. O Next aceita das duas formas.
import { linkWhatsapp } from "./formato.ts";
import type { Acao, Negocio } from "./tipos";

/**
 * Resolve as ações do rodapé fixo.
 *
 * O WhatsApp continua sendo o caminho mais comum, mas deixou de ser o único:
 * quem vende no iFood, quem trabalha com agenda e quem vende por link de
 * afiliado precisa que o botão principal aponte para lá.
 */
export type AcaoPronta = {
  rotulo: string;
  href: string;
  icone: Acao["icone"];
  /** Só o WhatsApp usa o verde. O resto usa a cor da marca. */
  whatsapp: boolean;
  evento: "clique_whatsapp" | "clique_acao";
};

function whatsappPadrao(negocio: Negocio): Acao | null {
  if (!negocio.whatsapp) return null;
  return {
    tipo: "whatsapp",
    rotulo: "Chamar no WhatsApp",
    url: null,
    icone: "link",
  };
}

function montar(negocio: Negocio, acao: Acao | null): AcaoPronta | null {
  if (!acao) return null;

  if (acao.tipo === "whatsapp") {
    if (!negocio.whatsapp) return null;
    return {
      rotulo: acao.rotulo || "Chamar no WhatsApp",
      href: linkWhatsapp(negocio.whatsapp, negocio.mensagemPadrao),
      icone: "link",
      whatsapp: true,
      evento: "clique_whatsapp",
    };
  }

  if (acao.tipo === "telefone") {
    const numero = negocio.telefone ?? negocio.whatsapp;
    if (!numero) return null;
    return {
      rotulo: acao.rotulo || "Ligar",
      href: `tel:+${numero}`,
      icone: "telefone",
      whatsapp: false,
      evento: "clique_acao",
    };
  }

  if (!acao.url) return null;
  return {
    rotulo: acao.rotulo,
    href: acao.url,
    icone: acao.icone,
    whatsapp: false,
    evento: "clique_acao",
  };
}

/** Até duas, na ordem em que aparecem. Vazio significa rodapé sem barra. */
export function acoesDoRodape(negocio: Negocio): AcaoPronta[] {
  const principal = montar(
    negocio,
    negocio.acaoPrincipal ?? whatsappPadrao(negocio),
  );
  const secundaria = montar(negocio, negocio.acaoSecundaria);
  return [principal, secundaria].filter((a): a is AcaoPronta => a !== null);
}
