/* AI Verse — colored app logos + first-run "Get started" (info form + short tour) */
(function () {
  'use strict';
  var slug = (location.pathname.split('/').pop() || '').replace('.desktop', '').replace('.html', '');
  var base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/onboard\.js.*$/, '') : '../';
  var LOGO = base + 'assets/logos/' + slug + '.svg?v=1';

  var CONF = {
    'ai-career': {
      nick: 'Climb', role: 'your career coach', name: 'AI Career', career: true,
      steps: [
        { title: 'Where you are now', sub: 'Leave blank if not working', fields: [
          { path: 'profile.currentTitle', label: 'Current position', ph: 'Enter job title' },
          { path: 'profile.currentCompany', label: 'Current job', ph: 'Enter company or workplace' },
          { path: 'profile.skills', label: 'Skills', ph: 'Enter skills, separated by commas', area: 1 }
        ] },
        { title: 'What you want next', sub: 'Used to match jobs', fields: [
          { sel: '[data-prof="targetRoles"]', label: 'Target roles', ph: 'Enter target roles' },
          { sel: '[data-prof="locations"]', label: 'Location', ph: 'Enter city or region' },
          { sel: '[data-prof="remote"]', label: 'Work style', half: 1 },
          { sel: '[data-prof="years"]', label: 'Years of experience', ph: 'Enter years', half: 1, type: 'number' }
        ] }
      ],
      tour: [
        ['resume', 'Resume', 'Build and tailor your resume.'],
        ['jobs', 'Jobs', 'Find jobs matched to you.'],
        ['tracker', 'Tracker', 'Track every application.'],
        ['interview', 'Interview', 'Practice with an AI interviewer.']
      ]
    },
    'ai-health-and-fitness': {
      nick: 'Pulse', role: 'your fitness coach', name: 'AI Health and Fitness', health: true,
      steps: [
        { title: 'About you', sub: 'Used to set your targets', fields: [
          { sel: '[data-prof="units"]', label: 'Units', half: 1 },
          { sel: '[data-prof="sex"]', label: 'Sex', half: 1 },
          { sel: '[data-prof="age"]', label: 'Age', ph: 'Enter age', half: 1, type: 'number' },
          { sel: '[data-prof="weight"]', label: 'Weight', ph: 'Enter weight', half: 1, type: 'number', unit: 'w' },
          { sel: '[data-prof="height"]', label: 'Height', type: 'number', unit: 'h' }
        ] },
        { title: 'Your training', sub: 'Used to build your plan', fields: [
          { sel: '[data-prof="goal"]', label: 'Goal' },
          { sel: '[data-prof="level"]', label: 'Experience', half: 1 },
          { sel: '[data-prof="days"]', label: 'Days per week', half: 1 },
          { sel: '[data-prof="mode"]', label: 'Train at' }
        ] }
      ],
      tour: [
        ['training', 'Training', 'Your plan updates as you progress.'],
        ['body', 'Body', 'Log weight and measurements.'],
        ['nutrition', 'Nutrition', 'Snap a meal to count calories.'],
        ['analytics', 'Analytics', 'See your progress over time.']
      ]
    },
    'ai-music': {
      nick: 'Riff', role: 'your music guide', name: 'AI Music', music: true,
      steps: [
        { title: 'Your taste', sub: 'Separate each one with a comma', fields: [
          { path: 'profile.favGenres', label: 'Genres', ph: 'Enter genres you like' },
          { path: 'profile.favArtists', label: 'Artists', ph: 'Enter artists you like' },
          { path: 'profile.favSongs', label: 'Songs', ph: 'Enter songs you like' },
          { path: 'profile.favAlbums', label: 'Albums', ph: 'Enter albums you like' }
        ] }
      ],
      tour: [
        ['create', 'Create', 'Make a playlist from a song or vibe.'],
        ['playlists', 'Playlists', 'All your saved playlists.'],
        ['discover', 'Discover', 'Find artists like the ones you love.'],
        ['blend', 'Blend', 'Mix a playlist with friends.']
      ]
    },
    'ai-personal-assistant': {
      nick: 'Orbit', role: 'your daily planner', name: 'AI Personal Assistant',
      steps: [
        { title: 'About you', sub: 'Helps plan your day', fields: [
          { sel: '[data-set="name"]', label: 'Your name', ph: 'Enter your name' },
          { sel: '[data-set="workStart"]', label: 'Day starts', half: 1, type: 'time' },
          { sel: '[data-set="workEnd"]', label: 'Day ends', half: 1, type: 'time' }
        ] },
        { title: 'Your days', sub: 'What a normal day looks like', fields: [
          { path: 'settings.dailyActivities', label: 'Daily activities', ph: 'Enter things you do most days, like gym at 7am or class 10 to 2', area: 1 },
          { path: 'settings.notes', label: 'Notes', ph: 'Enter anything your assistant should know', area: 1 }
        ] },
        { title: 'This month', sub: 'Big plans and dates coming up', fields: [
          { path: 'settings.monthPlans', label: 'Plans for the month', ph: 'Enter plans, trips, deadlines or events', area: 1 }
        ] }
      ],
      tour: [
        ['today', 'Today', 'Your day at a glance.'],
        ['planner', 'Planner', 'Plan your day in one tap.'],
        ['tasks', 'Tasks', 'Keep track of to-dos.'],
        ['reminders', 'Reminders', 'Never miss a date.']
      ],
      home: 'today'
    },
    'ai-photo': {
      nick: 'Prism', role: 'your creative studio', name: 'AI Photo and Art',
      steps: [],
      tour: [
        ['edit', 'Edit', 'Describe the change you want.'],
        ['create', 'Create', 'Turn words into art.'],
        ['portrait', 'Portrait', 'Make pro headshots.'],
        ['social', 'Social', 'Design posts in seconds.']
      ]
    },
    'ai-stock-and-finance': {
      nick: 'Ticker', role: 'your money advisor', name: 'AI Stock and Finance', barSub: 'Your info, then live prices',
      steps: [
        { title: 'About you', sub: 'Used to tailor your insights', fields: [
          { sel: '[data-prof="name"]', label: 'Your name', ph: 'Enter your name' },
          { sel: '[data-prof="age"]', label: 'Age', ph: 'Enter age', half: 1, type: 'number' },
          { sel: '[data-prof="income"]', label: 'Monthly income', ph: 'Enter income', half: 1, type: 'number' },
          { sel: '[data-prof="risk"]', label: 'Risk', half: 1 },
          { sel: '[data-prof="horizon"]', label: 'Time horizon', half: 1 },
          { sel: '[data-prof="experience"]', label: 'Experience' }
        ] },
        { key: 1, title: 'Turn on live prices', sub: 'Recommended' }
      ],
      tour: [
        ['markets', 'Markets', 'Live prices and news.'],
        ['research', 'Research', 'Analyze any stock.'],
        ['portfolio', 'Portfolio', 'Track holdings and paper trade.'],
        ['budget', 'Budget', 'Upload a statement to budget.']
      ]
    },
    'ai-study-and-research': {
      nick: 'Sage', role: 'your study tutor', name: 'AI Study and Research', study: true,
      steps: [
        { title: 'What to learn', sub: 'Your tutor starts here', fields: [
          { path: 'profile.level', label: 'Learning level', opts: [['', 'Select'], ['Beginner', 'Beginner'], ['Intermediate', 'Intermediate'], ['Advanced', 'Advanced']] },
          { path: 'profile.learnTopic', label: 'Topic you want to learn', ph: 'Enter study topic' }
        ] },
        { title: 'Your strengths', sub: 'So lessons fit you', fields: [
          { path: 'profile.strongTopics', label: 'Topics you are good at', ph: 'Enter topics, separated by commas', area: 1 },
          { path: 'profile.weakTopics', label: 'Topics you struggle with', ph: 'Enter topics, separated by commas', area: 1 }
        ] }
      ],
      tour: [
        ['learn', 'Learn', 'Enter any topic to start learning.'],
        ['papers', 'Papers', 'Read and break down papers.'],
        ['methods', 'Methods', 'Plan experiments step by step.'],
        ['writing', 'Writing', 'Practice scientific writing.']
      ]
    }
  };
  var C = CONF[slug];
  if (!C) return;
  var KEY = 'aiv.onboard.' + slug + '.v1';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return 'done'; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} if (v === 'done' || v === 'dismissed') remember(); }
  /* also keep it in the app's own saved data, which syncs with the user's account, so the same person never sees it again on another device */
  function remember() {
    try {
      var a = window.AIV_APP; if (!a || !a.S) return;
      if (a.S.onboard && a.S.onboard.seen) return;
      a.S.onboard = { seen: true, at: Date.now() };
      localStorage.setItem(a.key, JSON.stringify(a.S));
      if (a.reload) a.reload();
    } catch (e) {}
  }
  function seenBefore() { try { var a = window.AIV_APP; return !!(a && a.S && a.S.onboard && a.S.onboard.seen); } catch (e) { return false; } }

  var css = '' +
    '.logo.aiv-logo{background:none!important;padding:0!important;border:0!important;overflow:hidden;display:inline-flex;align-items:center;justify-content:center}' +
    '.logo.aiv-logo img{width:100%;height:100%;display:block;border-radius:inherit}' +
    '.aivob-bar{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:2px 12px;margin:10px 16px 14px;padding:14px 16px;border:1px solid var(--line,#e6e6e9);border-radius:14px;background:var(--panel2,var(--box,#fff));color:var(--ink,#111214);font-family:inherit}' +
    '.aivob-bar img{grid-row:1/3;width:40px;height:40px;border-radius:11px;flex:none}' +
    '.aivob-bar .ob-bt{grid-column:2;font-weight:700;font-size:14.5px;line-height:1.25;min-width:0}' +
    '.aivob-bar .ob-bs{grid-column:2;font-size:13px;color:var(--muted,#6b6d72);line-height:1.3;min-width:0}' +
    '.aivob-bar .ob-ba{grid-column:3;grid-row:1/3;display:flex;align-items:center;gap:4px}' +
    'html .aivob-bar .ob-go{font:inherit;font-size:13px;font-weight:600;border-radius:99px;padding:8px 15px;cursor:pointer;border:1px solid var(--btn,#111214);background:var(--btn,#111214);color:var(--btn-ink,#fff);white-space:nowrap;min-height:36px}' +
    '.aivob-bar .ob-later{font:inherit;font-size:13px;font-weight:500;border:0;background:transparent;color:var(--muted,#6b6d72);padding:8px 10px;cursor:pointer;white-space:nowrap;min-height:36px}' +
    '.aiv-nick{display:inline-block;margin-left:8px;padding:2px 9px;border-radius:999px;background:#f1f1f1;color:#444;font-size:12px;font-weight:600;line-height:1.5;vertical-align:middle;letter-spacing:0;font-family:inherit}' +
    '.aivob-bar img{width:26px;height:26px;border-radius:7px;flex:none}' +
    '.aivob-bar b{flex:1;font-weight:600}' +
    '.aivob-bar .ob-go{background:#111;color:#fff;border:0;border-radius:999px;padding:8px 14px;font:600 13px inherit;cursor:pointer;min-height:36px}' +
    '.aivob-bar .ob-x{background:none;border:0;color:#888;font-size:18px;width:36px;height:36px;cursor:pointer}' +
    '.aivob{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);font-family:inherit;color:#111}' +
    '.aivob.tour{background:rgba(0,0,0,.18)}' +
    '.aivob *,.aivob *::before{box-sizing:border-box}html.aivm .aivob h2,html.aivm .aivob p,html.aivm .aivob label,html.aivm .aivob form,html.aivm .aivob input,html.aivm .aivob select,html.aivm .aivob button,html.aivm .aivob .ob-grid,.aivob h2,.aivob p,.aivob label,.aivob form,.aivob input,.aivob select,.aivob button,.aivob .ob-grid{margin:0!important}.aivob button{opacity:1!important;filter:none!important;text-transform:none!important;letter-spacing:normal!important}' +
    '.aivob .ob-card{margin:0!important;background:#fff;width:min(440px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;border-radius:22px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25)}' +
    '.aivob .ob-hd{display:flex!important;align-items:center;gap:12px;margin:0 0 18px!important;padding:0!important}' +
    '.aivob .ob-hd img{width:48px;height:48px;border-radius:13px}' +
    'html .aivob h2,.aivob h2{font-size:20px!important;line-height:1.2!important;font-weight:700;letter-spacing:-.01em}' +
    '.aivob .ob-nick{font-size:13px;font-weight:600;color:#111;margin-top:2px}' +
    '.aivob .ob-card{position:relative}.aivob .ob-all{position:absolute!important;top:12px;right:14px;width:auto!important;background:none!important;border:0!important;color:#6b6b6b!important;font:500 13px inherit;cursor:pointer;padding:6px 4px!important;min-height:36px;box-shadow:none!important}' +
    '.aivob .ob-sub2{font-size:13px;color:#6b6b6b;margin:-2px 0 12px}' +
    '.aivob textarea{font:16px inherit;color:#111;background:#f5f5f5;border:1px solid transparent;border-radius:12px;padding:11px 12px;width:100%;box-sizing:border-box;resize:vertical;min-height:72px;margin:0!important}' +
    '.aivob textarea:focus{outline:none;border-color:#111;background:#fff}' +
    '.aivob .ob-link{display:flex;align-items:center;justify-content:center;margin-top:14px;min-height:46px;border-radius:999px;border:1px solid #111;color:#111;text-decoration:none;font:600 15px inherit}' +
    '.aivob .ob-msg{font-size:13px;color:#b42318;min-height:1.2em;margin:8px 0 0!important}' +
    '.aivob .ob-sub{font-size:13px;color:#6b6b6b;margin-top:2px}' +
    '.aivob .ob-grid{display:grid!important;grid-template-columns:1fr 1fr;gap:14px 12px!important}' +
    '.aivob label{display:flex!important;padding:0!important;line-height:1.2!important;text-transform:none!important;flex-direction:column;gap:5px;font-size:12px;font-weight:600;color:#555;grid-column:span 2}' +
    '.aivob label.h{grid-column:span 1}' +
    '.aivob input,.aivob select{font:16px inherit;color:#111;background:#f5f5f5;border:1px solid transparent;border-radius:12px;padding:11px 12px;min-height:44px;width:100%;box-sizing:border-box}' +
    '.aivob input:focus,.aivob select:focus{outline:none;border-color:#111;background:#fff}' +
    '.aivob .ob-two{display:flex;gap:8px}' +
    '.aivob .ob-acts{display:flex;gap:10px;margin-top:18px;align-items:center}' +
    '.aivob .ob-acts .ob-p{flex:1;background:#111;color:#fff;border:0;border-radius:999px;min-height:46px;font:600 15px inherit;cursor:pointer}' +
    '.aivob .ob-acts .ob-s{background:none;border:0;color:#6b6b6b;font:500 14px inherit;min-height:46px;padding:0 12px;cursor:pointer}' +
    '.aivob .ob-step{font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}' +
    '.aivob .ob-tt{font-size:22px;font-weight:700;margin:0 0 6px}' +
    '.aivob .ob-tx{font-size:15px;color:#444;margin:0}' +
    '.aivob .ob-dots{display:flex;gap:6px;margin-top:16px}' +
    '.aivob .ob-dots i{width:7px;height:7px;border-radius:50%;background:#ddd}' +
    '.aivob .ob-dots i.on{background:#111;width:18px;border-radius:4px}' +
    '.aivob-hl{outline:3px solid #111!important;outline-offset:3px;border-radius:10px;position:relative;z-index:2147482999}' +
    '@media (prefers-color-scheme:dark){' +
      '.aivob{color:#ececee;background:rgba(0,0,0,.55)}.aivob.tour{background:rgba(0,0,0,.3)}' +
      '.aivob .ob-card{background:#2a2b30;box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
      '.aivob .ob-nick,.aivob .ob-tt{color:#ececee}.aivob .ob-tx{color:#c9cbd0}.aivob .ob-sub,.aivob .ob-sub2,.aivob .ob-step{color:#a1a3a8}' +
      '.aivob label{color:#c9cbd0}.aivob .ob-all,.aivob .ob-acts .ob-s{color:#a1a3a8!important}' +
      'html .aivob.aivob input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]),html .aivob.aivob select,html .aivob.aivob textarea{background-color:#3a3b41!important;color:#ececee!important;border-color:transparent!important}.aivob input::placeholder,.aivob textarea::placeholder{color:#8e9096}' +
      '.aivob input:focus,.aivob select:focus,.aivob textarea:focus{background:#44454c;border-color:#8e9096}' +
      '.aivob .ob-acts .ob-p{background:#c9cbd0;color:#111214}.aivob .ob-link{border-color:#ececee;color:#ececee}' +
      '.aivob .ob-dots i{background:#4a4b52}.aivob .ob-dots i.on{background:#ececee}.aivob-hl{outline-color:#ececee!important}' +
            '.aiv-nick{background:#2a2b30;color:#c9cbd0}' +
      'html .aivob-bar .ob-go{background:#ececee!important;border-color:#ececee!important;color:#111214!important}.aivob-bar{background:#1b1b1e;border-color:#2c2c31}' +
    '}' +
    '@media (max-width:820px){.aivob{align-items:flex-end}.aivob .ob-card{width:100%;border-radius:22px 22px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom))}.aivob.tour .ob-card{margin:0}}';
  if (slug === 'ai-stock-and-finance') css += '#demoBar.setupbar{display:none!important}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* colored logo in the app's brand mark */
  function logos() {
    var ls = document.querySelectorAll('.logo');
    for (var i = 0; i < ls.length; i++) {
      if (ls[i].classList.contains('aiv-logo')) continue;
      ls[i].classList.add('aiv-logo');
      ls[i].innerHTML = '<img src="' + LOGO + '" alt="">';
    }
  }

  function nickTags() {
    var ts = document.querySelectorAll('.side-brand b, .brand b, html.aivm header.top h1');
    for (var i = 0; i < ts.length; i++) {
      if (ts[i].querySelector('.aiv-nick')) continue;
      var t = document.createElement('span'); t.className = 'aiv-nick'; t.textContent = C.nick; t.title = C.nick + ', ' + C.role;
      ts[i].appendChild(t);
    }
  }
  function app() { return window.AIV_APP || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function imperial(f) { var u = f.querySelector('[data-k="0"]'); return C.health && u && u.value === 'imperial' && u.closest('[data-step]'); }
  function getPath(p) { var a = app(); if (!a || !a.S) return ''; var o = a.S; var ks = p.split('.'); for (var i = 0; i < ks.length; i++) { if (o == null) return ''; o = o[ks[i]]; } return o == null ? '' : o; }
  function setPath(p, v) { var a = app(); if (!a || !a.S) return; var o = a.S; var ks = p.split('.'); for (var i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = v; }

  function buildForm(fields) {
    var h = '<div class="ob-grid">';
    fields.forEach(function (fd, i) {
      var cls = fd.half ? ' class="h"' : '';
      if (fd.path) {
        var cur = getPath(fd.path);
        if (fd.opts) {
          h += '<label' + cls + '><span>' + esc(fd.label) + '</span><select data-k="' + i + '">' + fd.opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
        } else if (fd.area) {
          h += '<label' + cls + '><span>' + esc(fd.label) + '</span><textarea data-k="' + i + '" rows="3" placeholder="' + esc(fd.ph || '') + '">' + esc(cur) + '</textarea></label>';
        } else {
          h += '<label' + cls + '><span>' + esc(fd.label) + '</span><input data-k="' + i + '" type="text" placeholder="' + esc(fd.ph || '') + '" value="' + esc(cur) + '"></label>';
        }
        return;
      }
      var src = document.querySelector(fd.sel); if (!src) return;
      if (src.tagName === 'SELECT') {
        var opts = '';
        for (var j = 0; j < src.options.length; j++) {
          var o = src.options[j];
          opts += '<option value="' + esc(o.value) + '"' + (o.value === src.value ? ' selected' : '') + '>' + esc(o.value === '' ? 'Select' : o.textContent) + '</option>';
        }
        h += '<label' + cls + '><span>' + esc(fd.label) + '</span><select data-k="' + i + '">' + opts + '</select></label>';
      } else if (fd.unit === 'h') {
        h += '<label' + cls + ' data-height><span>' + esc(fd.label) + ' <span data-hu></span></span><div class="ob-two" data-himp><input data-ft type="number" inputmode="numeric" placeholder="Enter feet"><input data-in type="number" inputmode="decimal" placeholder="Enter inches"></div><input data-k="' + i + '" data-hmet type="number" inputmode="decimal" placeholder="Enter centimeters"></label>';
      } else {
        var t = fd.type || src.type || 'text';
        h += '<label' + cls + '><span>' + esc(fd.label) + (fd.unit === 'w' ? ' <span data-wu></span>' : '') + '</span><input data-k="' + i + '" type="' + t + '"' + (t === 'number' ? ' inputmode="decimal"' : '') + ' placeholder="' + esc(fd.ph || '') + '" value="' + esc(src.value) + '"></label>';
      }
    });
    return h + '</div>';
  }

  function syncUnits(card) {
    if (!C.health) return;
    var imp = !!imperial(card);
    var hi = card.querySelector('[data-himp]'), hm = card.querySelector('[data-hmet]');
    if (hi) hi.style.display = imp ? 'flex' : 'none';
    if (hm) hm.style.display = imp ? 'none' : 'block';
    var hu = card.querySelector('[data-hu]'), wu = card.querySelector('[data-wu]');
    if (hu) hu.textContent = imp ? '(ft, in)' : '(cm)';
    if (wu) wu.textContent = imp ? '(lb)' : '(kg)';
  }

  function prefillHeight(card) {
    var src = document.querySelector('[data-prof="height"]'); var v = src && parseFloat(src.value);
    if (!v || !card.querySelector('[data-ft]')) return;
    var srcU = document.querySelector('[data-prof="units"]');
    if (srcU && srcU.value === 'imperial') { card.querySelector('[data-ft]').value = Math.floor(v / 12); card.querySelector('[data-in]').value = Math.round(v % 12); }
    else card.querySelector('[data-hmet]').value = v;
  }

  function list(v) { return String(v || '').split(/[,\n]+/).map(function (x) { return x.trim(); }).filter(Boolean); }

  /* app-specific extras so the app itself uses what they entered */
  function extras() {
    var a = app(); if (!a || !a.S) return; var S = a.S;
    if (C.music && S.taste) {
      S.taste.artists = S.taste.artists || {}; S.taste.genres = S.taste.genres || {};
      list(S.profile && S.profile.favArtists).forEach(function (n) { if (!(S.taste.artists[n] > 3)) S.taste.artists[n] = 3; });
      list(S.profile && S.profile.favGenres).forEach(function (n) { var g = n.toLowerCase(); if (!(S.taste.genres[g] > 3)) S.taste.genres[g] = 3; });
    }
    if (C.study && S.profile && S.tutor) { if (S.profile.level) S.tutor.lvl = S.profile.level; }
    if (C.career && S.resume && S.profile) {
      var sk = list(S.profile.skills); if (sk.length && !(S.resume.skills || []).length) S.resume.skills = sk;
    }
  }
  function prefill() {
    var a = app(); if (!a || !a.S || !a.S.profile) return;
    if (C.study) {
      var t = document.getElementById('hTopic'); if (t && !t.value && a.S.profile.learnTopic) t.value = a.S.profile.learnTopic;
      var l = document.getElementById('hLvl'); if (l && a.S.profile.level) l.value = a.S.profile.level;
    }
  }

  function apply(card, fields) {
    var a = app(), touched = false;
    fields.forEach(function (fd, i) {
      if (fd.path) {
        var el0 = card.querySelector('[data-k="' + i + '"]'); if (!el0) return;
        setPath(fd.path, String(el0.value).trim()); touched = true; return;
      }
      var src = document.querySelector(fd.sel); if (!src) return;
      var v;
      if (fd.unit === 'h') {
        if (imperial(card)) {
          var ft = parseFloat(card.querySelector('[data-ft]').value) || 0, inch = parseFloat(card.querySelector('[data-in]').value) || 0;
          v = (ft || inch) ? String(Math.round((ft * 12 + inch) * 10) / 10) : '';
        } else v = card.querySelector('[data-hmet]').value;
      } else {
        var el = card.querySelector('[data-k="' + i + '"]'); if (!el) return; v = el.value;
      }
      if (src.tagName !== 'SELECT' && String(v).trim() === '') return;
      src.value = v;
      try { src.dispatchEvent(new Event(src.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); } catch (e) {}
    });
    if (touched && a && a.S) { extras(); try { localStorage.setItem(a.key, JSON.stringify(a.S)); } catch (e) {} }
    try { if (a && a.reload) a.reload(); } catch (e) {}
    prefill();
  }

  function applyKey(card) {
    var k = card.querySelector('[data-key]'); var v = k ? k.value.trim() : '';
    if (!v) return false;
    var src = document.querySelector('[data-set="finnhubKey"]'); if (!src) return false;
    src.value = v; try { src.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    try { var a = app(); if (a && a.reload) a.reload(); } catch (e) {}
    return true;
  }

  var ov = null, hl = null, rebuild = false;
  function close() { if (hl) { hl.classList.remove('aivob-hl'); hl = null; } if (ov) { ov.remove(); ov = null; } }
  function go(v) { try { var a = app(); if (a && a.go) { a.go(v); return; } } catch (e) {} location.hash = v; }

  function tour(i) {
    var steps = C.tour;
    if (!ov) { ov = document.createElement('div'); document.body.appendChild(ov); }
    if (i >= steps.length) { close(); set('done'); removeBar(); go(C.home || 'home'); setTimeout(prefill, 80); try { window.scrollTo(0, 0); } catch (e) {} return; }
    var s = steps[i];
    go(s[0]);
    if (rebuild && C.health) {
      rebuild = false;
      setTimeout(function () { try { var el = document.querySelector('[data-pq="days"]'), a = app(); if (el && a && a.S) { el.value = String(a.S.profile.days); el.dispatchEvent(new Event('change', { bubbles: true })); } } catch (e) {} }, 60);
    }
    if (hl) hl.classList.remove('aivob-hl');
    hl = document.querySelector('nav a[href="#' + s[0] + '"]');
    if (hl && hl.offsetParent !== null) hl.classList.add('aivob-hl'); else hl = null;
    ov.className = 'aivob tour';
    var dots = steps.map(function (_, j) { return '<i' + (j === i ? ' class="on"' : '') + '></i>'; }).join('');
    ov.innerHTML = '<div class="ob-card" role="dialog" aria-modal="true" aria-label="Quick tour"><div class="ob-step">Quick tour · ' + (i + 1) + ' of ' + steps.length + '</div>' +
      '<p class="ob-tt">' + esc(s[1]) + '</p><p class="ob-tx">' + esc(s[2]) + '</p><div class="ob-dots">' + dots + '</div>' +
      '<div class="ob-acts">' + (i > 0 ? '<button type="button" class="ob-s" data-a="back">Back</button>' : '') + '<button type="button" class="ob-p" data-a="next">' + (i === steps.length - 1 ? 'Done' : 'Next') + '</button></div></div>';
    ov.querySelector('[data-a="next"]').onclick = function () { tour(i + 1); };
    var bk = ov.querySelector('[data-a="back"]'); if (bk) bk.onclick = function () { tour(i - 1); };
  }

  function visibleSteps() {
    return C.steps.filter(function (st) {
      if (st.key) { var a = app(); return !(a && a.S && a.S.settings && (a.S.settings.finnhubKey || a.S.settings.twelveKey)); }
      return true;
    });
  }

  function step(i) {
    var steps = visibleSteps();
    if (i >= steps.length) { set('tour'); removeBar(); tour(0); return; }
    var st = steps[i];
    if (!ov) { ov = document.createElement('div'); document.body.appendChild(ov); }
    ov.className = 'aivob';
    var count = steps.length > 1 ? '<div class="ob-step">Step ' + (i + 1) + ' of ' + steps.length + ' · ' + esc(st.title) + '</div>' : '<div class="ob-step">' + esc(st.title) + '</div>';
    var body;
    if (st.key) {
      body = '<p class="ob-tx">Without a free stock key you are in <b>demo mode</b>, with sample prices instead of live ones. Getting a key takes about a minute and is free.</p>' +
        '<a class="ob-link" href="https://finnhub.io/register" target="_blank" rel="noopener">Get a free key ↗</a>' +
        '<div class="ob-grid" style="margin-top:14px!important"><label><span>Paste your key</span><input data-key type="password" autocomplete="new-password" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-form-type="other" placeholder="Paste key"></label></div>' +
        '<p class="ob-msg" data-msg></p>';
    } else body = '<div class="ob-sub2">' + esc(st.sub) + '</div><form novalidate>' + buildForm(st.fields) + '</form>';
    var last = i === steps.length - 1;
    ov.innerHTML = '<div class="ob-card" role="dialog" aria-modal="true" aria-labelledby="aivobT"><div class="ob-hd"><img src="' + LOGO + '" alt=""><div style="flex:1;padding-right:70px"><h2 id="aivobT">Get started</h2><div class="ob-nick">Meet ' + esc(C.nick) + ', ' + esc(C.role) + '</div></div><button type="button" class="ob-all" data-a="all">Skip setup</button></div>' +
      count + body +
      '<div class="ob-acts"><button type="button" class="ob-s" data-a="skip">' + (st.key ? 'Stay in demo' : 'Skip') + '</button><button type="button" class="ob-p" data-a="go">' + (st.key ? 'Save key' : (last ? 'Finish' : 'Continue')) + '</button></div></div>';
    var card = ov.querySelector('.ob-card');
    if (C.health && !st.key) { prefillHeight(card); var u = card.querySelector('[data-k="0"]'); if (u) u.addEventListener('change', function () { syncUnits(card); }); syncUnits(card); }
    var f = card.querySelector('form'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); });
    card.querySelector('[data-a="all"]').onclick = function () { set('tour'); removeBar(); tour(0); };
    card.querySelector('[data-a="skip"]').onclick = function () { step(i + 1); };
    card.querySelector('[data-a="go"]').onclick = function () {
      if (st.key) {
        if (!applyKey(card)) { var m = card.querySelector('[data-msg]'); if (m) m.textContent = 'Paste your key first, or tap Stay in demo.'; return; }
      } else { apply(card, st.fields); if (C.health) rebuild = true; }
      step(i + 1);
    };
  }

  function open() {
    close();
    if (!C.steps.length) {
      ov = document.createElement('div'); ov.className = 'aivob'; document.body.appendChild(ov);
      ov.innerHTML = '<div class="ob-card" role="dialog" aria-modal="true" aria-labelledby="aivobT"><div class="ob-hd"><img src="' + LOGO + '" alt=""><div><h2 id="aivobT">Get started</h2><div class="ob-nick">Meet ' + esc(C.nick) + ', ' + esc(C.role) + '</div></div></div>' +
        '<p class="ob-tx">Welcome to ' + esc(C.name) + '. ' + esc(C.nick) + ' will show you around. It takes 20 seconds.</p>' +
        '<div class="ob-acts"><button type="button" class="ob-p" data-a="go">Start tour</button></div></div>';
      ov.querySelector('[data-a="go"]').onclick = function () { set('tour'); removeBar(); tour(0); };
      return;
    }
    step(0);
  }

  /* what they shared, for the app's AI */
  function about() {
    var a = app(); if (!a || !a.S) return '';
    var L = [];
    C.steps.forEach(function (st) { (st.fields || []).forEach(function (fd) { if (!fd.path) return; var v = String(getPath(fd.path) || '').trim(); if (v) L.push('- ' + fd.label + ': ' + v.replace(/\s+/g, ' ').slice(0, 600)); }); });
    return L.length ? 'What the user shared about themselves during setup (use it when relevant):\n' + L.join('\n') : '';
  }

  function removeBar() { var b = document.getElementById('aivobBar'); if (b) b.remove(); }
  function showBar() {
    if (C.banner === false || document.getElementById('aivobBar')) return;
    try { if (sessionStorage.getItem(KEY + '.hide') === '1') return; } catch (e) {}
    var b = document.createElement('div');
    b.id = 'aivobBar'; b.className = 'aivob-bar'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Get started');
    b.innerHTML = '<img src="' + LOGO + '" alt=""><div class="ob-bt">Get started with ' + esc(C.nick) + '</div><div class="ob-bs">' + esc(C.barSub || 'Your info, then a quick tour') + '</div><div class="ob-ba"><button type="button" class="ob-go">Get set up</button><button type="button" class="ob-later">Later</button></div>';
    b.querySelector('.ob-go').onclick = open;
    b.querySelector('.ob-later').onclick = function () { set('dismissed'); b.remove(); };
    var top = document.querySelector('header.top');
    var tb = document.querySelector('main .topbar');
    if (top && top.parentNode) top.parentNode.insertBefore(b, top.nextSibling);
    else if (tb) tb.parentNode.insertBefore(b, tb.nextSibling);
    else document.body.insertBefore(b, document.body.firstChild);
  }

  function init() {
    logos();
    nickTags(); setTimeout(nickTags, 600); setTimeout(prefill, 300);
    var s = get();
    if (!s && seenBefore()) { try { localStorage.setItem(KEY, 'done'); } catch (e) {} return; }
    if (s === 'dismissed' || s === 'done') return;
    if (s === 'tour') { setTimeout(function () { tour(0); }, 350); return; }
    if (!s) {
      /* people who already set up the app before this existed skip straight past it */
      try { var a = app(); if (a && a.S && a.S.setupDone) { set('done'); return; } } catch (e) {}
      setTimeout(open, 350);
    } else if (s === 'skipped') showBar();
  }
  window.AIVOnboard = { open: open, about: about, reset: function () { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY + '.hide'); } catch (e) {} } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
