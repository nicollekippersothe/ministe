/**
 * Teste de ponta a ponta contra o Supabase de verdade.
 *
 * O teste de fluxo (testes/fluxo.mjs) roda contra o arquivo local, e é ele que
 * cobre o caminho inteiro de edição. Este aqui cobre o que só existe com banco:
 * a conta provisória, a RLS, o cache da página pública e a recusa de publicar
 * antes do Google.
 *
 * Existe porque dois erros passaram batido por não ter isto:
 *
 * 1. A página pública falava pelo cliente de sessão. Ler cookie e guardar em
 *    cache são incompatíveis, e endereço desconhecido respondia 500 em vez da
 *    tela de "este endereço está disponível". As páginas de exemplo respondem
 *    antes de tocar no banco, então tudo que se costuma abrir funcionava.
 * 2. Só aparece em build de produção. Em `npm run dev` tudo é dinâmico e o erro
 *    some.
 *
 * Como rodar:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
 *     npm run build && MODO_VITRINE=1 PORT=3010 npm start   (num terminal)
 *   BASE=http://localhost:3010 SUPABASE=https://....supabase.co \
 *     CHAVE=sb_publishable_... npm run supabase              (no outro)
 *
 * Cria uma página no banco de verdade e apaga no fim, com a mesma sessão que
 * criou. A chave é a publicável, nunca a secreta.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3010";
const SUPABASE = process.env.SUPABASE ?? "";
const CHAVE = process.env.CHAVE ?? "";
const EXECUTAVEL = process.env.CHROMIUM;
const SLUG = process.env.SLUG ?? "teste-automatico-apagar";

if (!SUPABASE || !CHAVE) {
  console.error("falta SUPABASE=https://....supabase.co e CHAVE=sb_publishable_...");
  process.exit(1);
}

let falhas = 0;
const passo = (nome, ok) => {
  console.log(`${ok ? "  ok  " : "FALHOU"} ${nome}`);
  if (!ok) falhas++;
};

async function esperar(p, seletor, tempo = 8000) {
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
// A página pública, que é guardada em cache e por isso não pode ler cookie
// ---------------------------------------------------------------------------

const r404 = await p.goto(`${BASE}/endereco-que-ninguem-usou-ainda`, {
  waitUntil: "load",
});
passo(
  "endereço desconhecido responde 404, e não erro de servidor",
  r404.status() === 404,
);
passo(
  "e oferece o endereço em vez de mostrar uma tela de erro",
  (await p.textContent("body")).includes("Este endereço está disponível"),
);

const rDemo = await p.goto(`${BASE}/demo`, { waitUntil: "load" });
passo("a página de exemplo continua abrindo", rDemo.status() === 200);

// ---------------------------------------------------------------------------
// O cadastro, na conta provisória
// ---------------------------------------------------------------------------

await p.goto(`${BASE}/criar`, { waitUntil: "load" });
passo(
  "o cadastro abre, em vez de responder 404",
  (await p.textContent("body")).includes("Criar sua página"),
);

await p.fill("input[name=nome]", "Teste Automático");
await p.fill("input[name=slug]", SLUG);
passo(
  "o endereço é conferido pelo banco, pela função endereco_livre",
  await esperar(p, '[aria-live]:has-text("disponível")'),
);

await p.fill("input[type=search]", "ensaio");
await esperar(p, "input[name=categoria][value=fotografia]");
await p.click("input[name=categoria][value=fotografia]");
await p.click('button:has-text("Criar página")');
await p.waitForURL(/painel/, { timeout: 25000 });

const painel = await p.textContent("body");
passo("criar página leva para o painel", p.url().includes("criado=1"));
passo(
  "a página nasce só para a dona, no endereço escolhido",
  painel.includes("Só para você") && painel.includes(SLUG),
);
passo(
  "e o painel oferece entrar com o Google para publicar",
  painel.includes("Entrar e publicar"),
);

const rRascunho = await p.goto(`${BASE}/${SLUG}`, { waitUntil: "load" });
passo(
  "o rascunho fica fora do ar, mesmo para quem sabe o endereço",
  rRascunho.status() === 404,
);

await p.goto(`${BASE}/painel`, { waitUntil: "load" });
await p.click('button:has-text("Entrar e publicar")');
await p.waitForURL(/entrar/, { timeout: 25000 });
passo(
  "publicar de conta provisória leva para o Google, e não para um erro",
  (await p.textContent("body")).includes("continua sendo sua"),
);

// ---------------------------------------------------------------------------
// Limpeza: apaga a linha criada, com a sessão que a criou
// ---------------------------------------------------------------------------

const partes = (await contexto.cookies())
  .filter((c) => c.name.includes("auth-token"))
  .sort((a, b) => a.name.localeCompare(b.name));

let bruto = partes.map((c) => c.value).join("");
if (bruto.startsWith("base64-")) {
  bruto = Buffer.from(bruto.slice(7), "base64").toString("utf8");
}
const token = JSON.parse(bruto).access_token;

const apagou = await fetch(`${SUPABASE}/rest/v1/negocios?slug=eq.${SLUG}`, {
  method: "DELETE",
  headers: {
    apikey: CHAVE,
    Authorization: `Bearer ${token}`,
    Prefer: "return=representation",
  },
});
const linhas = await apagou.json();
passo(
  "a linha de teste saiu do banco, que fica como estava",
  apagou.ok && linhas.length === 1,
);

await navegador.close();
console.log(falhas === 0 ? "\ntudo passou" : `\n${falhas} passo(s) falharam`);
process.exit(falhas === 0 ? 0 : 1);
