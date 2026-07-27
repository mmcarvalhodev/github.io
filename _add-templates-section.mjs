// Insere a seção "Modelos" nas 16 versões de workspace.html, logo antes da
// seção #who — depois de "como funciona", que é onde o leitor já entendeu o
// produto e quer saber por onde começar.
//
//   node _add-templates-section.mjs
//
// Idempotente: se a seção já existir (id="templates"), o ficheiro é ignorado.
import fs from 'fs';

// dir do site ('' = raiz/inglês)
const T = {
  '':   { label: 'Templates', title: '18 free templates to start from.', body: 'Budgets, invoices, meeting notes and more — ready to use. Drag one into the Workspace panel and it opens already filled in.', cta: 'Browse templates' },
  pt:   { label: 'Modelos', title: '18 modelos gratuitos para começar.', body: 'Orçamentos, recibos, atas de reunião e mais — prontos para usar. Arraste um para o painel do Workspace e ele abre já preenchido.', cta: 'Ver modelos' },
  es:   { label: 'Plantillas', title: '18 plantillas gratuitas para empezar.', body: 'Presupuestos, facturas, actas de reunión y más — listas para usar. Arrastra una al panel de Workspace y se abre ya rellenada.', cta: 'Ver plantillas' },
  fr:   { label: 'Modèles', title: '18 modèles gratuits pour démarrer.', body: 'Budgets, factures, comptes rendus et plus — prêts à l’emploi. Glissez-en un dans le panneau Workspace et il s’ouvre déjà rempli.', cta: 'Voir les modèles' },
  de:   { label: 'Vorlagen', title: '18 kostenlose Vorlagen für den Start.', body: 'Budgets, Rechnungen, Besprechungsprotokolle und mehr — sofort einsatzbereit. Ziehen Sie eine in das Workspace-Panel, sie öffnet sich bereits ausgefüllt.', cta: 'Vorlagen ansehen' },
  it:   { label: 'Modelli', title: '18 modelli gratuiti per iniziare.', body: 'Budget, fatture, verbali di riunione e altro — pronti all’uso. Trascinane uno nel pannello Workspace e si apre già compilato.', cta: 'Vedi i modelli' },
  nl:   { label: 'Sjablonen', title: '18 gratis sjablonen om te starten.', body: 'Budgetten, facturen, vergadernotulen en meer — klaar voor gebruik. Sleep er een naar het Workspace-paneel en hij opent al ingevuld.', cta: 'Bekijk sjablonen' },
  pl:   { label: 'Szablony', title: '18 darmowych szablonów na start.', body: 'Budżety, faktury, protokoły spotkań i więcej — gotowe do użycia. Przeciągnij jeden do panelu Workspace, a otworzy się już wypełniony.', cta: 'Zobacz szablony' },
  id:   { label: 'Template', title: '18 template gratis untuk memulai.', body: 'Anggaran, faktur, notulen rapat, dan lainnya — siap pakai. Seret satu ke panel Workspace dan terbuka sudah terisi.', cta: 'Lihat template' },
  vi:   { label: 'Mẫu', title: '18 mẫu miễn phí để bắt đầu.', body: 'Ngân sách, hóa đơn, biên bản họp và hơn thế — sẵn sàng dùng. Kéo một mẫu vào bảng điều khiển Workspace và nó mở ra đã điền sẵn.', cta: 'Xem mẫu' },
  ja:   { label: 'テンプレート', title: 'すぐ使える無料テンプレート 18 種。', body: '予算、請求書、議事録など — そのまま使えます。Workspace パネルにドラッグすると、入力済みで開きます。', cta: 'テンプレートを見る' },
  ko:   { label: '템플릿', title: '바로 시작할 수 있는 무료 템플릿 18개.', body: '예산, 청구서, 회의록 등 — 바로 사용하세요. Workspace 패널로 끌어다 놓으면 내용이 채워진 채 열립니다.', cta: '템플릿 보기' },
  zh:   { label: '模板', title: '18 个免费模板，直接开始。', body: '预算、发票、会议纪要等 — 开箱即用。拖到 Workspace 面板即可打开，内容已填好。', cta: '查看模板' },
  ru:   { label: 'Шаблоны', title: '18 бесплатных шаблонов для старта.', body: 'Бюджеты, счета, протоколы встреч и другое — готовы к работе. Перетащите нужный в панель Workspace, и он откроется уже заполненным.', cta: 'Смотреть шаблоны' },
  hi:   { label: 'टेम्पलेट', title: 'शुरू करने के लिए 18 मुफ़्त टेम्पलेट।', body: 'बजट, चालान, बैठक कार्यवृत्त और बहुत कुछ — तुरंत उपयोग के लिए तैयार। किसी को Workspace पैनल में खींचें और वह पहले से भरा हुआ खुलेगा।', cta: 'टेम्पलेट देखें' },
  tr:   { label: 'Şablonlar', title: 'Başlamak için 18 ücretsiz şablon.', body: 'Bütçeler, faturalar, toplantı tutanakları ve daha fazlası — kullanıma hazır. Birini Workspace paneline sürükleyin, doldurulmuş halde açılsın.', cta: 'Şablonlara göz at' },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let done = 0, skipped = 0;
for (const [dir, t] of Object.entries(T)) {
  const file = dir ? `${dir}/workspace.html` : 'workspace.html';
  if (!fs.existsSync(file)) { console.log('não existe:', file); continue; }
  let html = fs.readFileSync(file, 'utf8');

  if (html.includes('id="templates"')) { skipped++; continue; }

  const gallery = (dir ? `/${dir}` : '') + '/templates.html';
  const section = `    <!-- ── templates ── -->
    <section class="section" id="templates">
      <div class="section-label">${esc(t.label)}</div>
      <h2 class="section-title">${esc(t.title)}</h2>
      <p class="section-sub">${esc(t.body)}</p>
      <div style="margin-top:24px"><a href="${gallery}" class="btn btn-primary">${esc(t.cta)} →</a></div>
    </section>

`;

  const anchor = '    <section class="section" id="who">';
  if (!html.includes(anchor)) { console.log('âncora #who não encontrada:', file); continue; }
  html = html.replace(anchor, section + anchor);
  fs.writeFileSync(file, html, 'utf8');
  done++;
}
console.log(`seção inserida em ${done} ficheiro(s); ${skipped} já tinham.`);
