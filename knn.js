// =============================================================================
//  knn.js – der Algorithmus
// =============================================================================
//  k-nächste Nachbarn in vier Schritten:
//    1. Abstand der Anfrage zu JEDEM Trainingspunkt berechnen
//    2. nach dem Abstand sortieren
//    3. die k Punkte mit dem kleinsten Abstand nehmen
//    4. Mehrheitsentscheid: die häufigste Klasse gewinnt
//       (Gleichstand → die Klasse des nächsten Nachbarn unter den Gleichen)
//
//  k ist ein Hyperparameter: Er wird nicht gelernt, sondern vorgegeben.
//
//  Abstand
//    euklidisch   d = √((x₁ − x₂)² + (y₁ − y₂)²)    (Luftlinie)
//    Manhattan    d = |x₁ − x₂| + |y₁ − y₂|          (wie auf Straßen im Raster)
//
//  Skalierung (Min-Max): x′ = (x − min) / (max − min) → jedes Merkmal 0 … 1
//    Ohne Skalierung zählt ein Merkmal mit großen Zahlen (z. B. Drehzahl in
//    1/min) viel mehr als eines mit kleinen Zahlen (z. B. Schwingung in mm/s).
// =============================================================================

// Spannweiten der Trainingsdaten für die Min-Max-Skalierung
function berechneSkala(daten) {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of daten) {
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
    y0 = Math.min(y0, p.y);
    y1 = Math.max(y1, p.y);
  }
  return { x0, rx: x1 - x0 || 1, y0, ry: y1 - y0 || 1 };
}

// Merkmale eines Punktes so, wie sie in die Abstandsberechnung eingehen
function vektor(p, opt) {
  if (opt.skalieren) {
    return [(p.x - opt.skala.x0) / opt.skala.rx, (p.y - opt.skala.y0) / opt.skala.ry];
  }
  return [p.x, p.y];
}

function abstand(a, b, opt) {
  const [ax, ay] = vektor(a, opt);
  const [bx, by] = vektor(b, opt);
  if (opt.metrik === "manhattan") {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }
  return Math.hypot(ax - bx, ay - by);
}

// Schritt 1 und 2: alle Abstände, aufsteigend sortiert
function sortiereNachAbstand(daten, q, opt) {
  const liste = daten.map((p) => ({ p, d: abstand(q, p, opt) }));
  liste.sort((a, b) => a.d - b.d || a.p.id - b.p.id);
  return liste;
}

// Schritt 3 und 4: die k nächsten stimmen ab
function abstimmen(sortiert, k, anzahlKlassen) {
  const stimmen = new Array(anzahlKlassen).fill(0);
  const nachbarn = sortiert.slice(0, Math.min(k, sortiert.length));
  for (const n of nachbarn) {
    stimmen[n.p.k]++;
  }
  const max = Math.max(...stimmen);
  const kandidaten = [];
  stimmen.forEach((s, i) => {
    if (s === max) {
      kandidaten.push(i);
    }
  });
  let sieger = kandidaten[0];
  let gleichstand = false;
  if (kandidaten.length > 1) {
    gleichstand = true;
    // die Klasse des nächsten Nachbarn unter den gleich starken Klassen
    for (const n of nachbarn) {
      if (kandidaten.includes(n.p.k)) {
        sieger = n.p.k;
        break;
      }
    }
  }
  return { stimmen, sieger, gleichstand, nachbarn };
}

function klassifiziere(daten, q, k, opt, anzahlKlassen) {
  return abstimmen(sortiereNachAbstand(daten, q, opt), k, anzahlKlassen).sieger;
}

// -----------------------------------------------------------------------------
// Bewertung: Leave-one-out
// -----------------------------------------------------------------------------
//  Jeder Trainingspunkt wird einmal herausgenommen und von den übrigen
//  klassifiziert. So sieht man, wie gut kNN bei neuen Punkten wäre.
//  Ergebnis: Fehlerrate je k und die Vorhersage je Punkt.
function leaveOneOut(daten, kMax, opt, anzahlKlassen) {
  const n = daten.length;
  const fehler = new Array(kMax + 1).fill(0);
  const vorhersagen = []; // vorhersagen[k][i]
  for (let k = 0; k <= kMax; k++) {
    vorhersagen.push(new Array(n).fill(0));
  }
  for (let i = 0; i < n; i++) {
    const andere = daten.filter((_, j) => j !== i);
    const sortiert = sortiereNachAbstand(andere, daten[i], opt);
    for (let k = 1; k <= kMax; k++) {
      const v = abstimmen(sortiert, k, anzahlKlassen).sieger;
      vorhersagen[k][i] = v;
      if (v !== daten[i].k) {
        fehler[k]++;
      }
    }
  }
  return { rate: fehler.map((f) => f / n), vorhersagen };
}
