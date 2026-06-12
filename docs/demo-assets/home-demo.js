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

  /* ---- EventON-Bedienelemente: Original-Look, Klick erklärt die Grenze ---- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest(
      '.evo_filter_bar, .evo-sort, .evo_j_grid_filter, .evcal_btn_prev, .evcal_btn_next, .evo_filter_container');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    if (window.ddimDemoOverlay) {
      window.ddimDemoOverlay(
        'Terminfilter im Demonstrator nicht verfügbar',
        'Filter, Sortierung und Monatswechsel des Veranstaltungskalenders laden die Termine ' +
        'im Original per AJAX aus der WordPress-Datenbank (Plugin EventON). Der Demonstrator ' +
        'hat kein Backend, daher bleiben diese Bedienelemente hier ohne Funktion. Aktuelle ' +
        'Termine stehen auf ddim.de/veranstaltungskalender.'
      );
    }
  }, true);

  /* ---- Init ---- */
  function init() {
    renderVideo();
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
