"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { salvarFocoDaCapa } from "@/app/painel/acoes";
import { limitarFoco } from "@/lib/supabase/imagens";
import type { Foco } from "@/lib/tipos";

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
 * O desenho da tela vem daí: aqui a foto aparece INTEIRA, e nunca cortada. Uma
 * prévia já cortada esconderia justamente a parte que a pessoa está tentando
 * trazer de volta, e ela ficaria arrastando às cegas. Sobre a foto inteira vão
 * duas marcas: o retângulo do que cabe na moldura do celular, e o ponto
 * escolhido, que é o que aparece em toda moldura.
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
  const [foco, setFoco] = useState<Foco>(inicial ?? CENTRO);
  const [proporcao, setProporcao] = useState<number | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  async function guardar(novo: Foco) {
    const resposta = await salvarFocoDaCapa(novo.x, novo.y);
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

  return (
    <div>
      <button
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

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-suave">
          Arraste o ponto para o que precisa aparecer. A área clara é o corte do
          celular.
        </p>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            setFoco(CENTRO);
            void guardar(CENTRO);
          }}
          className="flex h-11 items-center justify-center rounded-full border border-borda bg-superficie px-4 text-sm font-semibold text-texto transition-transform duration-75 active:scale-[0.97] disabled:text-suave"
        >
          Centralizar
        </button>
      </div>

      {/*
        Sai como texto de verdade, e não só para o leitor de tela: quando a
        gravação é recusada, a frase é o único sinal de que o ponto arrastado
        continua guardado só nesta tela.
      */}
      <p aria-live="polite" className="text-xs leading-relaxed text-suave">
        {recado ? <span className="mt-1 block">{recado}</span> : null}
      </p>
    </div>
  );
}
