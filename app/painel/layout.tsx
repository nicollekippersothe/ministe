import { Suspense } from "react";
import type { Metadata } from "next";
import { PreservarDigitado } from "./PreservarDigitado";
import { Navegacao } from "@/componentes/painel/Navegacao";
import { Marca } from "@/componentes/Marca";
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

  return (
    <div data-tema="areia" className="min-h-dvh bg-fundo">
      {/*
        Sem desenho na tela: guarda o que foi digitado no envio e devolve
        quando o servidor recusa. Ver o arquivo dele para o porquê do mecanismo.
        O Suspense é exigência do `useSearchParams`, que ele usa para saber que
        a volta trouxe `?erro=`.
      */}
      <Suspense fallback={null}>
        <PreservarDigitado />
      </Suspense>

      <div className="mx-auto w-full max-w-[34rem] px-5 pt-5 pb-8 lg:max-w-5xl lg:px-8">
        {/* -my-2 devolve o espaço que a altura de alvo toma: o logotipo é um
            link para /painel, então o dedo precisa dos 44 pixels, e sem isso o
            topo da tela ganharia um vão que ninguém pediu. */}
        <Marca href="/painel" className="-my-2 min-h-11" />

        <div className="lg:mt-6 lg:grid lg:grid-cols-[17rem_1fr] lg:items-start lg:gap-10">
          <aside className="hidden lg:sticky lg:top-8 lg:block">
            <Navegacao negocio={negocio} provisoria={provisoria} />
          </aside>

          <div className="lg:min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
