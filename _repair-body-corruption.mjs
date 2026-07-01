// One-off repair: undo the </body> corruption caused by the old
// toLowerCase().lastIndexOf() bug in _inject-resources-menu.mjs, then cleanly
// re-insert resources-menu.js and about-menu.js using the fixed safe logic.
// Run once: node _repair-body-corruption.mjs
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function lastCloseBodyIndex(html) {
  let idx = -1, m, re = /<\/body>/gi;
  while ((m = re.exec(html)) !== null) idx = m.index;
  return idx;
}

const files = walk(ROOT, []);
let repaired = 0, alreadyClean = 0, stillBroken = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('resources-menu.js')) continue;

  if (lastCloseBodyIndex(html) !== -1) { alreadyClean++; continue; }

  // strip out the misplaced tag (with its leading indentation and trailing newline)
  const stripped = html.replace(/[ \t]*<script src="\/resources-menu\.js" defer><\/script>\r?\n/, '');

  const idx = lastCloseBodyIndex(stripped);
  if (idx === -1) { stillBroken++; console.warn('  STILL BROKEN after strip:', path.relative(ROOT, file)); continue; }

  const withResources = stripped.slice(0, idx) + '  <script src="/resources-menu.js" defer></script>\n' + stripped.slice(idx);

  const idx2 = lastCloseBodyIndex(withResources);
  const withBoth = withResources.slice(0, idx2) + '  <script src="/about-menu.js" defer></script>\n' + withResources.slice(idx2);

  fs.writeFileSync(file, withBoth, 'utf8');
  repaired++;
}

console.log(`repaired: ${repaired}  already-clean: ${alreadyClean}  still-broken: ${stillBroken}`);
