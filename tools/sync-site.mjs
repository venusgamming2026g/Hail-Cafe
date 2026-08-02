/* ==========================================================================
   مزامنة موقع النشر — يبني docs/ من المصدر بدل النسخ اليدوي.

   المصدر الوحيد للنظام هو hail-os/ — عدّل هناك فقط ثم شغّل:
       npm run sync
   فتُنسَخ ملفات النظام إلى docs/hail-os/ ويُعاد توليد docs/menu.html
   من منيو النظام الرسمي. الاختبارات تفشل إذا تباعدت النسخ.
   ========================================================================== */
import { cpSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = dirname(fileURLToPath(new URL('.', import.meta.url)));
const SRC = join(ROOT, 'hail-os');
const DEST = join(ROOT, 'docs', 'hail-os');

/* ملفات التطوير المحلي لا تُنشر */
const EXCLUDE = new Set(['server.mjs', 'README.md', 'تشغيل-النظام.cmd']);

if (!existsSync(SRC)) throw new Error('hail-os/ غير موجود — شغّل الأداة من جذر المشروع');

rmSync(DEST, { recursive: true, force: true });
cpSync(SRC, DEST, {
  recursive: true,
  filter: (src) => !EXCLUDE.has(src.split(/[\\/]/).pop()),
});
console.log('✓ نُسخ hail-os/ إلى docs/hail-os/');

execFileSync(process.execPath, [join(ROOT, 'tools', 'gen-public-menu.mjs')], { stdio: 'inherit' });
console.log('✓ اكتملت المزامنة — docs/ جاهز للنشر');
