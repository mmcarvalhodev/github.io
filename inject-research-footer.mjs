// Shared "Research" footer block + its 16-language strings (single source of truth).
//
// Two consumers:
//   1. gen-yt-radar.mjs / gen-ph-radar.mjs import injectResearch() and call it on
//      every doc they write, so regenerating those radars never drops the line.
//   2. Running this file directly (`node inject-research-footer.mjs`) post-processes
//      the hand-authored pages that have no generator: the 16 homepages and the
//      16 HN Radar pages.
//
// Idempotent: the block is wrapped in <!-- research:start/end --> markers, so a
// re-run replaces the existing block instead of stacking duplicates.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const LANGS = ['pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];

const RESEARCH = {
  url: '/intent-ai',
  name: 'Intent AI',
  label: {
    en:'Research', pt:'Pesquisa', es:'Investigación', fr:'Recherche', de:'Forschung',
    it:'Ricerca', nl:'Onderzoek', pl:'Badania', id:'Riset', vi:'Nghiên cứu',
    ja:'研究', ko:'연구', zh:'研究', ru:'Исследование', hi:'अनुसंधान', tr:'Araştırma',
  },
  desc: {
    en:'A machine that processes intention, not language',
    pt:'Uma máquina que processa intenção, não linguagem',
    es:'Una máquina que procesa intención, no lenguaje',
    fr:"Une machine qui traite l'intention, pas le langage",
    de:'Eine Maschine, die Absicht verarbeitet, nicht Sprache',
    it:"Una macchina che elabora l'intenzione, non il linguaggio",
    nl:'Een machine die intentie verwerkt, geen taal',
    pl:'Maszyna, która przetwarza intencję, a nie język',
    id:'Mesin yang memproses niat, bukan bahasa',
    vi:'Cỗ máy xử lý ý định, không phải ngôn ngữ',
    ja:'言語ではなく意図を処理するマシン',
    ko:'언어가 아닌 의도를 처리하는 기계',
    zh:'一台处理意图而非语言的机器',
    ru:'Машина, которая обрабатывает намерение, а не язык',
    hi:'एक मशीन जो भाषा नहीं, बल्कि इरादे को संसाधित करती है',
    tr:'Dili değil, niyeti işleyen bir makine',
  },
};

function strings(lang){
  return {
    L: RESEARCH.label[lang] || RESEARCH.label.en,
    D: RESEARCH.desc[lang]  || RESEARCH.desc.en,
  };
}

// shape 'home'  -> full-width divider strip inside the multi-column footer
// shape 'radar' -> compact line under the copyright in the simple radar footer
function researchBlock(lang, shape){
  const { L, D } = strings(lang);
  const link = '<a href="' + RESEARCH.url + '"';
  if (shape === 'home'){
    return [
      '      <!-- research:start -->',
      '      <div style="padding:18px 0;border-bottom:1px solid #1e2736;font-size:12px;line-height:1.6;">',
      '        <span style="text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#fb923c;">' + L + '</span>',
      '        &nbsp;·&nbsp;',
      '        ' + link + ' style="color:#fb923c;text-decoration:none;">' + RESEARCH.name + '</a>',
      '        <span style="color:#fb923c;opacity:.75;"> — ' + D + '</span>',
      '      </div>',
      '      <!-- research:end -->',
    ].join('\n');
  }
  return [
    '    <!-- research:start -->',
    '    <div style="margin-top:16px;font-size:12px;line-height:1.6;">',
    '      <span style="text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#fb923c;">' + L + '</span>',
    '      &nbsp;·&nbsp;',
    '      ' + link + ' style="color:#fb923c;text-decoration:none;">' + RESEARCH.name + '</a>',
    '      &nbsp;—&nbsp;',
    '      <span style="color:#fb923c;opacity:.75;">' + D + '</span>',
    '    </div>',
    '    <!-- research:end -->',
  ].join('\n');
}

const MARKER_RE = /[ \t]*<!-- research:start -->[\s\S]*?<!-- research:end -->/;

// Returns { html, status } where status is 'replaced' | 'inserted' | 'no-anchor'.
export function injectResearch(html, lang, shape){
  const block = researchBlock(lang, shape);
  if (MARKER_RE.test(html)){
    return { html: html.replace(MARKER_RE, block), status: 'replaced' };
  }
  if (shape === 'home'){
    // Anchor on the structural "bottom line" row (copyright + version badge).
    // Present in every homepage; the older 13 localized files lack the comment.
    const HOME_ANCHOR = '<div style="display:flex; align-items:center; justify-content:space-between; padding:20px 0; flex-wrap:wrap; gap:12px;">';
    if (!html.includes(HOME_ANCHOR)) return { html, status: 'no-anchor' };
    return { html: html.replace(HOME_ANCHOR, block + '\n\n      ' + HOME_ANCHOR), status: 'inserted' };
  }
  if (!html.includes('</footer>')) return { html, status: 'no-anchor' };
  return { html: html.replace('</footer>', block + '\n  </footer>'), status: 'inserted' };
}

// ---- standalone: process the hand-authored pages (homepages + HN radar) ----
function langOf(file){
  const m = file.match(/^([a-z]{2})\//);
  return m ? m[1] : 'en';
}

function runStandalone(){
  const targets = [
    { file: 'index.html', shape: 'home' },
    ...LANGS.map(l => ({ file: l + '/index.html', shape: 'home' })),
    { file: 'hn-radar.html', shape: 'radar' },
    ...LANGS.map(l => ({ file: l + '/hn-radar.html', shape: 'radar' })),
  ];
  let ok = 0, miss = 0;
  for (const { file, shape } of targets){
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)){ console.warn('   skip (missing):', file); miss++; continue; }
    const lang = langOf(file);
    const src = fs.readFileSync(abs, 'utf8');
    const { html, status } = injectResearch(src, lang, shape);
    if (status === 'no-anchor'){ console.warn('   !! no anchor in', file); miss++; continue; }
    if (html !== src) fs.writeFileSync(abs, html, 'utf8');
    console.log('   ' + status.padEnd(8), file, '(' + lang + ')');
    ok++;
  }
  console.log('research footer: ' + ok + ' ok, ' + miss + ' skipped');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) runStandalone();
