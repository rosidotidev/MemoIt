/* MemoIt mockup runtime: theme (accent + scheme), icons, nav shell, sample data.
   Theme is persisted in localStorage and re-applied on every screen before first paint. */
(function () {
  'use strict';

  /* ---------- theme ---------- */
  var KEY = 'memoit.theme';
  var ACCENTS = [
    { id: 'indigo',   name: 'Indigo',   hue: 275, c: 0.16 },
    { id: 'blue',     name: 'Blue',     hue: 245, c: 0.15 },
    { id: 'teal',     name: 'Teal',     hue: 195, c: 0.11 },
    { id: 'green',    name: 'Green',    hue: 150, c: 0.14 },
    { id: 'amber',    name: 'Amber',    hue: 80,  c: 0.14 },
    { id: 'orange',   name: 'Orange',   hue: 45,  c: 0.17 },
    { id: 'rose',     name: 'Rose',     hue: 8,   c: 0.18 },
    { id: 'purple',   name: 'Purple',   hue: 315, c: 0.17 },
    { id: 'graphite', name: 'Graphite', hue: 260, c: 0.025 }
  ];
  var DEFAULT = { accent: 'indigo', hue: 275, c: 0.16, scheme: 'system', lang: 'en' };
  var theme = load();
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function load() {
    try { return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return Object.assign({}, DEFAULT); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(theme)); } catch (e) {} }
  function apply() {
    var r = document.documentElement;
    r.style.setProperty('--hue', theme.hue);
    r.style.setProperty('--c', theme.c);
    var dark = theme.scheme === 'dark' || (theme.scheme === 'system' && mq && mq.matches);
    r.setAttribute('data-scheme', dark ? 'dark' : 'light');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', getComputedStyle(r).getPropertyValue('--surface') || '#fff');
  }
  apply();
  if (mq && mq.addEventListener) mq.addEventListener('change', apply);

  /* ---------- icons (Material, inline so mockups work offline) ---------- */
  var P = {
    folder: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    tune: 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z',
    chart: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    sort: 'M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z',
    del: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    chev: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    flag: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
    sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM2 13h2v-2H2v2zm18 0h2v-2h-2v2zM11 2v2h2V2h-2zm0 18v2h2v-2h-2zM5.99 4.58L4.58 5.99l1.41 1.41 1.41-1.41-1.41-1.41zm12.37 12.02l-1.41 1.41 1.41 1.41 1.41-1.41-1.41-1.41zm1.41-10.6l-1.41-1.41-1.41 1.41 1.41 1.41 1.41-1.41zM7.4 18.01l-1.41-1.41-1.41 1.41 1.41 1.41 1.41-1.41z',
    moon: 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-5.4-5.4c0-1.81.89-3.42 2.26-4.4A9.2 9.2 0 0 0 12 3z',
    auto: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18V4a8 8 0 0 1 0 16z',
    logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
    palette: 'M12 3a9 9 0 0 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.7-.5-1.2 0-1.1.9-2 2-2h2.4c2.8 0 5-2.2 5-5 0-4.4-4.5-7.5-10.4-7.5z',
    lang: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
    bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z'
  };
  function icon(n, cls) {
    return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + P[n] + '"/></svg>';
  }

  /* ---------- sample data (same on every screen) ---------- */
  var CATEGORIES = [
    { id: 'grocery', name: 'Grocery list', open: 6, total: 8, state: 'Done',   initial: 'G', next: 'Today · 18:00', late: true },
    { id: 'books',   name: 'Books to buy', open: 3, total: 4, state: 'Bought', initial: 'B', next: 'Fri' },
    { id: 'car',     name: 'Car & home',   open: 3, total: 3, state: 'Done',   initial: 'C', next: 'Mon · 09:00', late: true },
    { id: 'weight',  name: 'Weight',       open: 0, total: 2, state: 'Done',   initial: 'W', reportable: true },
    { id: 'reading', name: 'Reading list', open: 2, total: 3, state: 'Read',   initial: 'R' }
  ];
  var DUE_SOON = [
    { t: 'Birthday candles',      cat: 'grocery', cn: 'Grocery list', when: 'Today · 18:00', late: true, p: 'H' },
    { t: 'Renew car insurance',   cat: 'car',     cn: 'Car & home',   when: 'Mon · 09:00',   late: true, p: 'H' },
    { t: 'Designing Data-Intensive Applications', cat: 'books', cn: 'Books to buy', when: 'Fri', p: 'H' },
    { t: 'Winter tyres',          cat: 'car',     cn: 'Car & home',   when: '30 Nov', p: 'M' }
  ];

  /* ---------- nav shell ---------- */
  var DESTS = [
    { id: 'categories', label: 'Categories', href: 'categories.html', icon: 'folder' },
    { id: 'report',     label: 'Report',     href: 'report.html',     icon: 'chart' },
    { id: 'settings',   label: 'Settings',   href: 'settings.html',   icon: 'tune' }
  ];
  function destHTML(d, cur) {
    return '<a class="dest" href="' + d.href + '"' + (d.id === cur ? ' aria-current="page"' : '') + '>' +
      '<span class="dest__pill">' + icon(d.icon) + '</span><span class="label-md">' + d.label + '</span></a>';
  }
  function renderNav() {
    var cur = document.body.getAttribute('data-nav');
    var rail = document.getElementById('rail');
    var bar = document.getElementById('navbar');
    if (rail) {
      rail.className = 'rail';
      rail.setAttribute('aria-label', 'Primary');
      rail.innerHTML = '<div class="drawer__brand"><div class="brand-mark">M</div><div class="brand-name title-lg">MemoIt</div></div>' +
        DESTS.map(function (d) { return destHTML(d, cur); }).join('') +
        '<span class="rail__spacer"></span>' +
        '<a class="dest dest--out" href="login.html?out=1"><span class="dest__pill">' + icon('logout') + '</span><span class="label-md">Sign out</span></a>';
    }
    if (bar) {
      bar.className = 'navbar';
      bar.setAttribute('aria-label', 'Primary');
      bar.innerHTML = DESTS.map(function (d) { return destHTML(d, cur); }).join('');
    }
  }

  /* ---------- account menu (on every screen that has a top app bar) ---------- */
  var USER = { name: 'Bob', email: 'bob@example.com' };
  function renderAccount() {
    var rows = document.querySelectorAll('.appbar__row');
    if (!rows.length) return;
    var menu = document.createElement('div');
    menu.className = 'menu'; menu.id = 'acct-menu'; menu.hidden = true; menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<div class="menu__head"><span class="avatar avatar--round">' + USER.name.charAt(0) + '</span>' +
      '<span><b class="title-md" style="display:block">' + USER.name + '</b><span class="row__sub">' + USER.email + '</span></span></div>' +
      '<hr class="divider" style="margin:4px 0">' +
      '<a class="menu__item" role="menuitem" href="settings.html">' + icon('tune') + 'Settings</a>' +
      '<a class="menu__item menu__item--out" role="menuitem" href="login.html?out=1">' + icon('logout') + 'Sign out</a>';
    document.body.appendChild(menu);

    var current = null;
    function close(refocus) {
      menu.hidden = true;
      if (current) { current.setAttribute('aria-expanded', 'false'); if (refocus) current.focus(); }
      current = null;
    }
    rows.forEach(function (row) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'acct'; b.textContent = USER.name.charAt(0);
      b.setAttribute('aria-label', 'Account menu'); b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (current === b) { close(false); return; }
        close(false);
        var r = b.getBoundingClientRect();
        menu.style.top = (r.bottom + 6) + 'px';
        menu.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
        menu.hidden = false; current = b; b.setAttribute('aria-expanded', 'true');
        menu.querySelector('.menu__item').focus();
      });
      row.appendChild(b);
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) close(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) close(true); });
    window.addEventListener('resize', function () { close(false); });
  }

  /* ---------- helpers ---------- */
  var snackTimer;
  function snack(msg, actionLabel, onAction) {
    var s = document.getElementById('snackbar');
    if (!s) return;
    s.innerHTML = '<span></span>' + (actionLabel ? '<button type="button">' + actionLabel + '</button>' : '');
    s.firstChild.textContent = msg;
    var b = s.querySelector('button');
    if (b) b.onclick = function () { s.classList.remove('show'); if (onAction) onAction(); };
    s.classList.add('show');
    clearTimeout(snackTimer);
    snackTimer = setTimeout(function () { s.classList.remove('show'); }, 5000);
  }
  function openDialog(id) { var d = document.getElementById(id); if (d && d.showModal) d.showModal(); }
  function closeDialog(el) { var d = el.closest('dialog'); if (d) d.close(); }

  window.MemoIt = {
    ACCENTS: ACCENTS, CATEGORIES: CATEGORIES, DUE_SOON: DUE_SOON, icon: icon, snack: snack, openDialog: openDialog, closeDialog: closeDialog,
    get theme() { return theme; },
    setTheme: function (patch) { Object.assign(theme, patch); save(); apply(); },
    categoryRows: function (activeId) {
      return CATEGORIES.map(function (c) {
        return '<li><a class="row row--link" href="items.html?c=' + c.id + '"' + (c.id === activeId ? ' aria-current="true"' : '') + '>' +
          '<span class="avatar">' + c.initial + '</span>' +
          '<span class="row__body"><span class="row__title title-md">' + c.name + '</span><br>' +
          '<span class="row__sub">' + (c.open ? c.open + ' open' : 'All ' + c.state.toLowerCase()) + (c.reportable ? ' · Report' : '') + '</span></span>' +
          '<span class="row__trail">' + (c.open ? '<span class="badge">' + c.open + '</span>' : '') + icon('chev') + '</span></a></li>';
      }).join('');
    }
  };

  document.addEventListener('DOMContentLoaded', function () { renderNav(); renderAccount(); apply(); });
})();
