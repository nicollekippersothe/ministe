"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { salvarFocoDaCapa } from "@/app/painel/acoes";
import { limitarFoco, posicaoDoFoco } from "@/lib/supabase/imagens";
import type { Foco } from "@/lib/tipos";
import { FaixaDeRecado, type Tom } from "./Sinais";

/**
 * Onde a dona da página escolhe o ponto da capa que precisa aparecer.
 *
 * A capa tem moldura fixa, 16 por 9 no celular e 64 por 15 no monitor, e a foto
 * que sai do celular tem a proporção que a câmera deu. O `object-cover` acerta a
 * diferença cortando pelo centro, e o centro de uma foto raramente é o assunto
 * dela: o rosto costuma estar no terço de cima, o prato na beirada da mesa, a
 * peça num canto. Quem tinha esse problema descobria abrindo a própria página.
 *
 * A saída é ponto focal, e ela cabe em dois números: a pessoa aponta o que
 * precisa aparecer, e o `object-position` do CSS faz o corte sair em volta.
 * Nenhum arquivo novo é gerado, nenhuma biblioteca entra, e o mesmo par de
 * números serve as duas molduras da capa e qualquer terceira que apareça.
 *
 * ## Os dois momentos, e por que eles são dois
 *
 * **Em repouso a capa é só uma imagem.** Ela aparece cortada, com o ponto
 * gravado já aplicado, que é exatamente o que a página pública mostra. O dedo
 * passa por cima dela e a tela rola, como rola por cima de qualquer foto.
 *
 * **No ajuste o quadro toma o toque**, e aí sim ele fica com `touch-none`, a
 * foto aparece inteira e o arraste move o ponto nos dois eixos.
 *
 * Esta divisão é conserto de defeito medido, e não gosto. Enquanto o quadro
 * arrastava direto do `onPointerDown`, um retângulo de 316 por 178 pixels no
 * meio do painel engolia a rolagem do celular: medido no iPhone 13, o dedo
 * subindo por cima da capa deixava `scrollY` parado em 158 e ainda levava o
 * ponto guardado de 50% para 0% da altura. Quem queria descer a tela mexia na
 * capa sem pedir, e a página dela mudava por causa disso.
 *
 * A alternativa era `touch-pan-y` com arraste armado por um toque, e ela paga
 * mais caro: `touch-pan-y` devolve a rolagem vertical e tira o arraste
 * vertical do quadro, que é justamente o eixo que a foto em pé precisa. O modo
 * explícito guarda os dois eixos inteiros e diz em palavras o que está
 * acontecendo, em vez de esperar que o dedo descubra sozinho.
 *
 * O desenho do ajuste vem do problema: ali a foto aparece INTEIRA, e nunca
 * cortada. Uma prévia já cortada esconderia justamente a parte que a pessoa
 * está tentando trazer de volta, e ela ficaria arrastando às cegas. Sobre a
 * foto inteira vão duas marcas: o retângulo do que cabe na moldura do celular,
 * e o ponto escolhido, que é o que aparece em toda moldura.
 */

/** A moldura da capa no celular, que é a mais estreita das duas. */
const MOLDURA = 16 / 9;

const CENTRO: Foco = { x: 50, y: 50 };
const PASSO = 5;

export function FocoDaCapa({
  src,
  alt,
  inicial,
  /** Envio em andamento no cartão: enquanto ele corre, o ponto fica parado. */
  ocupado,
}: {
  src: string;
  alt: string;
  inicial: Foco | null;
  ocupado: boolean;
}) {
  const router = useRouter();
  /*
   * A medida vem do quadro da foto, e não da caixa 16 por 9 em volta dela.
   *
   * A foto aparece inteira, então sobra faixa vazia de um dos lados sempre que
   * ela tem outra proporção. Medir a caixa faria o ponto marcado cair fora da
   * foto justamente nas fotos em pé, que são as que mais precisam disto.
   */
  const quadro = useRef<HTMLSpanElement>(null);
  const foto = useRef<HTMLImageElement>(null);
  const alvo = useRef<HTMLButtonElement>(null);
  const [foco, setFoco] = useState<Foco>(inicial ?? CENTRO);
  const [proporcao, setProporcao] = useState<number | null>(null);
  const [ajustando, setAjustando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const [tom, setTom] = useState<Tom>("repouso");

  /*
   * Qual gravação está valendo agora.
   *
   * Um arraste solta uma gravação por vez que o dedo levanta, e no celular isso
   * acontece de novo antes de a primeira responder. Sem este número, a resposta
   * atrasada da primeira chegaria depois e apagaria o "guardando" da segunda,
   * dizendo pronto para um ponto que ainda está indo.
   */
  const pedido = useRef(0);

  /*
   * A proporção da foto, medida também depois da montagem, e o ponto de partida
   * de cada foto.
   *
   * `onLoad` sozinho perde o caso mais comum desta tela: a imagem que já está
   * no cache do navegador termina de carregar ANTES de o React hidratar, o
   * evento passa antes de existir quem ouvisse, e a medida ficaria nula para
   * sempre. Nula significa quadro de 16 por 9, e aí o ponto marcado num retrato
   * cairia longe de onde o dedo encostou.
   *
   * Foto nova nasce no ponto que veio do servidor, que é o centro para quem
   * acabou de enviar: o ponto anterior era um lugar da foto anterior, e ficar
   * com ele apontaria para o canto errado da que acabou de chegar.
   */
  useEffect(() => {
    const img = foto.current;
    if (img?.complete && img.naturalHeight > 0) {
      setProporcao(img.naturalWidth / img.naturalHeight);
    }
    setFoco(inicial ?? CENTRO);
    setAjustando(false);
    setTom("repouso");
    setRecado(null);
    // A foto é o assunto: trocar de foto recomeça a conversa, e o ponto inicial
    // vem junto dela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  /*
   * Quem entrou no ajuste recebe o quadro embaixo do dedo, e também embaixo do
   * foco do teclado: o botão que abriu o modo vira "Concluir", e sem esta linha
   * quem navega por teclado abriria o ajuste e continuaria parado na saída dele,
   * com as setas indo para a rolagem da página em vez de para o ponto.
   */
  useEffect(() => {
    if (ajustando) alvo.current?.focus({ preventScroll: true });
  }, [ajustando]);

  async function guardar(novo: Foco) {
    const meu = ++pedido.current;
    setTom("andamento");
    setRecado("Guardando o ponto da capa.");

    const resposta = await salvarFocoDaCapa(novo.x, novo.y);
    if (meu !== pedido.current) return;

    setTom(resposta.ok ? "pronto" : "recusa");
    setRecado(
      resposta.ok ? "Ponto da capa guardado na sua página." : resposta.motivo,
    );
    if (resposta.ok) router.refresh();
  }

  function mover(evento: { clientX: number; clientY: number }) {
    const caixa = quadro.current?.getBoundingClientRect();
    if (!caixa || caixa.width === 0 || caixa.height === 0) return CENTRO;
    const novo = {
      x: limitarFoco(((evento.clientX - caixa.left) / caixa.width) * 100),
      y: limitarFoco(((evento.clientY - caixa.top) / caixa.height) * 100),
    };
    setFoco(novo);
    return novo;
  }

  /*
   * O retângulo do que cabe na moldura do celular, em porcentagem da foto.
   *
   * É a mesma conta que o `object-cover` faz: o lado que sobra é o que
   * encolhe, e o ponto escolhido decide de que parte dele o corte sai. Foto
   * mais deitada que a moldura perde das laterais; foto em pé perde de cima e
   * de baixo.
   */
  const corte =
    proporcao === null
      ? null
      : proporcao > MOLDURA
        ? {
            largura: (MOLDURA / proporcao) * 100,
            altura: 100,
            esquerda: (foco.x * (100 - (MOLDURA / proporcao) * 100)) / 100,
            topo: 0,
          }
        : {
            largura: 100,
            altura: (proporcao / MOLDURA) * 100,
            esquerda: 0,
            topo: (foco.y * (100 - (proporcao / MOLDURA) * 100)) / 100,
          };

  /*
   * A faixa fica ACIMA do quadro enquanto o ajuste acontece.
   *
   * É onde a mão que está arrastando deixa ver. Embaixo do quadro, que é onde
   * ela mora em repouso, a própria mão cobre a resposta no celular, e foi assim
   * que a dona da página mandou a foto e ficou sem saber se tinha guardado.
   */
  const faixa =
    recado === null ? null : (
      <FaixaDeRecado tom={tom} className={ajustando ? "mb-2" : "mt-2"}>
        {recado}
      </FaixaDeRecado>
    );

  return (
    <div>
      {ajustando ? faixa : null}

      {ajustando ? (
        <button
          ref={alvo}
          type="button"
          disabled={ocupado}
          aria-label={`Ponto da capa que aparece na página, a ${foco.x}% da largura e ${foco.y}% da altura da foto. Arraste, ou use as setas do teclado.`}
          className="relative flex w-full touch-none items-center justify-center overflow-hidden rounded-lg border border-borda bg-fundo"
          style={{ aspectRatio: "16 / 9" }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setArrastando(true);
            mover(e);
          }}
          onPointerMove={(e) => {
            if (arrastando) mover(e);
          }}
          onPointerUp={(e) => {
            setArrastando(false);
            void guardar(mover(e));
          }}
          onKeyDown={(e) => {
            const passos: Record<string, [number, number]> = {
              ArrowLeft: [-PASSO, 0],
              ArrowRight: [PASSO, 0],
              ArrowUp: [0, -PASSO],
              ArrowDown: [0, PASSO],
            };
            const passo = passos[e.key];
            if (!passo) return;
            e.preventDefault();
            const novo = {
              x: limitarFoco(foco.x + passo[0]),
              y: limitarFoco(foco.y + passo[1]),
            };
            setFoco(novo);
            void guardar(novo);
          }}
        >
          {/*
            O quadro tem a proporção da foto, e é dentro dele que o ponto e o
            retângulo se posicionam em porcentagem. O lado maior encosta na caixa
            e o outro sobra em faixa, que é o que faz a foto aparecer inteira.
          */}
          <span
            ref={quadro}
            className="pointer-events-none relative block"
            style={
              proporcao !== null && proporcao < MOLDURA
                ? { height: "100%", aspectRatio: String(proporcao) }
                : { width: "100%", aspectRatio: String(proporcao ?? MOLDURA) }
            }
          >
            {/*
              A foto inteira, e nunca cortada: é ela que a pessoa está olhando
              para decidir o ponto. Imagem crua em vez de next/image porque a
              fonte aqui é ora um blob: do próprio navegador, ora o endereço do
              Storage, que é a mesma razão escrita no cartão de envio.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={foto}
              src={src}
              alt={alt}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalHeight > 0) {
                  setProporcao(img.naturalWidth / img.naturalHeight);
                }
              }}
              className="absolute inset-0 h-full w-full object-contain"
            />

            {corte ? (
              <span
                aria-hidden
                /*
                  O que fica de fora da moldura continua visível, e só perde a
                  luz: apagar de vez esconderia da pessoa a parte da foto que ela
                  pode trazer de volta arrastando o ponto.
                */
                className="absolute rounded-[3px] shadow-[0_0_0_9999px_rgba(28,25,23,0.45)]"
                style={{
                  outline: "2px solid rgba(255,255,255,0.9)",
                  left: `${corte.esquerda}%`,
                  top: `${corte.topo}%`,
                  width: `${corte.largura}%`,
                  height: `${corte.altura}%`,
                }}
              />
            ) : null}

            <span
              aria-hidden
              className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-destaque/80 shadow-[0_1px_4px_rgba(28,25,23,0.5)]"
              style={{ left: `${foco.x}%`, top: `${foco.y}%` }}
            />
          </span>
        </button>
      ) : (
        /*
          Em repouso, a capa é a capa: o mesmo corte que a página pública mostra,
          com o ponto gravado já aplicado. Nada aqui escuta toque, então o dedo
          que passa por cima rola a tela.
        */
        <div
          className="w-full overflow-hidden rounded-lg border border-borda bg-fundo"
          style={{ aspectRatio: "16 / 9" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={foto}
            src={src}
            alt={alt}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight > 0) {
                setProporcao(img.naturalWidth / img.naturalHeight);
              }
            }}
            className="h-full w-full object-cover"
            style={{ objectPosition: posicaoDoFoco(foco) }}
          />
        </div>
      )}

      {/*
        A linha de ação embaixo do quadro.

        Em repouso é uma porta só, "Ajustar o enquadramento", com a frase que
        diz o que está à vista. No ajuste ela vira "Concluir", que é a saída, e
        "Centralizar o ponto", que é o desfazer.

        Centralizar é ação de texto, e não mais um botão de pílula. Ele estava
        desenhado igual ao "Trocar imagem" e ao "Remover" do cartão, e caía
        encostado na borda direita uma linha acima deles, que estão encostados
        na esquerda: duas pílulas do mesmo peso em bordas opostas, em linhas
        seguidas. Voltar o ponto para o meio é desfazer, e desfazer é ação
        secundária. Como texto ele para de disputar com a linha de baixo, e o
        alvo continua com os 44 de altura: o respiro vem de dentro e a margem
        negativa devolve o alinhamento, que é o mesmo arranjo do "Voltar" do
        painel.
      */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => setAjustando((antes) => !antes)}
          className={`flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-borda px-4 text-sm font-semibold transition-transform duration-75 active:scale-[0.97] ${
            ocupado
              ? "bg-fundo text-suave"
              : ajustando
                ? "bg-texto text-superficie"
                : "bg-superficie text-texto"
          }`}
        >
          {ajustando ? "Concluir" : "Ajustar o enquadramento"}
        </button>

        {ajustando ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => {
              setFoco(CENTRO);
              void guardar(CENTRO);
            }}
            className="-mx-2 flex min-h-11 shrink-0 items-center px-2 text-sm font-semibold text-texto underline decoration-borda underline-offset-4 transition-colors hover:decoration-texto disabled:text-suave"
          >
            Centralizar o ponto
          </button>
        ) : null}
      </div>

      {/*
        A frase mora numa linha só dela, e não ao lado do botão: no celular a
        largura que sobrava ao lado da pílula deixava a explicação em cinco
        linhas de três palavras, medido no iPhone 13.
      */}
      <p className="mt-2 text-xs leading-relaxed text-suave">
        {ajustando
          ? "Arraste o ponto para o que precisa aparecer. A área clara é o corte do celular."
          : "A capa aparece assim na sua página. O ajuste escolhe o que fica dentro do corte."}
      </p>

      {ajustando ? null : faixa}
    </div>
  );
}
