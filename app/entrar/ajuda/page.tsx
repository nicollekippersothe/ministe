import type { Metadata } from "next";
import Link from "next/link";
import { Moldura } from "@/componentes/cadastro/Moldura";
import { CONTATO_SUPORTE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Não consigo entrar",
  robots: { index: false, follow: false },
};

/**
 * Recuperação de acesso.
 *
 * Como a entrada é por link no e-mail, não existe senha para recuperar: o que
 * pode dar errado é o e-mail não chegar, ou a pessoa ter perdido o acesso à
 * caixa. São dois problemas diferentes e a tela separa os dois.
 */
const CAUSAS = [
  {
    titulo: "O link não chegou",
    texto:
      "Procure por Banca na caixa de spam e na aba de promoções. A entrega pode levar até cinco minutos.",
  },
  {
    titulo: "O link expirou",
    texto:
      "Cada link vale por uma hora e só pode ser usado uma vez. Peça um novo, é gratuito e sem limite.",
  },
  {
    titulo: "Você digitou outro e-mail no cadastro",
    texto:
      "Tente entrar com os outros endereços que você usa. A página fica na conta do e-mail usado no cadastro.",
  },
];

export default function Ajuda() {
  return (
    <Moldura
      titulo="Não consigo entrar"
      subtitulo="Sua conta não tem senha. O acesso é sempre por um link enviado ao seu e-mail."
      rodape={
        <Link
          href="/entrar"
          className="flex h-13 w-full items-center justify-center rounded-full bg-texto px-6 text-[1.05rem] font-semibold text-superficie"
        >
          Pedir um novo link
        </Link>
      }
    >
      <ul className="flex flex-col gap-3">
        {CAUSAS.map((c) => (
          <li
            key={c.titulo}
            className="rounded-2xl border border-borda bg-superficie p-5"
          >
            <h2 className="font-semibold text-texto">{c.titulo}</h2>
            <p className="mt-1.5 leading-relaxed text-suave">{c.texto}</p>
          </li>
        ))}
      </ul>

      {CONTATO_SUPORTE ? (
        <p className="mt-6 text-center text-[0.95rem] leading-relaxed text-suave">
          Perdeu o acesso ao e-mail do cadastro?{" "}
          <a
            href={`mailto:${CONTATO_SUPORTE}`}
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Escreva para {CONTATO_SUPORTE}
          </a>{" "}
          informando o endereço da sua página.
        </p>
      ) : null}
    </Moldura>
  );
}
