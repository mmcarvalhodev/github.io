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
      phrase: 'See what\'s happening right now', explore: 'Explore Insights →', ph: 'PH', hn: 'HN',
      votes: 'votes', points: 'points', avgVotes: 'avg votes/day', avgPoints: 'avg points/day',
      bestDay: 'Best day', distinctWinners: 'different winners', distinctStories: 'different stories',
      winnerEyebrow: '🏆 Winner', topStoryEyebrow: '🔥 Top story',
      openDashboard: 'Open dashboard →', install: 'Install {name} →',
    },
    pt: {
      phrase: 'Veja o que está acontecendo agora', explore: 'Ver Insights →', ph: 'PH', hn: 'HN',
      votes: 'votos', points: 'pontos', avgVotes: 'votos/dia', avgPoints: 'pontos/dia',
      bestDay: 'Melhor dia', distinctWinners: 'vencedores diferentes', distinctStories: 'histórias diferentes',
      winnerEyebrow: '🏆 Vencedor', topStoryEyebrow: '🔥 Destaque',
      openDashboard: 'Abrir dashboard →', install: 'Instalar {name} →',
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
    + '.iw-pop{position:absolute;top:calc(100% + 8px);left:0;width:280px;background:#1a1f29;border:1px solid #2d3748;border-radius:10px;padding:14px;z-index:20;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .15s ease,transform .15s ease;}'
    + '.iw-chip:hover .iw-pop{opacity:1;transform:translateY(0);pointer-events:auto;}'
    + '.iw-pop-head{display:flex;align-items:baseline;gap:6px;}'
    + '.iw-pop-eyebrow{font-size:10px;font-weight:700;color:#facc15;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap;flex-shrink:0;}'
    + '.iw-pop-name{font-size:14px;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-pop-tagline{font-size:12px;color:#94a3b8;margin:4px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-pop-divider{height:1px;background:#232b38;margin:10px 0;}'
    + '.iw-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}'
    + '.iw-stat-cell{background:#0e1117;border:1px solid #232b38;border-radius:6px;padding:6px 8px;text-align:center;}'
    + '.iw-stat-cell b{display:block;font-size:15px;font-weight:700;color:#e2e8f0;}'
    + '.iw-stat-cell span{font-size:10px;color:#64748b;}'
    + '.iw-pop-bestday{font-size:11px;color:#94a3b8;margin-top:8px;text-align:center;}'
    + '.iw-pop-bestday b{color:#e2e8f0;}'
    + '.iw-week{display:flex;align-items:center;justify-content:center;gap:5px;margin:12px 0;}'
    + '.iw-dot{width:6px;height:6px;border-radius:50%;background:#2d3748;flex-shrink:0;}'
    + '.iw-dot-active{background:#facc15;}'
    + '.iw-cta-row{display:flex;gap:6px;margin-top:12px;}'
    + '.iw-cta{flex:1;display:block;text-align:center;font-size:11.5px;font-weight:700;border-radius:7px;padding:8px 6px;text-decoration:none;transition:filter .15s,background .15s;white-space:nowrap;}'
    + '.iw-cta-primary{color:#0a0c12;background:#facc15;}'
    + '.iw-cta-primary:hover{filter:brightness(1.1);text-decoration:none;}'
    + '.iw-cta-secondary{color:#e2e8f0;background:transparent;border:1px solid #2d3748;}'
    + '.iw-cta-secondary:hover{border-color:#4a5568;text-decoration:none;}'
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

  function divider() {
    var d = document.createElement('div');
    d.className = 'iw-pop-divider';
    return d;
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

      var head = document.createElement('div');
      head.className = 'iw-pop-head';
      head.innerHTML = '<span class="iw-pop-eyebrow">' + esc(opts.eyebrow) + '</span><span class="iw-pop-name">' + esc(top[nameKey]) + '</span>';
      pop.appendChild(head);

      var tagline = document.createElement('div');
      tagline.className = 'iw-pop-tagline';
      tagline.textContent = opts.subtitle || '';
      pop.appendChild(tagline);

      pop.appendChild(divider());

      var grid = document.createElement('div');
      grid.className = 'iw-stat-grid';
      grid.innerHTML =
        '<div class="iw-stat-cell"><b>' + avg + '</b><span>' + esc(opts.avgLabel) + '</span></div>'
        + '<div class="iw-stat-cell"><b>' + distinctCount + '</b><span>' + esc(opts.distinctLabel) + '</span></div>';
      pop.appendChild(grid);

      var bestday = document.createElement('div');
      bestday.className = 'iw-pop-bestday';
      bestday.innerHTML = esc(t.bestDay) + ': <b>' + esc(opts.bestDayLabel(bestIdx)) + '</b> · ' + week[bestIdx][valueKey];
      pop.appendChild(bestday);

      pop.appendChild(divider());

      var weekRow = document.createElement('div');
      weekRow.className = 'iw-week';
      week.forEach(function (w, idx) {
        var dot = document.createElement('span');
        dot.className = 'iw-dot' + (idx === 0 ? ' iw-dot-active' : '');
        dot.title = dayLabel(w[opts.dateKey]) + ' · ' + w[valueKey];
        weekRow.appendChild(dot);
      });
      pop.appendChild(weekRow);

      var ctaRow = document.createElement('div');
      ctaRow.className = 'iw-cta-row';

      var ctaDash = document.createElement('a');
      ctaDash.className = 'iw-cta iw-cta-primary';
      ctaDash.href = opts.dashboardHref;
      ctaDash.textContent = t.openDashboard;
      ctaRow.appendChild(ctaDash);

      var ctaInstall = document.createElement('a');
      ctaInstall.className = 'iw-cta iw-cta-secondary';
      ctaInstall.href = opts.installHref;
      ctaInstall.target = '_blank';
      ctaInstall.rel = 'noopener';
      ctaInstall.textContent = t.install.replace('{name}', opts.productName);
      ctaRow.appendChild(ctaInstall);

      pop.appendChild(ctaRow);

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
        dashboardHref: langHref('/ph/today'),
        installHref: 'https://chromewebstore.google.com/detail/nodus-ph-radar/cmibcnnkebddlcdjinibkegejpcafgag',
        productName: 'PH Radar',
        eyebrow: t.winnerEyebrow,
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
        dashboardHref: langHref('/hn/today'),
        installHref: 'https://chromewebstore.google.com/detail/nodus-hn-radar/khodlkgkgdkhkljapdllfjnfedamhkmn',
        productName: 'HN Radar',
        eyebrow: t.topStoryEyebrow,
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
