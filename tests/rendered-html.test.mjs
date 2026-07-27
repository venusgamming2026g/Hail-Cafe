import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build contains the official Hail Cafe customer experience", async () => {
  const [page, layout, customer] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/customer-app.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /application\/ld\+json/);
  assert.match(page, /Restaurant/);
  assert.match(page, /CafeOrCoffeeShop/);
  assert.match(layout, /هيل كافيه/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(customer, /طلب الحساب/);
  assert.match(customer, /localStorage/);
  assert.match(customer, /serviceWorker/);
  assert.doesNotMatch(page + layout, /Your site is taking shape/);
  await access(new URL("../dist/server/index.js", import.meta.url));
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
