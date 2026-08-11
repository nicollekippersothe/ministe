import Image from "next/image";
import { BotaoWhatsapp } from "@/componentes/BarraWhatsapp";
import { SeloHorario } from "@/componentes/SeloHorario";
import { combinacao } from "@/lib/fontes";
import { diaCivilDe, estadoAgora, montarJanela } from "@/lib/horarios";
import type { Negocio } from "@/lib/tipos";

/**
 * As três coisas que mudam para quem procura o negócio, mostradas com as
 * peças de verdade em vez de ícone dentro de bolinha.
 *
 * Também não é uma grade de três colunas iguais: cada peça tem o tamanho que
 * o assunto pede, e o texto fica ao lado, alternando o lado.
 */

function Bloco({
  peca,
  titulo,
  texto,
  invertido = false,
}: {
  peca: React.ReactNode;
  titulo: string;
  texto: string;
  invertido?: boolean;
}) {
  return (
    <li
      className={`flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10 ${
        invertido ? "sm:flex-row-reverse" : ""
      }`}
    >
      <div className="w-full sm:w-[19rem] sm:shrink-0">{peca}</div>
      <div className="sm:flex-1">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-texto">
          {titulo}
        </h3>
        <p className="mt-2 leading-relaxed text-balance text-suave">{texto}</p>
      </div>
    </li>
  );
}

export function Fragmentos({ negocio }: { negocio: Negocio }) {
  const agora = Date.now();
  const estado = estadoAgora(
    montarJanela(negocio.horarios, negocio.fuso, agora),
    agora,
    diaCivilDe(agora, negocio.fuso),
  );
  const fonte = combinacao(negocio.fonte);
  const local = [negocio.cidade, negocio.estado].filter(Boolean).join(", ");

  return (
    <ul className="flex flex-col gap-16 sm:gap-20">
      <Bloco
        titulo="A conversa já começa escrita"
        texto="O cliente toca uma vez e o WhatsApp abre com a mensagem pronta. Ninguém precisa saber o que dizer para te procurar."
        peca={
          <div aria-hidden>
            <BotaoWhatsapp negocio={negocio} interativo={false} />
          </div>
        }
      />

      <Bloco
        invertido
        titulo="Aberto agora, e não um horário escrito"
        texto="A página calcula sozinha, no seu fuso, contando quem fecha depois da meia noite e quem fecha para o almoço."
        peca={
          <div
            className="flex justify-center rounded-2xl border border-borda bg-superficie px-5 py-8"
            aria-hidden
          >
            <SeloHorario estado={estado} className="text-base" />
          </div>
        }
      />

      <Bloco
        titulo="O link deixa de parecer quebrado"
        texto="Quando você manda no WhatsApp ou cola na bio, aparece assim: com foto, nome e o que você faz. É a primeira impressão de quem nunca te viu."
        peca={
          <div
            data-fonte={fonte.chave}
            className={`marca overflow-hidden rounded-2xl border border-borda bg-superficie ${fonte.classe}`}
            aria-hidden
          >
            {negocio.capa ? (
              <Image
                src={negocio.capa.url}
                alt=""
                width={negocio.capa.largura}
                height={negocio.capa.altura}
                sizes="(max-width: 640px) 90vw, 304px"
                className="aspect-[1.91/1] w-full object-cover"
              />
            ) : null}
            <div className="px-4 py-3">
              <p className="titulo text-[1.05rem] leading-snug text-texto">
                {negocio.nome}
                {local ? ` em ${local}` : null}
              </p>
              {negocio.frase ? (
                <p className="mt-1 line-clamp-2 text-[0.8rem] leading-relaxed text-suave">
                  {negocio.frase}
                </p>
              ) : null}
              <p className="mt-2 text-[0.7rem] tracking-wide text-suave uppercase">
                banca.app
              </p>
            </div>
          </div>
        }
      />
    </ul>
  );
}
