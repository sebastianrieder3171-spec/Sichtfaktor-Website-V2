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
    safe(() => initQuantity());
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
        `Produktdetails, Farben, Maße und Individualisierungsmöglichkeiten.`);
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
      <p class="pd-price">${esc(p.price)}</p>
      <p class="pd-short">${esc(p.shortDescription)}</p>

      ${swatches ? `
      <div class="pd-variants">
        <p class="pd-variants__label">Farbe: <strong>${esc(p.color)}</strong></p>
        <div class="pd-swatches">${swatches}</div>
      </div>` : ""}

      <div class="pd-buy">
        <div class="pd-qty" role="group" aria-label="Menge">
          <button type="button" class="pd-qty__btn" data-qty="-1" aria-label="Menge verringern">−</button>
          <input class="pd-qty__val" id="pd-qty" type="text" inputmode="numeric" value="1" aria-label="Menge">
          <button type="button" class="pd-qty__btn" data-qty="1" aria-label="Menge erhöhen">+</button>
        </div>
        <a class="btn btn-accent btn-block pd-cta" id="pd-cta" href="${anfrage}">Produkt anfragen</a>
        <p class="pd-buy__note">Kein Online-Kauf – wir melden uns persönlich zu deiner Anfrage.</p>
      </div>

      <ul class="pd-service">
        <li><strong>Versand</strong><span>${esc(p.shipping)}</span></li>
        <li><strong>Rückgabe</strong><span>${esc(p.returns)}</span></li>
        <li><strong>Sichere Bezahlung</strong><span>Geprüfte Zahlarten im Checkout.</span></li>
      </ul>

      ${p.customizable ? `
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

  /* --------- 10.+11. Details & Maße (native Akkordeons) --------- */
  function renderDetails(p) {
    const el = $("#pd-details");
    if (!el) return;
    const f = p.features || {};
    const m = p.measurements || {};

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
            ${row("Glasart", f.lens)}
            ${row("Rahmenmaterial", f.frameMaterial)}
            ${row("Passform", f.fit)}
            ${row("Gewicht", f.weight)}
          </dl>
        </div>
      </details>

      <details class="pd-acc">
        <summary>Maße</summary>
        <div class="pd-acc__body">
          <dl class="pd-specs">
            ${row("A · Glasbreite", m.lensWidth)}
            ${row("B · Stegbreite", m.bridgeWidth)}
            ${row("C · Bügellänge", m.templeLength)}
            ${row("D · Rahmenbreite", m.frameWidth)}
            ${row("E · Glashöhe", m.lensHeight)}
          </dl>
          <p class="pd-specs__hint">Maßangaben sind Platzhalter und werden ergänzt.</p>
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
  function initQuantity() {
    const input = $("#pd-qty");
    const cta = $("#pd-cta");
    if (!input) return;
    const clamp = v => Math.max(1, Math.min(99, parseInt(v, 10) || 1));
    const sync = () => {
      input.value = clamp(input.value);
      if (cta) {
        const url = new URL(cta.getAttribute("href"), window.location.href);
        url.searchParams.set("menge", input.value);
        cta.setAttribute("href", url.pathname + url.search);
      }
    };
    document.querySelectorAll(".pd-qty__btn").forEach(btn => {
      btn.addEventListener("click", () => {
        input.value = clamp((parseInt(input.value, 10) || 1) + parseInt(btn.dataset.qty, 10));
        sync();
      });
    });
    input.addEventListener("change", sync);
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
