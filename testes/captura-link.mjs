/* Temporário: captura /criar com o ramo e o nome respondidos, para olhar o
 * link nascendo. Apagado depois da revisão. */
import { chromium, devices } from "playwright";

const BASE = "http://localhost:3000";
const EXECUTAVEL =
  process.env.CHROMIUM ??
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const saida = process.argv[2] ?? "/tmp/medidas";

const navegador = await chromium.launch({ executablePath: EXECUTAVEL });

for (const [nome, ctx] of [
  ["celular", { ...devices["iPhone 13"] }],
  ["monitor", { viewport: { width: 1440, height: 900 } }],
]) {
  const contexto = await navegador.newContext(ctx);
  const p = await contexto.newPage();
  await p.goto(`${BASE}/criar`, { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle" });
  await p.fill('input[type="search"]', "ceramica");
  await p.waitForTimeout(400);
  const artesanato = p.locator('input[name="categoria"]').first();
  await artesanato.check();
  await p.fill('input[name="nome"]', "Ateliê da Nicolle");
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.activeElement?.blur());
  // Sem fullPage: a barra grudada do botão desenha por cima do miolo quando a
  // captura junta a página inteira, e o que interessa aqui é o par nome + link.
  await p.locator('input[name="slug"]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await p.screenshot({
    path: `${saida}/criar-preenchido-${nome}.png`,
    caret: "initial",
  });
  await contexto.close();
}

await navegador.close();
console.log("capturas em", saida);
