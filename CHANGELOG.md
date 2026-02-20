# Changelog - Game Mechanics Update

## Übersicht der Änderungen

Diese Update bringt die Kern-Spielmechaniken und das Balancing in das Spiel ein.

---

## Backend-Änderungen (`backend/index.js`)

### 1. Aggro-System (Zeilen ~860-1600)

#### Neue Features:
- **Aggro-Tracking**: Jeder Spieler hat nun einen `aggro`-Wert
- **Boss-Targeting**: Boss wählt Ziel basierend auf höchster Aggro (nicht mehr nur Tank)
- **Aggro-Decay**: 5% Reduktion pro Tick für dynamische Kämpfe

#### Skill-Änderungen mit Aggro:

**Tank Skills (hohe Aggro-Generation):**
```javascript
// Shield Wall: +150 Aggro
if (caster.role === 'tank') {
  caster.aggro = (caster.aggro || 0) + 150;
}

// Protect Zone: +250 Aggro
if (caster.role === 'tank') {
  caster.aggro = (caster.aggro || 0) + 250;
}

// Melee/AoE Skills: 1.5x Aggro Multiplier
const aggroMult = caster.role === 'tank' ? 1.5 : 1.0;
```

**DD Skills (reduzierte Aggro):**
```javascript
// Alle DD Damage Skills: 0.5x Aggro Multiplier
const aggroMult = caster.role === 'dd' ? 0.5 : 1.0;
caster.aggro = (caster.aggro || 0) + (dmg * aggroMult);
```

**Healer Skills (minimale Aggro):**
```javascript
// Single Heal: 20% der Heilung als Aggro
caster.aggro = (caster.aggro || 0) + (healed * 0.2);

// AoE Heal: 15% der Heilung als Aggro
caster.aggro = (caster.aggro || 0) + (totalHealed * 0.15);
```

### 2. Rollen-Balancing

#### Tank-Verbesserungen (Zeilen ~120-140):
```javascript
tank: {
  3: { 
    key: "shieldWall",
    dr: 0.65,  // ↑ von 0.55 (65% Schadensreduktion)
    ...
  },
  4: { 
    key: "protectZone",
    dr: 0.50,  // ↑ von 0.40 (50% Schadensreduktion)
    ...
  },
}
```

#### DD-Verbesserungen (Zeilen ~148-165):
```javascript
dd: {
  3: { 
    key: "burst",
    dmg: 45,  // ↑ von 35
    ...
  },
  4: { 
    key: "execute",
    dmg: 42,       // ↑ von 32
    bonusDmg: 28,  // ↑ von 22
    ...
  },
}
```

#### Healer-Verbesserungen (Zeilen ~170-185):
```javascript
heal: {
  3: { 
    key: "singleHeal",
    heal: 32,  // ↑ von 24
    ...
  },
  4: { 
    key: "aoeHeal",
    heal: 24,  // ↑ von 18
    ...
  }
}
```

#### Stats-Anpassungen (Zeilen ~210-240):
```javascript
function getPlayerStats(playerClass, role) {
  if (role === 'tank') {
    maxHealth = 180;  // ↑ von 150 (+80% statt +50%)
    armor = 0.40;     // ↑ von 0.35
  } else if (role === 'dd') {
    maxHealth = 70;   // ↓ von 75 (mehr Glaskanone)
    armor = 0.03;     // ↓ von 0.05
  }
  // Healer bleibt gleich
}
```

### 3. Boss-Targeting-Logik (Zeilen ~1330-1345):
```javascript
// ALT: Boss zielt immer auf Tank
const tank = alive.find(p => p.role === "tank");
raid.boss.targetId = (tank || alive[0]).id;

// NEU: Boss zielt auf höchste Aggro
alive.sort((a, b) => (b.aggro || 0) - (a.aggro || 0));
const target = alive[0];
raid.boss.targetId = target.id;

// Aggro Decay
for (const p of alive) {
  if (p.aggro) p.aggro = Math.max(10, p.aggro * 0.95);
}
```

### 4. Raid-Initialisierung (Zeilen ~775-795):
```javascript
// Spieler bekommen Aggro beim Start
p.aggro = p.role === 'tank' ? 100 : 10;
```

---

## Client-Änderungen

### 1. Combat FX Verbesserungen (`client/gameEngine/combatFx.js`)

#### Bessere Visualisierung für Gefahrenzonen:
```javascript
if (s.type === "filledCircle") {
  context.fillStyle = `rgba(${s.r??255},${s.g??0},${s.b??0},${alpha})`;
  context.beginPath();
  context.arc(s.x, s.y, s.radius, 0, Math.PI*2);
  context.fill();
  
  // NEU: Pulsierende Warnung
  if (s.warning) {
    const pulseAlpha = 0.4 + 0.3 * Math.sin(t / 150);
    context.lineWidth = 3;
    context.strokeStyle = `rgba(255,100,100,${pulseAlpha})`;
    context.stroke();
  }
}
```

### 2. Raid Lobby (`client/gameEngine/raidLobby.js`)

#### Custom Raid UI Integration (bereits vorhanden):
- Raid Leiter 2 öffnet Advanced Settings UI
- Seed-Generator
- Attacken-Auswahl
- Mechaniken-Auswahl
- Boss-Parameter (HP, Damage, Speed, Mode)

---

## Neue Dateien

### `GAME_MECHANICS.md`
Vollständige Dokumentation aller Spielmechaniken:
- Aggro-System Erklärung
- Rollen-Guide (Tank/DD/Healer)
- Boss-System und Seeds
- Custom Raid Generator Anleitung
- Mechaniken-Beschreibungen
- Spieltipps für jede Rolle

---

## Testing-Checkliste

### ✅ Aggro-System:
1. Tank startet mit 100 Aggro, andere mit 10
2. Tank Skills generieren massive Aggro
3. Boss greift höchste Aggro an
4. DD generiert nur 50% Aggro von Schaden
5. Healer generiert minimale Aggro

### ✅ Balancing:
1. Tank: 180+ HP, 40%+ Armor, starke Mitigation
2. DD: 70 HP, 3% Armor, 45+ Schaden pro Skill
3. Healer: 85 HP, 10% Armor, 32 Single Heal / 24 AoE Heal

### ✅ Boss-System:
1. Seed-basierte Rotation funktioniert
2. Gleicher Seed = gleicher Boss
3. Custom Raid UI funktioniert
4. Boss-Skalierung mit Gruppengröße

### ✅ Mechaniken:
1. Moving Hazards spawnen und bewegen sich
2. Checkerboard-Pattern erscheint
3. Safe Zone zeigt grünen Kreis
4. Schaden wird korrekt angewendet

### ✅ PVP:
1. Alle Skills funktionieren gegen Spieler
2. Armor reduziert Schaden
3. Heilung funktioniert im Duell

---

## Performance

- **Server**: Stabil auf Port 3005
- **Raid Tick Rate**: 20 Hz (50ms)
- **Lobby Updates**: 30 Hz (33ms)
- **Keine Performance-Einbußen**: System läuft smooth

---

## Bekannte Einschränkungen

1. **Aggro-Anzeige**: Derzeit keine visuelle UI für Aggro-Werte (kann später hinzugefügt werden)
2. **Boss-Teleport**: Bei Custom Raids ist Teleport-Mode fixiert (kein dynamischer Wechsel)
3. **Mechanik-Überlappung**: Mehrere Mechaniken können sich gleichzeitig überlappen

---

## Nächste Schritte (Optional)

### Mögliche Erweiterungen:
1. **Aggro-Meter**: UI-Element das Aggro-Werte anzeigt
2. **Mehr Boss-Attacken**: Erweitere RAID_ATTACK_POOL
3. **Mehr Mechaniken**: Neue interessante Raid-Mechaniken
4. **Achievement-System**: Belohnungen für schwere Seeds
5. **Leaderboard**: Beste Zeiten für jeden Seed
6. **Raid-Gruppen**: Persistente Teams mit Statistiken

---

## Zusammenfassung

**Was ist neu:**
- ✅ Vollständiges Aggro-System mit Tank/DD/Healer Unterschieden
- ✅ Ausgeglichenes Rollen-Balancing (jede Rolle ist wichtig!)
- ✅ Seed-basiertes Boss-System für wiederholbare Challenges
- ✅ Custom Raid Generator (Raid Leiter 2)
- ✅ Verbesserte visuelle Effekte
- ✅ Vollständige Dokumentation

**Gameplay-Verbesserungen:**
- Tanks müssen aktiv Aggro managen
- DDs können maximalen Schaden machen ohne sofort Boss-Aggro zu ziehen
- Healer können heilen ohne das ganze Aggro-Management zu ruinieren
- Jede Rolle fühlt sich wichtig und notwendig an

**Technisch:**
- Deterministisches Seed-System ermöglicht "Challenge-Codes"
- Skalierung macht Raids mit unterschiedlichen Gruppengrößen spielbar
- Custom Raid UI erlaubt kreative Boss-Designs
