// =============================================================================
//  basis.js – gemeinsame Grundlage aller Praxiswerkstatt-Programme (PW)
// =============================================================================
//  Diese Datei ist in allen Ordnern gleich (Logistische Regression, kNN,
//  Naiver Bayes, Entscheidungsbaum). Sie enthält alles, was nichts mit dem
//  jeweiligen KI-Verfahren zu tun hat:
//    - Layout-Raster 1600 × 948 und Skalierung auf die Fenstergröße
//    - Schriften und Farben der Jakob-Preh-Schule (bsnes.de)
//    - Kopfzeile, Beispiel-Leiste, Karten (Panels), Marken, Tooltips
//    - Helfer für die HTML-Bedienelemente (platziere, beschrifte, sperre …)
//
//  Jedes Programm legt vorher fest:
//    APP_TITEL   Text in der Kopfzeile, z. B. "KI-Klassifikation"
//    SZENARIEN   die Beispiele (in daten.js), SZ = aktives Beispiel
//
//  Läuft mit p5.js 1.x und 2.x.
//  Hinweis: Alle Schleifen haben geschweifte Klammern – der p5-Web-Editor
//  kommt mit Schleifen ohne Klammern nicht zurecht.
// =============================================================================

// -----------------------------------------------------------------------------
// Layout (logisches Raster 1600 × 900, wird auf die Fenstergröße skaliert)
// -----------------------------------------------------------------------------
const W = 1600;
// Kopfzeile (0 … 56) und Beispiel-Leiste (56 … 56 + LEISTE) liegen über dem Inhalt.
const LEISTE = 48;
const H_INHALT = 900;
const H = H_INHALT + LEISTE;
const KOPF_H = 34; // Höhe der Panel-Überschrift
let S = 1;

// Schriften der Jakob-Preh-Schule (Google Fonts, siehe index.html).
// Ohne Internet wird automatisch auf Systemschriften ausgewichen.
const SCHRIFTEN = {
  titel: ["Quicksand", "Arial"],
  text: ["Inter", "Arial"],
  mono: ["JetBrains Mono", "monospace"],
};
const schriftGeladen = { titel: false, text: false, mono: false };
let TITEL = "Arial";
let SCHRIFT = "Arial";
let MONO = "monospace";

function ladeSchriften() {
  if (!document.fonts || !document.fonts.load) {
    return;
  }
  for (const art of Object.keys(SCHRIFTEN)) {
    const name = SCHRIFTEN[art][0];
    Promise.all([document.fonts.load(`400 16px "${name}"`), document.fonts.load(`700 16px "${name}"`)])
      .then((ergebnis) => {
        if (ergebnis[0].length > 0 && ergebnis[1].length > 0) {
          schriftGeladen[art] = true;
          TITEL = schriftGeladen.titel ? SCHRIFTEN.titel[0] : SCHRIFTEN.titel[1];
          SCHRIFT = schriftGeladen.text ? SCHRIFTEN.text[0] : SCHRIFTEN.text[1];
          MONO = schriftGeladen.mono ? SCHRIFTEN.mono[0] : SCHRIFTEN.mono[1];
        }
      })
      .catch(() => {});
  }
}

// Farben nach dem Corporate Design der Jakob-Preh-Schule (bsnes.de): hell und dunkel
const FARBE_HELL = {
  papier: [251, 249, 245],
  flaeche: [255, 255, 255],
  flaeche2: [243, 238, 230],
  linie: [231, 225, 214],
  text: [29, 29, 28],
  grau: [91, 88, 82],
  blass: [125, 122, 114],
  akzent: [200, 30, 58],
  akzentHell: [228, 0, 43],
  senf: [184, 122, 28],
  blau: [44, 92, 150],
  gruen: [52, 128, 84],
  neutral: [160, 155, 146],
  // für Flächen und Schrift auf Flächen
  textInvers: [255, 255, 255], // Schrift auf FARBE.text
  dunkelFlaeche: [29, 29, 28], // Tooltip/Banner mit weißer Schrift
  schatten: [29, 29, 28],
  akzentFlaeche: [253, 240, 242],
  akzentLinie: [240, 200, 208],
  rotFlaeche: [251, 225, 230],
  gruenFlaeche: [228, 241, 233],
  teilSchwarz: [40, 40, 38], // schwarzes Werkstück
};

const FARBE_DUNKEL = {
  papier: [22, 22, 21],
  flaeche: [32, 31, 30],
  flaeche2: [44, 42, 40],
  linie: [62, 59, 55],
  text: [236, 232, 224],
  grau: [184, 178, 168],
  blass: [140, 135, 126],
  akzent: [236, 76, 98],
  akzentHell: [255, 64, 92],
  senf: [222, 166, 72],
  blau: [104, 156, 222],
  gruen: [96, 186, 132],
  neutral: [120, 116, 108],
  textInvers: [22, 22, 21],
  dunkelFlaeche: [70, 67, 62],
  schatten: [0, 0, 0],
  akzentFlaeche: [52, 27, 32],
  akzentLinie: [104, 44, 56],
  rotFlaeche: [72, 32, 40],
  gruenFlaeche: [30, 54, 41],
  teilSchwarz: [128, 126, 120],
};

const FARBE = {};

// --- Farbschema hell/dunkel ---------------------------------------------------
// FARBE enthält immer die aktive Palette. Beim Umschalten werden die Arrays
// in place überschrieben, damit Verweise wie [FARBE.blau, …] gültig bleiben.
// Die Wahl gilt für alle Lernsituationen (gleicher localStorage-Schlüssel).
const FARBSCHEMA_SCHLUESSEL = "jps-lernsituationen-farbschema";
let dunkelModus = false;

function setzeFarbschema(dunkel) {
  dunkelModus = !!dunkel;
  const quelle = dunkelModus ? FARBE_DUNKEL : FARBE_HELL;
  for (const k in quelle) {
    if (FARBE[k]) {
      FARBE[k].splice(0, FARBE[k].length, ...quelle[k]);
    } else {
      FARBE[k] = quelle[k].slice();
    }
  }
  document.documentElement.classList.toggle("dunkelmodus", dunkelModus);
}

function gespeichertesFarbschema() {
  try {
    const v = localStorage.getItem(FARBSCHEMA_SCHLUESSEL);
    if (v === "dunkel" || v === "hell") {
      return v === "dunkel";
    }
  } catch (e) {
    // kein Speicher verfügbar (z. B. privater Modus) – Systemeinstellung nehmen
  }
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

setzeFarbschema(gespeichertesFarbschema());


// Klassenfarben (Klasse 0, 1, 2) – gut unterscheidbar, auch für Rot-Grün-Schwäche
const KLASSEN_FARBE = [FARBE.blau, FARBE.akzent, FARBE.senf];

let hinweis = null;
let fehlerMeldung = null;
let cnv;

// =============================================================================
// Zeichenfläche
// =============================================================================
function zeichenflaeche() {
  const cw = Math.max(800, Math.min(1600, windowWidth - 24, ((windowHeight - 24) * W) / H));
  return [Math.round(cw), Math.round((cw * H) / W)];
}

function windowResized() {
  const [cw, ch] = zeichenflaeche();
  resizeCanvas(cw, ch);
  S = width / W;
  layoutUi();
}

function behandleFehler(err) {
  console.error(err);
  fehlerMeldung = { text: String((err && err.message) || err), t0: millis() };
  if (typeof nachFehler === "function") {
    nachFehler();
  }
}

// =============================================================================
// Zahlen und Texte
// =============================================================================
function tausender(v) {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function fSig(v, stellen) {
  if (!isFinite(v)) {
    return "∞";
  }
  if (v === 0) {
    return "0";
  }
  const s = Math.abs(v) >= 1e5 ? tausender(v) : Number(v.toPrecision(stellen || 3)).toString();
  return s.replace("-", "−");
}

// feste Nachkommastellen, Minus als echtes Minuszeichen
function fFix(v, stellen) {
  if (!isFinite(v)) {
    return "∞";
  }
  return v.toFixed(stellen).replace("-", "−");
}

// deutsches Komma für Wahrscheinlichkeiten in Erklärtexten
function fKomma(v, stellen) {
  return fFix(v, stellen).replace(".", ",");
}

function prozent(v, stellen) {
  if (!isFinite(v)) {
    return "–";
  }
  return (v * 100).toFixed(stellen === undefined ? 1 : stellen).replace(".", ",") + " %";
}

function umbrechen(txt, maxBreite) {
  const zeilen = [];
  for (const absatz of String(txt).split("\n")) {
    const woerter = absatz.split(" ");
    let akt = "";
    for (const wort of woerter) {
      const probe = akt ? akt + " " + wort : wort;
      if (textWidth(probe) > maxBreite && akt) {
        zeilen.push(akt);
        akt = wort;
      } else {
        akt = probe;
      }
    }
    zeilen.push(akt);
  }
  return zeilen;
}

function zeigeHinweis(text) {
  hinweis = { text, t0: millis() };
}

function hinweisAktiv() {
  return hinweis && millis() - hinweis.t0 < 3800;
}

function weich(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Zufallsgenerator mit festem Startwert: der Datensatz ist bei jedem Start gleich
function zufallsGenerator(startwert) {
  let a = startwert >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// normalverteilte Zufallszahl (Box-Muller-Verfahren)
function gaussZahl(rnd) {
  let u = 0;
  while (u === 0) {
    u = rnd();
  }
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function begrenzen(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// =============================================================================
// Zeichnen – Grundlagen
// =============================================================================
function mausX() {
  return mouseX / S;
}

function mausY() {
  return mouseY / S - LEISTE;
}

function gestrichelt(an) {
  drawingContext.setLineDash(an ? [6, 5] : []);
}

function clipRechteck(x, y, w, h) {
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, w, h);
  drawingContext.clip();
}

function clipEnde() {
  drawingContext.restore();
}

// Karte im Stil der Schule: weiße Fläche, feine Linie, Titel mit rotem Punkt
function panel(p) {
  noStroke();
  fill(...FARBE.schatten, 10);
  rect(p.x + 1, p.y + 3, p.w, p.h, 12);
  fill(...FARBE.flaeche);
  stroke(...FARBE.linie);
  strokeWeight(1);
  rect(p.x, p.y, p.w, p.h, 12);
  stroke(...FARBE.linie);
  line(p.x + 12, p.y + KOPF_H, p.x + p.w - 12, p.y + KOPF_H);
  if (p.titel) {
    noStroke();
    fill(...FARBE.akzentHell);
    circle(p.x + 19, p.y + KOPF_H / 2 + 1, 7);
    fill(...FARBE.text);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(16);
    textAlign(LEFT, CENTER);
    text(p.titel, p.x + 30, p.y + KOPF_H / 2 + 1);
    textStyle(NORMAL);
  }
}

function leerText(p, s) {
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(CENTER, CENTER);
  text(s, p.x + p.w / 2, p.y + KOPF_H + (p.h - KOPF_H) / 2);
}

// kleine beschriftete Marke mit Rahmen (z. B. an einem Punkt im Diagramm)
function marke(s, x, y, farbe, ausrichtung) {
  textFont(MONO);
  textSize(12);
  textStyle(BOLD);
  const w = textWidth(s) + 12;
  const lx = ausrichtung === RIGHT ? x - w : ausrichtung === CENTER ? x - w / 2 : x;
  fill(...FARBE.flaeche, 240);
  stroke(...farbe);
  strokeWeight(1.2);
  rect(lx, y - 10, w, 20, 6);
  noStroke();
  fill(...farbe);
  textAlign(CENTER, CENTER);
  text(s, lx + w / 2, y);
  textStyle(NORMAL);
}

// dunkles Banner oben mittig in einer Fläche (Handlungsaufforderung)
function banner(s, cx, y, rot) {
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(14);
  const b = textWidth(s) + 28;
  noStroke();
  fill(...(rot ? [...FARBE.akzent, 235] : [...FARBE.dunkelFlaeche, 225]));
  rect(cx - b / 2, y, b, 32, 16);
  fill(255);
  textAlign(CENTER, CENTER);
  text(s, cx, y + 16);
  textStyle(NORMAL);
}

// Tooltip am Mauszeiger (eine oder mehrere Zeilen)
function tooltip(zeilen) {
  if (!zeilen || zeilen.length === 0) {
    return;
  }
  if (typeof zeilen === "string") {
    zeilen = [zeilen];
  }
  textFont(SCHRIFT);
  textSize(13);
  let w = 0;
  for (const z of zeilen) {
    w = Math.max(w, textWidth(z));
  }
  w += 18;
  const h = 10 + zeilen.length * 17;
  const mx = mausX();
  const my = mausY();
  const tx = Math.min(mx + 14, W - w - 10);
  const ty = Math.min(my + 14, H_INHALT - h - 6);
  noStroke();
  fill(...FARBE.dunkelFlaeche, 235);
  rect(tx, ty, w, h, 6);
  fill(255);
  textAlign(LEFT, CENTER);
  for (let i = 0; i < zeilen.length; i++) {
    text(zeilen[i], tx + 9, ty + 13 + i * 17);
  }
}

// Mehrzeiliger Text in einem Panel: Fließtext oben, Formeln (Monospace) darunter
function zeichneErklaerText(p, e, platzUnten) {
  let ty = p.y + KOPF_H + 10;
  const unten = p.y + p.h - (platzUnten || 50);
  noStroke();
  textAlign(LEFT, TOP);
  textFont(SCHRIFT);
  textSize(14);
  if (hinweisAktiv()) {
    fill(...FARBE.akzent);
    textStyle(BOLD);
    for (const z of umbrechen(hinweis.text, p.w - 32)) {
      text(z, p.x + 16, ty);
      ty += 18;
    }
    textStyle(NORMAL);
  } else {
    fill(...FARBE.grau);
    for (const z of umbrechen(e.text, p.w - 32).slice(0, e.zeilen || 4)) {
      text(z, p.x + 16, ty);
      ty += 18;
    }
  }
  ty += 6;
  textFont(MONO);
  textSize(13);
  fill(...FARBE.text);
  for (const f of e.formeln || []) {
    if (ty + 15 > unten) {
      break;
    }
    text(f, p.x + 16, ty);
    ty += 16;
  }
}

// =============================================================================
// Kopfzeile und Beispiel-Leiste
// =============================================================================
function zeichneKopf() {
  noStroke();
  fill(...FARBE.flaeche);
  rect(0, 0, W, 56);
  stroke(...FARBE.linie);
  strokeWeight(1);
  line(0, 56, W, 56);

  // Trenner zwischen Logo und Titel: Punkt und Strich wie im Logo
  noStroke();
  fill(...FARBE.akzentHell);
  circle(160, 28, 6);
  stroke(...FARBE.akzentHell);
  strokeWeight(3);
  line(170, 34, 180, 22);

  noStroke();
  fill(...FARBE.text);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(21);
  textAlign(LEFT, CENTER);
  text(APP_TITEL, 194, 21);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(13);
  fill(...FARBE.blass);
  text(SZ.untertitel, 194, 41);
}

// Beispiel-Leiste: hellrot hinterlegt, links „Beispiel“, daneben ein Reiter je
// Beispiel (HTML-Knöpfe, siehe ui.js). Gleiches Schema in allen PW-Programmen.
function zeichneBeispielLeiste() {
  noStroke();
  fill(...FARBE.akzentFlaeche);
  rect(0, 56, W, LEISTE);
  stroke(...FARBE.akzentLinie);
  strokeWeight(1);
  line(0, 56 + LEISTE, W, 56 + LEISTE);
  noStroke();
  fill(...FARBE.akzent);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(LEFT, CENTER);
  text("Beispiel", 26, 56 + LEISTE / 2);
  textStyle(NORMAL);
  stroke(...FARBE.akzent);
  strokeWeight(2);
  const px = 26 + textWidth("Beispiel") + 10;
  const py = 56 + LEISTE / 2;
  line(px, py - 5, px + 5, py);
  line(px + 5, py, px, py + 5);
  noStroke();
}

function zeichneStatusZeile(s) {
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(LEFT, CENTER);
  text(s, 26, 70);
}

function zeichneFehlerMeldung() {
  if (!fehlerMeldung || millis() - fehlerMeldung.t0 > 8000) {
    return;
  }
  const s = "Interner Fehler: " + fehlerMeldung.text + "  (Details in der Konsole)";
  textFont(SCHRIFT);
  textSize(14);
  const b = textWidth(s) + 30;
  noStroke();
  fill(...FARBE.akzent, 240);
  rect(W / 2 - b / 2, 62, b, 30, 6);
  fill(255);
  textAlign(CENTER, CENTER);
  text(s, W / 2, 77);
}

// Rahmen für alle Programme: Kopf, Leiste, dann der Inhalt (um LEISTE verschoben)
function zeichneRahmen(inhalt) {
  background(...FARBE.papier);
  push();
  scale(S);
  zeichneKopf();
  zeichneBeispielLeiste();
  push();
  translate(0, LEISTE);
  inhalt();
  zeichneFehlerMeldung();
  pop();
  pop();
}

// =============================================================================
// HTML-Bedienelemente über der Zeichenfläche
// =============================================================================
//  Alle Positionen werden im logischen 1600×900-Raster angegeben und beim
//  Ändern der Fenstergröße mitskaliert (siehe layoutUi).
const ui = {};
const uiPositionen = [];
let huelle;

function erstelleHuelle() {
  huelle = createDiv();
  huelle.addClass("huelle");
  ui.logo = platziere(createImg(logoPfad(), "Logo der Jakob-Preh-Schule"), 14, 3, 122, "logo");
  erstelleFarbschemaKnopf();
}

// --- Schalter hell/dunkel rechts in der Kopfzeile (gleich in allen LS) --------
const SYMBOL_MOND =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
const SYMBOL_SONNE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>';

function logoPfad() {
  return dunkelModus ? "assets/logo-jps-hell.png" : "assets/logo-jps.png";
}

function erstelleFarbschemaKnopf() {
  ui.farbschema = platziere(createButton(""), 1544, 12, 32, "kopf", "farbschema");
  ui.farbschema.mousePressed(() => {
    wechsleFarbschema();
    ui.farbschema.elt.blur();
  });
  aktualisiereFarbschemaKnopf();
}

function aktualisiereFarbschemaKnopf() {
  if (ui.logo) {
    ui.logo.elt.src = logoPfad();
  }
  if (!ui.farbschema) {
    return;
  }
  ui.farbschema.html(dunkelModus ? SYMBOL_SONNE : SYMBOL_MOND);
  const titel = dunkelModus ? "Zum hellen Farbschema wechseln" : "Zum dunklen Farbschema wechseln";
  ui.farbschema.attribute("title", titel);
  ui.farbschema.attribute("aria-label", titel);
}

function wechsleFarbschema() {
  setzeFarbschema(!dunkelModus);
  try {
    localStorage.setItem(FARBSCHEMA_SCHLUESSEL, dunkelModus ? "dunkel" : "hell");
  } catch (e) {
    // ohne Speicher gilt die Wahl nur bis zum Neuladen
  }
  aktualisiereFarbschemaKnopf();
}

function platziere(el, x, y, w, ...klassen) {
  el.addClass("ui");
  for (const k of klassen) {
    el.addClass(k);
  }
  el.parent(huelle);
  uiPositionen.push({ el, x, y, w });
  return el;
}

function layoutUi() {
  if (!huelle) {
    return;
  }
  huelle.style("width", width + "px");
  huelle.style("font-size", 15 * S + "px");
  for (const p of uiPositionen) {
    // alles unterhalb der Kopfzeile rutscht um die Beispiel-Leiste nach unten
    const y = p.y >= 56 && !p.el.hasClass("beispiel") ? p.y + LEISTE : p.y;
    p.el.position(p.x * S, y * S);
    if (p.w) {
      p.el.style("width", p.w * S + "px");
    }
  }
}

// Beispiel-Leiste: ein Reiter je Beispiel (Reihenfolge wie in daten.js)
function erstelleBeispielReiter(beimKlick) {
  ui.beispiele = {};
  let bx = 128;
  Object.keys(SZENARIEN).forEach((id, i) => {
    const text = `${i + 1} · ${SZENARIEN[id].name}`;
    const b = 34 + text.length * 8.6;
    ui.beispiele[id] = platziere(createButton(text), bx, 63, b, "beispiel");
    ui.beispiele[id].attribute("title", "Beispiel wechseln (neue Daten, Verfahren startet neu)");
    ui.beispiele[id].mousePressed(() => {
      beimKlick(id);
      ui.beispiele[id].elt.blur();
    });
    bx += b + 10;
  });
}

function aktualisiereBeispielReiter(aktivId, gesperrt) {
  for (const id of Object.keys(ui.beispiele)) {
    klasse(ui.beispiele[id], "aktiv", id === aktivId);
    sperre(ui.beispiele[id], gesperrt && id !== aktivId);
    ui.beispiele[id].attribute("aria-pressed", id === aktivId ? "true" : "false");
  }
}

// Nach dem Anklicken den Fokus abgeben, damit die Tasten wieder wirken
function fokusWeg(el) {
  const inp = el.elt.querySelector ? el.elt.querySelector("input, select") : null;
  (inp || el.elt).blur();
}

// --- kleine Helfer, damit das DOM nur bei echten Änderungen angefasst wird ---
function beschrifte(el, html) {
  if (el._html !== html) {
    el.html(html);
    el._html = html;
  }
}

function sperre(el, gesperrt) {
  if (el.elt.disabled !== gesperrt) {
    el.elt.disabled = gesperrt;
  }
  const inp = el.elt.querySelector ? el.elt.querySelector("input") : null;
  if (inp && inp.disabled !== gesperrt) {
    inp.disabled = gesperrt;
  }
}

function klasse(el, name, an) {
  if (an) {
    el.addClass(name);
  } else {
    el.removeClass(name);
  }
}

function auswahl(x, y, w, optionen, wert, beiAenderung) {
  const el = platziere(createSelect(), x, y, w);
  for (const [text, v] of optionen) {
    el.option(text, v);
  }
  el.selected(String(wert));
  el.changed(() => {
    beiAenderung(el.value());
    el.elt.blur();
  });
  return el;
}

function kaestchen(x, y, w, text, wert, beiAenderung) {
  const el = platziere(createCheckbox(" " + text, wert), x, y, w);
  el.changed(() => {
    beiAenderung(el.checked());
    fokusWeg(el);
  });
  return el;
}

function knopf(x, y, w, text, beimKlick, ...klassen) {
  const el = platziere(createButton(text), x, y, w, ...klassen);
  el.mousePressed(() => {
    if (!el.elt.disabled) {
      beimKlick();
    }
  });
  return el;
}

// Tasten nicht abfangen, wenn eine Auswahlliste oder ein Textfeld den Fokus hat
function tastaturFrei() {
  const el = document.activeElement;
  return !(el && (el.tagName === "SELECT" || el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && !["checkbox", "range", "button", "file"].includes(el.type))));
}

// =============================================================================
// Datei herunterladen (CSV zur Weiterarbeit in Python, Orange oder Excel)
// =============================================================================
function ladeHerunter(dateiname, inhalt) {
  const blob = new Blob([inhalt], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
