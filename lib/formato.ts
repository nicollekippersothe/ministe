const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function preco(centavos: number): string {
  return moeda.format(centavos / 100);
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
