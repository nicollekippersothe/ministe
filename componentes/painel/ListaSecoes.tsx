"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeSeta } from "@/componentes/Icones";
import { SECOES } from "./secoes";

/**
 * As seis partes da página, e onde a pessoa está agora.
 *
 * Roda no navegador só para saber o caminho de agora e marcar a seção aberta.
 * No celular isso não faria falta (cada seção é uma tela inteira), mas na
 * coluna fixa do computador todas ficam sempre à vista, e sem a marcação a
 * pessoa perde a referência de onde está.
 */
export function ListaSecoes() {
  const caminho = usePathname();

  return (
    <ul className="flex flex-col gap-2.5 lg:gap-1">
      {SECOES.map((s) => {
        const aqui = caminho === s.href;
        return (
          <li key={s.href}>
            <Link
              href={s.href}
              aria-current={aqui ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 lg:border-transparent lg:py-2.5 ${
                aqui
                  ? "border-borda bg-fundo lg:bg-texto/6"
                  : "border-borda bg-superficie lg:bg-transparent lg:hover:bg-superficie"
              }`}
            >
              <span className="shrink-0 text-destaque" aria-hidden>
                <s.Icone className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-medium text-texto">{s.titulo}</span>
                {/*
                  O resumo apresenta a seção para quem chega pela primeira vez.
                  Na coluna lateral ele vira repetição: a pessoa já está dentro
                  do painel e já leu uma vez, e seis linhas de apoio empurram
                  o cartão de estado para fora da tela.
                */}
                <span className="block text-xs text-suave lg:hidden">
                  {s.resumo}
                </span>
              </span>
              <IconeSeta className="h-4 w-4 shrink-0 text-suave lg:hidden" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
