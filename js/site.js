// Mobile menu, video player and approach sliders. No dependencies.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // Video player: only opens when someone presses a "Watch demo" button.
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

  // Hero illustration: pause the moving dots for reduced motion.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('svg.hero-art').forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });
  }

  // Sliders: auto-advance while visible, pause on hover or focus.
  document.querySelectorAll('.slider').forEach(function (root) {
    var track = root.querySelector('.track');
    var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
    var tabs = root.querySelectorAll('.steps-nav button');
    var bar = root.querySelector('.progress span');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var DELAY = +(root.dataset.delay || 6500), idx = 0, timer = null, visible = false, paused = false;

    function setActive(i) {
      if (i === idx && slides[i].classList.contains('on')) return;
      idx = i;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      tabs.forEach(function (t, k) { if (k === i) t.setAttribute('aria-current', 'step'); else t.removeAttribute('aria-current'); });
    }
    function go(i) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
      setActive(i);
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (bar) { bar.style.transition = 'none'; bar.style.width = '0'; }
      if (reduced || !visible || paused) return;
      if (bar) { void bar.offsetWidth; bar.style.transition = 'width ' + DELAY + 'ms linear'; bar.style.width = '100%'; }
      timer = setTimeout(function () { go(idx + 1); }, DELAY);
    }
    var st;
    track.addEventListener('scroll', function () {
      clearTimeout(st);
      st = setTimeout(function () {
        var x = track.scrollLeft, best = 0, d = Infinity;
        slides.forEach(function (s, k) { var dd = Math.abs(s.offsetLeft - slides[0].offsetLeft - x); if (dd < d) { d = dd; best = k; } });
        if (best !== idx) { setActive(best); restart(); }
      }, 90);
    });
    tabs.forEach(function (t) { t.addEventListener('click', function () { go(+t.dataset.go); }); });
    root.querySelectorAll('.slide-ctrl .nav-btn').forEach(function (b) {
      b.addEventListener('click', function () { go(idx + (+b.dataset.dir)); });
    });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    });
    root.addEventListener('pointerenter', function () { paused = true; restart(); });
    root.addEventListener('pointerleave', function () { paused = false; restart(); });
    root.addEventListener('focusin', function () { paused = true; restart(); });
    root.addEventListener('focusout', function () { paused = false; restart(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; restart(); }, { threshold: 0.35 }).observe(root);
    }
  });
})();
