import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/app/painel/vitrine";
import { Moldura } from "@/componentes/cadastro/Moldura";
import { CONTATO_SUPORTE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ajuda para entrar",
  robots: { index: false, follow: false },
};

/**
 * Recuperação de acesso.
 *
 * A entrada é pelo Google, então senha esquecida sai da lista. O que sobra são
 * três situações reais, e cada uma tem uma saída própria: outra conta do
 * Google, a página começada em outro aparelho, e o acesso ao Google perdido.
 */
const CAUSAS = [
  {
    titulo: "Você tem mais de uma conta do Google",
    texto:
      "A página fica na conta usada para publicar. Na tela do Google, escolha a outra conta e tente de novo.",
  },
  {
    titulo: "Você começou a página em outro aparelho",
    texto:
      "Enquanto a página está em rascunho, ela fica guardada no aparelho onde você começou. Publicar com o Google é o que a leva para todos os seus aparelhos.",
  },
  {
    titulo: "O Google recusou a entrada",
    texto:
      "Costuma passar sozinho em alguns minutos. Se aparecer uma mensagem na tela, guarde o texto dela, que é o que diz o motivo.",
  },
];

export default function Ajuda() {
  exigirLogin();
  return (
    <Moldura
      titulo="Ajuda para entrar"
      subtitulo="A entrada é pela sua conta do Google, então existe uma senha a menos para lembrar."
      rodape={
        <Link
          href="/entrar"
          className="flex h-13 w-full items-center justify-center rounded-full bg-texto px-6 text-[1.05rem] font-semibold text-superficie"
        >
          Voltar e entrar
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
          Perdeu o acesso à conta do Google usada para publicar?{" "}
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
