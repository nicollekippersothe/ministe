import { NextResponse } from "next/server";
import { enderecoLivre } from "@/lib/dados";
import { conferirFormato, MOTIVOS, normalizar } from "@/lib/slug";

export const dynamic = "force-dynamic";

/**
 * Diz se um endereço está livre, para o cadastro avisar enquanto a pessoa
 * digita. Só lê, e o que ela descobre aqui já é público de qualquer jeito
 * (basta abrir o endereço no navegador).
 */
export async function GET(pedido: Request) {
  const bruto = new URL(pedido.url).searchParams.get("slug") ?? "";
  const slug = normalizar(bruto);

  const recusa = conferirFormato(slug);
  if (recusa) {
    return NextResponse.json({ slug, livre: false, motivo: MOTIVOS[recusa] });
  }

  const livre = await enderecoLivre(slug);
  return NextResponse.json({
    slug,
    livre,
    motivo: livre ? null : MOTIVOS.ocupado,
  });
}
