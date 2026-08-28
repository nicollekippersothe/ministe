/**
 * A sua página de verdade, ao lado do formulário, no computador.
 *
 * **É a resposta ao "formato de painel, aproveitar os espaços" e ao "a
 * minivisualização não traz todas as infos".** O desenho abstrato do
 * `MapaDaPagina` respondia "onde" cada coisa cai, mas não mostrava o conteúdo.
 * Aqui a pessoa vê a página real tomando forma enquanto edita, e o vazio da
 * direita do monitor vira a própria página.
 *
 * **Por que um iframe, e não a `PaginaPublica` embutida direto.** As regras
 * `lg:` da página pública olham a janela, e não a caixa em que ela cai (está
 * escrito em app/painel/previa/page.tsx). Embutida num painel estreito, ela
 * montaria o desenho de monitor dentro de trezentos pixels, com foto cortada e
 * texto de duas palavras por linha. O iframe tem janela própria: a página
 * enxerga a largura dele, estreita, e monta o desenho de celular, que é o certo
 * para uma prévia ao lado do formulário. É o mesmo caminho que Carrd e Framer
 * usam para a prévia do editor.
 *
 * A moldura de celular deixa claro que aquilo é a página, e não mais um painel.
 * A prévia recarrega a cada `chave` nova: quando o formulário salva, a tela do
 * painel remonta com dados novos, a `chave` muda, e o iframe busca a página
 * atualizada. Não é ao vivo a cada tecla, é ao vivo a cada Salvar, que é o
 * momento em que o dado de verdade muda.
 */
export function PreviaAoVivo({ chave }: { chave: string }) {
  return (
    <div className="hidden lg:sticky lg:top-8 lg:block">
      <p className="mb-3 text-xs font-medium text-suave">A sua página agora</p>
      {/*
        A moldura de celular. A largura de 320 é a de um celular pequeno, que é
        onde a maioria abre a página, e cabe na coluna da direita sem apertar o
        formulário. O `overflow-hidden` mais o raio recortam o iframe no formato
        do aparelho.
      */}
      <div className="mx-auto w-[320px] max-w-full overflow-hidden rounded-[2rem] border-[6px] border-texto/85 bg-fundo shadow-xl">
        <iframe
          key={chave}
          src="/painel/previa?nua=1"
          title="Prévia da sua página"
          loading="lazy"
          className="h-[640px] w-full border-0"
        />
      </div>
    </div>
  );
}
