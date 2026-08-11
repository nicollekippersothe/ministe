/**
 * Formato dos dados de um negocio.
 *
 * Isto espelha, de proposito, o schema que vai para o Supabase na etapa 2.
 * Enquanto o banco nao existe, os dados vem de lib/exemplo.ts.
 */

import type { ChaveFonte } from "./fontes";

export type Tema = "areia" | "noite" | "menta";

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

export type Foto = {
  url: string;
  /** Texto alternativo. Obrigatorio, porque acessibilidade e regra do projeto. */
  alt: string;
  largura: number;
  altura: number;
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

export type IconeLink = "instagram" | "mapa" | "ifood" | "site" | "link";

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
  /** Combinação de fontes da página pública. Ver lib/fontes.ts. */
  fonte: ChaveFonte;
  plano: Plano;
  publicado: boolean;

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
