/* =====================================================================
   AI Verse — Connections for the AI apps
   - Adds a Connections button (plug icon) to every app's header
   - Each app gets the services that make sense for it:
       AI Music ............ Spotify, Apple Music, YouTube Music
       AI Career ........... LinkedIn, Indeed, Gmail, Google Calendar, Google Docs
       AI Personal Assistant Gmail + Google Calendar, Google Tasks, Apple Reminders, Apple / Outlook Calendar
       AI Health and Fitness Strava, Apple Health (via Strava), calendars, spreadsheets
       AI Stock and Finance  Your bank (CSV), Google Sheets, Excel, TradingView, Yahoo Finance, SEC EDGAR
       AI Photo ............ Dropbox, Google Drive, share to any app
       AI Study and Research Anki, Quizlet, Notion, Google Docs
   - MCP: use any MCP server's tools inside the app, and connect the
     AI Verse MCP server to Claude, ChatGPT and other AI apps
   Sign-ins need free developer keys in config.js (AIV_SITE.connect).
   Without a key, that sign-in shows "Not available yet" and every
   link, import and export still works.
   Add to each app:  <script src="../connect.js" defer></script>
   ===================================================================== */
(function () {
  'use strict';
  if (window.AIVConnect) return;

  var me = document.currentScript;
  var base = new URL('../', me ? me.src : location.href).href;
  var SITE = window.AIV_SITE || {};
  var CFG = SITE.connect || {};
  var SERVER = (SITE.server || 'https://api.aiverse.it.com').replace(/\/+$/, '');
  var REDIRECT = CFG.redirectUri || (base + 'oauth-callback.html');
  var file = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
  var APPS = {
    'ai-music': 'music', 'ai-career': 'career', 'career-ai': 'career',
    'ai-personal-assistant': 'aide', 'personal-assistant-ai': 'aide', 'aide': 'aide',
    'ai-health-and-fitness': 'fitness', 'health-and-fitness-ai': 'fitness',
    'ai-stock-and-finance': 'finance', 'stock-and-finance-ai': 'finance',
    'ai-photo': 'photo', 'photo-ai': 'photo',
    'ai-study-and-research': 'study', 'study-and-research-ai': 'study'
  };
  var APP = APPS[file] || '';
  var STORE = 'aivconnect.v1';

  /* ---------------- small helpers ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function load() { try { var v = JSON.parse(localStorage.getItem(STORE) || 'null'); if (v && typeof v === 'object') return { tok: v.tok || {}, mcp: Array.isArray(v.mcp) ? v.mcp : [] }; } catch (e) {} return { tok: {}, mcp: [] }; }
  var C = load();
  function persist() { try { localStorage.setItem(STORE, JSON.stringify(C)); } catch (e) {} }
  function A() { return window.AIV_APP || null; }
  function S() { var a = A(); return a ? a.S : null; }
  function commit() { var a = A(); if (!a) return; try { localStorage.setItem(a.key, JSON.stringify(a.S)); } catch (e) { toast('Your browser storage is full.', true); return; } try { a.reload(); } catch (e) {} }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return ymd(new Date()); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function q(s) { return encodeURIComponent(s || ''); }
  function list(v) { return (Array.isArray(v) ? v : String(v || '').split(/[,;\n]/)).map(function (x) { return String(x).trim(); }).filter(Boolean); }

  function toast(msg, err) {
    var host = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'aivc-toast' + (err ? ' err' : ''); t.setAttribute('role', err ? 'alert' : 'status'); t.textContent = msg;
    (document.body).appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, err ? 5200 : 3200);
    return host;
  }
  function download(name, text, mime) {
    var blob = text instanceof Blob ? text : new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function copy(text, msg) {
    var done = function () { toast(msg || 'Copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(done, fallback);
    fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed. Select the text and copy it.', true); } t.remove(); }
  }
  function share(data) {
    if (navigator.share) return navigator.share(data).catch(function (e) { if (e && e.name !== 'AbortError') toast('Sharing didn\'t work on this device.', true); });
    copy(data.text || data.url || '', 'Copied. Paste it into the app you want.');
  }
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(rows) { return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'); }
  function parseCSV(text) {
    var rows = [], row = [], cur = '', i = 0, inQ = false; text = String(text || '').replace(/^\uFEFF/, '');
    for (; i < text.length; i++) {
      var ch = text[i];
      if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; }
      else if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
  }
  // rows of objects keyed by header; finds the header row that contains `need`
  function csvObjects(text, need) {
    var rows = parseCSV(text), h = 0;
    if (need) for (var i = 0; i < Math.min(rows.length, 8); i++) if (rows[i].some(function (c) { return c.trim().toLowerCase() === need.toLowerCase(); })) { h = i; break; }
    var head = (rows[h] || []).map(function (c) { return c.trim(); });
    return rows.slice(h + 1).map(function (r) { var o = {}; head.forEach(function (k, j) { o[k] = (r[j] || '').trim(); }); return o; });
  }

  /* ---------------- calendar files (.ics) ---------------- */
  function icsEsc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
  function icsDate(d, allDay) {
    if (allDay) return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
  }
  function fold(line) { var out = ''; while (line.length > 74) { out += line.slice(0, 74) + '\r\n '; line = line.slice(74); } return out + line; }
  function ics(name, events) {
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Verse//AI Apps//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + icsEsc(name)];
    var stamp = icsDate(new Date());
    events.forEach(function (e) {
      if (!e.start || isNaN(e.start)) return;
      var end = e.end && !isNaN(e.end) ? e.end : new Date(e.start.getTime() + (e.allDay ? 864e5 : 36e5));
      L.push('BEGIN:VEVENT', 'UID:' + (e.uid || uid()) + '@aiverse.it.com', 'DTSTAMP:' + stamp);
      if (e.allDay) { L.push('DTSTART;VALUE=DATE:' + icsDate(e.start, true), 'DTEND;VALUE=DATE:' + icsDate(end, true)); }
      else { L.push('DTSTART:' + icsDate(e.start), 'DTEND:' + icsDate(end)); }
      L.push('SUMMARY:' + icsEsc(e.title || 'Event'));
      if (e.desc) L.push('DESCRIPTION:' + icsEsc(e.desc));
      if (e.loc) L.push('LOCATION:' + icsEsc(e.loc));
      if (e.rrule) L.push('RRULE:' + e.rrule);
      if (e.alarm != null && e.alarm !== '' && !isNaN(e.alarm)) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.title || 'Reminder'), 'TRIGGER:-PT' + Math.max(0, Math.round(+e.alarm)) + 'M', 'END:VALARM');
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(fold).join('\r\n') + '\r\n';
  }
  function parseICS(text) {
    var lines = String(text || '').replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/), out = [], cur = null;
    function val(s) { return s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1'); }
    function dt(v, params) {
      var m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v.trim()); if (!m) return null;
      if (!m[4]) return { d: new Date(+m[1], +m[2] - 1, +m[3]), allDay: true };
      if (m[7]) return { d: new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])), allDay: false };
      return { d: new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]), allDay: false };
    }
    lines.forEach(function (ln) {
      if (/^BEGIN:VEVENT/i.test(ln)) { cur = {}; return; }
      if (/^END:VEVENT/i.test(ln)) { if (cur && cur.start) out.push(cur); cur = null; return; }
      if (!cur) return;
      var i = ln.indexOf(':'); if (i < 0) return;
      var key = ln.slice(0, i).split(';')[0].toUpperCase(), v = ln.slice(i + 1);
      if (key === 'SUMMARY') cur.title = val(v);
      else if (key === 'DESCRIPTION') cur.desc = val(v);
      else if (key === 'LOCATION') cur.loc = val(v);
      else if (key === 'DTSTART') { var s = dt(v); if (s) { cur.start = s.d; cur.allDay = s.allDay; } }
      else if (key === 'DTEND') { var e = dt(v); if (e) cur.end = e.d; }
    });
    return out;
  }
  function localStamp(d) { return ymd(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function parseLocal(s) { if (!s) return null; var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(s)); if (!m) { var d = new Date(s); return isNaN(d) ? null : d; } return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)); }

  /* ---------------- scripts ---------------- */
  var scripts = {};
  function script(src, attrs) {
    if (scripts[src]) return scripts[src];
    scripts[src] = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.async = true;
      Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
      s.onload = function () { res(); }; s.onerror = function () { delete scripts[src]; rej(new Error('Couldn\'t load ' + new URL(src).hostname + '. Check your connection.')); };
      document.head.appendChild(s);
    });
    return scripts[src];
  }
  function pickFile(accept, multiple) {
    return new Promise(function (res) {
      var i = document.createElement('input'); i.type = 'file'; i.accept = accept || ''; i.multiple = !!multiple; i.style.display = 'none';
      i.onchange = function () { res(Array.prototype.slice.call(i.files || [])); i.remove(); };
      document.body.appendChild(i); i.click();
    });
  }
  function readText(f) { return f.text ? f.text() : new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsText(f); }); }

  /* ---------------- sign-in (OAuth with PKCE, in a popup) ---------------- */
  function b64url(buf) { var s = btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function randStr(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a).slice(0, n); }
  async function pkce() { var v = randStr(64); var h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)); return { verifier: v, challenge: b64url(h) }; }
  function popupAuth(url, state) {
    return new Promise(function (res, rej) {
      var w = 520, h = 680, x = Math.max(0, (screen.width - w) / 2), y = Math.max(0, (screen.height - h) / 2);
      var win = window.open(url, 'aivconnect', 'popup=yes,width=' + w + ',height=' + h + ',left=' + x + ',top=' + y);
      if (!win) { rej(new Error('Your browser blocked the sign-in window. Allow pop-ups for this site and try again.')); return; }
      var done = false;
      function finish(d) {
        if (done || !d || d.state !== state) return; done = true; cleanup();
        if (d.error) rej(new Error(d.error === 'access_denied' ? 'Sign-in was cancelled.' : 'Sign-in failed: ' + d.error)); else res(d);
      }
      function onMsg(e) { if (e.origin === location.origin && e.data && e.data.aivOAuth) finish(e.data); }
      function onStore(e) { if (e.key === 'aivconnect.cb' && e.newValue) { try { finish(JSON.parse(e.newValue)); } catch (x) {} } }
      var iv = setInterval(function () {
        try { var v = localStorage.getItem('aivconnect.cb'); if (v) { var d = JSON.parse(v); if (d.state === state) { localStorage.removeItem('aivconnect.cb'); finish(d); return; } } } catch (x) {}
        if (win.closed) { setTimeout(function () { if (!done) { done = true; cleanup(); rej(new Error('Sign-in window was closed.')); } }, 600); clearInterval(iv); }
      }, 400);
      function cleanup() { clearInterval(iv); window.removeEventListener('message', onMsg); window.removeEventListener('storage', onStore); try { localStorage.removeItem('aivconnect.cb'); } catch (x) {} }
      window.addEventListener('message', onMsg); window.addEventListener('storage', onStore);
    });
  }
  async function formPost(url, data) {
    var r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error_description || j.error || ('Sign-in error ' + r.status));
    return j;
  }
  function saveTok(id, j, extra) {
    C.tok[id] = Object.assign({}, C.tok[id] || {}, { access: j.access_token, refresh: j.refresh_token || (C.tok[id] && C.tok[id].refresh) || '', exp: Date.now() + (Number(j.expires_in || 3600) - 60) * 1000 }, extra || {});
    persist();
  }

  // PKCE services that need no secret on the server
  var PK = {
    spotify: {
      id: function () { return CFG.spotifyClientId; },
      auth: 'https://accounts.spotify.com/authorize', token: 'https://accounts.spotify.com/api/token',
      scope: 'playlist-modify-private playlist-modify-public user-top-read user-library-read user-read-recently-played'
    },
    dropbox: {
      id: function () { return CFG.dropboxAppKey; },
      auth: 'https://www.dropbox.com/oauth2/authorize', token: 'https://api.dropboxapi.com/oauth2/token',
      extra: { token_access_type: 'offline' }
    }
  };
  async function pkLogin(id) {
    var P = PK[id], cid = P.id(); if (!cid) throw new Error('This sign-in isn\'t available yet.');
    var k = await pkce(), state = randStr(24);
    var p = Object.assign({ client_id: cid, response_type: 'code', redirect_uri: REDIRECT, state: state, code_challenge_method: 'S256', code_challenge: k.challenge }, P.scope ? { scope: P.scope } : {}, P.extra || {});
    var d = await popupAuth(P.auth + '?' + new URLSearchParams(p).toString(), state);
    var j = await formPost(P.token, { grant_type: 'authorization_code', code: d.code, redirect_uri: REDIRECT, client_id: cid, code_verifier: k.verifier });
    saveTok(id, j);
  }
  async function pkToken(id) {
    var t = C.tok[id]; if (!t || !t.access) throw new Error('Connect first.');
    if (Date.now() < t.exp) return t.access;
    if (!t.refresh) { delete C.tok[id]; persist(); throw new Error('Your sign-in expired. Connect again.'); }
    try { var j = await formPost(PK[id].token, { grant_type: 'refresh_token', refresh_token: t.refresh, client_id: PK[id].id() }); saveTok(id, j); return C.tok[id].access; }
    catch (e) { delete C.tok[id]; persist(); throw new Error('Your sign-in expired. Connect again.'); }
  }

  // Strava needs its client secret, so the AI Verse server swaps the code for a token
  async function stravaLogin() {
    var cid = CFG.stravaClientId; if (!cid) throw new Error('This sign-in isn\'t available yet.');
    var state = randStr(24);
    var d = await popupAuth('https://www.strava.com/oauth/authorize?' + new URLSearchParams({ client_id: cid, response_type: 'code', redirect_uri: REDIRECT, approval_prompt: 'auto', scope: 'read,activity:read_all', state: state }).toString(), state);
    var r = await fetch(SERVER + '/oauth/strava/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: d.code }) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error((j.error && j.error.message) || 'Strava sign-in failed.');
    saveTok('strava', { access_token: j.access_token, refresh_token: j.refresh_token, expires_in: j.expires_at ? j.expires_at - Date.now() / 1000 : 21600 }, { who: j.athlete ? [j.athlete.firstname, j.athlete.lastname].filter(Boolean).join(' ') : '' });
  }
  async function stravaToken() {
    var t = C.tok.strava; if (!t || !t.access) throw new Error('Connect Strava first.');
    if (Date.now() < t.exp) return t.access;
    var r = await fetch(SERVER + '/oauth/strava/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: t.refresh }) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) { delete C.tok.strava; persist(); throw new Error('Your Strava sign-in expired. Connect again.'); }
    saveTok('strava', { access_token: j.access_token, refresh_token: j.refresh_token, expires_in: j.expires_at ? j.expires_at - Date.now() / 1000 : 21600 });
    return C.tok.strava.access;
  }

  // Google: one client ID for Tasks, Docs, Sheets and Drive (Google Identity Services)
  var GT = {};
  function googleId() { var s = S(); return CFG.googleClientId || (s && s.settings && s.settings.googleClientId) || ''; }
  async function googleToken(scope) {
    var cid = googleId(); if (!cid) throw new Error('Google sign-in isn\'t available yet.');
    if (GT[scope] && Date.now() < GT[scope].exp) return GT[scope].token;
    await script('https://accounts.google.com/gsi/client');
    return new Promise(function (res, rej) {
      var c = google.accounts.oauth2.initTokenClient({
        client_id: cid, scope: scope,
        callback: function (r) { if (r.error) { rej(new Error('Google sign-in: ' + r.error)); return; } GT[scope] = { token: r.access_token, exp: Date.now() + (Number(r.expires_in || 3600) - 60) * 1000 }; C.tok.google = { access: 'session', exp: GT[scope].exp }; persist(); res(r.access_token); },
        error_callback: function (e) { rej(new Error(e && e.type === 'popup_closed' ? 'Sign-in window was closed.' : 'Google sign-in failed.')); }
      });
      c.requestAccessToken();
    });
  }
  var DRIVE = 'https://www.googleapis.com/auth/drive.file';
  // Save a file to Google Drive. convert: 'doc' | 'sheet' | '' (keep the file as it is)
  async function driveSave(name, content, mime, convert) {
    var tok = await googleToken(DRIVE);
    var meta = { name: name };
    if (convert === 'doc') meta.mimeType = 'application/vnd.google-apps.document';
    if (convert === 'sheet') meta.mimeType = 'application/vnd.google-apps.spreadsheet';
    var fd = new FormData();
    fd.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
    fd.append('file', content instanceof Blob ? content : new Blob([content], { type: mime }));
    var r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', { method: 'POST', headers: { Authorization: 'Bearer ' + tok }, body: fd });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error((j.error && j.error.message) || 'Google Drive error ' + r.status);
    return j.webViewLink || ('https://drive.google.com/file/d/' + j.id + '/view');
  }
  function mdToHtml(md) {
    var h = esc(md).replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^[-*] (.*)$/gm, '<li>$1</li>');
    h = h.replace(/(<li>.*<\/li>\n?)+/g, function (m) { return '<ul>' + m + '</ul>'; });
    return '<html><body>' + h.split(/\n{2,}/).map(function (p) { return /^<(h\d|ul)/.test(p) ? p : '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('') + '</body></html>';
  }
  async function saveToDocs(name, md) { var link = await driveSave(name, mdToHtml(md), 'text/html', 'doc'); window.open(link, '_blank', 'noopener'); return 'Saved to Google Docs.'; }

  /* ---------------- connector building blocks ---------------- */
  // A connector: {id, name, mark, desc, login?:{available(), connected(), connect(), disconnect(), who()}, note?, actions:[{label, run(), needs?:'login'}]}
  function linkAct(label, url) { return { label: label, run: function () { window.open(typeof url === 'function' ? url() : url, '_blank', 'noopener'); } }; }
  function googleLogin() {
    return { available: function () { return !!googleId(); }, connected: function () { return !!(C.tok.google && Date.now() < C.tok.google.exp); }, connect: function () { return googleToken(DRIVE); }, disconnect: function () { GT = {}; delete C.tok.google; persist(); }, who: function () { return ''; } };
  }
  function pkLoginObj(id) {
    return { available: function () { return !!PK[id].id(); }, connected: function () { return !!(C.tok[id] && C.tok[id].access); }, connect: function () { return pkLogin(id); }, disconnect: function () { delete C.tok[id]; persist(); }, who: function () { return (C.tok[id] && C.tok[id].who) || ''; } };
  }

  /* ---------------- choosers shown inside the panel ---------------- */
  var panel, body, tab = 'apps';
  function sub(title, html, onMount) {
    body.innerHTML = '<button type="button" class="aivc-back" data-back>← Back</button><h3 class="aivc-h3">' + esc(title) + '</h3>' + html;
    body.querySelector('[data-back]').onclick = function () { render(); };
    if (onMount) onMount(body);
    body.scrollTop = 0;
  }
  function choose(title, items, fmt) {
    return new Promise(function (res) {
      if (!items.length) { res(null); return; }
      sub(title, '<div class="aivc-pick">' + items.map(function (it, i) { return '<button type="button" class="aivc-opt" data-i="' + i + '">' + fmt(it) + '</button>'; }).join('') + '</div>', function (b) {
        $$('[data-i]', b).forEach(function (x) { x.onclick = function () { res(items[+x.dataset.i]); }; });
        b.querySelector('[data-back]').onclick = function () { render(); res(null); };
      });
    });
  }
  function form(title, fields, submit, intro) {
    return new Promise(function (res) {
      sub(title, (intro ? '<p class="aivc-muted">' + intro + '</p>' : '') + '<form class="aivc-form">' + fields.map(function (f) {
        var v = esc(f.value || '');
        var input = f.type === 'textarea' ? '<textarea name="' + f.name + '" rows="' + (f.rows || 4) + '" placeholder="' + esc(f.ph || '') + '">' + v + '</textarea>'
          : f.type === 'select' ? '<select name="' + f.name + '">' + f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === f.value ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'
          : '<input name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + v + '" placeholder="' + esc(f.ph || '') + '"' + (f.required ? ' required' : '') + '>';
        return '<label><span>' + esc(f.label) + '</span>' + input + '</label>';
      }).join('') + '<button type="submit" class="aivc-btn pri">' + esc(submit || 'Continue') + '</button></form>', function (b) {
        var fm = b.querySelector('form');
        fm.onsubmit = function (e) { e.preventDefault(); var o = {}; fields.forEach(function (f) { o[f.name] = fm.elements[f.name].value.trim(); }); res(o); };
        b.querySelector('[data-back]').onclick = function () { render(); res(null); };
        var first = fm.querySelector('input,textarea,select'); if (first) setTimeout(function () { first.focus(); }, 40);
      });
    });
  }
  function result(title, html, onMount) { sub(title, html, onMount); }
  function busy(msg) { body.innerHTML = '<div class="aivc-busy" role="status"><span class="aivc-spin"></span>' + esc(msg) + '</div>'; }

  /* =====================================================================
     AI MUSIC — Spotify, Apple Music, YouTube Music
     ===================================================================== */
  function playlists() { var s = S(); return (s && s.playlists || []).filter(function (p) { return p.tracks && p.tracks.length; }); }
  async function pickPlaylist() {
    var p = playlists(); if (!p.length) { toast('Save a playlist first. Make one in Create.'); return null; }
    if (p.length === 1) return p[0];
    return choose('Choose a playlist', p, function (pl) { return '<b>' + esc(pl.name || 'Playlist') + '</b><span>' + pl.tracks.length + ' songs</span>'; });
  }
  async function sp(path, opt) {
    var tok = await pkToken('spotify'); opt = opt || {};
    var r = await fetch('https://api.spotify.com/v1' + path, { method: opt.method || 'GET', headers: Object.assign({ Authorization: 'Bearer ' + tok }, opt.body ? { 'Content-Type': 'application/json' } : {}), body: opt.body ? JSON.stringify(opt.body) : undefined });
    if (r.status === 429) { await sleep(1500); return sp(path, opt); }
    var j = r.status === 204 ? {} : await r.json().catch(function () { return {}; });
    if (!r.ok) { var e = new Error((j.error && j.error.message) || 'Spotify error ' + r.status); e.status = r.status; throw e; }
    return j;
  }
  async function spotifySave() {
    var pl = await pickPlaylist(); if (!pl) return;
    busy('Finding your songs on Spotify…');
    var uris = [], miss = 0;
    for (var i = 0; i < pl.tracks.length; i++) {
      var t = pl.tracks[i];
      busy('Finding songs on Spotify… ' + (i + 1) + ' of ' + pl.tracks.length);
      try {
        var j = await sp('/search?type=track&limit=3&q=' + q('track:' + t.t + ' artist:' + String(t.a).split(/,|&| feat/i)[0]));
        var hit = (j.tracks && j.tracks.items || [])[0];
        if (!hit) { j = await sp('/search?type=track&limit=1&q=' + q(t.a + ' ' + t.t)); hit = (j.tracks && j.tracks.items || [])[0]; }
        if (hit) uris.push(hit.uri); else miss++;
      } catch (e) { if (e.status === 401) throw new Error('Your Spotify sign-in expired. Connect again.'); miss++; }
    }
    if (!uris.length) throw new Error('None of these songs were found on Spotify.');
    busy('Creating the playlist…');
    var desc = 'Made with AI Music on AI Verse';
    var made;
    try { made = await sp('/me/playlists', { method: 'POST', body: { name: pl.name || 'AI Music playlist', description: desc, public: false } }); }
    catch (e) { var meU = await sp('/me'); made = await sp('/users/' + encodeURIComponent(meU.id) + '/playlists', { method: 'POST', body: { name: pl.name || 'AI Music playlist', description: desc, public: false } }); }
    for (var k = 0; k < uris.length; k += 100) {
      var chunk = uris.slice(k, k + 100);
      try { await sp('/playlists/' + made.id + '/items', { method: 'POST', body: { uris: chunk } }); }
      catch (e) { await sp('/playlists/' + made.id + '/tracks', { method: 'POST', body: { uris: chunk } }); }
    }
    var url = made.external_urls && made.external_urls.spotify;
    result('Saved to Spotify', '<p>"' + esc(pl.name) + '" is in your Spotify library with ' + uris.length + ' songs' + (miss ? ' (' + miss + ' weren\'t on Spotify)' : '') + '.</p>' + (url ? '<a class="aivc-btn pri" href="' + esc(url) + '" target="_blank" rel="noopener">Open in Spotify</a>' : ''));
  }
  async function musicImport(name, rows, src) {
    var a = A(); if (!rows.length) throw new Error('No songs came back.');
    var tracks = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]; busy('Matching your songs… ' + (i + 1) + ' of ' + rows.length);
      var v = null;
      if (a && a.verify) { try { v = await a.verify(r.a, r.t); } catch (e) { v = null; } }
      tracks.push(v || { id: src + (r.id || uid()), t: r.t, a: r.a, al: r.al || '', art: r.art || '', pv: '', url: r.url || '', g: '', y: '' });
    }
    var s = S(); var pl = { id: uid(), name: name, tracks: tracks, saved: Date.now(), note: 'Imported from ' + (src === 'sp' ? 'Spotify' : 'Apple Music') };
    s.playlists = s.playlists || []; s.playlists.unshift(pl);
    if (a && a.learn) tracks.forEach(function (t) { try { a.learn(t, 'save'); } catch (e) {} });
    commit();
    result('Imported', '<p>Added "' + esc(name) + '" with ' + tracks.length + ' songs to your playlists. AI Music now uses them to learn your taste.</p><button class="aivc-btn pri" data-go>Open playlists</button>', function (b) { b.querySelector('[data-go]').onclick = function () { close(); try { A().go('playlists'); } catch (e) {} }; });
  }
  async function spotifyImport(kind) {
    busy('Getting your songs from Spotify…');
    var j = kind === 'top' ? await sp('/me/top/tracks?limit=40&time_range=medium_term') : await sp('/me/tracks?limit=40');
    var items = (j.items || []).map(function (x) { return x.track || x; }).filter(function (t) { return t && t.name; });
    await musicImport(kind === 'top' ? 'My Spotify top songs' : 'My Spotify liked songs', items.map(function (t) { return { id: t.id, t: t.name, a: (t.artists || []).map(function (x) { return x.name; }).join(', '), al: t.album && t.album.name, art: t.album && t.album.images && t.album.images[0] && t.album.images[0].url, url: t.external_urls && t.external_urls.spotify }; }), 'sp');
  }

  // Apple Music (MusicKit). The AI Verse server signs the developer token with your Apple Music key.
  var MK = null;
  async function musicKit() {
    if (MK) return MK;
    var r = await fetch(SERVER + '/oauth/apple-music/token');
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok || !j.token) throw new Error('Apple Music isn\'t available yet.');
    await script('https://js-cdn.music.apple.com/musickit/v3/musickit.js', { 'data-web-components': '' });
    if (!window.MusicKit) await new Promise(function (res) { document.addEventListener('musickitloaded', res, { once: true }); setTimeout(res, 4000); });
    await MusicKit.configure({ developerToken: j.token, app: { name: 'AI Verse', build: '1.0' } });
    MK = MusicKit.getInstance();
    return MK;
  }
  async function appleLogin() { var m = await musicKit(); await m.authorize(); C.tok.apple = { access: 'musickit', exp: Date.now() + 864e5 * 150 }; persist(); }
  async function am(path, opt) {
    var m = await musicKit(); if (!m.isAuthorized) await m.authorize();
    var r = await m.api.music(path, (opt && opt.query) || undefined, opt && opt.body ? { fetchOptions: { method: 'POST', body: JSON.stringify(opt.body) } } : undefined);
    return r && r.data !== undefined ? r.data : r;
  }
  async function appleSave() {
    var pl = await pickPlaylist(); if (!pl) return;
    busy('Getting your songs ready for Apple Music…');
    var m = await musicKit(); if (!m.isAuthorized) await m.authorize();
    var sf = m.storefrontId || 'us', ids = [], miss = 0;
    for (var i = 0; i < pl.tracks.length; i++) {
      var t = pl.tracks[i];
      if (/^it\d+$/.test(t.id)) { ids.push(t.id.slice(2)); continue; }
      busy('Finding songs on Apple Music… ' + (i + 1) + ' of ' + pl.tracks.length);
      try { var d = await am('/v1/catalog/' + sf + '/search', { query: { term: t.a + ' ' + t.t, types: 'songs', limit: 1 } }); var s = d.results && d.results.songs && d.results.songs.data[0]; if (s) ids.push(s.id); else miss++; } catch (e) { miss++; }
    }
    if (!ids.length) throw new Error('None of these songs were found on Apple Music.');
    busy('Creating the playlist…');
    await am('/v1/me/library/playlists', { body: { attributes: { name: pl.name || 'AI Music playlist', description: 'Made with AI Music on AI Verse' }, relationships: { tracks: { data: ids.map(function (id) { return { id: id, type: 'songs' }; }) } } } });
    result('Saved to Apple Music', '<p>"' + esc(pl.name) + '" is in your Apple Music library with ' + ids.length + ' songs' + (miss ? ' (' + miss + ' weren\'t on Apple Music)' : '') + '. Open the Music app to listen.</p><a class="aivc-btn pri" href="https://music.apple.com/library/playlists" target="_blank" rel="noopener">Open Apple Music</a>');
  }
  async function appleImport() {
    busy('Getting your recently played songs…');
    var d = await am('/v1/me/recent/played/tracks', { query: { limit: 30 } });
    var items = (d.data || []).filter(function (x) { return x.attributes; });
    await musicImport('My Apple Music recently played', items.map(function (x) { var a = x.attributes; return { id: x.id, t: a.name, a: a.artistName, al: a.albumName, art: a.artwork && a.artwork.url ? a.artwork.url.replace('{w}', '200').replace('{h}', '200') : '', url: a.url }; }), 'am');
  }
  async function listenLinks() {
    var pl = await pickPlaylist(); if (!pl) return;
    var text = pl.tracks.map(function (t, i) { return (i + 1) + '. ' + t.t + ' — ' + t.a; }).join('\n');
    result('Listen to "' + (pl.name || 'Playlist') + '" anywhere', '<p class="aivc-muted">Open each song in the music app you use.</p><ol class="aivc-songs">' + pl.tracks.map(function (t) {
      var s = t.a + ' ' + t.t;
      return '<li><b>' + esc(t.t) + '</b> <span>' + esc(t.a) + '</span><div class="aivc-links">' +
        '<a href="' + esc(t.url || 'https://music.apple.com/search?term=' + q(s)) + '" target="_blank" rel="noopener">Apple Music</a>' +
        '<a href="https://open.spotify.com/search/' + q(s) + '" target="_blank" rel="noopener">Spotify</a>' +
        '<a href="https://music.youtube.com/search?q=' + q(s) + '" target="_blank" rel="noopener">YouTube Music</a></div></li>';
    }).join('') + '</ol><button class="aivc-btn" data-cp>Copy song list</button>', function (b) { b.querySelector('[data-cp]').onclick = function () { copy(text); }; });
  }
  var MUSIC = [
    { id: 'spotify', name: 'Spotify', mark: 'S', desc: 'Save AI Music playlists to your Spotify library, and bring in your top or liked songs so AI Music learns your taste.',
      login: pkLoginObj('spotify'),
      actions: [{ label: 'Save a playlist to Spotify', needs: 'login', run: spotifySave }, { label: 'Import my top songs', needs: 'login', run: function () { return spotifyImport('top'); } }, { label: 'Import my liked songs', needs: 'login', run: function () { return spotifyImport('liked'); } }] },
    { id: 'apple', name: 'Apple Music', mark: '♪', desc: 'Save AI Music playlists straight to your Apple Music library, and import what you\'ve been playing. Needs an Apple Music subscription.',
      login: { available: function () { return !!CFG.appleMusic; }, connected: function () { return !!C.tok.apple; }, connect: appleLogin, disconnect: function () { try { MK && MK.unauthorize(); } catch (e) {} delete C.tok.apple; persist(); }, who: function () { return ''; } },
      actions: [{ label: 'Save a playlist to Apple Music', needs: 'login', run: appleSave }, { label: 'Import recently played', needs: 'login', run: appleImport }] },
    { id: 'ytm', name: 'YouTube Music', mark: '▶', desc: 'Open any playlist\'s songs in YouTube Music, Spotify or Apple Music, with no sign-in.',
      actions: [{ label: 'Open a playlist\'s songs', run: listenLinks }] }
  ];

  /* =====================================================================
     AI CAREER — LinkedIn, Indeed, Gmail, Calendar, Google Docs
     ===================================================================== */
  function careerQuery() { var s = S() || {}; var p = s.profile || {}; return { role: list(p.targetRoles)[0] || (s.resume && s.resume.headline) || '', loc: list(p.locations)[0] || '', remote: p.remote }; }
  function jobSearch(site) {
    return async function () {
      var c = careerQuery();
      var o = await form('Search jobs on ' + (site === 'li' ? 'LinkedIn' : 'Indeed'), [{ name: 'role', label: 'Job title or keywords', value: c.role, required: true, ph: 'e.g. Product designer' }, { name: 'loc', label: 'Location', value: c.loc, ph: 'City, state or Remote' }], 'Open ' + (site === 'li' ? 'LinkedIn' : 'Indeed'));
      if (!o) return; render();
      var remote = /remote/i.test(o.loc);
      var url = site === 'li' ? 'https://www.linkedin.com/jobs/search/?keywords=' + q(o.role) + '&location=' + q(remote ? '' : o.loc) + (remote || c.remote === 'remote' ? '&f_WT=2' : '')
        : 'https://www.indeed.com/jobs?q=' + q(o.role) + '&l=' + q(remote ? 'Remote' : o.loc);
      window.open(url, '_blank', 'noopener');
    };
  }
  async function saveJobLink() {
    var o = await form('Save a job from LinkedIn or Indeed', [{ name: 'url', label: 'Job link', type: 'url', required: true, ph: 'https://www.linkedin.com/jobs/view/…' }, { name: 'title', label: 'Job title', required: true }, { name: 'company', label: 'Company', required: true }, { name: 'location', label: 'Location' }, { name: 'desc', label: 'Job description (optional, helps AI tailor your resume)', type: 'textarea', rows: 5 }], 'Save to my applications', 'Copy the link from the job post. AI Career adds it to your Applications so you can track it, tailor your resume and write a cover letter.');
    if (!o) return;
    var a = A(), s = S();
    var src = /linkedin\./i.test(o.url) ? 'LinkedIn' : /indeed\./i.test(o.url) ? 'Indeed' : 'Link';
    var job = { id: 'link-' + uid(), title: o.title, company: o.company, location: o.location, url: o.url, source: src, desc: o.desc };
    s.jobs = s.jobs || {}; s.jobs[job.id] = job;
    if (a && a.addApp) a.addApp(job, 'saved', o.desc ? { desc: o.desc } : {});
    else (s.apps = s.apps || []).unshift({ id: uid(), jobId: job.id, title: job.title, company: job.company, location: job.location, url: job.url, source: src, status: 'saved', dates: { saved: today() }, created: Date.now(), notes: '', followUp: '', contacts: [], interviews: [], materials: {} });
    commit();
    result('Job saved', '<p>' + esc(o.title) + ' at ' + esc(o.company) + ' is in your Applications.</p><button class="aivc-btn pri" data-go>Open Applications</button>', function (b) { b.querySelector('[data-go]').onclick = function () { close(); try { A().go('tracker'); } catch (e) {} }; });
  }
  function resumeText() {
    var s = S() || {}, r = s.resume || {}; if (r.text && r.text.trim().length > 80 && !(r.experience || []).length) return r.text;
    var c = r.contact || {}, L = [];
    if (c.name) L.push('# ' + c.name);
    var line = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).join(' · '); if (line) L.push(line);
    if (r.headline) L.push('', '**' + r.headline + '**');
    if (r.summary) L.push('', '## Summary', r.summary);
    if ((r.experience || []).length) { L.push('', '## Experience'); r.experience.forEach(function (e) { L.push('', '### ' + [e.title, e.company].filter(Boolean).join(', '), [e.location, [e.start, e.current ? 'Present' : e.end].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')); (e.bullets || []).forEach(function (b) { if (b) L.push('- ' + b); }); }); }
    if ((r.education || []).length) { L.push('', '## Education'); r.education.forEach(function (e) { L.push('- ' + [e.degree, e.school, e.end].filter(Boolean).join(', ')); }); }
    if ((r.skills || []).length) L.push('', '## Skills', (r.skills || []).map(function (x) { return typeof x === 'string' ? x : x.name; }).join(', '));
    return L.join('\n').trim() || r.text || '';
  }
  function linkedinText() {
    var s = S() || {}, r = s.resume || {}, L = [];
    if (r.headline) L.push('HEADLINE\n' + r.headline);
    if (r.summary) L.push('ABOUT\n' + r.summary);
    (r.experience || []).forEach(function (e) { L.push('EXPERIENCE: ' + [e.title, e.company].filter(Boolean).join(' at ') + '\n' + (e.bullets || []).filter(Boolean).map(function (b) { return '• ' + b; }).join('\n')); });
    if ((r.skills || []).length) L.push('SKILLS\n' + r.skills.map(function (x) { return typeof x === 'string' ? x : x.name; }).join(', '));
    return L.join('\n\n');
  }
  function liDate(s) { if (!s) return ''; var d = new Date(s + (/^\w{3} \d{4}$/.test(s) ? '' : '')); return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
  async function linkedinImport() {
    var files = await pickFile('.zip,.csv', true); if (!files.length) return;
    busy('Reading your LinkedIn data…');
    var got = {};
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (/\.zip$/i.test(f.name)) {
        await script('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        var z = await JSZip.loadAsync(f);
        for (var nm0 of ['Profile.csv', 'Positions.csv', 'Education.csv', 'Skills.csv']) { var e = z.file(new RegExp('(^|/)' + nm0.replace('.', '\\.') + '$', 'i'))[0]; if (e) got[nm0] = await e.async('string'); }
      } else got[f.name.replace(/^.*[\\/]/, '')] = await readText(f);
    }
    var key = function (n) { return Object.keys(got).find(function (k) { return k.toLowerCase() === n.toLowerCase(); }); };
    if (!key('Positions.csv') && !key('Profile.csv') && !key('Education.csv') && !key('Skills.csv')) throw new Error('That isn\'t a LinkedIn data export. Choose the .zip LinkedIn emailed you, or its Profile, Positions, Education and Skills files.');
    var s = S(); s.resume = s.resume || {}; var r = s.resume, n = { exp: 0, edu: 0, skills: 0, profile: false };
    r.contact = r.contact || {}; r.experience = r.experience || []; r.education = r.education || []; r.skills = r.skills || [];
    if (key('Profile.csv')) { var p = csvObjects(got[key('Profile.csv')], 'First Name')[0] || {};
      var nm = [p['First Name'], p['Last Name']].filter(Boolean).join(' ');
      if (nm && !r.contact.name) { r.contact.name = nm; n.profile = true; }
      if (p.Headline && !r.headline) { r.headline = p.Headline; n.profile = true; }
      if (p.Summary && !r.summary) { r.summary = p.Summary; n.profile = true; }
      if (p['Geo Location'] && !r.contact.location) r.contact.location = p['Geo Location'];
    }
    if (key('Positions.csv')) csvObjects(got[key('Positions.csv')], 'Company Name').forEach(function (p) {
      if (!p.Title && !p['Company Name']) return;
      if (r.experience.some(function (e) { return (e.title || '').toLowerCase() === (p.Title || '').toLowerCase() && (e.company || '').toLowerCase() === (p['Company Name'] || '').toLowerCase(); })) return;
      r.experience.push({ title: p.Title || '', company: p['Company Name'] || '', location: p.Location || '', start: liDate(p['Started On']), end: liDate(p['Finished On']), current: !p['Finished On'], bullets: (p.Description || '').split(/\n+|•/).map(function (x) { return x.replace(/^[-–\s]+/, '').trim(); }).filter(Boolean) });
      n.exp++;
    });
    if (key('Education.csv')) csvObjects(got[key('Education.csv')], 'School Name').forEach(function (p) {
      if (!p['School Name'] || r.education.some(function (e) { return (e.school || '').toLowerCase() === p['School Name'].toLowerCase(); })) return;
      r.education.push({ degree: p['Degree Name'] || '', school: p['School Name'], end: liDate(p['End Date']), details: p.Notes || p.Activities || '' }); n.edu++;
    });
    if (key('Skills.csv')) { var have = r.skills.map(function (x) { return String(typeof x === 'string' ? x : x.name).toLowerCase(); });
      csvObjects(got[key('Skills.csv')], 'Name').forEach(function (p) { if (p.Name && have.indexOf(p.Name.toLowerCase()) < 0) { r.skills.push(p.Name); have.push(p.Name.toLowerCase()); n.skills++; } }); }
    r.updated = Date.now(); commit();
    result('LinkedIn profile imported', '<p>Added ' + n.exp + ' jobs, ' + n.edu + ' schools and ' + n.skills + ' skills' + (n.profile ? ', plus your name, headline and summary' : '') + ' to your resume. Nothing you already had was replaced.</p><button class="aivc-btn pri" data-go>Open my resume</button>', function (b) { b.querySelector('[data-go]').onclick = function () { close(); try { A().go('resume'); } catch (e) {} }; });
  }
  function careerEvents() {
    var s = S() || {}, ev = [];
    (s.apps || []).forEach(function (a) {
      (a.interviews || []).forEach(function (i) { var d = parseLocal(i.date); if (!d) return; var timed = /T|\d:\d/.test(i.date); ev.push({ uid: 'iv-' + (i.id || uid()), title: (i.type || 'Interview') + ': ' + a.title + ' at ' + a.company, start: d, end: timed ? new Date(d.getTime() + 36e5) : null, allDay: !timed, desc: [a.url, i.notes].filter(Boolean).join('\n'), alarm: timed ? 60 : null }); });
      if (a.followUp && ['applied', 'interview'].indexOf(a.status) >= 0) { var f = parseLocal(a.followUp); if (f) ev.push({ uid: 'fu-' + a.id, title: 'Follow up: ' + a.title + ' at ' + a.company, start: f, allDay: true, desc: a.url || '' }); }
    });
    return ev;
  }
  function followUps() {
    var s = S() || {}, apps = (s.apps || []).filter(function (a) { return ['applied', 'interview'].indexOf(a.status) >= 0; });
    if (!apps.length) { toast('Apply to a job first. Follow-ups show up for jobs you\'ve applied to.'); return; }
    var nm = ((s.resume || {}).contact || {}).name || '';
    result('Follow-up emails', '<p class="aivc-muted">Each opens a draft in Gmail or your email app. Check it and send it yourself.</p><ul class="aivc-songs">' + apps.map(function (a) {
      var c = (a.contacts || [])[0] || {};
      var subj = 'Following up on my application: ' + a.title;
      var body = 'Hi' + (c.name ? ' ' + c.name.split(' ')[0] : '') + ',\n\nI applied for the ' + a.title + ' role at ' + a.company + (a.dates && a.dates.applied ? ' on ' + a.dates.applied : '') + ' and wanted to follow up. I\'m still very interested and would welcome the chance to talk about how I can help the team.\n\nThank you for your time,\n' + nm;
      return '<li><b>' + esc(a.title) + '</b> <span>' + esc(a.company) + (a.followUp ? ' · follow up ' + esc(a.followUp) : '') + '</span><div class="aivc-links">' +
        '<a href="https://mail.google.com/mail/?view=cm&fs=1&to=' + q(c.email || '') + '&su=' + q(subj) + '&body=' + q(body) + '" target="_blank" rel="noopener">Draft in Gmail</a>' +
        '<a href="mailto:' + esc(c.email || '') + '?subject=' + q(subj) + '&body=' + q(body) + '">Email app</a></div></li>';
    }).join('') + '</ul>');
  }
  var CAREER = [
    { id: 'linkedin', name: 'LinkedIn', mark: 'in', desc: 'Search LinkedIn jobs for your target role, bring in your LinkedIn profile, and copy your polished profile text back to LinkedIn.',
      note: 'LinkedIn doesn\'t let other sites read your profile directly. Download your data from LinkedIn (Settings → Data privacy → Get a copy of your data) and import the file here.',
      actions: [{ label: 'Search jobs on LinkedIn', run: jobSearch('li') }, { label: 'Import my LinkedIn profile', run: linkedinImport }, { label: 'Copy profile text for LinkedIn', run: function () { var t = linkedinText(); if (!t) { toast('Add your resume first.'); return; } copy(t, 'Copied. Paste each part into your LinkedIn profile.'); } }, { label: 'Save a job from a link', run: saveJobLink }] },
    { id: 'indeed', name: 'Indeed', mark: 'id', desc: 'Search Indeed for jobs that match your profile, then save the ones you like to track and tailor your resume.',
      actions: [{ label: 'Search jobs on Indeed', run: jobSearch('in') }, { label: 'Save a job from a link', run: saveJobLink }, linkAct('Upload my resume to Indeed', 'https://profile.indeed.com/')] },
    { id: 'gmail', name: 'Gmail', mark: 'M', desc: 'Write follow-up emails for the jobs you applied to. Drafts open in Gmail or your email app. Nothing is sent without you.',
      actions: [{ label: 'Draft follow-up emails', run: followUps }] },
    { id: 'gcal', name: 'Google Calendar · Apple Calendar · Outlook', mark: '▦', desc: 'Add your interviews and follow-up dates to the calendar you use.',
      actions: [{ label: 'Download interviews and follow-ups (.ics)', run: function () { var ev = careerEvents(); if (!ev.length) { toast('Add an interview or apply to a job first.'); return; } download('ai-career-calendar.ics', ics('AI Career', ev), 'text/calendar'); toast('Open the file to add ' + ev.length + ' dates to your calendar.'); } }] },
    { id: 'gdocs', name: 'Google Docs', mark: 'D', desc: 'Save your resume as a Google Doc you can edit, share or download as PDF.',
      login: googleLogin(),
      actions: [{ label: 'Save my resume to Google Docs', needs: 'login', run: function () { var t = resumeText(); if (!t) throw new Error('Add your resume first.'); busy('Saving to Google Docs…'); return saveToDocs(((((S() || {}).resume || {}).contact || {}).name || 'My') + ' resume', t).then(function (m) { render(); toast(m); }); } },
        { label: 'Download my resume (text)', run: function () { var t = resumeText(); if (!t) { toast('Add your resume first.'); return; } download('resume.md', t, 'text/markdown'); } }] }
  ];

  /* =====================================================================
     AI PERSONAL ASSISTANT — Gmail, Google Calendar, Google Tasks, Apple Reminders
     ===================================================================== */
  function openTasks() { var s = S() || {}; return (s.tasks || []).filter(function (t) { return !t.done; }); }
  async function gTasks(path, opt) {
    var tok = await googleToken('https://www.googleapis.com/auth/tasks'); opt = opt || {};
    var r = await fetch('https://tasks.googleapis.com/tasks/v1' + path, { method: opt.method || 'GET', headers: Object.assign({ Authorization: 'Bearer ' + tok }, opt.body ? { 'Content-Type': 'application/json' } : {}), body: opt.body ? JSON.stringify(opt.body) : undefined });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error((j.error && j.error.message) || 'Google Tasks error ' + r.status);
    return j;
  }
  async function tasksToGoogle() {
    var t = openTasks(); if (!t.length) { toast('You have no open tasks.'); return; }
    busy('Sending tasks to Google Tasks…'); var n = 0, s = S();
    for (var i = 0; i < t.length; i++) {
      if (t[i].gtask) continue;
      var r = await gTasks('/lists/@default/tasks', { method: 'POST', body: { title: t[i].title, notes: t[i].notes || '', due: t[i].due ? t[i].due + 'T00:00:00.000Z' : undefined } });
      t[i].gtask = r.id; n++;
    }
    commit(); render(); toast(n ? 'Sent ' + n + ' tasks to Google Tasks.' : 'Your tasks are already in Google Tasks.');
  }
  async function tasksFromGoogle() {
    busy('Getting your Google Tasks…');
    var j = await gTasks('/lists/@default/tasks?showCompleted=false&maxResults=100');
    var s = S(), have = (s.tasks || []).map(function (t) { return t.gtask; }), n = 0, a = A();
    (j.items || []).forEach(function (g) {
      if (!g.title || have.indexOf(g.id) >= 0) return;
      var x = { title: g.title, notes: g.notes || '', due: g.due ? g.due.slice(0, 10) : '', gtask: g.id };
      if (a && a.addTask) a.addTask(x, true); else s.tasks.push(Object.assign({ id: uid(), priority: 'medium', est: null, done: false, remindAt: '', createdAt: Date.now() }, x));
      n++;
    });
    commit(); render(); toast(n ? 'Added ' + n + ' tasks from Google Tasks.' : 'No new tasks in Google Tasks.');
  }
  function remindersText() {
    var t = openTasks(), s = S() || {};
    var r = (s.reminders || []).filter(function (x) { return !x.done && !x.fired; });
    return t.map(function (x) { return x.title + (x.due ? ' (due ' + x.due + ')' : ''); }).concat(r.map(function (x) { return x.title + (x.at ? ' (' + new Date(x.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ')' : ''); })).join('\n');
  }
  function aideEvents() {
    var s = S() || {}, ev = [];
    (s.events || []).forEach(function (e) { var st = parseLocal(e.start); if (!st) return; ev.push({ uid: 'ev-' + e.id, title: e.title, start: st, end: parseLocal(e.end), allDay: !!e.allDay, loc: e.location, desc: e.notes, alarm: e.allDay ? null : e.remindMin }); });
    (s.reminders || []).forEach(function (r) { if (r.done || !r.at) return; var d = new Date(r.at); if (isNaN(d)) d = parseLocal(r.at); if (!d) return; ev.push({ uid: 'rm-' + r.id, title: 'Reminder: ' + r.title, start: d, end: new Date(d.getTime() + 15 * 6e4), desc: r.note, alarm: 0 }); });
    openTasks().forEach(function (t) { if (!t.due) return; ev.push({ uid: 'tk-' + t.id, title: 'Due: ' + t.title, start: parseLocal(t.due), allDay: true, desc: t.notes }); });
    return ev;
  }
  async function icsImport() {
    var f = (await pickFile('.ics,text/calendar'))[0]; if (!f) return;
    var ev = parseICS(await readText(f)); if (!ev.length) throw new Error('No events were found in that file.');
    var s = S(), a = A(), n = 0;
    ev.forEach(function (e) {
      var start = e.allDay ? ymd(e.start) : localStamp(e.start), end = e.end ? (e.allDay ? ymd(e.end) : localStamp(e.end)) : '';
      if ((s.events || []).some(function (x) { return x.title === e.title && x.start === start; })) return;
      var x = { title: e.title || 'Event', start: start, end: end, allDay: !!e.allDay, location: e.loc || '', notes: e.desc || '' };
      if (a && a.addEvent) a.addEvent(x, true); else s.events.push(Object.assign({ id: uid(), kind: 'event', remindMin: 15 }, x));
      n++;
    });
    commit(); toast(n ? 'Added ' + n + ' events to your calendar.' : 'Those events are already in your calendar.');
  }
  var AIDE = [
    { id: 'google', name: 'Gmail and Google Calendar', mark: 'G', desc: 'Read and summarize your inbox, draft replies, and see and add Google Calendar events right inside the assistant.',
      status: function () { var s = S() || {}; return s.settings && s.settings.googleLinked ? 'Connected' : ''; },
      actions: [{ label: 'Set up in Settings', run: function () { close(); try { A().go('settings'); } catch (e) { var b = $('#btnSettings'); b && b.click(); } setTimeout(function () { var el = document.querySelector('[id*="googleClientId"],[name*="googleClientId"]'); el && el.scrollIntoView({ block: 'center' }); }, 300); } }] },
    { id: 'gtasks', name: 'Google Tasks', mark: '✓', desc: 'Send your open tasks to Google Tasks, or bring your Google Tasks into the assistant.',
      login: { available: function () { return !!googleId(); }, connected: function () { return !!GT['https://www.googleapis.com/auth/tasks']; }, connect: function () { return googleToken('https://www.googleapis.com/auth/tasks'); }, disconnect: function () { delete GT['https://www.googleapis.com/auth/tasks']; }, who: function () { return ''; } },
      actions: [{ label: 'Send open tasks to Google Tasks', needs: 'login', run: tasksToGoogle }, { label: 'Import from Google Tasks', needs: 'login', run: tasksFromGoogle }] },
    { id: 'reminders', name: 'Apple Reminders', mark: '◉', desc: 'Move your tasks and reminders into Apple Reminders on your iPhone, iPad or Mac.',
      note: 'Apple Reminders has no web connection. Copy your list, then in Reminders tap New Reminder and paste: each line becomes its own reminder. On iPhone, Share also works.',
      actions: [{ label: 'Copy for Apple Reminders', run: function () { var t = remindersText(); if (!t) { toast('You have no open tasks or reminders.'); return; } copy(t, 'Copied. In Reminders, tap New Reminder and paste.'); } },
        { label: 'Share to Reminders', run: function () { var t = remindersText(); if (!t) { toast('You have no open tasks or reminders.'); return; } share({ title: 'My tasks', text: t }); } }] },
    { id: 'cal', name: 'Apple Calendar · Outlook · Google Calendar', mark: '▦', desc: 'Download your events, reminders and due dates as a calendar file, or bring in a calendar file from any app.',
      actions: [{ label: 'Download my calendar (.ics)', run: function () { var ev = aideEvents(); if (!ev.length) { toast('Add an event, reminder or task with a due date first.'); return; } download('ai-assistant-calendar.ics', ics('AI Personal Assistant', ev), 'text/calendar'); toast('Open the file to add ' + ev.length + ' items to your calendar.'); } },
        { label: 'Import a calendar file (.ics)', run: icsImport }] }
  ];

  /* =====================================================================
     AI HEALTH AND FITNESS — Strava, Apple Health, calendars, spreadsheets
     ===================================================================== */
  var STRAVA_TYPES = { Run: 'Run', Ride: 'Ride', Walk: 'Walk', Hike: 'Hike', Swim: 'Swim', WeightTraining: 'Strength training', Workout: 'Workout', Yoga: 'Yoga', VirtualRide: 'Indoor ride', VirtualRun: 'Treadmill run', Rowing: 'Row', Elliptical: 'Elliptical' };
  async function stravaImport() {
    busy('Getting your Strava activities…');
    var tok = await stravaToken();
    var r = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', { headers: { Authorization: 'Bearer ' + tok } });
    var j = await r.json().catch(function () { return []; });
    if (!r.ok) throw new Error((j && j.message) || 'Strava error ' + r.status);
    var s = S(), have = (s.sessions || []).map(function (x) { return x.strava; }), n = 0, metric = (s.profile || {}).units === 'metric';
    (Array.isArray(j) ? j : []).forEach(function (a) {
      if (have.indexOf(a.id) >= 0) return;
      var st = new Date(a.start_date).getTime(), km = (a.distance || 0) / 1000;
      var dist = km ? (metric ? (Math.round(km * 10) / 10) + ' km' : (Math.round(km * 0.621371 * 10) / 10) + ' mi') : '';
      var kind = STRAVA_TYPES[a.sport_type || a.type] || (a.sport_type || a.type || 'Activity');
      s.sessions.push({ id: 'st' + a.id, start: st, end: st + (a.elapsed_time || a.moving_time || 0) * 1000, dayName: kind + (dist ? ' · ' + dist : '') + (a.name ? ' · ' + a.name : ''), planDay: null, ex: [], strava: a.id, cardio: { type: kind, km: Math.round(km * 100) / 100, min: Math.round((a.moving_time || 0) / 60), kcal: a.calories || null, hr: a.average_heartrate || null, src: 'strava' } });
      n++;
    });
    s.sessions.sort(function (a, b) { return a.start - b.start; });
    commit(); render(); toast(n ? 'Imported ' + n + ' activities from Strava.' : 'You\'re up to date with Strava.');
  }
  var DAYSETS = { 1: ['WE'], 2: ['MO', 'TH'], 3: ['MO', 'WE', 'FR'], 4: ['MO', 'TU', 'TH', 'FR'], 5: ['MO', 'TU', 'WE', 'TH', 'FR'], 6: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'], 7: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] };
  async function planCalendar() {
    var s = S() || {}, p = s.plan; if (!p || !(p.days || []).length) { toast('Make a training plan first.'); return; }
    var o = await form('Add my workouts to a calendar', [{ name: 'time', label: 'Workout time', type: 'time', value: '07:00' }, { name: 'len', label: 'Minutes per workout', type: 'number', value: '60' }, { name: 'weeks', label: 'How many weeks', type: 'number', value: '8' }], 'Download calendar file', 'Your ' + p.days.length + '-day plan repeats each week. Open the file to add it to Apple Calendar, Google Calendar or Outlook.');
    if (!o) return;
    var days = DAYSETS[Math.min(7, p.days.length)] || DAYSETS[3], codes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    var hm = (o.time || '07:00').split(':'), weeks = Math.max(1, Math.min(52, +o.weeks || 8)), mins = Math.max(10, +o.len || 60);
    var ev = p.days.map(function (d, i) {
      var start = new Date(); start.setDate(start.getDate() + 1); start.setHours(+hm[0] || 7, +hm[1] || 0, 0, 0);
      while (codes[start.getDay()] !== days[i % days.length]) start.setDate(start.getDate() + 1);
      var ex = (d.ex || d.exercises || []).map(function (e) { return e.name || e.exName || e.exId || ''; }).filter(Boolean);
      return { uid: 'plan-' + i, title: 'Workout: ' + (d.name || 'Day ' + (i + 1)), start: start, end: new Date(start.getTime() + mins * 6e4), rrule: 'FREQ=WEEKLY;COUNT=' + weeks, desc: (ex.length ? ex.join('\n') + '\n\n' : '') + 'Open AI Health and Fitness to log it: ' + location.href.split('#')[0], alarm: 30 };
    });
    download('workout-plan.ics', ics('Workouts', ev), 'text/calendar'); render(); toast('Open the file to add your workouts to your calendar.');
  }
  function fitCSV() {
    var s = S() || {}, rows = [['Date', 'Workout', 'Minutes', 'Exercise', 'Set', 'Weight', 'Reps', 'Distance (km)', 'Source']];
    (s.sessions || []).forEach(function (x) {
      var d = ymd(new Date(x.start)), mins = x.end ? Math.round((x.end - x.start) / 6e4) : '';
      if (x.cardio) { rows.push([d, x.dayName, x.cardio.min || mins, '', '', '', '', x.cardio.km || '', x.cardio.src || '']); return; }
      (x.ex || []).forEach(function (e) { (e.sets || []).forEach(function (st, i) { rows.push([d, x.dayName, mins, e.exId, i + 1, st.w || '', st.r || '', '', 'AI Verse']); }); });
    });
    return rows;
  }
  var FITNESS = [
    { id: 'strava', name: 'Strava', mark: 'St', desc: 'Bring in your runs, rides, walks, swims and other workouts from Strava so they count in your history.',
      login: { available: function () { return !!CFG.stravaClientId; }, connected: function () { return !!(C.tok.strava && C.tok.strava.access); }, connect: stravaLogin, disconnect: function () { delete C.tok.strava; persist(); }, who: function () { return (C.tok.strava && C.tok.strava.who) || ''; } },
      actions: [{ label: 'Import recent activities', needs: 'login', run: stravaImport }] },
    { id: 'health', name: 'Apple Health · Apple Watch', mark: '♥', desc: 'Get your Apple Watch and Apple Health workouts into AI Health and Fitness.',
      note: 'Apple Health only shares data with apps installed on your iPhone, so websites can\'t read it. The easy way: in the Strava app, turn on Settings → Applications, Services and Devices → Health, then import from Strava here. Garmin, Fitbit, Wahoo, Peloton and Zwift can sync to Strava too.',
      actions: [linkAct('Get Strava (free)', 'https://www.strava.com/mobile')] },
    { id: 'cal', name: 'Google Calendar · Apple Calendar · Outlook', mark: '▦', desc: 'Put your training plan on your calendar as weekly workouts with a reminder.',
      actions: [{ label: 'Add my workout plan to a calendar', run: planCalendar }] },
    { id: 'sheets', name: 'Google Sheets · Excel · Numbers', mark: '▤', desc: 'Download your workout history and body measurements as spreadsheets.',
      login: googleLogin(),
      actions: [{ label: 'Download workouts (CSV)', run: function () { var r = fitCSV(); if (r.length < 2) { toast('Log a workout first.'); return; } download('workouts.csv', toCSV(r), 'text/csv'); } },
        { label: 'Save workouts to Google Sheets', needs: 'login', run: async function () { var r = fitCSV(); if (r.length < 2) throw new Error('Log a workout first.'); busy('Saving to Google Sheets…'); var l = await driveSave('AI Fitness workouts', toCSV(r), 'text/csv', 'sheet'); render(); window.open(l, '_blank', 'noopener'); } },
        { label: 'Download measurements (CSV)', run: function () { var s = S() || {}, m = s.measures || []; if (!m.length) { toast('Log a measurement first.'); return; } var keys = Object.keys(m.reduce(function (o, x) { Object.keys(x).forEach(function (k) { if (k !== 'id') o[k] = 1; }); return o; }, {})); download('measurements.csv', toCSV([keys].concat(m.map(function (x) { return keys.map(function (k) { return k === 'ts' || k === 'date' && typeof x[k] === 'number' ? ymd(new Date(x[k])) : x[k]; }); }))), 'text/csv'); } }] },
    { id: 'music', name: 'AI Music', mark: '♫', desc: 'Make a playlist that matches your workout, then save it to Spotify or Apple Music.',
      actions: [linkAct('Make a workout playlist', function () { return base + 'apps/ai-music.html#create'; })] }
  ];

  /* =====================================================================
     AI STOCK AND FINANCE — bank CSV, Google Sheets, Excel, market sites
     ===================================================================== */
  function symbols() { var s = S() || {}; var a = (s.watchlist || []).map(function (x) { return typeof x === 'string' ? x : x.sym; }).concat((s.holdings || []).map(function (h) { return h.sym; })); return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  function pickCol(head, re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return head[i]; return null; }
  function money(v) { if (v == null) return NaN; v = String(v).trim(); if (!v) return NaN; var neg = /^\(.*\)$/.test(v) || /^-/.test(v) || /-$/.test(v); var n = parseFloat(v.replace(/[^0-9.]/g, '')); return isNaN(n) ? NaN : neg ? -n : n; }
  function normDate(v) { v = String(v || '').trim(); var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v); if (m) return m[0]; m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/.exec(v); if (m) { var y = +m[3]; if (y < 100) y += 2000; return y + '-' + pad(+m[1]) + '-' + pad(+m[2]); } var d = new Date(v); return isNaN(d) ? '' : ymd(d); }
  async function bankImport() {
    var f = (await pickFile('.csv,text/csv'))[0]; if (!f) return;
    var rows = csvObjects(await readText(f)); if (!rows.length) throw new Error('That file has no rows.');
    var head = Object.keys(rows[0]);
    var cD = pickCol(head, /^(transaction |posted |post |trans\.? )?date$|^date/i), cDesc = pickCol(head, /desc|payee|merchant|name|memo|details/i);
    var cAmt = pickCol(head, /^amount|^amt|transaction amount/i), cDeb = pickCol(head, /debit|withdrawal|money out|outflow/i), cCred = pickCol(head, /credit|deposit|money in|inflow/i), cCat = pickCol(head, /categor/i);
    if (!cD || !cDesc || !(cAmt || cDeb || cCred)) throw new Error('Couldn\'t find date, description and amount columns in that file. Download the "CSV" version of your statement from your bank.');
    var flip = cAmt && /debit|charge/i.test(pickCol(head, /type/i) || '') ? 0 : 0;
    var s = S(), have = {}, n = 0, skip = 0;
    (s.tx || []).forEach(function (t) { have[t.date + '|' + t.amount + '|' + t.desc] = 1; });
    rows.forEach(function (r) {
      var date = normDate(r[cD]), desc = (r[cDesc] || '').replace(/\s+/g, ' ').trim(), amt;
      if (cAmt) { amt = money(r[cAmt]); var tc = pickCol(head, /^type$|transaction type|cr\/dr/i); if (tc && /debit|dr|withdraw|purchase|sale/i.test(r[tc] || '') && amt > 0) amt = -amt; }
      else { var d = money(r[cDeb]), c = money(r[cCred]); amt = !isNaN(c) && c ? Math.abs(c) : !isNaN(d) && d ? -Math.abs(d) : NaN; }
      if (!date || !desc || isNaN(amt)) { skip++; return; }
      amt = Math.round(amt * 100) / 100;
      var k = date + '|' + amt + '|' + desc; if (have[k]) { skip++; return; } have[k] = 1;
      s.tx.push({ id: uid(), date: date, desc: desc, amount: amt, cat: (cCat && r[cCat]) || (amt > 0 ? 'Income' : 'Other'), source: 'csv' }); n++;
    });
    void flip;
    if (!n) throw new Error(skip ? 'Those transactions are already here, or the rows couldn\'t be read.' : 'No transactions were found.');
    commit();
    result('Transactions imported', '<p>Added ' + n + ' transactions from ' + esc(f.name) + (skip ? ' (' + skip + ' skipped as duplicates or blank)' : '') + '. Spending shows as negative amounts. Check categories in your budget.</p><button class="aivc-btn pri" data-go>Open budget</button>', function (b) { b.querySelector('[data-go]').onclick = function () { close(); try { A().go('budget'); } catch (e) {} }; });
  }
  function finRows(which) {
    var s = S() || {};
    if (which === 'holdings') return [['Symbol', 'Shares', 'Cost per share', 'Account', 'Added']].concat((s.holdings || []).map(function (h) { return [h.sym, h.shares, h.cost, h.account || '', h.added ? ymd(new Date(h.added)) : '']; }));
    if (which === 'tx') return [['Date', 'Description', 'Amount', 'Category', 'Source']].concat((s.tx || []).slice().sort(function (a, b) { return String(b.date).localeCompare(a.date); }).map(function (t) { return [t.date, t.desc, t.amount, t.cat, t.source || '']; }));
    if (which === 'budget') return [['Category', 'Monthly budget']].concat(Object.keys(s.budgets || {}).map(function (k) { return [k, s.budgets[k]]; }));
    return [['Symbol']].concat(symbols().map(function (x) { return [x]; }));
  }
  async function finExport(to) {
    var w = await choose(to === 'g' ? 'Save to Google Sheets' : 'Download a spreadsheet', [['holdings', 'Holdings'], ['tx', 'Transactions'], ['budget', 'Budget'], ['watch', 'Watchlist']], function (x) { return '<b>' + x[1] + '</b><span>' + (finRows(x[0]).length - 1) + ' rows</span>'; });
    if (!w) return;
    var rows = finRows(w[0]); if (rows.length < 2) throw new Error('Nothing to export yet. Add some ' + w[1].toLowerCase() + ' first.');
    if (to === 'g') { busy('Saving to Google Sheets…'); var l = await driveSave('AI Finance ' + w[1].toLowerCase() + ' ' + today(), toCSV(rows), 'text/csv', 'sheet'); render(); window.open(l, '_blank', 'noopener'); return; }
    download('ai-finance-' + w[0] + '.csv', toCSV(rows), 'text/csv'); render();
  }
  async function marketLinks() {
    var syms = symbols(); if (!syms.length) { toast('Add symbols to your watchlist first.'); return; }
    result('Research your symbols', '<p class="aivc-muted">Charts, news and official company filings for your watchlist and holdings.</p><ul class="aivc-songs">' + syms.map(function (x) {
      return '<li><b>' + esc(x) + '</b><div class="aivc-links"><a href="https://www.tradingview.com/symbols/' + q(x) + '/" target="_blank" rel="noopener">TradingView</a><a href="https://finance.yahoo.com/quote/' + q(x) + '" target="_blank" rel="noopener">Yahoo Finance</a><a href="https://www.sec.gov/edgar/search/#/q=' + q(x) + '" target="_blank" rel="noopener">SEC filings</a></div></li>';
    }).join('') + '</ul>');
  }
  var FINANCE = [
    { id: 'bank', name: 'Your bank or credit card', mark: '$', desc: 'Import transactions from any bank, credit card or app that downloads a CSV (Chase, Bank of America, Wells Fargo, Capital One, Amex, PayPal, Venmo and more).',
      note: 'For your security, AI Verse never asks for your bank password. Download a CSV statement from your bank\'s website and import it here. It stays in your browser.',
      actions: [{ label: 'Import transactions (CSV)', run: bankImport }] },
    { id: 'sheets', name: 'Google Sheets', mark: '▤', desc: 'Save your holdings, transactions, budget or watchlist as a Google Sheet.',
      login: googleLogin(), actions: [{ label: 'Save to Google Sheets', needs: 'login', run: function () { return finExport('g'); } }] },
    { id: 'excel', name: 'Excel · Numbers', mark: 'X', desc: 'Download your holdings, transactions, budget or watchlist as a spreadsheet file.',
      actions: [{ label: 'Download a spreadsheet (CSV)', run: function () { return finExport('f'); } }] },
    { id: 'markets', name: 'TradingView · Yahoo Finance · SEC EDGAR', mark: '↗', desc: 'Open charts, news and official filings for the symbols you follow.',
      actions: [{ label: 'Open my symbols', run: marketLinks }] }
  ];

  /* =====================================================================
     AI PHOTO — Dropbox, Google Drive, share to any app
     ===================================================================== */
  function photoDB() {
    return new Promise(function (res, rej) { var r = indexedDB.open('photointel', 1); r.onupgradeneeded = function () { r.result.createObjectStore('items', { keyPath: 'id' }); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(new Error('Browser storage is unavailable.')); }; });
  }
  async function photoItems() {
    var db = await photoDB();
    return new Promise(function (res, rej) { var t = db.transaction('items', 'readonly').objectStore('items').getAll(); t.onsuccess = function () { res((t.result || []).sort(function (a, b) { return b.updated - a.updated; })); }; t.onerror = function () { rej(t.error); }; });
  }
  async function pickPhotos(title, multi) {
    var items = await photoItems(); if (!items.length) { toast('Your library is empty. Save a photo first.'); return null; }
    return new Promise(function (res) {
      var sel = {};
      sub(title, '<div class="aivc-gal">' + items.map(function (it) { return '<button type="button" class="aivc-gi" data-id="' + esc(it.id) + '" aria-pressed="false"><img alt="' + esc(it.name) + '" src="' + esc(it.thumb || '') + '"><span>' + esc(it.name) + '</span></button>'; }).join('') + '</div>' + (multi ? '<button class="aivc-btn pri" data-ok disabled>Continue</button>' : ''), function (b) {
        $$('.aivc-gi', b).forEach(function (x) { x.onclick = function () {
          var it = items.find(function (i) { return i.id === x.dataset.id; });
          if (!multi) { res([it]); return; }
          sel[it.id] = sel[it.id] ? null : it; x.setAttribute('aria-pressed', sel[it.id] ? 'true' : 'false');
          b.querySelector('[data-ok]').disabled = !Object.values(sel).some(Boolean);
        }; });
        if (multi) b.querySelector('[data-ok]').onclick = function () { res(Object.values(sel).filter(Boolean)); };
        b.querySelector('[data-back]').onclick = function () { render(); res(null); };
      });
    });
  }
  function ext(it) { return (it.blob && it.blob.type === 'image/png') ? '.png' : '.jpg'; }
  function safeName(n) { return String(n || 'photo').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) || 'photo'; }
  async function openInApp(blob, name) {
    var f = new File([blob], name, { type: blob.type || 'image/jpeg' }), a = A();
    if (a && a.openFile) { close(); await a.openFile(f); return; }
    throw new Error('Couldn\'t open the photo in the editor.');
  }
  async function dropboxChoose() {
    var key = CFG.dropboxAppKey; if (!key) throw new Error('Dropbox isn\'t available yet.');
    await script('https://www.dropbox.com/static/api/2/dropins.js', { id: 'dropboxjs', 'data-app-key': key });
    var files = await new Promise(function (res) { Dropbox.choose({ linkType: 'direct', multiselect: false, extensions: ['images'], success: res, cancel: function () { res(null); } }); });
    if (!files || !files[0]) return;
    busy('Getting your photo from Dropbox…');
    var r = await fetch(files[0].link); if (!r.ok) throw new Error('Couldn\'t download that photo from Dropbox.');
    await openInApp(await r.blob(), files[0].name);
  }
  async function dropboxSave() {
    var items = await pickPhotos('Choose photos to save to Dropbox', true); if (!items || !items.length) return;
    var tok = await pkToken('dropbox');
    for (var i = 0; i < items.length; i++) {
      busy('Saving to Dropbox… ' + (i + 1) + ' of ' + items.length);
      var r = await fetch('https://content.dropboxapi.com/2/files/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': JSON.stringify({ path: '/AI Photo/' + safeName(items[i].name) + ext(items[i]), mode: 'add', autorename: true }).replace(/[\u007f-\uffff]/g, function (c) { return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4); }) }, body: items[i].blob });
      if (!r.ok) { var t = await r.text().catch(function () { return ''; }); throw new Error('Dropbox didn\'t accept the photo' + (/insufficient_space/.test(t) ? ': your Dropbox is full.' : '.')); }
    }
    result('Saved to Dropbox', '<p>Saved ' + items.length + ' photo' + (items.length > 1 ? 's' : '') + ' to the AI Photo folder in your Dropbox.</p><a class="aivc-btn pri" href="https://www.dropbox.com/home" target="_blank" rel="noopener">Open Dropbox</a>');
  }
  async function driveSavePhotos() {
    var items = await pickPhotos('Choose photos to save to Google Drive', true); if (!items || !items.length) return;
    var link = '';
    for (var i = 0; i < items.length; i++) { busy('Saving to Google Drive… ' + (i + 1) + ' of ' + items.length); link = await driveSave(safeName(items[i].name) + ext(items[i]), items[i].blob, items[i].blob.type, ''); }
    result('Saved to Google Drive', '<p>Saved ' + items.length + ' photo' + (items.length > 1 ? 's' : '') + ' to your Google Drive.</p><a class="aivc-btn pri" href="' + esc(items.length === 1 ? link : 'https://drive.google.com/drive/recent') + '" target="_blank" rel="noopener">Open Google Drive</a>');
  }
  async function sharePhoto() {
    var items = await pickPhotos('Choose a photo to share', false); if (!items) return;
    var it = items[0], f = new File([it.blob], safeName(it.name) + ext(it), { type: it.blob.type || 'image/jpeg' });
    render();
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: it.name }); } catch (e) { if (e.name !== 'AbortError') toast('Sharing didn\'t work on this device.', true); } return; }
    download(f.name, f); toast('Downloaded. This browser can\'t share photos to other apps directly.');
  }
  var PHOTO = [
    { id: 'dropbox', name: 'Dropbox', mark: 'Db', desc: 'Open photos from your Dropbox to edit, and save your edits and creations back to a Dropbox folder.',
      login: pkLoginObj('dropbox'),
      actions: [{ label: 'Open a photo from Dropbox', run: dropboxChoose, avail: function () { return !!CFG.dropboxAppKey; } }, { label: 'Save photos to Dropbox', needs: 'login', run: dropboxSave }] },
    { id: 'gdrive', name: 'Google Drive · Google Photos', mark: 'G', desc: 'Save your photos to Google Drive. Turn on Google Photos backup for that folder to see them in Google Photos too.',
      login: googleLogin(), actions: [{ label: 'Save photos to Google Drive', needs: 'login', run: driveSavePhotos }] },
    { id: 'share', name: 'Instagram · Messages · any app', mark: '↗', desc: 'Share a photo straight to Instagram, Messages, WhatsApp, email or any app on your phone.',
      actions: [{ label: 'Share a photo', run: sharePhoto }] },
    { id: 'icloud', name: 'iCloud Photos · Apple Photos', mark: '☁', desc: 'Use photos from your iPhone or Mac.',
      note: 'Apple Photos has no web connection, but your iPhone\'s photo picker opens it: choose Upload in AI Photo, then pick from Photos. To save to Photos, use Share a photo and choose Save Image.',
      actions: [{ label: 'Open a photo from my device', run: async function () { var f = (await pickFile('image/*'))[0]; if (f) await openInApp(f, f.name); } }] }
  ];

  /* =====================================================================
     AI STUDY AND RESEARCH — Anki, Quizlet, Notion, Google Docs
     ===================================================================== */
  function topic() { var s = S() || {}; return (s.tutor && s.tutor.topic) || ''; }
  async function makeDeck() {
    var a = A(); if (!a || !a.ai) throw new Error('Turn on AI in Settings first.');
    var o = await form('Make a flashcard deck', [{ name: 'topic', label: 'Topic', value: topic(), required: true, ph: 'e.g. Cell biology' }, { name: 'n', label: 'Number of cards', type: 'select', value: '20', options: [['10', '10'], ['20', '20'], ['30', '30'], ['40', '40']] }, { name: 'focus', label: 'Focus (optional)', ph: 'e.g. key terms for my exam' }], 'Make cards', 'AI writes the cards, then you can send them to Anki, Quizlet, Notion or Google Docs.');
    if (!o) return;
    busy('Writing ' + o.n + ' flashcards…');
    var raw = await a.ai('Make ' + o.n + ' study flashcards on "' + o.topic + '"' + (o.focus ? ' (focus: ' + o.focus + ')' : '') + '. Each card tests one fact or idea. Front: a short question or term. Back: a clear, correct answer in 1-2 sentences. Reply as JSON: {"cards":[{"f":"front","b":"back"}]}', { json: true, temp: 0.4, max: 4000, system: 'You are a careful tutor. Only include facts you are confident are correct.' });
    var j = raw; if (typeof raw === 'string') { try { j = JSON.parse(raw.replace(/^```(json)?|```$/g, '').trim()); } catch (e) { var m = raw.match(/\{[\s\S]*\}/); j = m ? JSON.parse(m[0]) : null; } }
    var cards = ((j && j.cards) || []).filter(function (c) { return c && c.f && c.b; });
    if (!cards.length) throw new Error('The AI\'s reply couldn\'t be read. Try again.');
    deckView(o.topic, cards);
  }
  function deckView(name, cards) {
    var tsv = cards.map(function (c) { return String(c.f).replace(/[\t\n]+/g, ' ') + '\t' + String(c.b).replace(/[\t\n]+/g, ' '); }).join('\n');
    var md = '# ' + name + ' flashcards\n\n' + cards.map(function (c) { return '- **' + c.f + '**: ' + c.b; }).join('\n');
    result(name + ': ' + cards.length + ' cards', '<div class="aivc-row"><button class="aivc-btn pri" data-k="anki">Download for Anki</button><button class="aivc-btn" data-k="quizlet">Copy for Quizlet</button><button class="aivc-btn" data-k="notion">Copy for Notion</button><button class="aivc-btn" data-k="docs">Save to Google Docs</button><button class="aivc-btn" data-k="csv">Download CSV</button></div>' +
      '<p class="aivc-muted small">Anki: File → Import, choose the file, fields separated by Tab. Quizlet: Create → Import, paste, "Between term and definition: Tab", "Between cards: New line".</p>' +
      '<ol class="aivc-songs">' + cards.map(function (c) { return '<li><b>' + esc(c.f) + '</b><span>' + esc(c.b) + '</span></li>'; }).join('') + '</ol>', function (b) {
      $$('[data-k]', b).forEach(function (x) { x.onclick = async function () {
        var k = x.dataset.k;
        try {
          if (k === 'anki') download(safeName(name) + ' (Anki).txt', '#separator:tab\n#html:false\n' + tsv, 'text/plain');
          if (k === 'quizlet') copy(tsv, 'Copied. In Quizlet, choose Import and paste.');
          if (k === 'notion') copy(md, 'Copied. Paste into a Notion page.');
          if (k === 'csv') download(safeName(name) + ' flashcards.csv', toCSV([['Front', 'Back']].concat(cards.map(function (c) { return [c.f, c.b]; }))), 'text/csv');
          if (k === 'docs') { if (!googleId()) throw new Error('Google sign-in isn\'t available yet. Use Copy for Notion and paste into a Google Doc.'); x.disabled = true; var m = await saveToDocs(name + ' flashcards', md); toast(m); x.disabled = false; }
        } catch (e) { x.disabled = false; toast(e.message, true); }
      }; });
    });
  }
  function studyNotes() {
    var s = S() || {}, t = s.tutor || {}, L = [];
    if (t.topic) {
      L.push('# ' + t.topic, '');
      if ((t.nodes || []).length) { L.push('## Concept map'); t.nodes.forEach(function (n) { L.push('- ' + n.name + (typeof n.m === 'number' ? ' (mastery ' + Math.round(n.m * (n.m <= 1 ? 100 : 1)) + '%)' : '')); }); L.push(''); }
    }
    var chat = (s.chat || []).filter(function (m) { return m && m.text; });
    if (chat.length) { L.push('## Tutor chat', ''); chat.forEach(function (m) { L.push('**' + (m.role === 'user' ? 'Me' : 'Tutor') + ':** ' + m.text, ''); }); }
    if (s.lab && s.lab.ptext) { L.push('## ' + (s.lab.ptitle || 'Research notes'), '', s.lab.ptext, ''); }
    return L.join('\n').trim();
  }
  var STUDY = [
    { id: 'anki', name: 'Anki · Quizlet', mark: 'A', desc: 'Have AI write a flashcard deck on any topic, then send it to Anki or Quizlet to study with spaced repetition.',
      actions: [{ label: 'Make a flashcard deck', run: makeDeck }] },
    { id: 'notion', name: 'Notion · Obsidian', mark: 'N', desc: 'Copy your concept map, tutor chat and research notes as Markdown to paste into Notion or Obsidian.',
      actions: [{ label: 'Copy my notes for Notion', run: function () { var t = studyNotes(); if (!t) { toast('Start a topic or chat with the tutor first.'); return; } copy(t, 'Copied. Paste into a Notion page.'); } },
        { label: 'Download notes (Markdown)', run: function () { var t = studyNotes(); if (!t) { toast('Start a topic or chat with the tutor first.'); return; } download(safeName(topic() || 'study notes') + '.md', t, 'text/markdown'); } }] },
    { id: 'gdocs', name: 'Google Docs · Google Classroom', mark: 'D', desc: 'Save your study notes as a Google Doc to keep, share with a study group or turn in through Google Classroom.',
      login: googleLogin(), actions: [{ label: 'Save my notes to Google Docs', needs: 'login', run: async function () { var t = studyNotes(); if (!t) throw new Error('Start a topic or chat with the tutor first.'); busy('Saving to Google Docs…'); var m = await saveToDocs((topic() || 'Study') + ' notes', t); render(); toast(m); } }] },
    { id: 'scholar', name: 'Google Scholar · Wikipedia', mark: 'W', desc: 'Look up sources for the topic you\'re studying.',
      actions: [linkAct('Search Google Scholar', function () { return 'https://scholar.google.com/scholar?q=' + q(topic() || ''); }), linkAct('Open Wikipedia', function () { return 'https://en.wikipedia.org/w/index.php?search=' + q(topic() || ''); })] }
  ];

  var REG = { music: MUSIC, career: CAREER, aide: AIDE, fitness: FITNESS, finance: FINANCE, photo: PHOTO, study: STUDY };
  var NAMES = { music: 'AI Music', career: 'AI Career', aide: 'AI Personal Assistant', fitness: 'AI Health and Fitness', finance: 'AI Stock and Finance', photo: 'AI Photo', study: 'AI Study and Research' };

  /* =====================================================================
     MCP — use MCP servers' tools in the app (Streamable HTTP)
     ===================================================================== */
  var AIV_MCP = { id: 'aiverse', name: 'AI Verse', url: SERVER + '/mcp', token: '', builtin: true };
  function servers() { return [AIV_MCP].concat(C.mcp); }
  var MS = {};   // session ids by url
  async function rpc(srv, method, params, isNote) {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' };
    var tok = srv.builtin ? aivKey() : srv.token; if (tok) h.Authorization = 'Bearer ' + tok;
    if (MS[srv.url]) h['Mcp-Session-Id'] = MS[srv.url];
    var msg = { jsonrpc: '2.0', method: method }; if (params) msg.params = params; if (!isNote) msg.id = Math.floor(Math.random() * 1e9);
    var r;
    try { r = await fetch(srv.url, { method: 'POST', headers: h, body: JSON.stringify(msg) }); }
    catch (e) { throw new Error('Couldn\'t reach ' + srv.name + '. The server may be offline, or it doesn\'t allow connections from websites (CORS).'); }
    var sid = r.headers.get('Mcp-Session-Id'); if (sid) MS[srv.url] = sid;
    if (isNote) return null;
    if (r.status === 401 || r.status === 403) throw new Error(srv.name + ' needs a valid access token.');
    var ct = r.headers.get('Content-Type') || '', j = null;
    if (/event-stream/.test(ct)) {
      var txt = await r.text();
      txt.split(/\n\n/).forEach(function (ev) { var d = ev.split('\n').filter(function (l) { return l.indexOf('data:') === 0; }).map(function (l) { return l.slice(5).trim(); }).join(''); if (!d) return; try { var o = JSON.parse(d); if (o.id === msg.id) j = o; } catch (e) {} });
    } else j = await r.json().catch(function () { return null; });
    if (!r.ok && !j) throw new Error(srv.name + ' returned an error (' + r.status + ').');
    if (!j) throw new Error(srv.name + ' sent a reply that couldn\'t be read.');
    if (j.error) throw new Error(j.error.message || 'The tool returned an error.');
    return j.result;
  }
  async function mcpInit(srv) {
    if (srv._ready) return;
    await rpc(srv, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'AI Verse ' + (NAMES[APP] || 'app'), version: '1.0' } });
    try { await rpc(srv, 'notifications/initialized', null, true); } catch (e) {}
    srv._ready = true;
  }
  function aivKey() { var s = S() || {}; return (s.settings && s.settings.aivKey) || ''; }
  async function mcpTools(srv) {
    busy('Connecting to ' + srv.name + '…');
    await mcpInit(srv);
    var res = await rpc(srv, 'tools/list', {});
    var tools = (res && res.tools) || [];
    // AI Verse server: show this app's tools first
    if (srv.builtin) tools.sort(function (a, b) { var x = (a._meta && a._meta.app) === APP ? 0 : 1, y = (b._meta && b._meta.app) === APP ? 0 : 1; return x - y; });
    sub(srv.name + ' tools', (srv.builtin ? '<p class="aivc-muted">Free tools from AI Verse. ' + (aivKey() ? 'Using your AIV key.' : 'Add an AIV key in Settings for unlimited use.') + '</p>' : '') +
      (tools.length ? '<div class="aivc-pick">' + tools.map(function (t, i) { return '<button type="button" class="aivc-opt" data-i="' + i + '"><b>' + esc(t.title || (t.annotations && t.annotations.title) || t.name) + '</b><span>' + esc(t.description || '') + '</span></button>'; }).join('') + '</div>' : '<p>This server has no tools.</p>'),
      function (b) { $$('[data-i]', b).forEach(function (x) { x.onclick = function () { runTool(srv, tools[+x.dataset.i]); }; }); b.querySelector('[data-back]').onclick = function () { tab = 'mcp'; render(); }; });
  }
  function runTool(srv, t) {
    var sch = t.inputSchema || {}, props = sch.properties || {}, req = sch.required || [];
    var fields = Object.keys(props).map(function (k) {
      var p = props[k], lab0 = p.title || k.replace(/_/g, ' '), lab = (lab0.charAt(0).toUpperCase() + lab0.slice(1)) + (req.indexOf(k) >= 0 ? '' : ' (optional)');
      if (p.enum) return { name: k, label: lab, type: 'select', value: p.default != null ? String(p.default) : String(p.enum[0]), options: p.enum.map(function (v) { return [String(v), String(v)]; }), kind: p.type };
      if (p.type === 'boolean') return { name: k, label: lab, type: 'select', value: p.default ? 'true' : 'false', options: [['true', 'Yes'], ['false', 'No']], kind: 'boolean' };
      if (p.type === 'number' || p.type === 'integer') return { name: k, label: lab, type: 'number', value: p.default != null ? String(p.default) : '', kind: p.type };
      if (p.type === 'array' || p.type === 'object') return { name: k, label: lab + ' (JSON)', type: 'textarea', rows: 3, kind: p.type, ph: p.type === 'array' ? '["one","two"]' : '{}' };
      return { name: k, label: lab, type: (p.maxLength || 0) > 200 || /text|description|resume|notes|tasks|content|job/i.test(k) ? 'textarea' : 'text', value: p.default || '', ph: p.description || '', kind: 'string', required: req.indexOf(k) >= 0 };
    });
    sub(t.title || t.name, '<p class="aivc-muted">' + esc(t.description || '') + '</p><form class="aivc-form">' + fields.map(function (f) {
      var input = f.type === 'textarea' ? '<textarea name="' + f.name + '" rows="' + (f.rows || 4) + '" placeholder="' + esc(f.ph || '') + '">' + esc(f.value || '') + '</textarea>'
        : f.type === 'select' ? '<select name="' + f.name + '">' + f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === f.value ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'
        : '<input name="' + f.name + '" type="' + f.type + '" value="' + esc(f.value || '') + '" placeholder="' + esc(f.ph || '') + '"' + (f.required ? ' required' : '') + '>';
      return '<label><span>' + esc(f.label) + '</span>' + input + '</label>';
    }).join('') + '<button type="submit" class="aivc-btn pri">Run</button></form><div class="aivc-out" aria-live="polite"></div>', function (b) {
      b.querySelector('[data-back]').onclick = function () { mcpTools(srv).catch(function (e) { toast(e.message, true); render(); }); };
      var fm = b.querySelector('form'), out = b.querySelector('.aivc-out');
      fm.onsubmit = async function (e) {
        e.preventDefault();
        var args = {};
        try {
          fields.forEach(function (f) {
            var v = fm.elements[f.name].value.trim(); if (v === '') return;
            if (f.kind === 'number' || f.kind === 'integer') args[f.name] = Number(v);
            else if (f.kind === 'boolean') args[f.name] = v === 'true';
            else if (f.kind === 'array' || f.kind === 'object') args[f.name] = JSON.parse(v);
            else args[f.name] = v;
          });
        } catch (x) { toast('Check the JSON fields.', true); return; }
        if (props.date && !args.date) args.date = today();
        var btn = fm.querySelector('button[type=submit]'); btn.disabled = true; out.innerHTML = '<div class="aivc-busy"><span class="aivc-spin"></span>Running…</div>';
        try {
          await mcpInit(srv);
          var r = await rpc(srv, 'tools/call', { name: t.name, arguments: args });
          var text = ((r && r.content) || []).map(function (c) { return c.type === 'text' ? c.text : c.type === 'image' ? '[image]' : c.type === 'resource_link' ? (c.name || c.uri) + ': ' + c.uri : ''; }).filter(Boolean).join('\n\n');
          if (!text && r && r.structuredContent) text = JSON.stringify(r.structuredContent, null, 2);
          var imgs = ((r && r.content) || []).filter(function (c) { return c.type === 'image' && c.data; });
          out.innerHTML = (r && r.isError ? '<p class="aivc-err">The tool reported a problem:</p>' : '') + '<pre class="aivc-pre">' + linkify(esc(text || 'Done.')) + '</pre>' + imgs.map(function (c) { return '<img class="aivc-img" alt="Tool result" src="data:' + esc(c.mimeType || 'image/png') + ';base64,' + esc(c.data) + '">'; }).join('') + '<div class="aivc-row"><button class="aivc-btn" data-cp>Copy</button>' + (r && r.structuredContent && r.structuredContent.anki ? '<button class="aivc-btn" data-anki>Download for Anki</button>' : '') + (r && r.structuredContent && r.structuredContent.ics ? '<button class="aivc-btn" data-ics>Add to calendar</button>' : '') + '</div>';
          out.querySelector('[data-cp]').onclick = function () { copy(text); };
          var an = out.querySelector('[data-anki]'); if (an) an.onclick = function () { download('flashcards (Anki).txt', '#separator:tab\n#html:false\n' + r.structuredContent.anki, 'text/plain'); };
          var ic = out.querySelector('[data-ics]'); if (ic) ic.onclick = function () { download('plan.ics', r.structuredContent.ics, 'text/calendar'); };
        } catch (x) { out.innerHTML = '<p class="aivc-err">' + esc(x.message) + '</p>'; }
        btn.disabled = false;
      };
    });
  }
  function linkify(h) { return h.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }
  async function addServer() {
    var o = await form('Add an MCP server', [{ name: 'name', label: 'Name', required: true, ph: 'e.g. My notes server' }, { name: 'url', label: 'Server URL', type: 'url', required: true, ph: 'https://example.com/mcp' }, { name: 'token', label: 'Access token (optional)', type: 'password', ph: 'Only if the server needs one' }], 'Add server', 'Add any MCP server that uses Streamable HTTP and allows connections from websites. Your token stays in this browser.');
    if (!o) { tab = 'mcp'; render(); return; }
    if (!/^https:\/\//i.test(o.url) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(o.url)) { toast('Use an https:// address.', true); tab = 'mcp'; render(); return; }
    var srv = { id: uid(), name: o.name, url: o.url, token: o.token };
    C.mcp.push(srv); persist(); tab = 'mcp';
    try { await mcpTools(srv); } catch (e) { toast(e.message, true); render(); }
  }

  /* =====================================================================
     PANEL
     ===================================================================== */
  var css = '' +
    '.aivc-scrim{position:fixed;inset:0;z-index:2147483500;background:rgba(0,0,0,.42);opacity:0;transition:opacity .18s}.aivc-scrim.open{opacity:1}' +
    '.aivc-panel{position:fixed;z-index:2147483501;top:0;right:0;bottom:0;width:min(460px,100vw);background:var(--bg,#fff);color:var(--ink,#111);border-left:1px solid var(--line,#e7e5e1);box-shadow:-20px 0 60px rgba(0,0,0,.18);display:flex;flex-direction:column;transform:translateX(102%);transition:transform .22s ease;font:400 14.5px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.aivc-panel.open{transform:none}' +
    '@media (max-width:640px){.aivc-panel{top:auto;left:0;width:100%;max-height:92vh;border-left:0;border-radius:20px 20px 0 0;transform:translateY(102%)}}' +
    '.aivc-top{display:flex;align-items:center;gap:10px;padding:16px 18px 10px}.aivc-top h2{margin:0;font-size:18px;font-weight:650;letter-spacing:-.01em;flex:1}' +
    '.aivc-x{border:0;background:transparent;color:inherit;width:36px;height:36px;border-radius:99px;cursor:pointer;font-size:20px;line-height:1}.aivc-x:hover{background:var(--box,rgba(0,0,0,.06))}' +
    '.aivc-tabs{display:flex;gap:6px;padding:0 18px 10px;border-bottom:1px solid var(--line,#e7e5e1)}' +
    '.aivc-tab{border:1px solid var(--line,#e7e5e1);background:transparent;color:inherit;border-radius:99px;padding:7px 14px;font:600 13px/1 inherit;font-family:inherit;cursor:pointer}.aivc-tab[aria-selected="true"]{background:var(--ink,#111);color:var(--bg,#fff);border-color:var(--ink,#111)}' +
    '.aivc-body{flex:1;overflow:auto;padding:14px 18px calc(24px + env(safe-area-inset-bottom))}' +
    '.aivc-card{border:1px solid var(--line,#e7e5e1);border-radius:16px;padding:14px;margin:0 0 12px;background:var(--card,transparent)}' +
    '.aivc-hd{display:flex;align-items:center;gap:10px;margin-bottom:6px}.aivc-mk{flex:none;width:34px;height:34px;border-radius:10px;background:var(--box,#f3f2ef);display:flex;align-items:center;justify-content:center;font:700 13px/1 inherit;font-family:inherit}' +
    '.aivc-hd b{font-size:15px;flex:1}.aivc-st{font-size:12px;color:var(--muted,#6e6c68);white-space:nowrap}.aivc-st.on{color:var(--good,#1a7f37)}' +
    '.aivc-card p{margin:0 0 10px;color:var(--muted,#6e6c68);font-size:13.5px}.aivc-note{font-size:12.5px!important;background:var(--box,#f6f5f3);border-radius:10px;padding:8px 10px}' +
    '.aivc-row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}' +
    '.aivc-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--line,#d9d7d2);background:transparent;color:inherit;border-radius:99px;padding:8px 14px;font:600 13px/1.2 inherit;font-family:inherit;cursor:pointer;text-decoration:none}' +
    '.aivc-btn:hover{background:var(--box,rgba(0,0,0,.05))}.aivc-btn.pri{background:var(--btn,var(--ink,#111));color:var(--btn-ink,var(--bg,#fff));border-color:transparent}.aivc-btn:disabled{opacity:.45;cursor:not-allowed}' +
    '.aivc-btn:focus-visible,.aivc-tab:focus-visible,.aivc-x:focus-visible,.aivc-opt:focus-visible,.aivc-gi:focus-visible{outline:2px solid var(--ink,#111);outline-offset:2px}' +
    '.aivc-back{border:0;background:transparent;color:var(--muted,#6e6c68);font:600 13px inherit;font-family:inherit;cursor:pointer;padding:4px 0;margin-bottom:6px}' +
    '.aivc-h3{margin:0 0 10px;font-size:17px;font-weight:650}.aivc-muted{color:var(--muted,#6e6c68);font-size:13.5px;margin:0 0 12px}.aivc-muted.small{font-size:12px}' +
    '.aivc-pick{display:flex;flex-direction:column;gap:8px}.aivc-opt{text-align:left;border:1px solid var(--line,#e7e5e1);background:transparent;color:inherit;border-radius:12px;padding:11px 13px;cursor:pointer;font:inherit;display:flex;flex-direction:column;gap:2px}.aivc-opt:hover{background:var(--box,rgba(0,0,0,.04))}.aivc-opt span{font-size:12.5px;color:var(--muted,#6e6c68)}' +
    '.aivc-form{display:flex;flex-direction:column;gap:12px}.aivc-form label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600}' +
    '.aivc-form input,.aivc-form textarea,.aivc-form select{font:400 14.5px/1.4 inherit;font-family:inherit;color:inherit;background:var(--bg,#fff);border:1px solid var(--line,#d9d7d2);border-radius:10px;padding:9px 11px;width:100%;box-sizing:border-box}' +
    '.aivc-songs{padding-left:20px;margin:8px 0}.aivc-songs li{margin:0 0 10px}.aivc-songs span{color:var(--muted,#6e6c68);font-size:13px;display:block}' +
    '.aivc-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:3px;font-size:13px}.aivc-links a{color:inherit;text-underline-offset:2px}' +
    '.aivc-busy{display:flex;align-items:center;gap:10px;padding:22px 4px;color:var(--muted,#6e6c68)}.aivc-spin{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:aivcspin .8s linear infinite}@keyframes aivcspin{to{transform:rotate(360deg)}}' +
    '.aivc-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;margin-bottom:12px}.aivc-gi{border:2px solid transparent;background:var(--box,#f3f2ef);border-radius:12px;padding:4px;cursor:pointer;color:inherit;font:inherit}.aivc-gi[aria-pressed="true"]{border-color:var(--ink,#111)}.aivc-gi img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}.aivc-gi span{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}' +
    '.aivc-pre{white-space:pre-wrap;word-break:break-word;background:var(--box,#f6f5f3);border-radius:12px;padding:12px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;max-height:50vh;overflow:auto}.aivc-pre a{color:inherit}.aivc-img{max-width:100%;border-radius:12px;margin:6px 0}' +
    '.aivc-err{color:var(--bad,#b42318);font-size:13.5px}.aivc-code{display:flex;gap:8px;align-items:center;background:var(--box,#f6f5f3);border-radius:10px;padding:8px 10px;font:12.5px ui-monospace,Menlo,Consolas,monospace;word-break:break-all}.aivc-code span{flex:1}' +
    '.aivc-h4{font-size:13px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#6e6c68);margin:18px 0 8px}' +
    '.aivc-toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483600;background:var(--ink,#111);color:var(--bg,#fff);padding:10px 16px;border-radius:12px;font:500 14px/1.4 system-ui,-apple-system,sans-serif;max-width:min(92vw,440px);box-shadow:0 10px 30px rgba(0,0,0,.25);transition:opacity .3s}.aivc-toast.err{background:var(--bad,#b42318);color:#fff}.aivc-toast.out{opacity:0}' +
    '#btnConnect svg{width:20px;height:20px}.aivc-hbtn{display:inline-flex;align-items:center;justify-content:center;padding:6px 9px;flex:none}' +
    '@media (prefers-reduced-motion:reduce){.aivc-panel,.aivc-scrim{transition:none}.aivc-spin{animation:none}}';
  var PLUG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0V7z"/><path d="M12 17v5"/></svg>';
  var scrimEl, lastFocus;

  function cardHtml(c, i) {
    var L = c.login, avail = L ? L.available() : true, on = L ? L.connected() : false;
    var st = c.status ? c.status() : L ? (on ? 'Connected' + (L.who() ? ' · ' + L.who() : '') : avail ? 'Not connected' : 'Not available yet') : '';
    var acts = (c.actions || []).map(function (a, j) {
      if ((a.needs === 'login' && !avail) || (a.avail && !a.avail())) return '';   // sign-in not set up yet: hide
      var dis = a.needs === 'login' && !on;
      return '<button type="button" class="aivc-btn" data-c="' + i + '" data-a="' + j + '"' + (dis ? ' disabled' : '') + '>' + esc(a.label) + '</button>';
    }).join('');
    var loginBtn = L ? (on ? '<button type="button" class="aivc-btn" data-c="' + i + '" data-l="off">Disconnect</button>' : (avail ? '<button type="button" class="aivc-btn pri" data-c="' + i + '" data-l="on">Connect '  + esc(c.name.split(' ·')[0]) + '</button>' : '')) : '';
    return '<div class="aivc-card"><div class="aivc-hd"><span class="aivc-mk" aria-hidden="true">' + esc(c.mark) + '</span><b>' + esc(c.name) + '</b>' + (st ? '<span class="aivc-st' + (/^Connected/.test(st) ? ' on' : '') + '">' + esc(st) + '</span>' : '') + '</div>' +
      '<p>' + esc(c.desc) + '</p>' + (c.note ? '<p class="aivc-note">' + esc(c.note) + '</p>' : '') + (L && !avail ? '<p class="aivc-note">Sign-in for ' + esc(c.name.split(' ·')[0]) + ' is coming soon. Everything else here works now.</p>' : '') +
      ((loginBtn + acts) ? '<div class="aivc-row">' + loginBtn + acts + '</div>' : '') + '</div>';
  }
  function render() {
    if (!body) return;
    $$('.aivc-tab', panel).forEach(function (t) { t.setAttribute('aria-selected', t.dataset.t === tab ? 'true' : 'false'); });
    if (tab === 'mcp') return renderMcp();
    var R = REG[APP] || [];
    body.innerHTML = '<p class="aivc-muted">Connect ' + esc(NAMES[APP] || 'this app') + ' to the apps you already use. Nothing is shared or sent unless you choose it.</p>' + R.map(cardHtml).join('');
    $$('[data-c]', body).forEach(function (b) {
      b.onclick = async function () {
        var c = R[+b.dataset.c];
        try {
          if (b.dataset.l === 'on') { b.disabled = true; await c.login.connect(); toast(c.name.split(' ·')[0] + ' connected'); render(); return; }
          if (b.dataset.l === 'off') { c.login.disconnect(); toast('Disconnected'); render(); return; }
          var a = c.actions[+b.dataset.a];
          await a.run();
        } catch (e) { toast(e.message || 'Something went wrong.', true); render(); }
      };
    });
  }
  function renderMcp() {
    var url = AIV_MCP.url;
    body.innerHTML = '<p class="aivc-muted">MCP lets AI apps share tools. Use tools from any MCP server here, or use AI Verse tools inside Claude, ChatGPT and other AI apps.</p>' +
      '<div class="aivc-h4">Your MCP servers</div><div class="aivc-pick">' + servers().map(function (s, i) { return '<div class="aivc-opt" style="cursor:default"><b>' + esc(s.name) + (s.builtin ? ' <span style="display:inline;font-weight:500">· built in</span>' : '') + '</b><span>' + esc(s.url) + '</span><div class="aivc-row"><button type="button" class="aivc-btn pri" data-open="' + i + '">Open tools</button>' + (s.builtin ? '' : '<button type="button" class="aivc-btn" data-del="' + i + '">Remove</button>') + '</div></div>'; }).join('') + '</div>' +
      '<div class="aivc-row"><button type="button" class="aivc-btn" data-add>Add an MCP server</button></div>' +
      '<div class="aivc-h4">Use AI Verse in other AI apps</div><div class="aivc-card"><p>Add this address as a custom connector (remote MCP server) in Claude, ChatGPT, Cursor, VS Code or any app that supports MCP. You get AI Verse tools like playlists, flashcards, cover letters, day plans and workout plans.</p><div class="aivc-code"><span>' + esc(url) + '</span><button type="button" class="aivc-btn" data-cpu>Copy</button></div>' +
      '<p class="aivc-note" style="margin-top:10px">Free to try with a daily limit. For unlimited use, add your AIV key as the access token (Authorization: Bearer your-key).</p><a class="aivc-btn" href="' + esc(base + 'mcp.html') + '" target="_blank" rel="noopener">Setup guide</a></div>';
    $$('[data-open]', body).forEach(function (b) { b.onclick = function () { mcpTools(servers()[+b.dataset.open]).catch(function (e) { toast(e.message, true); render(); }); }; });
    $$('[data-del]', body).forEach(function (b) { b.onclick = function () { var s = servers()[+b.dataset.del]; if (!confirm('Remove ' + s.name + '?')) return; C.mcp = C.mcp.filter(function (x) { return x.id !== s.id; }); persist(); render(); }; });
    body.querySelector('[data-add]').onclick = addServer;
    body.querySelector('[data-cpu]').onclick = function () { copy(url); };
  }
  function build() {
    if (panel) return;
    scrimEl = document.createElement('div'); scrimEl.className = 'aivc-scrim'; scrimEl.hidden = true;
    panel = document.createElement('aside'); panel.className = 'aivc-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'aivcT');
    panel.innerHTML = '<div class="aivc-top"><h2 id="aivcT">Connections</h2><button type="button" class="aivc-x" aria-label="Close">×</button></div>' +
      '<div class="aivc-tabs" role="tablist"><button type="button" role="tab" class="aivc-tab" data-t="apps">Apps</button><button type="button" role="tab" class="aivc-tab" data-t="mcp">MCP</button></div><div class="aivc-body"></div>';
    document.body.appendChild(scrimEl); document.body.appendChild(panel);
    body = panel.querySelector('.aivc-body');
    panel.querySelector('.aivc-x').onclick = close; scrimEl.onclick = close;
    $$('.aivc-tab', panel).forEach(function (t) { t.onclick = function () { tab = t.dataset.t; render(); }; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && !panel.hidden) close(); });
  }
  function open(which) {
    build(); tab = which || 'apps'; lastFocus = document.activeElement;
    scrimEl.hidden = false; panel.hidden = false; render();
    requestAnimationFrame(function () { scrimEl.classList.add('open'); panel.classList.add('open'); });
    setTimeout(function () { var x = panel.querySelector('.aivc-x'); x && x.focus(); }, 60);
  }
  function close() {
    if (!panel || panel.hidden) return;
    scrimEl.classList.remove('open'); panel.classList.remove('open');
    setTimeout(function () { scrimEl.hidden = true; panel.hidden = true; }, 230);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  function init() {
    if (!APP) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var settings = document.getElementById('btnSettings'), badge = document.getElementById('aiBadge'), anchor = settings || badge;
    if (anchor && !document.getElementById('btnConnect')) {
      var b = document.createElement('button');
      b.type = 'button'; b.id = 'btnConnect'; b.className = settings ? (settings.className || 'icon-btn') : 'btn ghost sm aivc-hbtn';
      b.setAttribute('aria-label', 'Connections'); b.title = 'Connect apps'; b.innerHTML = PLUG;
      b.onclick = function () { open(); };
      if (settings) settings.parentNode.insertBefore(b, settings); else badge.parentNode.insertBefore(b, badge.nextSibling);
    }
    if (/[#&]connect(ions)?\b/.test(location.hash)) setTimeout(function () { open(/mcp/.test(location.hash) ? 'mcp' : 'apps'); }, 300);
  }
  window.AIVConnect = { open: open, close: close, app: APP, connectors: function () { return REG[APP] || []; }, _util: { parseCSV: parseCSV, csvObjects: csvObjects, ics: ics, parseICS: parseICS, toCSV: toCSV } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
