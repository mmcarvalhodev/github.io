(function () {
  const lang = window._forcedLang || 'en';
  const subdirs = ['pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];
  const isSubdir = subdirs.includes(lang);
  const root = isSubdir ? '../' : './';

  // Sync current page language to localStorage so auto-detect remembers the preference
  try { localStorage.setItem('nodus_lang', lang); } catch(e) {}

  const allLangs = [
    ['en','EN'], ['pt','PT'], ['es','ES'], ['fr','FR'],
    ['de','DE'], ['it','IT'], ['nl','NL'], ['pl','PL'],
    ['id','ID'], ['vi','VI'], ['ja','JA'], ['ko','KO'],
    ['zh','ZH'], ['ru','RU'], ['hi','HI'], ['tr','TR']
  ];

  const links = allLangs.map(function(pair) {
    var code = pair[0], label = pair[1];
    var href = code === 'en' ? root : root + code + '/';
    var cls  = code === lang ? ' lsp-active' : '';
    return '<a href="' + href + '" class="lsp-link' + cls + '" data-lang="' + code + '">' + label + '</a>';
  }).join('');

  var style = '<style>' +
    '.lsp-wrap{position:relative;margin-left:8px;}' +
    '.lsp-btn{background:none;border:1px solid #2d3748;color:#94a3b8;' +
      'font-size:12px;font-weight:700;padding:5px 10px;border-radius:6px;' +
      'cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap;' +
      'font-family:inherit;line-height:1;}' +
    '.lsp-btn:hover{border-color:#facc15;color:#facc15;}' +
    '.lsp-drop{display:none;position:absolute;right:0;top:calc(100% + 8px);' +
      'background:#1a1f29;border:1px solid #2d3748;border-radius:10px;' +
      'padding:8px;z-index:9999;' +
      'display:grid;grid-template-columns:repeat(4,1fr);gap:4px;width:180px;}' +
    '.lsp-wrap:not(.open) .lsp-drop{display:none;}' +
    '.lsp-wrap.open .lsp-drop{display:grid;}' +
    '.lsp-link{font-size:11px;font-weight:700;padding:5px 4px;border-radius:5px;' +
      'text-align:center;color:#64748b;text-decoration:none;transition:background 0.15s,color 0.15s;}' +
    '.lsp-link:hover{background:rgba(250,204,21,0.1);color:#facc15;text-decoration:none;}' +
    '.lsp-active{color:#facc15;background:rgba(250,204,21,0.07);}' +
    '@media(max-width:768px){.lsp-wrap{display:none;}}' +
    '</style>';

  document.head.insertAdjacentHTML('beforeend', style);

  var wrap = document.createElement('div');
  wrap.className = 'lsp-wrap';
  wrap.id = 'lspWrap';
  wrap.innerHTML =
    '<button class="lsp-btn" id="lspBtn">🌐 ' + lang.toUpperCase() + '</button>' +
    '<div class="lsp-drop">' + links + '</div>';

  document.addEventListener('DOMContentLoaded', function () {
    var navInner = document.querySelector('.nav-inner');
    if (navInner) navInner.appendChild(wrap);

    // Save language preference when user manually picks one
    wrap.querySelectorAll('.lsp-link').forEach(function(a) {
      a.addEventListener('click', function() {
        try { localStorage.setItem('nodus_lang', a.getAttribute('data-lang')); } catch(e) {}
      });
    });

    document.getElementById('lspBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('lspWrap').classList.toggle('open');
    });

    document.addEventListener('click', function () {
      var w = document.getElementById('lspWrap');
      if (w) w.classList.remove('open');
    });
  });
})();
