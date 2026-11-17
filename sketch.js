// =============================================================================
//  KI-Klassifikation · k-nächste Nachbarn (kNN)
//  Ein neuer Punkt bekommt die Klasse, die unter seinen k nächsten Nachbarn
//  am häufigsten vorkommt – vier Beispiele zur Auswahl:
//    - Skript 5.1: Sportart aus Körpergröße und Gewicht (David und Alex)
//    - Sortierstation: Farbsensor → rot, schwarz oder silber (3 Klassen)
//    - Motor: Drehzahl und Schwingung → i. O., Unwucht, Lagerschaden
//    - Bohrung: Positionsabweichung → i. O. / n. i. O. (Toleranzkreis)
// =============================================================================
//
//  Dateien
//    basis.js        gemeinsame Grundlage (Layout, Farben, Kopfzeile, UI-Helfer)
//    daten.js        Daten der vier Beispiele
//    knn.js          der Algorithmus (Abstand, Sortieren, Abstimmen, Leave-one-out)
//    ui.js           Knöpfe, Regler, Auswahllisten
//    sketch.js       Ablauf, Zeichnen, Erklärungen (diese Datei)
//
//  Ablauf in vier Schritten
//    ① Abstände berechnen  ② sortieren  ③ k nächste wählen  ④ abstimmen
//
//  Bedienung
//    →         nächster Schritt
//    Leertaste automatisch ablaufen lassen / anhalten
//    R         neu starten
//    Ziehen    die Anfrage (Raute) mit der Maus verschieben
//    Klick     ins Diagramm: aktive Anfrage dorthin setzen
//    Tab       zwischen mehreren Anfragen wechseln (z. B. David ↔ Alex)
// =============================================================================

const APP_TITEL = "KI-Klassifikation";

const P_DATEN = { x: 24, y: 84, w: 820, h: 800, titel: "" };
const P_ERKL = { x: 860, y: 84, w: 716, h: 244, titel: "" };
const P_EINST = { x: 860, y: 344, w: 716, h: 132, titel: "Einstellungen" };
const P_TAB = { x: 860, y: 492, w: 716, h: 184, titel: "" };
const P_KURVE = { x: 860, y: 692, w: 350, h: 192, titel: "Fehlerrate je k (Leave-one-out)" };
const P_KONF = { x: 1226, y: 692, w: 350, h: 192, titel: "" };

const PLOT = { x: 104, y: 134, w: 700, h: 612 };
const ZELLE = 6; // Kantenlänge einer Zelle der Entscheidungsfläche (Pixel)
const SCHRITT_PAUSE = { langsam: 2600, mittel: 1500, schnell: 650 };

// -----------------------------------------------------------------------------
// Zustand
// -----------------------------------------------------------------------------
let szenario = "skript";
let startwert = 0;
let basisDaten = [];
let daten = [];
let anfragen = [];
let aktiv = 0; // Index der aktiven Anfrage

let kWert = 3;
let metrik = "euklid";
let skalieren = false;
let tempo = "mittel";

let stufe = 0; // 0 leer · 1 Abstände · 2 sortiert · 3 k nächste · 4 abgestimmt
let laufAuto = false;
let letzterSchritt = 0;

let flaecheAn = false;
let ausreisserAn = false;
let alleLinienAn = false;

let ziehen = -1; // Index der gezogenen Anfrage

// Zwischenspeicher (werden nur bei Änderungen neu berechnet)
let flaecheBild = null;
let flaecheSchluessel = "";
let loo = null;
let looSchluessel = "";

// =============================================================================
// Start
// =============================================================================
function setup() {
  ladeSchriften();
  const [cw, ch] = zeichenflaeche();
  cnv = createCanvas(cw, ch);
  S = width / W;

  szenarioLaden("skript");
  erstelleUi();
  cnv.parent(huelle);
  layoutUi();
}

function nachFehler() {
  laufAuto = false;
  ziehen = -1;
}

// =============================================================================
// Hauptschleife
// =============================================================================
function draw() {
  try {
    logik();
    zeichneRahmen(() => {
      zeichneStatusZeile(statusText());
      zeichneDatenPanel();
      zeichneErklaerung();
      zeichneEinstellungen();
      zeichneTabelle();
      zeichneFehlerKurve();
      zeichneKonfusion();
      zeichneTooltip();
    });
    aktualisiereUi();
  } catch (err) {
    behandleFehler(err);
  }
}

function logik() {
  kWert = constrain(kWert, 1, kMax());
  if (laufAuto && millis() - letzterSchritt > SCHRITT_PAUSE[tempo]) {
    schritt();
  }
  if (stufe >= 4) {
    laufAuto = false;
  }
}

// =============================================================================
// Daten und Ablauf
// =============================================================================
function szenarioLaden(id) {
  szenario = id;
  setzeSzenario(id);
  startwert = SZ.startwert || 0;
  basisDaten = erzeugeDaten(startwert);
  anfragen = SZ.anfragen.map((a) => ({ name: a.name, x: a.x, y: a.y }));
  aktiv = 0;
  kWert = 3;
  datenZusammenstellen();
  neuStarten();
}

function szenarioWechseln(id) {
  if (laufAuto || id === szenario) {
    return;
  }
  szenarioLaden(id);
}

function neueMessdaten() {
  if (SZ.fest) {
    zeigeHinweis("Das Skript-Beispiel hat feste Daten. Für zufällige Messdaten ein anderes Beispiel wählen.");
    return;
  }
  startwert = Math.floor(Math.random() * 1e9);
  basisDaten = erzeugeDaten(startwert);
  datenZusammenstellen();
  neuStarten();
}

function datenZusammenstellen() {
  daten = ausreisserAn ? basisDaten.concat(ausreisserPunkte()) : basisDaten.slice();
}

function neuStarten() {
  laufAuto = false;
  stufe = 0;
}

function schritt() {
  letzterSchritt = millis();
  if (stufe < 4) {
    stufe++;
  }
}

function autoUmschalten() {
  if (laufAuto) {
    laufAuto = false;
    return;
  }
  if (stufe >= 4) {
    return;
  }
  laufAuto = true;
  letzterSchritt = millis() - SCHRITT_PAUSE[tempo] + 300;
}

function kMax() {
  return Math.max(1, Math.min(25, daten.length - 1));
}

function optionen() {
  return { metrik, skalieren, skala: berechneSkala(daten) };
}

function anzahlKlassen() {
  return SZ.klassen.length;
}

function anfrage() {
  return anfragen[aktiv];
}

// Ergebnis für die aktive Anfrage (sortierte Liste und Abstimmung)
function ergebnis() {
  const sortiert = sortiereNachAbstand(daten, anfrage(), optionen());
  return { sortiert, wahl: abstimmen(sortiert, kWert, anzahlKlassen()) };
}

function looErgebnis() {
  const schluessel = [szenario, startwert, ausreisserAn, metrik, skalieren, daten.length].join("|");
  if (schluessel !== looSchluessel) {
    loo = leaveOneOut(daten, kMax(), optionen(), anzahlKlassen());
    looSchluessel = schluessel;
  }
  return loo;
}

// =============================================================================
// Zahlen
// =============================================================================
function fAbstand(d) {
  if (skalieren) {
    return fFix(d, 3);
  }
  return d >= 100 ? fFix(d, 0) : fFix(d, d >= 10 ? 1 : 2);
}

function fWert(v, m) {
  return fFix(v, m.stellen);
}

function klassenName(k) {
  return SZ.klassen[k].name;
}

function statusText() {
  const r = looErgebnis();
  return (
    `${daten.length} ${SZ.wort.mehrzahl} mit bekannter Klasse${ausreisserAn ? ` (davon ${SZ.ausreisser.length} Ausreißer)` : ""} · k = ${kWert} · ` +
    `${metrik === "euklid" ? "euklidischer Abstand" : "Manhattan-Abstand"} · ${skalieren ? "skaliert" : "unskaliert"} · ` +
    `Fehlerrate (Leave-one-out) ${prozent(r.rate[kWert], 0)}`
  );
}

// Unterscheiden sich die Zahlenbereiche der Merkmale stark? (→ Skalierung nötig)
function bereicheSehrVerschieden() {
  const s = berechneSkala(daten);
  const v = s.rx / s.ry;
  return v > 8 || v < 1 / 8;
}

// =============================================================================
// Diagramm – Umrechnung
// =============================================================================
function zuPlot(x, y) {
  const [m1, m2] = MERKMALE;
  return [PLOT.x + ((x - m1.min) / (m1.max - m1.min)) * PLOT.w, PLOT.y + PLOT.h - ((y - m2.min) / (m2.max - m2.min)) * PLOT.h];
}

function ausPlot(px, py) {
  const [m1, m2] = MERKMALE;
  const x = m1.min + ((px - PLOT.x) / PLOT.w) * (m1.max - m1.min);
  const y = m2.min + ((PLOT.y + PLOT.h - py) / PLOT.h) * (m2.max - m2.min);
  return { x: constrain(x, m1.min, m1.max), y: constrain(y, m2.min, m2.max) };
}

function imPlot(px, py) {
  return px >= PLOT.x && px <= PLOT.x + PLOT.w && py >= PLOT.y && py <= PLOT.y + PLOT.h;
}

function anfrageUnterMaus() {
  for (let i = anfragen.length - 1; i >= 0; i--) {
    const [px, py] = zuPlot(anfragen[i].x, anfragen[i].y);
    if (dist(mausX(), mausY(), px, py) < 16) {
      return i;
    }
  }
  return -1;
}

function punktUnterMaus() {
  const mx = mausX();
  const my = mausY();
  if (!imPlot(mx, my)) {
    return null;
  }
  let bester = null;
  let besterAbstand = 9;
  for (const p of daten) {
    const [px, py] = zuPlot(p.x, p.y);
    const d = dist(mx, my, px, py);
    if (d < besterAbstand) {
      besterAbstand = d;
      bester = p;
    }
  }
  return bester;
}

// =============================================================================
// Zeichnen – Formen
// =============================================================================
function zeichneForm(form, px, py, r) {
  if (form === "dreieck") {
    triangle(px, py - r * 1.15, px + r, py + r * 0.7, px - r, py + r * 0.7);
  } else if (form === "quadrat") {
    rectMode(CENTER);
    rect(px, py, r * 1.6, r * 1.6, 2);
    rectMode(CORNER);
  } else {
    circle(px, py, r * 2);
  }
}

function zeichneDatenpunkt(p, px, py, alpha, gross) {
  const kl = SZ.klassen[p.k];
  stroke(...FARBE.flaeche);
  strokeWeight(1.4);
  fill(kl.farbe[0], kl.farbe[1], kl.farbe[2], alpha);
  zeichneForm(kl.form, px, py, gross ? 8 : 6.5);
  if (p.ausreisser) {
    noFill();
    stroke(...FARBE.senf);
    strokeWeight(2.2);
    circle(px, py, 24);
  }
}

function zeichneAnfrage(a, px, py, istAktiv, klasse) {
  const r = istAktiv ? 13 : 10;
  noStroke();
  fill(...FARBE.schatten, 40);
  quad(px + 1, py - r + 2, px + r + 1, py + 2, px + 1, py + r + 2, px - r + 1, py + 2);
  if (klasse !== null) {
    const f = SZ.klassen[klasse].farbe;
    fill(...f);
  } else {
    fill(...FARBE.flaeche);
  }
  stroke(...FARBE.text);
  strokeWeight(istAktiv ? 3 : 2);
  quad(px, py - r, px + r, py, px, py + r, px - r, py);
  noStroke();
  fill(...FARBE.text);
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(13);
  textAlign(LEFT, BOTTOM);
  const txt = klasse !== null ? `${a.name} → ${klassenName(klasse)}` : a.name + " ?";
  text(txt, px + r + 4, py - 4);
  textStyle(NORMAL);
}

// Umriss "alle Punkte mit Abstand ≤ r" um die Anfrage (Kreis, Ellipse oder Raute)
function zeichneNachbarRand(a, r) {
  const opt = optionen();
  const [m1, m2] = MERKMALE;
  const fx = (opt.skalieren ? opt.skala.rx : 1) * (PLOT.w / (m1.max - m1.min));
  const fy = (opt.skalieren ? opt.skala.ry : 1) * (PLOT.h / (m2.max - m2.min));
  const [cx, cy] = zuPlot(a.x, a.y);
  beginShape();
  for (let i = 0; i <= 72; i++) {
    const w = (i / 72) * TWO_PI;
    let dx = Math.cos(w);
    let dy = Math.sin(w);
    if (metrik === "manhattan") {
      const s = Math.abs(dx) + Math.abs(dy);
      dx /= s;
      dy /= s;
    }
    vertex(cx + dx * r * fx, cy - dy * r * fy);
  }
  endShape(CLOSE);
}

// =============================================================================
// Entscheidungsfläche (wird zwischengespeichert)
// =============================================================================
function aktualisiereFlaeche() {
  const schluessel = [szenario, startwert, ausreisserAn, metrik, skalieren, kWert, daten.length].join("|");
  if (schluessel === flaecheSchluessel && flaecheBild) {
    return;
  }
  const nx = Math.ceil(PLOT.w / ZELLE);
  const ny = Math.ceil(PLOT.h / ZELLE);
  if (!flaecheBild) {
    flaecheBild = createGraphics(nx, ny);
    flaecheBild.pixelDensity(1);
  }
  const g = flaecheBild;
  g.clear();
  g.noStroke();
  const opt = optionen();
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const q = ausPlot(PLOT.x + (i + 0.5) * ZELLE, PLOT.y + (j + 0.5) * ZELLE);
      const k = klassifiziere(daten, q, kWert, opt, anzahlKlassen());
      const f = SZ.klassen[k].farbe;
      g.fill(f[0], f[1], f[2], 52);
      g.rect(i, j, 1, 1);
    }
  }
  flaecheSchluessel = schluessel;
}

// =============================================================================
// Datenfeld
// =============================================================================
function zeichneDatenPanel() {
  P_DATEN.titel = SZ.titel;
  panel(P_DATEN);
  zeichneLegende();

  const [m1, m2] = MERKMALE;
  const a = anfrage();
  const { sortiert, wahl } = ergebnis();
  const rang = new Map();
  sortiert.forEach((e, i) => rang.set(e.p, i + 1));

  stroke(...FARBE.linie);
  strokeWeight(1);
  fill(...FARBE.papier);
  rect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);

  clipRechteck(PLOT.x, PLOT.y, PLOT.w, PLOT.h);

  if (flaecheAn) {
    aktualisiereFlaeche();
    drawingContext.imageSmoothingEnabled = false;
    image(flaecheBild, PLOT.x, PLOT.y, Math.ceil(PLOT.w / ZELLE) * ZELLE, Math.ceil(PLOT.h / ZELLE) * ZELLE);
    drawingContext.imageSmoothingEnabled = true;
  }

  // Gitter
  const anzX = Math.round((m1.max - m1.min) / m1.gitter);
  const anzY = Math.round((m2.max - m2.min) / m2.gitter);
  stroke(...FARBE.text, 22);
  strokeWeight(1);
  for (let i = 0; i <= anzX; i++) {
    const [gx] = zuPlot(m1.min + i * m1.gitter, m2.min);
    line(gx, PLOT.y, gx, PLOT.y + PLOT.h);
  }
  for (let i = 0; i <= anzY; i++) {
    const [, gy] = zuPlot(m1.min, m2.min + i * m2.gitter);
    line(PLOT.x, gy, PLOT.x + PLOT.w, gy);
  }
  // Toleranzkreis (nur Bohrungs-Beispiel, zur Orientierung)
  if (SZ.kreis) {
    const [cx, cy] = zuPlot(0, 0);
    noFill();
    stroke(...FARBE.blass);
    strokeWeight(1.2);
    gestrichelt(true);
    ellipse(cx, cy, (2 * SZ.kreis.r * PLOT.w) / (m1.max - m1.min), (2 * SZ.kreis.r * PLOT.h) / (m2.max - m2.min));
    gestrichelt(false);
  }

  const [ax, ay] = zuPlot(a.x, a.y);

  // ① Linien zu allen Punkten
  if (stufe >= 1 && (stufe < 3 || alleLinienAn)) {
    for (const e of sortiert) {
      const [px, py] = zuPlot(e.p.x, e.p.y);
      const r = rang.get(e.p);
      const stark = stufe === 2 && r <= 10 ? map(r, 1, 10, 150, 60) : 45;
      stroke(...FARBE.text, stark);
      strokeWeight(stufe === 2 && r <= 10 ? 1.4 : 1);
      line(ax, ay, px, py);
    }
  }

  // ③ Rand der Nachbarschaft und Linien zu den k nächsten
  if (stufe >= 3) {
    const rk = wahl.nachbarn[wahl.nachbarn.length - 1].d;
    const f = stufe >= 4 ? SZ.klassen[wahl.sieger].farbe : FARBE.text;
    fill(f[0], f[1], f[2], 18);
    stroke(f[0], f[1], f[2], 160);
    strokeWeight(1.5);
    gestrichelt(true);
    zeichneNachbarRand(a, rk);
    gestrichelt(false);
    for (const n of wahl.nachbarn) {
      const [px, py] = zuPlot(n.p.x, n.p.y);
      const kf = SZ.klassen[n.p.k].farbe;
      stroke(kf[0], kf[1], kf[2], 230);
      strokeWeight(2.4);
      line(ax, ay, px, py);
    }
  }

  // Punkte
  const nachbarSet = new Set(wahl.nachbarn.map((n) => n.p));
  for (const p of daten) {
    const [px, py] = zuPlot(p.x, p.y);
    const istNachbar = stufe >= 3 && nachbarSet.has(p);
    const alpha = stufe >= 3 && !istNachbar ? 110 : 235;
    zeichneDatenpunkt(p, px, py, alpha, istNachbar);
  }

  // ② Rangnummern der ersten Punkte
  if (stufe === 2 || stufe === 3) {
    const bis = stufe === 2 ? Math.min(10, sortiert.length) : wahl.nachbarn.length;
    for (let i = 0; i < bis; i++) {
      const [px, py] = zuPlot(sortiert[i].p.x, sortiert[i].p.y);
      noStroke();
      fill(...FARBE.text);
      circle(px + 11, py - 11, 16);
      fill(...FARBE.textInvers);
      textFont(MONO);
      textStyle(BOLD);
      textSize(10);
      textAlign(CENTER, CENTER);
      text(String(i + 1), px + 11, py - 11);
      textStyle(NORMAL);
    }
  }

  // Anfragen
  for (let i = 0; i < anfragen.length; i++) {
    const [px, py] = zuPlot(anfragen[i].x, anfragen[i].y);
    let kl = null;
    if (stufe >= 4) {
      kl = i === aktiv ? wahl.sieger : klassifiziere(daten, anfragen[i], kWert, optionen(), anzahlKlassen());
    }
    zeichneAnfrage(anfragen[i], px, py, i === aktiv, kl);
  }

  clipEnde();

  // Achsen
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(12);
  for (let i = 0; i <= anzX; i++) {
    const v = m1.min + i * m1.gitter;
    const [gx] = zuPlot(v, m2.min);
    textAlign(CENTER, TOP);
    text(Number(v.toFixed(3)).toString(), gx, PLOT.y + PLOT.h + 6);
  }
  for (let i = 0; i <= anzY; i++) {
    const v = m2.min + i * m2.gitter;
    const [, gy] = zuPlot(m1.min, v);
    textAlign(RIGHT, CENTER);
    text(Number(v.toFixed(3)).toString(), PLOT.x - 6, gy);
  }
  fill(...FARBE.text);
  textStyle(BOLD);
  textSize(13);
  textAlign(CENTER, TOP);
  text(`${m1.name} in ${m1.einheit}`, PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 26);
  push();
  translate(P_DATEN.x + 18, PLOT.y + PLOT.h / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  text(`${m2.name} in ${m2.einheit}`, 0, 0);
  pop();
  textStyle(NORMAL);

  if (stufe === 0) {
    banner(`Wohin gehört ${a.name}? · mit → Schritt für Schritt klassifizieren`, PLOT.x + PLOT.w / 2, PLOT.y + 14, false);
  }

  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("Raute ziehen oder ins Diagramm klicken", 540, 838);
  text(anfragen.length > 1 ? "Tab: andere Anfrage · Maus auf Punkt: Abstand" : "Maus auf Punkt: Werte und Abstand", 540, 856);

  if (ziehen >= 0 || anfrageUnterMaus() >= 0) {
    cursor("grab");
  } else if (imPlot(mausX(), mausY())) {
    cursor(CROSS);
  } else {
    cursor(ARROW);
  }
}

function zeichneLegende() {
  textFont(SCHRIFT);
  textSize(12);
  const y = P_DATEN.y + 17;
  const eintraege = SZ.klassen.map((k, i) => ({ name: k.name, k: i }));
  eintraege.push({ name: "Anfrage", k: -1 });
  let breite = 0;
  for (const e of eintraege) {
    breite += textWidth(e.name) + 34;
  }
  let x = P_DATEN.x + P_DATEN.w - 16 - breite;
  for (const e of eintraege) {
    if (e.k >= 0) {
      zeichneDatenpunkt({ k: e.k }, x + 6, y, 235, false);
    } else {
      fill(...FARBE.flaeche);
      stroke(...FARBE.text);
      strokeWeight(2);
      quad(x + 6, y - 7, x + 13, y, x + 6, y + 7, x - 1, y);
    }
    noStroke();
    fill(...FARBE.text);
    textFont(SCHRIFT);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(e.name, x + 18, y + 1);
    x += textWidth(e.name) + 34;
  }
}

// =============================================================================
// Erklärfeld
// =============================================================================
function erklaerung() {
  const [m1, m2] = MERKMALE;
  const a = anfrage();
  const { sortiert, wahl } = ergebnis();
  const opt = optionen();
  const gross = opt.skala.rx > opt.skala.ry ? m1.name : m2.name;
  const klein = opt.skala.rx > opt.skala.ry ? m2.name : m1.name;
  const warnung = !skalieren && bereicheSehrVerschieden() ? ` Achtung: ${gross} hat viel größere Zahlen als ${klein} – ohne Skalierung bestimmt fast nur ${gross} den Abstand!` : "";

  if (stufe === 0) {
    return {
      titel: "k-nächste Nachbarn · Klassifikation ohne Formel",
      text:
        `kNN lernt keine Gleichung mit Parametern. Es merkt sich einfach alle ${daten.length} Trainingsdaten. Für eine neue Anfrage (Raute) ` +
        `wird geschaut, welche Klasse die k nächsten Nachbarn haben. k ist ein Hyperparameter – er wird vorgegeben, nicht gelernt.`,
      formeln: [
        "① Abstand zu jedem Trainingspunkt berechnen",
        "② Abstände der Größe nach sortieren",
        `③ die k = ${kWert} Punkte mit dem kleinsten Abstand nehmen`,
        "④ Mehrheitsentscheid: die häufigste Klasse gewinnt",
      ],
    };
  }
  if (stufe === 1) {
    const e = sortiert[0];
    const [qx, qy] = vektor(a, opt);
    const [px, py] = vektor(e.p, opt);
    const st = skalieren ? 3 : Math.max(m1.stellen, m2.stellen);
    const f = (v) => fFix(v, st);
    const formel =
      metrik === "manhattan"
        ? `d = |${f(qx)} − ${f(px)}| + |${f(qy)} − ${f(py)}| = ${fAbstand(e.d)}`
        : `d = √((${f(qx)} − ${f(px)})² + (${f(qy)} − ${f(py)})²) = ${fAbstand(e.d)}`;
    return {
      titel: "① Abstände zu allen Trainingspunkten",
      text: `Von ${a.name} aus wird der Abstand zu jedem der ${daten.length} Punkte berechnet – das kostet bei vielen Daten viel Rechenzeit.${warnung || (skalieren ? " Die Merkmale sind auf 0 … 1 skaliert." : "")}`,
      formeln: [
        metrik === "manhattan" ? "Manhattan:   d = |x₁ − x₂| + |y₁ − y₂|" : "euklidisch:  d = √((x₁ − x₂)² + (y₁ − y₂)²)",
        `Beispiel ${SZ.wort.einzahl} ${e.p.id}:`,
        formel,
      ],
    };
  }
  if (stufe === 2) {
    const zeilen = sortiert.slice(0, 3).map((e, i) => `Rang ${i + 1}:  d = ${fAbstand(e.d).padStart(7)}   ${klassenName(e.p.k)}`);
    return {
      titel: "② Nach dem Abstand sortieren",
      text: "Alle Abstände werden der Größe nach sortiert. Rang 1 ist der nächste Nachbar. Die Rangliste steht unten in der Tabelle.",
      formeln: zeilen,
    };
  }
  if (stufe === 3) {
    const rk = wahl.nachbarn[wahl.nachbarn.length - 1].d;
    return {
      titel: `③ Die k = ${kWert} nächsten Nachbarn`,
      text: `Nur die ersten ${kWert} der Rangliste zählen. Alle liegen innerhalb des gestrichelten Rands mit dem Abstand d = ${fAbstand(rk)}. ${metrik === "manhattan" ? "Beim Manhattan-Abstand ist dieser Rand eine Raute." : skalieren ? "Durch die Skalierung ist der Kreis im Diagramm verzerrt." : ""}`,
      formeln: [
        `Nachbarn: ${wahl.nachbarn
          .slice(0, 8)
          .map((n) => klassenName(n.p.k))
          .join(", ")}${wahl.nachbarn.length > 8 ? " …" : ""}`,
      ],
    };
  }
  const s = wahl.stimmen.map((n, i) => `${klassenName(i)}: ${n}`).join("   ");
  return {
    titel: `④ Mehrheitsentscheid → ${a.name} ist „${klassenName(wahl.sieger)}“`,
    text:
      `Die ${kWert} Nachbarn stimmen ab. ${wahl.gleichstand ? "Gleichstand! Dann entscheidet die Klasse des nächsten Nachbarn unter den Gleichen – darum wählt man bei 2 Klassen gern ein ungerades k. " : ""}` +
      "Jetzt k verändern, die Raute verschieben oder die Entscheidungsfläche einblenden.",
    formeln: [`Stimmen   ${s}`, `Ergebnis  ${klassenName(wahl.sieger)}`],
  };
}

function zeichneErklaerung() {
  const e = erklaerung();
  P_ERKL.titel = e.titel;
  panel(P_ERKL);
  zeichneErklaerText(P_ERKL, e);
}

function zeichneEinstellungen() {
  const p = P_EINST;
  panel(p);
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, TOP);
  let t;
  if (kWert === 1) {
    t = "k = 1: Jeder Punkt zählt allein – Ausreißer bekommen eigene Inseln (Überanpassung).";
  } else if (kWert >= Math.min(15, kMax())) {
    t = "Großes k: grobe Grenze, kleine Gruppen werden überstimmt (Unteranpassung) – und es dauert länger.";
  } else {
    t = "Tipp: Entscheidungsfläche einblenden und k von 1 bis 25 schieben. Wo ist die Grenze am sinnvollsten?";
  }
  text(t, p.x + 16, p.y + p.h - 22);
}

// =============================================================================
// Tabelle: Rangliste und Abstimmung
// =============================================================================
function zeichneTabelle() {
  const p = P_TAB;
  const a = anfrage();
  p.titel = `Rangliste für ${a.name} (k = ${kWert})`;
  panel(p);
  if (stufe < 2) {
    leerText(p, "Nach dem Sortieren steht hier die Rangliste:\nDer Punkt mit dem kleinsten Abstand hat Rang 1.");
    return;
  }
  const [m1, m2] = MERKMALE;
  const { sortiert, wahl } = ergebnis();
  const spalten = [
    { t: "Rang", x: 16, a: LEFT },
    { t: SZ.wort.einzahl, x: 64, a: LEFT },
    { t: `${m1.kurz} in ${m1.einheit}`, x: 258, a: RIGHT },
    { t: `${m2.kurz} in ${m2.einheit}`, x: 348, a: RIGHT },
    { t: "Abstand d", x: 430, a: RIGHT },
  ];
  let y = p.y + KOPF_H + 16;
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(11.5);
  for (const s of spalten) {
    textAlign(s.a, CENTER);
    text(s.t, p.x + s.x, y);
  }
  y += 18;
  const zeilen = 6;
  for (let i = 0; i < Math.min(zeilen, sortiert.length); i++) {
    const e = sortiert[i];
    const drin = stufe >= 3 && i < kWert;
    if (drin) {
      noStroke();
      fill(...FARBE.flaeche2);
      rect(p.x + 8, y - 9, 432, 18, 4);
    }
    const kl = SZ.klassen[e.p.k];
    noStroke();
    fill(...FARBE.text);
    textFont(MONO);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(String(i + 1), p.x + 16, y);
    fill(kl.farbe[0], kl.farbe[1], kl.farbe[2]);
    zeichneForm(kl.form, p.x + 70, y, 5);
    fill(...FARBE.text);
    textFont(SCHRIFT);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(`${e.p.id}${e.p.ausreisser ? " (Ausreißer)" : ""} · ${kl.name}`, p.x + 82, y);
    textFont(MONO);
    textAlign(RIGHT, CENTER);
    text(fWert(e.p.x, m1), p.x + 258, y);
    text(fWert(e.p.y, m2), p.x + 348, y);
    textStyle(drin ? BOLD : NORMAL);
    text(fAbstand(e.d), p.x + 430, y);
    textStyle(NORMAL);
    y += 18;
  }
  if (stufe >= 3 && kWert > zeilen) {
    fill(...FARBE.blass);
    textFont(SCHRIFT);
    textSize(11.5);
    textAlign(LEFT, CENTER);
    text(`… und ${kWert - zeilen} weitere Nachbarn`, p.x + 16, y);
  }

  // Abstimmung rechts
  const tx = p.x + 470;
  const tw = p.w - 470 - 16;
  stroke(...FARBE.linie);
  strokeWeight(1);
  line(tx - 14, p.y + KOPF_H + 10, tx - 14, p.y + p.h - 12);
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(11.5);
  textAlign(LEFT, CENTER);
  text("Abstimmung der k Nachbarn", tx, p.y + KOPF_H + 16);
  if (stufe < 3) {
    fill(...FARBE.grau);
    textSize(12);
    text("kommt in Schritt ③ und ④", tx, p.y + KOPF_H + 46);
    return;
  }
  let by = p.y + KOPF_H + 42;
  const max = Math.max(1, kWert);
  wahl.stimmen.forEach((n, i) => {
    const kl = SZ.klassen[i];
    fill(...FARBE.grau);
    textFont(SCHRIFT);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(kl.name, tx, by);
    fill(...FARBE.flaeche2);
    rect(tx, by + 9, tw - 30, 12, 4);
    fill(kl.farbe[0], kl.farbe[1], kl.farbe[2]);
    rect(tx, by + 9, ((tw - 30) * n) / max, 12, 4);
    fill(...FARBE.text);
    textFont(MONO);
    textStyle(stufe >= 4 && i === wahl.sieger ? BOLD : NORMAL);
    textAlign(RIGHT, CENTER);
    text(String(n), tx + tw, by + 15);
    textStyle(NORMAL);
    by += 38;
  });
}

// =============================================================================
// Fehlerrate je k (Leave-one-out)
// =============================================================================
function zeichneFehlerKurve() {
  const p = P_KURVE;
  panel(p);
  const r = looErgebnis();
  const km = kMax();
  const gx = p.x + 46;
  const gy = p.y + KOPF_H + 14;
  const gw = p.w - 62;
  const gh = p.h - KOPF_H - 68;
  let maxR = 0.05;
  let bestK = 1;
  for (let k = 1; k <= km; k++) {
    maxR = Math.max(maxR, r.rate[k]);
    if (r.rate[k] < r.rate[bestK]) {
      bestK = k;
    }
  }
  maxR = Math.min(1, maxR * 1.15);
  const bw = gw / km;
  for (let k = 1; k <= km; k++) {
    const h = (r.rate[k] / maxR) * gh;
    noStroke();
    if (k === kWert) {
      fill(...FARBE.akzent);
    } else if (k === bestK) {
      fill(...FARBE.gruen);
    } else {
      fill(...FARBE.neutral, 150);
    }
    rect(gx + (k - 1) * bw + 1, gy + gh - h, bw - 2, Math.max(1, h), 2);
  }
  stroke(...FARBE.blass);
  strokeWeight(1);
  line(gx, gy + gh, gx + gw, gy + gh);
  line(gx, gy, gx, gy + gh);
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(10.5);
  textAlign(RIGHT, CENTER);
  text(prozent(maxR, 0), gx - 4, gy + 4);
  text("0 %", gx - 4, gy + gh);
  textAlign(CENTER, TOP);
  for (const k of [1, 5, 10, 15, 20, 25]) {
    if (k <= km) {
      text(String(k), gx + (k - 0.5) * bw, gy + gh + 3);
    }
  }
  textAlign(LEFT, TOP);
  fill(...FARBE.blass);
  text("← Überanpassung", gx, gy + gh + 17);
  textAlign(RIGHT, TOP);
  text("Unteranpassung →", gx + gw, gy + gh + 17);
  textAlign(LEFT, CENTER);
  textSize(11.5);
  fill(...FARBE.akzent);
  textStyle(BOLD);
  text(`k = ${kWert}: ${prozent(r.rate[kWert], 1)} falsch`, p.x + 16, p.y + p.h - 11);
  textStyle(NORMAL);
  fill(...FARBE.gruen);
  textAlign(RIGHT, CENTER);
  text(`am besten: k = ${bestK}`, p.x + p.w - 16, p.y + p.h - 11);
}

// =============================================================================
// Konfusionsmatrix (Leave-one-out bei aktuellem k)
// =============================================================================
function zeichneKonfusion() {
  const p = P_KONF;
  p.titel = `Konfusionsmatrix · k = ${kWert}`;
  panel(p);
  const r = looErgebnis();
  const nk = anzahlKlassen();
  const m = [];
  for (let i = 0; i < nk; i++) {
    m.push(new Array(nk).fill(0));
  }
  let richtig = 0;
  daten.forEach((q, i) => {
    const v = r.vorhersagen[kWert][i];
    m[q.k][v]++;
    if (v === q.k) {
      richtig++;
    }
  });
  const zw = nk === 3 ? 58 : 62;
  const zh = nk === 3 ? 28 : 38;
  const x0 = p.x + (nk === 3 ? 112 : 120);
  const y0 = p.y + KOPF_H + 34;
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(10.5);
  textAlign(CENTER, BOTTOM);
  text("vorhergesagt", x0 + (zw * nk) / 2, y0 - 15);
  push();
  translate(p.x + 16, y0 + (zh * nk) / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text("tatsächlich", 0, 0);
  pop();
  for (let i = 0; i < nk; i++) {
    const kl = SZ.klassen[i];
    fill(kl.farbe[0], kl.farbe[1], kl.farbe[2]);
    textSize(10.5);
    textAlign(CENTER, BOTTOM);
    text(kurz(kl.name, nk === 3 ? 8 : 11), x0 + i * zw + zw / 2, y0 - 2);
    textAlign(RIGHT, CENTER);
    text(kurz(kl.name, 12), x0 - 6, y0 + i * zh + zh / 2);
  }
  for (let i = 0; i < nk; i++) {
    for (let j = 0; j < nk; j++) {
      const x = x0 + j * zw;
      const y = y0 + i * zh;
      stroke(...FARBE.linie);
      strokeWeight(1);
      fill(...(i === j ? FARBE.gruenFlaeche : m[i][j] > 0 ? FARBE.rotFlaeche : FARBE.papier));
      rect(x, y, zw, zh);
      noStroke();
      fill(...(i === j ? FARBE.gruen : m[i][j] > 0 ? FARBE.akzent : FARBE.blass));
      textFont(MONO);
      textStyle(BOLD);
      textSize(nk === 3 ? 13 : 16);
      textAlign(CENTER, CENTER);
      text(String(m[i][j]), x + zw / 2, y + zh / 2);
      textStyle(NORMAL);
    }
  }
  noStroke();
  fill(...FARBE.text);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`Genauigkeit: ${richtig} von ${daten.length} = ${prozent(richtig / daten.length, 1)}`, p.x + 16, p.y + p.h - 28);
  fill(...FARBE.blass);
  textSize(10.5);
  text("Jeder Punkt wird von den übrigen klassifiziert.", p.x + 16, p.y + p.h - 12);
}

function kurz(s, n) {
  n = n || 9;
  return s.length > n ? s.slice(0, n - 1) + "." : s;
}

// -----------------------------------------------------------------------------
// Tooltip
// -----------------------------------------------------------------------------
function zeichneTooltip() {
  if (ziehen >= 0) {
    return;
  }
  const [m1, m2] = MERKMALE;
  const i = anfrageUnterMaus();
  if (i >= 0) {
    const a = anfragen[i];
    tooltip([`${a.name} (Anfrage) · ${wertText(a.x, m1)} · ${wertText(a.y, m2)}`, i === aktiv ? "aktive Anfrage – ziehen zum Verschieben" : "Klick: diese Anfrage auswählen"]);
    return;
  }
  const p = punktUnterMaus();
  if (!p) {
    return;
  }
  const zeilen = [`${p.ausreisser ? "Ausreißer" : SZ.wort.einzahl + " " + p.id} · ${klassenName(p.k)} · ${wertText(p.x, m1)} · ${wertText(p.y, m2)}`];
  if (stufe >= 1) {
    const { sortiert } = ergebnis();
    const rang = sortiert.findIndex((e) => e.p === p) + 1;
    zeilen.push(`Abstand zu ${anfrage().name}: d = ${fAbstand(sortiert[rang - 1].d)}${stufe >= 2 ? ` · Rang ${rang}` : ""}${stufe >= 3 && rang <= kWert ? " · Nachbar ✓" : ""}`);
  }
  tooltip(zeilen);
}

// =============================================================================
// Eingaben
// =============================================================================
function mousePressed() {
  const i = anfrageUnterMaus();
  if (i >= 0) {
    aktiv = i;
    ziehen = i;
    return;
  }
  if (imPlot(mausX(), mausY()) && !laufAuto) {
    const pkt = ausPlot(mausX(), mausY());
    anfragen[aktiv].x = runde(pkt.x, MERKMALE[0]);
    anfragen[aktiv].y = runde(pkt.y, MERKMALE[1]);
    ziehen = aktiv;
  }
}

function mouseDragged() {
  if (ziehen < 0) {
    return;
  }
  const pkt = ausPlot(mausX(), mausY());
  anfragen[ziehen].x = runde(pkt.x, MERKMALE[0]);
  anfragen[ziehen].y = runde(pkt.y, MERKMALE[1]);
}

function mouseReleased() {
  ziehen = -1;
}

function keyPressed() {
  if (!tastaturFrei()) {
    return true;
  }
  if (key === "ArrowRight") {
    if (!laufAuto) {
      schritt();
    }
    return false;
  }
  if (key === " ") {
    autoUmschalten();
    return false;
  }
  if ((key === "r" || key === "R") && !laufAuto) {
    neuStarten();
    return false;
  }
  if (key === "Tab") {
    aktiv = (aktiv + 1) % anfragen.length;
    return false;
  }
  if (key === "ArrowUp" || key === "+") {
    kWert = Math.min(kMax(), kWert + 1);
    return false;
  }
  if (key === "ArrowDown" || key === "-") {
    kWert = Math.max(1, kWert - 1);
    return false;
  }
  return true;
}

// =============================================================================
// Daten als CSV speichern (z. B. für Orange oder Python/sklearn)
// =============================================================================
function csvSpeichern() {
  const [m1, m2] = MERKMALE;
  const zeilen = [["nr", m1.csv, m2.csv, "klasse"].join(";")];
  for (const p of daten.slice().sort((a, b) => a.id - b.id)) {
    zeilen.push([p.id, p.x.toFixed(m1.stellen), p.y.toFixed(m2.stellen), klassenName(p.k)].join(";"));
  }
  ladeHerunter(SZ.csvDatei, zeilen.join("\n") + "\n");
}
