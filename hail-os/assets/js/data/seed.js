/* ==========================================================================
   HAIL OS — بذرة الديمو
   تبني مطعماً يعمل فعلاً: طاولات مشغولة، طلبات في المطبخ، نداءات خدمة،
   ومبيعات موزّعة على ساعات اليوم حتى تظهر التحليلات بأرقام حقيقية.
   ========================================================================== */

import { items as MENU, byId } from './menu.js';
import * as store from '../core/store.js';
import { uid, orderCode } from '../core/util.js';

/* ── الطاولات ────────────────────────────────────────────────────────── */
const ZONES = [
  { id: 'indoor',  ar: 'الصالة الداخلية', from: 1,  to: 10, seats: 4 },
  { id: 'terrace', ar: 'التراس',          from: 11, to: 18, seats: 4 },
  { id: 'family',  ar: 'قسم العائلات',    from: 19, to: 22, seats: 6 },
  { id: 'vip',     ar: 'الجلسات المميّزة', from: 23, to: 24, seats: 8 },
];

function buildTables() {
  const out = [];
  for (const z of ZONES) {
    for (let n = z.from; n <= z.to; n++) {
      out.push({
        id: `t${n}`, number: n, zone: z.id, zoneAr: z.ar,
        seats: n % 5 === 0 ? z.seats + 2 : z.seats,
        status: 'free', sessionId: null,
      });
    }
  }
  return out;
}
export const TABLE_ZONES = ZONES;

/* ── الطاقم ──────────────────────────────────────────────────────────── */
const STAFF = [
  { name: 'أحمد الخطيب',  role: 'manager', pin: '1111', phone: '0790000001' },
  { name: 'سارة العمري',  role: 'cashier', pin: '2222', phone: '0790000002' },
  { name: 'محمود الزعبي', role: 'waiter',  pin: '3333', phone: '0790000003' },
  { name: 'ليان القضاة',  role: 'waiter',  pin: '3434', phone: '0790000004' },
  { name: 'عمر الشوابكة', role: 'chef',    pin: '4444', phone: '0790000005' },
  { name: 'رنا حدّاد',     role: 'barista', pin: '5555', phone: '0790000006' },
];

/* ── المخزون ─────────────────────────────────────────────────────────── */
const INVENTORY = [
  { name: 'صدور دجاج',        unit: 'كغم', qty: 18,  min: 8,  cost: 4200, links: [
      { itemId: 'main-grilled-chicken', per: 0.3 }, { itemId: 'burger-grilled-chicken', per: 0.18 },
      { itemId: 'addon-chicken', per: 0.12 }, { itemId: 'main-butter-chicken', per: 0.28 } ] },
  { name: 'لحم بقري',          unit: 'كغم', qty: 9.5, min: 6,  cost: 11500, links: [
      { itemId: 'main-beef-steak', per: 0.32 }, { itemId: 'burger-classic', per: 0.16 },
      { itemId: 'main-black-pepper-beef', per: 0.28 } ] },
  { name: 'جبنة موزاريلا',     unit: 'كغم', qty: 6.2, min: 5,  cost: 6800, links: [
      { itemId: 'pizza-hail', per: 0.16 }, { itemId: 'pizza-margherita', per: 0.15 },
      { itemId: 'pizza-pepperoni', per: 0.15 }, { itemId: 'pizza-vegetable', per: 0.15 } ] },
  { name: 'حبوب قهوة مختصة',   unit: 'كغم', qty: 3.1, min: 4,  cost: 15000, links: [
      { itemId: 'hot-cappuccino', per: 0.018 }, { itemId: 'hot-americano', per: 0.018 },
      { itemId: 'special-v60', per: 0.022 }, { itemId: 'iced-latte', per: 0.02 } ] },
  { name: 'حليب طازج',         unit: 'لتر', qty: 24,  min: 12, cost: 900,  links: [
      { itemId: 'hot-cappuccino', per: 0.18 }, { itemId: 'milkshake-lotus', per: 0.25 },
      { itemId: 'hot-spanish-latte', per: 0.2 } ] },
  { name: 'فراولة',            unit: 'كغم', qty: 4.4, min: 3,  cost: 2600, links: [
      { itemId: 'juice-strawberry', per: 0.22 }, { itemId: 'smoothie-strawberry', per: 0.2 } ] },
  { name: 'مانجا',             unit: 'كغم', qty: 2.1, min: 3,  cost: 3100, links: [
      { itemId: 'juice-mango', per: 0.24 }, { itemId: 'smoothie-mango', per: 0.22 } ] },
  { name: 'روبيان (شريمب)',    unit: 'كغم', qty: 5.0, min: 3,  cost: 14500, links: [
      { itemId: 'hot-dynamite-shrimp', per: 0.2 }, { itemId: 'addon-shrimp', per: 0.15 },
      { itemId: 'main-classic-seafood', per: 0.34 } ] },
  { name: 'معسل تفاحتين',      unit: 'علبة', qty: 11, min: 6,  cost: 2400, links: [
      { itemId: 'hookah-double-apple-nakhla', per: 0.34 }, { itemId: 'hookah-double-apple-mazaya', per: 0.34 } ] },
  { name: 'فحم طبيعي',         unit: 'كغم', qty: 14,  min: 10, cost: 1200, links: [
      { itemId: 'hookah-hail-mix', per: 0.25 } ] },
  { name: 'طحين',              unit: 'كغم', qty: 32,  min: 15, cost: 700,  links: [] },
  { name: 'زيت زيتون',         unit: 'لتر', qty: 7.5, min: 5,  cost: 5400, links: [] },
];

/* ── مولّدات عشوائية خفيفة ───────────────────────────────────────────── */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const NAMES = ['أبو خالد', 'ريم', 'يوسف', 'دانا', 'مهند', 'لينا', 'زيد', 'هبة', 'كرم', 'نور'];

function lineFrom(item, qty = 1, note = '') {
  return {
    lid: uid('ln'), itemId: item.id, ar: item.ar, en: item.en, qty,
    price: item.price, station: item.station, prep: item.prep,
    options: [], note, status: 'pending',
  };
}

/* أصناف واقعية حسب وقت اليوم */
function basketFor(hour) {
  const pool = hour < 12
    ? MENU.filter((m) => ['breakfast', 'hot-drinks', 'juices', 'special-coffee'].includes(m.categoryId))
    : hour < 17
      ? MENU.filter((m) => ['salads', 'sandwiches', 'burgers', 'pasta', 'pizza', 'iced-coffee', 'juices', 'mains'].includes(m.categoryId))
      : MENU.filter((m) => ['mains', 'hot-appetizers', 'pizza', 'burgers', 'hookah', 'mojito', 'sweets', 'frappe', 'milkshakes'].includes(m.categoryId));
  const n = rand(1, 4);
  const lines = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const it = pick(pool);
    if (used.has(it.id)) continue;
    used.add(it.id);
    lines.push(lineFrom(it, rand(1, 2)));
  }
  return lines.length ? lines : [lineFrom(pick(pool))];
}

/* ── البناء ──────────────────────────────────────────────────────────── */
export function seed({ force = false } = {}) {
  const s = store.get();
  if (s.seeded && !force) return false;

  const now = new Date();
  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  const startHour = 10;
  const curHour = Math.max(startHour + 1, now.getHours());

  const tables = buildTables();
  const staff = STAFF.map((p) => ({ id: uid('st'), active: true, ...p }));
  const inventory = INVENTORY.map((i) => ({ id: uid('inv'), ...i }));
  const waiters = staff.filter((x) => x.role === 'waiter');

  const orders = [];
  const sessions = [];
  const services = [];
  const payments = [];
  const events = [];
  let seq = 1000;

  const settings = { ...store.DEFAULT_SETTINGS };
  const totals = (lines, type) => {
    const subtotal = lines.reduce((t, l) => t + l.price * l.qty, 0);
    const service = type === 'dine-in' && settings.serviceEnabled ? Math.round(subtotal * settings.serviceRate) : 0;
    const tax = Math.round((subtotal + service) * settings.taxRate);
    const delivery = type === 'delivery' ? settings.deliveryFee : 0;
    return { subtotal, discount: 0, service, tax, delivery, total: subtotal + service + tax + delivery };
  };

  /* ①  سجلّ المبيعات — أمس كاملاً (للمقارنة) واليوم حتى هذه الساعة */
  const historySpans = [
    { day0: today0.getTime() - 86400e3, from: startHour, to: 24 },   // أمس كاملاً
    { day0: today0.getTime(),           from: startHour, to: curHour }, // اليوم حتى الآن
  ];
  for (const span of historySpans) for (let h = span.from; h < span.to; h++) {
    const load = h < 12 ? rand(1, 3) : h < 16 ? rand(2, 5) : rand(4, 8);
    for (let k = 0; k < load; k++) {
      const at = span.day0 + h * 3600e3 + rand(0, 59) * 60e3;
      const type = Math.random() < 0.72 ? 'dine-in' : Math.random() < 0.6 ? 'takeaway' : 'delivery';
      const lines = basketFor(h).map((l) => ({ ...l, status: 'served' }));
      const t = totals(lines, type);
      seq += 1;
      const accepted = at + rand(20, 90) * 1000;
      const ready = accepted + rand(6, 17) * 60e3;
      const served = ready + rand(1, 4) * 60e3;
      const tableNumber = type === 'dine-in' ? rand(1, 24) : null;
      const o = {
        id: uid('ord'), seq, code: orderCode(seq), type, source: Math.random() < 0.75 ? 'qr' : 'cashier',
        tableNumber, sessionId: null, round: 1,
        customer: { name: type === 'dine-in' ? '' : pick(NAMES), phone: '', address: '' },
        note: '', lines, ...t, status: 'served',
        placedAt: at, acceptedAt: accepted, readyAt: ready, servedAt: served,
        timeline: [
          { at, status: 'pending', by: 'الزبون' },
          { at: accepted, status: 'accepted', by: 'الكاشير' },
          { at: accepted + 30e3, status: 'preparing', by: 'المطبخ' },
          { at: ready, status: 'ready', by: 'المطبخ' },
          { at: served, status: 'served', by: pick(waiters).name },
        ],
        paid: true,
      };
      orders.push(o);
      payments.push({
        id: uid('pay'), sessionId: null, orderIds: [o.id],
        method: Math.random() < 0.55 ? 'cash' : Math.random() < 0.7 ? 'card' : 'wallet',
        amount: t.total, tip: Math.random() < 0.3 ? rand(1, 3) * 500 : 0,
        at: served + 60e3, by: 'سارة العمري', splitOf: null,
      });
    }
  }

  /* ②  اللحظة الحالية — طاولات مفتوحة وطلبات حيّة في المطبخ */
  const liveTables = [3, 7, 12, 19, 23];
  liveTables.forEach((num, i) => {
    const ses = {
      id: uid('ses'), code: String(rand(1000, 9999)), tableNumber: num,
      guests: num >= 19 ? rand(4, 6) : rand(2, 4),
      waiterId: waiters[i % waiters.length].id, status: 'open',
      openedAt: Date.now() - rand(12, 65) * 60e3, closedAt: null, round: 0,
    };
    sessions.push(ses);
    const t = tables.find((x) => x.number === num);
    t.status = 'seated'; t.sessionId = ses.id;

    const rounds = i < 2 ? 2 : 1;
    for (let r = 1; r <= rounds; r++) {
      ses.round = r;
      const lines = basketFor(curHour);
      const tt = totals(lines, 'dine-in');
      seq += 1;
      /* توزيع الحالات: بانتظار القبول / قيد التحضير / جاهز / تم التقديم */
      const stage = r < rounds ? 'served' : ['pending', 'preparing', 'preparing', 'ready'][i % 4];
      const placedAt = Date.now() - (stage === 'pending' ? rand(10, 90) * 1000
        : stage === 'preparing' ? rand(4, 16) * 60e3 : rand(14, 26) * 60e3);
      const timeline = [{ at: placedAt, status: 'pending', by: 'الزبون' }];
      let acceptedAt = null, readyAt = null, servedAt = null;
      if (stage !== 'pending') {
        acceptedAt = placedAt + 40e3;
        timeline.push({ at: acceptedAt, status: 'accepted', by: 'الكاشير' });
        timeline.push({ at: acceptedAt + 25e3, status: 'preparing', by: 'المطبخ' });
      }
      if (stage === 'ready' || stage === 'served') {
        readyAt = placedAt + rand(9, 15) * 60e3;
        timeline.push({ at: readyAt, status: 'ready', by: 'المطبخ' });
      }
      if (stage === 'served') {
        servedAt = readyAt + 2 * 60e3;
        timeline.push({ at: servedAt, status: 'served', by: pick(waiters).name });
      }
      const lineStatus = stage === 'pending' ? 'pending'
        : stage === 'preparing' ? (Math.random() < 0.4 ? 'ready' : 'preparing')
        : stage === 'ready' ? 'ready' : 'served';
      orders.push({
        id: uid('ord'), seq, code: orderCode(seq), type: 'dine-in', source: 'qr',
        tableNumber: num, sessionId: ses.id, round: r,
        customer: { name: '', phone: '', address: '' }, note: r === 1 && i === 1 ? 'بدون بصل من فضلكم' : '',
        lines: lines.map((l) => ({ ...l, status: lineStatus })),
        ...tt, status: stage, placedAt, acceptedAt, readyAt, servedAt, timeline, paid: false,
      });
    }
  });

  /* طاولات محجوزة وأخرى تحتاج تنظيفاً */
  [5, 16].forEach((n) => { tables.find((t) => t.number === n).status = 'reserved'; });
  [9].forEach((n) => { tables.find((t) => t.number === n).status = 'dirty'; });

  /* ③  نداءات خدمة مفتوحة */
  const calls = [
    { tableNumber: 7,  type: 'bill',    ago: 2.4, status: 'open' },
    { tableNumber: 12, type: 'water',   ago: 1.1, status: 'open' },
    { tableNumber: 23, type: 'coal',    ago: 5.6, status: 'seen' },
    { tableNumber: 3,  type: 'waiter',  ago: 0.4, status: 'open' },
  ];
  for (const c of calls) {
    const ses = sessions.find((x) => x.tableNumber === c.tableNumber);
    const createdAt = Date.now() - c.ago * 60e3;
    services.push({
      id: uid('sv'), sessionId: ses?.id || null, tableNumber: c.tableNumber,
      type: c.type, note: '', status: c.status, createdAt,
      timeline: [{ at: createdAt, status: 'open', by: 'الزبون' }],
    });
  }

  /* نداءات مُنجزة سابقاً — تُغذّي مؤشر متوسط زمن الاستجابة */
  for (let i = 0; i < 6; i++) {
    const createdAt = Date.now() - rand(25, 180) * 60e3;
    const doneAt = createdAt + rand(1, 5) * 60e3;
    const num = pick(liveTables);
    services.push({
      id: uid('sv'), sessionId: sessions.find((x) => x.tableNumber === num)?.id || null,
      tableNumber: num, type: pick(['waiter', 'water', 'cutlery', 'clean']), note: '',
      status: 'done', createdAt, doneAt,
      timeline: [
        { at: createdAt, status: 'open', by: 'الزبون' },
        { at: createdAt + 30e3, status: 'onway', by: pick(waiters).name },
        { at: doneAt, status: 'done', by: pick(waiters).name },
      ],
    });
  }

  /* ④  طلبات سفري/توصيل قيد التنفيذ */
  for (let i = 0; i < 2; i++) {
    seq += 1;
    const lines = basketFor(curHour);
    const type = i === 0 ? 'takeaway' : 'delivery';
    const tt = totals(lines, type);
    const placedAt = Date.now() - rand(2, 9) * 60e3;
    orders.push({
      id: uid('ord'), seq, code: orderCode(seq), type, source: 'qr',
      tableNumber: null, sessionId: null, round: 1,
      customer: { name: pick(NAMES), phone: `079${rand(1000000, 9999999)}`, address: type === 'delivery' ? 'إربد — شارع الجامعة، عمارة 22' : '' },
      note: '', lines: lines.map((l) => ({ ...l, status: 'preparing' })),
      ...tt, status: 'preparing',
      placedAt, acceptedAt: placedAt + 30e3, readyAt: null, servedAt: null,
      timeline: [
        { at: placedAt, status: 'pending', by: 'الزبون' },
        { at: placedAt + 30e3, status: 'accepted', by: 'الكاشير' },
        { at: placedAt + 50e3, status: 'preparing', by: 'المطبخ' },
      ],
      paid: false,
    });
  }

  /* ⑤  حجوزات المساء */
  const reservations = [
    { id: uid('rs'), name: 'عائلة أبو رشيد', phone: '0791234567', guests: 6, at: today0.getTime() + 20 * 3600e3, tableNumber: 19, status: 'confirmed', note: 'قرب النافذة', createdAt: Date.now() },
    { id: uid('rs'), name: 'شركة الواحة',     phone: '0797654321', guests: 8, at: today0.getTime() + 21 * 3600e3, tableNumber: 24, status: 'confirmed', note: 'اجتماع عمل', createdAt: Date.now() },
  ];

  orders.sort((a, b) => b.placedAt - a.placedAt);
  events.push({
    id: uid('ev'), at: Date.now(), action: 'system.seed', actor: 'النظام',
    text: `تهيئة بيانات الديمو — ${orders.length} طلب و${sessions.length} جلسة مفتوحة`, entity: 'system', entityId: '',
  });

  store.replaceState({
    v: 1, version: 1, seeded: true, settings,
    tables, sessions, orders, services, payments, staff, inventory, reservations,
    menuOverrides: {
      /* أصناف نفدت فعلاً — تظهر معطّلة للزبون */
      'main-classic-seafood': { available: false },
      'sweet-tiramisu': { available: false },
    },
    events, counters: { orderSeq: seq }, startedAt: Date.now(),
  });
  return true;
}

/* ── محاكي حركة حيّة للعرض ───────────────────────────────────────────── */
let simTimer = null;

export function startSimulator(intervalMs = 22000) {
  if (simTimer) return false;
  simTimer = setInterval(() => {
    const s = store.get();
    const roll = Math.random();

    if (roll < 0.42) {
      /* طلب جديد من طاولة مفتوحة أو سفري */
      const open = s.sessions.filter((x) => x.status === 'open');
      const hour = new Date().getHours();
      const lines = basketFor(hour).map((l) => ({
        itemId: l.itemId, ar: l.ar, en: l.en, qty: l.qty,
        price: l.price, station: l.station, prep: l.prep, options: [], note: '',
      }));
      if (open.length && Math.random() < 0.75) {
        const ses = pick(open);
        store.placeOrder({ lines, type: 'dine-in', tableNumber: ses.tableNumber, sessionId: ses.id, source: 'qr' });
      } else {
        store.placeOrder({ lines, type: 'takeaway', customer: { name: pick(NAMES), phone: `079${rand(1000000, 9999999)}` }, source: 'qr' });
      }
    } else if (roll < 0.62) {
      /* نداء خدمة */
      const open = s.sessions.filter((x) => x.status === 'open');
      if (open.length) {
        const ses = pick(open);
        store.callService({
          sessionId: ses.id, tableNumber: ses.tableNumber,
          type: pick(['waiter', 'water', 'cutlery', 'bill', 'coal', 'clean']),
        });
      }
    } else if (roll < 0.84) {
      /* المطبخ يتقدّم بطلب */
      const cooking = s.orders.filter((o) => ['accepted', 'preparing'].includes(o.status));
      if (cooking.length) {
        const o = pick(cooking);
        store.setOrderStatus(o.id, o.status === 'accepted' ? 'preparing' : 'ready', 'المطبخ');
      }
    } else {
      /* النادل يقدّم طلباً جاهزاً */
      const ready = s.orders.filter((o) => o.status === 'ready');
      if (ready.length) store.setOrderStatus(pick(ready).id, 'served', 'الصالة');
    }
  }, intervalMs);
  return true;
}

export function stopSimulator() {
  clearInterval(simTimer); simTimer = null;
}
export const simulatorRunning = () => Boolean(simTimer);
