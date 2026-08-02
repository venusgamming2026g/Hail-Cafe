import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build contains the Hail Cafe landing and menu experiences", async () => {
  const [page, menuPage, layout, home, customer] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/menu/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/home-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/customer-app.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /application\/ld\+json/);
  assert.match(page, /Restaurant/);
  assert.match(page, /CafeOrCoffeeShop/);
  assert.match(page, /HomeApp/);
  assert.match(menuPage, /CustomerApp/);
  assert.match(layout, /Hail Cafe/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(customer, /طلب الحساب/);
  assert.match(customer, /localStorage/);
  assert.match(customer, /serviceWorker/);
  assert.match(customer, /hail-gallery\/menu-hero\.jpeg/);
  assert.match(home, /hail-gallery\/home-hero\.jpeg/);
  assert.match(home, /hail-gallery\/combo-platter\.jpeg/);
  assert.doesNotMatch(page + layout, /Your site is taking shape/);
  await Promise.all([
    access(new URL("../dist/server/index.js", import.meta.url)),
    access(new URL("../public/hail-gallery/home-hero.jpeg", import.meta.url)),
    access(new URL("../public/hail-gallery/menu-hero.jpeg", import.meta.url)),
  ]);
});

test("local restaurant system supports named split bills", async () => {
  const [customer, cashier, store] = await Promise.all([
    readFile(new URL("../assets/js/app/customer.js", import.meta.url), "utf8"),
    readFile(new URL("../assets/js/app/cashier.js", import.meta.url), "utf8"),
    readFile(new URL("../assets/js/core/store.js", import.meta.url), "utf8"),
  ]);

  assert.match(customer, /اسم صاحب الطلب/);
  assert.match(customer, /sessionPayerBills/);
  assert.match(customer, /sessionStorage/);
  assert.match(cashier, /data-pay-person/);
  assert.match(cashier, /payerName/);
  assert.match(cashier, /تُحصّل حصة واحدة الآن/);
  assert.match(store, /sessionPayerBills/);
  assert.match(store, /payerName/);
  assert.match(store, /allocateProportionally/);
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

test("restaurant screens use the shared Supabase state without exposing server secrets", async () => {
  const [backend, store, migration, publishedStore, publicStore] = await Promise.all([
    readFile(new URL("../hail-os/assets/js/data/backend.js", import.meta.url), "utf8"),
    readFile(new URL("../hail-os/assets/js/core/store.js", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260802143000_hail_os_shared_state.sql", import.meta.url), "utf8"),
    readFile(new URL("../docs/hail-os/assets/js/core/store.js", import.meta.url), "utf8"),
    readFile(new URL("../public/hail-os/assets/js/core/store.js", import.meta.url), "utf8"),
  ]);

  assert.match(backend, /sb_publishable_/);
  assert.doesNotMatch(backend + store, /sb_secret_|service_role/);
  assert.match(store, /hail_os_state_commit/);
  assert.match(store, /normalizeSharedState/);
  assert.match(migration, /security definer/i);
  assert.match(migration, /revoke all on public\.hail_os_state from anon, authenticated/i);
  assert.equal(publishedStore, store);
  assert.equal(publicStore, store);
});
