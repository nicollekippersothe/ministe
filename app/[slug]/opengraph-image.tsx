import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { porSlug } from "@/lib/dados";

/**
 * A prévia do link é a primeira impressão do negócio, porque a distribuição
 * deste produto é o dono colando o endereço no WhatsApp e na bio do Instagram.
 * Sem isto o link parece quebrado, que é o problema que viemos resolver.
 *
 * ARMADILHA ACHADA AQUI: não dá para embutir arquivo de fonte nesta rota
 * enquanto ela roda no mesmo processo que o otimizador de imagem do Next.
 * Depois que o otimizador serve qualquer imagem grande, a geração passa a
 * falhar com "Input buffer contains unsupported image format", mensagem que
 * não tem relação nenhuma com a causa. Sem fonte embutida, sobrevive.
 *
 * Duas saídas de verdade, para quando o Supabase entrar:
 * 1. gerar a imagem uma vez, quando o dono publica, e guardar no Storage. É o
 *    certo: sai do caminho da requisição e ainda fica mais rápido;
 * 2. rodar esta rota no runtime de borda, que não carrega o otimizador. Só dá
 *    quando os dados vierem por HTTP, porque lá não existe leitura de disco.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Página do negócio";

/**
 * A logo lida do disco, e o motivo de conferir o caminho antes.
 *
 * `caminho` é a coluna `logo_url`, e a coluna é escrita pelo dono da página. O
 * painel grava direto pelo PostgREST, então tudo que chega aqui atravessou a
 * RLS e mais nada: a conferência da tela é enfeite para quem manda um PATCH à
 * mão. A restrição do banco aceita qualquer texto que comece com barra, de
 * propósito, porque é assim que os exemplos e o destino de arquivo local
 * guardam as imagens deles.
 *
 * Sem a conferência abaixo, `/../../etc/passwd` normaliza para fora da pasta
 * `public` e o `readFile` obedece. O conteúdo lido não volta para quem pediu,
 * porque vira base64 dentro de uma imagem que falha ao decodificar, mas sobram
 * três coisas: saber se um arquivo existe pelo erro, ler qualquer imagem do
 * disco, e derrubar a função mandando ler um arquivo enorme.
 *
 * A conferência é a de sempre para este caso: resolver o caminho e exigir que
 * ele continue dentro da pasta permitida. Comparar texto antes de resolver
 * falharia, porque `a/../../b` só revela o destino depois de normalizado.
 */
async function logoEmBase64(caminho: string | undefined) {
  if (!caminho) return null;

  const pasta = join(process.cwd(), "public");
  const alvo = join(pasta, caminho);
  if (alvo !== pasta && !alvo.startsWith(`${pasta}/`)) return null;

  try {
    const bytes = await readFile(alvo);
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

  const logo = await logoEmBase64(n.logo?.url);
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
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {logo ? (
            <img
              src={logo}
              width={104}
              height={104}
              style={{ borderRadius: 999, objectFit: "cover" }}
              alt=""
            />
          ) : null}
          {local ? (
            <div
              style={{
                display: "flex",
                fontSize: 27,
                color: "#57534e",
                letterSpacing: 3,
              }}
            >
              {local.toUpperCase()}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 700,
              color: "#1c1917",
              lineHeight: 1.02,
              letterSpacing: -3,
            }}
          >
            {n.nome}
          </div>
          {n.frase ? (
            <div
              style={{
                display: "flex",
                fontSize: 33,
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
              fontSize: 27,
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
    size,
  );
}
