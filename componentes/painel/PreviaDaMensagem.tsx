"use client";

import { useState } from "react";
import { BotaoAcao } from "@/componentes/BarraAcoes";
import { Catalogo } from "@/componentes/Catalogo";
import { IconeAvancar } from "@/componentes/Icones";
import { AreaTexto } from "./Campos";
import { acoesDoRodape } from "@/lib/acoes";
import { mensagemDoItem } from "@/lib/formato";
import type { Item, Negocio } from "@/lib/tipos";

/**
 * Os dois campos de mensagem, com o botão de verdade e a conversa ao lado.
 *
 * As duas mensagens são o texto que já chega escrito na conversa do WhatsApp, e
 * o campo sozinho pedia esse texto sem dizer onde ele aparece. A dona da página
 * digitava uma frase, salvava, e só descobria o resultado abrindo a própria
 * página no celular e tocando no botão. Descrever isso em mais uma linha de
 * dica seria a tela explicando o que ela consegue mostrar.
 *
 * Então ela mostra. O gatilho aqui é o componente de verdade, e não um desenho
 * parecido com ele: `BotaoAcao`, o mesmo do rodapé da página pública, resolvido
 * pela mesma `acoesDoRodape`; e `Catalogo`, o mesmo da seção de itens, com o
 * item que a pessoa mesma cadastrou. É a regra do AGENTS.md sobre as peças
 * mostradas serem as do produto, e ela vale aqui pelo mesmo motivo que vale na
 * tela inicial: assim a prévia fica impedida de divergir da página.
 *
 * E atualiza a cada tecla. O texto digitado desce direto para o modelo, e a
 * troca do `{item}` pelo nome do produto acontece pela `mensagemDoItem`, que é a
 * mesma função que a página pública chama. É o truque da prévia do cadastro, e
 * é o que faz o campo se explicar sozinho: a pessoa vê a chave virar o nome do
 * item enquanto digita, e ninguém precisa escrever uma frase sobre isso.
 *
 * ## O desenho aparece antes do dado
 *
 * A primeira versão disto trocava a prévia inteira por uma frase enquanto o
 * número do WhatsApp estava em branco, que é justamente quando a pessoa mais
 * precisa ver o que o campo faz. A dona da página leu a frase e continuou sem
 * saber o que ia acontecer, e foi assim que ela contou. Agora o botão é
 * desenhado sempre, com um selo dizendo o que ele está esperando, e o desenho
 * vai ganhando o número e o texto conforme eles chegam.
 */

/**
 * O que entra no lugar do número, e no lugar do modelo, enquanto eles vêm.
 *
 * O `BotaoAcao` e o `Catalogo` só desenham o botão quando o negócio tem
 * WhatsApp e o item tem mensagem, e essa regra está certa: na página pública um
 * botão que não leva a lugar nenhum é pior que nenhum botão. Aqui dentro ela
 * deixava a prévia muda justamente para quem ainda ia preencher.
 *
 * Um espaço passa nessas duas conferências, e o `linkWhatsapp` descarta tudo
 * que não é dígito, então o endereço que sai é o `wa.me` solto: o mesmo link de
 * compartilhar que o WhatsApp já publica, e nunca um número inventado. O bloco
 * inteiro é `inert` de qualquer forma, então ninguém chega a esse endereço nem
 * pelo dedo nem pelo Tab.
 */
const ENQUANTO_O_DADO_VEM = " ";

/**
 * O item que o desenho usa enquanto o catálogo está vazio.
 *
 * O título é a própria chave que a pessoa digita no campo, e não um produto
 * inventado: ela vê `{item}` no cartão e `{item}` dentro da conversa, e no
 * minuto em que cadastrar o primeiro item o nome dele toma esse lugar nos dois.
 */
const ITEM_DE_DESENHO: Item = {
  id: "desenho",
  titulo: "{item}",
  descricao: null,
  precoCentavos: null,
  fotos: [],
  ativo: true,
};

/** O modelo do WhatsApp: o texto chega digitado, e o cliente decide enviar. */
function Conversa({
  nome,
  texto,
  vazio,
}: {
  nome: string;
  texto: string;
  /** O que a bolha diz enquanto o campo está em branco. */
  vazio: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-borda bg-superficie">
      <p className="truncate bg-zap px-3 py-1 text-[0.75rem] font-medium text-white">
        {nome}
      </p>
      <div className="flex items-end gap-2 p-1.5">
        <p
          className={`min-w-0 flex-1 rounded-2xl bg-fundo px-3 py-2 text-[0.8rem] leading-snug whitespace-pre-wrap ${
            texto === "" ? "text-suave" : "text-texto"
          }`}
        >
          {texto === "" ? vazio : texto}
        </p>
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zap text-white"
        >
          <IconeAvancar className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function Moldura({
  gatilho,
  conversa,
  chamada,
  espera,
}: {
  gatilho: React.ReactNode;
  conversa: React.ReactNode;
  chamada: string;
  /**
   * O que ainda está chegando, escrito em duas palavras, ou nulo quando o
   * desenho já mostra o resultado final. Enquanto tem valor, o botão sai com a
   * cor abaixada e o selo em cima dele.
   */
  espera: string | null;
}) {
  return (
    /*
     * `inert`, e não `aria-hidden`: a prévia é ilustração, e o cartão do
     * catálogo que ela mostra é o componente de verdade, com o link de verdade
     * dentro. Só `aria-hidden` deixaria esse link focável pelo Tab dentro de um
     * pedaço que o leitor de tela ignora, que é o pior dos dois mundos. O
     * `inert` tira o bloco inteiro da navegação e da árvore de uma vez, e quem
     * usa leitor de tela lê e edita a mensagem no campo logo acima, que é onde
     * ela mora.
     */
    <div inert className="mt-2.5 rounded-xl border border-borda bg-fundo p-2.5">
      <p className="text-xs leading-relaxed text-suave">{chamada}</p>

      {espera ? (
        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-destaque/10 px-2.5 py-1 text-[0.7rem] font-semibold text-destaque">
          {/* Ampulheta desenhada, e nunca emoji, que é a regra de layout. */}
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
            <path
              d="M4.5 2h7M4.5 14h7M5.5 2v2.2c0 1.5 2.5 2.4 2.5 3.8s-2.5 2.3-2.5 3.8V14M10.5 2v2.2c0 1.5-2.5 2.4-2.5 3.8s2.5 2.3 2.5 3.8V14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          {espera}
        </p>
      ) : null}

      {/*
        Uma coluna só, sempre. O `Catalogo` de verdade abre em duas a partir de
        640px de tela, que é a medida certa na página pública e a errada aqui
        dentro: numa moldura de 17rem a segunda coluna parte o cartão ao meio e
        o título do item sai quebrado em três linhas.

        A cor abaixada enquanto falta dado é a única diferença entre este
        desenho e o botão que vai para a página: mesma forma, mesma altura,
        mesmo texto, e a cor cheia chegando junto com o número.
      */}
      <div
        className={`mt-1.5 max-w-[17rem] transition-opacity duration-200 [&_ul]:grid-cols-1 ${
          espera ? "opacity-55" : ""
        }`}
      >
        {gatilho}
      </div>

      <p className="mt-2 mb-1.5 text-xs leading-relaxed text-suave">
        E o WhatsApp abre assim:
      </p>
      <div className="max-w-[17rem]">{conversa}</div>
    </div>
  );
}

export function MensagemDoBotao({
  negocio,
  whatsapp,
  rotulo,
  dica,
}: {
  negocio: Negocio;
  /** O número digitado agora no campo acima, em dígitos, ou nulo. */
  whatsapp: string | null;
  rotulo: string;
  dica: string;
}) {
  const [texto, setTexto] = useState(negocio.mensagemPadrao ?? "");

  // O botão de verdade, resolvido pela função de verdade, com o número e a
  // mensagem que estão sendo digitados agora no lugar dos gravados.
  const acao =
    acoesDoRodape({
      ...negocio,
      whatsapp: whatsapp ?? ENQUANTO_O_DADO_VEM,
      mensagemPadrao: texto,
    })[0] ?? null;

  return (
    <div className="lg:col-span-2">
      <AreaTexto
        id="mensagemPadrao"
        rotulo={rotulo}
        dica={dica}
        valor={negocio.mensagemPadrao}
        maxLength={200}
        onChange={(e) => setTexto(e.target.value)}
      />

      {acao ? (
        <Moldura
          chamada={
            whatsapp
              ? "Na sua página, quem toca neste botão:"
              : "Este é o botão que vai para a sua página:"
          }
          espera={whatsapp ? null : "Esperando o número acima"}
          gatilho={<BotaoAcao acao={acao} principal compacto interativo={false} />}
          conversa={
            <Conversa
              nome={negocio.nome}
              texto={texto}
              vazio="Em branco, o cliente escreve a primeira mensagem do jeito dele."
            />
          }
        />
      ) : null}
    </div>
  );
}

export function MensagemDosItens({
  negocio,
  whatsapp,
  rotulo,
  dica,
}: {
  negocio: Negocio;
  /** O número digitado agora no campo acima, em dígitos, ou nulo. */
  whatsapp: string | null;
  rotulo: string;
  dica: string;
}) {
  const [texto, setTexto] = useState(negocio.mensagemItem ?? "");

  /*
   * O primeiro item do catálogo da própria pessoa, que é o que transforma a
   * chave `{item}` numa coisa que ela reconhece. As fotos saem da cópia porque
   * a foto do item ocupa a moldura inteira e o assunto aqui é a mensagem; o
   * resto do cartão continua sendo o `Catalogo` de verdade, com o título, o
   * preço e o botão que a página pública desenha. Com o catálogo ainda vazio,
   * entra o `ITEM_DE_DESENHO`, que carrega a própria chave como título.
   */
  const primeiro = negocio.itens.find((i) => i.ativo) ?? null;
  const item = primeiro ?? ITEM_DE_DESENHO;

  const exemplo: Negocio = {
    ...negocio,
    whatsapp: whatsapp ?? ENQUANTO_O_DADO_VEM,
    // O `Catalogo` só desenha o botão do item quando existe modelo, e o rótulo
    // dele é fixo, então o espaço aqui muda o desenho e nunca o que se lê. A
    // conversa embaixo continua lendo o texto de verdade, e é ela que fica em
    // branco enquanto o campo está em branco.
    mensagemItem: texto === "" ? ENQUANTO_O_DADO_VEM : texto,
    itens: [{ ...item, fotos: [] }],
  };

  const espera = !whatsapp
    ? "Esperando o número acima"
    : texto === ""
      ? "Esperando a mensagem acima"
      : primeiro === null
        ? "Esperando o primeiro item"
        : null;

  return (
    <div className="lg:col-span-2">
      <AreaTexto
        id="mensagemItem"
        rotulo={rotulo}
        dica={dica}
        valor={negocio.mensagemItem}
        maxLength={200}
        onChange={(e) => setTexto(e.target.value)}
      />

      <Moldura
        chamada={`No seu ${negocio.tituloCatalogo.toLowerCase()}, quem toca no botão deste item:`}
        espera={espera}
        gatilho={<Catalogo negocio={exemplo} />}
        conversa={
          <Conversa
            nome={negocio.nome}
            texto={mensagemDoItem(texto, item.titulo) ?? ""}
            vazio="Em branco, cada item da sua página fica com o nome, o preço e a foto."
          />
        }
      />
    </div>
  );
}
