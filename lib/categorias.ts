/**
 * As categorias, e a receita de página que cada uma traz.
 *
 * A categoria não é etiqueta. Ela faz duas coisas que valem dinheiro:
 *
 * 1. Vira o tipo que o Google entende. LocalBusiness genérico diz pouco;
 *    Bakery, Dentist ou Florist dizem o suficiente para o buscador casar a
 *    página com "confeitaria perto de mim".
 *
 * 2. Monta a página antes de o dono preencher nada. Restaurante abre com
 *    cardápio e preço à vista. Psicóloga abre com atendimentos e preço
 *    guardado. Fotógrafo abre com a galeria antes do catálogo. É isso que faz
 *    o cadastro ser curto: a pessoa escolhe o que ela é, e o resto já vem
 *    respondido de um jeito que costuma servir.
 *
 * Toda receita é ponto de partida, nunca trava: o dono muda qualquer campo
 * depois, e a página do cliente lê o valor dele, não o da tabela.
 */

export type Receita = {
  /** Vai no @type do JSON-LD. Precisa existir no schema.org. */
  schema: string;
  /** Nome da seção do catálogo, que muda muito por ramo. */
  tituloCatalogo: string;
  /** Preço à vista por padrão. Hora de profissional quase nunca vai. */
  mostrarPrecos: boolean;
  /**
   * Galeria antes do catálogo. Vale para quem vende pelo olho: o trabalho é a
   * foto, e a lista de serviços vem depois de a pessoa gostar do que viu.
   */
  galeriaPrimeiro: boolean;
  /**
   * Se o endereço na rua costuma fazer sentido. Quem produz em casa e quem
   * atende online raramente quer o endereço público, e perguntar como se
   * fosse obrigatório faz a pessoa travar no cadastro.
   */
  endereco: "esperado" | "opcional";
};

export type Categoria = Receita & {
  id: string;
  nome: string;
  grupo: string;
  /**
   * Como a pessoa chama o que ela faz, que quase nunca é o nome da categoria.
   *
   * Ninguém digita "aulas particulares": digita "inglês", "violão", "reforço".
   * Ninguém digita "comida caseira": digita "marmita", "bolo de pote". Sem
   * isto a lista de trinta e três só funciona para quem já pensa nos termos
   * que nós escolhemos, e o resto rola a lista inteira e escolhe "outro".
   */
  busca: string[];
};

/** Usada quando a pessoa escolhe "outro" e escreve o ramo dela. */
export const RECEITA_PADRAO: Receita = {
  schema: "LocalBusiness",
  tituloCatalogo: "Catálogo",
  mostrarPrecos: true,
  galeriaPrimeiro: false,
  endereco: "opcional",
};

function cat(
  id: string,
  nome: string,
  grupo: string,
  busca: string[],
  receita: Partial<Receita> & { schema: string },
): Categoria {
  return { id, nome, grupo, busca, ...RECEITA_PADRAO, ...receita };
}

/** Sem acento, sem maiúscula, para comparar do jeito que a pessoa digita. */
function achatar(entrada: string): string {
  return entrada
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const CATEGORIAS: Categoria[] = [
  // --- Comida e bebida -----------------------------------------------------
  cat("restaurante", "Restaurante", "Comida e bebida", [
    "restaurante", "comida", "almoço", "jantar", "self service",
    "prato feito", "japonês", "pizzaria", "churrascaria"
  ], {
    schema: "Restaurant",
    tituloCatalogo: "Cardápio",
    endereco: "esperado",
  }),
  cat("lanchonete", "Lanchonete", "Comida e bebida", [
    "lanchonete", "lanche", "hambúrguer", "hamburgueria",
    "salgado", "pastel", "açaí", "sorvete"
  ], {
    schema: "FastFoodRestaurant",
    tituloCatalogo: "Cardápio",
    endereco: "esperado",
  }),
  cat("cafeteria", "Cafeteria", "Comida e bebida", ["cafeteria", "café", "brunch", "coffee"], {
    schema: "CafeOrCoffeeShop",
    tituloCatalogo: "Cardápio",
    endereco: "esperado",
  }),
  cat("confeitaria", "Confeitaria e doces", "Comida e bebida", [
    "confeitaria", "doceria", "bolo", "torta", "brigadeiro",
    "docinho", "cupcake", "padaria", "panificadora"
  ], {
    schema: "Bakery",
    tituloCatalogo: "Cardápio",
  }),
  // Quem cozinha em casa e vende por encomenda. Endereço opcional de
  // propósito: é a cozinha da pessoa.
  cat("comida-caseira", "Comida caseira e encomendas", "Comida e bebida", [
    "marmita", "comida caseira", "encomenda", "quentinha",
    "massa fresca", "bolo de pote", "congelado", "fit"
  ], {
    schema: "FoodEstablishment",
    tituloCatalogo: "Encomendas",
  }),
  cat("bar", "Bar", "Comida e bebida", ["bar", "boteco", "cervejaria", "pub", "choperia", "petiscaria"], {
    schema: "BarOrPub",
    tituloCatalogo: "Cardápio",
    endereco: "esperado",
  }),

  // --- Beleza --------------------------------------------------------------
  cat("salao", "Salão de beleza", "Beleza", [
    "salão", "cabeleireiro", "cabelo", "escova", "coloração",
    "progressiva", "penteado", "maquiagem"
  ], {
    schema: "BeautySalon",
    tituloCatalogo: "Serviços",
    endereco: "esperado",
  }),
  cat("barbearia", "Barbearia", "Beleza", ["barbearia", "barbeiro", "barba", "corte masculino", "navalha"], {
    schema: "HairSalon",
    tituloCatalogo: "Serviços",
    endereco: "esperado",
  }),
  cat("unhas", "Manicure e nail design", "Beleza", [
    "manicure", "pedicure", "unha", "nail", "alongamento de unha",
    "esmalteria", "fibra"
  ], {
    schema: "NailSalon",
    tituloCatalogo: "Serviços",
    galeriaPrimeiro: true,
  }),
  cat("estetica", "Estética e cuidados", "Beleza", [
    "estética", "limpeza de pele", "massagem", "drenagem",
    "sobrancelha", "cílios", "micropigmentação", "depilação",
    "spa"
  ], {
    schema: "HealthAndBeautyBusiness",
    tituloCatalogo: "Procedimentos",
  }),
  cat("tatuagem", "Tatuagem e piercing", "Beleza", ["tatuagem", "tatuador", "tattoo", "piercing"], {
    schema: "TattooParlor",
    tituloCatalogo: "Trabalhos",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),

  // --- Saúde ---------------------------------------------------------------
  // Preço guardado por padrão em todas: valor de consulta público é escolha,
  // e a maioria prefere combinar antes.
  cat("psicologia", "Psicologia e terapia", "Saúde", [
    "psicologia", "psicóloga", "psicólogo", "terapia", "terapeuta",
    "psicanálise", "saúde mental"
  ], {
    schema: "MedicalBusiness",
    tituloCatalogo: "Atendimentos",
    mostrarPrecos: false,
  }),
  cat("nutricao", "Nutrição", "Saúde", [
    "nutrição", "nutricionista", "dieta", "reeducação alimentar",
    "emagrecimento", "nutri"
  ], {
    schema: "MedicalBusiness",
    tituloCatalogo: "Atendimentos",
    mostrarPrecos: false,
  }),
  cat("fisioterapia", "Fisioterapia", "Saúde", [
    "fisioterapia", "fisioterapeuta", "rpg", "reabilitação",
    "quiropraxia", "osteopatia"
  ], {
    schema: "Physiotherapy",
    tituloCatalogo: "Atendimentos",
    mostrarPrecos: false,
  }),
  cat("odontologia", "Odontologia", "Saúde", [
    "odontologia", "dentista", "dental", "ortodontia", "aparelho",
    "clareamento", "implante"
  ], {
    schema: "Dentist",
    tituloCatalogo: "Tratamentos",
    mostrarPrecos: false,
    endereco: "esperado",
  }),

  // --- Corpo e movimento ---------------------------------------------------
  cat("yoga-pilates", "Yoga e pilates", "Corpo e movimento", [
    "yoga", "ioga", "pilates", "meditação", "alongamento",
    "estúdio"
  ], {
    schema: "SportsActivityLocation",
    tituloCatalogo: "Aulas e planos",
    endereco: "esperado",
  }),
  cat("academia", "Academia", "Corpo e movimento", ["academia", "musculação", "crossfit", "funcional", "ginástica"], {
    schema: "ExerciseGym",
    tituloCatalogo: "Planos",
    endereco: "esperado",
  }),
  cat("personal", "Personal trainer", "Corpo e movimento", [
    "personal", "personal trainer", "treinador", "treino",
    "preparador físico", "corrida", "assessoria esportiva"
  ], {
    schema: "SportsActivityLocation",
    tituloCatalogo: "Planos",
  }),
  cat("danca", "Dança", "Corpo e movimento", [
    "dança", "balé", "ballet", "jazz", "zumba", "forró", "samba",
    "dança de salão"
  ], {
    schema: "SportsActivityLocation",
    tituloCatalogo: "Aulas e turmas",
    endereco: "esperado",
  }),

  // --- Feito à mão ---------------------------------------------------------
  // Galeria primeiro no grupo inteiro: peça feita à mão se vende pela foto.
  cat("artesanato", "Artesanato e peças à mão", "Feito à mão", [
    "artesanato", "crochê", "tricô", "macramê", "cerâmica",
    "bordado", "feito à mão", "artesã", "biscuit", "velas",
    "sabonete"
  ], {
    schema: "Store",
    tituloCatalogo: "Peças",
    galeriaPrimeiro: true,
  }),
  cat("costura", "Costura e ateliê", "Feito à mão", [
    "costura", "costureira", "ateliê", "ajuste",
    "reforma de roupa", "alfaiataria", "moda", "sob medida"
  ], {
    schema: "ClothingStore",
    tituloCatalogo: "Peças e serviços",
    galeriaPrimeiro: true,
  }),
  cat("floricultura", "Flores e arranjos", "Feito à mão", [
    "flores", "floricultura", "florista", "arranjo", "buquê",
    "plantas", "jardinagem", "paisagismo"
  ], {
    schema: "Florist",
    tituloCatalogo: "Arranjos",
    galeriaPrimeiro: true,
  }),

  // --- Serviços ------------------------------------------------------------
  cat("fotografia", "Fotografia e vídeo", "Serviços", [
    "fotografia", "fotógrafo", "fotógrafa", "ensaio", "book",
    "filmagem", "vídeo", "casamento", "newborn", "gestante"
  ], {
    schema: "ProfessionalService",
    tituloCatalogo: "Ensaios",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),
  cat("design", "Design e comunicação", "Serviços", [
    "design", "designer", "identidade visual", "logo",
    "social media", "ilustração", "branding", "gráfico"
  ], {
    schema: "ProfessionalService",
    tituloCatalogo: "Serviços",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),
  cat("consultoria", "Consultoria e finanças", "Serviços", [
    "consultoria", "consultor", "finanças", "financeira",
    "investimentos", "planejamento financeiro", "negócios",
    "mentoria", "marketing"
  ], {
    schema: "ProfessionalService",
    tituloCatalogo: "Serviços",
    mostrarPrecos: false,
  }),
  cat("contabilidade", "Contabilidade", "Serviços", [
    "contabilidade", "contador", "contábil", "imposto de renda",
    "abertura de empresa", "mei", "folha de pagamento"
  ], {
    schema: "AccountingService",
    tituloCatalogo: "Serviços",
    mostrarPrecos: false,
  }),
  cat("advocacia", "Advocacia", "Serviços", ["advocacia", "advogado", "advogada", "jurídico", "direito"], {
    schema: "LegalService",
    tituloCatalogo: "Áreas de atuação",
    mostrarPrecos: false,
  }),
  cat("aulas", "Aulas particulares", "Serviços", [
    "aula", "aulas particulares", "professor", "professora",
    "inglês", "espanhol", "idiomas", "reforço", "matemática",
    "música", "violão", "piano", "canto", "informática",
    "concurso"
  ], {
    schema: "EducationalOrganization",
    tituloCatalogo: "Aulas",
  }),
  cat("assistencia", "Assistência técnica", "Serviços", [
    "assistência técnica", "conserto", "celular", "computador",
    "eletrodoméstico", "manutenção", "técnico", "ar condicionado"
  ], {
    schema: "ProfessionalService",
    tituloCatalogo: "Serviços",
  }),
  cat("reformas", "Reformas e manutenção", "Serviços", [
    "reforma", "pedreiro", "pintor", "pintura", "elétrica",
    "eletricista", "hidráulica", "encanador", "marcenaria",
    "gesso", "obra"
  ], {
    schema: "HomeAndConstructionBusiness",
    tituloCatalogo: "Serviços",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),
  cat("limpeza", "Limpeza e organização", "Serviços", [
    "limpeza", "diarista", "faxina", "organização",
    "personal organizer", "lavanderia", "higienização",
    "dedetização"
  ], {
    schema: "HomeAndConstructionBusiness",
    tituloCatalogo: "Serviços",
  }),
  cat("eventos", "Festas e eventos", "Serviços", [
    "eventos", "festa", "buffet", "decoração", "aniversário",
    "casamento", "cerimonial", "aluguel de itens", "brinquedos"
  ], {
    schema: "ProfessionalService",
    tituloCatalogo: "Pacotes",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),

  // --- Comércio ------------------------------------------------------------
  cat("loja-roupas", "Roupas e acessórios", "Comércio", [
    "roupas", "moda", "boutique", "brechó", "calçados",
    "acessórios", "semijoias", "bijuteria"
  ], {
    schema: "ClothingStore",
    tituloCatalogo: "Produtos",
  }),
  cat("mercado", "Mercado e hortifruti", "Comércio", [
    "mercado", "mercearia", "hortifruti", "sacolão", "quitanda",
    "empório", "adega", "conveniência"
  ], {
    schema: "GroceryStore",
    tituloCatalogo: "Produtos",
    endereco: "esperado",
  }),
  cat("pet", "Pet shop e veterinária", "Comércio", [
    "pet", "pet shop", "banho e tosa", "veterinário",
    "veterinária", "ração", "adestramento", "hotel para pets"
  ], {
    schema: "PetStore",
    tituloCatalogo: "Produtos e serviços",
    endereco: "esperado",
  }),
];

/** Na ordem em que aparecem, para o seletor do cadastro agrupar. */
export const GRUPOS = [...new Set(CATEGORIAS.map((c) => c.grupo))];

const PORiD = new Map(CATEGORIAS.map((c) => [c.id, c]));

export function categoriaPorId(id: string | null): Categoria | null {
  return id === null ? null : (PORiD.get(id) ?? null);
}

/**
 * A receita de um negócio. Categoria desconhecida, ou a opção "outro" com
 * texto livre, cai no padrão: o texto livre vira descrição e não muda a
 * montagem da página, porque a gente só sabe montar o que a gente conhece.
 */
export function receitaDe(id: string | null): Receita {
  return categoriaPorId(id) ?? RECEITA_PADRAO;
}

/**
 * Procura por como a pessoa fala, não pelo nome que a gente deu.
 *
 * Quem dá aula de inglês digita "inglês", e "Aulas particulares" tem que
 * aparecer. Quem faz bolo digita "bolo". Sem isto, uma lista de trinta e cinco
 * só serve para quem já pensa nos nossos termos, e o resto desiste e escolhe
 * "outro", que é justamente a opção que não ajuda o Google nem monta a página.
 *
 * A ordem importa mais que a quantidade: primeiro quem começa com o que foi
 * digitado, depois quem só contém. Assim "cafeteria" vem antes de "comida
 * caseira" quando alguém digita "caf".
 */
export function procurar(termo: string): Categoria[] {
  const busca = achatar(termo);

  /*
   * Uma letra só está contida em quase todo campo, então filtrar por ela
   * devolveria a lista quase inteira fingindo que filtrou. Abaixo de duas
   * letras a resposta honesta é a lista completa.
   */
  if (busca.length < 2) return CATEGORIAS;

  const comeca: Categoria[] = [];
  const contem: Categoria[] = [];

  /*
   * A comparação vai nos dois sentidos, e o segundo é o que salva quem digita
   * frase. Quem escreve "reforço escolar" tem que achar a categoria que guarda
   * "reforço", e comparar só num sentido deixaria isso de fora.
   *
   * O piso de quatro letras no sentido inverso existe para "bar" não casar com
   * "barbearia" ao contrário, e para uma letra solta não trazer tudo.
   */
  const casa = (campo: string) =>
    campo.includes(busca) || (campo.length >= 4 && busca.includes(campo));

  for (const c of CATEGORIAS) {
    const campos = [c.nome, ...c.busca].map(achatar);
    if (campos.some((campo) => campo.startsWith(busca))) comeca.push(c);
    else if (campos.some(casa)) contem.push(c);
  }

  return [...comeca, ...contem];
}
