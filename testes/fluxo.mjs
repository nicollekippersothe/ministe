/**
 * Teste de fluxo, no navegador de verdade, num celular de verdade (emulado).
 *
 * Percorre o caminho inteiro: cadastro, edição, prévia, publicação e a página
 * pública. Serve para pegar o tipo de erro que teste de unidade não pega, tipo
 * o WhatsApp salvo sem o código do país.
 *
 * Como rodar:
 *   npm run build && npm start   (num terminal)
 *   npm run fluxo                (no outro)
 *
 * Apaga .dados antes de rodar, porque ele mexe nos dados.
 */
import { readFile } from "node:fs/promises";
import { chromium, devices } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const EXECUTAVEL = process.env.CHROMIUM;

/** O processo, para o endereço criado no teste mudar a cada rodada. */
const processo = process;

/*
 * O aviso que fica ao lado do campo de endereço.
 *
 * Escrito pelo id, e não como "o primeiro [aria-live] da página", porque o
 * primeiro deixou de ser este no dia em que o ramo virou a primeira pergunta
 * do cadastro: passou a ser o contador de opções da lista, que é sr-only. O
 * teste continuava verde ou vermelho pelo motivo errado, que é pior do que
 * quebrar.
 */
const ESTADO_DO_ENDERECO = '[id$="-estado"][aria-live]';

let falhas = 0;

function passo(nome, ok) {
  console.log(`${ok ? "  ok  " : "FALHOU"} ${nome}`);
  if (!ok) falhas++;
}

/** Espera o elemento aparecer e devolve se apareceu, em vez de estourar. */
async function esperar(seletor, tempo = 5000) {
  try {
    await p.waitForSelector(seletor, { timeout: tempo });
    return true;
  } catch {
    return false;
  }
}

const navegador = await chromium.launch(
  EXECUTAVEL ? { executablePath: EXECUTAVEL } : {},
);
const contexto = await navegador.newContext({ ...devices["iPhone 13"] });
const p = await contexto.newPage();

// ---------------------------------------------------------------------------
// Tela inicial e cadastro
// ---------------------------------------------------------------------------

await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
passo(
  "a tela inicial abre e chama para criar",
  (await p.textContent("body")).includes("Criar meu endereço"),
);

// O campo da abertura é o que transforma visita em intenção, então ele precisa
// conferir de verdade, e não só parecer que confere.
await p.fill('form[action="/criar"] input[name=slug]', "helena massagem nova");
await p.waitForTimeout(900);
passo(
  "o campo da abertura confere o endereço ao vivo",
  (await p.textContent('form[action="/criar"] ~ p')).includes("disponível"),
);

await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
await p.fill("input[name=slug]", "Doceria da Ana!!");
await p.waitForTimeout(800);
passo(
  "o endereço é limpo e conferido enquanto digita",
  (await p.textContent(ESTADO_DO_ENDERECO)).includes("/doceria-da-ana"),
);

await p.fill("input[name=slug]", "painel");
await p.waitForTimeout(800);
passo(
  "endereço reservado é avisado na hora",
  (await p.textContent(ESTADO_DO_ENDERECO)).includes("reservado pelo sistema"),
);

await p.fill("input[name=slug]", "demo");
await p.waitForTimeout(800);
passo(
  "endereço já ocupado é avisado na hora",
  (await p.textContent(ESTADO_DO_ENDERECO)).length > 0,
);

await p.goto(`${BASE}/entrar`, { waitUntil: "load" });
passo(
  "entrar oferece uma porta só, o Google",
  (await p.isVisible('button:has-text("Entrar com o Google")')) &&
    (await p.locator("input[type=password], #email").count()) === 0,
);

await p.goto(`${BASE}/entrar?motivo=publicar`, { waitUntil: "load" });
passo(
  "e quem chega para publicar é avisado de que a página continua sendo dele",
  (await p.textContent("body")).includes("Ela continua sua"),
);

// ---------------------------------------------------------------------------
// Painel
// ---------------------------------------------------------------------------

await p.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
passo("o painel mostra o estado da página", (await p.textContent("body")).includes("No ar"));

await p.goto(`${BASE}/painel/negocio`, { waitUntil: "networkidle" });
await p.fill("#nome", "Helena Vasques, Massoterapia");
await p.fill("#frase", "Massagem terapêutica e drenagem, com hora marcada.");
await p.fill("#whatsapp", "(11) 98888-7777");
await p.click('button[type="submit"]');
await p.waitForURL(/salvo=1/);
passo("salvou as informações", (await p.textContent("body")).includes("Alterações salvas"));
passo(
  "o WhatsApp volta formatado para quem edita",
  (await p.inputValue("#whatsapp")) === "(11) 98888-7777",
);

await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
const publica = await p.textContent("body");
passo("a página pública mostra o nome novo", publica.includes("Helena Vasques, Massoterapia"));
passo("a página pública mostra a frase nova", publica.includes("Massagem terapêutica"));
passo(
  "o link do WhatsApp sai com o código do país",
  (await p.getAttribute('a[data-evento="clique_whatsapp"]', "href")).startsWith(
    "https://wa.me/5511988887777",
  ),
);

// ---------------------------------------------------------------------------
// Fontes
// ---------------------------------------------------------------------------
// A página pública tem cinco combinações disponíveis, mas só pode baixar a
// escolhida. É fácil quebrar isso sem perceber, então fica testado.

async function fontesBaixadas(rota) {
  const pagina = await contexto.newPage();
  const vistas = new Set();
  pagina.on("response", (r) => {
    // O painel de desenvolvimento do Next baixa a Geist para a própria barra,
    // de `next-devtools`, e ela some no build de produção. Contar ela aqui
    // faria a asserção medir uma ferramenta em vez de medir o produto, e ela
    // aparece de forma intermitente, o que é o pior tipo de teste: o que falha
    // sozinho de vez em quando.
    const u = r.url();
    if (u.includes(".woff2") && !u.includes("geist")) vistas.add(u);
  });
  await pagina.goto(BASE + rota, { waitUntil: "load" });
  // Fonte sem pré-carregamento é pedida depois que o CSS aplica, então
  // esperar o "load" não basta.
  await pagina.waitForTimeout(1200);
  await pagina.close();
  return vistas.size;
}

passo("a página pública baixa só duas fontes", (await fontesBaixadas("/demo")) === 2);
passo("o painel não baixa fonte nenhuma", (await fontesBaixadas("/painel")) === 0);
// A tela inicial mostra a página de verdade dentro de um telefone, com a
// letra de verdade. São as mesmas duas fontes da página do negócio, e não
// mais que isso.
passo("a tela inicial baixa só as duas da prévia", (await fontesBaixadas("/")) === 2);

// ---------------------------------------------------------------------------
// Contagem de visitas e cliques
// ---------------------------------------------------------------------------
// A página fica uma hora em cache, então o render do servidor não roda a cada
// visita e a conta precisa sair do navegador. Isso vira três coisas fáceis de
// quebrar sem perceber, e as três ficam testadas aqui.

/** Abre uma rota e devolve o que foi mandado para /api/evento. */
async function avisosDe(rota, acao) {
  const pagina = await contexto.newPage();
  const vistos = [];
  pagina.on("request", (r) => {
    if (r.url().includes("/api/evento")) vistos.push(r.postData() ?? "");
  });
  await pagina.goto(BASE + rota, { waitUntil: "load" });
  await pagina.waitForTimeout(500);
  if (acao) await acao(pagina, vistos);
  await pagina.close();
  return vistos;
}

const daVisita = await avisosDe("/demo");
passo(
  "abrir a página pública conta uma visita",
  daVisita.length === 1 && daVisita[0].includes('"t":"visita"'),
);

// PaginaPublica é a mesma na prévia do painel, com os botões de verdade e o
// data-evento de verdade. Sem a trava, o dono infla os próprios números só de
// conferir a página antes de publicar.
passo(
  "a prévia do painel não conta nada",
  (await avisosDe("/painel/previa")).length === 0,
);

// O mesmo botão é renderizado duas vezes no HTML, uma na barra de baixo do
// celular e outra na coluna do monitor. Por isso a contagem é delegação num
// ouvinte só, e nunca uma varredura de lista, que contaria em dobro.
const doClique = await avisosDe("/demo", async (pagina) => {
  await pagina.locator("a[data-evento]:visible").first().click();
  await pagina.waitForTimeout(600);
});
passo(
  "clicar no botão conta um clique, e um só",
  doClique.filter((c) => c.includes('"t":"clique_whatsapp"')).length === 1,
);

// Sem guardar nada no aparelho: quem sabe que foi recarga é o próprio
// navegador, e a informação some quando a aba fecha.
const daRecarga = await avisosDe("/demo", async (pagina, vistos) => {
  await pagina.reload({ waitUntil: "load" });
  await pagina.waitForTimeout(600);
  void vistos;
});
passo(
  "recarregar com F5 não conta uma segunda visita",
  daRecarga.length === 1,
);

// O teto do JavaScript inline da página pública.
//
// Conta só o que a gente escreveu: script com `type` é dado e não executa, e o
// que começa por `self.__next` ou traz `__next` no meio é o próprio Next, que
// sozinho passa de 70 KB e dominaria qualquer teto.
const NOSSO_JS_MAXIMO = 1400;

async function jsInlineNosso(rota) {
  const pagina = await contexto.newPage();
  await pagina.goto(BASE + rota, { waitUntil: "load" });
  const bytes = await pagina.evaluate(() =>
    Array.from(document.querySelectorAll("script"))
      .filter((s) => !s.type && !s.src && !s.textContent.includes("__next"))
      .reduce((soma, s) => soma + s.textContent.length, 0),
  );
  await pagina.close();
  return bytes;
}

const jsDaPublica = await jsInlineNosso("/demo");
passo(
  `a página pública tem ${jsDaPublica} bytes de JavaScript nosso, abaixo de ${NOSSO_JS_MAXIMO}`,
  jsDaPublica > 0 && jsDaPublica < NOSSO_JS_MAXIMO,
);

// A escolha de letra é do plano pago. O negócio de exemplo é gratuito, então
// as opções aparecem para ver, mas travadas.
await p.goto(`${BASE}/painel/aparencia`, { waitUntil: "networkidle" });
passo(
  "no plano gratuito a letra fica travada",
  await p.isDisabled("#fonte-marcante"),
);
passo(
  "e a tela explica por quê",
  (await p.textContent("body")).includes("plano pago"),
);

// Os sete exemplos usam a letra padrão de propósito: numa peça com vários
// negócios lado a lado, sete letras diferentes fazem parecer sete produtos.
// Quem prova que a escolha existe é a tela de aparência, acima.
await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
passo(
  "a página gratuita usa a letra padrão",
  (await p.getAttribute("[data-fonte]", "data-fonte")) === "moderno",
);
await p.goto(`${BASE}/bia-marconi`, { waitUntil: "networkidle" });
passo(
  "e a do plano pago usa a mesma, para os exemplos ficarem irmãos",
  (await p.getAttribute("[data-fonte]", "data-fonte")) === "moderno",
);

// ---------------------------------------------------------------------------
// Botões do rodapé
// ---------------------------------------------------------------------------

passo(
  "dá para trocar o botão principal por um link",
  (await p.textContent("body")).includes("Agendar aula experimental"),
);
passo(
  "e o WhatsApp continua como segundo botão",
  (await p.$('a[data-evento="clique_whatsapp"]')) !== null &&
    (await p.$('a[data-evento="clique_acao"]')) !== null,
);

// Ainda na página paga.
const pago = await p.textContent("body");
passo(
  "a assinatura feito com Entrais some no plano pago",
  !pago.includes("feito com"),
);
passo(
  "mas a denúncia continua na página paga, que é onde o golpista está",
  pago.includes("Denunciar esta página"),
);

// A confeitaria é o exemplo que aponta o segundo botão para fora do WhatsApp.
await p.goto(`${BASE}/alecrim-confeitaria`, { waitUntil: "networkidle" });
passo(
  "o iFood aparece ao lado do WhatsApp na confeitaria",
  (await p.textContent("body")).includes("Pedir pelo iFood"),
);

await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
passo(
  "a assinatura aparece na página gratuita",
  (await p.textContent("body")).includes("feito com"),
);

passo(
  "mesmo com tudo isso, ainda são só duas fontes",
  (await fontesBaixadas("/demo")) === 2,
);

// ---------------------------------------------------------------------------
// Horários
// ---------------------------------------------------------------------------

await p.goto(`${BASE}/painel/horarios`, { waitUntil: "networkidle" });
await p.fill("#h-6-0-abre", "19:00");
await p.fill("#h-6-0-fecha", "02:00");
await p.click('form button[type="submit"]');
await p.waitForURL(/salvo=1/);

/*
 * Só os turnos que a tela desenhou.
 *
 * O dia deixou de nascer com os três pares em branco pendurados: agora aparece
 * o que está em uso mais uma sobra. Perguntar pelos três de cabeça devolvia
 * nulo no terceiro e derrubava a bateria inteira num passo que passa.
 */
const sabado = await p.evaluate(() =>
  [0, 1, 2]
    .map((i) => [
      document.querySelector(`#h-6-${i}-abre`),
      document.querySelector(`#h-6-${i}-fecha`),
    ])
    .filter(([a, f]) => a !== null && f !== null)
    .map(([a, f]) => [a.value, f.value]),
);
passo(
  "turno que vira a madrugada é guardado",
  sabado.some(([a, f]) => a === "19:00" && f === "02:00"),
);

await p.fill("#h-1-0-abre", "08:30");
await p.fill("#h-1-0-fecha", "17:30");
await p.click('button:has-text("Copiar segunda")');
await p.waitForURL(/copiado=1/);
passo(
  "copiar segunda preenche de terça a sexta",
  (await p.inputValue("#h-3-0-abre")) === "08:30" &&
    (await p.inputValue("#h-5-0-fecha")) === "17:30",
);

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------
// A tela é um formulário só, e todos os botões dela enviam esse formulário. O
// que se testa aqui é o caminho inteiro de quem mexe no cardápio pelo celular:
// acrescentar, editar, reordenar, guardar da página e remover.

/** Abre a linha, que vem fechada para a lista caber na tela do celular. */
async function abrirLinha(id) {
  await p.locator(`#${id} > details`).evaluate((d) => {
    d.open = true;
  });
}

await p.goto(`${BASE}/painel/catalogo`, { waitUntil: "networkidle" });
const itensAntes = await p.locator("fieldset[id^=item-]").count();
passo(
  "o catálogo lista os itens que a página mostra",
  (await p.textContent("main")).includes("Massagem relaxante, 60 minutos") &&
    itensAntes > 0,
);

await p.fill("#novo-titulo", "Brigadeiro de colher");
await p.fill("#novo-preco", "12,50");
await p.click('button:has-text("Acrescentar ao catálogo")');
// O caminho de volta carrega o id do item recém-criado, e não um "acrescentado=1":
// é por ele que a tela sabe qual linha abrir, marcar e receber o cursor. Ver o
// comentário no topo de app/painel/catalogo/page.tsx.
await p.waitForURL(/novo=[0-9a-f-]+#item-/);
const ultimo = itensAntes;
passo(
  "acrescentar põe o item no fim da lista, com o preço em reais",
  (await p.locator("fieldset[id^=item-]").count()) === itensAntes + 1 &&
    (await p.inputValue(`#item-${ultimo}-preco`)) === "12,50",
);

// O banco guarda centavos, e a tela fala reais. A ida e a volta passam por
// lib/formato.ts, e é aqui que o par inteiro é conferido de ponta a ponta.
const noArquivo = JSON.parse(await readFile(".dados/negocios.json", "utf8")).find(
  (n) => n.slug === "demo",
);
passo(
  "o preço em reais chega ao banco em centavos",
  noArquivo?.itens.at(-1)?.precoCentavos === 1250,
);

await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
const comItem = await p.textContent("body");
passo(
  "e a página pública mostra o item novo com o preço formatado",
  comItem.includes("Brigadeiro de colher") &&
    comItem.replace(/ /g, " ").includes("R$ 12,50"),
);

/*
 * Reordenar no toque, sem arrastar. Arrastar pede JavaScript, briga com a
 * rolagem do celular e some para quem usa teclado ou leitor de tela.
 *
 * A espera é pela âncora do item, e nunca só por "movido=1": a URL de antes já
 * tem movido=1, e esperar por ela voltaria antes da segunda troca, medindo a
 * tela velha. Foi assim que este passo passou verde estando errado.
 */
await p.goto(`${BASE}/painel/catalogo`, { waitUntil: "networkidle" });
await p.click(`#item-${ultimo} button[aria-label="Subir Brigadeiro de colher"]`);
await p.waitForURL(new RegExp(`movido=1#item-${ultimo - 1}$`));
const subiu = (await p.inputValue(`#item-${ultimo - 1}-titulo`)) === "Brigadeiro de colher";

await p.click(`#item-${ultimo - 1} button[aria-label="Descer Brigadeiro de colher"]`);
await p.waitForURL(new RegExp(`movido=1#item-${ultimo}$`));
passo(
  "subir e descer trocam o item de lugar, sem arrastar",
  subiu && (await p.inputValue(`#item-${ultimo}-titulo`)) === "Brigadeiro de colher",
);

await p.goto(`${BASE}/painel/catalogo`, { waitUntil: "networkidle" });
await abrirLinha(`item-${ultimo}`);
await p.locator(`#item-${ultimo}-ativo`).evaluate((e) =>
  e.scrollIntoView({ block: "center" }),
);
await p.uncheck(`#item-${ultimo}-ativo`);
await p.click('main button:has-text("Salvar")');
await p.waitForURL(/salvo=1/);
const guardado = (await p.textContent("main")).includes("Guardado");

await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
passo(
  "item desmarcado fica guardado no painel e sai da página",
  guardado && !(await p.textContent("body")).includes("Brigadeiro de colher"),
);

await p.goto(`${BASE}/painel/catalogo`, { waitUntil: "networkidle" });
await p.click(`#item-${ultimo} summary:has-text("Remover")`);
await p.click(`#item-${ultimo} button:has-text("Remover este item")`);
await p.waitForURL(/removido=1/);
passo(
  "remover pede dois toques e devolve o catálogo ao tamanho de antes",
  (await p.locator("fieldset[id^=item-]").count()) === itensAntes &&
    !(await p.textContent("main")).includes("Brigadeiro de colher"),
);

/*
 * A parede dos 20 itens.
 *
 * Quem levanta é o gatilho checa_limite_itens, que só existe com banco, então
 * o que se confere aqui é a outra metade: a recusa já traduzida chegando na
 * tela como convite, com o número do plano gratuito, o do pago e o caminho da
 * assinatura. É o melhor momento de venda que o produto tem.
 */
await p.goto(`${BASE}/painel/catalogo?erro=limite_itens`, { waitUntil: "networkidle" });
const parede = await p.textContent('main [role="alert"]');
passo(
  "o limite de itens vira convite, com o caminho do plano pago",
  parede.includes("20 itens") &&
    parede.includes("500") &&
    (await p.getAttribute('main [role="alert"] a', "href")) === "/painel/plano",
);

// ---------------------------------------------------------------------------
// Links extras
// ---------------------------------------------------------------------------

await p.goto(`${BASE}/painel/links`, { waitUntil: "networkidle" });
const linksAntes = await p.locator("fieldset[id^=link-]").count();

await p.fill("#novo-rotulo", "Ver a agenda completa");
await p.fill("#novo-url", "bit.ly/agenda");
await p.click('button:has-text("Acrescentar à página")');
await p.waitForURL(/erro=link_encurtador/);
passo(
  "link encurtado é recusado também na lista de links",
  (await p.textContent('main [role="alert"]')).includes("endereço completo"),
);

await p.fill("#novo-rotulo", "Ver a agenda completa");
await p.fill("#novo-url", "helena-vasques.com.br/agenda");
await p.selectOption("#novo-icone", "site");
await p.click('button:has-text("Acrescentar à página")');
await p.waitForURL(/novo=[0-9a-f-]+#link-/);
passo(
  "endereço sem https é aceito e completado no link novo",
  (await p.inputValue(`#link-${linksAntes}-url`)) ===
    "https://helena-vasques.com.br/agenda",
);

await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
passo(
  "e o link novo vira botão na página pública",
  (await p.textContent("body")).includes("Ver a agenda completa"),
);

await p.goto(`${BASE}/painel/links`, { waitUntil: "networkidle" });
await p.click(`#link-${linksAntes} summary:has-text("Remover")`);
await p.click(`#link-${linksAntes} button:has-text("Remover este link")`);
await p.waitForURL(/removido=1/);
passo(
  "remover devolve a lista de links ao tamanho de antes",
  (await p.locator("fieldset[id^=link-]").count()) === linksAntes,
);

// ---------------------------------------------------------------------------
// Publicar e tirar do ar
// ---------------------------------------------------------------------------

// O estado da página existe duas vezes no HTML de /painel: uma na coluna
// lateral, que só aparece no computador, e outra no meio da tela, que só
// aparece no celular. Sem dizer "main", o seletor pega a primeira das duas, que
// neste tamanho está escondida, e o clique espera para sempre por ela.
await p.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
await p.click('main button:has-text("Tirar do ar")');
await p.waitForSelector('main button:has-text("Publicar")');
passo(
  "tirar do ar devolve a página para quem é dona dela",
  (await p.textContent("body")).includes("Só para você"),
);

const fora = await p.goto(`${BASE}/demo`);
passo("página fora do ar responde 404", fora.status() === 404);
passo(
  "o 404 oferece o endereço livre",
  (await p.textContent("body")).includes("está disponível"),
);

await p.goto(`${BASE}/painel/previa`, { waitUntil: "networkidle" });
passo(
  "o dono continua vendo a prévia",
  (await p.textContent("body")).includes("visível apenas para você"),
);

await p.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
await p.click('main button:has-text("Publicar")');
await p.waitForSelector('main button:has-text("Tirar do ar")');
const dentro = await p.goto(`${BASE}/demo`);
passo("publicar coloca de volta no ar", dentro.status() === 200);

// ---------------------------------------------------------------------------
// Anti golpe
// ---------------------------------------------------------------------------
// Server Action navega pelo cliente, sem carregar documento novo, então "load"
// voltaria na hora. E esperar por [role="alert"] também não serve: o
// anunciador de rota do Next usa esse mesmo papel e aparece vazio antes da
// resposta. Quem chega junto com o resultado é a URL.

await p.goto(`${BASE}/painel/acoes-botoes`, { waitUntil: "networkidle" });
await p.selectOption("#secundaria-tipo", "link");

await p.fill("#secundaria-url", "javascript:alert(1)");
await p.click('button:has-text("Salvar")');
await p.waitForURL(/erro=link_/);
passo(
  "script no lugar do link é recusado ao salvar",
  (await p.textContent('main [role="alert"]')).includes("começam com https"),
);

await p.fill("#secundaria-url", "bit.ly/promo");
await p.click('button:has-text("Salvar")');
await p.waitForURL(/erro=link_encurtador/);
passo(
  "link encurtado é recusado, dizendo o motivo",
  (await p.textContent('main [role="alert"]')).includes("endereço completo"),
);

await p.fill("#secundaria-url", "helena-vasques.com.br");
await p.click('button:has-text("Salvar")');
await p.waitForURL(/salvo=1/);
passo(
  "endereço sem https é aceito e completado",
  (await p.inputValue("#secundaria-url")) === "https://helena-vasques.com.br/",
);

await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
await p.fill("input[name=slug]", "pix caixa");
await p.waitForTimeout(800);
passo(
  "endereço com cara de banco é barrado no cadastro",
  (await p.textContent(ESTADO_DO_ENDERECO)).includes("palavra restrita"),
);

// ---------------------------------------------------------------------------
// A categoria monta a página antes de o dono preencher qualquer coisa
// ---------------------------------------------------------------------------

await p.goto(`${BASE}/criar`, { waitUntil: "load" });
const opcoes = "input[name=categoria]";
const todasAsCategorias = await p.locator(opcoes).count();

// A busca só filtra depois que o React assume a tela, e a rolagem some antes
// disso. Esperar o resultado, em vez de esperar um tempo fixo, é o que faz o
// teste valer a mesma coisa numa máquina rápida e numa lenta.
await p.fill("input[type=search]", "ensaio");
passo(
  "a busca acha a categoria por como a pessoa fala, e não pelo nome que demos",
  todasAsCategorias > 30 &&
    (await esperar(`${opcoes}[value=fotografia]`)) &&
    (await p.locator(opcoes).count()) < 5,
);

await p.click(`${opcoes}[value=fotografia]`);
passo(
  "a escolha mostra na hora o que ela muda na página",
  await esperar('fieldset [aria-live]:has-text("Começa com Ensaios")'),
);

/*
 * O endereço muda a cada rodada, e isso é conserto de teste, e não capricho.
 *
 * Este passo cria uma página de verdade, e o destino de arquivo local guarda o
 * que ele cria. Com endereço fixo, a segunda rodada da bateria batia em
 * "endereço ocupado" e morria aqui, o que fazia a suíte inteira depender de
 * alguém lembrar de apagar `.dados/negocios.json` antes. Teste que só passa uma
 * vez é teste que ninguém roda duas.
 */
const enderecoNovo = `camila reis ${processo.pid}`;
const slugNovo = enderecoNovo.replace(/ /g, "-");

await p.fill("input[name=nome]", "Camila Reis");
await p.fill("input[name=slug]", enderecoNovo);
await p.waitForTimeout(800);
await p.click('button:has-text("Criar página")');
await p.waitForURL(/criado=1/);

const criada = JSON.parse(await readFile(".dados/negocios.json", "utf8")).find(
  (n) => n.slug === slugNovo,
);
passo(
  "a página nova nasce com a receita da categoria",
  criada?.categoria === "fotografia" &&
    criada.tituloCatalogo === "Ensaios" &&
    criada.mostrarPrecos === false,
);
// ---------------------------------------------------------------------------
// A prévia do cadastro, que só existe no computador
// ---------------------------------------------------------------------------
// Ela mostra o esqueleto que a categoria monta. É a mesma receita que monta a
// página de verdade, então ela precisa mudar quando a escolha muda, senão vira
// desenho decorativo que promete uma coisa e entrega outra.

const monitor = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const g = await monitor.newPage();
await g.goto(`${BASE}/criar`, { waitUntil: "load" });
await g.waitForSelector("[data-previa]");

await g.fill("input[name=nome]", "Rafael Nunes");
await g.click(`${opcoes}[value=fotografia]`);
let previa = await g.textContent("[data-previa]");
passo(
  "a prévia monta a página com o nome digitado, na ordem da categoria",
  previa.includes("Rafael Nunes") &&
    previa.indexOf("Fotos") < previa.indexOf("Ensaios"),
);

await g.click(`${opcoes}[value=confeitaria]`);
previa = await g.textContent("[data-previa]");
passo(
  "e trocar de ramo remonta a prévia, com o catálogo na frente",
  previa.includes("Cardápio") &&
    previa.indexOf("Cardápio") < previa.indexOf("Fotos"),
);
await monitor.close();

// Sem JavaScript a prévia some, e o cadastro continua funcionando. É o que
// separa enfeite de muleta: quem entra por uma rede ruim ou com o JavaScript
// bloqueado ainda consegue criar a página.
const seco = await navegador.newContext({
  ...devices["iPhone 13"],
  javaScriptEnabled: false,
});
const h = await seco.newPage();
await h.goto(`${BASE}/criar`, { waitUntil: "load" });
// Endereço novo a cada rodada, pelo mesmo motivo do passo anterior.
const slugSemScript = `lanche-sem-script-${processo.pid}`;
await h.fill("input[name=nome]", "Lanchonete sem script");
await h.fill("input[name=slug]", slugSemScript);
await h.check(`${opcoes}[value=lanchonete]`);
await h.click('button:has-text("Criar página")');
await h.waitForURL(/painel/, { timeout: 20000 });
await seco.close();

const semScript = JSON.parse(
  await readFile(".dados/negocios.json", "utf8"),
).find((n) => n.slug === slugSemScript);
passo(
  "o cadastro envia com o JavaScript desligado, e a receita vale igual",
  semScript?.categoria === "lanchonete" &&
    semScript.tituloCatalogo === "Cardápio",
);

passo(
  "e nasce vazia, sem herdar nada da página de exemplo",
  criada?.frase === null &&
    criada.whatsapp === null &&
    criada.itens.length === 0 &&
    criada.publicado === false,
);

await p.goto(`${BASE}/demo`, { waitUntil: "load" });
await p.click('a:has-text("Denunciar esta página")');
await p.waitForSelector("#slug");
passo(
  "a denúncia abre já com o endereço da página preenchido",
  (await p.inputValue("#slug")) === "demo",
);

await p.click('input[value="golpe"]');
await p.fill("#detalhe", "O botão de agendar leva para uma página de Pix.");
await p.click('button:has-text("Enviar denúncia")');
await p.waitForSelector("h1:has-text('Denúncia recebida')");
passo(
  "e termina numa confirmação, sem pedir e-mail",
  !(await p.textContent("body")).includes("Seu e-mail"),
);

// ---------------------------------------------------------------------------
// A recusa do servidor devolve a tela com o que a pessoa escreveu
// ---------------------------------------------------------------------------

/*
 * O pior defeito que este painel já teve, e ele aconteceu com a dona do
 * produto: ela preencheu a tela de negócio, salvou, o servidor recusou um campo
 * e a tela voltou em branco. A ação confere, chama `redirect` para `?erro=`, e a
 * página é montada de novo lendo do banco, então o que ainda não tinha sido
 * gravado desaparecia. Quem devolve é `app/painel/PreservarDigitado.tsx`.
 *
 * Fica no fim de propósito: mexe nos campos da página criada mais acima e
 * termina desfazendo o que escreveu, para nenhum passo anterior depender disto.
 */
await p.goto(`${BASE}/painel/negocio`, { waitUntil: "networkidle" });

/*
 * O endereço é uma pergunta com duas respostas, e ela já vem respondida: quem
 * tem categoria de ramo que costuma atender de outro jeito abre a tela com
 * "prefiro deixar de fora" marcado. Ver app/painel/negocio/page.tsx, e o
 * comentário no topo de componentes/painel/EscolhaDoEndereco.tsx: a regra vem da
 * receita de lib/categorias.ts, e não da tela. O CEP daqui de baixo é um campo
 * que só existe do lado do "sim", então responder vem antes de digitar.
 *
 * O clique é forçado porque o rádio de verdade fica escondido embaixo do cartão
 * que a pessoa toca, e é o cartão inteiro que é o alvo.
 */
async function abrirEndereco() {
  const sim = p.locator("input[name=enderecoNaPagina][value=sim]");
  if (!(await sim.isChecked())) await sim.click({ force: true });
}

const fraseDoBanco = await p.inputValue("#frase");
await p.fill("#nome", "Nome digitado e ainda por salvar");
await p.fill("#frase", "Frase digitada e ainda por salvar");
await abrirEndereco();
await p.fill("#cep", "abc12");
await p.click('button:has-text("Salvar")');
await p.waitForURL(/erro=cep/, { timeout: 20000 });
await p.waitForTimeout(1200);

passo(
  "a recusa de um campo do endereço volta com o endereço à mostra",
  (await p.locator("#cep").isVisible()) &&
    (await p.locator("input[name=enderecoNaPagina][value=sim]").isChecked()),
);

passo(
  "a recusa do servidor devolve a tela com o nome que a pessoa digitou",
  (await p.inputValue("#nome")) === "Nome digitado e ainda por salvar",
);
passo(
  "e com a frase também, que nunca chegou ao banco",
  (await p.inputValue("#frase")) === "Frase digitada e ainda por salvar",
);
passo(
  "e o campo recusado continua à vista para ela corrigir",
  (await p.inputValue("#cep")) === "abc12",
);

// Salva de verdade e confere que o rascunho sai do navegador.
await abrirEndereco();
await p.fill("#cep", "");
await p.fill("#frase", fraseDoBanco ?? "");
await p.click('button:has-text("Salvar")');
await p.waitForURL(/salvo=1/, { timeout: 20000 });
await p.waitForTimeout(800);
passo(
  "e o rascunho sai do navegador assim que a gravação passa",
  (await p.evaluate(() => sessionStorage.getItem("entrais:digitado"))) === null,
);

await navegador.close();

console.log(
  falhas === 0 ? "\ntudo passou" : `\n${falhas} passo(s) falharam`,
);
process.exit(falhas === 0 ? 0 : 1);
