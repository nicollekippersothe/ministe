"use client";

import { useEffect, useRef, useState } from "react";
import { CampoAbertura } from "@/componentes/inicial/CampoAbertura";

/**
 * O herói que se monta ao vivo.
 *
 * A placa escreve um endereço, letra a letra, e o celular ao lado mostra
 * exatamente a página daquele endereço. Termina de escrever, segura um instante
 * com os dois à vista (o endereço pronto e a página acesa, que é o momento em
 * que a promessa fecha), apaga, e desliza para a próxima. "Seu nome vira a sua
 * página", dito em movimento em vez de em texto.
 *
 * A placa e o celular são uma coisa só: este componente é dono do índice e do
 * relógio. Passa a dica para a placa e o deslize para o trilho, e os dois nunca
 * saem de sincronia porque saem da mesma contagem. Os aparelhos chegam prontos
 * do servidor como children (os componentes de verdade, com os dados de
 * verdade); aqui desce só o controle.
 *
 * Para de vez no instante em que a pessoa assume a placa (foco ou primeira
 * tecla): a página fica na que estava, a placa volta ao "seunome" e some da
 * frente. Segura enquanto o ponteiro está sobre o herói, que é quando a pessoa
 * está olhando de propósito. E não roda para quem pediu menos movimento no
 * sistema: ali o herói nasce com a primeira página à vista e a placa parada.
 */
export function HeroDemo({
  slugs,
  legendas,
  rotulo,
  cabecalho,
  children,
}: {
  /** O endereço de cada página, na ordem dos aparelhos. slugs[i] é o de children[i]. */
  slugs: string[];
  /** A legenda de parede de cada obra: nome de quem assina e o ofício. */
  legendas: { nome: string; tipo: string }[];
  rotulo: string;
  /** Sobrescrita, título e apoio, montados no servidor e servidos aqui em cima da placa. */
  cabecalho: React.ReactNode;
  /** Os aparelhos, um por página, prontos do servidor. */
  children: React.ReactNode;
}) {
  const quadros = Array.isArray(children) ? children : [children];
  const total = quadros.length;

  const [atual, setAtual] = useState(0);
  const [dica, setDica] = useState(slugs[0] ?? "seunome");

  // O ponteiro em cima segura a demonstração; a pessoa assumiu a placa encerra
  // de vez. Refs, e não estado, porque quem os lê é o relógio dentro do efeito,
  // e mudá-los não deve religar o efeito nem repintar a tela.
  const pausado = useRef(false);
  const encerrado = useRef(false);

  function encerrar() {
    encerrado.current = true;
    setDica("seunome");
  }

  useEffect(() => {
    if (total < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0; // exemplo à vista
    let n = 0; // letras já escritas do endereço

    // Agenda o próximo passo, mas só o executa quando a demonstração está livre:
    // encerrada para sempre; parada, tenta de novo daqui a pouco.
    const agenda = (fn: () => void, ms: number) => {
      timer = setTimeout(() => {
        if (!vivo || encerrado.current) return;
        if (pausado.current) {
          agenda(fn, 320);
          return;
        }
        fn();
      }, ms);
    };

    const digitar = () => {
      const alvo = slugs[i] ?? "";
      n++;
      setDica(alvo.slice(0, n));
      if (n < alvo.length) agenda(digitar, 90);
      else agenda(apagar, 1700); // segura com o endereço pronto e a página à vista
    };

    const apagar = () => {
      const alvo = slugs[i] ?? "";
      n--;
      setDica(n > 0 ? alvo.slice(0, n) : "");
      if (n > 0) agenda(apagar, 45);
      else agenda(trocar, 300);
    };

    const trocar = () => {
      i = (i + 1) % total;
      n = 0;
      setAtual(i); // o celular desliza para a página deste endereço
      agenda(digitar, 620); // deixa a página nova chegar, então escreve o endereço dela
    };

    // A primeira página já está à vista e a placa já mostra o primeiro endereço
    // inteiro. Deixa a entrada assentar, apaga esse primeiro e segue o ciclo, para
    // a escrita começar do zero à vista de quem chegou.
    n = slugs[0]?.length ?? 0;
    agenda(apagar, 1300);

    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [slugs, total]);

  const legenda = legendas[atual];

  return (
    <div
      onMouseEnter={() => {
        pausado.current = true;
      }}
      onMouseLeave={() => {
        pausado.current = false;
      }}
    >
      <div className="mx-auto max-w-2xl text-center">
        {cabecalho}
        <div
          className="acende mx-auto mt-8 max-w-xl"
          style={{ "--atraso": "320ms" } as React.CSSProperties}
        >
          <p className="mb-3 text-[1.05rem] font-semibold tracking-[-0.015em] text-texto">
            Reserve o seu endereço
          </p>
          <CampoAbertura rotulo={rotulo} dica={dica} onEngajar={encerrar} />
        </div>
      </div>

      {/*
        A obra na parede: o aparelho pendurado no centro, com a própria sombra
        fazendo o foco de luz da galeria. Nada de painel nem de brilho atrás,
        porque na parede branca quem tem cor é a obra. Desliza, não desaparece:
        empilhar duas superfícies opacas e cruzar a opacidade delas nunca fica
        limpo, porque o fundo aparece no meio. Deslizando, cada página está
        sempre inteira ou fora de vista.
      */}
      <div
        className="acende relative mx-auto mt-14 w-full max-w-[18rem]"
        style={{ "--atraso": "440ms" } as React.CSSProperties}
      >
        <div className="overflow-hidden pt-3 pb-4">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(-${atual * 100}%)` }}
          >
            {quadros.map((quadro, i) => (
              <div
                key={i}
                className="w-full shrink-0"
                inert={i === atual ? undefined : true}
              >
                {quadro}
              </div>
            ))}
          </div>
        </div>

        {/*
          A legenda de parede: nome de quem assina e o ofício, como a plaquinha
          ao pé de uma obra numa mostra. Troca junto com a página, sem piscar. O
          aria-live avisa o leitor de tela da troca de obra, que de outro jeito
          seria muda, já que os aparelhos são decorativos.
        */}
        {legenda ? (
          <p
            className="mt-5 text-center text-[0.82rem] leading-snug"
            aria-live="polite"
          >
            <span className="font-semibold text-texto">{legenda.nome}</span>
            <span className="text-suave"> · {legenda.tipo}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
