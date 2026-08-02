/* =============================================================
   SICHTFAKTOR – script.js
   Reines Vanilla-JavaScript, keine externen Abhängigkeiten.
   -------------------------------------------------------------
   Inhalt:
   1.  KONFIGURATION  <- hier Kontakt-E-Mail & Produkte pflegen
   2.  Mobile-Navigation
   3.  Header-Scroll-Effekt
   4.  Scroll-Reveal-Animation
   5.  Produkte rendern (Shop + Startseite)
   6.  Produktfilter
   7.  Kontakt-/Anfrageformular (mailto)
   8.  Jahr im Footer
   ============================================================= */

/* 1. ================= KONFIGURATION ================= */

/* >>> Zentrale Kontakt-E-Mail. */
const KONTAKT_EMAIL = "hello@sichtfaktor.com";

/* >>> HINWEIS: Dieser Produktkatalog wird von KEINER Seite mehr verwendet.
   Die aktuellen Produkte stehen in assets/js/products.js, die Bilder liegen
   unter bilder/produkte/<modell>/ (siehe bilder/ANLEITUNG.txt).
   Der Block bleibt vorerst unverändert stehen und kann später entfernt werden.

   Jedes Produkt ist ein Objekt. Felder:
     name        : Modellname
     kategorie   : "unternehmen" | "vereine" | "kollektion"  (für Filter)
     kategorieText: Anzeigetext der Kategorie
     farbe       : Farbbezeichnung
     farbHex     : Farbpunkt (CSS-Farbe)
     beschreibung: kurzer Text
     badge       : optionales Label oben links (z.B. "Neu"), sonst ""
     bild        : nicht mehr genutzt (Bilder kommen aus bilder/produkte/)
   Um später einen echten Shop anzubinden, kann jedes Produkt
   z.B. eine "shopUrl" oder "sku" erhalten. */
const PRODUKTE = [
  {
    name: "Aurum", kategorie: "kollektion", kategorieText: "Eigene Kollektion",
    farbe: "Karamell / Braun", farbHex: "#b07a4b",
    beschreibung: "Zeitloses Panto-Design mit polarisierten Gläsern und mattem Acetat-Rahmen.",
    badge: "Neu", bild: ""
  },
  {
    name: "Solis", kategorie: "unternehmen", kategorieText: "Für Unternehmen",
    farbe: "Sand / Beige", farbHex: "#d8c3a5",
    beschreibung: "Leichter Rahmen, ideal für gebrandete Firmen-Editionen und Messe-Events.",
    badge: "", bild: ""
  },
  {
    name: "Meridian", kategorie: "kollektion", kategorieText: "Eigene Kollektion",
    farbe: "Schwarz matt", farbHex: "#2b251d",
    beschreibung: "Schlanke, kantige Silhouette mit UV400-Schutz – der urbane Allrounder.",
    badge: "", bild: ""
  },
  {
    name: "Verein Pro", kategorie: "vereine", kategorieText: "Für Vereine",
    farbe: "Vereinsfarbe frei", farbHex: "#4a6d8c",
    beschreibung: "Sport-Wrap mit rutschfestem Sitz – individuell in euren Vereinsfarben.",
    badge: "Beliebt", bild: ""
  },
  {
    name: "Coastline", kategorie: "kollektion", kategorieText: "Eigene Kollektion",
    farbe: "Transparent / Honig", farbHex: "#e0b877",
    beschreibung: "Runde Retro-Form mit Verlaufsgläsern – Lifestyle pur für sonnige Tage.",
    badge: "", bild: ""
  },
  {
    name: "Summit", kategorie: "vereine", kategorieText: "Für Vereine",
    farbe: "Anthrazit", farbHex: "#3a3227",
    beschreibung: "Robuste Outdoor-Brille für Turniere, Läufe und Events unter freiem Himmel.",
    badge: "", bild: ""
  },
  {
    name: "Signature", kategorie: "unternehmen", kategorieText: "Für Unternehmen",
    farbe: "Creme / Gold", farbHex: "#e7dcc4",
    beschreibung: "Premium-Edition mit Gravur-Option am Bügel für hochwertige Kundengeschenke.",
    badge: "Premium", bild: ""
  },
  {
    name: "Horizon", kategorie: "kollektion", kategorieText: "Eigene Kollektion",
    farbe: "Olive / Braun", farbHex: "#7d7a4e",
    beschreibung: "Klassischer Aviator-Style mit warm getönten Gläsern und dünnem Metallrahmen.",
    badge: "", bild: ""
  }
];

/* Kategorie-Filter für den Shop */
const KATEGORIEN = [
  { key: "alle",        label: "Alle Modelle" },
  { key: "kollektion",  label: "Eigene Kollektion" },
  { key: "unternehmen", label: "Für Unternehmen" },
  { key: "vereine",     label: "Für Vereine" }
];


/* 2. ================= MOBILE-NAVIGATION ================= */
function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menü öffnen");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  });

  // Bei Klick auf einen Link schließen
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
  // Bei Resize auf Desktop zurücksetzen
  window.addEventListener("resize", () => { if (window.innerWidth > 860) close(); });
  // ESC schließt
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}


/* 3. ================= HEADER-SCROLL-EFFEKT =================
   Startseite: Navigation wird erst NACH dem Hero-Bereich weiß.
   Unterseiten: schon ab dem ersten Scrollen. */
function initHeaderScroll() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const hero = document.querySelector(".hero");
  const isHome = document.body.classList.contains("home") && hero;
  const threshold = () =>
    isHome ? Math.max(10, hero.offsetHeight - (header.offsetHeight || 66)) : 10;

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > threshold());
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}


/* 4. ================= SCROLL-REVEAL ================= */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length || !("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}


/* 5. ================= PRODUKTE RENDERN ================= */
function produktKarte(p) {
  const media = p.bild
    ? `<img src="${p.bild}" alt="Sonnenbrille ${p.name} – ${p.farbe}" loading="lazy">`
    : `<div class="placeholder" data-label="Produktbild ${p.name}"></div>`;
  const badge = p.badge ? `<span class="product-badge">${p.badge}</span>` : "";
  // Anfrage-Link mit vorausgefülltem Betreff
  const anfrageHref = `kontakt.html?anliegen=produkt&modell=${encodeURIComponent(p.name)}`;
  // Preis- bzw. Individualisierungshinweis (feld "preis" optional pflegbar)
  const preisText = p.preis
    ? p.preis
    : (p.kategorie === "kollektion"
        ? "Preis auf Anfrage"
        : "Firmenindividualisierung auf Anfrage");

  return `
    <article class="product-card reveal" data-kategorie="${p.kategorie}">
      <div class="product-media">
        ${media}
        ${badge}
      </div>
      <div class="product-body">
        <span class="product-cat">${p.kategorieText}</span>
        <h3>${p.name}</h3>
        <span class="product-color">
          <span class="color-dot" style="background:${p.farbHex}"></span>${p.farbe}
        </span>
        <span class="product-price">${preisText}</span>
        <div class="product-actions">
          <a class="btn btn-outline btn-block" href="${anfrageHref}">Produkt ansehen</a>
        </div>
      </div>
    </article>`;
}

function renderProdukte() {
  // Shop-Seite: alle Produkte
  const grid = document.getElementById("productGrid");
  if (grid) {
    grid.innerHTML = PRODUKTE.map(produktKarte).join("");
    updateCount(PRODUKTE.length);
  }
  // Startseite: erste 4 als Vorschau
  const featured = document.getElementById("featuredGrid");
  if (featured) {
    featured.innerHTML = PRODUKTE.slice(0, 4).map(produktKarte).join("");
  }
  initReveal(); // neu eingefügte Karten animieren
}

function updateCount(n) {
  const el = document.getElementById("productCount");
  if (el) el.textContent = `${n} ${n === 1 ? "Modell" : "Modelle"}`;
}


/* 6. ================= PRODUKTFILTER ================= */
function initFilter() {
  const bar = document.getElementById("filterBar");
  const grid = document.getElementById("productGrid");
  if (!bar || !grid) return;

  bar.innerHTML = KATEGORIEN.map((k, i) =>
    `<button class="filter-btn ${i === 0 ? "active" : ""}" data-filter="${k.key}">${k.label}</button>`
  ).join("");

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    bar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    let visible = 0;
    grid.querySelectorAll(".product-card").forEach(card => {
      const show = filter === "alle" || card.dataset.kategorie === filter;
      card.classList.toggle("hidden", !show);
      if (show) visible++;
    });
    updateCount(visible);
  });
}


/* 7. ================= KONTAKT-/ANFRAGEFORMULAR (mailto) ================= */
function initFormular() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  // URL-Parameter auswerten, um Betreff vorzubelegen
  const params = new URLSearchParams(window.location.search);
  const anliegen = params.get("anliegen"); // projekt | produkt
  const modell = params.get("modell");
  const betreffSelect = form.querySelector("#betreff");
  const nachricht = form.querySelector("#nachricht");

  if (betreffSelect) {
    if (anliegen === "projekt") betreffSelect.value = "Projektanfrage";
    else if (anliegen === "produkt") betreffSelect.value = "Produktanfrage";
  }
  if (modell && nachricht) {
    nachricht.value = `Ich interessiere mich für das Modell "${modell}". Bitte sendet mir weitere Informationen.`;
  }

  const status = document.getElementById("formStatus");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Einfache Validierung
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const firma = (data.get("firma") || "").toString().trim();
    const betreff = (data.get("betreff") || "Anfrage").toString().trim();
    const msg = (data.get("nachricht") || "").toString().trim();

    // mailto-Text zusammenbauen
    const subject = `${betreff} – Sichtfaktor`;
    const body =
      `Name: ${name}\n` +
      `E-Mail: ${email}\n` +
      (firma ? `Unternehmen/Verein: ${firma}\n` : "") +
      `\nAnliegen:\n${msg}\n`;

    const mailto = `mailto:${KONTAKT_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    // E-Mail-Programm öffnen
    window.location.href = mailto;

    // Rückmeldung anzeigen
    if (status) {
      status.textContent =
        "Dein E-Mail-Programm wurde geöffnet. Falls nicht, schreibe uns direkt an " +
        KONTAKT_EMAIL + ".";
      status.className = "form-status ok show";
    }
  });
}


/* 8. ================= FOOTER-JAHR ================= */
function initYear() {
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

/* E-Mail-Adresse an allen markierten Stellen einsetzen (Footer/Kontakt) */
function initEmailPlaceholders() {
  document.querySelectorAll("[data-email]").forEach(el => {
    el.textContent = KONTAKT_EMAIL;
    if (el.tagName === "A") el.href = "mailto:" + KONTAKT_EMAIL;
  });
}


/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHeaderScroll();
  renderProdukte();
  initFilter();
  initFormular();
  initReveal();
  initYear();
  initEmailPlaceholders();
});
