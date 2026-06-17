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

  /* ---- escape untrusted text for innerHTML ---- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---- Shopify money formatter (supports the common money_format tokens) ---- */
  function formatMoney(cents) {
    var fmt = (window.theme && window.theme.moneyFormat) || "${{amount}}";
    if (typeof cents === "string") cents = cents.replace(".", "");
    cents = parseInt(cents, 10) || 0;
    function withDelimiters(number, precision, thousands, decimal) {
      precision = precision == null ? 2 : precision;
      thousands = thousands || ",";
      decimal = decimal || ".";
      number = (number / 100).toFixed(precision);
      var parts = number.split(".");
      var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands);
      return dollars + (parts[1] ? decimal + parts[1] : "");
    }
    var match = fmt.match(/\{\{\s*(\w+)\s*\}\}/);
    var token = match ? match[1] : "amount";
    var value;
    switch (token) {
      case "amount_no_decimals": value = withDelimiters(cents, 0); break;
      case "amount_with_comma_separator": value = withDelimiters(cents, 2, ".", ","); break;
      case "amount_no_decimals_with_comma_separator": value = withDelimiters(cents, 0, "."); break;
      case "amount_with_space_separator": value = withDelimiters(cents, 2, " ", "."); break;
      case "amount_no_decimals_with_space_separator": value = withDelimiters(cents, 0, " "); break;
      default: value = withDelimiters(cents, 2);
    }
    return fmt.replace(/\{\{\s*\w+\s*\}\}/, value);
  }
  window.GBB.formatMoney = formatMoney;

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
            var items = [{ id: parseInt(cta.dataset.variantId, 10), quantity: 1, properties: properties }];
            if (window.GBBCart) {
              window.GBBCart.addItems(items)
                .then(function () { cta.classList.remove("is-loading"); })
                .catch(function () { window.location = cta.dataset.cartUrl || "/cart"; });
            } else {
              fetch((cta.dataset.addUrl || "/cart/add") + ".js", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ items: items })
              }).then(function () {
                window.location = cta.dataset.cartUrl || "/cart";
              }).catch(function () {
                window.location = cta.dataset.cartUrl || "/cart";
              });
            }
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

    /* ---- cart: AJAX add + slide-out drawer ---- */
    var cfg = window.theme || {};
    var GBBCart = null;
    if (cfg.ajaxAdd) {
      var drawer = document.querySelector("[data-cart-drawer]");
      var overlay = document.querySelector("[data-cart-overlay]");
      var lastFocus = null;

      var ADD_URL = (cfg.cartAddUrl || "/cart/add") ;
      var CHANGE_URL = (cfg.cartChangeUrl || "/cart/change");
      var CART_URL = (cfg.cartUrl || "/cart");

      function setCounts(n) {
        document.querySelectorAll("[data-cart-count]").forEach(function (el) { el.textContent = n; });
        var lbl = drawer && drawer.querySelector("[data-cart-count-label]");
        if (lbl) lbl.textContent = n ? "· " + n : "";
      }

      function lineProps(props) {
        if (!props) return "";
        var out = [];
        Object.keys(props).forEach(function (k) {
          if (k.charAt(0) === "_") return;
          if (props[k] === "" || props[k] == null) return;
          out.push(esc(props[k]));
        });
        return out.length ? '<div class="cd-props">' + out.join(" · ") + "</div>" : "";
      }

      function renderShip(cart) {
        var bar = drawer && drawer.querySelector("[data-cart-ship]");
        if (!bar) return;
        var threshold = parseInt(cfg.freeShipThreshold, 10) || 0;
        if (threshold <= 0) { bar.hidden = true; return; }
        bar.hidden = false;
        var msg = drawer.querySelector("[data-cart-ship-msg]");
        var fill = drawer.querySelector("[data-cart-ship-fill]");
        var remaining = threshold - cart.total_price;
        if (remaining > 0) {
          if (msg) msg.innerHTML = "You're <b>" + formatMoney(remaining) + "</b> away from a reward 🎁";
        } else {
          if (msg) msg.innerHTML = "🎉 You've unlocked your reward!";
        }
        if (fill) fill.style.width = Math.min(100, (cart.total_price / threshold) * 100) + "%";
      }

      function render(cart) {
        setCounts(cart.item_count);
        if (!drawer) return;
        var itemsEl = drawer.querySelector("[data-cart-items]");
        var emptyEl = drawer.querySelector("[data-cart-empty]");
        var footEl = drawer.querySelector("[data-cart-foot]");
        var subtotalEl = drawer.querySelector("[data-cart-subtotal]");

        if (!cart.item_count) {
          if (itemsEl) { itemsEl.hidden = true; itemsEl.innerHTML = ""; }
          if (emptyEl) emptyEl.hidden = false;
          if (footEl) footEl.hidden = true;
          renderShip(cart);
          return;
        }
        if (emptyEl) emptyEl.hidden = true;
        if (footEl) footEl.hidden = false;
        if (itemsEl) {
          itemsEl.hidden = false;
          itemsEl.innerHTML = cart.items.map(function (item) {
            var img = item.image
              ? '<img src="' + esc(item.image.replace(/(\.[a-z]+)(\?|$)/i, "_160x$1$2")) + '" alt="' + esc(item.product_title) + '" width="64" height="64" loading="lazy">'
              : "";
            var variant = (item.variant_title && item.variant_title.indexOf("Default") === -1)
              ? '<div class="cd-variant">' + esc(item.variant_title) + "</div>" : "";
            return '<li class="cd-item" data-key="' + esc(item.key) + '">' +
              '<div class="cd-thumb">' + img + "</div>" +
              '<div class="cd-meta">' +
                '<a href="' + esc(item.url) + '" class="cd-name">' + esc(item.product_title) + "</a>" +
                variant + lineProps(item.properties) +
                '<div class="cd-qty" data-cd-qty>' +
                  '<button type="button" data-cd-dec aria-label="Decrease">−</button>' +
                  '<span class="cd-qval">' + item.quantity + "</span>" +
                  '<button type="button" data-cd-inc aria-label="Increase">+</button>' +
                  '<button type="button" class="cd-remove" data-cd-remove>Remove</button>' +
                "</div>" +
              "</div>" +
              '<div class="cd-price">' + formatMoney(item.final_line_price) + "</div>" +
            "</li>";
          }).join("");
        }
        if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);
        renderShip(cart);
      }

      function refresh() {
        return fetch(CART_URL + ".js", { headers: { "Accept": "application/json" } })
          .then(function (r) { return r.json(); })
          .then(function (cart) { render(cart); return cart; });
      }

      function open() {
        if (!drawer) { window.location = CART_URL; return; }
        lastFocus = document.activeElement;
        if (overlay) overlay.hidden = false;
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
        document.documentElement.classList.add("cd-locked");
        var c = drawer.querySelector("[data-cart-close]");
        if (c) c.focus();
      }
      function close() {
        if (!drawer) return;
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        if (overlay) overlay.hidden = true;
        document.documentElement.classList.remove("cd-locked");
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }

      function changeQty(key, qty) {
        return fetch(CHANGE_URL + ".js", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ id: key, quantity: qty })
        }).then(function (r) { return r.json(); }).then(function (cart) { render(cart); return cart; });
      }

      function addItems(items) {
        return fetch(ADD_URL + ".js", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ items: items })
        }).then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) { throw data; }
            return data;
          });
        }).then(function () {
          return refresh().then(function (cart) { open(); return cart; });
        });
      }

      GBBCart = { open: open, close: close, refresh: refresh, addItems: addItems };
      window.GBBCart = GBBCart;

      /* drawer interactions */
      if (drawer) {
        drawer.addEventListener("click", function (e) {
          var li = e.target.closest("[data-key]");
          if (!li) return;
          var key = li.getAttribute("data-key");
          var qval = li.querySelector(".cd-qval");
          var qty = qval ? parseInt(qval.textContent, 10) || 1 : 1;
          if (e.target.closest("[data-cd-inc]")) changeQty(key, qty + 1);
          else if (e.target.closest("[data-cd-dec]")) changeQty(key, Math.max(0, qty - 1));
          else if (e.target.closest("[data-cd-remove]")) changeQty(key, 0);
        });
        drawer.querySelectorAll("[data-cart-close]").forEach(function (b) {
          b.addEventListener("click", function (e) { e.preventDefault(); close(); });
        });
      }
      if (overlay) overlay.addEventListener("click", close);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

      /* open drawer from header cart links */
      document.querySelectorAll("[data-cart-open]").forEach(function (el) {
        el.addEventListener("click", function (e) {
          if (!drawer) return; /* let it navigate */
          e.preventDefault();
          refresh().then(open);
        });
      });

      /* intercept product add-to-cart forms */
      document.querySelectorAll('form[action$="/cart/add"], form#pdp-add').forEach(function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var btn = form.querySelector('[name="add"]');
          if (btn) { btn.classList.add("is-loading"); btn.disabled = true; }
          var fd = new FormData(form);
          var item = { id: fd.get("id"), quantity: parseInt(fd.get("quantity"), 10) || 1, properties: {} };
          fd.forEach(function (v, k) {
            var m = k.match(/^properties\[(.+)\]$/);
            if (m && v) item.properties[m[1]] = v;
          });
          addItems([item]).catch(function (err) {
            window.location = CART_URL; /* fall back to cart page on error */
          }).then(function () {
            if (btn) { btn.classList.remove("is-loading"); btn.disabled = false; }
          });
        });
      });

      /* sticky mobile add-to-cart triggers the PDP form */
      var stickyAdd = document.querySelector("[data-sticky-add]");
      var pdpForm = document.getElementById("pdp-add");
      if (stickyAdd && pdpForm) {
        stickyAdd.addEventListener("click", function () {
          if (typeof pdpForm.requestSubmit === "function") pdpForm.requestSubmit();
          else pdpForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        });
      }
    }

    /* ---- product recommendations (Shopify recommendations API) ----
       The section server-renders a collection fallback first; here we lazily
       fetch behaviour-based recommendations and swap them in when they arrive. */
    var rec = document.querySelector("[data-recommendations]");
    if (rec && rec.dataset.url && rec.dataset.productId) {
      var fetchRecs = function () {
        var url = rec.dataset.url +
          "?section_id=" + encodeURIComponent(rec.dataset.sectionId) +
          "&product_id=" + encodeURIComponent(rec.dataset.productId) +
          "&limit=" + encodeURIComponent(rec.dataset.limit || 4) +
          "&intent=" + encodeURIComponent(rec.dataset.intent || "related");
        fetch(url, { headers: { "Accept": "text/html" } })
          .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            var fresh = doc.querySelector("[data-recommendations]");
            if (!fresh || !fresh.querySelector(".pcard")) return; /* keep fallback if no recs */
            rec.innerHTML = fresh.innerHTML;
            rec.querySelectorAll("[data-bear]").forEach(function (el) {
              if (el.dataset.filled) return;
              el.innerHTML = bearSVG(el.getAttribute("data-bear") || "var(--cherry)");
            });
            rec.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
          })
          .catch(function () { /* keep server-rendered fallback */ });
      };
      if ("IntersectionObserver" in window) {
        var recIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { recIO.disconnect(); fetchRecs(); } });
        }, { rootMargin: "400px" });
        recIO.observe(rec);
      } else {
        fetchRecs();
      }
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
