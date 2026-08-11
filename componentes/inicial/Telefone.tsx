import Image from "next/image";
import { BotaoAcao } from "@/componentes/BarraAcoes";
import { Capa } from "@/componentes/Capa";
import { IconePin } from "@/componentes/Icones";
import { SeloHorario } from "@/componentes/SeloHorario";
import { acoesDoRodape } from "@/lib/acoes";
import { combinacao } from "@/lib/fontes";
import { diaCivilDe, estadoAgora, montarJanela } from "@/lib/horarios";
import type { Negocio } from "@/lib/tipos";

/**
 * A prévia do produto na tela inicial.
 *
 * Não é desenho nem captura de tela: são os componentes de verdade, com os
 * dados de verdade, calculados no servidor na hora. Se a página do cliente
 * mudar, isto muda junto, e a tela inicial nunca promete o que o produto
 * não entrega.
 */
export function Telefone({ negocio }: { negocio: Negocio }) {
  const agora = Date.now();
  const estado = estadoAgora(
    montarJanela(negocio.horarios, negocio.fuso, agora),
    agora,
    diaCivilDe(agora, negocio.fuso),
  );
  const fonte = combinacao(negocio.fonte);
  const acoes = acoesDoRodape(negocio).slice(0, 1);

  return (
    <div
      className="relative mx-auto w-full max-w-[19rem] rounded-[2.5rem] bg-texto p-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.1),0_28px_60px_-24px_rgba(28,25,23,0.5)]"
      aria-hidden
    >
      <div
        data-tema={negocio.tema}
        data-fonte={fonte.chave}
        className={`marca relative overflow-hidden rounded-[2rem] bg-superficie ${fonte.classe}`}
      >
        <Capa negocio={negocio} nivel={2} />

        <div className="px-4 pt-4 pb-3">
          <SeloHorario estado={estado} />
        </div>

        {negocio.endereco ? (
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-borda bg-fundo p-3">
              <IconePin className="mt-0.5 h-4 w-4 shrink-0 text-destaque" />
              <span className="text-[0.8rem] leading-relaxed text-suave">
                {negocio.endereco}
              </span>
            </div>
          </div>
        ) : null}

        {negocio.galeria.length >= 3 ? (
          <div className="grid grid-cols-3 gap-1 px-4 pb-24">
            {negocio.galeria.slice(0, 3).map((foto) => (
              <div key={foto.url} className="overflow-hidden rounded-md bg-borda">
                <Image
                  src={foto.url}
                  alt=""
                  width={foto.largura}
                  height={foto.altura}
                  sizes="96px"
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="pb-24" />
        )}

        <div className="absolute inset-x-0 bottom-0 border-t border-borda bg-fundo/92 px-3 pt-2.5 pb-4 backdrop-blur-sm">
          {acoes.map((a) => (
            <BotaoAcao key={a.rotulo} acao={a} principal interativo={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
