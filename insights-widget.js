/* =====================================================================
   NODUS — Today's Insights widget (homepage only, shared, self-contained)
   - Busca dados ao vivo de /api/ph/week e /api/hn/week (mesma origem,
     CORS já liberado no worker-nodus-insights para consumo por widgets)
   - Cada card roda pelos vencedores dos últimos 7 dias com crossfade,
     em vez de mostrar só o dia de hoje parado
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
  var ROTATE_MS = 4000;

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
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function langHref(path) {
    return lang === 'en' ? path : '/' + lang + path;
  }

  function dayLabel(iso) {
    try {
      var d = new Date(iso + 'T12:00:00Z');
      return d.toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) { return iso; }
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
    + '.iw-card{display:block;background:#1a1f29;border:1px solid #2d3748;border-radius:12px;padding:16px 18px;text-decoration:none;transition:border-color .15s;position:relative;overflow:hidden;}'
    + '.iw-card:hover{border-color:#facc15;text-decoration:none;}'
    + '.iw-badge-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}'
    + '.iw-badge{font-size:11px;font-weight:700;color:#facc15;text-transform:uppercase;letter-spacing:.03em;}'
    + '.iw-day{font-size:11px;color:#64748b;font-weight:600;}'
    + '.iw-body{transition:opacity .25s ease;}'
    + '.iw-body.iw-fade{opacity:0;}'
    + '.iw-name{display:block;font-size:15px;font-weight:600;color:#e2e8f0;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-stat{display:block;font-size:13px;color:#10b981;font-weight:600;}'
    + '.iw-dots{display:flex;gap:4px;margin-top:12px;}'
    + '.iw-dot{width:5px;height:5px;border-radius:50%;background:#2d3748;transition:background .2s;}'
    + '.iw-dot.iw-dot-active{background:#facc15;}'
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

  // Constrói 1 card com rotação entre `items` (cada item: {day, name, stat, href}).
  // Se só houver 1 item, fica estático (sem pontos, sem timer) — nada de vida
  // artificial quando não há de fato uma semana de dados ainda.
  function buildCard(icon, badge, items) {
    var card = document.createElement('a');
    card.className = 'iw-card';
    card.target = '_blank';
    card.rel = 'noopener';

    var dotsHtml = items.length > 1
      ? '<div class="iw-dots">' + items.map(function (_, i) {
          return '<span class="iw-dot' + (i === 0 ? ' iw-dot-active' : '') + '"></span>';
        }).join('') + '</div>'
      : '';

    card.innerHTML =
      '<div class="iw-badge-row">'
      + '<span class="iw-badge">' + icon + ' ' + esc(badge) + '</span>'
      + '<span class="iw-day"></span>'
      + '</div>'
      + '<div class="iw-body">'
      + '<span class="iw-name"></span>'
      + '<span class="iw-stat"></span>'
      + '</div>'
      + dotsHtml;

    var dayEl = card.querySelector('.iw-day');
    var body = card.querySelector('.iw-body');
    var nameEl = card.querySelector('.iw-name');
    var statEl = card.querySelector('.iw-stat');
    var dots = card.querySelectorAll('.iw-dot');

    function render(i) {
      var item = items[i];
      card.href = item.href;
      dayEl.textContent = item.day;
      nameEl.textContent = item.name;
      statEl.textContent = item.stat;
      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('iw-dot-active', k === i);
    }
    render(0);

    if (items.length > 1 && !reduceMotion) {
      var i = 0, paused = false, timer;
      card.addEventListener('mouseenter', function () { paused = true; });
      card.addEventListener('mouseleave', function () { paused = false; });
      timer = setInterval(function () {
        if (paused) return;
        i = (i + 1) % items.length;
        body.classList.add('iw-fade');
        setTimeout(function () {
          render(i);
          body.classList.remove('iw-fade');
        }, 250);
      }, ROTATE_MS);
    }

    return card;
  }

  function buildSection(phItems, hnItems) {
    injectCSS();
    var section = document.createElement('section');
    section.className = 'iw-section';

    var cardsWrap = document.createElement('div');
    cardsWrap.className = 'iw-cards';
    if (phItems.length) cardsWrap.appendChild(buildCard('🏆', t.ph, phItems));
    if (hnItems.length) cardsWrap.appendChild(buildCard('🔥', t.hn, hnItems));
    if (!cardsWrap.children.length) return null;

    var header = document.createElement('div');
    header.className = 'iw-header';
    header.innerHTML =
      '<span class="iw-title">' + esc(t.title) + '</span>'
      + '<a class="iw-explore" href="' + langHref('/ph/today') + '">' + esc(t.explore) + '</a>';

    section.appendChild(header);
    section.appendChild(cardsWrap);
    return section;
  }

  function mount() {
    var hero = document.querySelector('.hero');
    if (!hero) return; // não é a home -> no-op

    Promise.all([
      fetch('/api/ph/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('/api/hn/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
    ]).then(function (results) {
      var phItems = (results[0] || []).map(function (p) {
        return {
          day: dayLabel(p.pt_day),
          name: p.name,
          stat: '▲ ' + p.votes_count + ' ' + t.votes,
          href: 'https://www.producthunt.com/posts/' + p.slug,
        };
      });
      var hnItems = (results[1] || []).map(function (h) {
        return {
          day: dayLabel(h.collected_date),
          name: h.title,
          stat: '▲ ' + h.score + ' ' + t.points,
          href: h.url || ('https://news.ycombinator.com/item?id=' + h.item_id),
        };
      });

      var section = buildSection(phItems, hnItems);
      if (section) hero.parentNode.insertBefore(section, hero);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
