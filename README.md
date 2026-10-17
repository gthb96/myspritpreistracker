# Spritpreise – eigener Preisverlauf aus E-Control-Daten

Ein kleines Dashboard, das für deine festgelegten Orte in Österreich die aktuellen
Spritpreise anzeigt und den Preisverlauf aufzeichnet. Die Daten kommen von der
öffentlichen Spritpreisrechner-API der E-Control.

**Wichtig:** E-Control stellt nur *aktuelle* Preise bereit, keine historischen.
Der Verlauf entsteht deshalb ab dem Tag, an dem du das Projekt startest: Ein
GitHub-Action-Job ruft stündlich die Preise ab und speichert jede Preisänderung
in `data/`.

## Einrichten (ca. 10 Minuten, kostenlos)

1. Auf GitHub ein neues **öffentliches** Repository anlegen (GitHub Pages ist für
   private Repos nur in bezahlten Plänen verfügbar).
2. Alle Dateien aus diesem Ordner hochladen – inklusive des versteckten Ordners
   `.github/`.
3. `config.json` anpassen: deine Orte mit Koordinaten eintragen
   (Koordinaten bekommst du z. B. in Google Maps per Rechtsklick auf einen Punkt).
   `id` ist ein kurzer, eindeutiger Name ohne Leerzeichen.
4. **Settings → Actions → General → Workflow permissions** auf
   „Read and write permissions“ stellen.
5. **Actions → „Spritpreise abrufen“ → Run workflow** einmal manuell starten.
   Danach läuft der Job automatisch jede Stunde.
6. **Settings → Pages**: Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)`.
   Nach ein, zwei Minuten ist die Seite unter `https://<dein-name>.github.io/<repo>/`
   erreichbar – auch am Handy (dort „Zum Startbildschirm hinzufügen“ für App-Gefühl).

## Konfiguration

```json
{
  "locations": [
    { "id": "zuhause", "name": "Zuhause", "lat": 48.2082, "lon": 16.3738 }
  ],
  "fuelTypes": ["DIE", "SUP"]
}
```

Kraftstoffe: `DIE` (Diesel), `SUP` (Super 95), `GAS` (CNG).
Pro Ort liefert E-Control die nächstgelegenen Tankstellen im Umkreis; Preise
gibt es nur für einen Teil davon (so ist die API aufgebaut).

Abrufintervall ändern: in `.github/workflows/update.yml` die `cron`-Zeile
(Angabe in UTC). In Österreich dürfen Preise nur um 12:00 Uhr erhöht, aber
jederzeit gesenkt werden – stündlich erfasst das gut.

## Lokal testen

```bash
node scripts/fetch.mjs        # Node 18+; holt einmal die Preise
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

## Hinweise

- GitHub pausiert geplante Workflows in Repos ohne Aktivität nach 60 Tagen.
  Falls der Verlauf stoppt: im Actions-Tab den Workflow wieder aktivieren.
- Der Button „Jetzt direkt bei E-Control abfragen“ fragt die API aus dem Browser
  ab. Ob das klappt, hängt davon ab, ob die API Browser-Anfragen zulässt; die
  stündlichen Daten funktionieren unabhängig davon.
