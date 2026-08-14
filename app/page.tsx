import type { Metadata } from "next";
import Link from "next/link";
import { CampoAbertura } from "@/componentes/inicial/CampoAbertura";
import { Carrossel } from "@/componentes/inicial/Carrossel";
import { CarrosselExemplos } from "@/componentes/inicial/CarrosselExemplos";
import { Mosaico } from "@/componentes/inicial/Mosaico";
import { Telefone } from "@/componentes/inicial/Telefone";
import { Marca } from "@/componentes/Marca";
import { NOME_PRODUTO } from "@/lib/marca";
import { Vitrine } from "@/componentes/inicial/Vitrine";
import { porSlug } from "@/lib/dados";
import { MODO_VITRINE } from "@/lib/site";
import { atelie, doceria, massas, VITRINE } from "@/lib/exemplos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${NOME_PRODUTO}, o endereço do seu negócio na internet`,
  description:
    "O seu trabalho numa página só: as fotos, o que você vende, o horário e o caminho para falar com você. Com o seu nome no endereço, escrita para aparecer na busca.",
};

/*
 * Benefícios.
 *
 * Nenhum destes é sobre o que a página tem: isso já está no mosaico logo
 * acima, mostrado com as peças de verdade. Aqui é o que muda para o dono
 * depois de publicada, que é a parte que não dá para ver na tela.
 *
 * Os dois primeiros são a diferença para o que a pessoa já usa hoje, dita
 * sem citar ninguém: uma lista de links só atende quem já chegou, e catálogo
 * dentro de aplicativo de mensagem não existe fora dele.
 */
const BENEFICIOS = [
  {
    titulo: "Encontrada por quem está procurando agora",
    texto:
      "A página sai com a marcação que o Google lê: nome, categoria, cidade, horário e o que você oferece. Uma lista de links atende quem já chegou até você. Esta atende também quem ainda está atrás do serviço.",
  },
  {
    titulo: "Um endereço para colocar em tudo",
    texto:
      "Bio, anúncio pago, cartão, assinatura de e-mail. Quem clica cai direto no seu catálogo, que abre em qualquer navegador do celular.",
  },
  {
    titulo: "Você responde, e a página se monta",
    texto:
      "A página já vem desenhada. Você responde perguntas em vez de escolher fonte, margem e cor, e o resultado sai no mesmo padrão em qualquer aparelho.",
  },
  {
    titulo: "Editou, já está no ar",
    texto:
      "Entrou peça nova, ou o horário do feriado é outro? Você altera do celular e quem abrir em seguida já vê.",
  },
  {
    titulo: "O endereço é seu",
    texto:
      "As redes sociais mudam de regra e de alcance quando querem. O seu endereço fica onde está, com o mesmo nome, e continua abrindo.",
  },
];

const PASSOS = [
  {
    titulo: "Escolha o seu endereço",
    texto:
      "Escreva o nome do negócio. Se o endereço estiver livre, ele passa a ser seu.",
  },
  {
    titulo: "Responda o essencial",
    texto:
      "O que o cliente precisa saber antes de chamar você: o que você vende, por quanto, quando atende e por onde falam com você.",
  },
  {
    titulo: "Publique e compartilhe",
    texto:
      "O endereço fica pronto para colar na bio, no anúncio, no cartão e em toda conversa que termina com alguém pedindo o seu contato.",
  },
];

export default async function Home() {
  /*
   * O mosaico mostra as peças de um negócio só, com profundidade. O ateliê
   * serve melhor que os outros aí: tem preço, tem galeria cheia e é o caso
   * que o produto existe para atender.
   */
  const negocio = (await porSlug("atelie-trama")) ?? atelie;

  /* Quatro no carrossel. O quinto ninguém chega a ver. */
  const naAbertura = VITRINE.slice(0, 4).map((v) => v.negocio);

  /*
   * O campo de endereço fica na abertura em qualquer situação: é ele que
   * transforma visita em intenção, porque a pessoa vê o próprio nome no
   * endereço e passa a querer aquele endereço. Enquanto o cadastro não abre,
   * muda o rótulo do botão e a tela seguinte diz o que acontece, em vez de
   * prometer uma criação que ainda não existe.
   */
  const rotulo = MODO_VITRINE ? "Continuar" : "Criar meu endereço";

  return (
    <div data-tema="areia" className="min-h-dvh bg-fundo">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Marca href={null} />
        {MODO_VITRINE ? null : (
          <Link
            href="/entrar"
            className="text-[0.95rem] font-medium text-texto underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        )}
      </header>

      <main>
        {/* O produto aparece junto com a promessa, não depois dela. */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-6 pb-20 sm:pt-14">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-20">
            <div className="max-w-xl">
              <h1 className="text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.038em] text-balance text-texto sm:text-[3.4rem]">
                <span className="block text-destaque">Presença profissional.</span>
                O endereço do seu negócio na internet.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-suave">
                O seu trabalho numa página só: as fotos, o que você vende, o
                horário e o caminho para falar com você. Com o seu nome no
                endereço, e escrita para aparecer na busca de quem procura o
                seu serviço na cidade.
              </p>

              {/*
                Uma linha de comando antes do campo. Sem ela o campo fica
                parecendo caixa de busca, e a pessoa lê tudo de novo tentando
                entender o que digitar ali.
              */}
              <div className="mt-9 max-w-lg">
                <p className="mb-3 text-[1.05rem] font-semibold tracking-[-0.015em] text-texto">
                  Comece agora: escolha o seu endereço.
                </p>
                <CampoAbertura rotulo={rotulo} />
              </div>
            </div>

            <div className="lg:pl-4">
              <Carrossel mostrarSeta={false}>
                {naAbertura.map((n, i) => (
                  <Telefone key={n.slug} negocio={n} prioridade={i === 0} leve />
                ))}
              </Carrossel>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="mosaico"
          className="border-t border-borda bg-superficie"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <h2
              id="mosaico"
              className="max-w-2xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Tudo o que o seu negócio precisa mostrar.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-suave">
              A mesma página serve ofícios bem diferentes. Troque de exemplo e
              veja o que muda.
            </p>

            <div className="mt-10 sm:mt-12">
              <CarrosselExemplos />
            </div>

            <div className="mt-16 sm:mt-20">
              <Mosaico
                negocio={negocio}
                paraCatalogo={massas}
                paraBotoes={atelie}
                paraGaleria={doceria}
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="exemplos" className="border-t border-borda">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <h2
              id="exemplos"
              className="max-w-xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Confira exemplos de verdade.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-suave">
              Todas estas estão no ar. Abra a que mais parece com o seu e
              percorra até o fim.
            </p>

            <div className="mt-12">
              <Vitrine />
            </div>
          </div>
        </section>

        {/*
          Editorial: o título fica preso na coluna da esquerda enquanto a lista
          corre na direita. É o desenho de revista, e serve a um propósito
          prático: o "o que muda" continua à vista enquanto a pessoa lê os
          cinco itens, então cada um se lê como resposta à pergunta do título.
        */}
        <section
          aria-labelledby="beneficios"
          className="border-t border-borda bg-superficie"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <div className="lg:grid lg:grid-cols-[20rem_1fr] lg:gap-16">
              <div className="lg:sticky lg:top-16 lg:self-start">
                <h2
                  id="beneficios"
                  className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
                >
                  O que muda quando o endereço é seu.
                </h2>
                <p className="mt-4 max-w-sm leading-relaxed text-suave">
                  Cinco coisas que só aparecem depois de publicar.
                </p>
              </div>

              <dl className="mt-12 lg:mt-0">
                {BENEFICIOS.map((b, i) => (
                  <div
                    key={b.titulo}
                    className="surge grid gap-2 border-t border-borda py-7 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[2.5rem_1fr] sm:gap-6 lg:py-8"
                  >
                    <dt className="text-[0.95rem] font-semibold tabular-nums text-destaque sm:pt-1">
                      {String(i + 1).padStart(2, "0")}
                    </dt>
                    <dd>
                      <h3 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-balance text-texto">
                        {b.titulo}
                      </h3>
                      <p className="mt-2 max-w-xl leading-relaxed text-suave text-pretty">
                        {b.texto}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section aria-labelledby="passos" className="border-t border-borda">
          <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-24">
            <h2
              id="passos"
              className="max-w-lg text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-texto sm:text-4xl"
            >
              Do nome ao endereço no ar, em três passos.
            </h2>

            {/*
              Numeral grande em Barro, fio em cima, texto embaixo. O número
              carrega a ordem sozinho, então o rótulo "passo 1" some e sobra
              espaço para o que interessa.
            */}
            <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="surge border-t border-borda pt-6">
                  <span
                    className="titulo block text-[2.6rem] leading-none text-destaque tabular-nums"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-balance text-texto">
                    {passo.titulo}
                  </h3>
                  <p className="mt-2 leading-relaxed text-suave text-pretty">
                    {passo.texto}
                  </p>
                </li>
              ))}
            </ol>

            {/* O mesmo campo da abertura, ao alcance de quem leu até aqui. */}
            <div className="mt-16 max-w-lg">
              <p className="mb-3 text-[1.05rem] font-semibold tracking-[-0.015em] text-texto">
                Comece agora: escolha o seu endereço.
              </p>
              <CampoAbertura rotulo={rotulo} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-borda">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-suave">
          <p>{NOME_PRODUTO}, presença profissional para o negócio local.</p>
          {MODO_VITRINE ? null : (
            <Link href="/entrar" className="underline underline-offset-2">
              Entrar
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
