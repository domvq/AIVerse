/* AI Photo and Video: the Video section.
   - Create with AI: text or a photo to video (Grok Imagine on the AI Verse server; needs an AIV key)
   - Edit with AI: change or extend a clip by describing it (needs an AIV key)
   - Editor: a CapCut-style editor that runs in the browser and is free: trim, split, speed, volume,
     filters, adjustments, transitions, text, auto captions, remove pauses, music, shapes, backgrounds, export.
   Videos and projects are kept on this device (IndexedDB). */
(function () {
  'use strict';
  if (window.AIVVideo) return;

  /* ---------------- basics ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = s => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), x = s - m * 60; return m + ':' + (x < 10 ? '0' : '') + x.toFixed(1); };
  const fmtShort = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const SERVER = ((window.AIV_SITE && window.AIV_SITE.server) || 'https://api.aiverse.it.com').replace(/\/+$/, '');
  const API = SERVER + '/v1', FREE = SERVER + '/apps/photo/v1';
  const settings = () => { try { return (JSON.parse(localStorage.getItem('photointel.v1') || '{}').settings) || {}; } catch (e) { return {}; } };
  const aivKey = () => String(settings().aivKey || '').trim();
  const REQ_PER_SEC = 50;   // shown to the user; the server decides the real count
  const isPhone = () => matchMedia('(max-width: 820px)').matches;
  // On phones, AI video is free to try without a key (a few short videos a day; the server enforces the limits).
  const FREE_VIDEO_SEC = 8, FREE_VIDEO_PER_DAY = 3;
  const freeVideo = () => !aivKey() && isPhone();
  const needsKey = () => !aivKey() && !isPhone();
  const maxSec = () => freeVideo() ? FREE_VIDEO_SEC : 15;

  const I = {
    video: '<rect x="3" y="5" width="13" height="14" rx="2.5"/><path d="m16 10 5-3v10l-5-3z"/>',
    spark: '<path d="M12 3l1.8 4.6L18.5 9.5l-4.7 1.9L12 16l-1.8-4.6L5.5 9.5l4.7-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    wand: '<path d="M15 4V2M15 10V8M11 6h2M17 6h2M4 20 14 10"/><path d="m16 12 1 1"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    speed: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>',
    vol: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    filter: '<circle cx="9" cy="9" r="6"/><circle cx="15" cy="15" r="6"/>',
    adjust: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    trans: '<rect x="3" y="6" width="8" height="12" rx="1.5"/><rect x="13" y="6" width="8" height="12" rx="1.5"/><path d="m10 12 4 0"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    cc: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.5 10.2a2.5 2.5 0 1 0 0 3.6M17.5 10.2a2.5 2.5 0 1 0 0 3.6"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    cut: '<path d="M4 12h3l2-5 3 10 2-5h6"/>',
    shape: '<rect x="4" y="3" width="10" height="18" rx="2"/><rect x="14" y="8" width="7" height="8" rx="1.5"/>',
    bg: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
    exp: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
    start: '<path d="M6 4v16M20 4 9 12l11 8z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    photo: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    ext: '<path d="M4 12h12M12 6l6 6-6 6"/><path d="M20 4v16"/>',
    zin: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>', zout: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/>'
  };
  const ic = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;
  function toast(msg, err) {
    const box = $('#toasts') || document.body, t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : ''); t.innerHTML = '<span>' + esc(msg) + '</span>';
    box.appendChild(t); setTimeout(() => t.remove(), err ? 7000 : 4000);
  }

  /* ---------------- storage on this device ---------------- */
  const DB = {
    db: null,
    open() {
      if (this.db) return this.db;
      return this.db = new Promise((res, rej) => {
        const r = indexedDB.open('aiv-video', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('blobs'); r.result.createObjectStore('kv'); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error || new Error('Browser storage is unavailable.'));
      });
    },
    async op(store, mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction(store, mode), q = fn(tx.objectStore(store)); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); },
    get(store, k) { return this.op(store, 'readonly', s => s.get(k)); },
    put(store, k, v) { return this.op(store, 'readwrite', s => s.put(v, k)); },
    del(store, k) { return this.op(store, 'readwrite', s => s.delete(k)); }
  };
  const safe = p => p.catch(e => { console.warn('Video storage', e); return null; });

  /* ---------------- AI Verse server ---------------- */
  async function readErr(r, fallback) { const j = await r.json().catch(() => ({})); const e = j.error; return new Error((e && (e.message || e)) || fallback); }
  async function videoApi(body) {
    const k = aivKey(), headers = { 'Content-Type': 'application/json' }; if (k) headers.Authorization = 'Bearer ' + k;
    const r = await fetch((k ? API : FREE) + '/videos', { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) throw await readErr(r, 'The video AI had a problem. Please try again.');
    return r.json();
  }
  async function uploadFile(blob) {
    if (blob.size > 24 * 1024 * 1024) throw new Error('That clip is larger than 24 MB. Trim it in the Editor and export it first.');
    const k = aivKey(), headers = { 'Content-Type': blob.type || 'video/mp4' }; if (k) headers.Authorization = 'Bearer ' + k;
    const r = await fetch((k ? API : FREE) + '/videos/upload', { method: 'POST', headers, body: blob });
    if (!r.ok) throw await readErr(r, 'Couldn\'t upload the clip. Please try again.');
    return (await r.json()).url;
  }
  async function chatAI(system, user, json) {
    const k = aivKey(), headers = { 'Content-Type': 'application/json' };
    if (k) headers.Authorization = 'Bearer ' + k;
    const body = { model: k ? 'aiv-1' : 'free', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 800, temperature: 0.7 };
    if (json) body.response_format = { type: 'json_object' };
    const r = await fetch((k ? API : FREE) + '/chat/completions', { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) throw await readErr(r, 'The AI couldn\'t answer right now.');
    const j = await r.json(); const t = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    return String(t).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }
  async function transcribeWav(wav) {
    const k = aivKey(), fd = new FormData();
    fd.append('file', wav, 'audio.wav'); fd.append('timestamps', '1');
    const r = await fetch((k ? API : FREE) + '/audio/transcriptions', { method: 'POST', headers: k ? { Authorization: 'Bearer ' + k } : {}, body: fd });
    if (!r.ok) throw await readErr(r, 'Couldn\'t make captions right now.');
    return r.json();
  }
  const blobToDataURL = b => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(f.result); f.onerror = () => rej(f.error); f.readAsDataURL(b); });
  async function shrinkPhoto(blob, max) {
    const url = URL.createObjectURL(blob);
    try {
      const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That picture couldn\'t be read.')); i.src = url; });
      const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.9);
    } finally { URL.revokeObjectURL(url); }
  }
  function mediaDuration(blob) {
    return new Promise(res => {
      const v = document.createElement('video'), url = URL.createObjectURL(blob);
      v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = () => { let d = v.duration; if (!isFinite(d)) d = 0; URL.revokeObjectURL(url); res({ dur: d, w: v.videoWidth, h: v.videoHeight }); };
      v.onerror = () => { URL.revokeObjectURL(url); res({ dur: 0, w: 0, h: 0 }); };
      v.src = url;
    });
  }

  /* ---------------- my videos ---------------- */
  let MINE = [];
  async function loadMine() { MINE = (await safe(DB.get('kv', 'mine'))) || []; return MINE; }
  async function saveMine() { await safe(DB.put('kv', 'mine', MINE.slice(0, 60))); }
  async function addMine(blob, meta) {
    const id = uid(); await safe(DB.put('blobs', 'm:' + id, blob));
    MINE.unshift(Object.assign({ id, at: Date.now(), type: blob.type, size: blob.size }, meta)); await saveMine();
    return id;
  }
  async function mineBlob(id) { return DB.get('blobs', 'm:' + id); }
  async function delMine(id) { MINE = MINE.filter(x => x.id !== id); await saveMine(); await safe(DB.del('blobs', 'm:' + id)); }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  const extFor = t => /mp4/.test(t || '') ? 'mp4' : /quicktime/.test(t || '') ? 'mov' : 'webm';
  // photos already in AI Photo's library
  async function libraryPhotos() {
    try {
      const db = await new Promise((res, rej) => { const r = indexedDB.open('photointel', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onupgradeneeded = () => { r.transaction.abort(); rej(new Error('none')); }; });
      return await new Promise(res => { const q = db.transaction('items').objectStore('items').getAll(); q.onsuccess = () => res((q.result || []).filter(x => x && x.blob).sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 40)); q.onerror = () => res([]); });
    } catch (e) { return []; }
  }

  /* ---------------- styles ---------------- */
  function css() {
    if ($('#vsCss')) return;
    const st = document.createElement('style'); st.id = 'vsCss';
    st.textContent = `
#v-video{--vs-line:var(--line,#e6e6ea);--vs-card:var(--card,#f4f4f6);--vs-box:var(--box,#fff);--vs-ink:var(--ink,#111);--vs-muted:var(--muted,#6b6d75);--vs-acc:var(--ink,#111)}
#v-video .ic{width:18px;height:18px;flex:none}
.vs-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 14px;flex-wrap:wrap}
.vs-head h2{margin:0}
.vs-tabs{display:inline-flex;background:var(--vs-card);border-radius:999px;padding:4px;gap:2px}
.vs-tabs button{border:0;background:none;padding:8px 14px;border-radius:999px;font:inherit;font-size:14px;font-weight:600;color:var(--vs-muted);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.vs-tabs button.on{background:var(--vs-box);color:var(--vs-ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.vs-lock{display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:16px;background:var(--vs-card);margin-bottom:14px}
.vs-lock .ic{width:22px;height:22px}.vs-lock>div{flex:1}.vs-lock b{display:block}.vs-lock span{font-size:13px;color:var(--vs-muted)}
.vs-lock .btn{white-space:nowrap}
.vs-field{display:block;margin:0 0 12px;font-weight:600;font-size:14px}
.vs-field textarea,.vs-field input[type=text],.vs-field select{display:block;width:100%;margin-top:6px;font:inherit;font-weight:400}
.vs-field textarea{min-height:92px;resize:vertical}
.vs-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.vs-chip{border:1px solid var(--vs-line);background:var(--vs-box);color:var(--vs-ink);border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;cursor:pointer}
.vs-chip.on{background:var(--vs-ink);color:var(--vs-box);border-color:var(--vs-ink)}
.vs-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px 16px;margin:4px 0 12px}
.vs-opt>span{display:block;font-size:13px;font-weight:600;color:var(--vs-muted);margin-bottom:6px}
.vs-opt input[type=range]{width:100%}
.vs-seg{display:flex;flex-wrap:wrap;gap:6px}
.vs-photo{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:2px 0 14px}
.vs-photo img{width:56px;height:56px;object-fit:cover;border-radius:12px}
.vs-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.vs-actions .hint{margin-right:auto;font-size:13px;color:var(--vs-muted)}
.vs-progress{padding:18px;border-radius:18px;background:var(--vs-card);margin-top:14px}
.vs-progress b{display:block;margin-bottom:6px}
.vs-bar{height:6px;border-radius:99px;background:var(--vs-line);overflow:hidden;margin:10px 0 6px}
.vs-bar i{display:block;height:100%;width:30%;border-radius:99px;background:var(--vs-acc);animation:vsMove 1.6s ease-in-out infinite}
@keyframes vsMove{0%{transform:translateX(-100%)}100%{transform:translateX(340%)}}
.vs-result{margin-top:14px}
.vs-result video{width:100%;max-height:70vh;border-radius:16px;background:#000;display:block}
.vs-result .vs-actions{margin-top:10px;justify-content:flex-start}
.vs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.vs-card{position:relative;border-radius:14px;overflow:hidden;background:#000;aspect-ratio:9/12;cursor:pointer;border:0;padding:0}
.vs-card video{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.vs-card span{position:absolute;left:8px;right:8px;bottom:8px;color:#fff;font-size:12px;text-align:left;text-shadow:0 1px 3px rgba(0,0,0,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vs-empty-note{color:var(--vs-muted);font-size:14px;padding:6px 0}
/* editor */
.vs-ed{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@media (min-width:900px){.vs-ed{grid-template-columns:minmax(0,1fr) 320px;grid-template-areas:"stage side" "tools tools" "tl tl"}.vs-stagewrap{grid-area:stage}.vs-side{grid-area:side}.vs-tools{grid-area:tools}.vs-tlwrap{grid-area:tl}}
.vs-stagewrap{display:flex;flex-direction:column;gap:8px;min-width:0}
.vs-stage{position:relative;background:#0b0b0d;border-radius:16px;display:flex;align-items:center;justify-content:center;height:min(52vh,520px);overflow:hidden;touch-action:none}
.vs-stage canvas{max-width:100%;max-height:100%;display:block;border-radius:6px}
.vs-drop{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#cfcfd4;font-size:14px;text-align:center;padding:20px}
.vs-drop .btn{background:#fff;color:#111;border-color:#fff}
.vs-transport{display:flex;align-items:center;gap:8px}
.vs-transport .t{font-variant-numeric:tabular-nums;font-size:13px;color:var(--vs-muted);margin-right:auto}
.vs-ibtn{width:38px;height:38px;border-radius:999px;border:1px solid var(--vs-line);background:var(--vs-box);color:var(--vs-ink);display:inline-grid;place-items:center;cursor:pointer;flex:none}
.vs-ibtn.big{width:46px;height:46px;background:var(--vs-ink);color:var(--vs-box);border-color:var(--vs-ink)}
.vs-ibtn:disabled{opacity:.4;cursor:default}
.vs-tools{display:flex;gap:4px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:none}
.vs-tools::-webkit-scrollbar{display:none}
.vs-tool{flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:64px;padding:8px 6px;border-radius:12px;border:0;background:none;color:var(--vs-ink);font:inherit;font-size:11.5px;cursor:pointer}
.vs-tool:hover,.vs-tool.on{background:var(--vs-card)}
.vs-tool .ic{width:21px;height:21px}
.vs-tool.ai .ic{color:#7c3aed}
.vs-tool:disabled{opacity:.35;cursor:default}
.vs-side{background:var(--vs-box);border:1px solid var(--vs-line);border-radius:16px;padding:14px;min-height:120px}
.vs-side h4{margin:0 0 10px;font-size:15px}
.vs-side .vs-row{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-size:13px}
.vs-side .vs-row>span:first-child{width:78px;color:var(--vs-muted);flex:none}
.vs-side .vs-row input[type=range]{flex:1;min-width:0}
.vs-side .vs-row output{width:46px;text-align:right;font-variant-numeric:tabular-nums}
.vs-side textarea,.vs-side input[type=text],.vs-side select{width:100%;font:inherit}
.vs-side .vs-muted{font-size:13px;color:var(--vs-muted);margin:0 0 10px}
.vs-swatches{display:flex;gap:6px;flex-wrap:wrap}
.vs-swatches button{width:26px;height:26px;border-radius:999px;border:2px solid var(--vs-line);cursor:pointer}
.vs-swatches button.on{border-color:var(--vs-ink)}
.vs-filters{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.vs-filters button{border:1px solid var(--vs-line);border-radius:10px;background:var(--vs-box);padding:6px 2px;font:inherit;font-size:11.5px;cursor:pointer;color:var(--vs-ink)}
.vs-filters button i{display:block;height:34px;border-radius:7px;margin-bottom:4px;background:linear-gradient(135deg,#f59e0b,#ef4444 45%,#3b82f6)}
.vs-filters button.on{border-color:var(--vs-ink);box-shadow:0 0 0 1px var(--vs-ink)}
.vs-tlwrap{background:var(--vs-box);border:1px solid var(--vs-line);border-radius:16px;padding:8px 0 10px;min-width:0}
.vs-tlbar{display:flex;align-items:center;gap:6px;padding:0 10px 6px;font-size:12px;color:var(--vs-muted)}
.vs-tlbar .sp{flex:1}
.vs-tl{position:relative;overflow-x:auto;overflow-y:hidden;touch-action:pan-x;padding:0 12px}
.vs-tlin{position:relative;min-height:150px}
.vs-ruler{position:relative;height:20px;cursor:pointer;font-size:10px;color:var(--vs-muted);border-bottom:1px solid var(--vs-line);touch-action:none}
.vs-ruler i{position:absolute;top:12px;width:1px;height:8px;background:var(--vs-line)}
.vs-ruler b{position:absolute;top:0;font-weight:500;transform:translateX(-50%)}
.vs-track{position:relative;height:46px;margin-top:6px}
.vs-track.small{height:26px}
.vs-blk{position:absolute;top:0;bottom:0;border-radius:8px;overflow:hidden;cursor:pointer;background:#2b2b31;background-size:auto 100%;background-repeat:repeat-x;color:#fff;font-size:11px;display:flex;align-items:flex-end;padding:3px 6px;box-sizing:border-box;border:2px solid transparent;user-select:none;-webkit-user-select:none}
.vs-blk.sel{border-color:#fbbf24}
.vs-blk span{background:rgba(0,0,0,.5);border-radius:5px;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vs-blk.txt{background:#7c3aed;align-items:center}
.vs-blk.cap{background:#0e7490;align-items:center}
.vs-blk.mus{background:#0f766e;align-items:center}
.vs-h{position:absolute;top:0;bottom:0;width:14px;background:#fbbf24;display:none;touch-action:none;cursor:ew-resize}
.vs-blk.sel .vs-h{display:block}
.vs-h.l{left:0;border-radius:6px 0 0 6px}.vs-h.r{right:0;border-radius:0 6px 6px 0}
.vs-h::after{content:"";position:absolute;left:6px;top:35%;bottom:35%;width:2px;background:#111;border-radius:2px}
.vs-ph{position:absolute;top:0;bottom:0;width:2px;background:var(--vs-ink);pointer-events:none;z-index:3}
.vs-ph::before{content:"";position:absolute;top:-2px;left:-5px;width:12px;height:12px;border-radius:3px;background:var(--vs-ink)}
.vs-addclip{position:absolute;top:6px;width:34px;height:34px;border-radius:9px;border:1px dashed var(--vs-line);background:var(--vs-card);display:grid;place-items:center;cursor:pointer;color:var(--vs-ink)}
.vs-modal{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}
.vs-modal>div{background:var(--vs-box,#fff);color:var(--vs-ink,#111);border-radius:20px;max-width:440px;width:100%;padding:20px;max-height:88vh;overflow:auto}
.vs-modal h3{margin:0 0 8px}.vs-modal p{margin:0 0 12px;color:var(--vs-muted,#666);font-size:14px}
.vs-modal .vs-actions{margin-top:12px}
.vs-pick{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
.vs-pick button{padding:0;border:0;border-radius:10px;overflow:hidden;aspect-ratio:1;cursor:pointer;background:#000}
.vs-pick img,.vs-pick video{width:100%;height:100%;object-fit:cover;display:block}
html.aivm #v-video .vs-stage{height:42vh}
#v-video label.vs-row{flex-direction:row;align-items:center;flex:none;min-width:0;gap:10px;color:var(--vs-ink);font-weight:500;font-size:13px}
#v-video label.vs-row>span:first-child{color:var(--vs-muted);text-align:left}
#v-video label.vs-field{display:flex;flex:none}
#vsBody{margin-top:0!important}
.vs-title{display:none}
#v-video .vs-drop .btn{background:#fff!important;color:#111!important;border-color:#fff!important}
.vs-chip{white-space:nowrap}
#v-video .vs-side .vs-row input[type=checkbox]{width:20px;height:20px;margin:0}
#v-video .vs-side select{flex:1;width:auto}
@media (max-width:899px){
 .vs-head{display:block;margin:2px 0 0}.vs-head h2{display:none}
 .vs-tabs{display:flex;background:none;padding:2px 0;gap:6px;border-radius:0;overflow-x:auto;scrollbar-width:none}
 .vs-tabs button{flex:none;font-size:13.5px;font-weight:600;border:1px solid var(--line,#ececee);background:var(--bg,#fff);color:var(--muted,#6e6e73);border-radius:999px;padding:8px 16px;min-height:36px;box-shadow:none}
 .vs-tabs button .ic{display:none}
 .vs-tabs button.on{background:var(--ink,#0b0b0c);border-color:var(--ink,#0b0b0c);color:var(--bg,#fff);box-shadow:none}
 #v-video .vs-title{display:block;font-size:19px;font-weight:700;margin:14px 0 14px!important}
 .vs-lock{flex-wrap:wrap;align-items:flex-start}.vs-lock>div{flex:1 1 calc(100% - 40px)}.vs-lock .btn{flex:1;justify-content:center}
 .vs-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-left:-2px;padding:0 2px 2px}.vs-chips::-webkit-scrollbar{display:none}
 .vs-chip{flex:none}
 .vs-stagewrap{order:1}.vs-tlwrap{order:2}.vs-tools{order:3}.vs-side{order:4}
 .vs-side:empty{display:none}
}
`;
    document.head.appendChild(st);
  }

  /* ---------------- modal helper ---------------- */
  function modal(html) {
    const m = document.createElement('div'); m.className = 'vs-modal'; m.innerHTML = '<div role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); });
    return m;
  }
  function lockCard(what) {
    return `<div class="vs-lock">${ic('lock')}<div><b>${what} needs an AIV key</b><span>AI video takes a lot of computing, so it's part of AIV keys. The video editor is free.</span></div>
      <a class="btn sm" href="../api.html#plans" target="_top">Get AIV key</a><a class="btn primary sm" href="#settings">Add my key</a></div>`;
  }
  const costLine = (sec, res) => freeVideo() ? `Free: ${FREE_VIDEO_PER_DAY} videos a day, up to ${FREE_VIDEO_SEC} seconds each` : `About ${Math.ceil(sec * (res === '480p' ? Math.round(REQ_PER_SEC * 0.7) : REQ_PER_SEC)).toLocaleString()} AIV requests`;

  /* =====================================================================
     CREATE WITH AI
     ===================================================================== */
  const CR = { prompt: '', duration: 6, aspect: '9:16', res: '720p', photo: null, busy: false, result: null };
  const IDEAS = ['A golden retriever running through a sunflower field at sunset, slow motion', 'Drone shot over a misty mountain lake at sunrise', 'A cozy coffee shop on a rainy evening, steam rising from a latte', 'Product shot: a sneaker spinning on a pedestal, studio lighting', 'Neon city street at night after rain, cinematic', 'Waves crashing on black sand, 4K nature documentary style'];
  function renderCreate(box) {
    const locked = needsKey();
    CR.duration = Math.min(CR.duration, maxSec());
    box.innerHTML = `${locked ? lockCard('AI video') : ''}
    <div class="box">
      <label class="vs-field">Describe your video<textarea id="vsPrompt" placeholder="What happens, where, the camera movement and the mood. For example: a hummingbird drinking from a red flower, macro close-up, soft morning light">${esc(CR.prompt)}</textarea></label>
      <div class="vs-chips">${IDEAS.map(x => `<button class="vs-chip" data-idea="${esc(x)}">${esc(x.split(',')[0])}</button>`).join('')}</div>
      <div class="vs-photo"><b style="font-size:14px">Start from a photo</b><span style="font-size:13px;color:var(--vs-muted)">optional</span>
        ${CR.photo ? `<img src="${CR.photo}" alt="Starting photo"><button class="btn sm ghost" id="vsPhotoX">Remove</button>` : `<button class="btn sm" id="vsPhotoUp">${ic('photo')} Choose photo</button><button class="btn sm ghost" id="vsPhotoLib">From my photos</button>`}</div>
      <div class="vs-opts">
        <div class="vs-opt"><span>Length: <b id="vsDurV">${CR.duration}s</b></span><input type="range" id="vsDur" min="1" max="${maxSec()}" value="${CR.duration}"></div>
        <div class="vs-opt"><span>Shape</span><div class="vs-seg">${['9:16', '16:9', '1:1', '4:3', '3:4'].map(a => `<button class="vs-chip${CR.aspect === a ? ' on' : ''}" data-aspect="${a}">${a}</button>`).join('')}</div></div>
        <div class="vs-opt"><span>Quality</span><div class="vs-seg">${['720p', '480p'].map(a => `<button class="vs-chip${CR.res === a ? ' on' : ''}" data-res="${a}">${a}</button>`).join('')}</div></div>
      </div>
      <div class="vs-actions"><span class="hint" id="vsCost">${costLine(CR.duration, CR.res)}</span>
        <button class="btn ghost" id="vsImprove">${ic('spark')} Improve my prompt</button>
        <button class="btn primary" id="vsGo" ${CR.busy ? 'disabled' : ''}>${ic('video')} Create video</button></div>
    </div>
    <div id="vsCreateOut"></div>
    <h2 style="margin-top:26px">My videos</h2><div id="vsMine"></div>`;
    const p = $('#vsPrompt', box);
    p.oninput = () => { CR.prompt = p.value; };
    $$('[data-idea]', box).forEach(b => b.onclick = () => { CR.prompt = p.value = b.dataset.idea; p.focus(); });
    const d = $('#vsDur', box);
    d.oninput = () => { CR.duration = +d.value; $('#vsDurV', box).textContent = d.value + 's'; $('#vsCost', box).textContent = costLine(CR.duration, CR.res); };
    $$('[data-aspect]', box).forEach(b => b.onclick = () => { CR.aspect = b.dataset.aspect; $$('[data-aspect]', box).forEach(x => x.classList.toggle('on', x === b)); });
    $$('[data-res]', box).forEach(b => b.onclick = () => { CR.res = b.dataset.res; $$('[data-res]', box).forEach(x => x.classList.toggle('on', x === b)); $('#vsCost', box).textContent = costLine(CR.duration, CR.res); });
    const pick = $('#vsPhotoUp', box); if (pick) pick.onclick = () => choose('image/*', false).then(async fs => { if (fs[0]) { CR.photo = await shrinkPhoto(fs[0], 1280); renderCreate(box); } });
    const lib = $('#vsPhotoLib', box); if (lib) lib.onclick = () => pickLibraryPhoto().then(async b => { if (b) { CR.photo = await shrinkPhoto(b, 1280); renderCreate(box); } });
    const px = $('#vsPhotoX', box); if (px) px.onclick = () => { CR.photo = null; renderCreate(box); };
    $('#vsImprove', box).onclick = async e => {
      const b = e.currentTarget; if (!p.value.trim()) { p.focus(); return toast('Write a short idea first.'); }
      b.disabled = true; const was = b.innerHTML; b.textContent = 'Improving…';
      try {
        const t = await chatAI('You write prompts for an AI video model. Rewrite the idea as one vivid prompt under 90 words: the subject and action, setting, camera movement (for example slow dolly in, drone shot, handheld), lighting, mood and style. Keep exactly what the person asked for, add nothing unsafe, no real people\'s names. Reply with only the prompt.', p.value.trim());
        if (t) { CR.prompt = p.value = t.replace(/^["']|["']$/g, ''); }
      } catch (err) { toast(err.message, true); }
      b.disabled = false; b.innerHTML = was;
    };
    $('#vsGo', box).onclick = () => runCreate(box);
    if (CR.result) showResult($('#vsCreateOut', box), CR.result);
    renderMine($('#vsMine', box));
  }
  async function runCreate(box) {
    if (needsKey()) { toast('AI video needs an AIV key. Add it in Settings.', true); return; }
    const prompt = CR.prompt.trim(); if (!prompt) { $('#vsPrompt', box).focus(); return toast('Describe the video first.'); }
    CR.busy = true; $('#vsGo', box).disabled = true;
    const out = $('#vsCreateOut', box);
    const stop = progress(out, 'Making your video', 'Videos usually take 1 to 3 minutes. Keep this page open.');
    try {
      const j = await videoApi({ prompt, duration: CR.duration, aspect_ratio: CR.aspect, resolution: CR.res, image: CR.photo || undefined });
      const blob = await (await fetch(j.video)).blob();
      const id = await addMine(blob, { name: prompt.slice(0, 60), prompt, kind: 'ai', seconds: j.seconds });
      CR.result = { id, prompt };
      stop(); showResult(out, CR.result);
      if (j.requests_left != null) toast('Video ready. ' + j.requests_left.toLocaleString() + ' requests left this month.');
      else if (j.free_videos_left_today != null) toast('Video ready. ' + j.free_videos_left_today + ' free video' + (j.free_videos_left_today === 1 ? '' : 's') + ' left today.');
      renderMine($('#vsMine', box));
    } catch (err) { stop(); out.innerHTML = ''; toast(err.message, true); }
    CR.busy = false; const g = $('#vsGo', box); if (g) g.disabled = false;
  }
  function progress(el, title, sub) {
    const t0 = Date.now();
    el.innerHTML = `<div class="vs-progress" role="status"><b>${esc(title)}</b><div class="vs-bar"><i></i></div><span style="font-size:13px;color:var(--vs-muted)">${esc(sub)} <span data-el></span></span></div>`;
    const tick = setInterval(() => { const s = el.querySelector('[data-el]'); if (s) s.textContent = '(' + fmtShort((Date.now() - t0) / 1000) + ')'; }, 1000);
    return () => clearInterval(tick);
  }
  async function showResult(el, r) {
    const blob = await safe(mineBlob(r.id)); if (!blob) { el.innerHTML = ''; return; }
    const url = URL.createObjectURL(blob);
    el.innerHTML = `<div class="vs-result"><video src="${url}" controls playsinline autoplay loop muted></video>
      <div class="vs-actions"><button class="btn primary sm" data-a="dl">${ic('exp')} Download</button><button class="btn sm" data-a="ed">${ic('scissors')} Add to editor</button>
      <button class="btn sm" data-a="ai">${ic('wand')} Edit with AI</button><button class="btn sm" data-a="ex">${ic('ext')} Make it longer</button></div></div>`;
    el.querySelector('[data-a=dl]').onclick = () => download(blob, 'ai-video.' + extFor(blob.type));
    el.querySelector('[data-a=ed]').onclick = () => { ED.pendingAdd = [{ blob, name: r.prompt || 'AI video' }]; setTab('editor'); };
    el.querySelector('[data-a=ai]').onclick = () => { AE.clip = { blob, name: r.prompt || 'AI video' }; AE.mode = 'edit'; setTab('aiedit'); };
    el.querySelector('[data-a=ex]').onclick = () => { AE.clip = { blob, name: r.prompt || 'AI video' }; AE.mode = 'extend'; AE.prompt = 'Continue the scene naturally'; setTab('aiedit'); };
  }
  async function renderMine(el) {
    if (!el) return;
    await loadMine();
    if (!MINE.length) { el.innerHTML = '<p class="vs-empty-note">Videos you create, edit with AI or export from the Editor show up here, saved on this device.</p>'; return; }
    el.innerHTML = '<div class="vs-grid">' + MINE.map(m => `<button class="vs-card" data-id="${m.id}" aria-label="${esc(m.name || 'Video')}"><video muted playsinline preload="metadata"></video><span>${esc(m.name || 'Video')}</span></button>`).join('') + '</div>';
    for (const b of $$('.vs-card', el)) {
      const blob = await safe(mineBlob(b.dataset.id)); if (!blob) continue;
      const v = b.querySelector('video'); v.src = URL.createObjectURL(blob) + '#t=0.1';
      b.onclick = () => openMine(b.dataset.id, blob);
    }
  }
  function openMine(id, blob) {
    const m = MINE.find(x => x.id === id) || {};
    const url = URL.createObjectURL(blob);
    const md = modal(`<h3>${esc(m.name || 'Video')}</h3><video src="${url}" controls playsinline style="width:100%;max-height:60vh;border-radius:12px;background:#000"></video>
      <div class="vs-actions" style="justify-content:flex-start"><button class="btn primary sm" data-a="dl">Download</button><button class="btn sm" data-a="ed">Add to editor</button><button class="btn sm" data-a="ai">Edit with AI</button><button class="btn sm ghost" data-a="del">Delete</button><button class="btn sm ghost" data-close>Close</button></div>`);
    md.querySelector('[data-a=dl]').onclick = () => download(blob, (m.name || 'video').replace(/[^\w-]+/g, '-').slice(0, 40) + '.' + extFor(blob.type));
    md.querySelector('[data-a=ed]').onclick = () => { md.remove(); ED.pendingAdd = [{ blob, name: m.name || 'Video' }]; setTab('editor'); };
    md.querySelector('[data-a=ai]').onclick = () => { md.remove(); AE.clip = { blob, name: m.name || 'Video' }; AE.mode = 'edit'; setTab('aiedit'); };
    md.querySelector('[data-a=del]').onclick = async () => { if (!confirm('Delete this video from this device?')) return; md.remove(); await delMine(id); rerender(); };
  }
  function choose(accept, multiple) {
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !!multiple; i.style.display = 'none';
      i.onchange = () => { res(Array.from(i.files || [])); i.remove(); };
      document.body.appendChild(i); i.click();
    });
  }
  async function pickLibraryPhoto() {
    const items = await libraryPhotos();
    if (!items.length) { toast('No saved photos yet. Choose one from your device instead.'); return null; }
    return new Promise(res => {
      const md = modal(`<h3>Choose a photo</h3><div class="vs-pick">${items.map((x, i) => `<button data-i="${i}"><img alt="" src="${URL.createObjectURL(x.blob)}"></button>`).join('')}</div><div class="vs-actions"><button class="btn sm ghost" data-close>Cancel</button></div>`);
      $$('[data-i]', md).forEach(b => b.onclick = () => { md.remove(); res(items[+b.dataset.i].blob); });
      md.addEventListener('click', e => { if (e.target === md || e.target.closest('[data-close]')) res(null); });
    });
  }
  async function pickMineVideo() {
    await loadMine();
    if (!MINE.length) { toast('No saved videos yet. Upload one from your device.'); return null; }
    return new Promise(res => {
      const md = modal(`<h3>Choose a video</h3><div class="vs-pick">${MINE.map(x => `<button data-id="${x.id}"><video muted playsinline preload="metadata"></video></button>`).join('')}</div><div class="vs-actions"><button class="btn sm ghost" data-close>Cancel</button></div>`);
      $$('[data-id]', md).forEach(async b => {
        const blob = await safe(mineBlob(b.dataset.id)); if (blob) b.querySelector('video').src = URL.createObjectURL(blob) + '#t=0.1';
        b.onclick = () => { md.remove(); const m = MINE.find(x => x.id === b.dataset.id); res(blob ? { blob, name: (m && m.name) || 'Video' } : null); };
      });
      md.addEventListener('click', e => { if (e.target === md || e.target.closest('[data-close]')) res(null); });
    });
  }

  /* =====================================================================
     EDIT WITH AI
     ===================================================================== */
  const AE = { clip: null, prompt: '', mode: 'edit', extra: 5, busy: false, result: null, dur: 0 };
  const EDIT_IDEAS = ['Make it look like a movie, cinematic color', 'Turn day into night with city lights', 'Add gently falling snow', 'Make it anime style', 'Change the background to a tropical beach', 'Make it look like an old film from the 1970s'];
  async function renderAIEdit(box) {
    const locked = needsKey();
    AE.extra = Math.min(AE.extra, maxSec());
    let clipHtml = `<div class="vs-photo"><button class="btn sm" id="aeUp">${ic('video')} Upload a clip</button><button class="btn sm ghost" id="aeMine">From my videos</button><span style="font-size:13px;color:var(--vs-muted)">Up to ${maxSec()} seconds and 24 MB</span></div>`;
    if (AE.clip) {
      if (!AE.clip.url) AE.clip.url = URL.createObjectURL(AE.clip.blob);
      clipHtml = `<div style="margin-bottom:12px"><video src="${AE.clip.url}" controls playsinline muted style="width:100%;max-height:44vh;border-radius:14px;background:#000"></video>
        <div class="vs-actions" style="justify-content:flex-start;margin-top:8px"><span class="hint" id="aeInfo">${esc(AE.clip.name || 'Clip')}</span><button class="btn sm ghost" id="aeChange">Choose another</button></div></div>`;
    }
    box.innerHTML = `${locked ? lockCard('Editing videos with AI') : ''}
      <div class="box">${clipHtml}
        <div class="vs-seg" style="margin-bottom:12px"><button class="vs-chip${AE.mode === 'edit' ? ' on' : ''}" data-mode="edit">${ic('wand')} Change the video</button><button class="vs-chip${AE.mode === 'extend' ? ' on' : ''}" data-mode="extend">${ic('ext')} Make it longer</button></div>
        <label class="vs-field">${AE.mode === 'extend' ? 'What happens next?' : 'What should change?'}<textarea id="aePrompt" placeholder="${AE.mode === 'extend' ? 'For example: the camera keeps moving forward and the sun sets' : 'For example: make it look like a snowy winter evening'}">${esc(AE.prompt)}</textarea></label>
        ${AE.mode === 'edit' ? `<div class="vs-chips">${EDIT_IDEAS.map(x => `<button class="vs-chip" data-idea="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : `<div class="vs-opt" style="margin-bottom:12px"><span>Add: <b id="aeExV">${AE.extra}s</b></span><input type="range" id="aeEx" min="1" max="${maxSec()}" value="${AE.extra}"></div>`}
        <div class="vs-actions"><span class="hint" id="aeCost">${costLine(AE.mode === 'extend' ? AE.extra : Math.max(1, Math.min(maxSec(), Math.round(AE.dur || 6))), '720p')}</span>
          <button class="btn primary" id="aeGo" ${AE.busy ? 'disabled' : ''}>${ic('spark')} ${AE.mode === 'extend' ? 'Make it longer' : 'Change video'}</button></div>
      </div><div id="aeOut"></div>`;
    const p = $('#aePrompt', box); p.oninput = () => { AE.prompt = p.value; };
    $$('[data-idea]', box).forEach(b => b.onclick = () => { AE.prompt = p.value = b.dataset.idea; });
    $$('[data-mode]', box).forEach(b => b.onclick = () => { AE.mode = b.dataset.mode; renderAIEdit(box); });
    const ex = $('#aeEx', box); if (ex) ex.oninput = () => { AE.extra = +ex.value; $('#aeExV', box).textContent = ex.value + 's'; $('#aeCost', box).textContent = costLine(AE.extra, '720p'); };
    const setClip = async c => { if (!c) return; if (!/^video\//.test(c.blob.type || 'video/')) return toast('Choose a video file.', true); AE.clip = c; AE.result = null; const m = await mediaDuration(c.blob); AE.dur = m.dur; renderAIEdit(box); if (m.dur > maxSec() + 0.5) toast('This clip is ' + Math.round(m.dur) + ' seconds. AI editing works on up to ' + maxSec() + ' seconds: trim it in the Editor and export it first.', true); };
    const up = $('#aeUp', box) || $('#aeChange', box);
    if (up) up.onclick = () => choose('video/*', false).then(fs => fs[0] && setClip({ blob: fs[0], name: fs[0].name }));
    const mine = $('#aeMine', box); if (mine) mine.onclick = () => pickMineVideo().then(setClip);
    if (AE.clip && !AE.dur) mediaDuration(AE.clip.blob).then(m => { AE.dur = m.dur; const c = $('#aeCost', box); if (c && AE.mode === 'edit') c.textContent = costLine(Math.max(1, Math.min(maxSec(), Math.round(m.dur || 6))), '720p'); const inf = $('#aeInfo', box); if (inf) inf.textContent = (AE.clip.name || 'Clip') + ' · ' + fmtShort(m.dur); });
    $('#aeGo', box).onclick = () => runAIEdit(box);
    if (AE.result) showResult($('#aeOut', box), AE.result);
  }
  async function runAIEdit(box) {
    if (needsKey()) return toast('Editing videos with AI needs an AIV key. Add it in Settings.', true);
    if (!AE.clip) return toast('Choose a clip first.');
    const prompt = AE.prompt.trim(); if (!prompt) { $('#aePrompt', box).focus(); return toast(AE.mode === 'extend' ? 'Say what happens next.' : 'Say what should change.'); }
    if (AE.dur > maxSec() + 0.5) return toast('AI editing works on clips up to ' + maxSec() + ' seconds' + (freeVideo() ? ' for free' : '') + '. Trim it in the Editor and export it first.', true);
    AE.busy = true; $('#aeGo', box).disabled = true;
    const out = $('#aeOut', box);
    const stop = progress(out, AE.mode === 'extend' ? 'Making your video longer' : 'Changing your video', 'This usually takes 1 to 3 minutes. Keep this page open.');
    try {
      const url = await uploadFile(AE.clip.blob);
      const j = await videoApi({ prompt, operation: AE.mode, video: url, duration: AE.mode === 'extend' ? AE.extra : Math.max(1, Math.min(maxSec(), Math.round(AE.dur || 6))) });
      const blob = await (await fetch(j.video)).blob();
      const id = await addMine(blob, { name: (AE.mode === 'extend' ? 'Longer: ' : 'Edited: ') + prompt.slice(0, 50), prompt, kind: 'ai-' + AE.mode });
      AE.result = { id, prompt };
      stop(); showResult(out, AE.result);
    } catch (err) { stop(); out.innerHTML = ''; toast(err.message, true); }
    AE.busy = false; const g = $('#aeGo', box); if (g) g.disabled = false;
  }

  /* =====================================================================
     EDITOR (CapCut-style, runs in the browser, free)
     ===================================================================== */
  const SHAPES = { '9:16': [9, 16], '16:9': [16, 9], '1:1': [1, 1], '4:5': [4, 5], '3:4': [3, 4] };
  const FILTERS = {
    none: ['Original', ''], vivid: ['Vivid', 'saturate(1.45) contrast(1.08)'], warm: ['Warm', 'sepia(.28) saturate(1.25) hue-rotate(-8deg)'], cool: ['Cool', 'saturate(1.1) hue-rotate(12deg) brightness(1.03)'],
    bw: ['B&W', 'grayscale(1) contrast(1.12)'], fade: ['Faded', 'contrast(.86) brightness(1.08) saturate(.8)'], film: ['Film', 'sepia(.35) contrast(1.1) saturate(.9)'], drama: ['Drama', 'contrast(1.35) saturate(1.15) brightness(.92)']
  };
  const FILTER_SWATCH = { none: 'none', vivid: 'saturate(1.6)', warm: 'sepia(.5) saturate(1.3)', cool: 'hue-rotate(40deg)', bw: 'grayscale(1)', fade: 'contrast(.7) brightness(1.15)', film: 'sepia(.6)', drama: 'contrast(1.6)' };
  const TRANS = { none: 'None', fade: 'Fade', slide: 'Slide', zoom: 'Zoom', blur: 'Blur', flash: 'Flash' };
  const FONTS = { sans: ['Sans', '700 {s}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif'], bold: ['Bold', '900 {s}px Impact,"Arial Black",system-ui,sans-serif'], serif: ['Serif', '700 {s}px Georgia,"Times New Roman",serif'], round: ['Rounded', '800 {s}px "Arial Rounded MT Bold","Nunito",system-ui,sans-serif'], mono: ['Mono', '700 {s}px Menlo,Consolas,monospace'] };
  const COLORS = ['#ffffff', '#111111', '#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  const ANIMS = { none: 'None', fade: 'Fade', pop: 'Pop', up: 'Slide up', type: 'Typewriter' };
  const ED = {
    p: null, files: {}, els: {}, t: 0, playing: false, sel: null, tool: null, pps: 50, hist: [], fut: [], pendingAdd: null,
    canvas: null, ctx: null, raf: 0, t0: 0, cur: null, audio: null, exporting: false, root: null
  };
  const newProject = () => ({ v: 1, shape: '9:16', bg: 'blur', bgColor: '#000000', clips: [], texts: [], music: null, quality: '720' });
  const clipLen = c => Math.max(0.1, (c.out - c.in) / (c.speed || 1));
  function layout() { let s = 0; for (const c of ED.p.clips) { c.start = s; s += clipLen(c); } return s; }
  const total = () => ED.p ? layout() : 0;
  const plain = () => JSON.parse(JSON.stringify(ED.p, (k, v) => k === 'start' ? undefined : v));
  function snapshot() { ED.hist.push(JSON.stringify(plain())); if (ED.hist.length > 40) ED.hist.shift(); ED.fut = []; persist(); }
  let saveT = 0;
  function persist() { clearTimeout(saveT); saveT = setTimeout(() => safe(DB.put('kv', 'project', plain())), 400); }
  async function loadProject() {
    if (ED.p) return;
    const saved = await safe(DB.get('kv', 'project'));
    ED.p = saved && saved.v === 1 ? saved : newProject();
    const ids = new Set(ED.p.clips.map(c => c.file).concat(ED.p.music ? [ED.p.music.file] : []));
    for (const id of ids) {
      const blob = await safe(DB.get('blobs', 'f:' + id));
      if (blob) ED.files[id] = { blob, url: URL.createObjectURL(blob), type: blob.type, name: '' };
    }
    ED.p.clips = ED.p.clips.filter(c => ED.files[c.file]);
    if (ED.p.music && !ED.files[ED.p.music.file]) ED.p.music = null;
    for (const c of ED.p.clips) thumb(c);
  }
  async function addFile(blob, name) {
    const id = uid(); await safe(DB.put('blobs', 'f:' + id, blob));
    ED.files[id] = { blob, url: URL.createObjectURL(blob), type: blob.type || '', name: name || '' };
    return id;
  }
  async function addMedia(list) {
    if (!list || !list.length) return;
    let added = 0;
    for (const it of list) {
      const blob = it.blob || it, name = it.name || blob.name || '';
      const isImg = /^image\//.test(blob.type), isVid = /^video\//.test(blob.type) || /\.(mp4|mov|webm|m4v)$/i.test(name);
      if (!isImg && !isVid) { toast('Skipped ' + (name || 'a file') + ': add videos or photos.', true); continue; }
      const file = await addFile(blob, name);
      let dur = 3, w = 0, h = 0;
      if (isVid) { const m = await mediaDuration(blob); dur = m.dur || 3; w = m.w; h = m.h; if (!m.dur) toast('Couldn\'t read the length of ' + (name || 'a clip') + '. It may not play in this browser.', true); }
      const c = { id: uid(), file, kind: isImg ? 'image' : 'video', name, natural: isImg ? 60 : dur, in: 0, out: isImg ? 3 : dur, speed: 1, volume: 1, filter: 'none', adj: { b: 100, c: 100, s: 100 }, trans: 'none', fit: 'fit', w, h };
      ED.p.clips.push(c); thumb(c); added++;
    }
    if (added) { snapshot(); ED.sel = { type: 'clip', id: ED.p.clips[ED.p.clips.length - 1].id }; drawUI(); seek(ED.t); }
  }
  function mediaEl(c) {
    let el = ED.els[c.id];
    if (el && el.dataset.file === c.file) return el;
    const f = ED.files[c.file]; if (!f) return null;
    if (c.kind === 'image') { el = new Image(); el.src = f.url; el.onload = () => drawFrame(); }
    else { el = document.createElement('video'); el.src = f.url; el.playsInline = true; el.preload = 'auto'; el.crossOrigin = 'anonymous'; el.setAttribute('playsinline', ''); el.onloadeddata = () => { if (!ED.playing) drawFrame(); }; el.onseeked = () => { if (!ED.playing) drawFrame(); }; }
    el.dataset.file = c.file; ED.els[c.id] = el; return el;
  }
  function thumb(c) {
    if (c.thumb) return;
    const f = ED.files[c.file]; if (!f) return;
    if (c.kind === 'image') { c.thumb = f.url; return; }
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = f.url;
    v.onloadeddata = () => { try { v.currentTime = Math.min((c.in || 0) + 0.1, (v.duration || 1) - 0.05); } catch (e) {} };
    v.onseeked = () => { try { const k = document.createElement('canvas'); k.width = 96; k.height = Math.round(96 * (v.videoHeight || 9) / (v.videoWidth || 16)); k.getContext('2d').drawImage(v, 0, 0, k.width, k.height); c.thumb = k.toDataURL('image/jpeg', 0.7); drawTimeline(); } catch (e) {} v.removeAttribute('src'); v.load(); };
  }
  const clipAt = t => { layout(); const cs = ED.p.clips; for (let i = 0; i < cs.length; i++) { const c = cs[i]; if (t >= c.start && t < c.start + clipLen(c)) return c; } return cs[cs.length - 1] || null; };
  const findClip = id => ED.p.clips.find(c => c.id === id);
  const findText = id => ED.p.texts.find(x => x.id === id);

  /* ---- drawing ---- */
  function outSize() {
    const [a, b] = SHAPES[ED.p.shape] || [9, 16], short = ED.exporting ? (ED.p.quality === '1080' ? 1080 : 720) : 540;
    return a < b ? [short, Math.round(short * b / a / 2) * 2] : [Math.round(short * a / b / 2) * 2, short];
  }
  function sizeCanvas() {
    const [w, h] = outSize(); if (ED.canvas.width !== w || ED.canvas.height !== h) { ED.canvas.width = w; ED.canvas.height = h; }
  }
  function filterFor(c, extraBlur) {
    const f = (FILTERS[c.filter] || FILTERS.none)[1], a = c.adj || { b: 100, c: 100, s: 100 };
    let s = (f ? f + ' ' : '') + `brightness(${a.b / 100}) contrast(${a.c / 100}) saturate(${a.s / 100})`;
    if (extraBlur) s += ` blur(${extraBlur}px)`;
    return s;
  }
  function drawMedia(ctx, el, W, H, mode) {
    const iw = el.videoWidth || el.naturalWidth || W, ih = el.videoHeight || el.naturalHeight || H;
    if (!iw || !ih) return;
    const s = mode === 'fill' ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih);
    const w = iw * s, h = ih * s; ctx.drawImage(el, (W - w) / 2, (H - h) / 2, w, h);
  }
  function drawFrame() {
    if (!ED.ctx) return;
    sizeCanvas();
    const ctx = ED.ctx, W = ED.canvas.width, H = ED.canvas.height, t = ED.t;
    ctx.save(); ctx.fillStyle = ED.p.bg === 'white' ? '#ffffff' : ED.p.bg === 'color' ? ED.p.bgColor : '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const c = ED.p.clips.length ? clipAt(t) : null;
    if (c) {
      const el = mediaEl(c);
      const ready = el && (c.kind === 'image' ? el.complete && el.naturalWidth : el.readyState >= 2);
      if (ready) {
        const p = clamp((t - c.start) / 0.5, 0, 1), tr = p < 1 ? c.trans : 'none';
        if (ED.p.bg === 'blur') { ctx.save(); ctx.filter = 'blur(28px) brightness(.6)'; drawMedia(ctx, el, W, H, 'fill'); ctx.restore(); }
        ctx.save();
        let blur = 0;
        if (tr === 'fade') ctx.globalAlpha = p;
        if (tr === 'slide') ctx.translate((1 - p) * W, 0);
        if (tr === 'zoom') { const z = 1.25 - 0.25 * p; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = 0.4 + 0.6 * p; }
        if (tr === 'blur') blur = (1 - p) * 24;
        ctx.filter = filterFor(c, blur);
        drawMedia(ctx, el, W, H, c.fit);
        ctx.restore();
        if (tr === 'flash') { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,' + (1 - p) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      }
    }
    for (const x of ED.p.texts) if (t >= x.start && t < x.end) drawText(ctx, x, W, H, t);
    if (!ED.exporting && ED.sel && ED.sel.type === 'text') { const x = findText(ED.sel.id); if (x && t >= x.start && t < x.end && x.box) { ctx.save(); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.strokeRect(x.box[0], x.box[1], x.box[2], x.box[3]); ctx.restore(); } }
  }
  function wrapLines(ctx, text, maxW) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const w of para.split(/\s+/)) { const tryL = line ? line + ' ' + w : w; if (ctx.measureText(tryL).width > maxW && line) { out.push(line); line = w; } else line = tryL; }
      out.push(line);
    }
    return out;
  }
  function drawText(ctx, x, W, H, t) {
    const base = Math.min(W, H), size = Math.round(base * (x.size || 7) / 100), fam = (FONTS[x.font] || FONTS.sans)[1].replace('{s}', size);
    const age = t - x.start, left = x.end - t;
    let alpha = 1, scale = 1, dy = 0, text = x.text || '';
    if (x.anim === 'fade') alpha = clamp(Math.min(age, left) / 0.35, 0, 1);
    if (x.anim === 'pop') { const k = clamp(age / 0.25, 0, 1); scale = 0.6 + 0.4 * (1 - Math.pow(1 - k, 3)) + (k < 1 ? 0.08 * Math.sin(k * Math.PI) : 0); }
    if (x.anim === 'up') { const k = clamp(age / 0.35, 0, 1); dy = (1 - k) * base * 0.06; alpha = k; }
    if (x.anim === 'type') { const n = Math.floor(clamp(age / Math.max(0.4, Math.min(1.6, (x.end - x.start) * 0.5)), 0, 1) * text.length); text = text.slice(0, Math.max(1, n)); }
    ctx.save(); ctx.font = fam; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = wrapLines(ctx, text, W * 0.86), lh = size * 1.22, bh = lines.length * lh;
    const cx = x.x * W, cy = x.y * H + dy;
    const bw = Math.min(W * 0.92, Math.max(...lines.map(l => ctx.measureText(l).width)) + size * 0.9);
    x.box = [cx - bw / 2, cy - bh / 2 - size * 0.2, bw, bh + size * 0.4];
    ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
    if (x.bgBox) { ctx.fillStyle = x.color === '#111111' ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.6)'; const r = size * 0.3, [bx, by, bw2, bh2] = x.box; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw2, bh2, r); else ctx.rect(bx, by, bw2, bh2); ctx.fill(); }
    lines.forEach((l, i) => {
      const ly = cy - bh / 2 + lh / 2 + i * lh;
      if (x.outline !== false && !x.bgBox) { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size * 0.16); ctx.strokeStyle = x.color === '#111111' ? '#ffffff' : '#000000'; ctx.strokeText(l, cx, ly); }
      ctx.fillStyle = x.color || '#fff'; ctx.fillText(l, cx, ly);
    });
    ctx.restore();
  }

  /* ---- playback ---- */
  function audioGraph() {
    if (ED.audio) return ED.audio;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      const ctx = new AC(), rec = ctx.createMediaStreamDestination();
      ED.audio = { ctx, rec, nodes: new Map() };
    } catch (e) { ED.audio = null; }
    return ED.audio;
  }
  function route(el, gain) {
    const A = ED.audio; if (!A) { el.volume = clamp(gain, 0, 1); return; }
    let n = A.nodes.get(el);
    if (!n) { try { const src = A.ctx.createMediaElementSource(el), g = A.ctx.createGain(); src.connect(g); g.connect(A.ctx.destination); g.connect(A.rec); n = { g }; A.nodes.set(el, n); } catch (e) { el.volume = clamp(gain, 0, 1); return; } }
    el.volume = 1; n.g.gain.value = gain;
  }
  function musicEl() {
    const m = ED.p.music; if (!m) return null;
    const f = ED.files[m.file]; if (!f) return null;
    let el = ED.els['music'];
    if (!el || el.dataset.file !== m.file) { el = document.createElement('audio'); el.src = f.url; el.preload = 'auto'; el.dataset.file = m.file; ED.els['music'] = el; }
    return el;
  }
  function musicGain(t) {
    const m = ED.p.music; if (!m) return 0; const T = total(); let g = m.volume;
    if (m.fadeIn && t < 2) g *= clamp(t / 2, 0, 1);
    if (m.fadeOut && T - t < 2) g *= clamp((T - t) / 2, 0, 1);
    return g;
  }
  function syncMedia(start) {
    const t = ED.t, c = ED.p.clips.length ? clipAt(t) : null;
    if (ED.cur && ED.cur !== c) { const el = ED.els[ED.cur.id]; if (el && el.pause) el.pause(); }
    if (c && c.kind === 'video') {
      const el = mediaEl(c), local = c.in + (t - c.start) * c.speed;
      if (el) {
        route(el, c.volume);
        el.playbackRate = c.speed;
        if (start || ED.cur !== c || Math.abs(el.currentTime - local) > 0.3) { try { el.currentTime = local; } catch (e) {} }
        if (el.paused) el.play().catch(() => {});
      }
    }
    ED.cur = c;
    const me = musicEl();
    if (me) {
      route(me, musicGain(t));
      const at = (ED.p.music.offset || 0) + t;
      if (at < (me.duration || Infinity)) { if (start || Math.abs(me.currentTime - at) > 0.35) { try { me.currentTime = at; } catch (e) {} } if (me.paused) me.play().catch(() => {}); }
      else if (!me.paused) me.pause();
    }
  }
  function play() {
    if (!ED.p.clips.length) return;
    const T = total(); if (ED.t >= T - 0.05) ED.t = 0;
    const A = audioGraph(); if (A && A.ctx.state === 'suspended') A.ctx.resume();
    ED.playing = true; ED.t0 = performance.now() - ED.t * 1000; syncMedia(true);
    const loop = () => {
      if (!ED.playing) return;
      ED.t = (performance.now() - ED.t0) / 1000;
      const T2 = total();
      if (ED.t >= T2) { ED.t = T2; pause(); if (ED.onEnd) ED.onEnd(); return; }
      syncMedia(false); drawFrame(); movePlayhead();
      ED.raf = requestAnimationFrame(loop);
    };
    ED.raf = requestAnimationFrame(loop); playBtn();
  }
  function pause() {
    ED.playing = false; cancelAnimationFrame(ED.raf);
    Object.values(ED.els).forEach(el => { if (el && el.pause) el.pause(); });
    playBtn(); drawFrame(); movePlayhead();
  }
  function seek(t) {
    ED.t = clamp(t, 0, Math.max(0, total() - 0.01));
    if (ED.playing) { ED.t0 = performance.now() - ED.t * 1000; syncMedia(true); return; }
    const c = ED.p.clips.length ? clipAt(ED.t) : null;
    if (c && c.kind === 'video') { const el = mediaEl(c); if (el) { try { el.currentTime = c.in + (ED.t - c.start) * c.speed; } catch (e) {} } }
    drawFrame(); movePlayhead();
  }
  function playBtn() { const b = ED.root && $('#edPlay', ED.root); if (b) { b.innerHTML = ic(ED.playing ? 'pause' : 'play'); b.setAttribute('aria-label', ED.playing ? 'Pause' : 'Play'); } }
  function movePlayhead() {
    if (!ED.root) return;
    const ph = $('.vs-ph', ED.root); if (ph) ph.style.left = (ED.t * ED.pps) + 'px';
    const tt = $('#edTime', ED.root); if (tt) tt.textContent = fmt(ED.t) + ' / ' + fmt(total());
    if (ED.playing) { const tl = $('.vs-tl', ED.root); if (tl) { const x = ED.t * ED.pps; if (x > tl.scrollLeft + tl.clientWidth - 40 || x < tl.scrollLeft) tl.scrollLeft = x - 40; } }
  }

  /* ---- editor UI ---- */
  const TOOLS = [
    ['add', 'plus', 'Add'], ['split', 'scissors', 'Split'], ['speed', 'speed', 'Speed'], ['volume', 'vol', 'Volume'], ['filter', 'filter', 'Filters'], ['adjust', 'adjust', 'Adjust'],
    ['trans', 'trans', 'Transition'], ['text', 'text', 'Text'], ['captions', 'cc', 'Captions', 1], ['silence', 'cut', 'Cut pauses', 1], ['ideas', 'idea', 'AI ideas', 1], ['aiedit', 'wand', 'AI edit', 1],
    ['music', 'music', 'Music'], ['shape', 'shape', 'Shape'], ['bg', 'bg', 'Background'], ['dup', 'copy', 'Duplicate'], ['del', 'trash', 'Delete'], ['undo', 'undo', 'Undo'], ['redo', 'redo', 'Redo'], ['export', 'exp', 'Export']
  ];
  async function renderEditor(box) {
    await loadProject();
    ED.root = box;
    box.innerHTML = `<div class="vs-ed">
      <div class="vs-stagewrap"><div class="vs-stage" id="edStage"><canvas id="edCanvas" aria-label="Video preview"></canvas>
        <div class="vs-drop" id="edDrop" hidden><b style="color:#fff;font-size:16px">Start a video</b><span>Add videos and photos from your device, or AI videos you made.</span><button class="btn primary" id="edAdd0">${ic('plus')} Add videos or photos</button></div></div>
        <div class="vs-transport"><button class="vs-ibtn" id="edStart" aria-label="Back to start">${ic('start')}</button><button class="vs-ibtn big" id="edPlay" aria-label="Play">${ic('play')}</button><span class="t" id="edTime">0:00.0 / 0:00.0</span>
          <button class="vs-ibtn" id="edUndo" aria-label="Undo">${ic('undo')}</button><button class="vs-ibtn" id="edRedo" aria-label="Redo">${ic('redo')}</button><button class="btn primary sm" id="edExport">${ic('exp')} Export</button></div></div>
      <div class="vs-side" id="edSide"></div>
      <div class="vs-tools" id="edTools">${TOOLS.map(([k, i, l, ai]) => `<button class="vs-tool${ai ? ' ai' : ''}" data-tool="${k}">${ic(i)}<span>${l}</span></button>`).join('')}</div>
      <div class="vs-tlwrap"><div class="vs-tlbar"><span>Timeline</span><span class="sp"></span><button class="vs-ibtn" id="edZo" aria-label="Zoom out" style="width:30px;height:30px">${ic('zout')}</button><button class="vs-ibtn" id="edZi" aria-label="Zoom in" style="width:30px;height:30px">${ic('zin')}</button></div>
        <div class="vs-tl" id="edTl"><div class="vs-tlin" id="edTlIn"></div></div></div>
    </div>`;
    ED.canvas = $('#edCanvas', box); ED.ctx = ED.canvas.getContext('2d');
    ED.pps = isPhone() ? 36 : 56;
    $('#edPlay', box).onclick = () => ED.playing ? pause() : play();
    $('#edStart', box).onclick = () => { pause(); seek(0); };
    $('#edUndo', box).onclick = undo; $('#edRedo', box).onclick = redo;
    $('#edExport', box).onclick = exportVideo;
    $('#edAdd0', box).onclick = () => tool('add');
    $('#edZi', box).onclick = () => { ED.pps = Math.min(240, ED.pps * 1.4); drawTimeline(); };
    $('#edZo', box).onclick = () => { ED.pps = Math.max(12, ED.pps / 1.4); drawTimeline(); };
    $$('[data-tool]', box).forEach(b => b.onclick = () => tool(b.dataset.tool));
    canvasDrag();
    if (ED.pendingAdd) { const list = ED.pendingAdd; ED.pendingAdd = null; await addMedia(list); }
    if (!ED.hist.length) ED.hist.push(JSON.stringify(plain()));
    drawUI(); seek(ED.t);
  }
  function drawUI() { drawTimeline(); drawSide(); toolState(); const d = ED.root && $('#edDrop', ED.root); if (d) d.hidden = !!ED.p.clips.length; }
  function toolState() {
    if (!ED.root) return;
    const hasClip = ED.sel && ED.sel.type === 'clip' && findClip(ED.sel.id), hasAny = !!ED.p.clips.length, hasSel = !!(ED.sel && (findClip(ED.sel.id) || findText(ED.sel.id) || ED.sel.type === 'music'));
    const need = { split: hasAny, speed: hasClip, volume: hasClip, filter: hasClip, adjust: hasClip, trans: hasClip, captions: hasAny, silence: hasAny, aiedit: hasClip, dup: hasSel && ED.sel.type !== 'music', del: hasSel, undo: ED.hist.length > 1, redo: ED.fut.length > 0, export: hasAny };
    $$('[data-tool]', ED.root).forEach(b => { const k = b.dataset.tool; b.disabled = k in need ? !need[k] : false; b.classList.toggle('on', ED.tool === k); });
    $('#edUndo', ED.root).disabled = ED.hist.length <= 1; $('#edRedo', ED.root).disabled = !ED.fut.length; $('#edExport', ED.root).disabled = !hasAny;
  }
  function drawTimeline() {
    if (!ED.root) return;
    const inner = $('#edTlIn', ED.root); if (!inner) return;
    const T = total(), pps = ED.pps, width = Math.max((T + 4) * pps, ($('#edTl', ED.root).clientWidth || 300));
    const step = pps < 20 ? 10 : pps < 40 ? 5 : pps < 90 ? 2 : 1;
    let ruler = '';
    for (let s = 0; s <= T + 4; s += step) ruler += `<i style="left:${s * pps}px"></i><b style="left:${s * pps}px">${fmtShort(s)}</b>`;
    const sel = ED.sel || {};
    const clips = ED.p.clips.map(c => `<div class="vs-blk${sel.id === c.id ? ' sel' : ''}" data-clip="${c.id}" style="left:${c.start * pps}px;width:${Math.max(8, clipLen(c) * pps - 2)}px;${c.thumb ? `background-image:url(${c.thumb})` : ''}"><span>${fmtShort(clipLen(c))}${c.speed !== 1 ? ' · ' + c.speed + 'x' : ''}${c.filter !== 'none' ? ' · ' + FILTERS[c.filter][0] : ''}</span><b class="vs-h l" data-h="in"></b><b class="vs-h r" data-h="out"></b></div>`).join('');
    const texts = ED.p.texts.map(x => `<div class="vs-blk ${x.kind === 'caption' ? 'cap' : 'txt'}${sel.id === x.id ? ' sel' : ''}" data-text="${x.id}" style="left:${x.start * pps}px;width:${Math.max(8, (x.end - x.start) * pps - 2)}px"><span>${esc(x.text)}</span><b class="vs-h l" data-h="start"></b><b class="vs-h r" data-h="end"></b></div>`).join('');
    const m = ED.p.music;
    inner.style.width = width + 'px';
    inner.innerHTML = `<div class="vs-ruler" id="edRuler">${ruler}</div>
      <div class="vs-track">${clips}<button class="vs-addclip" id="edAddEnd" style="left:${T * pps + 6}px" aria-label="Add videos or photos">${ic('plus')}</button></div>
      <div class="vs-track small">${texts}</div>
      <div class="vs-track small">${m ? `<div class="vs-blk mus${sel.type === 'music' ? ' sel' : ''}" data-music="1" style="left:0;width:${Math.max(8, T * pps - 2)}px"><span>${ic('music')} ${esc(m.name || 'Music')}</span></div>` : ''}</div>
      <div class="vs-ph" style="left:${ED.t * pps}px"></div>`;
    $('#edAddEnd', inner).onclick = () => tool('add');
    // tap to select, drag edges to trim
    $$('[data-clip]', inner).forEach(b => b.addEventListener('pointerdown', e => blockDown(e, b, 'clip')));
    $$('[data-text]', inner).forEach(b => b.addEventListener('pointerdown', e => blockDown(e, b, 'text')));
    $$('[data-music]', inner).forEach(b => b.onclick = () => { ED.sel = { type: 'music' }; ED.tool = 'music'; drawUI(); });
    const ruler2 = $('#edRuler', inner);
    const scrub = e => { const r = inner.getBoundingClientRect(); seek((e.clientX - r.left) / pps); };
    ruler2.addEventListener('pointerdown', e => { if (ED.playing) pause(); scrub(e); ruler2.setPointerCapture(e.pointerId); ruler2.onpointermove = scrub; ruler2.onpointerup = () => { ruler2.onpointermove = null; }; });
    movePlayhead(); toolState();
  }
  function blockDown(e, b, type) {
    const id = b.dataset.clip || b.dataset.text, h = e.target.dataset && e.target.dataset.h;
    const was = ED.sel && ED.sel.id === id;
    ED.sel = { type, id };
    if (!h) {
      if (type === 'text') {
        // drag a text block to move it in time
        const x = findText(id), x0 = e.clientX, s0 = x.start, e0 = x.end; let moved = false;
        b.setPointerCapture(e.pointerId);
        b.onpointermove = ev => { const d = (ev.clientX - x0) / ED.pps; if (Math.abs(ev.clientX - x0) > 4) moved = true; if (!moved) return; const len = e0 - s0; x.start = clamp(s0 + d, 0, Math.max(0, total() - len)); x.end = x.start + len; b.style.left = x.start * ED.pps + 'px'; };
        b.onpointerup = () => { b.onpointermove = null; if (moved) snapshot(); else seek(x.start + 0.01); ED.tool = 'text'; drawUI(); };
      } else {
        const c = findClip(id); b.onpointerup = () => { b.onpointerup = null; if (!was) seek(c.start + 0.01); if (!ED.tool || ['speed', 'volume', 'filter', 'adjust', 'trans', 'text', 'music', 'shape', 'bg'].indexOf(ED.tool) < 0 || ED.tool === 'text' || ED.tool === 'music') ED.tool = 'clip'; drawUI(); };
      }
      if (!was && type === 'clip') { drawSide(); toolState(); $$('.vs-blk', ED.root).forEach(x => x.classList.toggle('sel', x === b)); }
      return;
    }
    // trim handles
    e.stopPropagation(); e.preventDefault();
    const x0 = e.clientX, hEl = e.target; hEl.setPointerCapture(e.pointerId);
    if (type === 'clip') {
      const c = findClip(id), in0 = c.in, out0 = c.out, nat = c.kind === 'image' ? 60 : (c.natural || out0);
      hEl.onpointermove = ev => {
        const d = (ev.clientX - x0) / ED.pps * c.speed;
        if (h === 'in') c.in = clamp(in0 + d, 0, c.out - 0.2); else c.out = clamp(out0 + d, c.in + 0.2, nat);
        b.style.width = Math.max(8, clipLen(c) * ED.pps - 2) + 'px'; if (h === 'in') { b.style.left = c.start * ED.pps + 'px'; }
        layout(); seek(h === 'in' ? c.start : c.start + clipLen(c) - 0.05);
      };
    } else {
      const x = findText(id), s0 = x.start, e0 = x.end;
      hEl.onpointermove = ev => { const d = (ev.clientX - x0) / ED.pps; if (h === 'start') x.start = clamp(s0 + d, 0, x.end - 0.2); else x.end = clamp(e0 + d, x.start + 0.2, Math.max(x.start + 0.2, total())); b.style.left = x.start * ED.pps + 'px'; b.style.width = Math.max(8, (x.end - x.start) * ED.pps - 2) + 'px'; };
    }
    hEl.onpointerup = () => { hEl.onpointermove = null; snapshot(); drawUI(); seek(ED.t); };
  }
  function canvasDrag() {
    const cv = ED.canvas;
    cv.addEventListener('pointerdown', e => {
      const r = cv.getBoundingClientRect(), sx = cv.width / r.width, sy = cv.height / r.height;
      const px = (e.clientX - r.left) * sx, py = (e.clientY - r.top) * sy;
      const hit = ED.p.texts.slice().reverse().find(x => ED.t >= x.start && ED.t < x.end && x.box && px >= x.box[0] && px <= x.box[0] + x.box[2] && py >= x.box[1] && py <= x.box[1] + x.box[3]);
      if (!hit) { if (!ED.playing && ED.p.clips.length) { ED.sel = { type: 'clip', id: clipAt(ED.t).id }; ED.tool = 'clip'; drawUI(); drawFrame(); } return; }
      e.preventDefault(); ED.sel = { type: 'text', id: hit.id }; ED.tool = 'text'; drawUI();
      const ox = hit.x, oy = hit.y, x0 = e.clientX, y0 = e.clientY; let moved = false;
      cv.setPointerCapture(e.pointerId);
      cv.onpointermove = ev => { moved = true; hit.x = clamp(ox + (ev.clientX - x0) * sx / cv.width, 0.05, 0.95); hit.y = clamp(oy + (ev.clientY - y0) * sy / cv.height, 0.05, 0.95); drawFrame(); };
      cv.onpointerup = () => { cv.onpointermove = null; if (moved) snapshot(); };
    });
  }
  function undo() { if (ED.hist.length <= 1) return; ED.fut.push(ED.hist.pop()); restore(ED.hist[ED.hist.length - 1]); }
  function redo() { if (!ED.fut.length) return; const s = ED.fut.pop(); ED.hist.push(s); restore(s); }
  function restore(s) { const thumbs = {}; ED.p.clips.forEach(c => thumbs[c.id] = c.thumb); ED.p = JSON.parse(s); ED.p.clips.forEach(c => { c.thumb = thumbs[c.id]; if (!c.thumb) thumb(c); }); persist(); if (ED.sel && !findClip(ED.sel.id) && !findText(ED.sel.id)) ED.sel = null; drawUI(); seek(ED.t); }

  /* ---- tools ---- */
  async function tool(k) {
    if (ED.exporting) return;
    const c = ED.sel && ED.sel.type === 'clip' ? findClip(ED.sel.id) : null;
    if (k === 'add') { const fs = await choose('video/*,image/*', true); if (fs.length) addMedia(fs.map(f => ({ blob: f, name: f.name }))); return; }
    if (k === 'undo') return undo();
    if (k === 'redo') return redo();
    if (k === 'export') return exportVideo();
    if (k === 'split') return split();
    if (k === 'del') return del();
    if (k === 'dup') return dup();
    if (k === 'captions') return autoCaptions();
    if (k === 'silence') return cutPauses();
    if (k === 'ideas') return aiIdeas();
    if (k === 'aiedit') { if (!c) return; if (c.kind !== 'video') return toast('AI edit works on video clips.'); AE.clip = { blob: ED.files[c.file].blob, name: c.name || 'Clip' }; AE.mode = 'edit'; return setTab('aiedit'); }
    if (k === 'text') { if (!(ED.sel && ED.sel.type === 'text')) addText(); }
    if (k === 'music' && !ED.p.music) { const fs = await choose('audio/*,video/*', false); if (!fs[0]) return; const file = await addFile(fs[0], fs[0].name); ED.p.music = { file, name: fs[0].name.replace(/\.[^.]+$/, ''), volume: 0.6, offset: 0, fadeIn: true, fadeOut: true }; ED.sel = { type: 'music' }; snapshot(); }
    ED.tool = k; drawUI();
  }
  function split() {
    if (!ED.p.clips.length) return;
    const c = clipAt(ED.t); const local = c.in + (ED.t - c.start) * c.speed;
    if (local - c.in < 0.15 || c.out - local < 0.15) return toast('Move the playhead into the middle of a clip to split it.');
    const b = JSON.parse(JSON.stringify(c)); b.id = uid(); b.in = local; b.trans = 'none'; b.thumb = null; c.out = local;
    ED.p.clips.splice(ED.p.clips.indexOf(c) + 1, 0, b); thumb(b);
    ED.sel = { type: 'clip', id: b.id }; snapshot(); drawUI(); seek(ED.t);
  }
  function del() {
    if (!ED.sel) return;
    if (ED.sel.type === 'clip') ED.p.clips = ED.p.clips.filter(c => c.id !== ED.sel.id);
    else if (ED.sel.type === 'text') ED.p.texts = ED.p.texts.filter(x => x.id !== ED.sel.id);
    else if (ED.sel.type === 'music') ED.p.music = null;
    ED.sel = null; ED.tool = null; snapshot(); drawUI(); seek(Math.min(ED.t, total()));
  }
  function dup() {
    if (!ED.sel) return;
    if (ED.sel.type === 'clip') { const c = findClip(ED.sel.id); const b = JSON.parse(JSON.stringify(c)); b.id = uid(); b.thumb = c.thumb; ED.p.clips.splice(ED.p.clips.indexOf(c) + 1, 0, b); ED.sel = { type: 'clip', id: b.id }; }
    else if (ED.sel.type === 'text') { const x = findText(ED.sel.id); const y = JSON.parse(JSON.stringify(x)); y.id = uid(); y.y = clamp(x.y + 0.08, 0.05, 0.95); ED.p.texts.push(y); ED.sel = { type: 'text', id: y.id }; }
    snapshot(); drawUI(); drawFrame();
  }
  function addText(text, opts) {
    const T = total() || 3, start = clamp(ED.t, 0, Math.max(0, T - 0.5));
    const x = Object.assign({ id: uid(), kind: 'text', text: text || 'Your text', start, end: Math.min(Math.max(T, start + 0.5), start + 3), x: 0.5, y: 0.5, size: 8, font: 'bold', color: '#ffffff', bgBox: false, anim: 'pop' }, opts || {});
    ED.p.texts.push(x); ED.sel = { type: 'text', id: x.id }; ED.tool = 'text'; snapshot(); drawUI(); drawFrame();
    setTimeout(() => { const ta = ED.root && $('#edTxt', ED.root); if (ta && !text) { ta.focus(); ta.select(); } }, 50);
    return x;
  }
  function slider(label, id, min, max, step, val, outFmt) { return `<label class="vs-row"><span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output id="${id}V">${outFmt(val)}</output></label>`; }
  function bindSlider(id, fn, outFmt, live) {
    const el = $('#' + id, ED.root); if (!el) return;
    el.oninput = () => { fn(+el.value); $('#' + id + 'V', ED.root).textContent = outFmt(+el.value); if (live) live(); };
    el.onchange = () => { snapshot(); drawTimeline(); };
  }
  function drawSide() {
    if (!ED.root) return;
    const side = $('#edSide', ED.root); if (!side) return;
    const k = ED.tool, c = ED.sel && ED.sel.type === 'clip' ? findClip(ED.sel.id) : null, x = ED.sel && ED.sel.type === 'text' ? findText(ED.sel.id) : null;
    let h = '';
    if (k === 'shape') {
      h = `<h4>Shape</h4><p class="vs-muted">Pick the size for where you'll post it.</p><div class="vs-seg">${Object.keys(SHAPES).map(s => `<button class="vs-chip${ED.p.shape === s ? ' on' : ''}" data-shape="${s}">${s}${s === '9:16' ? ' · TikTok, Reels' : s === '16:9' ? ' · YouTube' : s === '1:1' ? ' · Square' : s === '4:5' ? ' · Feed' : ''}</button>`).join('')}</div>
        <h4 style="margin-top:14px">Fit</h4><div class="vs-seg"><button class="vs-chip" data-fitall="fit">Fit all clips</button><button class="vs-chip" data-fitall="fill">Fill and crop all clips</button></div>`;
    } else if (k === 'bg') {
      h = `<h4>Background</h4><p class="vs-muted">Shows around clips that don't fill the frame.</p><div class="vs-seg">${[['blur', 'Blurred'], ['black', 'Black'], ['white', 'White'], ['color', 'Color']].map(([v, l]) => `<button class="vs-chip${ED.p.bg === v ? ' on' : ''}" data-bg="${v}">${l}</button>`).join('')}</div>
        ${ED.p.bg === 'color' ? `<div class="vs-swatches" style="margin-top:10px">${COLORS.concat(['#1e3a8a', '#065f46', '#7f1d1d']).map(cl => `<button style="background:${cl}" class="${ED.p.bgColor === cl ? 'on' : ''}" data-bgc="${cl}" aria-label="${cl}"></button>`).join('')}</div>` : ''}`;
    } else if (k === 'music' && ED.p.music) {
      const m = ED.p.music;
      h = `<h4>${ic('music')} ${esc(m.name || 'Music')}</h4>${slider('Volume', 'mVol', 0, 1.5, 0.05, m.volume, v => Math.round(v * 100) + '%')}${slider('Start at', 'mOff', 0, 120, 0.5, m.offset || 0, v => fmtShort(v))}
        <label class="vs-row"><span>Fade in</span><input type="checkbox" id="mFi" ${m.fadeIn ? 'checked' : ''}></label><label class="vs-row"><span>Fade out</span><input type="checkbox" id="mFo" ${m.fadeOut ? 'checked' : ''}></label>
        <div class="vs-seg"><button class="btn sm ghost" id="mRep">Replace</button><button class="btn sm ghost" id="mDel">Remove music</button></div>`;
    } else if (x) {
      h = `<h4>${x.kind === 'caption' ? 'Caption' : 'Text'}</h4><textarea id="edTxt" rows="2">${esc(x.text)}</textarea>
        <div class="vs-seg" style="margin:10px 0">${Object.entries(FONTS).map(([f, [l]]) => `<button class="vs-chip${x.font === f ? ' on' : ''}" data-font="${f}">${l}</button>`).join('')}</div>
        ${slider('Size', 'tSize', 3, 18, 0.5, x.size, v => v)}
        <div class="vs-row"><span>Color</span><div class="vs-swatches">${COLORS.map(cl => `<button style="background:${cl}" class="${x.color === cl ? 'on' : ''}" data-color="${cl}" aria-label="${cl}"></button>`).join('')}</div></div>
        <label class="vs-row"><span>Box behind</span><input type="checkbox" id="tBox" ${x.bgBox ? 'checked' : ''}></label>
        <div class="vs-row"><span>Animation</span><select id="tAnim">${Object.entries(ANIMS).map(([a, l]) => `<option value="${a}"${x.anim === a ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
        <p class="vs-muted">Drag the text on the video to move it. Drag its edges on the timeline to change when it shows.</p>
        ${x.kind === 'caption' ? '<button class="btn sm ghost" id="tAllCap">Use this style for all captions</button>' : ''}`;
    } else if (c && k === 'speed') {
      h = `<h4>Speed</h4><div class="vs-seg" style="margin-bottom:10px">${[0.25, 0.5, 1, 1.5, 2, 3, 4].map(s => `<button class="vs-chip${c.speed === s ? ' on' : ''}" data-speed="${s}">${s}x</button>`).join('')}</div>${slider('Custom', 'cSpd', 0.25, 4, 0.05, c.speed, v => v + 'x')}<p class="vs-muted">Clip length: ${fmtShort(clipLen(c))}</p>`;
    } else if (c && k === 'volume') {
      h = `<h4>Volume</h4>${c.kind === 'image' ? '<p class="vs-muted">Photos have no sound.</p>' : slider('Volume', 'cVol', 0, 2, 0.05, c.volume, v => Math.round(v * 100) + '%') + `<div class="vs-seg"><button class="vs-chip" data-vol="0">Mute</button><button class="vs-chip" data-vol="1">100%</button></div>`}`;
    } else if (c && k === 'filter') {
      h = `<h4>Filters</h4><div class="vs-filters">${Object.entries(FILTERS).map(([f, [l]]) => `<button class="${c.filter === f ? 'on' : ''}" data-filter="${f}"><i style="filter:${FILTER_SWATCH[f]}"></i>${l}</button>`).join('')}</div><button class="btn sm ghost" id="fAll" style="margin-top:10px">Use on all clips</button>`;
    } else if (c && k === 'adjust') {
      const a = c.adj;
      h = `<h4>Adjust</h4>${slider('Brightness', 'aB', 40, 160, 1, a.b, v => v + '%')}${slider('Contrast', 'aC', 40, 160, 1, a.c, v => v + '%')}${slider('Saturation', 'aS', 0, 200, 1, a.s, v => v + '%')}<button class="btn sm ghost" id="aReset">Reset</button>`;
    } else if (c && k === 'trans') {
      h = `<h4>Transition</h4><p class="vs-muted">How this clip starts.</p><div class="vs-seg">${Object.entries(TRANS).map(([t2, l]) => `<button class="vs-chip${c.trans === t2 ? ' on' : ''}" data-trans="${t2}">${l}</button>`).join('')}</div><button class="btn sm ghost" id="tAll" style="margin-top:10px">Use between all clips</button>`;
    } else if (c) {
      const nat = c.kind === 'image' ? 60 : c.natural;
      h = `<h4>${c.kind === 'image' ? 'Photo' : 'Clip'} ${ED.p.clips.indexOf(c) + 1} of ${ED.p.clips.length}</h4>
        ${c.kind === 'image' ? slider('Show for', 'cDur', 0.5, 30, 0.5, +(c.out - c.in).toFixed(1), v => v + 's') : slider('Start', 'cIn', 0, +(nat - 0.2).toFixed(2), 0.05, +c.in.toFixed(2), v => fmt(v)) + slider('End', 'cOut', 0.2, +nat.toFixed(2), 0.05, +c.out.toFixed(2), v => fmt(v))}
        <div class="vs-seg" style="margin:4px 0 10px"><button class="vs-chip${c.fit === 'fit' ? ' on' : ''}" data-fit="fit">Fit</button><button class="vs-chip${c.fit === 'fill' ? ' on' : ''}" data-fit="fill">Fill frame</button></div>
        <div class="vs-seg"><button class="btn sm ghost" id="cL" ${ED.p.clips.indexOf(c) === 0 ? 'disabled' : ''}>${ic('left')} Move</button><button class="btn sm ghost" id="cR" ${ED.p.clips.indexOf(c) === ED.p.clips.length - 1 ? 'disabled' : ''}>Move ${ic('right')}</button></div>
        <p class="vs-muted" style="margin-top:10px">Tip: drag the yellow edges on the timeline to trim, and use Split to cut at the playhead.</p>`;
    } else {
      h = ED.p.clips.length ? `<h4>Project</h4><p class="vs-muted">${ED.p.clips.length} clip${ED.p.clips.length === 1 ? '' : 's'} · ${fmtShort(total())} · ${ED.p.shape}</p><p class="vs-muted">Tap a clip or text on the timeline to edit it.</p><button class="btn sm ghost" id="pNew">Start a new project</button>`
        : `<h4>Video editor</h4><p class="vs-muted">Free and private: your videos stay on this device. Add clips and photos, then trim, split, add text, captions, music, filters and transitions, and export.</p>`;
    }
    side.innerHTML = h;
    bindSide(side, c, x);
  }
  function bindSide(side, c, x) {
    const re = () => { drawTimeline(); drawFrame(); };
    $$('[data-shape]', side).forEach(b => b.onclick = () => { ED.p.shape = b.dataset.shape; snapshot(); drawSide(); drawFrame(); });
    $$('[data-fitall]', side).forEach(b => b.onclick = () => { ED.p.clips.forEach(k => k.fit = b.dataset.fitall); snapshot(); drawFrame(); toast(b.dataset.fitall === 'fill' ? 'All clips fill the frame.' : 'All clips fit inside the frame.'); });
    $$('[data-bg]', side).forEach(b => b.onclick = () => { ED.p.bg = b.dataset.bg; snapshot(); drawSide(); drawFrame(); });
    $$('[data-bgc]', side).forEach(b => b.onclick = () => { ED.p.bgColor = b.dataset.bgc; snapshot(); drawSide(); drawFrame(); });
    if (ED.p.music && ED.tool === 'music') {
      const m = ED.p.music;
      bindSlider('mVol', v => m.volume = v, v => Math.round(v * 100) + '%');
      bindSlider('mOff', v => m.offset = v, v => fmtShort(v));
      const fi = $('#mFi', side), fo = $('#mFo', side); if (fi) fi.onchange = () => { m.fadeIn = fi.checked; snapshot(); }; if (fo) fo.onchange = () => { m.fadeOut = fo.checked; snapshot(); };
      const rp = $('#mRep', side); if (rp) rp.onclick = () => { ED.p.music = null; tool('music'); };
      const md = $('#mDel', side); if (md) md.onclick = () => { ED.p.music = null; ED.tool = null; snapshot(); drawUI(); };
    }
    if (x && $('#edTxt', side)) {
      const ta = $('#edTxt', side); ta.oninput = () => { x.text = ta.value; drawFrame(); }; ta.onchange = () => { snapshot(); drawTimeline(); };
      $$('[data-font]', side).forEach(b => b.onclick = () => { x.font = b.dataset.font; snapshot(); drawSide(); drawFrame(); });
      $$('[data-color]', side).forEach(b => b.onclick = () => { x.color = b.dataset.color; snapshot(); drawSide(); drawFrame(); });
      bindSlider('tSize', v => x.size = v, v => v, drawFrame);
      const bx = $('#tBox', side); bx.onchange = () => { x.bgBox = bx.checked; snapshot(); drawFrame(); };
      const an = $('#tAnim', side); an.onchange = () => { x.anim = an.value; snapshot(); };
      const ac = $('#tAllCap', side); if (ac) ac.onclick = () => { ED.p.texts.filter(y => y.kind === 'caption').forEach(y => { y.font = x.font; y.size = x.size; y.color = x.color; y.bgBox = x.bgBox; y.anim = x.anim; y.y = x.y; y.x = x.x; }); snapshot(); drawFrame(); toast('All captions updated.'); };
    }
    if (!c) { const pn = $('#pNew', side); if (pn) pn.onclick = () => { if (!confirm('Start a new project? The current one will be cleared (your saved videos stay).')) return; pause(); ED.p = newProject(); ED.sel = null; ED.tool = null; ED.t = 0; snapshot(); drawUI(); drawFrame(); }; return; }
    $$('[data-speed]', side).forEach(b => b.onclick = () => { c.speed = +b.dataset.speed; snapshot(); drawSide(); re(); });
    bindSlider('cSpd', v => c.speed = v, v => v + 'x', re);
    bindSlider('cVol', v => c.volume = v, v => Math.round(v * 100) + '%');
    $$('[data-vol]', side).forEach(b => b.onclick = () => { c.volume = +b.dataset.vol; snapshot(); drawSide(); });
    $$('[data-filter]', side).forEach(b => b.onclick = () => { c.filter = b.dataset.filter; snapshot(); drawSide(); re(); });
    const fa = $('#fAll', side); if (fa) fa.onclick = () => { ED.p.clips.forEach(k => k.filter = c.filter); snapshot(); re(); toast('Filter used on all clips.'); };
    bindSlider('aB', v => c.adj.b = v, v => v + '%', drawFrame); bindSlider('aC', v => c.adj.c = v, v => v + '%', drawFrame); bindSlider('aS', v => c.adj.s = v, v => v + '%', drawFrame);
    const ar = $('#aReset', side); if (ar) ar.onclick = () => { c.adj = { b: 100, c: 100, s: 100 }; snapshot(); drawSide(); drawFrame(); };
    $$('[data-trans]', side).forEach(b => b.onclick = () => { c.trans = b.dataset.trans; snapshot(); drawSide(); seek(c.start); if (c.trans !== 'none') play(); });
    const ta = $('#tAll', side); if (ta) ta.onclick = () => { ED.p.clips.forEach((k, i) => { if (i) k.trans = c.trans; }); snapshot(); toast('Transition used between all clips.'); };
    bindSlider('cIn', v => { c.in = Math.min(v, c.out - 0.2); }, v => fmt(v), () => { layout(); seek(c.start); });
    bindSlider('cOut', v => { c.out = Math.max(v, c.in + 0.2); }, v => fmt(v), () => { layout(); seek(c.start + clipLen(c) - 0.05); });
    bindSlider('cDur', v => { c.in = 0; c.out = v; }, v => v + 's', re);
    $$('[data-fit]', side).forEach(b => b.onclick = () => { c.fit = b.dataset.fit; snapshot(); drawSide(); drawFrame(); });
    const ml = $('#cL', side), mr = $('#cR', side), i = ED.p.clips.indexOf(c);
    if (ml) ml.onclick = () => { ED.p.clips.splice(i, 1); ED.p.clips.splice(i - 1, 0, c); snapshot(); drawUI(); seek(c.start); };
    if (mr) mr.onclick = () => { ED.p.clips.splice(i, 1); ED.p.clips.splice(i + 1, 0, c); snapshot(); drawUI(); seek(c.start); };
  }

  /* ---- AI tools in the editor ---- */
  const AUDIO = {};
  async function clipAudio(c) {
    if (c.kind !== 'video') return null;
    if (AUDIO[c.file] !== undefined) return AUDIO[c.file];
    try {
      const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
      const buf = await ctx.decodeAudioData(await ED.files[c.file].blob.arrayBuffer());
      ctx.close && ctx.close();
      return AUDIO[c.file] = buf;
    } catch (e) { return AUDIO[c.file] = null; }
  }
  function wavPart(buf, from, to) {
    const rate = 16000, n = Math.max(1, Math.floor((to - from) * rate)), out = new Float32Array(n), chs = buf.numberOfChannels, sr = buf.sampleRate;
    const data = []; for (let k = 0; k < chs; k++) data.push(buf.getChannelData(k));
    for (let i = 0; i < n; i++) { const p = Math.floor((from + i / rate) * sr); let s = 0; for (let k = 0; k < chs; k++) s += data[k][p] || 0; out[i] = s / chs; }
    const ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, clamp(out[i], -1, 1) * 0x7fff, true);
    return new Blob([ab], { type: 'audio/wav' });
  }
  function busy(msg) { const m = modal(`<h3>${esc(msg)}</h3><div class="vs-bar"><i></i></div><p data-s style="margin-top:8px">This can take a moment.</p>`); return { set: s => { const p = m.querySelector('[data-s]'); if (p) p.textContent = s; }, done: () => m.remove() }; }
  async function autoCaptions() {
    const vids = ED.p.clips.filter(c => c.kind === 'video' && c.volume > 0); layout();
    if (!vids.length) return toast('Add a video with sound to make captions.');
    const b = busy('Making captions');
    let made = 0, failed = '';
    try {
      ED.p.texts = ED.p.texts.filter(x => x.kind !== 'caption');
      for (let i = 0; i < vids.length; i++) {
        const c = vids[i]; b.set('Listening to clip ' + (i + 1) + ' of ' + vids.length + '…');
        const buf = await clipAudio(c); if (!buf) { failed = 'Some clips\' sound couldn\'t be read in this browser.'; continue; }
        if (c.out - c.in > 600) { failed = 'Clips longer than 10 minutes are skipped.'; continue; }
        const j = await transcribeWav(wavPart(buf, c.in, c.out));
        const segs = (j.segments && j.segments.length) ? j.segments : (j.text ? [{ start: 0, end: c.out - c.in, text: j.text }] : []);
        for (const s of segs) {
          const words = String(s.text).trim().split(/\s+/).filter(Boolean); if (!words.length) continue;
          const chunks = []; for (let k = 0; k < words.length; k += 5) chunks.push(words.slice(k, k + 5).join(' '));
          const st = c.start + s.start / c.speed, en = c.start + Math.max(s.start + 0.3, s.end) / c.speed, per = (en - st) / chunks.length;
          chunks.forEach((t, k) => { ED.p.texts.push({ id: uid(), kind: 'caption', text: t, start: st + k * per, end: st + (k + 1) * per, x: 0.5, y: 0.8, size: 6.5, font: 'bold', color: '#ffffff', bgBox: false, anim: 'pop' }); made++; });
        }
      }
    } catch (e) { b.done(); return toast(e.message, true); }
    b.done(); snapshot(); drawUI(); drawFrame();
    toast(made ? 'Added ' + made + ' captions. Tap one to change the style for all.' + (failed ? ' ' + failed : '') : (failed || 'No speech was found.'), !made);
  }
  async function cutPauses() {
    const sel = ED.sel && ED.sel.type === 'clip' ? findClip(ED.sel.id) : null;
    const targets = (sel ? [sel] : ED.p.clips).filter(c => c.kind === 'video');
    if (!targets.length) return toast('Add a video with sound first.');
    const b = busy('Finding pauses');
    let removed = 0, saved = 0;
    for (const c of targets) {
      const buf = await clipAudio(c); if (!buf) continue;
      const sr = buf.sampleRate, d = buf.getChannelData(0), win = 0.05, n = Math.floor((c.out - c.in) / win), rms = [];
      for (let i = 0; i < n; i++) { const a = Math.floor((c.in + i * win) * sr), z = Math.floor(win * sr); let s = 0; for (let k = 0; k < z; k += 4) { const x = d[a + k] || 0; s += x * x; } rms.push(Math.sqrt(s / (z / 4))); }
      const peak = Math.max(...rms, 0.0001), thr = Math.max(0.008, peak * 0.06);
      const keep = []; let i = 0;
      while (i < n) { if (rms[i] >= thr) { let j = i; while (j < n && !(rms[j] < thr && rms.slice(j, j + 14).every(x => x < thr))) j++; keep.push([c.in + Math.max(0, i * win - 0.15), c.in + Math.min(n * win, j * win + 0.15)]); i = j; } else i++; }
      if (keep.length <= 1 && keep[0] && keep[0][1] - keep[0][0] > (c.out - c.in) - 0.6) continue;
      if (!keep.length) continue;
      const merged = []; for (const k of keep) { const last = merged[merged.length - 1]; if (last && k[0] - last[1] < 0.3) last[1] = k[1]; else merged.push(k.slice()); }
      const idx = ED.p.clips.indexOf(c), parts = merged.map((k, x) => Object.assign(JSON.parse(JSON.stringify(c)), { id: uid(), in: k[0], out: Math.min(c.out, k[1]), trans: x ? 'none' : c.trans, thumb: c.thumb }));
      saved += (c.out - c.in) - parts.reduce((a, p) => a + (p.out - p.in), 0); removed += Math.max(0, merged.length - 1) + (merged[0][0] > c.in + 0.2 ? 1 : 0);
      ED.p.clips.splice(idx, 1, ...parts);
    }
    b.done();
    if (!saved || saved < 0.3) return toast('No long pauses found.');
    ED.sel = null; snapshot(); drawUI(); seek(0);
    toast('Cut ' + removed + ' pause' + (removed === 1 ? '' : 's') + ', ' + saved.toFixed(1) + ' seconds shorter.');
  }
  async function aiIdeas() {
    const caps = ED.p.texts.filter(x => x.kind === 'caption').map(x => x.text).join(' ').slice(0, 3000);
    const md = modal(`<h3>AI ideas for this video</h3><p>Get a hook for the first seconds, a title, a post caption and hashtags.</p>
      <label class="vs-field">What's the video about?<textarea id="aiAbout" rows="3" placeholder="For example: a 30-second recipe for 5-minute pancakes">${esc(caps ? 'Video says: ' + caps.slice(0, 400) : '')}</textarea></label>
      <div class="vs-actions"><button class="btn sm ghost" data-close>Close</button><button class="btn primary sm" id="aiGo">${ic('spark')} Get ideas</button></div><div id="aiOut"></div>`);
    $('#aiGo', md).onclick = async e => {
      const about = $('#aiAbout', md).value.trim(); if (!about) return $('#aiAbout', md).focus();
      e.currentTarget.disabled = true; $('#aiOut', md).innerHTML = '<div class="vs-bar"><i></i></div>';
      try {
        const raw = await chatAI('You help people make short social videos. Reply with JSON only: {"hooks":["3 short on-screen hook lines, under 8 words each"],"title":"a catchy title","caption":"a post caption, 1-2 sentences","hashtags":["8 relevant hashtags without #"]}', about, true);
        let j; try { j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)); } catch (er) { throw new Error('The AI\'s answer couldn\'t be read. Try again.'); }
        const out = $('#aiOut', md);
        out.innerHTML = `<h4 style="margin:12px 0 6px">Hooks</h4>${(j.hooks || []).map((h, i) => `<div class="vs-row" style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><span style="flex:1">${esc(h)}</span><button class="btn sm" data-hook="${i}">Add</button></div>`).join('')}
          <h4 style="margin:12px 0 6px">Title</h4><p style="color:inherit">${esc(j.title || '')}</p><h4 style="margin:12px 0 6px">Caption</h4><p style="color:inherit">${esc(j.caption || '')}<br>${esc((j.hashtags || []).map(x => '#' + String(x).replace(/^#/, '')).join(' '))}</p>
          <button class="btn sm ghost" id="aiCopy">Copy caption and hashtags</button>`;
        $$('[data-hook]', out).forEach(b => b.onclick = () => { md.remove(); const keep = ED.t; ED.t = 0; addText(j.hooks[+b.dataset.hook], { y: 0.22, end: Math.min(total() || 3, 3), anim: 'pop', bgBox: true, color: '#111111' }); ED.t = keep; seek(0); });
        $('#aiCopy', out).onclick = () => { navigator.clipboard && navigator.clipboard.writeText((j.caption || '') + '\n\n' + (j.hashtags || []).map(x => '#' + String(x).replace(/^#/, '')).join(' ')); toast('Copied.'); };
      } catch (err) { $('#aiOut', md).innerHTML = ''; toast(err.message, true); }
      const g = $('#aiGo', md); if (g) g.disabled = false;
    };
  }

  /* ---- export ---- */
  function bestType() {
    const list = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    if (!window.MediaRecorder) return null;
    return list.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || '';
  }
  async function exportVideo() {
    if (!ED.p.clips.length) return;
    const type = bestType();
    if (type === null || !ED.canvas.captureStream) return toast('This browser can\'t export videos. Try Chrome, Edge or Safari.', true);
    const md = modal(`<h3>Export video</h3><p>${fmtShort(total())} · ${ED.p.shape}. Exporting plays the video once, so it takes about as long as the video. Keep this tab open.</p>
      <div class="vs-seg"><button class="vs-chip${ED.p.quality !== '1080' ? ' on' : ''}" data-q="720">720p</button><button class="vs-chip${ED.p.quality === '1080' ? ' on' : ''}" data-q="1080">1080p</button></div>
      <div class="vs-actions"><button class="btn sm ghost" data-close>Cancel</button><button class="btn primary sm" id="exGo">${ic('exp')} Export</button></div>`);
    $$('[data-q]', md).forEach(b => b.onclick = () => { ED.p.quality = b.dataset.q; $$('[data-q]', md).forEach(x => x.classList.toggle('on', x === b)); persist(); });
    $('#exGo', md).onclick = async () => {
      md.remove(); pause();
      const A = audioGraph(); if (A && A.ctx.state === 'suspended') await A.ctx.resume();
      ED.exporting = true; ED.sel = null; sizeCanvas(); drawFrame();
      const tracks = ED.canvas.captureStream(30).getVideoTracks().concat(A ? A.rec.stream.getAudioTracks() : []);
      const [w] = outSize();
      let rec; try { rec = new MediaRecorder(new MediaStream(tracks), Object.assign({ videoBitsPerSecond: w >= 1080 ? 10e6 : 6e6 }, type ? { mimeType: type } : {})); }
      catch (e) { ED.exporting = false; return toast('Export isn\'t supported here: ' + e.message, true); }
      const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      const T = total();
      const prog = modal(`<h3>Exporting</h3><div class="vs-bar" style="height:8px"><i style="animation:none;width:0%;transition:width .3s" id="exBar"></i></div><p id="exPct" style="margin-top:8px">0%</p><div class="vs-actions"><button class="btn sm ghost" id="exStop">Cancel</button></div>`);
      let cancelled = false;
      $('#exStop', prog).onclick = () => { cancelled = true; pause(); try { rec.stop(); } catch (e) {} };
      const tick = setInterval(() => { const p = Math.round(clamp(ED.t / T, 0, 1) * 100); const bar = $('#exBar', prog); if (bar) bar.style.width = p + '%'; const pc = $('#exPct', prog); if (pc) pc.textContent = p + '%'; }, 250);
      const done = new Promise(res => { rec.onstop = res; });
      ED.onEnd = () => { setTimeout(() => { try { rec.stop(); } catch (e) {} }, 150); };
      ED.t = 0; seek(0);
      await new Promise(r => setTimeout(r, 350));   // let the first frame load
      rec.start(250); play();
      await done;
      clearInterval(tick); ED.onEnd = null; ED.exporting = false; prog.remove(); sizeCanvas(); drawFrame();
      if (cancelled) return toast('Export cancelled.');
      const blob = new Blob(chunks, { type: (type || 'video/webm').split(';')[0] });
      if (blob.size < 1000) return toast('The export came out empty. Try again, and keep this tab in front while it runs.', true);
      const name = 'AI Photo and Video ' + new Date().toLocaleDateString();
      await addMine(blob, { name, kind: 'export' });
      const md2 = modal(`<h3>Your video is ready</h3><video src="${URL.createObjectURL(blob)}" controls playsinline style="width:100%;max-height:55vh;border-radius:12px;background:#000"></video><p style="margin-top:8px">Saved to My videos on this device.${/webm/.test(blob.type) ? ' This browser saves WebM files; most apps and sites accept them, and you can convert to MP4 with any free converter if needed.' : ''}</p>
        <div class="vs-actions"><button class="btn sm ghost" data-close>Close</button>${navigator.canShare ? '<button class="btn sm" id="exShare">Share</button>' : ''}<button class="btn primary sm" id="exDl">${ic('exp')} Download</button></div>`);
      $('#exDl', md2).onclick = () => download(blob, 'video.' + extFor(blob.type));
      const sh = $('#exShare', md2);
      if (sh) sh.onclick = async () => { try { const f = new File([blob], 'video.' + extFor(blob.type), { type: blob.type }); if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); else download(blob, 'video.' + extFor(blob.type)); } catch (e) {} };
    };
  }

  /* =====================================================================
     the section
     ===================================================================== */
  let ROOT = null, TAB = 'create';
  function setTab(t) { TAB = t; if (ED.playing) pause(); rerender(); if (ROOT) ROOT.scrollIntoView({ block: 'start' }); }
  function rerender() { if (ROOT) render(ROOT); }
  async function render(root) {
    css(); ROOT = root;
    if (TAB !== 'editor' && ED.playing) pause();
    root.innerHTML = `<div class="vs-head"><h2>Video</h2><div class="vs-tabs" role="tablist">
      <button role="tab" data-tab="create" class="${TAB === 'create' ? 'on' : ''}">${ic('spark')} Create</button>
      <button role="tab" data-tab="aiedit" class="${TAB === 'aiedit' ? 'on' : ''}">${ic('wand')} AI edit</button>
      <button role="tab" data-tab="editor" class="${TAB === 'editor' ? 'on' : ''}">${ic('scissors')} Editor</button></div></div><h2 class="vs-title">${TAB === 'create' ? 'Text to video' : TAB === 'aiedit' ? 'Edit a video with AI' : 'Video editor'}</h2><div id="vsBody"></div>`;
    $$('[data-tab]', root).forEach(b => b.onclick = () => setTab(b.dataset.tab));
    const body = $('#vsBody', root);
    if (TAB === 'create') renderCreate(body);
    else if (TAB === 'aiedit') renderAIEdit(body);
    else await renderEditor(body);
  }
  window.AIVVideo = { render, tab: t => setTab(t), addToEditor: (blob, name) => { ED.pendingAdd = [{ blob, name }]; setTab('editor'); } };
  // drag and drop files into the editor
  document.addEventListener('dragover', e => { if (TAB === 'editor' && ROOT && ROOT.contains(e.target)) e.preventDefault(); });
  document.addEventListener('drop', e => { if (TAB === 'editor' && ROOT && ROOT.contains(e.target) && e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); addMedia(Array.from(e.dataTransfer.files).map(f => ({ blob: f, name: f.name }))); } });
  addEventListener('resize', () => { if (TAB === 'editor' && ED.root && document.body.contains(ED.root)) drawTimeline(); });
})();
