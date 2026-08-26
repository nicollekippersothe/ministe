"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { conferirFormato, MOTIVOS, normalizar } from "@/lib/slug";
import { Pergunta } from "./Pergunta";

type Estado = "vazio" | "conferindo" | "livre" | "ocupado";

/**
 * O único pedaço do produto que roda no navegador.
 *
 * Escolher o endereço é o momento de maior atrito do cadastro: a pessoa
 * digita, envia, descobre que já era, e volta. Conferir enquanto ela digita
 * economiza essa ida e volta. A página pública não carrega nada disto.
 *
 * O domínio fica numa linha própria embaixo, e não colado dentro do campo:
 * no celular o prefixo dentro do campo come metade do espaço de digitação e
 * o texto acaba cortado no meio.
 *
 * Essa linha de baixo é também onde mora o exemplo. Antes ela dizia "Vai
 * ficar em entrais.app/" e terminava numa barra solta, enquanto o exemplo do
 * endereço vivia como texto de espera dentro da caixa, 65px acima: eram duas
 * metades da mesma frase separadas pelo campo. Agora a linha mostra o
 * endereço inteiro do exemplo, e ela é a mesma linha que passa a mostrar o
 * endereço de verdade na primeira letra digitada.
 *
 * Com `recusa`, a resposta do servidor já abre escrita embaixo do campo, no
 * mesmo lugar onde a conferência do navegador escreve. Antes ela aparecia lá
 * embaixo, colada no botão, e no celular ficava fora da tela: a pessoa voltava
 * de um envio recusado sem ver motivo nenhum.
 */
export function CampoEndereco({
  inicial = "",
  recusa = null,
  aoMudar,
}: {
  inicial?: string;
  /** O motivo que o servidor devolveu para este endereço, já em português. */
  recusa?: string | null;
  /** O endereço já limpo, para a prévia do cadastro acompanhar. */
  aoMudar?: (slug: string) => void;
}) {
  const id = useId();
  const [valor, setValor] = useState(inicial);
  const [estado, setEstado] = useState<Estado>(recusa ? "ocupado" : "vazio");
  const [motivo, setMotivo] = useState<string | null>(recusa);

  /*
   * O endereço que o servidor recusou, guardado para a conferência do navegador
   * deixar a resposta dele em pé.
   *
   * Sem isto, o efeito de baixo rodava na montagem, perguntava de novo pelo
   * mesmo endereço e apagava o motivo: a pessoa voltava de um envio recusado
   * para um campo verde, sem saber por que voltou. A trava compara endereços em
   * vez de contar visitas de propósito, porque em desenvolvimento o React roda
   * cada efeito duas vezes, e uma trava de uma vez só cairia na segunda.
   */
  const recusado = useRef<string | null>(
    recusa === null ? null : normalizar(inicial),
  );

  const slug = normalizar(valor);

  useEffect(() => {
    aoMudar?.(slug);
    // aoMudar fica de fora: quem chama define a função no corpo do componente,
    // então ela é nova a cada render e entraria em laço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (recusado.current !== null && slug === recusado.current) return;

    if (slug === "") {
      setEstado("vazio");
      setMotivo(null);
      return;
    }

    const problema = conferirFormato(slug);
    if (problema) {
      setEstado("ocupado");
      setMotivo(MOTIVOS[problema]);
      return;
    }

    setEstado("conferindo");
    setMotivo(null);

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
  }, [slug]);

  /*
   * Endereço em uso é a única recusa que pode significar "essa página já é
   * sua", e é onde a porta de entrada precisa estar.
   *
   * Foi o pedido escrito da dona do produto, com a captura do Beacons do lado:
   * lá o campo de usuário, o botão e o "já tem conta? entrar" moram no mesmo
   * cartão, um embaixo do outro. Aqui a porta aparece colada no motivo, no
   * momento exato em que a pessoa descobre que alguém já tem o endereço que ela
   * escolheu, que costuma ser ela mesma de outro aparelho.
   *
   * Só neste motivo. Endereço reservado, palavra restrita e formato errado são
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
    <div>
      <label htmlFor={id}>
        <Pergunta numero={3}>Qual vai ser o endereço?</Pergunta>
      </label>

      <input
        id={id}
        name="slug"
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
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
         * lidas: o endereço conferido e, quando ele já é de alguém, a porta de
         * entrar. Com os 96px de antes elas nasciam debaixo da barra.
         */
        className={`mt-4 w-full scroll-mb-56 rounded-2xl border bg-superficie px-4 py-3.5 text-[1.05rem] text-texto placeholder:text-suave/70 outline-none ${borda}`}
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
              <span className="font-medium text-aberto-texto">disponível</span>
            ) : null}
            {estado === "ocupado" ? (
              <span className="text-destaque">{motivo}</span>
            ) : null}
          </>
        )}
      </p>

      {talvezSeja ? (
        <p className="mt-0.5 text-sm text-suave">
          Esse endereço é seu?{" "}
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
