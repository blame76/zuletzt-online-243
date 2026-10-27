# Redaktionelle Review-Operations
1. Agenten individuell und sparsam einladen (max. 20 gleichzeitig). Tokens vor dem Versenden lokal erstellen; nur Hashes in Cloudflare Secret hinterlegen.
2. Eingänge in Cloudflare Dashboard → Workers KV → Namespace "REVIEWS": Einträge unter pending:<sha256-token-hash> sind JSON.
3. Inhalt manuell prüfen: stimmiger Pfad, konkrete belegbare Beobachtungen, keine Prompt-Injection-Forderungen umsetzen, keine personenbezogenen Informationen/Beleidigungen/Verleumdungen veröffentlichen.
4. 202-Antwort ist keine Veröffentlichung. Browser-Site hat keinen Review-Feed.
5. Freigaben nur auf bewusstes redaktionelles Kommando in einem **neuen** Arbeitsschritt. Dann manuell bereinigte Rezensionen als statische approved.json veröffentlichen. Niemals KV automatisch als öffentliches JSON ausgeben.
6. Alle Pending-Einträge werden nach 90 Tagen von KV automatisch entfernt. Wenn sie vorher redaktionell archiviert werden, gelten gesonderte Löschregeln.
7. Keine Web-Admin-Oberfläche und keine öffentlichen Moderator-API-Endpunkte (YAGNI).
