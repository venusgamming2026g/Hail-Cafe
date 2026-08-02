/* ==========================================================================
   HAIL OS — شاشة الكاشير (نقطة البيع)
   قبول الطلبات · فواتير الطاولات · تحصيل وتقسيم · طلب يدوي · تقفيل الوردية
   ========================================================================== */

import { icon, esc, money, moneyPlain, since, clockTime, dateLabel, sum, params, clamp } from '../core/util.js';
import * as store from '../core/store.js';
import * as fx from '../core/fx.js';
import * as notify from '../core/notify.js';
import { boot, topbar, openSheet, watchNotifications, pinLogin } from '../core/shell.js';
import { categories, BRANCH } from '../data/menu.js';

const q = params();
let tab = q.table ? 'bills' : 'queue';
let posCart = [];
let posCat = 'breakfast';
let posType = 'takeaway';
let posTable = null;

boot({ title: 'الكاشير — هيل كافيه' });

/* ── الشريط العلوي ───────────────────────────────────────────────────── */
const whoBtn = document.createElement('button');
whoBtn.className = 'btn btn-sm btn-ghost nowrap';
const paintWho = () => {
  const a = store.getActor();
  whoBtn.innerHTML = `${icon('user')}<span>${a ? esc(a.name) : 'دخول الطاقم'}</span>`;
};
whoBtn.addEventListener('click', async () => {
  if (store.getActor()) { store.clearActor(); paintWho(); return; }
  const st = await pinLogin({ surface: 'cashier', title: 'دخول الكاشير' });
  if (st) { paintWho(); notify.toast(`أهلاً ${st.name}`, { tone: 'ok' }); render(); }
});
paintWho();

document.getElementById('bar').replaceWith(topbar({
  title: 'الكاشير',
  subtitle: 'الطلبات والفواتير والتحصيل',
  back: 'index.html',
  actions: [whoBtn],
}));

const actor = () => store.getActor()?.name || 'الكاشير';

/* ── التبويبات ───────────────────────────────────────────────────────── */
const TABS = [
  { id: 'queue', ar: 'الطلبات', ic: 'receipt' },
  { id: 'bills', ar: 'الفواتير المفتوحة', ic: 'wallet' },
  { id: 'pos',   ar: 'طلب يدوي', ic: 'plus' },
  { id: 'shift', ar: 'الوردية', ic: 'chart' },
];

function paintTabs() {
  const s = store.get();
  const pending = s.orders.filter((o) => o.status === 'pending').length;
  const openBills = s.sessions.filter((x) => x.status === 'open').length;
  document.getElementById('tabs').innerHTML = TABS.map((t) => {
    const n = t.id === 'queue' ? pending : t.id === 'bills' ? openBills : 0;
    return `<button data-tab="${t.id}" aria-selected="${tab === t.id}">
      ${t.ar}${n ? ` <span class="badge" style="margin-inline-start:4px">${n}</span>` : ''}</button>`;
  }).join('');
  document.getElementById('tabs').querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => { tab = b.dataset.tab; notify.play('tap'); render(); }));
}

/* ── العرض ───────────────────────────────────────────────────────────── */
function render() {
  paintTabs();
  document.getElementById('app').innerHTML = views[tab]();
  wire[tab]?.();
  fx.initReveal(document.getElementById('app'));
}

const views = {

  /* ①  طابور الطلبات */
  queue() {
    const s = store.get();
    const live = s.orders.filter((o) => !['served', 'cancelled'].includes(o.status))
      .sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1) || a.placedAt - b.placedAt);
    const rep = store.reportFor();

    return `
      <div class="grid g4 mb6">
        ${tile('طلبات جارية', live.length, 'clock', '')}
        ${tile('بانتظار القبول', live.filter((o) => o.status === 'pending').length, 'bell', 'txt-warn')}
        ${tile('مبيعات اليوم', money(rep.revenue, false), 'wallet', 'txt-gold')}
        ${tile('عدد الفواتير', rep.orders.length, 'receipt', '')}
      </div>

      ${live.length ? `<div class="grid auto-320">${live.map(orderCard).join('')}</div>` : `
        <div class="empty"><div class="ic">${icon('receipt')}</div>
        <h3>لا توجد طلبات جارية</h3><p class="t-sm">كل شيء تحت السيطرة.</p></div>`}`;
  },

  /* ②  الفواتير المفتوحة */
  bills() {
    const s = store.get();
    const open = s.sessions.filter((x) => x.status === 'open')
      .map((ses) => ({ ses, bill: store.sessionBill(ses.id) }))
      .sort((a, b) => a.ses.tableNumber - b.ses.tableNumber);

    const totalDue = sum(open, (x) => x.bill.due);

    return `
      <div class="grid g3 mb6">
        ${tile('فواتير مفتوحة', open.length, 'wallet', '')}
        ${tile('إجمالي المستحق', money(totalDue, false), 'cash', 'txt-gold')}
        ${tile('متوسط الفاتورة', open.length ? money(Math.round(totalDue / open.length), false) : '—', 'trend', '')}
      </div>

      ${open.length ? `<div class="grid auto-320">${open.map(({ ses, bill }) => {
        const payerBills = store.sessionPayerBills(ses.id);
        const hasNamedPayers = payerBills.some((payer) => payer.name !== 'حساب الطاولة');
        return `
        <div class="card pad reveal">
          <div class="between mb4">
            <div>
              <p class="eyebrow">طاولة ${ses.tableNumber}</p>
              <b>${ses.guests} ضيوف · ${since(ses.openedAt)}</b>
            </div>
            <span class="chip chip-gold num">${money(bill.due)}</span>
          </div>
          <p class="mute t-xs mb4">${bill.orders.length} طلب · ${sum(bill.lines, (l) => l.qty)} صنف${hasNamedPayers ? ` · ${payerBills.length} حسابات بالأسماء` : ''}</p>
          ${hasNamedPayers ? `
            <div class="col mb4" style="gap:7px">
              ${payerBills.map((payer) => `
                <button class="btn btn-ghost between" style="width:100%;padding-inline:12px"
                  data-pay-person="${ses.id}" data-payer="${esc(payer.name)}" ${payer.due <= 0 ? 'disabled' : ''}>
                  <span>${icon(payer.due > 0 ? 'user' : 'check')} ${esc(payer.name)}</span>
                  <b class="num ${payer.due > 0 ? 'txt-gold' : 'txt-ok'}">${payer.due > 0 ? money(payer.due) : 'مدفوع'}</b>
                </button>`).join('')}
            </div>` : ''}
          <div class="row" style="gap:8px">
            <button class="btn btn-gold grow" data-pay="${ses.id}">${icon('cash')} ${hasNamedPayers ? 'تحصيل كامل الطاولة' : 'تحصيل'}</button>
            <button class="btn btn-ghost" data-view="${ses.id}" aria-label="تفاصيل">${icon('eye')}</button>
          </div>
        </div>`;
      }).join('')}</div>` : `
        <div class="empty"><div class="ic">${icon('wallet')}</div>
        <h3>لا فواتير مفتوحة</h3><p class="t-sm">افتح جلسة من شاشة الصالة لتظهر هنا.</p></div>`}`;
  },

  /* ③  طلب يدوي */
  pos() {
    const list = store.menu().filter((it) => it.categoryId === posCat);
    const t = store.totalsFor(posCart, { type: posType });

    return `<div class="pos">
      <section>
        <div class="poscat mb4">
          ${categories.map((c) => `
            <button class="btn btn-sm ${posCat === c.id ? 'btn-gold' : 'btn-ghost'} nowrap" data-pc="${c.id}">
              ${c.ar}</button>`).join('')}
        </div>
        <div class="posgrid">
          ${list.map((it) => `
            <button class="positem" data-pi="${it.id}" ${it.available ? '' : 'disabled'}>
              <b>${esc(it.ar)}</b>
              <span class="num txt-gold">${money(it.price, false)}</span>
            </button>`).join('')}
        </div>
      </section>

      <aside class="glass pad sticky-top">
        <div class="segment mb4" style="width:100%">
          <button class="grow" data-pt="dine-in" aria-selected="${posType === 'dine-in'}">صالة</button>
          <button class="grow" data-pt="takeaway" aria-selected="${posType === 'takeaway'}">سفري</button>
          <button class="grow" data-pt="delivery" aria-selected="${posType === 'delivery'}">توصيل</button>
        </div>

        ${posType === 'dine-in' ? `
          <label class="label">رقم الطاولة</label>
          <input class="field num mb4" id="ptable" type="number" min="1" max="24" value="${posTable || ''}" placeholder="مثال: 7">` : ''}

        <b class="t-sm">${icon('cart')} الأصناف (${sum(posCart, (l) => l.qty)})</b>
        <div class="col mt2" style="gap:6px;max-height:44vh;overflow:auto">
          ${posCart.length ? posCart.map((l, i) => `
            <div class="row" style="gap:8px">
              <span class="grow t-sm">${esc(l.ar)}</span>
              <div class="stepper">
                <button data-pd="${i}">${icon(l.qty === 1 ? 'trash' : 'minus')}</button>
                <span class="n">${l.qty}</span>
                <button data-pu="${i}">${icon('plus')}</button>
              </div>
              <span class="num t-sm txt-gold nowrap">${money(l.price * l.qty, false)}</span>
            </div>`).join('')
            : `<p class="mute t-sm">اضغط على الأصناف لإضافتها.</p>`}
        </div>

        ${posCart.length ? `
          <div class="bill mt4">
            <div class="r"><span class="mute">المجموع</span><span>${money(t.subtotal, false)}</span></div>
            ${t.service ? `<div class="r"><span class="mute">خدمة</span><span>${money(t.service, false)}</span></div>` : ''}
            <div class="r"><span class="mute">ضريبة</span><span>${money(t.tax, false)}</span></div>
            ${t.delivery ? `<div class="r"><span class="mute">توصيل</span><span>${money(t.delivery, false)}</span></div>` : ''}
            <div class="r total"><span>الإجمالي</span><span class="v">${money(t.total)}</span></div>
          </div>
          <button class="btn btn-gold btn-lg btn-block mt4" id="possend">${icon('send')} إرسال للمطبخ</button>
          <button class="btn btn-ghost btn-sm btn-block mt2" id="posclear">${icon('trash')} إفراغ</button>` : ''}
      </aside>
    </div>`;
  },

  /* ④  الوردية */
  shift() {
    const rep = store.reportFor();
    const s = store.get();
    const pays = s.payments.filter((p) => p.at >= store.startOfToday());
    const byMethod = { cash: 0, card: 0, wallet: 0 };
    pays.forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });
    const tips = sum(pays, (p) => p.tip);

    return `
      <div class="grid g4 mb6">
        ${tile('إجمالي المبيعات', money(rep.revenue, false), 'wallet', 'txt-gold')}
        ${tile('عدد الفواتير', rep.orders.length, 'receipt', '')}
        ${tile('متوسط الفاتورة', money(rep.avgTicket, false), 'trend', '')}
        ${tile('البقشيش', money(tips, false), 'gift', 'txt-ok')}
      </div>

      <div class="grid g2">
        <div class="glass pad">
          <b class="mb4" style="display:block">${icon('cash')} التحصيل حسب الوسيلة</b>
          ${Object.entries({ cash: 'نقداً', card: 'بطاقة', wallet: 'محفظة إلكترونية' }).map(([k, ar]) => {
            const v = byMethod[k] || 0;
            const pct = rep.revenue ? Math.round((v / rep.revenue) * 100) : 0;
            return `<div class="mb4">
              <div class="between t-sm mb2"><span>${ar}</span><span class="num">${money(v, false)} · ${pct}%</span></div>
              <div class="rail"><i style="width:${pct}%"></i></div>
            </div>`;
          }).join('')}
          <div class="divider"></div>
          <div class="between"><b>المجموع المحصّل</b><b class="num txt-gold">${money(sum(pays, (p) => p.amount))}</b></div>
        </div>

        <div class="glass pad">
          <b class="mb4" style="display:block">${icon('list')} آخر العمليات</b>
          <div class="scroll-y" style="max-height:320px">
            ${pays.slice(0, 20).map((p) => `
              <div class="between t-sm" style="padding:7px 0;border-bottom:1px solid var(--hairline)">
                <span>
                  <b>${p.method === 'cash' ? 'نقداً' : p.method === 'card' ? 'بطاقة' : 'محفظة'}</b>
                  <span class="mute t-xs"> · ${clockTime(p.at)} · ${esc(p.by)}</span>
                </span>
                <span class="num txt-gold">${money(p.amount, false)}</span>
              </div>`).join('') || '<p class="mute t-sm">لا عمليات بعد.</p>'}
          </div>
          <button class="btn btn-ghost btn-block mt4" id="printshift">${icon('print')} طباعة تقرير الوردية</button>
        </div>
      </div>`;
  },
};

/* ── قوالب ───────────────────────────────────────────────────────────── */
function tile(k, v, ic, cls) {
  return `<div class="glass stat reveal"><span class="k">${icon(ic)} ${k}</span><span class="v ${cls}">${v}</span></div>`;
}

function orderCard(o) {
  const where = o.type === 'dine-in' ? `طاولة ${o.tableNumber}`
    : o.type === 'takeaway' ? 'سفري' : 'توصيل';
  return `
    <div class="card pad reveal ${o.status === 'pending' ? 'urgent' : ''}">
      <div class="between mb2">
        <b class="num" style="font-size:1.05rem">${o.code}</b>
        <span class="chip chip-${store.ORDER_STATUS[o.status]?.color}">${store.ORDER_STATUS[o.status]?.ar}</span>
      </div>
      <p class="mute t-xs mb4">
        ${icon(o.type === 'dine-in' ? 'table' : o.type === 'takeaway' ? 'box' : 'truck')} ${where}
        · ${clockTime(o.placedAt)} · منذ ${since(o.placedAt)}
        ${o.customer.name ? ` · ${esc(o.customer.name)}` : ''}
      </p>
      <div class="dashed" style="padding:9px 11px">
        ${o.lines.map((l) => `<div class="between t-sm" style="padding:2px 0">
          <span>${esc(l.ar)} <span class="mute">×${l.qty}</span></span>
          <span class="num mute">${money(l.price * l.qty, false)}</span></div>`).join('')}
      </div>
      ${o.note ? `<p class="t-xs txt-warn mt2">${icon('message')} ${esc(o.note)}</p>` : ''}
      <div class="between mt4 mb4"><b class="t-sm">الإجمالي</b><b class="num txt-gold">${money(o.total)}</b></div>
      <div class="row" style="gap:8px">
        ${o.status === 'pending' ? `
          <button class="btn btn-ok grow" data-acc="${o.id}">${icon('check')} قبول</button>
          <button class="btn btn-ghost" data-rej="${o.id}">${icon('x')}</button>`
        : o.status === 'ready' ? `
          <button class="btn btn-gold grow" data-srv="${o.id}">${icon('award')} تم التقديم</button>
          <button class="btn btn-ghost" data-pay1="${o.id}">${icon('cash')}</button>`
        : `
          <button class="btn btn-ghost grow" data-pay1="${o.id}">${icon('cash')} تحصيل</button>
          <button class="btn btn-ghost" data-print="${o.id}" aria-label="طباعة">${icon('print')}</button>`}
      </div>
    </div>`;
}

/* ── الربط ───────────────────────────────────────────────────────────── */
const wire = {
  queue() {
    const app = document.getElementById('app');
    app.querySelectorAll('[data-acc]').forEach((b) => b.addEventListener('click', () => {
      store.setOrderStatus(b.dataset.acc, 'accepted', actor());
      notify.toast('قُبل الطلب وأُرسل للمطبخ', { tone: 'ok', sound: 'success' });
      render();
    }));
    app.querySelectorAll('[data-rej]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await notify.confirmBox('رفض الطلب؟', { okText: 'رفض', tone: 'bad' });
      if (!ok) return;
      store.cancelOrder(b.dataset.rej, 'رفض من الكاشير', actor());
      render();
    }));
    app.querySelectorAll('[data-srv]').forEach((b) => b.addEventListener('click', () => {
      store.setOrderStatus(b.dataset.srv, 'served', actor());
      notify.play('success'); render();
    }));
    app.querySelectorAll('[data-pay1]').forEach((b) => b.addEventListener('click', () => {
      const o = store.get().orders.find((x) => x.id === b.dataset.pay1);
      openPayment({ orders: [o], amount: o.total, label: `طلب ${o.code}`, payerName: o.customer?.name || '' });
    }));
    app.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => {
      const o = store.get().orders.find((x) => x.id === b.dataset.print);
      printReceipt({ lines: o.lines, ...o, title: `طلب ${o.code}` });
    }));
  },

  bills() {
    const app = document.getElementById('app');
    app.querySelectorAll('[data-pay]').forEach((b) => b.addEventListener('click', () => {
      const ses = store.sessionById(b.dataset.pay);
      const bill = store.sessionBill(ses.id);
      openPayment({ session: ses, orders: bill.orders, amount: bill.due, label: `طاولة ${ses.tableNumber}`, bill });
    }));
    app.querySelectorAll('[data-pay-person]').forEach((b) => b.addEventListener('click', () => {
      const ses = store.sessionById(b.dataset.payPerson);
      const payer = store.sessionPayerBills(ses.id).find((entry) => entry.name === b.dataset.payer);
      if (!payer || payer.due <= 0) return;
      openPayment({
        session: ses,
        orders: payer.orders,
        amount: payer.due,
        label: `طاولة ${ses.tableNumber} · ${payer.name}`,
        bill: payer,
        payerName: payer.name,
      });
    }));
    app.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
      const ses = store.sessionById(b.dataset.view);
      const bill = store.sessionBill(ses.id);
      const payerBills = store.sessionPayerBills(ses.id);
      openSheet(`
        <div class="pad">
          <h2 class="mb4">فاتورة الطاولة ${ses.tableNumber}</h2>
          ${payerBills.length ? `
            <div class="glass pad mb4">
              <b class="t-sm">${icon('users')} الحسابات بالأسماء</b>
              <div class="col mt2" style="gap:7px">
                ${payerBills.map((payer) => `
                  <div class="between dashed" style="padding:9px 11px">
                    <span>${esc(payer.name)}</span>
                    <b class="num ${payer.due > 0 ? 'txt-gold' : 'txt-ok'}">${payer.due > 0 ? money(payer.due) : 'مدفوع'}</b>
                  </div>`).join('')}
              </div>
            </div>` : ''}
          <div class="bill">
            ${bill.lines.map((l) => `<div class="r"><span>${esc(l.ar)} <span class="mute">×${l.qty}</span></span>
              <span>${money(l.price * l.qty, false)}</span></div>`).join('')}
            <div class="divider" style="margin:10px 0"></div>
            <div class="r"><span class="mute">المجموع</span><span>${money(bill.subtotal, false)}</span></div>
            ${bill.service ? `<div class="r"><span class="mute">خدمة</span><span>${money(bill.service, false)}</span></div>` : ''}
            <div class="r"><span class="mute">ضريبة</span><span>${money(bill.tax, false)}</span></div>
            ${bill.discounted ? `<div class="r txt-ok"><span>خصم</span><span>−${money(bill.discounted, false)}</span></div>` : ''}
            ${bill.paidAmount ? `<div class="r txt-ok"><span>مدفوع</span><span>−${money(bill.paidAmount, false)}</span></div>` : ''}
            <div class="r total"><span>المطلوب</span><span class="v">${money(bill.due)}</span></div>
          </div>
          <button class="btn btn-ghost btn-block mt4" data-pr>${icon('print')} طباعة</button>
        </div>`, {
        onMount(sheet) {
          sheet.querySelector('[data-pr]').addEventListener('click', () =>
            printReceipt({ ...bill, title: `فاتورة الطاولة ${ses.tableNumber}` }));
        },
      });
    }));
  },

  pos() {
    const app = document.getElementById('app');
    app.querySelectorAll('[data-pc]').forEach((b) => b.addEventListener('click', () => {
      posCat = b.dataset.pc; notify.play('tap'); render();
    }));
    app.querySelectorAll('[data-pt]').forEach((b) => b.addEventListener('click', () => {
      posType = b.dataset.pt; notify.play('tap'); render();
    }));
    app.querySelectorAll('[data-pi]').forEach((b) => b.addEventListener('click', () => {
      const it = store.menuItem(b.dataset.pi);
      const found = posCart.find((l) => l.itemId === it.id);
      if (found) found.qty += 1;
      else posCart.push({ itemId: it.id, ar: it.ar, en: it.en, qty: 1, price: it.price, station: it.station, prep: it.prep, options: [], note: '' });
      notify.play('add'); render();
    }));
    app.querySelectorAll('[data-pu]').forEach((b) => b.addEventListener('click', () => {
      posCart[Number(b.dataset.pu)].qty += 1; notify.play('tap'); render();
    }));
    app.querySelectorAll('[data-pd]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.pd);
      posCart[i].qty -= 1;
      if (posCart[i].qty <= 0) posCart.splice(i, 1);
      notify.play('remove'); render();
    }));
    app.querySelector('#ptable')?.addEventListener('input', (e) => { posTable = e.target.value; });
    app.querySelector('#posclear')?.addEventListener('click', () => { posCart = []; render(); });
    app.querySelector('#possend')?.addEventListener('click', () => {
      if (!posCart.length) return;
      let sessionId = null;
      let tableNumber = null;
      if (posType === 'dine-in') {
        tableNumber = clamp(Number(posTable || app.querySelector('#ptable')?.value), 1, 99);
        if (!tableNumber) { fx.shake(app.querySelector('#ptable')); notify.play('error'); return; }
        const ses = store.openSessionForTable(tableNumber) || store.openSession({ tableNumber, guests: 2, actor: actor() });
        sessionId = ses.id;
      }
      const o = store.placeOrder({
        lines: posCart, type: posType, tableNumber, sessionId,
        source: 'cashier', actor: actor(),
      });
      posCart = []; posTable = null;
      notify.toast(`سُجّل الطلب ${o.code}`, { tone: 'gold', sound: 'success' });
      fx.burst(window.innerWidth / 2, window.innerHeight / 3, 34);
      tab = 'queue'; render();
    });
  },

  shift() {
    document.getElementById('printshift')?.addEventListener('click', printShift);
  },
};

/* ── نافذة التحصيل ───────────────────────────────────────────────────── */
function openPayment({ session = null, orders = [], amount, label, bill = null, payerName = '' }) {
  let method = 'cash';
  let discount = 0;
  let tip = 0;
  let splitCount = 1;
  let given = 0;

  const draw = (sheet, close) => {
    const due = Math.max(0, amount - discount);
    const perHead = Math.ceil(due / splitCount / 50) * 50;
    const change = Math.max(0, given - (due + tip));

    sheet.querySelector('.scroll-y').innerHTML = `
      <div class="pad">
        <p class="eyebrow mb2">تحصيل</p>
        <h2 class="mb4">${esc(label)}</h2>

        <div class="glass pad bill mb4">
          <div class="r"><span class="mute">المستحق</span><span>${money(amount, false)}</span></div>
          ${discount ? `<div class="r txt-ok"><span>خصم</span><span>−${money(discount, false)}</span></div>` : ''}
          ${tip ? `<div class="r"><span class="mute">بقشيش</span><span>+${money(tip, false)}</span></div>` : ''}
          <div class="r total"><span>المطلوب</span><span class="v">${money(due + tip)}</span></div>
        </div>

        <label class="label">وسيلة الدفع</label>
        <div class="grid g3 mb4">
          ${[['cash', 'نقداً', 'cash'], ['card', 'بطاقة', 'card'], ['wallet', 'محفظة', 'wallet']].map(([id, ar, ic]) => `
            <button class="paykey" data-m="${id}" aria-selected="${method === id}">${icon(ic)}<span>${ar}</span></button>`).join('')}
        </div>

        ${method === 'cash' ? `
          <label class="label">المبلغ المستلم</label>
          <input class="field num mb2" id="given" inputmode="decimal" placeholder="${moneyPlain(due + tip)}" value="${given ? moneyPlain(given) : ''}">
          <div class="row wrap-x mb4" style="gap:6px">
            ${[due + tip, 5000, 10000, 20000, 50000].map((v) => `
              <button class="btn btn-sm btn-ghost num" data-quick="${v}">${moneyPlain(v)}</button>`).join('')}
          </div>
          ${given ? `<div class="glass pad mb4 between"><b>الباقي</b><b class="num txt-ok">${money(change)}</b></div>` : ''}` : ''}

        <div class="row mb4" style="gap:10px">
          <div class="grow">
            <label class="label">خصم (د.أ)</label>
            <input class="field num" id="disc" inputmode="decimal" value="${discount ? moneyPlain(discount) : ''}" placeholder="0.000">
          </div>
          <div class="grow">
            <label class="label">بقشيش (د.أ)</label>
            <input class="field num" id="tip" inputmode="decimal" value="${tip ? moneyPlain(tip) : ''}" placeholder="0.000">
          </div>
        </div>

        <label class="label">${icon('split')} تقسيم الفاتورة</label>
        <div class="row wrap-x mb2" style="gap:6px">
          ${[1, 2, 3, 4, 5, 6].map((n) => `
            <button class="btn btn-sm ${splitCount === n ? 'btn-gold' : 'btn-ghost'}" data-split="${n}">${n === 1 ? 'بدون' : `${n} أشخاص`}</button>`).join('')}
        </div>
        ${splitCount > 1 ? `<p class="t-sm txt-gold mb4">${icon('users')} حصة كل شخص: <b class="num">${money(perHead)}</b></p>` : '<div class="mb4"></div>'}

        <button class="btn btn-gold btn-lg btn-block" id="confirm">${icon('check')} تأكيد التحصيل ${money(due + tip)}</button>
        <button class="btn btn-ghost btn-block mt2" id="printb">${icon('print')} طباعة الفاتورة</button>
      </div>`;

    sheet.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      method = b.dataset.m; notify.play('tap'); draw(sheet, close);
    }));
    sheet.querySelectorAll('[data-split]').forEach((b) => b.addEventListener('click', () => {
      splitCount = Number(b.dataset.split); notify.play('tap'); draw(sheet, close);
    }));
    sheet.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
      given = Number(b.dataset.quick); notify.play('tap'); draw(sheet, close);
    }));
    sheet.querySelector('#disc')?.addEventListener('change', (e) => {
      discount = Math.round(Math.max(0, Number(e.target.value) || 0) * 1000);
      discount = Math.min(discount, amount); draw(sheet, close);
    });
    sheet.querySelector('#tip')?.addEventListener('change', (e) => {
      tip = Math.round(Math.max(0, Number(e.target.value) || 0) * 1000); draw(sheet, close);
    });
    sheet.querySelector('#given')?.addEventListener('change', (e) => {
      given = Math.round(Math.max(0, Number(e.target.value) || 0) * 1000); draw(sheet, close);
    });
    sheet.querySelector('#printb').addEventListener('click', () =>
      printReceipt(bill || { lines: orders.flatMap((o) => o.lines), ...(orders[0] || {}), title: label }));

    sheet.querySelector('#confirm').addEventListener('click', async () => {
      if (method === 'cash' && given && given < due + tip) {
        notify.toast('المبلغ المستلم أقل من المطلوب', { tone: 'warn', sound: 'error' });
        fx.shake(sheet.querySelector('#given'));
        return;
      }
      store.pay({
        sessionId: session?.id || null,
        orderIds: orders.map((o) => o.id),
        method, amount: due, tip, discount, actor: actor(),
        splitOf: splitCount > 1 ? splitCount : null,
        payerName,
      });
      notify.play('cash');
      fx.burst(window.innerWidth / 2, window.innerHeight / 3, 42);
      notify.toast(`تم التحصيل · ${money(due + tip)}`, {
        body: method === 'cash' && given ? `الباقي ${money(change)}` : '', tone: 'gold', sound: null,
      });
      if (session) {
        const remaining = store.sessionBill(session.id).due;
        if (remaining <= 0) {
          const closeIt = await notify.confirmBox('سُدّدت الفاتورة بالكامل', {
            body: `هل تُغلق جلسة الطاولة ${session.tableNumber}؟`, okText: 'إغلاق الجلسة',
          });
          if (closeIt) store.closeSession(session.id, actor());
        }
      }
      close(); render();
    });
  };

  openSheet('', { onMount: draw });
}

/* ── الطباعة ─────────────────────────────────────────────────────────── */
function printReceipt(data) {
  const s = store.get().settings;
  const lines = data.lines || [];
  const win = window.open('', '_blank', 'width=380,height=680');
  if (!win) { notify.toast('فعّل النوافذ المنبثقة للطباعة', { tone: 'warn' }); return; }
  win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
    <title>${esc(data.title || 'فاتورة')}</title>
    <style>
      body{font-family:'Segoe UI',system-ui,sans-serif;padding:16px;max-width:300px;margin:auto;color:#111}
      h1{font-size:17px;text-align:center;margin:0 0 2px}
      .c{text-align:center;font-size:11px;color:#555}
      hr{border:0;border-top:1px dashed #999;margin:9px 0}
      .r{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
      .t{font-weight:800;font-size:15px}
      .f{text-align:center;font-size:10px;color:#666;margin-top:12px}
    </style></head><body>
    <h1>${esc(s.brandAr)}</h1>
    <div class="c">${esc(BRANCH.addressAr)}</div>
    <div class="c" dir="ltr">${BRANCH.phoneDisplay}</div>
    <hr>
    <div class="r"><span>${esc(data.title || '')}</span><span>${clockTime()}</span></div>
    <div class="r"><span>${dateLabel()}</span><span>${esc(actor())}</span></div>
    <hr>
    ${lines.map((l) => `<div class="r"><span>${esc(l.ar)} ×${l.qty}</span><span>${moneyPlain(l.price * l.qty)}</span></div>`).join('')}
    <hr>
    <div class="r"><span>المجموع</span><span>${moneyPlain(data.subtotal || 0)}</span></div>
    ${data.discount ? `<div class="r"><span>خصم</span><span>-${moneyPlain(data.discount)}</span></div>` : ''}
    ${data.service ? `<div class="r"><span>خدمة</span><span>${moneyPlain(data.service)}</span></div>` : ''}
    <div class="r"><span>ضريبة ${Math.round(s.taxRate * 100)}%</span><span>${moneyPlain(data.tax || 0)}</span></div>
    ${data.delivery ? `<div class="r"><span>توصيل</span><span>${moneyPlain(data.delivery)}</span></div>` : ''}
    <hr>
    <div class="r t"><span>الإجمالي</span><span>${moneyPlain(data.total || 0)} د.أ</span></div>
    <div class="f">شكراً لزيارتكم — نتشرّف بخدمتكم دائماً</div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 320);
}

function printShift() {
  const rep = store.reportFor();
  const pays = store.get().payments.filter((p) => p.at >= store.startOfToday());
  const byMethod = {};
  pays.forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });
  const win = window.open('', '_blank', 'width=420,height=700');
  if (!win) { notify.toast('فعّل النوافذ المنبثقة للطباعة', { tone: 'warn' }); return; }
  win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
    <title>تقرير الوردية</title>
    <style>body{font-family:'Segoe UI',system-ui,sans-serif;padding:22px;color:#111;max-width:460px;margin:auto}
    h1{font-size:19px;margin:0 0 4px}.c{color:#666;font-size:12px}
    .r{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:13px}
    .t{font-weight:800;font-size:16px;border-top:2px solid #111;margin-top:8px;padding-top:8px}</style></head><body>
    <h1>تقرير الوردية — ${store.get().settings.brandAr}</h1>
    <div class="c">${dateLabel()} · حتى ${clockTime()} · ${esc(actor())}</div><br>
    <div class="r"><span>عدد الفواتير</span><b>${rep.orders.length}</b></div>
    <div class="r"><span>عدد الأصناف المباعة</span><b>${rep.qty}</b></div>
    <div class="r"><span>متوسط الفاتورة</span><b>${moneyPlain(rep.avgTicket)}</b></div>
    <div class="r"><span>الطلبات الملغاة</span><b>${rep.cancelled.length}</b></div>
    <div class="r"><span>صالة / سفري / توصيل</span><b>${rep.byType['dine-in']} / ${rep.byType.takeaway} / ${rep.byType.delivery}</b></div>
    <br><b>التحصيل</b>
    ${Object.entries(byMethod).map(([k, v]) => `<div class="r"><span>${k === 'cash' ? 'نقداً' : k === 'card' ? 'بطاقة' : 'محفظة'}</span><b>${moneyPlain(v)}</b></div>`).join('')}
    <div class="r t"><span>إجمالي المبيعات</span><span>${moneyPlain(rep.revenue)} د.أ</span></div>
    <br><b>الأكثر مبيعاً</b>
    ${rep.top.slice(0, 10).map((t, i) => `<div class="r"><span>${i + 1}. ${esc(t.ar)}</span><b>${t.qty}</b></div>`).join('')}
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 320);
}

/* ── التشغيل ─────────────────────────────────────────────────────────── */
render();
watchNotifications('cashier', { onChange: render });
setInterval(render, 25000);
