/* ==========================================================================
   HAIL OS — شاشة الصالة (النادل / كابتن الصالة)
   خريطة طاولات حيّة · نداءات الخدمة بمهلة استجابة · طلبات جاهزة للتقديم · حجوزات
   ========================================================================== */

import { icon, esc, money, since, minutesSince, clockTime, sum, clean } from '../core/util.js';
import * as store from '../core/store.js';
import * as fx from '../core/fx.js';
import * as notify from '../core/notify.js';
import { boot, topbar, openSheet, watchNotifications, watchServiceSla, pinLogin, staffGate } from '../core/shell.js';
import { TABLE_ZONES } from '../data/seed.js';

boot({ title: 'الصالة — هيل كافيه' });
await staffGate({ surface: 'floor', title: 'دخول الصالة' });

/* ── الشريط العلوي ───────────────────────────────────────────────────── */
const whoBtn = document.createElement('button');
whoBtn.className = 'btn btn-sm btn-ghost nowrap';
const paintWho = () => {
  const a = store.getActor();
  whoBtn.innerHTML = `${icon('user')}<span>${a ? esc(a.name) : 'دخول الطاقم'}</span>`;
};
whoBtn.addEventListener('click', async () => {
  if (store.getActor()) { store.clearActor(); location.reload(); return; }
  const st = await pinLogin({ surface: 'floor', title: 'دخول الصالة' });
  if (st) { paintWho(); notify.toast(`أهلاً ${st.name}`, { tone: 'ok' }); render(); }
});
paintWho();

document.getElementById('bar').replaceWith(topbar({
  title: 'إدارة الصالة',
  subtitle: 'الطاولات والنداءات والتقديم',
  back: 'index.html',
  actions: [whoBtn],
}));

const actor = () => store.getActor()?.name || 'الصالة';

/* ── العرض ───────────────────────────────────────────────────────────── */
function render() {
  const s = store.get();
  const calls = s.services.filter((x) => x.status !== 'done')
    .sort((a, b) => (store.SERVICE_TYPES[a.type]?.priority || 5) - (store.SERVICE_TYPES[b.type]?.priority || 5) || a.createdAt - b.createdAt);
  const ready = s.orders.filter((o) => o.status === 'ready').sort((a, b) => a.readyAt - b.readyAt);
  const seated = s.tables.filter((t) => t.status === 'seated');
  const covers = sum(s.sessions.filter((x) => x.status === 'open'), (x) => x.guests);

  document.getElementById('app').innerHTML = `
    <div class="grid g4 mb6" style="padding-inline:var(--s2)">
      ${tile('طاولات مشغولة', `${seated.length}/${s.tables.length}`, 'table', '')}
      ${tile('عدد الضيوف', covers, 'users', '')}
      ${tile('نداءات مفتوحة', calls.length, 'bell', calls.length ? 'txt-bad' : '')}
      ${tile('جاهز للتقديم', ready.length, 'check', ready.length ? 'txt-ok' : '')}
    </div>

    <div class="split">
      <section>
        <div class="between mb2">
          <h2>${icon('grid')} خريطة الصالة</h2>
          <div class="legend">
            <span><i style="background:var(--ink-600)"></i>فارغة</span>
            <span><i style="background:#7c8a55"></i>مشغولة</span>
            <span><i style="background:#d4a82b"></i>محجوزة</span>
            <span><i style="background:#d1502f"></i>تحتاج تنظيف</span>
          </div>
        </div>

        ${TABLE_ZONES.map((z) => {
          const list = s.tables.filter((t) => t.zone === z.id);
          if (!list.length) return '';
          return `
            <div class="zonehead"><b class="t-sm">${z.ar}</b>
              <span class="chip">${list.filter((t) => t.status === 'seated').length}/${list.length}</span>
              <span class="line"></span></div>
            <div class="tmap">${list.map(tcell).join('')}</div>`;
        }).join('')}
      </section>

      <aside class="col" style="gap:var(--s5)">
        <div class="glass">
          <div class="between pad" style="padding-bottom:10px">
            <b>${icon('bell')} نداءات الطاولات</b>
            ${calls.length ? `<span class="badge">${calls.length}</span>` : `<span class="chip chip-ok">لا نداءات</span>`}
          </div>
          <div class="col pad" style="padding-top:0;gap:8px">
            ${calls.length ? calls.map(callRow).join('')
              : `<p class="mute t-sm center" style="padding:14px">كل الطاولات مخدومة</p>`}
          </div>
        </div>

        <div class="glass">
          <div class="between pad" style="padding-bottom:10px">
            <b>${icon('check')} جاهز للتقديم</b>
            ${ready.length ? `<span class="badge gold">${ready.length}</span>` : ''}
          </div>
          <div class="col pad" style="padding-top:0;gap:8px">
            ${ready.length ? ready.map(readyRow).join('')
              : `<p class="mute t-sm center" style="padding:14px">لا توجد أطباق بانتظار التقديم</p>`}
          </div>
        </div>

        <div class="glass">
          <div class="between pad" style="padding-bottom:10px">
            <b>${icon('calendar')} حجوزات اليوم</b>
            <button class="btn btn-sm btn-ghost" data-add-res>${icon('plus')} حجز</button>
          </div>
          <div>
            ${s.reservations.length ? s.reservations.map((r) => `
              <div class="lrow">
                <span class="av">${icon('users')}</span>
                <span class="grow">
                  <b class="t-sm">${esc(r.name)}</b>
                  <span class="mute t-xs" style="display:block">${r.guests} أشخاص · طاولة ${r.tableNumber}${r.note ? ` · ${esc(r.note)}` : ''}</span>
                </span>
                <span class="chip num">${clockTime(r.at)}</span>
              </div>`).join('')
              : `<p class="mute t-sm center" style="padding:14px">لا حجوزات مسجّلة</p>`}
          </div>
        </div>
      </aside>
    </div>`;

  wire();
  fx.initReveal(document.getElementById('app'));
}

function tile(k, v, ic, cls) {
  return `<div class="glass stat reveal"><span class="k">${icon(ic)} ${k}</span><span class="v ${cls}">${v}</span></div>`;
}

function tcell(t) {
  const s = store.get();
  const ses = t.sessionId ? s.sessions.find((x) => x.id === t.sessionId) : null;
  const calls = s.services.filter((x) => x.tableNumber === t.number && x.status !== 'done');
  const orders = ses ? store.sessionOrders(ses.id) : [];
  const live = orders.filter((o) => !['served', 'cancelled'].includes(o.status));
  const readyHere = orders.filter((o) => o.status === 'ready').length;
  const bill = ses ? store.sessionBill(ses.id) : null;

  return `
    <button class="tcell reveal" data-table="${t.number}" data-st="${t.status}">
      <div class="between" style="align-items:flex-start">
        <span>
          <span class="no">${t.number}</span>
          <span class="zone" style="display:block">${t.seats} مقاعد</span>
        </span>
        <span class="flags">
          ${calls.length ? `<span class="flag" style="background:rgba(223,76,64,.2);color:var(--bad-400)" title="نداء">${icon('bell')}</span>` : ''}
          ${readyHere ? `<span class="flag" style="background:rgba(46,158,126,.2);color:var(--ok-400)" title="جاهز">${icon('check')}</span>` : ''}
          ${live.length && !readyHere ? `<span class="flag" style="background:rgba(222,148,48,.2);color:var(--warn-400)" title="قيد التحضير">${icon('flame')}</span>` : ''}
        </span>
      </div>
      <div style="text-align:start">
        ${ses ? `
          <span class="t-xs mute" style="display:block">${ses.guests} ضيوف · ${since(ses.openedAt)}</span>
          <span class="num t-sm txt-gold">${money(bill.due)}</span>`
        : `<span class="t-xs mute">${t.status === 'reserved' ? 'محجوزة' : t.status === 'dirty' ? 'تحتاج تنظيف' : 'متاحة'}</span>`}
      </div>
    </button>`;
}

function callRow(c) {
  const t = store.SERVICE_TYPES[c.type];
  const mins = minutesSince(c.createdAt);
  const hot = mins >= store.get().settings.serviceSlaMin || t?.priority === 1;
  return `
    <div class="callcard ${hot ? 'hot' : ''} reveal" data-call="${c.id}">
      <span class="ic">${icon(t?.icon || 'bell')}</span>
      <span class="grow">
        <b class="t-sm">${t?.ar || c.type} · طاولة ${c.tableNumber}</b>
        <span class="mute t-xs" style="display:block">منذ ${since(c.createdAt)}${c.note ? ` · ${esc(c.note)}` : ''}</span>
      </span>
      ${c.status === 'open'
        ? `<button class="btn btn-sm btn-gold nowrap" data-sv="${c.id}" data-to="onway">${icon('play')} في الطريق</button>`
        : `<button class="btn btn-sm btn-ok nowrap" data-sv="${c.id}" data-to="done">${icon('check')} تم</button>`}
    </div>`;
}

function readyRow(o) {
  return `
    <div class="callcard reveal" style="border-color:rgba(46,158,126,.4)">
      <span class="ic" style="background:rgba(46,158,126,.16);color:var(--ok-400)">${icon('check')}</span>
      <span class="grow">
        <b class="t-sm num">${o.code} · ${o.type === 'dine-in' ? `طاولة ${o.tableNumber}` : o.type === 'takeaway' ? 'سفري' : 'توصيل'}</b>
        <span class="mute t-xs" style="display:block">${sum(o.lines, (l) => l.qty)} صنف · جاهز منذ ${since(o.readyAt || Date.now())}</span>
      </span>
      <button class="btn btn-sm btn-ok nowrap" data-served="${o.id}">${icon('award')} قُدِّم</button>
    </div>`;
}

/* ── الأفعال ─────────────────────────────────────────────────────────── */
function wire() {
  const app = document.getElementById('app');

  app.querySelectorAll('[data-sv]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    store.setServiceStatus(b.dataset.sv, b.dataset.to, actor());
    notify.play(b.dataset.to === 'done' ? 'success' : 'tap');
    render();
  }));

  app.querySelectorAll('[data-served]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    store.setOrderStatus(b.dataset.served, 'served', actor());
    notify.play('success');
    const r = b.getBoundingClientRect();
    fx.burst(r.left, r.top, 20);
    render();
  }));

  app.querySelectorAll('[data-table]').forEach((b) => b.addEventListener('click', () => {
    openTable(Number(b.dataset.table));
  }));

  app.querySelector('[data-add-res]')?.addEventListener('click', addReservation);
}

/* ── ورقة الطاولة ────────────────────────────────────────────────────── */
function openTable(number) {
  const draw = (sheet, close) => {
    const s = store.get();
    const t = s.tables.find((x) => x.number === number);
    const ses = t.sessionId ? s.sessions.find((x) => x.id === t.sessionId) : null;
    const orders = ses ? store.sessionOrders(ses.id) : [];
    const bill = ses ? store.sessionBill(ses.id) : null;
    const calls = s.services.filter((x) => x.tableNumber === number && x.status !== 'done');

    sheet.querySelector('.scroll-y').innerHTML = `
      <div class="pad">
        <div class="between mb4">
          <div>
            <p class="eyebrow">${t.zoneAr}</p>
            <h2>طاولة ${number}</h2>
          </div>
          <span class="chip chip-${t.status === 'seated' ? 'ok' : t.status === 'reserved' ? 'info' : t.status === 'dirty' ? 'warn' : ''}">
            ${t.status === 'seated' ? 'مشغولة' : t.status === 'reserved' ? 'محجوزة' : t.status === 'dirty' ? 'تحتاج تنظيف' : 'متاحة'}
          </span>
        </div>

        ${calls.length ? `
          <div class="col mb4" style="gap:8px">${calls.map(callRow).join('')}</div>` : ''}

        ${ses ? `
          <div class="grid g3 mb4">
            ${tile('الضيوف', ses.guests, 'users', '')}
            ${tile('المدة', since(ses.openedAt), 'clock', '')}
            ${tile('المطلوب', money(bill.due, false), 'wallet', 'txt-gold')}
          </div>

          <b class="t-sm">${icon('receipt')} طلبات الجلسة (${orders.length})</b>
          <div class="col mt2 mb4" style="gap:8px">
            ${orders.length ? orders.map((o) => `
              <div class="glass" style="padding:11px 14px">
                <div class="between">
                  <span>
                    <b class="num t-sm">${o.code}</b>
                    <span class="mute t-xs"> · جولة ${o.round} · ${clockTime(o.placedAt)}</span>
                  </span>
                  <span class="chip chip-${store.ORDER_STATUS[o.status]?.color}">${store.ORDER_STATUS[o.status]?.ar}</span>
                </div>
                <p class="mute t-xs mt2">${o.lines.map((l) => `${esc(l.ar)} ×${l.qty}`).join(' · ')}</p>
              </div>`).join('')
              : `<p class="mute t-sm">لم تُسجَّل طلبات بعد.</p>`}
          </div>

          <div class="col" style="gap:8px">
            <a class="btn btn-gold btn-block" href="menu.html?t=${number}" target="_blank" rel="noopener">
              ${icon('plus')} إضافة طلب من المنيو</a>
            <a class="btn btn-ghost btn-block" href="cashier.html?table=${number}">${icon('wallet')} فتح الفاتورة في الكاشير</a>
            <button class="btn btn-ghost btn-block" data-close-ses>${icon('door')} إنهاء الجلسة</button>
          </div>
        ` : `
          <div class="col" style="gap:10px">
            <label class="label">عدد الضيوف</label>
            <div class="row" style="gap:8px;flex-wrap:wrap">
              ${[1, 2, 3, 4, 5, 6, 8, 10].map((n) => `
                <button class="btn btn-sm ${n === 2 ? 'btn-gold' : 'btn-ghost'}" data-guests="${n}">${n}</button>`).join('')}
            </div>
            <button class="btn btn-gold btn-lg btn-block mt2" data-open-ses>${icon('door')} فتح الجلسة</button>
            ${t.status === 'dirty' ? `<button class="btn btn-ok btn-block" data-clean>${icon('sparkle')} تم التنظيف</button>` : ''}
            ${t.status !== 'reserved' ? `<button class="btn btn-ghost btn-block" data-reserve>${icon('calendar')} تعليم كمحجوزة</button>`
              : `<button class="btn btn-ghost btn-block" data-free>${icon('x')} إلغاء الحجز</button>`}
            <a class="btn btn-ghost btn-block" href="menu.html?t=${number}" target="_blank" rel="noopener">
              ${icon('qr')} فتح منيو الطاولة</a>
          </div>`}
      </div>`;

    let guests = 2;
    sheet.querySelectorAll('[data-guests]').forEach((b) => b.addEventListener('click', () => {
      guests = Number(b.dataset.guests);
      sheet.querySelectorAll('[data-guests]').forEach((x) => {
        x.className = `btn btn-sm ${Number(x.dataset.guests) === guests ? 'btn-gold' : 'btn-ghost'}`;
      });
      notify.play('tap');
    }));

    sheet.querySelector('[data-open-ses]')?.addEventListener('click', () => {
      store.openSession({ tableNumber: number, guests, actor: actor() });
      notify.toast(`فُتحت جلسة على الطاولة ${number}`, { tone: 'ok', sound: 'success' });
      draw(sheet, close); render();
    });
    sheet.querySelector('[data-close-ses]')?.addEventListener('click', async () => {
      if (bill.due > 0) {
        const go = await notify.confirmBox('الفاتورة غير مسدّدة', {
          body: `المتبقّي ${money(bill.due)}. أغلق الجلسة على أي حال؟`, okText: 'إغلاق', tone: 'bad',
        });
        if (!go) return;
      }
      store.closeSession(ses.id, actor());
      notify.toast('أُغلقت الجلسة', { tone: 'ok', sound: 'success' });
      close(); render();
    });
    sheet.querySelector('[data-clean]')?.addEventListener('click', () => {
      store.setTableStatus(number, 'free', actor());
      notify.play('success'); draw(sheet, close); render();
    });
    sheet.querySelector('[data-reserve]')?.addEventListener('click', () => {
      store.setTableStatus(number, 'reserved', actor()); draw(sheet, close); render();
    });
    sheet.querySelector('[data-free]')?.addEventListener('click', () => {
      store.setTableStatus(number, 'free', actor()); draw(sheet, close); render();
    });
  };

  openSheet('', { onMount: draw });
}

/* ── حجز جديد ────────────────────────────────────────────────────────── */
function addReservation() {
  openSheet(`
    <div class="pad">
      <h2 class="mb4">${icon('calendar')} حجز جديد</h2>
      <div class="col" style="gap:12px">
        <div><label class="label">الاسم</label><input class="field" id="rn" placeholder="اسم صاحب الحجز"></div>
        <div><label class="label">الهاتف</label><input class="field" id="rp" inputmode="tel" placeholder="07xxxxxxxx"></div>
        <div class="row" style="gap:12px">
          <div class="grow"><label class="label">عدد الضيوف</label><input class="field num" id="rg" type="number" min="1" max="30" value="4"></div>
          <div class="grow"><label class="label">الطاولة</label><input class="field num" id="rt" type="number" min="1" max="24" value="19"></div>
        </div>
        <div><label class="label">الوقت</label><input class="field num" id="rh" type="time" value="20:00"></div>
        <div><label class="label">ملاحظة</label><input class="field" id="rnote" placeholder="اختياري"></div>
        <button class="btn btn-gold btn-lg btn-block" id="rsave">${icon('check')} حفظ الحجز</button>
      </div>
    </div>`, {
    onMount(sheet, close) {
      sheet.querySelector('#rsave').addEventListener('click', () => {
        const name = clean(sheet.querySelector('#rn').value, 60);
        if (!name) { fx.shake(sheet.querySelector('#rn')); return; }
        const [hh, mm] = sheet.querySelector('#rh').value.split(':').map(Number);
        const at = new Date(); at.setHours(hh || 20, mm || 0, 0, 0);
        store.addReservation({
          name, phone: clean(sheet.querySelector('#rp').value, 20),
          guests: Number(sheet.querySelector('#rg').value) || 2,
          tableNumber: Number(sheet.querySelector('#rt').value) || 1,
          at: at.getTime(), note: clean(sheet.querySelector('#rnote').value, 80),
        }, actor());
        notify.toast('سُجّل الحجز', { tone: 'ok', sound: 'success' });
        close(); render();
      });
    },
  });
}

/* ── التشغيل ─────────────────────────────────────────────────────────── */
render();
watchNotifications('floor', { onChange: render });
watchServiceSla();
setInterval(render, 20000);
