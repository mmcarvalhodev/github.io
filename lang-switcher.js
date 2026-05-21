(function () {
  var lang = window._forcedLang || localStorage.getItem('nodus_lang') || 'en';
  var subdirs = ['pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];
  var isSubdir = subdirs.includes(lang);

  // Sync current page language to localStorage
  try { localStorage.setItem('nodus_lang', lang); } catch(e) {}

  var allLangs = [
    ['en','EN'], ['pt','PT'], ['es','ES'], ['fr','FR'],
    ['de','DE'], ['it','IT'], ['nl','NL'], ['pl','PL'],
    ['id','ID'], ['vi','VI'], ['ja','JA'], ['ko','KO'],
    ['zh','ZH'], ['ru','RU'], ['hi','HI'], ['tr','TR']
  ];

  // Pages that have a translated version in every language subdir
  var translatedPages = ['privacy.html', 'faq.html', 'hn-radar.html', 'hn-radar-privacy.html'];

  // Pages with in-page JS i18n — don't navigate, just fire event
  var inPageI18nPages = ['affiliates.html', 'checkout.html'];

  // Current page filename
  var currentPath = window.location.pathname;
  var currentSegments = currentPath.replace(/^\//, '').split('/');
  var currentFile = currentSegments[currentSegments.length - 1];
  var isInPage = inPageI18nPages.indexOf(currentFile) !== -1;

  // Determine destination URL for a target language code
  function getHref(code) {
    var path = window.location.pathname;
    var hash = window.location.hash;

    var segments = path.replace(/^\//, '').split('/');
    var file = segments[segments.length - 1];

    // In-page i18n pages: stay on the same page
    if (inPageI18nPages.indexOf(file) !== -1) {
      return window.location.pathname;
    }

    // Is current page one with full language translations?
    var hasTranslation = translatedPages.indexOf(file) !== -1;

    if (hasTranslation) {
      return code === 'en' ? '/' + file : '/' + code + '/' + file;
    }

    if (file === 'faq.html') {
      return '/faq.html';
    }

    // Index pages (root "/" or "/lang/"): go to target language homepage + current hash
    return code === 'en' ? '/' + hash : '/' + code + '/' + hash;
  }

  // Inject CSS
  var style = '<style>' +
    '.lang-switcher{position:relative;margin-left:8px;}' +
    '.lang-trigger{display:flex;align-items:center;gap:5px;padding:5px 10px;' +
      'border:1px solid #2d3748;border-radius:8px;background:rgba(255,255,255,0.03);' +
      'cursor:pointer;font-size:12px;font-weight:600;color:#94a3b8;' +
      'font-family:inherit;line-height:1;transition:border-color 0.15s,color 0.15s;}' +
    '.lang-trigger:hover{border-color:#facc15;color:#facc15;}' +
    '.lang-current{color:#facc15;font-weight:700;}' +
    '.lang-chevron{transition:transform 0.2s;opacity:0.7;font-size:10px;}' +
    '.lang-switcher.open .lang-chevron{transform:rotate(180deg);}' +
    '.lang-globe{display:inline-block;font-size:13px;line-height:1;width:1em;overflow:hidden;vertical-align:middle;}' +
    '.lang-globe::before{content:"🌍";display:inline-block;animation:globeSpin 2.4s steps(1) infinite;}' +
    '@keyframes globeSpin{0%{content:"🌍"}33%{content:"🌎"}66%{content:"🌏"}}' +
    '.lang-dropdown{display:none;position:absolute;top:calc(100% + 6px);right:0;' +
      'background:#131720;border:1px solid #2d3748;border-radius:10px;padding:5px;' +
      'min-width:155px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.45);}' +
    '.lang-switcher.open .lang-dropdown{display:grid;grid-template-columns:1fr 1fr;gap:2px;}' +
    '.lang-opt{display:block;width:100%;padding:6px 10px;border:none;background:transparent;' +
      'color:#64748b;font-size:12px;font-weight:500;text-align:left;cursor:pointer;' +
      'border-radius:6px;transition:background 0.12s,color 0.12s;white-space:nowrap;' +
      'text-decoration:none;font-family:inherit;}' +
    '.lang-opt:hover{background:rgba(255,255,255,0.07);color:#e2e8f0;text-decoration:none;}' +
    '.lang-opt.active{color:#facc15;font-weight:700;}' +
    '@media(max-width:640px){.lang-switcher{margin-left:auto;margin-right:4px;}.lang-trigger{padding:5px 8px;}}' +
    '</style>';

  document.head.insertAdjacentHTML('beforeend', style);

  // Build dropdown (hrefs are set dynamically)
  var opts = allLangs.map(function(pair) {
    var code = pair[0], label = pair[1];
    var active = code === lang ? ' active' : '';
    return '<a href="#" class="lang-opt' + active + '" data-lang="' + code + '">' + label + '</a>';
  }).join('');

  var wrap = document.createElement('div');
  wrap.className = 'lang-switcher';
  wrap.id = 'langSwitcher';
  wrap.innerHTML =
    '<button class="lang-trigger" id="langTrigger">' +
      '<span class="lang-globe"></span>' +
      '<span class="lang-current">' + lang.toUpperCase() + '</span>' +
      '<span class="lang-chevron">▾</span>' +
    '</button>' +
    '<div class="lang-dropdown">' + opts + '</div>';

  // Recompute all hrefs (call on open and on hashchange)
  function syncHrefs() {
    wrap.querySelectorAll('.lang-opt').forEach(function(a) {
      a.href = getHref(a.getAttribute('data-lang'));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var navInner = document.querySelector('.nav-inner');
    if (navInner) {
      var hamburger = document.getElementById('navHamburger');
      if (hamburger) {
        navInner.insertBefore(wrap, hamburger);
      } else {
        navInner.appendChild(wrap);
      }
    }

    syncHrefs();
    window.addEventListener('hashchange', syncHrefs);

    var trigger = document.getElementById('langTrigger');
    var switcher = document.getElementById('langSwitcher');

    // Click handler
    wrap.querySelectorAll('.lang-opt').forEach(function(a) {
      a.addEventListener('click', function(e) {
        var targetLang = a.getAttribute('data-lang');
        try { localStorage.setItem('nodus_lang', targetLang); } catch(e2) {}

        if (isInPage) {
          // In-page i18n: don't navigate, fire translation event instead
          e.preventDefault();
          // Update active state in dropdown
          wrap.querySelectorAll('.lang-opt').forEach(function(o) {
            o.classList.toggle('active', o.getAttribute('data-lang') === targetLang);
          });
          wrap.querySelector('.lang-current').textContent = targetLang.toUpperCase();
          switcher.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
          // Fire event for the page's own i18n handler
          window.dispatchEvent(new CustomEvent('nodus-lang-change', { detail: targetLang }));
        }
        // else: normal navigation via href
      });
    });

    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      syncHrefs();
      var isOpen = switcher.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', function() {
      if (switcher) {
        switcher.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();
