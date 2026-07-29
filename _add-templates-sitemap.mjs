// Acrescenta ao sitemap.xml as páginas da galeria de modelos:
//   /templates.html e /{lang}/templates.html            (16)
//   /templates/{slug}.html e /{lang}/templates/{slug}.html (18 × 16 = 288)
//
//   node _add-templates-sitemap.mjs
//
// Vai no sitemap ESTÁTICO (ao contrário das páginas de dia do /ph/day/, que são
// dinâmicas): os modelos só mudam quando se corre o build, não todo dia.
//
// Idempotente: se já houver entradas de /templates, não duplica.
import fs from 'fs';

const SITE = 'https://nodus-ai.app';
const LANGS = [
  { dir: '',   tag: 'en' }, { dir: 'pt', tag: 'pt' }, { dir: 'es', tag: 'es' },
  { dir: 'fr', tag: 'fr' }, { dir: 'de', tag: 'de' }, { dir: 'it', tag: 'it' },
  { dir: 'nl', tag: 'nl' }, { dir: 'pl', tag: 'pl' }, { dir: 'id', tag: 'id' },
  { dir: 'vi', tag: 'vi' }, { dir: 'ja', tag: 'ja' }, { dir: 'ko', tag: 'ko' },
  { dir: 'zh', tag: 'zh' }, { dir: 'ru', tag: 'ru' }, { dir: 'hi', tag: 'hi' },
  { dir: 'tr', tag: 'tr' },
];
const TODAY = new Date().toISOString().slice(0, 10);

const catalog = JSON.parse(fs.readFileSync('templates/index.json', 'utf8'));
const slugs = catalog.templates.map(t => t.slug);

let xml = fs.readFileSync('sitemap.xml', 'utf8');
// Re-executável: em vez de desistir quando já há entradas, retira as antigas e
// volta a escrevê-las a partir do catálogo. Sair cedo deixava de fora todos os
// modelos acrescentados depois da primeira corrida — foi o que aconteceu ao
// passar de 18 para 33.
const before = (xml.match(/<loc>[^<]*\/templates/g) || []).length;
xml = xml.replace(/[ \t]*<url>[\s\S]*?<\/url>\n?/g, block =>
  /<loc>[^<]*\/templates(?:\.html|\/)/.test(block) ? '' : block);
xml = xml.replace(/\n{3,}/g, '\n\n');
if (before) console.log(`removidas ${before} entradas antigas de /templates`);

// hreflang SEMPRE a partir do caminho BASE (sem prefixo), nunca do já
// prefixado — o erro inverso gerou centenas de 404 no Search Console.
const withLang = (dir, base) => (dir ? `/${dir}` : '') + base;

function urlBlock(base, priority) {
  const alts = LANGS
    .map(l => `    <xhtml:link rel="alternate" hreflang="${l.tag}"       href="${SITE}${withLang(l.dir, base)}"/>`)
    .join('\n')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${base}"/>`;

  return LANGS.map(l => `  <url>
    <loc>${SITE}${withLang(l.dir, base)}</loc>
${alts}
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n');
}

const blocks = [
  urlBlock('/templates.html', '0.8'),
  ...slugs.map(s => urlBlock(`/templates/${s}.html`, '0.6')),
].join('\n\n');

xml = xml.replace('</urlset>', blocks + '\n\n</urlset>');
fs.writeFileSync('sitemap.xml', xml, 'utf8');

const added = (blocks.match(/<loc>/g) || []).length;
console.log(`acrescentados ${added} URLs (${slugs.length} modelos + galeria, × ${LANGS.length} idiomas)`);
