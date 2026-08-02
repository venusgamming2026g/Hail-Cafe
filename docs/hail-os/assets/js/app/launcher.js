/* ==========================================================================
   HAIL OS — مركز الإطلاق
   بوابة كل الشاشات + مولّد رموز QR للطاولات + أدوات العرض التجريبي
   ========================================================================== */

import { icon, esc, moneyPlain, sum, LS } from '../core/util.js';
import * as store from '../core/store.js';
import * as fx from '../core/fx.js';
import * as notify from '../core/notify.js';
import { boot, topbar } from '../core/shell.js';
import { toSvg } from '../core/qr.js';
import { MENU_STATS, BRANCH } from '../data/menu.js';
import { startSimulator, stopSimulator, simulatorRunning, seed } from '../data/seed.js';

boot({ title: 'HAIL OS — نظام هيل كافيه' });

document.getElementById('bar').replaceWith(topbar({
  title: 'HAIL OS',
  subtitle: 'النظام الداخلي المتكامل',
  live: true,
}));

const isFile = location.protocol === 'file:';

/* ── اكتشاف عنوان الشبكة المناسب لرموز QR ────────────────────────────── */
/* localhost لا يعمل على الجوال، لذا نسأل الخادم عن عناوين الشبكة الحقيقية. */
let netOptions = [];
let qrBase = LS.get('hailos:qrbase', null) || (isFile ? '' : location.origin);

async function loadNetwork() {
  if (isFile) return;
  try {
    const res = await fetch('/__net', { cache: 'no-store' });
    if (!res.ok) return;
    const { port, addresses } = await res.json();
    netOptions = addresses.map((a) => ({ url: `http://${a.ip}:${port}`, label: `${a.ip} — ${a.name}` }));
    netOptions.push({ url: location.origin, label: 'هذا الجهاز فقط (localhost)' });
    /* إن لم يختر المستخدم شيئاً، اختر أول عنوان شبكة حقيقي تلقائياً */
    const saved = LS.get('hailos:qrbase', null);
    if (!saved || !netOptions.some((o) => o.url === saved)) {
      qrBase = netOptions[0]?.url || location.origin;
    } else {
      qrBase = saved;
    }
  } catch { /* الخادم لا يدعم النقطة — نُبقي العنوان الحالي */ }
}

const localOnly = () => /localhost|127\.0\.0\.1/.test(qrBase);

/* ── الشاشات ─────────────────────────────────────────────────────────── */
const SURFACES = [
  {
    href: 'menu.html?t=3', ic: 'qr', glow: 'rgba(192,70,42,.32)',
    title: 'منيو الزبون (QR)', tag: 'واجهة الطاولة',
    desc: 'المنيو الرسمي كاملاً مع السلة والطلب متعدّد الجولات، تتبّع حيّ للطلب، نداء الخدمة، والفاتورة.',
    stat: () => `${MENU_STATS.items} صنف`,
  },
  {
    href: 'kds.html', ic: 'chef', glow: 'rgba(227,59,36,.3)',
    title: 'شاشة المطبخ', tag: 'KDS',
    desc: 'توجيه تلقائي لكل صنف إلى محطته، مؤقّت لكل طلب، وتصعيد لوني وصوتي عند التأخّر.',
    stat: () => `${store.get().orders.filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status)).length} في الطابور`,
  },
  {
    href: 'floor.html', ic: 'table', glow: 'rgba(46,158,126,.3)',
    title: 'إدارة الصالة', tag: 'النُّدُل',
    desc: 'خريطة طاولات حيّة، نداءات الخدمة بمهلة استجابة، الأطباق الجاهزة للتقديم، والحجوزات.',
    stat: () => `${store.get().tables.filter((t) => t.status === 'seated').length}/${store.get().tables.length} مشغولة`,
  },
  {
    href: 'cashier.html', ic: 'wallet', glow: 'rgba(62,144,210,.3)',
    title: 'الكاشير', tag: 'نقطة البيع',
    desc: 'قبول الطلبات، فواتير الطاولات، التحصيل والتقسيم والباقي، طلب يدوي سريع، وتقفيل الوردية.',
    stat: () => `${store.get().sessions.filter((s) => s.status === 'open').length} فاتورة مفتوحة`,
  },
  {
    href: 'admin.html', ic: 'chart', glow: 'rgba(180,99,143,.3)',
    title: 'لوحة الإدارة', tag: 'المدير',
    desc: 'تحليلات حيّة، إدارة المنيو والأسعار، المخزون والتنبيهات، الطاقم، التقارير والتصدير.',
    stat: () => `${moneyPlain(store.reportFor().revenue)} د.أ اليوم`,
  },
];

/* ── العرض ───────────────────────────────────────────────────────────── */
function render() {
  const s = store.get();
  const rep = store.reportFor();
  const sim = simulatorRunning();

  document.getElementById('app').innerHTML = `
    <section class="cover">
      <div class="crest float">هيل</div>
      <p class="eyebrow" style="justify-content:center">نظام مطعم داخلي متكامل</p>
      <h1><span class="gold-text">HAIL OS</span><br>كل ما يحتاجه المطعم في نظام واحد</h1>
      <p class="lead">
        من مسح رمز QR على الطاولة، إلى المطبخ والصالة والكاشير، وصولاً إلى تقارير المدير —
        كل الشاشات تتزامن لحظياً بلا خادم ولا إعدادات.
      </p>
      <div class="statline">
        <div><b class="gold-text">${MENU_STATS.items}</b><span>صنف في المنيو</span></div>
        <div><b class="gold-text">${MENU_STATS.categories}</b><span>قسماً</span></div>
        <div><b class="gold-text">${s.tables.length}</b><span>طاولة</span></div>
        <div><b class="gold-text">5</b><span>شاشات تشغيل</span></div>
      </div>
      <div class="seam mt6" style="max-width:320px;margin-inline:auto;display:flex;align-items:center;gap:8px">
        <i style="width:9px;height:9px;background:var(--clay-500);transform:rotate(45deg);border-radius:2px"></i>
        <span style="height:1px;flex:1;background:linear-gradient(90deg,transparent,var(--clay-600),transparent)"></span>
        <i style="width:9px;height:9px;background:var(--clay-500);transform:rotate(45deg);border-radius:2px"></i>
      </div>
    </section>

    <div class="wrap">
      <div class="grid g4 mb6">
        ${tile('مبيعات اليوم', `${moneyPlain(rep.revenue)} د.أ`, 'wallet', 'txt-gold')}
        ${tile('طلبات جارية', s.orders.filter((o) => !['served', 'cancelled'].includes(o.status)).length, 'clock', '')}
        ${tile('نداءات مفتوحة', s.services.filter((x) => x.status !== 'done').length, 'bell', '')}
        ${tile('ضيوف الآن', sum(s.sessions.filter((x) => x.status === 'open'), (x) => x.guests), 'users', '')}
      </div>

      <div class="grid auto-320 mb6">
        ${SURFACES.map((f) => `
          <a class="launch reveal" href="${f.href}">
            <span class="glowdot" style="--glow:${f.glow}"></span>
            <span class="between">
              <span class="ic">${icon(f.ic)}</span>
              <span class="chip">${f.tag}</span>
            </span>
            <h3>${f.title}</h3>
            <p>${f.desc}</p>
            <span class="row" style="margin-top:auto">
              <span class="chip chip-gold">${f.stat()}</span>
              <span class="grow"></span>
              <span class="txt-gold">${icon('arrowL')}</span>
            </span>
          </a>`).join('')}

        <button class="launch reveal" id="qrbtn" style="text-align:start">
          <span class="glowdot" style="--glow:rgba(192,70,42,.34)"></span>
          <span class="between">
            <span class="ic">${icon('qr')}</span>
            <span class="chip chip-gold">جاهز للطباعة</span>
          </span>
          <h3>رموز QR للطاولات</h3>
          <p>ولّد رمزاً لكل طاولة يفتح المنيو مباشرة على جوال الزبون — واطبعها كبطاقات جاهزة للوضع على الطاولات.</p>
          <span class="row" style="margin-top:auto">
            <span class="chip">${s.tables.length} رمز</span>
            <span class="grow"></span>
            <span class="txt-gold">${icon('arrowL')}</span>
          </span>
        </button>
      </div>

      <div class="glass pad mb6 reveal">
        <div class="between mb4">
          <b>${icon('play')} أدوات العرض</b>
          <span class="chip ${sim ? 'chip-ok' : ''}">${sim ? '<i class="dot dot-live"></i>المحاكي يعمل' : 'المحاكي متوقف'}</span>
        </div>
        <p class="mute t-sm mb4">
          شغّل المحاكي ثم افتح شاشتين جنباً إلى جنب — سترى الطلبات والنداءات تنتقل بينهما لحظياً.
        </p>
        <div class="row wrap-x" style="gap:10px">
          <button class="btn ${sim ? 'btn-bad' : 'btn-gold'}" id="sim">
            ${icon(sim ? 'pause' : 'play')} ${sim ? 'إيقاف المحاكي' : 'تشغيل المحاكي الحيّ'}</button>
          <button class="btn btn-ghost" id="reseed">${icon('refresh')} إعادة توليد البيانات</button>
          <button class="btn btn-ghost" id="soundtest">${icon('volume')} تجربة التنبيهات</button>
          <a class="btn btn-ghost" href="menu.html" target="_blank" rel="noopener">${icon('truck')} تجربة السفري</a>
        </div>
      </div>

      <div class="glass pad mb6 reveal">
        <b class="mb4" style="display:block">${icon('wifi')} التشغيل على الأجهزة</b>
        ${isFile ? `
          <p class="txt-warn t-sm mb4">${icon('alert')}
            الصفحة مفتوحة كملف محلي، لذلك رموز QR لن تُفتح من الجوال.
            شغّل <b class="num">تشغيل-النظام.cmd</b> ثم افتح الرابط الذي يظهر.</p>` : `
          <label class="label">العنوان الذي تشير إليه رموز QR</label>
          <select class="field netbox mb2" id="qrbase">
            ${netOptions.length
              ? netOptions.map((o) => `<option value="${esc(o.url)}" ${o.url === qrBase ? 'selected' : ''}>${esc(o.url)} · ${esc(o.label)}</option>`).join('')
              : `<option value="${esc(location.origin)}">${esc(location.origin)}</option>`}
          </select>
          <p class="t-xs ${localOnly() ? 'txt-warn' : 'mute'}">
            ${localOnly()
              ? `${icon('alert')} هذا عنوان محلي — لن يفتح من الجوال. اختر عنواناً يبدأ بـ 192.168 أو 10.`
              : `${icon('check')} اربط الجوال بنفس شبكة الواي فاي ثم امسح أي رمز QR.`}
          </p>`}
        <div class="divider"></div>
        <div class="row wrap-x t-sm" style="gap:var(--s6)">
          <span>${icon('pin')} ${esc(BRANCH.ar)}</span>
          <a href="tel:${BRANCH.phone}" class="num" dir="ltr">${BRANCH.phoneDisplay}</a>
          <a href="${BRANCH.map}" target="_blank" rel="noopener">${icon('arrowL')} الموقع على الخريطة</a>
        </div>
      </div>
    </div>`;

  document.getElementById('qrbtn').addEventListener('click', openQr);
  document.getElementById('qrbase')?.addEventListener('change', (e) => {
    qrBase = e.target.value;
    LS.set('hailos:qrbase', qrBase);
    notify.toast('حُدّث عنوان رموز QR', { body: qrBase, tone: localOnly() ? 'warn' : 'ok' });
    render();
  });
  document.getElementById('sim').addEventListener('click', () => {
    if (simulatorRunning()) { stopSimulator(); notify.toast('أُوقف المحاكي', { tone: 'info' }); }
    else {
      startSimulator();
      notify.toast('المحاكي يعمل الآن', { body: 'افتح شاشة المطبخ أو الصالة لترى الحركة', tone: 'gold', sound: 'success' });
    }
    render();
  });
  document.getElementById('reseed').addEventListener('click', async () => {
    const ok = await notify.confirmBox('إعادة توليد بيانات الديمو؟', {
      body: 'تُستبدل الطلبات والجلسات الحالية ببيانات جديدة.', okText: 'إعادة التوليد',
    });
    if (!ok) return;
    seed({ force: true });
    notify.toast('جاهز — بيانات جديدة', { tone: 'ok', sound: 'success' });
    render();
  });
  document.getElementById('soundtest').addEventListener('click', () => {
    notify.unlockAudio();
    const seq = [
      ['طلب جديد وصل من الطاولة', 'order', 'gold', 0],
      ['نداء خدمة — طاولة 12', 'service', 'warn', 1200],
      ['الطلب جاهز للتقديم', 'ready', 'ok', 2400],
      ['تم تحصيل الفاتورة', 'cash', 'gold', 3600],
    ];
    seq.forEach(([text, sound, tone, delay]) =>
      setTimeout(() => notify.toast(text, { tone, sound, life: 3000 }), delay));
  });

  fx.initReveal(document.getElementById('app'));
}

function tile(k, v, ic, cls) {
  return `<div class="glass stat reveal"><span class="k">${icon(ic)} ${k}</span><span class="v ${cls}">${v}</span></div>`;
}

/* ── مولّد رموز QR ───────────────────────────────────────────────────── */
function openQr() {
  const tables = store.get().tables;
  const host = document.getElementById('printzone');

  const urlFor = (n) => `${qrBase || 'http://localhost:8787'}/menu.html?t=${n}`;

  host.innerHTML = `
    <div class="wrap mt6 mb6">
      <div class="between mb4 noprint">
        <div>
          <p class="eyebrow">جاهزة للطباعة</p>
          <h2>رموز QR لطاولات الفرع</h2>
          <p class="mute t-sm mt2">كل رمز يفتح المنيو على الطاولة الصحيحة مباشرة.</p>
        </div>
        <div class="row" style="gap:8px">
          <button class="btn btn-gold" id="printqr">${icon('print')} طباعة الكل</button>
          <button class="btn btn-ghost" id="closeqr">${icon('x')} إغلاق</button>
        </div>
      </div>

      <p class="t-sm mb4 noprint ${localOnly() ? 'txt-warn' : 'mute'}">
        ${localOnly() ? icon('alert') : icon('wifi')}
        الرموز تشير إلى <b class="netbox">${esc(qrBase || 'http://localhost:8787')}</b>
        ${localOnly() ? '— هذا عنوان محلي لن يفتح من الجوال. غيّره من بطاقة «التشغيل على الأجهزة».' : ''}
      </p>

      <div class="qrsheet">
        ${tables.map((t) => `
          <div class="qrcard">
            <div class="brand">هيل كافيه</div>
            <div class="qr">${toSvg(urlFor(t.number), {
              size: 190, ecl: 'Q', margin: 2, radius: 0.9,
              dark: '#221d16', light: '#FFFFFF', gradient: ['#322b21', '#9d3722'],
            })}</div>
            <div class="no">${t.number}</div>
            <div class="hint">امسح الرمز لعرض المنيو والطلب من طاولتك</div>
          </div>`).join('')}
      </div>
    </div>`;

  host.querySelector('#printqr').addEventListener('click', () => window.print());
  host.querySelector('#closeqr').addEventListener('click', () => { host.innerHTML = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); });
  host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  notify.play('success');
}

/* ── التشغيل ─────────────────────────────────────────────────────────── */
render();
loadNetwork().then(render);
store.subscribe(() => { if (!document.getElementById('printzone').innerHTML) render(); });
setInterval(() => { if (!document.getElementById('printzone').innerHTML) render(); }, 30000);
