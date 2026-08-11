import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/app/painel/vitrine";
import { BotaoPrincipal, Moldura } from "@/componentes/cadastro/Moldura";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

/**
 * Sem senha, de propósito: senha é atrito na entrada e suporte depois.
 *
 * O envio do link ainda não está ligado. Falta o Supabase Auth e um provedor
 * de e-mail, que é a etapa 4. A tela e a validação já estão prontas.
 */
async function enviarLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) redirect("/entrar?erro=email");
  redirect(`/entrar/enviado?para=${encodeURIComponent(email)}`);
}

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  exigirLogin();
  const { erro } = await searchParams;

  return (
    <Moldura
      titulo="Entrar"
      subtitulo="Enviamos um link de acesso para o seu e-mail. Sem senha para criar nem lembrar."
      rodape={
        <p className="text-center text-[0.95rem] text-suave">
          Ainda não tem página?{" "}
          <Link href="/criar" className="font-medium text-destaque underline-offset-4 hover:underline">
            Criar agora
          </Link>
        </p>
      }
    >
      <form action={enviarLink} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="text-[0.95rem] font-medium text-texto">
            Seu e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            className="mt-3 w-full rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-[1.05rem] text-texto focus:border-destaque focus:outline-none"
          />
          {erro ? (
            <p role="alert" className="mt-2 text-sm text-destaque">
              Confira o e-mail digitado.
            </p>
          ) : null}
        </div>

        <BotaoPrincipal type="submit">Receber link de acesso</BotaoPrincipal>

        <p className="text-center text-sm text-suave">
          <Link href="/entrar/ajuda" className="underline underline-offset-2">
            Não consigo entrar
          </Link>
        </p>
      </form>
    </Moldura>
  );
}
