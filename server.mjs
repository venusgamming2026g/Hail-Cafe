/* ==========================================================================
   HAIL OS — خادم ملفات محلي بلا أي حزم خارجية
   يشغّل النظام على الشبكة المحلية حتى تُمسح رموز QR من الجوال فعلياً.
   التشغيل:  node server.mjs [port]
   ========================================================================== */

import { createServer } from 'node:http';
import { exec } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 8787);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.pdf':  'application/pdf',
  '.txt':  'text/plain; charset=utf-8',
};

/* ترتيب العناوين: شبكة المنزل/المكتب أولاً، ومحوّلات WSL و Hyper-V أخيراً،
   لأن الجوال لا يصل إلا عبر عنوان الشبكة الحقيقي. */
function rank(ip) {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  return 2;                                   // 172.16–31 غالباً محوّل افتراضي
}

function lanAddresses() {
  const out = [];
  for (const [name, list] of Object.entries(networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) out.push({ ip: net.address, name });
    }
  }
  return out.sort((a, b) => rank(a.ip) - rank(b.ip));
}

/* المنفذ الفعلي — قد يتغيّر إن كان المطلوب مشغولاً */
let port = PORT;
let attempts = 0;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/' || pathname === '') pathname = '/index.html';

    /* تُخبر الواجهة بعناوين الشبكة حتى تبني رموز QR على العنوان الصحيح */
    if (pathname === '/__net') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ port, addresses: lanAddresses() }));
      return;
    }

    /* منع الخروج خارج مجلد المشروع */
    const target = normalize(join(ROOT, pathname));
    if (!target.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    let file = target;
    try {
      const info = await stat(file);
      if (info.isDirectory()) file = join(file, 'index.html');
    } catch {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end('<meta charset="utf-8"><div style="font:16px system-ui;padding:40px;text-align:center">الصفحة غير موجودة — <a href="/">العودة للرئيسية</a></div>');
      return;
    }

    const data = await readFile(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
});

/* إن كان المنفذ مشغولاً ننتقل تلقائياً للذي يليه بدل التوقّف */
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && attempts < 8) {
    attempts += 1;
    port += 1;
    console.log(`  المنفذ ${port - 1} مشغول — أجرّب ${port}…`);
    server.listen(port, '0.0.0.0');
    return;
  }
  throw err;
});

server.on('listening', () => {
  const ips = lanAddresses();
  const line = '─'.repeat(56);
  console.log(`\n\x1b[33m${line}\x1b[0m`);
  console.log('  \x1b[1mRestaurant OS\x1b[0m — المنظومة الرقمية للمطاعم والمقاهي');
  console.log(`\x1b[33m${line}\x1b[0m`);
  const home = `http://localhost:${port}`;
  console.log(`  على هذا الجهاز :  \x1b[36m${home}\x1b[0m`);
  ips.forEach(({ ip, name }, i) =>
    console.log(`  على الشبكة     :  \x1b[36mhttp://${ip}:${port}\x1b[0m  (${name})${i === 0 ? ' \x1b[32m← الأرجح\x1b[0m' : ''}`));
  console.log(`\n  الشاشات:`);
  console.log(`    مركز الإطلاق   /            الزبون (QR)  /menu.html?t=3`);
  console.log(`    المطبخ         /kds.html    الصالة        /floor.html`);
  console.log(`    الكاشير        /cashier.html  الإدارة     /admin.html`);
  if (ips.length) {
    console.log(`\n  \x1b[32mلمسح QR من الجوال: اربط الجوال بنفس الشبكة وافتح http://${ips[0].ip}:${port}\x1b[0m`);
  }
  console.log(`\n  للإيقاف: Ctrl + C\n`);

  /* فتح المتصفح على المنفذ الصحيح فعلياً (وليس المنفذ المطلوب) */
  if (process.env.HAIL_OPEN === '1') {
    const cmd = process.platform === 'win32' ? `start "" "${home}"`
      : process.platform === 'darwin' ? `open "${home}"` : `xdg-open "${home}"`;
    exec(cmd, () => { /* لا يهمّ إن تعذّر الفتح */ });
  }
});

server.listen(port, '0.0.0.0');
