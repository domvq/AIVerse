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
    "aide": "aide", "study-and-research-ai": "study", "stock-and-finance-ai": "finance",
    "health-and-fitness-ai": "fitness", "photo-ai": "photo", "career-ai": "career"
  };
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

  /* --- small sync pill + sign-in sheet --- */
  var css = document.createElement("style");
  css.textContent =
    "#aivsync{position:fixed;right:16px;bottom:16px;z-index:9999;font:500 13px/1 system-ui,-apple-system,Segoe UI,sans-serif;background:#0a0a0b;color:#fff;border:0;border-radius:999px;padding:10px 14px;box-shadow:0 6px 20px rgba(0,0,0,.18);cursor:pointer;display:flex;align-items:center;gap:8px}" +
    "#aivsync.done{background:#fff;color:#18181b;border:1px solid #e4e4e7;opacity:.85;padding:8px 12px}" +
    "#aivsync i{width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block}" +
    "@media(max-width:820px){#aivsync{bottom:84px}}" +
    "#aivsheet{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}" +
    "#aivsheet .b{background:#fff;color:#18181b;border-radius:18px;padding:24px;width:100%;max-width:360px}" +
    "#aivsheet h3{font-size:19px;margin:0 0 4px}#aivsheet p{font-size:13px;color:#71717a;margin:0 0 16px}" +
    "#aivsheet button,#aivsheet input{width:100%;box-sizing:border-box;font:inherit;font-size:14px;padding:11px 14px;border-radius:12px;border:1px solid #d4d4d8;background:#fff;color:#18181b;margin-bottom:8px}" +
    "#aivsheet button.p{background:#0a0a0b;color:#fff;border-color:#0a0a0b;cursor:pointer}#aivsheet button{cursor:pointer}" +
    "#aivsheet .e{color:#dc2626;font-size:13px;min-height:18px}#aivsheet .l{background:none;border:0;color:#2563eb;padding:4px;width:auto;margin:0}" +
    "#aivsheet .or{text-align:center;color:#a1a1aa;font-size:12px;margin:6px 0 10px}";
  document.head.appendChild(css);
  var pill = document.createElement("button");
  pill.id = "aivsync"; pill.type = "button"; pill.textContent = "Sync with AIV X"; pill.title = "Keep this app's data in your AIV X account";
  pill.style.display = "none";
  document.body.appendChild(pill);

  function setPill(state, email) {
    pill.style.display = "flex";
    if (state === "in") { pill.className = "done"; pill.innerHTML = "<i></i>Synced with AIV X"; pill.title = "Signed in as " + (email || "") + ". Click to sign out."; }
    else if (state === "busy") { pill.className = "done"; pill.textContent = "Syncing…"; }
    else { pill.className = ""; pill.textContent = "Sync with AIV X"; pill.title = "Keep this app's data in your AIV X account"; }
  }
  function openSheet(ctx) {
    var mode = "in";
    var el = document.createElement("div"); el.id = "aivsheet";
    el.innerHTML = '<div class="b"><h3>Sync with AIV X</h3><p>Sign in with your AIV X account to keep this app\'s data the same here and inside AIV X, on any device.</p>' +
      '<button class="g" type="button">Continue with Google</button><div class="or">or</div>' +
      '<input class="em" type="email" placeholder="Email" autocomplete="email"><input class="pw" type="password" placeholder="Password" autocomplete="current-password">' +
      '<button class="p go" type="button">Sign in</button><div class="e"></div>' +
      '<button class="l sw" type="button">New to AIV X? Create an account</button> <button class="l x" type="button">Not now</button></div>';
    document.body.appendChild(el);
    var err = function (e) { el.querySelector(".e").textContent = (e && (e.code || "").replace("auth/", "").replace(/-/g, " ")) || (e && e.message) || "Something went wrong"; };
    el.addEventListener("click", function (e) { if (e.target === el) el.remove(); });
    el.querySelector(".x").onclick = function () { el.remove(); };
    el.querySelector(".sw").onclick = function () {
      mode = mode === "in" ? "up" : "in";
      el.querySelector(".go").textContent = mode === "in" ? "Sign in" : "Create account";
      el.querySelector(".sw").textContent = mode === "in" ? "New to AIV X? Create an account" : "Have an account? Sign in";
    };
    el.querySelector(".g").onclick = function () {
      ctx.auth.signInWithPopup(new ctx.fb.auth.GoogleAuthProvider()).then(function () { el.remove(); }).catch(err);
    };
    el.querySelector(".go").onclick = function () {
      var em = el.querySelector(".em").value.trim(), pw = el.querySelector(".pw").value;
      var p = mode === "in" ? ctx.auth.signInWithEmailAndPassword(em, pw) : ctx.auth.createUserWithEmailAndPassword(em, pw);
      p.then(function () { el.remove(); }).catch(err);
    };
  }

  function startStandalone() {
    firebaseInit().then(function (ctx) {
      pill.onclick = function () {
        var u = ctx.auth.currentUser;
        if (u) { if (confirm("Stop syncing this app with " + (u.email || "your AIV X account") + "?")) ctx.auth.signOut(); }
        else openSheet(ctx);
      };
      ctx.auth.onAuthStateChanged(function (u) {
        if (!u) { pusher = null; setPill("out"); return; }
        setPill("busy");
        pusher = function () { var at = localAt(); cloudPut(ctx.db, u.uid, at, localData()).catch(function () {}); };
        reconcile(function () { return cloudGet(ctx.db, u.uid); }, function (at, data) { return cloudPut(ctx.db, u.uid, at, data); })
          .then(function () { setPill("in", u.email); })
          .catch(function (e) { setPill("in", u.email); try { console.warn("[AIV Connect] sync failed", e); } catch (x) {} });
        // pick up changes made elsewhere when the person comes back to this tab
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState !== "visible" || !ctx.auth.currentUser) return;
          cloudGet(ctx.db, u.uid).then(function (r) { if (r && r.at > localAt()) applyRemote(r); }).catch(function () {});
        });
      });
    }).catch(function () { /* offline or blocked: the app keeps working locally */ });
  }
  if (document.readyState === "complete") setTimeout(startStandalone, 800);
  else window.addEventListener("load", function () { setTimeout(startStandalone, 800); });
})();
