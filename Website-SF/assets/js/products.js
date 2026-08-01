/* =============================================================
   SICHTFAKTOR – products.js
   -------------------------------------------------------------
   ZENTRALE PRODUKTDATEN + WIEDERVERWENDBARE KARTEN (Vanilla JS).

   Versorgt:
     • Startseite            -> horizontale Slider (.pcard)
     • Sonnenbrillen-Seite   -> festes 4-Spalten-Grid (.gcard) + Editorial
     • Produktdetailseite    -> getProduct(id) liefert alle Detailfelder

   Inhalt:
   1. Standardwerte je Kollektion (editierbare Platzhalter)
   2. Produktdaten (Essential 8 Modelle · Signature 6 Modelle)
   3. getProduct(id)  – vollständiges Produkt inkl. Defaults + Bildpfade
   4. Karten: .pcard (Slider) · .gcard (Grid) · Editorial-Kachel
   5. Render-Helfer + wiederverwendbarer Slider
   6. Init

   Fehlt eine Bilddatei -> neutraler Platzhalter (kein „kaputtes Bild").
   Ein fehlerhafter Eintrag blockiert nie die ganze Seite.
   ============================================================= */

/* 1. ================= STANDARDWERTE JE KOLLEKTION =================
   Unbekannte technische Angaben bleiben als editierbare Platzhalter
   („Bitte ergänzen“) – es werden KEINE Eigenschaften erfunden. */
const COLLECTION_DEFAULTS = {
  essential: {
    collectionLabel: "Essential Collection",
    shortDescription: "Eine klare, vielseitige Sonnenbrille für Alltag und Freizeit.",
    description: "Ausführliche Produktbeschreibung ergänzen. Die Essential Collection steht für klare Formen und unkomplizierte Passformen.",
    lifestyleHeadline: "Entwickelt für den Alltag",
    care: "Pflegehinweise ergänzen: mit einem weichen Tuch reinigen, im Etui aufbewahren, Gläser nicht trocken abwischen.",
    features: { uvProtection: "Bitte ergänzen", lens: "Bitte ergänzen", frameMaterial: "Bitte ergänzen", fit: "Bitte ergänzen", weight: "Bitte ergänzen" },
    measurements: { frameWidth: "Bitte ergänzen", lensWidth: "Bitte ergänzen", lensHeight: "Bitte ergänzen", bridgeWidth: "Bitte ergänzen", templeLength: "Bitte ergänzen" },
    shipping: "Lieferzeit und Versandkosten werden im Checkout angezeigt.",
    returns: "Informationen gemäß tatsächlicher Rückgaberegelung.",
    customizable: true
  },
  signature: {
    collectionLabel: "Signature Collection",
    shortDescription: "Ein markantes Modell mit ausdrucksstarken Details.",
    description: "Ausführliche Produktbeschreibung ergänzen. Die Signature Collection steht für ausdrucksstärkere Silhouetten und charakteristische Details.",
    lifestyleHeadline: "Ein Modell mit Charakter",
    care: "Pflegehinweise ergänzen: mit einem weichen Tuch reinigen, im Etui aufbewahren, Gläser nicht trocken abwischen.",
    features: { uvProtection: "Bitte ergänzen", lens: "Bitte ergänzen", frameMaterial: "Bitte ergänzen", fit: "Bitte ergänzen", weight: "Bitte ergänzen" },
    measurements: { frameWidth: "Bitte ergänzen", lensWidth: "Bitte ergänzen", lensHeight: "Bitte ergänzen", bridgeWidth: "Bitte ergänzen", templeLength: "Bitte ergänzen" },
    shipping: "Lieferzeit und Versandkosten werden im Checkout angezeigt.",
    returns: "Informationen gemäß tatsächlicher Rückgaberegelung.",
    customizable: true
  }
};


/* 2. ================= PRODUKTDATEN =================
   Felder: id, collection, name, color, price, image (Karten-Thumbnail),
           badge, colors (Varianten als {name,value,productId}), link, alt.
   Weitere Detailfelder (images, features, measurements …) liefert getProduct(). */
const products = {

  /* --- Essential Collection: 8 Modelle --- */
  essential: [
    { id: "alpenblick", collection: "essential", name: "ALPENBLICK", color: "Black Smoke", price: "49,00 €",
      badge: "BESTSELLER",
      colors: [ {name:"Black Smoke", value:"#111111", productId:"alpenblick"}, {name:"Tortoise Brown", value:"#74513a", productId:"sonnenblick"} ],
      link: "produkt.html?id=alpenblick", alt: "Alpenblick Sonnenbrille in Black Smoke" },

    { id: "sonnenblick", collection: "essential", name: "SONNENBLICK", color: "Tortoise Brown", price: "49,00 €",
      badge: "",
      colors: [ {name:"Tortoise Brown", value:"#74513a", productId:"sonnenblick"}, {name:"Transparent Grey", value:"#b9b9b9", productId:"gipfelblick"} ],
      link: "produkt.html?id=sonnenblick", alt: "Sonnenblick Sonnenbrille in Tortoise Brown" },

    { id: "gipfelblick", collection: "essential", name: "GIPFELBLICK", color: "Transparent Grey", price: "49,00 €",
      badge: "",
      colors: [ {name:"Transparent Grey", value:"#b9b9b9", productId:"gipfelblick"}, {name:"Olive Green", value:"#5c6b3c", productId:"modeblick"} ],
      link: "produkt.html?id=gipfelblick", alt: "Gipfelblick Sonnenbrille in Transparent Grey" },

    { id: "modeblick", collection: "essential", name: "MODEBLICK", color: "Olive Green", price: "49,00 €",
      badge: "",
      colors: [ {name:"Olive Green", value:"#5c6b3c", productId:"modeblick"}, {name:"Sand Brown", value:"#c9a878", productId:"waldblick"} ],
      link: "produkt.html?id=modeblick", alt: "Modeblick Sonnenbrille in Olive Green" },

    { id: "waldblick", collection: "essential", name: "WALDBLICK", color: "Sand Brown", price: "49,00 €",
      badge: "",
      colors: [ {name:"Sand Brown", value:"#c9a878", productId:"waldblick"}, {name:"Crystal Blue", value:"#2f5d7c", productId:"seeblick"} ],
      link: "produkt.html?id=waldblick", alt: "Waldblick Sonnenbrille in Sand Brown" },

    { id: "seeblick", collection: "essential", name: "SEEBLICK", color: "Crystal Blue", price: "49,00 €",
      badge: "",
      colors: [ {name:"Crystal Blue", value:"#2f5d7c", productId:"seeblick"}, {name:"Deep Black", value:"#111111", productId:"abendblick"} ],
      link: "produkt.html?id=seeblick", alt: "Seeblick Sonnenbrille in Crystal Blue" },

    { id: "abendblick", collection: "essential", name: "ABENDBLICK", color: "Deep Black", price: "49,00 €",
      badge: "NEU",
      colors: [ {name:"Deep Black", value:"#111111", productId:"abendblick"}, {name:"Black Smoke", value:"#333333", productId:"alpenblick"} ],
      link: "produkt.html?id=abendblick", alt: "Abendblick Sonnenbrille in Deep Black" },

    { id: "himmelblick", collection: "essential", name: "HIMMELBLICK", color: "[Farbe ergänzen]", price: "49,00 €",
      badge: "",
      colors: [ {name:"[Farbe ergänzen]", value:"#cccccc", productId:"himmelblick"}, {name:"Black Smoke", value:"#333333", productId:"alpenblick"} ],
      link: "produkt.html?id=himmelblick", alt: "Himmelblick Sonnenbrille" }
  ],

  /* --- Signature Collection: 6 Modelle --- */
  signature: [
    { id: "resino", collection: "signature", name: "RESINO", color: "Deep Black", price: "69,00 €",
      badge: "SIGNATURE",
      colors: [ {name:"Deep Black", value:"#111111", productId:"resino"}, {name:"Dark Havana", value:"#4b332b", productId:"resina"} ],
      link: "produkt.html?id=resino", alt: "Resino Sonnenbrille in Deep Black" },

    { id: "resina", collection: "signature", name: "RESINA", color: "Dark Havana", price: "69,00 €",
      badge: "",
      colors: [ {name:"Dark Havana", value:"#4b332b", productId:"resina"}, {name:"Crystal Smoke", value:"#8a8a8a", productId:"viento"} ],
      link: "produkt.html?id=resina", alt: "Resina Sonnenbrille in Dark Havana" },

    { id: "viento", collection: "signature", name: "VIENTO", color: "Crystal Smoke", price: "69,00 €",
      badge: "NEU",
      colors: [ {name:"Crystal Smoke", value:"#8a8a8a", productId:"viento"}, {name:"Black Gradient", value:"#5a5a5a", productId:"vientina"} ],
      link: "produkt.html?id=viento", alt: "Viento Sonnenbrille in Crystal Smoke" },

    { id: "vientina", collection: "signature", name: "VIENTINA", color: "Black Gradient", price: "69,00 €",
      badge: "",
      colors: [ {name:"Black Gradient", value:"#5a5a5a", productId:"vientina"}, {name:"Transparent Amber", value:"#c98b3c", productId:"tierra"} ],
      link: "produkt.html?id=vientina", alt: "Vientina Sonnenbrille in Black Gradient" },

    { id: "tierra", collection: "signature", name: "TIERRA", color: "Transparent Amber", price: "69,00 €",
      badge: "",
      colors: [ {name:"Transparent Amber", value:"#c98b3c", productId:"tierra"}, {name:"Forest Green", value:"#274232", productId:"tierrina"} ],
      link: "produkt.html?id=tierra", alt: "Tierra Sonnenbrille in Transparent Amber" },

    { id: "tierrina", collection: "signature", name: "TIERRINA", color: "Forest Green", price: "69,00 €",
      badge: "",
      colors: [ {name:"Forest Green", value:"#274232", productId:"tierrina"}, {name:"Deep Black", value:"#111111", productId:"resino"} ],
      link: "produkt.html?id=tierrina", alt: "Tierrina Sonnenbrille in Forest Green" }
  ]
};


/* 3. ================= GETPRODUCT(id) =================
   Liefert das vollständige Produkt inkl. Kollektions-Defaults und
   generierter Galerie-Bildpfade. Gibt null zurück, wenn nichts passt. */
function allProducts() {
  return [].concat(products.essential || [], products.signature || []);
}
function getProduct(id) {
  if (!id) return null;
  const p = allProducts().find(x => x && x.id === id);
  if (!p) return null;
  const base = COLLECTION_DEFAULTS[p.collection] || {};
  // Galerie-Bilder: feste Dateinamen aus  bilder/produkte/<id>/  (siehe assets/js/bilder.js)
  const images = p.images || (window.SF && SF.bilder ? SF.bilder.produkt(p.id) : []);
  return Object.assign({}, base, p, { images });
}


/* Kleines Farbpunkt-Markup (Karten). Akzeptiert Objekte {value} oder Strings. */
function colorDots(colors) {
  if (!Array.isArray(colors) || !colors.length) return "";
  const dot = c => `<span class="pcard-dot" style="background:${(c && c.value) || c}"></span>`;
  return `<div class="pcard-dots" aria-hidden="true">` + colors.map(dot).join("") + `</div>`;
}


/* 4a. ================= SLIDER-KARTE (.pcard) – STARTSEITE ================= */
function productCard(p) {
  try {
    if (!p || !p.name) return "";
    const badge = p.badge ? `<span class="pcard-badge">${p.badge}</span>` : "";
    const alt = p.alt || `Sonnenbrille ${p.name} – ${p.color || ""}`;
    const link = p.link || "#";
    return `
      <article class="pcard" role="listitem">
        <a class="pcard-media" href="${link}" aria-label="${p.name} ansehen">
          ${badge}
          <span class="pcard-ph" aria-hidden="true">SICHTFAKTOR</span>
          <img class="pcard-img" data-bild="produkte/${p.id}/hauptbild" data-bild-modus="karte"
               alt="${alt}" loading="lazy">
        </a>
        <div class="pcard-body">
          <h3 class="pcard-name">${p.name}</h3>
          <p class="pcard-color">${p.color || ""}</p>
          ${colorDots(p.colors)}
          <p class="pcard-price">${p.price || ""}</p>
          <a class="pcard-cta" href="${link}">Produkt ansehen</a>
        </div>
      </article>`;
  } catch (e) { console.warn("Produkt (Slider) übersprungen:", e); return ""; }
}


/* 4b. ================= GRID-KARTE (.gcard) – SONNENBRILLEN + „passende Produkte“ =================
   Badge oben links · Icon oben rechts · Contain-Bild · Farbpunkte ·
   Name unten links · Preis unten rechts. */
function productGridCard(p) {
  try {
    if (!p || !p.name) return "";
    const badge = p.badge ? `<span class="gcard-badge">${p.badge}</span>` : "";
    const alt = p.alt || `Sonnenbrille ${p.name} – ${p.color || ""}`;
    const link = p.link || "#";
    const color = p.color ? `<span class="gcard-color">${p.color}</span>` : "";
    return `
      <article class="gcard" role="listitem">
        <div class="gcard-media">
          ${badge}
          <a class="gcard-link" href="${link}" aria-label="${p.name} ansehen">
            <span class="pcard-ph" aria-hidden="true">SICHTFAKTOR</span>
            <img class="gcard-img" data-bild="produkte/${p.id}/hauptbild" data-bild-modus="karte"
                 alt="${alt}" loading="lazy">
          </a>
          <a class="gcard-cart" href="${link}" aria-label="${p.name} – in den Warenkorb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7z"></path><path d="M9 7a3 3 0 0 1 6 0"></path>
            </svg>
          </a>
        </div>
        <div class="gcard-body">
          ${colorDots(p.colors)}
          <div class="gcard-row">
            <h3 class="gcard-name">${p.name}${color}</h3>
            <span class="gcard-price">${p.price || ""}</span>
          </div>
        </div>
      </article>`;
  } catch (e) { console.warn("Produkt (Grid) übersprungen:", e); return ""; }
}


/* 4c. ================= EDITORIAL-KACHEL (2 Spalten im Raster) ================= */
function editorialCard(ed) {
  if (!ed) return "";
  const cta = ed.cta ? `<span class="editorial-cta">${ed.cta}</span>` : "";
  return `
    <figure class="editorial-card" aria-label="${ed.title}">
      <span class="pcard-ph" aria-hidden="true">SICHTFAKTOR</span>
      <img data-bild="${ed.bild}" data-bild-modus="karte" alt="${ed.alt || ed.title}" loading="lazy">
      <figcaption class="editorial-text">
        <span class="editorial-title">${ed.title}</span>
        <span class="editorial-sub">${ed.sub || ""}</span>
        ${cta}
      </figcaption>
    </figure>`;
}

/* Editorial-Bilder (Sonnenbrillen-Seite) */
const editorials = {
  essential: { bild: "sonnenbrillen/kollektion-essential", title: "Essential Collection",
    sub: "Zeitlose Modelle für jeden Tag.", cta: "Kollektion entdecken",
    alt: "Person mit einer Sonnenbrille aus der Essential Collection", insertAt: 0 },
  signature: { bild: "sonnenbrillen/kollektion-signature", title: "Signature Collection",
    sub: "Markante Formen und besondere Details.", cta: "Kollektion entdecken",
    alt: "Person mit einem Modell aus der Signature Collection", insertAt: 0 }
};


/* 5. ================= RENDER-HELFER + SLIDER ================= */
function renderProducts(selector, list) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML = Array.isArray(list) ? list.map(productCard).join("") : "";
}
function renderCollectionGrid(selector, list, editorial) {
  const el = document.querySelector(selector);
  if (!el) return;
  const cards = Array.isArray(list) ? list.map(productGridCard) : [];
  if (editorial) {
    const pos = Math.max(0, Math.min(editorial.insertAt || 0, cards.length));
    cards.splice(pos, 0, editorialCard(editorial));
  }
  el.innerHTML = cards.join("");
}
function initSlider(root) {
  const track = root.querySelector("[data-track]");
  const prev  = root.querySelector("[data-prev]");
  const next  = root.querySelector("[data-next]");
  if (!track) return;
  const stepSize = () => {
    const card = track.querySelector(".pcard");
    if (!card) return Math.round(track.clientWidth * 0.8);
    const s = getComputedStyle(track);
    const gap = parseFloat(s.columnGap || s.gap || "0") || 0;
    return card.getBoundingClientRect().width + gap;
  };
  const updateArrows = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  };
  if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -stepSize(), behavior: "smooth" }));
  if (next) next.addEventListener("click", () => track.scrollBy({ left:  stepSize(), behavior: "smooth" }));
  track.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  updateArrows();
}


/* 6. ================= INIT (Start- und Sonnenbrillen-Seite) =================
   Die Produktdetailseite nutzt eine eigene Datei (product-detail.js). */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts("#track-popular", products.essential);
  renderProducts("#track-new", products.signature);
  document.querySelectorAll("[data-slider]").forEach(initSlider);

  renderCollectionGrid("#grid-essential", products.essential, editorials.essential);
  renderCollectionGrid("#grid-signature", products.signature, editorials.signature);
});
