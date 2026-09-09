// @ts-nocheck
/* eslint-disable */
import { normalizar, conferirFormato, MOTIVOS } from "@/lib/slug";
export function initLanding(THREE, gsap, ScrollTrigger, SplitText, CustomEase, Lenis, IMGS) {

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch) document.body.classList.add("touch");
  var I = IMGS;

  var NEG = [
    { s:"isismoraes", nome:"Ísis Moraes", of:"Astrologia", cid:"Salvador", tema:"cosmico", fundo:"vinheta", frase:"Mapa natal e trânsitos, com o áudio da sessão.", img:I.isis, aberto:"Responde hoje", forma:"porta" },
    { s:"teosarmento", nome:"Téo Sarmento", of:"Tatuagem", cid:"São Paulo", tema:"noite", fundo:"liso", frase:"Traço fino e blackwork. Estúdio na Vila Madalena.", img:I.teo, aberto:"Agenda aberta", forma:"quadrado" },
    { s:"liaprado", nome:"Lia Prado", of:"Ilustração", cid:"Curitiba", tema:"areia", fundo:"papel", frase:"Ilustração autoral e identidade para negócio pequeno.", img:I.lia, aberto:"Aberto agora", forma:"circulo" },
    { s:"biamarconi", nome:"Bia Marconi", of:"Canto", cid:"Porto Alegre", tema:"menta", fundo:"liso", frase:"Aulas de canto e preparação vocal, no estúdio ou por chamada.", img:I.bia, aberto:"Aberto agora", forma:"arco" },
    { s:"alecrim", nome:"Alecrim", of:"Confeitaria", cid:"São Paulo", tema:"areia", fundo:"tinta", frase:"Bolos, tortas e docinhos feitos no dia. Balcão e encomendas.", img:I.alecrim, aberto:"Aberto agora", forma:"circulo" },
    { s:"helenavasques", nome:"Helena Vasques", of:"Massoterapia", cid:"Belo Horizonte", tema:"minimal", fundo:"papel", frase:"Massoterapia e drenagem, com hora marcada, na Savassi.", img:I.helena, aberto:"Com hora marcada", forma:"porta" }
  ];
  var DOOR = '<svg viewBox="0 0 24 24" fill="currentColor"><use href="#porta"/></svg>';
  function mock(n) {
    return '<article class="mock produto" data-tema="'+n.tema+'" data-fundo="'+n.fundo+'">'+
      '<span class="cap">entrais.app/'+n.s+'</span>'+
      '<div class="miolo">'+
        '<div class="p-banner"><img src="'+n.img+'" alt=""><span class="over"></span></div>'+
        '<div class="p-id">'+
          '<div class="p-nicho" data-forma="'+n.forma+'"><img src="'+n.img+'" alt="'+n.nome+'"></div>'+
          '<div class="p-fio"></div><div class="p-rot">'+n.of+' · '+n.cid+'</div>'+
          '<div class="p-nome">'+n.nome+'</div>'+
          '<div class="p-frase">'+n.frase+'</div>'+
          '<div class="p-selo"><span class="d"></span><b>Aberto</b><span>'+n.aberto+'</span></div>'+
        '</div>'+
        '<div class="p-wpp">Chamar no WhatsApp</div>'+
      '</div>'+
    '</article>';
  }

  /* ---------- deck em arco (coverflow) ---------- */
  function initDeck(deck) {
    NEG.concat(NEG).forEach(function(n){ var w=document.createElement("div"); w.className="deck__card"; w.innerHTML=mock(n); deck.appendChild(w); });
    var cards = [].slice.call(deck.querySelectorAll(".deck__card"));
    function update() {
      var mid = window.innerWidth / 2;
      cards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var d = (r.left + r.width / 2 - mid) / window.innerWidth;
        var ad = Math.min(Math.abs(d), 0.62);
        var ty = ad * ad * 170;
        var rot = Math.max(-14, Math.min(14, d * 22));
        var sc = 1 - ad * 0.12;
        c.style.transform = "translateY(" + ty + "px) rotate(" + rot + "deg) scale(" + sc + ")";
        c.style.opacity = String(1 - ad * 0.5);
        c.style.zIndex = String(200 - Math.round(ad * 200));
      });
    }
    var down = false, sx = 0, ss = 0, moved = 0, hover = false, half = 0;
    function measure(){ half = deck.scrollWidth / 2; }
    function wrap(){ if (half) { if (deck.scrollLeft >= half) deck.scrollLeft -= half; else if (deck.scrollLeft < 0) deck.scrollLeft += half; } }
    deck.addEventListener("pointerenter", function(){ hover = true; });
    deck.addEventListener("pointerleave", function(){ hover = false; });
    deck.addEventListener("pointerdown", function (e) { down = true; moved = 0; sx = e.clientX; ss = deck.scrollLeft; deck.classList.add("is-dragging"); try{deck.setPointerCapture(e.pointerId);}catch(_){} });
    deck.addEventListener("pointermove", function (e) { if (!down) return; var dd = e.clientX - sx; moved = Math.abs(dd); deck.scrollLeft = ss - dd; wrap(); update(); });
    function end(e){ if(!down) return; down = false; deck.classList.remove("is-dragging"); try{deck.releasePointerCapture(e.pointerId);}catch(_){} }
    deck.addEventListener("pointerup", end); deck.addEventListener("pointercancel", end);
    window.addEventListener("resize", function(){ measure(); update(); });
    var last = performance.now();
    function loop(now){ var dt = Math.min(now - last, 60); last = now;
      if (!down && !hover) deck.scrollLeft += dt * 0.028; // devagar, ~28px/s
      wrap(); update(); requestAnimationFrame(loop); }
    requestAnimationFrame(function(){ measure(); deck.scrollLeft = 1; update(); requestAnimationFrame(loop); });
    deck.__update = update;
    return deck;
  }

  /* ---------- switcher ---------- */
  function initSwitcher() {
    var pagina = document.getElementById("produto");
    function liga(id, attr) { var box = document.getElementById(id); if (!box) return;
      box.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return;
        pagina.setAttribute(attr, b.getAttribute(attr));
        box.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); }); }); }
    liga("temas", "data-tema"); liga("fundos", "data-fundo");
    document.querySelectorAll(".placa button").forEach(function (b) { b.addEventListener("click", function (e) { var i = b.parentElement.querySelector("input"); if (i && !i.value.trim()) { e.preventDefault(); i.focus(); } }); });
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
  initSwitcher();
  initPlaca();

  /* ---------- 3D: a porta em arco ---------- */
  function initPorta() {
    if (typeof THREE === "undefined") throw new Error("no three");
    var canvas = document.getElementById("porta3d");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
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
    var marsala = new THREE.MeshStandardMaterial({ color: 0x83263a, roughness: 0.88, metalness: 0.0 });
    var frame = new THREE.Mesh(frameGeo, marsala); grupo.add(frame);
    // folha interna, levemente à frente e mais escura
    var leafGeo = new THREE.ExtrudeGeometry(archShape(W * 0.74, H * 0.74, 0), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 6, curveSegments: 80 });
    leafGeo.center();
    var leaf = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0x581824, roughness: 0.95, metalness: 0.0 }));
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
    var key = new THREE.DirectionalLight(0xfff2df, 1.05); key.position.set(-5, 6, 8); scene.add(key);
    var rim = new THREE.DirectionalLight(0xffc79a, 1.5); rim.position.set(7, 3, -6); scene.add(rim);
    var fill = new THREE.DirectionalLight(0xffe9d2, 0.4); fill.position.set(2, -3, 7); scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x36281f, 0.35));

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(40, r.width), h = Math.max(40, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize(); window.addEventListener("resize", resize);
    if (window.ResizeObserver) { try { new ResizeObserver(resize).observe(canvas); } catch(_){} }

    var mx = 0, my = 0, tmx = 0, tmy = 0;
    window.addEventListener("pointermove", function (e) { tmx = (e.clientX / window.innerWidth - 0.5); tmy = (e.clientY / window.innerHeight - 0.5); });
    var t0 = performance.now();
    function tick(now) {
      var t = (now - t0) / 1000;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      // gira devagar sozinha, sempre mostrando a face (fica claro que é uma porta)
      grupo.rotation.y = Math.sin(t * 0.5) * 0.6 + mx * 0.35;
      grupo.rotation.x = 0.05 + Math.sin(t * 0.7) * 0.04 - my * 0.25;
      renderer.render(scene, camera);
      if (!window.__stop3d) requestAnimationFrame(tick);
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

    if (!touch) {
      var cur = document.getElementById("cursor");
      var xT = gsap.quickTo(cur, "x", { duration: 0.3, ease: "osmo-out" }), yT = gsap.quickTo(cur, "y", { duration: 0.3, ease: "osmo-out" });
      window.addEventListener("pointermove", function (e) { xT(e.clientX); yT(e.clientY); });
      document.querySelectorAll("a, button, [data-cur], .chip, .deck__card").forEach(function (el) { el.addEventListener("mouseenter", function () { cur.classList.add("big"); }); el.addEventListener("mouseleave", function () { cur.classList.remove("big"); }); });
    }
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
      // recursos deslizam dos lados
      document.querySelectorAll("[data-reveal-row]").forEach(function (row) {
        var fig = row.querySelector(".r-fig"), txt = row.querySelector(".r-txt");
        var dir = row.classList.contains("inv") ? -1 : 1;
        gsap.from(fig, { xPercent: 9 * dir, opacity: 0, duration: 1, ease: "osmo", scrollTrigger: { trigger: row, start: "top 82%", once: true } });
        gsap.from(txt, { xPercent: -9 * dir, opacity: 0, duration: 1, ease: "osmo", scrollTrigger: { trigger: row, start: "top 82%", once: true } });
      });
      var panel = document.querySelector(".transition__panel"); gsap.set(panel, { scaleY: 1, transformOrigin: "top" }); gsap.to(panel, { scaleY: 0, duration: 1.1, ease: "osmo", delay: 0.05 });
      // esconde o trocador no herói e no fecho
      ScrollTrigger.create({ trigger: ".noite", start: "top 70%", end: "bottom 40%",
        onToggle: function (s) { gsap.to(".trocador", { autoAlpha: s.isActive ? 1 : 0.0, y: s.isActive ? 0 : 20, duration: .5 }); } });
      gsap.set(".trocador", { autoAlpha: 0, y: 20 });
      ScrollTrigger.refresh(); window.__mr = true;
    });
    setTimeout(function () { if (!window.__mr) revealAll(); }, 3500);
  } catch (err) { revealAll(); }

}
