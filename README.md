# Spritpreise – eigener Preisverlauf aus E-Control-Daten

Ein kleines Dashboard, das für festgelegte Orte in Österreich die aktuellen
Spritpreise anzeigt und den Preisverlauf aufzeichnet. Die Daten kommen von der
öffentlichen Spritpreisrechner-API der E-Control. Die Seite lässt sich am Handy
und am PC als App (PWA) installieren.

**Wichtig:** E-Control stellt nur *aktuelle* Preise bereit, keine historischen.
Der Verlauf entsteht deshalb ab dem Tag, an dem du das Projekt startest: Ein
GitHub-Action-Job ruft stündlich die Preise ab und speichert jede Preisänderung
in `data/`. Beim Öffnen holt die Seite zusätzlich die Live-Preise direkt von
E-Control.

## Einrichten (ca. 10 Minuten, kostenlos)

1. Dieses Repo über **Code → Download ZIP** herunterladen und entpacken.
   Den Ordner `data` löschen, damit dein eigener Verlauf bei null startet.
2. Auf GitHub ein neues **öffentliches** Repository anlegen (GitHub Pages ist für
   private Repos nur in bezahlten Plänen verfügbar). README, .gitignore und
   Lizenz nicht anhaken.
3. `config.json` anpassen: deine Orte mit Koordinaten eintragen (siehe unten).
4. Alles hochladen: **Add file → Upload files** und den Inhalt des Ordners per
   **Drag & Drop** ins Fenster ziehen – nicht über „choose your files“, damit
   lassen sich keine Ordner auswählen. Danach müssen `.github`, `icons`,
   `scripts` und die Dateien direkt im Repo liegen, nicht in einem Unterordner.
5. **Settings → Actions → General → Workflow permissions** auf
   „Read and write permissions“ stellen und speichern.
6. **Actions → „Spritpreise abrufen“ → Run workflow** einmal manuell starten.
   Danach läuft der Job automatisch jede Stunde.
7. **Settings → Pages**: Source „Deploy from a branch“, Branch `main`, Ordner
   `/ (root)`. Nach ein, zwei Minuten ist die Seite unter
   `https://<dein-name>.github.io/<repo>/` erreichbar.

## Als App installieren

- **Android (Chrome):** Menü ⋮ → „App installieren“
- **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“
- **PC (Chrome/Edge):** Installations-Symbol rechts in der Adressleiste

## Konfiguration

```json
{
  "locations": [
    { "id": "zuhause", "name": "Zuhause", "lat": 48.2082, "lon": 16.3738 }
  ],
  "fuelTypes": ["DIE", "SUP"]
}
```

- **Koordinaten:** in Google Maps per Rechtsklick (am Handy: lange drücken) auf
  einen Punkt. Die erste Zahl ist `lat`, die zweite `lon`. In kleinen Orten
  reicht das Zentrum, in Städten besser der Punkt, wo du wirklich tankst.
- **`id`:** kurz, eindeutig, ohne Leerzeichen. Nicht mehr ändern, sobald Daten
  gesammelt werden – der Verlauf hängt an ihr. `name` kannst du jederzeit ändern.
- **Kraftstoffe:** `DIE` (Diesel), `SUP` (Super 95), `GAS` (CNG).
- **Datenschutz:** Das Repo ist öffentlich. Statt der eigenen Wohnadresse lieber
  einen Punkt in der Nähe eintragen.

Abrufintervall ändern: in `.github/workflows/update.yml` die `cron`-Zeile
(Angabe in UTC).

## Gut zu wissen

- **Geplante Läufe sind bei GitHub nicht pünktlich.** Sie kommen oft 15–60
  Minuten später, gerade bei neuen Repos kann der erste geplante Lauf ein paar
  Stunden dauern. Für den Verlauf macht das nichts.
- **„Günstigster Preis je Ort“** ist der günstigste unter den rund 10 nächsten
  *geöffneten* Tankstellen. Nachts sind weniger offen, dann reicht der Kreis
  weiter hinaus – deshalb kann der Wert morgens steigen, ohne dass irgendwo der
  Preis erhöht wurde.
- **Live vs. gespeichert:** Preistafel und Tankstellenliste zeigen den
  Live-Stand. Diagramm und „7 Tage tief/hoch“ zeigen den letzten stündlichen
  Abruf.
- **Um Mitternacht** liefert E-Control kurz keine Preise. Seite und Abruf
  behalten dann einfach die letzten gültigen Daten.
- **60 Tage ohne Aktivität:** GitHub kann geplante Workflows dann pausieren.
  Falls der Verlauf stoppt, im Actions-Tab wieder aktivieren.
- Die Dateien in `data/` nicht von Hand bearbeiten.

## Lokal testen

```bash
node scripts/fetch.mjs        # Node 20+; holt einmal die Preise
python3 -m http.server 8000   # danach http://localhost:8000 öffnen
```

`index.html` per Doppelklick zu öffnen funktioniert nicht, weil der Browser dann
die JSON-Dateien nicht laden darf.

## Datenformat

- `data/latest.json` – letzter Abruf je Ort und Kraftstoff
- `data/stations.json` – Stammdaten der Tankstellen
- `data/history/JJJJ-MM.json` – Änderungsprotokoll pro Monat:
  `series["ort|DIE"] = [[zeit, günstigster, schnitt, anzahl], …]` und
  `prices["tankstellenId|DIE"] = [[zeit, preis], …]` (Zeit als Unix-Sekunden).
  Ein Eintrag wird nur geschrieben, wenn sich der Wert geändert hat.
