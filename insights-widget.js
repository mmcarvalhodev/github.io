/* =====================================================================
   NODUS — Today's Insights widget (homepage only, shared, self-contained)
   Fase 2: dois carrosséis de slot único, lado a lado NA MESMA LINHA —
   "See what's happening right now [PH/HN/YT]  Newsletters [newsletters]".
   Cada slot revezaou sozinho a cada 5s (desktop) / 6s (mobile) e PARA
   DE VEZ (não retoma) assim que o usuário interage com ELE — hover ou
   clique num tracinho. Altura do popover travada (368px) em todos os
   estados de um mesmo slot, pra nunca "pular" ao trocar de fonte.
   - Slot 1 (dado ao vivo, amarelo): /api/ph/week, /api/hn/week, /api/yt/week
   - Slot 2 (curadoria via PH topic, azul): /api/newsletters — feed
     "rolling top-N", sem conceito de dia/semana; funil de CTA único
     ("Assinar →"), não dois botões como o slot 1.
   - Cada fonte tem uma caixa de mídia do mesmo tamanho: thumbnail real
     (YT, newsletters quando existir), favicon do domínio (HN) ou
     monograma do produto (PH/newsletters sem thumbnail_url)
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
      nlPhrase: 'Newsletters',
      ph: 'PH', hn: 'HN', yt: 'YT', nl: 'NL',
      avgVotes: 'avg votes/day', avgPoints: 'avg points/day', avgViews: 'avg views/day',
      distinctWinners: 'different winners', distinctStories: 'different stories', distinctChannels: 'different channels',
      winnerEyebrow: '🏆 Winner', topStoryEyebrow: '🔥 Top story', trendingEyebrow: '📈 Trending now', nlEyebrow: '✉️ Newsletter',
      openDashboard: 'Open dashboard →', install: 'Install {name} →', subscribe: 'Subscribe →',
    },
    pt: {
      phrase: 'Veja o que está acontecendo agora', explore: 'Ver Insights →',
      nlPhrase: 'Newsletters',
      ph: 'PH', hn: 'HN', yt: 'YT', nl: 'NL',
      avgVotes: 'votos/dia', avgPoints: 'pontos/dia', avgViews: 'views/dia',
      distinctWinners: 'vencedores diferentes', distinctStories: 'histórias diferentes', distinctChannels: 'canais diferentes',
      winnerEyebrow: '🏆 Vencedor', topStoryEyebrow: '🔥 Destaque', trendingEyebrow: '📈 Em alta agora', nlEyebrow: '✉️ Newsletter',
      openDashboard: 'Abrir dashboard →', install: 'Instalar {name} →', subscribe: 'Assinar →',
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
    + '.iw-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}'
    + '.iw-phrase{font-size:14px;font-weight:600;color:#e2e8f0;white-space:nowrap;flex-shrink:0;}'
    // z-index explícito é essencial aqui: .hero (logo depois deste widget no
    // HTML) também tem position:relative, então sem um z-index nosso os dois
    // caem no mesmo "balde" de empilhamento CSS (positioned, z-index:auto) —
    // nesse balde, quem vem DEPOIS no HTML pinta por cima, e .hero vence,
    // cobrindo os dots inteiros (só descoberto testando em produção real).
    + '.iw-slot{position:relative;z-index:1;flex-shrink:0;}'
    + '.iw-chip{position:relative;display:flex;align-items:center;gap:7px;background:#151a23;border:1px solid #232b38;border-radius:20px;padding:6px 12px 6px 6px;text-decoration:none;width:250px;max-width:250px;transition:border-color .15s;}'
    + '.iw-chip::after{content:"";position:absolute;top:100%;left:0;width:100%;height:14px;}'
    + '.iw-chip:hover{border-color:#3a4356;text-decoration:none;}'
    + '.iw-chip-badge{font-size:10px;font-weight:700;border-radius:14px;padding:3px 7px;white-space:nowrap;flex-shrink:0;}'
    + '.iw-chip-badge-yellow{color:#facc15;background:rgba(250,204,21,.1);}'
    + '.iw-chip-badge-blue{color:#60a5fa;background:rgba(96,165,250,.12);}'
    + '.iw-chip-name{font-size:13px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;}'
    + '.iw-chip-stat{font-size:12px;color:#10b981;font-weight:600;white-space:nowrap;flex-shrink:0;}'
    + '.iw-progress{position:absolute;left:0;bottom:-7px;height:2px;width:100%;background:#232b38;border-radius:2px;overflow:hidden;}'
    + '.iw-progress-fill{height:100%;width:0%;}'
    + '.iw-progress-fill-yellow{background:#facc15;}'
    + '.iw-progress-fill-blue{background:#60a5fa;}'
    + '.iw-progress.iw-paused .iw-progress-fill{background:#475569 !important;}'
    + '.iw-dots{position:absolute;left:-4px;bottom:-20px;display:flex;align-items:center;}'
    + '.iw-dot{width:20px;height:18px;background:transparent;border:none;padding:0;margin:0;cursor:pointer;display:flex;align-items:center;justify-content:center;}'
    + '.iw-dot-visual{width:12px;height:3px;border-radius:2px;background:#2d3748;transition:background .2s;}'
    + '.iw-dot:hover .iw-dot-visual{background:#4a5568;}'
    + '.iw-dot-active-yellow .iw-dot-visual{background:#facc15;}'
    + '.iw-dot-active-blue .iw-dot-visual{background:#60a5fa;}'
    + '.iw-explore{font-size:13px;color:#facc15;text-decoration:none;white-space:nowrap;margin-left:auto;flex-shrink:0;}'
    + '.iw-explore:hover{text-decoration:underline;}'
    + '.iw-pop{position:absolute;top:calc(100% + 14px);left:0;width:290px;height:368px;background:#1a1f29;border:1px solid #2d3748;border-radius:10px;padding:14px;z-index:20;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .15s ease,transform .15s ease;display:flex;flex-direction:column;}'
    + '.iw-chip:hover .iw-pop{opacity:1;transform:translateY(0);pointer-events:auto;}'
    + '@media(max-width:640px){.iw-pop{left:auto;right:0;}}'
    + '.iw-media{width:100%;height:130px;border-radius:8px;margin-bottom:10px;position:relative;overflow:hidden;flex-shrink:0;background:#0e1117;}'
    + '.iw-media img.iw-media-thumb{width:100%;height:100%;object-fit:cover;display:block;}'
    + '.iw-media-tile-wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,#1c2330,#12161f);}'
    + '.iw-media-tile{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#0a0c12;overflow:hidden;}'
    + '.iw-media-tile img{width:100%;height:100%;object-fit:contain;}'
    + '.iw-pop-body{flex:1;min-height:0;display:flex;flex-direction:column;}'
    + '.iw-pop-head{display:flex;align-items:baseline;gap:6px;}'
    + '.iw-pop-eyebrow{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap;flex-shrink:0;}'
    + '.iw-pop-eyebrow-yellow{color:#facc15;}'
    + '.iw-pop-eyebrow-blue{color:#60a5fa;}'
    + '.iw-pop-name{font-size:14px;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-pop-tagline{font-size:12px;color:#94a3b8;margin:4px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.iw-pop-divider{height:1px;background:#232b38;margin:10px 0;}'
    + '.iw-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}'
    + '.iw-stat-cell{background:#0e1117;border:1px solid #232b38;border-radius:6px;padding:6px 8px;text-align:center;}'
    + '.iw-stat-cell b{display:block;font-size:15px;font-weight:700;color:#e2e8f0;}'
    + '.iw-stat-cell span{font-size:10px;color:#64748b;}'
    + '.iw-cta-row{display:flex;gap:6px;margin-top:auto;padding-top:12px;}'
    + '.iw-cta{flex:1;display:block;text-align:center;font-size:11.5px;font-weight:700;border-radius:7px;padding:8px 6px;text-decoration:none;transition:filter .15s,background .15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    + '.iw-cta-primary-yellow{color:#0a0c12;background:#facc15;}'
    + '.iw-cta-primary-yellow:hover{filter:brightness(1.1);text-decoration:none;}'
    + '.iw-cta-primary-blue{color:#0a0c12;background:#60a5fa;}'
    + '.iw-cta-primary-blue:hover{filter:brightness(1.1);text-decoration:none;}'
    + '.iw-cta-secondary{color:#e2e8f0;background:transparent;border:1px solid #2d3748;}'
    + '.iw-cta-secondary:hover{border-color:#4a5568;text-decoration:none;}'
    + '@media(max-width:640px){.iw-bar{gap:14px 12px;}}'
    + '@media(hover:none){.iw-pop{position:static;opacity:1;transform:none;pointer-events:auto;width:auto;height:auto;margin-top:8px;display:none;}}';
    var s = document.createElement('style');
    s.id = 'iw-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── Normaliza cada fonte pra um formato comum consumido pelo carrossel.
  // ctas: array de { label, href, style: 'primary'|'secondary', external } —
  // PH/HN/YT têm 2 (dashboard + instalar extensão), newsletters tem 1 (assinar).

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
      badge: t.ph, name: top.name, stat: '▲' + fmt(top.votes_count), tagline: top.tagline || '',
      eyebrow: t.winnerEyebrow, href: 'https://www.producthunt.com/posts/' + top.slug,
      avg: stats.avg, avgLabel: t.avgVotes, distinctCount: stats.distinctCount, distinctLabel: t.distinctWinners,
      media: top.thumbnail_url
        ? { type: 'img', url: top.thumbnail_url }
        : { type: 'mono', letter: (top.name || '?').charAt(0).toUpperCase(), bg: '#facc15' },
      ctas: [
        { label: t.openDashboard, href: langHref('/ph/today'), style: 'primary' },
        { label: t.install.replace('{name}', 'PH Radar'), href: 'https://chromewebstore.google.com/detail/nodus-ph-radar/cmibcnnkebddlcdjinibkegejpcafgag', style: 'secondary', external: true },
      ],
    };
  }

  function buildHNSource(hnWeek) {
    var top = hnWeek[0];
    var stats = computeWeekStats(hnWeek, 'score', 'title');
    var domain = top.domain || 'news.ycombinator.com';
    return {
      badge: t.hn, name: top.title, stat: '▲' + fmt(top.score), tagline: domain,
      eyebrow: t.topStoryEyebrow, href: top.url || ('https://news.ycombinator.com/item?id=' + top.item_id),
      avg: stats.avg, avgLabel: t.avgPoints, distinctCount: stats.distinctCount, distinctLabel: t.distinctStories,
      media: { type: 'favicon', domain: domain, letter: domain.charAt(0).toUpperCase(), bg: '#ff6600' },
      ctas: [
        { label: t.openDashboard, href: langHref('/hn/today'), style: 'primary' },
        { label: t.install.replace('{name}', 'HN Radar'), href: 'https://chromewebstore.google.com/detail/nodus-hn-radar/khodlkgkgdkhkljapdllfjnfedamhkmn', style: 'secondary', external: true },
      ],
    };
  }

  function buildYTSource(ytWeek) {
    var top = ytWeek[0];
    var stats = computeWeekStats(ytWeek, 'view_count', 'channel');
    return {
      badge: t.yt, name: top.title, stat: '▲' + fmt(top.view_count), tagline: top.channel || '',
      eyebrow: t.trendingEyebrow, href: 'https://www.youtube.com/watch?v=' + top.video_id,
      avg: stats.avg, avgLabel: t.avgViews, distinctCount: stats.distinctCount, distinctLabel: t.distinctChannels,
      media: { type: 'img', url: 'https://i.ytimg.com/vi/' + encodeURIComponent(top.video_id) + '/hqdefault.jpg' },
      ctas: [
        { label: t.openDashboard, href: langHref('/yt/today'), style: 'primary' },
        { label: t.install.replace('{name}', 'YT Radar'), href: 'https://chromewebstore.google.com/detail/nodus-yt-radar/ebfnahokkelbeiknkmkkkmeliikhmdhk', style: 'secondary', external: true },
      ],
    };
  }

  // Newsletters: feed "rolling top-N" via topic da PH (sem today/week) —
  // ver worker-nodus-insights/api/newsletters.js. CTA único (assinar), não
  // funil de 2 botões, porque não existe "dashboard" nem extensão aqui.
  function buildNewsletterSources(list) {
    return list.slice(0, 8).map(function (n) {
      return {
        badge: t.nl, name: n.name, stat: '▲' + fmt(n.votes_count), tagline: n.tagline || '',
        eyebrow: t.nlEyebrow, href: n.website || ('https://www.producthunt.com/posts/' + n.slug),
        avg: null, distinctCount: null,
        media: n.thumbnail_url
          ? { type: 'img', url: n.thumbnail_url }
          : { type: 'mono', letter: (n.name || '?').charAt(0).toUpperCase(), bg: '#60a5fa' },
        ctas: [
          { label: t.subscribe, href: n.website || ('https://www.producthunt.com/posts/' + n.slug), style: 'primary', external: true },
        ],
      };
    });
  }

  // Sempre retorna uma caixa .iw-media (130px fixo, via CSS) — é essa altura
  // travada que garante que o popover não muda de tamanho entre estados.
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

  // ── Um slot: 1 card que revezaou entre `sources`, para de vez no hover/clique ──
  // `accent` ('yellow'|'blue') controla a cor de destaque do slot (amarelo =
  // dado ao vivo, azul = curadoria), pra diferenciar visualmente sem mudar
  // o mecanismo. Retorna o elemento do slot pronto pra entrar na .iw-bar.

  function buildSlot(sources, accent) {
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
    fill.className = 'iw-progress-fill iw-progress-fill-' + accent;
    progress.appendChild(fill);
    if (sources.length > 1) slot.appendChild(progress);

    var dots = document.createElement('div');
    dots.className = 'iw-dots';
    if (sources.length > 1) slot.appendChild(dots);

    var idx = 0, timer = null, stopped = false;
    var interval = window.matchMedia('(max-width: 640px)').matches ? MOBILE_INTERVAL : DESKTOP_INTERVAL;

    function draw() {
      var s = sources[idx];
      chip.href = s.href;
      chip.innerHTML = '';

      var badge = document.createElement('span');
      badge.className = 'iw-chip-badge iw-chip-badge-' + accent;
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
      head.innerHTML = '<span class="iw-pop-eyebrow iw-pop-eyebrow-' + accent + '">' + esc(s.eyebrow) + '</span><span class="iw-pop-name">' + esc(s.name) + '</span>';
      body.appendChild(head);

      var tagline = document.createElement('div');
      tagline.className = 'iw-pop-tagline';
      tagline.textContent = s.tagline;
      body.appendChild(tagline);

      if (s.avg != null) {
        var d1 = document.createElement('div');
        d1.className = 'iw-pop-divider';
        body.appendChild(d1);

        var grid = document.createElement('div');
        grid.className = 'iw-stat-grid';
        grid.innerHTML =
          '<div class="iw-stat-cell"><b>' + fmt(s.avg) + '</b><span>' + esc(s.avgLabel) + '</span></div>'
          + '<div class="iw-stat-cell"><b>' + s.distinctCount + '</b><span>' + esc(s.distinctLabel) + '</span></div>';
        body.appendChild(grid);
      }

      var ctaRow = document.createElement('div');
      ctaRow.className = 'iw-cta-row';
      s.ctas.forEach(function (c) {
        var a = document.createElement('a');
        a.className = 'iw-cta ' + (c.style === 'primary' ? 'iw-cta-primary-' + accent : 'iw-cta-secondary');
        a.href = c.href;
        if (c.external) { a.target = '_blank'; a.rel = 'noopener'; }
        a.textContent = c.label;
        ctaRow.appendChild(a);
      });
      body.appendChild(ctaRow);

      pop.appendChild(body);
      chip.appendChild(pop);

      if (sources.length > 1) {
        dots.innerHTML = '';
        sources.forEach(function (_, i) {
          var dot = document.createElement('button');
          // O botão em si é maior (20x18px) que o tracinho visível (12x3px,
          // no span interno) — alvo de clique real precisa de mais margem
          // do que o desenho sugere, senão o usuário erra o clique.
          dot.className = 'iw-dot' + (i === idx ? ' iw-dot-active-' + accent : '');
          dot.setAttribute('aria-label', sources[i].badge + ' ' + (i + 1));
          var visual = document.createElement('span');
          visual.className = 'iw-dot-visual';
          dot.appendChild(visual);
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

    // No slot inteiro (não só no chip) — os dots ficam FORA do <a> do chip,
    // então um listener só no chip nunca disparava ao passar o mouse nos
    // dots. Resultado: a rotação continuava trocando os dots embaixo do
    // cursor bem na hora que o usuário tentava clicar num específico —
    // um alvo se movendo. Parar assim que o mouse entra em QUALQUER parte
    // do slot resolve isso.
    slot.addEventListener('mouseenter', stopRotation);
    slot.addEventListener('click', stopRotation);

    draw();
    startRotation();

    return slot;
  }

  function mount() {
    var hero = document.querySelector('.hero');
    if (!hero) return; // não é a home -> no-op

    Promise.all([
      fetch('/api/ph/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('/api/hn/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('/api/yt/week').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('/api/newsletters').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
    ]).then(function (results) {
      // >= 1 basta pra entrar no carrossel (uma fonte recém-lançada como o YT
      // pode ter só 1 dia de histórico ainda) — computeWeekStats já lida bem
      // com semanas de 1 item só (média = o próprio valor, 1 distinto).
      var phWeek = results[0] || [], hnWeek = results[1] || [], ytWeek = results[2] || [];
      var newsletters = results[3] || [];

      var insightSources = [];
      if (phWeek.length) insightSources.push(buildPHSource(phWeek));
      if (hnWeek.length) insightSources.push(buildHNSource(hnWeek));
      if (ytWeek.length) insightSources.push(buildYTSource(ytWeek));

      var nlSources = newsletters.length ? buildNewsletterSources(newsletters) : [];

      if (!insightSources.length && !nlSources.length) return; // sem dado nenhum -> no-op

      injectCSS();

      var section = document.createElement('section');
      section.className = 'iw-section';

      var bar = document.createElement('div');
      bar.className = 'iw-bar';

      if (insightSources.length) {
        var phrase1 = document.createElement('span');
        phrase1.className = 'iw-phrase';
        phrase1.textContent = t.phrase;
        bar.appendChild(phrase1);
        bar.appendChild(buildSlot(insightSources, 'yellow'));
      }

      if (nlSources.length) {
        var phrase2 = document.createElement('span');
        phrase2.className = 'iw-phrase';
        phrase2.textContent = t.nlPhrase;
        bar.appendChild(phrase2);
        bar.appendChild(buildSlot(nlSources, 'blue'));
      }

      var explore = document.createElement('a');
      explore.className = 'iw-explore';
      explore.href = langHref('/ph/today');
      explore.textContent = t.explore;
      bar.appendChild(explore);

      section.appendChild(bar);
      hero.parentNode.insertBefore(section, hero);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
