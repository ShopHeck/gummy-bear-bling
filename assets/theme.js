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

    /* ---- color story / "Tap a flavor" ----
       Each swatch is a real <a> linking to the matched necklace, so it works
       with no JS. With JS, tapping a swatch previews that flavor (bear + copy)
       and points the main CTA at the matching product; the CTA is the buy path. */
    document.querySelectorAll("[data-colorstory]").forEach(function (cs) {
      var stage = cs.querySelector("[data-colorstory-stage]");
      var nameEl = cs.querySelector("[data-colorstory-name]");
      var cta = cs.querySelector("[data-colorstory-cta]");
      var ctaLabel = cta ? (cta.getAttribute("data-label") || cta.textContent.trim()) : "";
      var swatches = Array.prototype.slice.call(cs.querySelectorAll("[data-flavor]"));
      if (!swatches.length) return;

      function select(el) {
        swatches.forEach(function (s) { s.classList.remove("active"); s.setAttribute("aria-current", "false"); });
        el.classList.add("active");
        el.setAttribute("aria-current", "true");
        if (stage) stage.innerHTML = bearSVG(el.getAttribute("data-color"));
        if (nameEl) {
          var desc = el.getAttribute("data-desc");
          nameEl.innerHTML = "<b>" + el.getAttribute("data-label") + "</b>" + (desc ? " — " + desc : "");
        }
        if (cta) {
          var url = el.getAttribute("data-url");
          if (url) cta.setAttribute("href", url);
          cta.textContent = ctaLabel.replace("%s", el.getAttribute("data-label"));
        }
      }

      swatches.forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.preventDefault(); /* JS: preview only. Without JS the <a> navigates. */
          select(el);
        });
      });
      select(swatches[0]);
    });

    /* ---- build-a-stack picker (homepage section + bundle product page) ----
       Shared logic: pick flavors to fill N slots. On the homepage the CTA can
       AJAX-add the bundle product (with each pick saved as a line-item property)
       or deep-link to the bundle page; on the product page it drives the real
       add-to-cart form. */
    function initStack(root) {
      var slotsWrap = root.querySelector("[data-stack-slots]");
      var picker = root.querySelector("[data-stack-picker]");
      if (!slotsWrap || !picker) return;

      var slots = Array.prototype.slice.call(slotsWrap.querySelectorAll("[data-stack-slot]"));
      var flavorBtns = Array.prototype.slice.call(picker.querySelectorAll("[data-stack-flavor]"));
      var props = Array.prototype.slice.call(root.querySelectorAll("[data-stack-prop]"));
      var hint = root.querySelector("[data-stack-hint]");
      var cta = root.querySelector("[data-stack-cta]");
      var submit = root.querySelector("[data-stack-submit]");
      var state = slots.map(function () { return null; });

      function render() {
        slots.forEach(function (slot, i) {
          var box = slot.querySelector("[data-bear]");
          if (state[i]) {
            slot.classList.add("filled");
            slot.setAttribute("data-flavor-label", state[i].label);
            if (box) box.innerHTML = bearSVG(state[i].color);
          } else {
            slot.classList.remove("filled");
            slot.removeAttribute("data-flavor-label");
            if (box) box.innerHTML = "";
          }
        });
        props.forEach(function (p, i) { p.value = state[i] ? state[i].label : ""; });

        var filled = state.filter(Boolean).length;
        var remaining = slots.length - filled;
        var full = remaining === 0;
        if (hint) {
          hint.textContent = full
            ? "Your stack is ready! 🐻🐻🐻"
            : "Pick " + remaining + " more flavor" + (remaining === 1 ? "" : "s") + " to fill your stack.";
        }
        if (submit) submit.disabled = !full;
        if (cta) {
          cta.classList.toggle("is-disabled", !full);
          cta.setAttribute("aria-disabled", full ? "false" : "true");
          if (cta.dataset.baseUrl) {
            var labels = state.filter(Boolean).map(function (s) { return encodeURIComponent(s.label); });
            var sep = cta.dataset.baseUrl.indexOf("?") > -1 ? "&" : "?";
            cta.setAttribute("href", labels.length ? cta.dataset.baseUrl + sep + "stack=" + labels.join(",") : cta.dataset.baseUrl);
          }
        }
      }

      function addFlavor(f) {
        var empty = state.indexOf(null);
        if (empty === -1) return; /* full — ignore */
        state[empty] = f;
        render();
      }

      flavorBtns.forEach(function (b) {
        b.addEventListener("click", function () {
          addFlavor({ color: b.getAttribute("data-color"), label: b.getAttribute("data-label") });
        });
      });

      slots.forEach(function (slot, i) {
        slot.addEventListener("click", function () { if (state[i]) { state[i] = null; render(); } });
      });

      /* prefill from ?stack=cherry,grape,lemon (deep link from homepage teaser) */
      try {
        var pre = new URLSearchParams(window.location.search).get("stack");
        if (pre) {
          pre.split(",").forEach(function (lbl) {
            lbl = decodeURIComponent(lbl).trim().toLowerCase();
            var match = flavorBtns.filter(function (b) {
              return (b.getAttribute("data-label") || "").toLowerCase() === lbl;
            })[0];
            if (match) addFlavor({ color: match.getAttribute("data-color"), label: match.getAttribute("data-label") });
          });
        }
      } catch (e) {}

      render();

      if (cta) {
        cta.addEventListener("click", function (e) {
          if (state.indexOf(null) !== -1) { /* not full yet */
            e.preventDefault();
            if (hint) { hint.classList.remove("nudge"); void hint.offsetWidth; hint.classList.add("nudge"); }
            return;
          }
          if (cta.dataset.variantId) { /* AJAX add the bundle product with flavor properties */
            e.preventDefault();
            cta.classList.add("is-loading");
            var properties = {};
            state.forEach(function (s, i) { properties["Bear " + (i + 1)] = s.label; });
            fetch(cta.dataset.addUrl || "/cart/add.js", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({ items: [{ id: parseInt(cta.dataset.variantId, 10), quantity: 1, properties: properties }] })
            }).then(function () {
              window.location = cta.dataset.cartUrl || "/cart";
            }).catch(function () {
              window.location = cta.dataset.cartUrl || "/cart";
            });
          }
          /* else: link mode — href already carries ?stack=, allow default navigation */
        });
      }
    }
    document.querySelectorAll("[data-stack]").forEach(initStack);

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
