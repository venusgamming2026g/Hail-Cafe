/* ==========================================================================
   HAIL OS — منظومة الإشعارات
   تنبيهات منبثقة + أصوات مولّدة داخلياً (بلا ملفات) + إشعارات النظام
   + وميض العنوان + اهتزاز الجوال.
   ========================================================================== */

import { icon, esc } from './util.js';
import { lockScroll, unlockScroll } from './fx.js';
import * as store from './store.js';

/* ── 1. الأصوات (WebAudio — لا تحتاج أي ملف) ─────────────────────────── */
let ctx = null;
let unlocked = false;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** المتصفحات تمنع الصوت قبل أول تفاعل — نفكّ القفل عند أول لمسة */
export function unlockAudio() {
  if (unlocked) return true;
  const a = audio();
  if (!a) return false;
  const o = a.createOscillator(); const g = a.createGain();
  g.gain.value = 0.0001; o.connect(g); g.connect(a.destination);
  o.start(); o.stop(a.currentTime + 0.01);
  unlocked = true;
  return true;
}
['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
  window.addEventListener(ev, () => unlockAudio(), { once: true, passive: true }));

function tone({ freq = 660, dur = 0.16, type = 'sine', gain = 0.22, delay = 0, slide = null, attack = 0.012 }) {
  const a = audio();
  if (!a) return;
  const vol = store.get().settings.soundVolume ?? 0.6;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * vol), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(a.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
}

function noise({ dur = 0.12, gain = 0.12, delay = 0 }) {
  const a = audio();
  if (!a) return;
  const vol = store.get().settings.soundVolume ?? 0.6;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(); src.buffer = buf;
  const g = a.createGain(); g.gain.value = gain * vol;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200;
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start(a.currentTime + delay);
}

/** مكتبة النغمات — كل حدث في المطعم له بصمة صوتية مميزة */
export const SOUNDS = {
  order:   () => { tone({ freq: 784, dur: .13, type: 'triangle', gain: .26 });
                   tone({ freq: 1047, dur: .18, type: 'triangle', gain: .24, delay: .10 });
                   tone({ freq: 1319, dur: .30, type: 'sine', gain: .20, delay: .20 }); },
  ready:   () => { tone({ freq: 1175, dur: .12, type: 'sine', gain: .26 });
                   tone({ freq: 1568, dur: .34, type: 'sine', gain: .22, delay: .11 }); },
  service: () => { tone({ freq: 880, dur: .14, type: 'square', gain: .16 });
                   tone({ freq: 660, dur: .14, type: 'square', gain: .16, delay: .16 });
                   tone({ freq: 880, dur: .22, type: 'square', gain: .16, delay: .32 }); },
  urgent:  () => { for (let i = 0; i < 3; i++)
                     tone({ freq: 1046, dur: .1, type: 'sawtooth', gain: .18, delay: i * .17, slide: 720 }); },
  success: () => { tone({ freq: 523, dur: .1, type: 'sine', gain: .2 });
                   tone({ freq: 659, dur: .1, type: 'sine', gain: .2, delay: .09 });
                   tone({ freq: 784, dur: .1, type: 'sine', gain: .2, delay: .18 });
                   tone({ freq: 1047, dur: .34, type: 'sine', gain: .22, delay: .27 }); },
  cash:    () => { tone({ freq: 1760, dur: .07, type: 'square', gain: .14 });
                   tone({ freq: 2093, dur: .09, type: 'square', gain: .12, delay: .06 });
                   noise({ dur: .3, gain: .07, delay: .1 });
                   tone({ freq: 392, dur: .4, type: 'sine', gain: .14, delay: .12 }); },
  tap:     () => tone({ freq: 1200, dur: .045, type: 'sine', gain: .10 }),
  add:     () => { tone({ freq: 660, dur: .07, type: 'sine', gain: .16 });
                   tone({ freq: 990, dur: .11, type: 'sine', gain: .14, delay: .06 }); },
  remove:  () => tone({ freq: 340, dur: .12, type: 'sine', gain: .14, slide: 200 }),
  error:   () => { tone({ freq: 200, dur: .2, type: 'sawtooth', gain: .16, slide: 120 });
                   tone({ freq: 150, dur: .26, type: 'sawtooth', gain: .12, delay: .06 }); },
  chime:   () => { tone({ freq: 1568, dur: .5, type: 'sine', gain: .16 });
                   tone({ freq: 2093, dur: .6, type: 'sine', gain: .10, delay: .05 }); },
};

export function play(name) {
  if (!store.get().settings.sound) return;
  const fn = SOUNDS[name];
  if (fn) { try { fn(); } catch { /* الصوت غير متاح */ } }
}

/* ── 2. الاهتزاز ─────────────────────────────────────────────────────── */
export function buzz(pattern = 18) {
  if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch { /* تجاهل */ } }
}

/* ── 3. التنبيهات المنبثقة ───────────────────────────────────────────── */
let wrap = null;
function mount() {
  if (wrap && document.body.contains(wrap)) return wrap;
  wrap = document.createElement('div');
  wrap.className = 'toast-wrap';
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-live', 'polite');
  document.body.append(wrap);
  return wrap;
}

const TONE = {
  info: { ic: 'info', bg: 'rgba(62,144,210,.18)', fg: 'var(--info-400)' },
  ok:   { ic: 'check', bg: 'rgba(46,158,126,.18)', fg: 'var(--ok-400)' },
  warn: { ic: 'alert', bg: 'rgba(222,148,48,.18)', fg: 'var(--warn-400)' },
  bad:  { ic: 'alert', bg: 'rgba(223,76,64,.18)', fg: 'var(--bad-400)' },
  gold: { ic: 'sparkle', bg: 'rgba(192,70,42,.18)', fg: 'var(--clay-300)' },
};

export function toast(title, { body = '', tone: t = 'info', life = 4600, sound = null, iconName = null, onClick = null } = {}) {
  const w = mount();
  const cfg = TONE[t] || TONE.info;
  const node = document.createElement('div');
  node.className = 'toast';
  node.style.setProperty('--toast-life', `${life}ms`);
  node.innerHTML = `
    <span class="toast-ic" style="background:${cfg.bg};color:${cfg.fg}">${icon(iconName || cfg.ic)}</span>
    <span class="grow"><b>${esc(title)}</b>${body ? `<p>${esc(body)}</p>` : ''}</span>
    <button class="btn btn-icon btn-ghost" style="width:30px;min-height:30px" aria-label="إغلاق">${icon('x')}</button>`;

  const close = () => {
    node.classList.add('out');
    setTimeout(() => node.remove(), 320);
  };
  node.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); close(); });
  if (onClick) {
    node.style.cursor = 'pointer';
    node.addEventListener('click', () => { onClick(); close(); });
  }
  w.prepend(node);
  if (w.children.length > 5) w.lastElementChild.remove();
  if (sound) play(sound);
  setTimeout(close, life);
  return close;
}

/* ── 4. إشعارات نظام التشغيل ─────────────────────────────────────────── */
export async function requestDesktopPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

export function desktopNotify(title, body, tag = 'hailos') {
  if (!store.get().settings.desktopNotify) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;  // لا نزعج والشاشة أمام المستخدم
  try { new Notification(title, { body, tag, icon: 'assets/img/logo.png', badge: 'assets/img/logo.png' }); }
  catch { /* تجاهل */ }
}

/* ── 5. وميض عنوان التبويب ───────────────────────────────────────────── */
let baseTitle = document.title;
let blinkTimer = null;
let pendingCount = 0;

export function setBadge(n) {
  pendingCount = n;
  document.title = n > 0 ? `(${n}) ${baseTitle}` : baseTitle;
  if (navigator.setAppBadge) {
    try {
      if (n > 0) navigator.setAppBadge(n);
      else navigator.clearAppBadge();
    } catch { /* تجاهل */ }
  }
}
export function setBaseTitle(t) { baseTitle = t; setBadge(pendingCount); }

export function blinkTitle(text, times = 6) {
  clearInterval(blinkTimer);
  let on = false, i = 0;
  blinkTimer = setInterval(() => {
    document.title = on ? (pendingCount ? `(${pendingCount}) ${baseTitle}` : baseTitle) : `${text}`;
    on = !on;
    if (++i > times * 2) { clearInterval(blinkTimer); setBadge(pendingCount); }
  }, 620);
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { clearInterval(blinkTimer); setBadge(pendingCount); }
});

/* ── 6. تنبيه مركّب: صوت + منبثق + نظام + اهتزاز ─────────────────────── */
export function alertAll(title, { body = '', tone = 'info', sound = null, blink = null, vibrate = null, onClick = null } = {}) {
  toast(title, { body, tone, sound, onClick });
  desktopNotify(title, body);
  if (blink) blinkTitle(blink);
  if (vibrate) buzz(vibrate);
}

/* ── 7. مربّع تأكيد أنيق (بديل confirm) ──────────────────────────────── */
export function confirmBox(title, { body = '', okText = 'تأكيد', cancelText = 'إلغاء', tone = 'gold' } = {}) {
  return new Promise((resolve) => {
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    const box = document.createElement('div');
    box.className = 'modal';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = `
      <div style="padding:26px 24px 20px;text-align:center">
        <div class="center" style="width:56px;height:56px;border-radius:18px;margin:0 auto 14px;
             background:${TONE[tone]?.bg};color:${TONE[tone]?.fg}">${icon(TONE[tone]?.ic || 'info')}</div>
        <h3 style="margin-bottom:6px">${esc(title)}</h3>
        ${body ? `<p class="mute t-sm">${esc(body)}</p>` : ''}
      </div>
      <div class="row" style="padding:0 20px 20px;gap:10px">
        <button class="btn btn-ghost grow" data-no>${esc(cancelText)}</button>
        <button class="btn ${tone === 'bad' ? 'btn-bad' : 'btn-gold'} grow" data-yes>${esc(okText)}</button>
      </div>`;
    let closed = false;
    const done = (v) => {
      if (closed) return;
      closed = true;
      box.classList.add('out'); scrim.style.opacity = '0';
      setTimeout(() => { box.remove(); scrim.remove(); }, 220);
      unlockScroll();
      resolve(v);
    };
    scrim.addEventListener('click', () => done(false));
    box.querySelector('[data-no]').addEventListener('click', () => done(false));
    box.querySelector('[data-yes]').addEventListener('click', () => done(true));
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { done(false); document.removeEventListener('keydown', onKey); }
      if (e.key === 'Enter')  { done(true);  document.removeEventListener('keydown', onKey); }
    });
    lockScroll();
    document.body.append(scrim, box);
    box.querySelector('[data-yes]').focus();
  });
}
