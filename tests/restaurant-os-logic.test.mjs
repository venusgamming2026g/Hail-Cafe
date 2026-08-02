import assert from "node:assert/strict";
import test from "node:test";

const memory = new Map();
const storage = {
  getItem(key) {
    return memory.has(key) ? memory.get(key) : null;
  },
  setItem(key, value) {
    memory.set(key, String(value));
  },
  removeItem(key) {
    memory.delete(key);
  },
  clear() {
    memory.clear();
  },
};

globalThis.localStorage = storage;
globalThis.sessionStorage = storage;
globalThis.window = { addEventListener() {} };
globalThis.BroadcastChannel = class {
  postMessage() {}
};

const store = await import(
  new URL("../hail-os/assets/js/core/store.js", import.meta.url)
);
const { seedClean } = await import(
  new URL("../hail-os/assets/js/data/seed.js", import.meta.url)
);

function line(itemId, price, quantity = 1) {
  return {
    itemId,
    ar: itemId,
    en: itemId,
    qty: quantity,
    price,
    station: "hot",
    prep: 5,
    options: [],
    note: "",
  };
}

test("clean handoff keeps the restaurant foundation without demo transactions", () => {
  seedClean();
  const state = store.get();

  assert.equal(state.seeded, true);
  assert.equal(state.settings.demoMode, false);
  assert.equal(state.tables.length, 24);
  assert.ok(state.staff.length >= 1);
  assert.ok(state.inventory.length >= 1);
  assert.deepEqual(state.orders, []);
  assert.deepEqual(state.sessions, []);
  assert.deepEqual(state.services, []);
  assert.deepEqual(state.payments, []);
});

test("multiple diners and tables stay isolated and named bills settle exactly", () => {
  seedClean();
  const table3 = store.openSession({ tableNumber: 3, guests: 3, actor: "اختبار" });
  const table8 = store.openSession({ tableNumber: 8, guests: 2, actor: "اختبار" });

  const ahmad = store.placeOrder({
    lines: [line("ahmad-main", 1001), line("ahmad-drink", 777)],
    tableNumber: 3,
    sessionId: table3.id,
    customer: { name: "أحمد" },
    actor: "أحمد",
  });
  const sara = store.placeOrder({
    lines: [line("sara-main", 1333, 2)],
    tableNumber: 3,
    sessionId: table3.id,
    customer: { name: "سارة" },
    actor: "سارة",
  });
  const otherTable = store.placeOrder({
    lines: [line("other-table", 2500)],
    tableNumber: 8,
    sessionId: table8.id,
    customer: { name: "ليان" },
    actor: "ليان",
  });

  const tableBill = store.sessionBill(table3.id);
  let payerBills = store.sessionPayerBills(table3.id);
  assert.equal(payerBills.length, 2);
  assert.equal(
    payerBills.reduce((total, bill) => total + bill.total, 0),
    tableBill.total,
    "per-person service and tax must add up to the table total to the fils",
  );
  assert.deepEqual(store.sessionOrders(table8.id).map((order) => order.id), [otherTable.id]);
  assert.ok(!store.sessionOrders(table8.id).some((order) => [ahmad.id, sara.id].includes(order.id)));

  const ahmadBill = payerBills.find((bill) => bill.name === "أحمد");
  const firstShare = Math.ceil(ahmadBill.due / 2);
  store.pay({
    sessionId: table3.id,
    orderIds: ahmadBill.orderIds,
    amount: firstShare,
    splitOf: 2,
    payerName: "أحمد",
    actor: "الكاشير",
  });

  payerBills = store.sessionPayerBills(table3.id);
  const ahmadAfterShare = payerBills.find((bill) => bill.name === "أحمد");
  assert.equal(ahmadAfterShare.due, ahmadBill.total - firstShare);
  assert.equal(store.get().orders.find((order) => order.id === ahmad.id).paid, false);
  assert.equal(store.orderPayerLocked(ahmad.id), true);
  assert.equal(store.setOrderPayerName(ahmad.id, "اسم آخر", "الكاشير"), false);

  store.pay({
    sessionId: table3.id,
    orderIds: ahmadAfterShare.orderIds,
    amount: ahmadAfterShare.due,
    payerName: "أحمد",
    actor: "الكاشير",
  });
  const saraBill = store.sessionPayerBills(table3.id).find((bill) => bill.name === "سارة");
  store.pay({
    sessionId: table3.id,
    orderIds: saraBill.orderIds,
    amount: saraBill.due,
    payerName: "سارة",
    actor: "الكاشير",
  });

  assert.equal(store.sessionBill(table3.id).due, 0);
  assert.equal(store.get().orders.find((order) => order.id === ahmad.id).paid, true);
  assert.equal(store.get().orders.find((order) => order.id === sara.id).paid, true);
  assert.ok(store.sessionBill(table8.id).due > 0, "paying table 3 must not affect table 8");
});

test("a full-size state commit reaches the server instead of failing on keepalive", async () => {
  /* fetch caps keepalive request bodies at 64 KB and rejects larger ones outright,
     so a restaurant with a day of sales could not save anything. */
  const requests = [];
  const realFetch = globalThis.fetch;
  const realSetInterval = globalThis.setInterval;
  globalThis.setInterval = () => 0;            // the poller must not outlive the test
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    const rows = String(url).includes("hail_os_state_get")
      ? []                                     // no row yet, so the client bootstraps
      : [{ applied: true, revision: 1, payload: JSON.parse(init.body).p_payload }];
    return { ok: true, status: 200, json: async () => rows };
  };

  seedClean();
  for (let i = 0; i < 60; i++) {
    store.placeOrder({
      lines: [line(`item-${i}`, 4500, 2), line(`extra-${i}`, 1750)],
      type: "dine-in",
      tableNumber: (i % 24) + 1,
    });
  }

  await store.ready();
  assert.equal(await store.flush(), true, "the queue must drain");

  const commit = requests.find((r) => r.url.includes("hail_os_state_commit"));
  assert.ok(commit, "the state must be committed to the server");
  assert.ok(
    commit.init.body.length > 20000,
    `payload is ${commit.init.body.length} chars — the case that used to fail`,
  );
  assert.ok(!commit.init.keepalive, "keepalive must be dropped once the body is large");

  const read = requests.find((r) => r.url.includes("hail_os_state_get"));
  assert.equal(read.init.keepalive, true, "small requests keep surviving tab close");

  globalThis.fetch = realFetch;
  globalThis.setInterval = realSetInterval;
});
