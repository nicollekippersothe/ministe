import { acoesDoRodape } from "@/lib/acoes";
import type { Negocio } from "@/lib/tipos";

/**
 * Quando a página tem o suficiente para valer a visita de alguém.
 *
 * Existe por causa de um relato de uso: quem acabava de criar a página caía no
 * painel e a primeira coisa oferecida era ver a prévia e publicar, com a página
 * ainda em branco. Quem aceitava a oferta punha no ar um endereço que dizia só
 * o nome do negócio, e quem recusava saía com a impressão de estar atrasada em
 * alguma coisa. Publicar é uma decisão que só faz sentido depois que existe
 * página, então o painel precisa saber dizer quando é depois.
 *
 * **O critério é o de quem visita, e não a contagem de campos preenchidos.**
 * Uma pessoa que abre o endereço quer três respostas, e a página está pronta
 * quando ela dá as três:
 *
 * 1. De quem é: o `nome`.
 * 2. Como falar: alguma ação no rodapé. Quem responde é `acoesDoRodape`, o
 *    mesmo resolvedor que monta o rodapé da página pública. Perguntar pelo
 *    campo do WhatsApp cru cobraria WhatsApp de quem atende por iFood, agenda
 *    ou telefone, e a resposta certa para essa gente já está no botão que ela
 *    escolheu.
 * 3. O que ela faz: a frase, ou pelo menos um item aparecendo no catálogo.
 *
 * **O que fica de fora, e por quê.** Horário, foto, tema, links extras e
 * endereço são ótimos de ter e ruins de exigir: quem atende com hora marcada
 * nunca vai preencher a semana inteira, quem trabalha em casa guarda o
 * endereço de propósito, e uma lista que jamais fecha ensina a pessoa a
 * ignorar a lista. Três itens, todos alcançáveis numa tela só.
 */
export type Passo = {
  /** Verbo, para o botão: "Informar o WhatsApp". */
  rotulo: string;
  /** Substantivo, para a frase que junta os passos: "o WhatsApp". */
  nome: string;
  href: string;
};

export function passosParaOAr(negocio: Negocio): Passo[] {
  const passos: Passo[] = [];

  if (negocio.nome.trim() === "") {
    passos.push({
      rotulo: "Escrever o nome do negócio",
      nome: "o nome do negócio",
      href: "/painel/negocio",
    });
  }

  if (acoesDoRodape(negocio).length === 0) {
    passos.push({
      rotulo: "Informar o WhatsApp",
      nome: "o WhatsApp",
      href: "/painel/negocio",
    });
  }

  /*
   * A frase e o catálogo respondem à mesma pergunta, então qualquer um dos dois
   * fecha o passo. O convite nomeia a frase porque ela custa uma linha de
   * texto, e o catálogo continua na lista de seções para quem preferir começar
   * pelo que vende.
   */
  const dizOQueFaz =
    (negocio.frase ?? "").trim() !== "" || negocio.itens.some((i) => i.ativo);

  if (!dizOQueFaz) {
    passos.push({
      rotulo: "Escrever uma frase curta",
      nome: "uma frase curta",
      href: "/painel/negocio",
    });
  }

  return passos;
}

/**
 * Os nomes dos passos numa frase: "o WhatsApp e uma frase curta".
 *
 * Vírgula entre os primeiros e "e" antes do último, que é como se lê em voz
 * alta. Com um passo só devolve o nome dele, e a frase de fora continua
 * inteira.
 */
export function nomesDosPassos(passos: Passo[]): string {
  const nomes = passos.map((p) => p.nome);
  if (nomes.length < 2) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
