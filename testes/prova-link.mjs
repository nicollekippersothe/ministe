/*
 * Prova de navegador do link que nasce do nome, em /criar.
 *
 * Temporário: escrito para conferir o item 4 da auditoria e apagado em
 * seguida. O que ele prova de forma permanente virou passo em testes/fluxo.mjs.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const EXECUTAVEL =
  process.env.CHROMIUM ??
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

let falhas = 0;
const passo = (nome, ok, extra = "") => {
  console.log(`${ok ? "  ok  " : "FALHOU"} ${nome}${extra ? `   [${extra}]` : ""}`);
  if (!ok) falhas++;
};

const navegador = await chromium.launch({ executablePath: EXECUTAVEL });
const contexto = await navegador.newContext({ ...devices["iPhone 13"] });
const p = await contexto.newPage();

const ESTADO = '[id$="-estado"][aria-live]';

// Quantas vezes o navegador pergunta ao servidor enquanto a pessoa digita.
let consultas = 0;
p.on("request", (r) => {
  if (r.url().includes("/api/endereco")) consultas++;
});

await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: "networkidle" });

// ---------------------------------------------------------------- nasce do nome
consultas = 0;
await p.click('input[name="nome"]');
await p.type('input[name="nome"]', "Ateliê da Nicolle", { delay: 45 });
await p.waitForTimeout(1200);

passo(
  "o link nasce do nome, a cada tecla",
  (await p.inputValue('input[name="slug"]')) === "atelie-da-nicolle",
  await p.inputValue('input[name="slug"]'),
);
passo(
  "e a placa acende sozinha",
  (await p.textContent(ESTADO)).includes("disponível"),
  (await p.textContent(ESTADO)).trim(),
);
passo(
  "dezessete teclas, uma consulta só",
  consultas === 1,
  `${consultas} consulta(s) a /api/endereco`,
);

// Largura de verdade do campo no iPhone 13, para o comentário poder dizer a
// medida em vez de um palpite.
const larguras = await p.evaluate(() => {
  const campo = document.querySelector('input[name="slug"]');
  const nome = document.querySelector('input[name="nome"]');
  return {
    campo: Math.round(campo.getBoundingClientRect().width),
    altura: Math.round(campo.getBoundingClientRect().height),
    distanciaDoNome: Math.round(
      campo.getBoundingClientRect().top - nome.getBoundingClientRect().bottom,
    ),
    topo: Math.round(campo.getBoundingClientRect().top + window.scrollY),
  };
});
console.log("       medida", JSON.stringify(larguras));

// ------------------------------------------------- a mão corta a derivação
await p.fill('input[name="slug"]', "nicolle-ceramica");
await p.click('input[name="nome"]');
await p.type('input[name="nome"]', " Ateliê", { delay: 30 });
await p.waitForTimeout(900);
passo(
  "editado à mão, o link para de receber o nome",
  (await p.inputValue('input[name="slug"]')) === "nicolle-ceramica",
  await p.inputValue('input[name="slug"]'),
);

// ------------------------------------------------------------ link ocupado
// "demo" é reservado, e reservado é outra recusa. O ocupado de verdade é uma
// página que existe no destino local, e por isso o nome do teste sem script.
await p.fill('input[name="slug"]', "lanche sem script 3821");
await p.waitForTimeout(900);
const ocupado = await p.textContent("body");
passo(
  "link ocupado continua recusado, com a porta de entrar ao lado",
  ocupado.includes("já está em uso") && ocupado.includes("Esse link é seu?"),
  (await p.textContent(ESTADO)).trim(),
);

// E o mesmo link, agora nascido do nome, precisa recusar igual.
await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: "networkidle" });
await p.type('input[name="nome"]', "Lanche sem script 3821", { delay: 20 });
await p.waitForTimeout(1200);
passo(
  "e recusa igual quando o link ocupado veio do nome",
  (await p.textContent("body")).includes("já está em uso"),
  (await p.textContent(ESTADO)).trim(),
);

// ------------------------------------------- recusa do servidor volta escrita
await p.goto(`${BASE}/criar?erro=ocupado&nome=Camila%20Reis&slug=demo`, {
  waitUntil: "networkidle",
});
await p.waitForTimeout(900);
passo(
  "voltando de um envio recusado, o link recusado fica em pé",
  (await p.inputValue('input[name="slug"]')) === "demo" &&
    (await p.textContent("body")).includes("já está em uso"),
  await p.inputValue('input[name="slug"]'),
);

// -------------------------------------------------- guardado e restaurado
await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: "networkidle" });
await p.fill('input[name="nome"]', "Padaria Lua");
await p.waitForTimeout(900);
await p.goto(`${BASE}/`, { waitUntil: "load" });
await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
await p.waitForTimeout(900);
passo(
  "voltando dias depois, o link renasce do nome guardado",
  (await p.inputValue('input[name="nome"]')) === "Padaria Lua" &&
    (await p.inputValue('input[name="slug"]')) === "padaria-lua",
  await p.inputValue('input[name="slug"]'),
);
await p.evaluate(() => localStorage.clear());

// ------------------------------------------------ envio sem JavaScript
const seco = await navegador.newContext({
  ...devices["iPhone 13"],
  javaScriptEnabled: false,
});
const h = await seco.newPage();
await h.goto(`${BASE}/criar`, { waitUntil: "load" });
const slugSeco = `prova-sem-script-${process.pid}`;
await h.fill('input[name="nome"]', "Prova sem script");
await h.fill('input[name="slug"]', slugSeco);
await h.check('input[name="categoria"][value=lanchonete]');
await h.click('button:has-text("Criar página")');
const chegou = await h
  .waitForURL(/painel/, { timeout: 20000 })
  .then(() => true)
  .catch(() => false);
passo("com o JavaScript desligado, o cadastro envia igual", chegou, h.url());
await seco.close();

await navegador.close();
console.log(falhas === 0 ? "\ntudo de pé" : `\n${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
