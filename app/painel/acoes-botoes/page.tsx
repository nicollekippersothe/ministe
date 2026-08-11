import Link from "next/link";
import { salvarAcoes } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import { BarraSalvar, Botao, Escolha, Texto } from "@/componentes/painel/Campos";
import { doDono } from "@/lib/dados";
import type { Acao } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const TIPOS = [
  { valor: "nenhum", rotulo: "Não usar este botão" },
  { valor: "whatsapp", rotulo: "Abrir conversa no WhatsApp" },
  { valor: "link", rotulo: "Abrir um link" },
  { valor: "telefone", rotulo: "Ligar para o telefone" },
];

const ICONES = [
  { valor: "link", rotulo: "Genérico" },
  { valor: "ifood", rotulo: "iFood ou delivery" },
  { valor: "agenda", rotulo: "Agendamento" },
  { valor: "loja", rotulo: "Loja ou afiliado" },
  { valor: "cardapio", rotulo: "Cardápio ou catálogo" },
  { valor: "site", rotulo: "Site" },
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "mapa", rotulo: "Mapa" },
];

function Bloco({
  prefixo,
  titulo,
  explicacao,
  acao,
}: {
  prefixo: string;
  titulo: string;
  explicacao: string;
  acao: Acao | null;
}) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-4">
      <legend className="px-1 text-sm font-semibold text-texto">{titulo}</legend>
      <p className="-mt-1 text-sm leading-relaxed text-suave">{explicacao}</p>

      <Escolha
        id={`${prefixo}-tipo`}
        rotulo="O que este botão faz"
        valor={acao?.tipo ?? (prefixo === "principal" ? "whatsapp" : "nenhum")}
        opcoes={TIPOS}
      />
      <Texto
        id={`${prefixo}-rotulo`}
        rotulo="Texto do botão"
        dica="Diga o que acontece ao tocar. Por exemplo: Pedir pelo iFood."
        valor={acao?.rotulo ?? null}
        maxLength={40}
      />
      <Texto
        id={`${prefixo}-url`}
        rotulo="Endereço do link"
        dica="Só é usado quando o botão abre um link."
        valor={acao?.url ?? null}
        type="url"
        inputMode="url"
      />
      <Escolha
        id={`${prefixo}-icone`}
        rotulo="Ícone"
        valor={acao?.icone ?? "link"}
        opcoes={ICONES}
      />
    </fieldset>
  );
}

export default async function Acoes({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string }>;
}) {
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  return (
    <main className="mt-6">
      <Link href="/painel" className="text-sm text-suave">
        Voltar
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-texto">
        Botões da página
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        São os botões que ficam presos no rodapé, sempre visíveis. O WhatsApp é
        o mais comum, mas quem vende no iFood, quem trabalha com agenda ou quem
        vende por link de parceiro pode apontar o botão principal para lá.
      </p>

      <Aviso salvo={params.salvo === "1"} />

      <form action={salvarAcoes} className="mt-6 flex flex-col gap-4">
        <Bloco
          prefixo="principal"
          titulo="Botão principal"
          explicacao="Aparece preenchido, com destaque. É onde a maioria vai tocar."
          acao={negocio.acaoPrincipal}
        />
        <Bloco
          prefixo="secundaria"
          titulo="Botão secundário"
          explicacao="Aparece contornado, embaixo do principal. Deixe como não usar se um botão já basta."
          acao={negocio.acaoSecundaria}
        />

        <BarraSalvar>
          <Botao type="submit">Salvar</Botao>
        </BarraSalvar>
      </form>
    </main>
  );
}
