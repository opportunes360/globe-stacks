(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var main = document.getElementById('main');

  /* ---------- Theme toggle ---------- */
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

  /* ---------- Install pop-up (Android/Chrome) ---------- */
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

  /* ---------- Service worker (offline reading) ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  /* ---------- Loading screen (installed app only): plays fully, then fades ---------- */
  var splash = document.getElementById('splash');
  if (splash && root.classList.contains('splash-on')) {
    var t0 = window.__sp0 || Date.now();
    var closed = false;
    var finish = function () {
      if (closed) return;
      closed = true;
      splash.classList.add('out');
      setTimeout(function () { root.classList.remove('splash-on'); }, 480);
    };
    var ready = function () { setTimeout(finish, Math.max(0, 2400 - (Date.now() - t0))); };
    if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
    setTimeout(finish, 7000);
  }

  /* ---------- Per-page features (run again after every page change) ---------- */
  var io = null;
  var px = [];
  var ticking = false;
  var today = '';
  try { today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Dar_es_Salaam' }).format(new Date()); } catch (e) {}

  function parallaxUpdate() {
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
  }
  window.addEventListener('scroll', function () { if (px.length && !ticking) { ticking = true; requestAnimationFrame(parallaxUpdate); } }, { passive: true });
  window.addEventListener('resize', function () { if (px.length) parallaxUpdate(); });

  function initPage() {
    /* Auto-close */
    try {
      document.querySelectorAll('[data-closes]').forEach(function (el) {
        if (today > el.getAttribute('data-closes')) {
          if (el.hasAttribute('data-status')) el.setAttribute('data-status', 'closed');
          var b = el.classList.contains('badge') ? el : el.querySelector('.badge');
          if (b && /\b(ok|soon)\b/.test(b.className)) { b.className = 'badge closed'; b.textContent = 'Closed for now'; }
        }
      });
    } catch (e) {}

    /* Days-left chips and deadline rows */
    try {
      var tday = Date.parse(today + 'T00:00:00Z');
      document.querySelectorAll('[data-days]').forEach(function (el) {
        var n = Math.round((Date.parse(el.getAttribute('data-days') + 'T00:00:00Z') - tday) / 864e5);
        if (n < 0) { el.hidden = true; var tc = el.closest('.tick-card'); if (tc) tc.hidden = true; return; }
        el.textContent = n === 0 ? 'Last day' : n === 1 ? '1 day left' : n + ' days left';
        el.classList.add(n <= 14 ? 'urgent' : n <= 45 ? 'warn' : 'calm');
      });
      document.querySelectorAll('.dl-row[data-date]').forEach(function (r) {
        var n = Math.round((Date.parse(r.getAttribute('data-date') + 'T00:00:00Z') - tday) / 864e5);
        if (n < 0) { r.hidden = true; return; }
        var L = r.querySelector('.dl-left');
        if (L) L.textContent = n === 0 ? 'Today' : n === 1 ? '1 day left' : n + ' days left';
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

    /* Reveal on scroll: what is already on screen shows at once, the rest slides in as you scroll */
    if (io) { io.disconnect(); io = null; }
    var rev = Array.prototype.slice.call(document.querySelectorAll('.reveal:not(.in)'));
    if ('IntersectionObserver' in window && !reduce) {
      var vh = window.innerHeight;
      var later = [];
      rev.forEach(function (el) {
        if (el.closest('.hero2')) { el.classList.add('in'); return; }
        if (el.getBoundingClientRect().top < vh * 0.94) { el.classList.add('no-t'); el.classList.add('in'); } else later.push(el);
      });
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          el.classList.add('in');
          io.unobserve(el);
          el.addEventListener('transitionend', function () { el.style.transitionDelay = '0s'; }, { once: true });
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
      later.forEach(function (el) { io.observe(el); });
    } else {
      rev.forEach(function (el) { el.classList.add('in'); });
    }

    /* Parallax */
    px = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
    if (px.length) parallaxUpdate();

    /* Flip cards */
    document.querySelectorAll('.flip').forEach(function (c) {
      c.addEventListener('click', function (e) { if (e.target.closest('a')) return; c.classList.toggle('flipped'); });
      c.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) { e.preventDefault(); c.classList.toggle('flipped'); }
      });
    });
  }

  /* ---------- Dock: instant highlight on touch ---------- */
  var dockLinks = Array.prototype.slice.call(document.querySelectorAll('.dock-a'));
  function setCurrent(path) {
    dockLinks.forEach(function (a) {
      var h = a.getAttribute('href');
      var on = h === '/' ? path === '/' : path.indexOf(h) === 0;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  dockLinks.forEach(function (a) {
    a.addEventListener('pointerdown', function () { a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop'); });
  });

  /* ---------- Page changes without a reload ---------- */
  var navToken = 0;
  var shownKey = location.pathname + location.search;
  var canNav = !!(main && window.fetch && window.DOMParser && history.pushState);
  function setMeta(doc) {
    document.title = doc.title;
    var nd = doc.querySelector('meta[name="description"]'), od = document.querySelector('meta[name="description"]');
    if (nd && od) od.setAttribute('content', nd.getAttribute('content'));
    var nc = doc.querySelector('link[rel="canonical"]'), oc = document.querySelector('link[rel="canonical"]');
    if (nc && oc) oc.setAttribute('href', nc.getAttribute('href'));
  }
  function go(href, push, restoreY) {
    var token = ++navToken;
    var u = new URL(href, location.href);
    setCurrent(u.pathname);
    if (!reduce) main.classList.add('leaving');
    var fetched = fetch(u.href, { headers: { accept: 'text/html' }, credentials: 'same-origin' }).then(function (r) {
      if (!r.ok || (r.headers.get('content-type') || '').indexOf('text/html') === -1) throw new Error('bad');
      return r.text();
    });
    var wait = new Promise(function (res) { setTimeout(res, reduce ? 0 : 110); });
    Promise.all([fetched, wait]).then(function (out) {
      if (token !== navToken) return;
      var doc = new DOMParser().parseFromString(out[0], 'text/html');
      var nm = doc.getElementById('main');
      if (!nm) throw new Error('nomain');
      try { history.replaceState({ y: window.scrollY }, ''); } catch (e) {}
      if (push) { try { history.pushState({ y: 0 }, '', u.href); } catch (e) { location.href = u.href; return; } }
      shownKey = u.pathname + u.search;
      setMeta(doc);
      main.innerHTML = nm.innerHTML;
      var y = restoreY || 0;
      if (u.hash && push) { var t = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (t) y = t.getBoundingClientRect().top + window.scrollY - 80; }
      window.scrollTo(0, y);
      initPage();
      main.classList.remove('leaving');
      if (!reduce) { main.classList.add('entering'); setTimeout(function () { main.classList.remove('entering'); }, 280); }
    }).catch(function () { if (token === navToken) location.href = u.href; });
  }
  if (canNav) {
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin) return;
      if (/^\/(admin|sw\.js)/.test(u.pathname) || /\.[a-z0-9]{2,5}$/i.test(u.pathname)) return;
      if (u.pathname === location.pathname && u.search === location.search) {
        if (u.hash) return;
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        return;
      }
      e.preventDefault();
      go(u.href, true);
    });
    window.addEventListener('popstate', function (e) {
      if (location.pathname + location.search === shownKey) return; /* only a #section jump on the same page */
      go(location.href, false, e.state && e.state.y);
    });

    /* Warm the next page as soon as a finger touches a link */
    var warmed = {};
    var warm = function (e) {
      var a = e.target.closest && e.target.closest('a[href^="/"]');
      if (!a || warmed[a.href] || a.target) return;
      warmed[a.href] = 1;
      try { fetch(a.href, { headers: { accept: 'text/html' }, credentials: 'same-origin' }); } catch (x) {}
    };
    document.addEventListener('touchstart', warm, { passive: true });
    document.addEventListener('mouseover', warm, { passive: true });
  }

  initPage();
})();
