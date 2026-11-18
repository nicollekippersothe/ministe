/**
 * O cadastro no celular, tela por tela, com o dedo e não com o mouse.
 *
 *   npm run dev            # num terminal
 *   npm run cadastro:mobile
 *
 * Roda em dois aparelhos: 390x844 (iPhone atual) e 375x667 (o menor que ainda
 * circula). Confere o que a gente já se enganou antes de olhar a tela:
 *
 *   - nenhuma tela rola para o lado;
 *   - nenhum erro de console;
 *   - o botão de criar está à vista na primeira tela, e tem 44px ou mais;
 *   - todo botão e todo link fora de frase tem 44px de altura ou mais;
 *   - nenhum texto de leitura abaixo de 12px (o menor degrau da escala);
 *   - o fluxo inteiro funciona: ramo, nome, link reservado, link livre, criar;
 *   - a palavra é "página", como na tela inicial, e não "galeria".
 *
 * Os prints saem em SAIDA (padrão: /tmp/cadastro-mobile) para olhar com os olhos
 * o que a asserção não pega.
 *
 * Precisa do servidor rodando e do armazenamento local (sem Supabase). Variáveis:
 *   BASE       endereço do servidor (padrão http://localhost:3000)
 *   CHROMIUM   caminho do Chromium, se o do Playwright não estiver instalado
 *   SAIDA      pasta dos prints
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SAIDA = process.env.SAIDA ?? "/tmp/cadastro-mobile";
const EXECUTAVEL = process.env.CHROMIUM;

const APARELHOS = [
  { nome: "390x844", largura: 390, altura: 844 },
  { nome: "375x667", largura: 375, altura: 667 },
];

const TELAS = ["/criar", "/entrar", "/entrar?motivo=publicar", "/entrar/ajuda"];

let falhas = 0;
function passo(nome, ok, detalhe = "") {
  if (!ok) falhas += 1;
  console.log(`  ${ok ? "ok  " : "FALHOU"} ${nome}${!ok && detalhe ? `  → ${detalhe}` : ""}`);
}

/** Roda dentro da página: o que a tela tem de errado em tamanho e texto. */
function auditar() {
  const visivel = (e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  };
  const emFrase = (e) => e.closest("p, li") !== null && e.tagName === "A";

  const alvos = [...document.querySelectorAll("button, a[href], select")]
    .filter(visivel)
    .filter((e) => !emFrase(e))
    .filter((e) => e.getBoundingClientRect().height < 43.5)
    .map((e) => `${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 24)}" ${Math.round(e.getBoundingClientRect().height)}px`);

  const pequenos = [...document.querySelectorAll("p, li, label, span, a, button, h1, h2, h3")]
    .filter(visivel)
    .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 3))
    .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12)
    .filter((e) => !e.closest("[aria-hidden='true']"))
    .map((e) => `${parseFloat(getComputedStyle(e).fontSize).toFixed(1)}px "${e.textContent.trim().slice(0, 30)}"`);

  return {
    lateral: document.documentElement.scrollWidth - window.innerWidth,
    alvos: [...new Set(alvos)],
    pequenos: [...new Set(pequenos)],
    texto: document.body.innerText,
  };
}

await mkdir(SAIDA, { recursive: true });
const navegador = await chromium.launch(EXECUTAVEL ? { executablePath: EXECUTAVEL } : {});

for (const ap of APARELHOS) {
  console.log(`\n${ap.nome}`);
  const contexto = await navegador.newContext({
    viewport: { width: ap.largura, height: ap.altura },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const p = await contexto.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => {
    // O painel de desenvolvimento do Next reclama de coisas que o build não tem.
    if (m.type() === "error" && !/devtools|Download the React DevTools/i.test(m.text())) erros.push(m.text().slice(0, 120));
  });

  // -------------------------------------------------------------------------
  // Cada tela do cadastro
  // -------------------------------------------------------------------------
  for (const rota of TELAS) {
    await p.goto(BASE + rota, { waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    const r = await p.evaluate(auditar);
    const nomeDaTela = rota.replace(/[/?=]/g, "_");
    await p.screenshot({ path: `${SAIDA}/${ap.nome}${nomeDaTela}.png` });

    passo(`${rota}: não rola para o lado`, r.lateral <= 0, `${r.lateral}px a mais`);
    passo(`${rota}: botões e links com 44px ou mais`, r.alvos.length === 0, r.alvos.join("; "));
    passo(`${rota}: nenhum texto abaixo de 12px`, r.pequenos.length === 0, r.pequenos.join("; "));
    passo(`${rota}: diz "página", e não "galeria"`, !/galeria/i.test(r.texto.replace(/Galeria\s*\n/g, "")), "achou a palavra galeria");
  }

  // -------------------------------------------------------------------------
  // O botão de criar na primeira tela
  // -------------------------------------------------------------------------
  await p.goto(BASE + "/criar", { waitUntil: "networkidle" });
  const botao = p.locator('button[type="submit"]');
  const caixa = await botao.boundingBox();
  passo(
    "criar: o botão está à vista sem rolar",
    caixa !== null && caixa.y + caixa.height <= ap.altura,
    caixa ? `termina em ${Math.round(caixa.y + caixa.height)} de ${ap.altura}` : "sem caixa",
  );
  passo("criar: o botão tem 44px ou mais", caixa !== null && caixa.height >= 44, caixa ? `${Math.round(caixa.height)}px` : "");

  // -------------------------------------------------------------------------
  // O fluxo, com o dedo
  // -------------------------------------------------------------------------
  await p.fill('input[type="search"], input[role="combobox"]', "psic");
  const opcao = p.getByRole("radio").first();
  await opcao.click();
  passo("criar: escolher o ramo marca a opção", await opcao.isChecked());
  await p.screenshot({ path: `${SAIDA}/${ap.nome}_fluxo_ramo.png` });

  await p.fill("input[name=nome]", "Camila Reis");

  await p.fill("input[name=slug]", "painel");
  await p.waitForTimeout(1000);
  const reservado = await p.locator("form").innerText();
  passo("criar: endereço reservado avisa com texto, e não só com cor", /reservado/i.test(reservado));
  passo("criar: o campo marca o erro para o leitor de tela", (await p.getAttribute("input[name=slug]", "aria-invalid")) === "true");
  await p.screenshot({ path: `${SAIDA}/${ap.nome}_fluxo_reservado.png` });

  const unico = `camila-${Date.now().toString(36)}`;
  await p.fill("input[name=slug]", unico);
  await p.waitForTimeout(1200);
  passo("criar: endereço livre avisa que está disponível", /dispon[ií]vel/i.test(await p.locator("form").innerText()));
  await p.screenshot({ path: `${SAIDA}/${ap.nome}_fluxo_livre.png` });

  await botao.click();
  await p.waitForURL(/\/painel/, { timeout: 20000 }).catch(() => {});
  passo("criar: enviar leva ao painel", /\/painel/.test(p.url()), p.url());
  await p.waitForTimeout(800);
  const painel = await p.evaluate(auditar);
  await p.screenshot({ path: `${SAIDA}/${ap.nome}_painel.png` });
  passo("painel logo depois de criar: não rola para o lado", painel.lateral <= 0, `${painel.lateral}px a mais`);
  passo("painel logo depois de criar: botões com 44px ou mais", painel.alvos.length === 0, painel.alvos.join("; "));

  passo("nenhuma tela deu erro de console", erros.length === 0, erros.slice(0, 2).join(" | "));
  await contexto.close();
}

await navegador.close();
console.log(falhas === 0 ? "\ntudo passou" : `\n${falhas} passo(s) falharam`);
process.exit(falhas === 0 ? 0 : 1);
