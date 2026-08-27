import Link from "next/link";
import { BotaoCopiar } from "./BotaoCopiar";
import { IconeSeta, IconeWhatsapp } from "@/componentes/Icones";
import { DOMINIO_PUBLICO } from "@/lib/marca";
import type { Negocio } from "@/lib/tipos";

/**
 * O momento em que a página vai para o ar.
 *
 * **É o pico do fluxo, e o único da vida da página em que ela acabou de nascer
 * para o mundo.** A lei Peak-End diz que a pessoa lembra de uma experiência
 * pelo pico e pelo fim; publicar era o pico, e voltava calado para uma tela que
 * começava com "Oi". Aqui ele ganha o momento que merece: o certo de que
 * funcionou, o link pronto para mandar, e o caminho de compartilhar, que é a
 * única aquisição que o produto tem (ver componentes/Rodape.tsx).
 *
 * O tom é de padrão Apple: um certo que se desenha, sem confete. O movimento é
 * curto, e cede para quem pediu menos movimento no aparelho, que é regra de
 * acessibilidade e do guia de motion.
 *
 * Nenhuma palavra de falta, como em toda tela do produto: cada linha diz o que
 * passou a existir.
 */

/** O certo que se desenha ao chegar, uma microinteração de Doherty. */
function CertoDesenhado() {
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <style href="painel-publicou" precedence="default">{`
        @keyframes publicou-entra {
          from { opacity: 0; transform: translateY(8px) }
        }
        @keyframes publicou-circulo {
          from { transform: scale(0.6); opacity: 0 }
        }
        @keyframes publicou-risco {
          from { stroke-dashoffset: 22 }
        }
        .publicou-cartao { animation: publicou-entra 0.5s cubic-bezier(0.22,1,0.36,1) }
        .publicou-circulo { animation: publicou-circulo 0.4s cubic-bezier(0.22,1,0.36,1) }
        .publicou-risco {
          stroke-dasharray: 22;
          animation: publicou-risco 0.5s 0.15s cubic-bezier(0.65,0,0.35,1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .publicou-cartao, .publicou-circulo, .publicou-risco { animation: none }
          .publicou-risco { stroke-dashoffset: 0 }
        }
      `}</style>
      <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
        <circle
          className="publicou-circulo"
          cx="24"
          cy="24"
          r="22"
          fill="var(--c-aberto-texto)"
          opacity="0.14"
        />
        <path
          className="publicou-risco"
          d="M15 24.5l6 6 12-13"
          fill="none"
          stroke="var(--c-aberto-texto)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Publicou({ negocio }: { negocio: Negocio }) {
  const link = `https://${DOMINIO_PUBLICO}/${negocio.slug}`;
  const recado = encodeURIComponent(`Dá uma olhada na minha página: ${link}`);

  return (
    <div
      role="status"
      className="publicou-cartao mt-4 rounded-2xl border border-aberto-texto/25 bg-aberto-fundo/60 p-5"
    >
      <div className="flex items-center gap-4">
        <CertoDesenhado />
        <div className="min-w-0">
          <p className="titulo text-xl text-texto">Sua página está no ar.</p>
          <p className="mt-0.5 text-sm leading-relaxed text-suave">
            Qualquer pessoa que abrir o link já vê a sua página inteira.
          </p>
        </div>
      </div>

      {/* O link, grande, para a pessoa reconhecer o que vai mandar. */}
      <p className="mt-4 text-[1.05rem] leading-snug font-semibold break-words text-texto">
        {DOMINIO_PUBLICO}/{negocio.slug}
      </p>

      <div className="mt-3">
        <BotaoCopiar link={link} />
      </div>

      {/*
        Os dois caminhos do momento: ver como ficou, e mandar para alguém. O
        compartilhar no WhatsApp abre a conversa com o link já escrito, que é o
        laço de aquisição do produto, oferecido no exato instante em que a
        pessoa está mais orgulhosa da página.
      */}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/${negocio.slug}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-borda bg-superficie px-5 text-sm font-semibold text-texto transition-transform duration-75 active:scale-[0.97]"
        >
          Ver a página
          <IconeSeta className="h-4 w-4" />
        </Link>
        <a
          href={`https://wa.me/?text=${recado}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-zap px-5 text-sm font-semibold text-superficie transition-transform duration-75 active:scale-[0.97]"
        >
          <IconeWhatsapp className="h-4 w-4" />
          Compartilhar no WhatsApp
        </a>
      </div>
    </div>
  );
}
