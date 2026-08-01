import puppeteer from 'puppeteer-core';
import path from 'path';

const BASE = 'http://localhost:3111';
const OUT = path.resolve('c:/Users/المسار الذهبي/Desktop/Hail-Cafe/Hail-Cafe/public/images');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const pages = [
  { name: '01_launcher',      url: '/',              title: 'مركز الإطلاق',   w: 1920, h: 1080, scale: 2 },
  { name: '02_customer_menu',  url: '/menu.html?t=3', title: 'منيو الزبون',    w: 1920, h: 1080, scale: 2 },
  { name: '03_kds_kitchen',    url: '/kds.html',      title: 'شاشة المطبخ',    w: 1920, h: 1080, scale: 2 },
  { name: '04_floor_tables',   url: '/floor.html',    title: 'إدارة الصالة',   w: 1920, h: 1080, scale: 2 },
  { name: '05_cashier_pos',    url: '/cashier.html',  title: 'الكاشير',        w: 1920, h: 1080, scale: 2 },
  { name: '06_admin_panel',    url: '/admin.html',    title: 'لوحة الإدارة',   w: 1920, h: 1080, scale: 2 },
  { name: '07_menu_mobile',    url: '/menu.html?t=5', title: 'منيو الجوال',    w: 390,  h: 844,  scale: 3 },
];

(async () => {
  console.log('Starting Chrome from:', CHROME);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--lang=ar'],
  });

  for (const pg of pages) {
    console.log(`📸  ${pg.title} (${pg.url}) ...`);
    const page = await browser.newPage();
    await page.setViewport({ width: pg.w, height: pg.h, deviceScaleFactor: pg.scale });
    await page.goto(`${BASE}${pg.url}`, { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));
    const outPath = path.join(OUT, `${pg.name}.png`);
    await page.screenshot({ path: outPath, fullPage: false, type: 'png' });
    await page.close();
    console.log(`   ✅ ${pg.name}.png (${pg.w*pg.scale}x${pg.h*pg.scale} pixels)`);
  }

  await browser.close();
  console.log('\n🎉 Done! All screenshots saved to:', OUT);
})();
