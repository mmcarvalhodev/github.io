/* =====================================================================
   NODUS — Today's Insights widget (homepage only, shared, self-contained)
   - Busca dados ao vivo de /api/ph/week e /api/hn/week (mesma origem,
     CORS já liberado no worker-nodus-insights para consumo por widgets)
   - Uma linha só: frase de contexto + um "chip" compacto por plataforma
     (nome do vencedor de hoje + sparkline dos últimos 7 dias). No hover,
     um popover flutuante (position:absolute) mostra tagline, mini-
     estatísticas da semana e os 7 dias em dots — sem empurrar o layout.
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
    en: {
      phrase: 'See what\'s happening right now', explore: 'Explore all →', ph: 'PH', hn: 'HN',
      votes: 'votes', points: 'points', avgVotes: 'avg votes/day', avgPoints: 'avg points/day',
      bestDay: 'best day', distinctWinners: 'different winners', distinctStories: 'different stories',
      seeWeek: 'see the week →',
    },
    pt: {
      phrase: 'Veja o que está acontecendo agora', explore: 'Ver tudo →', ph: 'PH', hn: 'HN',
      votes: 'votos', points: 'pontos', avgVotes: 'votos/dia', avgPoints: 'pontos/dia',
      bestDay: 'melhor dia', distinctWinners: 'vencedores diferentes', distinctStories: 'histórias diferentes',
      seeWeek: 'ver a semana →',
    },
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
    + '.iw-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}'
    + '.iw-phrase{font-size:14px;font-weight:600;color:#e2e8f0;white-space:nowrap;flex-shrink:0;}'
    + '.iw-chip{position:relative;display:flex;align-items:center;gap:7px;background:#151a23;border:1px solid #232b38;border-radius:20px;padding:6px 12px 6px 6px;text-decoration:none;max-width:260px;transition:border-color .15s;}'
    + '.iw-chip:hover{border-color:#3a4356;text-decoration:none;}'
    + '.iw-chip-badge{font-size:10px;font-weight:700;color:#facc15;background:rgba(250,204,21,.1);border-radius:14px;padding:3px 7px;white-space:nowrap;flex-shrink:0;}'
    + '.iw-chip-name{font-size:13px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px;}'
    + '.iw-chip-spark{width:28px;height:14px;flex-shrink:0;}'
    + '.iw-chip-stat{font-size:12px;color:#10b981;font-weight:600;white-space:nowrap;flex-shrink:0;}'
    + '.iw-explore{font-size:13px;color:#facc15;text-decoration:none;white-space:nowrap;margin-left:auto;flex-shrink:0;}'
    + '.iw-explore:hover{text-decoration:underline;}'
    + '.iw-pop{position:absolute;top:calc(100% + 8px);left:0;width:260px;background:#1a1f29;border:1px solid #2d3748;border-radius:10px;padding:12px;z-index:20;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .15s ease,transform .15s ease;}'
    + '.iw-chip:hover .iw-pop{opacity:1;transform:translateY(0);pointer-events:auto;}'
    + '.iw-pop-tagline{font-size:12px;color:#94a3b8;margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-mini-stats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}'
    + '.iw-mini-stat{font-size:11px;color:#64748b;background:#0e1117;border:1px solid #232b38;border-radius:6px;padding:3px 8px;}'
    + '.iw-mini-stat b{color:#e2e8f0;font-weight:600;}'
    + '.iw-week{display:flex;align-items:center;gap:5px;}'
    + '.iw-dot{width:6px;height:6px;border-radius:50%;background:#2d3748;flex-shrink:0;}'
    + '.iw-dot-active{background:#facc15;}'
    + '.iw-weeklink{font-size:11px;color:#facc15;margin-left:auto;white-space:nowrap;}'
    + '@media(max-width:640px){.iw-phrase{width:100%;}.iw-pop{left:auto;right:0;}}'
    + '@media(hover:none){.iw-pop{position:static;opacity:1;transform:none;pointer-events:auto;width:auto;margin-top:8px;display:none;}}';
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

  function sparklinePoints(values) {
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var range = (max - min) || 1, n = values.length;
    return values.map(function (v, i) {
      var x = n > 1 ? (i / (n - 1)) * 60 : 30;
      var y = 18 - ((v - min) / range) * 16;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }

  function svgNS(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // week: array ordenado DESC por dia (mais recente primeiro), como a API já devolve.
  // valueKey: 'votes_count' (PH) ou 'score' (HN). nameKey: 'name' (PH) ou 'title' (HN).
  function buildChip(opts) {
    var week = opts.week, valueKey = opts.valueKey, nameKey = opts.nameKey;
    var top = week[0];
    var values = week.map(function (w) { return w[valueKey]; }).reverse(); // cronológico p/ sparkline

    var chip = document.createElement('a');
    chip.className = 'iw-chip';
    chip.href = opts.href;
    chip.target = '_blank';
    chip.rel = 'noopener';

    var badge = document.createElement('span');
    badge.className = 'iw-chip-badge';
    badge.textContent = opts.icon + ' ' + opts.badge;
    chip.appendChild(badge);

    var name = document.createElement('span');
    name.className = 'iw-chip-name';
    name.textContent = top[nameKey];
    chip.appendChild(name);

    if (week.length > 1) {
      var svg = svgNS('svg', { class: 'iw-chip-spark', viewBox: '0 0 60 20', preserveAspectRatio: 'none' });
      svg.appendChild(svgNS('polyline', { points: sparklinePoints(values), fill: 'none', stroke: '#facc15', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      var lastPt = sparklinePoints(values).split(' ').pop().split(',');
      svg.appendChild(svgNS('circle', { cx: lastPt[0], cy: lastPt[1], r: '2', fill: '#facc15' }));
      chip.appendChild(svg);
    }

    var stat = document.createElement('span');
    stat.className = 'iw-chip-stat';
    stat.textContent = '▲' + top[valueKey];
    chip.appendChild(stat);

    if (week.length > 1) {
      var avg = Math.round(values.reduce(function (a, b) { return a + b; }, 0) / values.length);
      var bestIdx = 0;
      for (var i = 1; i < week.length; i++) if (week[i][valueKey] > week[bestIdx][valueKey]) bestIdx = i;
      var distinct = {};
      week.forEach(function (w) { distinct[w[nameKey]] = true; });
      var distinctCount = Object.keys(distinct).length;

      var pop = document.createElement('div');
      pop.className = 'iw-pop';

      var tagline = document.createElement('div');
      tagline.className = 'iw-pop-tagline';
      tagline.textContent = opts.subtitle || '';
      pop.appendChild(tagline);

      var mini = document.createElement('div');
      mini.className = 'iw-mini-stats';
      mini.innerHTML =
        '<span class="iw-mini-stat"><b>' + avg + '</b> ' + esc(opts.avgLabel) + '</span>'
        + '<span class="iw-mini-stat"><b>' + esc(opts.bestDayLabel(bestIdx)) + '</b> ' + esc(t.bestDay) + ' · ' + week[bestIdx][valueKey] + '</span>'
        + '<span class="iw-mini-stat"><b>' + distinctCount + '</b> ' + esc(opts.distinctLabel) + '</span>';
      pop.appendChild(mini);

      var weekRow = document.createElement('div');
      weekRow.className = 'iw-week';
      week.forEach(function (w, idx) {
        var dot = document.createElement('span');
        dot.className = 'iw-dot' + (idx === 0 ? ' iw-dot-active' : '');
        dot.title = dayLabel(w[opts.dateKey]) + ' · ' + w[valueKey];
        weekRow.appendChild(dot);
      });
      var weekLink = document.createElement('span');
      weekLink.className = 'iw-weeklink';
      weekLink.textContent = t.seeWeek;
      weekRow.appendChild(weekLink);
      pop.appendChild(weekRow);

      chip.appendChild(pop);
    }

    return chip;
  }

  function buildSection(phWeek, hnWeek) {
    injectCSS();
    var section = document.createElement('section');
    section.className = 'iw-section';

    var bar = document.createElement('div');
    bar.className = 'iw-bar';

    var phrase = document.createElement('span');
    phrase.className = 'iw-phrase';
    phrase.textContent = t.phrase;
    bar.appendChild(phrase);

    if (phWeek.length) {
      bar.appendChild(buildChip({
        week: phWeek, icon: '🏆', badge: t.ph, valueKey: 'votes_count', nameKey: 'name', dateKey: 'pt_day',
        href: 'https://www.producthunt.com/posts/' + phWeek[0].slug,
        subtitle: phWeek[0].tagline,
        avgLabel: t.avgVotes,
        bestDayLabel: function (idx) { return dayLabel(phWeek[idx].pt_day).split(',')[0]; },
        distinctLabel: t.distinctWinners,
      }));
    }
    if (hnWeek.length) {
      bar.appendChild(buildChip({
        week: hnWeek, icon: '🔥', badge: t.hn, valueKey: 'score', nameKey: 'title', dateKey: 'collected_date',
        href: hnWeek[0].url || ('https://news.ycombinator.com/item?id=' + hnWeek[0].item_id),
        subtitle: hnWeek[0].domain || 'news.ycombinator.com',
        avgLabel: t.avgPoints,
        bestDayLabel: function (idx) { return dayLabel(hnWeek[idx].collected_date).split(',')[0]; },
        distinctLabel: t.distinctStories,
      }));
    }

    if (bar.children.length < 2) return null; // só a frase, sem nenhum chip -> no-op

    var explore = document.createElement('a');
    explore.className = 'iw-explore';
    explore.href = langHref('/ph/today');
    explore.textContent = t.explore;
    bar.appendChild(explore);

    section.appendChild(bar);
    return section;
  }

  function mount() {
    var hero = document.querySelector('.hero');
    if (!hero) return; // não é a home -> no-op

    Promise.all([
      fetch('/api/ph/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('/api/hn/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
    ]).then(function (results) {
      var section = buildSection(results[0] || [], results[1] || []);
      if (section) hero.parentNode.insertBefore(section, hero);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
