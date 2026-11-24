# Medien News App: Einrichtung

1. Ordner bei Netlify hochladen (Add new site, Deploy manually, den ganzen Ordner hineinziehen) oder über GitHub verbinden.
2. TMDB Schlüssel holen: themoviedb.org, Konto, Einstellungen, API. Entweder den kurzen API Key (v3) oder den langen Zugriffstoken (v4) funktioniert.
3. In Netlify: Site configuration, Environment variables, neue Variable `TMDB_API_KEY` mit dem Schlüssel anlegen.
4. Deploy neu starten (Deploys, Trigger deploy). Danach lädt die App Daten.
5. Auf dem iPhone und iPad: Seite in Safari öffnen, Teilen, Zum Home Bildschirm.

Optional: Firebase Zugangsdaten in `config.js` eintragen, dann werden Merkliste und Gesehen Liste zwischen euch synchronisiert.

Anpassen:
- News Quellen: `netlify/functions/rss.js`, Liste FEEDS
- Streamingdienste: `index.html`, Objekt PROVIDERS (TMDB Anbieter IDs)
- Sportwettbewerbe: `index.html`, Liste LEAGUES
