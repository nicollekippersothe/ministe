import { TelaComPrevia } from "@/componentes/painel/TelaComPrevia";
import Link from "next/link";
import { copiarSegundaParaSemana, salvarHorarios } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import { BotaoDeAcao } from "@/componentes/painel/BotaoDeAcao";
import { BarraSalvar, Botao } from "@/componentes/painel/Campos";
import { BotaoAcao } from "@/componentes/BarraAcoes";
import { IconeAbrirLista, IconeAvancar } from "@/componentes/Icones";
import { doDono } from "@/lib/dados";
import { acoesDoRodape } from "@/lib/acoes";
import { DIAS_LONGO, porDiaSemana } from "@/lib/horarios";
import type { Intervalo, Negocio } from "@/lib/tipos";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

/**
 * A seta de abrir, virada pelo `group-open`.
 *
 * Aponta para baixo, e nunca para o lado: seta de lado quer dizer "leva para
 * outra tela", e estes dois abrem ali mesmo. É o mesmo desenho do "Horários da
 * semana" da página pública, de propósito, porque é a mesma promessa.
 *
 * **O `giro` vem de fora porque as dobras se aninham.** A dobra dos turnos de
 * um dia mora dentro da dobra "Mostrar quando abre e quando fecha", e o
 * `group-open` do Tailwind casa com QUALQUER `.group[open]` acima, e não com o
 * mais próximo: com o nome genérico, abrir a de fora virava a seta e trocava o
 * texto de todas as sete de dentro ao mesmo tempo. Cada dobra tem grupo com
 * nome próprio, e quem desenha a seta diz de qual delas ela é.
 */
function Chevron({ giro }: { giro: string }) {
  return (
    <IconeAbrirLista className={`h-3.5 w-3.5 transition-transform ${giro}`} />
  );
}

const ORDEM = [1, 2, 3, 4, 5, 6, 0];
const SLOTS = 3;

/**
 * O campo de hora por dentro, que é a parte que o navegador desenha sozinho.
 *
 * Cada navegador entrega um desenho diferente aqui: o Chromium do computador
 * parte o valor em campinhos de hora, minuto e AM/PM e ainda põe um relógio
 * do lado; o iPhone abre uma roleta em cima do teclado; o Android abre um
 * mostrador. Trocar isso por três `select` de número custaria o teclado de
 * hora do celular, que é o lugar onde este painel é usado.
 *
 * O que dá para acertar é o entorno e o pedaço aceso. A moldura sai do campo e
 * passa para o par inteiro, então cada campo entra transparente e sem borda
 * própria. O campinho em foco sai na cor da marca, no lugar do azul do
 * sistema. E o relógio do Chromium fica em meio tom até a mão chegar perto,
 * porque ele é atalho e não é o assunto.
 */
const HORA = [
  "w-full min-w-0 bg-transparent px-2 py-2.5 text-[1rem] tabular-nums text-texto",
  "[&::-webkit-datetime-edit]:px-0",
  "[&::-webkit-datetime-edit-fields-wrapper]:p-0",
  "[&::-webkit-datetime-edit-hour-field:focus]:rounded-[3px]",
  "[&::-webkit-datetime-edit-hour-field:focus]:bg-destaque",
  "[&::-webkit-datetime-edit-hour-field:focus]:text-white",
  "[&::-webkit-datetime-edit-minute-field:focus]:rounded-[3px]",
  "[&::-webkit-datetime-edit-minute-field:focus]:bg-destaque",
  "[&::-webkit-datetime-edit-minute-field:focus]:text-white",
  "[&::-webkit-datetime-edit-ampm-field:focus]:rounded-[3px]",
  "[&::-webkit-datetime-edit-ampm-field:focus]:bg-destaque",
  "[&::-webkit-datetime-edit-ampm-field:focus]:text-white",
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
  "[&::-webkit-calendar-picker-indicator]:opacity-35",
  "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
].join(" ");

/**
 * Um turno, e o par lido como um intervalo só.
 *
 * **Era o que a dona do produto chamou de feio.** Cada hora vinha numa caixa
 * própria, com rótulo próprio em cima, e um "às" solto no meio empurrado para
 * baixo na mão com uma margem. Dois retângulos iguais lado a lado leem como
 * dois campos independentes, e o que ela preenche é um intervalo: uma coisa
 * com começo e fim.
 *
 * Agora a borda é uma só e envolve os dois, com o "às" dentro dela. O par
 * inteiro acende junto quando o dedo entra em qualquer metade
 * (`focus-within`), que é o sinal de que ali dentro é um assunto só.
 *
 * Os rótulos de cada metade continuam existindo para quem usa leitor de tela,
 * em `sr-only`, e dizem o dia junto: "Segunda, abre". Na tela quem faz esse
 * papel é o nome do dia ao lado do par, mais o "às" no meio, que é como um
 * horário se lê em qualquer porta de comércio.
 */
function Par({
  dia,
  slot,
  intervalo,
}: {
  dia: number;
  slot: number;
  intervalo?: Intervalo;
}) {
  const abre = `h-${dia}-${slot}-abre`;
  const fecha = `h-${dia}-${slot}-fecha`;
  const nome = DIAS_LONGO[dia];

  return (
    <div className="flex max-w-[21rem] items-center rounded-xl border border-borda bg-superficie transition-colors focus-within:border-destaque">
      <label htmlFor={abre} className="sr-only">
        {nome}, hora de abrir
      </label>
      <input
        id={abre}
        name={abre}
        type="time"
        defaultValue={intervalo?.abre ?? ""}
        className={HORA}
      />
      <span className="shrink-0 px-0.5 text-sm text-suave" aria-hidden>
        às
      </span>
      <label htmlFor={fecha} className="sr-only">
        {nome}, hora de fechar
      </label>
      <input
        id={fecha}
        name={fecha}
        type="time"
        defaultValue={intervalo?.fecha ?? ""}
        className={HORA}
      />
    </div>
  );
}

/**
 * Um dia da semana.
 *
 * **Dia fechado é dia sem turno, e isso é a regra do banco.** Não existe
 * coluna "fechado" lá, e não existe caixinha de marcar aqui: o dia fica
 * fechado esvaziando as horas dele. O que faltava era a tela dizer isso de
 * longe, porque um dia fechado tinha exatamente o mesmo desenho de um dia
 * aberto, com um selo miúdo de sete letras como única diferença. Agora o dia
 * sem turno vem com a borda tracejada e o nome em meio tom, e o par de horas
 * fica ali, vazio, do jeito que ele está guardado.
 *
 * **No computador o nome do dia fica ao lado, e não em cima.** Sete cartões
 * empilhados com o nome dentro de cada um pediam uma leitura de cima a baixo
 * de 2400 pixels para responder "que horas eu abro na quinta". Com o nome numa
 * coluna à esquerda, os sete pares ficam alinhados numa régua só e a semana se
 * lê como a placa de horário de uma porta. No celular a largura é curta demais
 * para essa coluna, então lá o nome continua em cima.
 */
function Dia({ dia, intervalos }: { dia: number; intervalos: Intervalo[] }) {
  const fechado = intervalos.length === 0;
  const extras = intervalos.slice(1);
  /*
   * Um turno vazio de cada vez, e nunca dois. A tela vinha com os três slots
   * abertos sempre, então todo dia terminava num par em branco pendurado
   * embaixo do que a pessoa acabara de escrever. Aqui só aparece a sobra de um
   * turno, e ela some quando os três estão em uso.
   */
  const extrasNaTela = Math.min(SLOTS - 1, extras.length + 1);

  return (
    <fieldset
      className={`rounded-xl border px-4 py-3.5 ${
        fechado ? "border-dashed border-borda" : "border-borda bg-fundo"
      }`}
    >
      <legend className="sr-only">{DIAS_LONGO[dia]}</legend>

      <div className="lg:flex lg:items-start lg:gap-4">
        <p
          className={`mb-2 flex items-center gap-2 text-sm font-semibold lg:mb-0 lg:w-28 lg:shrink-0 lg:flex-col lg:items-start lg:gap-1 lg:pt-2.5 ${
            fechado ? "text-suave" : "text-texto"
          }`}
        >
          {DIAS_LONGO[dia]}
          {fechado ? (
            <span className="rounded-full bg-fechado-fundo px-2 py-0.5 text-xs font-medium text-fechado-texto">
              Fechado
            </span>
          ) : null}
        </p>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Par dia={dia} slot={0} intervalo={intervalos[0]} />

          <details className="group/turno" open={extras.length > 0}>
            {/* Alvo de 44: no celular isto é um toque de dedo, e as vinte
                pixels de altura do texto sozinho ficavam abaixo da medida. */}
            <summary
              className={`-my-1.5 inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm ${
                /* No dia fechado a oferta de um segundo turno fica em meio
                   tom: cinco linhas na cor da marca, uma embaixo da outra,
                   puxavam o olho para o que ainda não tem nem o primeiro. */
                fechado ? "text-suave" : "text-destaque"
              }`}
            >
              {/* O mesmo resumo dizia "Adicionar outro horário" com os outros
                  horários já abertos embaixo dele. Duas palavras, e quem manda
                  na troca é o estado da dobra. */}
              <span className="group-open/turno:hidden">
                Adicionar outro horário
              </span>
              <span className="hidden group-open/turno:inline">
                Outros horários deste dia
              </span>
              <Chevron giro="group-open/turno:rotate-180" />
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {Array.from({ length: extrasNaTela }, (_, i) => (
                <Par dia={dia} slot={i + 1} intervalo={extras[i]} key={i} />
              ))}
            </div>
          </details>
        </div>
      </div>
    </fieldset>
  );
}

/**
 * A semana inteira, do jeito que ela sempre foi.
 *
 * Continua empilhada no computador, e o formulário para de crescer junto com a
 * tela. Duas colunas de dias foi a primeira tentativa, e sobrava 125 pixels
 * para cada campo de hora: o navegador que escreve "09:00 AM" cortava o AM
 * dentro do campo. Sete dias em fila é a leitura natural de uma semana, e a
 * largura travada deixa cada par de horas do tamanho do que se digita nele.
 */
function Semana({
  horarios,
  recado,
}: {
  horarios: Intervalo[];
  /** A confirmação de gravação, que sai encostada no Salvar que a produziu. */
  recado?: string;
}) {
  const semana = porDiaSemana(horarios);

  return (
    <form
      action={salvarHorarios}
      className="mt-6 flex flex-col gap-2.5 lg:max-w-xl"
    >
      {ORDEM.map((dia) => (
        <Dia key={dia} dia={dia} intervalos={semana[dia] ?? []} />
      ))}

      <BotaoDeAcao
        formAction={copiarSegundaParaSemana}
        className="mt-1 h-12 w-full rounded-full border border-borda bg-superficie px-5 font-semibold text-texto lg:w-auto lg:self-start lg:px-8"
      >
        Copiar segunda para terça a sexta
      </BotaoDeAcao>

      <BarraSalvar recado={recado}>
        <Botao type="submit">Salvar</Botao>
      </BarraSalvar>
    </form>
  );
}

/**
 * A saída de quem atende com hora marcada, do lado de quem já preencheu.
 *
 * Um formulário sem nenhum campo de hora, e é isso que faz o serviço:
 * `salvarHorarios` lê os sete dias do que chega, e o que chega aqui é vazio,
 * então a semana volta a ficar em branco. Fica dentro de um `details` para o
 * clique ser deliberado: apagar a semana inteira por engano custaria caro de
 * refazer no celular.
 */
function VirarHoraMarcada() {
  return (
    <details className="group/saida mt-8 rounded-xl border border-borda bg-fundo p-4 lg:max-w-xl">
      <summary className="-my-2 inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-destaque">
        Você atende com hora marcada?
        <Chevron giro="group-open/saida:rotate-180" />
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        A sua página passa a mostrar só o botão do rodapé. Os horários da semana
        voltam quando você preencher de novo.
      </p>
      <form action={salvarHorarios} className="mt-3">
        <BotaoDeAcao className="h-11 rounded-full border border-borda bg-superficie px-5 text-sm font-semibold text-texto">
          Passar a atender com hora marcada
        </BotaoDeAcao>
      </form>
    </details>
  );
}

/**
 * O estado de quem atende com hora marcada, que é a semana em branco.
 *
 * **Por que a escolha mora no próprio dado, e não numa coluna nova.** A semana
 * em branco já significa exatamente isto, dos dois lados: o painel enxerga
 * zero intervalos e a página pública some com a seção de horário. Uma coluna
 * "atende com hora marcada" seria um segundo lugar dizendo a mesma coisa, e
 * dois lugares que dizem a mesma coisa acabam discordando.
 *
 * **E por que a página pública continua calada sobre isso.** A regra do
 * produto é que campo em branco faz a seção sumir, e nunca vira frase nossa.
 * Escrever "atendimento com hora marcada" na página seria o produto falando
 * pela dona, e apareceria igualzinho para quem só ainda vai preencher a
 * semana. Quem diz isso na página é o botão que ela mesma nomeia, em
 * `/painel/links`: "Agendar horário", "Ver horários livres", "Marcar
 * pelo WhatsApp". A frase é dela, e por isso é verdade.
 *
 * **O botão dela aparece aqui, e é o botão de verdade.** O relato foi "clico
 * em escolher o botão de agendar e vou parar em outra tela": o cartão dizia
 * que existe um botão, ficava calado sobre qual, e o único jeito de descobrir
 * era sair daqui. A tela ia embaixo do dedo e levava junto o que estivesse
 * digitado na semana, que fica logo abaixo numa dobra e some sem salvar.
 *
 * Então o cartão passa a mostrar o `BotaoAcao` da página pública, resolvido
 * pela mesma `acoesDoRodape`, com os dados de verdade. Quem já tem o botão lê
 * o nome dele aqui e continua no que estava fazendo. Quem vai trocar continua
 * com o caminho, e agora ele diz para qual tela leva antes de levar.
 */
function HoraMarcada({ negocio }: { negocio: Negocio }) {
  const acoes = acoesDoRodape(negocio);

  return (
    <section className="mt-6 rounded-2xl border border-borda bg-superficie p-5 lg:max-w-xl">
      <h2 className="text-[1.05rem] leading-snug font-semibold text-texto">
        Hoje a sua página atende com hora marcada
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        Quem abre o link da sua página marca pelo botão do rodapé.
      </p>

      {acoes.length > 0 ? (
        <>
          <p className="mt-4 text-xs font-medium text-suave">
            O botão que está lá hoje
          </p>
          {/*
            `inert` e `interativo={false}`, como em toda prévia do painel: o
            botão de verdade carrega o link de verdade, e um link focável dentro
            de uma amostra manda quem navega por teclado para fora da tela. O
            `BotaoAcao` sai com `aria-hidden`, então o nome do botão vem escrito
            aqui do lado para quem usa leitor de tela.
          */}
          <div inert className="mt-1.5 flex flex-col gap-1.5 lg:max-w-xs">
            {acoes.map((a, i) => (
              <BotaoAcao
                key={`${a.rotulo}-${i}`}
                acao={a}
                principal={i === 0}
                compacto
                interativo={false}
              />
            ))}
          </div>
          <span className="sr-only">
            {acoes.map((a) => a.rotulo).join(", ")}
          </span>
        </>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-borda px-3 py-2 text-xs leading-relaxed text-suave">
          O botão aparece assim que você escolher o que ele faz, em Links e
          botões.
        </p>
      )}

      <p className="mt-3 text-sm">
        <Link
          href="/painel/links"
          className="inline-flex min-h-11 items-center gap-1.5 font-medium text-destaque underline-offset-4 hover:underline"
        >
          {acoes.length > 0
            ? "Trocar em Links e botões"
            : "Ir para Links e botões"}
          <IconeAvancar className="h-4 w-4" />
        </Link>
      </p>
    </section>
  );
}

export default async function Horarios({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; copiado?: string; erro?: string }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  /*
   * Duas telas, e quem decide é a semana que está guardada.
   *
   * Com a semana em branco, a tela abre dizendo o que a página faz hoje e
   * guarda os sete dias dentro de um `details` fechado. Antes ela abria com
   * quatorze campos vazios e sete selos de "Fechado", e para uma professora de
   * yoga isso lia como sete tarefas pendentes numa parte do produto que ela
   * jamais vai usar.
   *
   * Com a semana preenchida, a tela abre no formulário, como sempre foi, e a
   * saída para hora marcada fica no fim.
   */
  const horaMarcada = negocio.horarios.length === 0;

  /*
   * Onde a confirmação sai, e o que ela diz.
   *
   * Com a semana preenchida ela sai dentro da `BarraSalvar`, encostada no botão
   * que a produziu, que é o conserto do item 3 desta rodada: no monitor de 1440
   * a frase saía a 1627 pixels do Salvar, com a rolagem devolvida ao topo. O
   * "copiar segunda para terça a sexta" mora na mesma barra, dois dedos acima do
   * Salvar, então a resposta dele cabe no mesmo lugar.
   *
   * Com a semana em branco a frase volta para o alto, e isso é escolha e não
   * sobra: ali o formulário inteiro está dentro de uma dobra fechada, e o botão
   * que produziu a resposta pode nem existir mais na tela (é o caso de quem
   * acabou de tocar em "Passar a atender com hora marcada"). O alto da tela é o
   * único lugar que a pessoa está olhando.
   */
  const recadoNaBarra = horaMarcada
    ? undefined
    : params.copiado === "1"
      ? "Horário copiado para terça a sexta, e a semana está salva."
      : params.salvo === "1"
        ? "Alterações salvas. A sua página já mostra esta semana."
        : undefined;

  /*
   * A semana montada uma vez, porque os dois ramos abaixo mostram a mesma
   * coisa: a diferença entre eles é a dobra por fora e o botão embaixo, e
   * nunca o conteúdo. Escrita duas vezes, esta frase já foi editada em
   * duplicata na mão.
   */
  const semana = (
    <>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
        Dia em branco fica marcado como fechado. Para turno que passa da meia
        noite, use 19:00 às 00:30.
      </p>
      <Semana horarios={negocio.horarios} recado={recadoNaBarra} />
    </>
  );

  return (
    <TelaComPrevia chave={JSON.stringify(negocio.horarios)}>
      <main className="mt-6">
      {/*
        No computador a coluna da esquerda fica sempre à vista, com as seções
        e o estado da página, então o Voltar seria um segundo caminho
        para onde já dá para ir com um clique.
      */}
      <Link
        href="/painel"
        /* O respiro vem de dentro do alvo, e a margem negativa devolve o
           alinhamento: o dedo ganha 44 de altura sem o desenho mudar. */
        className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm text-suave lg:hidden"
      >
        Voltar
      </Link>

      <h1 className="titulo mt-2 text-2xl text-texto">
        Horários
      </h1>

      {/* A recusa vale para a tela toda e continua no alto. A confirmação só
          aparece aqui quando a barra do Salvar está fora de alcance. */}
      <Aviso
        salvo={params.salvo === "1" && recadoNaBarra === undefined}
        copiado={params.copiado === "1" && recadoNaBarra === undefined}
        erro={params.erro}
      />

      {horaMarcada ? (
        <>
          <HoraMarcada negocio={negocio} />

          <details className="group/semana mt-8">
            <summary className="-my-2 inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-[1.05rem] font-medium text-destaque">
              Mostrar quando abre e quando fecha, dia por dia
              <Chevron giro="group-open/semana:rotate-180" />
            </summary>
            {semana}
          </details>
        </>
      ) : (
        <>
          {semana}
          <VirarHoraMarcada />
        </>
      )}
      </main>
    </TelaComPrevia>
  );
}
