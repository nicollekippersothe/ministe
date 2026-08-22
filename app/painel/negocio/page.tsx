import Link from "next/link";
import { salvarBasico } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import {
  AreaTexto,
  BarraSalvar,
  Botao,
  Escolha,
  Grupo,
  GrupoRecolhivel,
  Marcar,
  Texto,
} from "@/componentes/painel/Campos";
import { EnvioDeImagem } from "@/componentes/painel/EnvioDeImagem";
import {
  MensagemDoBotao,
  MensagemDosItens,
} from "@/componentes/painel/PreviaDaMensagem";
import { receitaDe } from "@/lib/categorias";
import { doDono } from "@/lib/dados";
import { telefoneVisivel } from "@/lib/formato";
import { configurado } from "@/lib/supabase/config";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

const TITULOS_CATALOGO = [
  { valor: "Catálogo", rotulo: "Catálogo" },
  { valor: "Cardápio", rotulo: "Cardápio" },
  { valor: "Serviços", rotulo: "Serviços" },
  { valor: "Produtos", rotulo: "Produtos" },
  { valor: "Aulas e planos", rotulo: "Aulas e planos" },
  { valor: "Atendimentos", rotulo: "Atendimentos" },
];

const FUSOS = [
  { valor: "America/Sao_Paulo", rotulo: "Brasília (a maior parte do país)" },
  { valor: "America/Manaus", rotulo: "Manaus (AM, RR, RO, MT oeste)" },
  { valor: "America/Cuiaba", rotulo: "Cuiabá (MT)" },
  { valor: "America/Campo_Grande", rotulo: "Campo Grande (MS)" },
  { valor: "America/Rio_Branco", rotulo: "Rio Branco (AC)" },
  { valor: "America/Noronha", rotulo: "Fernando de Noronha" },
];

export default async function Informacoes({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  /*
   * Quem manda no endereço é a receita do ramo, e não esta tela.
   *
   * `lib/categorias.ts` já marca cada categoria com `endereco: "esperado" |
   * "opcional"`, e o comentário do campo lá diz o porquê: quem produz em casa e
   * quem atende online raramente quer o endereço público, e perguntar como se
   * fosse obrigatório faz a pessoa travar no cadastro. A tela ignorava isso e
   * abria os cinco campos de rua para todo mundo, inclusive para a psicóloga
   * que atende por vídeo. Agora ela obedece: ramo com ponto na rua abre o bloco,
   * ramo que costuma atender de outro jeito começa com ele recolhido, e a dobra
   * abre com um toque para quem quiser.
   *
   * A recusa do servidor também abre: quando o `?erro=` é de um campo daqui de
   * dentro, esconder o campo esconderia justamente o que precisa de conserto.
   */
  const receita = receitaDe(negocio.categoria);
  const erroDeEndereco =
    params.erro === "cep" ||
    params.erro === "estado" ||
    (params.erro ?? "").startsWith("mapa_");
  const enderecoAberto = receita.endereco === "esperado" || erroDeEndereco;

  /** O que a dobra fechada mostra: o endereço guardado, ou o convite para pôr um. */
  const resumoDoEndereco =
    [negocio.endereco, negocio.cidade, negocio.estado]
      .filter((p) => p !== null && p !== "")
      .join(", ") ||
    "Rua, cidade e link do mapa. Abra para pôr o seu na página.";

  return (
    <main className="mt-6">
      {/*
        No computador a coluna da esquerda fica sempre à vista, com as seções
        e o estado da página, então o Voltar seria um segundo caminho
        para onde já dá para ir com um clique.
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
        Informações do negócio
      </h1>

      <Aviso salvo={params.salvo === "1"} erro={params.erro} />

      {/*
        As imagens ficam fora do formulário de texto, e é uma decisão de
        gravação: cada arquivo sobe pelo navegador e vira coluna na hora em que
        chega, então esperar o Salvar do rodapé só criaria um segundo momento
        para a mesma coisa acontecer. O formulário de texto continua inteiro
        logo abaixo.

        A logo é um selo e a capa é uma faixa, então no monitor a coluna da
        esquerda é estreita e a da direita fica com o resto. No celular as duas
        empilham, na ordem em que aparecem na página.
      */}
      <section
        aria-labelledby="titulo-imagens"
        className="mt-6 flex flex-col gap-4 lg:grid lg:grid-cols-[19rem_1fr] lg:items-start"
      >
        <h2
          id="titulo-imagens"
          className="text-lg font-semibold tracking-tight text-texto lg:col-span-2"
        >
          Imagens da página
        </h2>

        <EnvioDeImagem
          pasta="logo"
          atual={negocio.logo?.url ?? null}
          nome={negocio.nome}
          ligado={configurado}
        />
        <EnvioDeImagem
          pasta="capa"
          atual={negocio.capa?.url ?? null}
          foco={negocio.capa?.foco ?? null}
          nome={negocio.nome}
          ligado={configurado}
        />
      </section>

      <form action={salvarBasico} className="mt-8 flex flex-col gap-8">
        <Grupo titulo="Sobre o negócio">
          <Texto
            id="nome"
            rotulo="Nome do negócio"
            valor={negocio.nome}
            required
            maxLength={80}
            autoComplete="organization"
          />
          <AreaTexto
            id="frase"
            rotulo="Uma frase curta"
            dica="Aparece abaixo do nome. Em branco, a linha some da página."
            valor={negocio.frase}
            maxLength={160}
          />
          {/*
            O fuso mora aqui, e saiu do bloco de endereço de propósito: ele
            manda no selo de aberto e fechado, que a página mostra para quem
            atende de qualquer lugar. Dentro da dobra do endereço, quem trabalha
            online passaria direto por ele e a hora do selo ficaria a de
            Brasília para quem atende no Acre.
          */}
          <Escolha
            id="fuso"
            rotulo="Fuso horário"
            dica="Define a hora usada no selo de aberto e fechado."
            valor={negocio.fuso}
            opcoes={FUSOS}
          />
        </Grupo>

        <Grupo titulo="WhatsApp e catálogo" duplo>
          <Texto
            id="whatsapp"
            rotulo="Número do WhatsApp"
            dica="Com DDD. Pode digitar com parênteses e traço."
            valor={negocio.whatsapp ? telefoneVisivel(negocio.whatsapp) : null}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
          <MensagemDoBotao
            negocio={negocio}
            rotulo="Mensagem que já vem escrita"
            dica="É o que o cliente vê digitado quando toca no botão."
          />
          <MensagemDosItens
            negocio={negocio}
            rotulo="Mensagem dos itens"
            dica="Vale para todos os itens de uma vez. O {item} vira o nome do produto."
          />
          <Escolha
            id="tituloCatalogo"
            rotulo="Nome dessa seção na página"
            dica="Nem todo negócio tem cardápio. Escolha o nome que faz sentido para o seu."
            valor={negocio.tituloCatalogo}
            opcoes={TITULOS_CATALOGO}
          />
          <Marcar
            id="mostrarPrecos"
            rotulo="Mostrar preços na página"
            dica="Desmarcado, o preço fica guardado, mesmo nos itens que já têm preço preenchido."
            marcado={negocio.mostrarPrecos}
          />
        </Grupo>

        <GrupoRecolhivel
          titulo="Endereço"
          resumo={resumoDoEndereco}
          aberto={enderecoAberto}
          duplo
        >
          {/* A rua é a linha mais comprida do grupo, então fica com a largura
              toda e deixa cidade, UF e CEP dividirem a linha de baixo. */}
          <div className="lg:col-span-2">
            <Texto
              id="endereco"
              rotulo="Rua, número e bairro"
              valor={negocio.endereco}
              maxLength={120}
              autoComplete="street-address"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Texto
                id="cidade"
                rotulo="Cidade"
                valor={negocio.cidade}
                maxLength={60}
              />
            </div>
            <div className="w-20">
              <Texto
                id="estado"
                rotulo="UF"
                valor={negocio.estado}
                maxLength={2}
                pattern="[A-Za-z]{2}"
              />
            </div>
          </div>
          <Texto
            id="cep"
            rotulo="CEP"
            valor={negocio.cep}
            inputMode="numeric"
            maxLength={9}
            autoComplete="postal-code"
          />
          <Texto
            id="mapsUrl"
            rotulo="Link do Google Maps"
            dica="Abra seu endereço no Maps, toque em compartilhar e cole aqui."
            valor={negocio.mapsUrl}
            inputMode="url"
          />
        </GrupoRecolhivel>

        <BarraSalvar>
          <Botao type="submit">Salvar</Botao>
        </BarraSalvar>
      </form>
    </main>
  );
}
