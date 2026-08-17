import Link from "next/link";
import {
  DOCUMENTO,
  NOME_PRODUTO,
  RESPONSAVEL,
  tipoDeDocumento,
} from "@/lib/marca";

/**
 * A moldura dos documentos: termos de uso e política de privacidade.
 *
 * Texto longo, lido no celular, sem nenhuma peça de produto em volta. A medida
 * de 38rem existe porque linha de texto corrido cansa depois de uns 75
 * caracteres, e num monitor grande a coluna cheia viraria parede.
 *
 * A identificação de quem assina o documento sai de lib/marca.ts, e o bloco
 * some enquanto ela não existir. Documento legal com identificação inventada é
 * pior que documento sem ela.
 */
export function Documento({
  titulo,
  resumo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  resumo: string;
  /** ISO, só a data: "2026-08-16". */
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  const data = new Date(`${atualizadoEm}T12:00:00Z`).toLocaleDateString(
    "pt-BR",
    { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );

  return (
    <main className="mx-auto w-full max-w-[38rem] px-5 py-10">
      <Link href="/" className="text-sm text-suave">
        {NOME_PRODUTO}
      </Link>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-texto">
        {titulo}
      </h1>
      <p className="mt-3 leading-relaxed text-suave">{resumo}</p>
      <p className="mt-2 text-sm text-suave">Atualizado em {data}.</p>

      <div className="mt-8 flex flex-col gap-8">{children}</div>

      <Identificacao />
    </main>
  );
}

/**
 * Quem responde pelo serviço, do jeito que o Decreto 7.962 pede.
 *
 * Aparece só quando as duas variáveis existem e o documento tem contagem de
 * dígitos de CPF ou de CNPJ. Documento pela metade é o mesmo que documento
 * nenhum, e nesse caso é melhor a linha sumir do que sair torta.
 */
function Identificacao() {
  if (!RESPONSAVEL || !DOCUMENTO) return null;

  const tipo = tipoDeDocumento(DOCUMENTO);
  if (!tipo) return null;

  return (
    <p className="mt-10 border-t border-borda pt-6 text-sm leading-relaxed text-suave">
      {RESPONSAVEL}, {tipo} {DOCUMENTO}, responsável pelo {NOME_PRODUTO}.
    </p>
  );
}

/** Uma seção numerada do documento. */
export function Artigo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-texto">
        {titulo}
      </h2>
      <div className="mt-2 flex flex-col gap-3 leading-relaxed text-suave">
        {children}
      </div>
    </section>
  );
}
