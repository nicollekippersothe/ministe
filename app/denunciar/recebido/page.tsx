import type { Metadata } from "next";
import Link from "next/link";
import { Moldura } from "@/componentes/cadastro/Moldura";

export const metadata: Metadata = {
  title: "Denúncia recebida",
  robots: { index: false, follow: false },
};

/**
 * Sem prazo prometido e sem número de protocolo. Prazo que não dá para
 * cumprir vira reclamação, e protocolo sem lugar para consultar é enfeite.
 */
export default function Recebido() {
  return (
    <Moldura
      titulo="Denúncia recebida"
      subtitulo="Uma pessoa vai olhar. Se a página estiver enganando quem visita, ela sai do ar e o endereço deixa de abrir."
    >
      <div className="rounded-2xl border border-borda bg-superficie p-4">
        <p className="text-[0.95rem] leading-relaxed text-texto">
          Se você perdeu dinheiro, registre também um boletim de ocorrência.
          A delegacia eletrônica do seu estado atende pela internet, e o banco
          precisa do registro para tentar devolver um Pix.
        </p>
      </div>

      <p className="mt-8 text-center text-sm text-suave">
        <Link href="/" className="underline underline-offset-2">
          Voltar para o início
        </Link>
      </p>
    </Moldura>
  );
}
