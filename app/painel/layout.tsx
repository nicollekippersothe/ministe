import { Suspense } from "react";
import type { Metadata } from "next";
import { PreservarDigitado } from "./PreservarDigitado";
import { Navegacao } from "@/componentes/painel/Navegacao";
import { Marca } from "@/componentes/Marca";
import { combinacao } from "@/lib/fontes";
import { doDono } from "@/lib/dados";
import { contaProvisoria } from "@/lib/supabase/servidor";

export const metadata: Metadata = {
  title: "Painel",
  // O painel nunca deve aparecer em busca.
  robots: { index: false, follow: false },
};

/**
 * Duas formas, mesmo conteúdo.
 *
 * No celular é uma coluna só, e a navegação mora dentro de /painel: a pessoa
 * entra numa seção, edita, volta. No computador a navegação vira a coluna da
 * esquerda, fixa, e o vaivém desaparece: dá para ir de Horários direto para
 * Links e botões, com o selo de No ar sempre à vista.
 *
 * A coluna some abaixo de lg em vez de encolher, porque no celular ela seria a
 * mesma lista duas vezes na mesma tela.
 */
export default async function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  // As duas juntas: nenhuma depende da outra, e cada uma é uma ida ao banco.
  const [negocio, provisoria] = await Promise.all([doDono(), contaProvisoria()]);

  /*
   * A marca entra no painel pela letra, e este é o único lugar que a liga.
   *
   * O painel usava a letra do aparelho em toda tela, decisão de desempenho que
   * valia zero byte. A auditoria mostrou o preço: a marca vivia na página
   * inicial e na pública e morria na porta do painel, então quem montava a
   * página trocava de identidade ao entrar para editá-la. `combinacao("moderno")`
   * é a mesma letra da tela inicial, a Bricolage do título e a Inter da marca,
   * e defini-la aqui faz `.titulo` e `.marca` do painel inteiro pegarem a face
   * da marca. O corpo do texto continua na letra do aparelho, porque `body` usa
   * `--f-sistema` de propósito: só título e o nome da marca atravessam.
   *
   * `data-tema="areia"` fica: o painel é superfície de trabalho, e o claro é o
   * certo para ela. Os três temas são escolha da página pública, e não daqui.
   */
  const marca = combinacao("moderno");

  return (
    <div
      data-tema="areia"
      data-fonte={marca.chave}
      className={`${marca.classe} min-h-dvh bg-fundo`}
    >
      {/*
        Sem desenho na tela: guarda o que foi digitado no envio e devolve
        quando o servidor recusa. Ver o arquivo dele para o porquê do mecanismo.
        O Suspense é exigência do `useSearchParams`, que ele usa para saber que
        a volta trouxe `?erro=`.
      */}
      <Suspense fallback={null}>
        <PreservarDigitado />
      </Suspense>

      {/*
        Duas formas do mesmo painel, e a diferença é o que resolve o "espaço
        vazio gigantesco" que a dona apontou no computador.

        No celular é uma coluna só, centrada, com a marca no topo: a navegação
        mora dentro de cada tela, e o `max-w-[34rem]` mantém a linha de leitura.

        No computador vira uma casca de aplicativo de verdade: uma barra lateral
        definida à esquerda, com borda e uma superfície própria que desce até o
        fim da tela, e o conteúdo ocupando o resto. Antes a navegação flutuava
        no mesmo creme liso de tudo, sem contorno, então a tela lia como cartões
        soltos num campo vazio enorme. Com a barra desenhada como barra, o vão
        embaixo dela vira "lateral do aplicativo", e a margem do conteúdo vira
        "coluna de leitura", que é como todo painel bem-acabado se apresenta.
      */}
      <div className="lg:flex lg:min-h-dvh">
        {/*
          A barra lateral: só no computador, largura fixa, borda à direita e uma
          superfície levemente distinta do fundo. Ela desce a tela inteira,
          porque é um item flex sem `items-start`, e o miolo dela gruda no topo
          com `sticky`, rolando por dentro quando a navegação passa da altura da
          janela.
        */}
        <aside className="hidden lg:flex lg:w-[17rem] lg:shrink-0 lg:flex-col lg:border-r lg:border-borda lg:bg-superficie/40">
          <div className="sticky top-0 flex max-h-dvh flex-col gap-6 overflow-y-auto px-5 py-6">
            {/* -my-2 devolve o espaço que a altura de alvo toma: o logotipo é
                um link para /painel, então o dedo precisa dos 44 pixels. */}
            <Marca href="/painel" className="-my-2 min-h-11" />
            <Navegacao negocio={negocio} provisoria={provisoria} />
          </div>
        </aside>

        <div className="w-full lg:flex-1 lg:min-w-0">
          {/* A marca no topo só no celular: no computador ela mora na barra. */}
          <div className="mx-auto w-full max-w-[34rem] px-5 pt-5 lg:hidden">
            <Marca href="/painel" className="-my-2 min-h-11" />
          </div>

          {/*
            O conteúdo encosta na barra, e não flutua no meio. `max-w-2xl` é a
            largura em que um formulário se lê sem esticar; encostado na lateral
            com `pl-12`, ele fica ao lado da navegação em vez de deixar um vão
            entre as duas. A folga que sobra fica à direita, e com a barra
            desenhada como barra ela lê como espaço de tela, e não como vazio.
          */}
          <div className="mx-auto w-full max-w-[34rem] px-5 pb-8 lg:mx-0 lg:max-w-5xl lg:px-0 lg:py-8 lg:pl-12 lg:pr-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
