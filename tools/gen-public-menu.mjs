/* يبني docs/menu.html بالطابع الفاخر (أسود×ذهبي ليلاً، رملي×ذهبي نهاراً)
   من بيانات hail-os/assets/js/data/menu.js الرسمية.
   يعمل مستقلاً أو عبر tools/sync-site.mjs — لا تعدّل docs/menu.html يدوياً. */
import { pathToFileURL, fileURLToPath } from 'node:url';
import { writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const ROOT = process.argv[2] || dirname(fileURLToPath(new URL('.', import.meta.url)));
const { items, categories } = await import(pathToFileURL(`${ROOT}/hail-os/assets/js/data/menu.js`).href);

const cats = categories
  .filter((c) => c.active !== false)
  .sort((a, b) => (a.order || 0) - (b.order || 0))
  .map((c) => ({ id: c.id, ar: c.ar, en: c.en || '' }));

let missing = 0;
const data = items
  .filter((i) => i.available !== false)
  .map((i) => {
    const base = String(i.image || '').split('/').pop() || '';
    let img = base ? `./menu/${base}` : '';
    if (base && !existsSync(`${ROOT}/docs/menu/${base}`)) { missing++; img = ''; }
    return { c: i.categoryId, n: i.ar, e: i.en || '', p: (i.price / 1000).toFixed(3), i: img, o: i.hasOwnPhoto ? 1 : 0, f: i.featured ? 1 : 0 };
  });
console.log(`items: ${data.length} | categories: ${cats.length} | missing images: ${missing}`);

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>منيو هيل كافيه | Hail Cafe Menu</title>
    <meta name="description" content="تصفح منيو هيل كافيه. كل الأطباق بمكان واحد.">
    <link rel="icon" href="./favicon.svg" type="image/svg+xml">
    <script>
      /* رمز QR على طاولة؟ افتح منيو الطلب مباشرة على رقمها. */
      (function () {
        var q = new URLSearchParams(location.search);
        var t = q.get('t') || q.get('table');
        if (t) location.replace('hail-os/menu.html?t=' + encodeURIComponent(t));
      })();
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f8efdf; --bg-2: #fffdf8;
            --card: #fffdf8; --line: rgba(34, 29, 22, .1);
            --ink: #16120d; --mute: #5f5545; --faint: #9a8f7d;
            --gold: #8a6a1f; --gold-2: #a67c2e; --gold-line: rgba(138, 106, 31, .4);
            --shadow: 0 10px 26px rgba(34, 29, 22, .08);
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #0d0b09; --bg-2: #14110d;
                --card: rgba(255, 255, 255, .035); --line: rgba(255, 255, 255, .085);
                --ink: #f4ede0; --mute: #b5a98f; --faint: #857c69;
                --gold: #d9b25f; --gold-2: #b98a2f; --gold-line: rgba(217, 178, 95, .35);
                --shadow: 0 14px 34px rgba(0, 0, 0, .4);
            }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
            font-family: 'IBM Plex Sans Arabic', sans-serif; background: var(--bg); color: var(--ink);
            line-height: 1.6; min-height: 100vh;
        }
        @media (prefers-color-scheme: dark) {
            body { background: radial-gradient(130% 90% at 50% -10%, #191512, var(--bg) 58%); }
        }
        h1, h2, h3, .display-font { font-family: 'Alexandria', sans-serif; }
        a { text-decoration: none; color: inherit; }

        header {
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
            background: color-mix(in srgb, var(--bg) 88%, transparent);
            backdrop-filter: blur(12px); border-bottom: 1px solid var(--line);
        }
        .nav-container { max-width: 1200px; margin: 0 auto; padding: .9rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .logo img { height: 54px; width: 54px; object-fit: contain; }
        nav ul { display: flex; gap: 1.8rem; list-style: none; }
        nav a { font-weight: 500; transition: color .2s; }
        nav a:hover { color: var(--gold); }
        .btn {
            display: inline-block; padding: .7rem 1.5rem; border-radius: 20px;
            font-family: 'Alexandria', sans-serif; font-weight: 700; cursor: pointer;
            transition: all .3s ease; text-align: center; border: none;
        }
        .btn-gold { background: linear-gradient(135deg, var(--gold), var(--gold-2)); color: #221a06; }
        .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 22px color-mix(in srgb, var(--gold) 30%, transparent); }

        .hero { padding: 9.5rem 1.5rem 2rem; text-align: center; }
        .hero h1 { font-size: clamp(1.7rem, 5vw, 2.6rem); color: var(--gold); }
        .hero p { color: var(--mute); margin-top: .5rem; }

        .tabs-container { position: sticky; top: 76px; z-index: 900; padding: .8rem 0; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(10px); }
        .tabs-scroll { display: flex; gap: .5rem; overflow-x: auto; padding: .2rem 1.5rem; max-width: 1200px; margin: 0 auto; scrollbar-width: none; }
        .tabs-scroll::-webkit-scrollbar { display: none; }
        .tab-btn {
            flex: none; padding: .5rem 1.1rem; border-radius: 99px; border: 1px solid var(--line);
            background: transparent; color: var(--mute); font-family: inherit; font-size: .86rem;
            font-weight: 600; cursor: pointer; transition: all .25s ease;
        }
        .tab-btn:hover { border-color: var(--gold-line); color: var(--ink); }
        .tab-btn.active { background: linear-gradient(135deg, var(--gold), var(--gold-2)); border-color: transparent; color: #221a06; }

        .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 4rem; }

        .lux-sec { text-align: center; padding: 3.2rem 0 1.4rem; }
        .lux-trio { display: flex; justify-content: center; gap: 1.1rem; margin-bottom: 1.4rem; }
        .lux-trio img {
            width: 118px; height: 118px; border-radius: 50%; object-fit: cover;
            border: 2px solid var(--gold-line); box-shadow: var(--shadow);
        }
        .lux-sec h2 {
            font-size: clamp(1.5rem, 4vw, 2.1rem); color: var(--gold); font-weight: 800;
            text-shadow: 0 1px 16px color-mix(in srgb, var(--gold) 24%, transparent);
        }
        .lux-sec .sec-en { display: block; margin-top: .35rem; font-size: .7rem; letter-spacing: .34em; color: var(--mute); text-transform: uppercase; padding-inline-start: .34em; }
        .lux-div { display: flex; align-items: center; gap: 12px; max-width: 430px; margin: 1.1rem auto 0; color: var(--gold); }
        .lux-div::before { content: ''; flex: 1; height: 1px; background: linear-gradient(-90deg, var(--gold-line), transparent); }
        .lux-div::after  { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--gold-line), transparent); }

        .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: .9rem; }
        .menu-item {
            display: flex; align-items: center; justify-content: space-between; gap: 1rem;
            padding: 1rem 1.2rem; border-radius: 14px; border: 1px solid var(--line);
            background: var(--card); transition: border-color .25s, transform .25s, box-shadow .25s;
        }
        .menu-item:hover { border-color: var(--gold-line); transform: translateY(-3px); box-shadow: var(--shadow); }
        .item-title { font-size: 1rem; font-weight: 700; line-height: 1.45; }
        .item-en { display: block; margin-top: 2px; font-size: .68rem; color: var(--faint); }
        .item-price { flex: none; text-align: center; min-width: 54px; }
        .item-price b { font-size: 1.1rem; font-family: 'Alexandria', sans-serif; }
        .item-price span { display: block; font-size: .58rem; color: var(--faint); }
        .lux-badge {
            display: inline-block; margin-inline-start: 7px; vertical-align: 2px;
            font-size: .6rem; font-weight: 700; color: #221a06; padding: 2.5px 9px; border-radius: 99px;
            background: linear-gradient(135deg, var(--gold), var(--gold-2));
        }

        footer { border-top: 1px solid var(--line); padding: 2.2rem 1.5rem; text-align: center; color: var(--mute); font-size: .85rem; }
        footer img { height: 46px; margin-bottom: .6rem; }

        @media (max-width: 640px) {
            .nav-container { padding: .8rem 1rem; }
            nav ul { gap: 1rem; font-size: .85rem; }
            .lux-trio img { width: 92px; height: 92px; }
            .hero { padding-top: 8rem; }
        }
    </style>
</head>
<body>
    <header>
        <div class="nav-container">
            <a href="index.html" class="logo">
                <img src="./hail-logo.png" alt="Hail Cafe Logo">
            </a>
            <nav>
                <ul>
                    <li><a href="index.html">الرئيسية</a></li>
                    <li><a href="index.html#reserve">احجز</a></li>
                    <li><a href="index.html#visit">الموقع</a></li>
                </ul>
            </nav>
            <a href="index.html#order" class="btn btn-gold">اطلب الآن</a>
        </div>
    </header>

    <main>
        <section class="hero">
            <h1>منيو هيل كافيه</h1>
            <p>كل أطباق هيل بمكان واحد — الأسعار بالدينار الأردني</p>
        </section>

        <div class="tabs-container">
            <div class="tabs-scroll" id="tabs-container">
                <button class="tab-btn active" data-category="all">الكل</button>
            </div>
        </div>

        <div class="container" id="menu-root"></div>
    </main>

    <footer>
        <img src="./hail-logo.png" alt="Hail Cafe">
        <p>كل لحظة إلها طعم، والضحكة غير. — إربد سيتي سنتر، الأردن</p>
        <p>&copy; 2026 هيل كافيه. جميع الحقوق محفوظة.</p>
    </footer>

    <script>
        /* مولّد آلياً من hail-os/assets/js/data/menu.js — لا تعدّل الأصناف هنا. */
        const CATEGORIES = ${JSON.stringify(cats)};
        const ITEMS = ${JSON.stringify(data)};

        const tabs = document.getElementById('tabs-container');
        CATEGORIES.forEach(cat => {
            const b = document.createElement('button');
            b.className = 'tab-btn'; b.dataset.category = cat.id; b.innerText = cat.ar;
            tabs.appendChild(b);
        });

        const root = document.getElementById('menu-root');
        const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

        function sectionFor(cat, list) {
            const photos = [...new Set(list.filter(x => x.o && x.i).map(x => x.i))].slice(0, 3);
            if (!photos.length && list[0] && list[0].i) photos.push(list[0].i);
            return \`
              <div class="lux-sec">
                \${photos.length ? \`<div class="lux-trio">\${photos.map(p => \`<img src="\${p}" alt="" loading="lazy" width="118" height="118">\`).join('')}</div>\` : ''}
                <h2>\${esc(cat.ar)}</h2>
                \${cat.en ? \`<span class="sec-en">\${esc(cat.en)}</span>\` : ''}
                <div class="lux-div">✦</div>
              </div>
              <div class="menu-grid">
                \${list.map(x => \`
                  <div class="menu-item">
                    <div>
                      <h3 class="item-title">\${esc(x.n)}\${x.f ? '<span class="lux-badge">توقيع هيل</span>' : ''}</h3>
                      \${x.e ? \`<span class="item-en">\${esc(x.e)}</span>\` : ''}
                    </div>
                    <div class="item-price"><b>\${x.p}</b><span>د.أ</span></div>
                  </div>\`).join('')}
              </div>\`;
        }

        function render(category) {
            const catsToShow = category === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.id === category);
            root.innerHTML = catsToShow.map(c => {
                const list = ITEMS.filter(x => x.c === c.id);
                return list.length ? sectionFor(c, list) : '';
            }).join('');
        }

        tabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            render(btn.dataset.category);
            if (btn.dataset.category !== 'all') {
                document.querySelector('.tabs-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        render('all');
    </script>
</body>
</html>
`;

writeFileSync(`${ROOT}/docs/menu.html`, html);
console.log('written docs/menu.html —', html.length, 'chars');
