/* Site-weites Verhalten (Rollout 12.06.2026), auf JEDER Seite eingebunden:
   - Mock-Consent-Banner (Borlabs-artig, aufgeräumt): Essenziell, Statistiken,
     Marketing, Externe Medien; Auswahl liegt in localStorage (ddim_demo_consent).
   - Consent-gated YouTube-Embed (Kongressfilm, nur Startseite).
   - EventON-Filter/-Pfeile: Original-Look, Klick erklärt die statische Grenze.
   - Header-/Footer-Ausrichtungen (Burger/X, Back-to-top, Badge, Footer-Buttons).
   - "Cookie-Einstellungen"-Link in Demo-Leiste und Socket.
   Alle Funktionen prüfen ihre Ziel-Elemente und sind auf Seiten ohne das
   jeweilige Element wirkungslos. */
(function () {
  'use strict';
  var KEY = 'ddim_demo_consent';
  var VIDEO_ID = 'zSClpVtkOtU'; // Kongressfilm, im Original statisch eingebettet

  // Pfad-Präfix zum Site-Root (Unterseiten liegen 1-3 Ebenen tief), abgeleitet
  // aus dem eigenen <script src="...demo-assets/site-demo.js">
  var ROOT = (function () {
    var s = document.querySelector('script[src*="site-demo.js"]');
    if (!s) return '';
    var src = s.getAttribute('src') || '';
    var i = src.indexOf('demo-assets/');
    return i > 0 ? src.slice(0, i) : '';
  })();

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
    [[ROOT + 'datenschutz/', 'Datenschutzerklärung'], [ROOT + 'impressum/', 'Impressum']].forEach(function (l) {
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

  /* Statische Kalender-Hinweis-Box (von demo.js eingefügt) NUR auf der
     Startseite entfernen - dort lebt der Hinweis im Popup an den Buttons.
     Auf der Kalender-Unterseite bleibt die Box (einzige Erklärung der leeren
     Liste). Startseiten-Erkennung: Magazin-Block existiert nur dort. */
  function removeStaticCalendarNote() {
    if (!document.getElementById('avia-magazine-1')) return;
    document.querySelectorAll('.ddim-demo-embed').forEach(function (el) {
      if (el.id !== 'ddim-video-gate' && /Veranstaltungskalender/.test(el.textContent)) el.remove();
    });
  }

  /* ---- Ausrichtungen, die CSS allein nicht messbar löst ---- */

  /* Themen-Block oben bündig mit der Sidebar; danach rückt die Sidebar so weit
     nach unten, dass die Oberkante der blauen Kacheln exakt auf der Linie
     unter "Unsere aktuellen Themen" liegt (Suats Review, Desktop) */
  function alignMagazine() {
    var mag = document.getElementById('avia-magazine-1');
    var side = document.getElementById('avia_partner_widget-3');
    var inner = document.querySelector('.sidebar .inner_sidebar');
    if (!mag || !side) return;
    mag.style.marginTop = '0px';
    if (inner) inner.style.marginTop = '0px';
    if (window.innerWidth < 990) return;
    var diff = mag.getBoundingClientRect().top - side.getBoundingClientRect().top;
    if (diff > 2) mag.style.marginTop = (-diff) + 'px';
    var bar = mag.querySelector('.av-magazine-top-bar') ||
              mag.querySelector('.av-magazine-top-heading');
    if (bar && inner) {
      var d2 = bar.getBoundingClientRect().bottom - side.getBoundingClientRect().top;
      if (d2 > 2) inner.style.marginTop = Math.round(d2) + 'px';
    }
    // News-Band: Unterkante bündig mit dem letzten Reporter-Button rechts
    var el30 = document.querySelector('.avia-builder-el-30');
    var band = el30 ? (el30.closest('.flex_column.av_one_full') || el30) : null;
    var btns = document.querySelectorAll('.sidebar .avia-button');
    var lastBtn = btns.length ? btns[btns.length - 1] : null;
    if (band && lastBtn) {
      band.style.marginTop = '0px';
      // beide Richtungen: Band-Unterkante exakt auf Button-Unterkante
      var d3 = lastBtn.getBoundingClientRect().bottom - band.getBoundingClientRect().bottom;
      if (Math.abs(d3) > 2) band.style.marginTop = Math.round(d3) + 'px';
    }
    // Restabstand zum Footer kompensieren (negative Margins lassen sonst Luft)
    var footer = document.getElementById('footer');
    var main = document.getElementById('main');
    if (footer && main) {
      main.style.marginBottom = '0px';
      var widgets = document.querySelectorAll('.sidebar .widget');
      var lastW = widgets.length ? widgets[widgets.length - 1] : null;
      var contentBottom = Math.max(
        band ? band.getBoundingClientRect().bottom : 0,
        lastW ? lastW.getBoundingClientRect().bottom : 0
      );
      var gap = footer.getBoundingClientRect().top - contentBottom;
      if (gap > 100) main.style.marginBottom = (-(Math.round(gap) - 100)) + 'px';
    }
  }

  /* Back-to-top: gleiche Größe wie der Burger, rechts bündig darunter;
     reCAPTCHA-Badge auf gleicher Grundlinie */
  function alignBottomControls() {
    var burger = document.querySelector('.av-burger-menu-main .av-hamburger') ||
                 document.querySelector('.av-burger-menu-main > a');
    var btt = document.getElementById('scroll-top-link');
    if (!burger || !btt) return;
    var r = burger.getBoundingClientRect();
    if (r.width === 0) {
      // Burger nicht sichtbar (Desktop-Textmenü): alle dynamischen Werte
      // zurücksetzen, sonst bleiben beim Resize Mobile-Werte hängen
      var rt = document.documentElement;
      rt.style.removeProperty('--ddim-burger-left');
      rt.style.removeProperty('--ddim-burger-top');
      ['right', 'width', 'height', 'line-height'].forEach(function (prop) {
        btt.style.removeProperty(prop);
      });
      return;
    }
    // Exakte Burger-Position als CSS-Variablen. WICHTIG: left-basiert verankern
    // und clientWidth (ohne Scrollbar) rechnen - beim Öffnen des Menüs fällt die
    // Body-Scrollbar weg, right-basierte Werte würden dann nach links glitchen.
    var root = document.documentElement;
    var cw = root.clientWidth;
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    root.style.setProperty('--ddim-burger-left', Math.round(cx - 23) + 'px');
    root.style.setProperty('--ddim-burger-top', Math.max(4, Math.round(cy - 23)) + 'px');
    var right = Math.round(cw - r.right);
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

  /* Enfold schreibt beim Desktop-Scrollen Inline-Höhen in die Header-Elemente
     und räumt sie beim Breakpoint-Wechsel nicht auf (zu schmales Headerband
     bis zum Refresh). Beim Wechsel Desktop<->Mobil: Inline-Styles löschen und
     den Scroll-Zustand neu berechnen lassen. */
  var lastMobileState = null;
  function clearThemeHeaderStyles() {
    var isMobile = document.documentElement.clientWidth <= 989;
    if (lastMobileState === null) { lastMobileState = isMobile; return; }
    if (isMobile === lastMobileState) return;
    lastMobileState = isMobile;
    ['#header', '#header_main', '#header_main .container', '.av-logo-container',
     '#header .logo', '#header .logo a', '#header .logo img', '#header .main_menu']
      .forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) { el.removeAttribute('style'); });
      });
    window.dispatchEvent(new Event('scroll'));
  }

  /* Mobiler Header ist fixiert: Inhalt um die echte Headerhöhe nachrücken */
  function padForFixedHeader() {
    var header = document.getElementById('header');
    var main = document.getElementById('main');
    if (!header || !main) return;
    if (document.documentElement.clientWidth <= 989) {
      main.style.setProperty('padding-top', header.offsetHeight + 'px', 'important');
    } else {
      main.style.removeProperty('padding-top');
    }
  }

  /* Back-to-top: schnellere Scroll-Animation (400ms ease-out) statt des
     trägen Theme-Defaults */
  function fastScrollTop() {
    var btt = document.getElementById('scroll-top-link');
    if (!btt) return;
    btt.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var start = window.pageYOffset;
      var t0 = performance.now();
      var dur = 400;
      function step(t) {
        var p = Math.min(1, (t - t0) / dur);
        var ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
        window.scrollTo(0, Math.round(start * (1 - ease)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, true);
  }

  /* Mobile Text-Labels für die Sidebar-Bildkacheln (Bildtext skaliert sonst mit) */
  function labelPartnerTiles() {
    var map = [['managerportal', 'Interim Manager DDIM suchen'], ['mitglied-werden', 'Mitglied werden']];
    document.querySelectorAll('.sidebar .avia_partner_widget a').forEach(function (a) {
      if (a.querySelector('.ddim-tile-label')) return;
      var label = '';
      map.forEach(function (m) { if (a.href.indexOf(m[0]) !== -1) label = m[1]; });
      if (!label) return;
      var s = document.createElement('span');
      s.className = 'ddim-tile-label';
      s.textContent = label;
      a.appendChild(s);
    });
  }

  /* reCAPTCHA-Badge nur im Footer-Bereich zeigen (weiches Ein-/Ausblenden) */
  function badgeOnFooter() {
    var footer = document.getElementById('footer') || document.getElementById('socket');
    if (!footer || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        document.body.classList.toggle('ddim-footer-inview', e.isIntersecting);
      });
    }, { threshold: 0 });
    io.observe(footer);
  }

  /* Footer-Buttons hochschieben, bis die Unterkante des unteren Buttons
     bündig mit der Unterkante der Social-Icons ist (Desktop) */
  function alignFooterButtons() {
    var box = document.getElementById('ddim-footer-buttons');
    var social = document.querySelector('.wpsw-social-links');
    if (!box || !social) return;
    box.style.marginTop = '0px';
    if (document.documentElement.clientWidth < 990) return;
    var diff = box.getBoundingClientRect().bottom - social.getBoundingClientRect().bottom;
    if (Math.abs(diff) > 2) box.style.marginTop = (-Math.round(diff)) + 'px';
  }


  /* Footer-Grau exakt so weit vergrößern, dass am Seitenende kein weißer
     Streifen unter dem (durchscheinenden) Sticky-Header bleibt */
  function padFooterToViewport() {
    var footer = document.getElementById('footer');
    if (!footer) return;
    footer.style.removeProperty('padding-top');
    if (document.documentElement.clientWidth < 990) return;
    var socket = document.getElementById('socket');
    var total = footer.offsetHeight + (socket ? socket.offsetHeight : 0);
    var headerH = 64; // geschrumpfter Sticky-Header
    var need = Math.round(window.innerHeight - headerH - total);
    if (need > 0) {
      var base = parseFloat(getComputedStyle(footer).paddingTop) || 0;
      footer.style.setProperty('padding-top', (base + need) + 'px', 'important');
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
    labelPartnerTiles();
    badgeOnFooter();
    fastScrollTop();
    padForFixedHeader();
    alignMagazine();
    alignFooterButtons();
    alignBottomControls();
    lastMobileState = document.documentElement.clientWidth <= 989;
    function realignAll() {
      padForFixedHeader();
      alignMagazine();
      alignFooterButtons();
      alignBottomControls();
    }
    // Enfolds Shrink-Logik cached die Headerhoehen einmalig beim Seitenstart
    // und liefert nach einem Breakpoint-Wechsel dauerhaft falsche Werte
    // (Theme-Bug, von aussen nicht heilbar). Deterministische Loesung: beim
    // Ueberqueren der 990px-Grenze einmal sauber neu laden (entprellt,
    // Scrollposition bleibt nativ erhalten).
    var wasMobileBp = document.documentElement.clientWidth <= 989;
    var bpReloadTimer = null;
    window.addEventListener('resize', function () {
      var nowMobile = document.documentElement.clientWidth <= 989;
      if (nowMobile !== wasMobileBp) {
        wasMobileBp = nowMobile;
        clearTimeout(bpReloadTimer);
        bpReloadTimer = setTimeout(function () {
          // im gescrollten Zustand neu laden wuerde Enfold die kompakten
          // Headermasse als Basis cachen -> immer oben neu starten
          if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
          window.scrollTo(0, 0);
          location.reload();
        }, 350);
        return;
      }
      realignAll();
      [150, 500].forEach(function (t) { setTimeout(realignAll, t); });
    });
    // Robusteste Absicherung: jede Hoehenaenderung des Headers (egal wodurch)
    // fuehrt das Padding sofort nach
    if ('ResizeObserver' in window) {
      var hdrEl = document.getElementById('header');
      if (hdrEl) {
        var roPending = false;
        new ResizeObserver(function () {
          if (roPending) return;
          roPending = true;
          requestAnimationFrame(function () {
            roPending = false;
            padForFixedHeader();
            alignBottomControls();
          });
        }).observe(hdrEl);
      }
    }
    window.addEventListener('load', function () {
      padForFixedHeader();
      alignMagazine();
      alignFooterButtons();
      alignBottomControls();
      // Spaet-Layout (Fonts/Bilder) abwarten und final nachmessen
      setTimeout(function () {
        padForFixedHeader();
        alignMagazine();
        alignFooterButtons();
        alignBottomControls();
        padFooterToViewport();
      }, 450);
    });
    // Beim Scrollen schrumpft der Header (header-scrolled): Burger-Position
    // laufend nachführen, damit X und Back-to-top vertikal stimmen
    var alignPending = false;
    window.addEventListener('scroll', function () {
      if (alignPending) return;
      alignPending = true;
      requestAnimationFrame(function () {
        alignPending = false;
        alignBottomControls();
      });
    }, { passive: true });
    // Unmittelbar vor dem Menü-Öffnen die exakte Ist-Position übernehmen
    document.addEventListener('mousedown', function (e) {
      if (e.target.closest && e.target.closest('.av-burger-menu-main')) alignBottomControls();
    }, true);
    document.addEventListener('touchstart', function (e) {
      if (e.target.closest && e.target.closest('.av-burger-menu-main')) alignBottomControls();
    }, { capture: true, passive: true });
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
