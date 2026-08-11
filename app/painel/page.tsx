import Link from "next/link";
import { alternarPublicacao } from "./acoes";
import {
  IconeLetras,
  IconeLoja,
  IconeRelogio,
  IconeSeta,
} from "@/componentes/Icones";
import { doDono } from "@/lib/dados";

export const dynamic = "force-dynamic";

const SECOES = [
  {
    href: "/painel/negocio",
    titulo: "Informações do negócio",
    resumo: "Nome, frase, WhatsApp e endereço",
  },
  {
    href: "/painel/horarios",
    titulo: "Horários",
    resumo: "Quando abre e quando fecha, dia por dia",
  },
  {
    href: "/painel/aparencia",
    titulo: "Letras da página",
    resumo: "Cinco combinações, com o nome do seu negócio em cada uma",
  },
];

export default async function Painel() {
  const negocio = await doDono();
  const noAr = negocio.publicado;

  return (
    <main className="mt-6">
      <h1 className="text-2xl font-bold tracking-tight text-texto">
        Sua página
      </h1>

      <div className="mt-4 rounded-2xl border border-borda bg-superficie p-4">
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
          banca.app/<span className="font-medium text-texto">{negocio.slug}</span>
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          <Link
            href={noAr ? `/${negocio.slug}` : "/painel/previa"}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-borda bg-fundo px-5 font-semibold text-texto"
          >
            {noAr ? "Ver a página" : "Ver como vai ficar"}
            <IconeSeta className="h-4 w-4" />
          </Link>

          <form action={alternarPublicacao}>
            <button
              className={`flex h-12 w-full items-center justify-center rounded-full px-5 font-semibold ${
                noAr
                  ? "border border-borda bg-superficie text-texto"
                  : "bg-texto text-superficie"
              }`}
            >
              {noAr ? "Tirar do ar" : "Publicar"}
            </button>
          </form>
        </div>

        {!noAr ? (
          <p className="mt-3 text-xs leading-relaxed text-suave">
            Enquanto está em rascunho, só você enxerga. Ninguém acha pelo
            endereço.
          </p>
        ) : null}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight text-texto">
        Editar
      </h2>

      <ul className="flex flex-col gap-2.5">
        {SECOES.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="flex items-center gap-3 rounded-xl border border-borda bg-superficie px-4 py-3.5"
            >
              <span className="shrink-0 text-destaque" aria-hidden>
                {s.href.endsWith("horarios") ? (
                  <IconeRelogio className="h-5 w-5" />
                ) : s.href.endsWith("aparencia") ? (
                  <IconeLetras className="h-5 w-5" />
                ) : (
                  <IconeLoja className="h-5 w-5" />
                )}
              </span>
              <span className="flex-1">
                <span className="block font-medium text-texto">{s.titulo}</span>
                <span className="block text-xs text-suave">{s.resumo}</span>
              </span>
              <IconeSeta className="h-4 w-4 shrink-0 text-suave" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
