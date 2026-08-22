"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * O que a pessoa digitou continua na tela quando o servidor recusa a gravação.
 *
 * **Isto conserta a pior falha que um formulário pode ter, e ela era real.** A
 * dona do produto preencheu a tela de negócio inteira, salvou, o servidor
 * recusou um campo, e a tela voltou com tudo em branco. O caminho é o mesmo em
 * toda tela do painel: a Server Action confere, chama `redirect` para
 * `?erro=<motivo>`, e a página é montada de novo lendo do banco pelo `doDono`.
 * O que ainda não tinha chegado ao banco nunca existiu para quem montou a tela.
 * O React 19 fecha a conta: ele limpa os campos de um `<form action={...}>`
 * assim que a ação termina, então nem o valor que estava no DOM sobrevive.
 *
 * **Por que um rascunho no navegador, e não `useActionState`.**
 *
 * `useActionState` é o caminho que o React desenhou para isto, e num projeto
 * novo seria ele. Aqui ele custa caro pelo que entrega: cada ação passaria a
 * receber `(estadoAnterior, formData)` e a devolver estado em vez de redirecionar,
 * cada `<form>` das sete telas viraria componente de navegador, e a convenção de
 * `?erro=` que o `Aviso` lê teria que ser refeita junto. São sete telas e quatro
 * arquivos de ação para consertar um defeito que é de todas elas ao mesmo tempo,
 * e a pessoa está perdendo texto hoje.
 *
 * Campo por campo na URL, que é como `/criar` resolve, funciona lá porque lá
 * são dois campos. A tela de negócio tem catorze, o catálogo tem quatro por
 * item vezes quantos itens existirem, e endereço de navegador tem teto.
 *
 * A objeção honesta ao rascunho é que ele mora num aparelho só. Ela não alcança
 * este uso: **o rascunho aqui vive um envio.** Ele é escrito no toque do botão e
 * lido na resposta daquele mesmo toque, na mesma aba, segundos depois, e é
 * apagado no instante em que é lido. Nunca existe uma janela em que outro
 * aparelho pudesse enxergá-lo, porque ele não é um recurso de rascunho: é o
 * corpo do envio sobrevivendo a um redirecionamento que o servidor escolheu.
 *
 * Quatro guardas mantêm isso verdadeiro:
 *
 * 1. Escreve só no envio de um formulário.
 * 2. Devolve só quando a resposta traz `?erro=`, que é a recusa. Volta com
 *    `?salvo=1` apaga, porque ali o banco já tem o que vale.
 * 3. Devolve só na mesma tela em que foi escrito.
 * 4. Vence em dois minutos, para uma aba esquecida aberta ontem chegar limpa.
 * 5. Devolve só a campo que continua exatamente como o servidor o desenhou, o
 *    que deixa passar na frente qualquer correção que a pessoa já tenha
 *    começado a digitar. Ver `intocado` abaixo.
 *
 * Mora aqui, no layout, e não em cada tela, porque o defeito é do caminho e não
 * de nenhuma tela: qualquer formulário do painel, inclusive os que ainda vão
 * existir, entra coberto.
 */

const CHAVE = "entrais:digitado";
const VALIDADE_MS = 2 * 60 * 1000;

type Campo = { nome: string; valor: string; marcado: boolean | null };
type Rascunho = { caminho: string; quando: number; campos: Campo[] };

/** Campo de arquivo fica de fora: arquivo escolhido não atravessa recarga. */
function preservavel(elemento: Element): elemento is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  if (
    !(elemento instanceof HTMLInputElement) &&
    !(elemento instanceof HTMLSelectElement) &&
    !(elemento instanceof HTMLTextAreaElement)
  ) {
    return false;
  }
  if (elemento.name === "") return false;
  return !(elemento instanceof HTMLInputElement && elemento.type === "file");
}

function ehMarcavel(elemento: HTMLElement): elemento is HTMLInputElement {
  return (
    elemento instanceof HTMLInputElement &&
    (elemento.type === "checkbox" || elemento.type === "radio")
  );
}

function guardar(formulario: HTMLFormElement, caminho: string) {
  const campos: Campo[] = [];

  for (const elemento of Array.from(formulario.elements)) {
    if (!preservavel(elemento)) continue;
    campos.push({
      nome: elemento.name,
      valor: elemento.value,
      marcado: ehMarcavel(elemento) ? elemento.checked : null,
    });
  }

  if (campos.length === 0) return;

  const rascunho: Rascunho = { caminho, quando: Date.now(), campos };
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(rascunho));
  } catch {
    // Aba anônima com armazenamento fechado, ou cota cheia. A tela segue como
    // seguia antes, e o único preço é a recusa voltar com os campos do banco.
  }
}

function pegar(): Rascunho | null {
  try {
    const cru = sessionStorage.getItem(CHAVE);
    if (cru === null) return null;
    const lido = JSON.parse(cru) as Rascunho;
    return Array.isArray(lido?.campos) ? lido : null;
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

/**
 * Se o campo ainda está exatamente como o servidor o desenhou.
 *
 * **É esta pergunta que impede a devolução de passar por cima do dedo.** A
 * devolução acontece um quadro depois da tela chegar, e nesse quadro a pessoa
 * pode já ter começado a corrigir justamente o campo que o servidor recusou.
 * Devolver ali seria trocar o que ela acabou de escrever pelo que ela escreveu
 * antes, que é o mesmo defeito de novo, só que ao contrário.
 *
 * O HTML já responde isso de graça: `defaultValue` e `defaultChecked` são os
 * atributos que vieram no HTML do servidor, e `value` e `checked` são o estado
 * de agora. Iguais significa que ninguém tocou desde que a tela chegou, e é aí,
 * e só aí, que a devolução entra.
 */
function intocado(
  campo: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) {
  if (ehMarcavel(campo)) return campo.checked === campo.defaultChecked;
  if (campo instanceof HTMLSelectElement) {
    const escolhida = campo.selectedOptions[0];
    return escolhida === undefined || escolhida.defaultSelected;
  }
  return campo.value === campo.defaultValue;
}

/**
 * Devolve os valores aos campos que ainda existem na tela e continuam intocados.
 *
 * Anda pelos campos na ordem em que foram gravados e conta quantas vezes cada
 * nome já apareceu, que é o que mantém certo um grupo de rádios ou de caixas com
 * o mesmo nome. Campo que sumiu da tela é pulado em silêncio: a lista do
 * catálogo pode ter menos linhas do que tinha no envio.
 *
 * O `input` e o `change` saem depois de cada escrita porque escrever `value` por
 * código não avisa ninguém, e um campo que reagisse ao que foi digitado ficaria
 * mostrando o estado de antes.
 */
function devolver(campos: Campo[]) {
  const vistos = new Map<string, number>();
  let devolvidos = 0;

  for (const campo of campos) {
    const posicao = vistos.get(campo.nome) ?? 0;
    vistos.set(campo.nome, posicao + 1);

    const iguais = document.getElementsByName(campo.nome);
    const alvo = iguais[posicao];
    if (!(alvo instanceof HTMLElement) || !preservavel(alvo)) continue;
    if (!intocado(alvo)) continue;

    if (campo.marcado !== null && ehMarcavel(alvo)) {
      if (alvo.checked === campo.marcado) continue;
      alvo.checked = campo.marcado;
    } else {
      if (alvo.value === campo.valor) continue;
      alvo.value = campo.valor;
    }

    devolvidos++;
    alvo.dispatchEvent(new Event("input", { bubbles: true }));
    alvo.dispatchEvent(new Event("change", { bubbles: true }));
  }

  return devolvidos;
}

export function PreservarDigitado() {
  const caminho = usePathname();
  const busca = useSearchParams();
  const caminhoAgora = useRef(caminho);
  caminhoAgora.current = caminho;

  // Guarda no envio, de qualquer formulário do painel.
  useEffect(() => {
    function aoEnviar(evento: SubmitEvent) {
      const alvo = evento.target;
      if (alvo instanceof HTMLFormElement) guardar(alvo, caminhoAgora.current);
    }

    // Na fase de captura: assim a leitura acontece antes de qualquer coisa
    // mexer no formulário, inclusive a limpeza que o React faz depois.
    document.addEventListener("submit", aoEnviar, true);
    return () => document.removeEventListener("submit", aoEnviar, true);
  }, []);

  // Devolve na volta com recusa, e limpa em qualquer outra volta.
  useEffect(() => {
    const rascunho = pegar();
    if (rascunho === null) return;

    const recusa = busca.get("erro") !== null;
    const mesmaTela = rascunho.caminho === caminho;
    const novo = Date.now() - rascunho.quando < VALIDADE_MS;

    if (!recusa || !mesmaTela || !novo) {
      apagar();
      return;
    }

    /*
     * Num quadro seguinte, e não neste. O React limpa os campos do formulário
     * quando a ação termina, e essa limpeza pode cair depois deste efeito:
     * devolver antes dela seria devolver para o vazio. Um quadro é o suficiente
     * e é curto demais para alguém enxergar os campos piscarem.
     */
    const quadro = requestAnimationFrame(() => {
      devolver(rascunho.campos);
      apagar();
    });
    return () => cancelAnimationFrame(quadro);
  }, [caminho, busca]);

  return null;
}
