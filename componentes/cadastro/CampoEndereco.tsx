"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { conferirFormato, MOTIVOS, normalizar } from "@/lib/slug";

type Estado = "vazio" | "conferindo" | "livre" | "ocupado";

/**
 * O link da página, nascendo do nome enquanto a pessoa escreve.
 *
 * É o único pedaço do produto que roda no navegador. A página pública não
 * carrega nada disto.
 *
 * **O link é derivado, e a linha continua editável.** Enquanto ninguém mexer
 * aqui, o valor sai de `derivarDe`, que é o nome digitado logo acima, passado
 * pela mesma `normalizar` de lib/slug.ts que o servidor usa no envio. A
 * primeira tecla digitada nesta linha encerra a derivação: quem escolheu o
 * próprio link fica com ele, e a tecla seguinte no nome deixa de apagar o que
 * a pessoa acabou de escrever.
 *
 * Antes esta era a pergunta 3, com enunciado numerado e um campo em branco de
 * 55px, e a pessoa escrevia à mão uma coisa que o nome logo acima já dizia.
 * Linktree e Beacons entregam a página com link no instante em que a conta
 * nasce. Aqui ele nasce junto com o nome, na linha debaixo.
 *
 * O domínio fica na linha de baixo, e continua fora da caixa. Dentro dela ele
 * comeria espaço de digitação no celular, e diria uma mentira nos segundos em
 * que a pessoa escreve à mão: a caixa guarda o que foi digitado, com espaço e
 * maiúscula, e o link de verdade é o da linha de baixo, já limpo. As duas
 * linhas juntas mostram uma virando a outra.
 *
 * Com `recusa`, a resposta do servidor já abre escrita embaixo do campo, no
 * mesmo lugar onde a conferência do navegador escreve. Antes ela aparecia lá
 * embaixo, colada no botão, e no celular ficava fora da tela: a pessoa voltava
 * de um envio recusado sem ver motivo nenhum.
 */
export function CampoEndereco({
  inicial = "",
  derivarDe = "",
  recusa = null,
  aoMudar,
}: {
  inicial?: string;
  /**
   * O nome digitado na pergunta de cima, de onde o link sai enquanto esta
   * linha continuar intocada.
   */
  derivarDe?: string;
  /** O motivo que o servidor devolveu para este link, já em português. */
  recusa?: string | null;
  /**
   * O link já limpo, para a prévia do cadastro acompanhar. O segundo
   * argumento diz se ele foi escrito à mão, que é o que decide se vale a pena
   * guardar: link derivado renasce do nome guardado.
   */
  aoMudar?: (slug: string, proprio: boolean) => void;
}) {
  const id = useId();

  /*
   * Quem escreve o link agora: a pessoa, ou o nome dela.
   *
   * Começa na pessoa quando já existe valor de entrada, porque aí ele veio de
   * uma escolha anterior: o envio que o servidor recusou, ou a resposta
   * guardada da vez passada. Passar a derivar por cima disso apagaria a
   * escolha na primeira tecla do nome.
   */
  const [proprio, setProprio] = useState(inicial !== "");
  const [digitado, setDigitado] = useState(inicial);
  const [estado, setEstado] = useState<Estado>(recusa ? "ocupado" : "vazio");
  const [motivo, setMotivo] = useState<string | null>(recusa);

  /*
   * O link que o servidor recusou, guardado para a conferência do navegador
   * deixar a resposta dele em pé.
   *
   * Sem isto, o efeito de baixo rodava na montagem, perguntava de novo pelo
   * mesmo link e apagava o motivo: a pessoa voltava de um envio recusado para
   * um campo verde, sem saber por que voltou. A trava compara valores em vez
   * de contar visitas de propósito, porque em desenvolvimento o React roda
   * cada efeito duas vezes, e uma trava de uma vez só cairia na segunda.
   */
  const recusado = useRef<string | null>(
    recusa === null ? null : normalizar(inicial),
  );

  const valor = proprio ? digitado : normalizar(derivarDe);
  const slug = normalizar(valor);

  useEffect(() => {
    aoMudar?.(slug, proprio);
    // aoMudar fica de fora: quem chama define a função no corpo do componente,
    // então ela é nova a cada render e entraria em laço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, proprio]);

  useEffect(() => {
    if (recusado.current !== null && slug === recusado.current) return;

    if (slug === "") {
      setEstado("vazio");
      setMotivo(null);
      return;
    }

    const problema = conferirFormato(slug);
    if (problema) {
      /*
       * Link pela metade fica quieto.
       *
       * Derivado do nome, o link passa por "a" e "at" antes de chegar em
       * "atelie": acender a borda vermelha e cobrar três letras na segunda
       * tecla do nome seria a tela reclamando de uma resposta que a pessoa
       * está no meio de dar. Escrito à mão, o mesmo aviso é útil, porque ali
       * a pessoa já decidiu o que queria escrever.
       */
      if (!proprio && problema === "curto") {
        setEstado("vazio");
        setMotivo(null);
        return;
      }
      setEstado("ocupado");
      setMotivo(MOTIVOS[problema]);
      return;
    }

    setEstado("conferindo");
    setMotivo(null);

    /*
     * A espera de 350ms é o que separa "confere ao vivo" de "uma consulta por
     * letra". Ela vale ainda mais agora que o link nasce do nome: escrever
     * "Ateliê da Nicolle" mexe neste efeito dezessete vezes, e o navegador
     * pergunta uma só, quando a pessoa para de digitar. Cada rodada nova
     * cancela a anterior, no relógio e no pedido.
     */
    const cancelar = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const r = await fetch(`/api/endereco?slug=${encodeURIComponent(slug)}`, {
          signal: cancelar.signal,
        });
        const dados = await r.json();
        setEstado(dados.livre ? "livre" : "ocupado");
        setMotivo(dados.motivo);
      } catch {
        // Sem internet ou pedido cancelado. O servidor confere de novo no envio.
        setEstado("vazio");
      }
    }, 350);

    return () => {
      clearTimeout(espera);
      cancelar.abort();
    };
  }, [slug, proprio]);

  /*
   * Link em uso é a única recusa que pode significar "essa página já é sua", e
   * é onde a porta de entrada precisa estar.
   *
   * Foi o pedido escrito da dona do produto, com a captura do Beacons do lado:
   * lá o campo de usuário, o botão e o "já tem conta? entrar" moram no mesmo
   * cartão, um embaixo do outro. Aqui a porta aparece colada no motivo, no
   * momento exato em que a pessoa descobre que alguém já tem o link que ela
   * escolheu, que costuma ser ela mesma de outro aparelho.
   *
   * Só neste motivo. Link reservado, palavra restrita e formato errado são
   * problema de escolha de nome, e oferecer login ali seria ruído.
   */
  const talvezSeja = estado === "ocupado" && motivo === MOTIVOS.ocupado;

  const borda =
    estado === "livre"
      ? "border-aberto-texto"
      : estado === "ocupado"
        ? "border-destaque"
        : "border-borda focus-within:border-texto";

  return (
    <div className="mt-5">
      {/*
        Rótulo de linha, e nunca mais um enunciado numerado. O peso desta
        resposta caiu junto com o trabalho que ela dá: ela já vem respondida, e
        o que sobra é conferir e, se a pessoa quiser, trocar.
      */}
      <label
        htmlFor={id}
        className="block text-[0.95rem] font-medium text-suave"
      >
        O link da sua página
      </label>

      <input
        id={id}
        name="slug"
        value={valor}
        onChange={(e) => {
          setProprio(true);
          setDigitado(e.target.value);
          recusado.current = null;
        }}
        aria-describedby={`${id}-estado`}
        aria-invalid={estado === "ocupado"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        /*
         * Voltando de um envio recusado, o cursor já nasce aqui. Sem isso a
         * pessoa caía no topo da página e o motivo ficava 1129px abaixo, fora
         * da tela do celular: ela via o formulário preenchido e nenhuma pista
         * do que aconteceu. O foco traz a linha para a tela e deixa o campo
         * pronto para ser corrigido. Vale sem JavaScript também, porque o
         * atributo sai escrito no HTML.
         */
        autoFocus={recusa !== null}
        /*
         * O exemplo de dentro da caixa é o que a pessoa digita, e o da linha
         * de baixo é o que ela recebe: "camila reis" com espaço e minúscula
         * virando entrais.app/camila-reis. Escrever os dois iguais apagaria
         * justamente a demonstração de um virando o outro.
         */
        placeholder="camila reis"
        /*
         * Duas classes que valem por uma decisão cada.
         *
         * placeholder:text-suave/70 é a cor de exemplo do campo de busca. Sem
         * ela o navegador escolhe a própria, mais escura, e o exemplo passava
         * por valor já digitado: o campo parecia preenchido e a pessoa seguia
         * em frente.
         *
         * scroll-mb deixa a barra do botão fora do caminho quando o navegador
         * traz o campo focado para a tela. Aqui a folga é maior que a do campo
         * de nome porque abaixo do campo ainda vêm duas linhas que precisam ser
         * lidas: o link conferido e, quando ele já é de alguém, a porta de
         * entrar. Com os 96px de antes elas nasciam debaixo da barra.
         */
        className={`mt-2 w-full scroll-mb-56 rounded-2xl border bg-superficie px-4 py-3.5 text-[1.05rem] text-texto placeholder:text-suave/70 outline-none ${borda}`}
      />

      <p
        id={`${id}-estado`}
        aria-live="polite"
        className="mt-2.5 flex min-h-6 flex-wrap items-center gap-x-2 text-sm"
      >
        {slug === "" ? (
          <span className="text-suave">
            exemplo:{" "}
            <span className="font-medium">{DOMINIO_PUBLICO}/camila-reis</span>
          </span>
        ) : (
          <>
            <span className="font-medium break-all text-texto">
              {DOMINIO_PUBLICO}/{slug}
            </span>
            {estado === "conferindo" ? (
              <span className="text-suave">conferindo...</span>
            ) : null}
            {estado === "livre" ? (
              <span className="inline-flex items-center gap-1 font-medium text-aberto-texto">
                <Certo />
                disponível
              </span>
            ) : null}
            {estado === "ocupado" ? (
              <span className="text-destaque">{motivo}</span>
            ) : null}
          </>
        )}
      </p>

      {talvezSeja ? (
        <p className="mt-0.5 text-sm text-suave">
          Esse link é seu?{" "}
          <Link
            href="/entrar"
            className="inline-flex min-h-11 items-center px-1 font-medium text-destaque underline underline-offset-4"
          >
            Entrar
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/**
 * O visto da placa de disponível. Desenho próprio, do tamanho da letra ao
 * lado, pela regra 2 do AGENTS.md: ícone aqui é vetor, e emoji fica de fora.
 */
function Certo() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
