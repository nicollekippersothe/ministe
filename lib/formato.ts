const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function preco(centavos: number): string {
  return moeda.format(centavos / 100);
}

/**
 * Arruma o que a pessoa digitou no campo de WhatsApp.
 *
 * Quase ninguém digita o 55 na frente, e sem ele o link do WhatsApp abre com
 * o código de outro país e não acha o número. Então: tira tudo que não é
 * dígito, tira o zero da operadora, e se sobrou um número brasileiro de 10 ou
 * 11 dígitos, coloca o 55.
 */
export function normalizarWhatsapp(entrada: string): string | null {
  const so = entrada.replace(/\D/g, "").replace(/^0+/, "");
  if (so === "") return null;
  if (so.length === 10 || so.length === 11) return `55${so}`;
  return so;
}

/** 5511999999999 vira (11) 99999-9999 */
export function telefoneVisivel(digitos: string): string {
  const d = digitos.replace(/\D/g, "");
  const local = d.startsWith("55") ? d.slice(2) : d;
  const ddd = local.slice(0, 2);
  const resto = local.slice(2);
  if (resto.length === 9) return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
  if (resto.length === 8) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return digitos;
}

/** Formato E.164 que o JSON-LD e o link tel: esperam. */
export function telefoneE164(digitos: string): string {
  return `+${digitos.replace(/\D/g, "")}`;
}

export function linkWhatsapp(digitos: string, mensagem?: string | null): string {
  const numero = digitos.replace(/\D/g, "");
  const base = `https://wa.me/${numero}`;
  if (!mensagem) return base;
  return `${base}?text=${encodeURIComponent(mensagem)}`;
}

/** Troca {item} pelo nome do produto na mensagem padrao do catalogo. */
export function mensagemDoItem(modelo: string | null, titulo: string): string | null {
  if (!modelo) return null;
  return modelo.replace(/\{item\}/g, titulo);
}

/**
 * O preço do jeito que ele entra no campo do painel.
 *
 * O banco guarda centavos e o campo fala reais, que é como a pessoa fala. Item
 * sem preço volta como campo vazio, e nunca como "0,00": zero é um preço, e a
 * página mostraria "R$ 0,00" onde a linha do preço deveria sair de cena.
 *
 * Sai sem o ponto de milhar de propósito. Dentro de um campo de digitar, o
 * separador atrapalha quem edita o número, e a leitura de volta aceita ele de
 * qualquer jeito. Quem mostra preço com ponto é a página, pelo `preco`.
 */
export function precoEditavel(centavos: number | null): string {
  return centavos === null ? "" : (centavos / 100).toFixed(2).replace(".", ",");
}

/**
 * O que a pessoa digitou no campo de preço virando centavos.
 *
 * Campo vazio é resposta legítima, e significa item sem linha de preço. Por
 * isso o retorno separa as três respostas: vazio, número, e texto que não é
 * preço. Um `number | null` sozinho misturaria "em branco" com "não deu".
 *
 * O teclado do celular manda ponto, e a pessoa manda vírgula, então os dois
 * entram. A regra de desempate é a do português: com vírgula, ela é o decimal
 * e o ponto é milhar (1.234,56). Sem vírgula, um ponto único com uma ou duas
 * casas atrás é decimal (74.90), e qualquer outro arranjo de pontos é milhar
 * (1.500 são mil e quinhentos reais, e não um e meio).
 *
 * O teto é R$ 999.999,99. A coluna do banco é integer, e centavo acima disso
 * estoura a coluna: o erro viraria "escrita_recusada", que é o guarda-chuva,
 * em vez da frase que diz para conferir o campo.
 */
export type LeituraDePreco = { ok: true; centavos: number | null } | { ok: false };

const TETO_EM_CENTAVOS = 99_999_999;

export function lerPreco(entrada: string | null): LeituraDePreco {
  const limpo = (entrada ?? "").replace(/\s/g, "").replace(/^r\$/i, "");
  if (limpo === "") return { ok: true, centavos: null };
  if (!/^[0-9.,]+$/.test(limpo)) return { ok: false };

  const pedacos = limpo.split(",");
  if (pedacos.length > 2) return { ok: false };

  let inteiro: string;
  let decimal: string;

  if (pedacos.length === 2) {
    inteiro = pedacos[0].replace(/\./g, "");
    decimal = pedacos[1];
  } else {
    const porPonto = limpo.split(".");
    const ultimo = porPonto[porPonto.length - 1];
    if (porPonto.length === 2 && ultimo.length >= 1 && ultimo.length <= 2) {
      inteiro = porPonto[0];
      decimal = ultimo;
    } else {
      inteiro = limpo.replace(/\./g, "");
      decimal = "";
    }
  }

  if (decimal.length > 2) return { ok: false };
  if (inteiro === "" && decimal === "") return { ok: false };

  const centavos = Number(inteiro || "0") * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(centavos) || centavos > TETO_EM_CENTAVOS) {
    return { ok: false };
  }

  return { ok: true, centavos };
}
