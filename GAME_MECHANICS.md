# Level & Loot - Game Mechanics Update

## Implementierte Features

### 1. Aggro-System ✅

Das Spiel verfügt jetzt über ein vollständiges Aggro-System:

#### Wie funktioniert es?
- **Aggro-Werte**: Jeder Spieler hat einen Aggro-Wert, der bestimmt, wer vom Boss angegriffen wird
- **Boss-Targeting**: Der Boss greift immer den Spieler mit der höchsten Aggro an
- **Aggro-Decay**: Aggro nimmt automatisch um 5% pro Tick ab, um dynamische Kämpfe zu fördern

#### Aggro-Generierung nach Rolle:

**Tank (Hauptrolle: Aggro halten)**
- Startet mit 100 Aggro (andere Rollen mit 10)
- Shield Wall (Slot 3): +150 Aggro
- Protect Zone (Slot 4): +250 Aggro
- Damage Skills: 1.5x Aggro-Multiplikator

**Damage Dealer (DD)**
- Damage Skills generieren nur 0.5x Aggro (reduziert)
- Burst (Slot 3): 45 Schaden + moderate Aggro
- Execute (Slot 4): 42 Schaden (+28 bei <35% HP) + moderate Aggro

**Healer**
- Healing generiert minimale Aggro
- Single Heal (Slot 3): 32 Heilung + 20% der Heilung als Aggro
- AoE Heal (Slot 4): 24 Heilung pro Person + 15% der Heilung als Aggro

### 2. Rollen-Balancing ✅

Die drei Rollen sind jetzt klar definiert und ausgeglichen:

#### Tank
- **HP**: 180-195 (höchste im Spiel)
- **Armor**: 40-45% Schadensreduktion
- **Skills**:
  - Shield Wall: 65% Schadensreduktion für 3 Sekunden
  - Protect Zone: 50% Schadensreduktion für Verbündete in 180px Radius für 4.5 Sekunden
- **Rolle**: Aggro halten, Team beschützen, überleben

#### Damage Dealer (DD)
- **HP**: 70-65 (niedrigste im Spiel - Glaskanone!)
- **Armor**: 3% Schadensreduktion
- **Skills**:
  - Burst: 45 Schaden (stark erhöht)
  - Execute: 42 Schaden + 28 Bonus unter 35% Boss-HP
- **Rolle**: Maximaler Schaden, aber sehr verletzlich

#### Healer
- **HP**: 85-80 (mittlere Survivability)
- **Armor**: 10% Schadensreduktion
- **Skills**:
  - Single Heal: 32 Heilung auf niedrigsten Verbündeten
  - AoE Heal: 24 Heilung auf alle in 200px Radius
- **Rolle**: Team am Leben halten, wenig Aggro generieren

### 3. Boss-System mit Seed ✅

#### Seed-basierte Rotation
- Jeder Boss wird mit einem Seed erstellt
- Der Seed bestimmt die Angriffs-Rotation (80 Angriffe)
- Gleicher Seed = gleicher Boss mit exakt gleichen Mustern
- Ermöglicht wiederholbare "Herausforderungen"

#### Boss-Skalierung
- **HP**: Skaliert mit +85% pro zusätzlichem Spieler
- **Schaden**: Skaliert mit +25% * √(Spieleranzahl - 1)
- **Geschwindigkeit**: Skaliert mit +6% * log2(Spieleranzahl)

#### Boss-Modi (deterministisch per Seed)
- **Stand**: Boss bleibt stehen, fokussiert auf Angriffe
- **Chase**: Boss verfolgt langsam den Tank
- **Teleport**: Boss teleportiert sich regelmäßig um den Tank herum

### 4. Raid Leiter 2 - Custom Raid Generator ✅

Der zweite NPC "Raid Leiter 2" bietet erweiterte Raid-Einstellungen:

#### Anpassbare Parameter:
1. **Seed**: Eigener Seed-Code für wiederholbare Bosse
2. **Boss HP**: 500-3000 HP
3. **Boss Schaden**: 0.5x - 2.0x Multiplikator
4. **Boss Geschwindigkeit**: 0.5x - 2.0x Multiplikator
5. **Boss Modus**: Stand / Chase / Teleport (fixiert)
6. **Attacken**: Wählbar aus 8 verschiedenen Angriffen
   - Slam, Big Slam, Beam, Fire Wave, Ice Shard, Meteor, Dark Orb, Lightning Strike
7. **Mechaniken**: Wählbar aus 6 verschiedenen Mechaniken
   - Moving Hazard, Checkerboard, Safe Zone, Void Zones, Spinning Blades, Blood Pool

#### Verwendung:
1. Gehe zu "Raid Leiter 2" (links in der Stadt bei x=200, y=400)
2. Klicke auf den NPC
3. Stelle alle gewünschten Parameter ein
4. Optional: Gib einen Seed ein (z.B. "challenge1")
5. Klicke "Raid Erstellen"
6. Der Raid startet sofort!

### 5. Mechaniken-System ✅

#### Verfügbare Mechaniken:
1. **Moving Hazard**: 2-3 sich bewegende Gefahrenzonen (80px Radius, 25 Schaden/0.5s)
2. **Checkerboard**: Schachbrett-Muster aus Gefahrenzonen (100px Quadrate, 30 Schaden/0.5s)
3. **Safe Zone**: Nur innerhalb des grünen Kreises ist es sicher (150px sicherer Radius, 35 Schaden/0.5s außerhalb)
4. **Void Zones**: Statische Gefahrenzonen (90px Radius, 28 Schaden/0.5s)
5. **Spinning Blades**: Rotierende Klingen (70px Radius, schnelle Bewegung, 32 Schaden/0.5s)
6. **Blood Pool**: Große Gefahrenzone (100px Radius, 26 Schaden/0.5s)

#### Mechanik-Zeitplan:
- Erste Mechanik: 15-20 Sekunden nach Start
- Danach: Alle 7-10 Sekunden eine neue Mechanik
- 3-5 Mechaniken pro Raid (skaliert mit Gruppengröße)

### 6. PVP/Duell-System ✅

Das Duell-System verwendet die gleichen Skill-Mechaniken wie Raids:
- Alle Rollen-Skills funktionieren gegen andere Spieler
- Armor-Werte reduzieren eingehenden Schaden
- Tanks sind schwer zu töten, machen aber wenig Schaden
- DDs machen viel Schaden, sterben aber schnell
- Healer können sich selbst heilen

## Spielanleitung

### Als Tank:
1. Starte den Kampf und halte Aggro mit Shield Wall und Protect Zone
2. Positioniere dich so, dass der Boss von DDs gut erreichbar ist
3. Verwende Protect Zone, wenn große Boss-Angriffe kommen
4. Deine Aufgabe: Überleben und den Boss auf dir halten!

### Als Damage Dealer:
1. Lass den Tank zuerst Aggro aufbauen
2. Nutze deine starken Burst- und Execute-Skills
3. Weiche Boss-Attacken aus (du hast sehr wenig HP!)
4. Konzentriere dich auf maximalen Schaden

### Als Healer:
1. Beobachte die HP der Gruppe
2. Heile den Tank priorisiert (er hält den Boss auf sich)
3. Nutze AoE Heal bei großen Gruppenangriffen
4. Bleib am Leben - wenn du stirbst, stirbt die Gruppe!

## Technische Details

### Kommandos:
- `/raid create [seed]` - Erstellt einen Standard-Raid
- `/raid join <raidId>` - Tritt einem Raid bei
- `/raid start` - Startet den Raid (nur Leader)
- `/raid menu` - Öffnet das Raid-Board
- `/duel <spielername>` - Fordert zum Duell heraus
- `/accept` - Akzeptiert ein Duell
- `/leave` - Verlässt aktuellen Kampf

### Seed-System:
```javascript
// Beispiel Seed-Verwendung:
// Seed: "challenge1" -> Boss ID: 1234567890
// Rotation wird deterministisch aus dem Seed generiert
// Gleicher Seed = identischer Boss
```

### Performance:
- Raid-Tick-Rate: 20 Hz (50ms)
- Lobby-Update: 30 Hz (33ms)
- Mechanik-Check: 20 Hz (50ms)

## Bekannte Features

### ✅ Implementiert:
- Vollständiges Aggro-System
- Rollen-Balancing (Tank/DD/Healer)
- Seed-basierte Boss-Rotation
- Custom Raid Generator
- Boss-Skalierung nach Gruppengröße
- 8 verschiedene Boss-Attacken
- 6 verschiedene Mechaniken
- PVP-Duell-System
- Stats-Tracking (Schaden/Heilung/Schutz)

### 🎯 Zum Testen:
- Solo-Raid (sehr schwer als DD/Healer)
- 2er-Gruppe (Tank + DD oder Tank + Healer)
- 3er-Gruppe (Tank + DD + Healer) - empfohlen!
- Custom Seeds mit extremen Einstellungen

## Balance-Philosophie

Das Spiel folgt der klassischen MMO-Trinity:
- **Tank**: Unentbehrlich - hält den Boss, ohne Tank = Wipe
- **DD**: Nötig für Schaden - ohne DD dauert der Kampf ewig
- **Healer**: Kritisch für Survivability - ohne Healer stirbt der Tank

Jede Rolle ist wichtig und hat klare Stärken/Schwächen!
