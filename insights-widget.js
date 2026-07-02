/* =====================================================================
   NODUS — Today's Insights widget (homepage only, shared, self-contained)
   - Busca dados ao vivo de /api/ph/today e /api/hn/today (mesma origem,
     CORS já liberado no worker-nodus-insights para consumo por widgets)
   - Só monta se encontrar .hero na página (ou seja, só na home) e só
     depois que os dados chegarem — sem estado de loading, sem no-op feio
   - Auto-detecta idioma (mesmo padrão de resources-menu.js) só para o
     texto próprio do widget; o conteúdo (nome de produto, título de post)
     vem como está da API, no idioma original
   ===================================================================== */
(function () {
  'use strict';
  if (window.__nodusInsightsWidget) return;
  window.__nodusInsightsWidget = true;

  var KNOWN = ['en','pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];

  var LABEL = {
    en: { title: 'Today\'s Insights', explore: 'Explore all →', ph: 'Product Hunt', hn: 'Hacker News', votes: 'votes', points: 'points' },
    pt: { title: 'Insights de hoje',  explore: 'Ver tudo →',    ph: 'Product Hunt', hn: 'Hacker News', votes: 'votos',  points: 'pontos' },
  };

  function detectLang() {
    var l = (window._forcedLang || '').toLowerCase();
    if (KNOWN.indexOf(l) !== -1) return l;
    var m = location.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
    if (m && KNOWN.indexOf(m[1]) !== -1) return m[1];
    var h = (document.documentElement.getAttribute('lang') || '').toLowerCase().split('-')[0];
    if (KNOWN.indexOf(h) !== -1) return h;
    return 'en';
  }

  var lang = detectLang();
  var t = LABEL[lang] || LABEL.en;

  function langHref(path) {
    return lang === 'en' ? path : '/' + lang + path;
  }

  function injectCSS() {
    if (document.getElementById('iw-style')) return;
    var css = ''
    + '.iw-section{max-width:1140px;margin:20px auto 0;padding:0 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}'
    + '.iw-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}'
    + '.iw-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;}'
    + '.iw-explore{font-size:13px;color:#facc15;text-decoration:none;}'
    + '.iw-explore:hover{text-decoration:underline;}'
    + '.iw-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}'
    + '.iw-card{display:block;background:#1a1f29;border:1px solid #2d3748;border-radius:12px;padding:16px 18px;text-decoration:none;transition:border-color .15s;}'
    + '.iw-card:hover{border-color:#facc15;text-decoration:none;}'
    + '.iw-badge{display:block;font-size:11px;font-weight:700;color:#facc15;text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;}'
    + '.iw-name{display:block;font-size:15px;font-weight:600;color:#e2e8f0;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-stat{display:block;font-size:13px;color:#10b981;font-weight:600;}'
    + '@media(max-width:640px){.iw-cards{grid-template-columns:1fr;}}';
    var s = document.createElement('style');
    s.id = 'iw-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = String(str == null ? '' : str);
    return d.innerHTML;
  }

  function buildSection(ph, hn) {
    injectCSS();
    var section = document.createElement('section');
    section.className = 'iw-section';

    var cards = '';
    if (ph) {
      cards += '<a class="iw-card" href="' + langHref('/ph/today') + '">'
        + '<span class="iw-badge">🏆 ' + esc(t.ph) + '</span>'
        + '<span class="iw-name">' + esc(ph.name) + '</span>'
        + '<span class="iw-stat">▲ ' + esc(ph.votes_count) + ' ' + esc(t.votes) + '</span>'
        + '</a>';
    }
    if (hn) {
      cards += '<a class="iw-card" href="' + langHref('/hn/today') + '">'
        + '<span class="iw-badge">🔥 ' + esc(t.hn) + '</span>'
        + '<span class="iw-name">' + esc(hn.title) + '</span>'
        + '<span class="iw-stat">▲ ' + esc(hn.score) + ' ' + esc(t.points) + '</span>'
        + '</a>';
    }
    if (!cards) return null;

    section.innerHTML =
      '<div class="iw-header">'
      + '<span class="iw-title">' + esc(t.title) + '</span>'
      + '<a class="iw-explore" href="' + langHref('/ph/today') + '">' + esc(t.explore) + '</a>'
      + '</div>'
      + '<div class="iw-cards">' + cards + '</div>';

    return section;
  }

  function mount() {
    var hero = document.querySelector('.hero');
    if (!hero) return; // não é a home -> no-op

    Promise.all([
      fetch('/api/ph/today').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('/api/hn/today').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
    ]).then(function (results) {
      var ph = results[0] && results[0][0];
      var hn = results[1] && results[1][0];
      var section = buildSection(ph, hn);
      if (section) hero.parentNode.insertBefore(section, hero);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
