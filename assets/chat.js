/**
 * chat.js — the Cutterly chat widget (launcher + panel).
 *
 * Add to a page, after site.js:
 *   <link rel="stylesheet" href="assets/chat.css">      (in <head>, after style.css)
 *   <script src="assets/chat.js"></script>              (end of <body>)
 *
 * "Talk to a person" opens the Telegram bot (config.js telegramBot), or
 * email while that is empty.
 *
 * Talks to one endpoint, set in config.js:
 *   window.CUTTERLY.chatEndpoint = "https://api.cutterlyai.com/site-chat";
 * Request:  POST JSON { lang: "en"|"az"|"ru", messages: [{ role: "user"|"assistant", text }] }
 * Response: JSON { reply: "plain text" }
 * The reply is shown as plain text (never as HTML). Without an endpoint, or
 * when a request fails, the widget offers email instead of an answer.
 *
 * Strings live here, not in i18n.js: the widget builds its own markup, and
 * follows the page language (the lang attribute site.js sets on <html>).
 * The conversation is kept in sessionStorage only — it ends with the tab.
 */
(function () {
  "use strict";

  var C = window.CUTTERLY || {};
  var SCRIPT = document.currentScript && document.currentScript.src;
  var ASSETS = SCRIPT ? SCRIPT.replace(/[^/]*$/, "") : "assets/";
  var STORE = "cutterly-chat";
  var HISTORY_SENT = 12;      // messages sent to the server per request
  var TIMEOUT_MS = 30000;

  var T = {
    en: {
      title: "Cutterly assistant", status: "Online",
      open: "Open chat", close: "Close chat", send: "Send", label: "Your question",
      placeholder: "Ask a question…", typing: "typing…", who: "Cutterly · AI", me: "You",
      welcome: "Hi! I answer questions about Cutterly — what it does, pricing, installation. Ask anything, or pick a question below.",
      chips: ["What does it do?", "Pricing", "Does my Premiere version work?", "How do I buy?"],
      buy: "Buy now", human: "Talk to a person",
      note: "Answers are written by AI and can be wrong.", privacy: "Privacy",
      down: "The assistant is not available right now. Write to us and a person will answer by email.",
      mailSubject: "Question from the website chat", buySubject: "Cutterly subscription",
    },
    az: {
      title: "Cutterly köməkçisi", status: "Onlayn",
      open: "Söhbəti aç", close: "Söhbəti bağla", send: "Göndər", label: "Sualın",
      placeholder: "Sualını yaz…", typing: "yazır…", who: "Cutterly · AI", me: "Sən",
      welcome: "Salam! Cutterly haqqında suallara cavab verirəm — nə edir, qiymətlər, quraşdırma. Sualını yaz və ya aşağıdakılardan birini seç.",
      chips: ["Nə edir?", "Qiymətlər", "Premiere versiyam uyğundur?", "Necə alım?"],
      buy: "İndi al", human: "İnsanla danış",
      note: "Cavabları AI yazır, səhv ola bilər.", privacy: "Məxfilik",
      down: "Köməkçi hazırda əlçatan deyil. Bizə yaz — insan e-poçtla cavab verəcək.",
      mailSubject: "Saytdakı söhbətdən sual", buySubject: "Cutterly abunəsi",
    },
    ru: {
      title: "Помощник Cutterly", status: "Онлайн",
      open: "Открыть чат", close: "Закрыть чат", send: "Отправить", label: "Ваш вопрос",
      placeholder: "Задайте вопрос…", typing: "печатает…", who: "Cutterly · ИИ", me: "Вы",
      welcome: "Здравствуйте! Отвечаю на вопросы о Cutterly — что он делает, цены, установка. Напишите вопрос или выберите готовый.",
      chips: ["Что он делает?", "Цены", "Подойдёт ли моя версия Premiere?", "Как купить?"],
      buy: "Купить сейчас", human: "Связаться с человеком",
      note: "Ответы пишет ИИ, возможны ошибки.", privacy: "Конфиденциальность",
      down: "Помощник сейчас недоступен. Напишите нам — человек ответит по почте.",
      mailSubject: "Вопрос из чата на сайте", buySubject: "Подписка Cutterly",
    },
  };

  var ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
  };

  // ---------- state ----------
  var state = load() || { open: false, messages: [] };   // messages: {role, text, down?}
  var busy = false;

  function load() {
    try { return JSON.parse(sessionStorage.getItem(STORE)); } catch (e) { return null; }
  }
  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify({ open: state.open, messages: state.messages.slice(-40) })); } catch (e) { /* private mode */ }
  }
  function lang() {
    var l = (document.documentElement.lang || "en").slice(0, 2);
    return T[l] ? l : "en";
  }
  function t(k) { return T[lang()][k]; }

  // ---------- DOM helpers ----------
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function mailto(subject, body) {
    var to = C.supportEmail || "support@cutterlyai.com";
    return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + (body ? "&body=" + encodeURIComponent(body) : "");
  }
  function transcript() {
    var lines = state.messages.slice(-8).map(function (m) { return (m.role === "user" ? t("me") : "Cutterly") + ": " + m.text; });
    var s = lines.join("\n\n");
    return s.length > 1500 ? s.slice(-1500) : s;
  }

  // ---------- build ----------
  var root = el("div", "cw");
  root.innerHTML =
    '<section class="cw-panel" id="cw-panel" role="dialog" hidden>' +
      '<header class="cw-head">' +
        '<img class="cw-avatar" alt="" width="36" height="36">' +
        '<div class="cw-title"><b class="cw-t-title"></b><span class="cw-status"><i></i><span class="cw-t-status"></span></span></div>' +
        '<button type="button" class="cw-close">' + ICON.close + '</button>' +
      '</header>' +
      '<div class="cw-log" role="log" aria-live="polite"></div>' +
      '<form class="cw-compose">' +
        '<label class="cw-sr" for="cw-input"></label>' +
        '<textarea class="cw-input" id="cw-input" rows="1" maxlength="1000"></textarea>' +
        '<button type="submit" class="cw-send" disabled>' + ICON.send + '</button>' +
      '</form>' +
      '<p class="cw-note"><span class="cw-t-note"></span> <a class="cw-t-privacy"></a></p>' +
    '</section>' +
    '<button type="button" class="cw-launcher" aria-controls="cw-panel">' +
      '<img alt="" width="60" height="60"><span class="cw-x" hidden>' + ICON.close + '</span>' +
    '</button>';

  var panel = root.querySelector(".cw-panel");
  var log = root.querySelector(".cw-log");
  var form = root.querySelector(".cw-compose");
  var input = root.querySelector(".cw-input");
  var sendBtn = root.querySelector(".cw-send");
  var launcher = root.querySelector(".cw-launcher");
  root.querySelector(".cw-avatar").src = ASSETS + "brand/cutterly-icon-512.png";
  launcher.querySelector("img").src = ASSETS + "brand/cutterly-icon-512.png";
  root.querySelector(".cw-t-privacy").href = ASSETS + "../privacy/";

  function labels() {
    root.querySelector(".cw-t-title").textContent = t("title");
    root.querySelector(".cw-t-status").textContent = t("status");
    root.querySelector(".cw-t-note").textContent = t("note");
    root.querySelector(".cw-t-privacy").textContent = t("privacy");
    root.querySelector('label[for="cw-input"]').textContent = t("label");
    panel.setAttribute("aria-label", t("title"));
    root.querySelector(".cw-close").setAttribute("aria-label", t("close"));
    sendBtn.setAttribute("aria-label", t("send"));
    input.placeholder = t("placeholder");
    launcher.setAttribute("aria-label", state.open ? t("close") : t("open"));
  }

  function actions() {
    var row = el("div", "cw-cta");
    var buy = el("a", "cw-btn cw-btn--primary", t("buy"));
    buy.href = mailto(t("buySubject"));
    var human = el("a", "cw-btn");
    human.innerHTML = ICON.mail;
    human.appendChild(document.createTextNode(t("human")));
    // A person answers in Telegram once the bot is set in config.js; until then, by email.
    var bot = String(C.telegramBot || "").replace(/^@/, "");
    if (bot) {
      human.href = "https://t.me/" + encodeURIComponent(bot) + "?start=site";
      human.target = "_blank";
      human.rel = "noopener";
    } else {
      human.href = mailto(t("mailSubject"), transcript());
    }
    row.appendChild(buy);
    row.appendChild(human);
    return row;
  }

  function render() {
    log.textContent = "";
    var welcome = el("div", "cw-msg cw-msg--ai");
    welcome.appendChild(el("p", "cw-who", t("who")));
    welcome.appendChild(el("div", "cw-bubble", t("welcome")));
    log.appendChild(welcome);

    if (!state.messages.some(function (m) { return m.role === "user"; })) {
      var chips = el("div", "cw-chips");
      t("chips").forEach(function (q) {
        var b = el("button", "cw-chip", q);
        b.type = "button";
        b.addEventListener("click", function () { ask(q); });
        chips.appendChild(b);
      });
      log.appendChild(chips);
    }

    state.messages.forEach(function (m, i) {
      var wrap = el("div", "cw-msg cw-msg--" + (m.role === "user" ? "me" : "ai"));
      if (m.role !== "user") wrap.appendChild(el("p", "cw-who", t("who")));
      wrap.appendChild(el("div", "cw-bubble", m.down ? t("down") : m.text));
      // actions only under the latest answer, so the log does not fill with buttons
      if (m.role !== "user" && i === state.messages.length - 1 && !busy) wrap.appendChild(actions());
      log.appendChild(wrap);
    });

    if (busy) {
      var typing = el("div", "cw-typing");
      var dots = el("span", "cw-dots");
      dots.innerHTML = "<i></i><i></i><i></i>";
      typing.appendChild(dots);
      typing.appendChild(el("span", "", t("typing")));
      log.appendChild(typing);
    }
    log.scrollTop = log.scrollHeight;
  }

  // ---------- open / close ----------
  var mobile = window.matchMedia("(max-width: 520px)");
  function setOpen(open, focus) {
    state.open = open;
    root.dataset.open = String(open);
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    launcher.querySelector(".cw-x").hidden = !open;
    document.documentElement.classList.toggle("cw-lock", open && mobile.matches);
    panel.setAttribute("aria-modal", String(open && mobile.matches));
    labels();
    if (open) { render(); if (focus) input.focus(); }
    else if (focus) launcher.focus();
    save();
  }

  launcher.addEventListener("click", function () { setOpen(!state.open, true); });
  root.querySelector(".cw-close").addEventListener("click", function () { setOpen(false, true); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && state.open) setOpen(false, true);
  });

  // ---------- sending ----------
  function grow() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
    sendBtn.disabled = busy || !input.value.trim();
  }
  input.addEventListener("input", grow);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.submit(); }
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (q) { input.value = ""; grow(); ask(q); }
  });

  function ask(text) {
    if (busy) return;
    state.messages.push({ role: "user", text: text });
    busy = true;
    render(); grow(); save();

    var done = function (reply) {
      busy = false;
      state.messages.push(reply ? { role: "assistant", text: reply } : { role: "assistant", text: "", down: true });
      render(); grow(); save();
    };
    if (!C.chatEndpoint || !window.fetch) { setTimeout(function () { done(null); }, 600); return; }

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    fetch(C.chatEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang: lang(),
        messages: state.messages.filter(function (m) { return !m.down; }).slice(-HISTORY_SENT)
          .map(function (m) { return { role: m.role, text: m.text }; }),
      }),
      signal: ctrl ? ctrl.signal : undefined,
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { clearTimeout(timer); done(d && typeof d.reply === "string" && d.reply.trim() ? d.reply.trim() : null); })
      .catch(function () { clearTimeout(timer); done(null); });
  }

  // follow the site's language switch (site.js sets <html lang>)
  new MutationObserver(function () { labels(); if (state.open) render(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  document.body.appendChild(root);
  busy = false;
  setOpen(!!state.open && !mobile.matches, false);
})();
