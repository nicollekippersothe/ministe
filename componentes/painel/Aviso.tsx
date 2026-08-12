import { MOTIVOS_LINK, type RecusaLink } from "@/lib/links";

const MENSAGENS: Record<string, string> = {
  nome: "O nome do negócio não pode ficar em branco.",
  whatsapp: "Confira o WhatsApp. Informe o DDD e o número completo.",
  estado: "O estado é a sigla de duas letras, por exemplo SP.",
  cep: "O CEP tem oito dígitos, por exemplo 04113-000.",
};

/**
 * Link recusado vira "campo_motivo", e o motivo vem de lib/links.ts. Assim a
 * regra e a explicação ficam no mesmo lugar: mudar uma sem a outra é como um
 * campo passa a recusar sem dizer por quê.
 */
const CAMPOS_DE_LINK: Record<string, string> = {
  link: "o endereço do link",
  mapa: "o link do mapa",
};

function mensagem(erro: string): string {
  const corte = erro.indexOf("_");
  if (corte > 0) {
    const campo = CAMPOS_DE_LINK[erro.slice(0, corte)];
    const motivo = MOTIVOS_LINK[erro.slice(corte + 1) as RecusaLink];
    if (campo && motivo) return `Confira ${campo}: ${motivo}.`;
  }
  return MENSAGENS[erro] ?? "Não deu para salvar. Confira os campos.";
}

export function Aviso({
  salvo,
  copiado,
  erro,
}: {
  salvo?: boolean;
  copiado?: boolean;
  erro?: string;
}) {
  if (erro) {
    return (
      <p
        role="alert"
        className="mt-4 rounded-xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm text-destaque"
      >
        {mensagem(erro)}
      </p>
    );
  }

  if (salvo || copiado) {
    return (
      <p
        role="status"
        className="mt-4 rounded-xl bg-aberto-fundo px-4 py-3 text-sm font-medium text-aberto-texto"
      >
        {copiado ? "Horário copiado para terça a sexta." : "Alterações salvas."}
      </p>
    );
  }

  return null;
}
