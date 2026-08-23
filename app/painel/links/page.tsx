import Link from "next/link";
import {
  acrescentarLink,
  descerLink,
  removerLink,
  salvarLinks,
  subirLink,
} from "./acoes";
import { ICONES_DE_LINK } from "./icones";
import { AtalhoDeAcrescentar, IconeMais } from "@/componentes/painel/Acrescentar";
import { Aviso } from "@/componentes/painel/Aviso";
import {
  BarraSalvar,
  Botao,
  Escolha,
  Texto,
} from "@/componentes/painel/Campos";
import { FocarNoNovo } from "@/componentes/painel/FocarNoNovo";
import { MapaDaPagina } from "@/componentes/painel/MapaDaPagina";
import { Cartao } from "@/componentes/painel/Ordem";
import { LinksExtras } from "@/componentes/LinksExtras";
import { doDono } from "@/lib/dados";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

/** O endereço curtinho, para caber na linha fechada do celular. */
function enxuto(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");
    return pathname === "/" ? host : `${host}${pathname}`;
  } catch {
    return url;
  }
}

/**
 * Os links extras da página.
 *
 * Mesmo desenho da tela de catálogo, e de propósito: um formulário só, a ordem
 * sendo a posição na lista, e subir e descer no lugar de arrastar. Quem aprende
 * uma das duas telas já sabe a outra. O retorno de acrescentar também é o mesmo:
 * `?novo=<id>`, a linha nova chegando aberta e marcada, e o Salvar seguinte
 * devolvendo a pessoa para ela. O porquê inteiro está no topo de
 * app/painel/catalogo/page.tsx.
 *
 * Fica em tela separada do catálogo porque são dois trabalhos de momentos
 * diferentes, e porque cada uma responde por uma tabela, um limite de plano e
 * uma frase de recusa própria.
 *
 * **E fica em tela separada dos botões do rodapé, que é a queixa de "Links
 * extras parece duplicado".** As duas põem link na página, e param de se parecer
 * assim que a pessoa vê onde cada uma cai: o botão do rodapé fica preso embaixo,
 * por cima do que estiver rolando, e é o caminho de falar com a dona; esta lista
 * é uma seção dentro do corpo, perto do fim, e é para onde a página aponta. As
 * duas telas abrem com o mesmo desenho da página, e o que muda é o pedaço aceso.
 * Ver componentes/painel/MapaDaPagina.tsx.
 *
 * São cinco ícones, e a lista curta vem do banco: a constraint
 * `icone_conhecido` da tabela `links` aceita exatamente esses cinco. Ver
 * app/painel/links/icones.ts.
 */
export default async function Links({
  searchParams,
}: {
  searchParams: Promise<{
    salvo?: string;
    novo?: string;
    aberto?: string;
    removido?: string;
    movido?: string;
    erro?: string;
  }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  const links = negocio.links;
  const total = links.length;

  const emFoco = params.novo ?? params.aberto ?? null;
  const indiceEmFoco = links.findIndex((l) => l.id === emFoco);

  const feito = params.novo
    ? "Link acrescentado à página."
    : params.removido
      ? "Link removido da página."
      : params.movido
        ? "Nova ordem guardada."
        : params.salvo
          ? "Alterações salvas."
          : null;

  return (
    <main className="mt-6">
      <Link
        href="/painel"
        /* O respiro vem de dentro do alvo, e a margem negativa devolve o
           alinhamento: o dedo ganha 44 de altura sem o desenho mudar. */
        className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm text-suave lg:hidden"
      >
        Voltar
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-texto">
        Links extras
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
        É a seção Links, no corpo da sua página, perto do fim: Instagram,
        portfólio, a agenda online, o que você quiser apontar.{" "}
        <Link
          href="/painel/acoes-botoes"
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          O botão preso no rodapé fica em Botões da página
        </Link>
      </p>

      <Aviso salvo={feito !== null} mensagem={feito ?? undefined} erro={params.erro} />

      {/*
        O desenho antes da lista, e não depois. A pergunta de quem abre esta tela
        pela segunda vez é "esta é a que fica embaixo ou a que fica no meio", e
        ela precisa de resposta antes de a pessoa começar a mexer nos campos.
      */}
      <div className="mt-5">
        <MapaDaPagina
          negocio={negocio}
          zona="links"
          chamada="Na sua página, esta lista fica no corpo, logo antes do fim:"
        >
          {total > 0 ? (
            <LinksExtras negocio={negocio} />
          ) : (
            <p className="rounded-lg border border-dashed border-borda px-3 py-2 text-[0.7rem] leading-relaxed text-suave">
              O primeiro link que entrar aqui aparece neste lugar.
            </p>
          )}
        </MapaDaPagina>
      </div>

      {total > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-suave">
            <span className="font-medium text-texto">
              {total} {total === 1 ? "link" : "links"}
            </span>{" "}
            na sua página, nesta ordem.
          </p>
          <AtalhoDeAcrescentar href="#acrescentar">
            Acrescentar link
          </AtalhoDeAcrescentar>
        </div>
      ) : (
        <p className="mt-5 max-w-prose rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
          A seção Links aparece na sua página assim que o primeiro link entrar
          aqui. O Instagram é o mais comum, e costuma ser o primeiro.
        </p>
      )}

      <form action={salvarLinks} className="mt-4 flex flex-col gap-3 lg:max-w-xl">
        {/* O id da linha em foco viaja com o formulário para o Salvar devolver a
            pessoa para ela. Ver o comentário no topo de catalogo/page.tsx. */}
        <input type="hidden" name="novo" value={emFoco ?? ""} />

        {links.map((link, i) => (
          <Cartao
            key={link.id}
            id={`link-${i}`}
            numero={i + 1}
            total={total}
            nome={link.rotulo}
            detalhe={enxuto(link.url)}
            prefixo="link"
            aberto={link.id === emFoco}
            novo={link.id === params.novo}
            subir={subirLink}
            descer={descerLink}
            remover={removerLink}
          >
            <input type="hidden" name={`link-${i}-id`} value={link.id} />

            <Texto
              id={`link-${i}-rotulo`}
              rotulo="Texto do botão"
              dica="Diga para onde ele leva. Por exemplo: Ver o portfólio."
              valor={link.rotulo}
              maxLength={40}
            />
            {/*
              Sem type="url" de propósito, como nos botões do rodapé. O
              navegador exigiria o https escrito na mão e travaria o envio de
              "marinayoga.com.br", que o servidor aceita e completa. Quem
              confere é lib/links.ts, que recusa dizendo o motivo.
            */}
            <Texto
              id={`link-${i}-url`}
              rotulo="Endereço"
              dica="O endereço completo, do jeito que ele abre no navegador."
              valor={link.url}
              inputMode="url"
              autoComplete="off"
            />
            <Escolha
              id={`link-${i}-icone`}
              rotulo="Ícone"
              valor={link.icone}
              opcoes={ICONES_DE_LINK}
            />
          </Cartao>
        ))}

        <fieldset
          id="acrescentar"
          className="mt-2 flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-dashed border-borda bg-fundo p-4 lg:scroll-mt-8"
        >
          <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold text-texto">
            <IconeMais className="h-4 w-4 text-destaque" />
            Acrescentar link
          </legend>

          <Texto
            id="novo-rotulo"
            rotulo="Texto do botão"
            dica="Por exemplo: Ver o Instagram."
            valor={null}
            maxLength={40}
            autoComplete="off"
          />
          <Texto
            id="novo-url"
            rotulo="Endereço"
            dica="Cole o endereço direto. O encurtado esconde para onde leva, e a página recusa ele."
            valor={null}
            inputMode="url"
            autoComplete="off"
          />
          {/* O genérico continua sendo o padrão da coluna, e é o único que
              nunca desenha um símbolo de rede errado em cima do link da
              pessoa. Quem quer o do Instagram escolhe, e ele abre a lista. */}
          <Escolha
            id="novo-icone"
            rotulo="Ícone"
            valor="link"
            opcoes={ICONES_DE_LINK}
          />

          <div className="lg:max-w-56">
            <Botao type="submit" formAction={acrescentarLink} tom="leve">
              Acrescentar à página
            </Botao>
          </div>
        </fieldset>

        {total > 0 ? (
          <BarraSalvar>
            <Botao type="submit">Salvar</Botao>
          </BarraSalvar>
        ) : null}
      </form>

      {/*
        A rolagem para na linha que acabou de nascer. Sem cursor: o link chega
        com rótulo, endereço e ícone já escritos, então nada sobrou para digitar
        e abrir o teclado do celular só cobriria a linha que ela veio conferir.
      */}
      {params.novo && indiceEmFoco >= 0 ? (
        <FocarNoNovo cartao={`link-${indiceEmFoco}`} />
      ) : null}
    </main>
  );
}
