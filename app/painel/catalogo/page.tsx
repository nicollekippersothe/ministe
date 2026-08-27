import Link from "next/link";
import {
  acrescentarItem,
  descerItem,
  removerItem,
  salvarItem,
  salvarItens,
  subirItem,
} from "./acoes";
import { salvarFotoDoItem } from "@/app/painel/acoes";
import { AtalhoDeAcrescentar, IconeMais } from "@/componentes/painel/Acrescentar";
import { Aviso, MENSAGENS } from "@/componentes/painel/Aviso";
import {
  AreaTexto,
  Botao,
  Marcar,
  Opcoes,
  Texto,
} from "@/componentes/painel/Campos";
import { EnvioDeImagem } from "@/componentes/painel/EnvioDeImagem";
import { FocarNoNovo } from "@/componentes/painel/FocarNoNovo";
import { Cartao } from "@/componentes/painel/Ordem";
import { PreviaDoItem } from "@/componentes/painel/PreviaDoItem";
import { FaixaDeRecado } from "@/componentes/painel/Sinais";
import { doDono } from "@/lib/dados";
import { preco, precoEditavel } from "@/lib/formato";
import { configurado } from "@/lib/supabase/config";
import { PASTA_DO_ITEM } from "@/lib/supabase/imagens";
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
 *
 * ## A recusa e a confirmação moram dentro do item
 *
 * **Segunda leitura da mesma tela, pela mesma pessoa: "o botão de salvar ficou
 * em cima, sem dar a entender que é sobre esse item", e "essa página precisa
 * rever bem a usabilidade, não tem feedback de retorno".** Três coisas, e as
 * três eram de endereço:
 *
 * 1. A recusa saía no alto. Medido no monitor de 1440: a frase a 222 pixels do
 *    topo, o item que a levantou a 1133, fechado, fora da janela de 900. Agora a
 *    ação diz qual linha (`?erro=titulo&emItem=3`), o cartão chega aberto, a
 *    frase sai dentro dele e o cursor entra no campo recusado.
 * 2. O Salvar era um só, no fim de tudo. Agora cada linha tem o dela, no rodapé
 *    do cartão, junto de subir, descer e remover. Ver componentes/painel/Ordem.tsx.
 * 3. Gravar terminava numa frase cinza no alto, que quem estava no meio da lista
 *    nunca via. Agora a confirmação sai dentro do cartão salvo, no mesmo verde e
 *    com o mesmo certo dos cartões de imagem, pela `FaixaDeRecado` de
 *    componentes/painel/Sinais.tsx: o painel inteiro fala a mesma língua.
 *
 * ## Preço sob consulta
 *
 * "Ali teria que ter alguma opção sob consulta, ou pra pessoa que não quer
 * preencher o preço." Campo vazio dizia duas coisas ao mesmo tempo, e a pessoa
 * ficava sem saber qual delas tinha salvado. Agora a pergunta está escrita, com
 * as duas respostas à vista, e a resposta escolhida some ou traz o campo de
 * reais. O banco continua igual: sob consulta é a mesma coluna nula que a página
 * pública já entende. Ver `precoDoItem` em ./acoes.ts.
 *
 * `mostrarPrecos` é a outra pergunta, a que vale para todos os itens de uma vez,
 * e ela passou a aparecer também aqui: "eu sei que ela preenche isso na outra
 * tela, mas eu traria pra tela de catálogo pra ficar mais clara a navegação".
 * É a mesma coluna da tela de informações, lida e escrita pelas duas.
 *
 * ## Um Salvar só, e ele é o do item
 *
 * **Medido nesta tela, com o catálogo de seis itens: 30 botões, e oito deles
 * eram botão de gravar.** Seis Salvar de item, o "Acrescentar ao catálogo" e o
 * "Salvar o catálogo" do rodapé. Os dois últimos terminavam a 90 pixels um do
 * outro, e a pergunta que sobrava para quem chegava ali era qual dos dois é o
 * que vale.
 *
 * O Salvar do rodapé saiu, e o do item ficou. O do item foi decidido com a dona
 * em resposta a um relato de uso dela, e ele é o que responde onde a pessoa
 * está olhando; o do rodapé gravava a mesma lista pelo mesmo caminho, e sobrava
 * como segundo nome da mesma coisa.
 *
 * **O custo é real e é este: quem mexe em três itens seguidos passa a tocar
 * Salvar três vezes**, uma por cartão, em vez de um toque só no fim. Foi aceito
 * porque o caminho comum desta tela é mexer num item, e porque cada toque
 * agora volta com a confirmação dentro do cartão em que ela tocou.
 *
 * `salvarItens` continua sendo a ação do `form`, e por isso Enter num campo de
 * texto continua gravando a lista inteira. O que saiu foi o botão.
 *
 * ## O acrescentar chega fechado quando já tem catálogo
 *
 * Com a lista vazia ele é o próximo passo óbvio, e nasce aberto. Com a lista
 * cheia ele era mais uma tela de rolagem de campos em branco embaixo dos itens
 * que a pessoa veio editar, e o botão dele encostava no Salvar do rodapé.
 *
 * Fechar é `:target` de CSS, e não estado no React, pelo mesmo motivo do
 * `details` das linhas: funciona com o JavaScript ainda a caminho. E é o que
 * mantém a âncora `#acrescentar` valendo, que é o endereço para onde a recusa
 * do formulário manda a pessoa (ver `paraRecusa` em ./acoes.ts): o bloco alvo
 * da âncora é o bloco aberto. A recusa e a parede dos 20 itens também chegam
 * com ele aberto pelo servidor, para a frase sair à vista em vez de dentro de
 * um bloco fechado.
 */

/**
 * As duas frases de recusa de um item, do jeito que elas aparecem dentro dele.
 *
 * São as mesmas de componentes/painel/Aviso.tsx, que é quem responde pela recusa
 * que vale para a tela toda (limite do plano, escrita recusada pelo banco).
 * Ficam escritas aqui porque só esta tela tem para onde apontar: recusa de item
 * conhece a linha, e a frase sai dentro dela.
 */
/** Os dois campos do item que a tela sabe mostrar recusa por dentro. */
const RECUSA_NO_ITEM = ["titulo", "preco"];

/**
 * O campo de reais aparece com a resposta "preço em reais" marcada, e some com
 * a outra.
 *
 * CSS puro, e não estado no React, pelo mesmo motivo do `details` das linhas:
 * funciona com o JavaScript ainda a caminho, o teclado já alcança o rádio e o
 * leitor de tela já anuncia o grupo. O React 19 leva a tag para o topo do
 * documento e junta as repetições pelo `href`, então vinte itens na tela
 * continuam com uma regra só. Mesmo desenho do `Pulso` de
 * componentes/painel/Ordem.tsx.
 */
function RegraDoPreco() {
  return (
    <style href="painel-preco-sob-consulta" precedence="default">{`
      .preco-escolha:has(input[value="consulta"]:checked) .preco-valor {
        display: none;
      }
    `}</style>
  );
}

/**
 * O bloco de acrescentar fechado, e a âncora abrindo ele.
 *
 * Mesma escolha da regra do preço aqui em cima: CSS, e não estado no React. O
 * bloco é o alvo da âncora `#acrescentar`, então `:target` já descreve
 * exatamente o estado que interessa, o de "a pessoa pediu este bloco". Quem
 * pede é o atalho do alto da lista, o convite no fim dela, e a volta de uma
 * recusa do formulário.
 *
 * Fechado, o bloco vira o mesmo atalho de "Acrescentar item" que existe no alto
 * da lista. A moldura tracejada, o rótulo e os campos chegam com a abertura.
 *
 * Vale só onde a tela pediu, pela classe: com a lista vazia, e na volta de uma
 * recusa, o bloco chega aberto pelo servidor e regra nenhuma o alcança.
 */
function RegraDoAcrescentar() {
  return (
    <style href="painel-acrescentar-fechado" precedence="default">{`
      .acrescentar-fechado:not(:target) {
        border-width: 0;
        padding: 0;
        background: none;
      }
      .acrescentar-fechado:not(:target) > legend,
      .acrescentar-fechado:not(:target) > .acrescentar-corpo {
        display: none;
      }
      .acrescentar-fechado:target > .acrescentar-convite {
        display: none;
      }
    `}</style>
  );
}

/**
 * A pergunta do preço: as duas respostas, e o campo de reais embaixo.
 *
 * A resposta marcada sai do que está gravado, porque é ela que descreve a
 * página de hoje: item com valor abre em "preço em reais", item sem valor abre
 * em "preço sob consulta", que é exatamente o que a página dele já mostra. O
 * formulário de acrescentar é o único que chega com a resposta escolhida por
 * nós, e chega em reais: quem está criando um item quase sempre tem um valor
 * para escrever, e a outra resposta fica a um toque.
 */
function EscolhaDoPreco({
  prefixo,
  centavos,
  sobConsulta,
}: {
  /** O começo do `name` dos campos: "item-3", ou "novo". */
  prefixo: string;
  centavos: number | null;
  sobConsulta: boolean;
}) {
  return (
    <div className="preco-escolha flex flex-col gap-3">
      <Opcoes
        nome={`${prefixo}-preco-modo`}
        rotulo="Preço"
        valor={sobConsulta ? "consulta" : "reais"}
        opcoes={[
          {
            valor: "reais",
            rotulo: "Preço em reais",
            dica: "O valor sai junto do item, na sua página.",
          },
          {
            valor: "consulta",
            rotulo: "Preço sob consulta",
            dica: "O item sai com nome e descrição, e o valor você combina na conversa.",
          },
        ]}
      />

      {/*
        Sem type="number" de propósito. Ele recusa a vírgula em boa parte dos
        navegadores, e "74,90" é como o brasileiro escreve preço. O inputMode
        abre o teclado numérico do celular, e quem confere é lerPreco, que
        aceita vírgula e ponto.
      */}
      <div className="preco-valor">
        <Texto
          id={`${prefixo}-preco`}
          rotulo="Quanto custa, em reais"
          dica="Por exemplo 180,00."
          valor={precoEditavel(centavos)}
          inputMode="decimal"
          autoComplete="off"
        />
      </div>
    </div>
  );
}

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
    /** A linha que levantou a recusa: o número dela, ou "novo". */
    emItem?: string;
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

  /*
   * Qual cartão carrega a confirmação de salvo, ou nenhum.
   *
   * A conta mora aqui porque ela era feita em dois lugares com variáveis
   * diferentes: o alto da tela perguntava por `indiceEmFoco`, e o cartão
   * perguntava pelo id. As duas dizem a mesma coisa hoje, e duas escritas da
   * mesma regra divergem no dia em que uma delas mudar.
   */
  const confirmadoEm = params.salvo !== undefined ? indiceEmFoco : -1;

  /*
   * A recusa que tem endereço: a linha que a levantou, e a frase que vai dentro
   * dela. Recusa sem endereço (o limite do plano, a escrita recusada pelo banco)
   * continua no `Aviso` do alto, que é onde ela pertence: ela é da tela toda.
   */
  const linhaExiste =
    params.emItem === "novo" || itens[Number(params.emItem)] !== undefined;

  const recusaDoItem =
    params.erro !== undefined &&
    params.emItem !== undefined &&
    linhaExiste &&
    params.erro !== undefined && RECUSA_NO_ITEM.includes(params.erro)
      ? {
          onde: params.emItem,
          frase: MENSAGENS[params.erro],
          campo: params.erro,
        }
      : null;

  const feito = params.novo
    ? "Item acrescentado ao catálogo."
    : params.removido
      ? "Item removido do catálogo."
      : params.movido
        ? "Nova ordem guardada."
        : /*
           * "Alterações salvas" só quando nenhum cartão carrega a confirmação.
           * Com a linha aberta na tela, a frase do alto seria a segunda cópia do
           * mesmo recado, e a que a pessoa não está olhando.
           */
          params.salvo && confirmadoEm < 0
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

  /*
   * Quando o bloco de acrescentar chega aberto pelo servidor.
   *
   * A lista vazia, que é quando ele é o próximo passo. E a volta de uma recusa
   * levantada dentro dele: a do nome e a do preço, que sabem o endereço delas,
   * e a parede dos 20 itens, que sai no `Aviso` do alto porque é da tela toda e
   * só o acrescentar levanta. Nos três casos a pessoa acabou de escrever ali, e
   * um bloco fechado esconderia a frase e o que ela digitou.
   */
  const acrescentarAberto =
    total === 0 ||
    recusaDoItem?.onde === "novo" ||
    params.erro === "limite_itens";

  return (
    <main className="mt-6">
      <RegraDoPreco />
      {acrescentarAberto ? null : <RegraDoAcrescentar />}
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

      <h1 className="titulo mt-2 text-2xl text-texto">
        Catálogo
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-suave">
        É a lista do que você vende. Na sua página ela aparece com o título{" "}
        <span className="font-medium text-texto">{negocio.tituloCatalogo}</span>,
        e a ordem daqui é a ordem de lá.
      </p>
      {/*
        O link sai da frase e vira alvo próprio.

        Dentro do parágrafo ele media 342 por 39 no celular, e o dedo pede 44 de
        altura. O respiro vem de dentro do alvo e a margem negativa devolve o
        alinhamento com o texto de cima, que é a mesma solução do Voltar.
      */}
      <Link
        href="/painel/negocio"
        className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-destaque underline-offset-4 hover:underline"
      >
        Mudar o título desta seção
      </Link>

      <Aviso
        salvo={feito !== null}
        mensagem={feito ?? undefined}
        erro={recusaDoItem === null ? params.erro : undefined}
      />

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

        {/*
          A chave de mostrar preço, ao lado da lista de preços que ela comanda.

          O campo escondido é a marca de presença: caixa de marcar em repouso
          some do envio, e sem ele toda gravação daqui apagaria a escolha feita
          na tela de informações. Ver `mostrarPrecos` em ./acoes.ts.
        */}
        <input type="hidden" name="mostrarPrecos-escolhido" value="1" />
        <Marcar
          id="mostrarPrecos"
          rotulo="Mostrar os preços na página"
          dica={
            negocio.mostrarPrecos
              ? "Cada item leva para a sua página o valor que você escreveu aqui."
              : "Hoje os preços ficam guardados aqui com você, e a página mostra de cada item o nome e a descrição."
          }
          marcado={negocio.mostrarPrecos}
        />

        {itens.map((item, i) => {
          const recusado = recusaDoItem?.onde === String(i);
          const confirmado = i === confirmadoEm;

          return (
            <Cartao
              key={item.id}
              id={`item-${i}`}
              numero={i + 1}
              total={total}
              nome={item.titulo}
              detalhe={
                item.precoCentavos === null
                  ? "Preço sob consulta"
                  : preco(item.precoCentavos)
              }
              selo={item.ativo ? null : "Guardado"}
              prefixo="item"
              aberto={item.id === emFoco || recusado}
              novo={item.id === params.novo}
              subir={subirItem}
              descer={descerItem}
              remover={removerItem}
              salvar={salvarItem.bind(null, item.id)}
            >
              <input type="hidden" name={`item-${i}-id`} value={item.id} />

              {/*
                A resposta da gravação, dentro da linha que a pessoa está
                olhando. Mesmo vocabulário dos cartões de imagem: o certo verde
                para o que chegou ao destino, a caixa de destaque para a recusa.
              */}
              {recusado ? (
                <FaixaDeRecado tom="recusa">{recusaDoItem?.frase}</FaixaDeRecado>
              ) : confirmado ? (
                <FaixaDeRecado tom="pronto">
                  {item.ativo
                    ? "Pronto. Este item está salvo e aparece na sua página."
                    : "Pronto. Este item está salvo, e fica aqui com você."}
                </FaixaDeRecado>
              ) : null}

              <PreviaDoItem
                negocio={negocio}
                prefixo={`item-${i}`}
                item={item}
                sobConsulta={item.precoCentavos === null}
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
                <EscolhaDoPreco
                  prefixo={`item-${i}`}
                  centavos={item.precoCentavos}
                  sobConsulta={item.precoCentavos === null}
                />
                <Marcar
                  id={`item-${i}-ativo`}
                  rotulo="Aparece na página"
                  dica="Desmarcado, o item fica guardado aqui com você."
                  marcado={item.ativo}
                />

                {/*
                  A foto deste item, no mesmo cartão de imagem da tela de
                  informações. É o componente de lá inteiro, com a pasta do
                  catálogo e com a gravação amarrada a este item: um segundo
                  enviador escrito à mão acertaria hoje e divergiria no primeiro
                  ajuste, e são nove passos até o arquivo virar coluna.

                  O envio grava sozinho, fora do Salvar da linha, que é como o
                  painel inteiro trata imagem: quem escolhe uma foto está
                  olhando a prévia mudar, e esperar um botão poria um segundo
                  momento no meio de uma coisa que já se explica na tela.
                */}
                <EnvioDeImagem
                  pasta={PASTA_DO_ITEM}
                  chave={`item-${i}`}
                  atual={item.fotos[0]?.url ?? null}
                  nome={item.titulo}
                  ligado={configurado}
                  gravar={salvarFotoDoItem.bind(null, item.id)}
                />
              </PreviaDoItem>
            </Cartao>
          );
        })}

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
          className={`mt-2 flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-dashed border-borda bg-fundo p-4 lg:scroll-mt-8 ${
            acrescentarAberto ? "" : "acrescentar-fechado"
          }`}
        >
          <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold text-texto">
            <IconeMais className="h-4 w-4 text-destaque" />
            Acrescentar item
          </legend>

          {/*
            O que o bloco fechado mostra: o mesmo atalho do alto da lista, agora
            no fim dela, que é onde a linha nova vai nascer. Ele aponta para a
            própria âncora, e é a âncora que abre o bloco. Ver `RegraDoAcrescentar`.
          */}
          {acrescentarAberto ? null : (
            <div className="acrescentar-convite">
              <AtalhoDeAcrescentar href="#acrescentar">
                Acrescentar item
              </AtalhoDeAcrescentar>
            </div>
          )}

          <div className="acrescentar-corpo flex flex-col gap-4">
            {recusaDoItem?.onde === "novo" ? (
              <FaixaDeRecado tom="recusa">{recusaDoItem.frase}</FaixaDeRecado>
            ) : null}

            <PreviaDoItem
              /* Chave pelo tamanho da lista: acrescentar devolve a tela com o
                 formulário em branco, e a prévia precisa nascer em branco junto. */
              key={`novo-${total}`}
              negocio={negocio}
              prefixo="novo"
              item={emBranco}
              sobConsulta={false}
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
              <EscolhaDoPreco prefixo="novo" centavos={null} sobConsulta={false} />
            </PreviaDoItem>

            {/* 64 e não 56: em 224 pixels o rótulo quebrava em duas linhas e
                vazava da altura fixa do botão. */}
            <div className="lg:max-w-64">
              <Botao type="submit" formAction={acrescentarItem} tom="leve">
                Acrescentar ao catálogo
              </Botao>
            </div>
          </div>
        </fieldset>
      </form>

      {/*
        A rolagem e o cursor, depois de a tela existir.

        Dois momentos pedem isso, e os dois são o mesmo problema: a pessoa está
        no meio de uma lista longa e a tela recarregou inteira. O item recém
        criado, que nasce no fim e precisa ser encontrado; e o item recusado, que
        precisa mostrar qual campo o servidor devolveu. No caminho de volta de um
        Salvar comum o cursor fica onde está: ali ela já está escrevendo, e mover
        o foco tiraria ela de onde ela estava.
      */}
      {recusaDoItem !== null ? (
        <FocarNoNovo
          cartao={
            recusaDoItem.onde === "novo" ? "acrescentar" : `item-${recusaDoItem.onde}`
          }
          campo={
            recusaDoItem.onde === "novo"
              ? `novo-${recusaDoItem.campo}`
              : `item-${recusaDoItem.onde}-${recusaDoItem.campo}`
          }
        />
      ) : params.novo && indiceEmFoco >= 0 ? (
        <FocarNoNovo
          cartao={`item-${indiceEmFoco}`}
          campo={`item-${indiceEmFoco}-descricao`}
        />
      ) : null}
    </main>
  );
}
