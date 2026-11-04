/* ============================================================
   main.js · 滚动渐显 / 数字 count-up
   全部尊重 prefers-reduced-motion；无依赖纯原生
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 滚动渐显：IntersectionObserver 触发 .in ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- 2. 指标 count-up：进入视口从 0 滚到目标值 ---------- */
  var numEls = document.querySelectorAll(".num[data-target]");

  // 数字格式化：data-format="wan" 时按中文计数显示（20000 → "2万"）
  function formatNum(el, value) {
    if (el.dataset.format === "wan") {
      var wan = Math.round((value / 10000) * 10) / 10;
      var str = wan.toFixed(1).replace(/\.0$/, "");
      return str + "万";
    }
    return String(Math.round(value));
  }

  function setFinal(el) {
    el.textContent = formatNum(el, parseInt(el.dataset.target, 10)) + (el.dataset.suffix || "");
  }

  function countUp(el) {
    var target = parseInt(el.dataset.target, 10);
    var suffix = el.dataset.suffix || "";
    var duration = 1200;
    var startTime = performance.now();

    function frame(now) {
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = formatNum(el, target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    numEls.forEach(setFinal);
  } else {
    var numIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            countUp(entry.target);
            numIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    numEls.forEach(function (el) { numIO.observe(el); });
  }
})();

/* ============ Motion layer: 星点粒子 / 光晕 / 光标辉光 / 卡片 3D 倾斜 / 滚动进度 / 视差 ============ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var body = document.body;
  function mk(cls, tag) { var e = document.createElement(tag || "div"); e.className = cls; e.setAttribute("aria-hidden", "true"); body.insertBefore(e, body.firstChild); return e; }

  // 进场错峰：同一父容器内 reveal 依次延迟
  document.querySelectorAll(".reveal").forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains("reveal"); });
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6) * 90 + "ms");
  });

  var prog = mk("fx-progress");
  mk("fx-aurora");
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  if (reduce) return;

  // 星点粒子 + 连线
  var cv = mk("fx-canvas", "canvas"), ctx = cv.getContext("2d"), pts = [], W, H, dpr = Math.min(devicePixelRatio || 1, 2), mouse = { x: -1e4, y: -1e4 };
  function resize() {
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(90, W * H / 16000)); pts = [];
    for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .4, t: Math.random() * 6.28 });
  }
  resize(); addEventListener("resize", resize);
  var running = true;
  document.addEventListener("visibilitychange", function () { running = !document.hidden; if (running) requestAnimationFrame(draw); });
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i]; p.x += p.vx; p.y += p.vy; p.t += .02;
      if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.globalAlpha = .45 + Math.sin(p.t) * .35;
      ctx.fillStyle = i % 3 ? "#C084FC" : "#7DD3FC";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
        if (d < 12000) { ctx.globalAlpha = (1 - d / 12000) * .18; ctx.strokeStyle = "#A855F7"; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      }
      var mx = p.x - mouse.x, my = p.y - mouse.y, md = mx * mx + my * my;
      if (md < 22000) { ctx.globalAlpha = (1 - md / 22000) * .35; ctx.strokeStyle = "#F0ABFC"; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
    }
    ctx.globalAlpha = 1; requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // 英雄区视差
  var hero = document.querySelector(".hero");
  if (hero) addEventListener("scroll", function () { var y = Math.min(scrollY, 600); hero.style.transform = "translate3d(0," + y * .18 + "px,0)"; hero.style.opacity = String(1 - y / 900); }, { passive: true });

  if (!fine) return;
  // 光标辉光
  var glow = mk("fx-glow"), gx = -999, gy = -999, cx = gx, cy = gy;
  addEventListener("mousemove", function (e) { gx = e.clientX; gy = e.clientY; mouse.x = gx; mouse.y = gy; }, { passive: true });
  (function follow() { cx += (gx - cx) * .15; cy += (gy - cy) * .15; glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0)"; requestAnimationFrame(follow); })();

  // 卡片 3D 倾斜 + 聚光
  document.querySelectorAll(".card").forEach(function (c) {
    c.addEventListener("mousemove", function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
      c.style.transform = "perspective(900px) rotateX(" + (.5 - y) * 6 + "deg) rotateY(" + (x - .5) * 6 + "deg) translateY(-4px)";
    });
    c.addEventListener("mouseleave", function () { c.style.transform = ""; });
  });
  // 按钮磁吸
  document.querySelectorAll(".btn").forEach(function (b) {
    b.addEventListener("mousemove", function (e) { var r = b.getBoundingClientRect(); b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * .15 + "px," + ((e.clientY - r.top - r.height / 2) * .25 - 2) + "px)"; });
    b.addEventListener("mouseleave", function () { b.style.transform = ""; });
  });
})();

/* ============ 魔方 + 粒子姓名 ============ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = document.querySelector(".hero");
  if (!hero) return;

  // ---- 魔方：纯装饰，aria-hidden，无文字 ----
  var cols = ["#A855F7", "#C084FC", "#F0ABFC", "#818CF8", "#7DD3FC", "#7C3AED"];
  var wrap = document.createElement("div"); wrap.className = "fx-cube-wrap"; wrap.setAttribute("aria-hidden", "true");
  var cube = document.createElement("div"); cube.className = "fx-cube"; wrap.appendChild(cube);
  for (var f = 1; f <= 6; f++) {
    var face = document.createElement("div"); face.className = "fx-face f" + f;
    for (var t = 0; t < 9; t++) { var i = document.createElement("i"); i.style.setProperty("--c", cols[(f + t * 2 + (t % 3)) % 6]); i.style.setProperty("--td", (t * .37 + f * .21).toFixed(2) + "s"); face.appendChild(i); }
    cube.appendChild(face);
  }
  var sh = document.createElement("div"); sh.className = "fx-cube-shadow"; wrap.appendChild(sh);
  hero.appendChild(wrap);
  var rx = -24, ry = 35, vx = 0, vy = reduce ? 0 : .35, drag = null;
  wrap.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener("pointermove", function (e) { if (!drag) return; vy = (e.clientX - drag.x) * .5; vx = -(e.clientY - drag.y) * .5; drag = { x: e.clientX, y: e.clientY }; });
  wrap.addEventListener("pointerup", function () { drag = null; });
  var cubeVisible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { cubeVisible = en[0].isIntersecting; }).observe(wrap);
  (function spin() {
    if (cubeVisible && !document.hidden) {
      rx += vx; ry += vy;
      if (!drag) { vx *= .94; vy += ((reduce ? 0 : .35) - vy) * .03; }
      cube.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
    }
    requestAnimationFrame(spin);
  })();

  // ---- 粒子姓名：真实文字保留在 h1（透明），canvas 叠加绘制 ----
  var h1 = hero.querySelector("h1");
  if (!h1 || reduce || !window.CanvasRenderingContext2D) return;
  var mobile = matchMedia("(max-width: 640px)").matches || !matchMedia("(pointer: fine)").matches;
  var PAD = 80, cv = document.createElement("canvas"), ctx = cv.getContext("2d");
  cv.className = "pt-canvas"; cv.setAttribute("aria-hidden", "true");
  var P = [], dpr = Math.min(devicePixelRatio || 1, 2), W, H, animating = false, mouse = null;

  function build() {
    var hr = h1.getBoundingClientRect(), pr = hero.getBoundingClientRect();
    W = Math.ceil(hr.width + PAD * 2); H = Math.ceil(hr.height + PAD * 2);
    cv.style.left = (h1.offsetLeft - PAD) + "px"; cv.style.top = (h1.offsetTop - PAD) + "px";
    cv.style.width = W + "px"; cv.style.height = H + "px"; cv.width = W * dpr; cv.height = H * dpr;
    // 离屏逐字绘制，位置取自真实排版
    var off = document.createElement("canvas"); off.width = W; off.height = H;
    var o = off.getContext("2d"), cs = getComputedStyle(h1);
    o.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily; o.textBaseline = "middle"; o.textAlign = "center";
    var grad = o.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, "#F0ABFC"); grad.addColorStop(.5, "#A855F7"); grad.addColorStop(1, "#818CF8");
    var walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT), node, range = document.createRange();
    while ((node = walker.nextNode())) {
      var isGrad = !!node.parentNode.closest(".grad-text");
      for (var k = 0; k < node.length; k++) {
        var ch = node.data[k]; if (!ch.trim()) continue;
        range.setStart(node, k); range.setEnd(node, k + 1);
        var r = range.getBoundingClientRect();
        o.fillStyle = isGrad ? grad : "#F4EFFF";
        o.fillText(ch, r.left - hr.left + PAD + r.width / 2, r.top - hr.top + PAD + r.height / 2);
      }
    }
    var data = o.getImageData(0, 0, W, H).data, step = mobile ? 3 : 2, old = P; P = [];
    for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) {
      var idx = (y * W + x) * 4; if (data[idx + 3] < 130) continue;
      var q = old[P.length];
      P.push({ hx: x, hy: y, x: q ? q.x : x, y: q ? q.y : y, vx: 0, vy: 0, c: "rgb(" + data[idx] + "," + data[idx + 1] + "," + data[idx + 2] + ")" });
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); kick();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var moving = false, s = mobile ? 2.6 : 1.9;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      if (mouse) { var dx = p.x - mouse.x, dy = p.y - mouse.y, d = dx * dx + dy * dy; if (d < 1600) { var f = (1600 - d) / 1600 * 1.2; p.vx += dx * f * .05; p.vy += dy * f * .05; } }
      p.vx += (p.hx - p.x) * .06; p.vy += (p.hy - p.y) * .06; p.vx *= .84; p.vy *= .84;
      p.x += p.vx; p.y += p.vy;
      if (Math.abs(p.vx) + Math.abs(p.vy) > .05 || Math.abs(p.hx - p.x) > .3) moving = true;
      ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, s, s);
    }
    if (moving || mouse) requestAnimationFrame(draw); else animating = false;
  }
  function kick() { if (!animating) { animating = true; requestAnimationFrame(draw); } }
  function local(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function explode(e) {
    var m = local(e);
    P.forEach(function (p) { var dx = p.x - m.x, dy = p.y - m.y, d = Math.sqrt(dx * dx + dy * dy) + 1, f = 18 + Math.random() * 22;
      p.vx += dx / d * f + (Math.random() - .5) * 8; p.vy += dy / d * f + (Math.random() - .5) * 8; });
    kick();
  }
  h1.addEventListener("pointerdown", explode);
  if (!mobile) {
    h1.addEventListener("mousemove", function (e) { mouse = local(e); kick(); });
    h1.addEventListener("mouseleave", function () { mouse = null; });
  }
  function init() {
    hero.appendChild(cv); h1.classList.add("pt-on"); build();
    // 入场：从散开状态聚合
    P.forEach(function (p) { p.x = p.hx + (Math.random() - .5) * W; p.y = p.hy + (Math.random() - .5) * H; });
    kick();
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 150); });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(init, 300); });
})();
