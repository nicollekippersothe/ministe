// @ts-nocheck
/* eslint-disable */
import { normalizar, conferirFormato, MOTIVOS } from "@/lib/slug";
export function initLanding(IMGS) {

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch) document.body.classList.add("touch");
  var I = IMGS;

  var NEG = [
    { nome:"Téo Sarmento", of:"Tatuagem", cid:"São Paulo", img:I.tatuagem },
    { nome:"Lia Prado", of:"Ilustração", cid:"Curitiba", img:I.ilustracao },
    { nome:"Bia Marconi", of:"Canto", cid:"Porto Alegre", img:I.canto },
    { nome:"Ísis Moraes", of:"Astrologia", cid:"Salvador", img:I.astrologia },
    { nome:"Helena Vasques", of:"Massoterapia", cid:"Belo Horizonte", img:I.massagem },
    { nome:"Camila Reis", of:"Psicologia", cid:"São Paulo", img:I.psicologia },
    { nome:"Alecrim", of:"Confeitaria", cid:"São Paulo", img:I.confeitaria },
    { nome:"Ateliê Argila", of:"Cerâmica", cid:"Recife", img:I.ceramica },
    { nome:"Grão", of:"Cafeteria", cid:"Brasília", img:I.cafe },
    { nome:"Dani Okamoto", of:"Interiores", cid:"Curitiba", img:I.interiores },
    { nome:"Marina Teles", of:"Yoga", cid:"Florianópolis", img:I.yoga },
    { nome:"Caio Brandão", of:"Caligrafia", cid:"Brasília", img:I.caligrafia }
  ];
  // O texto fica dentro da foto, sobre um escurecido que sobe de baixo (o contraste
  // do texto branco não depende de qual foto está atrás), e a legenda é uma peça
  // só com a imagem. O endereço saiu do cartão: era um microtexto sobre a foto
  // que ninguém lia, e o cartão não leva a lugar nenhum.
  function mock(n) {
    return '<figure class="loja">'+
      '<img class="loja__foto" src="'+n.img+'" alt="" draggable="false" width="480" height="600">'+
      '<figcaption class="loja__id"><b>'+n.nome+'</b><span>'+n.of+'</span></figcaption>'+
    '</figure>';
  }

  /* ---------- deck em arco ----------
   * Um arco de verdade, de ponta a ponta da tela: cada cartão fica num ponto de
   * um círculo grande e gira pela tangente do mesmo ângulo, então as pontas
   * descem e se inclinam e o centro fica de pé.
   *
   * O que travava na versão anterior: o carrossel andava mudando scrollLeft (que
   * força o navegador a refazer o layout a cada quadro) e reescrevia opacidade e
   * z-index de todos os cartões. Aqui o quadro só escreve `transform`, que a
   * placa de vídeo resolve sem layout. As medidas saem uma vez, em measure(), e o
   * relógio para quando o herói sai da tela ou a aba fica em segundo plano.
   *
   * A altura do palco é medida (cartão com o nome, mais o quanto a ponta do arco
   * afunda), então o nome embaixo nunca encosta na borda de um recorte. */
  function initDeck(deck) {
    var lista = NEG;   // 12 diferentes: a volta é mais larga que a tela, sem nome repetido à vista
    lista.forEach(function (n) { var w = document.createElement("div"); w.className = "deck__card"; w.innerHTML = mock(n); deck.appendChild(w); });
    var cards = [].slice.call(deck.querySelectorAll(".deck__card"));
    var cw = 140, s = 170, total = 0, vw = 0, R = 1500, off = 0;
    function layout() {
      var meio = vw / 2 - cw / 2, metade = total / 2;
      for (var i = 0; i < cards.length; i++) {
        var x = ((i * s - off) % total + total) % total;   // posição na volta
        if (x > metade) x -= total;                          // relativa ao centro
        var th = x / R;
        var px = meio + R * Math.sin(th);
        var py = R * (1 - Math.cos(th));
        // o cartão do centro cresce um pouco: um destaque só, o resto quieto
        var sc = 1 + 0.07 * Math.max(0, 1 - Math.abs(x) / (vw * 0.3));
        cards[i].style.transform = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) rotate(" + (th * 57.2958).toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")";
      }
    }
    function measure() {
      vw = deck.clientWidth || window.innerWidth;
      cw = cards[0].offsetWidth || cw;
      s = cw + Math.round(cw * 0.22);
      total = s * cards.length;
      R = vw * (vw < 700 ? 2.3 : 1.9);                       // arco largo, de borda a borda; no celular, mais suave
      // O palco reserva só o quanto desce o último cartão que ainda aparece na
      // tela (o centro dele na borda). Reservar a ponta inteira deixava o vão
      // embaixo do centro com mais de 200 px.
      var th = (vw / 2 + cw * 0.3) / R;
      var afunda = R * (1 - Math.cos(th));
      deck.parentElement.style.height = Math.ceil(cards[0].offsetHeight + afunda + 24) + "px";
      layout();
    }
    var arrastando = false, sobre = false, sx = 0, so = 0, visivel = true, ultimo = 0, raf = 0, VEL = 34;
    function quadro(t) {
      raf = 0; if (!visivel || document.hidden) { ultimo = 0; return; }
      var dt = ultimo ? Math.min(t - ultimo, 50) : 16; ultimo = t;
      if (!arrastando && !sobre) off += dt * VEL / 1000;   // com o mouse em cima, o arco espera
      layout(); raf = requestAnimationFrame(quadro);
    }
    function liga() { if (!raf && !reduced) { ultimo = 0; raf = requestAnimationFrame(quadro); } }
    deck.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") sobre = true; });
    deck.addEventListener("pointerleave", function () { sobre = false; });
    deck.addEventListener("pointerdown", function (e) { arrastando = true; sx = e.clientX; so = off; deck.classList.add("is-dragging"); try { deck.setPointerCapture(e.pointerId); } catch (_) {} });
    deck.addEventListener("pointermove", function (e) { if (!arrastando) return; off = so - (e.clientX - sx); if (reduced) layout(); });
    function fim(e) { if (!arrastando) return; arrastando = false; deck.classList.remove("is-dragging"); try { deck.releasePointerCapture(e.pointerId); } catch (_) {} }
    deck.addEventListener("pointerup", fim); deck.addEventListener("pointercancel", fim);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(deck); else window.addEventListener("resize", measure);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; if (visivel) liga(); }, { rootMargin: "80px" }).observe(deck);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) liga(); });
    measure(); document.fonts && document.fonts.ready.then(measure); liga();
    return deck;
  }

  /* ---------- abas do que tem na página ----------
   * Uma peça por vez: a aba escolhida e a figura mudam no mesmo instante, então
   * esquerda e direita nunca ficam em momentos diferentes. Passa sozinha enquanto
   * a pessoa não mexe (e não passa para quem pediu menos movimento), e para de vez
   * no primeiro toque ou foco, que é o que a WCAG pede de conteúdo que se move. */
  function initAbas(root) {
    if (!root) return;
    var abas = [].slice.call(root.querySelectorAll(".aba"));
    var paineis = [].slice.call(root.querySelectorAll(".painel"));
    var desc = root.querySelector(".abas__desc");
    var atual = 0, timer = null, visivel = false;
    function mostra(i, foco) {
      atual = i;
      abas.forEach(function (a, k) { a.setAttribute("aria-selected", k === i ? "true" : "false"); a.tabIndex = k === i ? 0 : -1; });
      paineis.forEach(function (p, k) { p.hidden = k !== i; });
      if (desc) desc.textContent = abas[i].getAttribute("data-desc") || "";
      if (foco) abas[i].focus();
    }
    function para() { if (timer) { clearInterval(timer); timer = null; } }
    function inicia() { para(); if (reduced) return; timer = setInterval(function () { if (visivel) mostra((atual + 1) % abas.length, false); }, 5500); }
    abas.forEach(function (a, i) {
      a.addEventListener("click", function () { para(); mostra(i, false); });
      a.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return; e.preventDefault(); para(); mostra((i + d + abas.length) % abas.length, true);
      });
    });
    root.addEventListener("pointerdown", para);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }, { threshold: 0.4 }).observe(root);
    mostra(0, false); inicia();
  }

  /* ---------- a mesma página, em exemplos diferentes ----------
   * O celular mostra a página de verdade de um exemplo (iframe da rota pública),
   * sem toque e sem barra de rolagem, descendo e subindo sozinha enquanto está à
   * vista. De tempos em tempos troca de exemplo, cada um com o tema, a textura e
   * a letra dele: é isso que mostra, sem texto, que a página muda de cara.
   * A pessoa pode escolher o exemplo nos botões, e aí a troca automática para. */
  var EXEMPLOS = [
    { s: "nara-bittencourt", of: "Astrologia" },
    { s: "teo-sarmento", of: "Tatuagem" },
    { s: "lia-prado", of: "Ilustração" },
    { s: "bia-marconi", of: "Canto" },
    { s: "demo", of: "Massoterapia" },
    { s: "camila-reis", of: "Psicologia" },
    { s: "alecrim-confeitaria", of: "Confeitaria" }
  ];
  function initDemo() {
    var quadro = document.getElementById("demo-pagina");
    var lista = document.querySelector(".ap__exemplos");
    if (!quadro || !lista) return;
    function doc() { try { return quadro.contentDocument; } catch (_) { return null; } }
    function semBarra() {
      var d = doc(); if (!d || !d.head || d.getElementById("sem-barra")) return;
      var st = d.createElement("style"); st.id = "sem-barra";
      st.textContent = "html{scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}";
      d.head.appendChild(st);
    }
    var t0 = 0;
    quadro.addEventListener("load", function () { semBarra(); t0 = 0; quadro.style.opacity = "1"; });
    // A página de exemplo só começa a baixar quando a seção está perto da tela.
    // Com o `loading="lazy"` do navegador ela já descia na abertura (ele dispara a
    // uns 1250 px de distância), e a tela inicial pagava uma página inteira, o
    // JavaScript dela e duas letras a mais antes de a pessoa chegar aqui.
    if ("IntersectionObserver" in window) {
      var carga = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        carga.disconnect();
        if (!quadro.getAttribute("src")) quadro.src = quadro.getAttribute("data-src");
      }, { rootMargin: "300px 0px" });
      carga.observe(quadro);
    } else { quadro.src = quadro.getAttribute("data-src"); }

    EXEMPLOS.forEach(function (e, i) {
      var li = document.createElement("li");
      li.innerHTML = '<button type="button" class="ex" data-i="' + i + '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + e.of + '</button>';
      lista.appendChild(li);
    });
    var botoes = [].slice.call(lista.querySelectorAll(".ex"));
    var atual = 0, timer = null, visivel = false;
    function mostra(i) {
      if (i === atual) return; atual = i;
      botoes.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      quadro.style.opacity = "0";
      setTimeout(function () { quadro.src = "/" + EXEMPLOS[i].s; }, 220);   // trocar de exemplo só acontece depois do primeiro carregamento
    }
    function para() { if (timer) { clearInterval(timer); timer = null; } }
    function inicia() { para(); if (reduced) return; timer = setInterval(function () { if (visivel) mostra((atual + 1) % EXEMPLOS.length); }, 9000); }
    botoes.forEach(function (b, i) { b.addEventListener("click", function () { para(); mostra(i); }); });

    var raf = 0;
    function passo(t) {
      raf = 0; if (!visivel || document.hidden) return;
      var d = doc(), el = d && d.scrollingElement;
      if (el) {
        var max = el.scrollHeight - el.clientHeight;
        if (max > 0) {
          if (!t0) t0 = t;
          var ph = ((t - t0) / 12000) % 1, k = ph < 0.5 ? ph * 2 : 2 - ph * 2;   // desce e sobe
          el.scrollTop = k * k * (3 - 2 * k) * max;
        }
      }
      raf = requestAnimationFrame(passo);
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
      visivel = es[0].isIntersecting;
      if (visivel && !raf && !reduced) raf = requestAnimationFrame(passo);
    }, { threshold: 0.3 }).observe(quadro);
    inicia();
  }

  /* ---------- placa: confere o endereço livre ao vivo ---------- */
  function initPlaca() {
    document.querySelectorAll("form.placa").forEach(function (form) {
      var input = form.querySelector("input[name=slug]");
      var botao = form.querySelector("button");
      if (!input) return;
      var msg = document.createElement("p");
      msg.className = "placa-msg";
      msg.setAttribute("role", "status");
      msg.setAttribute("aria-live", "polite");
      form.insertAdjacentElement("afterend", msg);

      function estado(e, texto) { form.setAttribute("data-estado", e); msg.setAttribute("data-estado", e); msg.textContent = texto || ""; if (botao) botao.disabled = (e === "ocupado"); }
      var espera, ctrl;
      function conferir() {
        if (espera) clearTimeout(espera);
        if (ctrl) ctrl.abort();
        var slug = normalizar(input.value);
        if (slug === "") { estado("vazio", "Letras, números e hífen. Mínimo de 3 caracteres."); return; }
        var recusa = conferirFormato(slug);
        if (recusa) { estado("ocupado", MOTIVOS[recusa]); return; }
        estado("conferindo", "A sua página vai ficar em entrais.app/" + slug);
        ctrl = new AbortController();
        espera = setTimeout(function () {
          fetch("/api/endereco?slug=" + encodeURIComponent(slug), { signal: ctrl.signal })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              if (normalizar(input.value) !== slug) return;
              if (d.livre) estado("livre", "A sua página vai ficar em entrais.app/" + slug);
              else estado("ocupado", d.motivo || MOTIVOS.ocupado);
            })
            .catch(function () { /* sem rede: o servidor confere de novo no /criar */ });
        }, 350);
      }
      input.addEventListener("input", conferir);
    });
  }

  initDeck(document.querySelector("[data-deck]"));
  initAbas(document.querySelector("[data-abas]"));
  initDemo();
  initPlaca();
}
