# 1. Sonthofer Silvesterlauf 2026

Private Spaß-Website für unseren Silvesterlauf: 31.12.2026, Start 11:00 Uhr am Ortwanger Weiher, 10 km rund um Ortwanger Weiher und Sonthofer See.

Ziel-URL: https://kuerbisemma.github.io/silvesterlauf-sonthofen/

## Veröffentlichen mit GitHub Pages

1. Auf GitHub ein **öffentliches** Repo `silvesterlauf-sonthofen` anlegen (ohne README).
2. Hier im Ordner pushen:
   ```sh
   git remote add origin https://github.com/kuerbisemma/silvesterlauf-sonthofen.git
   git push -u origin main
   ```
3. Im Repo unter **Settings → Pages** als Quelle *Deploy from a branch* wählen, dann Branch `main` und Ordner `/ (root)` einstellen und speichern. Nach ein bis zwei Minuten ist die Seite online.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | die komplette Seite |
| `styles.css` | Design (heller und dunkler Modus, Druckansicht für Startnummer und Urkunde) |
| `app.js` | Countdown, Karte (Leaflet/OSM), Höhenprofil, Startnummer und Urkunde |
| `assets/route.js` | Streckendaten für Karte und Profil |
| `assets/silvesterlauf-sonthofen-2026.gpx` | GPX-Track zum Download |

Es gibt keinen Build-Schritt: Lokal einfach `index.html` im Browser öffnen.

## Hinweise

- Die Seite ist per `noindex` für Suchmaschinen gesperrt. Den Link teilt ihr nur in der Gruppe.
- Die Strecke wurde aus OpenStreetMap-Daten gebaut und **noch nicht abgelaufen**. Bitte vorher einmal prüfen, z. B. die GPX-Datei in Komoot importieren.
- Wer die Strecke ändern will: Die GPX-Datei ersetzen und `assets/route.js` passend dazu neu erzeugen. Das Format ist `points: [[lat, lon], …]`, `profile: [[km, höhe], …]` und `kmMarks: [[km, lat, lon], …]`.

Karten- und Streckendaten © OpenStreetMap-Mitwirkende (ODbL).
