import Image from "next/image";
import { BotaoAcao } from "@/componentes/BarraAcoes";
import { IconeDoLink, IconePin, IconeSeta } from "@/componentes/Icones";
import { SeloHorario } from "@/componentes/SeloHorario";
import { acoesDoRodape } from "@/lib/acoes";
import { combinacao } from "@/lib/fontes";
import { preco } from "@/lib/formato";
import { diaCivilDe, estadoAgora, montarJanela } from "@/lib/horarios";
import type { Negocio } from "@/lib/tipos";

/**
 * A prévia do produto na tela inicial.
 *
 * Não é desenho nem captura de tela: são os componentes de verdade, com os
 * dados de verdade, calculados no servidor na hora. Se a página do cliente
 * mudar, isto muda junto, e a tela inicial nunca promete o que o produto
 * não entrega.
 *
 * A tela rola sozinha, de cima até o fim e de volta. Uma página parada mostra
 * a capa e o nome; rolando, mostra que existe catálogo com preço, horário,
 * endereço e botões embaixo, que é o que a pessoa precisa ver para entender o
 * que está comprando. A rolagem é uma animação de transform, sem JavaScript, e
 * para de acontecer para quem pediu menos movimento no sistema.
 */
export function Telefone({
  negocio,
  prioridade = true,
  leve = false,
}: {
  negocio: Negocio;
  /**
   * Só o primeiro quadro do carrossel carrega a capa com prioridade. Os
   * outros três nem estão à vista quando a página abre, e marcar os quatro
   * como prioritários faria a rede brigar consigo mesma bem no momento em
   * que a primeira pintura acontece.
   */
  prioridade?: boolean;
  /**
   * Menos itens e menos fotos, para quatro aparelhos empilhados não virarem
   * cinquenta imagens na abertura. Some catálogo e galeria pela metade, e o
   * percurso da rolagem encurta junto, o que deixa a leitura mais calma.
   */
  leve?: boolean;
}) {
  const agora = Date.now();
  const estado = estadoAgora(
    montarJanela(negocio.horarios, negocio.fuso, agora),
    agora,
    diaCivilDe(agora, negocio.fuso),
  );
  const fonte = combinacao(negocio.fonte);
  const acoes = acoesDoRodape(negocio).slice(0, 1);
  const itens = negocio.itens
    .filter((i) => i.ativo && i.fotos.length > 0)
    .slice(0, leve ? 2 : 4);
  /*
   * No carrossel a galeria fica de fora. São quatro aparelhos empilhados na
   * abertura, e três miniaturas em cada um custam doze imagens que ninguém
   * chega a olhar de perto ali. A galeria grande está no mosaico logo abaixo,
   * em tamanho que se vê.
   */
  const fotos = leve ? [] : negocio.galeria.slice(0, 6);
  const links = negocio.links.slice(0, leve ? 2 : 3);

  return (
    <div
      className="relative mx-auto w-full max-w-[19rem] rounded-[2.5rem] bg-texto p-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.1),0_28px_60px_-24px_rgba(28,25,23,0.5)]"
      aria-hidden
    >
      <div
        data-tema={negocio.tema}
        data-fonte={fonte.chave}
        className={`marca relative h-[33rem] overflow-hidden rounded-[2rem] bg-superficie ${fonte.classe}`}
      >
        {/*
          A altura da janela vai junto na variável porque o keyframe precisa
          dela para saber onde parar de subir: sobe a altura toda do conteúdo,
          menos o que cabe na tela.
        */}
        <div className="rolagem" style={{ "--janela": "33rem" } as React.CSSProperties}>
          {negocio.capa ? (
            <Image
              src={negocio.capa.url}
              alt=""
              width={negocio.capa.largura}
              height={negocio.capa.altura}
              priority={prioridade}
              loading={prioridade ? "eager" : "lazy"}
              sizes="304px"
              className="aspect-[16/9] w-full object-cover"
            />
          ) : null}

          <div className="flex flex-col items-center px-4 text-center">
            {negocio.logo ? (
              /* O mesmo retrato no nicho da página de verdade, em miniatura:
                 retângulo em pé com o topo em arco, para a prévia combinar com o
                 produto. */
              <div className="relative -mt-10 h-20 w-16 overflow-hidden rounded-t-[999px] rounded-b-md border-[3px] border-superficie bg-superficie">
                <Image
                  src={negocio.logo.url}
                  alt=""
                  width={negocio.logo.largura}
                  height={negocio.logo.altura}
                  sizes="64px"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <p className="titulo mt-2 text-[1.35rem] leading-tight text-texto">
              {negocio.nome}
            </p>
            {negocio.frase ? (
              <p className="mt-1.5 text-[0.78rem] leading-relaxed text-suave">
                {negocio.frase}
              </p>
            ) : null}
          </div>

          <div className="px-4 pt-4">
            <SeloHorario estado={estado} />
          </div>

          {negocio.endereco ? (
            <div className="px-4 pt-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-borda bg-fundo p-3">
                <IconePin className="mt-0.5 h-4 w-4 shrink-0 text-destaque" />
                <span className="text-[0.78rem] leading-relaxed text-suave">
                  {negocio.endereco}
                </span>
              </div>
            </div>
          ) : null}

          {itens.length > 0 ? (
            <div className="px-4 pt-6">
              <p className="titulo text-[1.05rem] text-texto">
                {negocio.tituloCatalogo}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
                {itens.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1.5">
                    <Image
                      src={item.fotos[0].url}
                      alt=""
                      width={item.fotos[0].largura}
                      height={item.fotos[0].altura}
                      sizes="140px"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <p className="text-[0.74rem] leading-snug font-semibold text-texto">
                      {item.titulo}
                    </p>
                    {negocio.mostrarPrecos && item.precoCentavos !== null ? (
                      <p className="text-[0.74rem] font-semibold tabular-nums text-texto">
                        {preco(item.precoCentavos)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {fotos.length >= 3 ? (
            <div className="px-4 pt-6">
              <p className="titulo text-[1.05rem] text-texto">Fotos</p>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {fotos.map((foto) => (
                  <Image
                    key={foto.url}
                    src={foto.url}
                    alt=""
                    width={foto.largura}
                    height={foto.altura}
                    sizes="92px"
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {links.length > 0 ? (
            <div className="px-4 pt-6">
              <p className="titulo text-[1.05rem] text-texto">Links</p>
              <div className="mt-3 flex flex-col gap-2">
                {links.map((link) => (
                  <span
                    key={link.id}
                    className="flex items-center gap-2.5 rounded-lg border border-borda bg-fundo px-3 py-2.5 text-[0.78rem] font-medium text-texto"
                  >
                    <IconeDoLink
                      icone={link.icone}
                      className="h-4 w-4 text-destaque"
                    />
                    <span className="flex-1">{link.rotulo}</span>
                    <IconeSeta className="h-3 w-3 text-suave" />
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Espaço para o conteúdo não terminar debaixo da barra fixa. */}
          <div className="h-20" />
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-borda bg-fundo/92 px-3 pt-2.5 pb-4 backdrop-blur-sm">
          {acoes.map((a) => (
            <BotaoAcao key={a.rotulo} acao={a} principal compacto interativo={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
