import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { exigirLogin } from "@/app/painel/vitrine";
import { BotaoDeAcao } from "@/componentes/painel/BotaoDeAcao";
import { AvisoCobranca } from "@/componentes/painel/AvisoCobranca";
import { CamposCartao } from "@/componentes/painel/CamposCartao";
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
    params.aguardando !== undefined && !confirmado && decorrido < ESPERA_MAXIMA_MS;
  const desistiu =
    params.aguardando !== undefined && !confirmado && decorrido >= ESPERA_MAXIMA_MS;

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold tracking-tight text-texto">Plano</h1>

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
        <Espera esperando={esperando} />
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

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-texto">
          Escolha o período
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {(["mensal", "anual"] as const).map((c) => (
            <Link
              key={c}
              href={`/painel/plano?ciclo=${c}`}
              aria-current={ciclo === c ? "true" : undefined}
              className={`flex flex-col rounded-2xl border bg-superficie px-4 py-3.5 ${
                ciclo === c ? "border-texto" : "border-borda"
              }`}
            >
              <span className="text-[1.05rem] leading-snug text-texto">
                {PLANOS[c].rotulo}
              </span>
              <span className="mt-0.5 text-sm leading-relaxed text-suave">
                {PLANOS[c].descricao}
                {c === "anual" ? ` Economia de ${economia} no ano.` : ""}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-texto">
          Como pagar
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-suave">
          O plano pago abre a escolha da letra, os números completos de visitas e
          cliques, limites maiores e o rodapé só seu.
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {/* O Pix vem primeiro de propósito: é o caminho que funciona sem
              depender de script de terceiro carregar. */}
          <Meio
            href={`/painel/plano?meio=pix&ciclo=${ciclo}`}
            titulo="Pix"
            dica={`Aprova na hora e compra ${
              ciclo === "anual" ? "o ano" : "o mês"
            } inteiro. A renovação fica com você.`}
          />
          <Meio
            href={`/painel/plano?meio=credito&ciclo=${ciclo}`}
            titulo="Cartão de crédito"
            dica={`${DIAS_DE_TESTE} dias de teste antes da primeira cobrança, e depois renova sozinho.`}
          />
        </div>
      </section>

      <p className="text-sm leading-relaxed text-suave">
        Tudo o que você já cadastrou permanece salvo, em qualquer plano. Voltar
        para o gratuito muda os recursos, e mantém o conteúdo.{" "}
        <Link
          href="/termos"
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          Termos de uso
        </Link>
        .
      </p>
    </div>
  );
}

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
      className="flex flex-col rounded-2xl border border-borda bg-superficie px-4 py-3.5 hover:border-texto"
    >
      <span className="text-[1.05rem] leading-snug text-texto">{titulo}</span>
      <span className="mt-0.5 text-sm leading-relaxed text-suave">{dica}</span>
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
      <Voltar />

      <h2 className="mt-4 text-lg font-semibold tracking-tight text-texto">
        Cartão de crédito
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-suave">
        {plano.descricao} Os primeiros {DIAS_DE_TESTE} dias são de teste: a
        primeira cobrança acontece no oitavo dia, e cancelar antes disso deixa o
        cartão intacto.
      </p>

      {CHAVE_PUBLICA === "" ? (
        <p className="mt-4 rounded-xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
          O Pix já funciona nesta máquina. O cartão entra assim que a chave
          pública do Mercado Pago estiver definida em{" "}
          <code className="font-sistema">.env.local</code>.{" "}
          <Link
            href={`/painel/plano?meio=pix&ciclo=${ciclo}`}
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Pagar com Pix
          </Link>
          .
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
              "O Pix segue disponível enquanto os campos do cartão carregam de novo.",
          }}
        />
      )}

      <p className="mt-5 text-sm leading-relaxed text-suave">
        Os dados do cartão são digitados em campos do Mercado Pago e vão direto
        para eles. O {NOME_PRODUTO} recebe a confirmação, e mais nada.
      </p>
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
        <Voltar />
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-texto">
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
            className="h-13 w-full rounded-full bg-texto text-[1.05rem] font-medium text-superficie"
          >
            Gerar o código de {preco(plano.valorCentavos)}
          </BotaoDeAcao>
        </form>
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
        <Voltar />
        <p className="mt-4 rounded-xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
          {mensagemDeRecusa(consulta.motivo)}
        </p>
      </div>
    );
  }

  const cobranca = consulta.valor;

  if (cobranca.situacao === "aprovada") {
    return (
      <div className="mt-6">
        <p
          role="status"
          className="rounded-xl bg-aberto-fundo px-4 py-3 text-sm leading-relaxed font-medium text-aberto-texto"
        >
          Pix recebido. O plano pago entra em instantes, e esta tela avisa.
        </p>
        <Recarrega intervalo={RECARGA_DO_PIX_MS} />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Voltar />
      <h2 className="mt-4 text-lg font-semibold tracking-tight text-texto">
        Pague {preco(cobranca.valorCentavos)} pelo Pix
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-suave">
        Abra o aplicativo do seu banco, escolha Pix, e aponte a câmera para o
        código. Esta tela confirma sozinha assim que o pagamento chegar.
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
            Ou copie o código
          </label>
          <textarea
            id="copia-e-cola"
            readOnly
            rows={3}
            value={cobranca.pixCopiaECola}
            className="w-full rounded-xl border border-borda bg-superficie px-3.5 py-3 font-sistema text-xs break-all text-texto"
          />
        </div>
      ) : null}

      <Recarrega intervalo={RECARGA_DO_PIX_MS} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Espera e situação                                                           */
/* -------------------------------------------------------------------------- */

function Espera({ esperando }: { esperando: boolean }) {
  return (
    <div className="mt-6">
      <p
        role="status"
        className="rounded-xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave"
      >
        {esperando
          ? "Estamos confirmando com o banco. Esta tela se atualiza sozinha."
          : "A confirmação está demorando mais que a média. Assim que ela chegar, o plano aparece aqui."}
      </p>

      <p className="mt-3 text-sm">
        <Link
          href="/painel/plano"
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          Conferir agora
        </Link>
      </p>

      {esperando ? <Recarrega intervalo={RECARGA_DA_ESPERA_MS} /> : null}
    </div>
  );
}

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

  return (
    <div className="mt-6 flex flex-col gap-6">
      <section className="rounded-2xl border border-borda bg-superficie p-4">
        <p className="text-[1.05rem] leading-snug font-medium text-texto">
          {emTeste
            ? `Você está nos ${DIAS_DE_TESTE} dias de teste`
            : emAtraso
              ? "O banco está tentando a cobrança de novo"
              : encerrada
                ? "Sua assinatura está encerrada"
                : "Seu plano é o pago"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-suave">
          {ate
            ? emTeste
              ? `O teste vale até ${ate}, e a primeira cobrança acontece nesse dia.`
              : emAtraso
                ? `Sua página segue no ar até ${ate}.`
                : encerrada
                  ? `Os recursos do plano pago valem até ${ate}, e o conteúdo continua salvo depois disso.`
                  : `A próxima renovação acontece em ${ate}.`
            : "Os recursos do plano pago estão liberados."}
        </p>
        {assinatura?.ciclo ? (
          <p className="mt-1 text-sm text-suave">
            {PLANOS[assinatura.ciclo === "anual" ? "anual" : "mensal"].rotulo}
            {assinatura.meio === "credito"
              ? ", no cartão de crédito"
              : assinatura.meio === "pix"
                ? ", no Pix"
                : ""}
            .
          </p>
        ) : null}
      </section>

      {encerrada ? null : (
        <form action={cancelarPlano}>
          <BotaoDeAcao
            type="submit"
            className="h-11 rounded-full border border-borda px-5 text-sm font-medium text-texto"
          >
            Cancelar a assinatura
          </BotaoDeAcao>
          <p className="mt-2 text-sm leading-relaxed text-suave">
            O cancelamento encerra as próximas cobranças. O plano pago segue
            valendo até o fim do período que já está pago.
          </p>
        </form>
      )}
    </div>
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
      <p className="mt-3 text-sm">
        <Link
          href="/entrar?motivo=assinar"
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          Entrar com o Google
        </Link>
      </p>
    </div>
  );
}

function Voltar() {
  return (
    <p className="text-sm">
      <Link
        href="/painel/plano"
        className="text-suave underline-offset-4 hover:underline"
      >
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
 */
function Recarrega({ intervalo }: { intervalo: number }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `setTimeout(function(){location.reload()},${intervalo})`,
      }}
    />
  );
}
