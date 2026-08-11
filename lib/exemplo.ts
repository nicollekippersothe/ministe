import type { Foto, Negocio } from "./tipos";

/**
 * Negocio ficticio, so para a etapa 1.
 *
 * Na etapa 3 isto sai e a pagina passa a ler do Supabase pelo slug. Fica na
 * rota /demo, que e um slug reservado, para nunca colidir com cliente de verdade.
 *
 * O telefone e um numero obviamente falso (todos 9). Trocar antes de mostrar
 * a pagina para qualquer pessoa de fora.
 */

function foto(arquivo: string, alt: string, lado = 1000): Foto {
  return { url: `/exemplo/${arquivo}`, alt, largura: lado, altura: lado };
}

export const negocioExemplo: Negocio = {
  slug: "demo",
  slugAnterior: null,
  nome: "Cantinho da Rô",
  frase: "Bolos, tortas e salgados feitos na hora, no coração da Vila Mariana.",
  logo: foto("logo.jpg", "Logo do Cantinho da Rô", 512),
  capa: {
    url: "/exemplo/capa.jpg",
    alt: "Fachada do Cantinho da Rô",
    largura: 1600,
    altura: 900,
  },
  tema: "areia",
  fonte: "editorial",
  plano: "gratuito",
  publicado: true,

  whatsapp: "5511999999999",
  mensagemPadrao: "Oi! Vim pelo site e queria fazer um pedido.",
  telefone: null,

  endereco: "Rua das Palmeiras, 214, Vila Mariana",
  cidade: "São Paulo",
  estado: "SP",
  cep: "04113-000",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua+das+Palmeiras+214+Vila+Mariana+Sao+Paulo",

  fuso: "America/Sao_Paulo",
  mostrarPrecos: true,
  mensagemItem: "Oi! Queria saber sobre: {item}",

  // Terça a quinta corrido, sexta com um turno da noite que vira o dia,
  // sábado com pausa para o almoço. Domingo e segunda fechado.
  horarios: [
    { dia: 2, abre: "09:00", fecha: "18:00" },
    { dia: 3, abre: "09:00", fecha: "18:00" },
    { dia: 4, abre: "09:00", fecha: "18:00" },
    { dia: 5, abre: "09:00", fecha: "18:00" },
    { dia: 5, abre: "19:00", fecha: "00:30" },
    { dia: 6, abre: "09:00", fecha: "13:00" },
    { dia: 6, abre: "15:00", fecha: "19:00" },
  ],

  itens: [
    {
      id: "bolo-cenoura",
      titulo: "Bolo de cenoura com brigadeiro",
      descricao: "Massa fofinha e cobertura generosa de brigadeiro. Serve 12 pessoas.",
      precoCentavos: 6800,
      ativo: true,
      fotos: [
        foto("bolo-1.jpg", "Bolo de cenoura inteiro, com cobertura de brigadeiro"),
        foto("bolo-2.jpg", "Fatia do bolo de cenoura vista de perto"),
        foto("bolo-3.jpg", "Bolo de cenoura na caixa de transporte"),
      ],
    },
    {
      id: "torta-limao",
      titulo: "Torta de limão",
      descricao: "Base crocante, creme cítrico e merengue maçaricado na hora.",
      precoCentavos: 7400,
      ativo: true,
      fotos: [
        foto("torta-1.jpg", "Torta de limão inteira com merengue dourado"),
        foto("torta-2.jpg", "Fatia da torta de limão no prato"),
      ],
    },
    {
      id: "coxinha",
      titulo: "Coxinha de frango com catupiry, cento",
      descricao: "Massa leve e recheio cremoso. Vão congeladas, prontas para fritar.",
      precoCentavos: 9500,
      ativo: true,
      fotos: [foto("coxinha-1.jpg", "Bandeja de coxinhas de frango")],
    },
    {
      id: "brigadeiro",
      titulo: "Brigadeiro gourmet, caixa com 12",
      descricao: "Sabores: tradicional, pistache, maracujá e leite ninho.",
      precoCentavos: 4200,
      ativo: true,
      fotos: [
        foto("brigadeiro-1.jpg", "Brigadeiros gourmet variados"),
        foto("brigadeiro-2.jpg", "Caixa de brigadeiros fechada com laço"),
      ],
    },
    {
      // Item sem preco de proposito: a linha do preco some, nao vira "sob consulta".
      id: "bolo-no-pote",
      titulo: "Bolo no pote",
      descricao: "Sabores da semana, feitos por encomenda.",
      precoCentavos: null,
      ativo: true,
      fotos: [foto("pote-1.jpg", "Bolo no pote com camadas de creme")],
    },
  ],

  galeria: [
    foto("galeria-1.jpg", "Vitrine da loja com os doces do dia"),
    foto("galeria-2.jpg", "Cantinho do café com duas mesas"),
    foto("galeria-3.jpg", "Fachada vista da calçada"),
    foto("galeria-4.jpg", "Detalhe da decoração da loja"),
    foto("galeria-5.jpg", "Caixas de entrega prontas no balcão"),
    foto("galeria-6.jpg", "Bolos recém saídos do forno"),
  ],

  links: [
    {
      id: "insta",
      rotulo: "Instagram",
      url: "https://instagram.com/",
      icone: "instagram",
    },
    {
      id: "ifood",
      rotulo: "Peça pelo iFood",
      url: "https://www.ifood.com.br/",
      icone: "ifood",
    },
    {
      id: "maps",
      rotulo: "Como chegar",
      url: "https://www.google.com/maps/search/?api=1&query=Rua+das+Palmeiras+214+Vila+Mariana+Sao+Paulo",
      icone: "mapa",
    },
  ],
};
