/* =========================================================================
   SICHTFAKTOR – BILDSYSTEM  (interne Technik, muss nicht bearbeitet werden)
   =========================================================================
   Für die Bildpflege ist AUSSCHLIESSLICH der Ordner  bilder/  relevant.
   Siehe  bilder/ANLEITUNG.txt

   Diese Datei sorgt dafür, dass die Website die festen Dateinamen aus
   bilder/ automatisch findet:
     - sucht der Reihe nach nach .webp, .jpg, .jpeg, .png
     - fehlt ein Pflichtbild  -> neutraler Platzhalter mit Hinweis
     - fehlt ein optionales Bild -> der ganze Bildbereich verschwindet
     - ausgetauschte Dateien erscheinen nach normalem Neuladen sofort
       (Adresse enthält automatisch das Änderungsdatum der Datei)
   ========================================================================= */

(function () {
  "use strict";

  var ORDNER   = "bilder/";
  var ENDUNGEN = ["webp", "jpg", "jpeg", "png"];

  /* ---------------------------------------------------------------------
     Interne Zuordnung: Dateiname -> Alternativtext, Pflicht/optional, Größe.
     Der Bildpfad selbst steht im HTML (data-bild) und entspricht 1:1 dem
     Ordner unter bilder/. Hier wird nichts gepflegt, wenn Bilder wechseln.
     --------------------------------------------------------------------- */
  var BILDER = {

    /* --- Marke --- */
    "marke/logo": {
      alt: "Sichtfaktor", modus: "pflicht", prio: true, ratio: false
    },
    "marke/favicon": { modus: "favicon" },

    /* --- Startseite --- */
    "startseite/hintergrund": {
      alt: "", modus: "pflicht", prio: true, css: ".hero-bg", groesse: [2400, 1350]
    },
    "startseite/unternehmen": {
      alt: "Gebrandete Sonnenbrillen für Unternehmen", modus: "pflicht", groesse: [1200, 900]
    },
    "startseite/vereine": {
      alt: "Sonnenbrillen in Vereinsfarben für Vereine und Events", modus: "pflicht", groesse: [1200, 900]
    },
    "startseite/alltag-1": {
      alt: "Person mit Sichtfaktor-Sonnenbrille", modus: "optional", groesse: [1600, 1200]
    },
    "startseite/alltag-2": {
      alt: "Firmenprojekt mit gebrandeten Sonnenbrillen", modus: "optional", groesse: [800, 600]
    },
    "startseite/alltag-3": {
      alt: "Verein und Event mit Sichtfaktor-Sonnenbrillen", modus: "optional", groesse: [800, 600]
    },

    /* --- Unterseiten --- */
    "unternehmen/vorteile": {
      alt: "Gebrandete Sonnenbrillen als Firmen-Edition", modus: "pflicht", groesse: [1200, 900]
    },
    "vereine/gemeinschaft": {
      alt: "Verein und Fans mit Sonnenbrillen in Vereinsfarben", modus: "pflicht", groesse: [1200, 900]
    },
    "ueber-uns/team": {
      alt: "Das Team hinter Sichtfaktor", modus: "pflicht", groesse: [1200, 900]
    },
    "ueber-uns/ausblick": {
      alt: "Sonnenbrillen der eigenen Kollektion", modus: "optional", groesse: [1200, 900]
    },

    /* --- Sonnenbrillen-Seite --- */
    "sonnenbrillen/banner": {
      alt: "Sichtfaktor Sonnenbrillen – Essential und Signature Collection",
      modus: "optional", groesse: [2400, 900]
    },
    "sonnenbrillen/kollektion-essential": {
      alt: "Person mit einem Modell aus der Essential Collection", modus: "optional", groesse: [1000, 1250]
    },
    "sonnenbrillen/kollektion-signature": {
      alt: "Person mit einem Modell aus der Signature Collection", modus: "optional", groesse: [1000, 1250]
    }

    /* Produktbilder brauchen keinen Eintrag: bilder/produkte/<modell>/… */
  };

  /* Feste Dateinamen je Produktordner – Reihenfolge = Reihenfolge der Galerie.
     titel = Zusatz im Alternativtext, fit = contain (Freisteller) / cover (Foto) */
  var PRODUKT_BILDER = {
    "hauptbild":  { titel: "Hauptansicht",  modus: "karte",    prio: true, fit: "contain", groesse: [1400, 1400] },
    "ansicht-2":  { titel: "zweite Ansicht", modus: "optional", fit: "contain", groesse: [1400, 1400] },
    "ansicht-3":  { titel: "dritte Ansicht", modus: "optional", fit: "contain", groesse: [1400, 1400] },
    "model":      { titel: "getragen",      modus: "optional", fit: "cover",   groesse: [1400, 1400] },
    "detail":     { titel: "Detailaufnahme", modus: "optional", fit: "contain", groesse: [1400, 1400] },
    "gravur":     { titel: "Gravur",        modus: "optional", fit: "contain", groesse: [1400, 1400] },
    "etui":       { titel: "Etui",          modus: "optional", fit: "contain", groesse: [1400, 1400] },
    "verpackung": { titel: "Verpackung",    modus: "optional", fit: "contain", groesse: [1400, 1400] },
    "anwendung":  { titel: "im Einsatz",    modus: "optional", fit: "cover",   groesse: [1600, 2000] }
  };
  var PRODUKT_DATEIEN = Object.keys(PRODUKT_BILDER);


  /* ================= Datei suchen (webp -> jpg -> jpeg -> png) ============ */

  var gefunden = {};   // basis -> fertige Adresse oder null

  function merke(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function geholt(k)   { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  function stempel(lastModified) {
    var t = Date.parse(lastModified);
    return isNaN(t) ? "1" : String(Math.floor(t / 1000));
  }

  /* Existiert die Datei? cb(true/false, Änderungsdatum) */
  function pruefe(adresse, cb) {
    if (location.protocol === "file:" || !window.fetch) {
      var test = new Image();
      test.onload  = function () { cb(true, null); };
      test.onerror = function () { cb(false, null); };
      test.src = adresse;
      return;
    }
    fetch(adresse, { method: "HEAD" }).then(function (r) {
      if (r.status === 405 || r.status === 501) {   // Server erlaubt kein HEAD
        var t2 = new Image();
        t2.onload  = function () { cb(true, null); };
        t2.onerror = function () { cb(false, null); };
        t2.src = adresse;
        return;
      }
      cb(r.ok, r.headers.get("Last-Modified"));
    })["catch"](function () { cb(false, null); });
  }

  function finde(basis, cb) {
    if (basis in gefunden) { cb(gefunden[basis]); return; }

    /* Bereits bekanntes Format des Ordners zuerst probieren – spart Anfragen */
    var schluessel = "sf-format:" + basis.split("/")[0];
    var hinweis = geholt(schluessel);
    var liste = ENDUNGEN.slice();
    if (hinweis && liste.indexOf(hinweis) > -1) {
      liste = [hinweis].concat(liste.filter(function (e) { return e !== hinweis; }));
    }

    var i = 0;
    (function weiter() {
      if (i >= liste.length) { gefunden[basis] = null; cb(null); return; }
      var endung  = liste[i++];
      var adresse = ORDNER + basis + "." + endung;
      pruefe(adresse, function (ok, lm) {
        if (!ok) { weiter(); return; }
        merke(schluessel, endung);
        var fertig = lm ? adresse + "?v=" + stempel(lm) : adresse;
        gefunden[basis] = fertig;
        cb(fertig);
      });
    })();
  }


  /* ================= Bild einsetzen ====================================== */

  function fehlt(el, basis, cfg, modus) {
    if (modus === "pflicht") {
      var ph = document.createElement("div");
      ph.className = "placeholder";
      ph.setAttribute("data-label", "Bild fehlt: bilder/" + basis + ".jpg");
      if (cfg.groesse) ph.style.aspectRatio = cfg.groesse[0] + " / " + cfg.groesse[1];
      if (el.parentNode) el.parentNode.replaceChild(ph, el);
      return;
    }
    if (modus === "karte") {
      // Produktkarten und Galerie haben bereits eine gestaltete Bildfläche mit
      // "SICHTFAKTOR"-Schriftzug. Der erwartete Pfad steht im Tooltip.
      var flaeche = el.parentNode;
      if (flaeche && flaeche.setAttribute) {
        flaeche.setAttribute("title", "Bild fehlt: bilder/" + basis + ".jpg");
      }
      el.remove();
      return;
    }
    var bereich = el.closest ? el.closest("[data-bild-bereich]") : null;
    (bereich || el).remove();
    aufraeumen();
  }

  function anwenden(el) {
    if (el.__sfBild) return;
    el.__sfBild = true;

    var basis = el.getAttribute("data-bild");
    if (!basis) return;
    var cfg   = BILDER[basis] || {};
    var modus = el.getAttribute("data-bild-modus") || cfg.modus || "optional";

    if (cfg.alt != null && !el.getAttribute("alt")) el.setAttribute("alt", cfg.alt);
    if (cfg.groesse && cfg.ratio !== false) {
      el.setAttribute("width",  cfg.groesse[0]);
      el.setAttribute("height", cfg.groesse[1]);
    }
    el.setAttribute("decoding", "async");
    if (el.getAttribute("data-bild-prio") === "hoch") cfg = Object.assign({}, cfg, { prio: true });
    if (cfg.prio) {
      el.setAttribute("loading", "eager");
      el.setAttribute("fetchpriority", "high");
    } else if (!el.getAttribute("loading")) {
      el.setAttribute("loading", "lazy");
    }

    finde(basis, function (adresse) {
      if (!adresse) { fehlt(el, basis, cfg, modus); return; }
      el.addEventListener("error", function () { fehlt(el, basis, cfg, modus); }, { once: true });
      el.src = adresse;
    });
  }

  /* Leere Bereiche entfernen, wenn alle optionalen Bilder darin fehlen */
  var timer = null;
  function aufraeumen() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var nochmal = true;
      while (nochmal) {
        nochmal = false;
        var gruppen = document.querySelectorAll("[data-bild-gruppe]");
        for (var i = 0; i < gruppen.length; i++) {
          if (!gruppen[i].children.length) { gruppen[i].remove(); nochmal = true; }
        }
      }
    }, 60);
  }


  /* ================= Hintergrundbilder + Favicon (früh, ohne Warten) ===== */

  for (var pfad in BILDER) {
    (function (basis, cfg) {
      if (cfg.css) {
        finde(basis, function (adresse) {
          if (!adresse) { hintergrundFehlt(basis, cfg); return; }
          var style = document.createElement("style");
          style.textContent = cfg.css + '{background-image:url("' + adresse + '")}';
          document.head.appendChild(style);
          if (cfg.prio) {
            var link = document.createElement("link");
            link.rel = "preload"; link.as = "image"; link.href = adresse;
            link.setAttribute("fetchpriority", "high");
            document.head.appendChild(link);
          }
        });
      }
      if (cfg.modus === "favicon") {
        finde(basis, function (adresse) {
          if (!adresse) return;
          var link = document.createElement("link");
          link.rel = "icon"; link.href = adresse;
          document.head.appendChild(link);
        });
      }
    })(pfad, BILDER[pfad]);
  }

  function hintergrundFehlt(basis, cfg) {
    if (cfg.modus !== "pflicht") return;
    bereit(function () {
      var liste = document.querySelectorAll(cfg.css);
      for (var i = 0; i < liste.length; i++) {
        liste[i].classList.add("placeholder");
        liste[i].setAttribute("data-label", "Bild fehlt: bilder/" + basis + ".jpg");
      }
    });
  }


  /* ================= Start + Nachzügler (Produktkarten usw.) ============= */

  function bereit(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function alle(root) {
    var liste = (root || document).querySelectorAll("img[data-bild]");
    for (var i = 0; i < liste.length; i++) anwenden(liste[i]);
  }

  /* Bilder, die erst per JavaScript eingefügt werden (Slider, Produktseiten),
     werden automatisch mitverarbeitet. */
  if (window.MutationObserver) {
    new MutationObserver(function (eintraege) {
      for (var i = 0; i < eintraege.length; i++) {
        var neu = eintraege[i].addedNodes;
        for (var j = 0; j < neu.length; j++) {
          var n = neu[j];
          if (n.nodeType !== 1) continue;
          if (n.matches && n.matches("img[data-bild]")) anwenden(n);
          else if (n.querySelectorAll) alle(n);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  bereit(function () { alle(); });


  /* ================= Schnittstelle für die Produktseiten ================= */

  window.SF = window.SF || {};
  window.SF.bilder = {
    anwenden: alle,
    ordner: ORDNER,
    /* Alle möglichen Bilder eines Modells – inkl. zentraler Vorgaben für
       Alternativtext, Pflicht/optional, Bildausschnitt und Priorität. */
    produkt: function (id) {
      return PRODUKT_DATEIEN.map(function (name) {
        var m = PRODUKT_BILDER[name];
        return {
          basis: "produkte/" + id + "/" + name,
          datei: name,
          titel: m.titel,
          modus: m.modus,
          fit:   m.fit,
          prio:  !!m.prio,
          groesse: m.groesse
        };
      });
    },
    produktDateien: PRODUKT_DATEIEN,
    produktHauptbild: function (id) { return "produkte/" + id + "/hauptbild"; },
    produktAnwendung: function (id) { return "produkte/" + id + "/anwendung"; }
  };

})();
