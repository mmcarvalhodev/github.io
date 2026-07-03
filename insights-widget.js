/* =====================================================================
   NODUS — Today's Insights widget (homepage only, shared, self-contained)
   Fase 2: carrossel de slot único (PH / HN / YT), ativado agora que a
   3ª fonte (YT Insights) está no ar. Card revezaou sozinho a cada 5s
   (desktop) / 6s (mobile) e PARA DE VEZ (não retoma) assim que o usuário
   interage — hover ou clique num tracinho. Altura do popover travada em
   368px nos 3 estados, para o card nunca "pular" ao trocar de fonte.
   - Busca dados ao vivo de /api/ph/week, /api/hn/week, /api/yt/week
   - Cada fonte tem uma caixa de mídia do mesmo tamanho: thumbnail real
     (YT), favicon do domínio (HN) ou monograma do produto (PH, até o
     coletor do PH Radar propagar thumbnail_url real)
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
      phrase: 'See what\'s happening right now', explore: 'Explore Insights →',
      ph: 'PH', hn: 'HN', yt: 'YT',
      avgVotes: 'avg votes/day', avgPoints: 'avg points/day', avgViews: 'avg views/day',
      bestDay: 'Best day', distinctWinners: 'different winners', distinctStories: 'different stories', distinctChannels: 'different channels',
      winnerEyebrow: '🏆 Winner', topStoryEyebrow: '🔥 Top story', trendingEyebrow: '📈 Trending now',
      openDashboard: 'Open dashboard →', install: 'Install {name} →',
    },
    pt: {
      phrase: 'Veja o que está acontecendo agora', explore: 'Ver Insights →',
      ph: 'PH', hn: 'HN', yt: 'YT',
      avgVotes: 'votos/dia', avgPoints: 'pontos/dia', avgViews: 'views/dia',
      bestDay: 'Melhor dia', distinctWinners: 'vencedores diferentes', distinctStories: 'histórias diferentes', distinctChannels: 'canais diferentes',
      winnerEyebrow: '🏆 Vencedor', topStoryEyebrow: '🔥 Destaque', trendingEyebrow: '📈 Em alta agora',
      openDashboard: 'Abrir dashboard →', install: 'Instalar {name} →',
    },
  };

  var DESKTOP_INTERVAL = 5000;
  var MOBILE_INTERVAL = 6000;

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
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function langHref(path) {
    return lang === 'en' ? path : '/' + lang + path;
  }

  function dayLabel(iso) {
    try {
      var d = new Date(iso + 'T12:00:00Z');
      return d.toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) { return iso; }
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = String(str == null ? '' : str);
    return d.innerHTML;
  }

  function fmt(n) {
    return (n || 0).toLocaleString('en-US');
  }

  function injectCSS() {
    if (document.getElementById('iw-style')) return;
    var css = ''
    + '.iw-section{max-width:1140px;margin:20px auto 0;padding:0 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}'
    + '.iw-bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}'
    + '.iw-phrase{font-size:14px;font-weight:600;color:#e2e8f0;white-space:nowrap;flex-shrink:0;}'
    + '.iw-slot{position:relative;flex-shrink:0;}'
    + '.iw-chip{position:relative;display:flex;align-items:center;gap:7px;background:#151a23;border:1px solid #232b38;border-radius:20px;padding:6px 12px 6px 6px;text-decoration:none;width:280px;max-width:280px;transition:border-color .15s;}'
    + '.iw-chip:hover{border-color:#3a4356;text-decoration:none;}'
    + '.iw-chip-badge{font-size:10px;font-weight:700;color:#facc15;background:rgba(250,204,21,.1);border-radius:14px;padding:3px 7px;white-space:nowrap;flex-shrink:0;}'
    + '.iw-chip-name{font-size:13px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;}'
    + '.iw-chip-stat{font-size:12px;color:#10b981;font-weight:600;white-space:nowrap;flex-shrink:0;}'
    + '.iw-progress{position:absolute;left:0;bottom:-7px;height:2px;width:100%;background:#232b38;border-radius:2px;overflow:hidden;}'
    + '.iw-progress-fill{height:100%;width:0%;background:#facc15;}'
    + '.iw-progress.iw-paused .iw-progress-fill{background:#475569;}'
    + '.iw-dots{display:flex;align-items:center;gap:6px;margin-top:14px;padding-left:2px;}'
    + '.iw-dot{width:16px;height:4px;border-radius:2px;background:#2d3748;border:none;padding:0;cursor:pointer;transition:background .2s,width .2s;}'
    + '.iw-dot-active{background:#facc15;width:22px;}'
    + '.iw-dot:hover{background:#4a5568;}'
    + '.iw-explore{font-size:13px;color:#facc15;text-decoration:none;white-space:nowrap;margin-left:auto;flex-shrink:0;}'
    + '.iw-explore:hover{text-decoration:underline;}'
    + '.iw-pop{position:absolute;top:calc(100% + 14px);left:0;width:290px;height:368px;background:#1a1f29;border:1px solid #2d3748;border-radius:10px;padding:14px;z-index:20;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .15s ease,transform .15s ease;display:flex;flex-direction:column;}'
    + '.iw-chip:hover .iw-pop{opacity:1;transform:translateY(0);pointer-events:auto;}'
    + '.iw-media{width:100%;height:130px;border-radius:8px;margin-bottom:10px;position:relative;overflow:hidden;flex-shrink:0;background:#0e1117;}'
    + '.iw-media img.iw-media-thumb{width:100%;height:100%;object-fit:cover;display:block;}'
    + '.iw-media-tile-wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,#1c2330,#12161f);}'
    + '.iw-media-tile{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#0a0c12;overflow:hidden;}'
    + '.iw-media-tile img{width:100%;height:100%;object-fit:contain;}'
    + '.iw-pop-body{flex:1;min-height:0;display:flex;flex-direction:column;}'
    + '.iw-pop-head{display:flex;align-items:baseline;gap:6px;}'
    + '.iw-pop-eyebrow{font-size:10px;font-weight:700;color:#facc15;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap;flex-shrink:0;}'
    + '.iw-pop-name{font-size:14px;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-pop-tagline{font-size:12px;color:#94a3b8;margin:4px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-pop-divider{height:1px;background:#232b38;margin:10px 0;}'
    + '.iw-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}'
    + '.iw-stat-cell{background:#0e1117;border:1px solid #232b38;border-radius:6px;padding:6px 8px;text-align:center;}'
    + '.iw-stat-cell b{display:block;font-size:15px;font-weight:700;color:#e2e8f0;}'
    + '.iw-stat-cell span{font-size:10px;color:#64748b;}'
    + '.iw-cta-row{display:flex;gap:6px;margin-top:auto;padding-top:12px;}'
    + '.iw-cta{flex:1;display:block;text-align:center;font-size:11.5px;font-weight:700;border-radius:7px;padding:8px 6px;text-decoration:none;transition:filter .15s,background .15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    + '.iw-cta-primary{color:#0a0c12;background:#facc15;}'
    + '.iw-cta-primary:hover{filter:brightness(1.1);text-decoration:none;}'
    + '.iw-cta-secondary{color:#e2e8f0;background:transparent;border:1px solid #2d3748;}'
    + '.iw-cta-secondary:hover{border-color:#4a5568;text-decoration:none;}'
    + '@media(max-width:640px){.iw-phrase{width:100%;}.iw-pop{left:auto;right:0;}}'
    + '@media(hover:none){.iw-pop{position:static;opacity:1;transform:none;pointer-events:auto;width:auto;height:auto;margin-top:8px;display:none;}}';
    var s = document.createElement('style');
    s.id = 'iw-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── Normaliza cada fonte pra um formato comum consumido pelo carrossel ──

  function computeWeekStats(week, valueKey, distinctKey) {
    var values = week.map(function (w) { return w[valueKey] || 0; });
    var avg = Math.round(values.reduce(function (a, b) { return a + b; }, 0) / values.length);
    var distinct = {};
    week.forEach(function (w) { distinct[w[distinctKey]] = true; });
    return { avg: avg, distinctCount: Object.keys(distinct).length };
  }

  function buildPHSource(phWeek) {
    var top = phWeek[0];
    var stats = computeWeekStats(phWeek, 'votes_count', 'name');
    return {
      badge: t.ph,
      name: top.name,
      stat: '▲' + fmt(top.votes_count),
      tagline: top.tagline || '',
      eyebrow: t.winnerEyebrow,
      href: 'https://www.producthunt.com/posts/' + top.slug,
      dashboardHref: langHref('/ph/today'),
      installHref: 'https://chromewebstore.google.com/detail/nodus-ph-radar/cmibcnnkebddlcdjinibkegejpcafgag',
      productName: 'PH Radar',
      avg: stats.avg, avgLabel: t.avgVotes,
      distinctCount: stats.distinctCount, distinctLabel: t.distinctWinners,
      media: top.thumbnail_url
        ? { type: 'img', url: top.thumbnail_url }
        : { type: 'mono', letter: (top.name || '?').charAt(0).toUpperCase(), bg: '#facc15' },
    };
  }

  function buildHNSource(hnWeek) {
    var top = hnWeek[0];
    var stats = computeWeekStats(hnWeek, 'score', 'title');
    var domain = top.domain || 'news.ycombinator.com';
    return {
      badge: t.hn,
      name: top.title,
      stat: '▲' + fmt(top.score),
      tagline: domain,
      eyebrow: t.topStoryEyebrow,
      href: top.url || ('https://news.ycombinator.com/item?id=' + top.item_id),
      dashboardHref: langHref('/hn/today'),
      installHref: 'https://chromewebstore.google.com/detail/nodus-hn-radar/khodlkgkgdkhkljapdllfjnfedamhkmn',
      productName: 'HN Radar',
      avg: stats.avg, avgLabel: t.avgPoints,
      distinctCount: stats.distinctCount, distinctLabel: t.distinctStories,
      media: { type: 'favicon', domain: domain, letter: domain.charAt(0).toUpperCase(), bg: '#ff6600' },
    };
  }

  function buildYTSource(ytWeek) {
    var top = ytWeek[0];
    var stats = computeWeekStats(ytWeek, 'view_count', 'channel');
    return {
      badge: t.yt,
      name: top.title,
      stat: '▲' + fmt(top.view_count),
      tagline: top.channel || '',
      eyebrow: t.trendingEyebrow,
      href: 'https://www.youtube.com/watch?v=' + top.video_id,
      dashboardHref: langHref('/yt/today'),
      installHref: 'https://chromewebstore.google.com/detail/nodus-yt-radar/ebfnahokkelbeiknkmkkkmeliikhmdhk',
      productName: 'YT Radar',
      avg: stats.avg, avgLabel: t.avgViews,
      distinctCount: stats.distinctCount, distinctLabel: t.distinctChannels,
      media: { type: 'img', url: 'https://i.ytimg.com/vi/' + encodeURIComponent(top.video_id) + '/hqdefault.jpg' },
    };
  }

  // Sempre retorna uma caixa .iw-media (130px fixo, via CSS) — é essa altura
  // travada que garante que o popover não muda de tamanho entre PH/HN/YT.
  function renderMedia(media) {
    var box = document.createElement('div');
    box.className = 'iw-media';

    if (media.type === 'img') {
      var img = document.createElement('img');
      img.className = 'iw-media-thumb';
      img.src = media.url;
      img.alt = '';
      img.loading = 'lazy';
      img.onerror = function () { img.style.display = 'none'; };
      box.appendChild(img);
      return box;
    }

    // favicon ou monograma: tile colorido com letra; favicon tenta carregar
    // a imagem por cima e cai pro monograma se falhar (domínio sem favicon).
    var wrap = document.createElement('div');
    wrap.className = 'iw-media-tile-wrap';
    var tile = document.createElement('div');
    tile.className = 'iw-media-tile';
    tile.style.background = media.bg || '#facc15';
    tile.textContent = media.letter || '?';
    wrap.appendChild(tile);
    if (media.type === 'favicon') {
      var fav = document.createElement('img');
      fav.src = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(media.domain) + '&sz=128';
      fav.alt = '';
      fav.onerror = function () { fav.remove(); };
      fav.onload = function () { tile.textContent = ''; tile.style.background = 'transparent'; tile.appendChild(fav); };
      // pré-carrega fora da árvore visível; só entra na tile se der certo
    }
    box.appendChild(wrap);
    return box;
  }

  // ── Carrossel: 1 slot só, revezaou entre as fontes, para de vez no hover/clique ──

  function mountCarousel(hero, sources) {
    injectCSS();

    var section = document.createElement('section');
    section.className = 'iw-section';

    var bar = document.createElement('div');
    bar.className = 'iw-bar';

    var phrase = document.createElement('span');
    phrase.className = 'iw-phrase';
    phrase.textContent = t.phrase;
    bar.appendChild(phrase);

    var slot = document.createElement('div');
    slot.className = 'iw-slot';

    var chip = document.createElement('a');
    chip.className = 'iw-chip';
    chip.target = '_blank';
    chip.rel = 'noopener';
    slot.appendChild(chip);

    var progress = document.createElement('div');
    progress.className = 'iw-progress';
    var fill = document.createElement('div');
    fill.className = 'iw-progress-fill';
    progress.appendChild(fill);
    if (sources.length > 1) slot.appendChild(progress);

    bar.appendChild(slot);

    var explore = document.createElement('a');
    explore.className = 'iw-explore';
    explore.href = langHref('/ph/today');
    explore.textContent = t.explore;
    bar.appendChild(explore);

    section.appendChild(bar);

    var dots = document.createElement('div');
    dots.className = 'iw-dots';
    if (sources.length > 1) section.appendChild(dots);

    var idx = 0, timer = null, stopped = false;
    var interval = window.matchMedia('(max-width: 640px)').matches ? MOBILE_INTERVAL : DESKTOP_INTERVAL;

    function draw() {
      var s = sources[idx];
      chip.href = s.href;
      chip.innerHTML = '';

      var badge = document.createElement('span');
      badge.className = 'iw-chip-badge';
      badge.textContent = s.badge;
      chip.appendChild(badge);

      var name = document.createElement('span');
      name.className = 'iw-chip-name';
      name.textContent = s.name;
      chip.appendChild(name);

      var stat = document.createElement('span');
      stat.className = 'iw-chip-stat';
      stat.textContent = s.stat;
      chip.appendChild(stat);

      var pop = document.createElement('div');
      pop.className = 'iw-pop';
      pop.appendChild(renderMedia(s.media));

      var body = document.createElement('div');
      body.className = 'iw-pop-body';

      var head = document.createElement('div');
      head.className = 'iw-pop-head';
      head.innerHTML = '<span class="iw-pop-eyebrow">' + esc(s.eyebrow) + '</span><span class="iw-pop-name">' + esc(s.name) + '</span>';
      body.appendChild(head);

      var tagline = document.createElement('div');
      tagline.className = 'iw-pop-tagline';
      tagline.textContent = s.tagline;
      body.appendChild(tagline);

      var d1 = document.createElement('div');
      d1.className = 'iw-pop-divider';
      body.appendChild(d1);

      var grid = document.createElement('div');
      grid.className = 'iw-stat-grid';
      grid.innerHTML =
        '<div class="iw-stat-cell"><b>' + fmt(s.avg) + '</b><span>' + esc(s.avgLabel) + '</span></div>'
        + '<div class="iw-stat-cell"><b>' + s.distinctCount + '</b><span>' + esc(s.distinctLabel) + '</span></div>';
      body.appendChild(grid);

      var ctaRow = document.createElement('div');
      ctaRow.className = 'iw-cta-row';

      var ctaDash = document.createElement('a');
      ctaDash.className = 'iw-cta iw-cta-primary';
      ctaDash.href = s.dashboardHref;
      ctaDash.textContent = t.openDashboard;
      ctaRow.appendChild(ctaDash);

      var ctaInstall = document.createElement('a');
      ctaInstall.className = 'iw-cta iw-cta-secondary';
      ctaInstall.href = s.installHref;
      ctaInstall.target = '_blank';
      ctaInstall.rel = 'noopener';
      ctaInstall.textContent = t.install.replace('{name}', s.productName);
      ctaRow.appendChild(ctaInstall);

      body.appendChild(ctaRow);
      pop.appendChild(body);
      chip.appendChild(pop);

      if (sources.length > 1) {
        dots.innerHTML = '';
        sources.forEach(function (_, i) {
          var dot = document.createElement('button');
          dot.className = 'iw-dot' + (i === idx ? ' iw-dot-active' : '');
          dot.setAttribute('aria-label', sources[i].badge);
          dot.addEventListener('click', function (e) {
            e.preventDefault();
            idx = i;
            draw();
            stopRotation();
          });
          dots.appendChild(dot);
        });
      }
    }

    function runProgress() {
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth; // força reflow p/ reiniciar a animação
      fill.style.transition = 'width ' + interval + 'ms linear';
      fill.style.width = '100%';
    }

    function tick() {
      idx = (idx + 1) % sources.length;
      draw();
      runProgress();
    }

    function startRotation() {
      if (reducedMotion || stopped || sources.length < 2) return;
      runProgress();
      timer = setInterval(tick, interval);
    }

    function stopRotation() {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      fill.style.transition = 'none';
      fill.style.width = '0%';
      progress.classList.add('iw-paused');
    }

    chip.addEventListener('mouseenter', stopRotation);
    chip.addEventListener('click', stopRotation);

    draw();
    startRotation();

    hero.parentNode.insertBefore(section, hero);
  }

  function mount() {
    var hero = document.querySelector('.hero');
    if (!hero) return; // não é a home -> no-op

    Promise.all([
      fetch('/api/ph/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('/api/hn/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('/api/yt/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
    ]).then(function (results) {
      // >= 1 basta pra entrar no carrossel (uma fonte recém-lançada como o YT
      // pode ter só 1 dia de histórico ainda) — computeWeekStats já lida bem
      // com semanas de 1 item só (média = o próprio valor, 1 distinto).
      var phWeek = results[0] || [], hnWeek = results[1] || [], ytWeek = results[2] || [];
      var sources = [];
      if (phWeek.length) sources.push(buildPHSource(phWeek));
      if (hnWeek.length) sources.push(buildHNSource(hnWeek));
      if (ytWeek.length) sources.push(buildYTSource(ytWeek));
      if (!sources.length) return; // sem dados de nenhuma fonte -> no-op
      mountCarousel(hero, sources);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
