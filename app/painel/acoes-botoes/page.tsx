import Link from "next/link";
import { salvarAcoes } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import { BarraSalvar, Botao } from "@/componentes/painel/Campos";
import { BotoesDaPagina } from "@/componentes/painel/PreviaDosBotoes";
import { doDono } from "@/lib/dados";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

/**
 * Os dois botões presos no rodapé da página pública.
 *
 * **Esta tela e a de links extras põem link na página, e são coisas
 * diferentes.** Aqui é o botão de falar com a dona: um só, no máximo dois,
 * presos embaixo, por cima do que estiver rolando, e é o que `passosParaOAr`
 * conta como "como falar" na hora de dizer se a página pode ir para o ar. Lá é
 * a lista de para onde a página aponta, dentro do corpo, perto do fim, e a
 * página inteira funciona sem ela.
 *
 * A diferença também é de dado, e não só de desenho: estes dois moram em jsonb
 * na linha do negócio, aceitam WhatsApp e telefone além de link, e têm a lista
 * de ícones inteira. Os links extras moram em tabela própria, com o limite de
 * oito do plano gratuito num gatilho e cinco ícones numa constraint. Juntar as
 * duas telas daria um Salvar respondendo por dois limites e duas frases de
 * recusa, e a parede dos oito links apareceria na cara de quem estava mexendo
 * no botão do WhatsApp.
 *
 * O que faltava era a tela dizer isso sem depender de a pessoa ler. As duas
 * abrem com o mesmo desenho da página, e o que muda entre elas é qual pedaço
 * está aceso. Ver componentes/painel/MapaDaPagina.tsx.
 */
export default async function Acoes({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  return (
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

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-texto">
        Botões da página
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
        O botão de falar com você. Aponte para o WhatsApp, para a sua agenda ou
        para o link que você quiser.
      </p>
      {/* Alvo de 44, e por isso em linha própria: dentro do parágrafo o link
          media 39 pixels de altura, que é menos do que um dedo acerta. */}
      <p className="text-sm">
        <Link
          href="/painel/links"
          className="-mx-1 inline-flex min-h-11 items-center px-1 font-medium text-destaque underline-offset-4 hover:underline"
        >
          A lista de links do fim da página fica em Links extras
        </Link>
      </p>

      <Aviso salvo={params.salvo === "1"} erro={params.erro} />

      <form action={salvarAcoes}>
        <BotoesDaPagina negocio={negocio} />
        <BarraSalvar>
          <Botao type="submit">Salvar</Botao>
        </BarraSalvar>
      </form>
    </main>
  );
}
