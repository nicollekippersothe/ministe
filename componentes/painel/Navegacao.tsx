import Link from "next/link";
import { alternarPublicacao } from "@/app/painel/acoes";
import { BotaoDeAcao } from "./BotaoDeAcao";
import { ListaSecoes } from "./ListaSecoes";
import { IconeSeta } from "@/componentes/Icones";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import type { Negocio } from "@/lib/tipos";

/**
 * O estado da página e o caminho para cada parte dela.
 *
 * No celular é o conteúdo de /painel, e a pessoa volta para cá entre uma edição
 * e outra. No computador vira a coluna da esquerda, sempre à vista, e esse
 * vaivém desaparece: dá para ir de Horários direto para Botões, e o selo de No
 * ar continua na tela enquanto se edita.
 *
 * Mesmo componente nos dois, e de propósito. Duas versões do estado da página
 * seriam duas chances de uma delas mentir sobre se o negócio está no ar.
 */

export function CartaoEstado({
  negocio,
  provisoria,
}: {
  negocio: Negocio;
  provisoria: boolean;
}) {
  const noAr = negocio.publicado;

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4">
      <p
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
          noAr
            ? "bg-aberto-fundo text-aberto-texto"
            : "bg-fechado-fundo text-fechado-texto"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
        {noAr ? "No ar" : "Rascunho"}
      </p>

      <p className="mt-3 text-sm break-all text-suave">
        {DOMINIO_PUBLICO}/
        <span className="font-medium text-texto">{negocio.slug}</span>
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <Link
          href={noAr ? `/${negocio.slug}` : "/painel/previa"}
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-borda bg-fundo px-5 font-semibold text-texto transition-transform duration-75 active:scale-[0.97]"
        >
          {noAr ? "Ver a página" : "Ver a prévia"}
          <IconeSeta className="h-4 w-4" />
        </Link>

        <form action={alternarPublicacao}>
          <BotaoDeAcao
            className={`flex h-12 w-full items-center justify-center rounded-full px-5 font-semibold ${
              noAr
                ? "border border-borda bg-superficie text-texto"
                : "bg-texto text-superficie"
            }`}
          >
            {noAr ? "Tirar do ar" : provisoria ? "Entrar e publicar" : "Publicar"}
          </BotaoDeAcao>
        </form>
      </div>

      {!noAr ? (
        <p className="mt-3 text-xs leading-relaxed text-suave">
          {provisoria
            ? "Em rascunho, a página fica só para você. Publicar pede uma entrada com o Google, e aí ela passa a ser sua em qualquer aparelho."
            : "Em rascunho, a página fica só para você, mesmo para quem tem o endereço."}
        </p>
      ) : null}
    </div>
  );
}

export function Navegacao({
  negocio,
  provisoria,
}: {
  negocio: Negocio;
  provisoria: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <CartaoEstado negocio={negocio} provisoria={provisoria} />
      <nav aria-label="Partes da sua página">
        <ListaSecoes />
      </nav>

      {/* Fora de SECOES de propósito: aquela lista é das partes editáveis da
          página, e nem número nem plano são conteúdo de página. */}
      <div className="flex flex-col gap-1.5 text-sm">
        <Link
          href="/painel/numeros"
          className="text-suave underline-offset-4 hover:underline"
        >
          Números da página
        </Link>
        <Link
          href="/painel/plano"
          className="text-suave underline-offset-4 hover:underline"
        >
          Plano e cobrança
        </Link>
      </div>
    </div>
  );
}
