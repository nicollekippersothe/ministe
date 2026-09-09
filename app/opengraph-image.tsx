import { ImageResponse } from "next/og";
import { NOME_PRODUTO, DOMINIO_PUBLICO } from "@/lib/marca";

/**
 * A prévia do link da própria tela inicial.
 *
 * O produto vende "o link já chega mostrando quem é você", e a própria página
 * precisa cumprir isso: colada no WhatsApp, ela chega com esta imagem, e não com
 * o retângulo cinza. A das páginas de negócio é a de `app/[slug]`; esta é a do
 * site.
 *
 * Sem fonte embutida, de propósito: a mesma armadilha de
 * `app/[slug]/opengraph-image.tsx` vale aqui, e a face de sistema resolve com
 * zero risco. A paleta é a mesma da tela: areia, tinta, e a marsala no acento.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${NOME_PRODUTO}, a página do seu negócio`;

export default function Imagem() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f5f3",
          padding: "80px 88px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: -1,
            color: "#1b1b1b",
          }}
        >
          {NOME_PRODUTO.slice(0, -2)}
          <span style={{ color: "#8f4451" }}>{NOME_PRODUTO.slice(-2)}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              color: "#1b1b1b",
              lineHeight: 1.03,
              letterSpacing: -3,
              maxWidth: 940,
            }}
          >
            A página do seu negócio, com catálogo, horário e WhatsApp.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: "#68686d" }}>
            {DOMINIO_PUBLICO}/seu-nome
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              fontWeight: 600,
              color: "#8f4451",
            }}
          >
            Grátis para publicar
          </div>
        </div>
      </div>
    ),
    size,
  );
}
