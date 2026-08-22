"use client";

import { useState } from "react";
import { BotaoAcao } from "@/componentes/BarraAcoes";
import { Catalogo } from "@/componentes/Catalogo";
import { IconeAvancar } from "@/componentes/Icones";
import { AreaTexto } from "./Campos";
import { acoesDoRodape } from "@/lib/acoes";
import { mensagemDoItem } from "@/lib/formato";
import type { Negocio } from "@/lib/tipos";

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
 */

/** O modelo do WhatsApp: o texto chega digitado, e o cliente decide enviar. */
function Conversa({ nome, texto }: { nome: string; texto: string }) {
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
          {texto === ""
            ? "Em branco, o cliente escreve a primeira mensagem do jeito dele."
            : texto}
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
}: {
  gatilho: React.ReactNode;
  conversa: React.ReactNode;
  chamada: string;
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
      <div className="mt-1.5 max-w-[17rem]">{gatilho}</div>
      <p className="mt-2 mb-1.5 text-xs leading-relaxed text-suave">
        E o WhatsApp abre assim:
      </p>
      <div className="max-w-[17rem]">{conversa}</div>
    </div>
  );
}

export function MensagemDoBotao({
  negocio,
  rotulo,
  dica,
}: {
  negocio: Negocio;
  rotulo: string;
  dica: string;
}) {
  const [texto, setTexto] = useState(negocio.mensagemPadrao ?? "");

  // O botão de verdade, resolvido pela função de verdade, com a mensagem que
  // está sendo digitada agora no lugar da gravada.
  const acao = acoesDoRodape({ ...negocio, mensagemPadrao: texto })[0] ?? null;

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
          chamada="Na sua página, quem toca neste botão:"
          gatilho={<BotaoAcao acao={acao} principal compacto interativo={false} />}
          conversa={<Conversa nome={negocio.nome} texto={texto} />}
        />
      ) : (
        <p className="mt-3 rounded-xl border border-borda bg-fundo px-3 py-2.5 text-xs leading-relaxed text-suave">
          Preencha o número do WhatsApp acima e o botão aparece aqui, com esta
          mensagem dentro da conversa.
        </p>
      )}
    </div>
  );
}

export function MensagemDosItens({
  negocio,
  rotulo,
  dica,
}: {
  negocio: Negocio;
  rotulo: string;
  dica: string;
}) {
  const [texto, setTexto] = useState(negocio.mensagemItem ?? "");

  /*
   * O primeiro item do catálogo da própria pessoa, que é o que transforma a
   * chave `{item}` numa coisa que ela reconhece. As fotos saem da cópia porque
   * a foto do item ocupa a moldura inteira e o assunto aqui é a mensagem; o
   * resto do cartão continua sendo o `Catalogo` de verdade, com o título, o
   * preço e o botão que a página pública desenha.
   */
  const primeiro = negocio.itens.find((i) => i.ativo);
  const exemplo: Negocio | null = primeiro
    ? {
        ...negocio,
        mensagemItem: texto,
        itens: [{ ...primeiro, fotos: [] }],
      }
    : null;

  const mostrar = exemplo !== null && Boolean(negocio.whatsapp) && texto !== "";

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

      {mostrar && exemplo && primeiro ? (
        <Moldura
          chamada={`No seu ${negocio.tituloCatalogo.toLowerCase()}, quem toca no botão deste item:`}
          gatilho={<Catalogo negocio={exemplo} />}
          conversa={
            <Conversa
              nome={negocio.nome}
              texto={mensagemDoItem(texto, primeiro.titulo) ?? ""}
            />
          }
        />
      ) : (
        <p className="mt-3 rounded-xl border border-borda bg-fundo px-3 py-2.5 text-xs leading-relaxed text-suave">
          {primeiro
            ? `Escreva a mensagem acima e ela aparece aqui, com "${primeiro.titulo}" no lugar do {item}.`
            : "Cadastre o primeiro item do catálogo e ele aparece aqui, com o nome dele no lugar do {item}."}
        </p>
      )}
    </div>
  );
}
