import { deepStrictEqual, ok, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import {
  CATEGORIAS,
  categoriaPorId,
  GRUPOS,
  procurar,
  RECEITA_PADRAO,
  receitaDe,
} from "./categorias.ts";

test("todo id é único", () => {
  const ids = CATEGORIAS.map((c) => c.id);
  strictEqual(new Set(ids).size, ids.length);
});

test("todo id serve como valor de formulário", () => {
  for (const c of CATEGORIAS) {
    ok(/^[a-z][a-z0-9-]*$/.test(c.id), `id estranho: ${c.id}`);
  }
});

test("todo tipo de schema começa com maiúscula, como o schema.org escreve", () => {
  for (const c of CATEGORIAS) {
    ok(/^[A-Z][A-Za-z]+$/.test(c.schema), `${c.id}: ${c.schema}`);
  }
});

test("todo título de catálogo cabe no limite de 30 do banco", () => {
  for (const c of CATEGORIAS) {
    ok(c.tituloCatalogo.length <= 30, `${c.id}: ${c.tituloCatalogo}`);
  }
});

test("categoria desconhecida cai na receita padrão, sem quebrar", () => {
  deepStrictEqual(receitaDe("inexistente"), RECEITA_PADRAO);
  deepStrictEqual(receitaDe(null), RECEITA_PADRAO);
  strictEqual(categoriaPorId("inexistente"), null);
});

test("quem vende hora esconde preço por padrão", () => {
  for (const id of ["psicologia", "nutricao", "advocacia", "fotografia"]) {
    strictEqual(receitaDe(id).mostrarPrecos, false, id);
  }
});

test("quem vende pelo olho abre pela galeria", () => {
  for (const id of ["artesanato", "fotografia", "tatuagem", "floricultura"]) {
    strictEqual(receitaDe(id).galeriaPrimeiro, true, id);
  }
});

test("quem produz em casa não tem endereço como esperado", () => {
  for (const id of ["comida-caseira", "artesanato", "consultoria"]) {
    strictEqual(receitaDe(id).endereco, "opcional", id);
  }
});

/**
 * A ordem dos grupos é escolha de produto, e não acaso da lista.
 *
 * O primeiro grupo é o que a pessoa vê antes de rolar, e ele responde "para
 * quem é isto" antes de qualquer texto de propaganda. Serviços na frente
 * porque o produto é para quem vende o próprio trabalho. Comida continua na
 * lista, com os mesmos seis ramos de sempre, só que depois.
 */
test("os grupos saem na ordem da lista, sem repetir", () => {
  strictEqual(new Set(GRUPOS).size, GRUPOS.length);
  strictEqual(GRUPOS[0], "Serviços");
  strictEqual(GRUPOS.length, 7);
});

/**
 * O nome do primeiro campo do cadastro sai daqui.
 *
 * Errar para um lado faz a psicóloga inventar um nome de empresa que ninguém
 * usa. Errar para o outro faz o restaurante achar que está preenchendo um
 * cadastro de cliente.
 */
test("o nome é da pessoa, do lugar, ou de qualquer um dos dois", () => {
  for (const id of ["psicologia", "advocacia", "personal", "fotografia", "unhas"]) {
    strictEqual(receitaDe(id).nomeDe, "pessoa", id);
  }
  for (const id of ["restaurante", "salao", "mercado", "academia", "bar"]) {
    strictEqual(receitaDe(id).nomeDe, "lugar", id);
  }
  /*
   * O terceiro estado é o que impede o produto de errar na cara da pessoa.
   *
   * Yoga é a professora e também é o studio, costura é a costureira e também é
   * o ateliê. Num ramo desses, qualquer chute erra com metade de quem chega, e
   * a pergunta neutra é verdadeira para todas. Achado ao percorrer o cadastro
   * como uma professora de yoga: ela levava "Qual é o nome do negócio?".
   */
  for (const id of ["yoga-pilates", "costura", "limpeza", "comida-caseira"]) {
    strictEqual(receitaDe(id).nomeDe, "qualquer", id);
  }
  strictEqual(receitaDe(null).nomeDe, "qualquer");
  strictEqual(receitaDe("ramo-que-nao-existe").nomeDe, "qualquer");
});

test("acha pelo jeito que a pessoa fala, e não pelo nome que a gente deu", () => {
  const casos: [string, string][] = [
    ["inglês", "aulas"],
    ["ingles", "aulas"],
    ["violão", "aulas"],
    ["reforço escolar", "aulas"],
    ["marmita", "comida-caseira"],
    ["bolo", "confeitaria"],
    ["crochê", "artesanato"],
    ["diarista", "limpeza"],
    ["pedreiro", "reformas"],
    ["imposto de renda", "contabilidade"],
    ["banho e tosa", "pet"],
    ["personal", "personal"],
    ["investimentos", "consultoria"],
    ["brechó", "loja-roupas"],
    ["newborn", "fotografia"],
  ];
  for (const [digitado, esperado] of casos) {
    const achados = procurar(digitado);
    ok(
      achados.some((c) => c.id === esperado),
      `"${digitado}" tinha que achar ${esperado}, achou ${achados.map((c) => c.id).join(", ") || "nada"}`,
    );
  }
});

test("quem começa com o termo vem antes de quem só contém", () => {
  strictEqual(procurar("caf")[0].id, "cafeteria");
});

test("busca vazia devolve a lista inteira", () => {
  strictEqual(procurar("").length, CATEGORIAS.length);
  strictEqual(procurar("   ").length, CATEGORIAS.length);
});

test("termo em dois ramos devolve os dois, para a pessoa escolher", () => {
  // Casamento é dos dois mesmo: fotógrafo cobre casamento, cerimonialista
  // organiza casamento. Devolver os dois e deixar a pessoa escolher é melhor
  // que decidir por ela.
  const achados = procurar("casamento").map((c) => c.id);
  ok(achados.includes("fotografia"), achados.join(", "));
  ok(achados.includes("eventos"), achados.join(", "));
});

test("uma letra só devolve tudo, em vez de fingir que filtrou", () => {
  strictEqual(procurar("a").length, CATEGORIAS.length);
});

test("a partir de duas letras a lista encolhe de verdade", () => {
  ok(procurar("ta").length < CATEGORIAS.length);
  ok(procurar("bolo").length < 5);
});

/*
 * Tipos do schema.org conferidos um a um contra o vocabulário oficial
 * (schemaorg-current-https.jsonld), todos subclasses de LocalBusiness.
 *
 * A lista fica escrita aqui, e não é baixada, porque teste que depende de rede
 * falha por motivo errado. Para acrescentar um tipo novo: confira a árvore dele
 * em schema.org, veja que chega em LocalBusiness, e só então escreva aqui.
 *
 * Esta trava nasceu de um erro real: "Aulas particulares" estava com
 * EducationalOrganization, que desce de CivicStructure e Organization e não é
 * negócio local. Palpite óbvio, e errado.
 */
const TIPOS_CONFERIDOS = new Set([
  "AccountingService", "Bakery", "BarOrPub", "BeautySalon", "CafeOrCoffeeShop",
  "ClothingStore", "Dentist", "ExerciseGym", "FastFoodRestaurant", "Florist",
  "FoodEstablishment", "GroceryStore", "HairSalon", "HealthAndBeautyBusiness",
  "HomeAndConstructionBusiness", "LegalService", "LocalBusiness",
  "MedicalBusiness", "NailSalon", "PetStore", "Physiotherapy",
  "ProfessionalService", "Restaurant", "SportsActivityLocation", "Store",
  "TattooParlor",
]);

test("todo tipo de schema é uma subclasse de LocalBusiness conferida", () => {
  for (const c of CATEGORIAS) {
    ok(
      TIPOS_CONFERIDOS.has(c.schema),
      `${c.id} usa ${c.schema}, que não está na lista conferida. Confira a árvore em schema.org antes de acrescentar.`,
    );
  }
  ok(TIPOS_CONFERIDOS.has(RECEITA_PADRAO.schema));
});

test("todo id de categoria passa na restrição de formato do banco", () => {
  // A coluna tem check: categoria ~ '^[a-z][a-z0-9-]{1,40}$'
  const doBanco = /^[a-z][a-z0-9-]{1,40}$/;
  for (const c of CATEGORIAS) {
    ok(doBanco.test(c.id), `${c.id} seria recusado pelo banco`);
  }
});

/**
 * Tecnologia, e a lição que ela deixou.
 *
 * A falta dela apareceu do pior jeito: a dona do produto foi montar a própria
 * página e o ramo dela estava fora da lista. O teste trava os termos que quem
 * trabalha com isso realmente digita, e nenhum deles é "tecnologia".
 */
test("quem escreve software acha o próprio ramo pelas palavras dele", () => {
  for (const termo of ["dev", "site", "aplicativo", "software", "automação", "programadora"]) {
    const achados = procurar(termo);
    ok(
      achados.some((c) => c.id === "tecnologia"),
      `"${termo}" precisa achar tecnologia, achou: ${achados.map((c) => c.id).join(", ")}`,
    );
  }
  // Preço guardado e endereço opcional, como o resto de quem vende projeto e
  // trabalha de onde estiver.
  strictEqual(receitaDe("tecnologia").mostrarPrecos, false);
  strictEqual(receitaDe("tecnologia").endereco, "opcional");
  strictEqual(receitaDe("tecnologia").nomeDe, "pessoa");
});
