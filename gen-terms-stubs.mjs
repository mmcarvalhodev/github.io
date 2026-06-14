// Generates /[lang]/terms.html redirect stubs -> /terms.
//
// Why: Google guessed /[lang]/terms URLs by pattern (it saw /[lang]/privacy,
// /[lang]/faq, ... and tried /[lang]/terms) and logged 15 hard 404s in Search
// Console. Terms of Service is English-only, so instead of 15 translated pages
// each stub canonicalizes + instantly redirects to the single /terms page.
// This turns the 404s into consolidated redirects. Stubs are NOT added to the
// sitemap (the sitemap lists only the canonical /terms).
// Run: node gen-terms-stubs.mjs
import fs from 'fs';
import path from 'path';

const TARGET = 'https://nodus-ai.app/terms';
const LANG_ATTR = { pt:'pt-BR', es:'es', fr:'fr', de:'de', it:'it', nl:'nl', pl:'pl',
  id:'id', vi:'vi', ja:'ja', ko:'ko', zh:'zh', ru:'ru', hi:'hi', tr:'tr' };

function stub(langAttr){
  return [
    '<!DOCTYPE html>',
    '<html lang="' + langAttr + '">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <title>Terms of Service - NODUS</title>',
    '  <link rel="canonical" href="' + TARGET + '">',
    '  <meta http-equiv="refresh" content="0; url=' + TARGET + '">',
    '  <script>location.replace(' + JSON.stringify(TARGET) + ');</script>',
    '</head>',
    '<body>',
    '  <p>Redirecting to the <a href="' + TARGET + '">NODUS Terms of Service</a>…</p>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

for (const [lang, langAttr] of Object.entries(LANG_ATTR)){
  if (!fs.existsSync(lang)) fs.mkdirSync(lang, { recursive: true });
  fs.writeFileSync(path.join(lang, 'terms.html'), stub(langAttr), 'utf8');
  console.log('wrote', lang + '/terms.html');
}
console.log('done.');
