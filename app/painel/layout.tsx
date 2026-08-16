import type { Metadata } from "next";
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
 * Botões, com o selo de No ar sempre à vista.
 *
 * A coluna some abaixo de lg em vez de encolher, porque no celular ela seria a
 * mesma lista duas vezes na mesma tela.
 */
export default async function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const negocio = await doDono();
  const provisoria = await contaProvisoria();

  return (
    <div data-tema="areia" className="min-h-dvh bg-fundo">
      <div className="mx-auto w-full max-w-[34rem] px-5 pt-5 pb-8 lg:max-w-5xl lg:px-8">
        <Marca href="/painel" />

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
