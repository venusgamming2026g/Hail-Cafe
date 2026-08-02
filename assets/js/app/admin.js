/* ==========================================================================
   HAIL OS — لوحة الإدارة
   قيادة حيّة · تحليلات · إدارة المنيو · المخزون · الطاقم · التقارير · الإعدادات
   ========================================================================== */

import { icon, esc, moneyPlain, since, clockTime, dateLabel, sum, clean, groupBy, plural } from '../core/util.js';
import * as store from '../core/store.js';
import * as fx from '../core/fx.js';
import * as notify from '../core/notify.js';
import { boot, topbar, openSheet, watchNotifications, pinLogin, staffGate } from '../core/shell.js';
import { categories, STATIONS, MENU_STATS } from '../data/menu.js';
import { startSimulator, stopSimulator, simulatorRunning, seed, seedClean } from '../data/seed.js';

let tab = 'dash';
let menuFilter = '';
let menuCat = 'all';

await boot({ title: 'الإدارة — هيل كافيه' });
await staffGate({ surface: 'admin', title: 'دخول الإدارة' });

/* ── الشريط العلوي ───────────────────────────────────────────────────── */
const whoBtn = document.createElement('button');
whoBtn.className = 'btn btn-sm btn-ghost nowrap';
const paintWho = () => {
  const a = store.getActor();
  whoBtn.innerHTML = `${icon('shield')}<span>${a ? esc(a.name) : 'دخول المدير'}</span>`;
};
whoBtn.addEventListener('click', async () => {
  if (store.getActor()) { store.clearActor(); location.reload(); return; }
  const st = await pinLogin({ surface: 'admin', title: 'دخول الإدارة' });
  if (st) { paintWho(); notify.toast(`أهلاً ${st.name}`, { tone: 'ok' }); render(); }
});
paintWho();

document.getElementById('bar').replaceWith(topbar({
  title: 'لوحة الإدارة',
  subtitle: 'هيل كافيه — إربد سيتي سنتر',
  back: 'index.html',
  actions: [whoBtn],
}));

const actor = () => store.getActor()?.name || 'المدير';

/* ── التبويبات ───────────────────────────────────────────────────────── */
const TABS = [
  { id: 'dash',    ar: 'لوحة القيادة', ic: 'chart' },
  { id: 'live',    ar: 'التشغيل الحيّ', ic: 'bolt' },
  { id: 'menu',    ar: 'المنيو',       ic: 'list' },
  { id: 'stock',   ar: 'المخزون',      ic: 'box' },
  { id: 'staff',   ar: 'الطاقم',       ic: 'users' },
  { id: 'reports', ar: 'التقارير',     ic: 'pie' },
  { id: 'settings',ar: 'الإعدادات',    ic: 'settings' },
];

function paintTabs() {
  const host = document.getElementById('tabs');
  host.innerHTML = TABS.map((t) => `
    <button data-tab="${t.id}" aria-selected="${tab === t.id}">${icon(t.ic)}<span>${t.ar}</span></button>`).join('');
  host.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => { tab = b.dataset.tab; notify.play('tap'); window.scrollTo(0, 0); render(true); }));
}

/* ── العرض ───────────────────────────────────────────────────────────── */
/* animate: حركة الظهور والعدّادات عند تبديل التبويب فقط. التحديث الدوري يرسم
   القيم النهائية فوراً — العدّ من الصفر كل نصف دقيقة كان يوحي بتغيّر الأرقام. */
function render(animate = false) {
  const scrollY = window.scrollY;
  paintTabs();
  const app = document.getElementById('app');
  app.innerHTML = views[tab]();
  wire[tab]?.();
  if (animate) fx.initReveal(app); else fx.settleReveal(app);
  const fmtFor = (n) => (v) => n.dataset.money ? moneyPlain(v) : Math.round(v).toLocaleString('en-US');
  document.querySelectorAll('[data-count]').forEach((n) => {
    const to = Number(n.dataset.count);
    if (animate) fx.countTo(n, to, { fmt: fmtFor(n) });
    else { n.dataset.val = to; n.textContent = fmtFor(n)(to); }
  });
  if (!animate) window.scrollTo({ top: scrollY, behavior: 'instant' });
}

/* تحديث خلفي: يُؤجَّل أثناء الكتابة في حقل حتى لا يفقد المدير تركيزه ونصّه. */
function refresh() {
  if (document.hidden) return;
  const el = document.activeElement;
  if (el && document.getElementById('app').contains(el) && el.matches('input, textarea, select')) return;
  render();
}

/* ── أدوات عرض ───────────────────────────────────────────────────────── */
function kpi(k, value, ic, { delta = null, hint = '', gold = false, isMoney = false } = {}) {
  const arrow = delta === null ? '' :
    `<span class="delta ${delta >= 0 ? 'txt-ok' : 'txt-bad'}">
      ${icon('trend')}${delta >= 0 ? '+' : ''}${delta}%</span>`;
  /* العدّاد المتحرّك للأرقام فقط — القيم النصية تُعرض كما هي */
  const body = typeof value === 'number'
    ? `<span data-count="${value}" ${isMoney ? 'data-money="1"' : ''}>${isMoney ? moneyPlain(value) : value}</span>`
    : `<span>${esc(value)}</span>`;
  return `
    <div class="glass stat reveal ${gold ? 'gold' : ''}">
      <span class="k">${icon(ic)} ${k}</span>
      <span class="v">${body}${isMoney ? ' <small style="font-size:.6em">د.أ</small>' : ''}</span>
      <span class="d">${arrow} ${esc(hint)}</span>
    </div>`;
}

const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : (a ? 100 : 0));

/* ── الشاشات ─────────────────────────────────────────────────────────── */
const views = {

  /* ①  لوحة القيادة */
  dash() {
    const today = store.reportFor();
    /* المقارنة العادلة: أمس حتى نفس هذه الساعة، لا اليوم كاملاً */
    const yest = store.reportFor(store.startOfToday() - 86400e3, Date.now() - 86400e3);
    const s = store.get();
    const openBills = s.sessions.filter((x) => x.status === 'open');
    const dueNow = sum(openBills, (ses) => store.sessionBill(ses.id).due);
    const low = store.lowStock();

    const hours = today.byHour.slice(9, 24);
    const hourLabels = hours.map((h) => String(h.h));
    const catColors = ['#d4a82b', '#d1502f', '#7c8a55', '#d4a82b', '#a8546e', '#c9a47c', '#7b6091', '#7a6247'];
    const donutData = today.byCat.slice(0, 7).map((c, i) => ({
      label: categories.find((x) => x.id === c.cat)?.ar || c.cat,
      value: c.revenue, color: catColors[i % catColors.length],
    }));

    return `
      <div class="between mb4">
        <div><p class="eyebrow">${dateLabel()}</p><h2>نبض المطعم الآن</h2></div>
        <span class="chip chip-ok"><i class="dot dot-live"></i>بيانات حيّة</span>
      </div>

      <div class="kpi-grid mb6">
        ${kpi('مبيعات اليوم', today.revenue, 'wallet', { delta: pct(today.revenue, yest.revenue), hint: 'مقابل أمس بنفس التوقيت', gold: true, isMoney: true })}
        ${kpi('عدد الفواتير', today.orders.length, 'receipt', { delta: pct(today.orders.length, yest.orders.length), hint: 'مقابل أمس بنفس التوقيت' })}
        ${kpi('متوسط الفاتورة', today.avgTicket, 'trend', { delta: pct(today.avgTicket, yest.avgTicket), hint: 'لكل طلب', isMoney: true })}
        ${kpi('الضيوف اليوم', today.covers, 'users', { hint: `${plural(openBills.length, 'طاولة مفتوحة', 'طاولتان مفتوحتان', 'طاولات مفتوحة')} الآن` })}
        ${kpi('مستحق على الطاولات', dueNow, 'cash', { hint: 'غير محصّل بعد', isMoney: true })}
        ${kpi('متوسط زمن التحضير', `${today.avgPrep} د`, 'timer', { hint: `الخدمة ${today.avgService} د` })}
      </div>

      <div class="grid" style="grid-template-columns:1.6fr 1fr;gap:var(--s5)">
        <div class="glass pad reveal">
          <div class="between mb4">
            <b>${icon('chart')} المبيعات على مدار اليوم</b>
            <span class="chip chip-gold num">${moneyPlain(today.revenue)} د.أ</span>
          </div>
          ${fx.bars(hours.map((h) => h.revenue / 1000), hourLabels, { h: 170 })}
          <div class="divider"></div>
          <div class="row wrap-x" style="gap:var(--s6)">
            <span class="t-sm"><span class="mute">ذروة اليوم:</span>
              <b class="num"> الساعة ${today.byHour.indexOf(today.byHour.reduce((a, b) => (b.revenue > a.revenue ? b : a)))}:00</b></span>
            <span class="t-sm"><span class="mute">الأصناف المباعة:</span> <b class="num">${today.qty}</b></span>
            <span class="t-sm"><span class="mute">ملغاة:</span> <b class="num ${today.cancelled.length ? 'txt-bad' : ''}">${today.cancelled.length}</b></span>
          </div>
        </div>

        <div class="glass pad reveal">
          <b class="mb4" style="display:block">${icon('pie')} التوزيع حسب القسم</b>
          <div class="center mb4">${fx.donut(donutData, { size: 148, thickness: 18 })}</div>
          <div class="col" style="gap:7px">
            ${donutData.map((d) => `
              <div class="between t-sm">
                <span class="row" style="gap:7px"><i class="dot" style="background:${d.color}"></i>${esc(d.label)}</span>
                <span class="num mute">${moneyPlain(d.value)}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="grid g2 mt6">
        <div class="glass reveal">
          <div class="between pad" style="padding-bottom:10px"><b>${icon('award')} الأكثر مبيعاً اليوم</b>
            <span class="chip">${today.top.length} صنف</span></div>
          ${today.top.slice(0, 8).map((t, i) => {
            const max = today.top[0]?.qty || 1;
            return `
              <div class="pad" style="padding:8px 16px">
                <div class="between t-sm mb2">
                  <span><b class="txt-gold num">${i + 1}.</b> ${esc(t.ar)}</span>
                  <span class="num mute">${t.qty} · ${moneyPlain(t.revenue)}</span>
                </div>
                <div class="rail" style="height:5px"><i style="width:${(t.qty / max) * 100}%"></i></div>
              </div>`;
          }).join('') || '<p class="mute t-sm pad">لا مبيعات بعد اليوم.</p>'}
        </div>

        <div class="col" style="gap:var(--s4)">
          <div class="glass pad reveal">
            <b class="mb4" style="display:block">${icon('layers')} توزيع الطلبات</b>
            ${Object.entries({ 'dine-in': 'داخل الصالة', takeaway: 'سفري', delivery: 'توصيل' }).map(([k, ar]) => {
              const v = today.byType[k] || 0;
              const p = today.orders.length ? Math.round((v / today.orders.length) * 100) : 0;
              return `<div class="mb4">
                <div class="between t-sm mb2"><span>${ar}</span><span class="num">${v} · ${p}%</span></div>
                <div class="rail"><i style="width:${p}%"></i></div></div>`;
            }).join('')}
          </div>

          ${low.length ? `
            <div class="glass pad reveal" style="border-color:rgba(222,148,48,.4)">
              <div class="between mb2"><b class="txt-warn">${icon('alert')} تنبيه مخزون</b>
                <span class="badge">${low.length}</span></div>
              <p class="mute t-xs mb4">أصناف بلغت أو تجاوزت حدّ إعادة الطلب.</p>
              ${low.map((i) => `<div class="between t-sm" style="padding:4px 0">
                <span>${esc(i.name)}</span>
                <span class="num txt-warn">${i.qty} ${i.unit} / الحد ${i.min}</span></div>`).join('')}
              <button class="btn btn-ghost btn-sm btn-block mt4" data-goto="stock">${icon('box')} إدارة المخزون</button>
            </div>` : `
            <div class="glass pad reveal">
              <b class="txt-ok">${icon('check')} المخزون سليم</b>
              <p class="mute t-xs mt2">لا توجد أصناف تحت حدّ إعادة الطلب.</p>
            </div>`}
        </div>
      </div>`;
  },

  /* ②  التشغيل الحيّ */
  live() {
    const s = store.get();
    const live = s.orders.filter((o) => !['served', 'cancelled'].includes(o.status));
    const calls = s.services.filter((x) => x.status !== 'done');
    const byStation = {};
    for (const o of live) for (const l of o.lines) {
      if (['ready', 'served'].includes(l.status)) continue;
      byStation[l.station] = (byStation[l.station] || 0) + l.qty;
    }

    return `
      <div class="grid g4 mb6">
        ${kpi('طلبات جارية', live.length, 'clock')}
        ${kpi('نداءات مفتوحة', calls.length, 'bell')}
        ${kpi('طاولات مشغولة', s.tables.filter((t) => t.status === 'seated').length, 'table')}
        ${kpi('جاهز للتقديم', live.filter((o) => o.status === 'ready').length, 'check')}
      </div>

      <div class="grid g2">
        <div class="glass pad reveal">
          <b class="mb4" style="display:block">${icon('flame')} حِمل المحطات</b>
          ${Object.values(STATIONS).map((st) => {
            const v = byStation[st.id] || 0;
            const max = Math.max(...Object.values(byStation), 1);
            return `<div class="mb4">
              <div class="between t-sm mb2">
                <span class="row" style="gap:7px"><i class="dot" style="background:${st.color}"></i>${st.ar}</span>
                <span class="num ${v ? '' : 'mute'}">${v} صنف</span>
              </div>
              <div class="rail"><i style="width:${(v / max) * 100}%;background:linear-gradient(90deg,${st.color},${st.color}77)"></i></div>
            </div>`;
          }).join('')}
        </div>

        <div class="glass reveal">
          <div class="pad" style="padding-bottom:10px"><b>${icon('list')} سجلّ الأحداث</b></div>
          <div class="scroll-y" style="max-height:420px">
            ${s.events.slice(0, 40).map((e) => `
              <div class="lrow" style="padding:9px 16px">
                <span class="av" style="width:30px;height:30px">${icon(eventIcon(e.action))}</span>
                <span class="grow">
                  <b class="t-sm">${esc(e.text || e.action)}</b>
                  <span class="mute t-xs" style="display:block">${esc(e.actor)} · ${clockTime(e.at)}</span>
                </span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="glass mt6 reveal">
        <div class="pad" style="padding-bottom:10px"><b>${icon('receipt')} الطلبات الجارية</b></div>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>الرقم</th><th>النوع</th><th>الأصناف</th><th>الحالة</th><th>منذ</th><th>الإجمالي</th></tr></thead>
            <tbody>
              ${live.map((o) => `
                <tr>
                  <td class="num">${o.code}</td>
                  <td>${o.type === 'dine-in' ? `طاولة ${o.tableNumber}` : o.type === 'takeaway' ? 'سفري' : 'توصيل'}</td>
                  <td class="mute">${o.lines.map((l) => `${esc(l.ar)}×${l.qty}`).join('، ')}</td>
                  <td><span class="chip chip-${store.ORDER_STATUS[o.status]?.color}">${store.ORDER_STATUS[o.status]?.ar}</span></td>
                  <td class="num mute">${since(o.placedAt)}</td>
                  <td class="num txt-gold">${moneyPlain(o.total)}</td>
                </tr>`).join('') || '<tr><td colspan="6" class="mute" style="text-align:center;padding:24px">لا طلبات جارية</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ③  المنيو */
  menu() {
    const all = store.menu();
    const list = all.filter((it) => {
      if (menuCat !== 'all' && it.categoryId !== menuCat) return false;
      if (!menuFilter) return true;
      return it.ar.includes(menuFilter) || (it.en || '').toLowerCase().includes(menuFilter.toLowerCase());
    });
    const off = all.filter((i) => !i.available).length;

    return `
      <div class="grid g4 mb6">
        ${kpi('إجمالي الأصناف', MENU_STATS.items, 'list')}
        ${kpi('الأقسام', MENU_STATS.categories, 'layers')}
        ${kpi('أصناف مميّزة', all.filter((i) => i.featured).length, 'star')}
        ${kpi('غير متوفرة', off, 'eyeOff', { hint: off ? 'مخفية عن الزبون' : 'كل الأصناف متاحة' })}
      </div>

      <div class="row wrap-x mb4" style="gap:10px">
        <input class="field grow" id="mf" placeholder="ابحث عن صنف…" value="${esc(menuFilter)}" style="max-width:320px">
        <select class="field" id="mc" style="max-width:220px">
          <option value="all">كل الأقسام</option>
          ${categories.map((c) => `<option value="${c.id}" ${menuCat === c.id ? 'selected' : ''}>${c.ar}</option>`).join('')}
        </select>
        <span class="chip">${list.length} نتيجة</span>
      </div>

      <div class="glass reveal">
        <div class="mrow" style="border-bottom:1px solid var(--hairline-2)">
          <b class="t-xs mute">الصنف</b><b class="t-xs mute">السعر</b><b class="t-xs mute">مميّز</b><b class="t-xs mute">متاح</b>
        </div>
        <div class="scroll-y" style="max-height:64vh">
          ${list.map((it) => `
            <div class="mrow" data-mi="${it.id}">
              <div class="row" style="gap:10px;min-width:0">
                <img src="${it.image}" alt="" style="width:38px;height:38px;border-radius:10px;object-fit:cover;flex:none">
                <span class="grow" style="min-width:0">
                  <b class="t-sm trunc" style="display:block">${esc(it.ar)}</b>
                  <span class="mute t-xs">${categories.find((c) => c.id === it.categoryId)?.ar} · ${STATIONS[it.station]?.ar}</span>
                </span>
              </div>
              <button class="btn btn-sm btn-ghost num nowrap" data-price="${it.id}">${moneyPlain(it.price)}</button>
              <span class="switch" role="switch" aria-checked="${it.featured}" data-feat="${it.id}" tabindex="0"></span>
              <span class="switch" role="switch" aria-checked="${it.available}" data-avail="${it.id}" tabindex="0"></span>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ④  المخزون */
  stock() {
    const inv = store.get().inventory;
    const low = store.lowStock();
    const value = sum(inv, (i) => i.qty * i.cost);

    return `
      <div class="grid g4 mb6">
        ${kpi('أصناف المخزون', inv.length, 'box')}
        ${kpi('تحت الحد', low.length, 'alert', { hint: low.length ? 'تحتاج إعادة طلب' : 'الوضع سليم' })}
        ${kpi('قيمة المخزون', Math.round(value), 'wallet', { isMoney: true, gold: true })}
        ${kpi('نفاد متوقّع', inv.filter((i) => i.qty <= i.min * 0.5).length, 'timer', { hint: 'خلال يوم أو أقل' })}
      </div>

      <div class="glass reveal">
        <div class="between pad" style="padding-bottom:10px">
          <b>${icon('box')} حركة المخزون</b>
          <button class="btn btn-sm btn-gold" data-add-inv>${icon('plus')} صنف جديد</button>
        </div>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>الصنف</th><th>الكمية</th><th>حد الطلب</th><th>الحالة</th><th>التكلفة</th><th></th></tr></thead>
            <tbody>
              ${inv.map((i) => {
                const ratio = i.min ? i.qty / i.min : 2;
                const state = ratio <= 0.5 ? ['bad', 'حرج'] : ratio <= 1 ? ['warn', 'منخفض'] : ['ok', 'جيد'];
                return `
                  <tr>
                    <td><b>${esc(i.name)}</b>${i.links?.length ? `<span class="mute t-xs" style="display:block">مرتبط بـ ${i.links.length} صنف</span>` : ''}</td>
                    <td class="num">${i.qty} ${i.unit}</td>
                    <td class="num mute">${i.min} ${i.unit}</td>
                    <td><span class="chip chip-${state[0]}">${state[1]}</span></td>
                    <td class="num mute">${moneyPlain(i.cost)}</td>
                    <td><button class="btn btn-sm btn-ghost" data-restock="${i.id}">${icon('plus')} توريد</button></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ⑤  الطاقم */
  staff() {
    const s = store.get();
    const byRole = groupBy(s.staff, 'role');
    const rep = store.reportFor();
    const served = {};
    rep.orders.forEach((o) => {
      const last = o.timeline?.find((t) => t.status === 'served');
      if (last) served[last.by] = (served[last.by] || 0) + 1;
    });

    return `
      <div class="grid g4 mb6">
        ${kpi('عدد الطاقم', s.staff.length, 'users')}
        ${kpi('على رأس العمل', s.staff.filter((x) => x.active).length, 'check')}
        ${kpi('نُدُل', (byRole.waiter || []).length, 'user')}
        ${kpi('مطبخ وبار', (byRole.chef || []).length + (byRole.barista || []).length, 'chef')}
      </div>

      <div class="between mb4">
        <h3>${icon('users')} فريق العمل</h3>
        <button class="btn btn-sm btn-gold" data-add-staff>${icon('plus')} إضافة موظف</button>
      </div>

      <div class="grid auto-320">
        ${s.staff.map((p) => `
          <div class="card pad reveal">
            <div class="row mb4">
              <span class="av" style="width:46px;height:46px;border-radius:14px;background:var(--grad-clay);color:#fff;font-size:1rem">
                ${esc(p.name.slice(0, 1))}</span>
              <span class="grow">
                <b>${esc(p.name)}</b>
                <span class="mute t-xs" style="display:block">${store.ROLES[p.role]?.ar || p.role}</span>
              </span>
              <span class="chip chip-${p.active ? 'ok' : 'bad'}">${p.active ? 'نشط' : 'موقوف'}</span>
            </div>
            <div class="between t-sm mb2"><span class="mute">الهاتف</span><span class="num" dir="ltr">${esc(p.phone || '—')}</span></div>
            <div class="between t-sm mb2"><span class="mute">الرقم السري</span><span class="num">••••</span></div>
            <div class="between t-sm mb4"><span class="mute">طلبات قُدِّمت اليوم</span><b class="num txt-gold">${served[p.name] || 0}</b></div>
            <div class="row" style="gap:8px">
              <button class="btn btn-sm btn-ghost grow" data-edit-staff="${p.id}">${icon('edit')} تعديل</button>
              <button class="btn btn-sm btn-ghost" data-toggle-staff="${p.id}">${icon(p.active ? 'lock' : 'check')}</button>
            </div>
          </div>`).join('')}
      </div>`;
  },

  /* ⑥  التقارير */
  reports() {
    const today = store.reportFor();
    const yest = store.reportFor(store.startOfToday() - 86400e3, Date.now() - 86400e3);
    const yestFull = store.reportFor(store.startOfToday() - 86400e3, store.startOfToday());

    return `
      <div class="between mb4">
        <div><p class="eyebrow">تقرير</p><h2>الأداء التفصيلي</h2></div>
        <div class="row" style="gap:8px">
          <button class="btn btn-sm btn-ghost" data-csv="items">${icon('download')} تصدير الأصناف</button>
          <button class="btn btn-sm btn-ghost" data-csv="orders">${icon('download')} تصدير الطلبات</button>
        </div>
      </div>

      <div class="glass pad mb6 reveal">
        <div class="between mb4">
          <b>${icon('trend')} اليوم مقابل أمس</b>
          <span class="chip">المقارنة حتى ${clockTime()} من كلا اليومين</span>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>المؤشر</th><th>أمس (نفس التوقيت)</th><th>اليوم</th><th>الفرق</th><th>أمس كاملاً</th></tr></thead>
          <tbody>
            ${[
              ['المبيعات', yest.revenue, today.revenue, yestFull.revenue, true],
              ['عدد الطلبات', yest.orders.length, today.orders.length, yestFull.orders.length, false],
              ['متوسط الفاتورة', yest.avgTicket, today.avgTicket, yestFull.avgTicket, true],
              ['الأصناف المباعة', yest.qty, today.qty, yestFull.qty, false],
              ['الضيوف', yest.covers, today.covers, yestFull.covers, false],
              ['زمن التحضير (د)', yest.avgPrep, today.avgPrep, yestFull.avgPrep, false],
            ].map(([k, a, b, full, isM]) => {
              const d = pct(b, a);
              return `<tr>
                <td>${k}</td>
                <td class="num mute">${isM ? moneyPlain(a) : a}</td>
                <td class="num"><b>${isM ? moneyPlain(b) : b}</b></td>
                <td class="num ${d >= 0 ? 'txt-ok' : 'txt-bad'}">${d >= 0 ? '+' : ''}${d}%</td>
                <td class="num mute">${isM ? moneyPlain(full) : full}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>

      <div class="grid g2">
        <div class="glass reveal">
          <div class="pad" style="padding-bottom:6px"><b>${icon('award')} ترتيب الأصناف اليوم</b></div>
          <div class="tbl-wrap scroll-y" style="max-height:440px">
            <table class="tbl">
              <thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>الإيراد</th></tr></thead>
              <tbody>${today.top.slice(0, 25).map((t, i) => `
                <tr><td class="num mute">${i + 1}</td><td>${esc(t.ar)}</td>
                <td class="num">${t.qty}</td><td class="num txt-gold">${moneyPlain(t.revenue)}</td></tr>`).join('')
                || '<tr><td colspan="4" class="mute" style="text-align:center;padding:20px">لا بيانات</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div class="glass reveal">
          <div class="pad" style="padding-bottom:6px"><b>${icon('layers')} أداء الأقسام</b></div>
          <div class="tbl-wrap scroll-y" style="max-height:440px">
            <table class="tbl">
              <thead><tr><th>القسم</th><th>الكمية</th><th>الإيراد</th><th>الحصة</th></tr></thead>
              <tbody>${today.byCat.map((c) => `
                <tr>
                  <td>${esc(categories.find((x) => x.id === c.cat)?.ar || c.cat)}</td>
                  <td class="num">${c.qty}</td>
                  <td class="num txt-gold">${moneyPlain(c.revenue)}</td>
                  <td class="num mute">${today.revenue ? Math.round((c.revenue / today.revenue) * 100) : 0}%</td>
                </tr>`).join('') || '<tr><td colspan="4" class="mute" style="text-align:center;padding:20px">لا بيانات</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="glass mt6 reveal">
        <div class="pad" style="padding-bottom:6px"><b>${icon('x')} الطلبات الملغاة اليوم (${today.cancelled.length})</b></div>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>الرقم</th><th>الوقت</th><th>القيمة</th><th>السبب</th></tr></thead>
            <tbody>${today.cancelled.map((o) => `
              <tr><td class="num">${o.code}</td><td class="num mute">${clockTime(o.placedAt)}</td>
              <td class="num">${moneyPlain(o.total)}</td><td class="mute">${esc(o.cancelReason || '—')}</td></tr>`).join('')
              || '<tr><td colspan="4" class="mute" style="text-align:center;padding:20px">لا إلغاءات — ممتاز</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ⑦  الإعدادات */
  settings() {
    const s = store.get().settings;
    const sim = simulatorRunning();
    return `
      <div class="grid g2">
        <div class="glass pad reveal">
          <b class="mb4" style="display:block">${icon('wallet')} الأسعار والضرائب</b>
          <div class="col" style="gap:14px">
            <div><label class="label">نسبة ضريبة المبيعات (%)</label>
              <input class="field num" data-set="taxRate" data-mul="100" value="${(s.taxRate * 100).toFixed(1)}"></div>
            <div><label class="label">نسبة الخدمة على الصالة (%)</label>
              <input class="field num" data-set="serviceRate" data-mul="100" value="${(s.serviceRate * 100).toFixed(1)}"></div>
            <div><label class="label">رسوم التوصيل (د.أ)</label>
              <input class="field num" data-set="deliveryFee" data-mul="0.001" value="${moneyPlain(s.deliveryFee)}"></div>
            ${toggle('serviceEnabled', 'احتساب الخدمة تلقائياً', s.serviceEnabled)}
            ${toggle('allowTakeaway', 'السماح بالطلب السفري', s.allowTakeaway)}
            ${toggle('allowDelivery', 'السماح بالتوصيل', s.allowDelivery)}
          </div>
        </div>

        <div class="glass pad reveal">
          <b class="mb4" style="display:block">${icon('bell')} التنبيهات والتشغيل</b>
          <div class="col" style="gap:14px">
            ${toggle('sound', 'التنبيهات الصوتية', s.sound)}
            ${toggle('desktopNotify', 'إشعارات نظام التشغيل', s.desktopNotify)}
            ${toggle('autoAccept', 'قبول الطلبات تلقائياً (بلا مراجعة كاشير)', s.autoAccept)}
            <div><label class="label">مستوى الصوت</label>
              <input class="field" type="range" min="0" max="1" step="0.1" data-set="soundVolume" value="${s.soundVolume}"></div>
            <div><label class="label">يُعتبر الطلب متأخراً بعد (دقيقة)</label>
              <input class="field num" data-set="lateAfterMin" value="${s.lateAfterMin}"></div>
            <div><label class="label">تنبيه عاجل بعد (دقيقة)</label>
              <input class="field num" data-set="urgentAfterMin" value="${s.urgentAfterMin}"></div>
            <div><label class="label">مهلة الاستجابة لنداء الطاولة (دقيقة)</label>
              <input class="field num" data-set="serviceSlaMin" value="${s.serviceSlaMin}"></div>
          </div>
        </div>
      </div>

      <div class="glass pad mt6 reveal">
        <b class="mb4" style="display:block">${icon('play')} وضع العرض التجريبي</b>
        <p class="mute t-sm mb4">
          يولّد المحاكي حركة حيّة: طلبات جديدة، نداءات طاولات، وتقدّم المطبخ — لعرض النظام أمام العملاء.
        </p>
        <div class="row wrap-x" style="gap:10px">
          <button class="btn ${sim ? 'btn-bad' : 'btn-gold'}" id="simbtn">
            ${icon(sim ? 'pause' : 'play')} ${sim ? 'إيقاف المحاكي' : 'تشغيل المحاكي'}</button>
          <button class="btn btn-ghost" id="reseed">${icon('refresh')} إعادة توليد بيانات الديمو</button>
          <button class="btn btn-ghost" id="export">${icon('download')} تصدير نسخة احتياطية</button>
          <label class="btn btn-ghost" style="cursor:pointer">
            ${icon('copy')} استيراد نسخة
            <input type="file" id="import" accept="application/json" hidden>
          </label>
          <button class="btn btn-ghost txt-bad" id="wipe">${icon('trash')} تهيئة للتشغيل الفعلي</button>
        </div>
      </div>

      <div class="glass pad mt6 reveal">
        <b class="mb4" style="display:block">${icon('info')} عن النظام</b>
        <div class="grid g3 t-sm">
          <div><span class="mute">المنيو</span><b style="display:block">${MENU_STATS.items} صنف · ${MENU_STATS.categories} قسم</b></div>
          <div><span class="mute">الطاولات</span><b style="display:block">${store.get().tables.length} طاولة</b></div>
          <div><span class="mute">سجلّ الأحداث</span><b style="display:block">${store.get().events.length} حدث</b></div>
          <div><span class="mute">إصدار الحالة</span><b style="display:block num">v${store.get().version}</b></div>
          <div><span class="mute">التخزين</span><b style="display:block">محلي — بلا خادم</b></div>
          <div><span class="mute">المزامنة</span><b style="display:block">لحظية بين كل الشاشات</b></div>
        </div>
      </div>`;
  },
};

function toggle(key, label, on) {
  return `<div class="between">
    <span class="t-sm">${esc(label)}</span>
    <span class="switch" role="switch" aria-checked="${on}" data-toggle="${key}" tabindex="0"></span>
  </div>`;
}

function eventIcon(action = '') {
  if (action.startsWith('order')) return 'receipt';
  if (action.startsWith('service')) return 'bell';
  if (action.startsWith('payment')) return 'cash';
  if (action.startsWith('session')) return 'door';
  if (action.startsWith('menu')) return 'list';
  if (action.startsWith('inventory')) return 'box';
  if (action.startsWith('staff')) return 'user';
  if (action.startsWith('table')) return 'table';
  return 'bolt';
}

/* ── الربط ───────────────────────────────────────────────────────────── */
const wire = {
  dash() {
    document.querySelector('[data-goto="stock"]')?.addEventListener('click', () => { tab = 'stock'; render(); });
  },

  menu() {
    const app = document.getElementById('app');
    app.querySelector('#mf')?.addEventListener('input', (e) => {
      menuFilter = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const again = document.querySelector('#mf');
      if (again) { again.focus(); again.setSelectionRange(pos, pos); }
    });
    app.querySelector('#mc')?.addEventListener('change', (e) => { menuCat = e.target.value; render(); });

    app.querySelectorAll('[data-feat]').forEach((el) => el.addEventListener('click', () => {
      const id = el.dataset.feat;
      const on = el.getAttribute('aria-checked') !== 'true';
      store.setMenuOverride(id, { featured: on }, actor());
      el.setAttribute('aria-checked', String(on));
      notify.play('tap');
    }));
    app.querySelectorAll('[data-avail]').forEach((el) => el.addEventListener('click', () => {
      const id = el.dataset.avail;
      const on = el.getAttribute('aria-checked') !== 'true';
      store.setMenuOverride(id, { available: on }, actor());
      el.setAttribute('aria-checked', String(on));
      notify.play(on ? 'add' : 'remove');
      notify.toast(on ? 'أصبح الصنف متاحاً' : 'أُخفي الصنف عن الزبائن', { tone: on ? 'ok' : 'warn' });
    }));
    app.querySelectorAll('[data-price]').forEach((b) => b.addEventListener('click', () => {
      const it = store.menuItem(b.dataset.price);
      openSheet(`
        <div class="pad">
          <h2 class="mb2">${esc(it.ar)}</h2>
          <p class="mute t-sm mb4">${categories.find((c) => c.id === it.categoryId)?.ar}</p>
          <label class="label">السعر (د.أ)</label>
          <input class="field num" id="np" inputmode="decimal" value="${moneyPlain(it.price)}">
          <label class="label mt4">محطة التحضير</label>
          <select class="field" id="ns">
            ${Object.values(STATIONS).map((st) => `<option value="${st.id}" ${it.station === st.id ? 'selected' : ''}>${st.ar}</option>`).join('')}
          </select>
          <label class="label mt4">زمن التحضير (دقيقة)</label>
          <input class="field num" id="nt" type="number" min="1" max="90" value="${it.prep}">
          <button class="btn btn-gold btn-lg btn-block mt6" id="save">${icon('check')} حفظ</button>
        </div>`, {
        onMount(sheet, close) {
          sheet.querySelector('#save').addEventListener('click', () => {
            const price = Math.round((Number(sheet.querySelector('#np').value) || 0) * 1000);
            if (price <= 0) { fx.shake(sheet.querySelector('#np')); return; }
            store.setMenuOverride(it.id, {
              price,
              station: sheet.querySelector('#ns').value,
              prep: Number(sheet.querySelector('#nt').value) || it.prep,
            }, actor());
            notify.toast('حُفظ التعديل', { tone: 'ok', sound: 'success' });
            close(); render();
          });
        },
      });
    }));
  },

  stock() {
    const app = document.getElementById('app');
    app.querySelectorAll('[data-restock]').forEach((b) => b.addEventListener('click', () => {
      const inv = store.get().inventory.find((x) => x.id === b.dataset.restock);
      openSheet(`
        <div class="pad">
          <h2 class="mb4">توريد — ${esc(inv.name)}</h2>
          <div class="between mb4"><span class="mute t-sm">الكمية الحالية</span><b class="num">${inv.qty} ${inv.unit}</b></div>
          <label class="label">الكمية المضافة (${inv.unit})</label>
          <input class="field num" id="add" inputmode="decimal" value="10">
          <label class="label mt4">حد إعادة الطلب</label>
          <input class="field num" id="min" inputmode="decimal" value="${inv.min}">
          <button class="btn btn-gold btn-lg btn-block mt6" id="save">${icon('check')} تسجيل التوريد</button>
        </div>`, {
        onMount(sheet, close) {
          sheet.querySelector('#save').addEventListener('click', () => {
            const add = Number(sheet.querySelector('#add').value) || 0;
            store.updateInventory(inv.id, {
              qty: +(inv.qty + add).toFixed(2),
              min: Number(sheet.querySelector('#min').value) || inv.min,
            }, actor());
            notify.toast(`أُضيفت ${add} ${inv.unit}`, { tone: 'ok', sound: 'success' });
            close(); render();
          });
        },
      });
    }));
    app.querySelector('[data-add-inv]')?.addEventListener('click', () => {
      openSheet(`
        <div class="pad">
          <h2 class="mb4">${icon('plus')} صنف مخزون جديد</h2>
          <div class="col" style="gap:12px">
            <div><label class="label">الاسم</label><input class="field" id="n"></div>
            <div class="row" style="gap:12px">
              <div class="grow"><label class="label">الوحدة</label><input class="field" id="u" value="كغم"></div>
              <div class="grow"><label class="label">الكمية</label><input class="field num" id="q" value="10"></div>
            </div>
            <div class="row" style="gap:12px">
              <div class="grow"><label class="label">حد الطلب</label><input class="field num" id="m" value="5"></div>
              <div class="grow"><label class="label">التكلفة (د.أ)</label><input class="field num" id="c" value="1.000"></div>
            </div>
            <button class="btn btn-gold btn-lg btn-block" id="save">${icon('check')} إضافة</button>
          </div>
        </div>`, {
        onMount(sheet, close) {
          sheet.querySelector('#save').addEventListener('click', () => {
            const name = clean(sheet.querySelector('#n').value, 60);
            if (!name) { fx.shake(sheet.querySelector('#n')); return; }
            store.commit('inventory.add', (st) => {
              st.inventory.push({
                id: `inv_${Date.now()}`, name,
                unit: clean(sheet.querySelector('#u').value, 10) || 'وحدة',
                qty: Number(sheet.querySelector('#q').value) || 0,
                min: Number(sheet.querySelector('#m').value) || 0,
                cost: Math.round((Number(sheet.querySelector('#c').value) || 0) * 1000),
                links: [],
              });
            }, { actor: actor(), text: `إضافة صنف مخزون: ${name}` });
            notify.toast('أُضيف الصنف', { tone: 'ok', sound: 'success' });
            close(); render();
          });
        },
      });
    });
  },

  staff() {
    const app = document.getElementById('app');
    app.querySelectorAll('[data-toggle-staff]').forEach((b) => b.addEventListener('click', () => {
      const p = store.get().staff.find((x) => x.id === b.dataset.toggleStaff);
      store.updateStaff(p.id, { active: !p.active }, actor());
      notify.play('tap'); render();
    }));
    app.querySelectorAll('[data-edit-staff]').forEach((b) => b.addEventListener('click', () => {
      const p = store.get().staff.find((x) => x.id === b.dataset.editStaff);
      staffSheet(p);
    }));
    app.querySelector('[data-add-staff]')?.addEventListener('click', () => staffSheet(null));
  },

  reports() {
    document.querySelectorAll('[data-csv]').forEach((b) => b.addEventListener('click', () => exportCsv(b.dataset.csv)));
  },

  settings() {
    const app = document.getElementById('app');

    app.querySelectorAll('[data-toggle]').forEach((el) => el.addEventListener('click', async () => {
      const key = el.dataset.toggle;
      const on = el.getAttribute('aria-checked') !== 'true';
      if (key === 'desktopNotify' && on) {
        const perm = await notify.requestDesktopPermission();
        if (perm !== 'granted') {
          notify.toast('لم يُسمح بإشعارات النظام من المتصفح', { tone: 'warn' });
          return;
        }
      }
      store.updateSettings({ [key]: on }, actor());
      el.setAttribute('aria-checked', String(on));
      notify.play(on ? 'add' : 'remove');
    }));

    app.querySelectorAll('[data-set]').forEach((el) => el.addEventListener('change', () => {
      const key = el.dataset.set;
      let v = Number(el.value) || 0;
      if (key === 'taxRate' || key === 'serviceRate') v = v / 100;
      else if (key === 'deliveryFee') v = Math.round(v * 1000);
      store.updateSettings({ [key]: v }, actor());
      notify.toast('حُفظ الإعداد', { tone: 'ok' });
      if (key === 'soundVolume') notify.play('chime');
    }));

    app.querySelector('#simbtn')?.addEventListener('click', () => {
      if (simulatorRunning()) { stopSimulator(); notify.toast('أُوقف المحاكي', { tone: 'info' }); }
      else { startSimulator(); notify.toast('يعمل المحاكي — راقب باقي الشاشات', { tone: 'gold', sound: 'success' }); }
      render();
    });

    app.querySelector('#reseed')?.addEventListener('click', async () => {
      const ok = await notify.confirmBox('إعادة توليد بيانات الديمو؟', {
        body: 'ستُستبدل كل الطلبات والجلسات الحالية ببيانات جديدة.', okText: 'إعادة التوليد', tone: 'bad',
      });
      if (!ok) return;
      seed({ force: true });
      notify.toast('جاهز — بيانات جديدة', { tone: 'ok', sound: 'success' });
      render();
    });

    app.querySelector('#export')?.addEventListener('click', () => {
      const blob = new Blob([store.exportState()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `hail-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      notify.toast('نُزّلت النسخة الاحتياطية', { tone: 'ok', sound: 'success' });
    });

    app.querySelector('#import')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        store.importState(await file.text());
        notify.toast('استُوردت البيانات', { tone: 'ok', sound: 'success' });
        render();
      } catch {
        notify.toast('الملف غير صالح', { tone: 'bad', sound: 'error' });
      }
    });

    app.querySelector('#wipe')?.addEventListener('click', async () => {
      const ok = await notify.confirmBox('تهيئة النظام للتشغيل الفعلي؟', {
        body: 'ستُمسح الطلبات والجلسات والمدفوعات التجريبية، مع إبقاء الطاولات والطاقم والمخزون جاهزة للعمل. لا يمكن التراجع.', okText: 'تهيئة نهائية', tone: 'bad',
      });
      if (!ok) return;
      seedClean();
      const synced = await store.flush();
      if (!synced) {
        notify.toast('تمت التهيئة محلياً، لكن الاتصال بالسحابة متوقف. أبقِ الصفحة مفتوحة حتى تعود المزامنة.', { tone: 'warn', sound: 'error' });
        render();
        return;
      }
      store.clearActor();
      notify.toast('النظام نظيف وجاهز للعمل', { tone: 'info' });
      location.reload();
    });
  },
};

/* ── ورقة الموظف ─────────────────────────────────────────────────────── */
function staffSheet(p) {
  openSheet(`
    <div class="pad">
      <h2 class="mb4">${p ? `تعديل — ${esc(p.name)}` : 'إضافة موظف'}</h2>
      <div class="col" style="gap:12px">
        <div><label class="label">الاسم</label><input class="field" id="n" value="${esc(p?.name || '')}"></div>
        <div><label class="label">الدور</label>
          <select class="field" id="r">
            ${Object.entries(store.ROLES).map(([k, v]) => `
              <option value="${k}" ${p?.role === k ? 'selected' : ''}>${v.ar}</option>`).join('')}
          </select></div>
        <div><label class="label">الهاتف</label><input class="field num" id="p" dir="ltr" value="${esc(p?.phone || '')}"></div>
        <div><label class="label">الرقم السري (4 أرقام)</label>
          <input class="field num" id="pin" inputmode="numeric" maxlength="4" value="${esc(p?.pin || '')}"></div>
        <button class="btn btn-gold btn-lg btn-block" id="save">${icon('check')} حفظ</button>
      </div>
    </div>`, {
    onMount(sheet, close) {
      sheet.querySelector('#save').addEventListener('click', () => {
        const name = clean(sheet.querySelector('#n').value, 60);
        const pin = clean(sheet.querySelector('#pin').value, 4);
        if (!name || !/^\d{4}$/.test(pin)) {
          fx.shake(sheet.querySelector(name ? '#pin' : '#n'));
          notify.toast('الاسم ورقم سري من 4 أرقام مطلوبان', { tone: 'warn', sound: 'error' });
          return;
        }
        const data = { name, role: sheet.querySelector('#r').value, phone: clean(sheet.querySelector('#p').value, 20), pin };
        if (p) store.updateStaff(p.id, data, actor());
        else store.addStaff(data, actor());
        notify.toast('حُفظ', { tone: 'ok', sound: 'success' });
        close(); render();
      });
    },
  });
}

/* ── تصدير CSV ───────────────────────────────────────────────────────── */
function exportCsv(kind) {
  const rep = store.reportFor();
  let rows;
  if (kind === 'items') {
    rows = [['الصنف', 'الكمية', 'الإيراد (د.أ)']];
    rep.top.forEach((t) => rows.push([t.ar, t.qty, moneyPlain(t.revenue)]));
  } else {
    rows = [['رقم الطلب', 'النوع', 'الطاولة', 'الوقت', 'عدد الأصناف', 'المجموع', 'الضريبة', 'الإجمالي']];
    rep.orders.forEach((o) => rows.push([
      o.code, o.type, o.tableNumber ?? '', clockTime(o.placedAt),
      sum(o.lines, (l) => l.qty), moneyPlain(o.subtotal), moneyPlain(o.tax), moneyPlain(o.total),
    ]));
  }
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hail-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  notify.toast('نُزّل الملف', { tone: 'ok', sound: 'success' });
}

/* ── التشغيل ─────────────────────────────────────────────────────────── */
render(true);
watchNotifications('admin', { onChange: () => { if (tab === 'dash' || tab === 'live') refresh(); } });
setInterval(() => { if (tab === 'dash' || tab === 'live') refresh(); }, 30000);
