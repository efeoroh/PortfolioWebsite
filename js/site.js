// Mobile menu, work filters, and the video player. No dependencies.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // Filters
  var filters = document.querySelectorAll('.filter');
  var cards = document.querySelectorAll('.card[data-cat]');
  function apply(cat) {
    filters.forEach(function (f) { f.setAttribute('aria-pressed', f.dataset.cat === cat); });
    cards.forEach(function (c) { c.hidden = !(cat === 'all' || c.dataset.cat === cat); });
  }
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      apply(f.dataset.cat);
      try { history.replaceState(null, '', f.dataset.cat === 'all' ? '#work' : '#' + f.dataset.cat); } catch (e) {}
    });
  });
  var start = (location.hash || '').slice(1);
  if (start && document.querySelector('.filter[data-cat="' + start + '"]')) {
    apply(start);
    var w = document.getElementById('work'); if (w) w.scrollIntoView();
  }

  // Video player
  var dlg = document.getElementById('player');
  if (dlg) {
    var vid = dlg.querySelector('video');
    var ttl = dlg.querySelector('.bar span');
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-video]');
      if (!b) return;
      e.preventDefault();
      vid.src = b.dataset.video;
      ttl.textContent = b.dataset.title || '';
      if (dlg.showModal) dlg.showModal(); else window.open(b.dataset.video, '_blank');
      var p = vid.play(); if (p && p.catch) p.catch(function () {});
    });
    dlg.querySelector('button').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { vid.pause(); vid.removeAttribute('src'); vid.load(); });
  }
})();
