/* =====================================================================
   NODUS — About menu (shared, self-contained)
   Consolidates the marketing nav items (How it works, Chains, Pricing,
   Privacy, Screenshots, FAQs...) into a single "About" dropdown.

   Unlike products-menu.js / resources-menu.js, this script does NOT
   hardcode labels or hrefs per language — it RELOCATES the existing
   <a> elements already in the page (which already carry the correct
   per-language text and href), so translation stays perfectly in sync
   with whatever each language's homepage already has.

   Runs after products-menu.js (script tag order): it uses the already-
   mounted .npm-wrap (Products dropdown) as the boundary marker and
   collects everything before it in .nav-links.

   Safety: only activates when 5+ candidate links are found in a row.
   Product pages (Install/BI/Dashboard-style nav) never have that many,
   so they are left untouched automatically.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__nodusAboutMenu) return;
  window.__nodusAboutMenu = true;

  var MIN_CANDIDATES = 5;

  var KNOWN = ['en','pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];
  var LABEL = {
    en: 'About', pt: 'Sobre', de: 'Über', es: 'Acerca de',
    fr: 'À propos', it: 'Chi siamo', nl: 'Over'
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

  var lang  = detectLang();
  var label = LABEL[lang] || LABEL.en;

  /* ---------- styles ---------- */
  function injectCSS() {
    if (document.getElementById('abm-style')) return;
    var css = ''
    + '.abm-wrap{position:relative;display:inline-flex;align-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}'
    + '.abm-btn{display:inline-flex;align-items:center;gap:7px;background:transparent;border:1px solid transparent;color:#94a3b8;font-size:14px;font-weight:500;line-height:1;padding:6px 10px;border-radius:8px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:border-color .2s,color .2s,background .2s;}'
    + '.abm-btn:hover{color:#e2e8f0;text-decoration:none;}'
    + '.abm-wrap.open .abm-btn{color:#e2e8f0;border-color:#2d3748;background:rgba(255,255,255,.03);}'
    + '.abm-caret{width:12px;height:12px;flex-shrink:0;opacity:.7;transition:transform .25s;}'
    + '.abm-wrap.open .abm-caret{transform:rotate(180deg);}'
    + '.abm-menu{position:absolute;top:calc(100% + 10px);left:0;width:220px;max-width:86vw;background:#1a1f29;border:1px solid #2d3748;border-radius:12px;padding:8px;box-shadow:0 20px 50px rgba(0,0,0,.55);opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease;transform-origin:top left;z-index:1000;}'
    + '.abm-wrap.open .abm-menu{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}'
    + '.abm-menu a{display:block;padding:8px 10px;border-radius:8px;color:#e2e8f0;font-size:13px;text-decoration:none;transition:background .15s;}'
    + '.abm-menu a:hover{background:rgba(255,255,255,.04);text-decoration:none;}'
    + '@media (max-width:880px){.abm-wrap{width:100%;}.abm-menu{position:static;width:100%;max-width:none;box-shadow:none;margin-top:6px;}}'
    // compact top-bar trigger (mobile), mirrors products-menu.js / resources-menu.js
    + '.abm-compact{display:none;width:auto;}'
    + '.abm-cbtn{display:inline-flex;align-items:center;gap:5px;background:transparent;'
      + 'border:1px solid #2d3748;color:#94a3b8;line-height:1;padding:6px 9px;border-radius:8px;'
      + 'cursor:pointer;font-family:inherit;transition:background .2s,border-color .2s;}'
    + '.abm-cbtn:hover{background:rgba(255,255,255,.04);}'
    + '.abm-wrap.abm-compact.open .abm-cbtn{background:rgba(255,255,255,.06);}'
    + '.abm-cico{width:16px;height:16px;display:block;}'
    + '.abm-compact .abm-menu{position:fixed;top:64px;left:12px;right:auto;'
      + 'width:min(220px,calc(100vw - 24px));max-width:none;margin-top:0;}'
    + '@media (max-width:640px){'
      + '.abm-wrap:not(.abm-compact){display:none !important;}'
      + '.abm-compact{display:inline-flex !important;}'
    + '}';
    var s = document.createElement('style');
    s.id = 'abm-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function caretSVG() {
    var caret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    caret.setAttribute('class', 'abm-caret');
    caret.setAttribute('viewBox', '0 0 24 24');
    caret.setAttribute('fill', 'none');
    caret.setAttribute('stroke', 'currentColor');
    caret.setAttribute('stroke-width', '2.5');
    caret.setAttribute('stroke-linecap', 'round');
    caret.setAttribute('stroke-linejoin', 'round');
    caret.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
    return caret;
  }

  // moves the given <a> elements (already in the DOM) into a fresh dropdown panel
  function buildMenu(anchors) {
    var menu = document.createElement('div');
    menu.className = 'abm-menu';
    menu.setAttribute('role', 'menu');
    anchors.forEach(function (a) {
      a.setAttribute('role', 'menuitem');
      menu.appendChild(a); // moves the node, detaching it from its old parent
    });
    return menu;
  }

  function buildWidget(asLI, anchors) {
    var wrap = document.createElement(asLI ? 'li' : 'div');
    if (asLI) wrap.style.listStyle = 'none';

    var inner = document.createElement('div');
    inner.className = 'abm-wrap';

    var btn = document.createElement('button');
    btn.className = 'abm-btn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', label);

    var lbl = document.createElement('span');
    lbl.textContent = label;
    btn.appendChild(lbl);
    btn.appendChild(caretSVG());

    var menu = buildMenu(anchors);
    inner.appendChild(btn);
    inner.appendChild(menu);
    wrap.appendChild(inner);

    return { wrap: wrap, inner: inner, btn: btn };
  }

  // compact, icon-only trigger for the mobile top bar (info-circle-ish glyph)
  function buildCompact(anchors) {
    var wrap = document.createElement('div');
    wrap.className = 'abm-wrap abm-compact';

    var btn = document.createElement('button');
    btn.className = 'abm-cbtn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', label);

    var ico = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ico.setAttribute('class', 'abm-cico');
    ico.setAttribute('viewBox', '0 0 24 24');
    ico.setAttribute('fill', 'none');
    ico.setAttribute('stroke', 'currentColor');
    ico.setAttribute('stroke-width', '2');
    ico.setAttribute('stroke-linecap', 'round');
    ico.setAttribute('stroke-linejoin', 'round');
    ico.innerHTML = '<circle cx="12" cy="12" r="9"></circle>'
      + '<line x1="12" y1="11" x2="12" y2="16"></line>'
      + '<circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none"></circle>';

    btn.appendChild(ico);
    btn.appendChild(caretSVG());

    // clone the anchors for the compact menu (the originals already live in
    // the full-width menu — a second identical set is fine, same pattern as
    // products-menu.js/resources-menu.js's compact trigger)
    var clones = anchors.map(function (a) {
      var c = a.cloneNode(true);
      return c;
    });
    var menu = buildMenu(clones);
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
    if (document.querySelector('.abm-wrap')) return; // idempotent

    var container = document.querySelector('.nav-links');
    if (!container) return; // no marketing nav on this page -> no-op

    var npmInner = container.querySelector('.npm-wrap');
    if (!npmInner) return; // products-menu.js hasn't mounted here -> no-op

    var boundary = (npmInner.parentNode && npmInner.parentNode.tagName === 'LI'
      && npmInner.parentNode.parentNode === container) ? npmInner.parentNode : npmInner;
    if (boundary.parentNode !== container) return;

    var asLI = (container.tagName === 'UL');

    // collect every node before the boundary, extracting its <a> (or itself if it IS an <a>)
    var candidates = [];
    var node = container.firstElementChild;
    while (node && node !== boundary) {
      var a = (node.tagName === 'A') ? node : node.querySelector('a');
      if (a) candidates.push({ a: a, wrapper: (node.tagName === 'A') ? null : node });
      node = node.nextElementSibling;
    }

    if (candidates.length < MIN_CANDIDATES) return; // not a marketing nav -> leave page untouched

    injectCSS();

    var anchors = candidates.map(function (c) { return c.a; });
    var w = buildWidget(asLI, anchors); // moves the real <a> nodes into the new menu

    // remove the now-empty wrapper <li>s left behind
    candidates.forEach(function (c) {
      if (c.wrapper && c.wrapper.parentNode === container) container.removeChild(c.wrapper);
    });

    container.insertBefore(w.wrap, boundary);
    wire(w.inner, w.btn);

    // Compact top-bar trigger, mirrors products-menu.js/resources-menu.js
    var navInner = document.querySelector('.nav-inner');
    if (navInner && !navInner.querySelector('.abm-compact')) {
      var c = buildCompact(anchors);
      var anchor =
        navInner.querySelector('.npm-compact') ||
        navInner.querySelector('.nrm-compact') ||
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
