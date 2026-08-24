import Image from "next/image";
import { IconeDoLink, IconeSeta, IconeWhatsapp } from "@/componentes/Icones";
import { SeloHorario } from "@/componentes/SeloHorario";
import { acoesDoRodape } from "@/lib/acoes";
import { combinacao } from "@/lib/fontes";
import { preco } from "@/lib/formato";
import {
  diaCivilDe,
  DIAS_LONGO,
  estadoAgora,
  montarJanela,
  porDiaSemana,
} from "@/lib/horarios";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import type { Negocio } from "@/lib/tipos";

/**
 * O que cabe dentro de um endereço, mostrado com as peças de verdade.
 *
 * Todo cartão aqui é o componente que roda na página do cliente, com os dados
 * do exemplo, calculados no servidor na hora. Nada é desenho nem captura de
 * tela, então a tela inicial não consegue prometer o que o produto não faz: se
 * o horário do exemplo virar, o cartão do horário vira junto.
 *
 * Os tamanhos são desiguais de propósito. Grade de cartões iguais é a forma
 * mais rápida de uma seção virar decoração, e o catálogo merece mais espaço
 * que o resto porque é onde a decisão de compra acontece.
 *
 * No celular a grade deita e vira uma faixa que corre com o polegar. Empilhada,
 * ela ocupava três mil pixels de cartão atrás de cartão, e era metade da queixa
 * de "muito texto" da tela inicial. Deitada, cada peça ocupa uma tela e a
 * seguinte espia pela direita.
 *
 * Cada peça é mostrada acesa, na claridade do tema areia, dentro de um cartão
 * que fica na parede escura. É o desenho de galeria, e ele também é o mais
 * honesto: o que está ali dentro é a página de um cliente, e a página do
 * cliente tem a cor que o dono escolheu, e não a da parede.
 */

function Cartao({
  titulo,
  texto,
  children,
  className = "",
}: {
  titulo: string;
  texto: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      /*
       * Sem `surge` aqui. A revelação na rolagem se pendura no eixo vertical da
       * caixa de rolagem mais próxima, e no celular essa caixa passou a ser a
       * faixa horizontal, que não rola para baixo. O cartão ficaria preso no
       * começo da animação, invisível. A seção inteira já entra com respiro.
       */
      className={`flex w-[17rem] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-borda bg-superficie sm:w-auto ${className}`}
    >
      <div
        data-tema="areia"
        className="flex flex-1 flex-col justify-center bg-superficie px-6 pt-7 pb-6 sm:px-7 sm:pt-8"
      >
        {children}
      </div>
      <div className="border-t border-borda px-6 py-5 sm:px-7">
        <h3 className="font-semibold tracking-[-0.015em] text-texto">{titulo}</h3>
        <p className="mt-1 text-[0.9rem] leading-relaxed text-suave text-pretty">
          {texto}
        </p>
      </div>
    </li>
  );
}

export function Mosaico({
  negocio,
  paraCatalogo,
  paraBotoes,
  paraGaleria,
}: {
  /** O dono do cartão de horário, da busca e da prévia de link. */
  negocio: Negocio;
  /*
   * Cada cartão mostra um negócio diferente de propósito. Um exemplo só
   * repetido em seis cartões responde "que bonito"; seis negócios diferentes
   * respondem "serve para o meu caso", que é a pergunta que importa.
   */
  paraCatalogo: Negocio;
  paraBotoes: Negocio;
  paraGaleria: Negocio;
}) {
  const agora = Date.now();
  const estado = estadoAgora(
    montarJanela(negocio.horarios, negocio.fuso, agora),
    agora,
    diaCivilDe(agora, negocio.fuso),
  );
  const fonte = combinacao(negocio.fonte);
  const local = [negocio.cidade, negocio.estado].filter(Boolean).join(", ");
  const acoes = acoesDoRodape(paraBotoes);
  const vitrine = paraCatalogo.itens
    .filter((i) => i.ativo && i.fotos.length > 0)
    .slice(0, 2);
  const links = paraBotoes.links.slice(0, 3);

  /*
   * Só os dias com hora marcada, e no máximo quatro linhas. A semana inteira
   * cabe na página do cliente, atrás de "horários da semana"; aqui o cartão
   * precisa caber ao lado de outros dois.
   */
  const porDia = porDiaSemana(negocio.horarios);
  const semana = [1, 2, 3, 4, 5, 6, 0]
    .map((dia) => ({ dia, intervalos: porDia[dia] }))
    .filter(({ intervalos }) => intervalos.length > 0)
    .slice(0, 4);

  return (
        /*
     * scroll-px-6 acompanha o px-6. Sem ele o encaixe alinha a primeira peça na
     * borda de dentro da caixa e o navegador rola 24px sozinho assim que a
     * página abre, o que fazia a peça nascer colada na lateral da tela.
     */
    <ul className="trilho -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
      <Cartao
        className="lg:col-span-2"
        titulo="Catálogo com foto e preço"
        texto="Quem chega vê o que você vende, por quanto, e chama no WhatsApp ali mesmo."
      >
        <div className="grid grid-cols-2 gap-4 sm:gap-5" aria-hidden>
          {vitrine.map((item) => (
            <div key={item.id} className="flex flex-col gap-2.5">
              <Image
                src={item.fotos[0].url}
                alt=""
                width={item.fotos[0].largura}
                height={item.fotos[0].altura}
                sizes="(max-width: 640px) 40vw, 220px"
                className="aspect-square w-full rounded-xl object-cover"
              />
              <p className="text-[0.92rem] leading-snug font-semibold text-texto text-pretty">
                {item.titulo}
              </p>
              {paraCatalogo.mostrarPrecos && item.precoCentavos !== null ? (
                <p className="text-[0.92rem] font-semibold tabular-nums text-texto">
                  {preco(item.precoCentavos)}
                </p>
              ) : null}
              <p className="flex items-start gap-1.5 text-[0.78rem] leading-snug font-medium text-zap">
                <IconeWhatsapp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Pedir pelo WhatsApp
              </p>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao
        titulo="Botões que levam para onde você vende"
        texto="WhatsApp, agenda, iFood, Instagram. Cada botão leva para onde o pedido acontece."
      >
        <div className="flex flex-col gap-2.5" aria-hidden>
          {acoes.map((acao) => (
            <span
              key={acao.rotulo}
              className={`flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[0.92rem] font-semibold ${
                acao.whatsapp
                  ? "bg-zap text-white"
                  : "bg-destaque text-white"
              }`}
            >
              {acao.whatsapp ? (
                <IconeWhatsapp className="h-4 w-4" />
              ) : (
                <IconeDoLink icone={acao.icone} className="h-4 w-4" />
              )}
              {acao.rotulo}
            </span>
          ))}
          {links.map((link) => (
            <span
              key={link.id}
              className="flex items-center gap-2.5 rounded-xl border border-borda bg-fundo px-3.5 py-2.5 text-[0.92rem] font-medium text-texto"
            >
              <IconeDoLink icone={link.icone} className="h-4 w-4 text-destaque" />
              <span className="flex-1">{link.rotulo}</span>
              <IconeSeta className="h-3.5 w-3.5 text-suave" />
            </span>
          ))}
        </div>
      </Cartao>

      {/*
        O cadastro é o que separa quem publica de quem desiste no meio, então
        ele merece um cartão. Mostrado como perguntas respondidas, e não como
        formulário vazio: formulário em branco é justamente a imagem que a
        pessoa tem na cabeça quando pensa em montar um site.
      */}
      <Cartao
        titulo="Pronta numa sentada"
        texto="Perguntas, uma de cada vez, respondidas pelo celular."
      >
        <div className="flex flex-col gap-2.5" aria-hidden>
          <div className="flex items-center gap-2 rounded-full border border-borda bg-fundo px-4 py-2.5 text-[0.92rem]">
            <span className="text-suave">{DOMINIO_PUBLICO}/</span>
            <span className="font-semibold text-texto">{paraCatalogo.slug}</span>
            <span className="ml-auto text-[0.8rem] font-medium text-aberto-texto">
              livre
            </span>
          </div>
          {[
            ["Nome", paraCatalogo.nome],
            ["O que você vende", paraCatalogo.tituloCatalogo],
            ["Onde falam com você", "WhatsApp"],
          ].map(([campo, valor]) => (
            <div
              key={campo}
              className="flex items-baseline justify-between gap-3 rounded-xl border border-borda bg-fundo px-3.5 py-2.5"
            >
              <span className="text-[0.8rem] text-suave">{campo}</span>
              <span className="truncate text-[0.92rem] font-medium text-texto">
                {valor}
              </span>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao
        titulo="Aberto agora, no seu fuso"
        texto="A página calcula pelo horário que você cadastrou e mostra quando você volta a abrir."
      >
        <div className="flex flex-col gap-3" aria-hidden>
          <SeloHorario estado={estado} />
          {/* Os dias saem do exemplo, não de uma tabela escrita à mão aqui. */}
          <dl className="mt-1 flex flex-col gap-1.5 text-[0.92rem]">
            {semana.map(({ dia, intervalos }) => (
              <div key={dia} className="flex justify-between gap-4">
                <dt className="text-suave">{DIAS_LONGO[dia]}</dt>
                <dd className="text-right tabular-nums text-texto">
                  {intervalos.length === 0
                    ? "Fechado"
                    : `${intervalos[0].abre} às ${intervalos.at(-1)!.fecha}`}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Cartao>

      <Cartao
        titulo="Escrita para o Google entender"
        texto="Nome, categoria, cidade e horário saem na marcação que o buscador lê."
      >
        <div
          className="rounded-2xl border border-borda bg-fundo px-4 py-4"
          aria-hidden
        >
          <p className="text-[0.72rem] tracking-wide text-suave">
            {DOMINIO_PUBLICO}/{negocio.slug}
          </p>
          <p className="mt-1 text-[1.02rem] leading-snug text-[#1a0dab]">
            {negocio.nome}
            {local ? ` em ${local}` : null}
          </p>
          {negocio.frase ? (
            <p className="mt-1 line-clamp-2 text-[0.82rem] leading-relaxed text-suave">
              {negocio.frase}
            </p>
          ) : null}
          <div className="mt-2.5">
            <SeloHorario estado={estado} className="text-[0.76rem]" />
          </div>
        </div>
      </Cartao>

      <Cartao
        titulo="O link já chega mostrando quem é você"
        texto="Colado no WhatsApp ou na bio, ele abre com a sua capa, o seu nome e a sua frase."
      >
        <div
          data-fonte={fonte.chave}
          className={`marca overflow-hidden rounded-2xl border border-borda ${fonte.classe}`}
          aria-hidden
        >
          {negocio.capa ? (
            <Image
              src={negocio.capa.url}
              alt=""
              width={negocio.capa.largura}
              height={negocio.capa.altura}
              sizes="(max-width: 640px) 90vw, 300px"
              className="aspect-[1.91/1] w-full object-cover"
            />
          ) : null}
          <div className="bg-fundo px-4 py-3">
            <p className="text-[0.7rem] tracking-wide text-suave uppercase">
              {DOMINIO_PUBLICO}
            </p>
            <p className="titulo mt-1 text-[1rem] leading-snug text-texto">
              {negocio.nome}
              {local ? ` em ${local}` : null}
            </p>
            {negocio.frase ? (
              <p className="mt-1 line-clamp-2 text-[0.8rem] leading-relaxed text-suave">
                {negocio.frase}
              </p>
            ) : null}
          </div>
        </div>
      </Cartao>

      {/*
        A galeria atravessa a largura toda. É a peça que mais se aproxima do
        que a entrais é para quem faz trabalho manual ou autoral: um lugar para
        expor, e não só um cartão de contato. Espremida numa coluna de um terço
        ela viraria seis miniaturas, que é o oposto de expor.
      */}
      <Cartao
        className="lg:col-span-2"
        titulo="A galeria do seu trabalho"
        texto="As suas fotos em tamanho grande, na ordem que você escolher."
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-hidden>
          {paraGaleria.galeria.slice(0, 6).map((foto) => (
            <Image
              key={foto.url}
              src={foto.url}
              alt=""
              width={foto.largura}
              height={foto.altura}
              sizes="(max-width: 640px) 30vw, 170px"
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      </Cartao>
    </ul>
  );
}
