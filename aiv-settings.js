/* =====================================================================
   AIV Settings — one Settings screen for every AI Verse app
   Adds Account, Appearance, Chat & AI, Notifications, Privacy and About
   to the top of each app's own Settings view (#v-settings). The app's own
   settings stay below under "App settings".
   Account, appearance and chat choices are shared by all AI Verse apps on
   this device (localStorage "aiv.prefs.v1").
   ===================================================================== */
(function () {
  "use strict";
  var PK = "aiv.prefs.v1", VERSION = "2026.11.27";
  var DEF = { name: "", callMe: "", email: "", photo: "", theme: "auto", textSize: "m", reduceMotion: false,
    length: "balanced", tone: "friendly", lang: "auto", custom: "" };
  function load() { var p = {}; try { p = JSON.parse(localStorage.getItem(PK) || "{}") || {}; } catch (e) {} var o = {}; for (var k in DEF) o[k] = k in p ? p[k] : DEF[k]; return o; }
  var P = load();
  function save() { try { localStorage.setItem(PK, JSON.stringify(P)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var base = /\/apps\//.test(location.pathname) ? "../" : "";
  var embedded = window.parent !== window;

  /* ---------- look ---------- */
  var css = "" +
    "html.aivs-ts-s .view:not(#v-edit):not(#v-video){zoom:.92}html.aivs-ts-l .view:not(#v-edit):not(#v-video){zoom:1.1}html.aivs-ts-xl .view:not(#v-edit):not(#v-video){zoom:1.22}" +
    "html.aivs-rm *,html.aivs-rm *::before,html.aivs-rm *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}" +
    ".aivs{--s-box:var(--box,var(--panel,#fff));--s-soft:var(--card,var(--panel2,#f4f4f5));color:var(--ink,#111);margin:6px 0 18px}" +
    ".aivs *{box-sizing:border-box}" +
    ".aivs-jump{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0 12px;-webkit-overflow-scrolling:touch}.aivs-jump::-webkit-scrollbar{display:none}" +
    ".aivs-jump button{flex:none;border:1px solid var(--line,#e6e6e9);background:var(--s-box);color:var(--ink,#111);border-radius:999px;padding:7px 13px;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}" +
    ".aivs-jump button:hover{background:var(--s-soft)}" +
    ".aivs-card{background:var(--s-box);border:1px solid var(--line,#e6e6e9);border-radius:14px;padding:16px 16px 14px;margin:0 0 12px;scroll-margin-top:12px}" +
    ".aivs-card h3{margin:0 0 2px;font-size:16px}.aivs-sub{margin:0 0 12px;color:var(--muted,#6b6d72);font-size:13px;line-height:1.45}" +
    ".aivs-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 0;border-top:1px solid var(--line,#e6e6e9)}" +
    ".aivs-row:first-of-type{border-top:0}.aivs-row>div:first-child{min-width:0}" +
    ".aivs-row b{display:block;font-size:14px;font-weight:600}.aivs-row small{display:block;color:var(--muted,#6b6d72);font-size:12.5px;margin-top:2px;line-height:1.4}" +
    ".aivs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:4px 0 6px}" +
    ".aivs label.aivs-f{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600;color:var(--ink,#111);margin:0}" +
    ".aivs input[type=text],.aivs input[type=email],.aivs select,.aivs textarea{width:100%;font:inherit;font-size:14px;font-weight:400;color:var(--ink,#111);background:var(--s-soft);border:1px solid var(--line,#e6e6e9);border-radius:10px;padding:10px 12px;outline:none}" +
    ".aivs input:focus,.aivs select:focus,.aivs textarea:focus{border-color:var(--ink,#111)}" +
    ".aivs textarea{resize:vertical;min-height:74px;line-height:1.45}" +
    ".aivs-seg{display:inline-flex;flex-wrap:wrap;background:var(--s-soft);border:1px solid var(--line,#e6e6e9);border-radius:10px;padding:3px;gap:2px;flex:none}" +
    ".aivs-seg button{border:0;background:transparent;color:var(--muted,#6b6d72);font:inherit;font-size:13px;padding:6px 11px;border-radius:7px;cursor:pointer}" +
    ".aivs-seg button[aria-pressed=true]{background:var(--ink,#111);color:var(--bg,#fff);font-weight:600}" +
    ".aivs-tg{position:relative;flex:none;width:44px;height:26px;border-radius:999px;border:0;background:var(--line,#d4d4d8);cursor:pointer;padding:0}" +
    ".aivs-tg::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .15s}" +
    ".aivs-tg[aria-checked=true]{background:var(--ink,#111)}.aivs-tg[aria-checked=true]::after{left:21px;background:var(--bg,#fff)}" +
    ".aivs-btn{flex:none;border:1px solid var(--line,#e6e6e9);background:var(--s-box);color:var(--ink,#111);font:inherit;font-size:13px;font-weight:600;padding:8px 13px;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}" +
    ".aivs-btn:hover{background:var(--s-soft)}.aivs-btn.pri{background:var(--ink,#111);color:var(--bg,#fff);border-color:var(--ink,#111)}.aivs-btn.bad{color:var(--bad,#b91c1c)}" +
    ".aivs-acct{display:flex;align-items:center;gap:14px;margin:2px 0 12px}" +
    ".aivs-av{width:60px;height:60px;border-radius:50%;flex:none;background:var(--ink,#111);color:var(--bg,#fff);display:grid;place-items:center;font-size:24px;font-weight:700;overflow:hidden}" +
    ".aivs-av img{width:100%;height:100%;object-fit:cover}.aivs-acct .aivs-btns{display:flex;flex-wrap:wrap;gap:6px}" +
    ".aivs-h{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#6b6d72);margin:22px 0 10px}" +
    ".aivs-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}" +
    ".aivs-toast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));transform:translateX(-50%);background:var(--ink,#111);color:var(--bg,#fff);font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;z-index:99999;opacity:0;transition:opacity .2s;pointer-events:none}" +
    ".aivs-toast.on{opacity:1}" +
    "#btnSettings .aivs-gi{display:inline-grid;place-items:center}#btnSettings .aivs-gi svg{width:20px;height:20px}#btnSettings .aivs-gl{display:none}" +
    "" +
    ".aivm-ask.aivs-hasgear::before{right:62px!important}#aivmAsk #aivsGear{display:grid;place-items:center;flex:none;width:40px;height:40px;min-height:0;border-radius:50%;border:1px solid var(--line,#ececee);background:var(--box,var(--bg,#fff));color:var(--ink,#0b0b0c);padding:0;margin:0 0 0 2px;cursor:pointer}#aivmAsk #aivsGear svg{width:19px;height:19px}" +
    "@media (min-width:901px){.aivs-toast{bottom:28px}}#aivsAbout #aivmSetX{margin:0 0 12px}" +
    "@media (max-width:560px){.aivs-row{flex-wrap:wrap}.aivs-row .aivs-seg{width:100%}.aivs-row .aivs-seg button{flex:1}}";
  var st = document.createElement("style"); st.id = "aivsCss"; st.textContent = css; (document.head || document.documentElement).appendChild(st);

  /* ---------- apply the choices everywhere ---------- */
  function applyLook() {
    var r = document.documentElement;
    ["s", "l", "xl"].forEach(function (z) { r.classList.toggle("aivs-ts-" + z, P.textSize === z); });
    r.classList.toggle("aivs-rm", !!P.reduceMotion);
    try { if (window.AIVTheme) window.AIVTheme.refresh(); } catch (e) {}
  }
  applyLook();

  var LANGS = ["Auto", "English", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Chinese (Simplified)", "Japanese", "Korean", "Hindi", "Arabic", "Tagalog", "Vietnamese", "Russian", "Ukrainian", "Polish", "Turkish"];
  function chatNote() {
    var L = [], who = (P.callMe || P.name || "").trim();
    if (who) L.push("Call the user " + who.slice(0, 40) + ".");
    if (P.length === "short") L.push("Keep conversational answers short and to the point.");
    else if (P.length === "detailed") L.push("Give detailed, thorough conversational answers.");
    if (P.tone && P.tone !== "friendly") L.push("Tone: " + P.tone + ".");
    if (P.lang && P.lang !== "auto") L.push("Write your replies in " + P.lang + ".");
    if ((P.custom || "").trim()) L.push("The user's standing instructions: " + P.custom.trim().slice(0, 600));
    if (!L.length) return "";
    return "User preferences from Settings: " + L.join(" ") + " These preferences only shape your wording. When a specific format is requested (for example JSON, a list or a plan), keep that format, its keys and its full length exactly as requested.";
  }
  // add the chat preferences to every AI request the app makes
  if (window.fetch && !window.fetch.__aivs) {
    var of = window.fetch;
    var nf = function (input, init) {
      try {
        if (init && typeof init.body === "string" && init.body.indexOf('"messages"') >= 0) {
          var note = chatNote();
          if (note) {
            var b = JSON.parse(init.body);
            if (b && Array.isArray(b.messages) && b.messages.length) {
              var m0 = b.messages[0];
              if (m0 && m0.role === "system" && typeof m0.content === "string") m0.content += "\n\n" + note;
              else b.messages.unshift({ role: "system", content: note });
              var n = {}; for (var k in init) n[k] = init[k]; n.body = JSON.stringify(b); init = n;
            }
          }
        }
      } catch (e) {}
      return of.call(this, input, init);
    };
    nf.__aivs = true; window.fetch = nf;
  }

  /* ---------- small helpers ---------- */
  var tt;
  function toast(msg) {
    var t = document.getElementById("aivsToast");
    if (!t) { t = document.createElement("div"); t.id = "aivsToast"; t.className = "aivs-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg || "Saved"; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("on"); }, 1400);
  }
  function seg(key, opts) {
    return '<div class="aivs-seg" role="group" data-seg="' + key + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (String(P[key]) === o[0]) + '">' + o[1] + "</button>";
    }).join("") + "</div>";
  }
  function tog(key, label) { return '<button type="button" class="aivs-tg" role="switch" data-tg="' + key + '" aria-checked="' + !!P[key] + '" aria-label="' + esc(label) + '"></button>'; }
  function row(title, sub, ctl) { return '<div class="aivs-row"><div><b>' + title + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>" + ctl + "</div>"; }
  function appName() {
    var b = document.querySelector(".side-brand b, .brand b, header .brand, .top .brand");
    var n = b ? (b.childNodes[0] && b.childNodes[0].nodeType === 3 ? b.childNodes[0].nodeValue : b.textContent) : "";
    return (n || document.title.split(/[—|\-·]/)[0] || "This app").trim();
  }
  function appNameField() { return document.querySelector('#v-settings [data-prof="name"], #v-settings [data-set="name"]'); }
  function initial() { var n = (P.name || P.callMe || "").trim(); return n ? n[0].toUpperCase() : "A"; }
  function avatar() { return P.photo ? '<img src="' + esc(P.photo) + '" alt="">' : esc(initial()); }
  function notifState() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  }
  function notifRow() {
    var s = notifState();
    var sub = s === "granted" ? "On for this browser." : s === "denied" ? "Blocked. Turn them on in your browser or phone settings for this site." : s === "unsupported" ? "This browser does not support notifications." : "Get reminders and alerts from " + esc(appName()) + ".";
    var ctl = s === "granted" ? '<button type="button" class="aivs-btn" data-a="ntest">Send a test</button>' : s === "default" ? '<button type="button" class="aivs-btn pri" data-a="non">Turn on</button>' : "";
    return row("Notifications", sub, ctl);
  }

  /* ---------- the Settings sections ---------- */
  function ownNotif() {
    var hs = document.querySelectorAll("#v-settings h3");
    for (var i = 0; i < hs.length; i++) if (/^\s*notifications/i.test(hs[i].textContent) && !hs[i].closest("#aivSet")) return hs[i].closest(".box,.card") || hs[i];
    return null;
  }
  function html() {
    var syncSub = embedded ? "You're in AIV X. Your data syncs with your AIV X account." : "Sign in with your AIV X account to back up and sync this app across devices.";
    var syncBtn = !embedded && window.AIV_PANEL ? '<button type="button" class="aivs-btn" data-a="sync">Sync with AIV X</button>' : "";
    return '' +
      '<nav class="aivs-jump" aria-label="Settings sections">' +
        [["account", "Account"], ["look", "Appearance"], ["chat", "Chat and AI"], ["notif", "Notifications"], ["privacy", "Privacy and data"], ["app", "App settings"], ["about", "About"]].map(function (j) { return '<button type="button" data-jump="' + j[0] + '">' + j[1] + "</button>"; }).join("") +
      "</nav>" +

      '<div class="aivs-card" id="aivs-account"><h3>Account</h3><p class="aivs-sub">Used by every AI Verse app on this device.</p>' +
        '<div class="aivs-acct"><div class="aivs-av" id="aivsAv">' + avatar() + '</div><div class="aivs-btns">' +
          '<button type="button" class="aivs-btn" data-a="photo">' + (P.photo ? "Change photo" : "Add photo") + "</button>" +
          (P.photo ? '<button type="button" class="aivs-btn" data-a="nophoto">Remove</button>' : "") +
          '<input type="file" accept="image/*" id="aivsPhoto" hidden></div></div>' +
        '<div class="aivs-grid">' +
          '<label class="aivs-f">Name<input type="text" data-p="name" maxlength="60" autocomplete="name" placeholder="Enter your name" value="' + esc(P.name) + '"></label>' +
          '<label class="aivs-f">What should the AI call you?<input type="text" data-p="callMe" maxlength="40" placeholder="Enter a nickname" value="' + esc(P.callMe) + '"></label>' +
          '<label class="aivs-f">Email<input type="email" data-p="email" maxlength="120" autocomplete="email" placeholder="Enter your email" value="' + esc(P.email) + '"></label>' +
        "</div>" +
        row("Sync and backup", syncSub, syncBtn) +
      "</div>" +

      '<div class="aivs-card" id="aivs-look"><h3>Appearance</h3><p class="aivs-sub">Chat theme and display.</p>' +
        row("Theme", embedded ? "Auto matches AIV X." : "Auto matches your device.", seg("theme", [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]])) +
        row("Text size", "", seg("textSize", [["s", "Small"], ["m", "Default"], ["l", "Large"], ["xl", "Larger"]])) +
        row("Reduce motion", "Turn off animations.", tog("reduceMotion", "Reduce motion")) +
      "</div>" +

      '<div class="aivs-card" id="aivs-chat"><h3>Chat and AI</h3><p class="aivs-sub">How the AI in every AI Verse app talks to you.</p>' +
        row("Answer length", "", seg("length", [["short", "Short"], ["balanced", "Balanced"], ["detailed", "Detailed"]])) +
        '<div class="aivs-grid" style="margin-top:8px">' +
          '<label class="aivs-f">Tone<select data-p="tone">' + [["friendly", "Friendly"], ["professional", "Professional"], ["direct and concise", "Direct"], ["encouraging", "Encouraging"], ["casual", "Casual"]].map(function (o) { return '<option value="' + o[0] + '"' + (P.tone === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
          '<label class="aivs-f">Reply language<select data-p="lang">' + LANGS.map(function (l) { var v = l === "Auto" ? "auto" : l; return '<option value="' + esc(v) + '"' + (P.lang === v ? " selected" : "") + ">" + (l === "Auto" ? "Auto (match what I write)" : l) + "</option>"; }).join("") + "</select></label>" +
        "</div>" +
        '<label class="aivs-f" style="margin-top:10px">Custom instructions<textarea data-p="custom" maxlength="600" placeholder="Enter anything the AI should always keep in mind">' + esc(P.custom) + "</textarea></label>" +
        '<p class="aivs-sub" style="margin:8px 0 0">AI provider and keys are under <a href="#" data-jump="app" style="color:inherit">App settings</a>.</p>' +
      "</div>" +

      (ownNotif() ? "" : '<div class="aivs-card" id="aivs-notif"><h3>Notifications</h3><div id="aivsNotif">' + notifRow() + "</div></div>") +

      '<div class="aivs-card" id="aivs-privacy"><h3>Privacy and data</h3><p class="aivs-sub">What you save stays in this browser unless you sync with AIV X.</p>' +
        row("Back up, restore or erase", "Download a copy of this app's data or start fresh.", '<button type="button" class="aivs-btn" data-a="data">Open</button>') +
        (window.AIVOnboard && window.AIVOnboard.tour ? row("App tour", "See the quick tour again.", '<button type="button" class="aivs-btn" data-a="tour">Replay</button>') : "") +
        row("Reset these settings", "Account, appearance and chat go back to the defaults.", '<button type="button" class="aivs-btn bad" data-a="reset">Reset</button>') +
      "</div>" +

      '<div class="aivs-h" id="aivs-app">App settings</div>';
  }
  function aboutHtml() {
    return '<div class="aivs-card" id="aivs-about" style="margin-top:14px"><h3>About</h3>' +
      '<p class="aivs-sub">' + esc(appName()) + " by AI Verse. Version " + VERSION + ".</p>" +
      '<div class="aivs-links">' +
        '<a class="aivs-btn" href="' + base + 'terms.html" target="_blank" rel="noopener">Terms</a>' +
        '<a class="aivs-btn" href="' + base + 'privacy.html" target="_blank" rel="noopener">Privacy</a>' +
        '<a class="aivs-btn" href="' + base + 'contact.html" target="_blank" rel="noopener">Contact and feedback</a>' +
        '<a class="aivs-btn" href="' + base + 'index.html" target="_blank" rel="noopener">More AI apps</a>' +
      "</div></div>";
  }

  /* ---------- put it in the app's Settings view ---------- */
  function mount() {
    var v = document.getElementById("v-settings");
    if (!v || document.getElementById("aivSet")) return;
    var head = v.querySelector(":scope > .row.between, :scope > header.vh, :scope > header");
    var box = document.createElement("div"); box.id = "aivSet"; box.className = "aivs"; box.innerHTML = html();
    if (head && head.parentNode === v) v.insertBefore(box, head.nextSibling); else v.insertBefore(box, v.firstChild);
    var ab = document.createElement("div"); ab.id = "aivsAbout"; ab.className = "aivs"; ab.innerHTML = aboutHtml(); v.appendChild(ab);
    // take the name the person already gave this app
    var f = appNameField();
    if (!P.name && f && f.value.trim()) { P.name = f.value.trim(); save(); var ni = box.querySelector('[data-p="name"]'); if (ni) ni.value = P.name; refreshAv(); }
    wire(box); wire(ab); placeExtras();
  }
  // phones: keep the Connections and Back to AI Verse links at the bottom, above About
  function placeExtras() {
    var x = document.getElementById("aivmSetX"), ab = document.getElementById("aivsAbout");
    if (x && ab && x.parentNode !== ab) ab.insertBefore(x, ab.firstChild);
  }
  function refreshAv() { var a = document.getElementById("aivsAv"); if (a) a.innerHTML = avatar(); }
  function redraw() { var b = document.getElementById("aivSet"), a = document.getElementById("aivsAbout"); if (b) b.remove(); if (a) a.remove(); mount(); }
  function jump(id) {
    var el = id === "about" ? document.getElementById("aivs-about") : document.getElementById("aivs-" + id);
    if (id === "app") el = document.getElementById("aivs-app");
    if (id === "notif" && !el) el = ownNotif();
    if (el) el.scrollIntoView({ behavior: P.reduceMotion ? "auto" : "smooth", block: "start" });
  }
  function dataCard() {
    var hs = document.querySelectorAll("#v-settings h3");
    for (var i = 0; i < hs.length; i++) if (/your data/i.test(hs[i].textContent)) return hs[i].closest(".box,.card,div") || hs[i];
    var er = Array.prototype.find.call(document.querySelectorAll("#v-settings button"), function (b) { return /erase everything/i.test(b.textContent); });
    return er ? (er.closest(".box,.card") || er) : null;
  }
  function wire(root) {
    root.addEventListener("click", function (e) {
      var t = e.target.closest("button,a"); if (!t || !root.contains(t)) return;
      if (t.dataset.jump) { e.preventDefault(); jump(t.dataset.jump); return; }
      var sg = t.closest("[data-seg]");
      if (sg && t.dataset.v != null) {
        P[sg.dataset.seg] = t.dataset.v; save(); applyLook();
        sg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); });
        toast(); return;
      }
      if (t.dataset.tg) { P[t.dataset.tg] = !P[t.dataset.tg]; save(); applyLook(); t.setAttribute("aria-checked", String(!!P[t.dataset.tg])); toast(); return; }
      var a = t.dataset.a; if (!a) return;
      if (a === "photo") { var fi = document.getElementById("aivsPhoto"); if (fi) fi.click(); }
      if (a === "nophoto") { P.photo = ""; save(); redraw(); toast("Photo removed"); }
      if (a === "sync") { try { window.AIV_PANEL.open(); } catch (x) {} }
      if (a === "non") { try { Notification.requestPermission().then(function () { var n = document.getElementById("aivsNotif"); if (n) n.innerHTML = notifRow(); }); } catch (x) {} }
      if (a === "ntest") { try { new Notification(appName(), { body: "Notifications are working." }); } catch (x) { toast("Couldn't show a notification here"); } }
      if (a === "data") { var c = dataCard(); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); }
      if (a === "tour") { try { var H = window.AIV_APP; if (H && H.go) H.go("home"); else location.hash = "#home"; } catch (x) {} setTimeout(function () { try { window.AIVOnboard.tour(); } catch (x) {} }, 300); }
      if (a === "reset") { if (confirm("Reset account, appearance and chat settings to the defaults? Your app data stays.")) { P = load(); for (var k in DEF) P[k] = DEF[k]; save(); applyLook(); redraw(); toast("Settings reset"); } }
    });
    root.addEventListener("input", function (e) {
      var el = e.target; if (!el.dataset || !el.dataset.p) return;
      P[el.dataset.p] = el.value; save();
      if (el.dataset.p === "name") {
        refreshAv();
        var f = appNameField();
        if (f && f.value !== el.value) { f.value = el.value; f.dispatchEvent(new Event("input", { bubbles: true })); f.dispatchEvent(new Event("change", { bubbles: true })); }
      }
      if (el.dataset.p === "callMe") refreshAv();
    });
    root.addEventListener("change", function (e) {
      var el = e.target;
      if (el.id === "aivsPhoto" && el.files && el.files[0]) { shrink(el.files[0]); return; }
      if (el.dataset && el.dataset.p) { P[el.dataset.p] = el.value; save(); toast(); }
    });
  }
  function shrink(file) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var s = 160, c = document.createElement("canvas"); c.width = c.height = s;
        var x = c.getContext("2d"), m = Math.min(img.width, img.height);
        x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
        try { P.photo = c.toDataURL("image/jpeg", 0.85); save(); redraw(); toast("Photo saved"); } catch (e) { toast("Couldn't use that photo"); }
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  /* desktop: a Settings link in the side menu (phones get it in the tab bar) */
  function navLink() {
    if (document.documentElement.classList.contains("aivm")) return;
    if (document.querySelector('a[data-nav="settings"]')) return;
    var nav = document.querySelector("nav.tabs .in"); if (!nav) return;
    var a = document.createElement("a"); a.href = "#settings"; a.setAttribute("data-nav", "settings"); a.className = "aivs-navlink";
    a.innerHTML = '<span class="ico"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path></svg></span>Settings';
    nav.appendChild(a);
    var mark = function () { a.classList.toggle("on", location.hash.replace("#", "") === "settings"); };
    window.addEventListener("hashchange", mark); mark();
  }

  /* the Settings button: a clear gear everywhere, and on phones a labeled "Settings" button */
  var GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path></svg>';
  function gearBtn() {
    var b = document.getElementById("btnSettings");
    if (b && !b.dataset.aivs) {
      b.dataset.aivs = "1";
      b.innerHTML = '<span class="aivs-gi">' + GEAR + '</span><span class="aivs-gl">Settings</span>';
    }
    var own = document.getElementById("aivsGear"); if (own) own.remove();
    var g = document.getElementById("aivmGear");
    if (g && !g.dataset.aivs) { g.dataset.aivs = "1"; g.innerHTML = GEAR; }
  }
  function init() {
    mount(); navLink(); gearBtn(); setTimeout(gearBtn, 800); setInterval(gearBtn, 1500);
    window.addEventListener("resize", function () { setTimeout(gearBtn, 50); });
    // apps that rebuild their Settings view get the sections back
    var v = document.getElementById("v-settings");
    if (v && typeof MutationObserver === "function") new MutationObserver(function () { if (!document.getElementById("aivSet")) mount(); else placeExtras(); }).observe(v, { childList: true });
    // other AI Verse tabs changed the shared settings
    window.addEventListener("storage", function (e) { if (e.key === PK) { P = load(); applyLook(); redraw(); } });
  }
  window.AIVSettings = { prefs: function () { return load(); }, chatNote: chatNote, open: function (s) { try { if (window.AIV_APP && window.AIV_APP.go) window.AIV_APP.go("settings"); else location.hash = "#settings"; } catch (e) {} if (s) setTimeout(function () { jump(s); }, 200); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
