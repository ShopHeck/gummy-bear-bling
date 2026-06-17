/* =====================================================================
   GUMMY BEAR BLING — theme.js
   ===================================================================== */
(function () {
  "use strict";

  /* ---- resolve a CSS custom property (e.g. "var(--cherry)") to a color ---- */
  function resolveColor(v) {
    if (!v) return "#3D8BFF";
    v = v.trim();
    if (v.indexOf("var(") === 0) {
      var name = v.slice(4, -1).trim();
      return (getComputedStyle(document.documentElement).getPropertyValue(name) || "").trim() || "#3D8BFF";
    }
    return v;
  }

  /* ---- translucent gummy bear SVG (relies on <symbol id="gbear">) ---- */
  function bearSVG(color) {
    color = resolveColor(color);
    return (
      '<svg class="bear" viewBox="0 0 100 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<use href="#gbear" xlink:href="#gbear" fill="' + color + '" opacity="0.25" transform="translate(2,5)"/>' +
        '<use href="#gbear" xlink:href="#gbear" fill="' + color + '" opacity="0.9"/>' +
        '<ellipse cx="36" cy="22" rx="12" ry="8" fill="#fff" opacity="0.72"/>' +
        '<ellipse cx="40" cy="60" rx="7" ry="14" fill="#fff" opacity="0.28"/>' +
        '<circle cx="43" cy="30" r="2.4" fill="#34202C" opacity="0.55"/>' +
        '<circle cx="57" cy="30" r="2.4" fill="#34202C" opacity="0.55"/>' +
        '<ellipse cx="50" cy="37" rx="3.4" ry="2.4" fill="#34202C" opacity="0.4"/>' +
      "</svg>"
    );
  }
  window.GBB = { bearSVG: bearSVG, resolveColor: resolveColor };

  var PALETTE = ["--cherry","--tangerine","--lemon","--lime","--blueberry","--grape","--pinkberry","--aqua"];

  document.addEventListener("DOMContentLoaded", function () {

    /* fill any [data-bear] placeholder that has no image */
    document.querySelectorAll("[data-bear]").forEach(function (el) {
      if (el.dataset.filled) return;
      el.innerHTML = bearSVG(el.getAttribute("data-bear") || "var(--cherry)");
    });

    /* ---- hero floaties ---- */
    var floaties = document.getElementById("gbb-floaties");
    if (floaties) {
      var pos = [[8,18,68,8,-12],[87,14,80,9,13],[14,62,58,10,8],[82,58,62,8.5,-10],[47,6,48,11,4]];
      pos.forEach(function (p, i) {
        var d = document.createElement("div");
        d.className = "floaty";
        d.style.cssText = "left:" + p[0] + "%;top:" + p[1] + "%;width:" + p[2] + "px;--d:" + p[3] + "s;--rot:" + p[4] + "deg;opacity:.8";
        d.innerHTML = bearSVG("var(" + PALETTE[i % PALETTE.length] + ")");
        floaties.appendChild(d);
      });
    }

    /* ---- color story ---- */
    var stage = document.querySelector("[data-colorstory-stage]");
    var row = document.querySelector("[data-colorstory-row]");
    var nameEl = document.querySelector("[data-colorstory-name]");
    if (stage && row) {
      var flavors = [
        ["--blueberry","Blueberry","cool, classic, goes with everything."],
        ["--cherry","Cherry","bold and sweet — our most-gifted bear."],
        ["--grape","Grape","dreamy purple, a festival favorite."],
        ["--pinkberry","Bubblegum","soft pink Y2K nostalgia in a bear."],
        ["--tangerine","Tangerine","sunny orange that pops on gold."],
        ["--lemon","Lemon","bright, cheerful, impossible to miss."],
        ["--lime","Lime","fresh green, a little bit retro."],
        ["--aqua","Aqua","breezy teal for summer stacks."]
      ];
      flavors.forEach(function (f, i) {
        var b = document.createElement("button");
        b.className = "swatch" + (i === 0 ? " active" : "");
        b.style.background = resolveColor("var(" + f[0] + ")");
        b.setAttribute("aria-label", f[1]);
        b.addEventListener("click", function () {
          row.querySelectorAll(".swatch").forEach(function (s) { s.classList.remove("active"); });
          b.classList.add("active");
          stage.innerHTML = bearSVG("var(" + f[0] + ")");
          if (nameEl) nameEl.innerHTML = "<b>" + f[1] + "</b> — " + f[2];
        });
        row.appendChild(b);
      });
      stage.innerHTML = bearSVG("var(" + flavors[0][0] + ")");
      if (nameEl) nameEl.innerHTML = "<b>" + flavors[0][1] + "</b> — " + flavors[0][2];
    }

    /* ---- bundle picker ---- */
    var slotsWrap = document.querySelector("[data-bundle-slots]");
    var picker = document.querySelector("[data-bundle-picker]");
    if (slotsWrap && picker) {
      var slots = Array.prototype.slice.call(slotsWrap.querySelectorAll(".slot"));
      var idx = 0;
      PALETTE.forEach(function (p) {
        var b = document.createElement("button");
        b.className = "swatch";
        b.style.background = resolveColor("var(" + p + ")");
        b.setAttribute("aria-label", "Add " + p.replace("--", "") + " bear to stack");
        b.addEventListener("click", function () {
          var slot = slots[idx % slots.length];
          slot.classList.add("filled");
          var box = slot.querySelector("[data-bear]");
          if (box) box.innerHTML = bearSVG("var(" + p + ")");
          idx++;
        });
        picker.appendChild(b);
      });
    }

    /* ---- PDP media gallery ---- */
    var thumbs = document.querySelector("[data-pdp-thumbs]");
    var mainImg = document.querySelector("[data-pdp-main]");
    if (thumbs && mainImg) {
      thumbs.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var src = btn.getAttribute("data-src");
          if (src) mainImg.innerHTML = '<img src="' + src + '" alt="">';
          thumbs.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
        });
      });
    }

    /* ---- PDP quantity stepper ---- */
    document.querySelectorAll("[data-qty]").forEach(function (q) {
      var input = q.querySelector("input");
      q.querySelector("[data-qty-down]").addEventListener("click", function () {
        input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
      });
      q.querySelector("[data-qty-up]").addEventListener("click", function () {
        input.value = (parseInt(input.value, 10) || 1) + 1;
      });
    });

    /* ---- mobile menu ---- */
    var menuBtn = document.querySelector("[data-menu-btn]");
    var mobileNav = document.querySelector("[data-mobile-nav]");
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener("click", function () {
        mobileNav.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", mobileNav.classList.contains("open"));
      });
    }

    /* ---- newsletter inline success (non-AJAX fallback handled by Shopify) ---- */
    var nf = document.querySelector("[data-newsletter]");
    if (nf && window.location.search.indexOf("customer_posted=true") !== -1) {
      var ok = nf.querySelector("[data-newsletter-success]");
      var form = nf.querySelector("form");
      if (ok) ok.style.display = "block";
      if (form) form.style.display = "none";
    }

    /* ---- scroll reveal ---- */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }
  });
})();
