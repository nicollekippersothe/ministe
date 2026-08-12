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
import { chromium, devices } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const EXECUTAVEL = process.env.CHROMIUM;

let falhas = 0;

function passo(nome, ok) {
  console.log(`${ok ? "  ok  " : "FALHOU"} ${nome}`);
  if (!ok) falhas++;
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
  (await p.textContent("body")).includes("Criar minha página"),
);

await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
await p.fill("input[name=slug]", "Doceria da Ana!!");
await p.waitForTimeout(800);
passo(
  "o endereço é limpo e conferido enquanto digita",
  (await p.textContent("[aria-live]")).includes("/doceria-da-ana"),
);

await p.fill("input[name=slug]", "painel");
await p.waitForTimeout(800);
passo(
  "endereço reservado é avisado na hora",
  (await p.textContent("[aria-live]")).includes("reservado pelo sistema"),
);

await p.fill("input[name=slug]", "demo");
await p.waitForTimeout(800);
passo(
  "endereço já ocupado é avisado na hora",
  (await p.textContent("[aria-live]")).length > 0,
);

await p.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
await p.fill("#email", "ana@exemplo.com");
await p.click('button[type="submit"]');
await p.waitForURL(/enviado/);
passo(
  "entrar leva para a tela de confira seu e-mail",
  (await p.textContent("body")).includes("Confira seu e-mail"),
);

// ---------------------------------------------------------------------------
// Painel
// ---------------------------------------------------------------------------

await p.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
passo("o painel mostra o estado da página", (await p.textContent("body")).includes("No ar"));

await p.goto(`${BASE}/painel/negocio`, { waitUntil: "networkidle" });
await p.fill("#nome", "Cantinho da Rô, Doces e Salgados");
await p.fill("#frase", "Bolo de pote, torta e salgado de festa, por encomenda.");
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
passo("a página pública mostra o nome novo", publica.includes("Cantinho da Rô, Doces"));
passo("a página pública mostra a frase nova", publica.includes("Bolo de pote"));
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
    if (r.url().includes(".woff2")) vistas.add(r.url());
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

await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
passo(
  "a página gratuita usa a letra padrão",
  (await p.getAttribute("[data-fonte]", "data-fonte")) === "moderno",
);
passo(
  "a página do plano pago usa a letra escolhida",
  (await (await p.goto(`${BASE}/studio-raiz`)) &&
    (await p.getAttribute("[data-fonte]", "data-fonte"))) === "editorial",
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

await p.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
passo(
  "o iFood aparece ao lado do WhatsApp na doceria",
  (await p.textContent("body")).includes("Pedir pelo iFood"),
);
passo(
  "o rodapé feito com Entrais some no plano pago",
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

const sabado = await p.evaluate(() =>
  [0, 1, 2].map((i) => [
    document.querySelector(`#h-6-${i}-abre`).value,
    document.querySelector(`#h-6-${i}-fecha`).value,
  ]),
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
// Publicar e tirar do ar
// ---------------------------------------------------------------------------

await p.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
await p.click('button:has-text("Tirar do ar")');
await p.waitForSelector('button:has-text("Publicar")');
passo("tirar do ar vira rascunho", (await p.textContent("body")).includes("Rascunho"));

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
await p.click('button:has-text("Publicar")');
await p.waitForSelector('button:has-text("Tirar do ar")');
const dentro = await p.goto(`${BASE}/demo`);
passo("publicar coloca de volta no ar", dentro.status() === 200);

await navegador.close();

console.log(
  falhas === 0 ? "\ntudo passou" : `\n${falhas} passo(s) falharam`,
);
process.exit(falhas === 0 ? 0 : 1);
