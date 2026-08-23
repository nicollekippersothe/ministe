import Link from "next/link";
import {
  acrescentarItem,
  descerItem,
  removerItem,
  salvarItens,
  subirItem,
} from "./acoes";
import { AtalhoDeAcrescentar, IconeMais } from "@/componentes/painel/Acrescentar";
import { Aviso } from "@/componentes/painel/Aviso";
import {
  AreaTexto,
  BarraSalvar,
  Botao,
  Marcar,
  Texto,
} from "@/componentes/painel/Campos";
import { FocarNoNovo } from "@/componentes/painel/FocarNoNovo";
import { Cartao } from "@/componentes/painel/Ordem";
import { PreviaDoItem } from "@/componentes/painel/PreviaDoItem";
import { doDono } from "@/lib/dados";
import { preco, precoEditavel } from "@/lib/formato";
import type { Item } from "@/lib/tipos";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

/**
 * O catálogo do painel.
 *
 * Uma tela só, e um formulário só. Todos os botões (salvar, subir, descer,
 * remover, acrescentar) enviam esse mesmo formulário, então o que a pessoa
 * digitou continua na tela depois de qualquer toque. Ver app/painel/catalogo/acoes.ts.
 *
 * Fica separada dos links extras, embora as duas listas se pareçam. São dois
 * trabalhos de momentos diferentes: o catálogo é o que a pessoa vende, e se
 * mexe nele toda semana; os links são para onde a página aponta, e se mexe
 * neles uma vez. Juntas seriam vinte e oito linhas numa tela de celular, com um
 * Salvar só respondendo por duas tabelas, dois limites de plano e duas frases
 * de recusa: a parede dos 20 itens apareceria na cara de quem estava mexendo
 * num link do Instagram.
 *
 * O preço vive em centavos no banco e em reais na tela, que é como a pessoa
 * fala. A conversão nos dois sentidos mora em lib/formato.ts, com teste.
 *
 * ## O acrescentar precisa aparecer
 *
 * **Relato de uso, nas palavras da dona: "eu adiciono e ele some".** Três coisas
 * se somavam. A linha nova nascia no fim de uma lista de vinte, igual a todas as
 * outras; o recado de "Item acrescentado" ficava no alto da tela, três telas
 * acima de onde a rolagem tinha parado; e o Salvar seguinte devolvia a pessoa
 * para o topo com todas as linhas fechadas, inclusive a que ela estava
 * escrevendo. Ela acrescentava, escrevia a descrição, salvava, e a tela voltava
 * parecida com a de antes de tudo.
 *
 * Agora o acrescentar termina em `?novo=<id>`, e o id atravessa a tela inteira:
 * a linha chega aberta, com selo e com a cor de confirmação que sai sozinha
 * (componentes/painel/Ordem.tsx), a rolagem para nela e o cursor entra na
 * descrição, que é o campo que sobrou para escrever. O id viaja num campo
 * escondido, então o Salvar seguinte devolve a pessoa para a mesma linha, aberta
 * (vira `?aberto=<id>`, sem o selo, porque a partir daí ela é uma linha comum).
 *
 * E o botão de acrescentar passou a existir também no alto, porque no fim de
 * uma lista cheia ele estava a três telas de rolagem de quem acabou de chegar.
 */
export default async function Catalogo({
  searchParams,
}: {
  searchParams: Promise<{
    salvo?: string;
    /** O id do item recém-criado: ele ganha o selo, a cor e o cursor. */
    novo?: string;
    /** O id do item que só precisa continuar aberto e à vista. */
    aberto?: string;
    removido?: string;
    movido?: string;
    erro?: string;
  }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  const itens = negocio.itens;
  const total = itens.length;
  const naPagina = itens.filter((i) => i.ativo).length;

  // O recém-criado também fica aberto, então o alvo da abertura é um dos dois.
  const emFoco = params.novo ?? params.aberto ?? null;
  const indiceEmFoco = itens.findIndex((i) => i.id === emFoco);

  const feito = params.novo
    ? "Item acrescentado ao catálogo."
    : params.removido
      ? "Item removido do catálogo."
      : params.movido
        ? "Nova ordem guardada."
        : params.salvo
          ? "Alterações salvas."
          : null;

  /** O esqueleto que o formulário de acrescentar mostra enquanto é digitado. */
  const emBranco: Item = {
    id: "acrescentando",
    titulo: "",
    descricao: null,
    precoCentavos: null,
    fotos: [],
    ativo: true,
  };

  return (
    <main className="mt-6">
      {/*
        No computador a coluna da esquerda fica sempre à vista, com as seções e
        o estado da página, então o Voltar seria um segundo caminho para onde já
        dá para ir com um clique.
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
        Catálogo
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
        É a lista do que você vende. Na sua página ela aparece com o título{" "}
        <span className="font-medium text-texto">{negocio.tituloCatalogo}</span>,
        e a ordem daqui é a ordem de lá.{" "}
        {negocio.mostrarPrecos
          ? "Os preços aparecem para quem visita."
          : "Hoje a página guarda os preços aqui com você, e mostra de cada item o nome e a descrição."}{" "}
        <Link
          href="/painel/negocio"
          className="font-medium text-destaque underline-offset-4 hover:underline"
        >
          Mudar o título e os preços
        </Link>
      </p>

      <Aviso salvo={feito !== null} mensagem={feito ?? undefined} erro={params.erro} />

      {total > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-suave">
            <span className="font-medium text-texto">
              {total} {total === 1 ? "item" : "itens"}
            </span>
            {naPagina === total
              ? " no catálogo, e todos aparecem na página."
              : ` no catálogo, e ${naPagina} ${naPagina === 1 ? "aparece" : "aparecem"} na página.`}
          </p>
          <AtalhoDeAcrescentar href="#acrescentar">
            Acrescentar item
          </AtalhoDeAcrescentar>
        </div>
      ) : (
        <p className="mt-5 max-w-prose rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-sm leading-relaxed text-suave">
          A sua página mostra os itens que você acrescentar aqui. Comece pelo que
          você mais faz, escreva o preço, e a seção aparece na página no mesmo
          instante.
        </p>
      )}

      {/*
        A largura trava no computador, e é a mesma decisão da tela de horários:
        são campos curtos, e uma coluna de mil pixels transforma um preço de seis
        caracteres numa fita atravessada. Fechada, cada linha mostra número,
        nome e preço, e a lista inteira se lê de uma vez, que é o que a ordem
        pede.
      */}
      <form action={salvarItens} className="mt-4 flex flex-col gap-3 lg:max-w-xl">
        {/*
          O id da linha em foco viaja com o formulário para o Salvar saber para
          onde devolver a pessoa. Ver o comentário no topo desta tela.
        */}
        <input type="hidden" name="novo" value={emFoco ?? ""} />

        {itens.map((item, i) => (
          <Cartao
            key={item.id}
            id={`item-${i}`}
            numero={i + 1}
            total={total}
            nome={item.titulo}
            detalhe={
              item.precoCentavos === null ? null : preco(item.precoCentavos)
            }
            selo={item.ativo ? null : "Guardado"}
            prefixo="item"
            aberto={item.id === emFoco}
            novo={item.id === params.novo}
            subir={subirItem}
            descer={descerItem}
            remover={removerItem}
          >
            <input type="hidden" name={`item-${i}-id`} value={item.id} />

            <PreviaDoItem
              negocio={negocio}
              prefixo={`item-${i}`}
              item={item}
              chamada="Na sua página, este item aparece assim:"
            >
              <Texto
                id={`item-${i}-titulo`}
                rotulo="Nome do item"
                valor={item.titulo}
                maxLength={80}
              />
              <AreaTexto
                id={`item-${i}-descricao`}
                rotulo="Descrição"
                dica="Uma ou duas frases sobre o que a pessoa recebe."
                valor={item.descricao}
                maxLength={280}
              />
              {/*
                Sem type="number" de propósito. Ele recusa a vírgula em boa parte
                dos navegadores, e "74,90" é como o brasileiro escreve preço. O
                inputMode abre o teclado numérico do celular, e quem confere é
                lerPreco, que aceita vírgula e ponto.
              */}
              <Texto
                id={`item-${i}-preco`}
                rotulo="Preço em reais"
                dica="Por exemplo 180,00. Em branco, o item aparece com nome e descrição."
                valor={precoEditavel(item.precoCentavos)}
                inputMode="decimal"
                autoComplete="off"
              />
              <Marcar
                id={`item-${i}-ativo`}
                rotulo="Aparece na página"
                dica="Desmarcado, o item fica guardado aqui com você."
                marcado={item.ativo}
              />
            </PreviaDoItem>
          </Cartao>
        ))}

        {/*
          O acrescentar mora dentro do mesmo formulário, e por isso pede só o
          nome: é o único campo que o banco exige, e o resto se escreve na linha
          que acabou de nascer, já aberta. Pedir descrição e foto antes de o
          item existir é o que faz a pessoa desistir no primeiro.

          A prévia ao lado é o que responde antes do toque. Quem escreve o nome
          já vê o cartão que vai para a página, e o botão deixa de ser um pulo no
          escuro.
        */}
        <fieldset
          id="acrescentar"
          className="mt-2 flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-dashed border-borda bg-fundo p-4 lg:scroll-mt-8"
        >
          <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold text-texto">
            <IconeMais className="h-4 w-4 text-destaque" />
            Acrescentar item
          </legend>

          <PreviaDoItem
            /* Chave pelo tamanho da lista: acrescentar devolve a tela com o
               formulário em branco, e a prévia precisa nascer em branco junto. */
            key={`novo-${total}`}
            negocio={negocio}
            prefixo="novo"
            item={emBranco}
            chamada="Assim que você salvar, ele entra na sua página deste jeito:"
          >
            <Texto
              id="novo-titulo"
              rotulo="Nome do item"
              dica="Por exemplo: Sessão de terapia, 50 minutos."
              valor={null}
              maxLength={80}
              autoComplete="off"
            />
            <Texto
              id="novo-preco"
              rotulo="Preço em reais"
              valor={null}
              inputMode="decimal"
              autoComplete="off"
            />
          </PreviaDoItem>

          {/* 64 e não 56: em 224 pixels o rótulo quebrava em duas linhas e
              vazava da altura fixa do botão. */}
          <div className="lg:max-w-64">
            <Botao type="submit" formAction={acrescentarItem} tom="leve">
              Acrescentar ao catálogo
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
        A rolagem e o cursor, depois de a tela existir. Só para o item recém
        criado: no volta do Salvar a pessoa já está escrevendo, e mover o cursor
        ali tiraria ela de onde ela estava.
      */}
      {params.novo && indiceEmFoco >= 0 ? (
        <FocarNoNovo
          cartao={`item-${indiceEmFoco}`}
          campo={`item-${indiceEmFoco}-descricao`}
        />
      ) : null}
    </main>
  );
}
