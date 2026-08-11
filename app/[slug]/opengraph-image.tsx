import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { porSlug } from "@/lib/dados";

/**
 * A previa do link e a primeira impressao do negocio, porque a distribuicao
 * desse produto e o dono colando o endereco no WhatsApp e na bio do Instagram.
 * Sem isto o link parece quebrado, que e exatamente o problema que a gente
 * veio resolver.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Página do negócio";

async function fonteTitulo() {
  try {
    const bytes = await readFile(
      join(process.cwd(), "assets", "fraunces-700.ttf"),
    );
    return [
      {
        name: "Fraunces",
        data: Uint8Array.from(bytes).buffer as ArrayBuffer,
        weight: 700 as const,
        style: "normal" as const,
      },
    ];
  } catch {
    return undefined;
  }
}

async function logoEmBase64(caminho: string | undefined) {
  if (!caminho) return null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", caminho));
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Imagem({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const n = await porSlug(slug);
  if (!n) return new Response("não encontrado", { status: 404 });

  const [logo, fonts] = await Promise.all([
    logoEmBase64(n.logo?.url),
    fonteTitulo(),
  ]);
  const local = [n.cidade, n.estado].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f0e8",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {logo ? (
            <img
              src={logo}
              width={112}
              height={112}
              style={{ borderRadius: 999, objectFit: "cover" }}
              alt=""
            />
          ) : null}
          {local ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                color: "#57534e",
                letterSpacing: 1,
              }}
            >
              {local.toUpperCase()}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 86,
              fontWeight: 700,
              color: "#1c1917",
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            {n.nome}
          </div>
          {n.frase ? (
            <div
              style={{
                display: "flex",
                fontSize: 34,
                color: "#57534e",
                lineHeight: 1.35,
                maxWidth: 900,
              }}
            >
              {n.frase}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#0e7a55",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 600,
              padding: "16px 30px",
              borderRadius: 999,
            }}
          >
            Chamar no WhatsApp
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts ? { fonts } : {}) },
  );
}
