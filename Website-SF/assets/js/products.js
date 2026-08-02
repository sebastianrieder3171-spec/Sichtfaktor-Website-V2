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

/* Texte, die für BEIDE Kollektionen identisch sind – hier einmal pflegen. */
const PFLEGE =
  "Reinige die Gläser mit lauwarmem Wasser, einem milden Spülmittel oder einem " +
  "geeigneten Brillenreinigungsspray und trockne sie anschließend vorsichtig mit " +
  "einem sauberen Mikrofasertuch. Verwende kein heißes Wasser und reinige die " +
  "Gläser nicht mit Kleidung, Papierhandtüchern oder anderen rauen Materialien, " +
  "da Schmutzpartikel und Fasern die Oberfläche zerkratzen können.";

/* Muss wortgleich mit Widerrufsbelehrung und AGB bleiben. */
const RUECKGABE =
  "Für nicht individualisierte Produkte gilt das gesetzliche Rücktrittsrecht. " +
  "Sobald ein Produkt nach deinen persönlichen Vorgaben individualisiert, graviert " +
  "oder speziell angefertigt wurde, besteht kein Rücktritts- beziehungsweise " +
  "Rückgaberecht. Deine gesetzlichen Gewährleistungsrechte bei mangelhafter oder " +
  "fehlerhaft gelieferter Ware bleiben davon unberührt.";

/* Staffelpreise: netto je Stück ab der jeweiligen Menge.
   Sobald ein Produkt (oder eine Kollektion) das Feld "staffel" hat, zeigt die
   Produktseite den Mengenrechner statt des einfachen Preises. */
const STAFFEL_STANDARD = {
  mindestmenge: 10,
  ustProzent: 20,
  stufen: [
    { ab:  10, netto: 11.58 },
    { ab:  50, netto: 10.50 },
    { ab: 100, netto:  9.90 },
    { ab: 200, netto:  9.50 },
    { ab: 500, netto:  8.90 }
  ]
};

const COLLECTION_DEFAULTS = {
  essential: {
    collectionLabel: "Essential Collection",
    shortDescription: "Eine klare, vielseitige Sonnenbrille für Alltag und Freizeit.",
    description: "Ausführliche Produktbeschreibung ergänzen. Die Essential Collection steht für klare Formen und unkomplizierte Passformen.",
    lifestyleHeadline: "Entwickelt für den Alltag",
    care: PFLEGE,
    features: { uvProtection: "UV 400", filterCategory: "Kategorie 3", frameMaterial: "Bitte ergänzen", fit: "Bitte ergänzen", weight: "Bitte ergänzen" },
    shipping: "Die durchschnittliche Lieferzeit beträgt 5–7 Werktage.",
    returns: RUECKGABE,
    staffel: STAFFEL_STANDARD,   /* gilt für alle 8 Essential-Modelle */
    customizable: true
  },
  signature: {
    collectionLabel: "Signature Collection",
    shortDescription: "Ein markantes Modell mit ausdrucksstarken Details.",
    description: "Ausführliche Produktbeschreibung ergänzen. Die Signature Collection steht für ausdrucksstärkere Silhouetten und charakteristische Details.",
    lifestyleHeadline: "Ein Modell mit Charakter",
    care: PFLEGE,
    features: { uvProtection: "UV 400", filterCategory: "Kategorie 3", frameMaterial: "Bitte ergänzen", fit: "Bitte ergänzen", weight: "Bitte ergänzen" },
    shipping: "Die durchschnittliche Lieferzeit beträgt 25–30 Werktage.",
    returns: RUECKGABE,
    ustHinweis: "inkl. 20 % USt.",   /* Privatkundenpreis ist brutto        */
    firmenedition: true,             /* Hinweisbereich für Firmenkunden     */
    customizable: true
  }
};


/* 2. ================= PRODUKTDATEN =================
   Felder: id, collection, name, color, price, image (Karten-Thumbnail),
           badge, colors (Varianten als {name,value,productId}), link, alt.
   Weitere Detailfelder (images, features …) liefert getProduct(). */
const products = {

  /* --- Essential Collection: 8 Modelle --- */
  essential: [
    { id: "alpenblick", collection: "essential", name: "ALPENBLICK", color: "Schwarz / Blau", price: "49,00 €",
      badge: "BESTSELLER",
      colors: [ {name:"Schwarz", value:"#111111"}, {name:"Blau", value:"#1f4f9c"} ],
      link: "produkt.html?id=alpenblick", alt: "Alpenblick Sonnenbrille in Black Smoke",
      description: "Der Alpenblick verbindet tiefblaue Gläser mit dem Gefühl eines sonnigen Tages in den Bergen. Er erinnert an einen klaren blauen Himmel, weite Ausblicke und den Blick auf die Alpen während einer Wanderung. Der schwarze Rahmen verleiht dem Modell einen zeitlosen und markanten Charakter, während die blauen Gläser für Natur, Freiheit und schöne Tage in den Bergen stehen." },

    { id: "sonnenblick", collection: "essential", name: "SONNENBLICK", color: "Schwarz / Gelb", price: "49,00 €",
      badge: "",
      colors: [ {name:"Schwarz", value:"#111111"}, {name:"Gelb", value:"#e3b93c"} ],
      link: "produkt.html?id=sonnenblick", alt: "Sonnenblick Sonnenbrille in Tortoise Brown",
      description: "Der Sonnenblick steht für helle Tage, warme Sonnenstrahlen und das gute Gefühl, draußen unterwegs zu sein. Die gelben Gläser greifen die Farbe und das Licht der Sonne auf. Ob beim Wandern, bei einem Ausflug oder im Alltag – Sonnenbrille auf und den schönen Tag genießen." },

    { id: "gipfelblick", collection: "essential", name: "GIPFELBLICK", color: "Schwarz / Grau", price: "49,00 €",
      badge: "",
      colors: [ {name:"Schwarz", value:"#111111"}, {name:"Grau", value:"#8a8a8a"} ],
      link: "produkt.html?id=gipfelblick", alt: "Gipfelblick Sonnenbrille in Transparent Grey",
      description: "Der Gipfelblick ist von den grauen Gläsern und den Farben steiniger Berggipfel inspiriert. Sie erinnern an Felsen, Bergkämme und den Blick in die Berge. Der schwarze Rahmen unterstreicht den geradlinigen und zeitlosen Stil des Modells. Eine Brille für alle, die gerne nach oben blicken und neue Gipfel entdecken." },

    { id: "modeblick", collection: "essential", name: "MODEBLICK", color: "Schwarz / Grau", price: "49,00 €",
      badge: "",
      colors: [ {name:"Schwarz", value:"#111111"}, {name:"Grau", value:"#8a8a8a"} ],
      link: "produkt.html?id=modeblick", alt: "Modeblick Sonnenbrille in Olive Green",
      description: "Der Modeblick ist die moderne Brille der Essential Collection. Die runde Form verleiht ihr einen stilbewussten und zeitgemäßen Look. Der schwarze Rahmen und die grauen Gläser lassen sich vielseitig kombinieren und machen das Modell zum passenden Begleiter für einen modernen Stil im Alltag." },

    { id: "waldblick", collection: "essential", name: "WALDBLICK", color: "Grün / Grau", price: "49,00 €",
      badge: "",
      colors: [ {name:"Grün", value:"#3f6b3a"}, {name:"Grau", value:"#8a8a8a"} ],
      link: "produkt.html?id=waldblick", alt: "Waldblick Sonnenbrille in Sand Brown",
      description: "Der grüne Rahmen des Waldblicks erinnert an Wälder, Blätter und die vielen Grüntöne der Natur. Das Modell steht für Spaziergänge, Wanderungen und entspannte Stunden im Freien. Die grauen Gläser ergänzen den natürlichen Charakter und machen die Brille zu einem unkomplizierten Begleiter für den Alltag und für Ausflüge in die Natur." },

    { id: "seeblick", collection: "essential", name: "SEEBLICK", color: "Blau / Grau", price: "49,00 €",
      badge: "",
      colors: [ {name:"Blau", value:"#1f4f9c"}, {name:"Grau", value:"#8a8a8a"} ],
      link: "produkt.html?id=seeblick", alt: "Seeblick Sonnenbrille in Crystal Blue",
      description: "Der Seeblick trägt seinen Namen aufgrund des blauen Rahmens. Seine Farbe erinnert an klare Seen, ruhige Wasseroberflächen und erfrischende Tage in der Natur. Die grauen Gläser verleihen dem Modell eine zurückhaltende und alltagstaugliche Wirkung. Eine Brille für alle, die Wasser, Natur und sommerliche Leichtigkeit lieben." },

    { id: "abendblick", collection: "essential", name: "ABENDBLICK", color: "Rot / Grau", price: "49,00 €",
      badge: "NEU",
      colors: [ {name:"Rot", value:"#a63232"}, {name:"Grau", value:"#8a8a8a"} ],
      link: "produkt.html?id=abendblick", alt: "Abendblick Sonnenbrille in Deep Black",
      description: "Der rote Rahmen des Abendblicks ist von den warmen Farben eines Sonnenuntergangs inspiriert. Er erinnert an gemütliche Abende in der Natur, schönes Licht und den Moment, in dem ein gelungener Tag entspannt ausklingt. Die grauen Gläser gleichen die kräftige Rahmenfarbe aus und verleihen der Brille einen modernen Charakter." },

    { id: "himmelblick", collection: "essential", name: "HIMMELBLICK", color: "Silber / Blau", price: "49,00 €",
      badge: "",
      colors: [ {name:"Silber", value:"#c9ccce"}, {name:"Blau", value:"#1f4f9c"} ],
      link: "produkt.html?id=himmelblick", alt: "Himmelblick Sonnenbrille",
      description: "Der Himmelblick verbindet die klassische Pilotenform mit blauen Gläsern. Die Form erinnert an Flugzeuge und das Gefühl, über den Wolken unterwegs zu sein. Die blauen Gläser greifen die Farbe des Himmels auf und stehen für Weite, Natur und Freiheit. Ein markantes Modell für alle, die gerne neue Horizonte entdecken." }
  ],

  /* --- Signature Collection: 6 Modelle --- */
  signature: [
    { id: "resino", collection: "signature", name: "RESINO", color: "Bernstein / Hellblau", price: "35,90 €",
      badge: "SIGNATURE",
      colors: [ {name:"Bernstein", value:"#c98b3c"}, {name:"Hellblau", value:"#7fb4dd"} ],
      link: "produkt.html?id=resino", alt: "Resino Sonnenbrille in Deep Black" },

    { id: "resina", collection: "signature", name: "RESINA", color: "Bernstein / Braun", price: "35,90 €",
      badge: "",
      colors: [ {name:"Bernstein", value:"#c98b3c"}, {name:"Braun", value:"#6b4a2f"} ],
      link: "produkt.html?id=resina", alt: "Resina Sonnenbrille in Dark Havana" },

    { id: "viento", collection: "signature", name: "VIENTO", color: "Kristall / Grüngrau", price: "35,90 €",
      badge: "NEU",
      colors: [ {name:"Kristall", value:"#e4e6e7"}, {name:"Grüngrau", value:"#7e8b78"} ],
      link: "produkt.html?id=viento", alt: "Viento Sonnenbrille in Crystal Smoke" },

    { id: "vientina", collection: "signature", name: "VIENTINA", color: "Kristall / Grau", price: "35,90 €",
      badge: "",
      colors: [ {name:"Kristall", value:"#e4e6e7"}, {name:"Grau", value:"#8a8a8a"} ],
      link: "produkt.html?id=vientina", alt: "Vientina Sonnenbrille in Black Gradient" },

    { id: "tierra", collection: "signature", name: "TIERRA", color: "Olivgrün / Grau", price: "35,90 €",
      badge: "",
      colors: [ {name:"Olivgrün", value:"#5c6b3c"}, {name:"Grau", value:"#8a8a8a"} ],
      link: "produkt.html?id=tierra", alt: "Tierra Sonnenbrille in Transparent Amber" },

    { id: "tierrina", collection: "signature", name: "TIERRINA", color: "Olivgrün / Grau", price: "35,90 €",
      badge: "",
      colors: [ {name:"Olivgrün", value:"#5c6b3c"}, {name:"Grau", value:"#8a8a8a"} ],
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


/* Preis auf den Produktkarten.
   Hat ein Produkt (oder seine Kollektion) eine Staffel, zeigt die Karte den
   günstigsten Nettopreis als „ab …“ – sonst den normalen Preis wie bisher.
   Die Karten bekommen die Rohdaten ohne Kollektions-Defaults, deshalb wird
   hier zusätzlich in COLLECTION_DEFAULTS nachgesehen. */
function kartenPreis(p) {
  if (!p) return "";
  const st = p.staffel || (COLLECTION_DEFAULTS[p.collection] || {}).staffel;
  if (!st || !Array.isArray(st.stufen) || !st.stufen.length) return p.price || "";
  const guenstigste = Math.min.apply(null, st.stufen.map(s => Math.round(s.netto * 100)));
  const euro = new Intl.NumberFormat("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "ab " + euro.format(guenstigste / 100) + " € netto";
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
          <p class="pcard-price">${kartenPreis(p)}</p>
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
            <span class="gcard-price">${kartenPreis(p)}</span>
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
