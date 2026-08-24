"use client";

import { useState } from "react";
import { Escolha, Texto } from "./Campos";
import { MapaDaPagina } from "./MapaDaPagina";
import { BotaoAcao } from "@/componentes/BarraAcoes";
import { acoesDoRodape } from "@/lib/acoes";
import type { Acao, IconeLink, Negocio, TipoAcao } from "@/lib/tipos";

/**
 * Os dois botões do rodapé, com o rodapé desenhado ao lado.
 *
 * **É o conserto de "eu clico e ele não tem o comportamento esperado".** A tela
 * era seis campos e um Salvar. A pessoa escolhia "Abrir um link", escrevia o
 * texto, salvava, lia "Alterações salvas" e ficava sem saber que botão tinha
 * acabado de fazer: para ver o resultado ela precisava abrir a prévia, rolar até
 * o fim e olhar a barra. O recado de salvo confirma a gravação, e o que ela
 * queria confirmar era a aparência.
 *
 * Então o botão está na tela o tempo todo, e é o `BotaoAcao` da página pública,
 * resolvido pela mesma `acoesDoRodape`. Trocar o tipo, escrever o texto ou
 * escolher outro ícone muda o desenho na mesma tecla, e aí o Salvar deixa de ser
 * o momento em que ela descobre o resultado.
 *
 * **Os campos que aquele tipo de botão usa são os campos que ficam na tela.** O
 * endereço e o ícone só valem para "Abrir um link": no WhatsApp o destino sai do
 * número gravado na tela do negócio, e no telefone sai do telefone. Os dois
 * campos ficavam ali, brancos, pedindo um endereço que a gravação ia descartar,
 * e é o tipo de campo que faz a pessoa achar que preencheu errado. Com o tipo em
 * "Deixar este botão de fora", o bloco fecha inteiro, porque não sobra pergunta.
 *
 * Quem grava continua sendo `salvarAcoes` lendo o formulário. Esta camada existe
 * para a tela mostrar o que está sendo montado, e o desenho pode sumir inteiro
 * que a gravação continua a mesma.
 */

const TIPOS: Array<{ valor: TipoAcao | "nenhum"; rotulo: string }> = [
  { valor: "whatsapp", rotulo: "Abrir conversa no WhatsApp" },
  { valor: "link", rotulo: "Abrir um link" },
  { valor: "telefone", rotulo: "Ligar para o telefone" },
  { valor: "nenhum", rotulo: "Deixar este botão de fora" },
];

/*
 * A lista abre pelo que a profissional autônoma escolhe, e termina no genérico.
 * Quem atende com hora marcada procura "Agendamento" primeiro; iFood e loja
 * continuam na lista inteiros, porque restaurante e revenda cabem no produto.
 */
const ICONES: Array<{ valor: IconeLink; rotulo: string }> = [
  { valor: "agenda", rotulo: "Agenda, para marcar horário" },
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "site", rotulo: "Site ou portfólio" },
  { valor: "cardapio", rotulo: "Cardápio ou catálogo" },
  { valor: "mapa", rotulo: "Mapa" },
  { valor: "loja", rotulo: "Loja ou link de parceiro" },
  { valor: "ifood", rotulo: "iFood ou delivery" },
  { valor: "link", rotulo: "Link, para qualquer destino" },
];

type Escrita = {
  tipo: TipoAcao | "nenhum";
  rotulo: string;
  url: string;
  icone: IconeLink;
};

/** O texto que o servidor grava quando a pessoa deixa o campo em branco. */
const PADROES: Record<TipoAcao, string> = {
  whatsapp: "Chamar no WhatsApp",
  telefone: "Ligar",
  link: "Abrir",
};

function comoEstava(acao: Acao | null, tipoPadrao: Escrita["tipo"]): Escrita {
  return {
    tipo: acao?.tipo ?? tipoPadrao,
    rotulo: acao?.rotulo ?? "",
    url: acao?.url ?? "",
    icone: acao?.icone ?? "link",
  };
}

/** A escrita virando o dado que `acoesDoRodape` sabe resolver. */
function paraAcao(e: Escrita): Acao | null {
  if (e.tipo === "nenhum") return null;
  return {
    tipo: e.tipo,
    rotulo: e.rotulo.trim() || PADROES[e.tipo],
    /*
     * O endereço vazio some o botão inteiro, que é a regra de `montar`. Aqui
     * dentro isso deixaria a pessoa escrevendo o texto de um botão invisível,
     * então o desenho segura o lugar dele e o selo diz o que está chegando. O
     * bloco é `inert`, e o endereço de mentira nunca vira link clicável.
     */
    url: e.tipo === "link" ? e.url.trim() || "https://exemplo" : null,
    icone: e.icone,
  };
}

function Bloco({
  prefixo,
  titulo,
  explicacao,
  exemploRotulo,
  escrita,
}: {
  prefixo: string;
  titulo: string;
  explicacao: string;
  exemploRotulo: string;
  escrita: Escrita;
}) {
  const ehLink = escrita.tipo === "link";
  const some = escrita.tipo === "nenhum";

  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-4">
      <legend className="px-1 text-sm font-semibold text-texto">{titulo}</legend>
      <p className="-mt-1 text-sm leading-relaxed text-suave">{explicacao}</p>

      <Escolha
        id={`${prefixo}-tipo`}
        rotulo="O que este botão faz"
        valor={escrita.tipo}
        opcoes={TIPOS}
      />

      {some ? null : (
        <>
          <Texto
            id={`${prefixo}-rotulo`}
            rotulo="Texto do botão"
            dica={`Por exemplo: ${exemploRotulo}.`}
            valor={escrita.rotulo}
            maxLength={40}
          />

          {ehLink ? (
            <>
              {/*
                Sem type="url" de propósito. O navegador exigiria o https escrito
                na mão e travaria o envio de "marinayoga.com.br", que o servidor
                aceita e completa. Quem confere é lib/links.ts, que recusa
                dizendo o motivo.
              */}
              <Texto
                id={`${prefixo}-url`}
                rotulo="Endereço do link"
                dica="O endereço completo, do jeito que ele abre no navegador. Use o link direto."
                valor={escrita.url}
                inputMode="url"
              />
              <Escolha
                id={`${prefixo}-icone`}
                rotulo="Ícone"
                valor={escrita.icone}
                opcoes={ICONES}
              />
            </>
          ) : (
            /*
             * Os dois campos continuam no formulário, escondidos, com o que já
             * estava gravado. Assim quem experimenta o WhatsApp e volta para o
             * link encontra o endereço dele de pé, em vez de digitar de novo.
             */
            <>
              <input type="hidden" name={`${prefixo}-url`} value={escrita.url} />
              <input
                type="hidden"
                name={`${prefixo}-icone`}
                value={escrita.icone}
              />
            </>
          )}
        </>
      )}
    </fieldset>
  );
}

export function BotoesDaPagina({ negocio }: { negocio: Negocio }) {
  const [principal, setPrincipal] = useState<Escrita>(
    comoEstava(negocio.acaoPrincipal, "whatsapp"),
  );
  const [secundaria, setSecundaria] = useState<Escrita>(
    comoEstava(negocio.acaoSecundaria, "nenhum"),
  );

  /*
   * A leitura é por evento que sobe, e não por campo controlado.
   *
   * `Escolha` é o `select` do painel e ele nasce sem `onChange`, de propósito:
   * a tela inteira grava por formulário, e um campo controlado a mais seria um
   * campo a menos funcionando enquanto o JavaScript ainda vem. Então os campos
   * continuam iguais aos das outras telas, e esta camada só escuta o que sobe
   * deles e copia para o desenho.
   */
  function ler(evento: React.FormEvent<HTMLDivElement>) {
    const alvo = evento.target;
    if (
      !(alvo instanceof HTMLInputElement) &&
      !(alvo instanceof HTMLSelectElement)
    ) {
      return;
    }

    const corte = alvo.name.indexOf("-");
    if (corte < 0) return;
    const dono = alvo.name.slice(0, corte);
    const campo = alvo.name.slice(corte + 1);
    const valor = alvo.value;

    const aplicar = (a: Escrita): Escrita => {
      if (campo === "tipo") return { ...a, tipo: valor as Escrita["tipo"] };
      if (campo === "rotulo") return { ...a, rotulo: valor };
      if (campo === "url") return { ...a, url: valor };
      if (campo === "icone") return { ...a, icone: valor as IconeLink };
      return a;
    };

    if (dono === "principal") setPrincipal(aplicar);
    if (dono === "secundaria") setSecundaria(aplicar);
  }

  const desenho: Negocio = {
    ...negocio,
    acaoPrincipal: paraAcao(principal),
    acaoSecundaria: paraAcao(secundaria),
  };
  const acoes = acoesDoRodape(desenho);

  /*
   * O que o desenho diz quando ele fica vazio.
   *
   * Botão de WhatsApp e botão de telefone tiram o destino do número gravado na
   * tela do negócio, e `acoesDoRodape` devolve lista vazia enquanto esse número
   * está em branco. Uma frase genérica ali mandaria a pessoa procurar o erro
   * nesta tela, e o campo mora na outra: então a frase nomeia a tela e o campo.
   */
  const aviso =
    principal.tipo === "whatsapp" && !negocio.whatsapp
      ? "O botão do WhatsApp aparece aqui assim que o número estiver em Informações do negócio."
      : principal.tipo === "telefone" && !negocio.telefone && !negocio.whatsapp
        ? "O botão de ligar aparece aqui assim que o telefone estiver em Informações do negócio."
        : "Escolha o que o botão principal faz e ele aparece aqui.";

  /** Verdadeiro enquanto um botão de link está sem o endereço escrito. */
  const esperandoEndereco = [principal, secundaria].some(
    (e) => e.tipo === "link" && e.url.trim() === "",
  );

  const mapa = (
    <MapaDaPagina
      negocio={negocio}
      zona="barra"
      chamada="Na sua página eles ficam presos embaixo, por cima do que estiver rolando:"
    >
      {acoes.length > 0 ? (
        acoes.map((a, i) => (
          <BotaoAcao
            key={`${a.rotulo}-${i}`}
            acao={a}
            principal={i === 0}
            compacto
            interativo={false}
          />
        ))
      ) : (
        <p className="rounded-lg border border-dashed border-borda px-3 py-2 text-[0.7rem] leading-relaxed text-suave">
          {aviso}
        </p>
      )}
    </MapaDaPagina>
  );

  return (
    <div
      onInput={ler}
      onChange={ler}
      className="mt-6 flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8"
    >
      {/*
        No computador o desenho fica na coluna da direita e acompanha a rolagem,
        então ele continua à vista enquanto a pessoa mexe no segundo botão. No
        celular ele vem antes dos campos: é o que responde "onde isso aparece"
        antes de a primeira escolha ser feita.
      */}
      <div className="lg:order-2 lg:sticky lg:top-8">
        {mapa}
        {esperandoEndereco ? (
          <p className="mt-2 inline-flex rounded-full bg-destaque/10 px-2.5 py-1 text-[0.7rem] font-semibold text-destaque">
            Esperando o endereço do link
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 lg:order-1">
        <Bloco
          prefixo="principal"
          titulo="Botão principal"
          explicacao="Aparece preenchido, com destaque."
          exemploRotulo="Marcar uma sessão"
          escrita={principal}
        />
        <Bloco
          prefixo="secundaria"
          titulo="Botão secundário"
          explicacao="Aparece contornado, embaixo do principal."
          exemploRotulo="Ver os horários livres"
          escrita={secundaria}
        />
      </div>
    </div>
  );
}
