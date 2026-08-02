/* ==========================================================================
   HAIL OS — واجهة الزبون (رمز QR على الطاولة)
   منيو رسمي كامل · سلة · طلب متعدّد الجولات · تتبّع حيّ · نداء خدمة · فاتورة
   ========================================================================== */

import { icon, esc, money, clean, normalizeAr, params, LS, since, clockTime, sum, clamp } from '../core/util.js';
import * as store from '../core/store.js';
import * as fx from '../core/fx.js';
import * as notify from '../core/notify.js';
import { boot, topbar, openSheet, watchNotifications } from '../core/shell.js';
import { categories, BRANCH, MENU_STATS } from '../data/menu.js';

/* ── الحالة المحلّية ─────────────────────────────────────────────────── */
const q = params();
const tableNumber = q.t || q.table ? clamp(Number(q.t || q.table), 1, 99) : null;
const CART_KEY = `hailos:cart:${tableNumber || 'go'}`;
const PAYER_KEY = `hailos:payer:${tableNumber || 'go'}`;

let cart = LS.get(CART_KEY, []);
let tab = 'menu';
let activeCat = 'all';
let search = '';
let session = null;
let orderType = tableNumber ? 'dine-in' : 'takeaway';
let customer = LS.get('hailos:customer', { name: '', phone: '', address: '' });
let payerName = tableNumber ? LS.get(PAYER_KEY, '') : '';

/* ── الإقلاع ─────────────────────────────────────────────────────────── */
boot({ title: tableNumber ? `هيل كافيه — طاولة ${tableNumber}` : 'هيل كافيه — المنيو' });

if (tableNumber) {
  session = store.openSessionForTable(tableNumber)
    || store.openSession({ tableNumber, guests: 2, actor: 'الزبون' });
}

document.getElementById('bar').replaceWith(topbar({
  title: 'هيل كافيه',
  subtitle: tableNumber ? `طاولة رقم ${tableNumber} · إربد سيتي سنتر` : 'إربد سيتي سنتر',
  live: false,
  actions: [(() => {
    const b = document.createElement('button');
    b.className = 'btn btn-sm btn-ghost nowrap';
    b.innerHTML = `${icon('pin')}<span>الفرع</span>`;
    b.addEventListener('click', showBranch);
    return b;
  })()],
}));

watchNotifications('customer', { sessionId: session?.id, onChange: () => render() });
store.subscribe(() => { if (tab !== 'menu') render(); });

/* ── أدوات السلة ─────────────────────────────────────────────────────── */
const keyFor = (itemId, options, note) =>
  `${itemId}|${options.map((o) => o.id).sort().join(',')}|${note}`;

function saveCart() { LS.set(CART_KEY, cart); paintCartBar(); }

function addToCart(itemId, qty, options, note, fromEl) {
  const key = keyFor(itemId, options, note);
  const found = cart.find((c) => c.key === key);
  if (found) found.qty += qty;
  else cart.push({ key, itemId, qty, options, note });
  saveCart();
  notify.play('add');
  notify.buzz(14);
  const bar = document.querySelector('.cartbar');
  if (fromEl && bar) fx.flyTo(fromEl, bar, `+${qty}`);
}

function setQty(key, qty) {
  const line = cart.find((c) => c.key === key);
  if (!line) return;
  if (qty <= 0) { cart = cart.filter((c) => c.key !== key); notify.play('remove'); }
  else { line.qty = qty; notify.play('tap'); }
  saveCart();
}

const cartLines = () => cart.map((c) => {
  const it = store.menuItem(c.itemId);
  return it ? {
    ...c, ar: it.ar, en: it.en, price: it.price, station: it.station, prep: it.prep, image: it.image,
  } : null;
}).filter(Boolean);

const cartCount = () => sum(cart, (c) => c.qty);
const cartTotals = () => store.totalsFor(cartLines().map((l) => ({
  itemId: l.itemId, qty: l.qty, price: l.price, options: l.options,
})), { type: orderType });

/* ── الشريط السفلي للسلة ─────────────────────────────────────────────── */
function paintCartBar() {
  const host = document.getElementById('cartbar');
  const n = cartCount();
  if (!n || tab !== 'menu') {
    const cur = host.querySelector('.cartbar');
    if (cur) { cur.classList.add('out'); setTimeout(() => { host.innerHTML = ''; }, 300); }
    return;
  }
  const t = cartTotals();
  if (host.querySelector('.cartbar')) {
    host.querySelector('[data-n]').textContent = n;
    host.querySelector('[data-sum]').textContent = money(t.total);
    return;
  }
  host.innerHTML = `
    <button class="cartbar" data-open-cart>
      <span class="count" data-n>${n}</span>
      <span class="grow" style="text-align:start">
        <b style="display:block;font-size:.92rem">عرض السلة وإتمام الطلب</b>
        <span class="num" data-sum style="font-size:.78rem;opacity:.75">${money(t.total)}</span>
      </span>
      ${icon('arrowL')}
    </button>`;
  host.querySelector('[data-open-cart]').addEventListener('click', openCart);
}

/* ── العرض الرئيسي ───────────────────────────────────────────────────── */
function render() {
  const app = document.getElementById('app');
  const scrollY = window.scrollY;
  app.innerHTML = views[tab]();
  wire[tab]?.(app);
  paintTabbar();
  paintCartBar();
  fx.initReveal(app);
  fx.initTilt(app);
  if (tab === 'menu') window.scrollTo(0, scrollY);
}

/* ── التبويبات السفلية ───────────────────────────────────────────────── */
function paintTabbar() {
  let bar = document.querySelector('.tabbar');
  if (!bar) {
    bar = document.createElement('nav');
    bar.className = 'tabbar';
    document.querySelector('.shell').append(bar);
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-tab]');
      if (!b) return;
      tab = b.dataset.tab;
      notify.play('tap');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      render();
    });
  }
  const myOrders = session ? store.sessionOrders(session.id) : [];
  const live = myOrders.filter((o) => !['served', 'cancelled'].includes(o.status)).length;
  const open = session ? store.get().services.filter((s) => s.sessionId === session.id && s.status !== 'done').length : 0;

  const tabs = [
    { id: 'menu',   ar: 'المنيو',   ic: 'list' },
    { id: 'orders', ar: 'طلباتي',   ic: 'receipt', n: live },
    ...(tableNumber ? [{ id: 'service', ar: 'الخدمة', ic: 'bell', n: open }] : []),
    ...(tableNumber ? [{ id: 'bill',   ar: 'الفاتورة', ic: 'wallet' }] : []),
  ];
  bar.innerHTML = tabs.map((t) => `
    <button data-tab="${t.id}" aria-selected="${tab === t.id}">
      ${icon(t.ic)}<span>${t.ar}</span>
      ${t.n ? `<span class="badge">${t.n}</span>` : ''}
    </button>`).join('');
}

/* ── الشاشات ─────────────────────────────────────────────────────────── */
const views = {

  /* ①  المنيو */
  menu() {
    const all = store.menu();
    const norm = normalizeAr(search);
    const filtered = all.filter((it) => {
      if (activeCat !== 'all' && it.categoryId !== activeCat) return false;
      if (!norm) return true;
      return normalizeAr(it.ar).includes(norm) || normalizeAr(it.en).includes(norm);
    });
    const featured = all.filter((it) => it.featured && it.available);
    const byCat = {};
    for (const it of filtered) (byCat[it.categoryId] ||= []).push(it);

    return `
      <section class="hero">
        <div class="row wrap-x" style="gap:var(--s5);align-items:center">
          <div class="hatch"><img src="assets/menu/combo-platter.webp" alt="من أطباق هيل كافيه" loading="eager"></div>
          <div class="grow" style="min-width:200px">
            <p class="eyebrow mb2">منيو رسمي · إربد سيتي سنتر</p>
            <h1 class="mb2">أهلاً بك في <span class="gold-text">هيل كافيه</span></h1>
            <p class="soft t-sm" style="max-width:46ch">
              ${tableNumber
                ? `أنت على <b>الطاولة رقم ${tableNumber}</b>. اختر ما يحلو لك وأرسل الطلب مباشرة إلى المطبخ.`
                : 'اختر أصنافك ثم حدّد استلاماً من الفرع أو توصيلاً إلى موقعك.'}
            </p>
            <div class="row wrap-x mt4" style="gap:8px">
              <span class="chip chip-gold">${icon('layers')} ${MENU_STATS.categories} قسماً</span>
              <span class="chip">${icon('list')} ${MENU_STATS.items} صنفاً</span>
              <span class="chip chip-ok">${icon('clock')} مفتوح حتى منتصف الليل</span>
            </div>
          </div>
        </div>
        <div class="seam mt6"><i></i><span></span><i></i></div>
      </section>

      <div class="page-pad mb4">
        <div class="searchbox">
          ${icon('search')}
          <input class="field" id="q" type="search" inputmode="search" placeholder="ابحث عن صنف… مثال: فتوش، لاتيه، برغر"
                 value="${esc(search)}" aria-label="بحث في المنيو">
        </div>
      </div>

      ${!search && activeCat === 'all' && featured.length ? `
        <div class="sec-head"><h2>${icon('sparkle')} مختارات هيل</h2><span class="line"></span></div>
        <div class="feat">${featured.map((it) => card(it, true)).join('')}</div>` : ''}

      <div class="catrail-wrap">
        <div class="scroll-x catrail">
          <button data-cat="all" aria-selected="${activeCat === 'all'}">${icon('grid')}<span>الكل</span></button>
          ${categories.map((c) => `
            <button data-cat="${c.id}" aria-selected="${activeCat === c.id}">
              ${icon(c.icon)}<span>${c.ar}</span></button>`).join('')}
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty">
          <div class="ic">${icon('search')}</div>
          <h3>لا يوجد صنف بهذا الاسم</h3>
          <p class="t-sm">جرّب كلمة أخرى أو تصفّح الأقسام.</p>
        </div>` :
        Object.entries(byCat).map(([catId, list]) => {
          const c = categories.find((x) => x.id === catId);
          return `
            <div class="sec-head">
              <h2>${c?.ar || catId}</h2>
              <span class="chip">${list.length}</span>
              <span class="line"></span>
            </div>
            <div class="grid auto-220 page-pad">${list.map((it) => card(it)).join('')}</div>`;
        }).join('')}

      <div class="page-pad mt6">
        <div class="glass pad t-xs mute" style="text-align:center">
          الأسعار بالدينار الأردني وقبل ضريبة المبيعات ${Math.round(store.get().settings.taxRate * 100)}% كما في المنيو الرسمي.
        </div>
      </div>`;
  },

  /* ②  طلباتي */
  orders() {
    const list = session
      ? store.sessionOrders(session.id)
      : store.get().orders.filter((o) => o.customer.phone && o.customer.phone === customer.phone);

    if (!list.length) {
      return `<div class="empty">
        <div class="ic">${icon('receipt')}</div>
        <h3>لا توجد طلبات بعد</h3>
        <p class="t-sm">أرسل أول طلب من المنيو وسيظهر تتبّعه هنا لحظة بلحظة.</p>
        <button class="btn btn-gold mt4" data-goto="menu">${icon('list')} تصفّح المنيو</button>
      </div>`;
    }

    return `<div class="page-pad col" style="gap:var(--s4)">
      ${list.map((o) => orderCard(o)).join('')}
    </div>`;
  },

  /* ③  الخدمة */
  service() {
    const mine = store.get().services.filter((s) => s.sessionId === session?.id);
    const open = mine.filter((s) => s.status !== 'done');
    return `<div class="page-pad col" style="gap:var(--s4)">
      <div class="glass pad">
        <p class="eyebrow mb2">خدمة الطاولة</p>
        <h2 class="mb2">نناديك بلمسة واحدة</h2>
        <p class="mute t-sm mb4">اضغط ما تحتاجه وسيصل النداء فوراً إلى شاشة الصالة.</p>
        <div class="svc-grid">
          ${Object.entries(store.SERVICE_TYPES).map(([id, t]) => {
            const sent = open.find((s) => s.type === id);
            return `<button class="svc" data-svc="${id}" data-sent="${sent ? 1 : 0}">
              ${icon(sent ? 'check' : t.icon)}<span>${sent ? 'تم الإرسال' : t.ar}</span></button>`;
          }).join('')}
        </div>
      </div>

      ${open.length ? `
        <div class="glass">
          <div class="pad" style="padding-bottom:8px"><b class="t-sm">النداءات الجارية</b></div>
          ${open.map((s) => `
            <div class="lrow">
              <span class="av txt-gold">${icon(store.SERVICE_TYPES[s.type]?.icon || 'bell')}</span>
              <span class="grow">
                <b class="t-sm">${store.SERVICE_TYPES[s.type]?.ar || s.type}</b>
                <span class="mute t-xs" style="display:block">منذ ${since(s.createdAt)}</span>
              </span>
              <span class="chip chip-${store.SERVICE_STATUS[s.status]?.color}">
                ${store.SERVICE_STATUS[s.status]?.ar}</span>
            </div>`).join('')}
        </div>` : ''}

      <div class="glass pad">
        <b class="t-sm">${icon('message')} ملاحظة للطاقم</b>
        <textarea class="field mt2" id="svcnote" rows="2" placeholder="مثال: نحتاج كرسي أطفال"></textarea>
        <button class="btn btn-ghost btn-block mt2" data-svc-note>${icon('send')} إرسال الملاحظة</button>
      </div>
    </div>`;
  },

  /* ④  الفاتورة */
  bill() {
    if (!session) return `<div class="empty"><div class="ic">${icon('wallet')}</div><h3>الفاتورة متاحة داخل الفرع</h3></div>`;
    const b = store.sessionBill(session.id);
    const payerBills = store.sessionPayerBills(session.id);
    const namedPayers = payerBills.filter((p) => p.name !== 'حساب الطاولة');
    const onlyShared = payerBills.length === 1 && payerBills[0]?.name === 'حساب الطاولة';
    if (!b.orders.length) {
      return `<div class="empty"><div class="ic">${icon('wallet')}</div>
        <h3>الفاتورة فارغة</h3><p class="t-sm">لم تُسجَّل أي طلبات على هذه الجلسة بعد.</p></div>`;
    }
    const asked = store.get().services.some((s) => s.sessionId === session.id && s.type === 'bill' && s.status !== 'done');
    return `<div class="page-pad col" style="gap:var(--s4)">
      <div class="glass pad">
        <div class="between mb2">
          <b class="t-sm">${icon('users')} تقسيم الفاتورة بالأسماء</b>
          <span class="chip ${namedPayers.length ? 'chip-ok' : ''}">${namedPayers.length || 1} حساب</span>
        </div>
        ${onlyShared ? `
          <p class="mute t-xs mb3">الحساب الآن <b>مشترك للطاولة</b> لأن الطلبات أُرسلت بدون اسم.</p>
          <p class="t-sm mb3">لتقسيم الفاتورة: كل شخص يكتب <b>اسمه</b> في السلة قبل إرسال طلبه — فيظهر حساب منفصل عند الكاشير.</p>
          <button class="btn btn-gold btn-sm" data-goto="menu">${icon('user')} اطلب باسمك الآن</button>
        ` : `
          <p class="mute t-xs mb4">كل شخص يدفع حسابه منفصلاً عند الكاشير.</p>
          <div class="col" style="gap:8px">
            ${payerBills.map((payer) => `
              <div class="between dashed" style="padding:10px 12px">
                <span>
                  <b class="t-sm">${esc(payer.name)}</b>
                  <small class="mute" style="display:block">${payer.orders.length} طلب · ${sum(payer.lines, (line) => line.qty)} صنف</small>
                </span>
                <span class="num ${payer.due > 0 ? 'txt-gold' : 'txt-ok'}">${payer.due > 0 ? money(payer.due) : 'مدفوع'}</span>
              </div>`).join('')}
          </div>
        `}
      </div>
      <div class="glass edge-gold pad">
        <div class="between mb4">
          <div>
            <p class="eyebrow">فاتورة الطاولة ${tableNumber}</p>
            <b>${b.orders.length} طلب · ${sum(b.lines, (l) => l.qty)} صنف</b>
          </div>
          <span class="chip">${icon('clock')} ${since(session.openedAt)}</span>
        </div>

        <div class="bill">
          ${b.lines.map((l) => `
            <div class="r">
              <span>${esc(l.ar)} <span class="mute">×${l.qty}</span></span>
              <span>${money(l.price * l.qty, false)}</span>
            </div>`).join('')}
          <div class="divider" style="margin:10px 0"></div>
          <div class="r"><span class="mute">المجموع</span><span>${money(b.subtotal, false)}</span></div>
          ${b.service ? `<div class="r"><span class="mute">خدمة ${Math.round(store.get().settings.serviceRate * 100)}%</span><span>${money(b.service, false)}</span></div>` : ''}
          <div class="r"><span class="mute">ضريبة ${Math.round(store.get().settings.taxRate * 100)}%</span><span>${money(b.tax, false)}</span></div>
          ${b.discounted ? `<div class="r txt-ok"><span>خصم</span><span>−${money(b.discounted, false)}</span></div>` : ''}
          ${b.paidAmount ? `<div class="r txt-ok"><span>مدفوع</span><span>−${money(b.paidAmount, false)}</span></div>` : ''}
          <div class="r total"><span>المطلوب</span><span class="v">${money(b.due)}</span></div>
        </div>
      </div>

      <button class="btn ${asked ? 'btn-ok' : 'btn-gold'} btn-lg btn-block" data-ask-bill ${asked ? 'disabled' : ''}>
        ${icon(asked ? 'check' : 'receipt')} ${asked ? 'تم إبلاغ الكاشير — في الطريق إليك' : 'اطلب الفاتورة'}
      </button>
      <p class="mute t-xs" style="text-align:center">الدفع يتم عند الكاشير أو عبر النادل. تُحتسب الضريبة تلقائياً.</p>
    </div>`;
  },
};

/* ── قوالب ───────────────────────────────────────────────────────────── */
function card(it, wide = false) {
  const marks = [];
  if (it.featured) marks.push(`<span class="chip chip-gold">${icon('star')} مختارة</span>`);
  if (!it.available) marks.push(`<span class="chip chip-bad">غير متوفر</span>`);
  it.tags.slice(0, 1).forEach((t) => marks.push(`<span class="chip">${esc(t)}</span>`));

  return `
    <article class="card mcard card-interactive ${it.available ? '' : 'out'} reveal" data-item="${it.id}"
      role="button" tabindex="0" aria-label="${esc(it.available ? `فتح ${it.ar}` : `${it.ar} غير متوفر`)}"
      aria-disabled="${it.available ? 'false' : 'true'}" ${wide ? 'data-tilt' : ''}>
      <div class="shot">
        <img src="${it.image}" alt="${esc(it.ar)}" loading="lazy" decoding="async">
        <div class="marks">${marks.join('')}</div>
        <div class="shot-meta">
          <span class="chip" style="background:rgba(6,8,10,.6);backdrop-filter:blur(6px)">${icon('timer')} ${it.prep} د</span>
        </div>
      </div>
      <div class="body">
        <div class="grow">
          <h4>${esc(it.ar)}</h4>
          ${it.en ? `<span class="en">${esc(it.en)}</span>` : ''}
        </div>
        <div class="between">
          <span class="price num">${money(it.price)}</span>
          ${it.available
            ? `<span class="btn btn-sm btn-gold" aria-hidden="true">${icon('plus')}</span>`
            : `<span class="chip chip-bad">نفد</span>`}
        </div>
      </div>
    </article>`;
}

function orderCard(o) {
  const steps = [
    { id: 'pending',   ar: 'أُرسل',    ic: 'send' },
    { id: 'accepted',  ar: 'مقبول',    ic: 'check' },
    { id: 'preparing', ar: 'التحضير',  ic: 'flame' },
    { id: 'ready',     ar: 'جاهز',     ic: 'bell' },
    { id: 'served',    ar: 'قُدِّم',    ic: 'award' },
  ];
  const order = ['pending', 'accepted', 'preparing', 'ready', 'served'];
  const idx = order.indexOf(o.status);
  const cancelled = o.status === 'cancelled';

  const eta = o.status === 'ready' || o.status === 'served' ? null
    : Math.max(1, Math.max(...o.lines.map((l) => l.prep)) - Math.floor((Date.now() - o.placedAt) / 60000));

  return `
    <div class="glass pad reveal ${o.status === 'ready' ? 'edge-gold' : ''}">
      <div class="between mb4">
        <div>
          <span class="eyebrow">الجولة ${o.round} · ${clockTime(o.placedAt)}</span>
          <b class="num" style="font-size:1.1rem">${o.code}</b>
          ${o.customer?.name ? `<span class="chip chip-gold mt2">${icon('user')} ${esc(o.customer.name)}</span>` : ''}
        </div>
        <span class="chip chip-${cancelled ? 'bad' : store.ORDER_STATUS[o.status]?.color}">
          ${cancelled ? '' : '<i class="dot dot-live"></i>'}${store.ORDER_STATUS[o.status]?.ar}
        </span>
      </div>

      ${cancelled ? `<p class="txt-bad t-sm mb4">${icon('alert')} أُلغي الطلب${o.cancelReason ? ` — ${esc(o.cancelReason)}` : ''}</p>` : `
        <div class="track mb4">
          ${steps.map((s, i) => `
            ${i ? `<div class="link ${i <= idx ? 'on' : ''}"><i></i></div>` : ''}
            <div class="node ${i <= idx ? 'on' : ''} ${i === idx ? 'cur' : ''}">
              <span class="bulb">${icon(s.ic)}</span><span>${s.ar}</span>
            </div>`).join('')}
        </div>
        ${eta ? `<p class="t-sm txt-gold mb4">${icon('timer')} الوقت المتوقّع للتحضير: ${eta} دقيقة تقريباً</p>` : ''}
        ${o.status === 'ready' ? `<p class="t-sm txt-ok mb4">${icon('check')} طلبك جاهز — النادل في طريقه إليك</p>` : ''}
      `}

      <div class="dashed pad" style="padding:10px 12px">
        ${o.lines.map((l) => `
          <div class="between t-sm" style="padding:3px 0">
            <span>${esc(l.ar)} <span class="mute">×${l.qty}</span>
              ${l.options?.length ? `<span class="mute t-xs" style="display:block">${l.options.map((x) => esc(x.ar)).join(' · ')}</span>` : ''}
              ${l.note ? `<span class="mute t-xs" style="display:block">${icon('message')} ${esc(l.note)}</span>` : ''}
            </span>
            <span class="num mute">${money(l.price * l.qty, false)}</span>
          </div>`).join('')}
        <div class="divider" style="margin:8px 0"></div>
        <div class="between"><b class="t-sm">الإجمالي</b><b class="num txt-gold">${money(o.total)}</b></div>
      </div>

      ${o.status === 'pending' ? `
        <button class="btn btn-ghost btn-sm btn-block mt2" data-cancel="${o.id}">${icon('x')} إلغاء الطلب</button>` : ''}
    </div>`;
}

/* ── الربط ───────────────────────────────────────────────────────────── */
const wire = {
  menu(root) {
    const input = root.querySelector('#q');
    if (input) {
      input.addEventListener('input', (e) => {
        search = e.target.value;
        const pos = e.target.selectionStart;
        render();
        const again = document.querySelector('#q');
        if (again) { again.focus(); again.setSelectionRange(pos, pos); }
      });
    }
    root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
      activeCat = b.dataset.cat; search = ''; notify.play('tap');
      render();
      document.querySelector('.catrail-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    root.querySelectorAll('[data-item]').forEach((c) => {
      const open = () => {
        const it = store.menuItem(c.dataset.item);
        if (!it) return;
        if (!it.available) { notify.toast('هذا الصنف غير متوفر حالياً', { tone: 'warn', sound: 'error' }); return; }
        openItem(it, c);
      };
      c.addEventListener('click', open);
      c.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
      });
    });
  },

  orders(root) {
    root.querySelector('[data-goto="menu"]')?.addEventListener('click', () => { tab = 'menu'; render(); });
    root.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await notify.confirmBox('إلغاء الطلب؟', {
        body: 'يمكن الإلغاء ما دام الطلب لم يُقبل في المطبخ بعد.', okText: 'نعم، ألغِ', tone: 'bad',
      });
      if (!ok) return;
      store.cancelOrder(b.dataset.cancel, 'إلغاء من الزبون', 'الزبون');
      notify.toast('تم إلغاء الطلب', { tone: 'ok', sound: 'success' });
      render();
    }));
  },

  service(root) {
    root.querySelectorAll('[data-svc]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.sent === '1') return;
      store.callService({ sessionId: session.id, tableNumber, type: b.dataset.svc, actor: 'الزبون' });
      notify.toast('وصل النداء إلى الطاقم', {
        body: store.SERVICE_TYPES[b.dataset.svc]?.ar, tone: 'ok', sound: 'success',
      });
      notify.buzz([20, 40, 20]);
      render();
    }));
    root.querySelector('[data-svc-note]')?.addEventListener('click', () => {
      const note = clean(root.querySelector('#svcnote').value, 160);
      if (!note) { fx.shake(root.querySelector('#svcnote')); return; }
      store.callService({ sessionId: session.id, tableNumber, type: 'waiter', note, actor: 'الزبون' });
      notify.toast('أُرسلت ملاحظتك للطاقم', { tone: 'ok', sound: 'success' });
      render();
    });
  },

  bill(root) {
    root.querySelector('[data-goto="menu"]')?.addEventListener('click', () => { tab = 'menu'; render(); });
    root.querySelector('[data-ask-bill]')?.addEventListener('click', () => {
      store.callService({ sessionId: session.id, tableNumber, type: 'bill', actor: 'الزبون' });
      notify.toast('تم طلب الفاتورة', { body: 'الكاشير في طريقه إليك', tone: 'ok', sound: 'success' });
      fx.burst(window.innerWidth / 2, window.innerHeight * 0.4, 28);
      render();
    });
  },
};

/* ── ورقة تفاصيل الصنف ───────────────────────────────────────────────── */
function openItem(it, fromEl) {
  let qty = 1;
  const chosen = new Map();          // groupId → [choices]
  it.options.forEach((g) => {
    if (g.required && g.choices.length) chosen.set(g.id, [g.choices[0]]);
    else chosen.set(g.id, []);
  });

  const extra = () => sum([...chosen.values()].flat(), (c) => c.delta);
  const priceNow = () => (it.price + extra()) * qty;

  const body = `
    <div class="detail-shot">
      <img src="${it.image}" alt="${esc(it.ar)}">
    </div>
    <div class="pad" style="margin-top:-42px;position:relative">
      <div class="row wrap-x mb2" style="gap:6px">
        ${it.featured ? `<span class="chip chip-gold">${icon('star')} مختارة</span>` : ''}
        ${it.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
        <span class="chip">${icon('timer')} ${it.prep} دقيقة</span>
      </div>
      <h2>${esc(it.ar)}</h2>
      ${it.en ? `<p class="mute t-sm">${esc(it.en)}</p>` : ''}
      ${it.noteAr ? `<p class="t-xs txt-warn mt2">${icon('info')} ${esc(it.noteAr)}</p>` : ''}

      <div id="opts" class="col mt6" style="gap:var(--s5)">
        ${it.options.map((g) => `
          <div>
            <div class="between mb2">
              <b class="t-sm">${g.ar}</b>
              ${g.required ? '<span class="chip chip-gold">مطلوب</span>' : g.multi ? '<span class="chip">اختيار متعدّد</span>' : '<span class="chip">اختياري</span>'}
            </div>
            <div class="col" style="gap:8px">
              ${g.choices.map((c) => `
                <div class="opt" role="checkbox" aria-checked="false" data-g="${g.id}" data-c="${c.id}">
                  <span class="tick">${icon('check')}</span>
                  <span class="grow">${c.ar}</span>
                  ${c.delta ? `<span class="num txt-gold t-sm">+${money(c.delta, false)}</span>` : ''}
                </div>`).join('')}
            </div>
          </div>`).join('')}

        <div>
          <b class="t-sm">${icon('message')} ملاحظة للمطبخ</b>
          <textarea class="field mt2" id="inote" rows="2" placeholder="مثال: بدون مايونيز، تحميص إضافي…"></textarea>
        </div>
      </div>
    </div>

    <div class="pad" style="position:sticky;bottom:0;background:var(--grad-ink);border-top:1px solid var(--hairline)">
      <div class="row" style="gap:var(--s3)">
        <div class="stepper">
          <button data-q="-" aria-label="إنقاص">${icon('minus')}</button>
          <span class="n" id="qn">1</span>
          <button data-q="+" aria-label="زيادة">${icon('plus')}</button>
        </div>
        <button class="btn btn-gold btn-lg grow" id="addbtn">
          ${icon('cart')} <span>إضافة · <span class="num" id="pnow">${money(it.price)}</span></span>
        </button>
      </div>
    </div>`;

  openSheet(body, {
    onMount(sheet, close) {
      const paint = () => {
        sheet.querySelector('#qn').textContent = qty;
        sheet.querySelector('#pnow').textContent = money(priceNow());
        sheet.querySelectorAll('.opt').forEach((o) => {
          const list = chosen.get(o.dataset.g) || [];
          o.setAttribute('aria-checked', String(list.some((c) => c.id === o.dataset.c)));
        });
      };

      sheet.querySelectorAll('.opt').forEach((o) => o.addEventListener('click', () => {
        const g = it.options.find((x) => x.id === o.dataset.g);
        const c = g.choices.find((x) => x.id === o.dataset.c);
        const list = chosen.get(g.id) || [];
        if (g.multi) {
          const i = list.findIndex((x) => x.id === c.id);
          if (i >= 0) list.splice(i, 1); else list.push({ ...c, groupId: g.id });
          chosen.set(g.id, list);
        } else {
          const same = list.some((x) => x.id === c.id);
          chosen.set(g.id, same && !g.required ? [] : [{ ...c, groupId: g.id }]);
        }
        notify.play('tap');
        paint();
      }));

      sheet.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
        qty = clamp(qty + (b.dataset.q === '+' ? 1 : -1), 1, 30);
        notify.play('tap');
        paint();
      }));

      sheet.querySelector('#addbtn').addEventListener('click', () => {
        const note = clean(sheet.querySelector('#inote').value, 140);
        const opts = [...chosen.values()].flat().map((c) => ({ id: c.id, ar: c.ar, delta: c.delta, groupId: c.groupId }));
        addToCart(it.id, qty, opts, note, fromEl);
        close();
      });

      paint();
    },
  });
}

/* ── ورقة السلة ──────────────────────────────────────────────────────── */
function openCart() {
  const draw = (sheet, close) => {
    const lines = cartLines();
    const t = cartTotals();

    sheet.querySelector('.scroll-y').innerHTML = `
      <div class="pad">
        <div class="between mb4">
          <h2>سلّتك</h2>
          <span class="chip chip-gold">${cartCount()} صنف</span>
        </div>

        ${!tableNumber ? `
          <div class="segment mb4" role="tablist" style="width:100%">
            ${store.get().settings.allowTakeaway ? `<button class="grow" data-type="takeaway" aria-selected="${orderType === 'takeaway'}">استلام من الفرع</button>` : ''}
            ${store.get().settings.allowDelivery ? `<button class="grow" data-type="delivery" aria-selected="${orderType === 'delivery'}">توصيل</button>` : ''}
          </div>
          <div class="col mb4" style="gap:10px">
            <input class="field" id="cname" placeholder="الاسم" value="${esc(customer.name)}">
            <input class="field" id="cphone" placeholder="رقم الهاتف" inputmode="tel" value="${esc(customer.phone)}">
            ${orderType === 'delivery' ? `<textarea class="field" id="caddr" rows="2" placeholder="العنوان بالتفصيل">${esc(customer.address)}</textarea>` : ''}
          </div>` : `
          <div class="chip chip-ok mb2">${icon('table')} الطاولة رقم ${tableNumber}${session ? ` · جولة ${session.round + 1}` : ''}</div>
          <div class="glass edge-gold pad mb4" style="padding:12px">
            <label class="label" for="payername">${icon('user')} اسم صاحب الطلب — لتقسيم الفاتورة</label>
            <input class="field" id="payername" maxlength="60" autocomplete="name"
              placeholder="مثال: أحمد" value="${esc(payerName)}" required>
            <div class="row wrap-x mt2" style="gap:7px" id="payerchips">
              ${['أحمد', 'سارة', 'ليان', 'محمود', 'رنيم', 'يوسف'].map((n) =>
                `<button type="button" class="chip ${payerName === n ? 'chip-gold' : ''}" data-payer-chip="${esc(n)}">${esc(n)}</button>`).join('')}
            </div>
            <p class="mute t-xs mt2">اكتب اسمك ليظهر حسابك منفصلاً عند الكاشير. بدون اسم يُضاف الطلب لحساب الطاولة المشترك.</p>
          </div>`}

        ${lines.length ? `
          <div class="col" style="gap:10px">
            ${lines.map((l) => `
              <div class="glass pad" style="padding:12px">
                <div class="row" style="gap:12px;align-items:flex-start">
                  <img src="${l.image}" alt="" style="width:58px;height:58px;border-radius:12px;object-fit:cover;flex:none">
                  <div class="grow">
                    <b class="t-sm">${esc(l.ar)}</b>
                    ${l.options.length ? `<p class="mute t-xs">${l.options.map((o) => esc(o.ar)).join(' · ')}</p>` : ''}
                    ${l.note ? `<p class="mute t-xs">${icon('message')} ${esc(l.note)}</p>` : ''}
                    <span class="num txt-gold t-sm">${money((l.price + sum(l.options, (o) => o.delta)) * l.qty)}</span>
                  </div>
                  <div class="stepper" style="flex:none">
                    <button data-dec="${l.key}" aria-label="إنقاص">${icon(l.qty === 1 ? 'trash' : 'minus')}</button>
                    <span class="n">${l.qty}</span>
                    <button data-inc="${l.key}" aria-label="زيادة">${icon('plus')}</button>
                  </div>
                </div>
              </div>`).join('')}
          </div>

          <div class="glass pad mt6 bill">
            <div class="r"><span class="mute">المجموع</span><span>${money(t.subtotal, false)}</span></div>
            ${t.service ? `<div class="r"><span class="mute">خدمة ${Math.round(store.get().settings.serviceRate * 100)}%</span><span>${money(t.service, false)}</span></div>` : ''}
            <div class="r"><span class="mute">ضريبة ${Math.round(store.get().settings.taxRate * 100)}%</span><span>${money(t.tax, false)}</span></div>
            ${t.delivery ? `<div class="r"><span class="mute">توصيل</span><span>${money(t.delivery, false)}</span></div>` : ''}
            <div class="r total"><span>الإجمالي</span><span class="v">${money(t.total)}</span></div>
          </div>

          <textarea class="field mt4" id="onote" rows="2" placeholder="ملاحظة عامة على الطلب (اختياري)"></textarea>
          <button class="btn btn-gold btn-lg btn-block mt4" id="place">
            ${icon('send')} إرسال الطلب إلى المطبخ
          </button>
          <button class="btn btn-ghost btn-sm btn-block mt2" id="clear">${icon('trash')} إفراغ السلة</button>
        ` : `
          <div class="empty"><div class="ic">${icon('cart')}</div><h3>السلة فارغة</h3></div>`}
      </div>`;

    sheet.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => {
      const l = cart.find((c) => c.key === b.dataset.inc);
      setQty(b.dataset.inc, l.qty + 1); draw(sheet, close);
    }));
    sheet.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => {
      const l = cart.find((c) => c.key === b.dataset.dec);
      setQty(b.dataset.dec, l.qty - 1); draw(sheet, close);
    }));
    sheet.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => {
      orderType = b.dataset.type; notify.play('tap'); draw(sheet, close);
    }));
    sheet.querySelectorAll('[data-payer-chip]').forEach((b) => b.addEventListener('click', () => {
      const input = sheet.querySelector('#payername');
      payerName = b.dataset.payerChip || '';
      if (input) input.value = payerName;
      LS.set(PAYER_KEY, payerName);
      notify.play('tap');
      draw(sheet, close);
    }));
    sheet.querySelector('#payername')?.addEventListener('input', (e) => {
      payerName = clean(e.target.value, 60);
      LS.set(PAYER_KEY, payerName);
    });
    sheet.querySelector('#clear')?.addEventListener('click', async () => {
      const ok = await notify.confirmBox('إفراغ السلة؟', { okText: 'إفراغ', tone: 'bad' });
      if (!ok) return;
      cart = []; saveCart(); draw(sheet, close);
    });
    sheet.querySelector('#place')?.addEventListener('click', () => placeOrder(sheet, close));
  };

  openSheet('', { onMount: draw });
}

/* ── إرسال الطلب ─────────────────────────────────────────────────────── */
function placeOrder(sheet, close) {
  const lines = cartLines();
  if (!lines.length) return;

  if (!tableNumber) {
    customer = {
      name: clean(sheet.querySelector('#cname')?.value, 60),
      phone: clean(sheet.querySelector('#cphone')?.value, 20),
      address: clean(sheet.querySelector('#caddr')?.value, 160),
    };
    if (!customer.name || customer.phone.length < 7) {
      notify.toast('نحتاج الاسم ورقم الهاتف', { tone: 'warn', sound: 'error' });
      fx.shake(sheet.querySelector('#cname'));
      return;
    }
    if (orderType === 'delivery' && !customer.address) {
      notify.toast('نحتاج عنوان التوصيل', { tone: 'warn', sound: 'error' });
      fx.shake(sheet.querySelector('#caddr'));
      return;
    }
    LS.set('hailos:customer', customer);
  } else {
    payerName = clean(sheet.querySelector('#payername')?.value, 60);
    LS.set(PAYER_KEY, payerName);
  }

  const note = clean(sheet.querySelector('#onote')?.value, 200);
  const order = store.placeOrder({
    lines: lines.map((l) => ({
      itemId: l.itemId, ar: l.ar, en: l.en, qty: l.qty, price: l.price,
      station: l.station, prep: l.prep, options: l.options, note: l.note,
    })),
    type: orderType,
    tableNumber,
    sessionId: session?.id || null,
    customer: tableNumber
      ? { name: payerName, phone: '', address: '' }
      : customer,
    note,
    source: 'qr',
    actor: payerName || 'الزبون',
  });

  cart = []; saveCart();
  close();
  notify.play('success');
  notify.buzz([30, 50, 30, 50, 60]);
  fx.burst(window.innerWidth / 2, window.innerHeight * 0.42, 56);
  notify.toast(`تم إرسال طلبك · ${order.code}`, {
    body: 'وصل الطلب إلى المطبخ — تابع حالته من "طلباتي"', tone: 'gold', life: 6000,
  });
  tab = 'orders';
  render();
}

/* ── معلومات الفرع ───────────────────────────────────────────────────── */
function showBranch() {
  const today = new Date().getDay();
  openSheet(`
    <div class="pad">
      <p class="eyebrow mb2">الفرع</p>
      <h2 class="mb4">${esc(BRANCH.ar)}</h2>
      <div class="col" style="gap:12px">
        <div class="row"><span class="av center" style="width:36px;height:36px;border-radius:11px;background:rgba(255,255,255,.06)">${icon('pin')}</span>
          <span class="grow t-sm">${esc(BRANCH.addressAr)}</span></div>
        <div class="row"><span class="av center" style="width:36px;height:36px;border-radius:11px;background:rgba(255,255,255,.06)">${icon('phone')}</span>
          <a class="grow t-sm num" href="tel:${BRANCH.phone}" dir="ltr">${BRANCH.phoneDisplay}</a></div>
      </div>

      <div class="divider"></div>
      <b class="t-sm">${icon('clock')} أوقات الدوام</b>
      <div class="mt2">
        ${BRANCH.hours.map((h, i) => `
          <div class="between t-sm" style="padding:5px 0;${i === today ? 'color:var(--clay-300);font-weight:600' : ''}">
            <span>${h.ar}${i === today ? ' · اليوم' : ''}</span>
            <span class="num" dir="ltr">${h.open} – ${h.close}</span>
          </div>`).join('')}
      </div>

      <div class="row mt6" style="gap:10px">
        <a class="btn btn-gold grow" href="${BRANCH.map}" target="_blank" rel="noopener">${icon('pin')} الموقع على الخريطة</a>
        <a class="btn btn-ghost" href="tel:${BRANCH.phone}">${icon('phone')}</a>
      </div>
      <div class="row mt2" style="gap:10px">
        <a class="btn btn-ghost btn-sm grow" href="${BRANCH.instagram}" target="_blank" rel="noopener">إنستغرام</a>
        <a class="btn btn-ghost btn-sm grow" href="${BRANCH.facebook}" target="_blank" rel="noopener">فيسبوك</a>
      </div>
    </div>`);
}

/* ── انطلق ───────────────────────────────────────────────────────────── */
render();
setInterval(() => { if (tab === 'orders' || tab === 'service') render(); }, 20000);
