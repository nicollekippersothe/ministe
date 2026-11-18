// @ts-nocheck
/* eslint-disable */
import { normalizar, conferirFormato, MOTIVOS } from "@/lib/slug";
export function initLanding(THREE, IMGS) {

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
      R = vw * (vw < 700 ? 2.3 : 1.5);                       // arco largo, de borda a borda; no celular, mais suave
      var th = Math.min((vw / 2 + cw * 0.9) / R, 1.1);
      var afunda = R * (1 - Math.cos(th));
      deck.parentElement.style.height = Math.ceil(cards[0].offsetHeight + afunda + cw * 0.4 + 20) + "px";   // + o que a inclinação da ponta empurra o nome para baixo
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

  /* ---------- ofícios: lista e foto lado a lado ----------
   * A lista e a foto cabem na mesma tela, então escolher o último ofício não
   * deixa a foto lá em cima, fora de vista. A lista usa os mesmos doze cartões do
   * arco, e a legenda fica dentro da foto, sobre o escurecido. */
  function initExplorer(root) {
    if (!root) return;
    var lista = root.querySelector(".seg__lista");
    var img = root.querySelector(".seg__img");
    var leg = root.querySelector(".seg__leg");
    if (!lista || !img) return;
    NEG.forEach(function (n, i) {
      var li = document.createElement("li");
      li.innerHTML = '<button type="button" class="seg__item" data-i="' + i + '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + n.of + '</button>';
      lista.appendChild(li);
    });
    var items = [].slice.call(lista.querySelectorAll(".seg__item"));
    var cur = 0, timer = null, visivel = false;
    function show(i) {
      if (i === cur) return; cur = i;
      items.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      var n = NEG[i];
      img.style.opacity = "0";
      setTimeout(function () { img.src = n.img; leg.querySelector("b").textContent = n.nome; leg.querySelector("span").textContent = n.of; img.style.opacity = "1"; }, 160);
    }
    function para() { if (timer) { clearInterval(timer); timer = null; } }
    function inicia() { para(); if (reduced) return; timer = setInterval(function () { if (visivel) show((cur + 1) % NEG.length); }, 3200); }
    NEG.forEach(function (n) { var im = new Image(); im.src = n.img; });
    items.forEach(function (b, i) { b.addEventListener("click", function () { para(); show(i); }); b.addEventListener("focus", function () { para(); show(i); }); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }, { threshold: 0.4 }).observe(root);
    inicia();
  }

  /* ---------- console de aparência ----------
   * A página ao lado é a de verdade (um iframe da rota pública de um exemplo). O
   * console só troca `data-tema` e `data-fundo` na raiz dela, que é o que a página
   * do cliente faz com o que o dono escolhe.
   *
   * O iframe não recebe toque nem roda: quem rola a tela inteira nunca fica preso
   * numa rolagem dentro da outra. Em troca, a página de exemplo desce e sobe
   * sozinha, devagar, enquanto está à vista, para mostrar o que existe dentro. */
  function initSwitcher() {
    var quadro = document.getElementById("demo-pagina");
    if (!quadro) return;
    function doc() { try { return quadro.contentDocument; } catch (_) { return null; } }
    function raiz() { var d = doc(); return d && d.querySelector("[data-tema]"); }
    function aplica(attr, valor) {
      var r = raiz(); if (!r) return;
      if (attr === "data-fundo" && valor === "liso") r.removeAttribute("data-fundo"); else r.setAttribute(attr, valor);
    }
    function liga(id, attr) { var box = document.getElementById(id); if (!box) return;
      box.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return;
        aplica(attr, b.getAttribute(attr));
        box.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); }); }); }
    liga("temas", "data-tema"); liga("fundos", "data-fundo");

    var visivel = false, t0 = 0, raf = 0;
    function passo(t) {
      raf = 0; if (!visivel || document.hidden) return;
      var d = doc(), el = d && d.scrollingElement;
      if (el) {
        var max = el.scrollHeight - el.clientHeight;
        if (max > 0) {
          if (!t0) t0 = t;
          var ph = ((t - t0) / 26000) % 1, k = ph < 0.5 ? ph * 2 : 2 - ph * 2;   // desce e sobe
          el.scrollTop = k * k * (3 - 2 * k) * max;
        }
      }
      raf = requestAnimationFrame(passo);
    }
    if (!reduced && "IntersectionObserver" in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; if (visivel && !raf) raf = requestAnimationFrame(passo); }, { threshold: 0.3 }).observe(quadro);
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

}
