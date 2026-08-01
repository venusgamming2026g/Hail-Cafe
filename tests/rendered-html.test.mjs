import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build contains the Restaurant OS customer experience", async () => {
  const [page, layout, customer] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/customer-app.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /application\/ld\+json/);
  assert.match(page, /Restaurant/);
  assert.match(page, /CafeOrCoffeeShop/);
  assert.match(layout, /Restaurant OS/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(customer, /طلب الحساب/);
  assert.match(customer, /localStorage/);
  assert.match(customer, /serviceWorker/);
  assert.doesNotMatch(page + layout, /Your site is taking shape/);
  await access(new URL("../dist/server/index.js", import.meta.url));
});

test("local restaurant system supports named split bills", async () => {
  const [customer, cashier, store] = await Promise.all([
    readFile(new URL("../assets/js/app/customer.js", import.meta.url), "utf8"),
    readFile(new URL("../assets/js/app/cashier.js", import.meta.url), "utf8"),
    readFile(new URL("../assets/js/core/store.js", import.meta.url), "utf8"),
  ]);

  assert.match(customer, /اسم صاحب الطلب/);
  assert.match(customer, /sessionPayerBills/);
  assert.match(cashier, /data-pay-person/);
  assert.match(cashier, /payerName/);
  assert.match(store, /sessionPayerBills/);
  assert.match(store, /payerName/);
});

test("ships operations, persistence, idempotency, and offline support", async () => {
  const [ops, schema, ordersApi, serviceWorker, packageJson] = await Promise.all([
    readFile(new URL("../components/ops-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(ops, /المطبخ KDS/);
  assert.match(ops, /إدارة المنيو/);
  assert.match(schema, /serviceRequests/);
  assert.match(schema, /eventLog/);
  assert.match(ordersApi, /idempotency/i);
  assert.match(serviceWorker, /caches\.match/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(packageJson, /"name": "hail-cafe-platform"/);
});
