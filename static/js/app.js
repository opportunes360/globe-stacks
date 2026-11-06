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
    if (themeBtn) themeBtn.textContent = isDark() ? 'Light mode' : 'Dark mode';
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

  /* Install button (shows only when the browser says the app can be installed) */
  var deferred = null;
  var installBtn = document.getElementById('install');
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn) {
    installBtn.addEventListener('click', function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () {
        deferred = null;
        installBtn.hidden = true;
      });
    });
  }
  window.addEventListener('appinstalled', function () {
    if (installBtn) installBtn.hidden = true;
  });

  /* Service worker (offline reading) */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

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
      var funding = form.elements.funding.value;
      var status = form.elements.status.value;
      var shown = 0;
      items.forEach(function (el) {
        var ok =
          (!q || q.split(/\s+/).every(function (w) { return el.getAttribute('data-hay').indexOf(w) !== -1; })) &&
          (!country || el.getAttribute('data-country') === country) &&
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
