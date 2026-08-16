"use client";

import Link from "next/link";
import { useState } from "react";
import { CampoCategoria } from "./CampoCategoria";
import { CampoEndereco } from "./CampoEndereco";
import { BotaoPrincipal, Moldura } from "./Moldura";
import { PreviaViva } from "./PreviaViva";

/**
 * A tela de criar página, com a prévia ao lado no computador.
 *
 * Segura o nome, o endereço e a categoria em estado só para alimentar a prévia.
 * Os campos continuam sendo `input` de verdade, com `name` e valor próprios,
 * então **o formulário envia igual com o JavaScript desligado**: a prévia é
 * enfeite, e nunca muleta. O teste de fluxo confere isso com o JavaScript
 * desligado de propósito.
 *
 * Vive num componente de cliente porque a prévia e os campos precisam do mesmo
 * estado, e o `lado` da Moldura é irmão do formulário, não filho.
 */
export function FormularioCriar({
  acao,
  nomeInicial,
  mensagem,
}: {
  acao: (formData: FormData) => void | Promise<void>;
  nomeInicial: string;
  mensagem: string | null;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [slug, setSlug] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  return (
    <Moldura
      titulo="Criar sua página"
      subtitulo="Três respostas agora. O resto pode ser preenchido depois."
      lado={<PreviaViva nome={nome} slug={slug} categoria={categoria} />}
      rodape={
        <p className="text-center text-[0.95rem] text-suave">
          Já tem uma página?{" "}
          <Link
            href="/entrar"
            className="font-medium text-destaque underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form action={acao} className="flex flex-col gap-7">
        <div>
          <label htmlFor="nome" className="text-[0.95rem] font-medium text-texto">
            Nome do negócio
          </label>
          <input
            id="nome"
            name="nome"
            required
            maxLength={80}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="organization"
            className="mt-3 w-full rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-[1.05rem] text-texto focus:border-destaque focus:outline-none"
          />
        </div>

        <CampoEndereco aoMudar={setSlug} />

        <CampoCategoria aoMudar={setCategoria} />

        {mensagem ? (
          <p
            role="alert"
            className="rounded-2xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm text-destaque"
          >
            {mensagem}
          </p>
        ) : null}

        <BotaoPrincipal type="submit">Criar página</BotaoPrincipal>

        <p className="text-center text-sm leading-relaxed text-suave">
          A página começa como rascunho, e vai para o ar quando você quiser.
        </p>
      </form>
    </Moldura>
  );
}
