// =============================================================================
//  daten.js – Daten für die Beispiele (zwei Merkmale, jeweils MIT Klasse)
// =============================================================================
//  Der k-nächste-Nachbarn-Algorithmus (kNN) lernt keine Formel. Er merkt sich
//  einfach alle Trainingsdaten. Für einen neuen Punkt sucht er die k Punkte
//  mit dem kleinsten Abstand und lässt sie abstimmen (Mehrheitsentscheid).
//
//  Beispiel "skript" (Standard):
//    Skript 5.1: Sportart aus Körpergröße und Gewicht. Werte aus dem Diagramm,
//    dazu die beiden Anfragen David (185 cm | 80 kg) und Alex (175 cm | 65 kg).
//
//  Beispiel "sortierung":
//    Sortierstation der Modellanlage. Ein Farbsensor misst Helligkeit und
//    Rotanteil. → rotes, schwarzes oder silbernes Werkstück? (3 Klassen)
//
//  Beispiel "motor":
//    Zustandsüberwachung eines Motors: Drehzahl und Schwingung.
//    → in Ordnung, Unwucht oder Lagerschaden? Die Merkmale haben sehr
//    unterschiedliche Zahlenbereiche – hier sieht man, warum man skaliert.
//
//  Beispiel "bohrung":
//    Qualitätsprüfung: Abweichung einer Bohrung von der Sollposition in x und y.
//    → i. O. nur innerhalb eines Toleranzkreises (nicht linear trennbar).
// =============================================================================

const SZENARIEN = {
  skript: {
    name: "Skript · Sportart",
    titel: "Trainingsdaten · Sportart-Klassifikation",
    untertitel: "Beispiel aus dem Skript (5.1) · k-nächste Nachbarn · überwachtes Lernen",
    merkmale: [
      { name: "Körpergröße", kurz: "Größe", einheit: "cm", min: 160, max: 210, gitter: 10, stellen: 0, csv: "groesse_cm" },
      { name: "Körpergewicht", kurz: "Gewicht", einheit: "kg", min: 40, max: 130, gitter: 10, stellen: 0, csv: "gewicht_kg" },
    ],
    klassen: [
      { name: "Basketball", farbe: [205, 120, 20], form: "kreis" },
      { name: "Langstreckenlauf", farbe: [52, 128, 84], form: "dreieck" },
    ],
    fest: [
      [188, 82, 0], [190, 75, 0], [192, 78, 0], [195, 85, 0], [196, 88, 0],
      [194, 95, 0], [198, 105, 0], [200, 115, 0], [202, 120, 0], [205, 125, 0],
      [165, 42, 1], [168, 45, 1], [169, 48, 1], [170, 58, 1], [171, 55, 1],
      [172, 70, 1], [173, 61, 1], [175, 62, 1], [176, 73, 1], [178, 75, 1],
    ],
    ausreisser: [
      [177, 68, 0],
      [189, 79, 1],
    ],
    anfragen: [
      { name: "David", x: 185, y: 80 },
      { name: "Alex", x: 175, y: 65 },
    ],
    wort: { einzahl: "Sportler", mehrzahl: "Sportler", anfrage: "Person" },
    csvDatei: "sportart_skript.csv",
  },

  sortierung: {
    name: "Sortierstation · Farbe",
    titel: "Farbsensor · Sortierstation",
    untertitel: "Werkstücke erkennen · k-nächste Nachbarn · Multi-Klassen-Klassifikation",
    startwert: 20260301,
    merkmale: [
      { name: "Helligkeit", kurz: "Hell", einheit: "%", min: 0, max: 100, gitter: 10, stellen: 0, csv: "helligkeit_prozent" },
      { name: "Rotanteil", kurz: "Rot", einheit: "%", min: 0, max: 100, gitter: 10, stellen: 0, csv: "rotanteil_prozent" },
    ],
    klassen: [
      { name: "rot", farbe: [200, 30, 58], form: "kreis" },
      { name: "schwarz", farbe: [40, 40, 38], form: "quadrat" },
      { name: "silber", farbe: [120, 135, 150], form: "dreieck" },
    ],
    // je Klasse: Mittelwert und Streuung beider Merkmale, Anzahl
    wolken: [
      { mx: 52, sx: 9, my: 72, sy: 8, n: 13 },
      { mx: 20, sx: 8, my: 24, sy: 9, n: 13 },
      { mx: 76, sx: 9, my: 38, sy: 9, n: 13 },
    ],
    ausreisser: [
      [70, 62, 1],
      [30, 35, 2],
    ],
    anfragen: [{ name: "Neues Werkstück", x: 64, y: 55 }],
    wort: { einzahl: "Werkstück", mehrzahl: "Werkstücke", anfrage: "Werkstück" },
    csvDatei: "farbsensor_sortierstation.csv",
  },

  motor: {
    name: "Motor · Zustand",
    titel: "Zustandsdaten · Asynchronmotoren",
    untertitel: "Zustandsüberwachung · k-nächste Nachbarn · Merkmale skalieren!",
    startwert: 20260404,
    merkmale: [
      { name: "Drehzahl", kurz: "n", einheit: "1/min", min: 500, max: 3000, gitter: 250, stellen: 0, csv: "drehzahl_1_min" },
      { name: "Schwingung", kurz: "v", einheit: "mm/s", min: 0, max: 10, gitter: 1, stellen: 1, csv: "schwingung_mm_s" },
    ],
    klassen: [
      { name: "in Ordnung", farbe: [44, 92, 150], form: "kreis" },
      { name: "Unwucht", farbe: [184, 122, 28], form: "quadrat" },
      { name: "Lagerschaden", farbe: [200, 30, 58], form: "dreieck" },
    ],
    // Schwingung abhängig von der Drehzahl: v = a + b · n + Rauschen
    linien: [
      { von: 600, bis: 2900, a: 1.0, b: 0.0006, s: 0.45, n: 16 },
      { von: 1500, bis: 2950, a: -2.4, b: 0.0032, s: 0.55, n: 12 },
      { von: 600, bis: 2900, a: 6.6, b: 0.0, s: 0.8, n: 10 },
    ],
    ausreisser: [
      [1200, 6.2, 0],
      [2600, 2.6, 2],
    ],
    anfragen: [{ name: "Motor M7", x: 2350, y: 4.4 }],
    wort: { einzahl: "Motor", mehrzahl: "Motoren", anfrage: "Motor" },
    csvDatei: "zustandsdaten_motoren.csv",
  },

  bohrung: {
    name: "Bohrung · Toleranz",
    titel: "Messdaten · Prüfstation Bohrbild",
    untertitel: "Qualitätsprüfung · k-nächste Nachbarn · nicht linear trennbar",
    startwert: 20260509,
    merkmale: [
      { name: "Abweichung x", kurz: "Δx", einheit: "µm", min: -50, max: 50, gitter: 10, stellen: 0, csv: "abweichung_x_um" },
      { name: "Abweichung y", kurz: "Δy", einheit: "µm", min: -50, max: 50, gitter: 10, stellen: 0, csv: "abweichung_y_um" },
    ],
    klassen: [
      { name: "i. O.", farbe: [52, 128, 84], form: "kreis" },
      { name: "n. i. O.", farbe: [200, 30, 58], form: "dreieck" },
    ],
    // Toleranzkreis: i. O., wenn der Abstand zur Sollposition kleiner als r ist
    kreis: { r: 28, n: 64, rauschen: 0.06 },
    ausreisser: [
      [4, -6, 1],
      [-38, 30, 0],
    ],
    anfragen: [{ name: "Bohrung 65", x: 22, y: -16 }],
    wort: { einzahl: "Bohrung", mehrzahl: "Bohrungen", anfrage: "Bohrung" },
    csvDatei: "messdaten_bohrbild.csv",
  },
};

// aktives Beispiel – wird mit setzeSzenario() umgeschaltet
let SZ = SZENARIEN.skript;
let MERKMALE = SZ.merkmale;

function setzeSzenario(schluessel) {
  SZ = SZENARIEN[schluessel];
  MERKMALE = SZ.merkmale;
}

function runde(v, m) {
  return Number(v.toFixed(m.stellen));
}

function erzeugeDaten(startwert) {
  const [m1, m2] = MERKMALE;
  const liste = [];
  const neu = (x, y, k) => {
    liste.push({
      x: runde(begrenzen(x, m1.min + 1e-9, m1.max), m1),
      y: runde(begrenzen(y, m2.min + 1e-9, m2.max), m2),
      k,
    });
  };
  if (SZ.fest) {
    for (const [x, y, k] of SZ.fest) {
      neu(x, y, k);
    }
  } else {
    const rnd = zufallsGenerator(startwert);
    if (SZ.wolken) {
      SZ.wolken.forEach((w, k) => {
        for (let i = 0; i < w.n; i++) {
          neu(w.mx + gaussZahl(rnd) * w.sx, w.my + gaussZahl(rnd) * w.sy, k);
        }
      });
    } else if (SZ.linien) {
      SZ.linien.forEach((l, k) => {
        for (let i = 0; i < l.n; i++) {
          const x = l.von + rnd() * (l.bis - l.von);
          neu(x, l.a + l.b * x + gaussZahl(rnd) * l.s, k);
        }
      });
    } else if (SZ.kreis) {
      const kr = SZ.kreis;
      for (let i = 0; i < kr.n; i++) {
        const x = (rnd() * 2 - 1) * 48;
        const y = (rnd() * 2 - 1) * 48;
        let k = Math.hypot(x, y) < kr.r ? 0 : 1;
        // Messrauschen: nahe am Rand wird manchmal falsch eingestuft
        if (Math.abs(Math.hypot(x, y) - kr.r) < 8 && rnd() < kr.rauschen * 4) {
          k = 1 - k;
        }
        neu(x, y, k);
      }
    }
    // in zufälliger Reihenfolge (wie gemessen)
    for (const p of liste) {
      p.r = rnd();
    }
    liste.sort((a, b) => a.r - b.r);
  }
  for (let i = 0; i < liste.length; i++) {
    liste[i].id = (SZ.fest ? 1 : 101) + i;
    liste[i].ausreisser = false;
    delete liste[i].r;
  }
  return liste;
}

function ausreisserPunkte() {
  const [m1, m2] = MERKMALE;
  return SZ.ausreisser.map(([x, y, k], i) => ({ id: 901 + i, x: runde(x, m1), y: runde(y, m2), k, ausreisser: true }));
}

function wertText(v, m) {
  return v.toFixed(m.stellen) + " " + m.einheit;
}
