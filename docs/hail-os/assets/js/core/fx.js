/* ==========================================================================
   HAIL OS — المؤثرات البصرية
   موجة اللمس، الظهور المتدرّج، عدّادات متحرّكة، انفجار احتفالي، إمالة ثلاثية.
   كل شيء يحترم prefers-reduced-motion.
   ========================================================================== */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. الخلفية الشفقية والحبيبات ────────────────────────────────────── */
export function mountBackdrop() {
  if (document.querySelector('.aurora')) return;
  const a = document.createElement('div');
  a.className = 'aurora'; a.setAttribute('aria-hidden', 'true');
  a.innerHTML = '<i></i>';
  const g = document.createElement('div');
  g.className = 'grain'; g.setAttribute('aria-hidden', 'true');
  document.body.prepend(a, g);
}

/* ── 2. موجة اللمس على كل الأزرار ────────────────────────────────────── */
export function initRipple(root = document) {
  root.addEventListener('pointerdown', (e) => {
    if (reduced()) return;
    const target = e.target.closest('.btn, .card-interactive, [data-ripple]');
    if (!target || target.hasAttribute('disabled')) return;
    const cs = getComputedStyle(target);
    if (cs.position === 'static') target.style.position = 'relative';
    if (cs.overflow !== 'hidden') target.style.overflow = 'hidden';
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    target.append(dot);
    setTimeout(() => dot.remove(), 620);
  }, { passive: true });
}

/* ── 3. الظهور المتدرّج عند التمرير ──────────────────────────────────── */
let io = null;
export function initReveal(root = document) {
  if (reduced()) { root.querySelectorAll('.reveal').forEach((n) => n.classList.add('in')); return; }
  io ||= new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  root.querySelectorAll('.reveal:not(.in)').forEach((n) => io.observe(n));
}
/** يوزّع تأخيراً متتالياً على أبناء عنصر لإحساس الموجة */
export function stagger(container, step = 42, max = 16) {
  Array.from(container.children).forEach((c, i) => {
    c.style.setProperty('--d', `${Math.min(i, max) * step}ms`);
    c.classList.add('reveal');
  });
  initReveal(container);
}

/* ── 4. عدّاد رقمي متحرّك ────────────────────────────────────────────── */
export function countTo(node, to, { from = null, dur = 900, fmt = (v) => Math.round(v).toLocaleString('en-US') } = {}) {
  const start = from ?? Number(node.dataset.val || 0);
  node.dataset.val = to;
  if (reduced() || start === to) { node.textContent = fmt(to); return; }
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = fmt(start + (to - start) * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── 5. انفجار احتفالي (تأكيد الطلب / إقفال الفاتورة) ────────────────── */
const CONFETTI = ['#d4a82b', '#e8c65a', '#d1502f', '#7c8a55', '#d4a82b', '#f6ecdc'];

export function burst(x = innerWidth / 2, y = innerHeight / 3, count = 46) {
  if (reduced()) return;
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9500;overflow:hidden';
  document.body.append(layer);
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    const size = 5 + Math.random() * 7;
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const vel = 130 + Math.random() * 240;
    const dx = Math.cos(angle) * vel;
    const dy = Math.sin(angle) * vel - 90;
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * (Math.random() > .5 ? 1 : 2.2)}px;
      background:${CONFETTI[i % CONFETTI.length]};border-radius:${Math.random() > .6 ? '50%' : '2px'};
      opacity:1;will-change:transform,opacity`;
    layer.append(p);
    p.animate([
      { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate3d(${dx}px,${dy + 340}px,0) rotate(${Math.random() * 900 - 450}deg)`, opacity: 0 },
    ], { duration: 1150 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
  }
  setTimeout(() => layer.remove(), 2100);
}

/** طيران عنصر نحو السلة */
export function flyTo(fromEl, toEl, label = '') {
  if (reduced() || !fromEl || !toEl) return;
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.textContent = label || '+1';
  ghost.style.cssText = `position:fixed;z-index:9400;left:${a.left + a.width / 2 - 18}px;top:${a.top + a.height / 2 - 18}px;
    width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:.8rem;
    background:linear-gradient(135deg,#e2603c,#c0462a);color:#fff;box-shadow:0 8px 24px rgba(192,70,42,.5);pointer-events:none`;
  document.body.append(ghost);
  ghost.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.3)`, opacity: .2 },
  ], { duration: 640, easing: 'cubic-bezier(.5,-0.2,.4,1)', fill: 'forwards' });
  setTimeout(() => { ghost.remove(); pulse(toEl); }, 660);
}

export function pulse(node) {
  if (!node || reduced()) return;
  node.classList.remove('flash');
  void node.offsetWidth;
  node.classList.add('flash');
  setTimeout(() => node.classList.remove('flash'), 1100);
}

export function shake(node) {
  if (!node) return;
  node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
  setTimeout(() => node.classList.remove('shake'), 500);
}

/* ── 6. إمالة ثلاثية الأبعاد على البطاقات المميّزة ───────────────────── */
export function initTilt(root = document, sel = '[data-tilt]') {
  if (reduced() || matchMedia('(pointer: coarse)').matches) return;
  root.querySelectorAll(sel).forEach((card) => {
    if (card.dataset.tiltOn) return;
    card.dataset.tiltOn = '1';
    card.style.transformStyle = 'preserve-3d';
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-3px)`;
      card.style.setProperty('--mx', `${(px + .5) * 100}%`);
      card.style.setProperty('--my', `${(py + .5) * 100}%`);
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* ── 6b. قفل تمرير الخلفية أثناء فتح الطبقات ─────────────────────────── */
/* يمنع تمرير ما خلف الورقة، ويعوّض عرض شريط التمرير حتى لا يقفز المحتوى.
   مهم في RTL تحديداً لأن الشريط يقع في الجهة المقابلة. */
let lockCount = 0;

export function lockScroll() {
  if (lockCount++ > 0) return;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  const root = document.documentElement;
  root.dataset.prevOverflow = root.style.overflow || '';
  root.style.overflow = 'hidden';
  if (gap > 0) root.style.paddingInlineEnd = `${gap}px`;
}

export function unlockScroll() {
  if (--lockCount > 0) return;
  lockCount = 0;
  const root = document.documentElement;
  root.style.overflow = root.dataset.prevOverflow || '';
  root.style.paddingInlineEnd = '';
  delete root.dataset.prevOverflow;
}

/* ── 7. الثيم ────────────────────────────────────────────────────────── */
export function applyTheme(mode) {
  document.documentElement.dataset.theme = mode === 'day' ? 'day' : 'night';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = mode === 'day' ? '#faf3e7' : '#16120d';
}

/* ── 8. ساعة حيّة ────────────────────────────────────────────────────── */
export function liveClock(node) {
  if (!node) return () => {};
  const tick = () => {
    node.textContent = new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };
  tick();
  const t = setInterval(tick, 1000);
  return () => clearInterval(t);
}

/* ── 9. رسم بياني خطي/عمودي مصغّر (SVG خالص) ────────────────────────── */
export function sparkline(values, { w = 260, h = 62, stroke = 'var(--clay-500)', fill = true } = {}) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  const step = w / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => [i * step, h - (v / max) * (h - 8) - 4]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L${w},${h} L0,${h} Z`;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:${h}px;overflow:visible">
    <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${stroke}" stop-opacity=".34"/>
      <stop offset="100%" stop-color="${stroke}" stop-opacity="0"/>
    </linearGradient></defs>
    ${fill ? `<path d="${area}" fill="url(#sg)"/>` : ''}
    <path d="${d}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="3.5" fill="${stroke}"/>
  </svg>`;
}

export function bars(values, labels = [], { h = 150, color = 'var(--clay-500)' } = {}) {
  const max = Math.max(...values, 1);
  return `<div class="row" style="align-items:flex-end;gap:6px;height:${h}px">
    ${values.map((v, i) => `
      <div class="grow center" style="flex-direction:column;justify-content:flex-end;height:100%;gap:6px">
        <span class="t-xs mute num" style="font-size:.62rem">${v ? Math.round(v) : ''}</span>
        <div title="${labels[i] ?? ''}: ${v}" style="width:100%;height:${Math.max(2, (v / max) * (h - 34))}px;
          background:linear-gradient(180deg, ${color}, ${color}55);border-radius:6px 6px 3px 3px;
          transition:height .7s cubic-bezier(.22,.81,.3,1)"></div>
        <span class="t-xs mute" style="font-size:.6rem">${labels[i] ?? ''}</span>
      </div>`).join('')}
  </div>`;
}

export function donut(segments, { size = 132, thickness = 16 } = {}) {
  const total = segments.reduce((t, s) => t + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const rings = segments.map((s) => {
    const len = (s.value / total) * c;
    const el = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}"
      stroke-width="${thickness}" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${size / 2} ${size / 2})" stroke-linecap="butt">
      <title>${s.label}: ${s.value}</title></circle>`;
    offset += len;
    return el;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="${thickness}"/>
    ${rings}</svg>`;
}

/* ── 10. تشغيل كل شيء دفعة واحدة ─────────────────────────────────────── */
export function initFx() {
  mountBackdrop();
  initRipple();
  initReveal();
  initTilt();
}
