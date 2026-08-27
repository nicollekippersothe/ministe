import Link from "next/link";
import { IconeSeta } from "@/componentes/Icones";
import { MapaDaPagina } from "@/componentes/painel/MapaDaPagina";
import { CartaoEstado } from "@/componentes/painel/Navegacao";
import { Aviso } from "@/componentes/painel/Aviso";
import { CartaoPlano } from "@/componentes/painel/CartaoPlano";
import { cobrancaDoDono, doDono } from "@/lib/dados";
import { telefoneVisivel } from "@/lib/formato";
import { combinacao } from "@/lib/fontes";
import { acoesDoRodape } from "@/lib/acoes";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { contaProvisoria } from "@/lib/supabase/servidor";
import type { Intervalo, Item, Negocio } from "@/lib/tipos";

import { saudacao } from "@/app/painel/sessao";
import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

/**
 * Quantos dias da semana já têm horário marcado.
 *
 * Conta dia, e não intervalo: quem abre de manhã e de tarde tem dois
 * intervalos no mesmo dia, e "2 dias da semana" seria mentira sobre a página.
 */
function resumoHorarios(horarios: Intervalo[]): string | null {
  const dias = new Set(horarios.map((h) => h.dia));
  if (dias.size === 0) return null;
  if (dias.size === 7) return "Todos os dias da semana";
  return `${dias.size} ${dias.size === 1 ? "dia" : "dias"} da semana`;
}

/**
 * Quantos itens o catálogo guarda, e quantos deles a página mostra.
 *
 * Os dois números, e não só um: item desligado continua guardado no painel, e
 * dizer "7 itens" para uma página que mostra 4 seria mentira sobre a página,
 * que é o que este resumo promete descrever.
 */
function resumoItens(itens: Item[]): string | null {
  if (itens.length === 0) return null;
  const contagem = `${itens.length} ${itens.length === 1 ? "item" : "itens"}`;
  const naPagina = itens.filter((i) => i.ativo).length;
  return naPagina === itens.length
    ? contagem
    : `${contagem}, ${naPagina} na página`;
}

/**
 * Uma linha do resumo: o que a página mostra hoje, e o caminho para mudar.
 *
 * Campo preenchido aparece com o valor de verdade, que é o que deixa a pessoa
 * conferir a página inteira sem abrir as seções. Campo em branco vira
 * convite escrito como tarefa ("Informar o WhatsApp"), na cor de destaque: a
 * linha continua dizendo o que existe para fazer, em vez do que está faltando.
 */
function Linha({
  rotulo,
  valor,
  convite,
  href,
}: {
  rotulo: string;
  valor: string | null;
  convite: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 px-4 py-4 hover:bg-fundo active:bg-fundo sm:gap-4 sm:px-5"
      >
        {/* Coluna de rótulo mais estreita no celular: com 28 fixos sobravam
            pouco mais de 180 pixels para o valor, e a rua quebrava em quatro
            linhas numa tela de 390. */}
        <span className="w-20 shrink-0 text-sm text-suave sm:w-28">
          {rotulo}
        </span>
        {/* Duas linhas no máximo, e só no celular. Numa tela de 390 pixels a
            rua inteira ocupava quatro linhas, a lista de oito itens
            virava uma parede, e encontrar a linha de Horários dava mais
            trabalho do que abrir a seção. O resto do texto fica no editor, do
            outro lado do clique. Da largura de tablet para cima sobra espaço
            para a linha inteira, e aí cortar seria esconder por hábito. */}
        <span
          className={`line-clamp-2 flex-1 leading-relaxed sm:line-clamp-none ${
            valor ? "text-texto" : "font-medium text-destaque"
          }`}
        >
          {valor ?? convite}
        </span>
        <IconeSeta className="mt-1 h-4 w-4 shrink-0 text-suave" />
      </Link>
    </li>
  );
}

/**
 * O rótulo de uma parte da tela.
 *
 * Miúdo e em caixa alta, de propósito. Os títulos aqui vinham em 18 pixels
 * semibold, o mesmo peso do conteúdo que eles anunciam e quase o mesmo do
 * título da tela, e com três deles empilhados a tela ficava com quatro coisas
 * disputando o primeiro lugar. Rótulo é placa, e placa se lê de canto de olho:
 * encolhendo ele, o link da página, o cumprimento e as linhas do resumo passam
 * a ter cada um um degrau só para si.
 */
const ROTULO =
  "text-xs font-semibold tracking-[0.1em] text-suave uppercase";

/**
 * O recado de quem acabou de entrar numa conta que já existia.
 *
 * Chega por `app/auth/retorno`, que é onde a página montada em conta
 * provisória troca de dono quando o Google já pertence a alguém. As três
 * frases dizem o que existe: a página veio junto, a conta já tem a página que
 * o plano guarda, ou a montada agora ficou onde estava.
 */
function Rascunho({ estado }: { estado?: string }) {
  if (estado !== "veio" && estado !== "cheio" && estado !== "ficou") return null;

  return (
    <p
      role="status"
      className="mt-4 rounded-xl bg-aberto-fundo px-4 py-3 text-sm leading-relaxed font-medium text-aberto-texto"
    >
      {estado === "veio" ? (
        "A página que você montou agora está nesta conta."
      ) : estado === "ficou" ? (
        "A página que você montou agora ficou na conta provisória, e esta aqui abriu com o que já era seu."
      ) : (
        <>
          Esta conta já tem uma página, e o plano atual guarda uma por conta.{" "}
          <Link href="/painel/plano" className="underline underline-offset-4">
            Ver o plano
          </Link>
        </>
      )}
    </p>
  );
}

/**
 * A chegada de quem acabou de montar a página.
 *
 * **Existe porque o cadastro terminava em silêncio.** `app/criar/acoes.ts`
 * fecha o cadastro com `redirect("/painel?criado=1")`, e nenhuma tela do
 * produto lia esse `criado`: a pessoa escolhia o link, tocava no botão que
 * cria a página, e caía numa tela que começava com "Oi". O momento em que a
 * página nasce é o único da vida dela em que o link é novidade, e ele passava
 * batido.
 *
 * Então a chegada diz as duas coisas que só ela pode dizer: qual é o link que
 * acabou de nascer, e o que acontece com ele agora. O passo concreto de
 * preencher fica com o `CartaoEstado`, que já sabe qual campo falta e leva
 * direto nele: repetir esse botão aqui seria a mesma oferta duas vezes na
 * mesma tela.
 *
 * Mesmo `role="status"` do aviso de rascunho logo abaixo, pelo mesmo motivo: é
 * um recado sobre o que acabou de acontecer, e quem usa leitor de tela ouve ele
 * ao terminar a frase de agora, sem ser interrompido.
 */
function Criado({ negocio }: { negocio: Negocio }) {
  return (
    <div
      role="status"
      className="mt-4 rounded-xl bg-aberto-fundo px-4 py-3 text-aberto-texto"
    >
      {/* `break-words`, e nunca `break-all`: com `break-all` o navegador parte
          onde a linha acabar, e numa tela de 390 pixels o link saía cortado no
          meio ("entrais.app/de" / "mo"). Assim ele desce inteiro para a linha
          de baixo, e só um endereço longo demais para a largura chega a ser
          partido. */}
      <p className="text-[1.05rem] leading-snug font-semibold break-words">
        A sua página nasceu em {DOMINIO_PUBLICO}/{negocio.slug}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed">
        Ela fica só para você até você publicar. O que você salvar aqui já
        aparece nela.
      </p>
    </div>
  );
}

export default async function Painel({
  searchParams,
}: {
  searchParams: Promise<{ criado?: string; rascunho?: string; erro?: string }>;
}) {
  exigirLogin();
  /*
   * As cinco de uma vez, e não uma esperando a outra.
   *
   * Nenhuma delas precisa da resposta da anterior, e cada uma é uma ida ao
   * banco em São Paulo. Em fila, esta tela levava o tempo das cinco somado; em
   * paralelo, o da mais lenta. A pergunta de quem está pedindo sai uma vez só
   * para as que dependem da sessão, inclusive o nome do cumprimento, pelo
   * `cache` de lib/supabase/servidor.ts.
   */
  const [{ criado, rascunho, erro }, negocio, provisoria, cobranca, ola] =
    await Promise.all([
      searchParams,
      doDono(),
      // Conta provisória monta e guarda, e o Google é que põe no ar. A tela diz
      // isso antes do clique, em vez de deixar a pessoa descobrir no erro.
      contaProvisoria(),
      // O estado da cobrança vem separado do negócio porque o `Negocio` não
      // carrega nem o uuid nem a validade do plano, de propósito: ele é o tipo
      // que a página pública também usa.
      cobrancaDoDono(),
      saudacao(),
    ]);

  // Rua, cidade e UF numa linha só, na ordem em que a página pública mostra. O
  // CEP fica fora: numa linha de resumo ele ocupa espaço sem ajudar ninguém a
  // reconhecer a rua de relance.
  const enderecoVisivel =
    [negocio.endereco, negocio.cidade, negocio.estado]
      .filter(Boolean)
      .join(", ") || null;
  // Pelo resolvedor de verdade, e não pelos campos crus: assim o resumo mostra
  // o botão que a página tem hoje, inclusive o WhatsApp que entra sozinho.
  const botoes = acoesDoRodape(negocio)
    .map((a) => a.rotulo)
    .join(" e ");

  /*
   * O plano e a contagem de visitas saíram do meio do celular.
   *
   * Os dois falam de uma página que já tem público: o plano vende letra e
   * números, e a contagem conta quem abriu. Numa coluna só eles se enfileiravam
   * entre a pessoa e o lugar de escrever, e a primeira coisa lida depois do
   * link da página era uma oferta. Agora fecham a tela, a um rolar de
   * distância.
   *
   * A exceção é o cartão que voltou do banco. Ali o assunto deixa de ser oferta
   * e passa a ser a página seguir no ar, com a saída à mão, então esse sobe
   * para logo abaixo do link da página.
   */
  const planoNoTopo = cobranca.assinatura?.status === "em_atraso";

  const plano = (
    <>
      <CartaoPlano estado={cobranca} />
      <p className="mt-4 text-sm">
        <Link
          href="/painel/numeros"
          className="inline-flex min-h-11 items-center font-medium text-destaque underline-offset-4 hover:underline"
        >
          Ver os números da sua página
        </Link>
      </p>
    </>
  );

  /*
   * O resumo do que a página diz hoje, nas duas larguras.
   *
   * **Ele morava só no bloco de computador, e isso era o defeito.** A dona
   * relatou abrir o painel no computador e a tela geral aparecer sem nenhuma
   * informação da página dela. Medido no navegador: abaixo de 1024 pixels de
   * janela, que é qualquer navegador em meia tela ou com zoom de 125 por
   * cento, o painel caía no desenho de celular e ali o resumo simplesmente
   * não existia. Sobravam o link, o plano e seis nomes de seção, e para
   * lembrar o que tinha escrito ela precisava abrir uma por uma.
   *
   * Agora ele sai nas duas, e continua sendo a mesma peça.
   *
   * A frase de apoio saiu. Ela dizia "Cada linha leva direto para o lugar de
   * editar", que é o que a seta no fim de cada linha já diz, e num celular ela
   * gastava uma linha inteira do primeiro rolar.
   */
  const resumo = (
    <>
      <h2 className={ROTULO}>Na sua página hoje</h2>

      <ul className="mt-3 divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
        {/*
          Cada linha leva ao CAMPO, e não ao topo da tela.

          Sem a âncora, tocar em "Frase" abria a tela de informações no começo
          dela, onde o primeiro cartão é o envio da foto de perfil. A dona do
          produto descreveu exatamente isso: "eu clico em frase curta e aparece
          pra colocar a imagem do perfil". O resumo prometia levar direto ao
          lugar de editar, e entregava o topo de uma tela comprida.
        */}
        <Linha
          rotulo="Nome"
          /* `|| null`, e não o valor cru: nome em branco é string vazia, que o
             `??` da Linha deixa passar. A linha saía muda, com rótulo e seta e
             nada no meio, justo na página recém criada. */
          valor={negocio.nome || null}
          convite="Escrever o nome do negócio"
          href="/painel/negocio#nome"
        />
        <Linha
          rotulo="Frase"
          valor={negocio.frase}
          convite="Escrever uma frase curta"
          href="/painel/negocio#frase"
        />
        <Linha
          rotulo="WhatsApp"
          valor={negocio.whatsapp ? telefoneVisivel(negocio.whatsapp) : null}
          convite="Informar o WhatsApp"
          href="/painel/negocio#whatsapp"
        />
        {/* "Onde você atende", e nunca "Endereço": a palavra endereço já nomeia
            o link da página no cartão logo acima, e a mesma palavra em dois
            assuntos na mesma tela é o que faz a pessoa ler o errado. */}
        <Linha
          rotulo="Onde atende"
          valor={enderecoVisivel}
          convite="Dizer onde você atende"
          href="/painel/negocio#endereco"
        />
        <Linha
          rotulo="Catálogo"
          valor={resumoItens(negocio.itens)}
          convite="Acrescentar o primeiro item"
          href="/painel/catalogo"
        />
        <Linha
          rotulo="Horários"
          valor={resumoHorarios(negocio.horarios)}
          convite="Dizer quando você atende"
          href="/painel/horarios"
        />
        <Linha
          rotulo="Botões"
          valor={botoes || null}
          convite="Escolher o botão principal"
          href="/painel/acoes-botoes"
        />
        <Linha
          rotulo="Links extras"
          valor={
            negocio.links.length > 0
              ? negocio.links.map((l) => l.rotulo).join(", ")
              : null
          }
          convite="Apontar para o seu Instagram"
          href="/painel/links"
        />
        {/*
          A letra entrou no resumo quando a lista de cartões saiu do celular.
          Sem esta linha, "Letras da página" ficava sem nenhum caminho no
          celular, porque era a única das seis seções que o resumo ainda não
          nomeava. O valor é a combinação em uso, que é o conteúdo de verdade
          desta parte, do mesmo jeito que as outras linhas mostram o delas.
        */}
        <Linha
          rotulo="Letras"
          valor={combinacao(negocio.fonte).nome}
          convite="Escolher a letra da página"
          href="/painel/aparencia"
        />
      </ul>
    </>
  );

  return (
    <main className="mt-6">
      {/*
        A banda do topo, e o motivo dela.

        **A dona do produto voltou ao painel com a página já criada e a tela
        abria em "Sua página", seguida da lista de campos.** Ela dizia de que
        assunto era, e nada mais: quem estava logado, onde tinha caído e o que
        aquela tela era dentro do produto ficavam por conta de quem lia.

        Agora a primeira linha cumprimenta pelo primeiro nome, a segunda nomeia
        o lugar, e logo abaixo vem o que a pessoa costuma vir buscar: o
        link da página, quem o enxerga, o botão de copiar e o próximo passo.

        No computador a banda ganha o desenho da página à direita. É o mesmo
        `MapaDaPagina` das telas de botões e de links, com nenhum pedaço aceso:
        lá ele responde "onde fica isto que estou editando", e aqui, mudo, ele
        responde "o que é isto que eu tenho". A sobra ao lado dele recebe o
        cartão do plano, e as duas colunas terminam quase juntas.

        **O desenho fica de fora do celular, e isso é medida e não gosto.** Numa
        tela de 390 pixels ele custa 340 de altura e empurra a lista de seções
        para fora do primeiro rolar, e em silhueta, sem nada aceso, ele se
        parece mais com um carregamento do que com uma página.
      */}
      <div className="lg:flex lg:items-start lg:gap-10">
        <div className="min-w-0 lg:flex-1">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-texto lg:text-[2.25rem]">
            {ola}
          </h1>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-suave">
            Esta é a sua tela inicial. A sua página inteira sai daqui.
          </p>

          {criado === "1" ? <Criado negocio={negocio} /> : null}

          <Rascunho estado={rascunho} />

          {/* Publicar é a única escrita que sai daqui, e o gatilho pode
              recusar. */}
          <Aviso erro={erro} />

          {/* No computador o cartão de estado mora na coluna da esquerda, à
              vista em todas as telas do painel. Repetir o mesmo link aqui
              era o que acontecia antes, com dois blocos a duzentos pixels um do
              outro. */}
          <div className="mt-5 lg:hidden">
            <CartaoEstado negocio={negocio} provisoria={provisoria} />
          </div>

          {/* O plano fecha a tela no celular e acompanha o desenho no
              computador, escondido de um lado por vez. Ele fala de uma página
              que já tem público, então ele nunca é a primeira coisa a ler numa
              coluna só. */}
          <div className="mt-6 hidden lg:block">{plano}</div>
        </div>

        <div className="hidden shrink-0 lg:block lg:w-[17rem]">
          <MapaDaPagina
            negocio={negocio}
            zona="nenhuma"
            chamada="A sua página, do topo ao rodapé."
          />
        </div>
      </div>

      {/* Cartão que voltou do banco sobe: ali o assunto deixa de ser oferta e
          passa a ser a página seguir no ar, com a saída à mão. */}
      {planoNoTopo ? <div className="mt-6 lg:hidden">{plano}</div> : null}

      {/*
        Uma navegação só para os mesmos seis lugares.

        **O celular tinha duas.** Medido numa tela de 390: a lista "Editar", com
        seis cartões, e o resumo "Na sua página hoje", com oito linhas, levavam
        aos mesmos seis destinos, separadas por 527 pixels de rolagem, somando 21
        alvos tocáveis numa tela de 2015. A dona do produto resumiu como "infos
        muito espalhadas".

        Quem ficou foi o resumo, e a escolha é fácil de defender: ele mostra o
        conteúdo de verdade de cada parte ("3 dias da semana", "7 itens, 4 na
        página"), e mostra o convite quando o campo está em branco. A lista de
        cartões dizia só o nome da seção, que é a metade que o resumo já carrega
        na coluna da esquerda de cada linha.

        No computador nada mudou: lá a lista mora na coluna fixa do layout,
        sempre à vista, e o resumo ocupa o meio da tela. São dois papéis
        diferentes, e não duas cópias.
      */}
      <section className="mt-10">{resumo}</section>

      {planoNoTopo ? null : <div className="mt-10 lg:hidden">{plano}</div>}
    </main>
  );
}
