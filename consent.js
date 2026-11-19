/* AI Verse - cookie and consent banner
   - Shows once per browser until the visitor chooses "Accept" or "Essential only".
   - AI Verse uses only essential storage today (sign-in, app data, settings).
     The choice is saved so any future optional cookies (for example analytics)
     can check it first: window.AIVConsent.allowed('analytics') returns true
     only after "Accept".
   - Any link with data-cookie-settings reopens the banner.
*/
(function () {
  'use strict';
  var KEY = 'aiv.consent.v1';
  var listeners = [];

  function read() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.choice ? v : null; } catch (e) { return null; }
  }
  function write(choice) {
    var v = { choice: choice, ts: new Date().toISOString(), v: 1 };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    listeners.forEach(function (fn) { try { fn(v); } catch (e) {} });
    return v;
  }

  window.AIVConsent = {
    get: read,
    allowed: function (kind) { var v = read(); if (kind === 'essential') return true; return !!(v && v.choice === 'all'); },
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
    open: function () { show(true); }
  };

  var css = '' +
    '.aivcb{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:560px;margin:0 auto;' +
    'background:var(--bg,#fff);color:var(--fg,#111);border:1px solid var(--line,#e7e5e1);border-radius:18px;padding:16px 16px 14px;' +
    'box-shadow:0 12px 40px rgba(0,0,0,.16);font-family:var(--body,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-size:14px;line-height:1.5;' +
    'transform:translateY(16px);opacity:0;transition:transform .24s ease,opacity .24s ease}' +
    '.aivcb.on{transform:none;opacity:1}' +
    '.aivcb h2{margin:0 0 4px;font-size:15px;font-weight:650;letter-spacing:-.01em;font-family:inherit}' +
    '.aivcb p{margin:0;color:var(--muted,#6e6c68)}' +
    '.aivcb p a{color:inherit;text-decoration:underline;text-underline-offset:2px}' +
    '.aivcb .b{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}' +
    '.aivcb button{font:inherit;font-weight:600;font-size:13.5px;min-height:38px;padding:0 16px;border-radius:999px;cursor:pointer;border:1px solid var(--line,#e7e5e1);background:transparent;color:inherit}' +
    '.aivcb button.p{background:var(--ink-btn,#111);color:var(--ink-btn-fg,#fff);border-color:var(--ink-btn,#111)}' +
    '.aivcb button:focus-visible{outline:2px solid var(--fg,#111);outline-offset:2px}' +
    '@media (max-width:480px){.aivcb .b button{flex:1 1 0}}' +
    '@media (prefers-reduced-motion:reduce){.aivcb{transition:none}}';

  var box = null;
  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    box = document.createElement('section');
    box.className = 'aivcb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', 'Cookies and consent');
    box.innerHTML =
      '<h2>Cookies and your privacy</h2>' +
      '<p>We use essential cookies and browser storage to keep you signed in and save your settings. We don’t use advertising cookies. ' +
      'By using AI Verse you agree to our <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.</p>' +
      '<div class="b"><button type="button" class="p" data-c="all">Accept</button><button type="button" data-c="essential">Essential only</button></div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-c]'); if (!b) return;
      write(b.getAttribute('data-c')); hide();
    });
    document.body.appendChild(box);
  }
  function show(force) {
    if (!force && read()) return;
    if (!box) build();
    box.hidden = false;
    requestAnimationFrame(function () { box.classList.add('on'); });
  }
  function hide() {
    if (!box) return;
    box.classList.remove('on');
    setTimeout(function () { if (box) box.hidden = true; }, 260);
  }

  function init() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-cookie-settings]'); if (!a) return;
      e.preventDefault(); show(true);
    });
    show(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
