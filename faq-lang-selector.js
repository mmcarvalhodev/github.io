(function () {
  var lang = window._forcedLang || 'en';
  var subdirs = ['pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];
  var isSubdir = subdirs.includes(lang);

  var langs = ['en','pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];

  // Build href for each language's FAQ section
  function faqHref(l) {
    if (isSubdir) {
      return l === 'en' ? '../#faq' : '../' + l + '/#faq';
    } else {
      return l === 'en' ? '#faq' : l + '/#faq';
    }
  }

  // Inject CSS
  var style = '<style>' +
    '.fls-wrap{display:flex;align-items:center;gap:6px;flex-wrap:wrap;' +
      'margin-bottom:36px;padding-bottom:28px;' +
      'border-bottom:1px solid rgba(255,255,255,0.06);}' +
    '.fls-label{font-size:12px;color:#475569;font-weight:600;flex-shrink:0;margin-right:2px;}' +
    '.fls-pill{font-size:11px;font-weight:700;padding:4px 9px;border-radius:5px;' +
      'color:#64748b;text-decoration:none;' +
      'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
      'transition:color 0.15s,border-color 0.15s,background 0.15s;}' +
    '.fls-pill:hover{color:#facc15;border-color:rgba(250,204,21,0.3);' +
      'background:rgba(250,204,21,0.05);text-decoration:none;}' +
    '.fls-active{color:#facc15!important;background:rgba(250,204,21,0.08)!important;' +
      'border-color:rgba(250,204,21,0.25)!important;}' +
    '</style>';
  document.head.insertAdjacentHTML('beforeend', style);

  document.addEventListener('DOMContentLoaded', function () {
    var faqSection = document.getElementById('faq');
    if (!faqSection) return;

    // Build pills
    var pills = langs.map(function (l) {
      var active = l === lang ? ' fls-active' : '';
      return '<a href="' + faqHref(l) + '" class="fls-pill' + active + '">' +
        l.toUpperCase() + '</a>';
    }).join('');

    var wrap = document.createElement('div');
    wrap.className = 'fls-wrap';
    wrap.innerHTML = '<span class="fls-label">🌐</span>' + pills;

    // Insert before the text-center header div inside .container
    var container = faqSection.querySelector('.container');
    if (container) container.insertBefore(wrap, container.firstChild);

    // Hide "See all FAQs" link for non-PT languages (hub only exists in PT)
    var hubLinks = faqSection.querySelectorAll('a[href="faq.html"], a[href="../faq.html"]');
    hubLinks.forEach(function (a) {
      if (lang !== 'pt') {
        var parent = a.closest('div');
        if (parent) parent.style.display = 'none';
      }
    });
  });
})();
