import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { exigirLogin } from "@/app/painel/vitrine";
import { IconeAvancar } from "@/componentes/Icones";
import { IconeConferido, Passo } from "@/componentes/painel/PassoDaCompra";
import { BotaoDeAcao } from "@/componentes/painel/BotaoDeAcao";
import { AvisoCobranca } from "@/componentes/painel/AvisoCobranca";
import { CamposCartao } from "@/componentes/painel/CamposCartao";
import {
  FaixaDeRecado,
  IconeConfirmado,
  IconeGirando,
} from "@/componentes/painel/Sinais";
import { cobrancaDoDono } from "@/lib/dados";
import { preco } from "@/lib/formato";
import { NOME_PRODUTO } from "@/lib/marca";
import {
  DIAS_DE_TESTE,
  PLANOS,
  economiaAnualEmCentavos,
  gateway,
  mensagemDeRecusa,
} from "@/lib/pagamento";
import type { Ciclo } from "@/lib/pagamento";
import { contaProvisoria } from "@/lib/supabase/servidor";
import { assinarComCartao, cancelarPlano, pagarComPix } from "./acoes";
import { COOKIE_DO_PIX } from "./cookie";

export const metadata: Metadata = {
  title: `Plano, ${NOME_PRODUTO}`,
  robots: { index: false, follow: false },
};

/**
 * A tela do plano: escolher, pagar, acompanhar e cancelar.
 *
 * `force-dynamic` é estrutural aqui, e não hábito. A tela de espera se recarrega
 * sozinha; numa resposta em cache ela se recarregaria para sempre mostrando a
 * mesma coisa velha.
 *
 * Um endereço só, com o estado escolhido por search param. A escolha do meio é
 * navegação, e não estado de cliente, e isso paga em duas moedas: o SDK do
 * Mercado Pago só existe no caminho do cartão, e o caminho do Pix funciona sem
 * JavaScript nenhum, que é o que segura a tela em pé quando o script de
 * terceiro falha em carregar.
 *
 * Quem escreve plano é o webhook, e ninguém mais. Por isso a tela nunca sabe o
 * desfecho na hora: ela manda a cobrança e passa a conferir a própria linha do
 * negócio, que é o que `abrir_assinatura` escreve do outro lado.
 *
 * Para exercitar isso na máquina: o Mercado Pago alcança o `localhost` de jeito
 * nenhum, então o aviso nunca chega e a espera sempre vai até o limite. Quem
 * fecha o ciclo local é `npm run aviso -- assinatura <id do preapproval>`.
 */
export const dynamic = "force-dynamic";

/** Quanto tempo a tela de espera continua se recarregando. */
const ESPERA_MAXIMA_MS = 120_000;
const RECARGA_DA_ESPERA_MS = 5000;
const RECARGA_DO_PIX_MS = 10_000;

const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";

type Busca = {
  meio?: string;
  ciclo?: string;
  erro?: string;
  codigo?: string;
  cancelado?: string;
  aguardando?: string;
  desde?: string;
};

function cicloDaBusca(bruto: string | undefined): Ciclo {
  return bruto === "anual" ? "anual" : "mensal";
}

function dataCurta(iso: string | null): string | null {
  if (!iso) return null;
  const quando = Date.parse(iso);
  if (Number.isNaN(quando)) return null;
  return new Date(quando).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export default async function Plano({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  exigirLogin();

  const [params, estado, provisoria] = await Promise.all([
    searchParams,
    cobrancaDoDono(),
    contaProvisoria(),
  ]);

  const ciclo = cicloDaBusca(params.ciclo);
  const assinatura = estado.assinatura;
  const viva = assinatura !== null && assinatura.status !== "encerrada";

  // Chegar aqui já com plano pago encerra qualquer espera: é o sinal de que o
  // webhook chegou.
  const confirmado = estado.plano === "pago" || viva;

  const desde = Number(params.desde ?? 0);
  const decorrido =
    Number.isFinite(desde) && desde > 0 ? Date.now() - desde : 0;
  const esperando =
    params.aguardando !== undefined &&
    !confirmado &&
    decorrido < ESPERA_MAXIMA_MS;
  const desistiu =
    params.aguardando !== undefined &&
    !confirmado &&
    decorrido >= ESPERA_MAXIMA_MS;

  return (
    <div className="pb-16 lg:max-w-2xl">
      <h1 className="titulo text-2xl text-texto">Plano</h1>

      <AvisoCobranca erro={params.erro} />

      {params.cancelado === "1" ? (
        <p
          role="status"
          className="mt-4 rounded-xl bg-aberto-fundo px-4 py-3 text-sm leading-relaxed font-medium text-aberto-texto"
        >
          Cancelamento registrado. O plano pago vale até o fim do período que já
          está pago.
        </p>
      ) : null}

      {esperando || desistiu ? (
        <Espera esperando={esperando} ciclo={ciclo} meio={params.aguardando} />
      ) : confirmado ? (
        <Assinado estado={estado} />
      ) : provisoria ? (
        <PrecisaEntrar />
      ) : params.meio === "credito" ? (
        <Cartao ciclo={ciclo} />
      ) : params.meio === "pix" ? (
        <Pix ciclo={ciclo} mostrarCodigo={params.codigo === "1"} />
      ) : (
        <Escolha ciclo={ciclo} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* A escolha                                                                   */
/* -------------------------------------------------------------------------- */

function Escolha({ ciclo }: { ciclo: Ciclo }) {
  const economia = preco(economiaAnualEmCentavos());
  const escolhido = PLANOS[ciclo];
  const valor = preco(escolhido.valorCentavos);

  return (
    <div className="mt-6 flex flex-col gap-9">
      <Passo
        numero={1}
        titulo="Período"
        estado="feito"
        marca={`${escolhido.rotulo}, ${valor}`}
      >
        <div className="mt-3 flex flex-col gap-2">
          {(["mensal", "anual"] as const).map((c) => {
            const marcado = ciclo === c;
            return (
              <Link
                key={c}
                href={`/painel/plano?ciclo=${c}`}
                aria-current={marcado ? "true" : undefined}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
                  marcado
                    ? "border-texto bg-superficie shadow-[0_1px_2px_rgba(28,25,23,0.06)]"
                    : "border-borda bg-superficie hover:border-texto/30"
                }`}
              >
                {/*
                  O visto ocupa lugar nos dois cartões, marcado ou não: assim a
                  linha do texto começa na mesma coluna nos dois e o cartão
                  escolhido some com a moldura vazia em vez de empurrar tudo.
                */}
                <span
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    marcado
                      ? "border-texto bg-texto text-superficie"
                      : "border-borda"
                  }`}
                >
                  {marcado ? <IconeConferido className="h-3 w-3" /> : null}
                </span>

                {/*
                  O nome sozinho, sem repetir "Escolhido" ao lado: quem diz
                  isso aqui é o visto preenchido, e o cabeçalho do passo já
                  carrega o nome e o preço escolhidos. Com as três coisas a
                  mesma informação aparecia três vezes em duas linhas.
                */}
                <span className="flex-1">
                  <span className="block text-[1.05rem] leading-snug text-texto">
                    {PLANOS[c].rotulo}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-suave">
                    {PLANOS[c].descricao}
                    {c === "anual" ? ` Economia de ${economia} no ano.` : ""}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </Passo>

      <Passo numero={2} titulo="Como pagar" estado="agora">
        <p className="mt-1 text-sm leading-relaxed text-suave">
          Os dois cobram os {valor} do plano {escolhido.rotulo.toLowerCase()} e
          abrem a escolha da letra, os números completos de visitas e cliques,
          limites maiores e o rodapé só seu. Escolha um deles para ir ao
          pagamento.
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {/* O Pix vem primeiro de propósito: é o caminho que funciona sem
              depender de script de terceiro carregar. */}
          <Meio
            href={`/painel/plano?meio=pix&ciclo=${ciclo}`}
            titulo="Pix"
            dica={`Aprova na hora e compra ${
              ciclo === "anual" ? "o ano" : "o mês"
            } inteiro por ${valor}. A renovação fica com você.`}
          />
          <Meio
            href={`/painel/plano?meio=credito&ciclo=${ciclo}`}
            titulo="Cartão de crédito"
            dica={`${DIAS_DE_TESTE} dias de teste antes da primeira cobrança de ${valor}, e depois renova sozinho.`}
          />
        </div>
      </Passo>

      {/*
        O link dos termos era o fim de uma frase, e media 92 por 16 pixels de
        alvo. Numa tela onde a próxima coisa que a pessoa faz é digitar um
        cartão, o texto que rege a compra merece linha e altura próprias.
      */}
      <div className="text-sm leading-relaxed text-suave">
        <p>
          Tudo o que você já cadastrou permanece salvo, em qualquer plano.
          Voltar para o gratuito muda os recursos, e mantém o conteúdo.
        </p>
        <p className="mt-1">
          <Link
            href="/termos"
            className="inline-flex min-h-11 items-center font-medium text-destaque underline-offset-4 hover:underline"
          >
            Termos de uso
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Um meio de pagamento, no passo 2.
 *
 * A seta é o que separa este cartão do cartão de período: ali o toque marca uma
 * escolha e a tela continua a mesma, aqui ele abre a tela de pagar. Eram quatro
 * retângulos iguais, e a diferença entre marcar e avançar ficava só na cabeça
 * de quem já sabia.
 */
function Meio({
  href,
  titulo,
  dica,
}: {
  href: string;
  titulo: string;
  dica: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 py-3.5 hover:border-texto"
    >
      <span className="flex-1">
        <span className="block text-[1.05rem] leading-snug text-texto">
          {titulo}
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-suave">
          {dica}
        </span>
      </span>
      <IconeAvancar className="h-4 w-4 shrink-0 text-suave" />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Cartão                                                                      */
/* -------------------------------------------------------------------------- */

function Cartao({ ciclo }: { ciclo: Ciclo }) {
  const plano = PLANOS[ciclo];

  return (
    <div className="mt-6">
      <Voltar ciclo={ciclo} />

      <h2 className="mt-3 text-lg font-semibold tracking-tight text-texto">
        Cartão de crédito
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-suave">
        {plano.descricao} Os primeiros {DIAS_DE_TESTE} dias são de teste: a
        primeira cobrança acontece no oitavo dia, e cancelar antes disso deixa o
        cartão intacto.
      </p>

      {CHAVE_PUBLICA === "" ? (
        /*
         * Só aparece em máquina de desenvolvimento sem a chave pública. O nome
         * do provedor sai daqui como sai do resto da tela: quem lê é quem está
         * configurando, e o arquivo apontado já diz de quem é a chave.
         */
        <p className="mt-4 rounded-xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
          O Pix já funciona nesta máquina. O cartão entra assim que a chave
          pública do pagamento estiver definida em{" "}
          <code className="font-sistema">.env.local</code>.{" "}
          <Link
            href={`/painel/plano?meio=pix&ciclo=${ciclo}`}
            className="inline-flex min-h-11 items-center font-medium text-destaque underline-offset-4 hover:underline"
          >
            Pagar com Pix
          </Link>
        </p>
      ) : (
        <CamposCartao
          acao={assinarComCartao}
          chavePublica={CHAVE_PUBLICA}
          ciclo={ciclo}
          rotuloDoBotao={`Começar os ${DIAS_DE_TESTE} dias`}
          caminhoPix={`/painel/plano?meio=pix&ciclo=${ciclo}`}
          frases={{
            dadosIncompletos: mensagemDeRecusa("dados_incompletos"),
            semSdk:
              "O Pix aprova na hora e compra o mesmo plano, e é a saída mais rápida daqui.",
          }}
          /*
            Duas frases, e a segunda é a exceção da regra de esconder o
            provedor. A primeira conta o caminho do número do cartão sem nomear
            ninguém, porque ali o nome é detalhe de implementação. A segunda
            nomeia de propósito: é o que ela vai ler na fatura daqui a um mês, e
            nome reconhecido na fatura é estorno que não acontece. Ver
            `NOME_NA_FATURA` em `lib/pagamento/mercadopago.ts`, que é quem
            escreve o descritor.
          */
          rodape={
            <div className="mt-6 flex flex-col gap-2 border-t border-borda pt-5 text-sm leading-relaxed text-suave">
              <p>
                Os números do cartão são digitados em campos de quem processa o
                pagamento e vão direto para lá. O {NOME_PRODUTO} recebe a
                confirmação, e mais nada.
              </p>
              <p>
                Na fatura do cartão a cobrança sai como {NOME_PRODUTO}. O
                Mercado Pago é quem processa, e o nome dele pode vir junto.
              </p>
            </div>
          }
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pix                                                                         */
/* -------------------------------------------------------------------------- */

async function Pix({
  ciclo,
  mostrarCodigo,
}: {
  ciclo: Ciclo;
  mostrarCodigo: boolean;
}) {
  const plano = PLANOS[ciclo];

  if (!mostrarCodigo) {
    return (
      <div className="mt-6">
        <Voltar ciclo={ciclo} />
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-texto">
          Pix
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-suave">
          {plano.descricao} O Pix aprova na hora, e o plano pago começa a valer
          no momento da aprovação.
        </p>

        <form action={pagarComPix} className="mt-6">
          <input type="hidden" name="ciclo" value={ciclo} />
          <BotaoDeAcao
            type="submit"
            className="flex h-13 w-full items-center justify-center rounded-full bg-texto text-[1.05rem] font-medium text-superficie"
          >
            Gerar o código de {preco(plano.valorCentavos)}
          </BotaoDeAcao>
        </form>

        <p className="mt-4 text-sm leading-relaxed text-suave">
          O código vale por trinta minutos, e dá para gerar outro depois disso.
        </p>
      </div>
    );
  }

  const jar = await cookies();
  const idExterno = jar.get(COOKIE_DO_PIX)?.value ?? "";
  const consulta = idExterno
    ? await gateway.consultarCobranca(idExterno)
    : ({ ok: false, motivo: "cobranca_ausente" } as const);

  if (!consulta.ok) {
    return (
      <div className="mt-6">
        <Voltar ciclo={ciclo} />
        <p className="mt-4 rounded-xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
          {mensagemDeRecusa(consulta.motivo)}
        </p>
      </div>
    );
  }

  const cobranca = consulta.valor;

  if (cobranca.situacao === "aprovada") {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <section
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-aberto-texto/25 bg-aberto-fundo p-5"
        >
          <div className="flex items-start gap-2.5">
            <IconeConfirmado className="mt-0.5 h-5 w-5 shrink-0 text-aberto-texto" />
            <h2 className="text-[1.05rem] leading-snug font-medium text-aberto-texto">
              Pix recebido
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-aberto-texto/80">
            O plano pago entra em instantes, assim que o aviso do banco chegar.
          </p>
        </section>

        <FaixaDeRecado tom="andamento">
          Esta tela se atualiza sozinha.
        </FaixaDeRecado>

        <Recarrega intervalo={RECARGA_DO_PIX_MS} />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Voltar ciclo={ciclo} />
      <h2 className="mt-3 text-lg font-semibold tracking-tight text-texto">
        Pague {preco(cobranca.valorCentavos)} pelo Pix
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-suave">
        Abra o aplicativo do seu banco, escolha Pix, e aponte a câmera para o
        código.
      </p>

      {cobranca.pixQrBase64 ? (
        <div className="mt-5 flex justify-center rounded-2xl border border-borda bg-superficie p-5">
          <Image
            src={`data:image/png;base64,${cobranca.pixQrBase64}`}
            alt="Código Pix para pagamento"
            width={220}
            height={220}
            unoptimized
          />
        </div>
      ) : null}

      {cobranca.pixCopiaECola ? (
        <div className="mt-4">
          <label
            htmlFor="copia-e-cola"
            className="mb-1.5 block text-sm font-medium text-texto"
          >
            Ou copie este código e cole no aplicativo do banco
          </label>
          <textarea
            id="copia-e-cola"
            readOnly
            rows={3}
            value={cobranca.pixCopiaECola}
            className="w-full rounded-xl border border-borda bg-superficie px-3.5 py-3 font-sistema text-base break-all text-texto"
          />
        </div>
      ) : null}

      {/*
        A segunda exceção da regra de esconder o provedor, e ela é do mesmo
        tamanho da primeira. O Pix sai da conta de quem processa, então é esse
        nome que aparece como recebedor na tela de confirmação do banco. Quem
        esperava ler o nome do produto e lê outro para o pagamento na metade do
        caminho, e é a metade em que o dinheiro já ia sair.
      */}
      <p className="mt-4 text-sm leading-relaxed text-suave">
        No aplicativo do banco o recebedor aparece como Mercado Pago, que é quem
        processa o pagamento do {NOME_PRODUTO}.
      </p>

      <FaixaDeRecado tom="andamento" className="mt-5">
        Esta tela confirma sozinha assim que o pagamento chegar.
      </FaixaDeRecado>

      <Recarrega intervalo={RECARGA_DO_PIX_MS} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Espera e situação                                                           */
/* -------------------------------------------------------------------------- */

/**
 * A tela entre o pagamento e o webhook.
 *
 * **Existe por um relato de uso, e ele era duro:** a dona do produto assinou de
 * verdade, caiu aqui, e leu uma caixa de texto cinza parada. Nada girava, nada
 * dizia o que estava acontecendo, e a única coisa com jeito de saída era um
 * link de 16 pixels de altura chamado "Conferir agora", que ela apertou na mão.
 * A tela estava esperando e não parecia estar.
 *
 * O que ela mostra agora é o vocabulário que o resto do painel já usa, de
 * `componentes/painel/Sinais.tsx`: o giro enquanto a escrita corre, e a mesma
 * caixa neutra do recado. Junto vai o que foi comprado, porque quem acabou de
 * digitar um cartão quer ver a compra descrita de volta antes de tudo.
 *
 * O link à mão continua, e continua de propósito: é ele que atende quem está
 * sem JavaScript. O que mudou é que ele deixou de ser a única saída, e ganhou
 * altura de dedo.
 */
function Espera({
  esperando,
  ciclo,
  meio,
}: {
  esperando: boolean;
  ciclo: Ciclo;
  meio: string | undefined;
}) {
  const plano = PLANOS[ciclo];
  const noCartao = meio === "credito";

  const resumo = noCartao
    ? `${plano.rotulo}, ${preco(plano.valorCentavos)}, no cartão de crédito.`
    : `${plano.rotulo}, ${preco(plano.valorCentavos)}.`;

  return (
    <div className="mt-6 flex flex-col gap-4">
      <section
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-borda bg-superficie p-5"
      >
        <div className="flex items-center gap-2.5">
          {esperando ? (
            <IconeGirando className="h-5 w-5 shrink-0 text-destaque motion-reduce:hidden" />
          ) : null}
          <h2 className="text-[1.05rem] leading-snug font-medium text-texto">
            {esperando
              ? "Confirmando o seu pagamento"
              : "A confirmação está demorando mais que a média"}
          </h2>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-suave">
          {esperando
            ? noCartao
              ? `O cartão já foi autorizado. O aviso do banco chega em alguns segundos, e os ${DIAS_DE_TESTE} dias de teste começam junto com ele. Esta tela se atualiza sozinha.`
              : "O pagamento já saiu. O aviso do banco chega em alguns segundos, e o plano pago começa junto com ele. Esta tela se atualiza sozinha."
            : "Assim que o aviso do banco chegar, o plano pago aparece aqui. Conferir agora traz a situação deste momento."}
        </p>

        <p className="mt-4 border-t border-borda pt-4 text-sm text-texto">
          {resumo}
        </p>
      </section>

      <p>
        <Link
          href="/painel/plano"
          className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium ${
            esperando
              ? "border border-borda text-texto hover:border-texto"
              : "bg-texto text-superficie"
          }`}
        >
          Conferir agora
        </Link>
      </p>

      {esperando ? <Recarrega intervalo={RECARGA_DA_ESPERA_MS} /> : null}
    </div>
  );
}

/**
 * O cartão de quem já tem plano, e o que fazer a partir dele.
 *
 * Ele foi refeito depois que a dona do produto mandou uma foto do que via
 * depois de assinar: três parágrafos do mesmo tamanho, um deles com o período e
 * o meio de pagamento soltos no fim, e um único botão na tela, o de cancelar.
 * A tela inteira empurrava para a saída.
 *
 * A ordem agora é a que a pessoa procura: primeiro em que situação ela está,
 * depois quando é a próxima data que importa, depois os dados da assinatura em
 * lista, e só então as duas ações, na ordem certa. A que abre a letra da página
 * é o que ela acabou de comprar, e vem em primeiro. Cancelar continua a um
 * toque, porque o decreto do SAC manda ser tão fácil quanto assinar, e agora
 * ele está onde uma saída fica, no fim e com a explicação junto.
 */
function Assinado({
  estado,
}: {
  estado: Awaited<ReturnType<typeof cobrancaDoDono>>;
}) {
  const assinatura = estado.assinatura;
  const ate = dataCurta(estado.expiraEm);
  const emTeste = assinatura?.status === "teste";
  const emAtraso = assinatura?.status === "em_atraso";
  const encerrada = assinatura === null || assinatura.status === "encerrada";

  const plano = PLANOS[assinatura?.ciclo === "anual" ? "anual" : "mensal"];
  const meio =
    assinatura?.meio === "credito"
      ? "Cartão de crédito"
      : assinatura?.meio === "pix"
        ? "Pix"
        : null;

  // O Pix compra um ciclo à vista e para ali, então a data dele é um fim de
  // validade, e nunca uma renovação que vai acontecer sozinha. Dizer
  // "próxima renovação" para quem pagou com Pix é prometer uma cobrança que
  // ninguém vai fazer.
  const renovaSozinho = assinatura?.meio === "credito";

  const rotuloDaData = emTeste
    ? "Primeira cobrança"
    : emAtraso
      ? "No ar até"
      : encerrada || !renovaSozinho
        ? "Vale até"
        : "Próxima renovação";

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section className="rounded-2xl border border-borda bg-superficie p-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-suave uppercase">
          Plano pago
        </p>

        <div className="mt-1.5 flex items-start gap-2.5">
          {emTeste || (!emAtraso && !encerrada) ? (
            <IconeConfirmado className="mt-0.5 h-5 w-5 shrink-0 text-aberto-texto" />
          ) : null}
          <h2 className="text-[1.15rem] leading-snug font-semibold tracking-tight text-texto">
            {emTeste
              ? `Você está nos ${DIAS_DE_TESTE} dias de teste`
              : emAtraso
                ? "O banco está tentando a cobrança de novo"
                : encerrada
                  ? "Seu plano pago vale até o fim do período"
                  : "Seu plano é o pago"}
          </h2>
        </div>

        {/*
          A data aparece uma vez só, e ela mora na lista de baixo. Esta frase
          conta o que a data significa, e é por isso que ela repete a palavra do
          rótulo em vez de repetir o dia: as duas juntas diziam
          "2 de setembro de 2026" duas vezes em quatro linhas.
        */}
        <p className="mt-2 text-sm leading-relaxed text-suave">
          {!ate
            ? "Os recursos do plano pago estão liberados."
            : emTeste
              ? "A primeira cobrança acontece no fim do teste, e cancelar antes disso deixa o cartão intacto."
              : emAtraso
                ? "Sua página segue no ar enquanto isso acontece."
                : encerrada
                  ? "Tudo o que você cadastrou continua salvo depois dessa data, em qualquer plano."
                  : renovaSozinho
                    ? "A renovação acontece sozinha, no cartão de crédito que você cadastrou."
                    : "O período comprado vale até essa data, e um Pix novo compra o período seguinte."}
        </p>

        <dl className="mt-4 flex flex-col gap-2 border-t border-borda pt-4 text-sm">
          <Linha rotulo="Período">
            {plano.rotulo}, {preco(plano.valorCentavos)}
          </Linha>
          {meio ? <Linha rotulo="Pagamento">{meio}</Linha> : null}
          {ate ? <Linha rotulo={rotuloDaData}>{ate}</Linha> : null}
        </dl>
      </section>

      {/*
        O que ela acabou de comprar, a um toque. Sem isto a tela de plano ativo
        terminava em beco: a única coisa clicável era o cancelamento.
      */}
      <section>
        <h2 className="text-sm font-medium text-texto">
          O que o plano pago abriu
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          <Atalho
            href="/painel/aparencia"
            titulo="Letras da página"
            dica="Cinco combinações, com o nome do seu negócio em cada uma."
          />
          <Atalho
            href="/painel/numeros"
            titulo="Números da página"
            dica="Visitas e cliques completos, dia a dia."
          />
        </div>
      </section>

      {encerrada ? null : (
        <form action={cancelarPlano} className="border-t border-borda pt-6">
          <p className="text-sm leading-relaxed text-suave">
            O cancelamento encerra as próximas cobranças. O plano pago segue
            valendo até o fim do período que já está pago.
          </p>
          <BotaoDeAcao
            type="submit"
            className="mt-3 h-11 rounded-full border border-borda px-5 text-sm font-medium text-texto"
          >
            Cancelar a assinatura
          </BotaoDeAcao>
        </form>
      )}
    </div>
  );
}

/** Uma linha da lista de dados da assinatura. */
function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <dt className="text-suave">{rotulo}</dt>
      <dd className="font-medium text-texto">{children}</dd>
    </div>
  );
}

/** Um recurso que o plano pago abriu, com a porta junto. */
function Atalho({
  href,
  titulo,
  dica,
}: {
  href: string;
  titulo: string;
  dica: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 py-3.5 hover:border-texto"
    >
      <span className="flex-1">
        <span className="block text-[1.05rem] leading-snug text-texto">
          {titulo}
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-suave">
          {dica}
        </span>
      </span>
      <IconeAvancar className="h-4 w-4 shrink-0 text-suave" />
    </Link>
  );
}

/**
 * O convite para sair da conta provisória.
 *
 * A frase antiga dizia só "entre com o Google para assinar", e ela lia como se
 * o produto estivesse pedindo login a quem já está dentro do painel. Quem chega
 * aqui está logado, e por isso a frase precisa nomear o estado em que ela está:
 * a conta provisória, que nasceu no primeiro clique de montar a página.
 */
function PrecisaEntrar() {
  return (
    <div className="mt-6">
      <p className="rounded-xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
        A sua página está numa conta provisória, criada no momento em que você
        começou a montar. Entrar com o Google guarda ela na sua conta de sempre,
        e é essa conta que recebe o plano.
      </p>
      <p className="mt-3">
        <Link
          href="/entrar?motivo=assinar"
          className="inline-flex h-11 items-center justify-center rounded-full bg-texto px-5 text-sm font-medium text-superficie"
        >
          Entrar com o Google
        </Link>
      </p>
    </div>
  );
}

/**
 * A volta para a escolha, levando o período junto.
 *
 * Ia para `/painel/plano` puro, e o `cicloDaBusca` lê ausência como mensal:
 * quem escolhia o anual, abria o Pix e voltava para conferir, voltava com o
 * mensal marcado e o passo 1 dizendo outra coisa do que ela tinha escolhido.
 */
function Voltar({ ciclo }: { ciclo: Ciclo }) {
  return (
    <p className="text-sm">
      <Link
        href={`/painel/plano?ciclo=${ciclo}`}
        className="-ml-1 inline-flex min-h-11 items-center gap-1.5 pr-2 pl-1 text-suave hover:text-texto"
      >
        {/* A mesma seta do passo 2, virada: um desenho só para os dois sentidos. */}
        <IconeAvancar className="h-4 w-4 shrink-0 rotate-180" />
        Voltar para os planos
      </Link>
    </p>
  );
}

/**
 * A recarga da tela de espera.
 *
 * Um script de umas sessenta letras, e não `<meta http-equiv="refresh">`: o
 * meta cai na regra `meta-refresh` do axe, que o Lighthouse roda, e o AGENTS.md
 * põe acessibilidade em 100. O comportamento é o mesmo, e quem estiver sem
 * JavaScript usa o link "Conferir agora", que fica ali dos dois jeitos.
 *
 * `location.reload()` de dentro de um `setTimeout` morre junto com a página, e
 * a tela de espera nunca aparece junto com o formulário do cartão: página que
 * se recarrega embaixo de quem está digitando um cartão seria o pior defeito
 * do produto.
 *
 * **`next/script`, e não a tag `<script>` crua.** Este é o conserto do "tem que
 * apertar em conferir agora", e o defeito estava exatamente aqui. A tag crua
 * roda quando o navegador analisa o documento, e só então: quem chega nesta
 * tela chega pelo `redirect` da Server Action, que é navegação de cliente, e aí
 * o React insere o elemento no DOM já montado e o navegador nunca executa o que
 * está dentro dele. Medido no Chromium, com o mesmo endereço: aberto por carga
 * inteira, uma recarga em sete segundos; alcançado por navegação de cliente,
 * zero. A pessoa que acabou de pagar era justamente a que caía no caminho sem
 * recarga, e por isso a tela ficou parada até ela apertar o link.
 *
 * O `id` leva o intervalo e o instante da montagem porque o `next/script`
 * guarda os ids que já rodaram no documento: com id fixo, voltar para esta tela
 * pelo botão de voltar do navegador encontraria o script marcado como usado e a
 * espera ficaria parada de novo, que é o defeito que este arquivo acabou de
 * consertar.
 */
function Recarrega({ intervalo }: { intervalo: number }) {
  return (
    <Script
      id={`recarga-${intervalo}-${Date.now()}`}
      strategy="afterInteractive"
    >
      {`setTimeout(function(){location.reload()},${intervalo})`}
    </Script>
  );
}
