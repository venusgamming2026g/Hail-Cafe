/* Hail Cafe — عامل الخدمة
 *
 * الاستراتيجية: الشبكة أولاً ثم الكاش كاحتياطي.
 *
 * النسخة السابقة كانت "الكاش أولاً" لكل الملفات، فكان أول تحميل يثبّت
 * الـ CSS و JS في الكاش إلى الأبد: أي نشر جديد لا يصل لمن زار الموقع من
 * قبل. الآن يُطلب الملف من الشبكة دائماً وتُحدَّث النسخة المخبّأة، ولا
 * يُستخدم الكاش إلا عند انقطاع الاتصال — فيبقى العمل دون إنترنت سليماً.
 *
 * عند أي تغيير في هذا الملف ارفع رقم النسخة ليُمسح الكاش القديم.
 */
const CACHE_NAME = "hail-cafe-shell-v3";

const SHELL = [
  "/",
  "/hail-logo.png",
  "/menu/combo-platter.webp",
  "/menu/mango-juice.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // الطلبات غير الآمنة ونداءات الـ API لا تُخبّأ إطلاقاً
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // التنقّل: الشبكة أولاً، والصفحة المخبّأة عند الانقطاع
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/", clone))
            .catch(() => undefined);
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // باقي الملفات: الشبكة أولاً مع تحديث الكاش، والكاش عند الفشل فقط
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
