import {
  Bricolage_Grotesque,
  Fraunces,
  Gloock,
  Instrument_Serif,
  Inter,
  Inter_Tight,
} from "next/font/google";

/**
 * Combinações de fonte da página pública.
 *
 * O dono escolhe uma no painel. Só a escolhida é baixada pelo visitante:
 * as outras nem entram no HTML da página. Ver o teste em fontes.test.ts, que
 * confere isso no HTML gerado, porque é fácil quebrar sem perceber.
 *
 * O painel e a tela inicial não usam nada disto. Eles usam a fonte do próprio
 * aparelho, que no iPhone é a San Francisco. Custa zero byte e parece nativo.
 */

/**
 * Nenhuma fonte é pré-carregada, de propósito.
 *
 * O Next pré-carrega toda fonte declarada num módulo que a rota alcança, e o
 * pré-carregamento vaza para as rotas vizinhas que dividem o mesmo CSS. Na
 * prática, o painel e a tela inicial baixavam uma fonte que nem usam, e a
 * página pública baixava as cinco combinações em vez de uma.
 *
 * Sem pré-carregamento, o navegador busca só o que o CSS realmente aplica.
 * O texto aparece na fonte do aparelho e troca quando a da marca chega, que é
 * o que display: swap faz. Como o maior elemento da página é a foto de capa,
 * e não o texto, isso não atrapalha a medida de carregamento.
 *
 * Há um teste em testes/fluxo.mjs contando os arquivos baixados por rota.
 */
const corpo = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--f-corpo",
});

/**
 * As fontes de título ficam sem pré-carregamento de propósito.
 *
 * O Next pré-carrega toda fonte declarada num módulo que a rota importa, e
 * como as cinco combinações moram neste arquivo, a página baixava as cinco.
 * Sem o pré-carregamento, o navegador busca só a que o CSS realmente usa,
 * que é a combinação escolhida pelo dono. O teste em fontes.test.ts confere.
 */
// O carregador do Next só aceita objeto escrito na mão, sem espalhamento.
const instrument = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--f-titulo",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "700",
  variable: "--f-titulo",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "700",
  variable: "--f-titulo",
});

const gloock = Gloock({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--f-titulo",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "700",
  variable: "--f-titulo",
});

export type ChaveFonte =
  | "editorial"
  | "artesanal"
  | "moderno"
  | "marcante"
  | "direto";

export type Combinacao = {
  chave: ChaveFonte;
  nome: string;
  descricao: string;
  /** Aplicado na raiz da página pública. */
  classe: string;
};

export const COMBINACOES: Record<ChaveFonte, Combinacao> = {
  editorial: {
    chave: "editorial",
    nome: "Editorial",
    descricao: "Serifada fina e elegante. Boa para doceria, salão e estúdio.",
    classe: `${instrument.variable} ${corpo.variable}`,
  },
  artesanal: {
    chave: "artesanal",
    nome: "Artesanal",
    descricao: "Serifada encorpada e acolhedora. Boa para padaria e comida caseira.",
    classe: `${fraunces.variable} ${corpo.variable}`,
  },
  moderno: {
    chave: "moderno",
    nome: "Moderno",
    descricao: "Sem serifa, com personalidade. Boa para barbearia e petshop.",
    classe: `${bricolage.variable} ${corpo.variable}`,
  },
  marcante: {
    chave: "marcante",
    nome: "Marcante",
    descricao: "Serifada de contraste alto, chama atenção. Boa para tatuagem e moda.",
    classe: `${gloock.variable} ${corpo.variable}`,
  },
  direto: {
    chave: "direto",
    nome: "Direto",
    descricao: "Sem serifa, limpa e neutra. Boa para oficina, clínica e serviço.",
    classe: `${interTight.variable} ${corpo.variable}`,
  },
};

export const LISTA_COMBINACOES = Object.values(COMBINACOES);

/**
 * A letra das telas de entrada: cadastro, login, ajuda e denúncia.
 *
 * Elas usavam a fonte do aparelho de ponta a ponta, e o cadastro ficava com
 * cara de formulário de sistema: o título, as três perguntas e as opções da
 * lista tinham todos o mesmo desenho de letra, e a hierarquia sobrava toda
 * para o peso e o tamanho.
 *
 * Aqui entra a Gloock, que é a mesma da combinação "Marcante" da página
 * pública: serifada de contraste alto, com a haste fina ao lado da grossa. Ela
 * já vem no produto, então a escolha custa um arquivo que o projeto já
 * empacota, e nenhuma família nova.
 *
 * Vale só para o título e para o enunciado das perguntas. O corpo, os campos e
 * os botões continuam na letra do aparelho, que custa zero byte e é a que o
 * iPhone e o Android desenham melhor em texto miúdo. É a mesma divisão de
 * papel que a página pública faz entre `--f-titulo` e `--f-corpo`.
 *
 * Sem pré-carregamento, como todas as outras: o navegador busca o arquivo
 * quando o CSS aplica a família, e só nas rotas que vestem esta variável.
 */
export const LETRA_DE_ENTRADA = gloock.variable;

/**
 * A letra que todo mundo tem, inclusive no plano gratuito.
 *
 * Escolher outra é recurso do plano pago. A regra que guia a escolha desta:
 * a página gratuita precisa parecer profissional mesmo assim, senão ninguém
 * compartilha, e sem compartilhamento não existe aquisição.
 */
export const FONTE_PADRAO: ChaveFonte = "moderno";

export function podeEscolherFonte(plano: string): boolean {
  return plano === "pago";
}

export function combinacao(chave: string | null | undefined): Combinacao {
  return COMBINACOES[(chave ?? "") as ChaveFonte] ?? COMBINACOES.moderno;
}
