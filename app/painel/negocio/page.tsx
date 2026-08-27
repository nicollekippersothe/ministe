import Link from "next/link";
import { salvarBasico } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import {
  AreaTexto,
  BarraSalvar,
  Botao,
  Escolha,
  Grupo,
  Marcar,
  Texto,
} from "@/componentes/painel/Campos";
import { BlocoDoWhatsapp } from "@/componentes/painel/BlocoDoWhatsapp";
import { EnvioDeImagem } from "@/componentes/painel/EnvioDeImagem";
import { EscolhaDoEndereco } from "@/componentes/painel/EscolhaDoEndereco";
import { receitaDe } from "@/lib/categorias";
import { doDono } from "@/lib/dados";
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
   * Qual das duas respostas do endereço já vem marcada.
   *
   * Quem manda é a receita do ramo, e não esta tela. `lib/categorias.ts` marca
   * cada categoria com `endereco: "esperado" | "opcional"`, e o comentário do
   * campo lá diz o porquê: quem produz em casa e quem atende online raramente
   * quer o endereço público, e perguntar como se fosse obrigatório faz a pessoa
   * travar no cadastro.
   *
   * Três coisas puxam para "sim", nesta ordem de força: endereço já gravado,
   * ramo com ponto na rua, e a recusa do servidor num campo daqui de dentro,
   * porque esconder o campo esconderia justamente o que precisa de conserto.
   */
  const receita = receitaDe(negocio.categoria);
  const erroDeEndereco =
    params.erro === "cep" ||
    params.erro === "estado" ||
    (params.erro ?? "").startsWith("mapa_");
  const temEndereco = [
    negocio.endereco,
    negocio.cidade,
    negocio.estado,
    negocio.cep,
    negocio.mapsUrl,
  ].some((p) => p !== null && p !== "");
  const enderecoNaPagina =
    temEndereco || receita.endereco === "esperado" || erroDeEndereco
      ? "sim"
      : "nao";

  /*
   * A chave do bloco de endereço, montada com o que está gravado.
   *
   * Campo de digitar aqui é não controlado, com `defaultValue`, e o Salvar
   * volta por navegação de cliente: o React reaproveita o mesmo input e o valor
   * que está dentro dele fica onde estava. Sempre foi assim e nunca apareceu,
   * porque o que volta do servidor costuma ser o que a pessoa acabou de digitar.
   *
   * A escolha "prefiro deixar de fora" quebra esse empate: ela apaga o endereço
   * no banco, e o campo escondido continuaria mostrando a rua antiga para quem
   * voltasse para "sim" na mesma visita. Com a chave mudando junto com o valor
   * gravado, o bloco nasce de novo e os campos leem o que o servidor devolveu.
   */
  const chaveDoEndereco = [
    negocio.endereco,
    negocio.cidade,
    negocio.estado,
    negocio.cep,
    negocio.mapsUrl,
  ].join("|");

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

      <h1 className="titulo mt-2 text-2xl text-texto">
        Informações do negócio
      </h1>

      {/*
        Só a recusa sai no alto, e é o lugar dela: ela vale para a tela toda e
        precisa ser lida antes de qualquer campo. A confirmação desceu para
        dentro da `BarraSalvar`, junto do botão que a produziu. Ver o comentário
        do `recado` em componentes/painel/Campos.tsx.
      */}
      <Aviso erro={params.erro} />

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
        id="imagens"
        aria-labelledby="titulo-imagens"
        className="mt-6 flex scroll-mt-32 flex-col gap-4 lg:grid lg:grid-cols-[19rem_1fr] lg:items-start"
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
          {/*
            O campo do número e as duas prévias saíram juntos para um
            componente só. O motivo está escrito lá: enquanto as prévias liam o
            número gravado, digitar não mexia no desenho, e o botão só aparecia
            depois de uma ida ao servidor.
          */}
          <BlocoDoWhatsapp negocio={negocio} />
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

        <EscolhaDoEndereco key={chaveDoEndereco} inicial={enderecoNaPagina}>
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
          {/*
            Os três curtos dividem uma linha só, inclusive no celular.

            Cada um empilhado custava 120 pixels de rolagem para caber duas
            letras de UF, e a tela já é longa. Cidade fica com o que sobra, e UF
            e CEP têm largura escrita porque o conteúdo delas tem tamanho fixo.
          */}
          <div className="flex gap-2 lg:col-span-2">
            <div className="min-w-0 flex-1">
              <Texto
                id="cidade"
                rotulo="Cidade"
                valor={negocio.cidade}
                maxLength={60}
              />
            </div>
            <div className="w-14 shrink-0">
              <Texto
                id="estado"
                rotulo="UF"
                valor={negocio.estado}
                maxLength={2}
                pattern="[A-Za-z]{2}"
              />
            </div>
            <div className="w-28 shrink-0">
              <Texto
                id="cep"
                rotulo="CEP"
                valor={negocio.cep}
                inputMode="numeric"
                maxLength={9}
                autoComplete="postal-code"
              />
            </div>
          </div>
          <Texto
            id="mapsUrl"
            rotulo="Link do Google Maps"
            dica="Procure onde você atende no Maps, toque em compartilhar e cole aqui."
            valor={negocio.mapsUrl}
            inputMode="url"
          />
        </EscolhaDoEndereco>

        <BarraSalvar
          recado={
            params.salvo === "1"
              ? "Alterações salvas. A sua página já mostra o que você escreveu aqui."
              : undefined
          }
        >
          <Botao type="submit">Salvar</Botao>
        </BarraSalvar>
      </form>
    </main>
  );
}
