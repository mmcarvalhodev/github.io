// Inject Open Graph + Twitter Card tags into a page's <head>, derived from the
// page's own <title>, meta description and canonical URL (so locale pages get
// correct, localized cards). Idempotent: strips any existing og:/twitter: tags
// first, so re-runs / re-gens stay clean per locale.
//
// Used two ways:
//   - imported by gen-ph-radar.mjs / gen-yt-radar.mjs (mirrors injectResearch)
//   - run standalone (`node inject-og.mjs`) for the hand-maintained hn-radar pages
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const IMG = 'https://nodus-ai.app/og-image.png';

export function injectOG(html, image = IMG) {
  // remove any existing og:/twitter: meta tags (keeps re-runs correct per locale)
  let h = html.replace(/[ \t]*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\r?\n?/g, '');
  const title = (h.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'NODUS').trim();
  const desc  = (h.match(/<meta name="description" content="([\s\S]*?)"/)?.[1] || '').trim();
  const url   = (h.match(/<link rel="canonical"\s+href="([^"]*)"/)?.[1] || '').trim();

  const L = [
    '  <meta property="og:type" content="website">',
    '  <meta property="og:site_name" content="NODUS">',
    `  <meta property="og:title" content="${title}">`,
  ];
  if (desc) L.push(`  <meta property="og:description" content="${desc}">`);
  if (url)  L.push(`  <meta property="og:url" content="${url}">`);
  L.push(`  <meta property="og:image" content="${image}">`);
  L.push('  <meta name="twitter:card" content="summary_large_image">');
  L.push(`  <meta name="twitter:title" content="${title}">`);
  if (desc) L.push(`  <meta name="twitter:description" content="${desc}">`);
  L.push(`  <meta name="twitter:image" content="${image}">`);

  return h.replace('</head>', L.join('\n') + '\n</head>');
}

// ── standalone: hand-maintained hn-radar pages (root + /[lang]/) ──
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const files = [];
  if (fs.existsSync('hn-radar.html')) files.push('hn-radar.html');
  for (const d of fs.readdirSync('.', { withFileTypes: true })) {
    if (d.isDirectory() && /^[a-z]{2}$/.test(d.name)) {
      const p = path.join(d.name, 'hn-radar.html');
      if (fs.existsSync(p)) files.push(p);
    }
  }
  let n = 0;
  for (const f of files) { fs.writeFileSync(f, injectOG(fs.readFileSync(f, 'utf8')), 'utf8'); n++; }
  console.log('OG injected into', n, 'hn-radar files');
}
