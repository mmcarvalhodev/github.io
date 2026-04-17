(function () {
  var lang = window._forcedLang || 'en';

  document.addEventListener('DOMContentLoaded', function () {
    var faqSection = document.getElementById('faq');
    if (!faqSection) return;

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
