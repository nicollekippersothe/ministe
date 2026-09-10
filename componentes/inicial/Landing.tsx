"use client";

import { useEffect, useRef } from "react";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./landing.css";

// Fontes variáveis: um arquivo por família cobre todos os pesos que o CSS usa,
// então a home baixa só duas letras, do mesmo jeito que a prévia antiga.
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const IMGS = {
  isis: "/exemplo/astro-1.jpg",
  teo: "/exemplo/tatu-capa.jpg",
  lia: "/exemplo/ilustra-3.jpg",
  bia: "/exemplo/canto-capa.jpg",
  alecrim: "/exemplo/bolo-3.jpg",
  helena: "/exemplo/spa-1.jpg",
};

const CORPO = `<div class="grao"></div>
<div class="cursor" id="cursor" aria-hidden="true"></div>
<div class="transition" aria-hidden="true"><div class="transition__panel"></div></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><g id="porta"><path fill-rule="evenodd" d="M4 21 V11 a8 8 0 0 1 8 -8 v18 z M9.2 11 a1.3 1.3 0 0 1 -2.6 0 a1.3 1.3 0 0 1 2.6 0 z M14.5 3.5 a8 8 0 0 1 5.5 7.5 V21 h-2.8 V11 a5.2 5.2 0 0 0 -2.7 -4.6 z"/></g></defs></svg>

<header class="topbar">
  <div class="nav">
    <button class="nav__menu" type="button" aria-label="Menu"><span class="bars" aria-hidden="true"><i></i><i></i></span><span>Menu</span></button>
    <a class="nav__brand" href="#topo"><svg viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg>Entrais</a>
    <div class="nav__cta"><a class="entrar" href="/entrar">Entrar</a><a class="join" href="/criar" data-cur>Criar grátis</a></div>
  </div>
  <div class="strip" aria-hidden="true"><div class="strip__track"><span>Páginas feitas com Entrais <i>&#10033;</i> Catálogo, horário e galeria num link só <i>&#10033;</i> O seu trabalho, com o seu nome <i>&#10033;</i> </span><span>Páginas feitas com Entrais <i>&#10033;</i> Catálogo, horário e galeria num link só <i>&#10033;</i> O seu trabalho, com o seu nome <i>&#10033;</i> </span></div></div>
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
      <div class="molde" data-reveal>
        <div class="produto" id="produto" data-tema="areia" data-fundo="liso">
          <div class="miolo">
            <div class="p-banner"><svg viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg></div>
            <div class="p-id">
              <div class="p-nicho" data-forma="porta"><svg viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg></div>
              <div class="p-fio"></div><div class="p-rot">Plataforma · Brasil</div>
              <div class="p-nome">Entrais</div>
              <div class="p-frase">A página do seu negócio, bonita como o seu trabalho.</div>
              <div class="p-selo"><span class="d"></span><b>Aberto</b><span>grátis para começar</span></div>
            </div>
            <div class="p-grade"><div class="p-cel"><img src="/exemplo/astro-1.jpg" alt=""></div><div class="p-cel"><img src="/exemplo/tatu-capa.jpg" alt=""></div><div class="p-cel"><img src="/exemplo/ilustra-3.jpg" alt=""></div><div class="p-cel swatch"></div></div>
            <div class="p-links">
              <a class="p-lk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>Instagram<span>@entrais</span></a>
              <a class="p-lk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/></svg>Site<span>entrais.app</span></a>
            </div>
            <div class="p-wpp">Chamar no WhatsApp</div>
          </div>
        </div>
      </div>
      <div class="block">
        <h3 class="t-h3" data-split="lines">A mesma página, <em>cinco interfaces.</em></h3>
        <p class="t-lead" data-reveal style="font-size:1.1em">Esta é a nossa própria página, feita no Entrais. Troque o tema e a textura no console e veja a interface mudar na hora. Cada negócio fica com a cara que combina com ele.</p>
        <div class="console" role="group" aria-label="Trocar a aparência da página" data-reveal>
          <div class="console__row"><span class="console__lbl">Tema</span>
            <div class="fila" id="temas">
              <button class="chip" data-tema="areia" aria-pressed="true"><span class="am" style="background:#f6f5f3"></span>Areia</button>
              <button class="chip" data-tema="minimal" aria-pressed="false"><span class="am" style="background:#f5f5f7"></span>Minimal</button>
              <button class="chip" data-tema="menta" aria-pressed="false"><span class="am" style="background:#1f6b4f"></span>Menta</button>
              <button class="chip" data-tema="noite" aria-pressed="false"><span class="am" style="background:#1e1b17"></span>Noite</button>
              <button class="chip" data-tema="cosmico" aria-pressed="false"><span class="am" style="background:#0b0b16"></span>Cósmico</button>
            </div>
          </div>
          <div class="console__row"><span class="console__lbl">Textura</span>
            <div class="fila" id="fundos">
              <button class="chip" data-fundo="liso" aria-pressed="true">Liso</button>
              <button class="chip" data-fundo="papel" aria-pressed="false">Papel</button>
              <button class="chip" data-fundo="tinta" aria-pressed="false">Tinta</button>
              <button class="chip" data-fundo="degrade" aria-pressed="false">Degradê</button>
              <button class="chip" data-fundo="vinheta" aria-pressed="false">Vinheta</button>
            </div>
          </div>
        </div>
      </div>
    </div></section>
  </div>

  <!-- ====== RECURSOS ====== -->
  <section class="section" id="dentro"><div class="shell">
    <div class="head block" style="max-width:40rem;margin-bottom:calc(var(--body)*2)">
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

  <!-- ====== PREÇO ====== -->
  <section class="section" id="preco" style="padding-bottom:0"><div class="shell">
    <div class="precos-head block">
      <h2 class="t-h2" data-split="lines">Comece de graça.<br><em>Cresça quando quiser.</em></h2>
      <p class="precos-sub" data-reveal>A sua página fica no ar de graça. O plano pago abre os temas, a agenda e os números por dentro.</p>
    </div>
  </div>
    <div class="precos bleed" data-reveal>
      <div class="plano free">
        <span class="tag">Para começar</span>
        <div class="nome">Grátis</div>
        <div class="preco">R$0 <u>para sempre</u></div>
        <p class="sub2">A sua página no ar, com o seu endereço.</p>
        <a class="cta" href="#comecar" data-cur>Criar de graça</a>
        <div class="rule2"></div>
        <ul class="bens">
          <li>A sua página no ar, com o seu endereço</li>
          <li>Até 20 itens no catálogo, com foto e preço</li>
          <li>Um relatório de quantas pessoas abriram a sua página, a cada 7 dias</li>
        </ul>
        <a class="verlink" href="#dentro">Ver tudo que vem junto</a>
      </div>
      <div class="plano pago">
        <span class="tag">Tudo liberado</span>
        <div class="nome">Pago</div>
        <div class="preco">R$19,90 <u>por mês</u></div>
        <p class="sub2">No ano são R$179, com 3 meses de graça. Cancele quando quiser.</p>
        <a class="cta" href="#comecar" data-cur>Assinar</a>
        <div class="rule2"></div>
        <ul class="bens forte">
          <li>Tudo do plano grátis, e mais</li>
          <li>Até 400 itens no catálogo</li>
          <li>Agendamento de horário</li>
          <li>5 temas, 5 texturas e a letra da sua marca</li>
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
  <nav class="rodape-links" aria-label="Rodapé"><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a><a href="/entrar">Entrar</a></nav>
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
