/* =====================================================================
   AI Verse — legal notices for the apps
   - Adds a small footer with the app's disclaimer and Terms / Privacy links
   - Shows a one-time notice that must be acknowledged in apps that give
     money or health information (AI Stock and Finance, AI Health and Fitness)
   Add to each app:  <script src="../legal.js" defer></script>
   ===================================================================== */
(function () {
  'use strict';
  if (window.__aivLegal) return; window.__aivLegal = true;

  var base = new URL('../', document.currentScript ? document.currentScript.src : location.href).href;
  var terms = base + 'terms.html', privacy = base + 'privacy.html';
  var file = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
  var ALIAS = {'ai-personal-assistant':'personal-assistant-ai','ai-study-and-research':'study-and-research-ai','ai-stock-and-finance':'stock-and-finance-ai','ai-health-and-fitness':'health-and-fitness-ai','ai-photo':'photo-ai','ai-career':'career-ai'};
  file = ALIAS[file] || file;

  var NOTES = {
    'stock-and-finance-ai': 'For information and education only. Not investment, financial, tax or legal advice. AI Verse is not a broker or investment adviser. Forecasts are estimates, not promises, and you can lose money investing. Paper trading uses pretend money, and no real trades are ever placed.',
    'health-and-fitness-ai': 'General fitness and nutrition information only, not medical advice. Targets are estimates. Check with a doctor before starting a diet or exercise program. In an emergency, call 911.',
    'career-ai': 'AI can be wrong. Review everything before you send it and make sure it is true. Nothing is submitted without your approval. No job outcome is guaranteed.',
    'ai-music': 'Song picks come from AI and are checked against Apple\'s music catalog. Song details, artwork and previews are provided by Apple. Listen to full songs on your music service.',
    'photo-ai': 'Only use images you have the rights to. Don\'t create images of real people without their consent or images meant to deceive. AI images can resemble existing works.',
    'study-and-research-ai': 'AI can be wrong. Check facts and sources before you rely on them, and follow your school\'s rules on AI use.',
    'personal-assistant-ai': 'AI can be wrong. Check important dates, details and messages before relying on or sending them.',
    'aide': 'AI can be wrong. Check important dates, details and messages before relying on or sending them.'
  };
  var GATES = {
    'stock-and-finance-ai': {
      title: 'Before you start',
      points: [
        'This app gives general information and education. It is <b>not</b> investment, financial, tax or legal advice.',
        'AI Verse is not a broker, investment adviser or financial planner. Nothing here is a recommendation to buy or sell anything.',
        'Forecasts and AI reports are estimates from past data. They can be wrong. You can lose money investing.',
        'Without your own market-data key, prices are <b>simulated demo data</b>. Paper trading uses pretend money, and the app never places real trades.',
        'Make your own decisions, and talk to a licensed professional before acting.'
      ]
    },
    'health-and-fitness-ai': {
      title: 'Before you start',
      points: [
        '<b>In an emergency, call 911</b> or your local emergency number.',
        'This app gives general fitness and nutrition information. It is <b>not</b> medical advice and does not diagnose or treat any condition.',
        'Calorie, protein, water and workout targets are estimates and may not be right for you.',
        'Talk to a doctor before starting a diet or exercise program, especially if you are pregnant, under 18, have a medical condition or take medication.',
        'Stop and get medical help if you feel pain, dizziness or shortness of breath. You exercise at your own risk.'
      ]
    }
  };

  var css = '' +
    '.aivl-foot{max-width:900px;margin:28px auto 0;padding:16px 16px 24px;text-align:center;font:400 11.5px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--muted,#6e6c68)}' +
    '.aivl-foot a{color:inherit;text-decoration:underline;text-underline-offset:2px}' +
    '@media (max-width:820px){.aivl-foot{padding-bottom:96px}}' +
    '.aivl-scrim{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.aivl-card{background:var(--bg,#fff);color:var(--ink,#111);border:1px solid var(--line,#e7e5e1);border-radius:18px;max-width:520px;width:100%;max-height:calc(100vh - 32px);overflow:auto;padding:24px 24px 20px;box-shadow:0 24px 70px rgba(0,0,0,.3);font:400 14.5px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.aivl-card h2{margin:0 0 10px;font-size:20px;font-weight:650;letter-spacing:-.01em}' +
    '.aivl-card ul{margin:0;padding-left:20px}.aivl-card li{margin:7px 0}' +
    '.aivl-card .chk{display:flex;gap:10px;align-items:flex-start;margin:16px 0 0;font-size:14px;cursor:pointer}' +
    '.aivl-card .chk input{margin-top:3px;width:17px;height:17px;flex:none}' +
    '.aivl-card .row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:16px}' +
    '.aivl-card .lk{font-size:13px;color:var(--muted,#6e6c68)}.aivl-card .lk a{color:inherit}' +
    '.aivl-card button{font:600 14px/1 inherit;font-family:inherit;border-radius:99px;padding:11px 20px;border:0;cursor:pointer;background:var(--ink,#111);color:var(--bg,#fff)}' +
    '.aivl-card button:disabled{opacity:.4;cursor:not-allowed}' +
    '.aivl-card button:focus-visible,.aivl-card input:focus-visible{outline:2px solid var(--ink,#111);outline-offset:2px}';

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
    f.innerHTML = (NOTES[file] ? NOTES[file] + ' ' : 'AI can be wrong. Check important information. ') +
      '<br>' + (GUIDES[file] ? '<a href="' + base + GUIDES[file][0] + '">' + GUIDES[file][1] + '</a> · ' : '') + '<a href="' + base + 'index.html#apps">More free AI apps</a> · <a href="' + base + 'introducing-aiv-x.html">AIV X</a>' +
      '<br>© ' + new Date().getFullYear() + ' AI Verse · <a href="' + terms + '" target="_blank" rel="noopener">Terms</a> · <a href="' + privacy + '" target="_blank" rel="noopener">Privacy</a>';
    var nav = document.querySelector('nav.tabs');
    if (nav && nav.parentNode === document.body) document.body.insertBefore(f, nav); else document.body.appendChild(f);
  }

  function gate() {
    var g = GATES[file]; if (!g) return;
    var KEY = 'aivlegal.' + file + '.v1';
    if (store(KEY)) return;
    var scrim = document.createElement('div'); scrim.className = 'aivl-scrim';
    scrim.innerHTML = '<div class="aivl-card" role="dialog" aria-modal="true" aria-labelledby="aivlT">' +
      '<h2 id="aivlT">' + g.title + '</h2><ul>' + g.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
      '<label class="chk"><input type="checkbox" id="aivlC"> <span>I understand, and I agree to the <a href="' + terms + '" target="_blank" rel="noopener">Terms of Service</a>.</span></label>' +
      '<div class="row"><span class="lk"><a href="' + privacy + '" target="_blank" rel="noopener">Privacy Policy</a></span><button type="button" id="aivlB" disabled>Continue</button></div></div>';
    document.body.appendChild(scrim);
    var c = scrim.querySelector('#aivlC'), b = scrim.querySelector('#aivlB');
    var prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    c.addEventListener('change', function () { b.disabled = !c.checked; });
    b.addEventListener('click', function () { store(KEY, String(Date.now())); document.body.style.overflow = prev; scrim.remove(); });
    setTimeout(function () { c.focus(); }, 50);
  }

  function init() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    footer(); gate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
