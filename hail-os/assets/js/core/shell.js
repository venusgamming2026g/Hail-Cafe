/* ==========================================================================
   HAIL OS — القشرة المشتركة بين كل الشاشات
   تهيئة الثيم والمؤثرات، شريط علوي موحّد، ومراقب إشعارات لكل واجهة.
   ========================================================================== */

import { icon, esc } from './util.js';
import * as store from './store.js';
import * as fx from './fx.js';
import * as notify from './notify.js';
import { seed } from '../data/seed.js';

/* ── الإقلاع ─────────────────────────────────────────────────────────── */
export function boot({ title = 'هيل كافيه', autoSeed = true } = {}) {
  const s = store.get();
  fx.applyTheme(s.settings.theme);
  fx.initFx();
  notify.setBaseTitle(title);
  if (autoSeed && !s.seeded) seed();
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';

  /* ظلّ الشريط العلوي عند التمرير */
  const bar = document.querySelector('.topbar');
  if (bar) {
    const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  return store.get();
}

/* ── تبديل الثيم ─────────────────────────────────────────────────────── */
export function toggleTheme() {
  const next = store.get().settings.theme === 'day' ? 'night' : 'day';
  store.updateSettings({ theme: next });
  fx.applyTheme(next);
  return next;
}

export function themeButton() {
  const btn = document.createElement('button');
  const paint = () => {
    const day = store.get().settings.theme === 'day';
    btn.innerHTML = icon(day ? 'moon' : 'sun');
    btn.title = day ? 'الوضع الليلي' : 'الوضع النهاري';
    btn.setAttribute('aria-label', btn.title);
  };
  btn.className = 'btn btn-icon btn-ghost';
  btn.addEventListener('click', () => { toggleTheme(); paint(); notify.play('tap'); });
  paint();
  return btn;
}

export function soundButton() {
  const btn = document.createElement('button');
  const paint = () => {
    const on = store.get().settings.sound;
    btn.innerHTML = icon(on ? 'volume' : 'mute');
    btn.title = on ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية';
    btn.setAttribute('aria-label', btn.title);
    btn.classList.toggle('txt-gold', on);
  };
  btn.className = 'btn btn-icon btn-ghost';
  btn.addEventListener('click', () => {
    const on = !store.get().settings.sound;
    store.updateSettings({ sound: on });
    paint();
    if (on) { notify.unlockAudio(); notify.play('chime'); }
  });
  paint();
  return btn;
}

/* ── شريط علوي جاهز ──────────────────────────────────────────────────── */
export function topbar({ title, subtitle = '', back = null, actions = [], live = true }) {
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `
    ${back ? `<a class="btn btn-icon btn-ghost" href="${back}" aria-label="رجوع">${icon('arrowR')}</a>` : ''}
    <div class="brandmark">
      <span class="seal">هيل</span>
      <span><b>${esc(title)}</b><span>${esc(subtitle)}</span></span>
    </div>
    <div class="grow"></div>
    <div class="row" data-slot></div>`;

  const slot = bar.querySelector('[data-slot]');
  if (live) {
    const pill = document.createElement('span');
    pill.className = 'chip chip-ok nowrap';
    pill.innerHTML = `<i class="dot dot-live"></i><span data-clock class="num"></span>`;
    slot.append(pill);
    fx.liveClock(pill.querySelector('[data-clock]'));
  }
  actions.forEach((a) => slot.append(a));
  slot.append(soundButton(), themeButton());
  return bar;
}

/* ── مراقب الإشعارات ─────────────────────────────────────────────────── */
/**
 * يراقب الحالة ويطلق التنبيه المناسب لكل واجهة.
 * surface: 'kds' | 'floor' | 'cashier' | 'admin' | 'customer'
 */
export function watchNotifications(surface, opts = {}) {
  const seenOrders = new Set(store.get().orders.map((o) => o.id));
  const seenServices = new Set(store.get().services.map((s) => s.id));
  const lastStatus = new Map(store.get().orders.map((o) => [o.id, o.status]));

  const stations = opts.stations || null;
  const relevantOrder = (o) => {
    if (surface === 'kds') return !stations || o.lines.some((l) => stations.includes(l.station));
    if (surface === 'customer') return o.sessionId && o.sessionId === opts.sessionId;
    return true;
  };

  return store.subscribe((s, action) => {
    /* طلبات جديدة */
    for (const o of s.orders) {
      if (seenOrders.has(o.id)) continue;
      seenOrders.add(o.id);
      lastStatus.set(o.id, o.status);
      if (!relevantOrder(o)) continue;

      const where = o.type === 'dine-in' ? `طاولة ${o.tableNumber}`
        : o.type === 'takeaway' ? 'سفري' : 'توصيل';
      if (surface === 'kds' || surface === 'cashier' || surface === 'floor' || surface === 'admin') {
        notify.alertAll(`طلب جديد · ${o.code}`, {
          body: `${where} — ${o.lines.length} صنف`,
          tone: 'gold', sound: 'order', blink: '● طلب جديد', vibrate: [30, 40, 30],
        });
        notify.setBadge(store.activeOrders().length);
      }
    }

    /* تغيّر حالة الطلبات */
    for (const o of s.orders) {
      const prev = lastStatus.get(o.id);
      if (prev === o.status) continue;
      lastStatus.set(o.id, o.status);
      if (!relevantOrder(o)) continue;

      if (o.status === 'ready' && (surface === 'floor' || surface === 'cashier')) {
        notify.alertAll(`جاهز للتقديم · ${o.code}`, {
          body: o.type === 'dine-in' ? `طاولة ${o.tableNumber}` : 'استلام من الكاونتر',
          tone: 'ok', sound: 'ready', vibrate: [25, 30, 25],
        });
      }
      if (surface === 'customer') {
        const label = store.ORDER_STATUS[o.status]?.ar || o.status;
        notify.alertAll(`طلبك ${label}`, {
          body: `رقم الطلب ${o.code}`,
          tone: o.status === 'ready' ? 'ok' : 'info',
          sound: o.status === 'ready' ? 'ready' : 'tap',
          vibrate: o.status === 'ready' ? [40, 50, 40] : null,
        });
      }
      if (o.status === 'cancelled' && surface !== 'customer') {
        notify.toast(`أُلغي الطلب ${o.code}`, { tone: 'bad', sound: 'error' });
      }
    }

    /* نداءات الخدمة */
    for (const sv of s.services) {
      if (seenServices.has(sv.id)) continue;
      seenServices.add(sv.id);
      if (surface !== 'floor' && surface !== 'cashier' && surface !== 'admin') continue;
      const t = store.SERVICE_TYPES[sv.type];
      notify.alertAll(`${t?.ar || 'نداء'} · طاولة ${sv.tableNumber}`, {
        body: t?.priority === 1 ? 'أولوية عالية — طلب فاتورة' : 'نداء من الصالة',
        tone: t?.priority === 1 ? 'bad' : 'warn',
        sound: t?.priority === 1 ? 'urgent' : 'service',
        blink: '● نداء طاولة', vibrate: [45, 60, 45],
      });
    }

    if (opts.onChange) opts.onChange(s, action);
  });
}

/* ── تنبيه الطلبات المتأخرة في المطبخ ────────────────────────────────── */
export function watchLateOrders(intervalMs = 45000) {
  const warned = new Set();
  const tick = () => {
    const s = store.get();
    const limit = s.settings.urgentAfterMin * 60000;
    for (const o of s.orders) {
      if (!['accepted', 'preparing'].includes(o.status)) continue;
      if (warned.has(o.id)) continue;
      if (Date.now() - o.placedAt > limit) {
        warned.add(o.id);
        notify.alertAll(`تأخّر الطلب ${o.code}`, {
          body: `مضى ${Math.round((Date.now() - o.placedAt) / 60000)} دقيقة بلا تسليم`,
          tone: 'bad', sound: 'urgent', blink: '⚠ طلب متأخر',
        });
      }
    }
  };
  const t = setInterval(tick, intervalMs);
  tick();
  return () => clearInterval(t);
}

/* ── تنبيه نداءات الخدمة المتجاوزة للمهلة ────────────────────────────── */
export function watchServiceSla(intervalMs = 30000) {
  const warned = new Set();
  const t = setInterval(() => {
    const s = store.get();
    const limit = s.settings.serviceSlaMin * 60000;
    for (const sv of s.services) {
      if (sv.status === 'done' || warned.has(sv.id)) continue;
      if (Date.now() - sv.createdAt > limit) {
        warned.add(sv.id);
        notify.alertAll(`نداء متأخر · طاولة ${sv.tableNumber}`, {
          body: `${store.SERVICE_TYPES[sv.type]?.ar || 'نداء'} بانتظار الاستجابة`,
          tone: 'bad', sound: 'urgent',
        });
      }
    }
  }, intervalMs);
  return () => clearInterval(t);
}

/* ── حارس الأدوار ────────────────────────────────────────────────────── */
export function requireRole(surface, onDenied) {
  const actor = store.getActor();
  if (actor && store.ROLES[actor.role]?.surfaces.includes(surface)) return actor;
  if (onDenied) onDenied();
  return null;
}

/* ── نافذة تسجيل الدخول بالرقم السري ─────────────────────────────────── */
export function pinLogin({ surface, title = 'تسجيل دخول الطاقم' }) {
  return new Promise((resolve) => {
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    const box = document.createElement('div');
    box.className = 'modal';
    box.innerHTML = `
      <div class="pad-lg" style="text-align:center">
        <div class="center" style="width:56px;height:56px;border-radius:18px;margin:0 auto 14px;
             background:rgba(192,70,42,.16);color:var(--clay-300)">${icon('lock')}</div>
        <h3>${esc(title)}</h3>
        <p class="mute t-sm mb4">أدخل الرقم السري المكوّن من 4 أرقام</p>
        <div class="pindots mb6" data-dots>${'<i></i>'.repeat(4)}</div>
        <div class="pinpad">
          ${[1,2,3,4,5,6,7,8,9].map((n) => `<button data-k="${n}">${n}</button>`).join('')}
          <button data-k="clear" aria-label="مسح">${icon('x')}</button>
          <button data-k="0">0</button>
          <button data-k="back" aria-label="حذف">${icon('arrowR')}</button>
        </div>
        <p class="mute t-xs mt4" data-err style="min-height:18px"></p>
        <div class="row mt4"><button class="btn btn-ghost grow" data-cancel>إلغاء</button></div>
      </div>`;

    let pin = '';
    const dots = box.querySelectorAll('[data-dots] i');
    const err = box.querySelector('[data-err]');
    const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < pin.length));

    let closed = false;
    const close = (val) => {
      if (closed) return;
      closed = true;
      box.classList.add('out'); scrim.style.opacity = '0';
      setTimeout(() => { box.remove(); scrim.remove(); }, 220);
      fx.unlockScroll();
      resolve(val);
    };

    const submit = () => {
      const st = store.staffByPin(pin);
      if (!st) {
        err.textContent = 'رقم سري غير صحيح';
        fx.shake(box.querySelector('.pinpad'));
        notify.play('error');
        pin = ''; paint();
        return;
      }
      if (!store.ROLES[st.role]?.surfaces.includes(surface)) {
        err.textContent = `صلاحية ${store.ROLES[st.role]?.ar || st.role} لا تشمل هذه الشاشة`;
        fx.shake(box.querySelector('.pinpad'));
        notify.play('error');
        pin = ''; paint();
        return;
      }
      store.setActor(st);
      notify.play('success');
      close(st);
    };

    box.querySelector('.pinpad').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const k = b.dataset.k;
      notify.play('tap');
      if (k === 'clear') pin = '';
      else if (k === 'back') pin = pin.slice(0, -1);
      else if (pin.length < 4) pin += k;
      err.textContent = '';
      paint();
      if (pin.length === 4) setTimeout(submit, 160);
    });
    box.querySelector('[data-cancel]').addEventListener('click', () => close(null));
    scrim.addEventListener('click', () => close(null));
    document.addEventListener('keydown', function onKey(e) {
      if (!document.body.contains(box)) { document.removeEventListener('keydown', onKey); return; }
      if (/^\d$/.test(e.key) && pin.length < 4) { pin += e.key; paint(); if (pin.length === 4) setTimeout(submit, 160); }
      if (e.key === 'Backspace') { pin = pin.slice(0, -1); paint(); }
      if (e.key === 'Escape') close(null);
    });

    fx.lockScroll();
    document.body.append(scrim, box);
  });
}

/* ── ورقة منزلقة عامة ────────────────────────────────────────────────── */
export function openSheet(contentHtml, { onMount = null, wide = false } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  if (wide) sheet.style.maxWidth = '760px';
  sheet.innerHTML = `<div class="sheet-grip"></div><div class="scroll-y grow">${contentHtml}</div>`;

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    sheet.classList.add('out'); scrim.style.opacity = '0';
    setTimeout(() => { sheet.remove(); scrim.remove(); }, 300);
    fx.unlockScroll();
  };
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', function onKey(e) {
    if (!document.body.contains(sheet)) { document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'Escape') close();
  });
  fx.lockScroll();
  document.body.append(scrim, sheet);
  if (onMount) onMount(sheet, close);
  return close;
}

export { store, fx, notify };
