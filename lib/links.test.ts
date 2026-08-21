import assert from "node:assert/strict";
import { test } from "node:test";
import { conferirLink, MOTIVOS_LINK } from "./links.ts";

function recusa(entrada: string) {
  const r = conferirLink(entrada);
  return r.ok ? null : r.motivo;
}

function aceita(entrada: string) {
  const r = conferirLink(entrada);
  return r.ok ? r.url : null;
}

test("endereço normal passa", () => {
  assert.equal(aceita("https://www.doceria.com.br"), "https://www.doceria.com.br/");
  assert.equal(
    aceita("https://calendly.com/marina/consulta"),
    "https://calendly.com/marina/consulta",
  );
});

test("quem não digita https não é reprovado por isso", () => {
  assert.equal(aceita("doceria.com.br"), "https://doceria.com.br/");
  assert.equal(aceita("www.doceria.com.br/cardapio"), "https://www.doceria.com.br/cardapio");
});

test("barra faltando é erro de digitação, não recusa", () => {
  assert.equal(aceita("https:/doceria.com.br"), "https://doceria.com.br/");
  assert.equal(aceita("https:doceria.com.br"), "https://doceria.com.br/");
});

test("http vira https", () => {
  assert.equal(aceita("http://doceria.com.br"), "https://doceria.com.br/");
});

test("javascript no botão é recusado", () => {
  assert.equal(recusa("javascript:alert(1)"), "esquema");
  assert.equal(recusa("JavaScript:alert(1)"), "esquema");
  assert.equal(recusa("data:text/html,<script>alert(1)</script>"), "esquema");
  assert.equal(recusa("vbscript:msgbox(1)"), "esquema");
  assert.equal(recusa("file:///etc/passwd"), "esquema");
});

test("caractere invisível no meio do esquema não escapa", () => {
  assert.equal(recusa("java\u200bscript:alert(1)"), "esquema");
  assert.equal(recusa("\ufeffjavascript:alert(1)"), "esquema");
  assert.equal(recusa("java\u00adscript:alert(1)"), "esquema");
});

test("usuário antes do arroba é disfarce de endereço", () => {
  // Isto abre site-falso.net, não o Nubank.
  assert.equal(recusa("https://nubank.com.br@site-falso.net"), "usuario");
});

test("encurtador é recusado, porque esconde o destino", () => {
  assert.equal(recusa("https://bit.ly/3xYz"), "encurtador");
  assert.equal(recusa("bit.ly/3xYz"), "encurtador");
  assert.equal(recusa("https://www.tinyurl.com/abc"), "encurtador");
  assert.equal(recusa("https://encurtador.com.br/abc"), "encurtador");
});

test("o wa.me continua passando, que é o link do próprio produto", () => {
  assert.equal(aceita("https://wa.me/5511999999999"), "https://wa.me/5511999999999");
});

test("número de servidor no lugar do site é recusado", () => {
  assert.equal(recusa("http://185.199.108.153/pagamento"), "endereco_ip");
  assert.equal(recusa("http://[2001:db8::1]/"), "endereco_ip");
});

test("host sem domínio é recusado", () => {
  assert.equal(recusa("http://localhost:3000"), "sem_dominio");
  assert.equal(recusa("http://intranet/pedido"), "sem_dominio");
});

test("vazio e lixo têm motivo próprio", () => {
  assert.equal(recusa(""), "vazio");
  assert.equal(recusa("   "), "vazio");
  assert.equal(conferirLink(null).ok, false);
  assert.equal(recusa("https://"), "invalido");
});

test("o endereço gravado é o normalizado, não o que foi digitado", () => {
  // Maiúscula no host e ponto final são normalizados pela URL, e é o
  // resultado que vai para o banco.
  assert.equal(aceita("https://Doceria.COM.BR."), "https://doceria.com.br/");
});

/**
 * A regra de escrita do projeto vale aqui também, e este arquivo escapou dela
 * por um bom tempo.
 *
 * Estas frases vão para a tela pelo `Aviso` do painel, então elas são texto de
 * produto, e não mensagem de log. A regra do AGENTS.md é que cada frase diz o
 * que existe: quem está com um link recusado na mão precisa de uma saída, e
 * "endereço inválido" é só o anúncio da derrota. O mesmo teste existe em
 * lib/pagamento/erros.test.ts e em lib/dados/erros.test.ts, pelo mesmo motivo.
 */
test("nenhuma frase de recusa usa palavra negativa", () => {
  const NEGATIVA = /\b(n[ãa]o|sem|nunca|jamais|falta|falha|erro|recusad|inv[áa]lid|imposs[íi]vel)/i;
  for (const [motivo, frase] of Object.entries(MOTIVOS_LINK)) {
    assert.ok(!NEGATIVA.test(frase), `${motivo}: ${frase}`);
    assert.ok(!frase.includes("—"), `${motivo} usa travessão`);
  }
});
