# KI-Klassifikation · k-nächste Nachbarn (kNN)

Überwachtes Lernen zum Zuschauen und Ausprobieren: Der kNN-Algorithmus lernt keine Formel – er merkt sich einfach alle Trainingsdaten. Ein neuer Punkt bekommt die Klasse, die unter seinen k nächsten Nachbarn am häufigsten vorkommt. Jeder Schritt (Abstände berechnen, sortieren, die k nächsten wählen, abstimmen) lässt sich einzeln verfolgen, mit allen Zahlen und Formeln.

Erstellt für den Unterricht an der Jakob-Preh-Schule ([bsnes.de](https://www.bsnes.de)).

**Live-Version:** [Hier direkt anschauen](https://flowthetensor.github.io/LS-kNN/)

---

## Worum geht es?

Zu jedem Trainingspunkt sind zwei Merkmale und die richtige Klasse bekannt (das „Label“). Für einen neuen Punkt – die **Anfrage**, im Diagramm als Raute – soll die Klasse vorhergesagt werden. kNN schaut sich dazu einfach an, welche bekannten Punkte in der Nähe liegen. Wie viele Nachbarn mitreden dürfen, legt **k** fest. k wird nicht gelernt, sondern vorgegeben: Es ist ein **Hyperparameter**.

In der roten **Beispiel-Leiste** unter der Kopfzeile stehen vier Beispiele zur Verfügung. Reiter 1 ist das Beispiel aus dem Skript (Kap. 5.1), die anderen drei kommen aus der Industrie. Zu jedem Beispiel gibt es zwei **Ausreißer**, die sich mit „Ausreißer einfügen“ dazunehmen lassen.

> Die Industrie-Werte sind simuliert und an eine typische 24-V-Modellanlage für Industrie 4.0 angelehnt. Sobald echte Messdaten der ETS-Anlage verfügbar sind, kann man sie mit realen Werten vergleichen.

### 1. Skript · Sportart (Standard)

Die 20 Sportler aus dem Diagramm im Skript, fest und unverändert:

| Merkmal | Bereich |
|---|---|
| Körpergröße | 160 … 210 cm |
| Körpergewicht | 40 … 130 kg |

| Klasse | typisch |
|---|---|
| Basketball | groß und schwer (188 … 205 cm, 75 … 125 kg) |
| Langstreckenlauf | kleiner und leicht (165 … 178 cm, 42 … 75 kg) |

Dazu die beiden Anfragen aus dem Skript: **David** (185 cm | 80 kg) und **Alex** (175 cm | 65 kg). Mit **Tab** wechselt man zwischen ihnen. Ergebnis für alle üblichen k: David → Basketball, Alex → Langstreckenlauf.

### 2. Sortierstation · Farbe (3 Klassen)

Ein Farbsensor misst Helligkeit und Rotanteil eines Werkstücks:

| Klasse | Helligkeit | Rotanteil |
|---|---|---|
| rot | ≈ 52 % | ≈ 72 % |
| schwarz | ≈ 20 % | ≈ 24 % |
| silber | ≈ 76 % | ≈ 38 % |

Je 13 Werkstücke. Anfrage: ein neues Werkstück mit 64 % Helligkeit und 55 % Rotanteil – genau zwischen rot und silber. Mit k = 1 wird es „rot“, ab k = 3 „silber“.

### 3. Motor · Zustand (Merkmale skalieren!)

Zustandsüberwachung von Asynchronmotoren:

| Merkmal | Bereich |
|---|---|
| Drehzahl n | 500 … 3000 1/min |
| Schwingung v | 0 … 10 mm/s |

| Klasse | Erklärung |
|---|---|
| in Ordnung | Schwingung niedrig, steigt nur leicht mit der Drehzahl (≈ 1,4 … 2,7 mm/s) |
| Unwucht | erst ab ca. 1500 1/min, Schwingung steigt stark mit der Drehzahl (die Fliehkraft der Unwucht wächst mit n) |
| Lagerschaden | Schwingung hoch (≈ 6,6 mm/s), weitgehend unabhängig von der Drehzahl |

Insgesamt 38 Motoren, Anfrage: **Motor M7** (2350 1/min, 4,4 mm/s). Die beiden Merkmale haben völlig verschiedene Zahlenbereiche: Ein Unterschied von 1 mm/s ist riesig, einer von 1 1/min bedeutungslos. **Ohne Skalierung** zählt fast nur die Drehzahl – die Fehlerrate (Leave-one-out) liegt dann bei rund 60 %, **mit Skalierung** bei rund 20 %.

### 4. Bohrung · Toleranz (nicht linear trennbar)

Qualitätsprüfung eines Bohrbilds: Wie weit liegt die Bohrung neben der Sollposition?

| Merkmal | Bereich |
|---|---|
| Abweichung Δx | −50 … +50 µm |
| Abweichung Δy | −50 … +50 µm |

Eine Bohrung ist **i. O.**, wenn sie innerhalb eines Toleranzkreises (Radius 28 µm) liegt, sonst **n. i. O.** Nahe am Rand gibt es Messrauschen. 64 Bohrungen, Anfrage: **Bohrung 65** (Δx = 22 µm, Δy = −16 µm). Keine Gerade kann die Klassen trennen – kNN kommt damit trotzdem zurecht, weil es keine Formel braucht.

## Der kNN-Algorithmus

```
① Abstand der Anfrage zu JEDEM Trainingspunkt berechnen
② nach dem Abstand sortieren
③ die k Punkte mit dem kleinsten Abstand nehmen
④ Mehrheitsentscheid: die häufigste Klasse gewinnt
```

Bei **Gleichstand** entscheidet die Klasse des nächsten Nachbarn unter den gleich starken Klassen. Darum wählt man bei zwei Klassen gern ein ungerades k.

### Abstand

**Euklidisch** (Luftlinie):

$$d = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$

**Manhattan** (wie auf Straßen im Raster):

$$d = |x_1 - x_2| + |y_1 - y_2|$$

### Skalierung

Ohne Skalierung bestimmt fast nur das Merkmal mit dem größeren Zahlenbereich den Abstand. Mit dem Kästchen „Merkmale skalieren“ wird jedes Merkmal per Min-Max-Skalierung auf 0 … 1 umgerechnet:

$$x' = \frac{x - x_{\min}}{x_{\max} - x_{\min}}$$

Mit „Entscheidungsfläche zeigen“ sieht man den Unterschied sofort, am deutlichsten beim Motor-Beispiel.

### Welches k? Leave-one-out

Jeder Trainingspunkt wird einmal herausgenommen und von den übrigen klassifiziert. So sieht man, wie gut kNN bei neuen Punkten wäre, ohne dass man extra Testdaten braucht. Das Feld **„Fehlerrate je k“** zeigt das für alle k, die **Konfusionsmatrix** für das aktuelle k.

- **k = 1:** Jeder Ausreißer bekommt sein eigenes kleines Gebiet – das Modell lernt die Trainingsdaten auswendig (**Überanpassung**).
- **k sehr groß:** Am Ende gewinnt immer die häufigste Klasse – das Modell wird zu grob (**Unteranpassung**).

## Bedienung

| Aktion | Wirkung |
|---|---|
| Beispiel-Leiste (Reiter 1–4) | Sportart, Sortierstation, Motor oder Bohrung |
| **→** oder „Schritt“ | nächster Schritt: Abstände · Sortieren · k Nächste · Abstimmen |
| **Leertaste** oder „Automatisch“ | bis zum Ende durchlaufen lassen / anhalten |
| **R** oder „Neu starten“ | wieder von vorne, gleiche Daten |
| **↑ / +** und **↓ / −** | k vergrößern / verkleinern (oder Regler unter „Einstellungen“) |
| Anfrage (Raute) ziehen | Anfrage mit der Maus verschieben |
| Klick ins Diagramm | aktive Anfrage dorthin setzen |
| **Tab** | zwischen mehreren Anfragen wechseln (z. B. David ↔ Alex) |
| Maus über einem Punkt | Nummer, Merkmale, Klasse und Abstand zur Anfrage |

**Einstellungen:** k (1 … 25), Abstand (euklidisch / Manhattan), Tempo, Merkmale skalieren, Linien zu allen Punkten zeigen. Unter dem Diagramm lassen sich die Entscheidungsfläche und die Ausreißer einblenden. Das Feld rechts zeigt die **Rangliste** der Nachbarn für die aktive Anfrage. „Neue Messdaten“ erzeugt einen neuen Datensatz mit denselben Klassen (nicht beim Skript-Beispiel), „CSV speichern“ lädt die Daten herunter (z. B. für Excel oder Python).

## Ideen für den Unterricht

- **Vorher schätzen:** Welche Sportart haben David und Alex? Erst schätzen, dann mit → Schritt für Schritt nachvollziehen. Einen Abstand in der Rangliste von Hand nachrechnen.
- **Lernen ohne Formel:** Was „lernt“ kNN eigentlich? Was muss gespeichert werden, und was passiert, wenn es eine Million Trainingspunkte gibt?
- **k verändern:** Anfrage der Sortierstation mit k = 1, 3, 5, 7 klassifizieren. Warum kippt das Ergebnis?
- **Ausreißer einfügen:** Entscheidungsfläche einblenden und k = 1 wählen. Was passiert rund um die Ausreißer? Und mit k = 5?
- **Fehlerrate je k:** Welches k ist am besten? Warum ist k = 1 bei Leave-one-out nicht automatisch perfekt?
- **Skalierung beim Motor:** Ohne Skalierung durchlaufen lassen und die Entscheidungsfläche ansehen – warum entstehen senkrechte Streifen? Dann skalieren. Wie ändert sich die Fehlerrate, und welchen Zustand hat Motor M7?
- **Physik dahinter:** Warum hängt die Schwingung bei einer Unwucht stark von der Drehzahl ab, beim Lagerschaden aber kaum?
- **Bohrung 65:** Abstand zur Sollposition ausrechnen ($\sqrt{22^2 + 16^2}$). Liegt sie innerhalb des Toleranzkreises? Was sagt kNN – und warum? (Tipp: Nachbarn in der Rangliste ansehen.)
- **Euklidisch oder Manhattan:** Wie verändert sich die Form der Entscheidungsfläche? Wo könnte die Manhattan-Distanz sinnvoller sein?
- **Grenzen von kNN:** Was passiert mit zehn Merkmalen statt zwei? Was, wenn eine Klasse viel häufiger vorkommt als die anderen?
- **Weiterarbeit:** Daten als CSV speichern und in Python mit `sklearn.neighbors.KNeighborsClassifier` nachrechnen.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seite, bindet Schriften, p5.js und die Skripte ein |
| `style.css` | Gestaltung im Corporate Design der Schule |
| `basis.js` | gemeinsame Grundlage aller KI-Klassifikations-Seiten (Layout, Farben, Kopfzeile, Beispiel-Leiste, UI-Helfer) |
| `daten.js` | alle vier Beispiele (Merkmale, Klassen, Anfragen, Ausreißer, Texte) und der Datengenerator |
| `knn.js` | der Algorithmus – Abstand, Sortieren, Abstimmen, Leave-one-out – reines JavaScript, ohne p5 |
| `ui.js` | Knöpfe, Regler, Auswahllisten, Kästchen |
| `sketch.js` | Ablauf, Zeichnen, Erklärtexte |
| `assets/logo-jps.png` | Logo der Jakob-Preh-Schule |
| `libraries/p5.min.js` | p5.js (lokal, damit die Seite auch offline läuft) |

Ein weiteres Beispiel lässt sich ergänzen, indem man in `daten.js` einen Eintrag in `SZENARIEN` hinzufügt (zwei Merkmale, Klassen mit Farbe und Form, Daten als Punktwolken, Linien, Kreis oder feste Liste, Anfragen, Ausreißer, Wörter für die Texte). Es erscheint dann automatisch als weiterer Reiter in der Beispiel-Leiste.

## Lokal starten

Am einfachsten in VS Code mit der Erweiterung **Live Server**: Rechtsklick auf `index.html` → „Open with Live Server“.

## Technische Hinweise

- Läuft mit **p5.js 1.x** (lokal mitgeliefert) und **p5.js 2.x**. Dafür verzichtet der Code bewusst auf Funktionen, die sich zwischen den Versionen geändert haben (z. B. `preload`, `loadFont`).
- Die Schriften (Quicksand, Inter, JetBrains Mono) kommen von Google Fonts. Ohne Internet weicht die Seite automatisch auf Systemschriften aus.
- Alle Schleifen haben geschweifte Klammern: Der p5-Web-Editor baut in Schleifen eine Endlosschleifen-Sicherung ein, die bei Schleifen ohne Klammern fehlschlägt.
- Fehler in `draw()` werden abgefangen und als Hinweis angezeigt, statt das Programm einzufrieren.
- Jeder Datensatz wird mit festem Startwert erzeugt und ist deshalb bei jedem Start gleich. Erst „Neue Messdaten“ würfelt neu.
- Die Entscheidungsfläche wird zwischengespeichert und nur neu berechnet, wenn sich Daten, k, Abstand oder Skalierung ändern.
- `basis.js` ist in allen KI-Klassifikations-Seiten (Logistische Regression, kNN, Naiver Bayes, Entscheidungsbaum) identisch.
