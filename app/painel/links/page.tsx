import Link from "next/link";
import {
  acrescentarLink,
  descerLink,
  removerLink,
  salvarLinks,
  subirLink,
} from "./acoes";
import { ICONES_DE_LINK } from "./icones";
import { Aviso } from "@/componentes/painel/Aviso";
import {
  BarraSalvar,
  Botao,
  Escolha,
  Texto,
} from "@/componentes/painel/Campos";
import { Cartao } from "@/componentes/painel/Ordem";
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
 * uma das duas telas já sabe a outra.
 *
 * Fica em tela separada do catálogo porque são dois trabalhos de momentos
 * diferentes, e porque cada uma responde por uma tabela, um limite de plano e
 * uma frase de recusa própria. O porquê inteiro está no topo de
 * app/painel/catalogo/page.tsx.
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
    acrescentado?: string;
    removido?: string;
    movido?: string;
    erro?: string;
  }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  const links = negocio.links;
  const total = links.length;

  const feito = params.acrescentado
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
        São os botões da seção Links, no fim da sua página: Instagram, catálogo
        no Drive, cardápio em PDF, o que você quiser apontar. Os dois botões
        presos no rodapé ficam em{" "}
        <Link
          href="/painel/acoes-botoes"
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          Botões da página
        </Link>
        .
      </p>

      <Aviso salvo={feito !== null} mensagem={feito ?? undefined} erro={params.erro} />

      {total > 0 ? (
        <p className="mt-5 text-sm text-suave">
          <span className="font-medium text-texto">
            {total} {total === 1 ? "link" : "links"}
          </span>{" "}
          na sua página, nesta ordem.
        </p>
      ) : (
        <p className="mt-5 max-w-prose rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
          A seção Links aparece na sua página assim que o primeiro link entrar
          aqui. O Instagram é o mais comum, e costuma ser o primeiro.
        </p>
      )}

      <form action={salvarLinks} className="mt-4 flex flex-col gap-3 lg:max-w-xl">
        {links.map((link, i) => (
          <Cartao
            key={link.id}
            id={`link-${i}`}
            numero={i + 1}
            total={total}
            nome={link.rotulo}
            detalhe={enxuto(link.url)}
            prefixo="link"
            aberto={Boolean(params.acrescentado) && i === total - 1}
            subir={subirLink}
            descer={descerLink}
            remover={removerLink}
          >
            <input type="hidden" name={`link-${i}-id`} value={link.id} />

            <Texto
              id={`link-${i}-rotulo`}
              rotulo="Texto do botão"
              dica="Diga para onde ele leva. Por exemplo: Ver o cardápio completo."
              valor={link.rotulo}
              maxLength={40}
            />
            {/*
              Sem type="url" de propósito, como nos botões do rodapé. O
              navegador exigiria o https escrito na mão e travaria o envio de
              "doceria.com.br", que o servidor aceita e completa. Quem confere é
              lib/links.ts, que recusa dizendo o motivo.
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

        <fieldset className="mt-2 flex flex-col gap-4 rounded-2xl border border-dashed border-borda bg-fundo p-4">
          <legend className="px-1 text-sm font-semibold text-texto">
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
    </main>
  );
}
