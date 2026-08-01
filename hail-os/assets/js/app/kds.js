/* ==========================================================================
   HAIL OS — شاشة المطبخ (KDS)
   تُوجَّه الأصناف تلقائياً لمحطتها، مع مؤقّت لكل طلب وتصعيد لوني عند التأخّر.
   ========================================================================== */

import { icon, esc, LS, sum, minutesSince } from '../core/util.js';
import * as store from '../core/store.js';
import * as fx from '../core/fx.js';
import * as notify from '../core/notify.js';
import { boot, topbar, watchNotifications, watchLateOrders, pinLogin } from '../core/shell.js';
import { STATIONS } from '../data/menu.js';

const STATION_KEY = 'hailos:kds:stations';
let active = LS.get(STATION_KEY, null);     // null = كل المحطات
let layout = LS.get('hailos:kds:layout', 'cols');

boot({ title: 'شاشة المطبخ (KDS) — Restaurant OS' });

/* ── الشريط العلوي ───────────────────────────────────────────────────── */
const fsBtn = document.createElement('button');
fsBtn.className = 'btn btn-icon btn-ghost';
fsBtn.title = 'ملء الشاشة';
fsBtn.innerHTML = icon('grid');
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});

const layoutBtn = document.createElement('button');
layoutBtn.className = 'btn btn-sm btn-ghost nowrap';
const paintLayout = () => {
  layoutBtn.innerHTML = `${icon(layout === 'cols' ? 'grid' : 'list')}<span>${layout === 'cols' ? 'أعمدة' : 'شبكة'}</span>`;
};
layoutBtn.addEventListener('click', () => {
  layout = layout === 'cols' ? 'grid' : 'cols';
  LS.set('hailos:kds:layout', layout);
  paintLayout(); render(); notify.play('tap');
});
paintLayout();

const whoBtn = document.createElement('button');
whoBtn.className = 'btn btn-sm btn-ghost nowrap';
const paintWho = () => {
  const a = store.getActor();
  whoBtn.innerHTML = `${icon('chef')}<span>${a ? esc(a.name) : 'دخول الطاقم'}</span>`;
};
whoBtn.addEventListener('click', async () => {
  if (store.getActor()) { store.clearActor(); paintWho(); notify.toast('تم تسجيل الخروج', { tone: 'info' }); return; }
  const st = await pinLogin({ surface: 'kds', title: 'دخول المطبخ' });
  if (st) { paintWho(); notify.toast(`أهلاً ${st.name}`, { tone: 'ok' }); }
});
paintWho();

document.getElementById('bar').replaceWith(topbar({
  title: 'شاشة المطبخ',
  subtitle: 'توجيه الأصناف حسب المحطة',
  back: 'index.html',
  actions: [whoBtn, layoutBtn, fsBtn],
}));

/* ── شريط المحطات ────────────────────────────────────────────────────── */
function paintStations() {
  const host = document.getElementById('stations');
  const counts = {};
  for (const o of store.get().orders) {
    if (!['pending', 'accepted', 'preparing'].includes(o.status)) continue;
    for (const l of o.lines) {
      if (l.status === 'ready' || l.status === 'served' || l.status === 'cancelled') continue;
      counts[l.station] = (counts[l.station] || 0) + l.qty;
    }
  }
  host.className = 'stationbar';
  host.innerHTML = `<div class="scroll-x catrail" style="padding:0">
    <button data-st="all" aria-selected="${!active}">${icon('layers')}<span>كل المحطات</span>
      ${sum(Object.values(counts)) ? `<span class="badge gold">${sum(Object.values(counts))}</span>` : ''}</button>
    ${Object.values(STATIONS).map((s) => `
      <button data-st="${s.id}" aria-selected="${active?.includes(s.id) || false}">
        <span class="dot" style="background:${s.color}"></span><span>${s.ar}</span>
        ${counts[s.id] ? `<span class="badge">${counts[s.id]}</span>` : ''}
      </button>`).join('')}
  </div>`;
  host.querySelectorAll('[data-st]').forEach((b) => b.addEventListener('click', () => {
    active = b.dataset.st === 'all' ? null : [b.dataset.st];
    LS.set(STATION_KEY, active);
    notify.play('tap');
    paintStations(); render();
  }));
}

/* ── المؤشرات ────────────────────────────────────────────────────────── */
function paintMetrics() {
  const s = store.get();
  const queue = s.orders.filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status));
  const ready = s.orders.filter((o) => o.status === 'ready');
  const late = queue.filter((o) => minutesSince(o.placedAt) >= s.settings.lateAfterMin);
  const rep = store.reportFor();
  const items = sum(queue.flatMap((o) => o.lines.filter((l) => !active || active.includes(l.station))), (l) => l.qty);

  const tiles = [
    { k: 'في الانتظار', v: queue.length, ic: 'clock', cls: '' },
    { k: 'أصناف قيد العمل', v: items, ic: 'flame', cls: '' },
    { k: 'جاهز للتسليم', v: ready.length, ic: 'bell', cls: ready.length ? 'txt-ok' : '' },
    { k: 'متأخّر', v: late.length, ic: 'alert', cls: late.length ? 'txt-bad' : '' },
    { k: 'متوسط التحضير', v: `${rep.avgPrep} د`, ic: 'timer', cls: '' },
    { k: 'أنجزت اليوم', v: rep.orders.length, ic: 'check', cls: 'txt-gold' },
  ];
  document.getElementById('metrics').innerHTML = tiles.map((t) => `
    <div class="glass stat" style="padding:12px 14px">
      <span class="k">${icon(t.ic)} ${t.k}</span>
      <span class="v ${t.cls}" style="font-size:1.4rem">${t.v}</span>
    </div>`).join('');
}

/* ── بطاقة الطلب ─────────────────────────────────────────────────────── */
function kcard(o) {
  const s = store.get().settings;
  const mins = minutesSince(o.placedAt);
  const level = mins >= s.urgentAfterMin ? 'over' : mins >= s.lateAfterMin ? 'late' : '';
  const lines = o.lines.filter((l) => !active || active.includes(l.station));
  const where = o.type === 'dine-in' ? `طاولة ${o.tableNumber}` : o.type === 'takeaway' ? 'سفري' : 'توصيل';
  const done = lines.filter((l) => ['ready', 'served'].includes(l.status)).length;

  return `
    <article class="kcard ${level} ${o.status === 'pending' ? 'urgent' : ''} reveal" data-order="${o.id}">
      <div class="head">
        <span class="code">${o.code}</span>
        <span class="chip ${o.type === 'dine-in' ? 'chip-info' : 'chip-gold'}">${icon(o.type === 'dine-in' ? 'table' : o.type === 'takeaway' ? 'box' : 'truck')} ${where}</span>
        ${o.round > 1 ? `<span class="chip">جولة ${o.round}</span>` : ''}
        <span class="grow"></span>
        <span class="timer ${level === 'over' ? 'txt-bad' : level === 'late' ? 'txt-warn' : 'txt-gold'}">${mins}′</span>
      </div>

      ${o.note ? `<p class="t-sm txt-warn" style="padding:8px 16px 0">${icon('message')} ${esc(o.note)}</p>` : ''}

      <div class="lines">
        ${lines.map((l) => `
          <div class="kline ${['ready', 'served'].includes(l.status) ? 'done' : ''}" data-line="${l.lid}">
            <span class="q">${l.qty}</span>
            <span class="grow">
              <span class="name">${esc(l.ar)}</span>
              ${l.options?.length ? `<span class="opts" style="display:block">${l.options.map((x) => esc(x.ar)).join(' · ')}</span>` : ''}
              ${l.note ? `<span class="opts txt-warn" style="display:block">${icon('message')} ${esc(l.note)}</span>` : ''}
            </span>
            <span class="stn" style="background:${STATIONS[l.station]?.color || '#888'}" title="${STATIONS[l.station]?.ar || ''}"></span>
          </div>`).join('')}
      </div>

      <div class="foot">
        ${o.status === 'pending' ? `
          <button class="btn btn-ok grow" data-act="accepted">${icon('check')} قبول الطلب</button>
          <button class="btn btn-ghost" data-act="cancel" aria-label="رفض">${icon('x')}</button>` :
        o.status === 'accepted' ? `
          <button class="btn btn-gold grow" data-act="preparing">${icon('flame')} بدء التحضير</button>` : `
          <button class="btn btn-ok grow" data-act="ready">${icon('bell')} جاهز ${done ? `(${done}/${lines.length})` : ''}</button>`}
      </div>
    </article>`;
}

/* ── العرض ───────────────────────────────────────────────────────────── */
function render() {
  const app = document.getElementById('app');
  const all = store.get().orders
    .filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status))
    .filter((o) => !active || o.lines.some((l) => active.includes(l.station)))
    .sort((a, b) => a.placedAt - b.placedAt);

  if (!all.length) {
    app.innerHTML = `<div class="empty">
      <div class="ic">${icon('chef')}</div>
      <h3>لا توجد طلبات في المحطة</h3>
      <p class="t-sm">ستظهر الطلبات هنا فور وصولها من الطاولات أو الكاشير.</p>
    </div>`;
    return;
  }

  if (layout === 'grid') {
    app.innerHTML = `<div class="kds-grid">${all.map(kcard).join('')}</div>`;
  } else {
    const cols = [
      { id: 'new',   ar: 'وارد جديد',   ic: 'bell',  list: all.filter((o) => o.status === 'pending') },
      { id: 'cook',  ar: 'قيد التحضير', ic: 'flame', list: all.filter((o) => ['accepted', 'preparing'].includes(o.status)) },
      { id: 'ready', ar: 'جاهز للتسليم', ic: 'check', list: all.filter((o) => o.status === 'ready') },
    ];
    app.innerHTML = `<div class="kds-cols">
      ${cols.map((c) => `
        <section>
          <div class="colhead">
            ${icon(c.ic)}<b>${c.ar}</b>
            <span class="grow"></span>
            <span class="badge ${c.id === 'ready' ? 'gold' : ''}">${c.list.length}</span>
          </div>
          <div class="col" style="gap:var(--s3)">
            ${c.list.length ? c.list.map(kcard).join('')
              : `<div class="dashed center mute t-sm" style="padding:26px">لا شيء هنا</div>`}
          </div>
        </section>`).join('')}
    </div>`;
  }

  /* الأفعال */
  app.querySelectorAll('[data-order]').forEach((cardEl) => {
    const id = cardEl.dataset.order;
    cardEl.querySelectorAll('[data-line]').forEach((lineEl) => lineEl.addEventListener('click', () => {
      const o = store.get().orders.find((x) => x.id === id);
      const l = o?.lines.find((x) => x.lid === lineEl.dataset.line);
      if (!l) return;
      const next = ['ready', 'served'].includes(l.status) ? 'preparing' : 'ready';
      store.setLineStatus(id, l.lid, next, store.getActor()?.name || 'المطبخ');
      notify.play(next === 'ready' ? 'add' : 'tap');
      render();
    }));

    cardEl.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', async () => {
      const act = b.dataset.act;
      if (act === 'cancel') {
        const ok = await notify.confirmBox('رفض الطلب؟', {
          body: 'سيصل الإشعار للزبون والكاشير فوراً.', okText: 'رفض الطلب', tone: 'bad',
        });
        if (!ok) return;
        store.cancelOrder(id, 'رفض من المطبخ', store.getActor()?.name || 'المطبخ');
        notify.play('error');
      } else {
        store.setOrderStatus(id, act, store.getActor()?.name || 'المطبخ');
        if (act === 'ready') {
          notify.play('ready');
          const r = cardEl.getBoundingClientRect();
          fx.burst(r.left + r.width / 2, r.top + 40, 24);
        } else notify.play('tap');
      }
      render();
    }));
  });

  fx.initReveal(app);
  notify.setBadge(all.filter((o) => o.status === 'pending').length);
}

/* ── التحديث والمراقبة ───────────────────────────────────────────────── */
paintStations();
paintMetrics();
render();

watchNotifications('kds', { stations: active, onChange: () => { paintStations(); paintMetrics(); render(); } });
watchLateOrders();
setInterval(() => { paintMetrics(); render(); }, 15000);   // تحديث المؤقّتات
