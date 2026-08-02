/* =============================================================
   SICHTFAKTOR – product-detail.js
   -------------------------------------------------------------
   Baut die Produktdetailseite dynamisch aus den zentralen Daten
   (products.js). Reihenfolge der Aufgaben:
     1. Produkt-ID aus der URL lesen (?id=…)
     2. Produkt über getProduct() suchen
     3. Bei Fehler: saubere Meldung + Link zurück (kein Blockieren)
     4. Breadcrumb, Galerie, Infos, Details, Lifestyle rendern
     5. Farb-/Varianten-Auswahl, Menge, Lightbox
     6. Passende Produkte + zuletzt angesehen (localStorage)

   Reines Vanilla-JavaScript, keine Abhängigkeiten.
   Setzt voraus, dass products.js VORHER geladen wurde.
   ============================================================= */
(function () {
  "use strict";

  /* --------- kleine Helfer --------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const getParam = name => new URLSearchParams(window.location.search).get(name);
  const esc = s => String(s == null ? "" : s);

  /* Bild-Element. Die Datei wird vom Bildsystem (assets/js/bilder.js) aus
     bilder/produkte/<modell>/ geholt; fehlt sie, verschwindet das Bild. */
  function imgTag(basis, alt, cls, lazy, modus, prio) {
    return `<img class="${cls}" data-bild="${esc(basis)}"` +
      (modus ? ` data-bild-modus="${modus}"` : "") +
      (prio  ? ` data-bild-prio="hoch"` : "") +
      ` alt="${esc(alt)}"` + (lazy ? ' loading="lazy"' : "") + `>`;
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const id = getParam("id");
    let product = null;
    try {
      if (typeof getProduct === "function") product = getProduct(id);
    } catch (e) {
      console.warn("Produkt konnte nicht geladen werden:", e);
    }

    if (!product) { showError(); return; }

    // Jeder Teilschritt einzeln abgesichert -> ein Fehler blockiert nie alles.
    safe(() => renderMeta(product));
    safe(() => renderBreadcrumb(product));
    safe(() => renderGallery(product));
    safe(() => renderInfo(product));
    safe(() => renderDetails(product));
    safe(() => renderLifestyle(product));
    safe(() => renderRelated(product));
    safe(() => initVariants());
    safe(() => initQuantity(product));
    safe(() => initLightbox());
    safe(() => { saveRecentlyViewed(product.id); renderRecentlyViewed(product.id); });
  }

  function safe(fn) { try { fn(); } catch (e) { console.warn("Teilbereich übersprungen:", e); } }

  /* --------- Fehlerfall: unbekannte/fehlende ID --------- */
  function showError() {
    const main = $("#pd-main");
    if (main) {
      main.innerHTML =
        `<div class="container section" style="text-align:center">
           <h1>Produkt nicht gefunden</h1>
           <p class="lead">Dieses Modell ist nicht verfügbar oder der Link ist ungültig.</p>
           <p><a class="btn btn-accent" href="sonnenbrillen.html">Zu allen Sonnenbrillen</a></p>
         </div>`;
    }
    document.title = "Produkt nicht gefunden | Sichtfaktor";
  }

  /* --------- 1. Titel & Meta-Description (dynamisch) --------- */
  function renderMeta(p) {
    document.title = `${p.name} ${p.color} | Sonnenbrille | Sichtfaktor`;
    const md = $('meta[name="description"]');
    if (md) {
      md.setAttribute("content",
        `Entdecke die ${p.name} Sonnenbrille von Sichtfaktor in ${p.color}. ` +
        `Produktdetails, Farben und Individualisierungsmöglichkeiten.`);
    }
  }

  /* --------- 2. Breadcrumb --------- */
  function renderBreadcrumb(p) {
    const el = $("#pd-breadcrumb");
    if (!el) return;
    el.innerHTML =
      `<a href="sonnenbrillen.html">Sonnenbrillen</a>` +
      ` <span aria-hidden="true">/</span> ` +
      `<a href="sonnenbrillen.html">${esc(p.collectionLabel)}</a>` +
      ` <span aria-hidden="true">/</span> ` +
      `<span aria-current="page">${esc(p.name)}</span>`;
  }

  /* --------- 4. Bildergalerie (links) --------- */
  function renderGallery(p) {
    const el = $("#pd-gallery");
    if (!el) return;
    // Produkt-Kennung am Container: erlaubt produktbezogene Bilddarstellung im CSS
    el.setAttribute("data-produkt", p.id);
    const imgs = Array.isArray(p.images) ? p.images : [];
    // Reihenfolge, Bildausschnitt, Alternativtext und Priorität kommen zentral
    // aus assets/js/bilder.js (SF.bilder.produkt).
    const tiles = imgs.map((eintrag, i) => {
      const b = typeof eintrag === "string"
        ? { basis: eintrag, titel: `Ansicht ${i + 1}`, modus: "optional", fit: "contain" }
        : eintrag;
      const cls = b.fit === "cover" ? "pd-shot pd-shot--model" : "pd-shot";
      const fit = b.fit === "cover" ? "pd-img--cover" : "pd-img--contain";
      const alt = `${p.name} – ${b.titel}`;
      // Hauptbild bleibt als gestaltete Fläche stehen, fehlende Zusatzbilder
      // werden komplett ausgeblendet.
      const bereich = b.modus === "karte" ? "" : " data-bild-bereich";
      return `<figure class="${cls}" data-full tabindex="0" role="button" aria-label="Bild vergrößern"${bereich}>
                <span class="pcard-ph" aria-hidden="true">SICHTFAKTOR</span>
                ${imgTag(b.basis, alt, "pd-img " + fit, !b.prio, b.modus, b.prio)}
              </figure>`;
    }).join("");
    el.innerHTML = tiles || `<div class="pd-shot"><span class="pcard-ph">SICHTFAKTOR</span></div>`;
  }

  /* --------- Staffelpreise (aktiv, sobald ein Produkt "staffel" hat) ---------
     Gerechnet wird durchgehend in ganzen Cent, damit keine Rundungsfehler
     entstehen. Sichtbar sind immer zwei Nachkommastellen. */
  const euro = new Intl.NumberFormat("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cent = n => Math.round(n * 100);                 // 11.58 -> 1158
  const alsEuro = c => euro.format(c / 100) + " €";      // 1158  -> "11,58 €"

  /* gültige Preisstufe für eine Menge */
  function stufeFuer(st, menge) {
    let treffer = st.stufen[0];
    for (const s of st.stufen) if (menge >= s.ab) treffer = s;
    return treffer;
  }

  /* Preisblock oben: „ab 8,90 € netto / Stück“ + Kleingedrucktes */
  function preisBlock(p) {
    const st = p.staffel;
    if (!st) {
      // Privatkundenpreis; USt.-Hinweis nur, wenn am Produkt hinterlegt
      const ust = p.ustHinweis ? ` <span class="pd-price__unit">${esc(p.ustHinweis)}</span>` : "";
      return `<p class="pd-price">${esc(p.price)}${ust}</p>`;
    }
    const guenstigste = Math.min.apply(null, st.stufen.map(s => cent(s.netto)));
    return `
      <div class="pd-preis">
        <p class="pd-price">ab ${alsEuro(guenstigste)} netto <span class="pd-price__unit">/ Stück</span></p>
        <p class="pd-price__meta">zzgl. ${st.ustProzent} % USt.<br>Mindestbestellmenge: ${st.mindestmenge} Stück</p>
      </div>`;
  }

  /* Rechner unter dem Mengenwähler + aufklappbare Staffelübersicht */
  function staffelBlock(p) {
    const st = p.staffel;
    if (!st) return "";
    const zeilen = st.stufen.map(s =>
      `<div class="pd-spec"><dt>ab ${s.ab} Stück</dt><dd>${alsEuro(cent(s.netto))} netto / Stück</dd></div>`
    ).join("");
    return `
      <div class="pd-calc" id="pd-calc" aria-live="polite">
        <p class="pd-calc__unit"><strong id="pd-calc-unit"></strong> netto / Stück</p>
        <p class="pd-calc__sum">Gesamt: <strong id="pd-calc-sum"></strong> netto</p>
        <p class="pd-calc__hint" id="pd-calc-hint" hidden></p>
      </div>
      <details class="pd-staffel">
        <summary>Staffelpreise ansehen</summary>
        <div class="pd-staffel__body"><dl class="pd-specs">${zeilen}</dl></div>
      </details>`;
  }

  /* --------- Firmenedition (nur bei Produkten mit firmenedition: true) ---------
     Öffnet das E-Mail-Programm mit vorbereiteter Nachricht. Modellname kommt
     dynamisch aus den Produktdaten, Betreff und Text werden URL-codiert –
     dadurch funktionieren Umlaute und Zeilenumbrüche zuverlässig. */
  function firmenBlock(p) {
    if (!p.firmenedition) return "";

    // "RESINO" -> "Resino"
    const modell = p.name.charAt(0).toUpperCase() + p.name.slice(1).toLowerCase();
    const empfaenger = (typeof KONTAKT_EMAIL === "string" && KONTAKT_EMAIL) || "hello@sichtfaktor.com";

    const betreff = `Anfrage Firmenedition – ${modell}`;
    const text =
      "Guten Tag,\n\n" +
      `ich interessiere mich für das Modell ${modell} als individuelle Firmenedition.\n\n` +
      "Unternehmen / Organisation:\n" +
      "Ansprechpartner:\n" +
      "Gewünschte Menge:\n" +
      "Gewünschte Veredelung:\n" +
      "Geplanter Einsatz:\n" +
      "Wunschtermin:\n\n" +
      "Bitte senden Sie mir weitere Informationen und ein unverbindliches Angebot.\n\n" +
      "Freundliche Grüße";

    const href = "mailto:" + encodeURIComponent(empfaenger).replace(/%40/g, "@") +
      "?subject=" + encodeURIComponent(betreff) +
      "&body="    + encodeURIComponent(text);

    return `
      <div class="pd-firma">
        <h2 class="pd-firma__title">Auch als individuelle Firmenedition erhältlich</h2>
        <p>Verwandeln Sie dieses Modell in eine hochwertige Sonderedition für Ihr Unternehmen,
           Ihr Hotel, Ihren Verein oder Ihre Veranstaltung. Ab 50 Stück begleiten wir Sie
           persönlich von der Auswahl bis zur individuellen Veredelung.</p>
        <a class="btn btn-firma" href="${href}">Firmenedition anfragen</a>
      </div>`;
  }

  /* --------- 5.–9. Produktinformationen (rechts, sticky) --------- */
  function renderInfo(p) {
    const el = $("#pd-info");
    if (!el) return;

    const badge = p.badge ? `<span class="pd-badge">${esc(p.badge)}</span>` : "";

    // Varianten (Farbauswahl) – navigieren zu echten Produkt-IDs
    let swatches = "";
    if (Array.isArray(p.colors) && p.colors.length) {
      swatches = p.colors.map(c => {
        const active = c.productId === p.id ? " is-active" : "";
        const target = c.productId ? `produkt.html?id=${encodeURIComponent(c.productId)}` : "#";
        return `<a class="pd-swatch${active}" href="${target}" title="${esc(c.name)}"
                   aria-label="Farbe ${esc(c.name)}"><span style="background:${esc(c.value)}"></span></a>`;
      }).join("");
    }

    // Kein echter Shop angebunden -> ehrliche Anfrage statt Fake-Checkout
    const anfrage = `kontakt.html?anliegen=produkt&modell=${encodeURIComponent(p.name)}`;

    el.innerHTML = `
      <p class="pd-eyebrow">${esc(p.collectionLabel)}</p>
      ${badge}
      <h1 class="pd-name">${esc(p.name)}</h1>
      <p class="pd-color" id="pd-color">${esc(p.color)}</p>
      ${preisBlock(p)}
      <p class="pd-short">${esc(p.shortDescription)}</p>

      ${swatches ? `
      <div class="pd-variants">
        <p class="pd-variants__label">Farbe: <strong>${esc(p.color)}</strong></p>
        <div class="pd-swatches">${swatches}</div>
      </div>` : ""}

      <div class="pd-buy">
        <div class="pd-qty" role="group" aria-label="Menge">
          <button type="button" class="pd-qty__btn" data-qty="-1" aria-label="Menge verringern">−</button>
          <input class="pd-qty__val" id="pd-qty" type="text" inputmode="numeric"
                 value="${p.staffel ? p.staffel.mindestmenge : 1}" aria-label="Menge">
          <button type="button" class="pd-qty__btn" data-qty="1" aria-label="Menge erhöhen">+</button>
        </div>
        ${staffelBlock(p)}
        <a class="btn btn-accent btn-block pd-cta" id="pd-cta" href="${anfrage}">Produkt anfragen</a>
        <p class="pd-buy__note">Kein Online-Kauf – wir melden uns persönlich zu deiner Anfrage.</p>
      </div>

      ${firmenBlock(p)}

      <ul class="pd-service">
        <li><strong>Versand</strong><span>${esc(p.shipping)}</span></li>
        <li><strong>Rückgabe</strong><span>${esc(p.returns)}</span></li>
        <li><strong>Sichere Bezahlung</strong><span>Geprüfte Zahlarten im Checkout.</span></li>
      </ul>

      ${(p.customizable && !p.firmenedition) ? `
      <div class="pd-b2b">
        <h2 class="pd-b2b__title">Dieses Modell individualisieren</h2>
        <p>Ausgewählte Modelle können für Unternehmen, Vereine und Events mit Logo oder eigener Verpackung gestaltet werden.</p>
        <div class="fb-actions">
          <a class="btn btn-accent" href="unternehmen.html">Zum Firmen-Shop</a>
          <a class="btn btn-outline" href="kontakt.html?anliegen=projekt">Projekt anfragen</a>
        </div>
      </div>` : ""}
    `;

    // Mobile sticky Kaufleiste befüllen
    const bar = $("#pd-buybar");
    if (bar) {
      bar.innerHTML =
        `<span class="pd-buybar__price">${esc(p.price)}</span>
         <a class="btn btn-accent" href="${anfrage}">Produkt anfragen</a>`;
      bar.hidden = false;
    }
  }

  /* --------- 10.+11. Details (native Akkordeons) --------- */
  function renderDetails(p) {
    const el = $("#pd-details");
    if (!el) return;
    const f = p.features || {};

    const row = (label, val) => `<div class="pd-spec"><dt>${label}</dt><dd>${esc(val)}</dd></div>`;

    el.innerHTML = `
      <details class="pd-acc" open>
        <summary>Beschreibung</summary>
        <div class="pd-acc__body"><p>${esc(p.description)}</p></div>
      </details>

      <details class="pd-acc">
        <summary>Merkmale</summary>
        <div class="pd-acc__body">
          <dl class="pd-specs">
            ${row("UV-Schutz", f.uvProtection)}
            ${row("Filterkategorie", f.filterCategory)}
            ${row("Rahmenmaterial", f.frameMaterial)}
            ${row("Passform", f.fit)}
            ${row("Gewicht", f.weight)}
          </dl>
        </div>
      </details>

      <details class="pd-acc">
        <summary>Pflege</summary>
        <div class="pd-acc__body"><p>${esc(p.care)}</p></div>
      </details>

      <details class="pd-acc">
        <summary>Versand und Rückgabe</summary>
        <div class="pd-acc__body">
          <p><strong>Versand:</strong> ${esc(p.shipping)}</p>
          <p><strong>Rückgabe:</strong> ${esc(p.returns)}</p>
        </div>
      </details>
    `;
  }

  /* --------- 12. Lifestyle-Bereich --------- */
  function renderLifestyle(p) {
    const el = $("#pd-lifestyle");
    if (!el) return;
    // Fehlt bilder/produkte/<modell>/anwendung.jpg, bleibt der Bereich mit
    // seiner Überschrift stehen und zeigt die neutrale Bildfläche.
    const model = (window.SF && SF.bilder) ? SF.bilder.produktAnwendung(p.id) : "";
    el.innerHTML = `
      <div class="pd-lifestyle__media">
        <span class="pcard-ph" aria-hidden="true">SICHTFAKTOR</span>
        ${imgTag(model, `${p.name} getragen`, "pd-lifestyle__img", true, "karte")}
      </div>
      <div class="pd-lifestyle__text">
        <h2 class="u-upper">${esc(p.lifestyleHeadline)}</h2>
      </div>`;
  }

  /* --------- 13. Passende Produkte (gleiche Collection) --------- */
  function renderRelated(p) {
    const el = $("#pd-related-grid");
    if (!el || typeof productGridCard !== "function") return;
    const list = (products[p.collection] || []).filter(x => x.id !== p.id).slice(0, 4);
    el.innerHTML = list.map(productGridCard).join("");
  }

  /* --------- 6. Farbauswahl: aktive Variante hervorheben (Navigation via href) --------- */
  function initVariants() {
    // Navigation übernimmt der <a>-Link; hier nur Tastatur-Fokus sicherstellen.
    // (Keine vorgetäuschte Auswahl – Klick lädt das echte Produkt.)
  }

  /* --------- 7. Mengenwahl (kompakt) --------- */
  function initQuantity(p) {
    const input = $("#pd-qty");
    const cta = $("#pd-cta");
    if (!input) return;

    // Mit Staffel: Mindestmenge greift. Ohne Staffel bleibt alles wie bisher.
    const st  = p && p.staffel;
    const min = st ? st.mindestmenge : 1;
    const max = st ? 100000 : 99;
    const clamp = v => {
      // Alles ab dem Komma abschneiden (Dezimaleingabe), Tausenderpunkte
      // und Leerzeichen entfernen: "1.000" -> 1000, "3,5" -> 3, "abc" -> min
      const n = parseInt(String(v).split(",")[0].replace(/[^\d]/g, ""), 10);
      return Math.max(min, Math.min(max, isNaN(n) ? min : n));
    };

    const rechnen = menge => {
      if (!st) return null;
      const stufe = stufeFuer(st, menge);
      const stueckC = cent(stufe.netto);
      return { stufe, stueckC, summeC: stueckC * menge };   // ganze Cent, exakt
    };

    const sync = () => {
      const menge = clamp(input.value);
      input.value = menge;                     // korrigiert auch getippte Eingaben
      const r = rechnen(menge);

      if (r) {
        const u = $("#pd-calc-unit"), s = $("#pd-calc-sum"), h = $("#pd-calc-hint");
        if (u) u.textContent = alsEuro(r.stueckC);
        if (s) s.textContent = alsEuro(r.summeC);
        if (h) {
          // Hinweis nur, wenn tatsächlich eine bessere Stufe als die erste gilt
          const besser = r.stufe.ab > st.mindestmenge;
          h.textContent = besser ? `Preisvorteil ab ${r.stufe.ab} Stück aktiviert` : "";
          h.hidden = !besser;
        }
        const bar = $(".pd-buybar__price");
        if (bar) bar.textContent = alsEuro(r.summeC) + " netto";
      }

      if (cta) {
        // Menge und gültiger Stückpreis wandern in die Anfrage-URL
        const url = new URL(cta.getAttribute("href"), window.location.href);
        url.searchParams.set("menge", String(menge));
        if (r) url.searchParams.set("stueckpreis", (r.stueckC / 100).toFixed(2));
        if (r) url.searchParams.set("gesamt", (r.summeC / 100).toFixed(2));
        cta.setAttribute("href", url.pathname + url.search);
        const barLink = $(".pd-buybar .btn");     // mobile Kaufleiste mitziehen
        if (barLink) barLink.setAttribute("href", url.pathname + url.search);
      }
    };

    document.querySelectorAll(".pd-qty__btn").forEach(btn => {
      btn.addEventListener("click", () => {
        input.value = clamp((parseInt(input.value, 10) || min) + parseInt(btn.dataset.qty, 10));
        sync();
      });
    });
    input.addEventListener("change", sync);
    input.addEventListener("blur", sync);
    sync();
  }

  /* --------- 4. Einfache Lightbox (wenig JS) --------- */
  function initLightbox() {
    const gallery = $("#pd-gallery");
    if (!gallery) return;

    const overlay = document.createElement("div");
    overlay.className = "pd-lightbox";
    overlay.hidden = true;
    overlay.innerHTML = `<button class="pd-lightbox__close" aria-label="Schließen">×</button><img alt="">`;
    document.body.appendChild(overlay);
    const bigImg = overlay.querySelector("img");

    const open = src => { bigImg.src = src; overlay.hidden = false; document.body.style.overflow = "hidden"; };
    const close = () => { overlay.hidden = true; bigImg.src = ""; document.body.style.overflow = ""; };

    // Adresse kommt vom bereits geladenen Bild (Dateiendung ermittelt das Bildsystem)
    const vollbild = fig => {
      const img = fig && fig.querySelector("img");
      return img && img.src ? img.src : "";
    };

    gallery.addEventListener("click", e => {
      const src = vollbild(e.target.closest("[data-full]"));
      if (src) open(src);
    });
    gallery.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        const src = vollbild(e.target.closest("[data-full]"));
        if (!src) return;
        e.preventDefault();
        open(src);
      }
    });
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  /* --------- 14. Zuletzt angesehen (localStorage, optional & abgesichert) --------- */
  const LS_KEY = "sf_recent";
  function saveRecentlyViewed(id) {
    try {
      let list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      list = [id].concat(list.filter(x => x !== id)).slice(0, 4);
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch (e) { /* localStorage nicht verfügbar -> still ignorieren */ }
  }
  function renderRecentlyViewed(currentId) {
    const section = $("#pd-recent");
    const grid = $("#pd-recent-grid");
    if (!section || !grid || typeof productGridCard !== "function") return;
    let ids = [];
    try { ids = JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return; }
    const list = ids.filter(id => id !== currentId)
                    .map(getProduct).filter(Boolean).slice(0, 4);
    if (!list.length) return;              // Bereich entfällt, wenn leer
    grid.innerHTML = list.map(productGridCard).join("");
    section.hidden = false;
  }

})();
