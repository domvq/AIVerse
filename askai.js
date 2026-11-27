/* =====================================================================
   Ask AI — a small "Ask <AI> about <tab>" box at the top of every tab in
   every AI Verse app. It answers using what's on that tab (and what the
   user typed there), through the app's own AI (window.AIV_APP.ai).
   Tabs that already have their own Ask box, and Settings, are left alone.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__aivAskAI) return; window.__aivAskAI = true;
  var slug = (location.pathname.split('/').pop() || '').replace(/\.desktop\.html$|\.html$/, '');
  var NICK = { 'ai-career': 'Climb', 'ai-health-and-fitness': 'Pulse', 'ai-music': 'Riff', 'ai-photo': 'Prism',
    'ai-stock-and-finance': 'Ticker', 'ai-study-and-research': 'Sage', 'ai-personal-assistant': 'Orbit' };
  var NAME = { 'ai-career': 'AI Career', 'ai-health-and-fitness': 'AI Health and Fitness', 'ai-music': 'AI Music', 'ai-photo': 'AI Photo and Video',
    'ai-stock-and-finance': 'AI Stock and Finance', 'ai-study-and-research': 'AI Study and Research', 'ai-personal-assistant': 'AI Personal Assistant' };
  var ROLE = { 'ai-career': 'career coach', 'ai-health-and-fitness': 'fitness and nutrition coach', 'ai-music': 'music guide', 'ai-photo': 'photo and art assistant',
    'ai-stock-and-finance': 'money advisor (education only, not financial advice)', 'ai-study-and-research': 'tutor and research guide', 'ai-personal-assistant': 'personal assistant' };
  var SUGGEST = {
    'ai-career': { resume: ['How can I make my resume stronger?', 'Write a summary for my target role'], jobs: ['Which jobs fit my skills?', 'How do I stand out when applying?'], tracker: ['What should I follow up on?', 'How long before I follow up?'], interview: ['Give me a practice question', 'How do I answer "tell me about yourself"?'], growth: ['What skills should I learn next?', 'Make me a 30-day plan'] },
    'ai-health-and-fitness': { training: ['Make today\'s workout easier', 'How many rest days do I need?'], body: ['How do I read my progress?', 'How often should I weigh in?'], nutrition: ['High-protein lunch ideas', 'How much protein do I need?'], analytics: ['What do my trends say?', 'What should I change this week?'] },
    'ai-music': { create: ['Ideas for a study playlist', 'What makes a good workout mix?'], playlists: ['Name my playlist', 'How should I order these songs?'], discover: ['Artists like the ones I love', 'A genre I should try'], blend: ['How do I blend two styles?', 'Songs that bridge rock and hip-hop'] },
    'ai-photo': { edit: ['How do I fix a dark photo?', 'Best edit for a portrait'], create: ['Give me a prompt idea', 'How do I describe a style?'], portrait: ['Tips for a better headshot', 'What background should I pick?'], social: ['Write a caption for this', 'Best size for Instagram'], library: ['How do I organize my photos?', 'Which photo should I post?'] },
    'ai-stock-and-finance': { markets: ['What moved the market today?', 'What is an index fund?'], research: ['What should I check before buying a stock?', 'Explain P/E ratio'], predict: ['How reliable are predictions?', 'What is volatility?'], portfolio: ['How diversified am I?', 'What is rebalancing?'], budget: ['Help me make a budget', 'Where can I cut spending?'] },
    'ai-study-and-research': { learn: ['Explain this topic simply', 'Quiz me on it'], papers: ['How do I read a paper fast?', 'What makes a study reliable?'], methods: ['Which statistical test should I use?', 'What is a control group?'], writing: ['How do I write a strong thesis?', 'Check my paragraph'] }
  };
  function app() { return window.AIV_APP; }
  function cur() { try { return app() && app().screen ? app().screen() : ''; } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function md(t) {
    var h = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>');
    var out = [], list = null;
    h.split(/\n/).forEach(function (line) {
      var m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/), hd = line.match(/^#{1,4}\s+(.*)/);
      if (m) { if (!list) { list = /^\s*\d/.test(line) ? 'ol' : 'ul'; out.push('<' + list + '>'); } out.push('<li>' + m[1] + '</li>'); return; }
      if (list) { out.push('</' + list + '>'); list = null; }
      if (hd) out.push('<p><b>' + hd[1] + '</b></p>'); else if (line.trim()) out.push('<p>' + line + '</p>');
    });
    if (list) out.push('</' + list + '>');
    return out.join('');
  }
  var css =
    '.aiv-ask{background:var(--box,#fff);border:1px solid var(--line,#e6e6e9);border-radius:var(--r,14px);padding:10px 10px 10px 14px;color:var(--ink,#111214)}' +
    '.aiv-ask form{display:flex;align-items:center;gap:8px;margin:0}' +
    '.aiv-ask .aiv-ic{display:inline-flex;flex:none;color:var(--muted,#6b6d72)}' +
    'html .aiv-ask.aiv-ask input.aiv-in:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]):not([data-aiv-x]){flex:1;min-width:0;border:0!important;border-color:transparent!important;background:transparent!important;background-color:transparent!important;box-shadow:none!important;padding:8px 0!important;margin:0!important;min-height:0!important;font:inherit;font-size:16px!important;color:inherit;outline:none;width:auto!important}' +
    '.aiv-ask button.aiv-go{flex:none;font:inherit;font-size:13.5px;font-weight:600;border-radius:99px;padding:8px 16px;border:1px solid var(--btn,#111214);background:var(--btn,#111214);color:var(--btn-ink,#fff);cursor:pointer;min-height:36px}' +
    '.aiv-ask button.aiv-go:disabled{opacity:.55;cursor:default}' +
    '.aiv-ask .aiv-sug{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 2px}' +
    '.aiv-ask .aiv-sug button{border:1px solid var(--line,#e6e6e9);background:transparent;color:var(--muted,#6b6d72);font:inherit;font-size:12.5px;padding:5px 11px;border-radius:99px;cursor:pointer}' +
    '.aiv-ask .aiv-out{margin:10px 4px 2px 0;font-size:14.5px;line-height:1.55;border-top:1px solid var(--line,#e6e6e9);padding-top:10px}' +
    '.aiv-ask .aiv-out p{margin:0 0 8px}.aiv-ask .aiv-out ul,.aiv-ask .aiv-out ol{margin:0 0 8px;padding-left:20px}.aiv-ask .aiv-out code{font-size:13px}' +
    '.aiv-ask .aiv-q{font-size:12.5px;color:var(--muted,#6b6d72);margin-bottom:6px}' +
    '.aiv-ask .aiv-acts{display:flex;gap:4px;margin-top:4px}' +
    '.aiv-ask .aiv-acts button{border:0;background:transparent;color:var(--muted,#6b6d72);font:inherit;font-size:12.5px;padding:4px 8px;cursor:pointer;border-radius:8px}' +
    '.aiv-ask .aiv-wait{color:var(--muted,#6b6d72);animation:aivp 1.2s ease-in-out infinite}' +
    '@keyframes aivp{50%{opacity:.4}}' +
    /* spacing on phones: the app's airy 54px gaps stay between sections, but a tab's title row and the Ask box sit snug at the top */
    'html.aivm .view>.aiv-ask.aiv-ask{margin:0 0 30px!important}' +
    'html.aivm .view>.aiv-ask.aiv-ask+*{margin-top:0!important}' +
    'html:not(.aivm) .view>.aiv-ask{margin:0 0 18px}' +
    /* phones: every Home AI sits at the top of the page as a single-line box, like AI Music (its title stays) */
    'html.aivm .view>h2.aiv-hometitle{margin:6px 0 10px!important}' +
    'html.aivm .view>.aiv-homeai.aiv-homeai{margin:0 0 30px!important;padding:8px 8px 8px 14px!important;background:var(--box)!important;border:1px solid var(--line)!important;border-radius:var(--r,14px)!important;box-shadow:none!important}' +
    'html.aivm .view>h2.aiv-hometitle+.aiv-homeai{margin-top:0!important}' +
    'html.aivm .view>.aiv-homeai+*{margin-top:0!important}' +
    'html.aivm .aiv-homeai .coach-head{display:none!important}' +
    'html.aivm .aiv-homeai .askbar{display:flex!important;align-items:center!important;gap:8px!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;min-height:0!important}' +
    'html.aivm .aiv-homeai .askbar input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]){flex:1;min-width:0;background:transparent!important;background-color:transparent!important;border:0!important;box-shadow:none!important;padding:8px 0!important;font-size:16px!important;min-height:0!important}' +
    'html.aivm .aiv-homeai .askbar .btn.primary,html.aivm .aiv-homeai .askbar button[type=submit],html.aivm .aiv-homeai .askbar button:last-child{border-radius:99px!important;padding:8px 16px!important;min-height:36px!important;font-size:13.5px!important}' +
    'html.aivm .aiv-homeai .aiv-ic{display:inline-flex;flex:none;color:var(--muted,#6b6d72)}' +
    'html.aivm .aiv-homeai .chat:not(:empty){margin:4px 0 10px}' +
    'html.aivm .aiv-homeai .note,html.aivm .aiv-homeai>p{margin:8px 0 2px!important;font-size:12px}' +
    /* AI Personal Assistant on phones: app name on top, then its Ask box in the same single-line style */
    'html.aivm .aiv-pahead{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top)) 0 0}' +
    'html.aivm .aiv-pahead h1{margin:0!important;font-size:15px!important;font-weight:700!important;display:flex;align-items:center;gap:6px}' +
    'html.aivm .aiv-pahead .aiv-nick{display:inline-flex;font-size:12px;font-weight:600;background:color-mix(in srgb,var(--ink,#111214) 13%,transparent);color:var(--muted,#6b6d72);padding:2px 9px;border-radius:999px}' +
    'html.aivm.aiv-pa .topbar{padding-top:10px!important}' +
    'html.aivm.aiv-pa .topbar .cmd{background:var(--box,#fff)!important;border:1px solid var(--line,#e6e6e9)!important;border-radius:var(--r,14px)!important;min-height:52px!important;padding:8px 8px 8px 14px!important;gap:8px!important}' +
    'html.aivm.aiv-pa .topbar .cmd input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]){font-size:16px!important;padding:8px 0!important;background:transparent!important;background-color:transparent!important;border:0!important;box-shadow:none!important}' +
    
    'html.aivm.aiv-pa .topbar .cmd .aiv-go{flex:none;font:inherit;font-size:13.5px;font-weight:600;border-radius:99px;padding:8px 16px;border:1px solid var(--btn,#111214);background:var(--btn,#111214);color:var(--btn-ink,#fff);cursor:pointer;min-height:36px}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  var SPARK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>';
  var memo = {};  // answers per tab, so they survive the tab redrawing itself

  function tabLabel(id) {
    // the name shown in the app's own navigation (shortest one wins: "Reminders & dates" over a longer link)
    var best = '';
    [].forEach.call(document.querySelectorAll('nav a[href="#' + id + '"],aside a[href="#' + id + '"],.tabs a[href="#' + id + '"],[data-go="' + id + '"]'), function (a) {
      var t = (a.innerText || a.textContent || '').replace(/[^\w&' -]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (t && t.length < 30 && (!best || t.length < best.length)) best = t;
    });
    return best || (id.charAt(0).toUpperCase() + id.slice(1));
  }
  function askLabel(id) {
    var nick = NICK[slug] || 'AI';
    if (id === 'home' || id === 'today') return 'Ask ' + nick + ' anything';
    return 'Ask ' + nick + ' about ' + tabLabel(id).toLowerCase().replace(/^ai\b/, 'AI');
  }
  function hasOwnAsk(view) {
    return [].some.call(view.querySelectorAll('input,textarea'), function (i) {
      return !i.closest('.aiv-ask') && /^ask\b/i.test(i.getAttribute('placeholder') || '');
    });
  }
  function globalAsk() {
    return [].some.call(document.querySelectorAll('input,textarea'), function (i) {
      return !i.closest('.view') && !i.closest('.aiv-ask') && !i.closest('#aivmAsk') && /^ask\b/i.test(i.getAttribute('placeholder') || '') && i.offsetParent !== null;
    });
  }
  function screenText(view) {
    var clone = view.cloneNode(true);
    [].forEach.call(clone.querySelectorAll('.aiv-ask,script,style,svg,button,select'), function (e) { e.remove(); });
    var txt = (clone.innerText || clone.textContent || '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 3000);
    var typed = [].map.call(view.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea'), function (i) {
      if (i.closest('.aiv-ask') || !i.value || !i.value.trim()) return '';
      return (i.getAttribute('aria-label') || i.getAttribute('placeholder') || 'Field') + ': ' + i.value.trim().slice(0, 9000);
    }).filter(Boolean).join('\n').slice(0, 12000);
    return { txt: txt, typed: typed };
  }
  function draw(box, id) {
    var m = memo[id] || {}, nick = NICK[slug] || 'AI', label = tabLabel(id);
    var sug = (SUGGEST[slug] && SUGGEST[slug][id]) || [];
    box.innerHTML =
      '<form autocomplete="off"><span class="aiv-ic">' + SPARK + '</span>' +
      '<input class="aiv-in" type="text" enterkeyhint="send" aria-label="' + esc(askLabel(id)) + '" placeholder="' + esc(askLabel(id)) + '" value="' + esc(m.draft || '') + '">' +
      '<button type="submit" class="aiv-go"' + (m.busy ? ' disabled' : '') + '>' + (m.busy ? 'Asking' : 'Ask') + '</button></form>' +
      (!m.q && !m.busy && sug.length ? '<div class="aiv-sug">' + sug.map(function (s, i) { return '<button type="button" data-s="' + i + '">' + esc(s) + '</button>'; }).join('') + '</div>' : '') +
      (m.busy ? '<div class="aiv-out"><div class="aiv-q">' + esc(m.q) + '</div><div class="aiv-wait">' + esc(nick === 'your assistant' ? 'Thinking' : nick + ' is thinking') + '…</div></div>' :
        m.a ? '<div class="aiv-out" aria-live="polite"><div class="aiv-q">' + esc(m.q) + '</div>' + md(m.a) +
          '<div class="aiv-acts"><button type="button" data-a="copy">Copy</button><button type="button" data-a="clear">Clear</button></div></div>' : '');
    var form = box.querySelector('form'), inp = box.querySelector('input');
    inp.oninput = function () { (memo[id] = memo[id] || {}).draft = inp.value; };
    form.onsubmit = function (e) { e.preventDefault(); ask(id, inp.value); };
    [].forEach.call(box.querySelectorAll('[data-s]'), function (b) { b.onclick = function () { ask(id, sug[+b.dataset.s]); }; });
    var cp = box.querySelector('[data-a=copy]'); if (cp) cp.onclick = function () { try { navigator.clipboard.writeText(m.a); cp.textContent = 'Copied'; } catch (e) {} };
    var cl = box.querySelector('[data-a=clear]'); if (cl) cl.onclick = function () { memo[id] = {}; draw(box, id); };
  }
  function redraw(id) {
    var v = document.getElementById('v-' + id), b = v && v.querySelector(':scope > .aiv-ask');
    if (b) draw(b, id); else refresh();
  }
  var DO_RE = /\b(make|build|create|generate|design|write|log|add|track|record|set|plan|schedule|start|quiz|test me|save|put|update|change|remove|delete|move|remind|book|turn|apply|edit|fix|brighten|darken|lighten|enhance|crop|rotate|blur|sharpen|adjust|increase|decrease|reduce|raise|lower|boost|switch|cancel|clear|find|search|compare|organize|prioritize|convert|translate|lose|gain|cut|bulk|tone|play|queue|start|stop|open|show me|take me|go to|buy|sell|invest|rebalance|budget|tailor|apply to|prep me|practice)\b/i;
  // requests phrased as asks ("can you…", "help me…", "I want to…") also go to the app's own AI, which can act or just answer
  var REQ_RE = /^\s*(please\s+|hey\s+\w+,?\s+)?(can|could|would|will)\s+you\b|\b(help me|i want|i'd like|i would like|i need|let's|lets|i'm trying to|im trying to)\b/i;
  function ask(id, q, extra) {
    q = String(q || '').trim(); if (!q) return;
    var a = app(); if (!a || !a.ai) return;
    var view = document.getElementById('v-' + id); if (!view) return;
    var m = memo[id] = { q: q, busy: true, draft: '' };
    redraw(id);
    var ctx = screenText(view), nick = NICK[slug] || 'the assistant', label = tabLabel(id);
    var system = 'You are ' + nick + ', the ' + (ROLE[slug] || 'assistant') + ' inside ' + (NAME[slug] || 'this AI Verse app') + '. The user is on the ' + label + ' tab and asked you a question there. ' +
      'Answer about that tab and what they are doing on it. Be brief, practical and specific: a short answer, then at most 5 bullet points or steps. ' +
      'Use what is on their screen and what they typed when it helps. If you need something they have not told you, ask one short question. Never make up facts, numbers, sources or quotes. No emojis.';
    var prompt = 'On screen (' + label + ' tab):\n' + (ctx.txt || '(empty)') + (ctx.typed ? '\n\nWhat the user typed on this tab:\n' + ctx.typed : '') + (extra ? '\n\n' + extra : '') + '\n\nQuestion: ' + q;
    // requests to DO something (build, log, add, plan…) go to the app's own AI, which can carry them out
    var doIt = typeof a.act === 'function' && !extra && (DO_RE.test(q) || REQ_RE.test(q));
    Promise.resolve().then(function () { return doIt ? a.act(q) : a.ai(prompt, { system: system, temp: 0.4, max: 1200 }); }).then(function (r) {
      m.busy = false; m.a = String(typeof r === 'string' ? r : (r && (r.text || r.reply)) || '').trim() || 'I could not get an answer. Try asking again.';
    }, function (e) {
      m.busy = false; m.a = (e && e.message) ? 'Sorry, that did not work: ' + e.message : 'Sorry, that did not work. Try again.';
    }).then(function () { redraw(id); if (doIt) setTimeout(function () { var nid = cur(); if (nid && nid !== id && nid !== 'settings') { memo[nid] = m; refresh(); redraw(nid); var v = document.getElementById('v-' + nid), b = v && v.querySelector(':scope > .aiv-ask'); if (b && b.offsetHeight) b.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, 700); });
  }
  function place(view, id) {
    var box = view.querySelector(':scope > .aiv-ask');
    if (box && box.dataset.id === id) return;
    if (box) box.remove();
    box = document.createElement('div'); box.className = 'aiv-ask'; box.dataset.id = id;
    var first = view.firstElementChild;
    var head = first && (first.tagName === 'H2' || (first.classList.contains('row') && first.querySelector(':scope > h2'))) ? first : null;
    if (head) head.after(box); else view.insertBefore(box, first);
    draw(box, id);
  }
  function phone() { return document.documentElement.classList.contains('aivm'); }
  // phones: move the Home AI (its title and box) to the top of the page and make it one line
  function arrangeHome(view) {
    var bar = view.querySelector('.askbar'); if (!bar) return;
    var card = bar.closest('.soft,.card,.box'); if (!card || card.parentElement !== view) return;
    var title = card.previousElementSibling && card.previousElementSibling.tagName === 'H2' ? card.previousElementSibling : null;
    card.classList.add('aiv-homeai'); if (title) title.classList.add('aiv-hometitle');
    if (!bar.querySelector('.aiv-ic')) { var ic = document.createElement('span'); ic.className = 'aiv-ic'; ic.innerHTML = SPARK; bar.insertBefore(ic, bar.firstChild); }
    // the move to the top is done by mobile.js, which lays out the phone Home page
  }
  function arrangeAssistant() {
    if (slug !== 'ai-personal-assistant') return;
    document.documentElement.classList.add('aiv-pa');
    var tb = document.querySelector('main > .topbar'); if (!tb) return;
    if (!document.querySelector('.aiv-pahead')) {
      var hd = document.createElement('div'); hd.className = 'aiv-pahead';
      hd.innerHTML = '<h1>AI Personal Assistant<span class="aiv-nick">Orbit</span></h1>';
      tb.parentNode.insertBefore(hd, tb);
    }
    var f = document.getElementById('cmdForm');
    if (f && !f.querySelector('.aiv-go')) { var b = document.createElement('button'); b.type = 'submit'; b.className = 'aiv-go'; b.textContent = 'Ask'; f.appendChild(b); }
    var inp = document.getElementById('cmdIn'); if (inp && inp.placeholder !== 'Ask Orbit anything') { inp.placeholder = 'Ask Orbit anything'; inp.setAttribute('aria-label', 'Ask Orbit anything'); }
  }
  var busy = false;
  function refresh() {
    if (busy) return; busy = true;
    try {
      if (phone()) arrangeAssistant();
      var id = cur(); if (!id || id === 'settings') return;
      var view = document.getElementById('v-' + id); if (!view || !view.classList.contains('on')) return;
      if (globalAsk()) return;
      if (hasOwnAsk(view)) { var old = view.querySelector(':scope > .aiv-ask'); if (old) old.remove(); if (phone() && (id === 'home' || id === 'today')) arrangeHome(view); return; }
      var box = view.querySelector(':scope > .aiv-ask');
      if (!box || box.dataset.id !== id) place(view, id);
    } finally { busy = false; }
  }
  var t = null;
  function soon() { clearTimeout(t); t = setTimeout(refresh, 60); }
  function start() {
    if (!app()) { setTimeout(start, 200); return; }
    refresh();
    new MutationObserver(function (list) {
      if (list.some(function (r) { return !(r.target.closest && r.target.closest('.aiv-ask')); })) soon();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    window.addEventListener('hashchange', soon);
  }
  // lets an app's own buttons (like AI Study's "Paper tools") ask through the same box
  window.AIVAsk = { run: function (q, extra) { var id = cur(); refresh(); ask(id, q, extra); var v = document.getElementById('v-' + id), b = v && v.querySelector(':scope > .aiv-ask'); if (b) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
