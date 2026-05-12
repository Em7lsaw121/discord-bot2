# 🎟️ ZYXE Ticket System Bot

Ein vollständiger Discord Bot mit einem professionellen Ticket-System in Blau - gebaut mit **JavaScript/Node.js**!

## Features

✅ **Ticket-Panel** - Modernes Embed-Panel mit Button  
✅ **Automatische Kategorisierung** - Tickets werden in einer Kategorie organisiert  
✅ **Benutzerfreundlich** - Einfache Navigation für Benutzer  
✅ **Admin-Control** - Nur Administratoren können das Panel einrichten  
✅ **Automatische Kanallöschung** - Tickets können geschlossen und automatisch gelöscht werden  

## Installation

### 1. Node.js installieren
- Lade Node.js herunter: https://nodejs.org/
- Einfach installieren, fertig!

### 2. Dependencies installieren
```bash
npm install
```

### 3. Bot-Token eintragen
Öffne die `.env` Datei und ersetze `YOUR_BOT_TOKEN_HERE` mit deinem Discord Bot Token:
```
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
```

### 4. Bot starten
```bash
npm start
```

Oder zum Entwickeln:
```bash
npm run dev
```

## Verwendung

### Panel einrichten
Verwende den Command in einem beliebigen Channel:
```
/panel
```

Nur Administratoren können diesen Command ausführen.

### Ticket erstellen
1. Klicke auf den "🎟️ Ticket Erstellen" Button im Panel
2. Ein neuer privater Channel wird erstellt
3. Der Support kann dir dort helfen

### Ticket schließen
1. Klicke auf den "🔒 Ticket Schließen" Button im Ticket-Channel
2. Der Channel wird nach 5 Sekunden automatisch gelöscht

## Discord Bot Permissions

Der Bot benötigt folgende Permissions:
- ✅ Send Messages
- ✅ Manage Channels
- ✅ Manage Roles
- ✅ Embed Links
- ✅ Use Application Commands
- ✅ View Channels

## Konfiguration

Die Tickets werden in der `tickets.json` Datei gespeichert.

## Technologie

- **Node.js** - JavaScript Runtime
- **discord.js** - Discord Bot Library
- **dotenv** - Umgebungsvariablen

## Support

Bei Fragen oder Problemen kontaktiere den Bot-Entwickler.

---
**ZYXE Ticket System** - Professional & Reliable ✨
