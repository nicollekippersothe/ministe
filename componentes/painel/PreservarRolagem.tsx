"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * A pessoa continua onde estava quando o Salvar responde.
 *
 * **Existe porque a confirmação e o botão que a produz estavam em pontas
 * opostas da tela.** Medido no monitor de 1440, em `/painel/negocio`: o botão
 * mora a 2390 pixels do topo numa página de 2482, a pessoa toca nele com a
 * rolagem em 1582, e a resposta chegava com a rolagem em 0 e a frase de
 * confirmação a 146. Dois mil e duzentos pixels entre a causa e o efeito, e no
 * celular a queda é maior porque a página é mais alta. A dona do produto
 * descreveu isso com as palavras dela: "quando salvo, o alterações salvas
 * aparece só lá em cima".
 *
 * A confirmação passou a sair dentro da `BarraSalvar`, encostada no botão. Esta
 * peça fecha a outra metade: a rolagem volta para onde estava no toque, então a
 * pessoa lê a resposta sem sair do lugar onde fez a pergunta.
 *
 * **Por que uma marca no navegador, e não `scroll: false` na navegação.** Quem
 * navega aqui é o `redirect` da Server Action, e ele não tem essa chave: o
 * roteador troca o corpo da página e leva a rolagem para o topo, por conta
 * dele. O caminho é o mesmo que `app/painel/PreservarDigitado.tsx` já percorreu
 * para o texto digitado, com as mesmas guardas, e por isso a marca daqui tem a
 * mesma forma: escrita no envio, lida na resposta daquele mesmo envio, na mesma
 * aba e no mesmo caminho, e apagada no instante em que é lida.
 *
 * Três guardas mantêm isso verdadeiro:
 *
 * 1. Escreve só no envio de um formulário.
 * 2. Devolve só na tela que o `devolver` acender, que é a que está mostrando a
 *    confirmação junto do botão. Numa volta com recusa a rolagem continua indo
 *    para o topo, de propósito: lá é onde a frase de recusa aparece.
 * 3. Devolve só no mesmo caminho e dentro de meio minuto, para uma aba
 *    esquecida aberta ontem chegar limpa.
 */

const CHAVE = "entrais:rolagem";
const VALIDADE_MS = 30 * 1000;

type Marca = { caminho: string; quando: number; y: number };

function guardar(caminho: string) {
  const marca: Marca = { caminho, quando: Date.now(), y: window.scrollY };
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(marca));
  } catch {
    // Aba anônima com armazenamento fechado, ou cota cheia. A tela segue como
    // seguia antes, e o único preço é a rolagem voltar ao topo.
  }
}

function pegar(): Marca | null {
  try {
    const cru = sessionStorage.getItem(CHAVE);
    if (cru === null) return null;
    const lida = JSON.parse(cru) as Marca;
    return typeof lida?.y === "number" ? lida : null;
  } catch {
    return null;
  }
}

function apagar() {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {
    // Sem armazenamento não há o que apagar.
  }
}

export function PreservarRolagem({
  /** Liga a devolução: a tela de agora está mostrando a confirmação no botão. */
  devolver,
}: {
  devolver: boolean;
}) {
  const caminho = usePathname();
  const caminhoAgora = useRef(caminho);
  caminhoAgora.current = caminho;

  // Guarda no envio, de qualquer formulário da tela.
  useEffect(() => {
    function aoEnviar() {
      guardar(caminhoAgora.current);
    }

    // Na fase de captura, pelo mesmo motivo do PreservarDigitado: a leitura
    // acontece antes de qualquer coisa mexer na página.
    document.addEventListener("submit", aoEnviar, true);
    return () => document.removeEventListener("submit", aoEnviar, true);
  }, []);

  /*
   * Sem lista de dependências, de propósito.
   *
   * A volta do Salvar costuma cair no mesmo endereço de onde saiu
   * (`?salvo=1` sobre `?salvo=1`, quando se salva duas vezes seguidas), e aí
   * caminho e busca continuam idênticos: um efeito preso a eles rodaria na
   * primeira gravação e ficaria mudo na segunda. O que muda em toda resposta é
   * a montagem em si, e é nela que este efeito se pendura.
   *
   * O que torna isso seguro é a saída de cima: com a página já na altura da
   * marca, o efeito devolve o controle sem tocar em nada e sem apagar a marca.
   * É o que acontece no quadro entre o toque no botão e a chegada da resposta,
   * onde a rolagem ainda é a mesma e a marca ainda vai ser usada.
   */
  useEffect(() => {
    if (!devolver) return;

    const marca = pegar();
    if (marca === null) return;

    if (marca.caminho !== caminho || Date.now() - marca.quando > VALIDADE_MS) {
      apagar();
      return;
    }

    if (Math.abs(window.scrollY - marca.y) < 2) return;

    apagar();
    /*
     * Num quadro seguinte, e não neste. Quem leva a rolagem para o topo é o
     * roteador do Next, na troca do corpo da página, e essa troca pode cair
     * depois deste efeito: devolver antes dela seria devolver para o topo do
     * mesmo jeito.
     *
     * **E sem cancelar o quadro na limpeza, que é onde isto quebrou uma vez.**
     * Um efeito sem lista de dependências tem a limpeza rodando antes da
     * próxima passada, e em desenvolvimento o React monta, limpa e monta de
     * novo para expor efeito mal escrito. Com `cancelAnimationFrame` no
     * caminho, essa segunda passada matava o quadro agendado pela primeira, e a
     * marca já tinha sido consumida: medido no navegador, a rolagem ficava em 0
     * e nenhum `scrollTo` chegava a acontecer. Quem faz as vezes da limpeza é a
     * conferência do caminho aqui dentro, que é a pergunta que importava.
     */
    requestAnimationFrame(() => {
      if (window.location.pathname !== marca.caminho) return;
      window.scrollTo({ top: marca.y });
    });
  });

  return null;
}
