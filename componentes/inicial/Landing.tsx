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

// Fontes variáveis: um arquivo por família cobre todos os pesos que o CSS usa.
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

/*
 * A ordem da tela, do primeiro scroll ao fim:
 *   1. a promessa e o botão de criar (tudo acima da dobra, no celular também)
 *   2. o arco de exemplos, logo abaixo, como prova de que serve para muita gente
 *   3. a personalização, com a página de verdade ao lado do console
 *   4. o que tem na página, em abas (uma peça por vez, texto e figura juntos)
 *   5. os ofícios, lista e foto lado a lado
 *   6. o preço e o fecho
 * Nenhuma seção tem rótulo acima do título nem número de capítulo, e a única
 * animação de entrada é a do herói. O resto aparece onde está.
 */
/*
 * A faixa que corre no topo. Dois grupos idênticos lado a lado e um deslocamento
 * de meio trilho: quando o primeiro sai, o segundo ocupa o lugar exato dele, sem
 * emenda. Cada grupo repete as frases até ser mais largo que qualquer tela, e o
 * espaço entre frases é padding do próprio item (e não margem solta), então os
 * dois grupos medem igual e o laço fecha no pixel.
 */
const FRASES = [
  "A página do seu negócio",
  "Serviços com preço, foto e horário num link só",
  "Publicar é grátis",
  "Feita para autônomos e negócios",
];
const grupo = (oculto: boolean) =>
  `<ul class="strip__grupo"${oculto ? ' aria-hidden="true"' : ""}>` +
  Array.from({ length: 3 }, () => FRASES).flat().map((f) => `<li>${f}</li>`).join("") +
  "</ul>";
const FAIXA = grupo(false) + grupo(true);

const CORPO = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><g id="porta"><path fill-rule="evenodd" d="M4 21 V11 a8 8 0 0 1 8 -8 v18 z M9.2 11 a1.3 1.3 0 0 1 -2.6 0 a1.3 1.3 0 0 1 2.6 0 z M14.5 3.5 a8 8 0 0 1 5.5 7.5 V21 h-2.8 V11 a5.2 5.2 0 0 0 -2.7 -4.6 z"/></g></defs></svg>

<header class="topbar">
  <div class="nav">
    <span></span>
    <a class="nav__brand" href="#topo"><svg viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg>Entrais</a>
    <div class="nav__cta"><a class="entrar" href="/entrar">Entrar</a><a class="join" href="/criar">Criar grátis</a></div>
  </div>
  <div class="strip"><div class="strip__track">${FAIXA}</div></div>
</header>

<main>
  <section class="hero" id="topo">
    <div class="hero-copy">
      <h1 class="mega">
        <span class="w" style="--i:0">Tudo</span> <span class="w" style="--i:1">o</span> <span class="w" style="--i:2">que</span> <span class="w" style="--i:3">você</span> <span class="w" style="--i:4">faz</span> <span class="w" style="--i:5">numa</span> <span class="w" style="--i:6"><em>página só.</em></span>
      </h1>
      <p class="sub">Catálogo, horário, galeria e o botão de WhatsApp, num endereço só seu.</p>
      <div class="cta-row">
        <form class="placa" action="/criar" method="get">
          <span class="pre">entrais.app/</span>
          <input name="slug" id="nome-topo" type="text" autocomplete="off" spellcheck="false" placeholder="seunegocio" aria-label="Escreva o endereço da sua página">
          <button type="submit" class="pill">Criar grátis</button>
        </form>
      </div>
    </div>
    <div class="hero-deck" id="exemplos" aria-label="Exemplos de páginas">
      <div class="deck" data-deck><!-- cartões injetados por JS --></div>
    </div>
  </section>

  <!-- ====== OFÍCIOS: a página final de verdade, em exemplos diferentes ====== -->
  <div class="noite">
    <section class="aparencia" id="segmentos"><div class="shell">
      <div class="ap">
        <h2 class="t-h3 ap__tit">Serve para <em>o que você faz.</em></h2>
        <div class="palco ap__pal">
          <div class="fone">
            <iframe id="demo-pagina" class="fone__tela" src="/nara-bittencourt" title="Página de exemplo de um negócio, do jeito que o cliente dele vê" loading="lazy" tabindex="-1" scrolling="no"></iframe>
          </div>
        </div>
        <div class="ap__ctl">
          <p class="ap__txt">Escolha um ofício e veja a página final de verdade. Cada negócio escolhe o próprio visual e coloca serviços, fotos, horários, endereço e links.</p>
          <ul class="ap__exemplos" aria-label="Exemplos de páginas"><!-- botões injetados por JS --></ul>
          <p class="ap__nota">Páginas de exemplo que montamos.</p>
        </div>
      </div>
    </div></section>
  </div>

  <!-- ====== O QUE TEM NA PÁGINA: abas, uma peça por vez ====== -->
  <section class="section" id="dentro"><div class="shell">
    <div class="abas" data-abas>
      <h2 class="t-h2 abas__tit">Tudo cabe numa <em>página só.</em></h2>
      <div class="abas__lista" role="tablist" aria-label="O que tem na página">
        <button class="aba" role="tab" id="aba-cat" aria-controls="painel-cat" aria-selected="true" data-desc="Foto, preço na frente e um botão que abre a conversa com o nome do item já escrito."><b>Catálogo</b><span>Foto, preço na frente e um botão que abre a conversa com o nome do item já escrito.</span></button>
        <button class="aba" role="tab" id="aba-gal" aria-controls="painel-gal" aria-selected="false" tabindex="-1" data-desc="As fotos grandes, na ordem que você escolher. O trabalho aparece antes do texto."><b>Galeria</b><span>As fotos grandes, na ordem que você escolher. O trabalho aparece antes do texto.</span></button>
        <button class="aba" role="tab" id="aba-hor" aria-controls="painel-hor" aria-selected="false" tabindex="-1" data-desc="Os horários valem no seu fuso, e quem abre vê na hora se pode chamar."><b>Horário</b><span>Os horários valem no seu fuso, e quem abre vê na hora se pode chamar.</span></button>
        <button class="aba" role="tab" id="aba-lin" aria-controls="painel-lin" aria-selected="false" tabindex="-1" data-desc="Instagram, site, agenda e playlist reunidos num endereço só, com o seu nome."><b>Links</b><span>Instagram, site, agenda e playlist reunidos num endereço só, com o seu nome.</span></button>
      </div>
      <div class="abas__palco">
        <div class="painel" role="tabpanel" id="painel-cat" aria-labelledby="aba-cat">
          <div class="comp comp-cat">
            <div class="ci"><img src="/exemplo/bolo-3.jpg" alt=""><div class="cinfo"><b>Bolo de chocolate</b><span>Fatia individual</span></div><div class="cpr">R$ 12</div></div>
            <div class="ci"><img src="/exemplo/pao-1.jpg" alt=""><div class="cinfo"><b>Pão da casa</b><span>Fornada do dia</span></div><div class="cpr">R$ 9</div></div>
            <div class="ci"><img src="/exemplo/galeria-6.jpg" alt=""><div class="cinfo"><b>Bolo de noiva</b><span>Sob encomenda</span></div><div class="cpr">R$ 180</div></div>
            <div class="cwpp">Chamar no WhatsApp</div>
          </div>
        </div>
        <div class="painel" role="tabpanel" id="painel-gal" aria-labelledby="aba-gal" hidden>
          <div class="comp comp-gal"><img src="/vitrine/tatuagem.jpg" alt=""><img src="/vitrine/ilustracao.jpg" alt=""><img src="/vitrine/ceramica.jpg" alt=""><img src="/vitrine/canto.jpg" alt=""><img src="/vitrine/cafe.jpg" alt=""><img src="/vitrine/massagem.jpg" alt=""></div>
        </div>
        <div class="painel" role="tabpanel" id="painel-hor" aria-labelledby="aba-hor" hidden>
          <div class="comp comp-hor">
            <div class="hstat"><span class="dot"></span> Aberto agora <em>· fecha 18h</em></div>
            <ul>
              <li><span>Segunda a sexta</span><b>9h – 18h</b></li>
              <li><span>Sábado</span><b>9h – 13h</b></li>
              <li><span>Domingo</span><b>a combinar</b></li>
            </ul>
            <div class="hbtn">Agendar horário</div>
          </div>
        </div>
        <div class="painel" role="tabpanel" id="painel-lin" aria-labelledby="aba-lin" hidden>
          <div class="comp comp-links">
            <a class="lk"><svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="#E1306C" stroke="none"/></svg>Instagram<span>@seunome</span></a>
            <a class="lk"><svg viewBox="0 0 24 24" fill="#1DB954"><circle cx="12" cy="12" r="10"/><path d="M7 9.6c3.2-1 7.4-.6 9.4 1" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M7.6 12.6c2.6-.8 5.8-.4 7.4.9" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M8.2 15.3c2-.6 4.2-.3 5.3.7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>Spotify<span>Playlist</span></a>
            <a class="lk"><svg viewBox="0 0 24 24" fill="none" stroke="#a5384c" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/></svg>Site<span>seunome.com</span></a>
            <a class="lk"><svg viewBox="0 0 24 24" fill="none" stroke="#17161a" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.5h17M8 3.2v3.6M16 3.2v3.6"/></svg>Agenda<span>Marcar horário</span></a>
          </div>
        </div>
        <p class="abas__desc" aria-live="polite"></p>
      </div>
    </div>
  </div></section>

  <!-- ====== PREÇO ====== -->
  <section class="section precos-sec" id="preco"><div class="shell">
    <div class="precos-head">
      <h2 class="t-h2">Comece de graça. <em>Cresça quando quiser.</em></h2>
      <p class="precos-sub">A sua página fica no ar de graça. O plano ${NOME_DO_PLANO.pago} abre a letra da marca e os números por dentro.</p>
    </div>
  </div>
    <div class="precos bleed">
      <div class="plano free">
        <div class="nome">${NOME_DO_PLANO.gratuito}</div>
        <div class="preco">R$0 <u>para sempre</u></div>
        <p class="sub2">A sua página no ar, com o seu endereço.</p>
        <a class="cta" href="#comecar">Criar grátis</a>
        <ul class="bens">
          <li>A sua página no ar, com o seu endereço</li>
          <li>Até ${ITENS_NO_CATALOGO.gratuito} itens no catálogo, com foto e preço</li>
          <li>5 temas e 5 texturas para escolher</li>
          <li>Um relatório de quantas pessoas abriram a página, a cada 7 dias</li>
        </ul>
      </div>
      <div class="plano pago">
        <div class="nome">${NOME_DO_PLANO.pago}</div>
        <div class="preco">${MENSAL} <u>por mês</u></div>
        <p class="sub2">No ano são ${ANUAL}, com ${MESES_DE_CORTESIA_PROMETIDOS} meses por conta nossa. Cancele quando quiser.</p>
        <a class="cta" href="#comecar">Assinar</a>
        <ul class="bens forte">
          <li>Tudo do plano grátis, e mais</li>
          <li>Até ${ITENS_NO_CATALOGO.pago} itens no catálogo</li>
          <li>A letra da sua marca, entre 5 combinações</li>
          <li>Os números dia a dia, com a origem de cada visita</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="fecho" id="comecar"><div class="shell">
    <svg class="fecho__porta" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="#porta"/></svg>
    <p class="t-display">Abra a sua página. <em>É de graça.</em></p>
    <div class="cta-row">
      <form class="placa" action="/criar" method="get">
        <span class="pre">entrais.app/</span>
        <input name="slug" id="nome-fim" type="text" autocomplete="off" spellcheck="false" placeholder="seunegocio" aria-label="Escreva o endereço da sua página">
        <button type="submit" class="pill">Criar grátis</button>
      </form>
    </div>
  </div></section>
</main>

<footer><div class="shell in">
  <span class="feito"><svg viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg>feito com <b>Entrais</b></span>
  <nav class="rodape-links" aria-label="Rodapé"><a href="/precos">Preços</a><a href="/blog">Blog</a><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a><a href="/entrar">Entrar</a></nav>
</div></footer>`;

export function Landing() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let parado = false;
    (async () => {
      if (parado || !ref.current) return;
      const { initLanding } = await import("./landing-motion");
      // Conferir de novo depois do import: no modo de desenvolvimento o React roda
      // o efeito duas vezes, e sem isto a inicialização rodava nas duas.
      const raiz = ref.current;
      if (parado || !raiz || raiz.dataset.pronto) return;
      raiz.dataset.pronto = "1";
      initLanding(IMGS);
    })();
    return () => { parado = true; };
  }, []);
  return (
    <div
      ref={ref}
      className={`lp js ${sans.variable} ${mono.variable}`}
      dangerouslySetInnerHTML={{ __html: CORPO }}
    />
  );
}
