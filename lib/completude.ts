import { acoesDoRodape } from "./acoes.ts";
import type { Negocio } from "./tipos.ts";

/**
 * O quanto a página já está pronta, em peças que a pessoa reconhece.
 *
 * **Existe por causa de um relato de uso da dona do produto.** Quem já
 * preencheu tudo raramente volta para editar, e quem ainda não preencheu abre o
 * painel e vê um formulário grande sem saber o que falta. As duas pessoas
 * recebiam a mesma tela cheia de campos, e o resultado era o "fica muito solto":
 * o painel não dizia a ninguém o que fazer agora. O medidor dá a ele um trabalho
 * (chegar a 100%) e dá à pessoa uma resposta (o que falta).
 *
 * **A regra que decide tudo: 100% precisa ser alcançável.** O `prontidao.ts` já
 * tinha escrito o porquê, e ele vale em dobro aqui: uma lista que jamais fecha
 * ensina a pessoa a ignorar a lista. Então o medidor conta só peças que qualquer
 * profissional autônoma consegue ter, e nunca as que travam. Horário fica de
 * fora, porque quem atende com hora marcada não preenche a semana inteira.
 * Endereço fica de fora, porque quem trabalha em casa o guarda de propósito.
 * Capa sozinha, links e galeria ficam de fora, porque são bons de ter e ruins de
 * cobrar. O que sobra são cinco peças que, juntas, fazem uma página que a pessoa
 * mostraria para alguém.
 *
 * As leis de UX que este arquivo encarna, e o `Medidor` desenha:
 *
 * - **Zeigarnik**: tarefa inacabada incomoda. Mostrar o que falta faz a mente
 *   querer fechar, e por isso a peça que falta vira o texto, não a que já foi.
 * - **Goal-Gradient**: a vontade cresce perto da meta, então a contagem é
 *   "faltam 2", e não "3 de 5".
 * - **Pareto**: as três primeiras peças são o mínimo que põe a página no ar
 *   (as mesmas de `passosParaOAr`), e as duas últimas são o acabamento. O peso
 *   está certo por construção: quem faz as três essenciais já passou de 60%.
 * - **Von Restorff**: só a próxima peça a fazer recebe destaque, o resto é
 *   estado calmo. É o `proxima` daqui.
 */

export type PecaChave =
  | "nome"
  | "falar"
  | "frase"
  | "imagem"
  | "catalogo";

export type Peca = {
  chave: PecaChave;
  feito: boolean;
  /** O nome curto da peça, para a linha da lista: "Uma foto". */
  titulo: string;
  /** O verbo, para quando ela é a próxima a fazer: "Escolher uma foto". */
  convite: string;
  /** Onde ela se resolve, com âncora no campo. */
  href: string;
};

export type Completude = {
  pecas: Peca[];
  /** As que ainda faltam, na ordem da lista. */
  faltando: Peca[];
  feitas: number;
  total: number;
  /** Inteiro de 0 a 100. */
  pct: number;
  /** A próxima peça a fazer, ou nulo quando está tudo pronto. */
  proxima: Peca | null;
  completo: boolean;
};

/**
 * As cinco peças, na ordem em que a página as pede.
 *
 * A ordem é a de `passosParaOAr` primeiro (nome, falar, o que faz), e o
 * acabamento depois (imagem, catálogo). Assim a próxima peça destacada é sempre
 * a mais barata que ainda importa, que é o caminho de menor atrito para o ar.
 */
export function completudeDe(negocio: Negocio): Completude {
  const temImagem = negocio.logo !== null || negocio.capa !== null;
  const temItem = negocio.itens.some((i) => i.ativo);
  const podeFalar = acoesDoRodape(negocio).length > 0;

  const pecas: Peca[] = [
    {
      chave: "nome",
      feito: negocio.nome.trim() !== "",
      titulo: "O nome",
      convite: "Escrever o nome",
      href: "/painel/negocio#nome",
    },
    {
      chave: "falar",
      feito: podeFalar,
      titulo: "O botão de falar",
      convite: "Informar o WhatsApp",
      href: "/painel/negocio#whatsapp",
    },
    {
      chave: "frase",
      feito: (negocio.frase ?? "").trim() !== "",
      titulo: "Uma frase curta",
      convite: "Escrever uma frase curta",
      href: "/painel/negocio#frase",
    },
    {
      chave: "imagem",
      feito: temImagem,
      titulo: "Uma foto",
      convite: "Escolher uma foto",
      href: "/painel/negocio#imagens",
    },
    {
      chave: "catalogo",
      feito: temItem,
      titulo: "Um item no catálogo",
      convite: "Acrescentar o primeiro item",
      href: "/painel/catalogo",
    },
  ];

  const faltando = pecas.filter((p) => !p.feito);
  const feitas = pecas.length - faltando.length;
  const total = pecas.length;
  const pct = Math.round((feitas / total) * 100);

  return {
    pecas,
    faltando,
    feitas,
    total,
    pct,
    proxima: faltando[0] ?? null,
    completo: faltando.length === 0,
  };
}
