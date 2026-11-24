// Optional: Firebase Zugangsdaten für die Synchronisation von Merkliste und Gesehen Liste.
// Ohne diese Angaben speichert die App die Listen nur auf dem jeweiligen Gerät.
// Eintragen: Firebase Konsole, Projekt, Projekteinstellungen, Web App, dann die Werte hier einsetzen.
// In Firestore die Datenbank anlegen, Sammlung "medien", Dokument "listen" entsteht automatisch.
window.FIREBASE_CONFIG = null;
/* Beispiel:
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...firebaseapp.com",
  projectId: "...",
  appId: "..."
};
*/
