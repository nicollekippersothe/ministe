/**
 * Exercita o caminho de pagamento inteiro contra o sandbox do Mercado Pago, de
 * uma vez só, sem navegador e sem preencher formulário na mão.
 *
 * O motivo de existir: testar cobrança clicando é lento e é onde o produto
 * mais trava. Cada desfecho de cartão precisa de um cadastro, um login, três
 * campos de iframe e uma espera, e são seis desfechos. Aqui é um comando.
 *
 * O que ele NÃO faz, de propósito: fingir. Ele fala com a API de verdade do
 * Mercado Pago, com as credenciais de teste, e chama as nossas funções de
 * `lib/pagamento/` em vez de repetir a chamada por fora. Se o nosso adaptador
 * montar o corpo errado, este script quebra do mesmo jeito que a tela quebraria.
 *
 * O que fica de fora: os Secure Fields. Aqui o cartão vira token por
 * `POST /v1/card_tokens`, que é a mesma chamada que o SDK do navegador faz, com
 * a mesma chave pública. Cartão de teste pode isso; cartão de gente, nunca, e é
 * justamente por isso que a tela usa os iframes deles.
 *
 * COMO RODAR
 *
 *   MERCADOPAGO_ACCESS_TOKEN=TEST-... \
 *   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-... \
 *   npm run pagamento
 *
 * Ou ponha as duas no `.env.local`, que o script lê sozinho.
 *
 *   npm run pagamento -- --usuarios     cria o par de contas de teste
 *   npm run pagamento -- --so-pix       só o Pix
 *   npm run pagamento -- --email a@b.c  outro pagador
 *   npm run pagamento -- --cancelar ID  encerra uma assinatura de teste
 *
 * AS CREDENCIAIS PRECISAM SER AS DE TESTE. Cartão de teste com credencial de
 * produção volta recusado, e a recusa parece defeito nosso quando é só a chave
 * errada. Chave de teste começa com `TEST-`, e o script avisa quando não começa.
 */
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { gateway } from "../lib/pagamento/index.ts";
import { mensagemDeRecusa } from "../lib/pagamento/erros.ts";

const API = "https://api.mercadopago.com";

/*
 * Os cartões do sandbox, e a regra que quase ninguém percebe na primeira vez:
 * quem decide o desfecho é o NOME DO TITULAR, e nunca o número. O mesmo cartão
 * aprova com `APRO` e recusa com `FUND`. Por isso a lista abaixo é de nomes.
 *
 * Os valores saem da documentação viva do Mercado Pago e mudam sem aviso.
 * Quando um desfecho parar de bater, confira lá antes de suspeitar do código.
 */
const CARTAO = {
  numero: "5031433215406351",
  mes: "11",
  ano: "2030",
  cvv: "123",
  cpf: "12345678909",
};

const DESFECHOS = [
  ["APRO", "aprova, e a assinatura nasce autorizada"],
  ["FUND", "recusa por saldo, e a frase precisa falar de outro cartão"],
  ["SECU", "recusa pelo código de segurança"],
  ["OTHE", "recusa genérica, que é a que mais aparece na vida real"],
];

const args = process.argv.slice(2);
const tem = (nome) => args.includes(nome);
const valor = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : null;
};

/**
 * Lê o `.env.local` para dentro do `process.env`, sem depender de pacote.
 *
 * Só preenche o que ainda está vazio, então a variável passada na linha de
 * comando continua ganhando do arquivo.
 */
async function lerEnvLocal() {
  let texto;
  try {
    texto = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }
  for (const linha of texto.split("\n")) {
    const corte = linha.indexOf("=");
    if (corte < 1 || linha.trimStart().startsWith("#")) continue;
    const chave = linha.slice(0, corte).trim();
    const bruto = linha.slice(corte + 1).trim();
    const limpo = bruto.replace(/^["']|["']$/g, "");
    if (process.env[chave] === undefined) process.env[chave] = limpo;
  }
}

await lerEnvLocal();

const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
const chavePublica = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim();

if (!token || !chavePublica) {
  console.error(
    [
      "Faltam as credenciais. Ponha as duas no .env.local ou na linha de comando:",
      "",
      "  MERCADOPAGO_ACCESS_TOKEN=TEST-...",
      "  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...",
      "",
      "As duas ficam no painel de desenvolvedores do Mercado Pago, dentro da sua",
      "aplicação, na aba de credenciais de teste.",
    ].join("\n"),
  );
  process.exit(1);
}

if (!token.startsWith("TEST-") || !chavePublica.startsWith("TEST-")) {
  console.log(
    [
      "Aviso: pelo menos uma das credenciais parece ser de produção.",
      "Cartão de teste com credencial de produção volta recusado sempre, e a",
      "recusa se parece com defeito nosso. Siga se você sabe o que está fazendo.",
      "",
    ].join("\n"),
  );
}

/** Uma chamada à API deles, com o erro legível quando vier erro. */
async function chamar(caminho, opcoes = {}) {
  const r = await fetch(`${API}${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opcoes.headers ?? {}),
    },
  });
  const texto = await r.text();
  let corpo = null;
  try {
    corpo = JSON.parse(texto);
  } catch {
    corpo = { bruto: texto.slice(0, 400) };
  }
  return { status: r.status, corpo };
}

/**
 * Cria uma conta de teste. Uma vendedora e uma compradora, porque o Mercado
 * Pago recusa pagamento em que o pagador é a própria conta que vende.
 */
async function criarUsuarios() {
  console.log("Criando duas contas de teste no Brasil.\n");
  for (const papel of ["vendedora", "compradora"]) {
    const { status, corpo } = await chamar("/users/test_user", {
      method: "POST",
      body: JSON.stringify({ site_id: "MLB" }),
    });
    if (status >= 300) {
      console.log(`  ${papel}: falhou com ${status}`);
      console.log("  ", JSON.stringify(corpo).slice(0, 300));
      continue;
    }
    console.log(`  ${papel}`);
    console.log(`    e-mail: ${corpo.email}`);
    console.log(`    usuário: ${corpo.nickname}`);
    console.log(`    senha: ${corpo.password}`);
    console.log(`    id: ${corpo.id}`);
  }
  console.log(
    [
      "",
      "Guarde as senhas agora, porque elas aparecem uma vez só.",
      "As contas entram em mercadopago.com.br em janela anônima.",
    ].join("\n"),
  );
}

/**
 * O cartão virando token, que é o passo que o navegador faz pelos Secure
 * Fields. Vai com a chave pública na query, e nunca com o token de acesso: a
 * tokenização é chamada de navegador por desenho.
 */
async function tokenizar(titular) {
  const r = await fetch(
    `${API}/v1/card_tokens?public_key=${encodeURIComponent(chavePublica)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_number: CARTAO.numero,
        expiration_month: CARTAO.mes,
        expiration_year: CARTAO.ano,
        security_code: CARTAO.cvv,
        cardholder: {
          name: titular,
          identification: { type: "CPF", number: CARTAO.cpf },
        },
      }),
    },
  );
  const corpo = await r.json().catch(() => null);
  if (!r.ok || !corpo?.id) {
    return { ok: false, motivo: `${r.status} ${JSON.stringify(corpo).slice(0, 300)}` };
  }
  return { ok: true, id: corpo.id };
}

/*
 * O pagador, e a armadilha que custou uma rodada inteira para descobrir.
 *
 * E-mail terminado em `@testuser.com`, que é o formato das contas de teste que
 * `--usuarios` cria, volta com 403 "Payer email forbidden" em `/v1/payments`.
 * Medido, com conta de teste recém-criada pela API deles. O que passa é um
 * e-mail comum de mentira, e é ele que fica de padrão aqui.
 *
 * As contas de teste continuam servindo para OLHAR o outro lado, entrando em
 * mercadopago.com.br com elas, e nunca para preencher este campo.
 */
const emailDoPagador = valor("--email") ?? "comprador@example.com";

/*
 * Uma referência de mentira, e ela precisa ser uuid.
 *
 * O `external_reference` vira `abrir_assinatura(p_negocio uuid)` no webhook.
 * Texto que não é uuid derruba o Postgres com erro de tipo, o webhook devolve
 * 500 e o Mercado Pago reentrega para sempre. Como aqui o webhook nem é
 * chamado, o uuid é só para o corpo sair igual ao de verdade.
 */
const referencia = randomUUID();

async function correrCartao() {
  console.log("CRÉDITO, um desfecho por titular\n");
  for (const [titular, esperado] of DESFECHOS) {
    const t = await tokenizar(titular);
    if (!t.ok) {
      console.log(`  ${titular}  o cartão parou antes de virar token`);
      console.log(`         ${t.motivo}`);
      continue;
    }

    const r = await gateway.assinarComCartao({
      idempotencia: randomUUID(),
      ciclo: "mensal",
      tokenDoCartao: t.id,
      emailDoPagador,
      urlDeVolta: "https://entrais.app/painel/plano",
      referencia,
      descricao: "Entrais, plano mensal",
      documento: { tipo: "CPF", numero: CARTAO.cpf },
    });

    if (r.ok) {
      console.log(`  ${titular}  passou, situação ${r.valor.situacao}`);
      console.log(`         id ${r.valor.idExterno}`);
      console.log(`         esperado: ${esperado}`);
      console.log(
        `         cancelar depois com: npm run pagamento -- --cancelar ${r.valor.idExterno}`,
      );
    } else {
      console.log(`  ${titular}  voltou recusa, motivo ${r.motivo}`);
      console.log(`         a frase que a pessoa lê: ${mensagemDeRecusa(r.motivo)}`);
      console.log(`         esperado: ${esperado}`);
    }
    console.log("");
  }
}

async function correrPix() {
  console.log("PIX\n");
  const r = await gateway.cobrarUmaVez({
    idempotencia: randomUUID(),
    ciclo: "mensal",
    meio: "pix",
    emailDoPagador,
    // O nome sai da sessão no produto de verdade, e aqui é de mentira como o
    // e-mail e o CPF acima. Ele existe nesta chamada para o corpo sair igual
    // ao da tela, com `additional_info` inteiro.
    nomeDoPagador: "Comprador de Teste",
    referencia,
    descricao: "Entrais, plano mensal",
    documento: { tipo: "CPF", numero: CARTAO.cpf },
  });

  if (!r.ok) {
    console.log(`  voltou recusa, motivo ${r.motivo}`);
    console.log(`  a frase que a pessoa lê: ${mensagemDeRecusa(r.motivo)}`);
    return;
  }

  const c = r.valor;
  console.log(`  passou, situação ${c.situacao}, id ${c.idExterno}`);
  console.log(`  copia e cola: ${c.pixCopiaECola ? "veio" : "faltou"}`);
  console.log(`  imagem do QR: ${c.pixQrBase64 ? "veio" : "faltou"}`);
  console.log(`  expira em: ${c.expiraEm ?? "sem data"}`);

  await conferirQualidade(c.idExterno);

  console.log("");
  console.log("  Para fechar o ciclo sem pagar de verdade, mande o aviso:");
  console.log(`    npm run aviso -- payment ${c.idExterno}`);
}

/**
 * O que o Mercado Pago guardou dos campos que valem nota de qualidade.
 *
 * Lê a cobrança de volta, na fonte, em vez de acreditar no corpo que saiu
 * daqui. É a diferença entre "mandamos" e "chegou": campo que a API deles
 * ignora some sem erro nenhum, e a nota da integração continua parada sem
 * ninguém entender por quê.
 */
async function conferirQualidade(id) {
  const { status, corpo } = await chamar(`/v1/payments/${encodeURIComponent(id)}`);
  console.log("");
  console.log("  O que voltou dos campos de qualidade da integração:");

  if (status >= 300) {
    console.log(`    a leitura de volta falhou com ${status}`);
    return;
  }

  const item = corpo.additional_info?.items?.[0];
  // No Pix o descritor volta nulo, e é assim mesmo: `bank_transfer` não tem
  // fatura de cartão para descrever. Ele continua indo porque o mesmo
  // `/v1/payments` atende o débito, onde ele aparece na fatura.
  console.log(
    `    statement_descriptor: ${
      corpo.statement_descriptor ?? `vazio, que é o esperado em ${corpo.payment_type_id}`
    }`,
  );
  console.log(
    item
      ? `    item: ${item.id}, ${item.title}, ${item.category_id}, ${item.unit_price}`
      : "    item: faltou",
  );
  console.log(
    corpo.additional_info?.payer?.first_name
      ? `    pagador: ${corpo.additional_info.payer.first_name} ${corpo.additional_info.payer.last_name ?? ""}`.trimEnd()
      : "    pagador: faltou",
  );
}

async function cancelar(id) {
  const r = await gateway.cancelarAssinatura(id);
  console.log(r.ok ? `Encerrada: ${id}` : `Falhou: ${r.motivo}`);
}

const alvoDoCancelamento = valor("--cancelar");

if (tem("--usuarios")) {
  await criarUsuarios();
} else if (alvoDoCancelamento) {
  await cancelar(alvoDoCancelamento);
} else {
  console.log(`Pagador: ${emailDoPagador}`);
  console.log(`Referência: ${referencia}\n`);
  if (!tem("--so-pix")) await correrCartao();
  await correrPix();
}
