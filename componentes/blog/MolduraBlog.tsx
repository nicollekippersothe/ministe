import Link from "next/link";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { CADASTRO_ABERTO } from "@/lib/site";
import "./blog.css";

/**
 * A moldura do blog: a cara do Entrais em volta do conteúdo.
 *
 * Baixa as mesmas duas letras da inicial (Instrument Sans no display, JetBrains
 * Mono nos rótulos) e veste o papel areia, o grão e o acento marsala. A capa e
 * cada matéria entram como children e cuidam só da própria largura de leitura.
 */
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/** O glifo da porta, o mesmo símbolo da marca na inicial. */
function Porta() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4 21 V11 a8 8 0 0 1 8 -8 v18 z M9.2 11 a1.3 1.3 0 0 1 -2.6 0 a1.3 1.3 0 0 1 2.6 0 z M14.5 3.5 a8 8 0 0 1 5.5 7.5 V21 h-2.8 V11 a5.2 5.2 0 0 0 -2.7 -4.6 z"
      />
    </svg>
  );
}

export function MolduraBlog({ children }: { children: React.ReactNode }) {
  return (
    <div data-tema="areia" className={`blog ${sans.variable} ${mono.variable}`}>
      <div className="blog-grao" aria-hidden="true" />

      <div className="blog-shell">
        <header className="blog-topo">
          <Link href="/" className="blog-marca">
            <Porta />
            Entrais
          </Link>
          {CADASTRO_ABERTO ? (
            <Link href="/criar" className="pill">
              Criar grátis
            </Link>
          ) : null}
        </header>

        {children}

        <footer className="blog-rodape">
          <span className="feito">
            <Porta />
            feito com <b>Entrais</b>
          </span>
          <nav aria-label="Rodapé">
            <Link href="/">Início</Link>
            <Link href="/precos">Preços</Link>
            <Link href="/termos">Termos</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
