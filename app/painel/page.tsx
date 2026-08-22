import Link from "next/link";
import { IconeSeta } from "@/componentes/Icones";
import { ListaSecoes } from "@/componentes/painel/ListaSecoes";
import { CartaoEstado } from "@/componentes/painel/Navegacao";
import { Aviso } from "@/componentes/painel/Aviso";
import { CartaoPlano } from "@/componentes/painel/CartaoPlano";
import { acoesDoRodape } from "@/lib/acoes";
import { cobrancaDoDono, doDono } from "@/lib/dados";
import { telefoneVisivel } from "@/lib/formato";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import { contaProvisoria } from "@/lib/supabase/servidor";
import type { Intervalo, Item } from "@/lib/tipos";

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
        className="flex items-start gap-4 px-5 py-4 hover:bg-fundo active:bg-fundo"
      >
        <span className="w-28 shrink-0 text-sm text-suave">{rotulo}</span>
        <span
          className={`flex-1 leading-relaxed ${
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
 * A abertura do painel, nas duas larguras.
 *
 * No celular ela é a navegação inteira: o estado da página primeiro, as seis
 * partes logo abaixo. No computador esses dois já moram na coluna da esquerda,
 * então repeti-los aqui seria a mesma lista duas vezes na mesma tela.
 *
 * O que sobra para o computador é o que a coluna estreita comporta mal: o
 * endereço em tamanho de ler em voz alta, e o conteúdo de verdade da página,
 * linha por linha. Assim quem chega vê num relance se a página está no ar, qual
 * é o endereço dela e por onde continuar, sem abrir as seções para
 * lembrar o que já preencheu.
 */
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

export default async function Painel({
  searchParams,
}: {
  searchParams: Promise<{ rascunho?: string; erro?: string }>;
}) {
  exigirLogin();
  /*
   * As quatro de uma vez, e não uma esperando a outra.
   *
   * Nenhuma delas precisa da resposta da anterior, e cada uma é uma ida ao
   * banco em São Paulo. Em fila, esta tela levava o tempo das quatro somado; em
   * paralelo, o da mais lenta. A pergunta de quem está pedindo sai uma vez só
   * para as três, pelo `cache` de lib/supabase/servidor.ts.
   */
  const [{ rascunho, erro }, negocio, provisoria, cobranca] = await Promise.all([
    searchParams,
    doDono(),
    // Conta provisória monta e guarda, e o Google é que põe no ar. A tela diz
    // isso antes do clique, em vez de deixar a pessoa descobrir no erro.
    contaProvisoria(),
    // O estado da cobrança vem separado do negócio porque o `Negocio` não
    // carrega nem o uuid nem a validade do plano, de propósito: ele é o tipo que
    // a página pública também usa.
    cobrancaDoDono(),
  ]);

  const noAr = negocio.publicado;

  // Rua, cidade e UF numa linha só, na ordem em que a página pública mostra. O
  // CEP fica fora: numa linha de resumo ele ocupa espaço sem ajudar ninguém a
  // reconhecer o endereço de relance.
  const enderecoVisivel =
    [negocio.endereco, negocio.cidade, negocio.estado]
      .filter(Boolean)
      .join(", ") || null;
  // Pelo resolvedor de verdade, e não pelos campos crus: assim o resumo mostra
  // o botão que a página tem hoje, inclusive o WhatsApp que entra sozinho.
  const botoes = acoesDoRodape(negocio)
    .map((a) => a.rotulo)
    .join(" e ");

  return (
    <main className="mt-6">
      <h1 className="text-2xl font-bold tracking-tight text-texto lg:text-3xl">
        Sua página
      </h1>

      <Rascunho estado={rascunho} />

      {/* Publicar é a única escrita que sai daqui, e o gatilho pode recusar. */}
      <Aviso erro={erro} />

      <div className="lg:hidden">
        <div className="mt-4 flex flex-col gap-4">
          <CartaoEstado negocio={negocio} provisoria={provisoria} />
          <CartaoPlano estado={cobranca} />
        </div>

        <p className="mt-4 text-sm">
          <Link
            href="/painel/numeros"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Ver quantas pessoas abriram a sua página
          </Link>
        </p>

        <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight text-texto">
          Editar
        </h2>

        <ListaSecoes />
      </div>

      <div className="hidden lg:block">
        <section className="mt-6 rounded-2xl border border-borda bg-superficie p-6">
          {/*
            A coluna do lado empilha o selo em cima do endereço, então aqui os
            dois vão na mesma linha: o endereço é o assunto, e o selo é o que se
            diz sobre ele. Assim o resumo continua sendo resumo, em vez de virar
            a mesma peça duas vezes na mesma tela.
          */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-2xl leading-snug font-semibold tracking-tight break-all text-suave">
              {DOMINIO_PUBLICO}/
              <span className="text-texto">{negocio.slug}</span>
            </p>

            <p
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                noAr
                  ? "bg-aberto-fundo text-aberto-texto"
                  : "bg-fechado-fundo text-fechado-texto"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
              {noAr ? "No ar" : "Rascunho"}
            </p>
          </div>

          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-suave">
            {noAr
              ? "Este endereço abre a sua página para qualquer pessoa. O que você salvar aqui aparece nela na mesma hora."
              : "A página fica guardada aqui com você. Publicar abre este endereço para qualquer pessoa, e o botão fica na coluna ao lado."}
          </p>
        </section>

        <div className="mt-6">
          <CartaoPlano estado={cobranca} />
        </div>

        <p className="mt-4 text-sm">
          <Link
            href="/painel/numeros"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Ver quantas pessoas abriram a sua página
          </Link>
        </p>

        <h2 className="mt-10 text-lg font-semibold tracking-tight text-texto">
          O que a página mostra hoje
        </h2>
        <p className="mt-1 text-sm text-suave">
          Cada linha leva direto para o lugar de editar.
        </p>

        <ul className="mt-4 divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
          <Linha
            rotulo="Nome"
            valor={negocio.nome}
            convite="Escrever o nome do negócio"
            href="/painel/negocio"
          />
          <Linha
            rotulo="Frase"
            valor={negocio.frase}
            convite="Escrever uma frase curta"
            href="/painel/negocio"
          />
          <Linha
            rotulo="WhatsApp"
            valor={negocio.whatsapp ? telefoneVisivel(negocio.whatsapp) : null}
            convite="Informar o WhatsApp"
            href="/painel/negocio"
          />
          <Linha
            rotulo="Endereço"
            valor={enderecoVisivel}
            convite="Informar o endereço"
            href="/painel/negocio"
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
            convite="Marcar os horários da semana"
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
        </ul>
      </div>
    </main>
  );
}
