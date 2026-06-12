/* Startseiten-Verhalten (Review-Stand 12.06.2026), nur in index.html eingebunden:
   - Mock-Consent-Banner (Borlabs-artig, aufgeräumt): Essenziell, Statistiken,
     Marketing, Externe Medien; Auswahl liegt in localStorage (ddim_demo_consent).
   - Consent-gated YouTube-Embed (Kongressfilm) in voller Inhaltsbreite.
   - EventON-Filter/-Pfeile: Original-Look, Klick erklärt die statische Grenze.
   - "Cookie-Einstellungen"-Link in der Demo-Leiste zum erneuten Öffnen. */
(function () {
  'use strict';
  var KEY = 'ddim_demo_consent';
  var VIDEO_ID = 'zSClpVtkOtU'; // Kongressfilm, im Original statisch eingebettet

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  function saveConsent(c) {
    localStorage.setItem(KEY, JSON.stringify(c));
    renderVideo();
  }

  /* ---- Mock-Consent-Banner ---- */
  var CATS = [
    { id: 'essential', label: 'Essenziell', locked: true },
    { id: 'statistics', label: 'Statistiken' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'external', label: 'Externe Medien' }
  ];

  function openBanner() {
    closeBanner();
    var c = getConsent() || { essential: true };
    var ov = document.createElement('div');
    ov.id = 'ddim-consent-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Datenschutzeinstellungen');
    var box = document.createElement('div');
    box.className = 'ddim-consent-box';
    box.innerHTML =
      '<h2>Datenschutzeinstellungen</h2>' +
      '<p>Wir nutzen Cookies und externe Dienste. Einige sind essenziell, andere helfen uns, ' +
      'diese Website und Ihre Erfahrung zu verbessern. Sie können Ihre Auswahl jederzeit ' +
      'über die Cookie-Einstellungen widerrufen oder anpassen. <em>(Demonstrator: Die Auswahl ' +
      'wird nur lokal in Ihrem Browser gespeichert, es werden keine Daten übertragen.)</em></p>' +
      '<div class="ddim-consent-options"></div>' +
      '<div class="ddim-consent-actions">' +
      '<button type="button" class="ddim-c-all">Alle akzeptieren</button>' +
      '<button type="button" class="ddim-c-save">Auswahl speichern</button>' +
      '<button type="button" class="ddim-c-essential">Nur essenzielle Cookies akzeptieren</button>' +
      '</div>' +
      '<p class="ddim-consent-links"></p>';
    var opts = box.querySelector('.ddim-consent-options');
    CATS.forEach(function (cat) {
      var label = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.cat = cat.id;
      cb.checked = cat.locked || !!c[cat.id];
      cb.disabled = !!cat.locked;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(cat.label));
      opts.appendChild(label);
    });
    var links = box.querySelector('.ddim-consent-links');
    [['datenschutz/', 'Datenschutzerklärung'], ['impressum/', 'Impressum']].forEach(function (l) {
      var a = document.createElement('a');
      a.href = l[0];
      a.textContent = l[1];
      links.appendChild(a);
    });
    function collect(all, none) {
      var c2 = {};
      CATS.forEach(function (cat) {
        var cb = opts.querySelector('input[data-cat="' + cat.id + '"]');
        c2[cat.id] = cat.locked ? true : (all ? true : (none ? false : cb.checked));
      });
      saveConsent(c2);
      closeBanner();
    }
    box.querySelector('.ddim-c-all').onclick = function () { collect(true, false); };
    box.querySelector('.ddim-c-save').onclick = function () { collect(false, false); };
    box.querySelector('.ddim-c-essential').onclick = function () { collect(false, true); };
    ov.appendChild(box);
    document.body.appendChild(ov);
  }
  function closeBanner() {
    var old = document.getElementById('ddim-consent-overlay');
    if (old) old.remove();
  }

  /* ---- Consent-gated Video ---- */
  function renderVideo() {
    var gate = document.getElementById('ddim-video-gate');
    if (!gate) return;
    var c = getConsent();
    if (c && c.external) {
      gate.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + VIDEO_ID +
        '?rel=0" title="Der offizielle Kongressfilm zum DDIM.kongress" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy"></iframe>';
    } else {
      gate.innerHTML = '<div class="ddim-video-placeholder">' +
        '<p><strong>Der offizielle Kongressfilm zum DDIM.kongress</strong></p>' +
        '<p>Dieses Video wird von YouTube geladen. Mit dem Abspielen akzeptieren Sie ' +
        'die Kategorie "Externe Medien" der Datenschutzeinstellungen.</p>' +
        '<button type="button">Externe Medien akzeptieren und Video laden</button>' +
        '</div>';
      gate.querySelector('button').onclick = function () {
        var c2 = getConsent() || { essential: true };
        c2.external = true;
        saveConsent(c2);
      };
    }
  }

  /* ---- EventON-Bedienelemente: Original-Look; Hover/Klick zeigt halb-
     transparentes Popup direkt an den Buttons (statt statischer Hinweis-Box) ---- */
  var TIP_HTML = '<strong>Hinweis:</strong> Filter und Sortierung laden die Termine ' +
    'im Original per AJAX aus der WordPress-Datenbank (Plugin EventON). Ohne Server-' +
    'Anbindung bleiben sie hier ohne Funktion. Aktuelle Termine: ' +
    '<a href="https://ddim.de/veranstaltungskalender/" target="_blank" rel="noopener">ddim.de/veranstaltungskalender</a>';
  var tipTimer = null;

  function showTip(host) {
    var bar = host.closest('.evo_cal_above') || host.parentNode;
    if (!bar) return;
    var tip = bar.querySelector('.ddim-evo-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'ddim-evo-tip';
      tip.innerHTML = TIP_HTML;
      bar.appendChild(tip);
    }
    clearTimeout(tipTimer);
    tip.style.display = 'block';
  }
  function hideTipSoon() {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () {
      document.querySelectorAll('.ddim-evo-tip').forEach(function (t) { t.style.display = 'none'; });
    }, 350);
  }
  function bindTips() {
    document.querySelectorAll('.evo-filter-btn, .evo-sort-btn').forEach(function (btn) {
      btn.addEventListener('mouseenter', function () { showTip(btn); });
      btn.addEventListener('mouseleave', hideTipSoon);
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showTip(btn);
      }, true);
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.evo-filter-btn, .evo-sort-btn, .ddim-evo-tip')) hideTipSoon();
    });
  }

  /* Statische Kalender-Hinweis-Box (von demo.js eingefügt) auf der Startseite
     entfernen - der Hinweis lebt jetzt im Popup an den Buttons. */
  function removeStaticCalendarNote() {
    document.querySelectorAll('.ddim-demo-embed').forEach(function (el) {
      if (el.id !== 'ddim-video-gate' && /Veranstaltungskalender/.test(el.textContent)) el.remove();
    });
  }

  /* ---- Ausrichtungen, die CSS allein nicht messbar löst ---- */

  /* Themen-Block oben bündig mit der ersten Sidebar-Kachel (breitenunabhängig) */
  function alignMagazine() {
    var mag = document.getElementById('avia-magazine-1');
    var side = document.getElementById('avia_partner_widget-3');
    if (!mag || !side) return;
    mag.style.marginTop = '0px';
    if (window.innerWidth < 990) return;
    var diff = mag.getBoundingClientRect().top - side.getBoundingClientRect().top;
    if (diff > 2) mag.style.marginTop = (-diff) + 'px';
  }

  /* Back-to-top: gleiche Größe wie der Burger, rechts bündig darunter;
     reCAPTCHA-Badge auf gleicher Grundlinie */
  function alignBottomControls() {
    var burger = document.querySelector('.av-burger-menu-main .av-hamburger') ||
                 document.querySelector('.av-burger-menu-main > a');
    var btt = document.getElementById('scroll-top-link');
    if (!burger || !btt) return;
    var r = burger.getBoundingClientRect();
    if (r.width === 0) return; // Burger nicht sichtbar (Desktop-Textmenü)
    // Exakte Burger-Position als CSS-Variablen: das Menü-X bleibt beim Öffnen
    // an Ort und Stelle (Quadrat zentriert um die Icon-Mitte)
    var root = document.documentElement;
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    root.style.setProperty('--ddim-burger-right', Math.round(window.innerWidth - cx - 23) + 'px');
    root.style.setProperty('--ddim-burger-top', Math.max(4, Math.round(cy - 23)) + 'px');
    var right = Math.round(window.innerWidth - r.right);
    var size = Math.max(44, Math.round(r.width));
    btt.style.setProperty('right', right + 'px', 'important');
    btt.style.setProperty('width', size + 'px', 'important');
    btt.style.setProperty('height', size + 'px', 'important');
    btt.style.setProperty('line-height', size + 'px', 'important');
    var badge = document.querySelector('.grecaptcha-badge');
    if (badge) {
      var bttBottom = parseInt(getComputedStyle(btt).bottom, 10) || 50;
      badge.style.setProperty('bottom', bttBottom + 'px', 'important');
    }
  }

  /* Socket: Link "Cookie-Einstellungen" neben Impressum/Datenschutzerklärung */
  function addSocketConsentLink() {
    var privacyLi = document.querySelector('#socket .menu-item-privacy-policy') ||
                    document.querySelector('.menu-item-privacy-policy');
    if (!privacyLi || !privacyLi.parentNode) return;
    var li = privacyLi.cloneNode(false);
    li.id = 'menu-item-ddim-cookie';
    var a = document.createElement('a');
    a.href = '#';
    a.innerHTML = '<span class="avia-menu-text">Cookie-Einstellungen</span>';
    a.onclick = function (ev) { ev.preventDefault(); openBanner(); };
    li.appendChild(a);
    privacyLi.parentNode.appendChild(li);
  }

  /* ---- Init ---- */
  function init() {
    renderVideo();
    removeStaticCalendarNote();
    bindTips();
    addSocketConsentLink();
    alignMagazine();
    alignBottomControls();
    window.addEventListener('resize', function () {
      alignMagazine();
      alignBottomControls();
    });
    window.addEventListener('load', function () {
      alignMagazine();
      alignBottomControls();
    });
    var bar = document.getElementById('ddim-demo-bar');
    if (bar) {
      var a = document.createElement('a');
      a.href = '#';
      a.textContent = 'Cookie-Einstellungen';
      a.onclick = function (ev) { ev.preventDefault(); openBanner(); };
      bar.insertBefore(a, bar.querySelector('button'));
    }
    // #noconsent unterdrückt den Banner (für Screenshots/QA)
    if (!getConsent() && !/[?&#]noconsent/.test(location.href)) {
      setTimeout(openBanner, 700);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
