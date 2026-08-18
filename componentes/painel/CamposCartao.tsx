"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

/**
 * Os três campos do cartão, que são iframes do Mercado Pago dentro das nossas
 * div.
 *
 * O número do cartão nunca toca o nosso servidor: quem recebe o que a pessoa
 * digita é um documento de outra origem, e o que chega até nós é um token
 * descartável. É isso que mantém o projeto em PCI SAQ-A, um formulário de
 * autoavaliação, em vez de SAQ-D, com pentest e varredura trimestral.
 *
 * A tela em volta é inteiramente nossa: borda, fundo, raio, respiro e foco
 * saem dos mesmos tokens do resto do painel. O que atravessa a fronteira do
 * iframe é só a tipografia, e ela precisa atravessar como valor resolvido, e
 * nunca como `var(--c-texto)`: lá dentro é outro documento, e a variável não
 * existe.
 *
 * As frases chegam prontas do servidor, de propósito. Assim `lib/pagamento`
 * fica fora do pacote que o navegador baixa, e o texto continua vindo de
 * `MOTIVOS_PAGAMENTO`, que é onde ele mora e onde o teste o guarda.
 */

const NUMERO = "campo-numero";
const VALIDADE = "campo-validade";
const CODIGO = "campo-codigo";

/** Quanto esperar o SDK antes de desistir dele. */
const LIMITE_DO_SDK_MS = 8000;

type CampoSeguro = {
  mount: (idDoElemento: string) => CampoSeguro;
  unmount: () => void;
  on: (evento: string, retorno: (e: unknown) => void) => CampoSeguro;
};

type SdkMercadoPago = {
  fields: {
    create: (
      tipo: "cardNumber" | "expirationDate" | "securityCode",
      opcoes: Record<string, unknown>,
    ) => CampoSeguro;
    createCardToken: (dados: {
      cardholderName: string;
      identificationType?: string;
      identificationNumber?: string;
    }) => Promise<{ id?: string }>;
  };
};

declare global {
  interface Window {
    MercadoPago?: new (
      chave: string,
      opcoes?: { locale?: string },
    ) => SdkMercadoPago;
  }
}

export type FrasesDoCartao = {
  /** Vem de `mensagemDeRecusa("dados_incompletos")`. */
  dadosIncompletos: string;
  /** O que dizer quando o SDK do Mercado Pago fica fora de alcance. */
  semSdk: string;
};

type Etapa = "carregando" | "pronto" | "enviando" | "fora";

/** O valor resolvido de um token, lido do elemento da própria tela. */
function valorDe(no: Element | null, nome: string, reserva: string): string {
  if (!no) return reserva;
  const v = getComputedStyle(no).getPropertyValue(nome).trim();
  return v === "" ? reserva : v;
}

/**
 * O estilo que atravessa para dentro dos iframes.
 *
 * Lido do elemento da tela, e nunca do `documentElement`: o painel põe o tema
 * numa div, então o dia em que existir um segundo tema o `:root` responderia o
 * do tema padrão.
 *
 * Os dois primeiros valores são regra, e não gosto. `16px` porque abaixo disso
 * o Safari do iPhone dá zoom ao focar o campo, e a tela inteira pula. `24px`
 * porque é a altura da div de montagem, então o texto fica centrado sem
 * depender de respiro por dentro do iframe.
 */
function estiloDosCampos(no: Element | null) {
  return {
    "font-size": "16px",
    "line-height": "24px",
    "font-family": valorDe(no, "--f-sistema", "system-ui, sans-serif"),
    color: valorDe(no, "--c-texto", "#1c1917"),
    placeholderColor: valorDe(no, "--c-suave", "#736c67"),
  };
}

/**
 * Os iframes do Mercado Pago chegam sem nome.
 *
 * A regra `frame-title` do axe cai em cima disso, e é uma das que o Lighthouse
 * roda. Como o nome vem depois de montar, ele é escrito na mão.
 */
function nomearIframes() {
  const nomes: Array<[string, string]> = [
    [NUMERO, "Número do cartão"],
    [VALIDADE, "Validade"],
    [CODIGO, "Código de segurança"],
  ];
  for (const [id, titulo] of nomes) {
    document
      .getElementById(id)
      ?.querySelector("iframe")
      ?.setAttribute("title", titulo);
  }
}

export function CamposCartao({
  acao,
  chavePublica,
  ciclo,
  rotuloDoBotao,
  frases,
  caminhoPix,
}: {
  /** A Server Action. Termina em redirect, nos dois desfechos. */
  acao: (dados: FormData) => Promise<void>;
  chavePublica: string;
  /** Viaja pelo endereço e volta pelo formulário: a ação nunca supõe qual é. */
  ciclo: "mensal" | "anual";
  rotuloDoBotao: string;
  frases: FrasesDoCartao;
  /** Para onde mandar quem ficar sem os campos do cartão. */
  caminhoPix: string;
}) {
  const [etapa, setEtapa] = useState<Etapa>("carregando");
  const [foco, setFoco] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const raizRef = useRef<HTMLDivElement>(null);
  const mpRef = useRef<SdkMercadoPago | null>(null);
  const camposRef = useRef<CampoSeguro[]>([]);
  const montadoRef = useRef(false);

  function montarCampos() {
    // A trava existe porque o StrictMode monta o efeito duas vezes em
    // desenvolvimento, e sem ela cada div ganharia dois iframes.
    if (montadoRef.current || !window.MercadoPago) return;

    let mp: SdkMercadoPago;
    try {
      mp = new window.MercadoPago(chavePublica, { locale: "pt-BR" });
    } catch {
      setEtapa("fora");
      return;
    }
    mpRef.current = mp;

    const estilo = estiloDosCampos(raizRef.current);
    const marcar = (campo: CampoSeguro, nome: string) =>
      campo
        .on("focus", () => setFoco(nome))
        .on("blur", () => setFoco((atual) => (atual === nome ? null : atual)));

    try {
      camposRef.current = [
        marcar(
          mp.fields
            .create("cardNumber", {
              placeholder: "0000 0000 0000 0000",
              style: estilo,
            })
            .mount(NUMERO),
          "numero",
        ),
        marcar(
          mp.fields
            .create("expirationDate", { placeholder: "MM/AA", style: estilo })
            .mount(VALIDADE),
          "validade",
        ),
        marcar(
          mp.fields
            .create("securityCode", { placeholder: "000", style: estilo })
            .mount(CODIGO),
          "codigo",
        ),
      ];
    } catch {
      setEtapa("fora");
      return;
    }

    nomearIframes();
    montadoRef.current = true;
    setEtapa("pronto");
  }

  useEffect(() => {
    // O `onError` do Script não é garantido: bloqueador de conteúdo e portal
    // cativo deixam a promessa pendurada, e sem este limite a tela fica em
    // "preparando" para sempre, sem nunca oferecer o Pix.
    const relogio = setTimeout(() => {
      setEtapa((atual) => (atual === "carregando" ? "fora" : atual));
    }, LIMITE_DO_SDK_MS);

    return () => {
      clearTimeout(relogio);
      for (const campo of camposRef.current) {
        try {
          campo.unmount();
        } catch {
          // O iframe já pode ter saído junto com a página.
        }
      }
      camposRef.current = [];
      montadoRef.current = false;
    };
  }, []);

  /**
   * O envio.
   *
   * Função de cliente no `action`, e não `preventDefault` mais
   * `requestSubmit`: o token só existe depois de uma ida e volta ao Mercado
   * Pago, e o React 19 aceita qualquer função assíncrona ali. A Server Action
   * mantém a assinatura que o resto do painel usa, e o `redirect` dela continua
   * valendo quando ela é chamada assim.
   *
   * Ela ganha uma coisa de graça, e é a melhor parte: o nome do titular e o CPF
   * são apagados do FormData antes de cruzar para o servidor. Eles servem ao
   * token e só a ele, e o `/preapproval` do Mercado Pago nem tem onde
   * recebê-los.
   */
  async function enviar(dados: FormData) {
    const mp = mpRef.current;
    if (!mp) {
      setEtapa("fora");
      return;
    }

    setEtapa("enviando");
    setErro(null);

    let token = "";
    try {
      const resposta = await mp.fields.createCardToken({
        cardholderName: String(dados.get("titular") ?? ""),
        identificationType: "CPF",
        identificationNumber: String(dados.get("documento") ?? "").replace(
          /\D/g,
          "",
        ),
      });
      token = resposta?.id ?? "";
    } catch {
      setEtapa("pronto");
      setErro(frases.dadosIncompletos);
      return;
    }

    if (token === "") {
      setEtapa("pronto");
      setErro(frases.dadosIncompletos);
      return;
    }

    dados.delete("titular");
    dados.delete("documento");
    dados.set("tokenDoCartao", token);

    await acao(dados);
    // A ação termina em redirect nos dois desfechos, então esta linha é a rede
    // de segurança para o dia em que ela deixar de terminar.
    setEtapa("pronto");
  }

  if (etapa === "fora") {
    return (
      <p className="mt-4 rounded-xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
        {frases.semSdk}{" "}
        <a
          href={caminhoPix}
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          Pagar com Pix
        </a>
        .
      </p>
    );
  }

  const ocupado = etapa !== "pronto";

  return (
    <div ref={raizRef}>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        // onReady, e nunca onLoad: o onLoad dispara uma vez por script, então
        // sair desta tela e voltar deixaria os campos sem montar para sempre.
        onReady={montarCampos}
        onError={() => setEtapa("fora")}
      />

      <form action={enviar} className="mt-6 flex flex-col gap-5">
        <input type="hidden" name="ciclo" value={ciclo} />

        <CaixaDoCampo
          id={NUMERO}
          rotulo="Número do cartão"
          focado={foco === "numero"}
        />

        <div className="grid grid-cols-2 gap-4">
          <CaixaDoCampo
            id={VALIDADE}
            rotulo="Validade"
            focado={foco === "validade"}
          />
          <CaixaDoCampo
            id={CODIGO}
            rotulo="Código de segurança"
            focado={foco === "codigo"}
          />
        </div>

        <div>
          <label
            htmlFor="titular"
            className="mb-1.5 block text-sm font-medium text-texto"
          >
            Nome impresso no cartão
          </label>
          <input
            id="titular"
            name="titular"
            required
            autoComplete="cc-name"
            className="w-full rounded-xl border border-borda bg-superficie px-3.5 py-3 text-[1rem] text-texto placeholder:text-suave/60"
          />
        </div>

        <div>
          <label
            htmlFor="documento"
            className="mb-1.5 block text-sm font-medium text-texto"
          >
            CPF do titular
          </label>
          <p id="documento-dica" className="mt-0.5 mb-1.5 text-xs leading-relaxed text-suave">
            O banco pede para confirmar quem é o dono do cartão. Ele fica no seu
            navegador e vai direto para o Mercado Pago.
          </p>
          <input
            id="documento"
            name="documento"
            required
            inputMode="numeric"
            aria-describedby="documento-dica"
            className="w-full rounded-xl border border-borda bg-superficie px-3.5 py-3 text-[1rem] text-texto placeholder:text-suave/60"
          />
        </div>

        {erro ? (
          <p
            role="alert"
            className="rounded-xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm leading-relaxed text-destaque"
          >
            {erro}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={ocupado}
          className="h-13 w-full rounded-full bg-texto text-[1.05rem] font-medium text-superficie disabled:opacity-60"
        >
          {etapa === "carregando"
            ? "Preparando os campos"
            : etapa === "enviando"
              ? "Enviando para o banco"
              : rotuloDoBotao}
        </button>
      </form>
    </div>
  );
}

/**
 * A moldura de um campo seguro.
 *
 * O rótulo é `span` e não `label`, porque `htmlFor` alcança elemento de jeito
 * nenhum quando ele mora dentro de um iframe de outra origem. Quem faz o
 * trabalho do rótulo é o `aria-labelledby` no grupo.
 *
 * O foco vem do SDK, e não de `:focus-within`, porque a fronteira do iframe
 * também barra isso. O contorno é o mesmo que `app/globals.css` dá a todo o
 * resto, que é o que mantém a promessa de foco sempre visível.
 */
function CaixaDoCampo({
  id,
  rotulo,
  focado,
}: {
  id: string;
  rotulo: string;
  focado: boolean;
}) {
  return (
    <div>
      <span
        id={`${id}-rotulo`}
        className="mb-1.5 block text-sm font-medium text-texto"
      >
        {rotulo}
      </span>
      <div
        role="group"
        aria-labelledby={`${id}-rotulo`}
        className={`w-full rounded-xl border bg-superficie px-3.5 py-3 ${
          focado
            ? "border-texto outline-3 outline-offset-[3px] outline-destaque"
            : "border-borda"
        }`}
      >
        {/* 24px, que é 1rem vezes 1.5: a mesma caixa de texto de um input
            nosso. O iframe do Mercado Pago ocupa 100% desta div. */}
        <div id={id} className="h-6" />
      </div>
    </div>
  );
}
