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

/*
 * As medidas são as dos arquivos em public/exemplo, não um número redondo
 * qualquer: o next/image usa isso para reservar o espaço antes da imagem
 * chegar, e errar aqui é layout pulando na cara de quem abre.
 */
function foto(arquivo: string, alt: string, lado = 800): Foto {
  return { url: `/exemplo/${arquivo}`, alt, largura: lado, altura: lado };
}

function capa(arquivo: string, alt: string): Foto {
  return { url: `/exemplo/${arquivo}`, alt, largura: 1200, altura: 675 };
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
  acaoPrincipal: null,
  acaoSecundaria: null,
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
  nome: "Café Alecrim",
  frase: "Confeitaria e café. Bolos, tortas e salgados feitos na hora.",
  logo: foto("logo.jpg", "Logotipo do Café Alecrim", 512),
  capa: capa("capa.jpg", "Salão do Café Alecrim com mesas junto à janela"),
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
  acaoSecundaria: {
    tipo: "link" as const,
    rotulo: "Pedir pelo iFood",
    url: "https://www.ifood.com.br/",
    icone: "ifood" as const,
  },
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
      "cheesecake",
      "Cheesecake de frutas vermelhas",
      "Base de biscoito amanteigado e calda feita com a fruta da estação.",
      7400,
      [
        foto("bolo-2.jpg", "Fatia de cheesecake com calda de frutas vermelhas"),
        foto("bolo-1.jpg", "Fatia servida no prato, vista de perto"),
      ],
    ),
    item(
      "bolo-chocolate",
      "Bolo de chocolate",
      "Massa úmida e ganache meio amargo. Fatia ou inteiro, por encomenda.",
      6800,
      [
        foto("bolo-3.jpg", "Fatia de bolo de chocolate com ganache"),
        foto("galeria-7.jpg", "Chocolate meio amargo servido no prato"),
      ],
    ),
    item(
      "torta-maca",
      "Torta de maçã",
      "Massa trançada na mão, canela e maçã em fatias finas.",
      7200,
      [foto("torta-1.jpg", "Torta de maçã inteira com massa trançada")],
    ),
    item(
      "crumble",
      "Crumble de frutas vermelhas",
      "Farofa crocante por cima, servido morno.",
      6400,
      [foto("torta-2.jpg", "Crumble de frutas vermelhas visto de cima")],
    ),
    item(
      "morango-chocolate",
      "Morango com chocolate, caixa com 12",
      "Morango fresco coberto de chocolate belga. Encomenda com um dia.",
      4200,
      [foto("brigadeiro-1.jpg", "Morangos cobertos de chocolate")],
    ),
    item(
      "pao-de-queijo",
      "Pão de queijo, porção com 12",
      "Assados na hora, das sete às onze da manhã.",
      2800,
      [foto("pao-1.jpg", "Pães de queijo dourados recém assados")],
    ),
    // Sem preço de propósito: a linha do preço some, não vira "sob consulta".
    item("cookies", "Cookies da casa", "Sabores da semana, por encomenda.", null, [
      foto("pote-1.jpg", "Cookies com gotas de chocolate na tigela"),
    ]),
  ],
  galeria: [
    foto("galeria-1.jpg", "Balcão com os bolos do dia"),
    foto("galeria-2.jpg", "Xícara de café com desenho na espuma"),
    foto("galeria-3.jpg", "Salão do café visto do fundo"),
    foto("galeria-4.jpg", "Plantas na prateleira do salão"),
    foto("galeria-5.jpg", "Macarons coloridos empilhados"),
    foto("galeria-6.jpg", "Bolo de andares decorado com morangos"),
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
  fonte: "moderno",
  // Exemplo no plano pago: escolhe a letra e não leva o rodapé.
  plano: "pago" as const,
  acaoPrincipal: {
    tipo: "link" as const,
    rotulo: "Agendar aula experimental",
    url: "https://exemplo.com.br/agenda",
    icone: "agenda" as const,
  },
  acaoSecundaria: {
    tipo: "whatsapp" as const,
    rotulo: "Tirar dúvida no WhatsApp",
    url: null,
    icone: "link" as const,
  },
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
      [foto("raiz-1.jpg", "Aluna em postura de yoga ao fim da tarde")],
    ),
    item("plano-2x", "Plano 2 vezes por semana", "Turmas de até seis alunos.", 32000, [
      foto("raiz-2.jpg", "Aluna em alongamento sobre o tatame"),
    ]),
    item("plano-3x", "Plano 3 vezes por semana", "Turmas de até seis alunos.", 42000, [
      foto("raiz-3.jpg", "Aluna sentada em meditação"),
    ]),
    item(
      "individual",
      "Pilates individual",
      "Atendimento exclusivo, com avaliação postural na primeira sessão.",
      18000,
      [foto("raiz-g2.jpg", "Aluna em postura de alongamento profundo")],
    ),
  ],
  galeria: [
    foto("raiz-g1.jpg", "Aluna com os braços abertos ao fim da prática"),
    foto("raiz-g2.jpg", "Aluna em postura de alongamento na beira do mar"),
    foto("raiz-g3.jpg", "Pedras empilhadas no canto da sala"),
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
  capa: capa("nutri-capa.jpg", "Prato equilibrado montado sobre a mesa"),
  fonte: "moderno",
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
      [foto("nutri-1.jpg", "Salada de folhas com pão integral")],
    ),
    item("retorno", "Retorno", "Trinta minutos, para ajuste do plano.", 20000, [
      foto("nutri-2.jpg", "Legumes e frutas frescas espalhados na mesa")],
    ),
    item(
      "online",
      "Consulta online",
      "Mesmo formato da presencial, por videochamada.",
      30000,
      [foto("nutri-3.jpg", "Abacate cortado ao meio")],
    ),
  ],
  galeria: [
    foto("nutri-g1.jpg", "Tigela de frutas vermelhas e iogurte"),
    foto("nutri-g2.jpg", "Banca de legumes e verduras da feira"),
    foto("nutri-g3.jpg", "Kiwi e hortelã sobre fundo claro"),
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
  capa: capa("psi-capa.jpg", "Sala de atendimento com estante e poltronas"),
  fonte: "moderno",
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
      [foto("psi-1.jpg", "Poltrona de leitura no canto da sala")],
    ),
    item("casal", "Terapia de casal", "Sessões quinzenais de uma hora.", 35000, [
      foto("psi-2.jpg", "Sofá da sala de atendimento")],
    ),
    item(
      "orientacao",
      "Orientação de pais",
      "Encontros pontuais para dúvidas sobre desenvolvimento infantil.",
      null,
      [foto("psi-3.jpg", "Planta sobre a mesa junto à janela")],
    ),
  ],
  galeria: [
    foto("psi-g1.jpg", "Sala clara com janela ampla"),
    foto("psi-g2.jpg", "Planta na recepção"),
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
