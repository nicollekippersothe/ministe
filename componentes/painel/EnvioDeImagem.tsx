"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  prepararEnvioDeImagem,
  salvarImagemDoNegocio,
  type GravacaoDeImagem,
} from "@/app/painel/acoes";
import { MOTIVOS_DADOS } from "@/lib/dados/erros";
import {
  ACCEPT,
  BUCKET,
  conferirArquivo,
  enderecoPublico,
  LIMITE_MB,
  MOTIVOS_IMAGEM,
  ROTULOS,
  type PastaDeImagem,
} from "@/lib/supabase/imagens";
import { navegador } from "@/lib/supabase/navegador";
import { LADO_MAXIMO, reduzirImagem } from "./reduzirImagem";

/**
 * O campo de imagem do painel: mostra a que existe, troca e remove.
 *
 * O arquivo vai do celular direto para o Storage, pelo cliente de navegador. O
 * porquê está escrito por extenso em app/painel/acoes.ts, junto das duas ações
 * que sobraram para o servidor: o corpo de uma Server Action é limitado a 1 MB
 * por padrão no Next, e o bucket aceita 3 MB, então a foto comum de celular
 * caberia no bucket e seria recusada no caminho até ele.
 *
 * Isto aqui é a única tela do produto que baixa o cliente do Supabase. É
 * painel, e não página pública: a página pública continua sendo renderizada no
 * servidor, sem cliente de banco nenhum, que é o que segura o Lighthouse.
 *
 * A ordem dos passos é de propósito:
 *
 * 1. conferir o tipo, antes de qualquer byte sair;
 * 2. reduzir a foto no próprio celular, que é o que ./reduzirImagem.ts faz;
 * 3. conferir o tamanho do arquivo que de fato vai subir;
 * 4. mostrar a prévia local, que aparece na hora e independe de rede;
 * 5. pedir ao servidor o caminho, que carrega o id do negócio;
 * 6. subir o arquivo;
 * 7. gravar o caminho na coluna;
 * 8. apagar o arquivo anterior do bucket.
 *
 * O passo 8 é o caminho feliz que a correção 008 descreve. A rede embaixo dele
 * é o gatilho `negocios_enfileira_removida`, que guarda o caminho que saiu de
 * cena em `imagens_para_apagar` mesmo quando a aba fecha no meio.
 */

const DICAS: Record<PastaDeImagem, string> = {
  logo: "Aparece redonda, no topo da página. Uma imagem quadrada fica perfeita.",
  capa: "É a faixa larga do topo da página. Uma imagem deitada fica perfeita.",
};

const VAZIOS: Record<PastaDeImagem, string> = {
  logo: "A página abre com o nome em destaque. Escolha uma imagem para pôr a sua marca junto.",
  capa: "A página abre direto no nome. Escolha uma imagem para dar um topo a ela.",
};

/**
 * A frase de quando o Supabase ainda está de fora.
 *
 * O painel roda inteiro guardando num arquivo local, que é o que deixa o
 * `npm run dev` e o teste de fluxo rodarem sozinhos. A prévia funciona igual
 * nesse modo, e a tela diz o que acontece com o arquivo em vez de deixar a
 * pessoa apertar um botão que fica parado.
 */
const SO_PREVIA =
  "A prévia mostra como a imagem fica na página. O envio guarda o arquivo assim que o banco de imagens estiver ligado.";

function frase(gravado: Extract<GravacaoDeImagem, { ok: false }>): string {
  return gravado.recusa === "banco"
    ? MOTIVOS_DADOS[gravado.motivo]
    : MOTIVOS_IMAGEM[gravado.motivo];
}

export function EnvioDeImagem({
  pasta,
  atual,
  nome,
  ligado,
}: {
  pasta: PastaDeImagem;
  /** O valor cru da coluna: caminho do bucket, ou endereço local com barra. */
  atual: string | null;
  /** O texto alternativo, derivado do nome como lib/supabase/mapa.ts faz. */
  nome: string;
  /** Se o Supabase está configurado, e portanto se existe bucket para receber. */
  ligado: boolean;
}) {
  const router = useRouter();
  const cliente = useRef<ReturnType<typeof navegador> | null>(null);

  const [caminho, setCaminho] = useState<string | null>(atual);
  const [previa, setPrevia] = useState<string | null>(null);
  /*
   * Um estado só para as duas escritas, porque as duas travam os mesmos botões.
   * Ele guarda qual delas está acontecendo para o botão dizer a verdade
   * enquanto ela acontece.
   */
  const [ocupado, setOcupado] = useState<"envio" | "remocao" | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  const id = `imagem-${pasta}`;
  const redonda = pasta === "logo";
  const mostrada = previa ?? enderecoPublico(caminho);

  function sb() {
    cliente.current ??= navegador();
    return cliente.current;
  }

  /** A prévia anterior é devolvida ao navegador assim que sai da tela. */
  function trocarPrevia(nova: string | null) {
    setPrevia((antiga) => {
      if (antiga !== null) URL.revokeObjectURL(antiga);
      return nova;
    });
  }

  async function enviar(escolhido: File) {
    // O tipo é conferido no arquivo cru, antes de tudo: reduzir um PDF seria
    // trabalho para chegar na mesma recusa.
    if (!conferirArquivo({ type: escolhido.type, size: 0 }).ok) {
      setRecado(MOTIVOS_IMAGEM.tipo);
      return;
    }

    setOcupado("envio");
    setRecado("Preparando a imagem.");

    try {
      const arquivo = await reduzirImagem(escolhido, LADO_MAXIMO[pasta]);

      // O tamanho é conferido no arquivo que vai subir, e não no que saiu da
      // câmera: é ele que o bucket vai medir do outro lado.
      const conferido = conferirArquivo(arquivo);
      if (!conferido.ok) {
        setRecado(MOTIVOS_IMAGEM[conferido.motivo]);
        return;
      }

      trocarPrevia(URL.createObjectURL(arquivo));

      if (!ligado) {
        setRecado(SO_PREVIA);
        return;
      }

      setRecado("Enviando a imagem.");

      const preparo = await prepararEnvioDeImagem(
        pasta,
        arquivo.type,
        arquivo.size,
      );
      if (!preparo.ok) {
        setRecado(MOTIVOS_IMAGEM[preparo.motivo]);
        return;
      }

      const { error } = await sb()
        .storage.from(BUCKET)
        .upload(preparo.caminho, arquivo, { contentType: arquivo.type });
      if (error) {
        setRecado(MOTIVOS_IMAGEM.envio);
        return;
      }

      const gravado = await salvarImagemDoNegocio(pasta, preparo.caminho);
      if (!gravado.ok) {
        // O arquivo subiu e a coluna ficou como estava, então ele já nasceu
        // órfão: sai agora, em vez de esperar a varredura de imagens_orfas.
        await sb().storage.from(BUCKET).remove([preparo.caminho]);
        setRecado(frase(gravado));
        return;
      }

      setCaminho(preparo.caminho);
      if (gravado.anterior !== null) {
        await sb().storage.from(BUCKET).remove([gravado.anterior]);
      }
      setRecado("Imagem no ar na sua página.");
      router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  async function remover() {
    setOcupado("remocao");
    setRecado("Atualizando a sua página.");
    try {
      const gravado = await salvarImagemDoNegocio(pasta, null);
      if (!gravado.ok) {
        setRecado(frase(gravado));
        return;
      }

      if (ligado && gravado.anterior !== null) {
        await sb().storage.from(BUCKET).remove([gravado.anterior]);
      }

      trocarPrevia(null);
      setCaminho(null);
      setRecado(VAZIOS[pasta]);
      router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="rounded-xl border border-borda bg-superficie p-4">
      <p id={`${id}-titulo`} className="text-sm font-medium text-texto">
        {ROTULOS[pasta]}
      </p>
      <p id={`${id}-dica`} className="mt-0.5 text-xs leading-relaxed text-suave">
        {DICAS[pasta]} JPG, PNG ou WebP. A foto sai reduzida daqui, e cabe nos{" "}
        {LIMITE_MB} MB que a página guarda.
      </p>

      {/*
        A logo é um selo pequeno e a capa é uma faixa larga, então uma fica ao
        lado dos botões e a outra fica em cima deles. É a medida de cada assunto
        mandando no bloco, e não uma grade igual para as duas.
      */}
      <div
        className={`mt-3 flex gap-4 ${redonda ? "items-center" : "flex-col"}`}
      >
        <div
          className={`shrink-0 overflow-hidden border border-borda bg-fundo ${
            redonda ? "h-20 w-20 rounded-full" : "aspect-[16/9] w-full rounded-lg"
          }`}
        >
          {mostrada ? (
            /*
              Imagem crua, e não next/image: aqui a fonte é ora um blob: do
              próprio navegador, ora o endereço do Storage, que mora fora da
              lista de domínios do otimizador. O painel é tela de trabalho e
              carrega uma imagem por campo, então o otimizador seria peso sem
              ganho. Quem passa pelo next/image é a página pública.
            */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mostrada}
              alt={nome}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center px-3 text-center text-xs leading-snug text-suave">
              {redonda ? "Sua marca aqui" : "Sua capa aqui"}
            </span>
          )}
        </div>

        {/*
          Ao lado do selo redondo os dois botões empilham, porque ali a largura
          que sobra é de um botão só. Embaixo da faixa da capa eles cabem lado a
          lado, e ficam lado a lado.
        */}
        <div
          className={`flex min-w-0 flex-1 gap-2 ${
            redonda ? "flex-col items-stretch" : "flex-wrap items-center"
          }`}
        >
          <input
            id={id}
            type="file"
            accept={ACCEPT}
            disabled={ocupado !== null}
            aria-labelledby={`${id}-acao ${id}-titulo`}
            aria-describedby={`${id}-dica`}
            className="peer sr-only"
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0];
              // O campo volta a ficar vazio para a mesma foto, escolhida de
              // novo, disparar a troca outra vez.
              evento.target.value = "";
              if (arquivo) void enviar(arquivo);
            }}
          />
          <label
            id={`${id}-acao`}
            htmlFor={id}
            aria-disabled={ocupado !== null}
            className={`flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-borda px-4 text-sm font-semibold ${
              ocupado !== null
                ? "pointer-events-none bg-fundo text-suave"
                : "cursor-pointer bg-texto text-superficie"
            } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-destaque`}
          >
            {ocupado === "envio"
              ? "Enviando"
              : mostrada
                ? "Trocar imagem"
                : "Escolher imagem"}
          </label>

          {mostrada ? (
            <button
              type="button"
              onClick={() => void remover()}
              disabled={ocupado !== null}
              className="flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-borda bg-superficie px-4 text-sm font-semibold text-texto disabled:text-suave"
            >
              Remover
            </button>
          ) : null}
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 text-xs leading-relaxed text-suave"
      >
        {recado ??
          (ligado
            ? mostrada
              ? "Imagem no ar na sua página."
              : VAZIOS[pasta]
            : SO_PREVIA)}
      </p>
    </div>
  );
}
