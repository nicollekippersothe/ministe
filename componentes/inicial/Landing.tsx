"use client";

import { useEffect, useRef } from "react";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { preco } from "@/lib/formato";
import {
  ITENS_NO_CATALOGO,
  MESES_DE_CORTESIA_PROMETIDOS,
  NOME_DO_PLANO,
  PLANOS,
} from "@/lib/pagamento/precos";
import "./landing.css";

// Fontes variáveis: um arquivo por família cobre todos os pesos que o CSS usa,
// então a home baixa só duas letras, do mesmo jeito que a prévia antiga.
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const IMGS = {
  tatuagem: "/vitrine/tatuagem.jpg",
  ilustracao: "/vitrine/ilustracao.jpg",
  canto: "/vitrine/canto.jpg",
  astrologia: "/vitrine/astrologia.jpg",
  massagem: "/vitrine/massagem.jpg",
  psicologia: "/vitrine/psicologia.jpg",
  confeitaria: "/vitrine/confeitaria.jpg",
  ceramica: "/vitrine/ceramica.jpg",
  cafe: "/vitrine/cafe.jpg",
  interiores: "/vitrine/interiores.jpg",
  yoga: "/vitrine/yoga.jpg",
  caligrafia: "/vitrine/caligrafia.jpg",
};

/*
 * Os números de venda saem de lib/pagamento/precos, a mesma tabela do checkout.
 * Digitar preço ou limite aqui foi como a tela inicial passou a prometer 400
 * itens quando o banco entrega 500.
 */
const MENSAL = preco(PLANOS.mensal.valorCentavos);
const ANUAL = preco(PLANOS.anual.valorCentavos).replace(/,00$/, "");

const CORPO = `<div class="grao"></div>
<div class="transition" aria-hidden="true"><div class="transition__panel"></div></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><g id="porta"><path fill-rule="evenodd" d="M4 21 V11 a8 8 0 0 1 8 -8 v18 z M9.2 11 a1.3 1.3 0 0 1 -2.6 0 a1.3 1.3 0 0 1 2.6 0 z M14.5 3.5 a8 8 0 0 1 5.5 7.5 V21 h-2.8 V11 a5.2 5.2 0 0 0 -2.7 -4.6 z"/></g></defs></svg>

<header class="topbar">
  <div class="nav">
    <span></span>
    <a class="nav__brand" href="#topo"><svg viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg>Entrais</a>
    <div class="nav__cta"><a class="entrar" href="/entrar">Entrar</a><a class="join" href="/criar" data-cur>Criar grátis</a></div>
  </div>
  <div class="strip" aria-hidden="true"><div class="strip__track"><span>Exemplos que montamos com o Entrais <i>&#10033;</i> Catálogo, horário e galeria num link só <i>&#10033;</i> O seu trabalho, com o seu nome <i>&#10033;</i> </span><span>Exemplos que montamos com o Entrais <i>&#10033;</i> Catálogo, horário e galeria num link só <i>&#10033;</i> O seu trabalho, com o seu nome <i>&#10033;</i> </span></div></div>
</header>

<main>
  <section class="hero" id="topo">
    <div class="hero-deck" id="exemplos" data-parallax>
      <div class="deck" data-deck><!-- cards injetados por JS --></div>
    </div>
    <div class="hero-copy">
      <h1 class="mega">
        <span class="w">Tudo</span> <span class="w">o</span> <span class="w">que</span> <span class="w">você</span> <span class="w">faz</span><span class="dglyph" aria-hidden="true"><canvas id="porta3d"></canvas><svg class="fallback-arco" viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg></span><span class="w">numa</span> <span class="w"><em>página só.</em></span>
      </h1>
      <p class="sub" data-reveal>Catálogo, horário, galeria e o botão de WhatsApp, num endereço com o seu nome.</p>
      <div class="cta-row" data-reveal>
        <form class="placa" action="/criar" method="get" data-cur>
          <span class="pre">entrais.app/</span>
          <input name="slug" id="nome-topo" type="text" autocomplete="off" spellcheck="false" placeholder="seunome" aria-label="Escreva o seu nome no endereço">
          <button type="submit" class="pill" data-magnetic data-magnetic-strength="0.25">Criar grátis</button>
        </form>
      </div>
    </div>
  </section>

  <!-- ====== NOITE ====== -->
  <div class="noite">
    <section class="aparencia" id="aparencia"><div class="shell in">
      <div class="palco" data-reveal>
        <div class="fone">
          <iframe id="demo-pagina" class="fone__tela" src="/nara-bittencourt" title="Página de exemplo de uma astróloga, do jeito que o cliente dela vê" loading="lazy" tabindex="-1"></iframe>
        </div>
        <p class="palco__nota">Página de exemplo que montamos, a mesma que o cliente abre no celular.</p>
      </div>
      <div class="block aparencia__texto">
        <span class="eyebrow-num">Personalização</span>
        <h3 class="t-h3" data-split="lines">A mesma página, <em>cinco interfaces.</em></h3>
        <p class="t-lead" data-reveal>Troque o tema e a textura no console e veja a página ao lado se repintar na hora. Cada negócio fica com a cara que combina com ele.</p>
        <div class="console" role="group" aria-label="Trocar a aparência da página" data-reveal>
          <div class="console__row"><span class="console__lbl">Tema</span>
            <div class="fila" id="temas">
              <button class="chip" data-tema="areia" aria-pressed="false"><span class="am" style="background:linear-gradient(135deg,#f6f5f3 50%,#8f4451 50%)"></span>Areia</button>
              <button class="chip" data-tema="minimal" aria-pressed="false"><span class="am" style="background:linear-gradient(135deg,#f5f5f7 50%,#1d1d1f 50%)"></span>Minimal</button>
              <button class="chip" data-tema="menta" aria-pressed="false"><span class="am" style="background:linear-gradient(135deg,#f2f5f2 50%,#1f6b4f 50%)"></span>Menta</button>
              <button class="chip" data-tema="noite" aria-pressed="false"><span class="am" style="background:linear-gradient(135deg,#14120f 50%,#e0a878 50%)"></span>Noite</button>
              <button class="chip" data-tema="cosmico" aria-pressed="true"><span class="am" style="background:linear-gradient(135deg,#0b0b16 50%,#a493f2 50%)"></span>Cósmico</button>
            </div>
          </div>
          <div class="console__row"><span class="console__lbl">Textura</span>
            <div class="fila" id="fundos">
              <button class="chip" data-fundo="liso" aria-pressed="false">Liso</button>
              <button class="chip" data-fundo="papel" aria-pressed="false">Papel</button>
              <button class="chip" data-fundo="tinta" aria-pressed="false">Tinta</button>
              <button class="chip" data-fundo="degrade" aria-pressed="false">Degradê</button>
              <button class="chip" data-fundo="vinheta" aria-pressed="true">Vinheta</button>
            </div>
          </div>
        </div>
        <p class="aparencia__nota" data-reveal>Tema e textura valem no plano grátis. A letra da página é do plano ${NOME_DO_PLANO.pago}. <a href="#preco">Ver os planos</a></p>
      </div>
    </div></section>
  </div>

  <!-- ====== RECURSOS ====== -->
  <section class="section" id="dentro"><div class="shell">
    <div class="head block" style="max-width:40rem;margin-bottom:calc(var(--body)*1)">
      <h2 class="t-h2" data-split="lines">Tudo cabe numa <em>página só.</em></h2>
    </div>

    <div class="recurso" data-reveal-row><div class="r-fig" data-cur><span class="tag">Catálogo</span>
      <div class="comp comp-cat">
        <div class="ci"><img src="/exemplo/bolo-3.jpg" alt=""><div class="cinfo"><b>Bolo de chocolate</b><span>Fatia individual</span></div><div class="cpr">R$ 12</div></div>
        <div class="ci"><img src="/exemplo/pao-1.jpg" alt=""><div class="cinfo"><b>Pão da casa</b><span>Fornada do dia</span></div><div class="cpr">R$ 9</div></div>
        <div class="cwpp">Chamar no WhatsApp</div>
      </div></div>
      <div class="r-txt"><span class="n">01 — Catálogo</span><h3>Cada serviço com preço e um toque para o WhatsApp.</h3><p>Foto, o preço na frente e o botão que abre a conversa já com o item escrito. O seu balcão, aberto o dia inteiro.</p></div></div>

    <div class="recurso inv" data-reveal-row><div class="r-fig" data-cur><span class="tag">Galeria</span>
      <div class="comp comp-gal"><img src="/exemplo/astro-1.jpg" alt=""><img src="/exemplo/tatu-capa.jpg" alt=""><img src="/exemplo/ilustra-3.jpg" alt=""><img src="/exemplo/canto-capa.jpg" alt=""><img src="/exemplo/bolo-3.jpg" alt=""><img src="/exemplo/spa-1.jpg" alt=""></div></div>
      <div class="r-txt"><span class="n">02 — Galeria</span><h3>As suas fotos grandes, do jeito que uma obra pede.</h3><p>Tela cheia, na ordem que você escolher. O trabalho aparece primeiro, como numa parede de exposição.</p></div></div>

    <div class="recurso" data-reveal-row><div class="r-fig" data-cur><span class="tag">Horário</span>
      <div class="comp comp-hor">
        <div class="hstat"><span class="dot"></span> Aberto agora <em>· fecha 18h</em></div>
        <ul>
          <li><span>Segunda a sexta</span><b>9h – 18h</b></li>
          <li><span>Sábado</span><b>9h – 13h</b></li>
          <li><span>Domingo</span><b>a combinar</b></li>
        </ul>
        <div class="hbtn">Agendar horário</div>
      </div></div>
      <div class="r-txt"><span class="n">03 — Horário</span><h3>Um espaço para os seus horários, se você quiser.</h3><p>Você diz quando atende, e a página calcula no seu fuso. Quem abre já vê se pode chamar agora, com o endereço no mapa.</p></div></div>

    <div class="recurso inv" data-reveal-row><div class="r-fig" data-cur><span class="tag">Links</span>
      <div class="comp comp-links">
        <a class="lk"><svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="#E1306C" stroke="none"/></svg>Instagram<span>@seunome</span></a>
        <a class="lk"><svg viewBox="0 0 24 24" fill="#1DB954"><circle cx="12" cy="12" r="10"/><path d="M7 9.6c3.2-1 7.4-.6 9.4 1" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M7.6 12.6c2.6-.8 5.8-.4 7.4.9" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M8.2 15.3c2-.6 4.2-.3 5.3.7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>Spotify<span>Playlist</span></a>
        <a class="lk"><svg viewBox="0 0 24 24" fill="none" stroke="#a5384c" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/></svg>Site<span>seunome.com</span></a>
        <a class="lk"><svg viewBox="0 0 24 24" fill="none" stroke="#17161a" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.5h17M8 3.2v3.6M16 3.2v3.6"/></svg>Agenda<span>Marcar horário</span></a>
      </div></div>
      <div class="r-txt"><span class="n">04 — Links</span><h3>Instagram, site, Spotify e agenda, num endereço só.</h3><p>Tudo o que estava espalhado, reunido num link com o seu nome. E os números de quem abre e quem chama você, para provar que a página trabalha.</p></div></div>
  </div></section>

  <!-- ====== SEGMENTOS (carrossel 3D) ====== -->
  <section class="segmentos" id="segmentos"><div class="shell">
    <div class="seg-explorer" data-explorer>
      <div class="seg-lado">
        <span class="eyebrow-num">Para cada ofício</span>
        <h2 class="t-h2" data-split="lines">Serve para <em>o que você faz.</em></h2>
        <p class="t-lead" data-reveal>A mesma página se ajeita para o seu ramo. Passe o olho pelos ofícios e veja um exemplo de cada um.</p>
        <ol class="seg-lista" data-reveal><!-- itens injetados por JS --></ol>
      </div>
      <figure class="seg-preview" data-reveal>
        <div class="seg-molde"><img class="seg-img" src="/exemplo/tatu-1.jpg" alt=""><span class="seg-tag">entrais.app/teosarmento</span></div>
      </figure>
    </div>
  </div></section>

  <!-- ====== PREÇO ====== -->
  <section class="section" id="preco" style="padding-bottom:0"><div class="shell">
    <div class="precos-head block">
      <h2 class="t-h2" data-split="lines">Comece de graça.<br><em>Cresça quando quiser.</em></h2>
      <p class="precos-sub" data-reveal>A sua página fica no ar de graça. O plano ${NOME_DO_PLANO.pago} abre a letra da marca e os números por dentro.</p>
    </div>
  </div>
    <div class="precos bleed" data-reveal>
      <div class="plano free">
        <span class="tag">Para começar</span>
        <div class="nome">${NOME_DO_PLANO.gratuito}</div>
        <div class="preco">R$0 <u>para sempre</u></div>
        <p class="sub2">A sua página no ar, com o seu endereço.</p>
        <a class="cta" href="#comecar" data-cur>Criar grátis</a>
        <div class="rule2"></div>
        <ul class="bens">
          <li>A sua página no ar, com o seu endereço</li>
          <li>Até ${ITENS_NO_CATALOGO.gratuito} itens no catálogo, com foto e preço</li>
          <li>5 temas e 5 texturas para escolher</li>
          <li>Um relatório de quantas pessoas abriram a sua página, a cada 7 dias</li>
        </ul>
        <a class="verlink" href="#dentro">Ver tudo que vem junto</a>
      </div>
      <div class="plano pago">
        <span class="tag">Tudo liberado</span>
        <div class="nome">${NOME_DO_PLANO.pago}</div>
        <div class="preco">${MENSAL} <u>por mês</u></div>
        <p class="sub2">No ano são ${ANUAL}, com ${MESES_DE_CORTESIA_PROMETIDOS} meses por conta nossa. Cancele quando quiser.</p>
        <a class="cta" href="#comecar" data-cur>Assinar</a>
        <div class="rule2"></div>
        <ul class="bens forte">
          <li>Tudo do plano grátis, e mais</li>
          <li>Até ${ITENS_NO_CATALOGO.pago} itens no catálogo</li>
          <li>A letra da sua marca, entre 5 combinações</li>
          <li>Os números dia a dia, com a origem de cada visita</li>
        </ul>
        <a class="verlink" href="#aparencia">Ver o que muda</a>
      </div>
    </div>
  </section>

  <section class="fecho" id="comecar"><div class="shell">
    <p class="t-display" data-split="lines">Abra a sua fachada<br>digital. <em>É de graça.</em></p>
    <div class="cta-row" style="display:flex">
      <form class="placa" action="/criar" method="get" data-cur>
        <span class="pre">entrais.app/</span>
        <input name="slug" id="nome-fim" type="text" autocomplete="off" spellcheck="false" placeholder="seunome" aria-label="Escreva o seu nome no endereço">
        <button type="submit" class="pill" data-magnetic data-magnetic-strength="0.25">Criar a minha</button>
      </form>
    </div>
  </div></section>
</main>

<footer><div class="shell in">
  <span class="feito"><svg viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg>feito com <b>Entrais</b></span>
  <nav class="rodape-links" aria-label="Rodapé"><a href="/blog">Blog</a><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a><a href="/entrar">Entrar</a></nav>
</div></footer>`;

export function Landing() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let parado = false;
    (window as any).__stop3d = false;
    (async () => {
      const THREE = await import("three");
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { SplitText } = await import("gsap/SplitText");
      const { CustomEase } = await import("gsap/CustomEase");
      const Lenis = (await import("lenis")).default;
      if (parado || !ref.current) return;
      const { initLanding } = await import("./landing-motion");
      initLanding(THREE, gsap, ScrollTrigger, SplitText, CustomEase, Lenis, IMGS);
    })();
    return () => { parado = true; (window as any).__stop3d = true; };
  }, []);
  return (
    <div
      ref={ref}
      className={`lp js ${sans.variable} ${mono.variable}`}
      dangerouslySetInnerHTML={{ __html: CORPO }}
    />
  );
}
