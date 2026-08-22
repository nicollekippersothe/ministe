import type { Foto, Item, Negocio } from "./tipos";

/**
 * Negócios fictícios, para o exemplo e para a tela inicial.
 *
 * São o portfólio do produto, e por isso o único lugar do projeto onde o
 * conteúdo é inventado de propósito.
 *
 * Seis dos sete são gente que vende o próprio trabalho e assina com o próprio
 * nome: massoterapeuta, psicóloga, astróloga, tatuador, ilustradora e
 * professora de canto. É quem sai do Instagram com uma lista de links e
 * precisa de um lugar para expor o trabalho. O sétimo é uma confeitaria, que
 * fica para provar que loja com balcão, cardápio e iFood continua cabendo
 * inteira aqui.
 *
 * Cada um mostra uma forma diferente que a página assume: galeria na frente,
 * catálogo com preço à vista, preço guardado, muitos links, página enxuta,
 * botão principal apontado para a agenda. A ordem das seções sai da categoria
 * (ver lib/categorias.ts), então o conteúdo de cada um segue a receita do ramo
 * dele em vez de contrariá-la.
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

/*
 * A página que abre em /demo, e a primeira da lista, que é a que o painel
 * edita enquanto o login não existe.
 *
 * É a mais completa das sete de propósito: tem catálogo com preço à vista,
 * galeria, semana inteira de horário, endereço com mapa, links e dois botões
 * no rodapé. Quem chega em /demo para decidir se assina precisa ver a página
 * inteira funcionando, e não um pedaço dela.
 */
export const massagem: Negocio = {
  ...base,
  slug: "demo",
  categoria: "estetica",
  nome: "Helena Vasques",
  frase: "Massoterapia e drenagem, com hora marcada, na Savassi.",
  logo: foto("spa-logo.jpg", "Retrato de Helena Vasques", 400),
  capa: capa("spa-capa.jpg", "Mãos massageando o ombro durante a sessão"),
  fonte: "moderno",
  whatsapp: "5531988886666",
  mensagemPadrao: "Olá! Vim pela página e gostaria de marcar uma sessão.",
  mensagemItem: "Olá! Gostaria de marcar: {item}",
  endereco: "Rua Antônio de Albuquerque, 720, sala 43, Savassi",
  cidade: "Belo Horizonte",
  estado: "MG",
  cep: "30112-010",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+Antonio+de+Albuquerque+720+Savassi+Belo+Horizonte",
  mostrarPrecos: true,
  tituloCatalogo: "Sessões",
  acaoSecundaria: {
    tipo: "link" as const,
    rotulo: "Ver horários livres",
    url: "https://exemplo.com.br/agenda",
    icone: "agenda" as const,
  },
  horarios: [
    { dia: 1, abre: "09:00", fecha: "13:00" },
    { dia: 1, abre: "14:30", fecha: "19:00" },
    { dia: 2, abre: "09:00", fecha: "13:00" },
    { dia: 2, abre: "14:30", fecha: "19:00" },
    { dia: 3, abre: "09:00", fecha: "13:00" },
    { dia: 3, abre: "14:30", fecha: "19:00" },
    { dia: 4, abre: "09:00", fecha: "13:00" },
    { dia: 4, abre: "14:30", fecha: "19:00" },
    { dia: 5, abre: "09:00", fecha: "13:00" },
    { dia: 5, abre: "14:30", fecha: "19:00" },
    { dia: 6, abre: "09:00", fecha: "13:00" },
  ],
  itens: [
    // Duas fotos de propósito: é o item que mostra o carrossel do catálogo.
    item(
      "relaxante",
      "Massagem relaxante, 60 minutos",
      "Óleo morno de amêndoa, pressão média e música baixa. Para quem chega do trabalho com o ombro travado.",
      18000,
      [
        foto("spa-1.jpg", "Cliente deitada na maca durante a massagem nas costas"),
        foto("spa-2.jpg", "Mãos apoiadas no ombro, no fim da manobra"),
      ],
    ),
    item(
      "drenagem",
      "Drenagem linfática, 60 minutos",
      "Manobras lentas de perna e abdome, para retenção de líquido e pós operatório liberado pelo médico.",
      17000,
      [foto("spa-3.jpg", "Cliente deitada na maca, com velas acesas ao fundo")],
    ),
    item(
      "miofascial",
      "Liberação miofascial, 50 minutos",
      "Trabalho ponto a ponto em pescoço, ombro e lombar, com alongamento no fim.",
      19000,
      [foto("spa-4.jpg", "Massagem na cabeça e na nuca")],
    ),
    item(
      "pedras",
      "Pedras quentes, 80 minutos",
      "Basalto aquecido em água, apoiado ao longo da coluna e das pernas.",
      24000,
      [foto("spa-5.jpg", "Pedras de basalto ao lado das toalhas enroladas")],
    ),
    item(
      "pacote",
      "Pacote com 4 sessões",
      "Vale por dois meses, com o mesmo horário reservado toda semana.",
      64000,
      [],
    ),
    // Sem preço de propósito: a linha do preço some, não vira "sob consulta".
    item(
      "avaliacao",
      "Avaliação inicial, 30 minutos",
      "Conversa sobre a queixa, a rotina e o que cada sessão vai atender.",
      null,
      [],
    ),
  ],
  galeria: [
    foto("spa-g1.jpg", "Toalhas dobradas sobre o banco da sala"),
    foto("spa-g2.jpg", "Óleo essencial e flores sobre a mesa"),
    foto("spa-g3.jpg", "Pedras, flores e sabonete prontos para a sessão"),
    foto("spa-g4.jpg", "Orquídea branca ao lado das pedras"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    {
      id: "agenda",
      rotulo: "Agenda online",
      url: "https://exemplo.com.br/agenda",
      icone: "agenda",
    },
    {
      id: "maps",
      rotulo: "Como chegar",
      url: "https://www.google.com/maps/search/?api=1&query=Rua+Antonio+de+Albuquerque+720+Savassi+Belo+Horizonte",
      icone: "mapa",
    },
  ],
};

// ---------------------------------------------------------------------------

/*
 * A página enxuta: sem endereço, sem mapa, um link só e o preço guardado.
 *
 * Serve para conferir que a página continua de pé com pouca coisa preenchida,
 * que é como a maioria começa.
 */
export const psicologia: Negocio = {
  ...base,
  slug: "camila-reis",
  categoria: "psicologia",
  nome: "Camila Reis",
  frase: "Psicologia clínica, abordagem cognitivo comportamental. CRP 06/12345.",
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
      "Sessões semanais de cinquenta minutos, presencial ou por chamada.",
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
 * A página de quem tem muito link.
 *
 * É a que mais se parece com o que a pessoa tem hoje numa lista de links, e a
 * diferença fica à vista: aqui os links vêm depois do trabalho, e não no lugar
 * dele.
 *
 * A categoria é "consultoria" porque é a que descreve serviço profissional
 * atendido por hora, que é o que uma leitura de mapa é. Astrologia tem
 * categoria própria em lugar nenhum da lista, e pendurar isto na família da
 * saúde faria a marcação dizer ao buscador uma coisa que não é.
 */
export const astrologia: Negocio = {
  ...base,
  slug: "nara-bittencourt",
  categoria: "consultoria",
  nome: "Nara Bittencourt",
  frase: "Astrologia natal e leitura de trânsitos, por chamada, com o áudio da sessão gravado.",
  logo: foto("astro-logo.jpg", "Retrato de Nara Bittencourt", 400),
  capa: capa("astro-capa.jpg", "Céu estrelado sobre o horizonte"),
  fonte: "moderno",
  whatsapp: "5571988882222",
  mensagemPadrao: "Olá! Vim pela página e gostaria de saber sobre uma leitura.",
  mensagemItem: "Olá! Queria marcar: {item}",
  // Atende por chamada, de casa. Endereço fora do ar é o caso comum aqui.
  endereco: null,
  cidade: "Salvador",
  estado: "BA",
  cep: null,
  mapsUrl: null,
  mostrarPrecos: false,
  tituloCatalogo: "Leituras",
  horarios: [
    { dia: 2, abre: "14:00", fecha: "21:00" },
    { dia: 3, abre: "14:00", fecha: "21:00" },
    { dia: 4, abre: "14:00", fecha: "21:00" },
    { dia: 5, abre: "14:00", fecha: "21:00" },
    { dia: 6, abre: "09:00", fecha: "13:00" },
  ],
  itens: [
    item(
      "mapa-astral",
      "Mapa astral completo",
      "Noventa minutos por chamada, com o mapa em PDF e o áudio da conversa para ouvir depois.",
      null,
      [foto("astro-1.jpg", "Céu estrelado em tons de rosa e roxo")],
    ),
    item(
      "revolucao-solar",
      "Revolução solar",
      "O ano que começa no seu aniversário, lido mês a mês, com as datas que pedem atenção.",
      null,
      [foto("astro-2.jpg", "Lua vista de perto, com as crateras à mostra")],
    ),
    item(
      "sinastria",
      "Sinastria, dois mapas lado a lado",
      "Para casal ou dupla de trabalho. Uma sessão de duas horas, com as duas pessoas na chamada.",
      null,
      [foto("astro-3.jpg", "Duas velas acesas sobre a mesa escura")],
    ),
    item(
      "mapa-crianca",
      "Mapa da criança, conversa com os pais",
      "Leitura voltada ao temperamento e ao jeito de aprender, entregue em uma hora.",
      null,
      [foto("astro-4.jpg", "Céu estrelado acima da linha das árvores")],
    ),
  ],
  galeria: [
    foto("astro-g1.jpg", "Rastro das estrelas em longa exposição"),
    foto("astro-g2.jpg", "Esfera de cristal com a paisagem invertida dentro"),
    foto("astro-g3.jpg", "Lua cheia alaranjada acima das árvores"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    {
      id: "agenda",
      rotulo: "Agenda e valores",
      url: "https://exemplo.com.br/agenda",
      icone: "agenda",
    },
    {
      id: "boletim",
      rotulo: "Boletim dos trânsitos do mês",
      url: "https://exemplo.com.br/boletim",
      icone: "site",
    },
    {
      id: "curso",
      rotulo: "Curso de astrologia para começar",
      url: "https://exemplo.com.br/curso",
      icone: "site",
    },
    {
      id: "podcast",
      rotulo: "Podcast Céu do Mês",
      url: "https://exemplo.com.br/podcast",
      icone: "link",
    },
  ],
};

// ---------------------------------------------------------------------------

/*
 * Trabalho autoral, em que a galeria é o produto e não um complemento. A
 * categoria "tatuagem" abre a página pela galeria e guarda o preço, então o
 * conteúdo aqui segue isso: fotos em quantidade, e orçamento por conversa.
 *
 * Um dos dois exemplos no plano pago: escolhe a letra e não leva o rodapé.
 */
export const tatuagem: Negocio = {
  ...base,
  slug: "teo-sarmento",
  categoria: "tatuagem",
  nome: "Téo Sarmento",
  frase: "Tatuagem autoral em traço fino e blackwork. Estúdio na Vila Madalena.",
  logo: foto("tatu-logo.jpg", "Retrato de Téo Sarmento", 400),
  capa: capa("tatu-capa.jpg", "Máquina de tatuar trabalhando na pele"),
  fonte: "moderno",
  plano: "pago" as const,
  whatsapp: "5511988883333",
  mensagemPadrao: "Olá! Vim pela página e queria falar sobre uma tatuagem.",
  mensagemItem: "Olá! Queria um orçamento para: {item}",
  endereco: "Rua Harmonia, 560, Vila Madalena",
  cidade: "São Paulo",
  estado: "SP",
  cep: "05435-000",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+Harmonia+560+Vila+Madalena+Sao+Paulo",
  // Preço fora do ar de propósito: peça se orça por tamanho e por pele.
  mostrarPrecos: false,
  tituloCatalogo: "Trabalhos",
  acaoSecundaria: {
    tipo: "link" as const,
    rotulo: "Ver os flashes disponíveis",
    url: "https://exemplo.com.br/flashes",
    icone: "site" as const,
  },
  horarios: [
    { dia: 2, abre: "12:00", fecha: "20:00" },
    { dia: 3, abre: "12:00", fecha: "20:00" },
    { dia: 4, abre: "12:00", fecha: "20:00" },
    { dia: 5, abre: "12:00", fecha: "20:00" },
    { dia: 6, abre: "11:00", fecha: "18:00" },
  ],
  itens: [
    item(
      "fineline",
      "Traço fino, peça pequena",
      "Até oito centímetros, fechada em uma sessão de duas horas.",
      null,
      [foto("tatu-1.jpg", "Mãos tatuadas em traço fino")],
    ),
    item(
      "blackwork",
      "Blackwork autoral",
      "Desenho criado para você a partir de uma conversa, feito em sessões de quatro horas.",
      null,
      [foto("tatu-2.jpg", "Peça preta fechada no braço")],
    ),
    item(
      "cobertura",
      "Cobertura de tatuagem antiga",
      "Estudo do desenho que já está na pele, com decalque provado antes da agulha.",
      null,
      [foto("tatu-3.jpg", "Antebraço fechado com tatuagem colorida")],
    ),
    item(
      "flash-day",
      "Flash day",
      "Um sábado por mês, com peças prontas do catálogo e hora marcada por ordem de chegada.",
      null,
      [foto("tatu-4.jpg", "Desenhos de mandala nas duas mãos")],
    ),
  ],
  galeria: [
    foto("tatu-g1.jpg", "Sessão em andamento, com luva e máquina"),
    foto("tatu-g2.jpg", "Duas mãos, uma delas tatuada no pulso"),
    foto("tatu-g3.jpg", "Pernas tatuadas, ao ar livre"),
    foto("tatu-g4.jpg", "Braço tatuado apoiado na parede"),
    foto("tatu-g5.jpg", "Braço com letras tatuadas, em luz quente"),
    foto("tatu-g6.jpg", "Tatuagem escura, em preto e branco"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    {
      id: "flashes",
      rotulo: "Catálogo de flashes",
      url: "https://exemplo.com.br/flashes",
      icone: "site",
    },
    {
      id: "cuidados",
      rotulo: "Cuidados depois da sessão",
      url: "https://exemplo.com.br/cuidados",
      icone: "site",
    },
  ],
};

// ---------------------------------------------------------------------------

/*
 * Ilustração e identidade visual. Também abre pela galeria, pela mesma razão
 * da tatuagem: o trabalho é a imagem, e a lista de serviços faz sentido depois
 * de a pessoa gostar do que viu.
 *
 * É o exemplo que a tela de preços usa para mostrar a diferença entre os dois
 * planos, então ele precisa ter capa, galeria, catálogo e links preenchidos.
 */
export const ilustracao: Negocio = {
  ...base,
  slug: "lia-prado",
  categoria: "design",
  nome: "Lia Prado",
  frase: "Ilustração autoral e identidade visual para negócio pequeno.",
  logo: foto("ilustra-logo.jpg", "Retrato de Lia Prado", 400),
  capa: capa("ilustra-capa.jpg", "Caderno aberto com pincéis e tintas sobre a mesa"),
  fonte: "moderno",
  whatsapp: "5541988885555",
  mensagemPadrao: "Olá! Vim pela página e queria falar sobre um trabalho.",
  mensagemItem: "Olá! Queria um orçamento para: {item}",
  // Trabalha em casa, e o endereço fica fora por escolha dela.
  endereco: null,
  cidade: "Curitiba",
  estado: "PR",
  cep: null,
  mapsUrl: null,
  mostrarPrecos: false,
  tituloCatalogo: "Serviços",
  acaoSecundaria: {
    tipo: "link" as const,
    rotulo: "Ver a loja de prints",
    url: "https://exemplo.com.br/loja",
    icone: "loja" as const,
  },
  horarios: [
    { dia: 1, abre: "09:00", fecha: "18:00" },
    { dia: 2, abre: "09:00", fecha: "18:00" },
    { dia: 3, abre: "09:00", fecha: "18:00" },
    { dia: 4, abre: "09:00", fecha: "18:00" },
    { dia: 5, abre: "09:00", fecha: "16:00" },
  ],
  itens: [
    item(
      "retrato",
      "Retrato ilustrado",
      "Uma pessoa, um casal ou a família inteira, em arquivo para imprimir até A3.",
      null,
      [foto("ilustra-1.jpg", "Mão desenhando a caneta sobre o papel")],
    ),
    item(
      "identidade",
      "Identidade visual enxuta",
      "Marca, paleta e três aplicações, entregues em duas semanas.",
      null,
      [foto("ilustra-2.jpg", "Estudo de letras desenhado à mão")],
    ),
    item(
      "livro",
      "Ilustração para livro infantil",
      "Capa e miolo, orçados por número de páginas e prazo de gráfica.",
      null,
      [foto("ilustra-3.jpg", "Ilustração de flores em aquarela, em andamento")],
    ),
    item(
      "posts",
      "Série de posts ilustrados",
      "Quatro peças por mês, no formato da sua rede, com os arquivos abertos.",
      null,
      [foto("ilustra-4.jpg", "Ilustração colorida ao lado do celular")],
    ),
  ],
  galeria: [
    foto("ilustra-g1.jpg", "Paleta de aquarela com as cores misturadas"),
    foto("ilustra-g2.jpg", "Bancada de trabalho com os materiais à mão"),
    foto("ilustra-g3.jpg", "Caixa de aquarela aberta, com as pastilhas gastas"),
    foto("ilustra-g4.jpg", "Impressões emolduradas na parede"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    { id: "loja", rotulo: "Loja de prints", url: "https://exemplo.com.br/loja", icone: "loja" },
    {
      id: "portfolio",
      rotulo: "Portfólio completo",
      url: "https://exemplo.com.br/portfolio",
      icone: "site",
    },
  ],
};

// ---------------------------------------------------------------------------

/*
 * Aula particular, com o botão principal apontado para a agenda em vez do
 * WhatsApp. O WhatsApp desce para segundo botão e continua ali.
 *
 * O outro exemplo no plano pago.
 */
export const canto: Negocio = {
  ...base,
  slug: "bia-marconi",
  categoria: "aulas",
  nome: "Bia Marconi",
  frase: "Aulas de canto e preparação vocal, no estúdio do Bom Fim ou por chamada.",
  logo: foto("canto-logo.jpg", "Retrato de Bia Marconi", 400),
  capa: capa("canto-capa.jpg", "Microfone de estúdio montado para a aula"),
  fonte: "moderno",
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
  whatsapp: "5551988887777",
  mensagemPadrao: "Olá! Gostaria de agendar uma aula experimental.",
  mensagemItem: "Olá! Queria saber sobre: {item}",
  endereco: "Rua Fernandes Vieira, 480, sala 2, Bom Fim",
  cidade: "Porto Alegre",
  estado: "RS",
  cep: "90035-091",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+Fernandes+Vieira+480+Bom+Fim+Porto+Alegre",
  mostrarPrecos: true,
  tituloCatalogo: "Aulas",
  horarios: [
    { dia: 1, abre: "14:00", fecha: "21:00" },
    { dia: 2, abre: "14:00", fecha: "21:00" },
    { dia: 3, abre: "14:00", fecha: "21:00" },
    { dia: 4, abre: "14:00", fecha: "21:00" },
    { dia: 5, abre: "14:00", fecha: "19:00" },
    { dia: 6, abre: "09:00", fecha: "13:00" },
  ],
  itens: [
    item(
      "avulsa",
      "Aula avulsa, 50 minutos",
      "Técnica, repertório e a gravação da aula para estudar durante a semana.",
      13000,
      [foto("canto-1.jpg", "Aluna cantando ao microfone no estúdio")],
    ),
    item(
      "mensal",
      "Pacote com 4 aulas no mês",
      "Mesmo dia e mesma hora toda semana, com plano de estudo escrito.",
      46000,
      [foto("canto-2.jpg", "Partitura aberta sobre o piano")],
    ),
    item(
      "audicao",
      "Preparação para audição ou show",
      "Duas aulas na semana do compromisso, com o repertório inteiro ensaiado.",
      32000,
      [foto("canto-3.jpg", "Cantora ensaiando com o microfone na mão")],
    ),
    item(
      "dupla",
      "Aula em dupla",
      "Para quem canta junto, com harmonia vocal a duas vozes. Valor por pessoa.",
      9000,
      [foto("canto-4.jpg", "Aluna cantando acompanhada do violão")],
    ),
    item(
      "online",
      "Aula por chamada de vídeo",
      "Mesmo formato da presencial, com o áudio ajustado antes de começar.",
      12000,
      [],
    ),
  ],
  galeria: [
    foto("canto-g1.jpg", "Microfone dourado no pedestal"),
    foto("canto-g2.jpg", "Mesa de som usada nas gravações"),
    foto("canto-g3.jpg", "Ensaio sob a luz colorida do palco"),
  ],
  links: [
    { id: "insta", rotulo: "Instagram", url: "https://instagram.com/", icone: "instagram" },
    {
      id: "maps",
      rotulo: "Como chegar",
      url: "https://www.google.com/maps/search/?api=1&query=Rua+Fernandes+Vieira+480+Bom+Fim+Porto+Alegre",
      icone: "mapa",
    },
  ],
};

// ---------------------------------------------------------------------------

/*
 * O único exemplo de comida, e ele fica.
 *
 * Loja com balcão, cardápio com preço à vista, endereço na rua e um segundo
 * botão apontado para o iFood: é a prova de que o produto continua servindo
 * para quem vende produto, e não só para quem vende hora.
 */
export const doceria: Negocio = {
  ...base,
  slug: "alecrim-confeitaria",
  categoria: "confeitaria",
  nome: "Alecrim Confeitaria",
  frase: "Bolos, tortas e docinhos feitos no dia. Balcão e encomendas.",
  logo: foto("logo.jpg", "Logotipo da Alecrim Confeitaria", 512),
  capa: capa("capa.jpg", "Salão da confeitaria com mesas junto à janela"),
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
    foto("galeria-3.jpg", "Salão visto do fundo"),
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

/*
 * Nomes antigos de exportação.
 *
 * `app/precos` e os testes de lib/ importam por eles, e esses arquivos ficam
 * fora desta mudança. São o mesmo objeto do const acima, com o nome que o
 * conteúdo pede.
 */
export const atelie = ilustracao;
export const estudio = canto;

/**
 * A ordem importa: a primeira é a página que o painel edita enquanto o login
 * não existe, e é ela que responde em /demo.
 */
export const EXEMPLOS: Negocio[] = [
  massagem,
  psicologia,
  astrologia,
  tatuagem,
  ilustracao,
  canto,
  doceria,
];

/**
 * Como cada exemplo é apresentado na tela inicial.
 *
 * A ordem não é por acaso: os primeiros são quem vende o próprio trabalho e
 * hoje só tem uma lista de links, que é para quem o produto existe. Quem chega
 * precisa bater o olho e pensar "é para mim" antes de ler qualquer texto. A
 * confeitaria fecha a fila, mostrando que loja também cabe.
 */
export const VITRINE = [
  { negocio: tatuagem, tipo: "Tatuador" },
  { negocio: ilustracao, tipo: "Ilustradora" },
  { negocio: astrologia, tipo: "Astróloga" },
  { negocio: massagem, tipo: "Massoterapeuta" },
  { negocio: psicologia, tipo: "Psicóloga" },
  { negocio: canto, tipo: "Professora de canto" },
  { negocio: doceria, tipo: "Confeitaria" },
];
