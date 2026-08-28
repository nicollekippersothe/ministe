import Link from "next/link";
import {
  MOTIVOS_DADOS,
  SAIDA_DA_RECUSA,
  ehRecusaDados,
} from "@/lib/dados/erros";
import { MOTIVOS_LINK, type RecusaLink } from "@/lib/links";
import { MOTIVOS as MOTIVOS_SLUG, type Recusa as RecusaSlug } from "@/lib/slug";

/**
 * As frases de campo recusado, escritas uma vez.
 *
 * Exportadas porque a tela de catálogo mostra a recusa dentro do item que a
 * causou, em vez de no alto, e precisa da mesma frase. Duas cópias do mesmo
 * texto na mesma tela é como uma delas envelhece sem ninguém ver.
 */
export const MENSAGENS: Record<string, string> = {
  nome: "Escreva o nome do negócio para salvar.",
  titulo: "Escreva o nome do item para salvar. Ele é o que aparece na página.",
  preco: "Confira o preço. Escreva só o número, por exemplo 74,90.",
  rotulo: "Escreva o texto do link para salvar. Ele é o que aparece no botão.",
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

type Recado = { texto: string; saida?: { rotulo: string; href: string } };

/**
 * Três origens de recado, na ordem em que são olhadas.
 *
 * 1. O link recusado pelo portão de lib/links.ts, no formato "campo_motivo".
 * 2. O que a própria ação conferiu antes de falar com o banco, aqui em cima.
 * 3. A recusa do banco, traduzida em lib/dados/erros.ts. É a que carrega uma
 *    saída junto: o limite do plano gratuito é o melhor momento de venda que o
 *    produto tem, então a frase dele termina num link para a tela do plano.
 *
 * Recado desconhecido cai no guarda-chuva do mesmo registro, e nunca em texto
 * escrito aqui: frase de tela mora junto da regra que a levanta.
 */
function recado(erro: string): Recado {
  /*
   * O link da página recusado vira "slug_<motivo>", e o motivo vem de
   * lib/slug.ts, o mesmo lugar que o cadastro usa: a regra e a frase moram
   * juntas, então mudar uma sem a outra fica impossível.
   */
  if (erro.startsWith("slug_")) {
    const motivo = MOTIVOS_SLUG[erro.slice(5) as RecusaSlug];
    if (motivo) return { texto: `O link da sua página: ${motivo}` };
  }

  const corte = erro.indexOf("_");
  if (corte > 0) {
    const campo = CAMPOS_DE_LINK[erro.slice(0, corte)];
    const motivo = MOTIVOS_LINK[erro.slice(corte + 1) as RecusaLink];
    if (campo && motivo) return { texto: `Confira ${campo}: ${motivo}.` };
  }

  const conferido = MENSAGENS[erro];
  if (conferido) return { texto: conferido };

  if (ehRecusaDados(erro)) {
    return { texto: MOTIVOS_DADOS[erro], saida: SAIDA_DA_RECUSA[erro] };
  }

  return { texto: MOTIVOS_DADOS.escrita_recusada };
}

export function Aviso({
  salvo,
  copiado,
  erro,
  mensagem,
}: {
  salvo?: boolean;
  copiado?: boolean;
  erro?: string;
  /**
   * O recado de sucesso desta tela, quando "Alterações salvas" fica curto
   * demais. As listas do painel salvam de cinco jeitos diferentes (acrescentar,
   * mover, remover), e dizer qual deles aconteceu é o que confirma o toque para
   * quem usa leitor de tela e para quem tocou no botão errado.
   */
  mensagem?: string;
}) {
  if (erro) {
    const { texto, saida } = recado(erro);
    return (
      <p
        role="alert"
        className="mt-4 rounded-xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm text-destaque"
      >
        {texto}
        {saida ? (
          <>
            {" "}
            <Link
              href={saida.href}
              className="font-semibold underline underline-offset-2"
            >
              {saida.rotulo}
            </Link>
          </>
        ) : null}
      </p>
    );
  }

  if (salvo || copiado) {
    return (
      <p
        role="status"
        className="mt-4 rounded-xl bg-aberto-fundo px-4 py-3 text-sm font-medium text-aberto-texto"
      >
        {copiado
          ? "Horário copiado para terça a sexta."
          : (mensagem ?? "Alterações salvas.")}
      </p>
    );
  }

  return null;
}
