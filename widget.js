/*! AI Verse chat bubble — add to any website:
 *  <script src="https://YOUR-SITE/widget.js" data-bot="BOT_ID" data-color="#111111" defer></script>
 *  Optional: data-position="left", data-label="Chat with us"
 */
(function () {
  var s = document.currentScript;
  if (!s || window.__aivWidget) return;
  var id = s.getAttribute('data-bot');
  if (!id) return;
  window.__aivWidget = true;
  var color = /^#[0-9a-f]{6}$/i.test(s.getAttribute('data-color') || '') ? s.getAttribute('data-color') : '#111111';
  var side = s.getAttribute('data-position') === 'left' ? 'left' : 'right';
  var label = s.getAttribute('data-label') || 'Chat with us';
  var base = s.src.replace(/[^\/]*(\?.*)?$/, '');
  var origin = new URL(base).origin;
  function onColor(hex) {
    var n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return (.2126 * c[0] + .7152 * c[1] + .0722 * c[2]) > .4 ? '#111111' : '#ffffff';
  }
  var fg = onColor(color);
  var css = '' +
    '.aivw-btn{position:fixed;bottom:20px;' + side + ':20px;z-index:2147483000;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;background:' + color + ';color:' + fg + ';box-shadow:0 6px 24px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .15s}' +
    '.aivw-btn:hover{transform:scale(1.05)}.aivw-btn:focus-visible{outline:3px solid ' + color + ';outline-offset:3px}' +
    '.aivw-btn svg{width:26px;height:26px}' +
    '.aivw-box{position:fixed;bottom:90px;' + side + ':20px;z-index:2147483000;width:380px;height:min(620px,calc(100vh - 120px));border-radius:18px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.25);background:#fff;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .18s,transform .18s}' +
    '.aivw-box.open{opacity:1;transform:none;pointer-events:auto}' +
    '.aivw-box iframe{width:100%;height:100%;border:0;display:block}' +
    '@media (max-width:480px){.aivw-box{inset:0;width:100%;height:100%;border-radius:0;bottom:0}.aivw-box.open~.aivw-btn{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.aivw-box,.aivw-btn{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var box = document.createElement('div'); box.className = 'aivw-box'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', label);
  var btn = document.createElement('button'); btn.className = 'aivw-btn'; btn.type = 'button'; btn.setAttribute('aria-label', label); btn.setAttribute('aria-expanded', 'false');
  var chatIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  var closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  btn.innerHTML = chatIcon;
  var frame = null, open = false;
  function set(o) {
    open = o;
    if (o && !frame) { frame = document.createElement('iframe'); frame.title = label; frame.src = base + 'bot.html?id=' + encodeURIComponent(id) + '&embed=1'; box.appendChild(frame); }
    box.classList.toggle('open', o); btn.innerHTML = o ? closeIcon : chatIcon; btn.setAttribute('aria-expanded', String(o));
  }
  btn.addEventListener('click', function () { set(!open); });
  window.addEventListener('message', function (e) { if (e.origin === origin && e.data && e.data.type === 'aiv-close') { set(false); btn.focus(); } });
  document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') set(false); });
  function mount() { document.body.appendChild(box); document.body.appendChild(btn); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
