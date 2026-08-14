import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIAS, RECEITA_PADRAO } from "./categorias.ts";
import { montar } from "./novo.ts";

test("a receita da categoria monta a página, campo por campo", () => {
  const foto = montar("ana", "Ana Fotografia", "fotografia");
  strictEqual(foto.tituloCatalogo, "Ensaios");
  strictEqual(foto.mostrarPrecos, false);

  const bolo = montar("ana", "Doces da Ana", "confeitaria");
  strictEqual(bolo.tituloCatalogo, "Cardápio");
  strictEqual(bolo.mostrarPrecos, true);
});

test("categoria vazia ou desconhecida cai na receita padrão", () => {
  // A regressão que este teste guarda: a montagem já copiou o negócio de
  // exemplo, que é uma confeitaria, e toda página nova nascia com "Cardápio".
  for (const c of [null, "inexistente"]) {
    const n = montar("ana", "Ana", c);
    strictEqual(n.tituloCatalogo, RECEITA_PADRAO.tituloCatalogo);
    strictEqual(n.mostrarPrecos, RECEITA_PADRAO.mostrarPrecos);
  }
});

test("toda categoria da lista monta uma página inteira", () => {
  for (const c of CATEGORIAS) {
    const n = montar("ana", "Ana", c.id);
    strictEqual(n.categoria, c.id, c.id);
    strictEqual(n.tituloCatalogo, c.tituloCatalogo, c.id);
    strictEqual(n.mostrarPrecos, c.mostrarPrecos, c.id);
  }
});

test("a página nova chega vazia e fora do ar", () => {
  const n = montar("ana", "Ana");
  strictEqual(n.publicado, false, "página nova chegou publicada");
  strictEqual(n.plano, "gratuito");
  deepStrictEqual([n.itens, n.galeria, n.links, n.horarios], [[], [], [], []]);

  // Campo de conteúdo do exemplo que vazasse para cá viraria dado inventado
  // na página de outra pessoa, que é a regra que o projeto mais protege.
  for (const campo of [
    n.frase,
    n.logo,
    n.capa,
    n.whatsapp,
    n.telefone,
    n.endereco,
    n.cidade,
    n.mapsUrl,
    n.mensagemItem,
    n.slugAnterior,
    n.acaoPrincipal,
  ]) {
    strictEqual(campo, null);
  }
});

test("o texto livre acompanha a categoria vazia, e some quando há escolha", () => {
  strictEqual(montar("ana", "Ana", null, "apicultura").categoriaLivre, "apicultura");
  strictEqual(montar("ana", "Ana", "confeitaria").categoriaLivre, null);
});
