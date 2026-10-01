/**
 * site.js — page language and the values from config.js.
 *
 * English is the source and lives in the HTML; i18n.js holds Azerbaijani and
 * Russian. A key a dictionary lacks falls back to the English already on the
 * page, so a missing translation shows English — never an empty label (the
 * same rule as the panel's own i18n.js).
 *
 * Attributes read here:
 *   data-i18n="key"                 element's innerHTML comes from the dictionary
 *   data-i18n-attr="attr:key;…"     an attribute (meta content, aria-label) likewise
 *   data-site="path"                text from config.js, e.g. "plans.personal.hours";
 *                                   "price:<plan>", "perhour:<plan>", "episodes:<plan>" are computed
 *   data-site-unit="path|key"       a plural word for the number at path, forms in the key ("hour|hours")
 *   data-site-href="…"              "mailto", "subscribe:<plan>", "telegramUrl", or a config path such as "downloadUrl"
 *   data-en-only                    hidden while the page is in English (the legal-page notice)
 *   data-copy="elementId"           button that copies that element's text
 */
(function () {
  "use strict";

  var LANGS = ["en", "az", "ru"];
  var STORE_KEY = "cutterly-lang";
  var C = window.CUTTERLY || {};

  // English strings that only JavaScript writes (the HTML holds all others).
  var EN = {
    "ui.copy": "Copy",
    "ui.copied": "Copied",
    "unit.hours": "hour|hours",
  };

  var current = "en";

  function each(sel, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), fn);
  }

  function readStored() {
    try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }

  function writeStored(lang) {
    try { window.localStorage.setItem(STORE_KEY, lang); } catch (e) { /* private mode */ }
  }

  // ?lang= wins (a shared link), then the reader's last choice, then the browser.
  function initialLang() {
    var fromUrl = null;
    try { fromUrl = new URLSearchParams(window.location.search).get("lang"); } catch (e) { /* old browser */ }
    if (LANGS.indexOf(fromUrl) >= 0) { writeStored(fromUrl); return fromUrl; }
    var saved = readStored();
    if (LANGS.indexOf(saved) >= 0) return saved;
    var prefs = navigator.languages || [navigator.language || "en"];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i] || "").slice(0, 2).toLowerCase();
      if (LANGS.indexOf(code) >= 0) return code;
    }
    return "en";
  }

  function t(lang, key, fallback) {
    var dict = (window.SITE_I18N && window.SITE_I18N[lang]) || {};
    if (lang !== "en" && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    return fallback;
  }

  function lookup(path) {
    return String(path).split(".").reduce(function (obj, part) {
      return obj == null ? undefined : obj[part];
    }, C);
  }

  function money(n) {
    return "$" + (Math.round(n) === n ? String(n) : n.toFixed(2));
  }

  function value(spec) {
    var i = spec.indexOf(":");
    if (i < 0) return lookup(spec);
    var kind = spec.slice(0, i);
    var plan = (C.plans || {})[spec.slice(i + 1)];
    if (!plan) return undefined;
    if (kind === "price") return money(plan.price);
    if (kind === "perhour") return money(Math.round((plan.price / plan.hours) * 100) / 100);
    if (kind === "episodes") return String(Math.floor((plan.hours * 60) / (C.episodeMinutes || 45)));
    return undefined;
  }

  function plural(lang, n, forms) {
    var f = String(forms).split("|");
    if (f.length === 1) return f[0];
    if (lang === "ru") {
      var m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return f[0];
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return f[1];
      return f[2] || f[1];
    }
    return n === 1 ? f[0] : f[1];
  }

  function fill(lang) {
    each("[data-site]", function (el) {
      var v = value(el.getAttribute("data-site"));
      if (v != null) el.textContent = v;
    });
    each("[data-site-unit]", function (el) {
      var parts = el.getAttribute("data-site-unit").split("|");
      el.textContent = plural(lang, Number(value(parts[0])), t(lang, parts[1], EN[parts[1]]));
    });
    each("[data-site-href]", function (el) {
      var spec = el.getAttribute("data-site-href");
      if (spec === "mailto") {
        el.href = "mailto:" + C.supportEmail;
      } else if (spec.indexOf("subscribe:") === 0) {
        var plan = (C.plans || {})[spec.slice(10)];
        var subject = "Cutterly " + (plan ? plan.name : "") + " subscription";
        el.href = "mailto:" + C.supportEmail + "?subject=" + encodeURIComponent(subject);
      } else if (spec === "telegramUrl") {
        var bot = String(C.telegramBot || "").replace(/^@/, "");
        if (bot) el.href = "https://t.me/" + encodeURIComponent(bot);
      } else {
        var url = lookup(spec);
        if (url) el.href = url;
      }
    });
  }

  function apply(lang) {
    current = lang;
    each("[data-i18n]", function (el) {
      if (!("en" in el.dataset)) el.dataset.en = el.innerHTML;
      el.innerHTML = t(lang, el.getAttribute("data-i18n"), el.dataset.en);
    });
    each("[data-i18n-attr]", function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var i = pair.indexOf(":");
        if (i < 0) return;
        var attr = pair.slice(0, i).trim();
        var key = pair.slice(i + 1).trim();
        var slot = "en" + attr.replace(/[^a-z]/gi, "").toLowerCase();
        if (!(slot in el.dataset)) el.dataset[slot] = el.getAttribute(attr) || "";
        el.setAttribute(attr, t(lang, key, el.dataset[slot]));
      });
    });
    each("[data-en-only]", function (el) { el.hidden = lang === "en"; });
    each("[data-lang]", function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });
    document.documentElement.lang = lang;
    fill(lang);
  }

  document.addEventListener("click", function (e) {
    var langBtn = e.target.closest("[data-lang]");
    if (langBtn) {
      var lang = langBtn.getAttribute("data-lang");
      if (LANGS.indexOf(lang) >= 0) { writeStored(lang); apply(lang); }
      return;
    }
    var copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      var src = document.getElementById(copyBtn.getAttribute("data-copy"));
      if (!src) return;
      var done = function () {
        copyBtn.textContent = t(current, "ui.copied", EN["ui.copied"]);
        setTimeout(function () { copyBtn.textContent = t(current, "ui.copy", EN["ui.copy"]); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(src.textContent).then(done, function () { selectText(src); });
      } else {
        selectText(src);
      }
    }
  });

  // Clipboard refused (old browser, file://): select the text so ⌘C works.
  function selectText(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  apply(initialLang());
  document.documentElement.classList.add("i18n-ready");
})();
