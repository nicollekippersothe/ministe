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
  receita: Partial<Receita> & { schema: string },
): Categoria {
  return { id, nome, grupo, ...RECEITA_PADRAO, ...receita };
}

export const CATEGORIAS: Categoria[] = [
  // --- Comida e bebida -----------------------------------------------------
  cat("restaurante", "Restaurante", "Comida e bebida", {
    schema: "Restaurant",
    tituloCatalogo: "Cardápio",
    endereco: "esperado",
  }),
  cat("lanchonete", "Lanchonete", "Comida e bebida", {
    schema: "FastFoodRestaurant",
    tituloCatalogo: "Cardápio",
    endereco: "esperado",
  }),
  cat("cafeteria", "Cafeteria", "Comida e bebida", {
    schema: "CafeOrCoffeeShop",
    tituloCatalogo: "Cardápio",
    endereco: "esperado",
  }),
  cat("confeitaria", "Confeitaria e doces", "Comida e bebida", {
    schema: "Bakery",
    tituloCatalogo: "Cardápio",
  }),
  // Quem cozinha em casa e vende por encomenda. Endereço opcional de
  // propósito: é a cozinha da pessoa.
  cat("comida-caseira", "Comida caseira e encomendas", "Comida e bebida", {
    schema: "FoodEstablishment",
    tituloCatalogo: "Encomendas",
  }),
  cat("bar", "Bar", "Comida e bebida", {
    schema: "BarOrPub",
    tituloCatalogo: "Cardápio",
    endereco: "esperado",
  }),

  // --- Beleza --------------------------------------------------------------
  cat("salao", "Salão de beleza", "Beleza", {
    schema: "BeautySalon",
    tituloCatalogo: "Serviços",
    endereco: "esperado",
  }),
  cat("barbearia", "Barbearia", "Beleza", {
    schema: "HairSalon",
    tituloCatalogo: "Serviços",
    endereco: "esperado",
  }),
  cat("unhas", "Manicure e nail design", "Beleza", {
    schema: "NailSalon",
    tituloCatalogo: "Serviços",
    galeriaPrimeiro: true,
  }),
  cat("estetica", "Estética e cuidados", "Beleza", {
    schema: "HealthAndBeautyBusiness",
    tituloCatalogo: "Procedimentos",
  }),
  cat("tatuagem", "Tatuagem e piercing", "Beleza", {
    schema: "TattooParlor",
    tituloCatalogo: "Trabalhos",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),

  // --- Saúde ---------------------------------------------------------------
  // Preço guardado por padrão em todas: valor de consulta público é escolha,
  // e a maioria prefere combinar antes.
  cat("psicologia", "Psicologia e terapia", "Saúde", {
    schema: "MedicalBusiness",
    tituloCatalogo: "Atendimentos",
    mostrarPrecos: false,
  }),
  cat("nutricao", "Nutrição", "Saúde", {
    schema: "MedicalBusiness",
    tituloCatalogo: "Atendimentos",
    mostrarPrecos: false,
  }),
  cat("fisioterapia", "Fisioterapia", "Saúde", {
    schema: "Physiotherapy",
    tituloCatalogo: "Atendimentos",
    mostrarPrecos: false,
  }),
  cat("odontologia", "Odontologia", "Saúde", {
    schema: "Dentist",
    tituloCatalogo: "Tratamentos",
    mostrarPrecos: false,
    endereco: "esperado",
  }),

  // --- Corpo e movimento ---------------------------------------------------
  cat("yoga-pilates", "Yoga e pilates", "Corpo e movimento", {
    schema: "SportsActivityLocation",
    tituloCatalogo: "Aulas e planos",
    endereco: "esperado",
  }),
  cat("academia", "Academia", "Corpo e movimento", {
    schema: "ExerciseGym",
    tituloCatalogo: "Planos",
    endereco: "esperado",
  }),
  cat("personal", "Personal trainer", "Corpo e movimento", {
    schema: "SportsActivityLocation",
    tituloCatalogo: "Planos",
  }),
  cat("danca", "Dança", "Corpo e movimento", {
    schema: "SportsActivityLocation",
    tituloCatalogo: "Aulas e turmas",
    endereco: "esperado",
  }),

  // --- Feito à mão ---------------------------------------------------------
  // Galeria primeiro no grupo inteiro: peça feita à mão se vende pela foto.
  cat("artesanato", "Artesanato e peças à mão", "Feito à mão", {
    schema: "Store",
    tituloCatalogo: "Peças",
    galeriaPrimeiro: true,
  }),
  cat("costura", "Costura e ateliê", "Feito à mão", {
    schema: "ClothingStore",
    tituloCatalogo: "Peças e serviços",
    galeriaPrimeiro: true,
  }),
  cat("floricultura", "Flores e arranjos", "Feito à mão", {
    schema: "Florist",
    tituloCatalogo: "Arranjos",
    galeriaPrimeiro: true,
  }),

  // --- Serviços ------------------------------------------------------------
  cat("fotografia", "Fotografia e vídeo", "Serviços", {
    schema: "ProfessionalService",
    tituloCatalogo: "Ensaios",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),
  cat("design", "Design e comunicação", "Serviços", {
    schema: "ProfessionalService",
    tituloCatalogo: "Serviços",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),
  cat("consultoria", "Consultoria e finanças", "Serviços", {
    schema: "ProfessionalService",
    tituloCatalogo: "Serviços",
    mostrarPrecos: false,
  }),
  cat("contabilidade", "Contabilidade", "Serviços", {
    schema: "AccountingService",
    tituloCatalogo: "Serviços",
    mostrarPrecos: false,
  }),
  cat("advocacia", "Advocacia", "Serviços", {
    schema: "LegalService",
    tituloCatalogo: "Áreas de atuação",
    mostrarPrecos: false,
  }),
  cat("aulas", "Aulas particulares", "Serviços", {
    schema: "EducationalOrganization",
    tituloCatalogo: "Aulas",
  }),
  cat("assistencia", "Assistência técnica", "Serviços", {
    schema: "ProfessionalService",
    tituloCatalogo: "Serviços",
  }),
  cat("reformas", "Reformas e manutenção", "Serviços", {
    schema: "HomeAndConstructionBusiness",
    tituloCatalogo: "Serviços",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),
  cat("limpeza", "Limpeza e organização", "Serviços", {
    schema: "HomeAndConstructionBusiness",
    tituloCatalogo: "Serviços",
  }),
  cat("eventos", "Festas e eventos", "Serviços", {
    schema: "ProfessionalService",
    tituloCatalogo: "Pacotes",
    mostrarPrecos: false,
    galeriaPrimeiro: true,
  }),

  // --- Comércio ------------------------------------------------------------
  cat("loja-roupas", "Roupas e acessórios", "Comércio", {
    schema: "ClothingStore",
    tituloCatalogo: "Produtos",
  }),
  cat("mercado", "Mercado e hortifruti", "Comércio", {
    schema: "GroceryStore",
    tituloCatalogo: "Produtos",
    endereco: "esperado",
  }),
  cat("pet", "Pet shop e veterinária", "Comércio", {
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
