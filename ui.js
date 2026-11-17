// =============================================================================
//  ui.js – HTML-Bedienelemente über der Zeichenfläche
// =============================================================================
//  Positionen im logischen 1600×900-Raster (Helfer in basis.js).
// =============================================================================

function erstelleUi() {
  erstelleHuelle();
  erstelleBeispielReiter(szenarioWechseln);

  ui.neueDaten = knopf(1230, 12, 150, "Neue Messdaten", neueMessdaten, "kopf");
  ui.csv = knopf(1388, 12, 148, "CSV speichern", csvSpeichern, "kopf");

  // --- unter dem Diagramm ----------------------------------------------------
  ui.flaeche = knopf(40, 830, 272, "Entscheidungsfläche zeigen", () => {
    flaecheAn = !flaecheAn;
  });
  ui.ausreisser = knopf(322, 830, 200, "Ausreißer einfügen", () => {
    ausreisserAn = !ausreisserAn;
    datenZusammenstellen();
    zeigeHinweis(ausreisserAn ? "Ausreißer eingefügt (gelb umrandet). Wie reagiert kNN bei k = 1 – und bei k = 7?" : "Ausreißer entfernt.");
  });

  // --- Ablauf (Erklärfeld) ---------------------------------------------------
  ui.schritt = knopf(876, 284, 190, "Schritt ▶ (→)", schritt, "dunkel");
  ui.auto = knopf(1074, 284, 190, "▶ Automatisch", autoUmschalten, "primaer");
  ui.neu = knopf(1272, 284, 190, "↺ Neu starten (R)", neuStarten);

  // --- Einstellungen ---------------------------------------------------------
  platziere(createSpan("Nachbarn k"), 876, 380, 90);
  ui.k = platziere(createSlider(1, 25, kWert, 1), 966, 384, 200);
  ui.k.input(() => {
    kWert = Number(ui.k.value());
  });
  ui.k.changed(() => ui.k.elt.blur());
  ui.kWert = platziere(createSpan(""), 1176, 380, 50);

  platziere(createSpan("Abstand"), 1236, 380, 66);
  ui.metrik = auswahl(
    1302,
    380,
    124,
    [
      ["euklidisch", "euklid"],
      ["Manhattan", "manhattan"],
    ],
    metrik,
    (v) => {
      metrik = v;
    }
  );

  platziere(createSpan("Tempo"), 1440, 380, 52);
  ui.tempo = auswahl(
    1492,
    380,
    74,
    ["langsam", "mittel", "schnell"].map((v) => [v, v]),
    tempo,
    (v) => {
      tempo = v;
    }
  );

  ui.skalieren = kaestchen(876, 418, 300, "Merkmale skalieren (jeweils 0 … 1)", skalieren, (an) => {
    skalieren = an;
    zeigeHinweis(an ? "Skaliert: Beide Merkmale zählen jetzt gleich viel. Achte auf die Fehlerrate unten links!" : "Unskaliert: Das Merkmal mit den größeren Zahlen bestimmt den Abstand.");
  });
  ui.alle = kaestchen(1190, 418, 380, "Linien zu allen Punkten zeigen", alleLinienAn, (an) => {
    alleLinienAn = an;
  });
}

// wird in jedem Frame aufgerufen
function aktualisiereUi() {
  beschrifte(ui.auto, laufAuto ? "■ Anhalten" : "▶ Automatisch");
  klasse(ui.auto, "primaer", !laufAuto);
  klasse(ui.auto, "dunkel", laufAuto);

  const texte = ["① Abstände ▶ (→)", "② Sortieren ▶ (→)", "③ k Nächste ▶ (→)", "④ Abstimmen ▶ (→)", "Fertig ✓"];
  beschrifte(ui.schritt, texte[stufe]);
  sperre(ui.schritt, laufAuto || stufe >= 4);
  sperre(ui.auto, stufe >= 4);

  beschrifte(ui.flaeche, flaecheAn ? "Entscheidungsfläche ausblenden" : "Entscheidungsfläche zeigen");
  klasse(ui.flaeche, "kopf", true);
  klasse(ui.flaeche, "aktiv", flaecheAn);
  beschrifte(ui.ausreisser, ausreisserAn ? "Ausreißer entfernen" : "Ausreißer einfügen");
  klasse(ui.ausreisser, "kopf", true);
  klasse(ui.ausreisser, "aktiv", ausreisserAn);

  beschrifte(ui.kWert, `<b>${kWert}</b>`);
  if (Number(ui.k.value()) !== kWert) {
    ui.k.value(kWert);
  }
  ui.k.attribute("max", String(kMax()));

  aktualisiereBeispielReiter(szenario, laufAuto);
  sperre(ui.neueDaten, laufAuto || !!SZ.fest);
  sperre(ui.ausreisser, laufAuto);
  sperre(ui.neu, laufAuto);
}
