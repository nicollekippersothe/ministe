import Image from "next/image";
import { IconeWhatsapp } from "./Icones";
import { linkWhatsapp, mensagemDoItem, preco } from "@/lib/formato";
import type { Item, Negocio } from "@/lib/tipos";

/**
 * O catalogo da pagina publica, em cartoes.
 *
 * Antes cada item era titulo, descricao, preco e um link verde soltos numa
 * grade de duas colunas. Tres coisas saiam erradas dai, e as tres foram
 * relatadas por quem publicou a propria pagina:
 *
 * 1. Sem moldura, os itens eram texto solto, e o unico bloco com cor forte era
 *    o link do WhatsApp repetido em cada um. O que a pessoa via primeiro era o
 *    botao, e nao o que ela vende.
 * 2. Item sem foto ficava com metade da altura do vizinho com foto, entao a
 *    grade saia com o pe torto e nenhum preco alinhado com o outro.
 * 3. Duas colunas com dois itens deixavam a coluna do catalogo com um palmo de
 *    conteudo e o resto da tela em branco no monitor.
 *
 * Agora cada item e um cartao fechado: moldura, fundo do tema, foto encostada
 * no topo quando existe, e uma barra embaixo com o preco de um lado e a acao do
 * outro. O preco passa a ser a peca de maior peso do cartao, que e a ordem em
 * que a pessoa le uma lista de servico, e o botao continua inteiro no alcance
 * do dedo com 44 pixels de altura.
 *
 * Tudo em CSS. A pagina publica continua com o mesmo JavaScript proprio de
 * antes, que e so o selo de horario.
 */

/**
 * Ate dois itens, o cartao deita e ocupa a coluna inteira.
 *
 * A grade de duas colunas so tem o que mostrar a partir do terceiro item. Com
 * dois, ela produz dois cartoes estreitos no alto de uma coluna de 45rem e um
 * vazio embaixo do tamanho de meia tela. Deitado, o mesmo par de itens ocupa a
 * largura toda, a foto vai para o lado do texto, e a secao ganha corpo sem
 * nenhuma palavra inventada.
 */
const LIMITE_DEITADO = 2;

/** A foto sozinha, ou a faixa que corre de lado quando ha mais de uma. */
function Fotos({ item, deitado }: { item: Item; deitado: boolean }) {
  if (item.fotos.length === 0) return null;

  /*
   * Deitado, a foto sai do fluxo e forra a lateral esquerda do cartao inteiro,
   * e o cartao reserva o espaco dela com padding. E o que faz a foto ter a
   * altura do texto ao lado sem ninguem medir nada em JavaScript.
   */
  const moldura = deitado
    ? "sm:absolute sm:inset-y-0 sm:left-0 sm:aspect-auto sm:w-[38%]"
    : "";

  if (item.fotos.length === 1) {
    const foto = item.fotos[0];
    return (
      <div
        className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-borda ${moldura}`}
      >
        <Image
          src={foto.url}
          alt={foto.alt}
          width={foto.largura}
          height={foto.altura}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 340px"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-borda ${moldura}`}
    >
      {/*
        A segunda foto fica espiando pela direita: e o convite para arrastar, e
        vale tanto no dedo quanto no mouse. Encaixe pelo comeco, para a foto
        parar encostada na borda do cartao.
      */}
      <div className="faixa faixa-do-cartao absolute inset-0 flex gap-1 overflow-x-auto">
        {item.fotos.map((foto, i) => (
          <div
            key={foto.url}
            className="relative h-full w-[87%] shrink-0 overflow-hidden bg-borda"
          >
            <Image
              src={foto.url}
              alt={i === 0 ? foto.alt : `${foto.alt}, foto ${i + 1}`}
              width={foto.largura}
              height={foto.altura}
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 300px"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      <p className="sr-only">
        {item.fotos.length} fotos, arraste para o lado para ver as outras.
      </p>
    </div>
  );
}

function Cartao({
  item,
  negocio,
  deitado,
}: {
  item: Item;
  negocio: Negocio;
  deitado: boolean;
}) {
  const mensagem = mensagemDoItem(negocio.mensagemItem, item.titulo);
  const temFoto = item.fotos.length > 0;

  const etiqueta =
    negocio.mostrarPrecos && item.precoCentavos !== null
      ? preco(item.precoCentavos)
      : null;

  const conversa =
    negocio.whatsapp && mensagem
      ? linkWhatsapp(negocio.whatsapp, mensagem)
      : null;

  /*
   * A barra de baixo so existe quando ha o que colocar nela. Preco escondido
   * pelo dono, item de preco em branco e negocio que atende por outro canal
   * caem todos aqui, e o cartao fecha na descricao, com a mesma moldura.
   */
  const temBarra = etiqueta !== null || conversa !== null;

  return (
    <li
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-borda bg-fundo ${
        deitado
          ? `sm:min-h-[9rem] ${temFoto ? "sm:pl-[38%]" : ""}`
          : "h-full"
      }`}
    >
      <Fotos item={item} deitado={deitado} />

      <div
        className={`flex flex-1 flex-col gap-1.5 ${deitado ? "p-5" : "p-4"}`}
      >
        <h3
          className={`leading-snug font-semibold text-pretty text-texto ${
            deitado ? "text-[1.0625rem]" : "text-[0.95rem]"
          }`}
        >
          {item.titulo}
        </h3>

        {item.descricao ? (
          <p className="max-w-[48ch] text-sm leading-relaxed text-pretty text-suave">
            {item.descricao}
          </p>
        ) : null}
      </div>

      {temBarra ? (
        /*
         * A barra empilha por padrao e so deita quando cabe.
         *
         * Preco e botao lado a lado dependiam do tamanho do preco: R$ 74,00
         * cabia na mesma linha e R$ 180,00 empurrava o botao para baixo, entao
         * a mesma pagina saia com uns cartoes de um jeito e outros de outro. A
         * coluna e o arranjo que vale para qualquer preco, e a linha fica para
         * o cartao deitado, que tem a largura da coluna inteira.
         */
        <div
          className={`mt-auto flex flex-col items-start gap-2 border-t border-borda py-2.5 ${
            deitado
              ? "px-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              : "px-4"
          }`}
        >
          {etiqueta ? (
            <p className="text-[1.05rem] leading-none font-semibold tabular-nums text-texto">
              {etiqueta}
            </p>
          ) : null}

          {conversa ? (
            <a
              href={conversa}
              target="_blank"
              rel="noopener noreferrer"
              /*
               * Este e o botao que converte a pagina inteira: ele fica no
               * celular de quem esta decidindo pedir, e com 20 pixels de altura
               * o dedo erra e a pessoa desiste. Ja foi medido em 169 por 20
               * aqui, e o minimo de 44 pixels de altura ficou desde entao.
               *
               * A cor saiu do texto e ficou so no simbolo. O verde repetido em
               * cada item era o que pesava mais na secao, e quem publicou a
               * pagina viu isso antes de qualquer medida: o botao dominava o
               * que ela vende. Menor peso na tela, mesmo tamanho no dedo.
               */
              className="acao-do-item inline-flex min-h-11 items-center gap-2 rounded-full border border-borda bg-superficie px-3.5 text-sm font-medium text-texto"
            >
              <IconeWhatsapp className="h-4 w-4 shrink-0 text-zap" />
              Pedir pelo WhatsApp
              <span className="sr-only">, {item.titulo}, abre em outra aba</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function Catalogo({ negocio }: { negocio: Negocio }) {
  const itens = negocio.itens.filter((i) => i.ativo);
  if (itens.length === 0) return null;

  const deitado = itens.length <= LIMITE_DEITADO;

  return (
    <ul
      className={`grid grid-cols-1 gap-4 ${
        deitado ? "" : "sm:grid-cols-2 sm:gap-5"
      }`}
    >
      {itens.map((item) => (
        <Cartao
          key={item.id}
          item={item}
          negocio={negocio}
          deitado={deitado}
        />
      ))}
    </ul>
  );
}
