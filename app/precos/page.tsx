import type { Metadata } from "next";
import Link from "next/link";
import { CampoAbertura } from "@/componentes/inicial/CampoAbertura";
import { Telefone } from "@/componentes/inicial/Telefone";
import { Marca } from "@/componentes/Marca";
import { Rodape } from "@/componentes/Rodape";
import { porSlug } from "@/lib/dados";
import { atelie } from "@/lib/exemplos";
import { FONTE_PADRAO, podeEscolherFonte, type ChaveFonte } from "@/lib/fontes";
import { preco } from "@/lib/formato";
import { NOME_PRODUTO } from "@/lib/marca";
import {
  DIAS_DE_TESTE,
  MESES_DO_CICLO,
  PLANOS,
  economiaAnualEmCentavos,
  mesesDeCortesia,
} from "@/lib/pagamento";
import type { Ciclo } from "@/lib/pagamento";
import { CADASTRO_ABERTO } from "@/lib/site";
import type { Negocio, Plano } from "@/lib/tipos";

export const revalidate = 3600;

/*
 * Nenhum preço é escrito à mão nesta tela.
 *
 * Todo real que aparece aqui sai de lib/pagamento/precos.ts, e as contas do
 * desconto anual são as mesmas funções que o painel usa na hora de cobrar.
 * Preço digitado numa página de venda é a forma mais barata de a propaganda
 * divergir da cobrança, e precos.test.ts guarda a promessa dos três meses.
 */
const MENSAL = preco(PLANOS.mensal.valorCentavos);
const ANUAL = preco(PLANOS.anual.valorCentavos);
const DOZE_MENSALIDADES = preco(
  PLANOS.mensal.valorCentavos * MESES_DO_CICLO.anual,
);
const ECONOMIA = preco(economiaAnualEmCentavos());
const CORTESIA = mesesDeCortesia();

export const metadata: Metadata = {
  title: `Preços, ${NOME_PRODUTO}`,
  description: `Publicar é gratuito. O plano pago custa ${MENSAL} por mês ou ${ANUAL} por ano, com ${DIAS_DE_TESTE} dias de teste no cartão de crédito, e abre a escolha da letra, os números completos e o rodapé só seu.`,
  alternates: { canonical: "/precos" },
};

/**
 * A letra do exemplo pago.
 *
 * O ateliê está no gratuito, então a letra dele é a padrão. Para a comparação
 * mostrar a diferença de verdade, o exemplo pago escolhe outra, que é
 * exatamente o que o painel abre para quem assina. A página baixa as duas
 * combinações por causa disso, e é o custo de mostrar em vez de descrever.
 */
const LETRA_DO_PAGO: ChaveFonte = "editorial";

/**
 * O mesmo negócio, nos dois planos.
 *
 * A regra da letra é a de `componentes/PaginaPublica.tsx`, pela mesma função:
 * quem está no gratuito recebe a padrão, e a escolha volta a valer no dia em
 * que a assinatura começa. Assim a comparação desta tela vale o que a página
 * do cliente faz, e não o que a gente gostaria que ela fizesse.
 */
function noPlano(base: Negocio, plano: Plano): Negocio {
  return {
    ...base,
    plano,
    fonte: podeEscolherFonte(plano) ? LETRA_DO_PAGO : FONTE_PADRAO,
  };
}

/*
 * Os limites moram em `limite_do_plano`, no banco, e a tabela deles está em
 * COBRANCA.md. Esta lista é a leitura de tela dos mesmos números: mudou lá,
 * muda aqui no mesmo commit.
 */
const NA_PAGINA = [
  { o: "Páginas por conta", gratuito: "1", pago: "5" },
  { o: "Itens no catálogo", gratuito: "20", pago: "500" },
  { o: "Fotos por item", gratuito: "3", pago: "10" },
  { o: "Fotos na galeria", gratuito: "12", pago: "100" },
  { o: "Links", gratuito: "8", pago: "30" },
  { o: "Intervalos de horário por dia", gratuito: "3", pago: "4" },
  { o: "Letra da página", gratuito: "A padrão", pago: "Cinco combinações" },
  {
    o: `Assinatura do ${NOME_PRODUTO} no rodapé`,
    gratuito: "Fica",
    pago: "Sai",
  },
  {
    o: "Números de visitas e cliques",
    gratuito: "Últimos 7 dias",
    pago: "Histórico por dia e por botão",
  },
];

const MEIOS = [
  {
    titulo: "Pix",
    texto:
      "Aprova na hora e compra um ciclo inteiro. O plano pago passa a valer no momento da aprovação, e a renovação seguinte fica na sua mão.",
  },
  {
    titulo: "Cartão de crédito",
    texto: `${DIAS_DE_TESTE} dias de teste antes da primeira cobrança, que acontece no oitavo dia. Depois dela a renovação acontece sozinha, no ciclo que você escolheu, até você cancelar.`,
  },
  {
    titulo: "Cartão de débito",
    texto:
      "Compra um ciclo à vista, com a confirmação do banco na hora. A renovação seguinte fica na sua mão, e o painel avisa quando a data se aproxima.",
  },
];

const PERGUNTAS = [
  {
    titulo: "Como cancelar",
    texto:
      "Um botão dentro do painel, na mesma tela em que você assinou. O plano pago continua valendo até o fim do período que já está pago.",
  },
  {
    titulo: "Devolução no anual",
    texto:
      "Cancelamento em até sete dias do pagamento devolve o valor inteiro, como o Código de Defesa do Consumidor pede.",
  },
  {
    titulo: "Cartão recusado",
    texto:
      "A página segue no ar por mais cinco dias enquanto a cobrança é tentada de novo. Cartão falha por limite, por troca de número e por banco fora do ar, e quase sempre a pessoa resolve em um ou dois dias.",
  },
  {
    titulo: "Voltar para o gratuito",
    texto:
      "Tudo o que você cadastrou permanece salvo em qualquer plano. Quem tinha 400 itens continua com os 400: os limites valem para o próximo item, e o conteúdo fica onde está.",
  },
  {
    titulo: "Mudança de preço",
    texto:
      "Um reajuste vale para as renovações seguintes, e chega avisado com trinta dias de antecedência.",
  },
];

export default async function Precos() {
  const base = (await porSlug("atelie-trama")) ?? atelie;
  const gratuito = noPlano(base, "gratuito");
  const pago = noPlano(base, "pago");

  /*
   * Um destino só para assinar, e ele já sabe quem chegou.
   *
   * `/painel/plano` abre a escolha de ciclo para quem está logado. Quem chega
   * de fora passa pelo `doDono()` do layout do painel, que manda para `/criar`,
   * e quem já tem página criada volta para o painel. O desvio existe desde
   * antes desta tela, então repetir a decisão aqui seria uma segunda cópia da
   * mesma regra, e esta página fica estática com revalidação, do jeito que a
   * tela inicial fica.
   *
   * Enquanto o cadastro está fechado, o botão dá lugar ao campo de endereço lá
   * embaixo, que é o mesmo caminho que a tela inicial oferece.
   */
  const paraAssinar = (ciclo: Ciclo) => `/painel/plano?ciclo=${ciclo}`;

  return (
    <div data-tema="areia" className="min-h-dvh bg-fundo">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Marca />
        {CADASTRO_ABERTO ? (
          <Link
            href="/entrar"
            className="text-[0.95rem] font-medium text-texto underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        ) : null}
      </header>

      <main>
        {/*
          A diferença entre os planos abre a página, mostrada nas peças de
          verdade: o mesmo ateliê renderizado duas vezes pelo componente que a
          tela inicial usa, e o rodapé de verdade embaixo de cada um. Escrever
          "tira a marca d'água" custaria uma linha e provaria pouco.
        */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-6 pb-20 sm:pt-12">
          <h1 className="max-w-2xl text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.038em] text-balance text-texto sm:text-[3.2rem]">
            <span className="block text-destaque">Publicar é gratuito.</span>O
            plano pago deixa a página inteira sua.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-suave">
            O endereço, a página no ar, o catálogo com preço e o botão de
            conversa valem nos dois planos. O mesmo negócio, aqui embaixo, do
            jeito que ele aparece em cada um.
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[19rem_19rem_minmax(0,1fr)] lg:gap-10 xl:gap-14">
            <Lado
              rotulo="No plano gratuito"
              legenda={`A letra padrão, e a assinatura do ${NOME_PRODUTO} no pé da página. É ela que faz uma página trazer a próxima.`}
              negocio={gratuito}
              prioridade
            />
            <Lado
              rotulo="No plano pago"
              legenda="A letra escolhida no painel, e o rodapé falando só do negócio."
              negocio={pago}
            />

            <div className="lg:pt-9">
              <h2 className="text-2xl leading-[1.15] font-semibold tracking-[-0.025em] text-balance text-texto">
                Três coisas mudam do gratuito para o pago.
              </h2>
              <dl className="mt-6">
                {[
                  {
                    t: "A letra",
                    d: "Cinco combinações no painel, e a escolhida vale na próxima vez que alguém abrir a página. A padrão continua sendo boa o suficiente para a página gratuita ser compartilhada.",
                  },
                  {
                    t: "O rodapé",
                    d: `A assinatura do ${NOME_PRODUTO} sai, e sobra o nome do negócio. O link de denúncia fica nos dois planos, porque ele protege quem visita.`,
                  },
                  {
                    t: "Os números",
                    d: "No gratuito, visitas e cliques dos últimos 7 dias. No pago, o histórico dia a dia e a conta separada por botão.",
                  },
                ].map((item) => (
                  <div
                    key={item.t}
                    className="border-t border-borda py-5 first:border-t-0 first:pt-0"
                  >
                    <dt className="font-semibold tracking-[-0.015em] text-texto">
                      {item.t}
                    </dt>
                    <dd className="mt-1.5 leading-relaxed text-suave text-pretty">
                      {item.d}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/*
          As duas caixas têm tamanhos diferentes de propósito: a do anual
          carrega o desconto, e desconto pede espaço para a conta aparecer
          inteira. Duas caixas do mesmo tamanho fariam a escolha parecer um
          detalhe de calendário.
        */}
        <section
          aria-labelledby="precos"
          className="border-t border-borda bg-superficie"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <h2
              id="precos"
              className="max-w-xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              O plano pago, em dois ciclos.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-suave">
              O mesmo produto nos dois. O que muda é de quanto em quanto tempo
              você paga.
            </p>

            <div className="mt-12 grid items-start gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
              <div className="surge flex flex-col rounded-3xl border border-borda bg-fundo p-7">
                <p className="text-[0.95rem] font-semibold tracking-[0.02em] text-suave uppercase">
                  {PLANOS.mensal.rotulo}
                </p>
                <p className="mt-5 flex items-baseline gap-2">
                  <span className="text-[2.75rem] leading-none font-semibold tracking-[-0.03em] tabular-nums text-texto">
                    {MENSAL}
                  </span>
                  <span className="text-[1.05rem] text-suave">por mês</span>
                </p>
                <p className="mt-4 leading-relaxed text-suave">
                  No cartão de crédito, os primeiros {DIAS_DE_TESTE} dias são de
                  teste, a primeira cobrança acontece no oitavo dia e a
                  renovação segue sozinha. No Pix e no débito, cada mês é uma
                  compra sua.
                </p>
                <div className="mt-7">
                  <Assinar ciclo="mensal" href={paraAssinar("mensal")} />
                </div>
              </div>

              <div className="surge flex flex-col rounded-3xl border-2 border-texto bg-fundo p-7 sm:p-9">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[0.95rem] font-semibold tracking-[0.02em] text-suave uppercase">
                    {PLANOS.anual.rotulo}
                  </p>
                  <p className="rounded-full bg-destaque px-3 py-1 text-[0.8rem] font-semibold text-superficie">
                    {CORTESIA} meses por conta nossa
                  </p>
                </div>

                <p className="mt-5 flex items-baseline gap-2">
                  <span className="text-[3.4rem] leading-none font-semibold tracking-[-0.035em] tabular-nums text-texto sm:text-[4rem]">
                    {ANUAL}
                  </span>
                  <span className="text-[1.05rem] text-suave">por ano</span>
                </p>
                <p className="mt-4 max-w-lg leading-relaxed text-suave">
                  Um pagamento cobre {MESES_DO_CICLO.anual} meses, à vista, no
                  Pix, no débito ou no cartão de crédito.
                </p>

                {/*
                  A conta aberta, com os três números que a sustentam. É a mesma
                  economia que o painel mostra na hora de escolher o ciclo, e a
                  mesma que precos.test.ts confere contra a frase de venda.
                */}
                <dl className="mt-7 max-w-md rounded-2xl border border-borda bg-superficie px-5 py-4 text-[0.95rem]">
                  <div className="flex items-baseline justify-between gap-4 border-b border-borda py-2">
                    <dt className="text-suave">
                      {MESES_DO_CICLO.anual} meses pagando por mês
                    </dt>
                    <dd className="font-semibold tabular-nums text-texto">
                      {DOZE_MENSALIDADES}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-borda py-2">
                    <dt className="text-suave">Um ano pago de uma vez</dt>
                    <dd className="font-semibold tabular-nums text-texto">
                      {ANUAL}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="font-medium text-texto">Fica com você</dt>
                    <dd className="font-semibold tabular-nums text-destaque">
                      {ECONOMIA}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-suave">
                  {ECONOMIA} pagam {CORTESIA} mensalidades de {MENSAL}, e ainda
                  sobra troco. É daí que saem os {CORTESIA} meses por conta
                  nossa.
                </p>

                <div className="mt-7">
                  <Assinar ciclo="anual" href={paraAssinar("anual")} />
                </div>
              </div>
            </div>

            {/* A faixa do gratuito fecha a linha, do tamanho que ela pede. */}
            <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-borda border-dashed bg-fundo px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl leading-relaxed text-suave">
                <span className="font-semibold text-texto">Gratuito:</span> a
                página no ar no seu endereço, com catálogo, horário e botão de
                conversa, e a assinatura do {NOME_PRODUTO} no rodapé. Ela vale
                pelo tempo que você quiser.
              </p>
              <a
                href="#comecar"
                className="shrink-0 font-medium text-destaque underline-offset-4 hover:underline"
              >
                Escolher meu endereço
              </a>
            </div>
          </div>
        </section>

        <section aria-labelledby="limites" className="border-t border-borda">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <div className="lg:grid lg:grid-cols-[20rem_1fr] lg:gap-16">
              <div className="lg:sticky lg:top-16 lg:self-start">
                <h2
                  id="limites"
                  className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
                >
                  O que cada plano abre.
                </h2>
                <p className="mt-4 max-w-sm leading-relaxed text-suave">
                  Os limites vivem numa função só no banco, e são estes.
                </p>
              </div>

              <div className="surge mt-10 overflow-x-auto lg:mt-0">
                <table className="w-full min-w-[22rem] border-collapse text-left">
                  <caption className="sr-only">
                    Limites e recursos de cada plano
                  </caption>
                  <thead>
                    <tr className="border-b border-borda">
                      <th
                        scope="col"
                        className="py-3 pr-4 text-[0.95rem] font-semibold text-texto"
                      >
                        Na sua página
                      </th>
                      <th
                        scope="col"
                        className="py-3 pr-4 text-[0.95rem] font-semibold text-texto"
                      >
                        Gratuito
                      </th>
                      <th
                        scope="col"
                        className="py-3 text-[0.95rem] font-semibold text-destaque"
                      >
                        Pago
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {NA_PAGINA.map((linha) => (
                      <tr key={linha.o} className="border-b border-borda">
                        <th
                          scope="row"
                          className="py-3.5 pr-4 text-[0.95rem] leading-snug font-medium text-texto"
                        >
                          {linha.o}
                        </th>
                        <td className="py-3.5 pr-4 text-[0.95rem] leading-snug tabular-nums text-suave">
                          {linha.gratuito}
                        </td>
                        <td className="py-3.5 text-[0.95rem] leading-snug font-medium tabular-nums text-texto">
                          {linha.pago}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="mt-6 max-w-xl leading-relaxed text-suave">
                  Voltar para o gratuito mantém tudo o que já está cadastrado. O
                  limite vale para o próximo item, e o seu trabalho fica onde
                  está.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="meios"
          className="border-t border-borda bg-superficie"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-24">
            <h2
              id="meios"
              className="max-w-xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Como pagar.
            </h2>

            <dl className="mt-12">
              {MEIOS.map((meio) => (
                <div
                  key={meio.titulo}
                  className="surge grid gap-2 border-t border-borda py-7 first:border-t-0 first:pt-0 sm:grid-cols-[14rem_1fr] sm:gap-8"
                >
                  <dt className="text-[1.15rem] font-semibold tracking-[-0.015em] text-texto">
                    {meio.titulo}
                  </dt>
                  <dd className="max-w-xl leading-relaxed text-suave text-pretty">
                    {meio.texto}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-10 max-w-2xl leading-relaxed text-suave">
              Os campos do cartão são do Mercado Pago e vão direto para ele. O{" "}
              {NOME_PRODUTO} recebe a confirmação e os quatro últimos dígitos, e
              a tela do começo ao fim é a nossa.
            </p>
          </div>
        </section>

        <section aria-labelledby="duvidas" className="border-t border-borda">
          <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-24">
            <h2
              id="duvidas"
              className="max-w-xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              O que costuma ser perguntado.
            </h2>

            <dl className="mt-12 grid gap-x-12 sm:grid-cols-2">
              {PERGUNTAS.map((p) => (
                <div key={p.titulo} className="surge border-t border-borda py-6">
                  <dt className="text-[1.05rem] font-semibold tracking-[-0.015em] text-texto">
                    {p.titulo}
                  </dt>
                  <dd className="mt-2 leading-relaxed text-suave text-pretty">
                    {p.texto}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-10 leading-relaxed text-suave">
              As mesmas regras, escritas por inteiro, estão nos{" "}
              <Link
                href="/termos"
                className="font-medium text-destaque underline-offset-4 hover:underline"
              >
                termos de uso
              </Link>
              .
            </p>
          </div>
        </section>

        {/*
          O fecho é o mesmo campo da tela inicial: a página começa gratuita, e
          o caminho de entrada é escolher o endereço. Quem vem para assinar já
          passou pelas duas caixas lá em cima.
        */}
        <section
          aria-labelledby="comecar"
          className="border-t border-borda bg-superficie"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-24">
            <h2
              id="comecar"
              className="max-w-lg text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Comece pelo endereço. O plano vem depois.
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-suave">
              Escreva o nome do negócio e veja como fica o endereço dele.
            </p>
            <div className="mt-9 max-w-lg">
              <CampoAbertura
                rotulo={CADASTRO_ABERTO ? "Criar meu endereço" : "Continuar"}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-borda">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-suave">
          <p>{NOME_PRODUTO}, presença profissional para o negócio local.</p>
          <div className="flex gap-5">
            <Link href="/termos" className="underline underline-offset-2">
              Termos
            </Link>
            <Link href="/privacidade" className="underline underline-offset-2">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Um dos dois lados da comparação: o aparelho e o rodapé daquele plano.
 *
 * O aparelho mostra o alto da página, que é onde a letra aparece no nome do
 * negócio. O rodapé de verdade entra logo abaixo, porque a assinatura fica no
 * fim da página e a janela do aparelho para antes dela. Os dois são as peças
 * que rodam na página do cliente, então esta tela nunca promete o que o
 * produto entrega diferente.
 */
function Lado({
  rotulo,
  legenda,
  negocio,
  prioridade = false,
}: {
  rotulo: string;
  legenda: string;
  negocio: Negocio;
  prioridade?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[19rem]">
      <p className="text-[0.95rem] font-semibold tracking-[0.02em] text-suave uppercase">
        {rotulo}
      </p>

      <div className="mt-4">
        <Telefone negocio={negocio} prioridade={prioridade} leve />
      </div>

      {/*
        Decorativo, como o aparelho: é uma amostra do rodapé, e os links de
        verdade dele moram na página do negócio. `aria-hidden` mantém o leitor
        de tela lendo a legenda, que é onde está a informação, e `inert` tira
        os dois links do caminho do teclado, senão sobrariam quatro paradas de
        tabulação apontando para páginas de exemplo.
      */}
      <div
        aria-hidden
        inert
        className="pointer-events-none mt-5 overflow-hidden rounded-2xl border border-borda bg-superficie"
      >
        <div className="pt-4">
          <Rodape negocio={negocio} />
        </div>
      </div>

      <p className="mt-4 leading-relaxed text-suave text-pretty">{legenda}</p>
    </div>
  );
}

/**
 * O botão de assinar.
 *
 * Enquanto o cadastro está fechado, ele dá lugar a uma linha que diz o que
 * acontece agora, em vez de levar a pessoa a uma tela que responde 404.
 */
function Assinar({ ciclo, href }: { ciclo: Ciclo; href: string }) {
  if (!CADASTRO_ABERTO) {
    return (
      <p className="text-[0.95rem] leading-relaxed text-suave">
        A assinatura abre junto com o login, que é a próxima etapa. O endereço
        que você escolher agora continua seu.
      </p>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-13 w-full items-center justify-center rounded-full bg-texto px-7 text-[1.05rem] font-semibold text-superficie sm:w-auto"
    >
      Assinar o {PLANOS[ciclo].rotulo.toLowerCase()}
    </Link>
  );
}
