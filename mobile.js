/* =====================================================================
   AI Verse — simple mobile navigation for the AI apps
   On phones (whenever an app would show its bottom tab bar) this:
   - replaces the crowded tab bar with a floating bar: 4 main tabs + More
     (the active tab becomes a filled pill with its name)
   - puts the other sections, Settings and Back to AI Verse in a More sheet
   - tidies the header and the AIV key banner, and keeps the AIV button clear
   Add to each app:  <script src="../mobile.js" defer></script>
   ===================================================================== */
(function () {
  'use strict';
  if (window.__aivMobile) return; window.__aivMobile = true;

  var MAX_MAIN = 4;
  var css = '' +
    /* hide the apps' own bottom bars while ours is on */
    'html.aivm nav.tabs,html.aivm .mtabs{display:none!important}' +
    'html.aivm body{padding-bottom:calc(100px + env(safe-area-inset-bottom))!important}' +
    /* floating bar */
    '.aivm-bar{display:none}' +
    'html.aivm .aivm-bar{display:flex;position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:60;height:64px;padding:8px;gap:4px;align-items:center;justify-content:space-between;border-radius:999px;background:var(--bg,#fff);color:var(--ink,#111);border:1px solid var(--line,#e7e5e1);box-shadow:0 12px 32px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.06);font-family:inherit}' +
    '.aivm-it{flex:1 1 0;min-width:44px;height:48px;display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:999px;background:transparent;color:inherit;text-decoration:none;cursor:pointer;font:600 13.5px/1 inherit;font-family:inherit;padding:0 10px;opacity:.62;transition:background .18s,color .18s,opacity .18s,flex-grow .18s;-webkit-tap-highlight-color:transparent}' +
    '.aivm-it .i{display:flex;width:22px;height:22px;flex:none;align-items:center;justify-content:center}' +
    '.aivm-it .i svg{width:22px;height:22px}' +
    '.aivm-it .l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
    '.aivm-it.on{flex:0 0 auto;padding:0 16px;background:var(--ink,#111);color:var(--bg,#fff);opacity:1}' +
    '.aivm-it.on .l{position:static;width:auto;height:auto;clip:auto;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.aivm-it:focus-visible{outline:2px solid var(--ink,#111);outline-offset:2px}' +
    /* More sheet */
    '.aivm-scrim{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.38);opacity:0;pointer-events:none;transition:opacity .2s}' +
    '.aivm-scrim.open{opacity:1;pointer-events:auto}' +
    '.aivm-sheet{position:fixed;left:0;right:0;bottom:0;z-index:71;background:var(--bg,#fff);color:var(--ink,#111);border-radius:22px 22px 0 0;padding:10px 12px calc(16px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .24s ease;max-height:80vh;overflow:auto;box-shadow:0 -10px 40px rgba(0,0,0,.18);font-family:inherit}' +
    '.aivm-sheet.open{transform:none}' +
    '.aivm-grab{width:40px;height:5px;border-radius:9px;background:var(--line,#e7e5e1);margin:2px auto 10px}' +
    '.aivm-sheet h2{font:600 13px/1 inherit;font-family:inherit;letter-spacing:.06em;text-transform:uppercase;opacity:.55;margin:6px 8px 10px}' +
    '.aivm-row{display:flex;align-items:center;gap:14px;width:100%;min-height:52px;padding:0 12px;border:0;border-radius:14px;background:transparent;color:inherit;text-decoration:none;font:500 16px/1.2 inherit;font-family:inherit;text-align:left;cursor:pointer}' +
    '.aivm-row:hover,.aivm-row.on{background:var(--card,rgba(0,0,0,.05))}' +
    '.aivm-row .i{display:flex;width:22px;height:22px;flex:none;align-items:center;justify-content:center;opacity:.75}.aivm-row .i svg{width:22px;height:22px}' +
    '.aivm-sep{height:1px;background:var(--line,#e7e5e1);margin:8px 8px}' +
    /* tidier header and key banner */
    'html.aivm header.top{display:flex!important;flex-direction:column-reverse;align-items:stretch!important;gap:12px!important}' +
    'html.aivm header.top .hdr-r{display:flex;justify-content:space-between;align-items:center;gap:8px}' +
    'html.aivm header.top h1{font-size:28px!important;line-height:1.12!important;letter-spacing:-.02em}' +
    'html.aivm header.top .sub{display:none}' +
    'html.aivm .badge,html.aivm .aibadge{font-size:12px!important;padding:6px 11px!important}' +
    /* AIV key banner: a small strip at the bottom of each page */
    '.aivpromo.aivp-sm{display:flex;flex-wrap:nowrap!important;align-items:center;gap:8px!important;max-width:560px;margin:28px auto 8px!important;padding:6px 6px 6px 14px!important;border-radius:999px!important;background:var(--card,#f4f3f1)!important;color:var(--ink,#111)!important;border:1px solid var(--line,#e7e5e1);font-size:13px}' +
    '.aivpromo.aivp-sm[hidden]{display:none!important}' +
    '.aivpromo.aivp-sm .t{flex:1 1 auto!important;min-width:0!important;font-size:13px!important;line-height:1.3!important}' +
    '.aivpromo.aivp-sm .t b{display:block;font-size:13px!important;font-weight:500!important;margin:0!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.aivpromo.aivp-sm .t span{display:none!important}' +
    '.aivpromo.aivp-sm a.go{background:var(--ink,#111)!important;color:var(--bg,#fff)!important;font-size:12.5px!important;padding:6px 12px!important;border-radius:99px!important;white-space:nowrap}' +
    '.aivpromo.aivp-sm .add{font-size:12px!important;white-space:nowrap;color:inherit!important;opacity:.7;background:none!important;border:0!important;padding:4px!important;text-decoration:underline;cursor:pointer}' +
    '.aivpromo.aivp-sm .x{color:inherit!important;opacity:.55;background:none!important;border:0!important;font-size:16px!important;padding:2px 6px!important;cursor:pointer}' +
    '@media (max-width:420px){.aivpromo.aivp-sm .add{display:none!important}}' +
    '@media (max-width:374px){.aivpromo.aivp-sm .t b{white-space:normal}}' +
    'html.aivm .topbar{flex-wrap:wrap!important;gap:8px!important}' +
    'html.aivm .topbar .aibadge{max-width:100%;white-space:nowrap}' +
    /* keep the AIV assistant button above the bar, and out of the way of the More sheet */
    'html.aivm.aivm-open #aivx-panel-host::part(fab){display:none}' +
    'html.aivm #aivx-panel-host::part(fab){bottom:calc(88px + env(safe-area-inset-bottom));right:16px;height:46px}' +
    '@media (max-width:374px){html.aivm .aivm-bar{left:8px;right:8px;padding:6px;gap:2px}.aivm-it{min-width:38px;padding:0 6px}.aivm-it.on{padding:0 12px}.aivm-it.on .l{max-width:72px}}' +
    '@media (prefers-reduced-motion:reduce){.aivm-it,.aivm-sheet,.aivm-scrim{transition:none}}';

  var ICON_MORE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>';
  var ICON_PLUG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0V7z"/><path d="M12 17v5"/></svg>';
  var ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M20 4L4 20"/></svg>';

  var items = [], bar, sheet, scrim, moreBtn, origNav;

  function txt(el) { var c = el.cloneNode(true); c.querySelectorAll('.ico,svg').forEach(function (x) { x.remove(); }); c.querySelectorAll('*').forEach(function (x) { if (/^\s*\d+\s*$/.test(x.textContent)) x.remove(); }); return c.textContent.replace(/\s+/g, ' ').trim(); }
  function icon(el) { var i = el.querySelector('.ico'); return i ? i.innerHTML : ''; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function collect() {
    var seen = {}, out = [];
    var list = Array.prototype.slice.call(document.querySelectorAll('.mtabs a[data-nav]')).concat(Array.prototype.slice.call(document.querySelectorAll('a[data-nav]')));
    list.forEach(function (a) {
      var k = a.getAttribute('data-nav');
      if (!k || seen[k]) { if (k && seen[k] && !seen[k].icon) seen[k].icon = icon(a); return; }
      if (a.closest('.aivm-bar,.aivm-sheet')) return;
      var it = { key: k, label: txt(a), icon: icon(a), href: a.getAttribute('href') || ('#' + k) };
      seen[k] = it; out.push(it);
    });
    return out;
  }

  function go(key) {
    var o = document.querySelector('a[data-nav="' + key + '"]:not(.aivm-it)');
    if (o) { o.click(); } else { location.hash = '#' + key; }
    setTimeout(sync, 30);
  }
  function openSettings() {
    var b = document.getElementById('btnSettings');
    if (b) b.click(); else go('settings');
  }

  function activeKey() {
    var on = document.querySelector('a[data-nav].on:not(.aivm-it), a[data-nav][aria-current="page"]:not(.aivm-it)');
    if (on) return on.getAttribute('data-nav');
    var h = (location.hash || '').slice(1);
    return h || (items[0] && items[0].key);
  }

  function build() {
    items = collect();
    if (!items.length) return false;
    var main = items.filter(function (i) { return i.key !== 'settings'; }).slice(0, MAX_MAIN);
    var mainKeys = main.map(function (i) { return i.key; });
    var rest = items.filter(function (i) { return mainKeys.indexOf(i.key) < 0 && i.key !== 'settings'; });
    var hasSettings = !!(document.getElementById('btnSettings') || document.getElementById('v-settings') || items.some(function (i) { return i.key === 'settings'; }));

    bar = document.createElement('nav');
    bar.className = 'aivm-bar'; bar.setAttribute('aria-label', 'App sections');
    bar.innerHTML = main.map(function (i) {
      return '<a class="aivm-it" href="' + esc(i.href) + '" data-k="' + esc(i.key) + '"><span class="i" aria-hidden="true">' + i.icon + '</span><span class="l">' + esc(i.label) + '</span></a>';
    }).join('') + '<button type="button" class="aivm-it" data-k="__more" aria-haspopup="dialog" aria-expanded="false"><span class="i" aria-hidden="true">' + ICON_MORE + '</span><span class="l">More</span></button>';
    document.body.appendChild(bar);
    moreBtn = bar.querySelector('[data-k="__more"]');

    scrim = document.createElement('div'); scrim.className = 'aivm-scrim';
    sheet = document.createElement('div'); sheet.className = 'aivm-sheet';
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'More');
    var rows = rest.map(function (i) {
      return '<button type="button" class="aivm-row" data-k="' + esc(i.key) + '"><span class="i" aria-hidden="true">' + i.icon + '</span>' + esc(i.label) + '</button>';
    }).join('');
    sheet.innerHTML = '<div class="aivm-grab" aria-hidden="true"></div>' +
      (rows ? '<h2>More sections</h2>' + rows + '<div class="aivm-sep"></div>' : '') +
      (hasSettings ? '<button type="button" class="aivm-row" data-k="__settings"><span class="i" aria-hidden="true">' + ICON_GEAR + '</span>Settings</button>' : '') +
      (document.querySelector('script[src*="connect.js"]') ? '<button type="button" class="aivm-row" data-k="__connect"><span class="i" aria-hidden="true">' + ICON_PLUG + '</span>Connections</button>' : '') +
      '<a class="aivm-row" href="../index.html"><span class="i" aria-hidden="true">' + ICON_BACK + '</span>Back to AI Verse</a>' +
      '<button type="button" class="aivm-row" data-k="__close"><span class="i" aria-hidden="true">' + ICON_X + '</span>Close</button>';
    document.body.appendChild(scrim); document.body.appendChild(sheet);

    bar.addEventListener('click', function (e) {
      var a = e.target.closest('.aivm-it'); if (!a) return;
      e.preventDefault();
      var k = a.getAttribute('data-k');
      if (k === '__more') { toggleSheet(true); return; }
      go(k);
    });
    sheet.addEventListener('click', function (e) {
      var r = e.target.closest('.aivm-row'); if (!r) return;
      var k = r.getAttribute('data-k');
      if (!k) return; // plain link (Back to AI Verse)
      e.preventDefault();
      toggleSheet(false);
      if (k === '__close') return;
      if (k === '__settings') { openSettings(); return; }
      if (k === '__connect') { if (window.AIVConnect) window.AIVConnect.open(); return; }
      go(k);
    });
    scrim.addEventListener('click', function () { toggleSheet(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('open')) toggleSheet(false); });
    return true;
  }

  function toggleSheet(open) {
    sheet.classList.toggle('open', open); scrim.classList.toggle('open', open);
    document.documentElement.classList.toggle('aivm-open', open);
    moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var f = sheet.querySelector('.aivm-row'); if (f) setTimeout(function () { f.focus(); }, 60); }
    else moreBtn.focus({ preventScroll: true });
  }

  function sync() {
    if (!bar) return;
    var k = activeKey(), inMain = false;
    bar.querySelectorAll('.aivm-it').forEach(function (a) {
      var on = a.getAttribute('data-k') === k; if (on) inMain = true;
      a.classList.toggle('on', on);
      if (a.tagName === 'A') { if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
    });
    if (!inMain) moreBtn.classList.add('on'); else moreBtn.classList.remove('on');
    sheet.querySelectorAll('.aivm-row[data-k]').forEach(function (r) { r.classList.toggle('on', r.getAttribute('data-k') === k); });
  }

  /* Turn on only when the app itself is in phone layout (its own bar sits at the bottom). */
  function phoneMode() {
    if (!origNav) return false;
    var root = document.documentElement, had = root.classList.contains('aivm');
    root.classList.remove('aivm');
    var s = getComputedStyle(origNav), r = origNav.getBoundingClientRect();
    var bottomBar = s.display !== 'none' && s.position === 'fixed' && r.top > innerHeight * 0.5 && r.width > innerWidth * 0.6;
    if (had && !bottomBar) root.classList.remove('aivm');
    return bottomBar;
  }
  function apply() { document.documentElement.classList.toggle('aivm', phoneMode()); sync(); }


  /* Move the "Get AIV key" banner below the page content and make it a small strip. */
  function promoToBottom() {
    var p = document.getElementById('aivPromo'); if (!p) return;
    var v = document.querySelector('.view'); var box = v && v.parentElement;
    if (box) box.appendChild(p);
    p.classList.add('aivp-sm');
    var b = p.querySelector('.t b'); if (b) b.textContent = 'Unlock full-strength AI';
  }
  function init() {
    try { promoToBottom(); } catch (e) {}
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    origNav = document.querySelector('.mtabs') || document.querySelector('nav.tabs');
    if (!origNav) return;
    if (!build()) return;
    apply();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(apply, 120); });
    window.addEventListener('hashchange', function () { setTimeout(sync, 30); });
    var mo = new MutationObserver(function () { sync(); });
    var list = Array.prototype.slice.call(document.querySelectorAll('.mtabs a[data-nav]')).concat(Array.prototype.slice.call(document.querySelectorAll('a[data-nav]')));
    list.forEach(function (a) { if (!a.closest('.aivm-bar')) mo.observe(a, { attributes: true, attributeFilter: ['class', 'aria-current'] }); });
  }
  if (document.readyState === 'complete') setTimeout(init, 0);
  else window.addEventListener('load', function () { setTimeout(init, 0); });
})();
