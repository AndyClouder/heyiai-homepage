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

/* ============ 粒子大字「合一」 + 项目魔方 ============ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = matchMedia("(max-width: 640px)").matches || !matchMedia("(pointer: fine)").matches;
  var hero = document.querySelector(".hero"), h1 = hero && hero.querySelector("h1");

  // ---- 项目魔方（装饰，aria-hidden；文字均取自页面已有内容）----
  var faces = [
    ["合一AI效能社群", "2000人", "#projects"],
    ["WorkBuddy训练营", "5期 · 500+学员", "#projects"],
    ["一人OPC内容流水线", "50 skills · 已开源", "#projects"],
    ["超级大脑陪跑", "1对1", "#projects"],
    ["新书《OpenClaw 核心原理与综合应用实战》", "合著", "#book"],
    ["Kanban官方指南中文译者", "译者", "#about"]
  ];
  var metrics = document.getElementById("metrics");
  if (metrics) {
    var sec = document.createElement("div"); sec.className = "fx-cube-sec"; sec.setAttribute("aria-hidden", "true");
    var wrap = document.createElement("div"); wrap.className = "fx-cube-wrap";
    var cube = document.createElement("div"); cube.className = "fx-cube";
    faces.forEach(function (f, n) {
      var d = document.createElement("div"); d.className = "fx-face f" + (n + 1); d.dataset.go = f[2];
      d.innerHTML = "<i>0" + (n + 1) + "</i><b></b><em></em>";
      d.querySelector("b").textContent = f[0]; d.querySelector("em").textContent = f[1];
      cube.appendChild(d);
    });
    wrap.appendChild(cube); var sh = document.createElement("div"); sh.className = "fx-cube-shadow"; wrap.appendChild(sh);
    sec.appendChild(wrap); metrics.parentNode.insertBefore(sec, metrics.nextSibling);
    var rx = -18, ry = 25, vx = 0, base = reduce ? 0 : .25, vy = base, drag = null, moved = 0, vis = true;
    wrap.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; moved = 0; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener("pointermove", function (e) {
      if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy);
      vy = dx * .45; vx = -dy * .45; drag = { x: e.clientX, y: e.clientY };
    });
    wrap.addEventListener("pointerup", function (e) {
      drag = null;
      if (moved < 6) { // 轻点：跳到对应区块
        var el = document.elementFromPoint(e.clientX, e.clientY), face = el && el.closest(".fx-face");
        var t = face && document.querySelector(face.dataset.go); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      }
    });
    wrap.addEventListener("pointercancel", function () { drag = null; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(wrap);
    (function spin() {
      if (vis && !document.hidden) {
        rx += vx; ry += vy;
        if (!drag) { vx *= .93; rx += (-18 - rx) * .01; vy += (base - vy) * .03; }
        cube.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      }
      requestAnimationFrame(spin);
    })();
  }

  // ---- 粒子大字「合一」：放在姓名上方，纯装饰 ----
  if (!h1 || reduce || !window.CanvasRenderingContext2D) return;
  var box = document.createElement("div"); box.className = "pt-banner"; box.setAttribute("aria-hidden", "true");
  var cv = document.createElement("canvas"); box.appendChild(cv); hero.insertBefore(box, h1);
  var ctx = cv.getContext("2d"), P = [], W, H, PAD = 40, dpr = Math.min(devicePixelRatio || 1, 2), animating = false, mouse = null;
  function build() {
    var r = box.getBoundingClientRect(); W = Math.round(r.width + PAD * 2); H = Math.round(r.height + PAD * 2);
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var off = document.createElement("canvas"); off.width = W; off.height = H; var o = off.getContext("2d");
    var fs = Math.min(r.height * .95, r.width / 2.3);
    o.font = "900 " + fs + "px " + getComputedStyle(h1).fontFamily; o.textBaseline = "middle"; o.textAlign = "center";
    var g = o.createLinearGradient(W / 2 - fs, 0, W / 2 + fs, 0); g.addColorStop(0, "#F0ABFC"); g.addColorStop(.5, "#A855F7"); g.addColorStop(1, "#818CF8");
    o.fillStyle = g; o.fillText("合一", W / 2, H / 2 + fs * .04);
    var data = o.getImageData(0, 0, W, H).data, step = mobile ? 4 : 3, old = P; P = [];
    for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) {
      var k = (y * W + x) * 4; if (data[k + 3] < 128) continue; var q = old[P.length];
      P.push({ hx: x, hy: y, x: q ? q.x : Math.random() * W, y: q ? q.y : Math.random() * H, vx: 0, vy: 0,
        c: Math.random() < .12 ? "#F4EFFF" : "rgb(" + data[k] + "," + data[k + 1] + "," + data[k + 2] + ")", s: Math.random() * 1.2 + (mobile ? 1.6 : 1.4) });
    }
    kick();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H); var moving = false;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      if (mouse) { var dx = p.x - mouse.x, dy = p.y - mouse.y, d = dx * dx + dy * dy; if (d < 2500) { var f = (2500 - d) / 2500; p.vx += dx * f * .06; p.vy += dy * f * .06; } }
      p.vx += (p.hx - p.x) * .045; p.vy += (p.hy - p.y) * .045; p.vx *= .86; p.vy *= .86; p.x += p.vx; p.y += p.vy;
      if (!moving && (Math.abs(p.vx) + Math.abs(p.vy) > .04 || Math.abs(p.hx - p.x) > .3)) moving = true;
      ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    if (moving || mouse) requestAnimationFrame(draw); else animating = false;
  }
  function kick() { if (!animating) { animating = true; requestAnimationFrame(draw); } }
  function local(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  box.addEventListener("pointerdown", function (e) {
    var m = local(e);
    P.forEach(function (p) { var dx = p.x - m.x, dy = p.y - m.y, d = Math.sqrt(dx * dx + dy * dy) + 1, f = 16 + Math.random() * 26;
      p.vx += dx / d * f + (Math.random() - .5) * 10; p.vy += dy / d * f + (Math.random() - .5) * 10; });
    kick();
  });
  if (!mobile) { box.addEventListener("mousemove", function (e) { mouse = local(e); kick(); }); box.addEventListener("mouseleave", function () { mouse = null; }); }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    build(); var rt, lw = innerWidth; addEventListener("resize", function () { if (innerWidth === lw) return; lw = innerWidth; clearTimeout(rt); rt = setTimeout(build, 150); });
  });
})();
