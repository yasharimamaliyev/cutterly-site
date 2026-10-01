/**
 * download.js — the Download page only: which computer is this, and the
 * [macOS | Windows] install switch. Copy buttons are handled by site.js.
 *
 * ?os=mac or ?os=win in the URL overrides detection (for links from the panel
 * or from support replies). On a phone or an unknown system nothing is
 * highlighted and both download buttons stay primary.
 * Without JavaScript both instruction sets are shown one under the other.
 */
(function () {
  "use strict";

  var root = document.querySelector(".dl");
  if (!root) return;

  function detect() {
    var q = null;
    try { q = new URLSearchParams(location.search).get("os"); } catch (e) { /* old browser */ }
    if (q === "mac" || q === "win") return q;
    var p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "").toLowerCase();
    var ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod|android/.test(ua)) return "";
    if (p.indexOf("win") === 0 || /windows nt/.test(ua)) return "win";
    // iPadOS reports itself as a Mac; a touch screen gives it away
    if ((p.indexOf("mac") === 0 || /mac os x/.test(ua)) && !(navigator.maxTouchPoints > 1)) return "mac";
    return "";
  }

  var os = detect();
  root.setAttribute("data-os", os);

  // ---- platform cards: the visitor's own system leads ----
  Array.prototype.forEach.call(root.querySelectorAll("[data-platform]"), function (card) {
    var mine = card.getAttribute("data-platform") === os;
    var btn = card.querySelector(".btn");
    card.classList.toggle("is-yours", mine);
    card.querySelector(".yours").hidden = !mine;
    if (os && !mine) { btn.classList.remove("btn-primary"); btn.classList.add("btn-secondary"); }
  });

  // ---- install tabs ----
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var list = root.querySelector('[role="tablist"]');
  if (!tabs.length || !list) return;

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }

  list.hidden = false;
  Array.prototype.forEach.call(root.querySelectorAll(".tab-label"), function (h) { h.hidden = true; });
  select(document.getElementById(os === "win" ? "tab-win" : "tab-mac"), false);

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(t, false); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
      else if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      else if (n) { e.preventDefault(); select(tabs[(i + n + tabs.length) % tabs.length], true); }
    });
  });
})();
