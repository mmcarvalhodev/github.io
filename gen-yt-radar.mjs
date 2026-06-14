// Generator: bakes /[lang]/yt-radar.html files + rewrites root T dict.
// Also normalizes the root EN body (it was left in a mixed PT/EN state).
// Run: node gen-yt-radar.mjs
import fs from 'fs';
import path from 'path';
import { T } from './yt-i18n.mjs';
import { injectResearch } from './inject-research-footer.mjs';

const ROOT = 'yt-radar.html';
const LANGS = ['pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];
const LANG_ATTR = { pt:'pt-BR', es:'es', fr:'fr', de:'de', it:'it', nl:'nl', pl:'pl',
  id:'id', vi:'vi', ja:'ja', ko:'ko', zh:'zh', ru:'ru', hi:'hi', tr:'tr' };

// Keys that live only in <head> (title/meta) and have no DOM element to bake.
const HEAD_ONLY = new Set(['t-page-title', 't-page-desc']);

function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Replace inner HTML of the element carrying id="KEY" (same-tag close, non-greedy).
function bake(html, id, value){
  const re = new RegExp('(<([a-zA-Z0-9]+)\\b[^>]*?\\bid="' + esc(id) + '"[^>]*>)([\\s\\S]*?)(</\\2>)');
  let hit = false;
  const out = html.replace(re, (m, open, tag, inner, close) => { hit = true; return open + value + close; });
  return { out, hit };
}

const SPLIT = '<script src="lang-switcher.js">';

// ---- 1. Rewrite the root T dict so runtime has all 16 languages ----
let root = fs.readFileSync(ROOT, 'utf8');
const dictLiteral = 'const T = ' + JSON.stringify(T, null, 2) + ';';
const dictRe = /const T = \{[\s\S]*?\n {0,4}\};/;
if (!dictRe.test(root)) { console.error('!! could not locate T dict in root'); process.exit(1); }
root = root.replace(dictRe, dictLiteral);

// ---- 1b. Normalize the root EN body (it currently mixes PT/EN strings) ----
{
  const idx = root.indexOf(SPLIT);
  if (idx === -1){ console.error('!! split marker not found'); process.exit(1); }
  let head = root.slice(0, idx);
  const rest = root.slice(idx);
  const missing = [];
  for (const [id, val] of Object.entries(T.en)){
    if (HEAD_ONLY.has(id)) continue;
    const r = bake(head, id, val);
    if (!r.hit) missing.push(id); else head = r.out;
  }
  if (missing.length) console.warn('   [en root] not found in body:', missing.join(', '));
  root = head + rest;
}
root = injectResearch(root, 'en', 'radar').html;
fs.writeFileSync(ROOT, root, 'utf8');
console.log('root T dict rewritten with', Object.keys(T).length, 'languages + EN body normalized');

// ---- 2. Generate /[lang]/yt-radar.html ----
for (const lang of LANGS){
  const dict = T[lang];
  if (!dict){ console.error('!! missing dict for', lang); continue; }

  const idx = root.indexOf(SPLIT);
  if (idx === -1){ console.error('!! split marker not found'); process.exit(1); }
  let headBody = root.slice(0, idx);
  let tail = root.slice(idx);

  // -- head edits --
  headBody = headBody.replace('<html lang="en">', '<html lang="' + LANG_ATTR[lang] + '">');
  headBody = headBody.replace(/<title>[\s\S]*?<\/title>/, '<title>' + dict['t-page-title'] + '</title>');
  headBody = headBody.replace(/<meta name="description" content="[\s\S]*?">/,
    '<meta name="description" content="' + dict['t-page-desc'] + '">');
  headBody = headBody.replace('href="https://nodus-ai.app/yt-radar"',
    'href="https://nodus-ai.app/' + lang + '/yt-radar"');
  headBody = headBody.replace(
    '<script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>',
    '<script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>\n  <script>window._forcedLang = \'' + lang + '\';</script>');

  // -- bake body strings --
  const missing = [];
  for (const [id, val] of Object.entries(dict)){
    if (HEAD_ONLY.has(id)) continue;
    const r = bake(headBody, id, val);
    if (!r.hit) missing.push(id); else headBody = r.out;
  }
  if (missing.length) console.warn('   [' + lang + '] not found in body:', missing.join(', '));

  // -- path fixes --
  headBody = headBody.replace('src="chrome-icon.svg"', 'src="/chrome-icon.svg"');
  headBody = headBody.replace('src="firefox-icon.svg"', 'src="/firefox-icon.svg"');
  headBody = headBody.replace(/href="https:\/\/nodus-ai\.app"/g, 'href="https://nodus-ai.app/' + lang + '/"');
  headBody = headBody.replace('href="yt-radar-privacy.html"', 'href="/' + lang + '/yt-radar-privacy"');
  tail = tail.replace('src="lang-switcher.js"', 'src="/lang-switcher.js"');

  const doc = injectResearch(headBody + tail, lang, 'radar').html;
  const dir = lang;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'yt-radar.html'), doc, 'utf8');
  console.log('wrote', dir + '/yt-radar.html');
}
console.log('done.');
