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
  categoria: null as string | null,
  categoriaLivre: null as string | null,
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
  categoria: "confeitaria",
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
  categoria: "yoga-pilates",
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
  categoria: "nutricao",
  nome: "Marina Alcântara",
  frase: "Nutrição clínica e esportiva. Atendimento presencial e online.",
  logo: foto("nutri-logo.jpg", "Retrato de Marina Alcântara", 400),
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
  categoria: "psicologia",
  nome: "Camila Reis",
  frase: "Psicologia clínica, abordagem cognitivo comportamental. CRP 08/12345.",
  logo: foto("psi-logo.jpg", "Retrato de Camila Reis", 400),
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

// ---------------------------------------------------------------------------

/*
 * Peça feita à mão, vendida por encomenda.
 *
 * Este é o caso que o produto existe para atender: alguém boa no que faz,
 * sem site, com o trabalho todo dentro de uma rede social. A galeria pesa
 * mais que o catálogo aqui, porque a peça se vende pela foto.
 */
export const atelie: Negocio = {
  ...base,
  slug: "atelie-trama",
  categoria: "artesanato",
  nome: "Ateliê Trama",
  frase: "Peças de crochê e tricô feitas à mão, sob encomenda.",
  logo: foto("trama-logo.jpg", "Logotipo do Ateliê Trama", 512),
  capa: capa("trama-capa.jpg", "Manta de tricô sobre a mesa de trabalho"),
  fonte: "moderno",
  whatsapp: "5531988884444",
  mensagemPadrao: "Olá! Gostaria de encomendar uma peça.",
  mensagemItem: "Olá! Queria saber sobre a peça: {item}",
  // Sem endereço de propósito: quem produz em casa quase nunca quer o
  // endereço público, e a página precisa funcionar sem ele.
  endereco: null,
  cidade: "Belo Horizonte",
  estado: "MG",
  cep: null,
  mapsUrl: null,
  mostrarPrecos: true,
  tituloCatalogo: "Peças",
  horarios: [
    { dia: 1, abre: "09:00", fecha: "18:00" },
    { dia: 2, abre: "09:00", fecha: "18:00" },
    { dia: 3, abre: "09:00", fecha: "18:00" },
    { dia: 4, abre: "09:00", fecha: "18:00" },
    { dia: 5, abre: "09:00", fecha: "16:00" },
  ],
  itens: [
    item(
      "manta",
      "Manta de tricô",
      "Lã merino, 1,40 por 1,80. Escolha a cor na encomenda. Pronta em três semanas.",
      42000,
      [foto("trama-1.jpg", "Manta de tricô em ponto trançado")],
    ),
    item(
      "gorro",
      "Gorro de lã",
      "Tamanho único, com barra dobrada. Sete cores disponíveis.",
      9500,
      [foto("trama-2.jpg", "Gorro de lã sendo usado")],
    ),
    item(
      "toalha",
      "Toalha de crochê",
      "Barbante encerado, feita em ponto alto. Medida sob encomenda.",
      18000,
      [foto("trama-3.jpg", "Toalha de crochê em azul")],
    ),
  ],
  galeria: [
    foto("trama-g1.jpg", "Novelo de lã na cesta de trabalho"),
    foto("trama-g2.jpg", "Peça em acabamento sobre a bancada"),
    foto("trama-g3.jpg", "Novelos separados por cor"),
    foto("trama-g4.jpg", "Ponto trançado visto de perto"),
    foto("trama-g5.jpg", "Trabalho em andamento no bastidor"),
    foto("trama-g6.jpg", "Peça pronta embalada para entrega"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    { id: "loja", rotulo: "Loja completa", url: "https://exemplo.com.br/loja", icone: "site" },
    {
      id: "encomenda",
      rotulo: "Como funciona a encomenda",
      url: "https://exemplo.com.br/encomenda",
      icone: "site",
    },
  ],
};

// ---------------------------------------------------------------------------

/*
 * Produção caseira com retirada marcada. O horário aqui não é de loja aberta,
 * é de janela de retirada, e a página trata os dois do mesmo jeito.
 */
export const massas: Negocio = {
  ...base,
  slug: "aurora-massas",
  categoria: "comida-caseira",
  nome: "Aurora Massas",
  frase: "Massa fresca feita no dia, por encomenda. Retirada às quintas e sábados.",
  logo: foto("aurora-logo.jpg", "Logotipo da Aurora Massas", 512),
  capa: capa("aurora-capa.jpg", "Massa fresca saindo do cilindro"),
  fonte: "moderno",
  whatsapp: "5551988883333",
  mensagemPadrao: "Olá! Gostaria de fazer uma encomenda para a próxima retirada.",
  mensagemItem: "Olá! Quero encomendar: {item}",
  endereco: "Rua Fernandes Vieira, 480, Bom Fim",
  cidade: "Porto Alegre",
  estado: "RS",
  cep: "90035-091",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+Fernandes+Vieira+480+Bom+Fim+Porto+Alegre",
  mostrarPrecos: true,
  tituloCatalogo: "Massas da semana",
  horarios: [
    { dia: 4, abre: "10:00", fecha: "19:00" },
    { dia: 6, abre: "09:00", fecha: "14:00" },
  ],
  itens: [
    item(
      "ravioli",
      "Ravioli de ricota e espinafre",
      "Bandeja com 500 g, rende duas porções. Massa fina, recheio feito no dia.",
      4800,
      [foto("aurora-1.jpg", "Ravioli recheado antes de cozinhar")],
    ),
    item(
      "talharim",
      "Talharim fresco",
      "Sêmola e ovo caipira, cortado na hora. Bandeja com 500 g.",
      3600,
      [foto("aurora-2.jpg", "Talharim sendo cortado na máquina")],
    ),
    item(
      "nhoque",
      "Nhoque de batata",
      "Batata asada e pouca farinha. Bandeja com 700 g.",
      3900,
      [foto("aurora-3.jpg", "Nhoque de batata polvilhado com farinha")],
    ),
    item(
      "molho",
      "Molho de tomate da casa",
      "Tomate italiano cozido devagar, sem conservante. Pote de 400 g.",
      2400,
      [foto("aurora-4.jpg", "Molho de tomate servido sobre a massa")],
    ),
  ],
  galeria: [
    foto("aurora-g1.jpg", "Prato de massa montado com legumes"),
    foto("aurora-g2.jpg", "Massa sendo sovada na bancada"),
    foto("aurora-g3.jpg", "Ovo quebrado sobre a farinha"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
  ],
};

// ---------------------------------------------------------------------------

/*
 * Trabalho autoral, em que a galeria é o produto e não um complemento. É o
 * exemplo que prova a leitura de galeria da entrais: aqui as fotos vêm antes
 * do catálogo, e o preço fica fora porque orçamento de ensaio é conversa.
 */
export const fotografia: Negocio = {
  ...base,
  slug: "rafael-nunes",
  categoria: "fotografia",
  nome: "Rafael Nunes",
  frase: "Fotografia de retrato e casamento. Recife e região.",
  logo: foto("foto-logo.jpg", "Retrato de Rafael Nunes", 400),
  capa: capa("foto-capa.jpg", "Retrato feito com luz natural"),
  fonte: "moderno",
  plano: "pago" as const,
  whatsapp: "5581988882222",
  mensagemPadrao: "Olá! Gostaria de saber sobre disponibilidade e orçamento.",
  mensagemItem: "Olá! Queria um orçamento para: {item}",
  endereco: null,
  cidade: "Recife",
  estado: "PE",
  cep: null,
  mapsUrl: null,
  // Preço fora do ar de propósito: ensaio se orça por data e por escopo.
  mostrarPrecos: false,
  tituloCatalogo: "Ensaios",
  acaoSecundaria: {
    tipo: "link" as const,
    rotulo: "Ver o portfólio completo",
    url: "https://exemplo.com.br/portfolio",
    icone: "site" as const,
  },
  horarios: [
    { dia: 1, abre: "09:00", fecha: "18:00" },
    { dia: 2, abre: "09:00", fecha: "18:00" },
    { dia: 3, abre: "09:00", fecha: "18:00" },
    { dia: 4, abre: "09:00", fecha: "18:00" },
    { dia: 5, abre: "09:00", fecha: "18:00" },
  ],
  itens: [
    item(
      "casal",
      "Ensaio de casal",
      "Duas horas em locação aberta, com trinta fotos tratadas.",
      null,
      [foto("foto-1.jpg", "Casal abraçado em ensaio ao ar livre")],
    ),
    item(
      "retrato",
      "Retrato individual",
      "Uma hora em estúdio ou em locação, com quinze fotos tratadas.",
      null,
      [foto("foto-2.jpg", "Retrato individual com luz de janela")],
    ),
    item(
      "evento",
      "Cobertura de evento",
      "Casamento, formatura ou festa. Orçamento por data e por duração.",
      null,
      [foto("foto-3.jpg", "Fotógrafo trabalhando durante um evento")],
    ),
  ],
  galeria: [
    foto("foto-g1.jpg", "Casal ao pôr do sol"),
    foto("foto-g2.jpg", "Retrato de perfil em luz baixa"),
    foto("foto-g3.jpg", "Fotógrafo em locação externa"),
    foto("foto-g4.jpg", "Silhueta contra o fim de tarde"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    { id: "site", rotulo: "Portfólio completo", url: "https://exemplo.com.br/", icone: "site" },
  ],
};

export const EXEMPLOS: Negocio[] = [
  doceria,
  estudio,
  nutricao,
  psicologia,
  atelie,
  massas,
  fotografia,
];

/**
 * Como cada exemplo é apresentado na tela inicial.
 *
 * A ordem não é por acaso: os três primeiros são quem o produto existe para
 * atender, alguém que faz bem e não tem onde mostrar. Quem chega precisa bater
 * o olho e pensar "é para mim" antes de ler qualquer texto.
 *
 * O `resolve` é o que a página faz por aquele tipo de negócio, e cada frase
 * fala só do que está mesmo na página do exemplo: preço só onde
 * `mostrarPrecos` está ligado, mapa só onde existe `mapsUrl`. Nenhuma cita
 * quantidade, para a frase continuar verdadeira quando alguém acrescentar uma
 * peça ao exemplo.
 */
export const VITRINE = [
  {
    negocio: atelie,
    tipo: "Crochê e tricô",
    resolve:
      "Trabalho feito à mão vive de foto: cada peça aparece com a própria imagem e o próprio preço, com o pedido saindo pelo WhatsApp ali mesmo.",
  },
  {
    negocio: fotografia,
    tipo: "Fotografia",
    resolve:
      "Quem vende ensaio mostra ensaio: cada um com as suas fotos, e o orçamento combinado na conversa.",
  },
  {
    negocio: massas,
    tipo: "Massa fresca",
    resolve:
      "Encomenda com dia certo: o cardápio da semana com preço, o horário de retirada e o endereço no mapa.",
  },
  {
    negocio: psicologia,
    tipo: "Psicóloga",
    resolve:
      "Hora marcada, com os tipos de sessão, o registro no conselho e o caminho para marcar a primeira.",
  },
  {
    negocio: estudio,
    tipo: "Estúdio de yoga",
    resolve:
      "Turma pequena pede horário à vista: as aulas, os planos com valor e o endereço da sala no mapa.",
  },
  {
    negocio: nutricao,
    tipo: "Nutricionista",
    resolve:
      "Presencial e online na mesma página, com os atendimentos, o valor de cada um e o consultório no mapa.",
  },
  {
    negocio: doceria,
    tipo: "Confeitaria",
    resolve:
      "Cardápio com foto e preço, o selo de aberto agora calculado na hora, e o pedido pelo WhatsApp.",
  },
];
