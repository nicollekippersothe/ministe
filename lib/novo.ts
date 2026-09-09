// A extensão explícita permite que o teste rode direto no Node, que não
// resolve extensão sozinho. O Next aceita das duas formas.
import { receitaDe } from "./categorias.ts";
import type { Negocio } from "./tipos";

/**
 * Como uma página nova nasce.
 *
 * Fica separado da camada de dados de propósito: montar é decisão de produto,
 * gravar é detalhe de onde os dados moram. Assim o teste confere a montagem
 * sem tocar em disco, e a troca do arquivo local pelo Supabase passa longe
 * daqui.
 *
 * Cada campo está escrito, um por um. A versão anterior copiava o negócio de
 * exemplo e sobrescrevia o que lembrava, e o que ficava de fora vinha junto: a
 * página nova de uma psicóloga nascia com "Cardápio" na seção do catálogo,
 * porque o exemplo é uma confeitaria. Campo novo no tipo agora aparece como
 * erro de compilação aqui, que é onde precisa aparecer.
 *
 * O que a receita decide (nome da seção do catálogo, preço à vista ou
 * guardado) fica gravado no negócio, e não lido da tabela a cada visita: o
 * dono muda no painel e a mudança dele vale, mesmo que a receita da categoria
 * mude depois. A receita é o ponto de partida, e o valor do dono é o que manda.
 */
export function montar(
  slug: string,
  nome: string,
  categoria: string | null = null,
  categoriaLivre: string | null = null,
): Negocio {
  const receita = receitaDe(categoria);
  return {
    slug,
    nome,
    categoria,
    categoriaLivre,
    tituloCatalogo: receita.tituloCatalogo,
    mostrarPrecos: receita.mostrarPrecos,
    slugAnterior: null,
    frase: null,
    logo: null,
    capa: null,
    tema: "areia",
    fundo: "liso",
    fonte: "moderno",
    plano: "gratuito",
    publicado: false,
    acaoPrincipal: null,
    acaoSecundaria: null,
    whatsapp: null,
    mensagemPadrao: null,
    mensagemItem: null,
    telefone: null,
    endereco: null,
    cidade: null,
    estado: null,
    cep: null,
    mapsUrl: null,
    fuso: "America/Sao_Paulo",
    horarios: [],
    itens: [],
    galeria: [],
    links: [],
  };
}
