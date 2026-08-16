import { IconeConfere } from "@/componentes/Icones";
import { NOME_PRODUTO } from "@/lib/marca";

/**
 * Os planos e valores da tela inicial.
 *
 * A primeira versão era uma tabela comparativa, as duas colunas com o mesmo
 * peso. Lida como espelho: qualquer diferença precisa ser lida duas vezes,
 * uma em cada coluna, para a pessoa notar. Aqui cada plano é o assunto do
 * próprio cartão, com a lista dita como ganho ("500 itens", não uma célula ao
 * lado do "20" do outro), e o pago é visualmente o cartão principal, porque é
 * o que a seção quer que a pessoa escolha.
 *
 * Cada linha continua vindo de um limite que existe de verdade: a tabela de
 * `supabase/LEIA-ME.md` (`limite_do_plano`, no schema), mais o que o código já
 * decide sozinho (letra, marca no rodapé, contagem de visitas). Não há um
 * décimo diferencial escondido: os nove aqui são todos os que existem hoje.
 * "Mais benefícios" só cabia mudando como eles são ditos, não inventando um.
 */
const GRATUITO = [
  "1 página, publicada na hora",
  "20 itens no catálogo, até 3 fotos cada",
  "12 fotos na galeria",
  "8 links extras",
  "3 intervalos de horário por dia",
  "A letra padrão da marca",
  "Contagem de visitas do período",
];

const PAGO = [
  "5 páginas na mesma conta",
  "500 itens no catálogo, até 10 fotos cada",
  "100 fotos na galeria",
  "30 links extras",
  "4 intervalos de horário por dia",
  "As cinco combinações de letra",
  "Histórico de visitas, com comparação",
  "Página só com a sua marca",
];

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <IconeConfere className="mt-1 h-3.5 w-3.5 shrink-0 text-destaque" />
      <span className="text-[0.95rem] leading-snug text-texto">{children}</span>
    </li>
  );
}

export function Planos() {
  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="surge order-2 flex flex-col rounded-3xl border border-borda bg-superficie p-7 lg:order-1 lg:mt-8">
        <span className="text-[0.95rem] font-semibold text-texto">Gratuito</span>
        <p className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-texto">
          R$0
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {GRATUITO.map((linha) => (
            <Item key={linha}>{linha}</Item>
          ))}
        </ul>

        <p className="mt-6 text-[0.85rem] leading-relaxed text-suave">
          Com a assinatura "feito com {NOME_PRODUTO}" no rodapé.
        </p>
      </div>

      {/*
        O cartão principal. Fundo e borda saem da mesma cor de destaque da
        marca, então o "escolha este" é a paleta falando, não uma faixa
        colorida colada na borda esquerda.
      */}
      <div className="surge order-1 flex flex-col rounded-3xl border border-destaque/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--c-destaque)_6%,var(--c-superficie)),var(--c-superficie))] p-7 shadow-[0_1px_2px_rgba(28,25,23,0.08),0_24px_48px_-24px_rgba(122,74,43,0.35)] lg:order-2">
        <span className="w-fit rounded-full bg-destaque px-3 py-1 text-[0.78rem] font-semibold tracking-[0.02em] text-white">
          Para crescer
        </span>
        <p className="mt-4 text-[0.95rem] font-semibold text-texto">Pago</p>
        <p className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-texto">
          R$19,90<span className="text-base font-normal text-suave"> por mês</span>
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {PAGO.map((linha) => (
            <Item key={linha}>{linha}</Item>
          ))}
        </ul>

        <p className="mt-6 text-[0.85rem] leading-relaxed text-suave">
          R$13,90 por mês, pagando o ano.
        </p>
      </div>
    </div>
  );
}
