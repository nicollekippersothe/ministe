import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BotaoPrincipal, Moldura } from "@/componentes/cadastro/Moldura";
import { registrarDenuncia } from "@/lib/dados";
import { normalizar } from "@/lib/slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Denunciar uma página",
  robots: { index: false, follow: false },
};

/**
 * Denúncia sem login e sem identificação.
 *
 * É a peça que de fato pega golpe, porque quem descobre é quem caiu nele, e
 * essa pessoa não tem conta aqui. Toda concorrente tem esse link no rodapé da
 * página pública, e é de lá que ele é aberto.
 *
 * Não pede e-mail. Denúncia identificada afasta justamente quem tem medo do
 * denunciado, e o produto não tem para que usar o dado. O preço é não dar
 * para responder, e é um preço aceito.
 */
const MOTIVOS = [
  {
    valor: "golpe",
    rotulo: "Parece golpe",
    dica: "Pede Pix, dado bancário ou senha, ou o botão leva para outro lugar.",
  },
  {
    valor: "nao_e_meu_negocio",
    rotulo: "Estão usando o meu negócio",
    dica: "A página usa o nome, as fotos ou o endereço do meu negócio sem eu ter feito.",
  },
  {
    valor: "conteudo",
    rotulo: "Conteúdo impróprio",
    dica: "Ofensivo, ilegal ou impróprio.",
  },
  {
    valor: "fora_do_ar",
    rotulo: "Informação errada",
    dica: "O negócio fechou, mudou de endereço ou o horário não confere.",
  },
  { valor: "outro", rotulo: "Outro motivo", dica: null },
];

async function enviar(formData: FormData) {
  "use server";

  const slug = normalizar(String(formData.get("slug") ?? ""));
  const motivo = String(formData.get("motivo") ?? "");
  const detalhe = String(formData.get("detalhe") ?? "").trim();

  if (!slug) redirect("/denunciar?erro=endereco");
  if (!MOTIVOS.some((m) => m.valor === motivo)) redirect("/denunciar?erro=motivo");

  await registrarDenuncia({
    slug,
    motivo,
    detalhe: detalhe === "" ? null : detalhe.slice(0, 600),
  });

  redirect("/denunciar/recebido");
}

export default async function Denunciar({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; erro?: string }>;
}) {
  const { p, erro } = await searchParams;
  const slug = p ? normalizar(p) : "";

  return (
    <Moldura
      titulo="Denunciar uma página"
      subtitulo="Recebemos sem pedir seu nome nem seu e-mail. Página que engana quem visita sai do ar."
    >
      <form action={enviar} className="flex flex-col gap-7">
        <div>
          <label htmlFor="slug" className="text-[0.95rem] font-medium text-texto">
            Endereço da página
          </label>
          <p id="slug-dica" className="mt-1 text-sm text-suave">
            É o que vem depois da barra, como doceria-da-ana.
          </p>
          <input
            id="slug"
            name="slug"
            defaultValue={slug}
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="slug-dica"
            className="mt-3 w-full rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-[1.05rem] text-texto focus:border-texto focus:outline-none"
          />
          {erro === "endereco" ? (
            <p role="alert" className="mt-2 text-sm text-destaque">
              Informe o endereço da página.
            </p>
          ) : null}
        </div>

        <fieldset>
          <legend className="text-[0.95rem] font-medium text-texto">
            O que está acontecendo
          </legend>
          <div className="mt-3 flex flex-col gap-2">
            {MOTIVOS.map((m) => (
              <label
                key={m.valor}
                className="flex gap-3 rounded-2xl border border-borda bg-superficie px-4 py-3.5 has-[:checked]:border-texto"
              >
                <input
                  type="radio"
                  name="motivo"
                  value={m.valor}
                  required
                  className="mt-1 h-4.5 w-4.5 shrink-0 accent-[var(--c-texto)]"
                />
                <span>
                  <span className="block text-[1.05rem] leading-snug text-texto">
                    {m.rotulo}
                  </span>
                  {m.dica ? (
                    <span className="mt-0.5 block text-sm leading-relaxed text-suave">
                      {m.dica}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
          {erro === "motivo" ? (
            <p role="alert" className="mt-2 text-sm text-destaque">
              Escolha um motivo.
            </p>
          ) : null}
        </fieldset>

        <div>
          <label htmlFor="detalhe" className="text-[0.95rem] font-medium text-texto">
            Conte o que aconteceu
          </label>
          <p id="detalhe-dica" className="mt-1 text-sm text-suave">
            Opcional, e é o que mais ajuda a decidir rápido.
          </p>
          <textarea
            id="detalhe"
            name="detalhe"
            rows={4}
            maxLength={600}
            aria-describedby="detalhe-dica"
            className="mt-3 w-full resize-y rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-[1.05rem] leading-relaxed text-texto focus:border-texto focus:outline-none"
          />
        </div>

        <BotaoPrincipal type="submit">Enviar denúncia</BotaoPrincipal>
      </form>
    </Moldura>
  );
}
