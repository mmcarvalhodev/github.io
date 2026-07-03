/* =====================================================================
   NODUS — Resources menu (shared, self-contained)
   Single source of truth for the cross-site "Resources" dropdown.
   - Auto-detects language (window._forcedLang -> /xx/ path -> <html lang>)
   - Auto-injects into the page nav, right before the Get PRO CTA
   - Lists live data products (PH/HN Insights) and planned entries
   Add a new resource => edit ITEMS below. Nothing else.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__nodusResourcesMenu) return;
  window.__nodusResourcesMenu = true;

  var KNOWN = ['en','pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];

  var LABEL = { en: 'Resources', pt: 'Recursos' };
  var DESC  = {
    en: 'Curated resources and live market data.',
    pt: 'Recursos selecionados e dados de mercado ao vivo.'
  };
  var LIVE_TXT = { en: 'Live', pt: 'Ao vivo' };
  var SOON_TXT = { en: 'Soon', pt: 'Em breve' };

  // key, name (per lang), tag (per lang), icon text, colors, hrefBase (null = not live yet)
  // hrefBase é sem prefixo de idioma — o prefixo é adicionado depois, com o
  // idioma já detectado (langHref), pois o worker-nodus-insights serve
  // /{lang}/ph/today para 15 idiomas (inglês fica sem prefixo).
  var ITEMS = [
    {
      key: 'ph', live: true, ico: 'PH', bg: '#da552f', fg: '#ffffff', hrefBase: '/ph/today',
      name: { en: 'Product Hunt', pt: 'Product Hunt' },
      tag:  { en: 'Live analytics', pt: 'Análises ao vivo' }
    },
    {
      key: 'hn', live: true, ico: 'HN', bg: '#ff6600', fg: '#ffffff', hrefBase: '/hn/today',
      name: { en: 'Hacker News', pt: 'Hacker News' },
      tag:  { en: 'Live analytics', pt: 'Análises ao vivo' }
    },
    {
      key: 'yt', live: true, ico: 'YT', bg: '#ff0000', fg: '#ffffff', hrefBase: '/yt/today',
      name: { en: 'YouTube', pt: 'YouTube' },
      tag:  { en: 'Live analytics', pt: 'Análises ao vivo' }
    },
    {
      key: 'newsletters', live: false, ico: 'AI', bg: '#242c39', fg: '#64748b', hrefBase: null,
      name: { en: 'AI newsletters', pt: 'Newsletters de IA' }
    },
    {
      key: 'communities', live: false, ico: 'CM', bg: '#242c39', fg: '#64748b', hrefBase: null,
      name: { en: 'Communities', pt: 'Comunidades' }
    },
    {
      key: 'tools', live: false, ico: 'RT', bg: '#242c39', fg: '#64748b', hrefBase: null,
      name: { en: 'Recommended tools', pt: 'Ferramentas recomendadas' }
    }
  ];

  function detectLang() {
    var l = (window._forcedLang || '').toLowerCase();
    if (KNOWN.indexOf(l) !== -1) return l;
    var m = location.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
    if (m && KNOWN.indexOf(m[1]) !== -1) return m[1];
    var h = (document.documentElement.getAttribute('lang') || '').toLowerCase().split('-')[0];
    if (KNOWN.indexOf(h) !== -1) return h;
    return 'en';
  }

  function t(dict, lang) { return dict[lang] || dict.en; }

  var lang     = detectLang();
  var label    = t(LABEL, lang);
  var desc     = t(DESC, lang);
  var liveTxt  = t(LIVE_TXT, lang);
  var soonTxt  = t(SOON_TXT, lang);
  var liveCount = ITEMS.filter(function (i) { return i.live; }).length;

  /* ---------- styles ---------- */
  function injectCSS() {
    if (document.getElementById('nrm-style')) return;
    var css = ''
    + '.nrm-wrap{position:relative;display:inline-flex;align-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}'
    + '.nrm-btn{display:inline-flex;align-items:center;gap:7px;background:transparent;border:1px solid transparent;color:#94a3b8;font-size:14px;font-weight:500;line-height:1;padding:6px 10px;border-radius:8px;cursor:pointer;font-family:inherit;transition:border-color .2s,color .2s,background .2s;}'
    + '.nrm-btn:hover{color:#e2e8f0;text-decoration:none;}'
    + '.nrm-wrap.open .nrm-btn{color:#e2e8f0;border-color:#2d3748;background:rgba(255,255,255,.03);}'
    + '.nrm-count{background:#0f3d2e;color:#4ade80;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;line-height:1.4;white-space:nowrap;}'
    + '.nrm-btn{white-space:nowrap;}'
    + '.nrm-caret{width:12px;height:12px;flex-shrink:0;opacity:.7;transition:transform .25s;}'
    + '.nrm-wrap.open .nrm-caret{transform:rotate(180deg);}'
    + '.nrm-menu{position:absolute;top:calc(100% + 10px);right:0;width:300px;max-width:86vw;background:#1a1f29;border:1px solid #2d3748;border-radius:12px;padding:10px 8px;box-shadow:0 20px 50px rgba(0,0,0,.55);opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease;transform-origin:top right;z-index:1000;}'
    + '.nrm-wrap.open .nrm-menu{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}'
    + '.nrm-desc{font-size:11px;color:#64748b;padding:2px 8px 10px;line-height:1.5;}'
    + '.nrm-link{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;text-decoration:none;transition:background .15s;}'
    + '.nrm-link:hover{background:rgba(255,255,255,.04);text-decoration:none;}'
    + '.nrm-link.nrm-disabled{cursor:default;opacity:.6;}'
    + '.nrm-link.nrm-disabled:hover{background:transparent;}'
    + '.nrm-ico{width:26px;height:26px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;}'
    + '.nrm-txt{flex:1;min-width:0;}'
    + '.nrm-name{color:#e2e8f0;font-size:12px;font-weight:500;line-height:1.3;}'
    + '.nrm-sub{color:#64748b;font-size:10px;line-height:1.4;}'
    + '.nrm-badge{display:flex;align-items:center;gap:4px;font-size:9px;font-weight:500;white-space:nowrap;}'
    + '.nrm-badge-live{color:#4ade80;}'
    + '.nrm-badge-soon{color:#eab308;}'
    + '.nrm-dot{width:5px;height:5px;border-radius:50%;display:inline-block;}'
    + '.nrm-divider{border-top:1px solid #232b38;margin:6px 4px;}'
    + '@media (max-width:880px){.nrm-wrap{width:100%;}.nrm-menu{position:static;width:100%;max-width:none;box-shadow:none;margin-top:6px;}}'
    // compact top-bar trigger (mobile), mirrors products-menu.js pattern
    + '.nrm-compact{display:none;width:auto;}'
    + '.nrm-cbtn{display:inline-flex;align-items:center;gap:5px;background:transparent;'
      + 'border:1px solid #2d3748;color:#94a3b8;line-height:1;padding:6px 9px;border-radius:8px;'
      + 'cursor:pointer;font-family:inherit;transition:background .2s,border-color .2s;}'
    + '.nrm-cbtn:hover{background:rgba(255,255,255,.04);}'
    + '.nrm-wrap.nrm-compact.open .nrm-cbtn{background:rgba(255,255,255,.06);}'
    + '.nrm-cico{width:16px;height:16px;display:block;}'
    + '.nrm-compact .nrm-menu{position:fixed;top:64px;right:12px;left:auto;'
      + 'width:min(300px,calc(100vw - 24px));max-width:none;margin-top:0;}'
    + '@media (max-width:640px){'
      + '.nrm-wrap:not(.nrm-compact){display:none !important;}'
      + '.nrm-compact{display:inline-flex !important;}'
    + '}';
    var s = document.createElement('style');
    s.id = 'nrm-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------- shared dropdown panel ---------- */
  function buildMenu() {
    var menu = document.createElement('div');
    menu.className = 'nrm-menu';
    menu.setAttribute('role', 'menu');

    var dl = document.createElement('div');
    dl.className = 'nrm-desc';
    dl.textContent = desc;
    menu.appendChild(dl);

    var liveItems = ITEMS.filter(function (i) { return i.live; });
    var soonItems = ITEMS.filter(function (i) { return !i.live; });

    liveItems.forEach(function (i) { menu.appendChild(buildRow(i)); });
    if (liveItems.length && soonItems.length) {
      var div = document.createElement('div');
      div.className = 'nrm-divider';
      menu.appendChild(div);
    }
    soonItems.forEach(function (i) { menu.appendChild(buildRow(i)); });

    return menu;
  }

  function buildRow(item) {
    var href = item.hrefBase && (lang === 'en' ? item.hrefBase : '/' + lang + item.hrefBase);
    var el = document.createElement(href ? 'a' : 'div');
    el.className = 'nrm-link' + (href ? '' : ' nrm-disabled');
    if (href) {
      el.href = href;
      el.setAttribute('role', 'menuitem');
    } else {
      el.setAttribute('aria-disabled', 'true');
    }

    var ico = document.createElement('span');
    ico.className = 'nrm-ico';
    ico.style.background = item.bg;
    ico.style.color = item.fg;
    ico.textContent = item.ico;

    var txt = document.createElement('span');
    txt.className = 'nrm-txt';
    var nm = document.createElement('span');
    nm.className = 'nrm-name';
    nm.textContent = t(item.name, lang);
    txt.appendChild(nm);
    if (item.tag) {
      var sb = document.createElement('span');
      sb.className = 'nrm-sub';
      sb.textContent = ' — ' + t(item.tag, lang);
      nm.appendChild(sb);
    }

    var badge = document.createElement('span');
    badge.className = 'nrm-badge ' + (item.live ? 'nrm-badge-live' : 'nrm-badge-soon');
    var dot = document.createElement('span');
    dot.className = 'nrm-dot';
    dot.style.background = item.live ? '#4ade80' : '#eab308';
    badge.appendChild(dot);
    badge.appendChild(document.createTextNode(item.live ? liveTxt : soonTxt));

    el.appendChild(ico);
    el.appendChild(txt);
    el.appendChild(badge);
    return el;
  }

  function caretSVG() {
    var caret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    caret.setAttribute('class', 'nrm-caret');
    caret.setAttribute('viewBox', '0 0 24 24');
    caret.setAttribute('fill', 'none');
    caret.setAttribute('stroke', 'currentColor');
    caret.setAttribute('stroke-width', '2.5');
    caret.setAttribute('stroke-linecap', 'round');
    caret.setAttribute('stroke-linejoin', 'round');
    caret.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
    return caret;
  }

  function buildWidget(asLI) {
    var wrap = document.createElement(asLI ? 'li' : 'div');
    if (asLI) wrap.style.listStyle = 'none';

    var inner = document.createElement('div');
    inner.className = 'nrm-wrap';

    var btn = document.createElement('button');
    btn.className = 'nrm-btn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', label);

    var lbl = document.createElement('span');
    lbl.textContent = label;
    btn.appendChild(lbl);

    if (liveCount > 0) {
      var count = document.createElement('span');
      count.className = 'nrm-count';
      count.textContent = liveCount + ' ' + liveTxt.toLowerCase();
      btn.appendChild(count);
    }

    btn.appendChild(caretSVG());

    var menu = buildMenu();
    inner.appendChild(btn);
    inner.appendChild(menu);
    wrap.appendChild(inner);

    return { wrap: wrap, inner: inner, btn: btn };
  }

  // compact, icon-only trigger for the mobile top bar (stack/list glyph)
  function buildCompact() {
    var wrap = document.createElement('div');
    wrap.className = 'nrm-wrap nrm-compact';

    var btn = document.createElement('button');
    btn.className = 'nrm-cbtn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', label);

    var ico = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ico.setAttribute('class', 'nrm-cico');
    ico.setAttribute('viewBox', '0 0 24 24');
    ico.setAttribute('fill', 'none');
    ico.setAttribute('stroke', 'currentColor');
    ico.setAttribute('stroke-width', '2');
    ico.setAttribute('stroke-linecap', 'round');
    ico.innerHTML = '<line x1="4" y1="7" x2="20" y2="7"></line>'
      + '<line x1="4" y1="12" x2="20" y2="12"></line>'
      + '<line x1="4" y1="17" x2="14" y2="17"></line>';

    btn.appendChild(ico);
    btn.appendChild(caretSVG());

    var menu = buildMenu();
    wrap.appendChild(btn);
    wrap.appendChild(menu);

    return { wrap: wrap, inner: wrap, btn: btn };
  }

  /* ---------- dropdown open/close ---------- */
  function wire(inner, btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = inner.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      if (inner.classList.contains('open')) {
        inner.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && inner.classList.contains('open')) {
        inner.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- mount ---------- */
  function mount() {
    if (document.querySelector('.nrm-wrap')) return; // idempotent
    var container =
      document.querySelector('.nav-links') ||
      document.querySelector('.nav-inner') ||
      document.querySelector('nav') ||
      document.querySelector('header');
    if (!container) return; // no nav on this page -> graceful no-op

    var asLI = (container.tagName === 'UL');

    injectCSS();

    var w = buildWidget(asLI);
    var cta = container.querySelector('.nav-cta') || container.querySelector('.nav-back');
    // cta may be wrapped in an <li> (nav-links is a <ul>) — insert relative to
    // whichever node is the direct child of container.
    var ref = cta && (cta.parentNode.tagName === 'LI' ? cta.parentNode : cta);
    if (ref && ref.parentNode === container) container.insertBefore(w.wrap, ref);
    else container.appendChild(w.wrap);

    wire(w.inner, w.btn);

    // Compact top-bar trigger, mirrors products-menu.js: lives in .nav-inner so
    // it survives the <=640px collapse of .nav-links.
    var navInner = document.querySelector('.nav-inner');
    if (navInner && !navInner.querySelector('.nrm-compact')) {
      var c = buildCompact();
      var anchor =
        navInner.querySelector('.lang-switcher') ||
        navInner.querySelector('.nav-hamburger');
      if (anchor && anchor.parentNode === navInner) {
        navInner.insertBefore(c.wrap, anchor);
      } else {
        navInner.appendChild(c.wrap);
      }
      wire(c.inner, c.btn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
