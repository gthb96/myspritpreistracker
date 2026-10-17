// Holt aktuelle Spritpreise von der E-Control-API für alle Orte in config.json
// und schreibt sie nach data/. Benötigt Node 18+ (eingebautes fetch), keine Abhängigkeiten.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.ECONTROL_API || 'https://api.e-control.at/sprit/1.0/search/gas-stations/by-address';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

const readJson = async (file, fallback) => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
};
const writeJson = (file, obj) => fs.writeFile(file, JSON.stringify(obj) + '\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const cfg = await readJson(path.join(ROOT, 'config.json'), null);
if (!cfg?.locations?.length) throw new Error('config.json fehlt oder enthält keine Orte');
const fuels = cfg.fuelTypes?.length ? cfg.fuelTypes : ['DIE', 'SUP'];

const now = Number(process.env.FAKE_NOW) || Math.floor(Date.now() / 1000);
const month = new Date(now * 1000).toISOString().slice(0, 7);
await fs.mkdir(path.join(DATA, 'history'), { recursive: true });

const stationsFile = path.join(DATA, 'stations.json');
const manifestFile = path.join(DATA, 'manifest.json');
const histFile = path.join(DATA, 'history', `${month}.json`);

const stations = await readJson(stationsFile, {});
const manifest = await readJson(manifestFile, { months: [] });
const hist = await readJson(histFile, { series: {}, prices: {} });

// Nur speichern, wenn sich der Wert seit dem letzten Eintrag geändert hat (Änderungsprotokoll).
const pushIfChanged = (arr, entry) => {
  const last = arr.at(-1);
  if (!last || JSON.stringify(last.slice(1)) !== JSON.stringify(entry.slice(1))) arr.push(entry);
};

const latest = { updated: now, results: [] };
let failures = 0;

for (const loc of cfg.locations) {
  for (const fuel of fuels) {
    const url = `${API}?latitude=${loc.lat}&longitude=${loc.lon}&fuelType=${fuel}&includeClosed=false`;
    let list;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      list = await res.json();
      if (!Array.isArray(list)) throw new Error('Unerwartetes Antwortformat');
    } catch (err) {
      failures++;
      console.error(`✗ ${loc.name} / ${fuel}: ${err.message}`);
      continue;
    }

    const rows = [];
    for (const s of list) {
      const l = s.location || {};
      stations[s.id] = {
        name: s.name, address: l.address, postalCode: l.postalCode, city: l.city,
        lat: l.latitude, lon: l.longitude
      };
      const price = s.prices?.find(p => p.fuelType === fuel)?.amount ?? null;
      if (price != null) pushIfChanged(hist.prices[`${s.id}|${fuel}`] ??= [], [now, price]);
      rows.push({ id: s.id, price, distance: s.distance ?? null, open: s.open ?? null });
    }

    const priced = rows.filter(r => r.price != null).map(r => r.price);
    if (priced.length) {
      const min = Math.min(...priced);
      const avg = Math.round(priced.reduce((a, b) => a + b, 0) / priced.length * 1000) / 1000;
      pushIfChanged(hist.series[`${loc.id}|${fuel}`] ??= [], [now, min, avg, priced.length]);
    }
    latest.results.push({ location: loc.id, fuel, stations: rows });
    console.log(`✓ ${loc.name} / ${fuel}: ${priced.length} Preise`);
    if (!process.env.FAKE_NOW) await sleep(800); // API schonen
  }
}

if (!latest.results.length) {
  console.error('Keine Daten erhalten – nichts geschrieben.');
  process.exit(1);
}

if (!manifest.months.includes(month)) { manifest.months.push(month); manifest.months.sort(); }
await writeJson(stationsFile, stations);
await writeJson(manifestFile, manifest);
await writeJson(histFile, hist);
await writeJson(path.join(DATA, 'latest.json'), latest);
console.log(`Fertig (${failures} Fehler).`);
