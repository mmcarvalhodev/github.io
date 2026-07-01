// Idempotent injector: adds <script src="/resources-menu.js" defer></script>
// before </body> on every content HTML page. Re-runnable.
// Run: node _inject-resources-menu.mjs
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TAG = '  <script src="/resources-menu.js" defer></script>\n';
const SKIP_NAMES = new Set([
  'googlecd7c5054b794efce.html', // Google site verification token
  'checkout.html'                // Paddle checkout (do not touch)
]);

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

const files = walk(ROOT, []);
let added = 0, already = 0, skipped = 0, nobody = 0;

for (const file of files) {
  const base = path.basename(file);
  if (base.startsWith('_') || SKIP_NAMES.has(base)) { skipped++; continue; }

  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('resources-menu.js')) { already++; continue; }

  const idx = html.toLowerCase().lastIndexOf('</body>');
  if (idx === -1) { nobody++; console.warn('  no </body>:', path.relative(ROOT, file)); continue; }

  html = html.slice(0, idx) + TAG + html.slice(idx);
  fs.writeFileSync(file, html, 'utf8');
  added++;
}

console.log(`added: ${added}  already: ${already}  skipped(_/verify/checkout): ${skipped}  no-body: ${nobody}  total html: ${files.length}`);
