(function () {
  'use strict';

  /* Theme toggle */
  var root = document.documentElement;
  var themeBtn = document.getElementById('theme');
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paintThemeButton() {
    if (themeBtn) {
      themeBtn.setAttribute('aria-checked', isDark() ? 'true' : 'false');
      themeBtn.setAttribute('title', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }
  if (themeBtn) {
    paintThemeButton();
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('gs-theme', next); } catch (e) {}
      paintThemeButton();
    });
  }

  /* Install pop-up (Android/Chrome): shows Chrome's own install box when the person taps Install */
  var deferred = null;
  var pop = document.getElementById('pwa-pop');
  var seenKey = 'gs-pwa-later';
  var recently = function () { try { var t = +localStorage.getItem(seenKey) || 0; return Date.now() - t < 6048e5; } catch (e) { return false; } };
  var hidePop = function () { if (pop) { pop.classList.remove('show'); setTimeout(function () { pop.hidden = true; }, 350); } };
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (!pop || recently()) return;
    setTimeout(function () { pop.hidden = false; void pop.offsetWidth; pop.classList.add('show'); }, 2500);
  });
  if (pop) {
    document.getElementById('pwa-yes').addEventListener('click', function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; hidePop(); });
    });
    document.getElementById('pwa-no').addEventListener('click', function () {
      try { localStorage.setItem(seenKey, String(Date.now())); } catch (e) {}
      hidePop();
    });
  }
  window.addEventListener('appinstalled', hidePop);

  /* Warm the next page the moment a finger touches a link, so it opens at once */
  var warmed = {};
  var warm = function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/"]');
    if (!a || warmed[a.href] || a.target) return;
    warmed[a.href] = 1;
    try { fetch(a.href, { credentials: 'same-origin' }); } catch (x) {}
  };
  document.addEventListener('touchstart', warm, { passive: true });
  document.addEventListener('mouseover', warm, { passive: true });

  /* Service worker (offline reading) */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  /* Auto-close: mark scholarships closed once their final deadline has passed */
  try {
    var today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Dar_es_Salaam' }).format(new Date());
    document.querySelectorAll('[data-closes]').forEach(function (el) {
      if (today > el.getAttribute('data-closes')) {
        if (el.hasAttribute('data-status')) el.setAttribute('data-status', 'closed');
        var b = el.classList.contains('badge') ? el : el.querySelector('.badge');
        if (b && /\b(ok|soon)\b/.test(b.className)) { b.className = 'badge closed'; b.textContent = 'Closed for now'; }
      }
    });
  } catch (e) {}

  /* Days-left chips */
  try {
    var tday = Date.parse(today + 'T00:00:00Z');
    document.querySelectorAll('[data-days]').forEach(function (el) {
      var n = Math.round((Date.parse(el.getAttribute('data-days') + 'T00:00:00Z') - tday) / 864e5);
      if (n < 0) { el.hidden = true; var tc = el.closest('.tick-card'); if (tc) tc.hidden = true; return; }
      el.textContent = n === 0 ? 'Last day' : n === 1 ? '1 day left' : n + ' days left';
      el.classList.add(n <= 14 ? 'urgent' : n <= 45 ? 'warn' : 'calm');
    });
  } catch (e) {}

  /* Scholarship filters */
  var form = document.getElementById('filters');
  if (form) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-item]'));
    var count = document.getElementById('count');
    var none = document.getElementById('none');
    var params = new URLSearchParams(location.search);
    if (params.get('q')) form.elements.q.value = params.get('q');

    var apply = function () {
      var q = form.elements.q.value.trim().toLowerCase();
      var country = form.elements.country.value;
      var mine = form.elements.mine ? form.elements.mine.value : '';
      var funding = form.elements.funding.value;
      var status = form.elements.status.value;
      var shown = 0;
      items.forEach(function (el) {
        var ok =
          (!q || q.split(/\s+/).every(function (w) { return el.getAttribute('data-hay').indexOf(w) !== -1; })) &&
          (!country || el.getAttribute('data-country') === country) &&
          (!mine || (function () {
            var e = el.getAttribute('data-eligible');
            if (e === '*' || e === '?') return true;
            if (mine === '__other') return false;
            return e.split('|').indexOf(mine) !== -1;
          })()) &&
          (!funding || el.getAttribute('data-funding') === funding) &&
          (!status || el.getAttribute('data-status') === status);
        el.hidden = !ok;
        if (ok) shown++;
      });
      count.textContent = shown + (shown === 1 ? ' scholarship' : ' scholarships') + ' shown';
      none.hidden = shown !== 0;
    };
    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('reset', function () { setTimeout(apply, 0); });
    apply();
  }
})();

/* App feel: loading screen, reveal on scroll, parallax, flip cards, dock */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Loading screen (only when opened as an installed app): loops until the page is ready */
  var splash = document.getElementById('splash');
  if (splash && root.classList.contains('splash-on')) {
    var started = Date.now();
    var closed = false;
    var finish = function () {
      if (closed) return;
      closed = true;
      splash.classList.add('out');
      setTimeout(function () { root.classList.remove('splash-on'); }, 480);
    };
    var ready = function () { setTimeout(finish, Math.max(0, 2000 - (Date.now() - started))); };
    if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
    setTimeout(finish, 7000);
  }

  /* Reveal on scroll */
  var rev = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        io.unobserve(el);
        el.addEventListener('transitionend', function () { el.style.transitionDelay = '0s'; }, { once: true });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else {
    rev.forEach(function (el) { el.classList.add('in'); });
  }

  /* Parallax */
  var px = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  if (px.length && !reduce) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      px.forEach(function (el) {
        var host = el.closest('[data-parallax-root]');
        if (!host) return;
        var r = host.getBoundingClientRect();
        if (r.bottom < -250 || r.top > vh + 250) return;
        var prog = r.top + r.height / 2 - vh / 2;
        el.style.transform = 'translate3d(0,' + (-prog * parseFloat(el.getAttribute('data-speed'))).toFixed(1) + 'px,0)';
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Flip cards: tap or Enter flips on touch; hover flips with a mouse (CSS) */
  document.querySelectorAll('.flip').forEach(function (c) {
    c.addEventListener('click', function (e) { if (e.target.closest('a')) return; c.classList.toggle('flipped'); });
    c.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) { e.preventDefault(); c.classList.toggle('flipped'); }
    });
  });

  /* Dock: little pop when pressed */
  document.querySelectorAll('.dock-a').forEach(function (a) {
    a.addEventListener('pointerdown', function () { a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop'); });
  });
})();
