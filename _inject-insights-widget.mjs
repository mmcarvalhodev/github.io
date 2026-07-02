// Idempotent injector: adds <script src="/insights-widget.js" defer></script>
// before </body> — SÓ em index.html (raiz + cada idioma), diferente dos
// outros injetores que tocam todas as páginas. O widget só faz sentido na
// home (ele mesmo verifica document.querySelector('.hero') e não faz nada
// se não achar, mas evitamos até carregar o script fora da home).
// Run: node _inject-insights-widget.mjs
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TAG = '  <script src="/insights-widget.js" defer></script>\n';

function findIndexFiles(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      findIndexFiles(full, acc);
    } else if (e.name === 'index.html') {
      acc.push(full);
    }
  }
  return acc;
}

const files = findIndexFiles(ROOT, []);
let added = 0, already = 0, nobody = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('insights-widget.js')) { already++; continue; }

  let idx = -1, m, re = /<\/body>/gi;
  while ((m = re.exec(html)) !== null) idx = m.index;
  if (idx === -1) { nobody++; console.warn('  no </body>:', path.relative(ROOT, file)); continue; }

  html = html.slice(0, idx) + TAG + html.slice(idx);
  fs.writeFileSync(file, html, 'utf8');
  added++;
}

console.log(`added: ${added}  already: ${already}  no-body: ${nobody}  total index.html found: ${files.length}`);
