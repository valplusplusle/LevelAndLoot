# Level & Loot - Schnellstart

## Server starten

```bash
cd backend
node index.js
```

Server läuft auf `http://localhost:3005`

## Erste Schritte

### 1. Client öffnen
Öffne `http://localhost:3005` im Browser

### 2. Charakter erstellen
- Wähle eine **Klasse**: Knight / Mage / Archer
- Wähle eine **Rolle**: Tank / DD / Healer
- Gib deinem Charakter einen Namen

### 3. Raid erstellen

#### Option A: Standard-Raid (Raid Leiter)
1. Gehe zum **Raid Leiter** NPC (rechts in der Stadt bei x=700, y=400)
2. Klicke auf den NPC
3. Klicke "Raid Erstellen"
4. Warte auf weitere Spieler oder starte solo (sehr schwer!)
5. Klicke "Raid Starten" als Leader

#### Option B: Custom Raid (Raid Leiter 2) 🎯
1. Gehe zu **Raid Leiter 2** NPC (links in der Stadt bei x=200, y=400)
2. Klicke auf den NPC
3. Konfiguriere deinen Boss:
   - **Seed**: z.B. "challenge1" (optional, für wiederholbare Bosse)
   - **Boss HP**: 500-3000
   - **Boss Schaden**: 0.5x - 2.0x
   - **Boss Geschwindigkeit**: 0.5x - 2.0x
   - **Boss Modus**: Stand / Chase / Teleport
   - **Attacken**: Wähle aus 8 verschiedenen Angriffen
   - **Mechaniken**: Wähle aus 6 verschiedenen Mechaniken
4. Klicke "Raid Erstellen"
5. Der Raid startet sofort!

### 4. Skills nutzen

#### Skill-Layout:
- **Slot 1**: Klassen-Fähigkeit (schnell)
- **Slot 2**: Klassen-Fähigkeit (stark)
- **Slot 3**: Rollen-Fähigkeit (Primär)
- **Slot 4**: Rollen-Fähigkeit (Ultimate)

#### Tank:
- **Slot 3**: Shield Wall - 65% Schadensreduktion
- **Slot 4**: Protect Zone - Beschützt Verbündete
- **Ziel**: Aggro halten, überleben

#### Damage Dealer:
- **Slot 3**: Burst - 45 Schaden
- **Slot 4**: Execute - 42 Schaden (+28 unter 35% Boss-HP)
- **Ziel**: Maximaler Schaden, Boss töten

#### Healer:
- **Slot 3**: Single Heal - 32 Heilung auf niedrigsten Verbündeten
- **Slot 4**: AoE Heal - 24 Heilung auf alle nahen Verbündeten
- **Ziel**: Team am Leben halten

## Wichtige Konzepte

### Aggro-System
- Boss greift immer den Spieler mit **höchster Aggro** an
- **Tank**: Generiert viel Aggro (100 Start, +150/+250 mit Skills)
- **DD**: Generiert nur 50% Aggro von Schaden
- **Healer**: Generiert minimale Aggro (15-20% von Heilung)
- Aggro nimmt automatisch ab (5% pro Tick)

### Rollen-Balance
| Rolle   | HP  | Armor | Hauptaufgabe          |
|---------|-----|-------|-----------------------|
| Tank    | 180 | 40%   | Aggro halten          |
| DD      | 70  | 3%    | Schaden machen        |
| Healer  | 85  | 10%   | Team heilen           |

### Boss-Mechaniken
Während des Raids spawnen verschiedene Mechaniken:
- **Moving Hazard**: Sich bewegende rote Kreise
- **Checkerboard**: Schachbrett-Muster
- **Safe Zone**: Nur innerhalb des grünen Kreises sicher
- **Void Zones**: Statische Gefahrenzonen
- Und mehr...

**Tipp**: Bewege dich ständig und weiche aus!

## Multiplayer

### Raid beitreten
```
/raid join <raidId>
```

### PVP/Duell
```
/duel <spielername>
/accept
```

### Raid verlassen
```
/leave
```

## Empfohlene Gruppenzusammensetzung

### Solo
- Sehr schwer
- Nur als Tank empfohlen (aber auch schwer)

### 2 Spieler
- **Tank + DD**: Gute Balance
- **Tank + Healer**: Sehr sicher, dauert aber lange

### 3 Spieler (IDEAL!) ⭐
- **Tank + DD + Healer**: Perfektes Trinity-Setup
- Jede Rolle ist wichtig
- Beste Spielerfahrung

### 4+ Spieler
- Boss wird härter, aber mehr DPS verfügbar
- Mehrere DDs oder Healer möglich
- Mehr chaotisch und spaßig

## Tipps & Tricks

### Für Tanks:
1. Nutze **Shield Wall** kurz bevor große Angriffe kommen
2. Stelle **Protect Zone** dort auf, wo die DDs stehen
3. Bewege den Boss nicht zu viel - lass DDs in Range bleiben
4. Du bist der wichtigste Spieler - stirb nicht!

### Für DDs:
1. Lass den Tank zuerst Aggro aufbauen (2-3 Sekunden)
2. Nutze **Execute** unter 35% Boss-HP für maximalen Schaden
3. Stehe nahe am Tank für Protect Zone Buff
4. Weiche Boss-Angriffen aus - du hast NUR 70 HP!

### Für Healer:
1. Behalte Tank-HP im Auge - er muss leben!
2. Nutze **AoE Heal** bei Boss-Flächenangriffen
3. Spare Cooldowns für kritische Momente
4. Bleib in Heilreichweite aber außerhalb der Gefahrenzonen

## Seed-Challenges

Probiere diese Seeds für interessante Bosse:

```
/raid create easy123      # Einfacher Boss (zufällig)
/raid create hard456      # Schwerer Boss (zufällig)
/raid create chaos        # Chaotischer Boss
```

Oder erstelle eigene mit **Raid Leiter 2**!

## Bekannte Commands

```bash
/raid menu           # Raid-Board öffnen
/raid create [seed]  # Raid erstellen
/raid join <id>      # Raid beitreten
/raid start          # Raid starten (Leader only)
/leave               # Fight verlassen
/duel <name>         # Duell-Herausforderung
/accept              # Duell akzeptieren
```

## Troubleshooting

### Server läuft nicht
```bash
cd backend
node index.js
# Server sollte "Lobby Server running on :3005" anzeigen
```

### Kann nicht zum Raid beitreten
- Stelle sicher, dass der Raid noch nicht gestartet wurde
- Kopiere die volle Raid-ID aus dem Chat

### Skills funktionieren nicht
- Warte bis Cooldown vorbei ist (roter Balken)
- Stelle sicher, dass du in Reichweite bist

### Visuell bugs
- Drücke F5 um die Seite neu zu laden
- Stelle sicher, dass JavaScript aktiviert ist

## Viel Spaß!

Das Spiel ist am besten mit Freunden! Koordiniert eure Rollen und besiegt die Bosse zusammen. 🎮⚔️
