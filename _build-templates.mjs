// Gera a galeria de modelos do NODUS Workspace em HTML ESTÁTICO, 16 idiomas.
//
//   node _build-templates.mjs
//
// Lê templates/index.json (o catálogo, produzido pelo repo nodus-workspace) e
// escreve:
//   /templates.html                    galeria (inglês, raiz)
//   /templates/{slug}.html             página do modelo (inglês)
//   /{lang}/templates.html             galeria traduzida
//   /{lang}/templates/{slug}.html      página do modelo traduzida
//
// ESTE FORMATO DE URL É UM CONTRATO: a extensão do Workspace deriva o ficheiro
// de dados a partir dele quando o utilizador arrasta o link para o painel.
// Mudar a estrutura quebra o arrastar.
//
// Build-time de propósito: o site é estático (GitHub Pages) e montar a galeria
// por JS no browser deixaria o Google sem indexar — que é o objetivo do ativo.
import fs from 'fs';
import path from 'path';

const SITE = 'https://nodus-ai.app';
const CATALOG = 'templates/index.json';
const STORE_CHROME = 'https://chromewebstore.google.com/detail/nodus-workspace/igjpedkogacopanobbjbiobnplpklcim';
const STORE_FIREFOX = 'https://addons.mozilla.org/firefox/addon/nodus-workspace/';

// Pasta do site -> chave no i18n do catálogo. O ÚNICO desencontro é pt -> pt-BR
// (a pasta do site é /pt/, a chave do catálogo é pt-BR). Os demais são iguais.
const LANGS = [
  { dir: '',   key: 'en',    tag: 'en' },
  { dir: 'pt', key: 'pt-BR', tag: 'pt' },
  { dir: 'es', key: 'es',    tag: 'es' },
  { dir: 'fr', key: 'fr',    tag: 'fr' },
  { dir: 'de', key: 'de',    tag: 'de' },
  { dir: 'it', key: 'it',    tag: 'it' },
  { dir: 'nl', key: 'nl',    tag: 'nl' },
  { dir: 'pl', key: 'pl',    tag: 'pl' },
  { dir: 'id', key: 'id',    tag: 'id' },
  { dir: 'vi', key: 'vi',    tag: 'vi' },
  { dir: 'ja', key: 'ja',    tag: 'ja' },
  { dir: 'ko', key: 'ko',    tag: 'ko' },
  { dir: 'zh', key: 'zh',    tag: 'zh' },
  { dir: 'ru', key: 'ru',    tag: 'ru' },
  { dir: 'hi', key: 'hi',    tag: 'hi' },
  { dir: 'tr', key: 'tr',    tag: 'tr' },
];

// Textos da INTERFACE. O catálogo traduz título/descrição de cada modelo, mas
// não a moldura da página — estes são escritos aqui. "NODUS Workspace" é nome
// próprio e nunca se traduz.
const UI = {
  en: { heading: 'Templates for NODUS Workspace', intro: 'Free spreadsheets and documents, ready to use. Drag one into your Workspace panel and it opens already filled in.',
    metaTitle: 'Free Templates for NODUS Workspace', metaDesc: 'Free spreadsheet and document templates for NODUS Workspace — budgets, invoices, meeting notes and more. Local-first, no account needed.',
    open: 'Drag to NODUS Workspace', howTitle: 'How it works', howBody: 'Drag the button straight into the Workspace panel in your browser. The template opens as a new file, already filled in. Nothing is uploaded — it is created locally on your machine.',
    noExt: 'Don’t have NODUS Workspace yet?', install: 'Install free', back: '← All templates', free: 'Free', sheet: 'Spreadsheet', doc: 'Document', navBack: '← Back to home', count: '{n} free templates',
    all: 'All', cats: { financas: 'Finance', trabalho: 'Work', produtividade: 'Productivity', ia: 'AI', casa: 'Home', produto: 'Product & Software', originais: 'NODUS Originals' } },
  'pt-BR': { heading: 'Modelos para o NODUS Workspace', intro: 'Planilhas e documentos gratuitos, prontos para usar. Arraste um para o painel do Workspace e ele abre já preenchido.',
    metaTitle: 'Modelos gratuitos para o NODUS Workspace', metaDesc: 'Planilhas e documentos gratuitos para o NODUS Workspace — orçamentos, recibos, atas de reunião e mais. Local-first, sem conta.',
    open: 'Arraste para o NODUS Workspace', howTitle: 'Como funciona', howBody: 'Arraste o botão direto para o painel do Workspace no seu navegador. O modelo abre como um novo arquivo, já preenchido. Nada é enviado para servidor — é criado localmente na sua máquina.',
    noExt: 'Ainda não tem o NODUS Workspace?', install: 'Instalar grátis', back: '← Todos os modelos', free: 'Grátis', sheet: 'Planilha', doc: 'Documento', navBack: '← Voltar ao início', count: '{n} modelos gratuitos',
    all: 'Todos', cats: { financas: 'Finanças', trabalho: 'Trabalho', produtividade: 'Produtividade', ia: 'IA', casa: 'Casa', produto: 'Produto e Software', originais: 'NODUS Originals' } },
  es: { heading: 'Plantillas para NODUS Workspace', intro: 'Hojas de cálculo y documentos gratuitos, listos para usar. Arrastra uno al panel de Workspace y se abre ya rellenado.',
    metaTitle: 'Plantillas gratuitas para NODUS Workspace', metaDesc: 'Plantillas gratuitas de hojas de cálculo y documentos para NODUS Workspace — presupuestos, facturas, actas de reunión y más. Local-first, sin cuenta.',
    open: 'Arrastra a NODUS Workspace', howTitle: 'Cómo funciona', howBody: 'Arrastra el botón directamente al panel de Workspace en tu navegador. La plantilla se abre como un archivo nuevo, ya rellenado. Nada se sube — se crea localmente en tu equipo.',
    noExt: '¿Aún no tienes NODUS Workspace?', install: 'Instalar gratis', back: '← Todas las plantillas', free: 'Gratis', sheet: 'Hoja de cálculo', doc: 'Documento', navBack: '← Volver al inicio', count: '{n} plantillas gratuitas',
    all: 'Todas', cats: { financas: 'Finanzas', trabalho: 'Trabajo', produtividade: 'Productividad', ia: 'IA', casa: 'Hogar', produto: 'Producto y Software', originais: 'NODUS Originals' } },
  fr: { heading: 'Modèles pour NODUS Workspace', intro: 'Tableurs et documents gratuits, prêts à l’emploi. Glissez-en un dans le panneau Workspace et il s’ouvre déjà rempli.',
    metaTitle: 'Modèles gratuits pour NODUS Workspace', metaDesc: 'Modèles gratuits de tableurs et documents pour NODUS Workspace — budgets, factures, comptes rendus et plus. Local-first, sans compte.',
    open: 'Glissez vers NODUS Workspace', howTitle: 'Comment ça marche', howBody: 'Glissez le bouton directement dans le panneau Workspace de votre navigateur. Le modèle s’ouvre comme un nouveau fichier, déjà rempli. Rien n’est envoyé — tout est créé localement sur votre machine.',
    noExt: 'Vous n’avez pas encore NODUS Workspace ?', install: 'Installer gratuitement', back: '← Tous les modèles', free: 'Gratuit', sheet: 'Tableur', doc: 'Document', navBack: '← Retour à l’accueil', count: '{n} modèles gratuits',
    all: 'Tous', cats: { financas: 'Finances', trabalho: 'Travail', produtividade: 'Productivité', ia: 'IA', casa: 'Maison', produto: 'Produit et logiciel', originais: 'NODUS Originals' } },
  de: { heading: 'Vorlagen für NODUS Workspace', intro: 'Kostenlose Tabellen und Dokumente, sofort einsatzbereit. Ziehen Sie eine in das Workspace-Panel — sie öffnet sich bereits ausgefüllt.',
    metaTitle: 'Kostenlose Vorlagen für NODUS Workspace', metaDesc: 'Kostenlose Tabellen- und Dokumentvorlagen für NODUS Workspace — Budgets, Rechnungen, Besprechungsprotokolle und mehr. Local-first, ohne Konto.',
    open: 'In NODUS Workspace ziehen', howTitle: 'So funktioniert es', howBody: 'Ziehen Sie die Schaltfläche direkt in das Workspace-Panel im Browser. Die Vorlage öffnet sich als neue Datei, bereits ausgefüllt. Nichts wird hochgeladen — sie entsteht lokal auf Ihrem Rechner.',
    noExt: 'Sie haben NODUS Workspace noch nicht?', install: 'Kostenlos installieren', back: '← Alle Vorlagen', free: 'Kostenlos', sheet: 'Tabelle', doc: 'Dokument', navBack: '← Zurück zur Startseite', count: '{n} kostenlose Vorlagen',
    all: 'Alle', cats: { financas: 'Finanzen', trabalho: 'Arbeit', produtividade: 'Produktivität', ia: 'KI', casa: 'Zuhause', produto: 'Produkt & Software', originais: 'NODUS Originals' } },
  it: { heading: 'Modelli per NODUS Workspace', intro: 'Fogli di calcolo e documenti gratuiti, pronti all’uso. Trascinane uno nel pannello Workspace e si apre già compilato.',
    metaTitle: 'Modelli gratuiti per NODUS Workspace', metaDesc: 'Modelli gratuiti di fogli di calcolo e documenti per NODUS Workspace — budget, fatture, verbali di riunione e altro. Local-first, senza account.',
    open: 'Trascina in NODUS Workspace', howTitle: 'Come funziona', howBody: 'Trascina il pulsante direttamente nel pannello Workspace del browser. Il modello si apre come nuovo file, già compilato. Nulla viene caricato — viene creato localmente sul tuo computer.',
    noExt: 'Non hai ancora NODUS Workspace?', install: 'Installa gratis', back: '← Tutti i modelli', free: 'Gratis', sheet: 'Foglio di calcolo', doc: 'Documento', navBack: '← Torna alla home', count: '{n} modelli gratuiti',
    all: 'Tutti', cats: { financas: 'Finanze', trabalho: 'Lavoro', produtividade: 'Produttività', ia: 'IA', casa: 'Casa', produto: 'Prodotto e software', originais: 'NODUS Originals' } },
  nl: { heading: 'Sjablonen voor NODUS Workspace', intro: 'Gratis spreadsheets en documenten, klaar voor gebruik. Sleep er een naar het Workspace-paneel en hij opent al ingevuld.',
    metaTitle: 'Gratis sjablonen voor NODUS Workspace', metaDesc: 'Gratis spreadsheet- en documentsjablonen voor NODUS Workspace — budgetten, facturen, vergadernotulen en meer. Local-first, zonder account.',
    open: 'Sleep naar NODUS Workspace', howTitle: 'Hoe het werkt', howBody: 'Sleep de knop rechtstreeks naar het Workspace-paneel in je browser. Het sjabloon opent als een nieuw bestand, al ingevuld. Er wordt niets geüpload — het wordt lokaal op je computer aangemaakt.',
    noExt: 'Heb je NODUS Workspace nog niet?', install: 'Gratis installeren', back: '← Alle sjablonen', free: 'Gratis', sheet: 'Spreadsheet', doc: 'Document', navBack: '← Terug naar home', count: '{n} gratis sjablonen',
    all: 'Alle', cats: { financas: 'Financiën', trabalho: 'Werk', produtividade: 'Productiviteit', ia: 'AI', casa: 'Thuis', produto: 'Product en software', originais: 'NODUS Originals' } },
  pl: { heading: 'Szablony dla NODUS Workspace', intro: 'Darmowe arkusze i dokumenty, gotowe do użycia. Przeciągnij jeden do panelu Workspace, a otworzy się już wypełniony.',
    metaTitle: 'Darmowe szablony dla NODUS Workspace', metaDesc: 'Darmowe szablony arkuszy i dokumentów dla NODUS Workspace — budżety, faktury, protokoły spotkań i więcej. Local-first, bez konta.',
    open: 'Przeciągnij do NODUS Workspace', howTitle: 'Jak to działa', howBody: 'Przeciągnij przycisk prosto do panelu Workspace w przeglądarce. Szablon otworzy się jako nowy plik, już wypełniony. Nic nie jest wysyłane — powstaje lokalnie na Twoim komputerze.',
    noExt: 'Nie masz jeszcze NODUS Workspace?', install: 'Zainstaluj za darmo', back: '← Wszystkie szablony', free: 'Za darmo', sheet: 'Arkusz', doc: 'Dokument', navBack: '← Powrót do strony głównej', count: '{n} darmowych szablonów',
    all: 'Wszystkie', cats: { financas: 'Finanse', trabalho: 'Praca', produtividade: 'Produktywność', ia: 'SI', casa: 'Dom', produto: 'Produkt i oprogramowanie', originais: 'NODUS Originals' } },
  id: { heading: 'Template untuk NODUS Workspace', intro: 'Spreadsheet dan dokumen gratis, siap pakai. Seret satu ke panel Workspace dan template terbuka sudah terisi.',
    metaTitle: 'Template gratis untuk NODUS Workspace', metaDesc: 'Template spreadsheet dan dokumen gratis untuk NODUS Workspace — anggaran, faktur, notulen rapat, dan lainnya. Local-first, tanpa akun.',
    open: 'Seret ke NODUS Workspace', howTitle: 'Cara kerjanya', howBody: 'Seret tombol langsung ke panel Workspace di browser Anda. Template terbuka sebagai berkas baru, sudah terisi. Tidak ada yang diunggah — dibuat secara lokal di perangkat Anda.',
    noExt: 'Belum punya NODUS Workspace?', install: 'Pasang gratis', back: '← Semua template', free: 'Gratis', sheet: 'Spreadsheet', doc: 'Dokumen', navBack: '← Kembali ke beranda', count: '{n} template gratis',
    all: 'Semua', cats: { financas: 'Keuangan', trabalho: 'Kerja', produtividade: 'Produktivitas', ia: 'AI', casa: 'Rumah', produto: 'Produk & Perangkat Lunak', originais: 'NODUS Originals' } },
  vi: { heading: 'Mẫu cho NODUS Workspace', intro: 'Bảng tính và tài liệu miễn phí, sẵn sàng dùng. Kéo một mẫu vào bảng điều khiển Workspace và nó mở ra đã điền sẵn.',
    metaTitle: 'Mẫu miễn phí cho NODUS Workspace', metaDesc: 'Mẫu bảng tính và tài liệu miễn phí cho NODUS Workspace — ngân sách, hóa đơn, biên bản họp và hơn thế nữa. Local-first, không cần tài khoản.',
    open: 'Kéo vào NODUS Workspace', howTitle: 'Cách hoạt động', howBody: 'Kéo nút thẳng vào bảng điều khiển Workspace trên trình duyệt. Mẫu mở ra như một tệp mới, đã điền sẵn. Không có gì được tải lên — tệp được tạo cục bộ trên máy bạn.',
    noExt: 'Chưa có NODUS Workspace?', install: 'Cài đặt miễn phí', back: '← Tất cả mẫu', free: 'Miễn phí', sheet: 'Bảng tính', doc: 'Tài liệu', navBack: '← Về trang chủ', count: '{n} mẫu miễn phí',
    all: 'Tất cả', cats: { financas: 'Tài chính', trabalho: 'Công việc', produtividade: 'Năng suất', ia: 'AI', casa: 'Gia đình', produto: 'Sản phẩm & phần mềm', originais: 'NODUS Originals' } },
  ja: { heading: 'NODUS Workspace 用テンプレート', intro: '無料のスプレッドシートとドキュメント、すぐに使えます。Workspace パネルにドラッグすると、入力済みの状態で開きます。',
    metaTitle: 'NODUS Workspace の無料テンプレート', metaDesc: 'NODUS Workspace 用の無料スプレッドシート・ドキュメントテンプレート — 予算、請求書、議事録など。ローカルファースト、アカウント不要。',
    open: 'NODUS Workspace にドラッグ', howTitle: '使い方', howBody: 'このボタンをブラウザの Workspace パネルに直接ドラッグします。テンプレートは入力済みの新しいファイルとして開きます。アップロードは行われません — お使いの端末内で作成されます。',
    noExt: 'NODUS Workspace はまだですか？', install: '無料でインストール', back: '← すべてのテンプレート', free: '無料', sheet: 'スプレッドシート', doc: 'ドキュメント', navBack: '← ホームに戻る', count: '無料テンプレート {n} 件',
    all: 'すべて', cats: { financas: '家計・財務', trabalho: '仕事', produtividade: '生産性', ia: 'AI', casa: '暮らし', produto: 'プロダクト・開発', originais: 'NODUS Originals' } },
  ko: { heading: 'NODUS Workspace용 템플릿', intro: '무료 스프레드시트와 문서를 바로 사용하세요. Workspace 패널로 끌어다 놓으면 내용이 채워진 상태로 열립니다.',
    metaTitle: 'NODUS Workspace 무료 템플릿', metaDesc: 'NODUS Workspace용 무료 스프레드시트 및 문서 템플릿 — 예산, 청구서, 회의록 등. 로컬 우선, 계정 불필요.',
    open: 'NODUS Workspace로 끌어다 놓기', howTitle: '사용 방법', howBody: '이 버튼을 브라우저의 Workspace 패널로 바로 끌어다 놓으세요. 템플릿이 내용이 채워진 새 파일로 열립니다. 업로드되지 않으며 기기에서 로컬로 만들어집니다.',
    noExt: '아직 NODUS Workspace가 없나요?', install: '무료 설치', back: '← 전체 템플릿', free: '무료', sheet: '스프레드시트', doc: '문서', navBack: '← 홈으로', count: '무료 템플릿 {n}개',
    all: '전체', cats: { financas: '재무', trabalho: '업무', produtividade: '생산성', ia: 'AI', casa: '가정', produto: '제품 및 소프트웨어', originais: 'NODUS Originals' } },
  zh: { heading: 'NODUS Workspace 模板', intro: '免费的表格与文档，开箱即用。拖到 Workspace 面板即可打开，内容已填好。',
    metaTitle: 'NODUS Workspace 免费模板', metaDesc: 'NODUS Workspace 的免费表格和文档模板 — 预算、发票、会议纪要等。本地优先，无需账号。',
    open: '拖到 NODUS Workspace', howTitle: '如何使用', howBody: '把此按钮直接拖到浏览器的 Workspace 面板。模板会作为新文件打开，内容已填好。不会上传任何内容 — 文件在你的设备本地生成。',
    noExt: '还没有 NODUS Workspace？', install: '免费安装', back: '← 全部模板', free: '免费', sheet: '表格', doc: '文档', navBack: '← 返回首页', count: '{n} 个免费模板',
    all: '全部', cats: { financas: '财务', trabalho: '工作', produtividade: '效率', ia: '人工智能', casa: '生活', produto: '产品与软件', originais: 'NODUS Originals' } },
  ru: { heading: 'Шаблоны для NODUS Workspace', intro: 'Бесплатные таблицы и документы, готовые к работе. Перетащите нужный в панель Workspace — он откроется уже заполненным.',
    metaTitle: 'Бесплатные шаблоны для NODUS Workspace', metaDesc: 'Бесплатные шаблоны таблиц и документов для NODUS Workspace — бюджеты, счета, протоколы встреч и другое. Local-first, без аккаунта.',
    open: 'Перетащите в NODUS Workspace', howTitle: 'Как это работает', howBody: 'Перетащите кнопку прямо в панель Workspace в браузере. Шаблон откроется как новый файл, уже заполненный. Ничего не загружается на сервер — файл создаётся локально на вашем устройстве.',
    noExt: 'Ещё нет NODUS Workspace?', install: 'Установить бесплатно', back: '← Все шаблоны', free: 'Бесплатно', sheet: 'Таблица', doc: 'Документ', navBack: '← На главную', count: 'Бесплатных шаблонов: {n}',
    all: 'Все', cats: { financas: 'Финансы', trabalho: 'Работа', produtividade: 'Продуктивность', ia: 'ИИ', casa: 'Дом', produto: 'Продукт и разработка', originais: 'NODUS Originals' } },
  hi: { heading: 'NODUS Workspace के लिए टेम्पलेट', intro: 'मुफ़्त स्प्रेडशीट और दस्तावेज़, तुरंत उपयोग के लिए तैयार। किसी को Workspace पैनल में खींचें और वह पहले से भरा हुआ खुल जाएगा।',
    metaTitle: 'NODUS Workspace के लिए मुफ़्त टेम्पलेट', metaDesc: 'NODUS Workspace के लिए मुफ़्त स्प्रेडशीट और दस्तावेज़ टेम्पलेट — बजट, चालान, बैठक कार्यवृत्त और बहुत कुछ। लोकल-फ़र्स्ट, बिना खाते के।',
    open: 'NODUS Workspace में खींचें', howTitle: 'यह कैसे काम करता है', howBody: 'इस बटन को सीधे ब्राउज़र के Workspace पैनल में खींचें। टेम्पलेट पहले से भरी हुई नई फ़ाइल के रूप में खुलता है। कुछ भी अपलोड नहीं होता — यह आपके डिवाइस पर ही बनता है।',
    noExt: 'अभी तक NODUS Workspace नहीं है?', install: 'मुफ़्त इंस्टॉल करें', back: '← सभी टेम्पलेट', free: 'मुफ़्त', sheet: 'स्प्रेडशीट', doc: 'दस्तावेज़', navBack: '← होम पर लौटें', count: '{n} मुफ़्त टेम्पलेट',
    all: 'सभी', cats: { financas: 'वित्त', trabalho: 'काम', produtividade: 'उत्पादकता', ia: 'एआई', casa: 'घर', produto: 'उत्पाद और सॉफ़्टवेयर', originais: 'NODUS Originals' } },
  tr: { heading: 'NODUS Workspace için şablonlar', intro: 'Ücretsiz elektronik tablolar ve belgeler, kullanıma hazır. Birini Workspace paneline sürükleyin, doldurulmuş halde açılsın.',
    metaTitle: 'NODUS Workspace için ücretsiz şablonlar', metaDesc: 'NODUS Workspace için ücretsiz tablo ve belge şablonları — bütçeler, faturalar, toplantı tutanakları ve daha fazlası. Local-first, hesap gerekmez.',
    open: 'NODUS Workspace’e sürükleyin', howTitle: 'Nasıl çalışır', howBody: 'Düğmeyi doğrudan tarayıcınızdaki Workspace paneline sürükleyin. Şablon, doldurulmuş yeni bir dosya olarak açılır. Hiçbir şey yüklenmez — dosya cihazınızda yerel olarak oluşturulur.',
    noExt: 'Henüz NODUS Workspace yok mu?', install: 'Ücretsiz yükle', back: '← Tüm şablonlar', free: 'Ücretsiz', sheet: 'Tablo', doc: 'Belge', navBack: '← Ana sayfaya dön', count: '{n} ücretsiz şablon',
    all: 'Tümü', cats: { financas: 'Finans', trabalho: 'İş', produtividade: 'Üretkenlik', ia: 'Yapay zekâ', casa: 'Ev', produto: 'Ürün ve Yazılım', originais: 'NODUS Originals' } },
};

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Caminho público de uma página, a partir da pasta do idioma ('' = raiz).
const galleryPath  = dir => (dir ? `/${dir}` : '') + '/templates.html';
const templatePath = (dir, slug) => (dir ? `/${dir}` : '') + `/templates/${slug}.html`;

// hreflang recíproco: SEMPRE montado a partir do caminho BASE, nunca de um
// caminho já prefixado — foi esse erro que gerou centenas de URLs /es/pt/...
// 404 no Search Console em julho/2026.
function alternates(makePath) {
  return LANGS
    .map(l => `  <link rel="alternate" hreflang="${l.tag}" href="${SITE}${makePath(l.dir)}">`)
    .join('\n')
    + `\n  <link rel="alternate" hreflang="x-default" href="${SITE}${makePath('')}">`;
}

const FAVICON = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230e1117'/%3E%3Ccircle cx='16' cy='16' r='9' fill='%23facc15'/%3E%3Ccircle cx='16' cy='16' r='4' fill='%230e1117'/%3E%3C/svg%3E">`;

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0c12;--panel:#131720;--card:#1a1f29;--border:#2d3748;--yellow:#facc15;--text:#e2e8f0;--sub:#94a3b8;--muted:#475569;--green:#10b981}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6}
a{color:var(--yellow);text-decoration:none}
a:hover{text-decoration:underline}
/* Classe, NÃO o seletor de tipo "nav": a barra de categorias também é um
   elemento nav, e apanhava o sticky+z-index+fundo daqui — ficava colada ao
   topo a tapar o dropdown de idiomas (vem depois no DOM, logo ganha o
   empate de z-index). */
.site-nav{border-bottom:1px solid var(--border);background:rgba(10,12,18,.9);position:sticky;top:0;z-index:100;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.nav-inner{max-width:1140px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:18px}
.nav-logo{font-weight:800;color:var(--text);font-size:18px}
.nav-logo:hover{text-decoration:none}
.nav-links{display:flex;gap:18px;font-size:14px}
.nav-link{color:var(--sub)}
.nav-link:hover{color:var(--text);text-decoration:none}
.nav-back{margin-left:auto;font-size:13px;color:var(--sub)}
.wrap{max-width:1140px;margin:0 auto;padding:0 24px}
.head{padding:52px 0 28px}
.head h1{font-size:34px;font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
.head p{color:var(--sub);font-size:16px;max-width:62ch}
.count{color:var(--muted);font-size:13px;margin-top:10px}
.how{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px 22px;margin:8px 0 34px;max-width:760px}
.how h2{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--yellow);margin-bottom:8px}
.how p{color:var(--sub);font-size:14.5px}
.catnav{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:30px}
.catnav a{background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:6px 14px;font-size:13px;color:var(--sub)}
.catnav a:hover{border-color:var(--yellow);color:var(--yellow);text-decoration:none}
/* Filtro por categoria sem JS, via :target. Com uma secção alvo, esconde as
   outras; sem alvo — e em browsers sem :has() — aparece tudo, que é o estado
   por omissão e o que o Google vê. As regras de pill activo dependem dos
   slugs do catálogo, por isso são geradas em galleryPage. */
.catsec{scroll-margin-top:72px}
body:has(.catsec:target) .catsec:not(:target){display:none}
body:not(:has(.catsec:target)) .catnav .cat-all{border-color:var(--yellow);color:var(--yellow)}
.cat-head{display:flex;align-items:baseline;gap:9px;margin:32px 0 12px;padding-top:8px}
.cat-head h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--sub)}
.cat-head .n{font-size:12px;color:var(--muted)}
.card-badges{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
.badge{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;border-radius:5px;padding:2px 7px;background:rgba(148,163,184,.12);color:var(--sub)}
.badge.free{background:rgba(16,185,129,.14);color:var(--green)}
/* mosaico compacto: o azulejo traz a miniatura real do modelo (o mesmo render
   8:5 da fatia, reduzido) e o preview grande fica na fatia que abre ao clicar.
   Toggle é CSS puro (checkbox + irmão), o conteúdo está sempre no DOM para o
   Google indexar. */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:10px}
.tgl{position:absolute;width:1px;height:1px;opacity:0}
.tile{display:flex;align-items:center;gap:11px;background:var(--card);border:1px solid var(--border);border-radius:11px;padding:10px 12px;cursor:pointer;transition:border-color .15s,background .15s;-webkit-user-select:none;user-select:none}
.tile:hover{border-color:var(--yellow)}
.tile-th{flex:none;width:72px;height:45px;border-radius:6px;overflow:hidden;background:#0e1117;border:1px solid var(--border)}
.tile-th img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.tile:hover .tile-th{border-color:var(--yellow)}
.tile-tx{flex:1;min-width:0}
.tile-tt{display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;font-size:13.5px;font-weight:700;color:var(--text);line-height:1.3;overflow:hidden}
.tile-ty{display:block;font-size:11px;color:var(--muted);line-height:1.4}
.tile-cv{flex:none;color:var(--muted);transition:transform .18s}
.tile-cv svg{display:block}
.tgl:checked + .tile{border-color:var(--yellow);background:#20262f}
.tgl:checked + .tile .tile-cv{transform:rotate(180deg);color:var(--yellow)}
.tgl:focus-visible + .tile{outline:2px solid var(--yellow);outline-offset:2px}
.slice{display:none;grid-column:1/-1}
.tgl:checked + .tile + .slice{display:block}
.slice-in{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:22px;align-items:start;background:var(--panel);border:1px solid var(--yellow);border-radius:13px;padding:18px;margin:2px 0 6px}
@media(max-width:760px){.slice-in{grid-template-columns:1fr}}
.slice-thumb{background:#0e1117;border:1px solid var(--border);border-radius:10px;overflow:hidden}
.slice-thumb img{width:100%;height:auto;display:block}
.slice-tt{font-size:18px;font-weight:800;letter-spacing:-.01em;margin-bottom:9px;line-height:1.25}
.slice-tt a{color:var(--text)}
.slice-desc{font-size:14px;color:var(--sub);margin-bottom:16px}
.slice .btn{display:block}
.btn{display:inline-block;text-align:center;background:var(--yellow);color:#0a0c12;font-weight:700;font-size:13.5px;border-radius:9px;padding:10px 16px;cursor:grab}
.btn:hover{filter:brightness(1.08);text-decoration:none}
.detail{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:38px;padding:36px 0 12px;align-items:start}
@media(max-width:860px){.detail{grid-template-columns:1fr}}
.detail-thumb{background:#0e1117;border:1px solid var(--border);border-radius:14px;overflow:hidden}
.detail-thumb img{width:100%;height:auto;display:block}
.detail h1{font-size:29px;font-weight:800;letter-spacing:-.02em;margin:10px 0 12px}
.detail-desc{color:var(--sub);font-size:16px;margin-bottom:22px}
.side{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px}
.side .btn{display:block;width:100%}
.side-note{font-size:13px;color:var(--sub);margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}
.side-note a{font-weight:600}
.back{display:inline-block;margin:26px 0 8px;font-size:13.5px;color:var(--sub)}
footer{border-top:1px solid var(--border);margin-top:60px;padding:26px 24px;text-align:center;color:var(--muted);font-size:13px}
footer a{color:var(--muted)}
`;

function shell({ lang, title, desc, canonical, alts, body, jsonld, extraCss = '' }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${SITE}${canonical}">
${alts}
  ${FAVICON}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${SITE}${canonical}">
  <meta property="og:image" content="${SITE}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <style>${CSS}${extraCss}</style>
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
${body}
<script src="/lang-switcher.js"></script>
</body>
</html>`;
}

function nav(t, dir) {
  const home = dir ? `/${dir}/` : '/';
  return `<nav class="site-nav"><div class="nav-inner">
  <a href="${home}" class="nav-logo">NODUS</a>
  <div class="nav-links">
    <a href="${dir ? `/${dir}/workspace` : '/workspace'}" class="nav-link">NODUS Workspace</a>
    <a href="${galleryPath(dir)}" class="nav-link">${esc(t.heading.split(' ')[0])}</a>
  </div>
  <a href="${home}" class="nav-back">${esc(t.navBack)}</a>
</div></nav>`;
}

const footer = () => `<footer>NODUS · <a href="${SITE}">nodus-ai.app</a></footer>`;

// O botão é um link NORMAL para a própria página do modelo. Clicar abre a
// página; ARRASTAR para o painel do Workspace importa o modelo (o browser põe
// o URL em text/uri-list e a extensão deriva o ficheiro de dados daí).
function openButton(t, dir, slug) {
  return `<a class="btn" href="${templatePath(dir, slug)}" draggable="true">${esc(t.open)}</a>`;
}

const CHEVRON = `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.2l4 4 4-4"/></svg>`;

// Azulejo + fatia. O azulejo é um <label> de um checkbox escondido: a fatia
// abre sem JS. A descrição e o link para a página do modelo ficam SEMPRE no
// HTML (só ocultos por CSS), para não perder indexação nem o rastreio.
function tile(t, dir, tpl, e) {
  const typeLabel = tpl.type === 'sheet' ? t.sheet : t.doc;
  const id = `t-${tpl.slug}`;
  const href = templatePath(dir, tpl.slug);
  return `<input type="checkbox" class="tgl" id="${id}">
<label class="tile" for="${id}">
  <span class="tile-th"><img src="${e.thumb}" alt="" loading="lazy" width="72" height="45"></span>
  <span class="tile-tx"><span class="tile-tt">${esc(e.title)}</span><span class="tile-ty">${esc(typeLabel)}</span></span>
  <span class="tile-cv">${CHEVRON}</span>
</label>
<div class="slice">
  <div class="slice-in">
    <div class="slice-thumb"><img src="${e.thumb}" alt="${esc(e.title)}" loading="lazy" width="800" height="500"></div>
    <div>
      <div class="card-badges"><span class="badge">${esc(typeLabel)}</span><span class="badge free">${esc(t.free)}</span></div>
      <h3 class="slice-tt"><a href="${href}">${esc(e.title)}</a></h3>
      ${e.description ? `<p class="slice-desc">${esc(e.description)}</p>` : ''}
      ${openButton(t, dir, tpl.slug)}
    </div>
  </div>
</div>`;
}

// Ordem de apresentação das categorias. Sem isto seguia a ordem do catálogo,
// que deixava os Originals em último — e são eles que interessa destacar: não
// existem noutro lado, ao contrário de um orçamento ou de uma lista de tarefas.
// Categoria fora desta lista vai para o fim, por ordem do catálogo.
const CAT_ORDER = ['originais', 'produto', 'trabalho', 'ia', 'financas', 'produtividade', 'casa'];

function galleryPage(t, L, templates) {
  const byCat = {};
  for (const tpl of templates) (byCat[tpl.category] ||= []).push(tpl);
  const cats = Object.keys(byCat).sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  // "Todos" é um link que limpa o alvo: sem :target, todas as secções voltam.
  const catNav = `<a href="#" class="cat-all">${esc(t.all)}</a>`
    + cats.map(c => `<a href="#${c}" class="cat-${c}">${esc(t.cats[c] || c)}</a>`).join('');

  // O id vai na SECÇÃO (não no cabeçalho): é ela que :target precisa de casar
  // para esconder as irmãs.
  const sections = cats.map(c => `
  <section class="catsec" id="${c}">
    <div class="cat-head"><h2>${esc(t.cats[c] || c)}</h2><span class="n">${byCat[c].length}</span></div>
    <div class="grid">${byCat[c].map(tpl => tile(t, L.dir, tpl, tpl.i18n[L.key])).join('\n')}</div>
  </section>`).join('\n');

  // Pill activo da categoria escolhida — depende dos slugs, por isso é gerado.
  const extraCss = cats
    .map(c => `body:has(#${c}:target) .catnav .cat-${c}{border-color:var(--yellow);color:var(--yellow)}`)
    .join('');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.metaTitle,
    description: t.metaDesc,
    url: `${SITE}${galleryPath(L.dir)}`,
    inLanguage: L.tag,
    // Só metadados — o conteúdo do modelo nunca entra no HTML nem no JSON-LD.
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: templates.length,
      itemListElement: templates.map((tpl, i) => ({
        '@type': 'ListItem', position: i + 1,
        name: tpl.i18n[L.key].title,
        url: `${SITE}${templatePath(L.dir, tpl.slug)}`,
      })),
    },
  };

  const body = `${nav(t, L.dir)}
<div class="wrap">
  <div class="head">
    <h1>${esc(t.heading)}</h1>
    <p>${esc(t.intro)}</p>
    <div class="count">${esc(t.count.replace('{n}', templates.length))}</div>
  </div>
  <section class="how"><h2>${esc(t.howTitle)}</h2><p>${esc(t.howBody)}</p></section>
  <nav class="catnav">${catNav}</nav>
  ${sections}
</div>
${footer()}
<script>
// Só uma fatia aberta de cada vez. Sem isto a página continua a funcionar —
// o abrir/fechar é CSS puro; o script apenas fecha as outras.
document.addEventListener('change', function (ev) {
  var el = ev.target;
  if (!el.classList || !el.classList.contains('tgl') || !el.checked) return;
  document.querySelectorAll('.tgl').forEach(function (o) { if (o !== el) o.checked = false; });
});
</script>`;

  return shell({
    lang: L.tag, title: t.metaTitle, desc: t.metaDesc,
    canonical: galleryPath(L.dir), alts: alternates(galleryPath),
    body, jsonld, extraCss,
  });
}

function templatePage(t, L, tpl) {
  const e = tpl.i18n[L.key];
  const typeLabel = tpl.type === 'sheet' ? t.sheet : t.doc;
  const title = `${e.title} — ${t.metaTitle}`;
  // Descrição pode vir vazia no catálogo (acontece em 5 entradas pt-BR); nesse
  // caso cai para a descrição genérica da galeria em vez de ficar vazia.
  const desc = e.description || t.metaDesc;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: e.title,
    description: e.description || undefined,
    url: `${SITE}${templatePath(L.dir, tpl.slug)}`,
    thumbnailUrl: `${SITE}${e.thumb}`,
    inLanguage: L.tag,
    isAccessibleForFree: true,
    genre: t.cats[tpl.category] || tpl.category,
    learningResourceType: typeLabel,
    isPartOf: { '@type': 'CollectionPage', name: t.metaTitle, url: `${SITE}${galleryPath(L.dir)}` },
  };

  const body = `${nav(t, L.dir)}
<div class="wrap">
  <a class="back" href="${galleryPath(L.dir)}">${esc(t.back)}</a>
  <div class="detail">
    <div>
      <div class="detail-thumb"><img src="${e.thumb}" alt="${esc(e.title)}" width="800" height="500"></div>
      <h1>${esc(e.title)}</h1>
      <p class="detail-desc">${esc(e.description || '')}</p>
      <section class="how"><h2>${esc(t.howTitle)}</h2><p>${esc(t.howBody)}</p></section>
    </div>
    <aside class="side">
      <div class="card-badges"><span class="badge">${esc(typeLabel)}</span><span class="badge">${esc(t.cats[tpl.category] || tpl.category)}</span><span class="badge free">${esc(t.free)}</span></div>
      ${openButton(t, L.dir, tpl.slug)}
      <div class="side-note">${esc(t.noExt)}<br>
        <a href="${STORE_CHROME}" target="_blank" rel="noopener">${esc(t.install)} — Chrome</a> ·
        <a href="${STORE_FIREFOX}" target="_blank" rel="noopener">Firefox</a>
      </div>
    </aside>
  </div>
</div>
${footer()}`;

  return shell({
    lang: L.tag, title, desc,
    canonical: templatePath(L.dir, tpl.slug),
    alts: alternates(dir => templatePath(dir, tpl.slug)),
    body, jsonld,
  });
}

// ── build ────────────────────────────────────────────────────────────────────
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const templates = catalog.templates;
let written = 0;
const warnings = [];

for (const L of LANGS) {
  const t = UI[L.key];
  if (!t) { warnings.push(`sem textos de UI para ${L.key} — idioma ignorado`); continue; }

  // valida que todo modelo tem o idioma antes de gerar
  const missing = templates.filter(tpl => !tpl.i18n[L.key]);
  if (missing.length) { warnings.push(`${L.key}: ${missing.length} modelo(s) sem tradução — ignorado`); continue; }
  for (const tpl of templates) {
    if (!tpl.i18n[L.key].description) warnings.push(`descrição vazia: ${tpl.slug} [${L.key}]`);
  }

  // galeria
  const gPath = galleryPath(L.dir).replace(/^\//, '');
  fs.mkdirSync(path.dirname(gPath) || '.', { recursive: true });
  fs.writeFileSync(gPath, galleryPage(t, L, templates), 'utf8');
  written++;

  // páginas dos modelos
  for (const tpl of templates) {
    const p = templatePath(L.dir, tpl.slug).replace(/^\//, '');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, templatePage(t, L, tpl), 'utf8');
    written++;
  }
}

console.log(`modelos: ${templates.length} · idiomas: ${LANGS.length}`);
console.log(`ficheiros HTML escritos: ${written}`);
if (warnings.length) {
  console.log(`\navisos (${warnings.length}):`);
  warnings.forEach(w => console.log('  - ' + w));
}
