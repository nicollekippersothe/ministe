/**
 * Formato dos dados de um negocio.
 *
 * Isto espelha, de proposito, o schema que vai para o Supabase na etapa 2.
 * Enquanto o banco nao existe, os dados vem de lib/exemplo.ts.
 */

import type { ChaveFonte } from "./fontes";

export type Tema = "areia" | "noite" | "menta" | "cosmico" | "minimal";

/**
 * O acabamento da parede, separado do tema.
 *
 * O tema escolhe a cor; o acabamento escolhe a textura ou a luz, e os dois se
 * combinam livremente. `liso` é a parede chapada de sempre. Ver as regras
 * `[data-fundo=...]` em app/globals.css, e a Capa que veste o atributo.
 */
export type Fundo = "liso" | "papel" | "tinta" | "degrade" | "vinheta";

export type Plano = "gratuito" | "pago";

/** Um intervalo de funcionamento. Pode haver varios no mesmo dia. */
export type Intervalo = {
  /** 0 domingo, 6 sabado */
  dia: number;
  /** "09:00" */
  abre: string;
  /** "18:00". Se for menor ou igual a `abre`, entende-se que vira o dia. */
  fecha: string;
};

/**
 * O ponto da foto que precisa aparecer, em porcentagem da largura e da altura.
 *
 * A capa da pagina e 16 por 9 no celular e 64 por 15 no monitor, e a foto que a
 * pessoa manda quase nunca tem nenhuma das duas proporcoes. Com corte fixo no
 * centro, o rosto do topo e a peca da beirada saem de cena, e a dona da pagina
 * so descobre olhando a propria pagina.
 *
 * Dois numeros resolvem, e resolvem no CSS: viram `object-position`, que o
 * navegador aplica em qualquer proporcao de tela sem recorte, sem segunda copia
 * do arquivo e sem biblioteca. 50 e 50 e o centro, que e o que o navegador ja
 * faz sozinho, entao valor ausente continua valendo centro.
 */
export type Foco = {
  /** 0 na borda esquerda, 100 na direita. */
  x: number;
  /** 0 no topo, 100 na base. */
  y: number;
};

export type Foto = {
  url: string;
  /** Texto alternativo. Obrigatorio, porque acessibilidade e regra do projeto. */
  alt: string;
  largura: number;
  altura: number;
  /**
   * Opcional, e so a capa usa hoje. Ausente vale centro, que e o corte de
   * sempre: assim a coluna do banco pode chegar depois do codigo sem nenhuma
   * pagina mudar de aparencia enquanto ela nao chega.
   */
  foco?: Foco | null;
};

export type Item = {
  id: string;
  titulo: string;
  descricao: string | null;
  /** Em centavos, para nao usar ponto flutuante com dinheiro. */
  precoCentavos: number | null;
  fotos: Foto[];
  ativo: boolean;
};

export type IconeLink =
  | "instagram"
  | "mapa"
  | "ifood"
  | "site"
  | "link"
  | "telefone"
  | "agenda"
  | "cardapio"
  | "loja";

/**
 * O botao fixo no rodape da pagina.
 *
 * Nem todo negocio vende pelo WhatsApp. Restaurante manda pro iFood, estudio
 * manda pra agenda, quem vende por afiliado manda pra loja. Entao a acao
 * principal e configuravel, e o WhatsApp e so o padrao.
 */
export type TipoAcao = "whatsapp" | "link" | "telefone";

export type Acao = {
  tipo: TipoAcao;
  rotulo: string;
  /** So para tipo "link". Nos outros o destino vem do whatsapp ou do telefone. */
  url: string | null;
  icone: IconeLink;
};

export type LinkExtra = {
  id: string;
  rotulo: string;
  url: string;
  icone: IconeLink;
};

export type Negocio = {
  slug: string;
  /** Endereço antigo, para o link de antes continuar funcionando. */
  slugAnterior: string | null;
  nome: string;
  frase: string | null;
  logo: Foto | null;
  capa: Foto | null;
  tema: Tema;
  /** Acabamento da parede, combinado com o tema. Ver o tipo Fundo. */
  fundo: Fundo;
  /** Combinação de fontes da página pública. Ver lib/fontes.ts. */
  fonte: ChaveFonte;

  /**
   * O ramo, escolhido no cadastro. Ver lib/categorias.ts.
   *
   * Faz duas coisas: vira o tipo do schema.org no JSON-LD, e monta a página
   * antes de o dono preencher qualquer coisa. Nulo quando a pessoa escolheu
   * "outro" ou quando o negócio foi criado antes de a categoria existir, e aí
   * vale a receita padrão.
   */
  categoria: string | null;
  /**
   * O que a pessoa escreveu ao escolher "outro". Entra na descrição e nunca
   * muda a montagem, porque só dá para montar o que a gente conhece.
   */
  categoriaLivre: string | null;
  plano: Plano;
  publicado: boolean;

  /**
   * Ate duas acoes no rodape fixo. A primeira aparece cheia, a segunda
   * contornada. Nulo na principal significa: usar o WhatsApp, se houver.
   */
  acaoPrincipal: Acao | null;
  acaoSecundaria: Acao | null;

  /** Somente digitos, com pais e DDD: 5511999999999 */
  whatsapp: string | null;
  mensagemPadrao: string | null;
  /** Telefone fixo ou comercial, se for diferente do WhatsApp. Entra no JSON-LD. */
  telefone: string | null;

  /** Endereco de exibicao, do jeito que o dono escreveria. */
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  mapsUrl: string | null;

  /** Identificador IANA. Padrao America/Sao_Paulo (horario de Brasilia). */
  fuso: string;

  /** Chave unica do catalogo: esconde o preco de todos os itens de uma vez. */
  mostrarPrecos: boolean;
  /**
   * Como a secao do catalogo se chama na pagina. Nem todo negocio tem
   * cardapio: estudio tem aulas, psicologa tem atendimentos, loja tem catalogo.
   */
  tituloCatalogo: string;
  /**
   * Modelo aplicado a todos os itens do catalogo de uma vez. O {item} vira o
   * titulo do produto. Se for nulo, o item nao ganha botao proprio.
   */
  mensagemItem: string | null;

  horarios: Intervalo[];
  itens: Item[];
  /** Galeria da marca, separada do catalogo. */
  galeria: Foto[];
  links: LinkExtra[];
};
