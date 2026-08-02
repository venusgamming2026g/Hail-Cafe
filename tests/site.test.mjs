/* ==========================================================================
   اختبارات موقع النشر — تتحقق أن docs/ مبني صحيحاً من المصدر دون أي بناء.
   ========================================================================== */
import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFile(join(ROOT, p), "utf8");

/* ملفات التطوير المحلي التي لا تُنشر — نفس قائمة tools/sync-site.mjs */
const DEV_ONLY = new Set(["server.mjs", "README.md", "تشغيل-النظام.cmd"]);

async function walk(dir, base = dir) {
  const out = [];
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...(await walk(rel, base)));
    else out.push(rel.slice(base.length + 1));
  }
  return out;
}
const hash = async (p) => createHash("sha1").update(await readFile(join(ROOT, p))).digest("hex");

test("the landing page and browsing menu carry the customer experience", async () => {
  const home = await read("docs/index.html");
  assert.match(home, /id="order"/, "قسم الطلب من الطاولة");
  assert.match(home, /id="tableGrid"/, "شبكة أرقام الطاولات");
  assert.match(home, /hail-os\/menu\.html\?t=/, "الطاولة تفتح منيو الطلب");
  assert.match(home, /<a href="menu\.html">المنيو<\/a>/, "رابط المنيو في القائمة");

  const menu = await read("docs/menu.html");
  assert.match(menu, /hail-os\/menu\.html\?t='/, "تحويلة رموز QR محفوظة");
  assert.match(menu, /prefers-color-scheme/, "المنيو يتبع ثيم الجهاز");
  assert.match(menu, /lux-sec/, "تصميم الأقسام الفاخر");
});

test("the published menu page is generated from the canonical menu module", async () => {
  const { items, categories } = await import(
    pathToFileURL(join(ROOT, "hail-os/assets/js/data/menu.js")).href
  );
  const menu = await read("docs/menu.html");
  const payload = menu.match(/const ITEMS = (\[.*?\]);/s);
  assert.ok(payload, "حمولة الأصناف موجودة في الصفحة");
  const published = JSON.parse(payload[1]);
  const available = items.filter((i) => i.available !== false);
  assert.equal(published.length, available.length, "كل الأصناف المتاحة منشورة");
  const names = new Set(published.map((x) => x.n));
  for (const it of available.slice(0, 30)) {
    assert.ok(names.has(it.ar), `الصنف ${it.ar} غائب — شغّل npm run sync بعد تعديل المنيو`);
  }
  const catsPayload = menu.match(/const CATEGORIES = (\[.*?\]);/s);
  assert.ok(catsPayload, "حمولة الأقسام موجودة في الصفحة");
  assert.equal(
    JSON.parse(catsPayload[1]).length,
    categories.filter((c) => c.active !== false).length,
    "كل الأقسام الفعّالة منشورة",
  );
});

test("the deployed restaurant OS is byte-identical to its source", async () => {
  const src = (await walk("hail-os")).filter((p) => !DEV_ONLY.has(p.split("/").pop()));
  const dest = await walk("docs/hail-os");
  assert.deepEqual(dest.sort(), src.sort(), "نفس قائمة الملفات — شغّل npm run sync");
  for (const p of src) {
    assert.equal(
      await hash(`docs/hail-os/${p}`),
      await hash(`hail-os/${p}`),
      `docs/hail-os/${p} يختلف عن المصدر — شغّل npm run sync`,
    );
  }
});

test("restaurant screens use the shared backend without exposing server secrets", async () => {
  const [backend, store, migration] = await Promise.all([
    read("hail-os/assets/js/data/backend.js"),
    read("hail-os/assets/js/core/store.js"),
    read("supabase/migrations/20260802143000_hail_os_shared_state.sql"),
  ]);
  assert.match(backend, /sb_publishable_/);
  assert.doesNotMatch(backend + store, /sb_secret_|service_role/);
  assert.match(store, /hail_os_state_commit/);
  assert.match(store, /normalizeSharedState/);
  assert.match(migration, /security definer/i);
  assert.match(migration, /revoke all on public\.hail_os_state from anon, authenticated/i);
});
