/* =====================================================================
   AI Verse — legal notices for the apps
   - Adds a small footer with the app's disclaimer and Terms / Privacy links
   - The footer says that using the app means agreeing to the Terms
     (there is no separate "Before you start" page)
   Add to each app:  <script src="../legal.js" defer></script>
   ===================================================================== */
(function () {
  'use strict';
  if (window.__aivLegal) return; window.__aivLegal = true;

  var base = new URL('../', document.currentScript ? document.currentScript.src : location.href).href;
  var terms = base + 'terms.html', privacy = base + 'privacy.html';
  var file = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '').replace(/\.desktop$/i, '');
  var ALIAS = {'ai-personal-assistant':'personal-assistant-ai','ai-study-and-research':'study-and-research-ai','ai-stock-and-finance':'stock-and-finance-ai','ai-health-and-fitness':'health-and-fitness-ai','ai-photo':'photo-ai','ai-career':'career-ai'};
  file = ALIAS[file] || file;

  var NOTES = {
    'stock-and-finance-ai': 'Education only. Not financial advice. Demo prices unless you add a market-data key. No real trades.',
    'health-and-fitness-ai': 'General fitness information, not medical advice. In an emergency, call 911.',
    'career-ai': 'AI can be wrong. Review before you send.',
    'ai-music': 'Song details and previews by Apple.',
    'photo-ai': 'Only use images you have the rights to. No deceptive images of real people.',
    'study-and-research-ai': 'AI can be wrong. Check facts and sources.',
    'personal-assistant-ai': 'AI can be wrong. Check dates and messages.',
    'aide': 'AI can be wrong. Check dates and messages.'
  };
  var css = '' +
    '.aivl-foot{max-width:900px;margin:28px auto 0;padding:16px 16px 24px;text-align:center;font:400 11.5px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--muted,#6e6c68)}' +
    '.aivl-foot a{color:inherit;text-decoration:underline;text-underline-offset:2px}' +
    '@media (max-width:820px){.aivl-foot{padding-bottom:96px}}' +
    '.aivl-foot.aivl-short{margin:4px auto 0!important;padding:4px 16px 0!important;font-size:11px!important;line-height:1.4!important;opacity:.85}';

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var GUIDES = {
    'stock-and-finance-ai': ['ai-finance-and-career-tools.html', 'Guide: AI finance and career tools'],
    'career-ai': ['ai-finance-and-career-tools.html', 'Guide: AI finance and career tools'],
    'health-and-fitness-ai': ['ai-health-and-fitness-tools.html', 'Guide: AI health and fitness tools'],
    'study-and-research-ai': ['ai-tools-for-education-and-research.html', 'Guide: AI tools for education and research'],
    'personal-assistant-ai': ['build-a-personal-ai-assistant.html', 'Guide: build a personalized AI assistant'],
    'aide': ['build-a-personal-ai-assistant.html', 'Guide: build a personalized AI assistant'],
    'ai-music': ['build-a-personal-ai-assistant.html', 'Guide: build a personalized AI assistant'],
    'photo-ai': ['build-an-ai-app.html', 'Guide: build an AI app without code']
  };
  function footer() {
    var f = document.createElement('footer');
    f.className = 'aivl-foot'; f.setAttribute('role', 'contentinfo');
    // inside AIV X on a phone: just one short line (AIV X already covers the Terms and Privacy Policy)
    var inAivx = false; try { inAivx = window.top !== window.self; } catch (e) { inAivx = true; }
    if (inAivx && window.matchMedia && matchMedia('(max-width: 820px)').matches) {
      f.className += ' aivl-short'; f.textContent = 'AI can make mistakes.';
      var nv = document.querySelector('nav.tabs');
      if (nv && nv.parentNode === document.body) document.body.insertBefore(f, nv); else document.body.appendChild(f);
      return;
    }
    f.innerHTML = (NOTES[file] ? NOTES[file] + ' ' : 'AI can be wrong. Check important information. ') +
      '<br>' + (GUIDES[file] ? '<a href="' + base + GUIDES[file][0] + '">' + GUIDES[file][1] + '</a> · ' : '') + '<a href="' + base + 'index.html#apps">More free AI apps</a> · <a href="' + base + 'introducing-aiv-x.html">AIV X</a>' +
      '<br>By using this app you agree to the <a href="' + terms + '" target="_blank" rel="noopener">Terms</a> and <a href="' + privacy + '" target="_blank" rel="noopener">Privacy Policy</a>. © ' + new Date().getFullYear() + ' AI Verse';
    var nav = document.querySelector('nav.tabs');
    if (nav && nav.parentNode === document.body) document.body.insertBefore(f, nav); else document.body.appendChild(f);
  }

  function init() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    footer();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
