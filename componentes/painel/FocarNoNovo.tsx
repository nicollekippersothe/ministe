"use client";

import { useEffect } from "react";

/**
 * Leva a tela e o cursor até a linha que acabou de nascer.
 *
 * **Existe porque a âncora sozinha chega tarde e chega errada.** A ação de
 * acrescentar termina em `redirect` com `#item-7`, e quem navega é o roteador do
 * Next: ele troca o corpo da página e depois procura a âncora. Nas listas
 * longas do painel a rolagem caía a meia tela do alvo, e no celular ela parava
 * com a linha nova escondida atrás da barra de Salvar. Pior: o cursor ficava no
 * `body`, então a pessoa via a linha nova e ainda precisava mirar o dedo num
 * campo para começar a escrever a descrição, que é justamente o que ela veio
 * fazer.
 *
 * Então esta camada faz as duas coisas depois de a tela existir: rola até o
 * cartão respeitando a margem de rolagem dele, e põe o cursor no primeiro campo
 * que ainda está em branco. `preventScroll` no foco porque o navegador rolaria
 * de novo, por conta dele, desmanchando o enquadramento de uma linha acima.
 *
 * Roda uma vez por linha nova: a chave é o id do cartão, e ele muda a cada
 * acrescentar. Salvar em seguida devolve a pessoa para o mesmo cartão sem
 * mexer no cursor, porque aí ela já está escrevendo.
 */
export function FocarNoNovo({
  cartao,
  campo,
}: {
  /** O id do `fieldset` da linha: "item-7". */
  cartao: string;
  /** O id do campo que recebe o cursor. Sem ele, só a rolagem acontece. */
  campo?: string;
}) {
  useEffect(() => {
    document.getElementById(cartao)?.scrollIntoView({ block: "start" });
    if (campo === undefined) return;
    const alvo = document.getElementById(campo);
    if (alvo instanceof HTMLElement) alvo.focus({ preventScroll: true });
  }, [cartao, campo]);

  return null;
}
