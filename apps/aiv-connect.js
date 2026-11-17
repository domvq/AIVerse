/* =====================================================================
   AIV Connect — links AI Verse apps with AIV X
   - Syncs the app's saved data to the person's AIV X account
       * inside AIV X: through AIV X (already signed in)
       * on aiverse.it.com: after a one-time "Sync with AIV X" sign-in
   - Lets the AIV X copilot see the app's screen and operate it
   Add to each app, after the app's own scripts:
       <script src="aiv-connect.js"></script>
   ===================================================================== */
(function () {
  "use strict";

  var AIVX_ORIGINS = [
    "https://aiv-x.com",
    "https://www.aiv-x.com",
    "https://domvq.github.io",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
  ];
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyCvqB6cQl3dj93qhKcWdPbAKOJyqtqWfuo",
    authDomain: "aiv-x-21aba.firebaseapp.com",
    projectId: "aiv-x-21aba",
    storageBucket: "aiv-x-21aba.firebasestorage.app",
    messagingSenderId: "470138918405",
    appId: "1:470138918405:web:29655461ebc6c5aece6e6c"
  };
  var FB = "https://www.gstatic.com/firebasejs/10.12.2/";
  var FILE_TO_ID = {
    "aide": "aide", "personal-assistant-ai": "aide", "ai-personal-assistant": "aide", "ai-study-and-research": "study", "ai-stock-and-finance": "finance", "ai-health-and-fitness": "fitness", "ai-photo": "photo", "ai-career": "career", "ai-music": "music", "music-ai": "music", "study-and-research-ai": "study", "stock-and-finance-ai": "finance",
    "health-and-fitness-ai": "fitness", "photo-ai": "photo", "career-ai": "career"
  };
  // phones: tapping a text box never zooms the app (iOS zooms text under 16px)
  try {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp && !/maximum-scale/.test(vp.content)) vp.content += ", maximum-scale=1.0";
    var nz = document.createElement("style");
    nz.textContent = "@media (pointer:coarse),(max-width:900px){input,textarea,select,[contenteditable]{font-size:16px!important}}";
    (document.head || document.documentElement).appendChild(nz);
  } catch (e) {}
  var file = (location.pathname.split("/").pop() || "").replace(/\.html?$/i, "");
  var APP_ID = FILE_TO_ID[file] || file || "app";

  /* ---------- access the app's own state (S, KEY, load, save, refresh, go) ---------- */
  // Each app exposes a tiny handle: window.AIV_APP = { key, S, reload(), go(screen), screen() }
  var H = window.AIV_APP || null;
  var OK = !!(H && typeof H.key === "string");
  if (!OK) { try { console.warn("[AIV Connect] app hook not found; sync disabled"); } catch (e) {} }
  var STORE_KEY = OK ? H.key : null;
  var META_KEY = "aivsync." + (STORE_KEY || APP_ID);

  function readMeta() { try { return JSON.parse(localStorage.getItem(META_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function writeMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }
  function localData() { try { return localStorage.getItem(STORE_KEY) || ""; } catch (e) { return ""; } }
  function localAt() {
    var m = readMeta();
    if (m.at) return m.at;
    return localData() ? 1 : 0; // existing data from before sync was added counts as "old"
  }

  var applying = false, dirtyTimer = null, pusher = null;

  // Notice every time the app saves its data
  if (OK) {
    var _set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      var r = _set.apply(this, arguments);
      if (this === window.localStorage && k === STORE_KEY && !applying) {
        var m = readMeta(); m.at = Date.now(); writeMeta(m);
        clearTimeout(dirtyTimer);
        dirtyTimer = setTimeout(function () { if (pusher) pusher(); }, 1500);
      }
      return r;
    };
  }

  function applyRemote(remote) {
    if (!OK || !remote || !remote.data) return;
    applying = true;
    try {
      localStorage.setItem(STORE_KEY, remote.data);
      writeMeta({ at: remote.at });
      H.reload();
    } catch (e) { try { console.warn("[AIV Connect] apply failed", e); } catch (x) {} }
    applying = false;
  }
  // Decide which side is newer and sync. get() → {at,data}|null ; put(at,data) → Promise
  function reconcile(get, put) {
    return get().then(function (remote) {
      var la = localAt(), data = localData();
      if (remote && remote.at > la) { applyRemote(remote); return "pulled"; }
      if (data && (!remote || la > remote.at)) {
        var at = la > 1 ? la : Date.now();
        writeMeta({ at: at });
        return put(at, data).then(function () { return "pushed"; });
      }
      return "same";
    });
  }

  /* ---------- screen context for the copilot ---------- */
  function visible(el) { return !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden"); }
  function labelOf(el) {
    var t = el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("title") || "";
    if (!t && el.id) { var l = document.querySelector('label[for="' + el.id + '"]'); if (l) t = l.innerText; }
    if (!t) { var p = el.closest("label"); if (p) t = p.innerText; }
    if (!t && el.name) t = el.name;
    return String(t || "").replace(/\s+/g, " ").trim().slice(0, 80);
  }
  function context() {
    var screen = "";
    try { screen = (H && H.screen()) || ""; } catch (e) {}
    if (!screen) screen = location.hash.replace("#", "") || "home";
    var screens = [];
    document.querySelectorAll("[data-nav]").forEach(function (a) { if (screens.indexOf(a.dataset.nav) < 0) screens.push(a.dataset.nav); });
    var root = document.querySelector(".view.on") || document.querySelector("main") || document.body;
    var text = (root.innerText || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 6000);
    var controls = [];
    root.querySelectorAll("button, a[href], [data-act], [role=button], input, textarea, select").forEach(function (el) {
      if (controls.length >= 70 || !visible(el)) return;
      var tag = el.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        var type = (el.type || tag).toLowerCase();
        if (type === "hidden") return;
        controls.push({ field: labelOf(el) || type, type: type === "checkbox" ? "checkbox" : tag === "select" ? "select" : "text", value: type === "checkbox" ? el.checked : String(el.value || "").slice(0, 60) });
      } else {
        var t = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").replace(/\s+/g, " ").trim().slice(0, 60);
        if (t) controls.push({ button: t });
      }
    });
    var data = "";
    try { data = JSON.stringify(H && H.S); } catch (e) {}
    if (data.length > 9000) data = data.slice(0, 9000) + "…(truncated)";
    return { app: APP_ID, title: document.title, screen: screen, screens: screens, screenText: text, controls: controls, data: data };
  }

  /* ---------- actions the copilot can take ---------- */
  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim().toLowerCase(); }
  function findClickable(text) {
    var want = norm(text);
    var els = Array.prototype.filter.call(document.querySelectorAll("button, a, [data-act], [role=button], [data-nav], label, summary, .chip, .tab"), visible);
    var score = function (el) {
      var t = norm(el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "");
      if (!t) return 0;
      if (t === want) return 3;
      if (t.indexOf(want) === 0) return 2;
      if (t.indexOf(want) >= 0) return 1;
      return 0;
    };
    var best = null, bs = 0;
    els.forEach(function (el) { var s = score(el); if (s > bs) { bs = s; best = el; } });
    return best;
  }
  function findField(name) {
    var want = norm(name);
    var els = Array.prototype.filter.call(document.querySelectorAll("input:not([type=hidden]), textarea, select"), visible);
    var best = null, bs = 0;
    els.forEach(function (el) {
      var t = norm(labelOf(el)), s = 0;
      if (t === want) s = 3; else if (t.indexOf(want) >= 0) s = 2; else if (want.indexOf(t) >= 0 && t.length > 2) s = 1;
      if (s > bs) { bs = s; best = el; }
    });
    if (!best && !want && els.length === 1) best = els[0];   // only guess when no field name was given
    return best;
  }
  function setValue(el, v) {
    var proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    if (el.tagName === "SELECT") {
      var opt = Array.prototype.find.call(el.options, function (o) { return norm(o.text) === norm(v) || norm(o.value) === norm(v); }) ||
                Array.prototype.find.call(el.options, function (o) { return norm(o.text).indexOf(norm(v)) >= 0; });
      if (opt) v = opt.value;
    }
    setter.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function runAction(a) {
    var d = String(a.do || "").toLowerCase();
    try {
      if (d === "go" || d === "open screen" || d === "screen") {
        if (!H) return "can't switch screens here";
        var want = String(a.screen || a.to || "").toLowerCase().trim();
        var navs = []; document.querySelectorAll("[data-nav]").forEach(function (n) { if (navs.indexOf(n.dataset.nav) < 0) navs.push(n.dataset.nav); });
        var target = navs.indexOf(want) >= 0 ? want : (navs.filter(function (n) { return n.indexOf(want) >= 0 || want.indexOf(n) >= 0; })[0] || want);
        H.go(target); return "opened the " + target + " screen";
      }
      if (d === "click") {
        var el = findClickable(a.text || a.button || "");
        if (!el) return "couldn't find \"" + (a.text || a.button) + "\"";
        el.scrollIntoView({ block: "center" }); el.click(); return "clicked \"" + (el.innerText || a.text).trim().slice(0, 40) + "\"";
      }
      if (d === "type" || d === "fill") {
        var f = findField(a.field || "");
        if (!f) return "couldn't find the field \"" + (a.field || "") + "\"";
        f.focus(); setValue(f, String(a.value == null ? "" : a.value));
        if (a.submit) {
          var opts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true };
          f.dispatchEvent(new KeyboardEvent("keydown", opts));
          f.dispatchEvent(new KeyboardEvent("keyup", opts));
          if (f.form && f.form.requestSubmit) { try { f.form.requestSubmit(); } catch (e) {} }
        }
        return "typed into \"" + (labelOf(f) || a.field) + "\"" + (a.submit ? " and submitted" : "");
      }
      if (d === "check") {
        var c = findField(a.field || "");
        if (!c || c.type !== "checkbox") return "couldn't find the checkbox \"" + (a.field || "") + "\"";
        if (!!c.checked !== !!(a.on !== false)) c.click();
        return (a.on !== false ? "checked" : "unchecked") + " \"" + (a.field || "") + "\"";
      }
      if (d === "read") return "read the screen";
      return "unknown action \"" + d + "\"";
    } catch (e) { return "error: " + e.message; }
  }
  function runActions(list) {
    var results = [];
    var seq = Promise.resolve();
    (Array.isArray(list) ? list : []).slice(0, 8).forEach(function (a) {
      seq = seq.then(function () { results.push(runAction(a)); return wait(450); });
    });
    return seq.then(function () { return wait(400); }).then(function () { return { results: results, context: context() }; });
  }

  /* ---------- "Back to ..." link: return to wherever the app was opened from ---------- */
  var BACK_OK = /^https?:\/\/(www\.)?aiv-x\.com(\/|$)|^https:\/\/domvq\.github\.io\/|^http:\/\/(localhost|127\.0\.0\.1):8000(\/|$)/;
  function backLinks() {
    return Array.prototype.filter.call(document.querySelectorAll("a[href]"), function (a) { return /back to ai ?verse/i.test(a.textContent || ""); });
  }
  function aivxBackUrl() {
    var url = "";
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("from") === "aivx") url = q.get("back") || "https://aiv-x.com/";
      if (!url && document.referrer && BACK_OK.test(document.referrer)) url = document.referrer;
      if (url && BACK_OK.test(url)) sessionStorage.setItem("aivx.back", url);
      else url = sessionStorage.getItem("aivx.back") || "";
    } catch (e) {}
    return url && BACK_OK.test(url) ? url : "";
  }
  function setBackLinks(onClick, href) {
    backLinks().forEach(function (a) {
      a.textContent = "\u2190 Back to AIV X";
      if (href) a.href = href;
      if (onClick) a.addEventListener("click", function (e) { e.preventDefault(); onClick(); });
    });
  }

  /* =====================================================================
     MODE A — running inside AIV X
     ===================================================================== */
  var embedded = window.parent !== window;
  var parentOrigin = "";
  if (embedded) {
    try { if (location.ancestorOrigins && location.ancestorOrigins.length) parentOrigin = location.ancestorOrigins[0]; } catch (e) {}
    if (!parentOrigin && document.referrer) { try { parentOrigin = new URL(document.referrer).origin; } catch (e) {} }
  }
  if (embedded) {
    var reqN = 0, waiting = {};
    var send = function (msg) {
      msg.aivConnect = 1; msg.app = APP_ID;
      if (parentOrigin && AIVX_ORIGINS.indexOf(parentOrigin) >= 0) parent.postMessage(msg, parentOrigin);
      else AIVX_ORIGINS.forEach(function (o) { try { parent.postMessage(msg, o); } catch (e) {} });
    };
    var ask = function (type, extra) {
      return new Promise(function (res, rej) {
        var id = ++reqN; waiting[id] = [res, rej];
        var m = { type: type, id: id }; for (var k in extra) m[k] = extra[k];
        send(m);
        setTimeout(function () { if (waiting[id]) { delete waiting[id]; rej(new Error("timeout")); } }, 15000);
      });
    };
    window.addEventListener("message", function (e) {
      if (AIVX_ORIGINS.indexOf(e.origin) < 0) return;
      parentOrigin = e.origin;
      var d = e.data || {};
      if (!d.aivx) return;
      if (d.type === "reply" && waiting[d.id]) { var w = waiting[d.id]; delete waiting[d.id]; d.error ? w[1](new Error(d.error)) : w[0](d.result); return; }
      if (d.type === "welcome" && OK && d.signedIn) {
        pusher = function () { ask("push", { at: localAt(), data: localData() }).catch(function () {}); };
        reconcile(function () { return ask("pull", {}); }, function (at, data) { return ask("push", { at: at, data: data }); })
          .then(function (r) { send({ type: "synced", result: r }); }).catch(function () {});
      }
      if (d.type === "pulled" && OK && d.remote) { if (d.remote.at > localAt()) applyRemote(d.remote); }
      if (d.type === "context") send({ type: "answer", id: d.id, result: context() });
      if (d.type === "act") runActions(d.actions).then(function (r) { send({ type: "answer", id: d.id, result: r }); });
      if (d.type === "addimage") {
        var A = window.AIV_APP;
        (A && A.addImage ? Promise.resolve().then(function () { return A.addImage(d.src, d.name, d.prompt); }) : Promise.reject(new Error("this app can't take images")))
          .then(function () { send({ type: "answer", id: d.id, result: { ok: true } }); }, function (e) { send({ type: "answer", id: d.id, result: { ok: false, error: String(e && e.message || e) } }); });
      }
    });
    setBackLinks(function () { send({ type: "close" }); });
    send({ type: "hello", v: 1, title: document.title, screens: context().screens });
    window.addEventListener("hashchange", function () { send({ type: "screen", screen: location.hash.replace("#", "") }); });
    return;
  }

  /* =====================================================================
     MODE B — opened directly on aiverse.it.com
     ===================================================================== */
  var backUrl = aivxBackUrl();
  if (backUrl) setBackLinks(null, backUrl);
  if (!OK) return;
  var fbReady = null;
  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (document.querySelector('script[src="' + src + '"]')) return res();
      var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("load " + src)); };
      document.head.appendChild(s);
    });
  }
  function firebaseInit() {
    if (fbReady) return fbReady;
    fbReady = loadScript(FB + "firebase-app-compat.js")
      .then(function () { return Promise.all([loadScript(FB + "firebase-auth-compat.js"), loadScript(FB + "firebase-firestore-compat.js")]); })
      .then(function () {
        var fb = window.firebase;
        var app = (fb.apps && fb.apps.find(function (a) { return a.name === "aivx"; })) || fb.initializeApp(FIREBASE_CONFIG, "aivx");
        return { fb: fb, auth: app.auth(), db: app.firestore() };
      });
    return fbReady;
  }
  var CH = 300000;
  function cloudGet(db, uid) {
    var ref = db.collection("users").doc(uid).collection("apps").doc(APP_ID);
    return ref.get().then(function (m) {
      if (!m.exists) return null;
      var meta = m.data(), ps = [];
      for (var i = 0; i < (meta.n || 0); i++) ps.push(ref.collection("chunks").doc(String(i)).get());
      return Promise.all(ps).then(function (cs) { return { at: meta.at || 0, data: cs.map(function (c) { return c.exists ? c.data().s : ""; }).join("") }; });
    });
  }
  function cloudPut(db, uid, at, data) {
    var ref = db.collection("users").doc(uid).collection("apps").doc(APP_ID);
    var n = Math.max(1, Math.ceil(data.length / CH)), ps = [];
    for (var i = 0; i < n; i++) ps.push(ref.collection("chunks").doc(String(i)).set({ s: data.slice(i * CH, (i + 1) * CH) }));
    return Promise.all(ps).then(function () { return ref.set({ at: at, n: n, size: data.length, app: APP_ID }); });
  }

  /* =====================================================================
     AIV panel — the AIV X assistant inside the app (when opened on aiverse.it.com)
     ===================================================================== */
  var AIV_API_URL = "https://aivx-api.domhasaball.workers.dev";
  var AIVX_APP_KEY = "aivx_iGsNWk4eHXokoW8awHmMVZpm";
  var FREE_DAILY_LIMIT = 20;
  var UPGRADE_URL = "https://aiv-x.com/";
  var TERMS_VERSION = "2026-11-04";
  var TERMS_URL = "https://aiv-x.com/terms.html", PRIVACY_URL = "https://aiv-x.com/privacy.html";
  var AGREE_HTML = '<label class="ag"><input type="checkbox" class="agc"><span>I\'m 18 or older and agree to the <a href="' + TERMS_URL + '" target="_blank" rel="noopener">Terms of Use</a> and <a href="' + PRIVACY_URL + '" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>';
  var APP_NAMES = { aide: "AI Personal Assistant", study: "AI Study and Research", finance: "AI Stock and Finance", fitness: "AI Health and Fitness", photo: "AI Photo", career: "AI Career", music: "AI Music" };
  var STARTERS = {
    aide: ["Add “call the dentist Friday” to my tasks", "What's on my calendar this week?", "Plan my day"],
    study: ["Quiz me on what I'm studying", "Find recent research on my topic", "Make flashcards for this"],
    finance: ["How is my budget looking?", "What's the latest on the market today?", "Explain my portfolio"],
    fitness: ["What's my workout today?", "Log a 30 minute run", "Suggest a high-protein dinner"],
    photo: ["Help me edit this photo", "Make an image for my post", "Ideas for my next photo"],
    career: ["Find jobs that fit my resume", "Improve my resume summary", "Prep me for an interview"],
    music: ["Write a verse for my song", "Give me a chord progression", "Ideas for my next beat"]
  };
  var APP_LABEL = APP_NAMES[APP_ID] || document.title || "this app";
  var DESTRUCTIVE = /\b(delete|remove|clear|reset|erase|wipe|sign ?out|log ?out|disconnect|forget)\b/i;

  function mdLite(t) {
    var h = String(t || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>").replace(/`([^`]+)`/g, "<code>$1</code>");
    var out = [], list = null;
    h.split("\n").forEach(function (line) {
      var m = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.*)$/), hd = line.match(/^#{1,4}\s+(.*)$/);
      if (m) { if (!list) { list = []; } list.push("<li>" + m[1] + "</li>"); return; }
      if (list) { out.push("<ul>" + list.join("") + "</ul>"); list = null; }
      if (hd) out.push("<h4>" + hd[1] + "</h4>"); else if (line.trim()) out.push("<p>" + line + "</p>");
    });
    if (list) out.push("<ul>" + list.join("") + "</ul>");
    return out.join("");
  }
  var BARE_ACTS = /\[\s*\{\s*["']?do["']?\s*:[\s\S]*?\}\s*\]/;
  var JSON_ACTS = /```(?:json|js|javascript)?[ \t]*\n?\s*(\[\s*\{\s*["']?do["']?\s*:[\s\S]*?)(```|$)/;
  function stripActs(t) {
    return String(t || "").replace(/```aiv-actions[\s\S]*?(```|$)/g, "")
      .replace(/```(?:json|js|javascript)?[ \t]*\n?\s*\[\s*\{\s*["']?do["']?\s*:[\s\S]*?(```|$)/g, "")
      .replace(/\[\s*\{\s*["']?do["']?\s*:[\s\S]*?\}\s*\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
  }
  function findActs(t) {
    var m = t.match(/```aiv-actions\s*([\s\S]*?)(```|$)/); if (m) return { raw: m[1], fenced: true };
    m = t.match(JSON_ACTS); if (m) return { raw: m[1] };
    m = t.match(BARE_ACTS); if (m) return { raw: m[0] };
    return null;
  }
  function parseActs(raw) {
    var s = String(raw || "").replace(/```[a-z-]*/gi, "").trim().replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    var fixes = [function (t) { return t; }, function (t) { return t.replace(/,\s*([\]}])/g, "$1"); },
      function (t) { return t.replace(/,\s*([\]}])/g, "$1").replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":'); },
      function (t) { return t.replace(/}\s*{/g, "},{").replace(/,\s*([\]}])/g, "$1"); }];
    var tries = [], a = s.indexOf("["), b = s.lastIndexOf("]"), c = s.indexOf("{"), d = s.lastIndexOf("}");
    if (a >= 0 && b > a) tries.push(s.slice(a, b + 1));
    if (c >= 0 && d > c) tries.push("[" + s.slice(c, d + 1) + "]");
    for (var i = 0; i < tries.length; i++) for (var j = 0; j < fixes.length; j++) {
      try { var v = JSON.parse(fixes[j](tries[i])); var l = (Array.isArray(v) ? v : [v]).filter(function (x) { return x && x.do; }); if (l.length) return l; } catch (e) {}
    }
    return null;
  }
  function api(path, body, proKey) {
    body = Object.assign({ appKey: AIVX_APP_KEY, train: !(P.profile && P.profile.settings && P.profile.settings.improve === false) }, proKey ? { key: proKey } : {}, body);
    return fetch(AIV_API_URL + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || ("Request failed (" + r.status + ")")); return d; }); });
  }

  var P = { open: false, busy: false, ctx: null, user: null, profile: null, pro: false, history: [], host: null, root: null };
  function today() { return new Date().toISOString().slice(0, 10); }

  function buildPanel() {
    var host = document.createElement("div");
    host.id = "aivx-panel-host";
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    root.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      '*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif}' +
      '.fab{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:8px;height:44px;padding:0 16px;border-radius:999px;background:#0a0a0b;color:#fff;border:0;font:600 14px/1 system-ui;letter-spacing:.06em;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}' +
      '.fab i{width:7px;height:7px;border-radius:50%;background:#22c55e;display:none}.fab.synced i{display:inline-block}' +
      '.pn{position:fixed;top:0;right:0;bottom:0;width:400px;max-width:100vw;z-index:2147483001;background:#fff;color:#18181b;border-left:1px solid #e4e4e7;box-shadow:-10px 0 30px rgba(0,0,0,.12);display:none;flex-direction:column;font-size:14.5px;line-height:1.5}' +
      '.pn.on{display:flex}' +
      '.hd{display:flex;align-items:center;gap:8px;padding:12px 12px 12px 16px;border-bottom:1px solid #e4e4e7}' +
      '.hd b{font-size:15px;letter-spacing:.04em}.hd span{font-size:12px;color:#71717a;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.ib{width:32px;height:32px;border-radius:9px;border:0;background:none;color:#52525b;cursor:pointer;font-size:18px;line-height:1}.ib:hover{background:#f4f4f5}' +
      '.ms{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px}' +
      '.u{align-self:flex-end;background:#f1f1f3;padding:8px 12px;border-radius:14px;max-width:88%;white-space:pre-wrap;word-wrap:break-word}' +
      '.a p,.a ul,.a h4{margin:0 0 8px}.a ul{padding-left:18px}.a h4{font-size:14px}.a a{color:#2563eb}.a code{background:#f4f4f5;padding:1px 4px;border-radius:4px;font-size:13px}' +
      '.st{border:1px solid #e4e4e7;border-radius:10px;padding:7px 10px;margin-bottom:8px;font-size:12.5px;color:#52525b}.st div{padding:1px 0}.st em{color:#16a34a;font-style:normal;margin-right:6px}' +
      '.src{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.src a{font-size:12px;border:1px solid #e4e4e7;border-radius:999px;padding:3px 9px;color:#52525b;text-decoration:none;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.th{color:#71717a;font-size:13.5px}.er{color:#dc2626;font-size:13px}' +
      '.ch{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 8px}.ch button{border:1px solid #e4e4e7;background:#fff;color:#3f3f46;border-radius:999px;padding:6px 11px;font-size:12.5px;cursor:pointer}.ch button:hover{background:#f4f4f5}' +
      '.cp{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid #f1f1f3}' +
      '.cp textarea{flex:1;border:1px solid #d4d4d8;border-radius:16px;padding:10px 12px;resize:none;height:44px;max-height:140px;font-size:16px;outline:none;color:#18181b;background:#fff}' +
      '.cp button{border:0;border-radius:999px;background:#0a0a0b;color:#fff;padding:0 16px;font-weight:600;cursor:pointer}.cp button:disabled{opacity:.35;cursor:not-allowed}' +
      '.ft{font-size:11px;color:#a1a1aa;text-align:center;padding:0 0 8px}' +
      '.si{padding:22px 16px}.si h3{font-size:18px;margin-bottom:6px}.si p{font-size:13px;color:#71717a;margin-bottom:14px}' +
      '.si button,.si input{width:100%;font-size:16px;padding:10px 12px;border-radius:11px;border:1px solid #d4d4d8;background:#fff;color:#18181b;margin-bottom:8px;cursor:pointer}' +
      '.si input{cursor:text}.si .pr{background:#0a0a0b;color:#fff;border-color:#0a0a0b}.si .lk{border:0;background:none;color:#2563eb;padding:4px;width:auto}.si .or{text-align:center;color:#a1a1aa;font-size:12px;margin:4px 0 10px}' +
      '.ag{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:#52525b;margin:6px 0 12px;cursor:pointer;line-height:1.4}.ag input{width:16px!important;height:16px;margin:1px 0 0!important;padding:0!important;flex:none}.ag a{color:#2563eb}.ag.need{outline:1px solid #dc2626;border-radius:6px;padding:4px}' +
      '.lim{margin:0 16px 10px;padding:10px 12px;border-radius:10px;background:#fef3c7;color:#7c4a03;font-size:13px}.lim a{color:#7c4a03;font-weight:600}' +
      '@media (prefers-color-scheme: dark){.pn{background:#0f0f11;color:#f4f4f5;border-color:#26262b}.hd{border-color:#26262b}.u{background:#1f1f23}.st,.src a,.ch button{border-color:#2a2a30;color:#c4c4c8;background:transparent}.cp{border-color:#1f1f23}.cp textarea,.si input,.si button{background:#141416;color:#f4f4f5;border-color:#2a2a30}.cp button,.si .pr{background:#f4f4f5;color:#0a0a0b}.ib{color:#c4c4c8}.ib:hover{background:#1b1b1f}.a code{background:#1b1b1f}.lim{background:#3a2a07;color:#fcd98a}.lim a{color:#fcd98a}.ag{color:#c4c4c8}.ag a{color:#93c5fd}}' +
      '@media (max-width:820px){.fab{bottom:84px}.pn{width:100vw;border-left:0}}' +
      '</style>' +
      '<button class="fab" part="fab" title="Ask AIV"><i></i>AIV</button>' +
      '<section class="pn" role="dialog" aria-label="AIV assistant">' +
      '  <div class="hd"><b>AIV</b><span class="sub"></span><button class="ib nw" title="New chat">&#9998;</button><button class="ib x" title="Close">&times;</button></div>' +
      '  <div class="body" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' +
      '</section>';
    P.host = host; P.root = root;
    root.querySelector(".fab").onclick = function () { togglePanel(true); };
    root.querySelector(".x").onclick = function () { togglePanel(false); };
    root.querySelector(".nw").onclick = function () { P.history = []; renderChat(); };
  }
  function $p(sel) { return P.root.querySelector(sel); }
  function togglePanel(on) {
    P.open = on;
    $p(".pn").classList.toggle("on", on);
    $p(".fab").style.display = on ? "none" : "flex";
    if (on) render();
  }
  function setSynced(on, email) {
    $p(".fab").classList.toggle("synced", !!on);
    $p(".fab").title = on ? "Ask AIV — synced with " + (email || "AIV X") : "Ask AIV";
    $p(".sub").textContent = on ? "in " + APP_LABEL + " · synced" : "in " + APP_LABEL;
  }
  function needsConsent() { return P.user && P.profile && !(P.profile.consent && P.profile.consent.version === TERMS_VERSION); }
  function render() { if (!P.user) renderSignIn(); else if (needsConsent()) renderConsent(); else renderChat(); }
  function renderConsent() {
    var b = $p(".body");
    b.innerHTML = '<div class="si"><h3>One quick step</h3><p>To use AIV, please review and agree to the AIV X Terms of Use and Privacy Policy.</p>' + AGREE_HTML + '<button class="pr ok" disabled>Agree and continue</button></div>';
    var c = b.querySelector(".agc"), ok = b.querySelector(".ok");
    c.onchange = function () { ok.disabled = !c.checked; };
    ok.onclick = function () { recordConsent().then(render); };
  }
  function recordConsent() {
    P.profile.consent = { version: TERMS_VERSION, at: Date.now(), age18: true, from: "aiv-panel" };
    return P.ctx.db.collection("users").doc(P.user.uid).set({ consent: P.profile.consent }, { merge: true }).catch(function () {});
  }

  function renderSignIn() {
    var b = $p(".body"), mode = "in";
    b.innerHTML = '<div class="si"><h3>Sign in to use AIV</h3><p>Use your AIV X account. AIV can see ' + APP_LABEL + ', search the web, and do things here for you — and your data syncs with AIV X.</p>' +
      '<button class="g">Continue with Google</button><div class="or">or</div>' +
      '<input class="em" type="email" placeholder="Email" autocomplete="email"><input class="pw" type="password" placeholder="Password" autocomplete="current-password">' +
      '<button class="pr go">Sign in</button>' + AGREE_HTML + '<div class="er"></div><button class="lk sw">New to AIV X? Create an account</button></div>';
    var err = function (e) { b.querySelector(".er").textContent = (e && e.code ? e.code.replace("auth/", "").replace(/-/g, " ") : (e && e.message) || "Something went wrong"); };
    b.querySelector(".sw").onclick = function () { mode = mode === "in" ? "up" : "in"; b.querySelector(".go").textContent = mode === "in" ? "Sign in" : "Create account"; b.querySelector(".sw").textContent = mode === "in" ? "New to AIV X? Create an account" : "Have an account? Sign in"; };
    if (!P.ctx) { b.querySelector(".er").textContent = "Connecting…"; return; }
    var agreeOk = function () {
      var c = b.querySelector(".agc");
      if (c.checked) { P.agreedNow = true; return true; }
      b.querySelector(".ag").classList.add("need");
      b.querySelector(".er").textContent = "Please confirm you're 18 or older and agree to the Terms of Use and Privacy Policy.";
      return false;
    };
    b.querySelector(".g").onclick = function () { if (agreeOk()) P.ctx.auth.signInWithPopup(new P.ctx.fb.auth.GoogleAuthProvider()).catch(err); };
    b.querySelector(".go").onclick = function () {
      if (!agreeOk()) return;
      var em = b.querySelector(".em").value.trim(), pw = b.querySelector(".pw").value;
      (mode === "in" ? P.ctx.auth.signInWithEmailAndPassword(em, pw) : P.ctx.auth.createUserWithEmailAndPassword(em, pw)).catch(err);
    };
  }

  function renderChat() {
    var b = $p(".body");
    b.innerHTML = '<div class="ms"></div><div class="ch"></div><div class="lim" hidden></div><div class="cp"><textarea placeholder="Ask AIV to do something in ' + APP_LABEL + '"></textarea><button>Send</button></div><div class="ft">AIV can make mistakes. Check important info. · <a href="#" class="so" style="color:inherit">Sign out</a></div>';
    var ms = b.querySelector(".ms");
    if (!P.history.length) {
      var name = P.profile && P.profile.name ? ", " + String(P.profile.name).split(" ")[0] : "";
      addBubble("a", "<p>Hi" + mdLite(name).replace(/<\/?p>/g, "") + ". I'm AIV. I can see " + APP_LABEL + " and work in it for you — add things, find things, switch screens — and I can search the web.</p>");
      b.querySelector(".ch").innerHTML = (STARTERS[APP_ID] || ["What can you do here?", "Summarize what's on my screen"]).map(function (s) { return "<button>" + s.replace(/</g, "&lt;") + "</button>"; }).join("");
      b.querySelectorAll(".ch button").forEach(function (x) { x.onclick = function () { send(x.textContent); }; });
    } else {
      P.history.slice(-20).forEach(function (m) { addBubble(m.role === "user" ? "u" : "a", m.role === "user" ? m.content : mdLite(m.content)); });
    }
    b.querySelector(".so").onclick = function (e) { e.preventDefault(); if (confirm("Sign out of AIV in this app? Your data stays in your account.")) P.ctx.auth.signOut(); };
    var ta = b.querySelector("textarea");
    ta.onkeydown = function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(ta.value); } };
    b.querySelector(".cp button").onclick = function () { send(ta.value); };
    setTimeout(function () { ta.focus(); }, 50);
    ms.scrollTop = ms.scrollHeight;
  }
  function addBubble(cls, html) {
    var ms = $p(".ms"); if (!ms) return null;
    var d = document.createElement("div"); d.className = cls;
    if (cls === "u") d.textContent = html; else d.innerHTML = html;
    ms.appendChild(d); ms.scrollTop = ms.scrollHeight; return d;
  }
  function drawAI(el, steps, text, srcs, status) {
    el.innerHTML = (steps.length ? '<div class="st">' + steps.map(function (s) { return "<div><em>&#10003;</em>" + s.replace(/</g, "&lt;") + "</div>"; }).join("") + "</div>" : "") +
      (text ? mdLite(text) : status ? '<div class="th">' + status + "</div>" : "") +
      (srcs.length && !status ? '<div class="src">' + srcs.map(function (s, i) { return '<a href="' + String(s.url).replace(/"/g, "&quot;") + '" target="_blank" rel="noopener">[' + (i + 1) + "] " + String(s.title || s.url).replace(/</g, "&lt;") + "</a>"; }).join("") + "</div>" : "");
    var ms = $p(".ms"); if (ms) ms.scrollTop = ms.scrollHeight;
  }
  function usageCount() { var u = (P.profile && P.profile.usage) || {}; return u.date === today() ? (u.count || 0) : 0; }
  function bump() {
    if (P.pro || !P.user) return;
    P.profile.usage = { date: today(), count: usageCount() + 1 };
    P.ctx.db.collection("users").doc(P.user.uid).set({ usage: P.profile.usage }, { merge: true }).catch(function () {});
  }
  function showLimit() {
    var l = $p(".lim"); if (!l) return;
    l.hidden = false;
    l.innerHTML = "You've used today's " + FREE_DAILY_LIMIT + ' free messages. <a href="' + UPGRADE_URL + '" target="_blank" rel="noopener">Get AIV Pro</a> for unlimited use.';
  }
  function systemFor(c) {
    var mems = P.profile && (!P.profile.settings || P.profile.settings.memoryOn !== false) && Array.isArray(P.profile.memories) ? P.profile.memories.slice(-40).map(function (m) { return "- " + m.text; }).join("\n") : "";
    var ctrls = (c.controls || []).map(function (x) { return x.button ? "[" + x.button + "]" : "{" + x.field + (x.type && x.type !== "text" ? " (" + x.type + ")" : "") + (x.value !== "" && x.value !== undefined && x.value !== false ? ": " + x.value : "") + "}"; }).join(" ");
    return "You are AIV, the assistant from AIV X by AI Verse, working inside the user's " + APP_LABEL + " app. You work like a capable assistant: figure out what the request needs, use tools yourself, look at the results, and keep going until the job is done. Be concise — you're in a side panel. Use Markdown. No emojis.\n" +
      "Today is " + new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + "." +
      (P.profile && P.profile.name ? " The user's name is " + P.profile.name + "." : "") +
      (mems ? "\n\nWHAT YOU KNOW ABOUT THE USER (use only when helpful):\n" + mems : "") +
      "\n\nAPP ON SCREEN — " + APP_LABEL + ". Current screen: " + c.screen + ". Screens: " + (c.screens || []).join(", ") + ".\nVisible text:\n" + String(c.screenText || "").slice(0, 6000) +
      "\n\nControls on this screen (buttons in [ ], fields in { }): " + ctrls.slice(0, 3500) +
      "\n\nSaved app data (JSON): " + String(c.data || "").slice(0, 9000) +
      "\n\nTOOLS — to use them, end your reply with ONE fenced block:\n```aiv-actions\n[{\"do\":\"go\",\"screen\":\"tasks\"}]\n```\n" +
      "- search {q}: search the web for anything current or that you're not sure of\n- read {url}: read a web page\n" +
      "- go {screen} · click {text exactly as shown} · type {field, value, submit} · check {field, on} · look {} (look at the screen again)\n" +
      "Rules: if the screen or saved data already answers the question, just answer. Greetings, small talk, and thanks never need tools. Only use the tools listed here, and only inside the fenced aiv-actions block, never as plain text. Before the block, say in a few words what you're doing. After tools run you'll get results and the updated screen; then continue or confirm briefly. Cite web sources as [1], [2]. Many apps have a main \"Ask\" box that understands plain requests. Never delete, clear, reset, or sign out unless the user explicitly asked. For health, legal, or money questions, give helpful general information and suggest a professional when it really matters.";
  }
  function send(text) {
    text = String(text || "").trim();
    if (!text || P.busy || !P.user) return;
    if (!P.pro && usageCount() >= FREE_DAILY_LIMIT) { showLimit(); return; }
    P.busy = true;
    var ta = $p(".cp textarea"), btn = $p(".cp button");
    if (ta) ta.value = ""; if (btn) btn.disabled = true;
    var chips = $p(".ch"); if (chips) chips.innerHTML = "";
    addBubble("u", text);
    P.history.push({ role: "user", content: text });
    var el = addBubble("a", ""), steps = [], srcs = [], shown = "";
    var msgs = [{ role: "system", content: "" }].concat(P.history.slice(-12).map(function (m) { return { role: m.role, content: m.content }; }));
    bump();
    var step = 0, retried = false, retriedEmpty = false, changed = false;
    function loop() {
      drawAI(el, steps, shown, srcs, step ? "Working…" : "Thinking…");
      msgs[0] = { role: "system", content: systemFor(context()) };
      return api("/chat", { messages: msgs, model: "aiv-1", max_tokens: 2000 }, P.pro ? P.profile.proKey : null).then(function (d) {
        var reply = String(d.reply || "");
        var vis = stripActs(reply);
        if (vis) shown = shown ? shown + "\n\n" + vis : vis;
        var found = findActs(reply);
        if (!found && !vis.trim() && !retriedEmpty) {
          // the AI sent back nothing: ask once more instead of showing "Done."
          retriedEmpty = true; step++;
          if (reply.trim()) msgs.push({ role: "assistant", content: reply.slice(0, 4000) });
          msgs.push({ role: "user", content: "(Your last reply came through empty. Answer my message now in plain words" + (steps.length ? ", using the tool results above" : "") + ".)" });
          return loop();
        }
        if (!found || step >= 5) return finish();
        var acts = parseActs(found.raw);
        if (!acts && !found.fenced && shown) return finish();
        if (!acts) {
          if (retried) return finish();
          retried = true; step++;
          msgs.push({ role: "assistant", content: reply.slice(0, 4000) }, { role: "user", content: 'Your aiv-actions block was not valid JSON. Send it again as a JSON array with double quotes, e.g. [{"do":"go","screen":"home"}].' });
          return loop();
        }
        var results = [], appActs = [];
        var chain = Promise.resolve();
        acts.slice(0, 8).forEach(function (a) {
          var k = String(a.do || "").toLowerCase();
          chain = chain.then(function () {
            if (k === "search") {
              return api("/search", { q: String(a.q || "").slice(0, 300) }, P.pro ? P.profile.proKey : null).then(function (r) {
                var res = (r.results || []).slice(0, 6);
                steps.push("Searched the web for “" + a.q + "”");
                results.push(res.length ? res.map(function (x) { srcs.push(x); return "[" + srcs.length + "] " + x.title + " — " + x.url + "\n" + (x.snippet || ""); }).join("\n") : "No results.");
              }).catch(function (e) { steps.push("Search didn't work"); results.push("Search error: " + e.message); });
            }
            if (k === "read" && a.url) {
              return api("/fetch", { url: String(a.url) }, P.pro ? P.profile.proKey : null).then(function (r) {
                srcs.push({ title: r.title || a.url, url: a.url }); steps.push("Read " + (r.title || a.url));
                results.push("[" + srcs.length + "] " + r.title + " — " + a.url + "\n" + String(r.text || "").slice(0, 6000));
              }).catch(function (e) { steps.push("Couldn't read that page"); results.push("Read error: " + e.message); });
            }
            if (k === "look" || k === "read") { results.push("looked at the screen"); return; }
            if (["go", "click", "type", "fill", "check"].indexOf(k) < 0) { results.push("\"" + a.do + "\" isn't one of your tools. Answer the user directly in plain words."); return; }
            if (k === "click" && DESTRUCTIVE.test(String(a.text || "")) && !DESTRUCTIVE.test(text)) { steps.push("Skipped “" + a.text + "” — ask me directly if you want that"); results.push("skipped " + a.text + ": the user didn't ask for that"); return; }
            changed = true;
            return runActions([a]).then(function (r) { (r.results || []).forEach(function (x) { steps.push(x.charAt(0).toUpperCase() + x.slice(1)); results.push(x); }); });
          });
        });
        return chain.then(function () {
          step++;
          msgs.push({ role: "assistant", content: reply.slice(0, 4000) });
          msgs.push({ role: "user", content: ("[Tool results]\n- " + results.join("\n- ")).slice(0, 20000) + "\n\nThe app's updated screen is in the system message. If the task is done, answer briefly (no tools block). If more steps are needed, use another tools block." });
          return loop();
        });
      });
    }
    function finish() {
      if (!shown) {
        if (changed && steps.length) shown = "Here's what I did:\n" + steps.map(function (s) { return "- " + s; }).join("\n");
        else if (steps.length) shown = "I looked into it, but I couldn't put an answer together that time. Please ask again.";
        else throw new Error("AIV didn't get an answer back that time. Please ask again.");
      }
      drawAI(el, steps, shown, srcs, "");
      P.history.push({ role: "assistant", content: shown + (steps.length ? "\n(Did: " + steps.join("; ") + ")" : "") });
      P.history = P.history.slice(-30);
    }
    loop().catch(function (e) {
      drawAI(el, steps, shown, srcs, "");
      el.insertAdjacentHTML("beforeend", '<div class="er">' + String(e.message || "Something went wrong").replace(/</g, "&lt;") + "</div>");
      P.history.pop();
      if (!P.pro && P.profile && P.profile.usage) { P.profile.usage.count = Math.max(0, usageCount() - 1); P.ctx.db.collection("users").doc(P.user.uid).set({ usage: P.profile.usage }, { merge: true }).catch(function () {}); }
    }).then(function () {
      P.busy = false; var bt = $p(".cp button"); if (bt) bt.disabled = false;
    });
  }
  function loadProfile(u) {
    return P.ctx.db.collection("users").doc(u.uid).get().then(function (d) {
      P.profile = d.exists ? d.data() : { name: u.displayName || "", usage: { date: today(), count: 0 } };
      if (P.profile.proKey) {
        return api("/verify", { key: P.profile.proKey }).then(function (r) { P.pro = !!r.valid; }).catch(function () { P.pro = false; });
      }
      P.pro = false;
    }).catch(function () { P.profile = { usage: { date: today(), count: 0 } }; });
  }

  function startStandalone() {
    buildPanel(); setSynced(false);
    var watching = false;
    firebaseInit().then(function (ctx) {
      P.ctx = ctx; if (P.open) render();
      ctx.auth.onAuthStateChanged(function (u) {
        P.user = u || null;
        if (!u) { pusher = null; P.profile = null; P.pro = false; setSynced(false); if (P.open) render(); return; }
        loadProfile(u).then(function () {
          if (needsConsent() && P.agreedNow) return recordConsent();
        }).then(function () { if (P.open) render(); });
        pusher = function () { var at = localAt(); cloudPut(ctx.db, u.uid, at, localData()).catch(function () {}); };
        reconcile(function () { return cloudGet(ctx.db, u.uid); }, function (at, data) { return cloudPut(ctx.db, u.uid, at, data); })
          .then(function () { setSynced(true, u.email); })
          .catch(function (e) { setSynced(true, u.email); try { console.warn("[AIV Connect] sync failed", e); } catch (x) {} });
        if (!watching) {
          watching = true;
          // pick up changes made elsewhere when the person comes back to this tab
          document.addEventListener("visibilitychange", function () {
            if (document.visibilityState !== "visible" || !ctx.auth.currentUser) return;
            cloudGet(ctx.db, ctx.auth.currentUser.uid).then(function (r) { if (r && r.at > localAt()) applyRemote(r); }).catch(function () {});
          });
        }
      });
    }).catch(function () { P.ctxError = true; });
  }
  window.AIV_PANEL = { open: function () { togglePanel(true); }, close: function () { togglePanel(false); } };
  if (document.readyState === "complete") setTimeout(startStandalone, 600);
  else window.addEventListener("load", function () { setTimeout(startStandalone, 600); });
})();
