/* ==========================================================================
   HAIL OS — أدوات مشتركة
   ========================================================================== */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* رقم طلب قصير يسهل نطقه على الطاقم */
export function orderCode(seq) {
  return `H-${String(seq).padStart(4, '0')}`;
}

/* ── المال (الفلس → دينار) ───────────────────────────────────────────── */
export function money(fils, withSymbol = true) {
  const v = (fils / 1000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
  return withSymbol ? `${v} د.أ` : v;
}
export function moneyPlain(fils) { return (fils / 1000).toFixed(3); }

/* ── الوقت ───────────────────────────────────────────────────────────── */
export function clockTime(ts = Date.now()) {
  return new Date(ts).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', hour12: true });
}
export function dateLabel(ts = Date.now()) {
  return new Date(ts).toLocaleDateString('ar-JO', { weekday: 'long', day: 'numeric', month: 'long' });
}
/* صياغة عربية سليمة للعدد: دقيقة / دقيقتان / دقائق */
export function plural(n, one, two, few, many = few) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n % 100 >= 3 && n % 100 <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

/* مدة مقروءة منذ لحظة ما */
export function since(ts) {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 10) return 'الآن';
  if (sec < 60) return plural(sec, 'ثانية', 'ثانيتين', 'ثوانٍ', 'ثانية');
  const min = Math.floor(sec / 60);
  if (min < 60) return plural(min, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة');
  const hr = Math.floor(min / 60);
  const rest = min % 60;
  const hrs = plural(hr, 'ساعة', 'ساعتين', 'ساعات', 'ساعة');
  return rest ? `${hrs} و${rest} د` : hrs;
}
export function minutesSince(ts) { return Math.floor((Date.now() - ts) / 60000); }

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function debounce(fn, wait = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
}
export function throttle(fn, wait = 200) {
  let last = 0, timer;
  return (...a) => {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn(...a); }
    else { clearTimeout(timer); timer = setTimeout(() => { last = Date.now(); fn(...a); }, wait - (now - last)); }
  };
}

/* ── نصوص آمنة ───────────────────────────────────────────────────────── */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function clean(s, max = 240) {
  return typeof s === 'string' ? s.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}
/* تطبيع البحث العربي: يزيل التشكيل ويوحّد الألف والهاء والياء */
export function normalizeAr(s) {
  return String(s || '')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي').replace(/ة/g, 'ه')
    .toLowerCase().trim();
}
export const digitsAr = (n) => String(n);

/* ── HTML مختصر ──────────────────────────────────────────────────────── */
export function html(strings, ...vals) {
  return strings.reduce((out, s, i) => out + s + (vals[i] ?? ''), '');
}
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

/* ── الأيقونات (SVG فقط، لا رموز تعبيرية) ────────────────────────────── */
const P = {
  flame:'M12 2c1.5 3.5-1 5-1 7a3 3 0 0 0 6 0c0-1-.3-2-.8-2.8C18.9 8.3 20 10.9 20 13a8 8 0 0 1-16 0c0-3.5 2-6.5 5-9 .8 1.6 2 2.4 3 3 0-1.6 0-3.4 0-5Z',
  beef:'M4 15a8 8 0 1 1 16 0v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-3ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z',
  pizza:'M12 2 3 20a1 1 0 0 0 1.3 1.3L22 12 12 2Zm-2 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4-4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z',
  salad:'M3 12h18a9 9 0 0 1-18 0Zm2 10h14M12 3v3m-3-1 1.5 2M15 5l-1.5 2',
  cup:'M4 4h13v6a6.5 6.5 0 0 1-13 0V4Zm13 2h2a2.5 2.5 0 0 1 0 5h-2M3 21h16',
  cake:'M4 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5ZM12 3v4M8 5v2m8-2v2',
  smoke:'M5 20c3 0 3-2 6-2s3 2 6 2M4 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2M12 3c2 1 2 3 0 4',
  egg:'M12 2c4 0 7 6 7 11a7 7 0 1 1-14 0c0-5 3-11 7-11Z',
  bowl:'M3 11h18a9 9 0 0 1-18 0Zm4-4c1-2 3-2 4 0m2-2c1-1.5 3-1.5 4 0',
  pasta:'M4 8h16M4 8c0 8 3 12 8 12s8-4 8-12M8 8V5m4 3V4m4 4V5',
  soup:'M4 10h16a8 8 0 0 1-16 0Zm3 11h10M9 3c0 1.5 1 1.5 1 3m4-3c0 1.5 1 1.5 1 3',
  burger:'M4 9a8 8 0 0 1 16 0H4Zm0 4h16M4 16h16a4 4 0 0 1-4 3H8a4 4 0 0 1-4-3Z',
  sandwich:'M3 9l9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M5 12v3',
  juice:'M8 3h8l-1 18H9L8 3Zm0 6h8',
  smoothie:'M7 8h10l-1 11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2L7 8Zm2-5 2 5m4-5-2 5',
  shake:'M7 9h10l-1 10a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3L7 9Zm-1 0a6 6 0 0 1 12 0M12 3v2',
  mojito:'M4 6h16l-8 9v6m-4 0h8M9 10h6',
  iced:'M6 7h12l-1 12a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3L6 7Zm3 4 6 6m0-6-6 6',
  leaf:'M4 20C4 10 11 4 20 4c0 9-6 16-16 16Zm4-4c3-4 6-6 10-8',
  bottle:'M10 2h4v3l2 3v13a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8l2-3V2Zm-2 9h8',
  plus:'M12 5v14M5 12h14',
  minus:'M5 12h14',
  x:'M6 6l12 12M18 6 6 18',
  check:'M4 12.5 9.5 18 20 6.5',
  search:'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm5.5 12.5L21 21',
  cart:'M3 4h2l2.6 11.4A2 2 0 0 0 9.6 17h8.2a2 2 0 0 0 2-1.6L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  bell:'M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6ZM10 20a2 2 0 0 0 4 0',
  clock:'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 4v5l3.5 2',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  users:'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0m2-15a4 4 0 0 1 0 8m5 7a6 6 0 0 0-4-5.6',
  table:'M3 5h18v4H3V5Zm2 4v10m14-10v10M3 12h18',
  chef:'M6 21h12v-6H6v6Zm0-6a4 4 0 0 1-1-7.9A4 4 0 0 1 12 4a4 4 0 0 1 7 3.1A4 4 0 0 1 18 15',
  receipt:'M5 3h14v18l-2.5-1.6L14 21l-2-1.5L10 21l-2.5-1.6L5 21V3Zm3 5h8M8 12h8m-8 4h5',
  card:'M2 7h20v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Zm0 4h20M6 16h4',
  cash:'M2 6h20v12H2V6Zm10 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM5 9v0m14 6v0',
  chart:'M4 20V10m5 10V4m5 16v-7m5 7V8',
  pie:'M12 3a9 9 0 1 0 9 9h-9V3Zm4-1a7 7 0 0 1 6 6h-6V2Z',
  trend:'M3 17l6-6 4 4 8-8m0 0h-5m5 0v5',
  box:'M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 0v10m0 0 9-5m-9 5L3 7',
  settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.4-2.1a8.7 8.7 0 0 0 0-1.8l2-1.5-2-3.4-2.3 1a8.6 8.6 0 0 0-1.6-.9l-.3-2.4h-4l-.3 2.4c-.6.2-1.1.5-1.6.9l-2.3-1-2 3.4 2 1.5a8.7 8.7 0 0 0 0 1.8l-2 1.5 2 3.4 2.3-1c.5.4 1 .7 1.6.9l.3 2.4h4l.3-2.4c.6-.2 1.1-.5 1.6-.9l2.3 1 2-3.4-2-1.5Z',
  qr:'M3 3h7v7H3V3Zm2 2v3h3V5H5Zm9-2h7v7h-7V3Zm2 2v3h3V5h-3ZM3 14h7v7H3v-7Zm2 2v3h3v-3H5Zm9-2h3v3h-3v-3Zm5 0h2v2h-2v-2Zm-5 5h3v2h-3v-2Zm5 0h2v2h-2v-2Z',
  wifi:'M2 8a17 17 0 0 1 20 0M5 12a12 12 0 0 1 14 0M8.5 15.5a7 7 0 0 1 7 0M12 19v.01',
  power:'M12 3v9m-5-6.5a8 8 0 1 0 10 0',
  refresh:'M20 11a8 8 0 1 0-.7 4M20 5v6h-6',
  play:'M7 4l13 8-13 8V4Z',
  pause:'M8 4h3v16H8V4Zm5 0h3v16h-3V4Z',
  fire:'M12 22a7 7 0 0 0 7-7c0-5-4-6-4-11 0 0-3 2-3 6 0-1-1-2-2-3-1 2-5 4-5 8a7 7 0 0 0 7 7Z',
  star:'M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3Z',
  heart:'M12 20s-8-4.9-8-10a4.7 4.7 0 0 1 8-3.2A4.7 4.7 0 0 1 20 10c0 5.1-8 10-8 10Z',
  moon:'M20 14a8.5 8.5 0 0 1-10-10 8.5 8.5 0 1 0 10 10Z',
  sun:'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19',
  arrowL:'M19 12H5m6-7-7 7 7 7',
  arrowR:'M5 12h14m-6-7 7 7-7 7',
  chevD:'M6 9l6 6 6-6',
  chevU:'M6 15l6-6 6 6',
  phone:'M4 4h4l2 5-3 1.5a12 12 0 0 0 6.5 6.5L15 14l5 2v4a1 1 0 0 1-1 1A17 17 0 0 1 3 5a1 1 0 0 1 1-1Z',
  pin:'M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  edit:'M4 20h4l10-10-4-4L4 16v4Zm10-14 4 4',
  trash:'M4 7h16M9 7V4h6v3m-8 0 1 14h8l1-14',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff:'M4 4l16 16M9.9 5.2A9.6 9.6 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.3 4M6.5 7.5A17 17 0 0 0 2 12s4 7 10 7c1.4 0 2.6-.3 3.7-.8',
  lock:'M6 11h12v10H6V11Zm2 0V7a4 4 0 0 1 8 0v4',
  bolt:'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
  alert:'M12 3l10 18H2L12 3Zm0 6v6m0 3v.01',
  info:'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 8v5m0-8v.01',
  print:'M7 8V3h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7v-7Z',
  send:'M4 12 21 4l-8 17-2-7-7-2Z',
  split:'M4 4h6v6M20 20h-6v-6M4 4l7 7m9 9-7-7',
  grid:'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  list:'M8 6h13M8 12h13M8 18h13M3.5 6v.01M3.5 12v.01M3.5 18v.01',
  home:'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9Z',
  logout:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9',
  download:'M12 3v12m0 0 5-5m-5 5-5-5M4 19h16',
  copy:'M8 8h12v12H8V8Zm-4 8V4h12v2',
  volume:'M11 5 6 9H3v6h3l5 4V5Zm4 3a5 5 0 0 1 0 8m3-11a9 9 0 0 1 0 14',
  mute:'M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6',
  sparkle:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 9 .8 2.2L22 15l-2.2.8L19 18l-.8-2.2L16 15l2.2-.8L19 12Z',
  timer:'M12 6a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4v4l3 2M9 2h6',
  filter:'M3 5h18l-7 8v6l-4 2v-8L3 5Z',
  tag:'M3 12V4h8l10 10-8 8L3 12Zm5-5v.01',
  layers:'M12 3 2 8l10 5 10-5-10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5',
  target:'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
  award:'M12 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm-3 9-2 9 5-3 5 3-2-9',
  wallet:'M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0V6a2 2 0 0 1 2-2h11m1 9v.01',
  calendar:'M4 6h16v15H4V6Zm0 5h16M8 3v4m8-4v4',
  door:'M4 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v17M4 21h16M13 12v.01',
  truck:'M2 6h11v10H2V6Zm11 4h4l3 3v3h-7v-6ZM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  gift:'M3 11h18v10H3V11Zm0-4h18v4H3V7Zm9 0v14M8 7a2.5 2.5 0 0 1 0-5c2 0 4 5 4 5m4 0a2.5 2.5 0 0 0 0-5c-2 0-4 5-4 5',
  message:'M4 4h16v12H8l-4 4V4Zm4 5h8M8 12h5',
  shield:'M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3Zm-2.5 9.5L11 13l3.5-3.5',
};

/**
 * أيقونة SVG مضمّنة. المقاس الافتراضي بالـ em يتبع حجم النص المحيط،
 * وأي قاعدة CSS (مثل `.btn svg`) تتجاوزه لأن خصائص العرض أضعف من CSS.
 */
export function icon(name, cls = '') {
  const d = P[name] || P.info;
  return `<svg class="${cls}" width="1.15em" height="1.15em" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
    style="vertical-align:-.2em;flex:none" aria-hidden="true"><path d="${d}"/></svg>`;
}
export const hasIcon = (n) => Object.prototype.hasOwnProperty.call(P, n);

/* ── تخزين محلي آمن ──────────────────────────────────────────────────── */
export const LS = {
  get(key, fallback = null) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  del(key) { try { localStorage.removeItem(key); } catch { /* تجاهل */ } },
};

/* ── قراءة معطيات الرابط ─────────────────────────────────────────────── */
export function params() {
  return Object.fromEntries(new URLSearchParams(location.search));
}

/* ── إحصاء بسيط ──────────────────────────────────────────────────────── */
export const sum = (arr, pick = (x) => x) => arr.reduce((t, x) => t + (pick(x) || 0), 0);
export const groupBy = (arr, key) => arr.reduce((m, x) => {
  const k = typeof key === 'function' ? key(x) : x[key];
  (m[k] ||= []).push(x); return m;
}, {});
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
