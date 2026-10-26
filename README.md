# Spritpreise – eigener Preisverlauf aus E-Control-Daten

Ein kleines Dashboard, das für festgelegte Orte in Österreich die aktuellen
Spritpreise anzeigt und den Preisverlauf aufzeichnet. Die Daten kommen von der
öffentlichen Spritpreisrechner-API der E-Control. Die Seite lässt sich am Handy
und am PC als App (PWA) installieren.

**Wichtig:** E-Control stellt nur *aktuelle* Preise bereit, keine historischen.
Der Verlauf entsteht deshalb ab dem Tag, an dem du das Projekt startest: Ein
GitHub-Action-Job ruft stündlich die Preise ab und speichert jede Preisänderung
in `data/`. Angestoßen wird er von cron-job.org, weil GitHubs eigener Zeitplan
zu unzuverlässig ist. Beim Öffnen holt die Seite zusätzlich die Live-Preise direkt von
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
6. **Actions → „Spritpreise abrufen“ → Run workflow** einmal manuell starten
   und prüfen, ob er grün durchläuft.
7. Den stündlichen Auslöser einrichten: entweder über cron-job.org
   (zuverlässig, siehe unten) oder einfacher über GitHubs eigenen Zeitplan
   (siehe „Alternative“ unten).
8. **Settings → Pages**: Source „Deploy from a branch“, Branch `main`, Ordner
   `/ (root)`. Nach ein, zwei Minuten ist die Seite unter
   `https://<dein-name>.github.io/<repo>/` erreichbar.

## Stündlicher Auslöser über cron-job.org

GitHubs eingebauter Zeitplan (`schedule`) verwirft bei Auslastung viele Läufe –
in der Praxis kam er nur alle 4–5 Stunden. Deshalb ist er in
`.github/workflows/update.yml` auskommentiert, und cron-job.org startet den
Workflow stündlich über die GitHub-API.

**1. Zugangsschlüssel bei GitHub erstellen**
- Profilbild → **Settings → Developer settings → Personal access tokens →
  Fine-grained tokens → Generate new token**
- Name z. B. `cron-job spritpreise`, Ablauf ein Jahr (Datum im Kalender notieren)
- **Repository access:** „Only select repositories“ → dein Repo
- **Permissions → Repository permissions → Actions:** „Read and write“
- **Generate token** und den Schlüssel sofort kopieren (wird nur einmal angezeigt)

**2. Auftrag bei cron-job.org anlegen**
- URL (Name und Repo anpassen):
  `https://api.github.com/repos/<dein-name>/<repo>/actions/workflows/update.yml/dispatches`
- Zeitplan: Benutzerdefiniert, Minute 10 jeder Stunde (`10 * * * *`),
  Zeitzone Europe/Vienna. Minute 10 statt 0, weil E-Control um 0 und 12 Uhr
  kurz keine Preise liefert.
- Benachrichtigung bei Fehlschlag einschalten.
- Unter **Erweitert**: Methode `POST`, Body `{"ref":"main"}` und diese Header:

  | Key | Wert |
  |---|---|
  | `Authorization` | `Bearer <dein-schlüssel>` |
  | `Accept` | `application/vnd.github+json` |
  | `X-GitHub-Api-Version` | `2026-03-10` |
  | `Content-Type` | `application/json` |

- **Testlauf:** Antwort **200** (mit API-Version `2022-11-28` wäre es 204).
  Im Actions-Tab erscheint ein Lauf „Manually run by …“.

Häufige Fehler: **401** – Schlüssel falsch kopiert oder `Bearer ` fehlt.
**403/404** – Berechtigung „Actions: Read and write“ oder Repo-Auswahl fehlt.

**Schlüssel erneuern:** Vor Ablauf einen neuen erstellen und bei cron-job.org
ersetzen. Dabei auch prüfen, ob `X-GitHub-Api-Version` noch aktuell ist
(GitHub-Doku „API Versions“).

### Alternative: GitHubs eigener Zeitplan

Ohne externen Dienst geht es auch: In `.github/workflows/update.yml` bei den
beiden `schedule`-Zeilen das `#` entfernen, sodass der Anfang so aussieht:

```yaml
on:
  schedule:
    - cron: '7 * * * *'   # stündlich (UTC), Minute 7
  workflow_dispatch:
```

Das braucht keinen Zugangsschlüssel und kein weiteres Konto, ist aber deutlich
unzuverlässiger: GitHub verwirft viele geplante Läufe, in der Praxis kam nur
etwa alle 4–5 Stunden einer an. Außerdem gilt dann die 60-Tage-Regel (siehe
„Gut zu wissen“). Für einen groben Verlauf über Wochen reicht das trotzdem.

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

## Gut zu wissen

- **„Günstigster Preis je Ort“** ist der günstigste unter den rund 10 nächsten
  *geöffneten* Tankstellen. Nachts sind weniger offen, dann reicht der Kreis
  weiter hinaus – deshalb kann der Wert morgens steigen, ohne dass irgendwo der
  Preis erhöht wurde.
- **Live vs. gespeichert:** Preistafel und Tankstellenliste zeigen den
  Live-Stand. Diagramm und „7 Tage tief/hoch“ zeigen den letzten stündlichen
  Abruf.
- **Um Mitternacht** liefert E-Control kurz keine Preise. Seite und Abruf
  behalten dann einfach die letzten gültigen Daten.
- **60-Tage-Regel:** GitHub pausiert *geplante* Workflows in Repos ohne
  Aktivität. Mit cron-job.org ist der Workflow nicht geplant, die Regel greift
  also nicht. Mit GitHubs eigenem Zeitplan schon – falls der Verlauf stoppt,
  den Workflow im Actions-Tab wieder aktivieren.
- **YAML-Einrückung:** In `update.yml` zählen die Leerzeichen. Eine ungültige
  Datei zeigt GitHub im Actions-Tab als „Invalid workflow file“ an.
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
