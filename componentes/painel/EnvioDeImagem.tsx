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
import type { Foco } from "@/lib/tipos";
import { FocoDaCapa } from "./FocoDaCapa";
import { LADO_MAXIMO, reduzirImagem } from "./reduzirImagem";
import { IconeConfirmado, IconeGirando } from "./Sinais";

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
 * 2. conferir que o navegador abre o arquivo, que é o passo do `ehImagem`;
 * 3. reduzir a foto no próprio celular, que é o que ./reduzirImagem.ts faz;
 * 4. conferir o tamanho do arquivo que de fato vai subir;
 * 5. mostrar a prévia local, que aparece na hora e independe de rede;
 * 6. pedir ao servidor o caminho, que carrega o id do negócio;
 * 7. subir o arquivo;
 * 8. gravar o caminho na coluna;
 * 9. apagar o arquivo anterior do bucket.
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
 * As duas frases de quando o Supabase ainda está de fora.
 *
 * O painel roda inteiro guardando num arquivo local, que é o que deixa o
 * `npm run dev` e o teste de fluxo rodarem sozinhos. A prévia funciona igual
 * nesse modo, e a tela diz o que acontece com o arquivo em vez de deixar a
 * pessoa apertar um botão que fica parado.
 *
 * São duas porque são dois momentos: `SO_PREVIA_PRONTA` é a confirmação de que
 * a imagem que a pessoa acabou de escolher entrou, e `SO_PREVIA_PARADA` é o
 * relato do cartão em repouso. A mesma frase nos dois lugares dizia "imagem
 * escolhida" para um cartão em que ninguém tinha escolhido nada ainda.
 */
const SO_PREVIA_PRONTA =
  "Imagem escolhida, e a prévia já mostra como ela fica na página. O arquivo entra na página assim que o banco de imagens estiver ligado.";

const SO_PREVIA_PARADA =
  "A prévia mostra como a imagem fica na página. O envio guarda o arquivo assim que o banco de imagens estiver ligado.";

/**
 * Se o navegador realmente abre este arquivo como imagem.
 *
 * **Este passo faltava, e a falta dele era imagem quebrada na página no ar.**
 * O `conferirArquivo` lê `file.type`, que é o tipo que o sistema do celular
 * declara pela extensão, e a extensão mente com facilidade: uma foto de iPhone
 * renomeada para `.jpg` chega aqui dizendo `image/jpeg`, passa na conferência
 * de tipo, passa na de tamanho e sobe. O bucket confere a mesma coisa
 * declarada e aceita também. A coluna guarda o caminho, a página pública põe a
 * imagem, e o navegador de quem visita descobre o que ninguém tinha
 * perguntado: aqueles bytes não desenham nada.
 *
 * `createImageBitmap` é a pergunta certa porque é a mesma decodificação que o
 * navegador de quem visita vai fazer. `reduzirImagem` já a fazia, e engolia a
 * resposta de propósito, devolvendo o arquivo original em qualquer falha: o
 * contrato dele é reduzir ou passar adiante, e ele mantém esse contrato. Quem
 * recusa é aqui.
 *
 * Custa uma decodificação a mais por arquivo escolhido, e ela acontece com o
 * "Preparando a imagem" já na tela. Vale o preço: a alternativa é a pessoa
 * descobrir pela página dela.
 */
async function ehImagem(arquivo: File): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    bitmap.close();
    return true;
  } catch {
    return false;
  }
}

function frase(gravado: Extract<GravacaoDeImagem, { ok: false }>): string {
  return gravado.recusa === "banco"
    ? MOTIVOS_DADOS[gravado.motivo]
    : MOTIVOS_IMAGEM[gravado.motivo];
}

export function EnvioDeImagem({
  pasta,
  atual,
  foco,
  nome,
  ligado,
}: {
  pasta: PastaDeImagem;
  /** O valor cru da coluna: caminho do bucket, ou endereço local com barra. */
  atual: string | null;
  /**
   * O ponto da capa que precisa aparecer, quando já existe um gravado. Só a
   * capa usa: a logo é redonda e quadrada, e o corte dela nunca descarta o que
   * a pessoa escolheu.
   */
  foco?: Foco | null;
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
   * Foto nova nasce centralizada. O ponto anterior era um lugar da foto
   * anterior, e apontaria para o canto errado da que acabou de chegar.
   */
  const [pontoInicial, setPontoInicial] = useState<Foco | null>(foco ?? null);
  /*
   * Um estado só para as duas escritas, porque as duas travam os mesmos botões.
   * Ele guarda qual delas está acontecendo para o botão dizer a verdade
   * enquanto ela acontece.
   */
  const [ocupado, setOcupado] = useState<"envio" | "remocao" | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  /*
   * Em que tom o último recado sai.
   *
   * Era um booleano de recusa, e a fila inteira do envio cabia no outro lado
   * dele: "Preparando", "Enviando" e "Imagem no ar" saíam na mesma linha cinza
   * de 12 pixels no rodapé do cartão. A dona da página mandou a foto e contou
   * que ficou "sem saber se salvou", e é isso: uma linha cinza que troca de
   * texto duas vezes em meio segundo passa por decoração.
   *
   * Agora são quatro tons, e cada um tem forma própria: andamento roda, pronto
   * traz o certo em verde, recusa vira `alert` na cor de destaque, e o repouso
   * continua sendo a linha cinza que descreve o cartão. Nenhum deles some
   * sozinho: o que apaga um recado é a próxima ação da pessoa.
   */
  const [tom, setTom] = useState<"repouso" | "andamento" | "pronto" | "recusa">(
    "repouso",
  );

  /** Recusa: a frase aparece como aviso, e o passo para sair dele vem junto. */
  function recusar(frase: string) {
    setTom("recusa");
    setRecado(frase);
  }

  /** Andamento: a escrita está acontecendo agora, e o sinal roda enquanto isso. */
  function contar(frase: string) {
    setTom("andamento");
    setRecado(frase);
  }

  /** Fim de linha: a escrita chegou ao destino, e o certo fica na tela. */
  function confirmar(frase: string) {
    setTom("pronto");
    setRecado(frase);
  }

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
      recusar(MOTIVOS_IMAGEM.tipo);
      return;
    }

    setOcupado("envio");
    contar("Preparando a imagem.");

    try {
      /*
       * A recusa que faltava, e ela vem antes de qualquer byte sair daqui.
       * Ver `ehImagem` acima: o tipo declarado pelo celular passa na conferência
       * de cima mesmo quando os bytes são de outro formato, e o resultado disso
       * é a imagem chegar quebrada na página pública. A frase é a mesma da
       * recusa de tipo, que é o que este caso é: o arquivo escolhido está fora
       * dos três que a página guarda, e a extensão dizia outra coisa.
       */
      if (!(await ehImagem(escolhido))) {
        recusar(MOTIVOS_IMAGEM.tipo);
        return;
      }

      const arquivo = await reduzirImagem(escolhido, LADO_MAXIMO[pasta]);

      // O tamanho é conferido no arquivo que vai subir, e não no que saiu da
      // câmera: é ele que o bucket vai medir do outro lado.
      const conferido = conferirArquivo(arquivo);
      if (!conferido.ok) {
        recusar(MOTIVOS_IMAGEM[conferido.motivo]);
        return;
      }

      trocarPrevia(URL.createObjectURL(arquivo));
      setPontoInicial(null);

      if (!ligado) {
        confirmar(SO_PREVIA_PRONTA);
        return;
      }

      contar("Enviando a imagem.");

      const preparo = await prepararEnvioDeImagem(
        pasta,
        arquivo.type,
        arquivo.size,
      );
      if (!preparo.ok) {
        recusar(MOTIVOS_IMAGEM[preparo.motivo]);
        return;
      }

      const { error } = await sb()
        .storage.from(BUCKET)
        .upload(preparo.caminho, arquivo, { contentType: arquivo.type });
      if (error) {
        recusar(MOTIVOS_IMAGEM.envio);
        return;
      }

      const gravado = await salvarImagemDoNegocio(pasta, preparo.caminho);
      if (!gravado.ok) {
        // O arquivo subiu e a coluna ficou como estava, então ele já nasceu
        // órfão: sai agora, em vez de esperar a varredura de imagens_orfas.
        await sb().storage.from(BUCKET).remove([preparo.caminho]);
        recusar(frase(gravado));
        return;
      }

      setCaminho(preparo.caminho);
      if (gravado.anterior !== null) {
        await sb().storage.from(BUCKET).remove([gravado.anterior]);
      }
      confirmar("Pronto, a imagem está na sua página.");
      router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  async function remover() {
    setOcupado("remocao");
    contar("Atualizando a sua página.");
    try {
      const gravado = await salvarImagemDoNegocio(pasta, null);
      if (!gravado.ok) {
        recusar(frase(gravado));
        return;
      }

      if (ligado && gravado.anterior !== null) {
        await sb().storage.from(BUCKET).remove([gravado.anterior]);
      }

      trocarPrevia(null);
      setCaminho(null);
      confirmar(`Pronto. ${VAZIOS[pasta]}`);
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
        {/*
          A capa com imagem vira o escolhedor do ponto focal, em vez de uma
          prévia parada. O motivo está em ./FocoDaCapa.tsx: a moldura é fixa e a
          foto quase nunca tem a proporção dela, então alguém precisa dizer o que
          fica dentro do corte, e esse alguém é a dona da página. A logo continua
          com a prévia de sempre, porque redonda e quadrada cortam igual.
        */}
        {!redonda && mostrada ? (
          <FocoDaCapa
            src={mostrada}
            alt={nome}
            inicial={pontoInicial}
            ocupado={ocupado !== null}
          />
        ) : (
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
        )}

        {/*
          A mesma linha de botões nos dois cartões.

          Ela era esticada ao lado do selo redondo e do tamanho do texto embaixo
          da capa, e o resultado eram dois "Escolher imagem" lado a lado com 174
          e 150 pixels de largura, em duas alturas. É o mesmo botão, com o mesmo
          texto, fazendo a mesma coisa: agora ele tem uma medida só, e as duas
          linhas começam na mesma borda esquerda do cartão. Quando a largura
          aperta, o segundo botão desce, que é o que `flex-wrap` faz.
        */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
            } transition-transform duration-75 active:scale-[0.97] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-destaque`}
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
              className="flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-borda bg-superficie px-4 text-sm font-semibold text-texto transition-transform duration-75 active:scale-[0.97] disabled:text-suave"
            >
              Remover
            </button>
          ) : null}
        </div>
      </div>

      {/*
        A faixa de recado do cartão.

        Repouso continua sendo a linha cinza que descreve o cartão, e é o que
        ela sempre foi. Os outros três tons ganham caixa, cor e sinal: quem
        acabou de mandar uma foto precisa ver a diferença entre "está indo" e
        "chegou" de longe, e do canto do olho, com o dedo ainda no botão.
      */}
      <p
        role={tom === "recusa" ? "alert" : "status"}
        aria-live="polite"
        className={`mt-3 flex items-start gap-2 text-xs leading-relaxed ${
          tom === "recusa"
            ? "rounded-lg border border-destaque/30 bg-destaque/8 px-3 py-2 font-medium text-destaque"
            : tom === "pronto"
              ? "rounded-lg border border-aberto-texto/25 bg-aberto-fundo px-3 py-2 font-medium text-aberto-texto"
              : tom === "andamento"
                ? "rounded-lg border border-borda bg-fundo px-3 py-2 font-medium text-texto"
                : "text-suave"
        }`}
      >
        {tom === "andamento" ? (
          <IconeGirando className="mt-px h-4 w-4 shrink-0 motion-reduce:hidden" />
        ) : null}
        {tom === "pronto" ? (
          <IconeConfirmado className="mt-px h-4 w-4 shrink-0" />
        ) : null}
        <span className="min-w-0">
          {recado ??
            (mostrada
              ? ligado
                ? "Imagem no ar na sua página."
                : SO_PREVIA_PARADA
              : VAZIOS[pasta])}
        </span>
      </p>
    </div>
  );
}
