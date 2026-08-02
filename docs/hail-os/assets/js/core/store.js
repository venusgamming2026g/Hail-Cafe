/* ==========================================================================
   HAIL OS — محرّك الحالة
   مصدر واحد للحقيقة، يُحفظ محلياً ويتزامن لحظياً بين كل الشاشات المفتوحة.
   كل تعديل يمرّ عبر commit(): يعيد قراءة أحدث حالة ثم يكتب ثم يبثّ.
   ========================================================================== */

import { uid, orderCode, sum, LS } from './util.js';
import { items as MENU_ITEMS, categories as MENU_CATS, byId as MENU_BY_ID, TAX_RATE } from '../data/menu.js';

const KEY = 'hailos:state:v1';
const CHANNEL = 'hailos:sync';

/* ── الإعدادات الافتراضية ────────────────────────────────────────────── */
export const DEFAULT_SETTINGS = {
  brandAr: 'هيل كافيه',
  brandEn: 'Hail Cafe',
  taxRate: TAX_RATE,          // ضريبة المبيعات 7% كما في المنيو الرسمي
  serviceRate: 0.10,          // خدمة اختيارية على الصالة
  serviceEnabled: true,
  currency: 'د.أ',
  theme: 'night',
  sound: true,
  soundVolume: 0.6,
  desktopNotify: false,
  autoAccept: false,          // قبول الطلبات تلقائياً بدل مراجعة الكاشير
  lateAfterMin: 12,           // بعدها يُعتبر الطلب متأخراً في المطبخ
  urgentAfterMin: 18,
  serviceSlaMin: 3,           // مهلة الاستجابة لنداء الطاولة
  language: 'ar',
  showCalories: false,
  allowTakeaway: true,
  allowDelivery: true,
  deliveryFee: 1500,
  minOrder: 0,
  openTablesCount: 24,
  demoMode: true,
};

export const ORDER_STATUS = {
  pending:   { ar: 'بانتظار القبول', color: 'info',  next: 'accepted' },
  accepted:  { ar: 'مقبول',          color: 'info',  next: 'preparing' },
  preparing: { ar: 'قيد التحضير',    color: 'warn',  next: 'ready' },
  ready:     { ar: 'جاهز للتقديم',   color: 'ok',    next: 'served' },
  served:    { ar: 'تم التقديم',     color: 'ok',    next: null },
  cancelled: { ar: 'ملغى',           color: 'bad',   next: null },
};

export const SERVICE_TYPES = {
  waiter:  { ar: 'طلب النادل',      icon: 'bell',    priority: 2 },
  water:   { ar: 'طلب ماء',         icon: 'bottle',  priority: 3 },
  cutlery: { ar: 'أدوات مائدة',     icon: 'chef',    priority: 3 },
  clean:   { ar: 'تنظيف الطاولة',   icon: 'sparkle', priority: 3 },
  bill:    { ar: 'طلب الفاتورة',    icon: 'receipt', priority: 1 },
  coal:    { ar: 'تبديل فحم',       icon: 'flame',   priority: 2 },
};

export const SERVICE_STATUS = {
  open:    { ar: 'نداء جديد',   color: 'bad'  },
  seen:    { ar: 'تم الاطلاع',  color: 'warn' },
  onway:   { ar: 'في الطريق',   color: 'info' },
  done:    { ar: 'تم',          color: 'ok'   },
};

export const ROLES = {
  manager: { ar: 'مدير',  surfaces: ['admin', 'cashier', 'floor', 'kds'] },
  cashier: { ar: 'كاشير', surfaces: ['cashier', 'floor'] },
  waiter:  { ar: 'نادل',  surfaces: ['floor'] },
  chef:    { ar: 'شيف',   surfaces: ['kds'] },
  barista: { ar: 'باريستا', surfaces: ['kds'] },
};

/* ── حالة فارغة ──────────────────────────────────────────────────────── */
function emptyState() {
  return {
    v: 1,
    version: 0,
    seeded: false,
    settings: { ...DEFAULT_SETTINGS },
    tables: [],
    sessions: [],
    orders: [],
    services: [],
    payments: [],
    staff: [],
    inventory: [],
    reservations: [],
    menuOverrides: {},
    events: [],
    counters: { orderSeq: 1000 },
    startedAt: Date.now(),
  };
}

/* ── الحالة الحيّة في هذا التبويب ────────────────────────────────────── */
let state = LS.get(KEY, null) || emptyState();
const listeners = new Set();

/* قناة المزامنة بين التبويبات */
let channel = null;
try { channel = new BroadcastChannel(CHANNEL); } catch { channel = null; }

function persist() { LS.set(KEY, state); }

function broadcast(action) {
  const msg = { version: state.version, action, from: TAB_ID, at: Date.now() };
  if (channel) { try { channel.postMessage(msg); } catch { /* تجاهل */ } }
  /* احتياط للمتصفحات بدون BroadcastChannel */
  try { localStorage.setItem('hailos:ping', JSON.stringify(msg)); } catch { /* تجاهل */ }
}

export const TAB_ID = uid('tab');

function emit(action, payload) {
  for (const fn of listeners) {
    try { fn(state, action, payload); } catch (err) { console.error('[hail-os] listener', err); }
  }
}

/* الاستقبال من التبويبات الأخرى */
function receive(msg) {
  if (!msg || msg.from === TAB_ID) return;
  const fresh = LS.get(KEY, null);
  if (!fresh || fresh.version === state.version) return;
  state = fresh;
  emit(msg.action || 'sync', { remote: true });
}
if (channel) channel.onmessage = (e) => receive(e.data);
window.addEventListener('storage', (e) => {
  if (e.key === 'hailos:ping' && e.newValue) {
    try { receive(JSON.parse(e.newValue)); } catch { /* تجاهل */ }
  }
  if (e.key === KEY) receive({ action: 'sync', from: 'storage' });
});

/* ── العقد الأساسي ───────────────────────────────────────────────────── */
export function get() { return state; }

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/**
 * كل تغيير في النظام يمرّ من هنا.
 * يعيد قراءة أحدث نسخة من التخزين أولاً حتى لا تدهس شاشة نتيجة شاشة أخرى.
 */
export function commit(action, mutate, meta = {}) {
  const latest = LS.get(KEY, null);
  if (latest && latest.version >= state.version) state = latest;
  const result = mutate(state);
  state.version += 1;
  if (meta.log !== false) {
    state.events.unshift({
      id: uid('ev'), at: Date.now(), action,
      actor: meta.actor || currentActor(), text: meta.text || '',
      entity: meta.entity || '', entityId: meta.entityId || '',
    });
    if (state.events.length > 600) state.events.length = 600;
  }
  persist();
  emit(action, { ...meta, result });
  broadcast(action);
  return result;
}

/* ── هوية الشاشة الحالية ─────────────────────────────────────────────── */
export function currentActor() {
  const s = LS.get('hailos:actor', null);
  return s ? s.name : 'النظام';
}
export function setActor(staff) { LS.set('hailos:actor', staff); }
export function getActor() { return LS.get('hailos:actor', null); }
export function clearActor() { LS.del('hailos:actor'); }

/* ── المنيو مع تعديلات المدير ────────────────────────────────────────── */
export function menu() {
  const ov = state.menuOverrides || {};
  return MENU_ITEMS.map((it) => (ov[it.id] ? { ...it, ...ov[it.id] } : it));
}
export function menuItem(id) {
  const base = MENU_BY_ID.get(id);
  if (!base) return null;
  const ov = state.menuOverrides?.[id];
  return ov ? { ...base, ...ov } : base;
}
export const categories = () => MENU_CATS;

export function setMenuOverride(id, patch, actor) {
  return commit('menu.update', (s) => {
    s.menuOverrides[id] = { ...(s.menuOverrides[id] || {}), ...patch };
  }, { actor, entity: 'menu', entityId: id, text: `تعديل صنف ${menuItem(id)?.ar || id}` });
}

/* ── الحسابات المالية ────────────────────────────────────────────────── */
export function priceOf(line) {
  const base = line.price ?? menuItem(line.itemId)?.price ?? 0;
  const extra = sum(line.options || [], (o) => o.delta || 0);
  return (base + extra) * line.qty;
}

export function totalsFor(lines, opts = {}) {
  const s = state.settings;
  const subtotal = sum(lines, priceOf);
  const discount = opts.discount || 0;
  const base = Math.max(0, subtotal - discount);
  const service = opts.serviceEnabled ?? (s.serviceEnabled && opts.type === 'dine-in')
    ? Math.round(base * s.serviceRate) : 0;
  const tax = Math.round((base + service) * s.taxRate);
  const delivery = opts.type === 'delivery' ? s.deliveryFee : 0;
  return { subtotal, discount, service, tax, delivery, total: base + service + tax + delivery };
}

/* ── الطاولات والجلسات ───────────────────────────────────────────────── */
export function tableByNumber(n) { return state.tables.find((t) => t.number === Number(n)); }
export function openSessionForTable(n) {
  return state.sessions.find((x) => x.tableNumber === Number(n) && x.status === 'open');
}
export function sessionById(id) { return state.sessions.find((x) => x.id === id); }

export function openSession({ tableNumber, guests = 2, waiterId = null, actor }) {
  const existing = openSessionForTable(tableNumber);
  if (existing) return existing;
  let created;
  commit('session.open', (s) => {
    created = {
      id: uid('ses'),
      code: String(Math.floor(1000 + Math.random() * 9000)),
      tableNumber: Number(tableNumber),
      guests, waiterId, status: 'open',
      openedAt: Date.now(), closedAt: null,
      round: 0,
    };
    s.sessions.unshift(created);
    const t = s.tables.find((x) => x.number === Number(tableNumber));
    if (t) { t.status = 'seated'; t.sessionId = created.id; }
  }, { actor, entity: 'session', text: `فتح جلسة على الطاولة ${tableNumber}` });
  return created;
}

export function closeSession(sessionId, actor) {
  return commit('session.close', (s) => {
    const ses = s.sessions.find((x) => x.id === sessionId);
    if (!ses) return;
    ses.status = 'closed'; ses.closedAt = Date.now();
    const t = s.tables.find((x) => x.sessionId === sessionId);
    if (t) { t.status = 'dirty'; t.sessionId = null; }
    s.services.forEach((sv) => { if (sv.sessionId === sessionId && sv.status !== 'done') sv.status = 'done'; });
  }, { actor, entity: 'session', entityId: sessionId, text: 'إغلاق الجلسة' });
}

export function setTableStatus(number, status, actor) {
  return commit('table.status', (s) => {
    const t = s.tables.find((x) => x.number === Number(number));
    if (t) t.status = status;
  }, { actor, entity: 'table', entityId: String(number), text: `الطاولة ${number} → ${status}` });
}

export function sessionOrders(sessionId) {
  return state.orders.filter((o) => o.sessionId === sessionId && o.status !== 'cancelled');
}

export function sessionBill(sessionId) {
  const orders = sessionOrders(sessionId);
  const lines = orders.flatMap((o) => o.lines);
  const paid = state.payments.filter((p) => p.sessionId === sessionId);
  const t = totalsFor(lines, { type: 'dine-in' });
  const paidAmount = sum(paid, (p) => p.amount);
  /* الخصم يُسقط جزءاً من المستحق تماماً كالمبلغ المحصّل */
  const discounted = sum(paid, (p) => p.discount || 0);
  const settled = paidAmount + discounted;
  return {
    ...t, orders, lines, paid, paidAmount, discounted, settled,
    due: Math.max(0, t.total - settled),
  };
}

export function sessionPayerBills(sessionId) {
  const orders = sessionOrders(sessionId);
  const payments = state.payments.filter((p) => p.sessionId === sessionId);
  const groups = new Map();

  for (const order of orders) {
    const payerName = String(order.customer?.name || '').trim() || 'حساب الطاولة';
    if (!groups.has(payerName)) groups.set(payerName, []);
    groups.get(payerName).push(order);
  }

  const payerBills = [...groups.entries()].map(([name, payerOrders]) => {
    const orderIds = payerOrders.map((order) => order.id);
    const lines = payerOrders.flatMap((order) => order.lines);
    const totals = totalsFor(lines, { type: 'dine-in' });
    const payerPayments = payments.filter((payment) => {
      if (payment.payerName) return payment.payerName === name;
      const paidOrders = payment.orderIds || [];
      return paidOrders.length > 0 && paidOrders.every((id) => orderIds.includes(id));
    });
    const paidAmount = sum(payerPayments, (payment) => payment.amount);
    const discounted = sum(payerPayments, (payment) => payment.discount || 0);
    const settled = paidAmount + discounted;
    return {
      name,
      orders: payerOrders,
      orderIds,
      lines,
      paid: payerPayments,
      paidAmount,
      discounted,
      settled,
      ...totals,
      due: Math.max(0, totals.total - settled),
    };
  });

  const assignedPaymentIds = new Set(payerBills.flatMap((bill) => bill.paid.map((payment) => payment.id)));
  let generalSettled = sum(
    payments.filter((payment) => !assignedPaymentIds.has(payment.id)),
    (payment) => payment.amount + (payment.discount || 0),
  );
  for (const bill of payerBills) {
    if (generalSettled <= 0) break;
    const applied = Math.min(bill.due, generalSettled);
    bill.settled += applied;
    bill.due -= applied;
    generalSettled -= applied;
  }
  return payerBills;
}

/* ── الطلبات ─────────────────────────────────────────────────────────── */
export function placeOrder({ lines, type = 'dine-in', tableNumber = null, sessionId = null,
                             customer = {}, note = '', actor, source = 'qr' }) {
  if (!lines || !lines.length) return null;
  let created;
  commit('order.place', (s) => {
    s.counters.orderSeq += 1;
    const seq = s.counters.orderSeq;
    const ses = sessionId ? s.sessions.find((x) => x.id === sessionId) : null;
    if (ses) ses.round += 1;
    const totals = totalsFor(lines, { type });
    created = {
      id: uid('ord'),
      seq, code: orderCode(seq),
      type, source,
      tableNumber: tableNumber ? Number(tableNumber) : null,
      sessionId,
      round: ses ? ses.round : 1,
      customer: { name: customer.name || '', phone: customer.phone || '', address: customer.address || '' },
      note,
      lines: lines.map((l) => ({
        lid: uid('ln'),
        itemId: l.itemId, ar: l.ar, en: l.en, qty: l.qty,
        price: l.price, station: l.station, prep: l.prep,
        options: l.options || [], note: l.note || '',
        status: 'pending',
      })),
      ...totals,
      status: s.settings.autoAccept ? 'accepted' : 'pending',
      placedAt: Date.now(),
      acceptedAt: s.settings.autoAccept ? Date.now() : null,
      readyAt: null, servedAt: null,
      timeline: [{ at: Date.now(), status: 'pending', by: actor || 'الزبون' }],
      paid: false,
    };
    if (s.settings.autoAccept) created.timeline.push({ at: Date.now(), status: 'accepted', by: 'تلقائي' });
    s.orders.unshift(created);
    /* خصم المخزون المرتبط */
    for (const line of created.lines) {
      for (const inv of s.inventory) {
        const link = (inv.links || []).find((l) => l.itemId === line.itemId);
        if (link) inv.qty = Math.max(0, +(inv.qty - link.per * line.qty).toFixed(2));
      }
    }
  }, { actor: actor || 'الزبون', entity: 'order', text: `طلب جديد ${type === 'dine-in' ? `طاولة ${tableNumber}` : type}` });
  return created;
}

export function setOrderStatus(orderId, status, actor) {
  return commit('order.status', (s) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o || o.status === status) return;
    o.status = status;
    o.timeline.push({ at: Date.now(), status, by: actor || currentActor() });
    if (status === 'accepted')  o.acceptedAt = Date.now();
    if (status === 'ready')     o.readyAt = Date.now();
    if (status === 'served')    o.servedAt = Date.now();
    if (status === 'preparing') o.lines.forEach((l) => { if (l.status === 'pending') l.status = 'preparing'; });
    if (status === 'ready')     o.lines.forEach((l) => { if (l.status !== 'cancelled') l.status = 'ready'; });
    if (status === 'served')    o.lines.forEach((l) => { if (l.status !== 'cancelled') l.status = 'served'; });
  }, { actor, entity: 'order', entityId: orderId, text: `الطلب → ${ORDER_STATUS[status]?.ar || status}` });
}

/** تعيين اسم صاحب الطلب — أساس تقسيم الفاتورة بالأسماء */
export function setOrderPayerName(orderId, name, actor) {
  const cleaned = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  return commit('order.payer', (s) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o) return;
    if (!o.customer) o.customer = { name: '', phone: '', address: '' };
    o.customer.name = cleaned;
  }, {
    actor: actor || currentActor(),
    entity: 'order',
    entityId: orderId,
    text: cleaned ? `تعيين الحساب: ${cleaned}` : 'إرجاع الطلب لحساب الطاولة',
  });
}

export function setLineStatus(orderId, lid, status, actor) {
  return commit('order.line', (s) => {
    const o = s.orders.find((x) => x.id === orderId);
    const l = o?.lines.find((x) => x.lid === lid);
    if (!l) return;
    l.status = status;
    const active = o.lines.filter((x) => x.status !== 'cancelled');
    if (active.length && active.every((x) => x.status === 'ready' || x.status === 'served')) {
      if (o.status !== 'served' && o.status !== 'ready') {
        o.status = 'ready'; o.readyAt = Date.now();
        o.timeline.push({ at: Date.now(), status: 'ready', by: 'المطبخ' });
      }
    } else if (active.some((x) => x.status === 'preparing') && o.status === 'accepted') {
      o.status = 'preparing';
      o.timeline.push({ at: Date.now(), status: 'preparing', by: 'المطبخ' });
    }
  }, { actor, entity: 'order', entityId: orderId, log: false });
}

export function addLinesToOrder(orderId, lines, actor) {
  return commit('order.append', (s) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o) return;
    o.lines.push(...lines.map((l) => ({ lid: uid('ln'), ...l, status: 'pending' })));
    Object.assign(o, totalsFor(o.lines, { type: o.type }));
  }, { actor, entity: 'order', entityId: orderId, text: 'إضافة أصناف للطلب' });
}

export function cancelOrder(orderId, reason, actor) {
  return commit('order.cancel', (s) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o) return;
    o.status = 'cancelled';
    o.cancelReason = reason || '';
    o.timeline.push({ at: Date.now(), status: 'cancelled', by: actor || currentActor(), note: reason });
  }, { actor, entity: 'order', entityId: orderId, text: `إلغاء الطلب — ${reason || 'بدون سبب'}` });
}

export const activeOrders = () =>
  state.orders.filter((o) => !['served', 'cancelled'].includes(o.status));

export const kitchenQueue = (stations = null) =>
  state.orders
    .filter((o) => ['accepted', 'preparing', 'pending'].includes(o.status))
    .map((o) => ({ ...o, lines: stations ? o.lines.filter((l) => stations.includes(l.station)) : o.lines }))
    .filter((o) => o.lines.length)
    .sort((a, b) => a.placedAt - b.placedAt);

/* ── نداءات الخدمة ───────────────────────────────────────────────────── */
export function callService({ sessionId, tableNumber, type, note = '', actor }) {
  const dup = state.services.find(
    (x) => x.tableNumber === Number(tableNumber) && x.type === type && x.status !== 'done');
  if (dup) return dup;
  let created;
  commit('service.call', (s) => {
    created = {
      id: uid('sv'), sessionId, tableNumber: Number(tableNumber), type, note,
      status: 'open', createdAt: Date.now(),
      timeline: [{ at: Date.now(), status: 'open', by: actor || 'الزبون' }],
    };
    s.services.unshift(created);
  }, { actor: actor || 'الزبون', entity: 'service', text: `${SERVICE_TYPES[type]?.ar || type} — طاولة ${tableNumber}` });
  return created;
}

export function setServiceStatus(id, status, actor) {
  return commit('service.status', (s) => {
    const sv = s.services.find((x) => x.id === id);
    if (!sv) return;
    sv.status = status;
    sv.timeline.push({ at: Date.now(), status, by: actor || currentActor() });
    if (status === 'done') sv.doneAt = Date.now();
  }, { actor, entity: 'service', entityId: id, text: `نداء → ${SERVICE_STATUS[status]?.ar || status}` });
}

export const openServices = () => state.services.filter((x) => x.status !== 'done');

/* ── الدفع ───────────────────────────────────────────────────────────── */
export function pay({ sessionId = null, orderIds = [], method = 'cash', amount, tip = 0,
                      discount = 0, actor, splitOf = null, payerName = '' }) {
  let created;
  commit('payment.take', (s) => {
    created = {
      id: uid('pay'), sessionId, orderIds, method, amount, tip, discount,
      at: Date.now(), by: actor || currentActor(), splitOf, payerName,
    };
    s.payments.unshift(created);
    orderIds.forEach((oid) => { const o = s.orders.find((x) => x.id === oid); if (o) o.paid = true; });
  }, { actor, entity: 'payment', text: `تحصيل ${(amount / 1000).toFixed(2)} د.أ (${method})` });
  return created;
}

/* ── الطاقم ──────────────────────────────────────────────────────────── */
export function addStaff(person, actor) {
  return commit('staff.add', (s) => {
    s.staff.push({ id: uid('st'), active: true, ...person });
  }, { actor, entity: 'staff', text: `إضافة ${person.name}` });
}
export function updateStaff(id, patch, actor) {
  return commit('staff.update', (s) => {
    const st = s.staff.find((x) => x.id === id);
    if (st) Object.assign(st, patch);
  }, { actor, entity: 'staff', entityId: id, text: 'تعديل بيانات موظف' });
}
export function staffByPin(pin) { return state.staff.find((x) => x.pin === String(pin) && x.active); }

/* ── المخزون ─────────────────────────────────────────────────────────── */
export function updateInventory(id, patch, actor) {
  return commit('inventory.update', (s) => {
    const inv = s.inventory.find((x) => x.id === id);
    if (inv) Object.assign(inv, patch);
  }, { actor, entity: 'inventory', entityId: id, text: 'تعديل المخزون' });
}
export const lowStock = () => state.inventory.filter((i) => i.qty <= i.min);

/* ── الإعدادات ───────────────────────────────────────────────────────── */
export function updateSettings(patch, actor) {
  return commit('settings.update', (s) => { Object.assign(s.settings, patch); },
    { actor, entity: 'settings', text: 'تحديث الإعدادات' });
}

/* ── الحجوزات ────────────────────────────────────────────────────────── */
export function addReservation(r, actor) {
  return commit('reservation.add', (s) => {
    s.reservations.unshift({ id: uid('rs'), status: 'confirmed', createdAt: Date.now(), ...r });
  }, { actor, entity: 'reservation', text: `حجز باسم ${r.name}` });
}

/* ── التقارير ────────────────────────────────────────────────────────── */
export function reportFor(fromTs = startOfToday(), toTs = Date.now()) {
  const orders = state.orders.filter((o) => o.placedAt >= fromTs && o.placedAt <= toTs && o.status !== 'cancelled');
  const cancelled = state.orders.filter((o) => o.placedAt >= fromTs && o.status === 'cancelled');
  const revenue = sum(orders, (o) => o.total);
  const net = sum(orders, (o) => o.subtotal);
  const lines = orders.flatMap((o) => o.lines);
  const qty = sum(lines, (l) => l.qty);

  const byItem = {};
  for (const l of lines) {
    byItem[l.itemId] ||= { itemId: l.itemId, ar: l.ar, qty: 0, revenue: 0 };
    byItem[l.itemId].qty += l.qty;
    byItem[l.itemId].revenue += (l.price || 0) * l.qty;
  }
  const top = Object.values(byItem).sort((a, b) => b.qty - a.qty);

  const byCat = {};
  for (const l of lines) {
    const cat = MENU_BY_ID.get(l.itemId)?.categoryId || 'other';
    byCat[cat] ||= { cat, qty: 0, revenue: 0 };
    byCat[cat].qty += l.qty;
    byCat[cat].revenue += (l.price || 0) * l.qty;
  }

  const byHour = Array.from({ length: 24 }, (_, h) => ({ h, orders: 0, revenue: 0 }));
  for (const o of orders) {
    const h = new Date(o.placedAt).getHours();
    byHour[h].orders += 1; byHour[h].revenue += o.total;
  }

  const served = orders.filter((o) => o.servedAt && o.acceptedAt);
  const avgPrep = served.length
    ? Math.round(sum(served, (o) => o.servedAt - o.acceptedAt) / served.length / 60000) : 0;

  const svc = state.services.filter((x) => x.createdAt >= fromTs);
  const svcDone = svc.filter((x) => x.doneAt);
  const avgService = svcDone.length
    ? Math.round(sum(svcDone, (x) => x.doneAt - x.createdAt) / svcDone.length / 60000) : 0;

  return {
    orders, cancelled, revenue, net, qty, top,
    byCat: Object.values(byCat).sort((a, b) => b.revenue - a.revenue),
    byHour,
    avgTicket: orders.length ? Math.round(revenue / orders.length) : 0,
    avgPrep, avgService,
    covers: sum(state.sessions.filter((s) => s.openedAt >= fromTs), (s) => s.guests),
    byType: {
      'dine-in':  orders.filter((o) => o.type === 'dine-in').length,
      takeaway:   orders.filter((o) => o.type === 'takeaway').length,
      delivery:   orders.filter((o) => o.type === 'delivery').length,
    },
  };
}

export function startOfToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}

/* ── إدارة البيانات ──────────────────────────────────────────────────── */
export function replaceState(next) {
  state = { ...emptyState(), ...next, version: (state.version || 0) + 1 };
  persist(); emit('state.replace', {}); broadcast('state.replace');
}
export function resetAll() { replaceState(emptyState()); }
export function exportState() { return JSON.stringify(state, null, 2); }
export function importState(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  replaceState(parsed);
}

export { KEY as STATE_KEY };
