// @ts-nocheck
/* eslint-disable */
import { normalizar, conferirFormato, MOTIVOS } from "@/lib/slug";
export function initLanding(THREE, gsap, ScrollTrigger, SplitText, CustomEase, Lenis, IMGS) {

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
      R = vw * 1.5;                                          // arco largo, de borda a borda, suave
      var th = Math.min((vw / 2 + cw * 1.6) / R, 1.1);
      var afunda = R * (1 - Math.cos(th));
      deck.style.height = Math.ceil(cards[0].offsetHeight + afunda + cw * 0.5 + 24) + "px";   // + o que a inclinação da ponta empurra o nome para baixo
      layout();
    }
    var arrastando = false, sx = 0, so = 0, visivel = true, ultimo = 0, raf = 0, VEL = 34;
    function quadro(t) {
      raf = 0; if (!visivel || document.hidden) { ultimo = 0; return; }
      var dt = ultimo ? Math.min(t - ultimo, 50) : 16; ultimo = t;
      if (!arrastando) off += dt * VEL / 1000;
      layout(); raf = requestAnimationFrame(quadro);
    }
    function liga() { if (!raf && !reduced) { ultimo = 0; raf = requestAnimationFrame(quadro); } }
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

  /* ---------- explorador de ofícios (lista troca a prévia) ---------- */
  var SEG = [
    { of: "Tatuagem", img: "/exemplo/tatu-1.jpg", ex: "teosarmento" },
    { of: "Confeitaria", img: "/exemplo/bolo-3.jpg", ex: "alecrim" },
    { of: "Ilustração", img: "/exemplo/ilustra-3.jpg", ex: "liaprado" },
    { of: "Astrologia", img: "/exemplo/astro-1.jpg", ex: "isismoraes" },
    { of: "Canto", img: "/exemplo/canto-2.jpg", ex: "biamarconi" },
    { of: "Massoterapia", img: "/exemplo/spa-1.jpg", ex: "helenavasques" },
    { of: "Psicologia", img: "/exemplo/psi-capa.jpg", ex: "marianaalves" },
    { of: "Fotografia", img: "/exemplo/galeria-2.jpg", ex: "estudioluz" }
  ];
  function initExplorer(root) {
    if (!root) return;
    var lista = root.querySelector(".seg-lista");
    var img = root.querySelector(".seg-img");
    var tag = root.querySelector(".seg-tag");
    if (!lista || !img) return;
    SEG.forEach(function (s, i) {
      var li = document.createElement("li");
      li.innerHTML = '<button type="button" class="seg-item" data-i="' + i + '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' +
        '<span class="seg-num">' + ("0" + (i + 1)).slice(-2) + '</span><span class="seg-nome">' + s.of + '</span></button>';
      lista.appendChild(li);
    });
    SEG.forEach(function (s) { var im = new Image(); im.src = s.img; }); // pré-carrega
    var items = [].slice.call(lista.querySelectorAll(".seg-item"));
    var cur = -1, timer = null;
    function show(i) {
      if (i === cur) return; cur = i;
      items.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      var s = SEG[i];
      img.style.opacity = "0";
      setTimeout(function () { img.src = s.img; if (tag) tag.textContent = "entrais.app/" + s.ex; img.style.opacity = "1"; }, 180);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); timer = setInterval(function () { show((cur + 1) % SEG.length); }, 2600); }
    items.forEach(function (b, i) {
      b.addEventListener("pointerenter", function () { stop(); show(i); });
      b.addEventListener("focus", function () { stop(); show(i); });
      b.addEventListener("click", function () { stop(); show(i); });
    });
    root.addEventListener("pointerleave", start);
    show(0); start();
  }

  /* ---------- console de aparência ----------
   * A página à esquerda é a página de verdade (um iframe da rota pública de um
   * exemplo, sem script). O console só troca `data-tema` e `data-fundo` na raiz
   * dela, que é exatamente o que a página do cliente faz com o que o dono escolhe. */
  function initSwitcher() {
    var quadro = document.getElementById("demo-pagina");
    function raiz() { try { var d = quadro.contentDocument; return d && d.querySelector("[data-tema]"); } catch (_) { return null; } }
    function aplica(attr, valor) {
      var r = raiz(); if (!r) return;
      if (attr === "data-fundo" && valor === "liso") r.removeAttribute("data-fundo"); else r.setAttribute(attr, valor);
    }
    function liga(id, attr) { var box = document.getElementById(id); if (!box) return;
      box.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return;
        aplica(attr, b.getAttribute(attr));
        box.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); }); }); }
    liga("temas", "data-tema"); liga("fundos", "data-fundo");
    document.querySelectorAll(".placa button").forEach(function (b) { b.addEventListener("click", function (e) { var i = b.parentElement.querySelector("input"); if (i && i.value.trim() === "") { e.preventDefault(); i.focus(); } }); });
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

  var deckEl = initDeck(document.querySelector("[data-deck]"));
  initExplorer(document.querySelector("[data-explorer]"));
  initSwitcher();
  initPlaca();

  /* ---------- 3D: a porta em arco ---------- */
  function initPorta() {
    if (typeof THREE === "undefined") throw new Error("no three");
    var canvas = document.getElementById("porta3d");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    // Supersampling: desenha num buffer 2x maior que a tela e deixa o CSS
    // reduzir. Numa porta pequena isso é barato e mata o serrilhado que fazia
    // ela parecer de baixa qualidade.
    renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * 1.5, 3));
    THREE.ColorManagement.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    // silhueta do arco (porta)
    function archShape(w, h, r) {
      var s = new THREE.Shape();
      s.moveTo(-w, -h); s.lineTo(-w, 0);
      s.absarc(0, 0, w, Math.PI, 0, true);
      s.lineTo(w, -h); s.lineTo(-w, -h);
      return s;
    }
    var grupo = new THREE.Group();
    var W = 2.1, H = 3.0;
    // moldura (marsala)
    var frameGeo = new THREE.ExtrudeGeometry(archShape(W, H), { depth: 0.7, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.13, bevelSegments: 8, curveSegments: 96 });
    frameGeo.center();
    var marsala = new THREE.MeshStandardMaterial({ color: 0xc65266, roughness: 0.62, metalness: 0.0 });
    var frame = new THREE.Mesh(frameGeo, marsala); grupo.add(frame);
    // folha interna, levemente à frente e um tom mais fundo (sem virar buraco preto)
    var leafGeo = new THREE.ExtrudeGeometry(archShape(W * 0.74, H * 0.74, 0), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 6, curveSegments: 80 });
    leafGeo.center();
    var leaf = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0x9c3b4d, roughness: 0.72, metalness: 0.0 }));
    leaf.position.z = 0.34; leaf.position.y = -0.12; grupo.add(leaf);
    // vinco central (latão)
    var latao = new THREE.MeshStandardMaterial({ color: 0xb9853c, roughness: 0.34, metalness: 0.9 });
    var seam = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 1.2, 0.08), latao);
    seam.position.set(0, -0.1, 0.62); grupo.add(seam);
    // maçaneta (latão)
    var knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), latao);
    knob.position.set(-0.42, -0.35, 0.66); grupo.add(knob);

    grupo.rotation.x = 0.04;
    scene.add(grupo);

    // luz
    var key = new THREE.DirectionalLight(0xfff2df, 1.7); key.position.set(-5, 6, 8); scene.add(key);
    var rim = new THREE.DirectionalLight(0xffc79a, 1.8); rim.position.set(7, 3, -6); scene.add(rim);
    var fill = new THREE.DirectionalLight(0xffe9d2, 0.9); fill.position.set(2, -3, 7); scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x6b4b3f, 0.8));
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(40, r.width), h = Math.max(40, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize(); window.addEventListener("resize", resize);
    if (window.ResizeObserver) { try { new ResizeObserver(resize).observe(canvas); } catch(_){} }
    // A fonte grande do titulo muda o tamanho do glifo depois do primeiro
    // desenho; sem redimensionar de novo, a porta fica num buffer pequeno e
    // aparece serrilhada. Redesenha quando a fonte carrega e quando o layout assenta.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
    requestAnimationFrame(resize); setTimeout(resize, 500);

    var portaVisivel = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { portaVisivel = es[0].isIntersecting; }).observe(canvas);
    var mx = 0, my = 0, tmx = 0, tmy = 0;
    window.addEventListener("pointermove", function (e) { tmx = (e.clientX / window.innerWidth - 0.5); tmy = (e.clientY / window.innerHeight - 0.5); });
    var t0 = performance.now(), lastDraw = 0;
    function tick(now) {
      if (!window.__stop3d) requestAnimationFrame(tick);
      if (!portaVisivel || document.hidden) return;   // fora da tela, não desenha
      if (now - lastDraw < 33) return;   // teto de ~30fps: alivia CPU/GPU
      lastDraw = now;
      var t = (now - t0) / 1000;
      mx += (tmx - mx) * 0.09; my += (tmy - my) * 0.09;
      // gira devagar sozinha, sempre mostrando a face (fica claro que é uma porta)
      grupo.rotation.y = Math.sin(t * 0.5) * 0.6 + mx * 0.35;
      grupo.rotation.x = 0.05 + Math.sin(t * 0.7) * 0.04 - my * 0.25;
      renderer.render(scene, camera);
    }
    if (reduced) { renderer.render(scene, camera); }
    else requestAnimationFrame(tick);
    return true;
  }
  try { initPorta(); } catch (e) { var fb = document.querySelector(".fallback-arco"); if (fb) fb.style.display = "block"; var cv = document.getElementById("porta3d"); if (cv) cv.style.display = "none"; }

  /* ---------- motion GSAP ---------- */
  function revealAll() { document.querySelectorAll("[data-split],[data-reveal]").forEach(function (e) { e.classList.add("is-ready"); }); window.__mr = true; }
  if (reduced || typeof gsap === "undefined" || typeof Lenis === "undefined") { revealAll(); return; }
  try {
    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
    CustomEase.create("osmo", "0.625, 0.05, 0, 1"); CustomEase.create("osmo-out", "0.16, 1, 0.3, 1");
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true }); lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);

    function splitReveal(el, opts) { opts = opts || {}; var type = el.dataset.split || "lines";
      var cfg = { lines: { duration: 0.9, stagger: 0.09 }, words: { duration: 0.6, stagger: 0.045 } }[type] || { duration: 0.8, stagger: 0.05 };
      var split = SplitText.create(el, { type: "lines, words, chars", mask: "lines", linesClass: "line" });
      el.classList.add("is-ready");
      var vars = { yPercent: 106, duration: cfg.duration, stagger: cfg.stagger, ease: "osmo" };
      if (!opts.noTrigger) vars.scrollTrigger = { trigger: el, start: "top 86%", once: true };
      return gsap.from(split[type], vars);
    }
    function reveal(el) { el.classList.add("is-ready"); gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: "osmo", scrollTrigger: { trigger: el, start: "top 90%", once: true } }); }

    document.fonts.ready.then(function () {
      document.querySelectorAll(".hero [data-reveal]").forEach(function (e) { e.classList.add("is-ready"); });
      gsap.set(".mega .w", { yPercent: 46, opacity: 0 });
      gsap.set(".dglyph", { scale: 0.2, opacity: 0, transformOrigin: "50% 55%" });
      gsap.timeline({ delay: 0.35 })
        .to(".mega .w", { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "osmo" }, 0)
        .to(".dglyph", { scale: 1, opacity: 1, duration: 1.0, ease: "osmo-out" }, 0.45)
        .from(".hero .sub", { y: 16, opacity: 0, duration: 0.6, ease: "osmo" }, 0.7)
        .from(".hero .cta-row", { y: 18, opacity: 0, duration: 0.6, ease: "osmo" }, 0.85);
      document.querySelectorAll("[data-split]").forEach(function (el) { if (!el.closest(".hero")) splitReveal(el); });
      document.querySelectorAll("[data-reveal]").forEach(function (el) { if (!el.closest(".hero")) reveal(el); });
      // recursos: figura e texto da mesma linha entram juntos, no mesmo gatilho,
      // com o mesmo deslocamento. Deslizar de lados opostos deixava um lado
      // chegando enquanto o outro já tinha parado.
      document.querySelectorAll("[data-reveal-row]").forEach(function (row) {
        var par = [row.querySelector(".r-fig"), row.querySelector(".r-txt")];
        gsap.from(par, { y: 28, opacity: 0, duration: 0.8, ease: "osmo", scrollTrigger: { trigger: row, start: "top 85%", once: true } });
      });
      var panel = document.querySelector(".transition__panel"); gsap.set(panel, { scaleY: 1, transformOrigin: "top" }); gsap.to(panel, { scaleY: 0, duration: 1.1, ease: "osmo", delay: 0.05 });
      ScrollTrigger.refresh(); window.__mr = true;
    });
    setTimeout(function () { if (!window.__mr) revealAll(); }, 3500);
  } catch (err) { revealAll(); }

}
