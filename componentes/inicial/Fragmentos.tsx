import Image from "next/image";
import { BotaoAcao } from "@/componentes/BarraAcoes";
import { SeloHorario } from "@/componentes/SeloHorario";
import { acoesDoRodape } from "@/lib/acoes";
import { combinacao } from "@/lib/fontes";
import { preco } from "@/lib/formato";
import { diaCivilDe, estadoAgora, montarJanela } from "@/lib/horarios";
import { DOMINIO_PUBLICO } from "@/lib/marca";
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
      className={`surge flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10 ${
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
  const acao = acoesDoRodape(negocio)[0];
  const primeiroItem = negocio.itens.find((i) => i.ativo) ?? null;

  return (
    <ul className="flex flex-col gap-16 sm:gap-20">
      <Bloco
        titulo="Encontrado por quem procura"
        texto="Quando alguém busca o seu serviço na sua cidade, o Google precisa de dados para mostrar alguma coisa. O seu endereço leva nome, cidade, horário e serviços na marcação que a busca entende."
        peca={
          <div
            className="rounded-2xl border border-borda bg-superficie px-5 py-5"
            aria-hidden
          >
            <p className="text-[0.72rem] tracking-wide text-suave">
              {DOMINIO_PUBLICO}/{negocio.slug}
            </p>
            <p className="mt-1 text-[1.05rem] leading-snug text-[#1a0dab]">
              {negocio.nome}
              {local ? ` em ${local}` : null}
            </p>
            {negocio.frase ? (
              <p className="mt-1 line-clamp-2 text-[0.82rem] leading-relaxed text-suave">
                {negocio.frase}
              </p>
            ) : null}
            <div className="mt-2.5 flex items-center gap-2 text-[0.82rem]">
              <SeloHorario estado={estado} className="text-[0.78rem]" />
            </div>
          </div>
        }
      />

      <Bloco
        invertido
        titulo="Tudo o que você faz, à mostra"
        texto="Catálogo com foto e preço, galeria de fotos, endereço e horário reunidos. Quem chega entende o que você vende antes de precisar perguntar, e decide com mais informação."
        peca={
          <div
            className="rounded-2xl border border-borda bg-superficie p-4"
            aria-hidden
          >
            {negocio.capa ? (
              <Image
                src={negocio.capa.url}
                alt=""
                width={negocio.capa.largura}
                height={negocio.capa.altura}
                sizes="(max-width: 640px) 90vw, 304px"
                className="aspect-[16/10] w-full rounded-xl object-cover"
              />
            ) : null}
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="font-semibold text-texto">
                {primeiroItem ? primeiroItem.titulo : negocio.nome}
              </span>
              {primeiroItem && primeiroItem.precoCentavos !== null ? (
                <span className="shrink-0 text-sm font-semibold text-texto">
                  {preco(primeiroItem.precoCentavos)}
                </span>
              ) : null}
            </div>
            {acao ? (
              <div className="mt-3">
                <BotaoAcao acao={acao} principal interativo={false} />
              </div>
            ) : null}
          </div>
        }
      />

      <Bloco
        titulo="A impressão de quem trabalha sério"
        texto="Compartilhado no WhatsApp, na bio do Instagram, num cartão, o seu endereço chega com foto, nome e o que você faz. É o que faz o seu trabalho ser levado a sério desde o primeiro toque."
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
                {DOMINIO_PUBLICO}
              </p>
            </div>
          </div>
        }
      />
    </ul>
  );
}
