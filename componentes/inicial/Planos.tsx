import { NOME_PRODUTO } from "@/lib/marca";

/**
 * A tabela de planos e valores da tela inicial.
 *
 * Cada linha vem de um limite que já existe de verdade: a tabela de
 * `supabase/LEIA-ME.md`, mais o que o código já decide sozinho (letra, marca
 * no rodapé, contagem de visitas). Nada aqui é exemplo nem promessa, é o que
 * as duas contas fazem hoje.
 *
 * O preço é o único número que não vinha de lugar nenhum do código: veio de
 * pesquisa de mercado (linkme.bio, Linktree, Beacons, e o preço de "site
 * pronto" no Brasil), registrada junto com o motivo em `supabase/LEIA-ME.md`,
 * ao lado da tabela de limites, para a próxima pessoa achar sem precisar
 * perguntar.
 */
const LINHAS = [
  { recurso: "Páginas por conta", gratuito: "1", pago: "5" },
  { recurso: "Itens no catálogo", gratuito: "20", pago: "500" },
  { recurso: "Fotos por item", gratuito: "3", pago: "10" },
  { recurso: "Fotos na galeria", gratuito: "12", pago: "100" },
  { recurso: "Links extras", gratuito: "8", pago: "30" },
  { recurso: "Intervalos de horário por dia", gratuito: "3", pago: "4" },
  {
    recurso: "Letra da página",
    gratuito: "A padrão",
    pago: "As cinco combinações",
  },
  {
    recurso: "Rodapé da página",
    gratuito: `Assinatura "feito com ${NOME_PRODUTO}"`,
    pago: "Só a sua marca",
  },
  {
    recurso: "Contagem de visitas",
    gratuito: "Número do período",
    pago: "Histórico e comparação",
  },
];

export function Planos() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] border-collapse text-left">
        <caption className="sr-only">
          Comparação de recursos entre o plano gratuito e o plano pago
        </caption>
        <thead>
          {/*
            As duas células do cabeçalho precisam da mesma altura de
            conteúdo. A nota do anual, testada aqui antes, tinha três linhas
            contra as duas do gratuito, e align-bottom empurrava "Gratuito"
            para baixo até as bases baterem: no celular, onde o preço do pago
            quebra em mais linhas ainda, "Pago" acabava lendo como se
            estivesse numa linha à parte, antes do "Gratuito". A nota do
            anual mudou para uma legenda abaixo da tabela inteira, então as
            duas células agora têm a mesma altura sempre.
          */}
          <tr className="border-b border-borda">
            <th scope="col" className="py-4 pr-4 align-top">
              <span className="sr-only">Recurso</span>
            </th>
            <th scope="col" className="px-4 py-4 align-top">
              <span className="block text-[0.95rem] font-semibold text-texto">
                Gratuito
              </span>
              <span className="mt-1 block text-2xl font-semibold tracking-[-0.02em] text-texto">
                R$0
              </span>
            </th>
            <th scope="col" className="px-4 py-4 align-top">
              <span className="block text-[0.95rem] font-semibold text-texto">
                Pago
              </span>
              <span className="mt-1 block text-2xl font-semibold tracking-[-0.02em] text-texto">
                R$29,90
                <span className="text-base font-normal text-suave">
                  {" "}
                  por mês
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {LINHAS.map((linha) => (
            <tr key={linha.recurso} className="border-b border-borda last:border-b-0">
              <th
                scope="row"
                className="py-3.5 pr-4 text-[0.95rem] font-medium text-texto"
              >
                {linha.recurso}
              </th>
              <td className="px-4 py-3.5 text-[0.95rem] text-suave">
                {linha.gratuito}
              </td>
              <td className="px-4 py-3.5 text-[0.95rem] font-medium text-texto">
                {linha.pago}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-[0.85rem] text-suave">
        O plano pago custa R$19,90 por mês pagando o ano.
      </p>
    </div>
  );
}
