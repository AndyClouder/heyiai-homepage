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
