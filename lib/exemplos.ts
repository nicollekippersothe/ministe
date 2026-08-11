import type { Foto, Item, Negocio } from "./tipos";

/**
 * Negócios fictícios, para o exemplo e para a tela inicial.
 *
 * São quatro tipos bem diferentes de propósito: comércio com produto, estúdio
 * com plano mensal, e dois profissionais autônomos que vendem hora e não
 * produto. Serve para conferir que a página funciona sem cardápio, sem preço
 * e sem endereço fixo.
 *
 * Os telefones são obviamente falsos (sequências repetidas). Trocar antes de
 * mostrar qualquer uma destas páginas para alguém de fora.
 */

function foto(arquivo: string, alt: string, lado = 1000): Foto {
  return { url: `/exemplo/${arquivo}`, alt, largura: lado, altura: lado };
}

function capa(arquivo: string, alt: string): Foto {
  return { url: `/exemplo/${arquivo}`, alt, largura: 1600, altura: 900 };
}

function item(
  id: string,
  titulo: string,
  descricao: string | null,
  precoCentavos: number | null,
  fotos: Foto[],
): Item {
  return { id, titulo, descricao, precoCentavos, fotos, ativo: true };
}

const base = {
  slugAnterior: null,
  tema: "areia" as const,
  plano: "gratuito" as const,
  publicado: true,
  telefone: null,
  fuso: "America/Sao_Paulo",
  mensagemItem: "Olá! Gostaria de saber sobre: {item}",
};

// ---------------------------------------------------------------------------

export const doceria: Negocio = {
  ...base,
  slug: "demo",
  nome: "Cantinho da Rô",
  frase: "Bolos, tortas e salgados feitos na hora, na Vila Mariana.",
  logo: foto("logo.jpg", "Logotipo do Cantinho da Rô", 512),
  capa: capa("capa.jpg", "Fachada do Cantinho da Rô"),
  fonte: "moderno",
  whatsapp: "5511999999999",
  mensagemPadrao: "Olá! Vim pelo site e gostaria de fazer um pedido.",
  endereco: "Rua das Palmeiras, 214, Vila Mariana",
  cidade: "São Paulo",
  estado: "SP",
  cep: "04113-000",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+das+Palmeiras+214+Vila+Mariana+Sao+Paulo",
  mostrarPrecos: true,
  tituloCatalogo: "Cardápio",
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
    item(
      "bolo-cenoura",
      "Bolo de cenoura com brigadeiro",
      "Massa fofa e cobertura generosa de brigadeiro. Serve 12 pessoas.",
      6800,
      [
        foto("bolo-1.jpg", "Bolo de cenoura inteiro com cobertura de brigadeiro"),
        foto("bolo-2.jpg", "Fatia do bolo de cenoura vista de perto"),
        foto("bolo-3.jpg", "Bolo de cenoura na caixa de transporte"),
      ],
    ),
    item(
      "torta-limao",
      "Torta de limão",
      "Base crocante, creme cítrico e merengue maçaricado na hora.",
      7400,
      [
        foto("torta-1.jpg", "Torta de limão inteira com merengue dourado"),
        foto("torta-2.jpg", "Fatia da torta de limão no prato"),
      ],
    ),
    item(
      "coxinha",
      "Coxinha de frango com catupiry, cento",
      "Massa leve e recheio cremoso. Entregues congeladas, prontas para fritar.",
      9500,
      [foto("coxinha-1.jpg", "Bandeja de coxinhas de frango")],
    ),
    item(
      "brigadeiro",
      "Brigadeiro gourmet, caixa com 12",
      "Sabores: tradicional, pistache, maracujá e leite ninho.",
      4200,
      [
        foto("brigadeiro-1.jpg", "Brigadeiros gourmet variados"),
        foto("brigadeiro-2.jpg", "Caixa de brigadeiros fechada com laço"),
      ],
    ),
    // Sem preço de propósito: a linha do preço some, não vira "sob consulta".
    item("bolo-no-pote", "Bolo no pote", "Sabores da semana, por encomenda.", null, [
      foto("pote-1.jpg", "Bolo no pote com camadas de creme"),
    ]),
  ],
  galeria: [
    foto("galeria-1.jpg", "Vitrine da loja com os doces do dia"),
    foto("galeria-2.jpg", "Espaço do café com duas mesas"),
    foto("galeria-3.jpg", "Fachada vista da calçada"),
    foto("galeria-4.jpg", "Detalhe da decoração da loja"),
    foto("galeria-5.jpg", "Caixas de entrega prontas no balcão"),
    foto("galeria-6.jpg", "Bolos recém saídos do forno"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    { id: "ifood", rotulo: "Pedir pelo iFood", url: "https://www.ifood.com.br/", icone: "ifood" },
    {
      id: "maps",
      rotulo: "Como chegar",
      url: "https://www.google.com/maps/search/?api=1&query=Rua+das+Palmeiras+214+Vila+Mariana+Sao+Paulo",
      icone: "mapa",
    },
  ],
};

// ---------------------------------------------------------------------------

export const estudio: Negocio = {
  ...base,
  slug: "studio-raiz",
  nome: "Studio Raiz",
  frase: "Yoga e pilates em turmas de até seis alunos, em Florianópolis.",
  logo: foto("raiz-logo.jpg", "Logotipo do Studio Raiz", 512),
  capa: capa("raiz-capa.jpg", "Sala de prática do Studio Raiz"),
  fonte: "editorial",
  whatsapp: "5548988887777",
  mensagemPadrao: "Olá! Gostaria de agendar uma aula experimental.",
  endereco: "Rua Bocaiúva, 1120, Centro",
  cidade: "Florianópolis",
  estado: "SC",
  cep: "88015-530",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua+Bocaiuva+1120+Florianopolis",
  mostrarPrecos: true,
  tituloCatalogo: "Aulas e planos",
  horarios: [
    { dia: 1, abre: "07:00", fecha: "11:00" },
    { dia: 1, abre: "17:00", fecha: "21:00" },
    { dia: 2, abre: "07:00", fecha: "11:00" },
    { dia: 2, abre: "17:00", fecha: "21:00" },
    { dia: 3, abre: "07:00", fecha: "11:00" },
    { dia: 3, abre: "17:00", fecha: "21:00" },
    { dia: 4, abre: "07:00", fecha: "11:00" },
    { dia: 4, abre: "17:00", fecha: "21:00" },
    { dia: 5, abre: "07:00", fecha: "11:00" },
    { dia: 6, abre: "08:00", fecha: "12:00" },
  ],
  itens: [
    item(
      "experimental",
      "Aula experimental",
      "Uma aula para conhecer o método e o espaço, sem compromisso.",
      0,
      [foto("raiz-1.jpg", "Aluna em posição de yoga na sala de prática")],
    ),
    item("plano-2x", "Plano 2 vezes por semana", "Turmas de até seis alunos.", 32000, [
      foto("raiz-2.jpg", "Aparelhos de pilates alinhados na sala"),
    ]),
    item("plano-3x", "Plano 3 vezes por semana", "Turmas de até seis alunos.", 42000, [
      foto("raiz-3.jpg", "Detalhe da sala com plantas e luz natural"),
    ]),
    item(
      "individual",
      "Pilates individual",
      "Atendimento exclusivo, com avaliação postural na primeira sessão.",
      18000,
      [foto("raiz-g2.jpg", "Aparelho de pilates individual")],
    ),
  ],
  galeria: [
    foto("raiz-g1.jpg", "Recepção do estúdio"),
    foto("raiz-g2.jpg", "Sala de aparelhos"),
    foto("raiz-g3.jpg", "Sala de prática com tatames"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    {
      id: "maps",
      rotulo: "Como chegar",
      url: "https://www.google.com/maps/search/?api=1&query=Rua+Bocaiuva+1120+Florianopolis",
      icone: "mapa",
    },
  ],
};

// ---------------------------------------------------------------------------

export const nutricao: Negocio = {
  ...base,
  slug: "marina-nutricao",
  nome: "Marina Alcântara",
  frase: "Nutrição clínica e esportiva. Atendimento presencial e online.",
  logo: foto("nutri-logo.jpg", "Logotipo de Marina Alcântara", 512),
  capa: capa("nutri-capa.jpg", "Consultório de nutrição"),
  fonte: "direto",
  whatsapp: "5541988886666",
  mensagemPadrao: "Olá! Gostaria de agendar uma consulta.",
  endereco: "Avenida Sete de Setembro, 3400, sala 12, Batel",
  cidade: "Curitiba",
  estado: "PR",
  cep: "80230-010",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Avenida+Sete+de+Setembro+3400+Curitiba",
  mostrarPrecos: true,
  tituloCatalogo: "Atendimentos",
  horarios: [
    { dia: 1, abre: "08:00", fecha: "12:00" },
    { dia: 1, abre: "13:30", fecha: "18:00" },
    { dia: 2, abre: "08:00", fecha: "12:00" },
    { dia: 2, abre: "13:30", fecha: "18:00" },
    { dia: 3, abre: "08:00", fecha: "12:00" },
    { dia: 4, abre: "08:00", fecha: "12:00" },
    { dia: 4, abre: "13:30", fecha: "18:00" },
    { dia: 5, abre: "08:00", fecha: "12:00" },
  ],
  itens: [
    item(
      "primeira",
      "Primeira consulta",
      "Uma hora, com avaliação e plano alimentar entregue em até três dias.",
      35000,
      [foto("nutri-1.jpg", "Prato montado com porções equilibradas")],
    ),
    item("retorno", "Retorno", "Trinta minutos, para ajuste do plano.", 20000, [
      foto("nutri-2.jpg", "Detalhe de alimentos frescos sobre a mesa")],
    ),
    item(
      "online",
      "Consulta online",
      "Mesmo formato da presencial, por videochamada.",
      30000,
      [foto("nutri-3.jpg", "Marmitas organizadas para a semana")],
    ),
  ],
  galeria: [
    foto("nutri-g1.jpg", "Consultório visto da porta"),
    foto("nutri-g2.jpg", "Mesa de atendimento"),
    foto("nutri-g3.jpg", "Detalhe da bancada"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    { id: "site", rotulo: "Artigos e receitas", url: "https://exemplo.com.br/", icone: "site" },
  ],
};

// ---------------------------------------------------------------------------

export const psicologia: Negocio = {
  ...base,
  slug: "camila-psicologia",
  nome: "Camila Reis",
  frase: "Psicologia clínica, abordagem cognitivo comportamental. CRP 08/12345.",
  logo: foto("psi-logo.jpg", "Logotipo de Camila Reis", 512),
  capa: capa("psi-capa.jpg", "Consultório de psicologia"),
  fonte: "marcante",
  whatsapp: "5511977775555",
  mensagemPadrao: "Olá! Gostaria de informações sobre atendimento.",
  endereco: null,
  cidade: "São Paulo",
  estado: "SP",
  cep: null,
  mapsUrl: null,
  // Preço fora do ar de propósito: muita gente não quer valor público.
  mostrarPrecos: false,
  tituloCatalogo: "Atendimentos",
  horarios: [
    { dia: 1, abre: "09:00", fecha: "19:00" },
    { dia: 2, abre: "09:00", fecha: "19:00" },
    { dia: 3, abre: "09:00", fecha: "19:00" },
    { dia: 4, abre: "09:00", fecha: "19:00" },
    { dia: 5, abre: "09:00", fecha: "15:00" },
  ],
  itens: [
    item(
      "individual",
      "Terapia individual",
      "Sessões semanais de cinquenta minutos, presencial ou online.",
      25000,
      [foto("psi-1.jpg", "Poltronas do consultório")],
    ),
    item("casal", "Terapia de casal", "Sessões quinzenais de uma hora.", 35000, [
      foto("psi-2.jpg", "Detalhe do consultório com plantas")],
    ),
    item(
      "orientacao",
      "Orientação de pais",
      "Encontros pontuais para dúvidas sobre desenvolvimento infantil.",
      null,
      [foto("psi-3.jpg", "Cantinho de leitura do consultório")],
    ),
  ],
  galeria: [
    foto("psi-g1.jpg", "Sala de atendimento"),
    foto("psi-g2.jpg", "Recepção"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
  ],
};

export const EXEMPLOS: Negocio[] = [doceria, estudio, nutricao, psicologia];

/** Como cada exemplo é apresentado na tela inicial. */
export const VITRINE = [
  { negocio: doceria, tipo: "Doceria" },
  { negocio: estudio, tipo: "Estúdio de yoga" },
  { negocio: nutricao, tipo: "Nutricionista" },
  { negocio: psicologia, tipo: "Psicóloga" },
];
