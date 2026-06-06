// Generator: bakes /[lang]/ph-radar-privacy.html from the English root.
// Single source of truth: ph-priv-i18n.mjs (exports P).
// Run: node gen-ph-radar-privacy.mjs
import fs from 'fs';
import path from 'path';
import { P } from './ph-priv-i18n.mjs';

const ROOT = 'ph-radar-privacy.html';
const LANGS = ['pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];
const LANG_ATTR = { pt:'pt-BR', es:'es', fr:'fr', de:'de', it:'it', nl:'nl', pl:'pl',
  id:'id', vi:'vi', ja:'ja', ko:'ko', zh:'zh', ru:'ru', hi:'hi', tr:'tr' };

const rawRoot = fs.readFileSync(ROOT, 'utf8');
// Strip any previously-injected runtime scripts so the generator is idempotent.
const base = rawRoot
  .replace(/\n?[ \t]*<script>window\._forcedLang = '[^']*';<\/script>/g, '')
  .replace(/\n?[ \t]*<script src="\/lang-switcher\.js"><\/script>/g, '');
const en = P.en;

// Replace each English block with its translation. Longest EN first so that a
// short string that is a substring of a longer one never corrupts the longer.
function translateBody(html, lang){
  const dict = P[lang];
  const keys = Object.keys(en).sort((a,b) => en[b].length - en[a].length);
  const missing = [];
  let out = html;
  for (const k of keys){
    const src = en[k];
    const dst = dict[k];
    if (dst === undefined){ missing.push(k + '(untranslated)'); continue; }
    if (!out.includes(src)){ missing.push(k + '(not-found)'); continue; }
    out = out.split(src).join(dst);
  }
  return { out, missing };
}

function fixPaths(html, lang){
  let h = html;
  h = h.replace(/href="ph-radar\.html#dashboard"/g, 'href="/' + lang + '/ph-radar#dashboard"');
  h = h.replace(/href="ph-radar\.html"/g, 'href="/' + lang + '/ph-radar"');
  h = h.replace(/href="https:\/\/nodus-ai\.app\/"/g, 'href="/' + lang + '/"');
  h = h.replace(/href="privacy\.html"/g, 'href="/' + lang + '/privacy"');
  h = h.replace(/href="yt-radar-privacy\.html"/g, 'href="/' + lang + '/yt-radar-privacy"');
  h = h.replace(/href="icons\/nodus-48\.png"/g, 'href="/icons/nodus-48.png"');
  return h;
}

// ---- root EN: ensure the language switcher is present ----
const rootOut = base.replace('</body>', '  <script src="/lang-switcher.js"></script>\n</body>');
if (rootOut !== rawRoot){
  fs.writeFileSync(ROOT, rootOut, 'utf8');
  console.log('root: lang-switcher ensured');
} else {
  console.log('root: unchanged');
}

// ---- generate /[lang]/ph-radar-privacy.html ----
for (const lang of LANGS){
  if (!P[lang]){ console.error('!! missing dict for', lang); continue; }

  let h = base;
  // head
  h = h.replace('<html lang="en">', '<html lang="' + LANG_ATTR[lang] + '">');
  h = h.replace('href="https://nodus-ai.app/ph-radar-privacy"',
                'href="https://nodus-ai.app/' + lang + '/ph-radar-privacy"');

  // body text
  const { out, missing } = translateBody(h, lang);
  h = out;
  if (missing.length) console.warn('   [' + lang + '] ' + missing.length + ' issues: ' + missing.join(', '));

  // links / assets
  h = fixPaths(h, lang);

  // runtime language pin + switcher
  h = h.replace('</body>',
    "  <script>window._forcedLang = '" + lang + "';</script>\n  <script src=\"/lang-switcher.js\"></script>\n</body>");

  const dir = lang;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'ph-radar-privacy.html'), h, 'utf8');
  console.log('wrote', dir + '/ph-radar-privacy.html' + (missing.length ? '  (with warnings)' : ''));
}
console.log('done.');
