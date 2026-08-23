import type { ReactNode } from "react";

/**
 * Um pedaço da página pública, recortado e posto dentro do painel.
 *
 * Existe porque o painel é uma coluna de campos e a página é outra coisa. Quem
 * escreve "Sessão de 50 minutos" num campo de texto está montando um cartão que
 * ela só vai ver depois de salvar, abrir a prévia e rolar até o catálogo. A
 * distância entre o campo e o resultado é onde mora a dúvida de "será que ficou
 * como eu queria".
 *
 * A regra é a mesma da tela inicial e a mesma de PreviaDaMensagem: o que aparece
 * aqui dentro é o componente de verdade da página pública, com os dados de
 * verdade. Desenho parecido feito à mão diverge da página no primeiro ajuste, e
 * aí a prévia passa a mentir, que é pior do que não existir.
 *
 * `inert` tira o bloco inteiro do Tab e da árvore de acessibilidade. Os cartões
 * do catálogo e os botões do rodapé carregam link de verdade dentro, e um link
 * focável dentro de uma ilustração manda quem navega por teclado para o WhatsApp
 * no meio de um formulário. Quem usa leitor de tela lê e edita nos campos ao
 * lado, que é onde o conteúdo mora.
 */
export function Vitrine({
  chamada,
  estreita = true,
  children,
}: {
  /** A frase que diz de que parte da página é este recorte. */
  chamada: string;
  /** Uma coluna só, que é a medida em que o cartão do catálogo se lê. */
  estreita?: boolean;
  children: ReactNode;
}) {
  return (
    <div inert className="rounded-xl border border-borda bg-fundo p-3">
      <p className="text-xs leading-relaxed text-suave">{chamada}</p>
      {/*
        O `Catalogo` de verdade abre em duas colunas a partir de 640px, que é a
        medida certa na página e a errada aqui: numa moldura estreita a segunda
        coluna parte o cartão e quebra o título em três linhas.
      */}
      <div
        className={`mt-2 ${estreita ? "max-w-[17rem] [&_ul]:grid-cols-1" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * O que a vitrine mostra enquanto ainda faltam campos para ela mostrar algo.
 *
 * Fica no lugar do recorte, com o mesmo tamanho, para a tela parar de saltar a
 * cada tecla digitada. A frase diz o que preencher para o recorte aparecer.
 */
export function VitrineAvulsa({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-borda bg-fundo px-3 py-2.5 text-xs leading-relaxed text-suave">
      {children}
    </p>
  );
}
