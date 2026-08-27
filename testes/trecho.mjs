/* Temporário: roda só os passos novos de /criar da bateria, para conferir sem
 * rodar a bateria inteira. Apagado depois. */
import { chromium, devices } from "playwright";
const BASE = "http://localhost:3000";
const EXECUTAVEL = process.env.CHROMIUM;
const ESTADO_DO_ENDERECO = '[id$="-estado"][aria-live]';
let falhas = 0;
function passo(nome, ok) {
  console.log(`${ok ? "  ok  " : "FALHOU"} ${nome}`);
  if (!ok) falhas++;
}
const navegador = await chromium.launch(EXECUTAVEL ? { executablePath: EXECUTAVEL } : {});
const contexto = await navegador.newContext({ ...devices["iPhone 13"] });
const p = await contexto.newPage();

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

await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: "networkidle" });
await p.locator("input[name=nome]").pressSequentially("Ateliê da Nicolle", { delay: 30 });
await p.waitForTimeout(800);
passo(
  "o link da página nasce do nome, ao vivo",
  (await p.inputValue("input[name=slug]")) === "atelie-da-nicolle" &&
    (await p.textContent(ESTADO_DO_ENDERECO)).includes("disponível"),
);
await p.fill("input[name=slug]", "nicolle-ceramica");
await p.locator("input[name=nome]").pressSequentially(" Cerâmica", { delay: 30 });
await p.waitForTimeout(800);
passo(
  "e escrito à mão, o link para de receber o nome",
  (await p.inputValue("input[name=slug]")) === "nicolle-ceramica",
);
await p.evaluate(() => localStorage.clear());

// o passo do cadastro completo, com a ordem nome -> link
await p.goto(`${BASE}/criar`, { waitUntil: "load" });
const opcoes = "input[name=categoria]";
await p.fill("input[type=search]", "ensaio");
await p.waitForSelector(`${opcoes}[value=fotografia]`);
await p.click(`${opcoes}[value=fotografia]`);
const enderecoNovo = `camila reis ${process.pid}`;
await p.fill("input[name=nome]", "Camila Reis");
await p.fill("input[name=slug]", enderecoNovo);
await p.waitForTimeout(800);
await p.click('button:has-text("Criar página")');
const foi = await p.waitForURL(/criado=1/, { timeout: 15000 }).then(() => true).catch(() => false);
passo("o cadastro inteiro cria a página com o link escrito à mão", foi);

await navegador.close();
console.log(falhas === 0 ? "\ntudo de pé" : `\n${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
