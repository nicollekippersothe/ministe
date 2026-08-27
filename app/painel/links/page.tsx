import Link from "next/link";
import { salvarAcoes } from "../acoes";
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
import { BarraSalvar, Botao, Escolha, Texto } from "@/componentes/painel/Campos";
import { FocarNoNovo } from "@/componentes/painel/FocarNoNovo";
import { LinksEBotoes } from "@/componentes/painel/LinksEBotoes";
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
 * Os dois lugares da página que levam para outro lugar.
 *
 * **Eram duas telas até o item 6 da auditoria.** `/painel/acoes-botoes` cuidava
 * do botão preso no rodapé e `/painel/links` da seção do corpo, e cada uma
 * abria com um parágrafo dizendo que ela não era a outra, mais um link para a
 * outra. Duas telas que precisam se explicar uma pela outra são um sintoma da
 * divisão, e não um problema de texto: a comparação que resolvia a dúvida
 * dependia de memória, e o que ficava na memória era o texto.
 *
 * Aqui as duas ficam à vista, com um desenho só acendendo os dois pedaços. O
 * porquê por extenso, junto do motivo de continuarem sendo dois formulários,
 * está em componentes/painel/LinksEBotoes.tsx.
 *
 * A lista guarda o desenho da tela de catálogo, e de propósito: um formulário
 * só, a ordem sendo a posição na lista, e subir e descer no lugar de arrastar.
 * Quem aprende uma das duas telas já sabe a outra. O retorno de acrescentar
 * também é o mesmo: `?novo=<id>`, a linha nova chegando aberta e marcada, e o
 * Salvar seguinte devolvendo a pessoa para ela. O porquê inteiro está no topo
 * de app/painel/catalogo/page.tsx.
 *
 * São cinco ícones na lista, e a lista curta vem do banco: a constraint
 * `icone_conhecido` da tabela `links` aceita exatamente esses cinco. O botão do
 * rodapé tem a lista inteira, porque ele mora em jsonb e nunca passou por essa
 * constraint. Ver app/painel/links/icones.ts.
 */
export default async function LinksEBotoesDaPagina({
  searchParams,
}: {
  searchParams: Promise<{
    salvo?: string;
    novo?: string;
    aberto?: string;
    removido?: string;
    movido?: string;
    erro?: string;
    onde?: string;
  }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  const links = negocio.links;
  const total = links.length;

  const emFoco = params.novo ?? params.aberto ?? null;
  const indiceEmFoco = links.findIndex((l) => l.id === emFoco);

  /*
   * Qual das duas seções está respondendo.
   *
   * As duas gravam links, as duas levantam as mesmas recusas de
   * `conferirLink`, e as duas voltam para este mesmo endereço. Sem o `onde`, a
   * frase "Confira o endereço do link" apareceria nas duas ao mesmo tempo, e a
   * pessoa iria conferir o campo errado. A lista é o padrão porque as ações
   * dela são cinco e todas voltam para cá; só o botão do rodapé escreve `onde`.
   */
  const doBotao = params.onde === "botao";

  const recadoDosBotoes =
    params.salvo === "botao" ? "Alterações salvas." : undefined;

  /*
   * O recado da lista, e o que fica de fora dele.
   *
   * Só o Salvar entra na barra. Acrescentar, mover e remover devolvem a pessoa
   * para a linha que mudou, com âncora, e a linha nova já chega piscando e com
   * o selo: pôr a confirmação na barra do rodapé nesses três casos seria
   * disputar a atenção com a resposta que ela já está olhando. Ver o `novo` do
   * Cartao em componentes/painel/Ordem.tsx.
   */
  const naLista = params.salvo === "lista";
  const feito = params.novo
    ? "Link acrescentado à página."
    : params.removido
      ? "Link removido da página."
      : params.movido
        ? "Nova ordem guardada."
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

      <h1 className="titulo mt-2 text-2xl text-texto">
        Links e botões
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
        Os dois lugares da sua página que levam para outro lugar. Um fica preso
        embaixo o tempo todo, o outro é uma lista dentro do corpo.
      </p>

      <LinksEBotoes
        negocio={negocio}
        salvarBotoes={salvarAcoes}
        recadoDosBotoes={recadoDosBotoes}
        avisoDosBotoes={
          doBotao && params.erro ? <Aviso erro={params.erro} /> : null
        }
        previaDosLinks={
          total > 0 ? (
            <LinksExtras negocio={negocio} />
          ) : (
            <p className="rounded-lg border border-dashed border-borda px-3 py-2 text-[0.7rem] leading-relaxed text-suave">
              O primeiro link que entrar aqui aparece neste lugar.
            </p>
          )
        }
      >
        <section aria-labelledby="titulo-lista">
          <h2
            id="titulo-lista"
            className="text-lg font-semibold tracking-tight text-texto"
          >
            A lista no corpo, perto do fim
          </h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-suave">
            Para onde a sua página aponta: Instagram, portfólio, a agenda
            online, o que você quiser.
          </p>

          <Aviso
            salvo={feito !== null}
            mensagem={feito ?? undefined}
            erro={doBotao ? undefined : params.erro}
          />

          {total > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
            <p className="mt-4 max-w-prose rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
              A seção Links aparece na sua página assim que o primeiro link
              entrar aqui. O Instagram é o mais comum, e costuma ser o primeiro.
            </p>
          )}

          <form action={salvarLinks} className="mt-4 flex flex-col gap-3">
            {/* O id da linha em foco viaja com o formulário para o Salvar
                devolver a pessoa para ela. Ver catalogo/page.tsx. */}
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
                  Sem type="url" de propósito, como no botão do rodapé. O
                  navegador exigiria o https escrito na mão e travaria o envio
                  de "marinayoga.com.br", que o servidor aceita e completa. Quem
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
              <BarraSalvar recado={naLista ? "Alterações salvas." : undefined}>
                <Botao type="submit">Salvar os links</Botao>
              </BarraSalvar>
            ) : null}
          </form>
        </section>
      </LinksEBotoes>

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
