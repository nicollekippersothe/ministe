import type { ReactNode } from "react";
import { PreviaAoVivo } from "./PreviaAoVivo";

/**
 * O formulário à esquerda, a sua página de verdade à direita.
 *
 * É o "formato de painel, aproveitar os espaços" pedido pela dona. No monitor,
 * a tela de edição deixa de ser uma coluna estreita com um vazio enorme ao
 * lado, e passa a mostrar a página tomando forma enquanto ela edita. No celular
 * a prévia desaparece (ela já abre inteira em /painel/previa), e o formulário
 * volta a ocupar a largura toda.
 *
 * A `chave` faz o iframe da prévia recarregar quando o dado muda: cada Salvar
 * remonta a tela do painel com dados novos, e uma chave montada a partir deles
 * troca, então a prévia busca a página atualizada.
 */
export function TelaComPrevia({
  chave,
  children,
}: {
  chave: string;
  children: ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,36rem)_auto] lg:items-start lg:gap-10">
      <div className="lg:min-w-0">{children}</div>
      <PreviaAoVivo chave={chave} />
    </div>
  );
}
