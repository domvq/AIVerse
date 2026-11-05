/* =====================================================================
   AI Verse sign-in — one account for aiverse.it.com and AIV X (aiv-x.com)
   Uses the same Firebase project as AIV X, with the same sign-in options:
   Google, Apple, phone and email.
   Add this to a page with:  <script src="auth.js" defer></script>
   Firebase console → Authentication → Settings → Authorized domains must list
   aiverse.it.com, www.aiverse.it.com and domvq.github.io.
   ===================================================================== */
(function () {
  "use strict";
  if (window.AIVAuth) return;

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCvqB6cQl3dj93qhKcWdPbAKOJyqtqWfuo",
    authDomain: "aiv-x-21aba.firebaseapp.com",
    projectId: "aiv-x-21aba",
    storageBucket: "aiv-x-21aba.firebasestorage.app",
    messagingSenderId: "470138918405",
    appId: "1:470138918405:web:29655461ebc6c5aece6e6c",
  };
  const AIVX_URL = "https://aiv-x.com";
  const FB = "https://www.gstatic.com/firebasejs/10.12.2/";

  /* ---------- AIV X brand mark (same as aiv-x.com) ---------- */
  let brandN = 0;
  function aivxLogo(label) {
    const id = "aivxcut" + (++brandN) + Math.random().toString(36).slice(2, 6);
    return `<svg class="aivx-mark" viewBox="70 200 1600 630" fill="none" role="img" aria-label="${label || "AIV X"}">
  <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"><path d="M125 640 L283 388 L430 640"/><path d="M256 557 H300"/><path d="M525 392 V640"/><path d="M625 392 L765 642 L905 392"/></g>
  <g transform="translate(1010 198) scale(5.26)">
    <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="150" height="140"><rect x="-10" y="-10" width="150" height="140" fill="#fff"/><path d="M107.4 1.8 L12.6 118.2" stroke="#000" stroke-width="3"/></mask></defs>
    <g mask="url(#${id})" fill="currentColor"><polygon points="17,22 41,22 103,98 79,98"/><polygon points="79,22 103,22 41,98 17,98"/><polygon points="94.5,22 103,22 118,3"/><polygon points="17,98 25.5,98 3,117"/></g>
  </g></svg>`;
  }
  function paintLogos() { document.querySelectorAll("[data-aivx-logo]").forEach(el => { if (!el.querySelector("svg")) el.innerHTML = aivxLogo(el.getAttribute("data-aivx-logo") || "AIV X"); }); }

  /* ---------- styles ---------- */
  const css = `
.aivx-mark{height:1em;width:auto;display:block;overflow:visible}
.aa-btn{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:8px 14px;font:500 14px/1 var(--body,system-ui,sans-serif);white-space:nowrap;cursor:pointer;border:1px solid var(--line,#e7e5e1);background:transparent;color:var(--fg,#111)}
.aa-btn:hover{background:var(--pill,#efeeeb)}
.aa-btn:focus-visible,.aa-m button:focus-visible,.aa-m a:focus-visible,.aa-m input:focus-visible{outline:2px solid #3b82f6;outline-offset:2px}
.aa-av{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font:600 12px/1 system-ui,sans-serif;background:#1d4ed8;color:#fff;overflow:hidden;flex:none}
.aa-av img{width:100%;height:100%;object-fit:cover}
.aa-wrap{position:relative;display:inline-flex}
.aa-menu{position:absolute;right:0;top:calc(100% + 8px);min-width:240px;background:var(--bg,#fff);color:var(--fg,#111);border:1px solid var(--line,#e7e5e1);border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.18);padding:8px;z-index:1000}
.aa-menu .who{padding:8px 10px 10px;border-bottom:1px solid var(--line,#e7e5e1);margin-bottom:6px}
.aa-menu .who b{display:block;font:600 14px/1.3 var(--body,system-ui,sans-serif)}
.aa-menu .who span{font-size:13px;color:var(--muted,#6e6c68);word-break:break-all}
.aa-menu a,.aa-menu button{display:flex;width:100%;align-items:center;gap:8px;padding:9px 10px;border-radius:10px;font:500 14px/1.2 var(--body,system-ui,sans-serif);color:inherit;text-decoration:none;background:none;border:0;cursor:pointer;text-align:left}
.aa-menu a:hover,.aa-menu button:hover{background:var(--pill,#efeeeb)}
.aa-menu .aivx-mark{height:13px}
.aa-m{position:fixed;inset:0;z-index:2147483000;display:flex;background:rgba(0,0,0,.55);align-items:center;justify-content:center;padding:16px}
.aa-m[hidden]{display:none}
.aa-box{display:flex;width:min(920px,100%);min-height:560px;max-height:calc(100dvh - 32px);border-radius:20px;overflow:hidden;background:var(--bg,#fff);color:var(--fg,#111);box-shadow:0 30px 80px rgba(0,0,0,.4);font-family:var(--body,system-ui,-apple-system,"Segoe UI",sans-serif)}
.aa-art{flex:1.05;background:#050506;color:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:36px}
.aa-art::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 65% 40%,rgba(59,130,246,.28),transparent 70%),radial-gradient(ellipse 40% 35% at 15% 85%,rgba(255,255,255,.07),transparent 70%)}
.aa-art .stars{position:absolute;inset:0;background-image:radial-gradient(1px 1px at 20% 30%,#fff9,transparent),radial-gradient(1px 1px at 80% 20%,#fff7,transparent),radial-gradient(1px 1px at 60% 70%,#fff6,transparent),radial-gradient(1px 1px at 35% 85%,#fff5,transparent),radial-gradient(1px 1px at 90% 60%,#fff7,transparent)}
.aa-art>*{position:relative}
.aa-art .logo{font-size:44px;line-height:0}
.aa-art h2{font:500 clamp(34px,4.4vw,54px)/.95 "Barlow Condensed",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;margin:0}
.aa-art p{color:#c9c9d0;max-width:380px;margin:14px 0 0;font-size:15.5px;line-height:1.5}
.aa-art small{color:#888;font-size:12.5px}
.aa-form{flex:1;display:flex;align-items:center;justify-content:center;padding:28px 22px;overflow-y:auto;position:relative}
.aa-card{width:100%;max-width:360px}
.aa-card h3{font:600 26px/1.15 var(--display,system-ui,sans-serif);letter-spacing:-.02em;margin:0}
.aa-card .sub{color:var(--muted,#6e6c68);margin:6px 0 22px;font-size:15px}
.aa-prov{width:100%;display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid var(--line,#e7e5e1);border-radius:12px;font:500 15px/1.2 var(--body,system-ui,sans-serif);margin-bottom:10px;background:var(--bg,#fff);color:inherit;cursor:pointer}
.aa-prov:hover{background:var(--pill,#efeeeb)}
.aa-prov svg{width:20px;height:20px;flex:none}
.aa-or{display:flex;align-items:center;gap:12px;color:var(--muted,#6e6c68);font-size:13px;margin:14px 0}
.aa-or::before,.aa-or::after{content:"";flex:1;height:1px;background:var(--line,#e7e5e1)}
.aa-in{width:100%;box-sizing:border-box;padding:11px 14px;border:1px solid var(--line,#e7e5e1);border-radius:12px;background:var(--field,var(--bg,#fff));color:inherit;font:400 16px/1.3 var(--body,system-ui,sans-serif);outline:none}
.aa-in:focus{border-color:var(--muted,#6e6c68)}
.aa-go{width:100%;margin-top:10px;padding:12px;border-radius:12px;border:0;background:var(--ink-btn,#111);color:var(--ink-btn-fg,#fff);font:600 15px/1 var(--body,system-ui,sans-serif);cursor:pointer}
.aa-go:disabled{opacity:.5;cursor:default}
.aa-link{background:none;border:0;color:#2563eb;font:500 14px/1.3 var(--body,system-ui,sans-serif);cursor:pointer;padding:0}
.aa-err{color:var(--bad,#b42318);font-size:14px;margin-top:10px;min-height:20px}
.aa-legal{font-size:12px;color:var(--muted,#6e6c68);margin-top:18px;text-align:center}.aa-legal a{color:inherit;text-decoration:underline}
.aa-x{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:0;background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer}
.aa-x:hover{background:var(--pill,#efeeeb)}
.aa-hide{display:none!important}
@media(max-width:760px){.aa-art{display:none}.aa-box{min-height:0}}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) .aa-link{color:#7ab8ff}}
`;
  function addFont() { if (document.getElementById("aa-font") || [...document.querySelectorAll('link[href*="Barlow+Condensed"]')].length) return; const l = document.createElement("link"); l.id = "aa-font"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500&display=swap"; document.head.appendChild(l); }
  function addCss() { if (document.getElementById("aa-css")) return; const s = document.createElement("style"); s.id = "aa-css"; s.textContent = css; document.head.appendChild(s); }

  /* ---------- markup ---------- */
  const G = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9C3.9 20.6 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7H2.1C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.7-2.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.4 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z"/></svg>';
  const A = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1-2.8-4.2zM13.9 5.2c.7-.8 1.2-2 1-3.2-1 .1-2.2.7-3 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.4z"/></svg>';
  const P = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>';
  function buildModal() {
    const m = document.createElement("div");
    m.className = "aa-m"; m.id = "aaModal"; m.hidden = true;
    m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "aaTitle");
    m.innerHTML = `<div class="aa-box">
  <div class="aa-art"><div class="stars"></div><div class="logo">${aivxLogo()}</div>
    <div><h2>One account for<br>AI Verse and AIV X.</h2><p>Sign in once to use AI Verse and AIV X, your everyday AI, with the same account on both.</p></div>
    <small>© AI Verse · aiverse.it.com</small></div>
  <div class="aa-form"><button class="aa-x" type="button" id="aaClose" aria-label="Close">×</button><div class="aa-card">
    <div id="aaMain">
      <h3 id="aaTitle">Welcome to AI Verse</h3><div class="sub">Sign up or log in to continue.</div>
      <button class="aa-prov" type="button" data-aa="google">${G}Continue with Google</button>
      <button class="aa-prov" type="button" data-aa="apple">${A}Continue with Apple</button>
      <button class="aa-prov" type="button" data-aa="phone">${P}Continue with phone</button>
      <div class="aa-or">or</div>
      <label for="aaEmail" class="aa-hide">Email address</label>
      <input class="aa-in" id="aaEmail" type="email" placeholder="Email address" autocomplete="email">
      <button class="aa-go" type="button" id="aaEmailGo">Continue with email</button>
    </div>
    <div id="aaEmailStep" class="aa-hide">
      <button class="aa-link" type="button" data-aa-back>← Back</button>
      <h3 style="margin-top:14px" id="aaEmailTitle">Create your account</h3><div class="sub" id="aaEmailSub"></div>
      <label for="aaName" class="aa-hide">Your name</label><input class="aa-in" id="aaName" placeholder="Your name" autocomplete="name">
      <label for="aaPass" class="aa-hide">Password</label><input class="aa-in" id="aaPass" type="password" placeholder="Password (8+ characters)" autocomplete="current-password" style="margin-top:10px">
      <button class="aa-go" type="button" id="aaEmailSubmit">Continue</button>
      <div style="display:flex;justify-content:space-between;gap:10px;margin-top:12px"><button class="aa-link" type="button" id="aaToggle">I already have an account</button><button class="aa-link" type="button" id="aaReset">Forgot password?</button></div>
    </div>
    <div id="aaPhoneStep" class="aa-hide">
      <button class="aa-link" type="button" data-aa-back>← Back</button>
      <h3 style="margin-top:14px">Continue with phone</h3><div class="sub">We'll text you a 6-digit code.</div>
      <label for="aaPhone" class="aa-hide">Phone number</label><input class="aa-in" id="aaPhone" type="tel" placeholder="+1 916 555 0123" autocomplete="tel">
      <button class="aa-go" type="button" id="aaPhoneSend">Send code</button>
      <div id="aaCodeWrap" class="aa-hide"><label for="aaCode" class="aa-hide">6-digit code</label><input class="aa-in" id="aaCode" inputmode="numeric" maxlength="6" placeholder="6-digit code" style="margin-top:14px;letter-spacing:.3em;text-align:center"><button class="aa-go" type="button" id="aaCodeGo">Verify</button></div>
      <div id="aaRecaptcha"></div>
    </div>
    <div class="aa-err" id="aaErr" role="alert"></div>
    <div class="aa-legal">By continuing, you agree to AI Verse's <a href="https://aiverse.it.com/terms.html" target="_blank" rel="noopener">Terms</a> and <a href="https://aiverse.it.com/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>, including use of your AI conversations to improve our AI models (you can opt out anytime). Your AI Verse account also signs you in to AIV X.</div>
  </div></div></div>`;
    document.body.appendChild(m);
    return m;
  }

  /* ---------- Firebase ---------- */
  const $ = id => document.getElementById(id);
  const loadScript = src => new Promise((res, rej) => { if ([...document.scripts].some(s => s.src === src)) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Couldn't load sign-in. Check your connection.")); document.head.appendChild(s); });
  let fb = null, ready = null, user = null;
  const listeners = [];
  function start() {
    if (ready) return ready;
    ready = (async () => {
      await loadScript(FB + "firebase-app-compat.js");
      await loadScript(FB + "firebase-auth-compat.js");
      fb = window.firebase;
      if (!fb.apps.length) fb.initializeApp(FIREBASE_CONFIG);
      fb.auth().onAuthStateChanged(u => {
        user = u ? { uid: u.uid, name: u.displayName || "", email: u.email || "", phone: u.phoneNumber || "", photo: u.photoURL || "", provider: (u.providerData[0] && u.providerData[0].providerId) || "password" } : null;
        if (user) closeModal();
        render(); listeners.forEach(fn => { try { fn(user); } catch (e) {} });
        document.dispatchEvent(new CustomEvent("aiv-auth", { detail: user }));
      });
    })();
    return ready;
  }
  const errMap = {
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/wrong-password": "Wrong password. Try again or reset it.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/user-not-found": "No account with that email. Create one instead.",
    "auth/email-already-in-use": "That email already has an account. Log in instead.",
    "auth/weak-password": "Use at least 8 characters for your password.",
    "auth/invalid-phone-number": "Enter your phone number with country code, like +1 916 555 0123.",
    "auth/invalid-verification-code": "That code isn't right. Check the text and try again.",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
    "auth/operation-not-allowed": "This sign-in method isn't turned on yet.",
    "auth/unauthorized-domain": "Sign-in isn't enabled for this website yet. Please try again later.",
    "auth/account-exists-with-different-credential": "That email already uses a different sign-in method. Try Google, Apple or email instead.",
  };
  const showErr = e => { $("aaErr").textContent = typeof e === "string" ? e : (errMap[e && e.code] || (e && e.message) || String(e)); };
  const Auth = {
    emailMode: "signup",
    async google() { try { await start(); await fb.auth().signInWithPopup(new fb.auth.GoogleAuthProvider()); } catch (e) { showErr(e); } },
    async apple() { try { await start(); const p = new fb.auth.OAuthProvider("apple.com"); p.addScope("email"); p.addScope("name"); await fb.auth().signInWithPopup(p); } catch (e) { showErr(e); } },
    async phoneSend(phone) {
      phone = phone.replace(/[^\d+]/g, "");
      if (!/^\+\d{8,15}$/.test(phone)) { showErr("Enter your number with country code, like +19165550123."); return false; }
      try { await start(); if (!this.verifier) this.verifier = new fb.auth.RecaptchaVerifier("aaRecaptcha", { size: "invisible" }); this.confirmation = await fb.auth().signInWithPhoneNumber(phone, this.verifier); return true; }
      catch (e) { showErr(e); if (this.verifier) { try { this.verifier.clear(); } catch (_) {} this.verifier = null; } return false; }
    },
    async phoneVerify(code) { try { await this.confirmation.confirm(code); } catch (e) { showErr(e); } },
    async email(email, pass, name) {
      try {
        await start();
        if (this.emailMode === "signup") { const c = await fb.auth().createUserWithEmailAndPassword(email, pass); if (name) { await c.user.updateProfile({ displayName: name }); user && (user.name = name); render(); } }
        else await fb.auth().signInWithEmailAndPassword(email, pass);
        try { localStorage.setItem("aivx_known_" + email.toLowerCase(), "true"); } catch (e) {}
      } catch (e) { showErr(e); }
    },
    async reset(email) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showErr("Enter your email first, then press Forgot password."); return; }
      try { await start(); await fb.auth().sendPasswordResetEmail(email); $("aaErr").textContent = ""; $("aaEmailSub").textContent = "Password reset email sent to " + email + "."; } catch (e) { showErr(e); }
    },
    async signOut() { await start(); await fb.auth().signOut(); },
  };

  /* ---------- modal behaviour ---------- */
  let modal = null, lastFocus = null;
  function step(id) { ["aaMain", "aaEmailStep", "aaPhoneStep"].forEach(s => $(s).classList.toggle("aa-hide", s !== id)); $("aaErr").textContent = ""; }
  function setMode(m) {
    Auth.emailMode = m;
    $("aaEmailTitle").textContent = m === "signup" ? "Create your account" : "Welcome back";
    $("aaName").classList.toggle("aa-hide", m !== "signup");
    $("aaToggle").textContent = m === "signup" ? "I already have an account" : "Create an account instead";
    $("aaPass").autocomplete = m === "signup" ? "new-password" : "current-password";
  }
  function openModal() {
    addCss(); addFont(); if (!modal) { modal = buildModal(); wire(); }
    lastFocus = document.activeElement; step("aaMain"); modal.hidden = false;
    document.documentElement.style.overflow = "hidden";
    start().catch(e => showErr(e.message));
    setTimeout(() => modal.querySelector('[data-aa="google"]').focus(), 30);
  }
  function closeModal() { if (!modal || modal.hidden) return; modal.hidden = true; document.documentElement.style.overflow = ""; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function wire() {
    $("aaClose").onclick = closeModal;
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", e => {
      if (!modal || modal.hidden) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") { const f = [...modal.querySelectorAll("button,input,a")].filter(x => x.offsetParent !== null && !x.disabled); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    modal.querySelectorAll("[data-aa-back]").forEach(b => b.onclick = () => step("aaMain"));
    modal.querySelector('[data-aa="google"]').onclick = () => Auth.google();
    modal.querySelector('[data-aa="apple"]').onclick = () => Auth.apple();
    modal.querySelector('[data-aa="phone"]').onclick = () => { step("aaPhoneStep"); $("aaCodeWrap").classList.add("aa-hide"); $("aaPhone").focus(); };
    $("aaEmailGo").onclick = () => {
      const e = $("aaEmail").value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { showErr("Enter a valid email address."); return; }
      let known = false; try { known = localStorage.getItem("aivx_known_" + e.toLowerCase()) === "true"; } catch (_) {}
      $("aaEmailSub").textContent = e; setMode(known ? "signin" : "signup"); step("aaEmailStep");
      ($("aaName").classList.contains("aa-hide") ? $("aaPass") : $("aaName")).focus();
    };
    $("aaEmail").onkeydown = e => { if (e.key === "Enter") $("aaEmailGo").click(); };
    $("aaToggle").onclick = () => setMode(Auth.emailMode === "signup" ? "signin" : "signup");
    $("aaReset").onclick = () => Auth.reset($("aaEmail").value.trim());
    $("aaEmailSubmit").onclick = async () => {
      $("aaErr").textContent = "";
      const email = $("aaEmail").value.trim(), pass = $("aaPass").value, name = $("aaName").value.trim();
      if (Auth.emailMode === "signup" && !name) { showErr("Add your name."); return; }
      if (pass.length < (Auth.emailMode === "signup" ? 8 : 1)) { showErr(Auth.emailMode === "signup" ? "Use at least 8 characters for your password." : "Enter your password."); return; }
      $("aaEmailSubmit").disabled = true; await Auth.email(email, pass, name); $("aaEmailSubmit").disabled = false;
    };
    $("aaPass").onkeydown = e => { if (e.key === "Enter") $("aaEmailSubmit").click(); };
    $("aaPhoneSend").onclick = async () => { $("aaPhoneSend").disabled = true; const ok = await Auth.phoneSend($("aaPhone").value); $("aaPhoneSend").disabled = false; if (ok) { $("aaCodeWrap").classList.remove("aa-hide"); $("aaPhoneSend").textContent = "Resend code"; $("aaCode").focus(); } };
    $("aaCodeGo").onclick = async () => { const c = $("aaCode").value.trim(); if (!/^\d{6}$/.test(c)) { showErr("Enter the 6-digit code from the text."); return; } $("aaCodeGo").disabled = true; await Auth.phoneVerify(c); $("aaCodeGo").disabled = false; };
    $("aaCode").onkeydown = e => { if (e.key === "Enter") $("aaCodeGo").click(); };
  }

  /* ---------- header button / account menu ---------- */
  let slot = null, menuOpen = false;
  const PERSON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/></svg>';
  const initials = u => { const s = (u.name || u.email || "").trim(); if (!/[a-z]/i.test(s)) return ""; const p = s.split(/\s+/); return ((p[0] || "")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); };
  const escH = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function findSlot() {
    const s = document.querySelector("[data-auth-slot]") || document.querySelector(".sitehead .acts");
    if (!s) return null;
    let w = s.querySelector(".aa-wrap");
    if (!w) { w = document.createElement("div"); w.className = "aa-wrap"; s.insertBefore(w, s.firstChild); }
    return w;
  }
  function render() {
    slot = slot || findSlot(); if (!slot) return;
    if (!user) {
      slot.innerHTML = `<button class="aa-btn" type="button" id="aaSignIn">Sign in</button>`;
      slot.querySelector("#aaSignIn").onclick = openModal; return;
    }
    const av = user.photo ? `<img src="${escH(user.photo)}" alt="" referrerpolicy="no-referrer">` : (initials(user) ? escH(initials(user)) : PERSON);
    slot.innerHTML = `<button class="aa-btn" type="button" id="aaMe" aria-haspopup="true" aria-expanded="false" aria-label="Your account"><span class="aa-av">${av}</span><span class="aa-nm">${escH(user.name ? user.name.split(" ")[0] : user.email ? user.email.split("@")[0] : "Account")}</span></button>
<div class="aa-menu" id="aaMenu" hidden><div class="who"><b>${escH(user.name || "Your account")}</b><span>${escH(user.email || user.phone)}</span></div>
<a href="${AIVX_URL}" target="_blank" rel="noopener">${aivxLogo("AIV X")}<span>Open AIV X</span></a><button type="button" id="aaOut">Sign out</button></div>`;
    const me = slot.querySelector("#aaMe"), menu = slot.querySelector("#aaMenu");
    me.onclick = e => { e.stopPropagation(); menuOpen = menu.hidden; menu.hidden = !menu.hidden; me.setAttribute("aria-expanded", String(!menu.hidden)); };
    slot.querySelector("#aaOut").onclick = () => Auth.signOut();
  }
  document.addEventListener("click", e => { const m = document.getElementById("aaMenu"); if (m && !m.hidden && !e.target.closest(".aa-wrap")) { m.hidden = true; const b = document.getElementById("aaMe"); if (b) b.setAttribute("aria-expanded", "false"); } });
  document.addEventListener("keydown", e => { const m = document.getElementById("aaMenu"); if (e.key === "Escape" && m && !m.hidden) { m.hidden = true; const b = document.getElementById("aaMe"); if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); } } });

  window.AIVAuth = {
    get user() { return user; },
    open: openModal, close: closeModal,
    signOut: () => Auth.signOut(),
    onChange(fn) { listeners.push(fn); if (ready) fn(user); },
    logo: aivxLogo,
  };
  function init() {
    addCss(); paintLogos(); render();
    // Only load Firebase right away for people who have signed in before, so the site stays fast.
    let seen = false; try { seen = Object.keys(localStorage).some(k => k.startsWith("firebase:authUser:")); } catch (e) {}
    if (seen) start().catch(() => {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
