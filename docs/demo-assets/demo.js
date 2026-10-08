/* Demonstrator-Verhalten:
   - Faengt Formular-Absendungen ab (Suche, Newsletter usw.): serverseitige
     Funktionen existieren in einer statischen Kopie nicht.
   - Zeigt stattdessen ein erklaerendes Overlay mit Verweis auf die Hinweise-Seite.
*/
(function () {
  'use strict';

  function prefix() {
    // Tiefe der aktuellen Seite relativ zum Site-Root bestimmen
    var el = document.getElementById('ddim-demo-bar');
    if (!el) return '';
    var a = el.querySelector('a');
    if (!a) return '';
    var href = a.getAttribute('href') || '';
    return href.replace(/hinweise-demonstrator\/?$/, '');
  }

  function showOverlay(title, text) {
    var old = document.getElementById('ddim-demo-overlay');
    if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = 'ddim-demo-overlay';
    var box = document.createElement('div');
    box.className = 'box';
    var h = document.createElement('h2');
    h.textContent = title;
    var p = document.createElement('p');
    p.textContent = text;
    var link = document.createElement('p');
    var aEl = document.createElement('a');
    aEl.href = prefix() + 'hinweise-demonstrator/';
    aEl.textContent = 'Alle Hinweise zum Demonstrator';
    link.appendChild(aEl);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Verstanden';
    btn.onclick = function () { ov.remove(); };
    box.appendChild(h); box.appendChild(p); box.appendChild(link); box.appendChild(btn);
    ov.appendChild(box);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  // Overlay auch für seitenspezifische Skripte nutzbar machen (z. B. home-demo.js)
  window.ddimDemoOverlay = showOverlay;

  // Alle Formulare abfangen
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    showOverlay(
      'Funktion im Demonstrator nicht verfuegbar',
      'Dieses Formular (z. B. Suche oder Anmeldung) benoetigt eine Server-Komponente. ' +
      'Der Demonstrator ist eine rein statische Arbeitskopie ohne Backend und ohne Zugangsdaten. ' +
      'In einer finalen Loesung wird diese Funktion ueber einen schlanken Endpoint oder einen Dienst angebunden.'
    );
  }, true);

  // Veranstaltungskalender: EventON laedt Termine per AJAX vom WordPress-Server
  if (document.getElementById('evcal_list') || document.querySelector('.ajde_evcal_calendar')) {
    var cal = document.querySelector('.ajde_evcal_calendar') || document.getElementById('evcal_list');
    var note = document.createElement('div');
    note.className = 'ddim-demo-embed';
    note.innerHTML = '<p><strong>Veranstaltungskalender</strong></p>' +
      '<p>Die Termine laedt das Original dynamisch aus der WordPress-Datenbank (Plugin EventON). ' +
      'Ohne Server-Anbindung bleibt der Kalender hier leer. ' +
      'Aktuelle Termine: <a href="https://ddim.de/veranstaltungskalender/" target="_blank" rel="noopener">ddim.de/veranstaltungskalender</a></p>';
    cal.parentNode.insertBefore(note, cal);
  }
})();
