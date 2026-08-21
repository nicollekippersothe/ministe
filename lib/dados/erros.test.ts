import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MOTIVOS_DADOS,
  RecusaDoBanco,
  SAIDA_DA_RECUSA,
  ehRecusaDados,
  mensagemDaRecusa,
  motivoDaRecusa,
  motivoDoErro,
  recusaDoBanco,
  type RecusaDados,
} from "./erros.ts";

/*
 * As mensagens cruas são as de verdade.
 *
 * Cada uma foi copiada do `raise exception` do gatilho em supabase/schema.sql,
 * ou do texto que o próprio Postgres escreve, com o SQLSTATE que vem junto. É
 * isso que dá valor ao teste: se alguém reescrever a frase de um gatilho no
 * SQL, é aqui que a divergência aparece, e não na tela de quem estava salvando.
 */
const CRUS: Array<[RecusaDados, unknown]> = [
  [
    "limite_itens",
    { code: "23514", message: "limite de 20 itens no plano atual" },
  ],
  [
    "limite_fotos_item",
    { code: "23514", message: "limite de 3 fotos por item no plano atual" },
  ],
  [
    "limite_galeria",
    { code: "23514", message: "limite de 12 fotos na galeria no plano atual" },
  ],
  ["limite_links", { code: "23514", message: "limite de 8 links no plano atual" }],
  [
    "limite_horarios",
    { code: "23514", message: "limite de 3 intervalos por dia no plano atual" },
  ],
  [
    "limite_paginas",
    { code: "23514", message: "limite de 1 página(s) por conta no plano atual" },
  ],
  [
    "endereco_reservado",
    { code: "23514", message: "endereço reservado: painel" },
  ],
  [
    "endereco_restrito",
    { code: "23514", message: "endereço com palavra restrita: pix-da-ana" },
  ],
  [
    "endereco_ocupado",
    {
      code: "23505",
      message: 'duplicate key value violates unique constraint "negocios_slug_key"',
      details: "Key (slug)=(doceria-da-ana) already exists.",
    },
  ],
  [
    "conta_confirmada",
    { code: "42501", message: "publicar pede uma conta confirmada" },
  ],
  [
    "campo_obrigatorio",
    {
      code: "23514",
      message:
        'new row for relation "negocios" violates check constraint "nome_preenchido"',
    },
  ],
  [
    "campo_tamanho",
    {
      code: "23514",
      message:
        'new row for relation "negocios" violates check constraint "frase_tamanho"',
    },
  ],
  [
    "campo_formato",
    {
      code: "23514",
      message:
        'new row for relation "negocios" violates check constraint "cep_formato"',
    },
  ],
  [
    "so_do_dono",
    {
      code: "42501",
      message: 'new row violates row-level security policy for table "negocios"',
    },
  ],
  ["sessao", { code: "PGRST301", message: "JWT expired" }],
  ["escrita_recusada", { code: "", message: "TypeError: fetch failed" }],
];

for (const [motivo, cru] of CRUS) {
  test(`a recusa crua de ${motivo} vira o motivo ${motivo}`, () => {
    assert.equal(motivoDoErro(cru), motivo);
  });
}

test("todo motivo do tipo tem uma mensagem crua no teste", () => {
  const cobertos = new Set(CRUS.map(([motivo]) => motivo));
  for (const motivo of Object.keys(MOTIVOS_DADOS)) {
    assert.ok(cobertos.has(motivo as RecusaDados), `${motivo} ficou sem teste`);
  }
});

/*
 * A regra de escrita do projeto, virada em teste. Copiada de
 * lib/pagamento/erros.test.ts, e de propósito: a regra é a mesma, e duas cópias
 * da mesma regex são melhores do que um arquivo de testes puxando o outro.
 *
 * A busca usa `\p{L}` nas bordas em vez de `\b`, porque `\b` em JavaScript
 * enxerga só `[A-Za-z0-9_]`, e aí "não" ficaria com uma borda no meio da
 * palavra por causa do til. Com o limite em letra Unicode, "sem" é pego e
 * "sempre" passaria, "erro" é pego e "ferro" passaria, que é o comportamento
 * certo para uma busca por palavra.
 */
const NEGATIVA =
  /(?<!\p{L})(não|nao|sem|nunca|falh\p{L}*|erro\p{L}*|recusad\p{L}*|inválid\p{L}*|invalid\p{L}*)(?!\p{L})/iu;

/* As frases e os rótulos de saída juntos: os dois vão para a tela. */
const textos: Array<[string, string]> = [
  ...Object.entries(MOTIVOS_DADOS),
  ...Object.entries(SAIDA_DA_RECUSA).map(
    ([motivo, saida]) => [`saída de ${motivo}`, saida!.rotulo] as [string, string],
  ),
];

test("nenhuma frase de recusa usa palavra negativa", () => {
  for (const [motivo, frase] of textos) {
    const achado = frase.match(NEGATIVA);
    assert.equal(
      achado,
      null,
      `${motivo} usa "${achado?.[0]}" na frase: ${frase}`,
    );
  }
});

test("a regra pega o que tem que pegar", () => {
  // Guarda a própria regex: sem isto, um deslize de escrita nela deixaria tudo
  // passar e o teste de cima viraria enfeite.
  assert.ok(NEGATIVA.test("o catálogo não cabe"));
  assert.ok(NEGATIVA.test("página sem espaço"));
  assert.ok(NEGATIVA.test("isso nunca acontece"));
  assert.ok(NEGATIVA.test("falha ao salvar"));
  assert.ok(NEGATIVA.test("houve um erro"));
  assert.ok(NEGATIVA.test("endereço recusado"));
  assert.ok(NEGATIVA.test("dado inválido"));
  // E deixa passar as palavras que só contêm as proibidas por dentro.
  assert.equal(NEGATIVA.test("sempre que possível"), false);
  assert.equal(NEGATIVA.test("portão de ferro"), false);
});

test("nenhuma frase usa travessão", () => {
  for (const [motivo, frase] of textos) {
    assert.equal(/[–—]/.test(frase), false, `${motivo} usa travessão`);
  }
});

test("toda frase é uma frase de verdade, com saída", () => {
  for (const [motivo, frase] of Object.entries(MOTIVOS_DADOS)) {
    assert.ok(frase.length > 20, `${motivo} ficou curto demais`);
    assert.match(frase, /[.!?]$/, `${motivo} ficou sem ponto final`);
    assert.equal(frase, frase.trim(), `${motivo} veio com espaço sobrando`);
  }
});

test("nenhuma frase se repete", () => {
  const frases = Object.values(MOTIVOS_DADOS);
  // Frase repetida em dois motivos é sinal de que um dos dois motivos existe
  // só no tipo e nunca diz nada de novo para quem lê.
  assert.equal(new Set(frases).size, frases.length);
});

/*
 * A parede dos 20 itens é o melhor momento de venda do produto, então a frase
 * dela tem exigência própria: diz o número que o plano de hoje guarda, diz o do
 * plano pago, e leva para a tela onde a assinatura acontece.
 */
test("o limite de itens convida em vez de encerrar", () => {
  const frase = mensagemDaRecusa("limite_itens");
  assert.match(frase, /20/);
  assert.match(frase, /500/);
  assert.match(frase, /plano pago/);
  assert.deepEqual(SAIDA_DA_RECUSA.limite_itens, {
    rotulo: "Ver o plano pago",
    href: "/painel/plano",
  });
});

test("todo limite oferece o caminho do plano pago", () => {
  for (const motivo of Object.keys(MOTIVOS_DADOS) as RecusaDados[]) {
    if (!motivo.startsWith("limite_")) continue;
    assert.equal(
      SAIDA_DA_RECUSA[motivo]?.href,
      "/painel/plano",
      `${motivo} ficou órfão de caminho`,
    );
  }
});

test("toda saída aponta para um caminho de dentro do site", () => {
  for (const [motivo, saida] of Object.entries(SAIDA_DA_RECUSA)) {
    assert.match(saida!.href, /^\/[a-z/?=-]*$/, `${motivo} aponta para fora`);
    assert.ok(saida!.rotulo.length > 4, `${motivo} tem rótulo curto demais`);
  }
});

/*
 * O guarda-chuva é o que troca a tela de 500 por uma frase. Recusa que ninguém
 * previu, gatilho novo escrito depois deste arquivo, banco fora do ar: tudo
 * cai na mesma frase útil.
 */
test("o desconhecido cai no guarda-chuva", () => {
  assert.equal(motivoDoErro({ code: "XX000", message: "algo novo" }), "escrita_recusada");
  assert.equal(motivoDoErro(new Error("quebrou no meio")), "escrita_recusada");
  assert.equal(motivoDoErro(null), "escrita_recusada");
  assert.equal(motivoDoErro(undefined), "escrita_recusada");
  assert.equal(motivoDoErro(""), "escrita_recusada");
  assert.equal(motivoDoErro({}), "escrita_recusada");
  assert.equal(motivoDoErro(42), "escrita_recusada");
});

test("o texto cru da conexão direta também é lido", () => {
  // Sem PostgREST no meio, a exceção chega como Error, com o mesmo texto.
  assert.equal(
    motivoDoErro(new Error("limite de 20 itens no plano atual")),
    "limite_itens",
  );
  assert.equal(motivoDoErro("endereço reservado: entrar"), "endereco_reservado");
});

/*
 * O `details` traz a linha inteira que o banco recusou, com o texto que o dono
 * escreveu dentro. Alguém que escrevesse "limite de 20 itens no plano atual" na
 * frase do negócio conseguiria mudar a frase da tela de qualquer outra recusa,
 * e é por isso que só o `message` é lido.
 */
test("o texto que o dono escreveu passa longe da tradução", () => {
  const erro = {
    code: "23514",
    message:
      'new row for relation "negocios" violates check constraint "cep_formato"',
    details:
      "Failing row contains (doceria, limite de 20 itens no plano atual, ...).",
  };
  assert.equal(motivoDoErro(erro), "campo_formato");
});

test("o gatilho de endereço já usado e a chave única caem no mesmo motivo", () => {
  assert.equal(
    motivoDoErro({
      code: "23505",
      message: "endereço já usado por outro negócio: doceria-da-ana",
    }),
    "endereco_ocupado",
  );
  assert.equal(
    motivoDoErro({
      code: "23505",
      message:
        'duplicate key value violates unique constraint "negocios_slug_anterior_key"',
    }),
    "endereco_ocupado",
  );
});

test("constraint nova nasce com frase, pela convenção de nome", () => {
  const violacao = (nome: string) => ({
    code: "23514",
    message: `new row for relation "itens" violates check constraint "${nome}"`,
  });
  assert.equal(motivoDoErro(violacao("titulo_preenchido")), "campo_obrigatorio");
  assert.equal(motivoDoErro(violacao("descricao_tamanho")), "campo_tamanho");
  assert.equal(motivoDoErro(violacao("preco_nao_negativo")), "campo_formato");
  assert.equal(motivoDoErro(violacao("icone_conhecido")), "campo_formato");
  assert.equal(motivoDoErro(violacao("fuso_valido")), "campo_formato");
});

test("coluna obrigatória em branco e texto longo demais têm motivo próprio", () => {
  assert.equal(
    motivoDoErro({
      code: "23502",
      message:
        'null value in column "titulo" of relation "itens" violates not-null constraint',
    }),
    "campo_obrigatorio",
  );
  assert.equal(
    motivoDoErro({ code: "22001", message: "value too long for type character(2)" }),
    "campo_tamanho",
  );
});

test("a recusa embrulhada carrega o motivo e guarda o texto cru", () => {
  const recusa = recusaDoBanco({
    code: "23514",
    message: "limite de 20 itens no plano atual",
    details: "linha do catálogo",
  });

  assert.ok(recusa instanceof RecusaDoBanco);
  assert.equal(recusa.motivo, "limite_itens");
  assert.match(recusa.message, /limite de 20 itens/);
  // O details segue junto porque é o que o log da Vercel precisa ter.
  assert.match(recusa.message, /linha do catálogo/);
  // Embrulhar duas vezes devolve a mesma recusa, com o motivo de origem.
  assert.equal(recusaDoBanco(recusa), recusa);
  assert.equal(motivoDoErro(recusa), "limite_itens");
});

/*
 * Nulo importa tanto quanto o motivo. O `redirect()` do Next funciona
 * levantando exceção, e um catch que traduzisse tudo engoliria a navegação e
 * transformaria qualquer bug numa frase mansa de campo conferido.
 */
test("só a recusa do banco vira frase, o resto continua subindo", () => {
  assert.equal(motivoDaRecusa(recusaDoBanco("limite de 8 links no plano atual")), "limite_links");
  assert.equal(motivoDaRecusa(new Error("NEXT_REDIRECT")), null);
  assert.equal(motivoDaRecusa({ code: "23514", message: "limite de 20 itens no plano atual" }), null);
  assert.equal(motivoDaRecusa(null), null);
});

test("o motivo da URL é conferido antes de virar frase", () => {
  assert.ok(ehRecusaDados("limite_itens"));
  assert.equal(ehRecusaDados("limite_de_paciencia"), false);
  assert.equal(ehRecusaDados(null), false);
  assert.equal(ehRecusaDados(undefined), false);
  assert.equal(mensagemDaRecusa("limite_links"), MOTIVOS_DADOS.limite_links);
});
