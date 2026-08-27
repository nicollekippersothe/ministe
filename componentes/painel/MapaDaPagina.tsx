import type { ReactNode } from "react";
import type { Negocio } from "@/lib/tipos";

/**
 * Onde, na página, mora o que esta tela edita.
 *
 * **Existe por causa de uma pergunta da dona do produto: "Links extras parece
 * duplicado".** Duas telas do painel punham botão com link na página, e as duas
 * se apresentavam por texto. "Os botões que ficam presos no rodapé" e "os botões
 * da seção Links, no fim da sua página" descrevem lugares diferentes, e quem lê
 * isso no meio de um formulário guarda a mesma coisa das duas: botão com link.
 * A diferença é de posição na página, e posição se resolve mostrando.
 *
 * **Depois as duas telas viraram uma só, e o desenho passou a acender os dois
 * pedaços ao mesmo tempo.** Enquanto eram duas, a comparação dependia de a
 * pessoa guardar de cabeça o desenho da tela anterior, e ela guardava o texto,
 * que era justamente a parte que confundia. Com `zona="ambas"`, a resposta está
 * inteira num desenho só: uma coisa fica presa embaixo o tempo todo, a outra é
 * uma lista dentro do corpo, perto do fim.
 *
 * O pedaço aceso recebe o componente de verdade da página pública, com os dados
 * de verdade: `BotaoAcao` na barra, `LinksExtras` na seção. O resto do desenho é
 * silhueta, feita de blocos sem texto, porque ali o assunto é a posição e um
 * texto de mentira só disputaria a atenção. Nenhuma palavra inventada entra no
 * lugar de campo que a pessoa ainda vai preencher, que é a regra 6 do produto.
 */

/** Um bloco cinza da silhueta. A altura diz o peso daquele pedaço na página. */
function Bloco({ className = "" }: { className?: string }) {
  return <div className={`rounded-full bg-borda ${className}`} aria-hidden />;
}

function Linha() {
  return <hr className="border-0 border-t border-borda" aria-hidden />;
}

/**
 * O pedaço aceso: contorno na cor de destaque, com o lugar escrito em cima.
 *
 * O rótulo diz a POSIÇÃO, e nunca o nome da seção: "Links" já está escrito
 * dentro do desenho, como está na página, e repetir isso na moldura gastaria a
 * única linha que existe aqui para responder a pergunta que trouxe a pessoa.
 */
function Zona({
  lugar,
  acesa,
  children,
}: {
  lugar: string;
  acesa: boolean;
  children: ReactNode;
}) {
  if (!acesa) return <>{children}</>;

  return (
    <div className="rounded-xl border-2 border-destaque/45 bg-destaque/6 p-2">
      <p className="mb-1.5 text-[0.65rem] font-semibold tracking-wide text-destaque uppercase">
        {lugar}
      </p>
      {children}
    </div>
  );
}

/*
 * `LinksExtras` na medida do desenho.
 *
 * Ele nasce no tamanho da página pública, feita para o polegar: cada linha
 * passa de 50 pixels de altura, e três delas sozinhas ocupavam uma tela de
 * celular inteira antes de a pessoa chegar no primeiro campo. Aqui ele é
 * ilustração, então a letra e o respiro encolhem por fora, sem tocar no
 * componente. É o mesmo caminho do `[&_ul]:grid-cols-1` que a prévia da
 * mensagem usa para forçar uma coluna só. O `BotaoAcao` da barra já tem a
 * medida miúda por dentro, no `compacto` dele, e por isso fica de fora daqui.
 */
const MIUDO =
  "[&_a]:gap-2 [&_a]:px-3 [&_a]:py-2 [&_a]:text-[0.78rem] [&_svg]:h-3.5 [&_svg]:w-3.5";

export function MapaDaPagina({
  negocio,
  zona,
  chamada,
  barra,
  links,
}: {
  negocio: Negocio;
  /**
   * Qual pedaço acende: a barra presa embaixo, a lista de links, os dois, ou
   * nenhum. "ambas" é a forma da tela de links e botões, e é ela que responde
   * a pergunta que deu origem a este componente.
   *
   * Com "nenhuma" o desenho sai inteiro em silhueta, e aí ele deixa de
   * responder "onde fica isto que estou editando" e passa a responder "o que é
   * isto que eu tenho". É a forma que a tela inicial usa: quem volta ao painel
   * com a página já montada vê o formato dela ao lado do endereço, e a tela se
   * apresenta como a casa da página em vez de uma lista de campos.
   */
  zona: "barra" | "links" | "ambas" | "nenhuma";
  /** A frase acima do desenho. */
  chamada: string;
  /** O rodapé de verdade, quando ele está aceso. */
  barra?: ReactNode;
  /** A seção Links de verdade, quando ela está acesa. */
  links?: ReactNode;
}) {
  const acesa = (qual: "barra" | "links") => zona === qual || zona === "ambas";

  return (
    /*
     * `inert` pelo mesmo motivo de toda prévia do painel: o que entra no pedaço
     * aceso é o botão de verdade, com o link de verdade dentro, e um link
     * focável dentro de uma ilustração manda quem navega por teclado para fora
     * do formulário. Quem usa leitor de tela lê e edita nos campos ao lado.
     */
    <div className="max-w-[19rem]">
      <p className="mb-2 text-xs leading-relaxed text-suave">{chamada}</p>

      <div inert className="overflow-hidden rounded-2xl border border-borda">
        <div className="flex flex-col gap-3 bg-superficie px-3 pt-3 pb-4">
          {/* Capa e identidade. */}
          <Bloco className="h-8 rounded-lg" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-borda" aria-hidden />
            <p className="min-w-0 truncate text-[0.8rem] font-semibold text-texto">
              {negocio.nome}
            </p>
          </div>

          <Linha />

          {/* Catálogo, sempre em silhueta: ele tem tela própria. */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.7rem] font-medium text-suave">
              {negocio.tituloCatalogo}
            </p>
            <Bloco className="h-2.5 w-2/3" />
            <Bloco className="h-2.5 w-1/2" />
          </div>

          <Linha />

          <Zona lugar="No corpo, perto do fim" acesa={acesa("links")}>
            <div className="flex flex-col gap-1.5">
              <p className="text-[0.7rem] font-medium text-suave">Links</p>
              {acesa("links") ? (
                <div className={MIUDO}>{links}</div>
              ) : (
                <>
                  <Bloco className="h-6 rounded-lg" />
                  <Bloco className="h-6 rounded-lg" />
                </>
              )}
            </div>
          </Zona>

          <Linha />
          <Bloco className="mx-auto h-2 w-20" />
        </div>

        {/*
          A barra vem depois de uma linha grossa, e não dentro do corpo: na
          página ela é `fixed`, flutuando por cima do que estiver rolando. É a
          diferença que esta tela precisa mostrar.
        */}
        <div className="border-t-2 border-borda bg-fundo px-3 py-3">
          <Zona lugar="Preso no rodapé" acesa={acesa("barra")}>
            <div className="flex flex-col gap-1.5">
              {acesa("barra") ? (
                barra
              ) : (
                <Bloco className="h-7 rounded-full" />
              )}
            </div>
          </Zona>
        </div>
      </div>
    </div>
  );
}
