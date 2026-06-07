/* =====================================================================
   NODUS — Products menu (shared, self-contained)
   Single source of truth for the cross-site "Products" dropdown.
   - Auto-detects language (window._forcedLang -> /xx/ path -> <html lang>)
   - Auto-injects into the page nav, replacing any YT/HN/PH Radar links
   - Rolling label animation (Products <-> YT Radar <-> HN Radar <-> PH Radar)
   - Click opens a dropdown listing all 4 products with localized links
   Add a new product => edit PRODUCTS + TAG below. Nothing else.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__nodusProductsMenu) return;
  window.__nodusProductsMenu = true;

  var KNOWN = ['en','pt','es','fr','de','it','nl','pl','id','vi','ja','ko','zh','ru','hi','tr'];

  // "Products" per language
  var LABEL = {
    en:'Products', pt:'Produtos', es:'Productos', fr:'Produits', de:'Produkte',
    it:'Prodotti', nl:'Producten', pl:'Produkty', id:'Produk', vi:'Sản phẩm',
    ja:'製品', ko:'제품', zh:'产品', ru:'Продукты', hi:'उत्पाद', tr:'Ürünler'
  };

  // Short taglines per language, per product
  var TAG = {
    en:{nodus:'AI chats into structured knowledge', yt:'YouTube video rankings, live', hn:'A calmer Hacker News', ph:'Product Hunt, with history'},
    pt:{nodus:'Conversas de IA em conhecimento estruturado', yt:'Ranking de vídeos do YouTube, ao vivo', hn:'Um Hacker News mais tranquilo', ph:'Product Hunt, com histórico'},
    es:{nodus:'Chats de IA en conocimiento estructurado', yt:'Ranking de vídeos de YouTube, en vivo', hn:'Un Hacker News más tranquilo', ph:'Product Hunt, con histórico'},
    fr:{nodus:'Vos discussions IA en savoir structuré', yt:'Classement des vidéos YouTube, en direct', hn:'Un Hacker News plus calme', ph:'Product Hunt, avec historique'},
    de:{nodus:'KI-Chats als strukturiertes Wissen', yt:'YouTube-Video-Rankings, live', hn:'Ein ruhigeres Hacker News', ph:'Product Hunt, mit Verlauf'},
    it:{nodus:'Chat IA in conoscenza strutturata', yt:'Classifiche dei video YouTube, live', hn:'Un Hacker News più tranquillo', ph:'Product Hunt, con lo storico'},
    nl:{nodus:'AI-chats als gestructureerde kennis', yt:'YouTube-videoranglijsten, live', hn:'Een rustiger Hacker News', ph:'Product Hunt, met historie'},
    pl:{nodus:'Czaty AI w uporządkowaną wiedzę', yt:'Rankingi filmów YouTube, na żywo', hn:'Spokojniejszy Hacker News', ph:'Product Hunt, z historią'},
    id:{nodus:'Obrolan AI jadi pengetahuan terstruktur', yt:'Peringkat video YouTube, langsung', hn:'Hacker News yang lebih tenang', ph:'Product Hunt, dengan riwayat'},
    vi:{nodus:'Biến chat AI thành kiến thức có cấu trúc', yt:'Xếp hạng video YouTube, trực tiếp', hn:'Một Hacker News điềm tĩnh hơn', ph:'Product Hunt, có chiều sâu lịch sử'},
    ja:{nodus:'AIチャットを構造化された知識に', yt:'YouTube動画のランキングをリアルタイムで', hn:'より穏やかな Hacker News', ph:'Product Hunt を履歴付きで'},
    ko:{nodus:'AI 대화를 구조화된 지식으로', yt:'YouTube 영상 순위를 실시간으로', hn:'더 차분한 Hacker News', ph:'기록과 함께 보는 Product Hunt'},
    zh:{nodus:'把 AI 对话变成结构化知识', yt:'YouTube 视频实时排名', hn:'更清爽的 Hacker News', ph:'带历史深度的 Product Hunt'},
    ru:{nodus:'ИИ-чаты в структурированные знания', yt:'Рейтинги видео YouTube в реальном времени', hn:'Более спокойный Hacker News', ph:'Product Hunt с историей'},
    hi:{nodus:'AI चैट को संरचित ज्ञान में बदलें', yt:'YouTube वीडियो रैंकिंग, लाइव', hn:'एक शांत Hacker News', ph:'इतिहास के साथ Product Hunt'},
    tr:{nodus:'Yapay zeka sohbetlerini yapılandırılmış bilgiye', yt:'YouTube video sıralamaları, canlı', hn:'Daha sakin bir Hacker News', ph:'Geçmişiyle birlikte Product Hunt'}
  };

  var PRODUCTS = [
    { key:'nodus', name:'NODUS AI', ico:'N',  bg:'#facc15', fg:'#0e1117', i18n:true  },
    { key:'yt',    name:'YT Radar', ico:'YT', bg:'#ef4444', fg:'#ffffff', i18n:true  },
    { key:'hn',    name:'HN Radar', ico:'HN', bg:'#ff6600', fg:'#ffffff', i18n:true  },
    { key:'ph',    name:'PH Radar', ico:'PH', bg:'#da552f', fg:'#ffffff', i18n:true  }
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

  function hrefFor(key, lang, i18n) {
    var base = (lang === 'en' || !i18n) ? '' : '/' + lang;
    switch (key) {
      case 'nodus': return base ? base + '/' : '/';
      case 'yt':    return base + '/yt-radar';
      case 'hn':    return base + '/hn-radar';
      case 'ph':    return base + '/ph-radar';
      default:      return '/';
    }
  }

  var lang  = detectLang();
  var label = LABEL[lang] || LABEL.en;
  var tags  = TAG[lang]  || TAG.en;

  /* ---------- styles (hardcoded palette so it looks right on every page) ---------- */
  function injectCSS() {
    if (document.getElementById('npm-style')) return;
    var css = ''
    + '.npm-wrap{position:relative;display:inline-flex;align-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}'
    + '.npm-btn{display:inline-flex;align-items:center;gap:8px;background:transparent;border:1px solid #facc15;color:#94a3b8;font-size:14px;font-weight:500;line-height:1;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:inherit;transition:border-color .2s,color .2s,background .2s;}'
    + '.npm-btn:hover{color:#e2e8f0;border-color:#fde047;text-decoration:none;}'
    + '.npm-wrap.open .npm-btn{color:#e2e8f0;border-color:#facc15;background:rgba(250,204,21,.06);}'
    + '.npm-roll{height:20px;overflow:hidden;position:relative;display:inline-block;}'
    + '.npm-track{display:flex;flex-direction:column;transition:transform .45s cubic-bezier(.5,0,.2,1);}'
    + '.npm-item{height:20px;line-height:20px;white-space:nowrap;color:inherit;}'
    + '.npm-item.tool{color:#facc15;font-weight:600;}'
    + '.npm-caret{width:12px;height:12px;flex-shrink:0;opacity:.7;transition:transform .25s;}'
    + '.npm-wrap.open .npm-caret{transform:rotate(180deg);}'
    + '.npm-menu{position:absolute;top:calc(100% + 10px);right:0;width:300px;max-width:86vw;background:#1a1f29;border:1px solid #2d3748;border-radius:12px;padding:8px;box-shadow:0 20px 50px rgba(0,0,0,.55);opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease;transform-origin:top right;z-index:1000;}'
    + '.npm-wrap.open .npm-menu{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}'
    + '.npm-mlabel{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#475569;padding:8px 10px 6px;}'
    + '.npm-link{display:flex;align-items:flex-start;gap:12px;padding:10px;border-radius:8px;text-decoration:none;transition:background .15s;}'
    + '.npm-link:hover{background:rgba(255,255,255,.04);text-decoration:none;}'
    + '.npm-ico{width:30px;height:30px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;}'
    + '.npm-txt{display:flex;flex-direction:column;gap:1px;min-width:0;}'
    + '.npm-name{color:#e2e8f0;font-size:14px;font-weight:600;line-height:1.3;}'
    + '.npm-desc{color:#94a3b8;font-size:12px;line-height:1.45;}'
    + '@media (max-width:880px){.npm-wrap{width:100%;}.npm-menu{position:static;width:100%;max-width:none;box-shadow:none;margin-top:6px;}}'
    + '@media (prefers-reduced-motion:reduce){.npm-track{transition:none;}}';
    var s = document.createElement('style');
    s.id = 'npm-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------- build the widget ---------- */
  var ITEM_H = 20;
  var SEQ = [label, 'YT Radar', label, 'HN Radar', label, 'PH Radar'];

  function buildWidget(asLI) {
    var wrap = document.createElement(asLI ? 'li' : 'div');
    if (asLI) wrap.style.listStyle = 'none';

    var inner = document.createElement('div');
    inner.className = 'npm-wrap';

    // button + rolling text
    var btn = document.createElement('button');
    btn.className = 'npm-btn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', label);

    var roll = document.createElement('span');
    roll.className = 'npm-roll';
    var track = document.createElement('span');
    track.className = 'npm-track';
    var labels = SEQ.concat(SEQ[0]); // clone first for seamless loop
    labels.forEach(function (t) {
      var it = document.createElement('span');
      it.className = 'npm-item' + (t !== label ? ' tool' : '');
      it.textContent = t;
      track.appendChild(it);
    });
    roll.appendChild(track);

    var caret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    caret.setAttribute('class', 'npm-caret');
    caret.setAttribute('viewBox', '0 0 24 24');
    caret.setAttribute('fill', 'none');
    caret.setAttribute('stroke', 'currentColor');
    caret.setAttribute('stroke-width', '2.5');
    caret.setAttribute('stroke-linecap', 'round');
    caret.setAttribute('stroke-linejoin', 'round');
    caret.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';

    btn.appendChild(roll);
    btn.appendChild(caret);

    // dropdown
    var menu = document.createElement('div');
    menu.className = 'npm-menu';
    menu.setAttribute('role', 'menu');
    var ml = document.createElement('div');
    ml.className = 'npm-mlabel';
    ml.textContent = label;
    menu.appendChild(ml);

    PRODUCTS.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'npm-link';
      a.setAttribute('role', 'menuitem');
      a.href = hrefFor(p.key, lang, p.i18n);
      var ico = document.createElement('span');
      ico.className = 'npm-ico';
      ico.style.background = p.bg;
      ico.style.color = p.fg;
      ico.textContent = p.ico;
      var txt = document.createElement('span');
      txt.className = 'npm-txt';
      var nm = document.createElement('span');
      nm.className = 'npm-name';
      nm.textContent = p.name;
      var ds = document.createElement('span');
      ds.className = 'npm-desc';
      ds.textContent = tags[p.key] || '';
      txt.appendChild(nm); txt.appendChild(ds);
      a.appendChild(ico); a.appendChild(txt);
      menu.appendChild(a);
    });

    inner.appendChild(btn);
    inner.appendChild(menu);
    wrap.appendChild(inner);

    return { wrap: wrap, inner: inner, btn: btn, track: track };
  }

  /* ---------- rolling animation ---------- */
  function startRoll(track, inner) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    var i = 0, paused = false;
    inner.addEventListener('mouseenter', function () { paused = true; });
    inner.addEventListener('mouseleave', function () { paused = false; });
    setInterval(function () {
      if (paused || inner.classList.contains('open')) return;
      i++;
      track.style.transition = 'transform .45s cubic-bezier(.5,0,.2,1)';
      track.style.transform = 'translateY(-' + (i * ITEM_H) + 'px)';
      if (i === SEQ.length) {
        setTimeout(function () {
          track.style.transition = 'none';
          i = 0;
          track.style.transform = 'translateY(0)';
        }, 460);
      }
    }, 2100);
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

  /* ---------- find existing YT/HN/PH Radar nav links (not -privacy) ---------- */
  function radarLinks(scope) {
    var out = [];
    var as = scope.getElementsByTagName('a');
    for (var i = 0; i < as.length; i++) {
      var h = as[i].getAttribute('href') || '';
      if (/(^|\/)(yt|hn|ph)-radar(\.html)?($|[#?])/.test(h)) out.push(as[i]);
    }
    return out;
  }

  /* ---------- mount ---------- */
  function mount() {
    if (document.querySelector('.npm-wrap')) return; // idempotent
    var container =
      document.querySelector('.nav-links') ||
      document.querySelector('.nav-inner') ||
      document.querySelector('nav') ||
      document.querySelector('header');
    if (!container) return; // no nav on this page -> graceful no-op

    var navScope = container.closest('nav') || container.closest('header') || container;
    var existing = radarLinks(navScope);
    var asLI = (container.tagName === 'UL');

    injectCSS();

    var w;
    if (existing.length) {
      // replace radar links in place
      var first = existing[0];
      var ref = (first.parentNode && first.parentNode.tagName === 'LI') ? first.parentNode : first;
      asLI = (ref.tagName === 'LI');
      w = buildWidget(asLI);
      ref.parentNode.insertBefore(w.wrap, ref);
      existing.forEach(function (a) {
        var node = (a.parentNode && a.parentNode.tagName === 'LI') ? a.parentNode : a;
        if (node.parentNode) node.parentNode.removeChild(node);
      });
    } else {
      // no radar links: place into the nav
      w = buildWidget(asLI);
      var cta = container.querySelector('.nav-cta') || container.querySelector('.nav-back');
      if (cta && cta.parentNode === container) container.insertBefore(w.wrap, cta);
      else container.appendChild(w.wrap);
    }

    // size the roll to the widest label to avoid layout shift
    var items = w.track.children, max = 0;
    for (var k = 0; k < items.length; k++) max = Math.max(max, items[k].scrollWidth);
    if (max) w.track.parentNode.style.width = max + 'px';

    wire(w.inner, w.btn);
    startRoll(w.track, w.inner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
