/* =====================================================================
   AI Verse — simple mobile navigation for the AI apps
   On phones (whenever an app would show its bottom tab bar) this:
   - gives every app the same black and white, spacious, app-like look
   - replaces the crowded tab bar with a floating tab pill (4 main tabs with
     icons and names) and a round More button
   - puts the other sections, Settings and Back to AI Verse in a More sheet
   - shows a simple app bar (name + settings), hides the AIV copilot button
     and the uses counter, and tidies the AIV key banner
   Add to each app:  <script src="../mobile.js" defer></script>
   ===================================================================== */
(function () {
  'use strict';
  if (window.__aivMobile) return; window.__aivMobile = true;

  var MAX_MAIN = 4;
  var css = "html.aivm{--bg:#fff;--card:#f5f5f6;--box:#fff;--line:#ececee;--ink:#0b0b0c;--muted:#6e6e73;--soft:#a0a0a6;--btn:#0b0b0c;--btn-ink:#fff;--r:20px;--kcal:var(--ink);--pro:var(--ink);--carb:var(--ink);--fat:var(--ink);--sleep:var(--ink);--lift:var(--ink);--water:var(--ink);--good:var(--ink);--good-bg:var(--card);--warn:var(--ink);--warn-bg:var(--card);--med:var(--muted);--panel:#fff;--panel2:#f5f5f6;--accent:#0b0b0c;--accent2:#f0f0f1;--accent-ink:#fff;--low:#6e6e73;--ok:#0b0b0c;--shadow:none;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent}@media (prefers-color-scheme:dark){html.aivm{--bg:#0b0b0c;--card:#18181a;--box:#0b0b0c;--line:#26262a;--ink:#f4f4f5;--muted:#9c9ca3;--soft:#6f6f76;--btn:#f4f4f5;--btn-ink:#0b0b0c;--panel:#0b0b0c;--panel2:#18181a;--accent:#f4f4f5;--accent2:#1f1f22;--accent-ink:#0b0b0c;--low:#9c9ca3;--ok:#f4f4f5}}html.aivm body{background:var(--bg)!important;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",Inter,\"Segoe UI\",Roboto,system-ui,sans-serif!important;font-size:15px;line-height:1.5;padding-bottom:calc(104px + env(safe-area-inset-bottom))!important}html.aivm h1,html.aivm h2,html.aivm h3,html.aivm .stat b,html.aivm #gate h3,html.aivm .logo{font-family:inherit!important}html.aivm a{color:inherit}html.aivm nav.tabs,html.aivm .mtabs,html.aivm #btnMenu,html.aivm #btnConnect,html.aivm #aivx-panel-host{display:none!important}html.aivm .badge:not(.off):not(.pill),html.aivm #aiBadge:not(.off){display:none!important}html.aivm #aiBadge.off{font-size:12px!important;padding:7px 12px!important;border-radius:999px;background:var(--card)!important;color:var(--muted)!important;border:0!important}html.aivm .shell{padding:0 24px 24px!important;margin:0 auto!important;border:0!important;max-width:640px}html.aivm main{padding:0 24px 24px!important}html.aivm .app{display:block!important}html.aivm header.top{position:sticky;top:0;z-index:20;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin:0 -24px 20px!important;padding:calc(16px + env(safe-area-inset-top)) 24px 12px!important;background:color-mix(in srgb,var(--bg) 86%,transparent);-webkit-backdrop-filter:saturate(1.6) blur(16px);backdrop-filter:saturate(1.6) blur(16px)}html.aivm header.top h1{font-size:21px!important;line-height:1.15!important;font-weight:700!important;letter-spacing:-.025em!important;margin:0!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}html.aivm header.top>div:first-child{min-width:0}html.aivm header.top .sub{display:none!important}html.aivm header.top .hdr-r{display:flex;align-items:center;gap:8px;flex:none}html.aivm .icon-btn{width:36px!important;height:36px!important;border:0!important;background:var(--card)!important;color:var(--ink)!important}html.aivm .topbar{margin:0 -24px 14px!important;padding:calc(14px + env(safe-area-inset-top)) 24px 10px!important;gap:10px!important;flex-wrap:nowrap!important;background:color-mix(in srgb,var(--bg) 86%,transparent)!important}html.aivm .cmd{border:0!important;background:var(--card)!important;box-shadow:none!important;border-radius:14px!important;min-height:44px;padding:3px 5px 3px 14px!important}html.aivm .cmd input{min-height:36px!important;background:none!important;padding:0!important}html.aivm .vh{margin:8px 0 28px!important;align-items:center!important}html.aivm .vh h1{font-size:24px!important;line-height:1.15!important;font-weight:700!important;letter-spacing:-.025em!important}html.aivm .vh .sub,html.aivm .sub{font-size:14px}html.aivm h2{font-size:16px!important;line-height:1.25!important;font-weight:650!important;letter-spacing:-.01em!important;margin:40px 0 16px!important}html.aivm .view>h2:first-child,html.aivm header.top+.view h2:first-child{margin-top:10px!important}html.aivm h3{font-size:15px!important;font-weight:600!important;letter-spacing:-.01em}html.aivm h4{font-size:12px!important;letter-spacing:.06em!important;margin:20px 0 8px!important}html.aivm .muted,html.aivm .hint,html.aivm .m,html.aivm .note{color:var(--muted)!important}html.aivm .grid,html.aivm .grid2,html.aivm .grid3,html.aivm .stats,html.aivm .tool-tiles{gap:16px!important}html.aivm .grid2,html.aivm .stats{margin-bottom:20px!important}html.aivm .stat,html.aivm .tile{background:var(--card)!important;border:0!important;border-radius:18px!important;padding:14px 14px 13px!important;box-shadow:none!important}html.aivm .stat b{font-size:24px!important;font-weight:700!important;letter-spacing:-.03em!important;line-height:1.1!important;margin-top:10px!important}html.aivm .acts .stat b,html.aivm .tile b{font-size:14px!important;letter-spacing:-.01em!important;margin-top:8px!important}html.aivm .stat .ic,html.aivm .tile .ic{width:18px!important;height:18px!important}html.aivm .stat .ic{color:var(--ink)!important;opacity:.9}html.aivm .stat>span:last-child,html.aivm .tile>span:last-child{font-size:12px!important;line-height:1.35!important;color:var(--muted)!important}html.aivm .box,html.aivm .card{background:var(--bg)!important;border:1px solid var(--line)!important;border-radius:18px!important;padding:16px!important;box-shadow:none!important}html.aivm .soft{background:var(--card)!important;border:0!important;border-radius:18px!important;padding:16px!important}html.aivm .card{margin-bottom:20px!important}html.aivm .box+.box,html.aivm .soft+.soft,html.aivm .box+.soft,html.aivm .soft+.box{margin-top:16px!important}html.aivm .item{border:0!important;background:var(--card)!important;border-radius:14px!important;padding:12px 14px!important}html.aivm .list{gap:12px!important}html.aivm .pill,html.aivm .chip{border-radius:999px!important}html.aivm .chips{gap:10px!important}html.aivm button.chip{min-height:32px;padding:5px 12px!important;font-size:13px!important;background:var(--bg);border:1px solid var(--line);color:var(--ink)}html.aivm .seg{padding:4px!important;gap:6px!important;border-radius:12px!important;margin-bottom:18px!important}html.aivm .seg button{font-size:12.5px!important;padding:6px 12px!important;border-radius:9px!important}html.aivm .row{gap:10px}html.aivm .row.wrap{row-gap:12px}html.aivm .btn{min-height:40px;border-radius:12px!important;padding:0 16px!important;font-size:14px!important;font-weight:600!important;border-color:var(--line)!important}html.aivm .btn.primary{background:var(--ink)!important;border-color:var(--ink)!important;color:var(--bg)!important}html.aivm .btn.sm{min-height:32px;border-radius:10px!important;padding:0 12px!important;font-size:13px!important}html.aivm .btn.ghost{border-color:transparent!important;background:transparent!important}html.aivm input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]),html.aivm select,html.aivm textarea{font-size:16px!important;border-radius:12px!important;border:1px solid transparent!important;background-color:var(--card)!important;color:var(--ink)!important;box-shadow:none!important}html.aivm input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]),html.aivm select{min-height:44px;padding:0 14px!important}html.aivm textarea{padding:13px 14px!important}html.aivm input:focus,html.aivm select:focus,html.aivm textarea:focus{border-color:var(--ink)!important;outline:0}html.aivm .cmd input,html.aivm .addbar input{background:none!important;border:0!important}html.aivm .mic-btn{width:34px!important;height:34px!important;border:0!important;background:var(--bg)!important;color:var(--ink)!important}html.aivm label{font-size:12.5px;margin-bottom:16px}html.aivm label.check{margin-bottom:12px}html.aivm dialog h2{margin-top:0!important}html.aivm dialog{border:0!important;border-radius:26px 26px 0 0!important;width:100vw!important;max-width:100vw!important;margin:auto 0 0!important;max-height:92vh;box-shadow:0 -12px 48px rgba(0,0,0,.22)!important}html.aivm dialog[open]{animation:aivm-up .26s cubic-bezier(.2,.8,.2,1)}html.aivm .dlg-b{padding:18px 20px calc(22px + env(safe-area-inset-bottom))!important}html.aivm .dlg-h{padding:18px 20px 12px!important;border:0!important}html.aivm .fd-in{padding:28px 22px calc(24px + env(safe-area-inset-bottom))!important}html.aivm .view.on{animation:aivm-in .22s ease!important}@keyframes aivm-in{from{opacity:0;transform:translateY(6px)}}@keyframes aivm-up{from{transform:translateY(40px);opacity:0}}.aivm-bar{display:none}html.aivm .aivm-bar{display:flex;position:fixed;left:20px;right:20px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:60;height:56px;gap:14px;align-items:center;font-family:inherit;pointer-events:none}.aivm-tabs{flex:1 1 auto;min-width:0;display:flex;align-items:center;justify-content:space-around;gap:6px;height:56px;padding:5px 10px;border-radius:999px;background:color-mix(in srgb,var(--bg,#fff) 84%,transparent);-webkit-backdrop-filter:saturate(1.8) blur(20px);backdrop-filter:saturate(1.8) blur(20px);border:1px solid var(--line,#ececee);box-shadow:0 10px 30px rgba(0,0,0,.10),0 1px 3px rgba(0,0,0,.05);pointer-events:auto}.aivm-it{flex:0 1 54px;min-width:0;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;border-radius:14px;background:transparent;color:var(--muted,#6e6e73);text-decoration:none;cursor:pointer;font-family:inherit;font-size:9.5px;font-weight:600;line-height:1;letter-spacing:.01em;padding:0 2px;transition:background .18s,color .18s,transform .12s;-webkit-tap-highlight-color:transparent}.aivm-it:active{transform:scale(.94)}.aivm-it .i{display:flex;width:19px;height:19px;flex:none;align-items:center;justify-content:center}.aivm-it .i svg{width:19px;height:19px}.aivm-it .l{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aivm-it.on{background:var(--card,#f5f5f6);color:var(--ink,#0b0b0c)}.aivm-it:focus-visible{outline:2px solid var(--ink,#111);outline-offset:2px}.aivm-more{flex:0 0 56px;width:56px;height:56px;border-radius:50%!important;background:var(--ink,#0b0b0c)!important;color:var(--bg,#fff)!important;box-shadow:0 10px 26px rgba(0,0,0,.22);pointer-events:auto}.aivm-more .i,.aivm-more .i svg{width:20px;height:20px}.aivm-more .l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.aivm-scrim{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.38);opacity:0;pointer-events:none;transition:opacity .2s}.aivm-scrim.open{opacity:1;pointer-events:auto}.aivm-sheet{position:fixed;left:0;right:0;bottom:0;z-index:71;background:var(--bg,#fff);color:var(--ink,#111);border-radius:26px 26px 0 0;padding:10px 14px calc(18px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .26s cubic-bezier(.2,.8,.2,1);max-height:82vh;overflow:auto;box-shadow:0 -12px 48px rgba(0,0,0,.2);font-family:inherit}.aivm-sheet.open{transform:none}.aivm-grab{width:38px;height:5px;border-radius:9px;background:var(--line,#e7e5e1);margin:2px auto 12px}html.aivm .aivm-sheet h2{font-family:inherit;font-size:12px!important;font-weight:600!important;line-height:1!important;letter-spacing:.07em!important;text-transform:uppercase;color:var(--muted,#6e6e73);margin:8px 10px 8px!important}.aivm-row{display:flex;align-items:center;gap:14px;width:100%;min-height:46px;margin:4px 0;padding:0 12px;border:0;border-radius:14px;background:transparent;color:inherit;text-decoration:none;font-family:inherit;font-size:15px;font-weight:500;line-height:1.2;text-align:left;cursor:pointer}.aivm-row:active,.aivm-row.on{background:var(--card,rgba(0,0,0,.05))}.aivm-row .i{display:flex;width:19px;height:19px;flex:none;align-items:center;justify-content:center}.aivm-row .i svg{width:19px;height:19px}.aivm-sep{height:1px;background:var(--line,#e7e5e1);margin:8px 10px}.aivpromo.aivp-sm{display:flex;flex-wrap:nowrap!important;align-items:center;gap:8px!important;max-width:560px;margin:32px auto 8px!important;padding:6px 6px 6px 16px!important;border-radius:999px!important;background:var(--card,#f4f3f1)!important;color:var(--ink,#111)!important;border:0;font-size:13px}.aivpromo.aivp-sm[hidden]{display:none!important}.aivpromo.aivp-sm .t{flex:1 1 auto!important;min-width:0!important;font-size:13px!important;line-height:1.3!important}.aivpromo.aivp-sm .t b{display:block;font-size:13px!important;font-weight:500!important;margin:0!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aivpromo.aivp-sm .t span{display:none!important}.aivpromo.aivp-sm a.go{background:var(--ink,#111)!important;color:var(--bg,#fff)!important;font-size:12.5px!important;padding:8px 14px!important;border-radius:99px!important;white-space:nowrap}.aivpromo.aivp-sm .add{font-size:12px!important;white-space:nowrap;color:inherit!important;opacity:.7;background:none!important;border:0!important;padding:4px!important;text-decoration:underline;cursor:pointer}.aivpromo.aivp-sm .x{color:inherit!important;opacity:.55;background:none!important;border:0!important;font-size:16px!important;padding:2px 6px!important;cursor:pointer}@media (max-width:420px){.aivpromo.aivp-sm .add{display:none!important}}@media (max-width:374px){.aivpromo.aivp-sm .t b{white-space:normal}html.aivm .aivm-bar{left:12px;right:12px;gap:10px}html.aivm .shell,html.aivm main{padding-left:18px!important;padding-right:18px!important}html.aivm header.top,html.aivm .topbar{margin-left:-18px!important;margin-right:-18px!important;padding-left:18px!important;padding-right:18px!important}.aivm-tabs{padding:5px 6px}}@media (prefers-reduced-motion:reduce){.aivm-it,.aivm-sheet,.aivm-scrim{transition:none}html.aivm .view.on,html.aivm dialog[open]{animation:none!important}}";

  var ICON_MORE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>';
  var ICON_PLUG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0V7z"/><path d="M12 17v5"/></svg>';
  var ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M20 4L4 20"/></svg>';

  var items = [], bar, sheet, scrim, moreBtn, origNav;

  function txt(el) { var c = el.cloneNode(true); c.querySelectorAll('.ico,svg').forEach(function (x) { x.remove(); }); c.querySelectorAll('*').forEach(function (x) { if (/^\s*\d+\s*$/.test(x.textContent)) x.remove(); }); return c.textContent.replace(/\s+/g, ' ').trim(); }
  function icon(el) { var i = el.querySelector('.ico'); return i ? i.innerHTML : ''; }
  function short(s) { s = String(s); return s.length > 11 ? s.split(/[\s&]+/)[0] : s; }
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
    bar.innerHTML = '<div class="aivm-tabs">' + main.map(function (i) {
      return '<a class="aivm-it" href="' + esc(i.href) + '" data-k="' + esc(i.key) + '"><span class="i" aria-hidden="true">' + i.icon + '</span><span class="l">' + esc(short(i.label)) + '</span></a>';
    }).join('') + '</div><button type="button" class="aivm-it aivm-more" data-k="__more" aria-label="More" aria-haspopup="dialog" aria-expanded="false"><span class="i" aria-hidden="true">' + ICON_MORE + '</span><span class="l">More</span></button>';
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
