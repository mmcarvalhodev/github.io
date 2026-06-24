// Shared "Research" footer block + its 16-language strings (single source of truth).
// Lists one or more research projects under a translated "Research" label.
//
// Two consumers:
//   1. gen-yt-radar.mjs / gen-ph-radar.mjs import injectResearch() and call it on
//      every doc they write, so regenerating those radars never drops the block.
//   2. Running this file directly (`node inject-research-footer.mjs`) post-processes
//      the hand-authored pages that have no generator: the 16 homepages, the 16 HN
//      Radar pages, plus intent-ai.html and workspace.html.
//
// Idempotent: the block is wrapped in <!-- research:start/end --> markers, so a
// re-run replaces the existing block instead of stacking duplicates.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const LANGS = ['pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];

// "Research" section label, per language.
const LABEL = {
  en:'Research', pt:'Pesquisa', es:'Investigación', fr:'Recherche', de:'Forschung',
  it:'Ricerca', nl:'Onderzoek', pl:'Badania', id:'Riset', vi:'Nghiên cứu',
  ja:'研究', ko:'연구', zh:'研究', ru:'Исследование', hi:'अनुसंधान', tr:'Araştırma',
};

// Research projects listed in the footer. `external:true` opens in a new tab.
const PROJECTS = [
  {
    url: '/intent-ai',
    name: 'Intent AI',
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
  },
  {
    url: 'https://mmcarvalhodev.github.io/hierarchical-bits/',
    name: 'Hierarchical Bits',
    external: true,
    desc: {
      en:"A file format that's compact and navigable at once",
      pt:'Um formato de arquivo compacto e navegável ao mesmo tempo',
      es:'Un formato de archivo compacto y navegable a la vez',
      fr:'Un format de fichier à la fois compact et navigable',
      de:'Ein Dateiformat, das kompakt und zugleich navigierbar ist',
      it:'Un formato di file compatto e navigabile allo stesso tempo',
      nl:'Een bestandsformaat dat compact én navigeerbaar is',
      pl:'Format pliku zarazem zwarty i nawigowalny',
      id:'Format file yang ringkas sekaligus bisa dijelajahi',
      vi:'Một định dạng tệp vừa nhỏ gọn vừa dễ điều hướng',
      ja:'コンパクトかつナビゲート可能なファイル形式',
      ko:'작으면서도 탐색 가능한 파일 형식',
      zh:'既紧凑又可导航的文件格式',
      ru:'Формат файла, одновременно компактный и навигируемый',
      hi:'एक फ़ाइल फ़ॉर्मेट जो कॉम्पैक्ट और नेविगेबल दोनों है',
      tr:'Hem küçük hem de gezinilebilir bir dosya biçimi',
    },
  },
];

// One <span> line per project: "<a>Name</a> — desc"
function projectLines(lang, indent){
  return PROJECTS.map(function (p) {
    const d = p.desc[lang] || p.desc.en;
    const ext = p.external ? ' target="_blank" rel="noopener"' : '';
    return indent + '<span style="display:block;margin-top:5px;">'
      + '<a href="' + p.url + '"' + ext + ' style="color:#fb923c;text-decoration:none;font-weight:600;">' + p.name + '</a>'
      + '<span style="color:#fb923c;opacity:.7;"> — ' + d + '</span>'
      + '</span>';
  });
}

// shape 'home'  -> full-width divider strip inside the multi-column footer
// shape 'radar' -> compact block under the copyright in the simple radar footer
function researchBlock(lang, shape){
  const L = LABEL[lang] || LABEL.en;
  if (shape === 'home'){
    return [
      '      <!-- research:start -->',
      '      <div style="padding:18px 0;border-bottom:1px solid #1e2736;font-size:12px;line-height:1.6;">',
      '        <span style="text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#fb923c;">' + L + '</span>',
      ...projectLines(lang, '        '),
      '      </div>',
      '      <!-- research:end -->',
    ].join('\n');
  }
  return [
    '    <!-- research:start -->',
    '    <div style="margin-top:16px;font-size:12px;line-height:1.6;">',
    '      <span style="text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#fb923c;">' + L + '</span>',
    ...projectLines(lang, '      '),
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

// ---- standalone: process the hand-authored pages (no generator of their own) ----
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
    { file: 'intent-ai.html', shape: 'radar' },
    { file: 'workspace.html', shape: 'radar' },
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
