const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

// ---------------------------
// Helpers
// ---------------------------
function now() { return Date.now(); }
function safeJsonParse(str) { try { return JSON.parse(str); } catch { return null; } }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function distance(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(strOrNum) {
  if (typeof strOrNum === "number") return strOrNum | 0;
  const s = String(strOrNum || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h | 0;
}

// ---------------------------
// Skill system (4 slots)
// ---------------------------
const SKILLS = {
  // CLASS-BASED SKILLS (Slots 1 & 2)
  // Knight: Melee-focused
  knight: {
    1: { 
      key: "slash", 
      cd: 700, 
      type: "melee", 
      range: 90, 
      dmg: 12,
      vfx: { type: "cone", length: 110, angle: Math.PI / 2, r: 255, g: 180, b: 80 },
      effect: { sprite: "fire.orange", size: 60, duration: 600 }
    },
    2: { 
      key: "cleave", 
      cd: 1400, 
      type: "aoeCircleAroundPlayer", 
      radius: 110, 
      dmg: 10,
      vfx: { type: "circle", radius: 110, r: 255, g: 120, b: 0 },
      effect: { sprite: "explosion.orange", size: 80, duration: 800 }
    },
  },
  // Mage: Ranged Caster
  mage: {
    1: { 
      key: "firebolt", 
      cd: 650, 
      type: "ranged", 
      range: 260, 
      dmg: 13,
      vfx: { type: "beam", length: 260, width: 10, r: 255, g: 90, b: 30 },
      effect: { sprite: "fire.red", size: 50, duration: 500 }
    },
    2: { 
      key: "fireRain", 
      cd: 1900, 
      type: "aoeCircleAtBoss", 
      radius: 140, 
      dmg: 11,
      vfx: { type: "filledCircle", radius: 140, r: 255, g: 60, b: 0, alpha: 0.25, fadeOut: true },
      effect: { sprite: "fire.orange", size: 100, duration: 1000 }
    },
  },
  // Archer: Ranged Physical
  archer: {
    1: { 
      key: "shot", 
      cd: 600, 
      type: "ranged", 
      range: 280, 
      dmg: 13,
      vfx: { type: "beam", length: 280, width: 6, r: 200, g: 200, b: 200 },
      effect: { sprite: "hit.orange", size: 40, duration: 400 }
    },
    2: { 
      key: "arrowRain", 
      cd: 2000, 
      type: "aoeCircleAtBoss", 
      radius: 150, 
      dmg: 10,
      vfx: { type: "circle", radius: 150, r: 220, g: 220, b: 220 },
      effect: { sprite: "explosion.orange", size: 90, duration: 800 }
    }
  },
  
  // ROLE-BASED ABILITIES (Slots 3 & 4)
  roles: {
    // TANK: Heavy Defense, Low Damage
    tank: {
      3: { 
        key: "shieldWall", 
        cd: 3000, 
        type: "selfBuff", 
        dr: 0.55, // 55% damage reduction
        dur: 3000, 
        dmg: 4, // minimal damage
        vfx: { type: "ringPulse", radius: 28, r: 120, g: 200, b: 255, pulse: 30, fadeOut: true },
        effect: { sprite: "aura.blue", size: 100, duration: 1500 }
      },
      4: { 
        key: "protectZone", 
        cd: 5500, 
        type: "aoeMitigation", 
        radius: 180, 
        dr: 0.40, // 40% reduction for nearby allies
        dur: 4500, 
        dmg: 6,
        vfx: { type: "filledCircle", radius: 180, r: 80, g: 170, b: 255, alpha: 0.18 },
        effect: { sprite: "aura.blue", size: 140, duration: 2200 }
      },
    },
    
    // DD (Damage Dealer): High Damage, Low Defense
    dd: {
      3: { 
        key: "burst", 
        cd: 2200, 
        type: "bossHit", 
        dmg: 35, // high damage
        vfx: { type: "ringPulse", radius: 40, r: 255, g: 255, b: 120, pulse: 45, fadeOut: true },
        effect: { sprite: "explosion.orange", size: 80, duration: 700 }
      },
      4: { 
        key: "execute", 
        cd: 3800, 
        type: "bossExecute", 
        dmg: 32, 
        bonusBelow: 0.35, 
        bonusDmg: 22,
        vfx: { type: "ringPulse", radius: 55, r: 255, g: 80, b: 80, pulse: 55, fadeOut: true },
        effect: { sprite: "explosion.red", size: 90, duration: 900 }
      },
    },
    
    // HEALER: Low Damage, High Healing
    heal: {
      3: { 
        key: "singleHeal", 
        cd: 1400, 
        type: "healLowestNear", 
        radius: 220, 
        heal: 24, // strong single heal
        dmg: 2, // minimal damage
        vfx: { type: "ringPulse", radius: 24, r: 140, g: 255, b: 140, pulse: 25, fadeOut: true },
        effect: { sprite: "aura.lime", size: 90, duration: 400 }
      },
      4: { 
        key: "aoeHeal", 
        cd: 4500, 
        type: "healAoE", 
        radius: 200, 
        heal: 18, // strong AOE heal
        dmg: 3,
        vfx: { type: "filledCircle", radius: 200, r: 140, g: 255, b: 140, alpha: 0.16 },
        effect: { sprite: "aura.lime", size: 140, duration: 800 }
      }
    }
  }
};


function getSkillDef(player, slot, context = 'raid') {
  let def;
  if (slot === 1 || slot === 2) {
    def = (SKILLS[player.playerClass] || SKILLS.knight)[slot];
  } else if (slot === 3 || slot === 4) {
    def = (SKILLS.roles[player.role] || SKILLS.roles.tank)[slot];
  }
  
  if (!def) return null;
  
  // For duel context, convert raid types to PvP types
  if (context === 'duel') {
    const converted = { ...def };
    // Map raid skill types to duel-compatible types
    if (def.type === 'bossHit') converted.type = 'melee';
    if (def.type === 'bossExecute') converted.type = 'melee';
    if (def.type === 'ranged') converted.type = 'ranged';
    if (def.type === 'selfBuff') converted.type = 'buff';
    if (def.type === 'aoeMitigation') converted.type = 'aoeZone';
    if (def.type === 'healLowestNear') converted.type = 'heal';
    if (def.type === 'healAoE') converted.type = 'aoeHeal';
    if (def.type === 'melee') converted.type = 'melee';
    if (def.type === 'aoeCircleAroundPlayer') converted.type = 'aoe';
    if (def.type === 'aoeCircleAtBoss') converted.type = 'aoe';
    return converted;
  }
  
  return def;
}

// Get player stats based on class + role
function getPlayerStats(playerClass, role) {
  let maxHealth = 100;
  let armor = 0;
  
  // Role-based stats
  if (role === 'tank') {
    maxHealth = 150;  // Tanks have 50% more HP
    armor = 0.35;     // 35% damage reduction by default
  } else if (role === 'dd') {
    maxHealth = 75;   // DDs are fragile
    armor = 0.05;     // Very low defense
  } else if (role === 'heal') {
    maxHealth = 85;   // Healers are somewhat fragile
    armor = 0.10;     // Low defense
  }
  
  // Class-based adjustments
  if (playerClass === 'knight') {
    maxHealth += 15;  // Knight is tankier
    armor += 0.05;
  } else if (playerClass === 'mage') {
    maxHealth -= 5;   // Mage is squishier
  } else if (playerClass === 'archer') {
    // Balanced
  }
  
  return { maxHealth, armor };
}

function canCast(player, def) {
  const t = now();
  const last = player.cooldowns[def.key] || 0;
  return (t - last) >= def.cd;
}
function markCast(player, def) { player.cooldowns[def.key] = now(); }

// ---------------------------
// Boss attack pool
// ---------------------------
const RAID_ATTACK_POOL = [
  { key: "slam", windup: 800, active: 600, cooldown: 600, radius: 120, damage: 18 },
  { key: "bigSlam", windup: 1200, active: 800, cooldown: 800, radius: 170, damage: 28 },
  { key: "beam", windup: 900, active: 900, cooldown: 700, width: 50, length: 330, damage: 22 },
];

function raidAttackDef(key) { return RAID_ATTACK_POOL.find(a => a.key === key); }

// ---------------------------
// Mechanic pool
// ---------------------------
const MECHANIC_POOL = [
  { 
    key: "movingHazard", 
    name: "Moving Hazard",
    duration: 4000,
    radius: 80,
    speed: 120,
    damage: 25,
    weight: 40 
  },
  { 
    key: "checkerboard", 
    name: "Checkerboard",
    duration: 6000,
    squareSize: 100,
    damage: 30,
    weight: 30 
  },
  { 
    key: "safeZone", 
    name: "Safe Zone",
    duration: 5000,
    safeRadius: 150,
    damage: 35,
    weight: 30 
  }
];

function generateMechanicRotation(seed, raidSize) {
  const rng = mulberry32(seed);
  const rotation = [];
  
  // Generate 3-5 mechanics based on raid size and seed
  const mechanicCount = 3 + Math.floor(raidSize / 3);
  const weights = MECHANIC_POOL.map(m => m.weight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  for (let i = 0; i < mechanicCount; i++) {
    let rand = rng() * totalWeight;
    for (let j = 0; j < MECHANIC_POOL.length; j++) {
      rand -= MECHANIC_POOL[j].weight;
      if (rand <= 0) {
        rotation.push(MECHANIC_POOL[j].key);
        break;
      }
    }
  }
  
  return rotation;
}

function scheduleMechanics(raid) {
  const rng = mulberry32(raid.seed + 9999);
  const rotation = raid.mechanicRotation;
  const startTime = raid.startedAt;
  
  raid.scheduledMechanics = [];
  let currentTime = startTime + (15000 + Math.floor(rng() * 5000));
  
  for (const mechanicKey of rotation) {
    raid.scheduledMechanics.push({
      key: mechanicKey,
      scheduledAt: currentTime
    });
    const mechanicDef = MECHANIC_POOL.find(m => m.key === mechanicKey);
    const duration = (mechanicDef && mechanicDef.duration) || 5000;
    currentTime += duration + (7000 + Math.floor(rng() * 3000));
  }
  
  console.log(`[RAID] Scheduled ${raid.scheduledMechanics.length} mechanics:`, raid.scheduledMechanics.map(m => `${m.key} @ ${Math.round((m.scheduledAt - startTime) / 1000)}s`));
}

// ---------------------------
// App + WS
// ---------------------------
const app = express();
app.use(cors());
app.use(express.static("../client"));

const httpServer = http.createServer(app);
httpServer.listen(3005, () => console.log("Lobby Server running on :3005"));

const wss = new WebSocket.Server({ server: httpServer });

// ---------------------------
// State
// ---------------------------
const playersById = new Map();     // id -> player
const wsToPlayerId = new Map();    // ws -> id
const duelInvites = new Map();     // targetId -> { fromPlayerId, ts }
const fights = new Map();          // duel fights
const raids = new Map();           // raidId -> raid
let raidNpcId = null;              // track the NPC bot

// ---------------------------
// Initialize Raid NPC Bot
// ---------------------------
function createRaidNpcBot() {
  // Erster Raid Leiter (Mage)
  const botId1 = "bot-raid-leiter-" + uuid();
  const npc1 = {
    id: botId1,
    name: "Raid Leiter",
    x: 700,
    y: 400,
    startX: 700,
    startY: 400,
    world: "city-1",
    role: "tank",
    playerClass: "mage",
    maxHealth: 100,
    health: 100,
    armor: 0,
    inFight: false,
    fightId: null,
    ws: null,
    state: "idle",
    lastState: "idle",
    direction: "right",
    dead: false,
    buffs: [],
    cooldowns: {},
    moveTimer: 0,
    moveTarget: { x: 700, y: 400 }
  };
  playersById.set(botId1, npc1);
  raidNpcId = botId1;

  // Zweiter Raid Leiter (Knight)
  const botId2 = "bot-raid-leiter2-" + uuid();
  const npc2 = {
    id: botId2,
    name: "Raid Leiter 2",
    x: 200,
    y: 400,
    startX: 200,
    startY: 400,
    world: "city-1",
    role: "tank",
    playerClass: "knight",
    maxHealth: 100,
    health: 100,
    armor: 0,
    inFight: false,
    fightId: null,
    ws: null,
    state: "idle",
    lastState: "idle",
    direction: "right",
    dead: false,
    buffs: [],
    cooldowns: {},
    moveTimer: 0,
    moveTarget: { x: 200, y: 400 }
  };
  playersById.set(botId2, npc2);
  return [npc1, npc2];
}

function updateRaidNpcBot() {
  const npc = playersById.get(raidNpcId);
  if (!npc) return;
  
  // Random walk every 3-5 seconds
  npc.moveTimer = (npc.moveTimer || 0) + 1;
  const moveInterval = 180 + Math.floor(Math.random() * 120); // ~3-5 sec at 30Hz
  
  if (npc.moveTimer > moveInterval) {
    npc.moveTimer = 0;
    const moveX = (Math.random() - 0.5) * 80;
    const moveY = (Math.random() - 0.5) * 40;
    npc.moveTarget = {
      x: Math.max(650, Math.min(750, npc.startX + moveX)),
      y: Math.max(350, Math.min(450, npc.startY + moveY))
    };
    
    if (Math.abs(npc.moveTarget.x - npc.x) > 5) {
      npc.direction = npc.moveTarget.x > npc.x ? 'right' : 'left';
      npc.state = 'run';
    } else {
      npc.state = 'idle';
    }
  }
  
  // Move towards target
  if (Math.abs(npc.moveTarget.x - npc.x) > 2) {
    npc.x += (npc.moveTarget.x - npc.x) * 0.05;
  }
  if (Math.abs(npc.moveTarget.y - npc.y) > 2) {
    npc.y += (npc.moveTarget.y - npc.y) * 0.05;
  }
  
  if (Math.abs(npc.moveTarget.x - npc.x) <= 2 && Math.abs(npc.moveTarget.y - npc.y) <= 2) {
    npc.state = 'idle';
  }
}

function updateRaidNpcBot2() {
  // Update Raid Leiter 2 (second NPC)
  const allPlayers = Array.from(playersById.values());
  const npc2 = allPlayers.find(p => p.name === 'Raid Leiter 2');
  if (!npc2) return;
  
  // Random walk every 2-4 seconds (different timing than first NPC)
  npc2.moveTimer = (npc2.moveTimer || 0) + 1;
  const moveInterval = 120 + Math.floor(Math.random() * 120); // ~2-4 sec at 30Hz
  
  if (npc2.moveTimer > moveInterval) {
    npc2.moveTimer = 0;
    const moveX = (Math.random() - 0.5) * 100;
    const moveY = (Math.random() - 0.5) * 60;
    npc2.moveTarget = {
      x: Math.max(150, Math.min(250, npc2.startX + moveX)),
      y: Math.max(350, Math.min(450, npc2.startY + moveY))
    };
    
    if (Math.abs(npc2.moveTarget.x - npc2.x) > 5) {
      npc2.direction = npc2.moveTarget.x > npc2.x ? 'right' : 'left';
      npc2.state = 'run';
    } else {
      npc2.state = 'idle';
    }
  }
  
  // Move towards target
  if (Math.abs(npc2.moveTarget.x - npc2.x) > 2) {
    npc2.x += (npc2.moveTarget.x - npc2.x) * 0.06; // Slightly faster movement
  }
  if (Math.abs(npc2.moveTarget.y - npc2.y) > 2) {
    npc2.y += (npc2.moveTarget.y - npc2.y) * 0.06;
  }
  
  if (Math.abs(npc2.moveTarget.x - npc2.x) <= 2 && Math.abs(npc2.moveTarget.y - npc2.y) <= 2) {
    npc2.state = 'idle';
  }
}

// ---------------------------
// Messaging
// ---------------------------
function send(ws, obj) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

function lobbySnapshot() {
  const arr = [];
  for (const p of playersById.values()) {
    arr.push({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      world: p.world,
      role: p.role,
      playerClass: p.playerClass,
      health: p.health,
      maxHealth: p.maxHealth,
      inFight: p.inFight,
      fightId: p.fightId || null,

      state: p.state || "idle",
      lastState: p.lastState || "idle",
      direction: p.direction || "right",
      dead: !!p.dead
    });
  }
  return arr;
}

// Initialize the Raid NPC Bot on startup
createRaidNpcBot();

// lobby snapshots @ ~30Hz (smooth)
setInterval(() => {
  // Update NPC bots first
  updateRaidNpcBot();
  updateRaidNpcBot2();
  
  broadcast({ event: "lobbySnapshot", lobby: lobbySnapshot() });
}, 33);

// ---------------------------
// Duel Engine (simple)
// ---------------------------
function createDuelFight(p1, p2) {
  const fightId = "duel-" + uuid();
  const fight = { id: fightId, type: "duel", players: [p1.id, p2.id], startedAt: now(), endedAt: null, winnerId: null };
  fights.set(fightId, fight);

  for (const pid of fight.players) {
    const p = playersById.get(pid);
    if (!p) continue;
    p.inFight = true;
    p.fightId = fightId;
    p.dead = false;
    p.health = p.maxHealth;
    p.world = fightId;
    p.buffs = [];
    p.cooldowns = {};
    if (pid === p1.id) { p.x = 300; p.y = 300; }
    if (pid === p2.id) { p.x = 500; p.y = 300; }
    send(p.ws, { event: "fightStarted", fightId, type: "duel", youAre: pid });
  }

  broadcast({ event: "duelStarted", fightId, players: fight.players });
  return fight;
}

function endFight(fight, winnerId) {
  fight.endedAt = now();
  fight.winnerId = winnerId;

  for (const pid of fight.players || []) {
    const p = playersById.get(pid);
    if (!p) continue;
    p.inFight = false;
    p.fightId = null;
    p.world = "city-1";
    p.health = p.maxHealth;
    p.dead = false;
    p.buffs = [];
    p.cooldowns = {};
    send(p.ws, { event: "fightEnded", fightId: fight.id, winnerId });
  }
  fights.delete(fight.id);
}

// ---------------------------
// Raid Engine
// ---------------------------
function createRaid(seedValue) {
  const raidId = "raid-" + uuid();
  const seed = hashSeed(seedValue ?? raidId);
  const rng = mulberry32(seed);

  const rotation = [];
  for (let i = 0; i < 80; i++) {
    const idx = Math.floor(rng() * RAID_ATTACK_POOL.length);
    rotation.push(RAID_ATTACK_POOL[idx].key);
  }

  // Generate mechanic rotation (will be populated when raid starts with member count)
  const mechanicRotation = [];
  const mechanicIndex = 0;

  const raid = {
    id: raidId,
    seed,
    createdAt: now(),
    leaderId: null,
    members: [],
    startedAt: null,
    endedAt: null,

    boss: { x: 400, y: 280, maxHealth: 1000, health: 1000, targetId: null },

    rotation,
    rotationIndex: 0,
    phase: "idle",
    phaseEndsAt: 0,
    currentAttack: null,
    telegraphs: [],
    mitigationZones: [],
    
    // Mechanics
    mechanicRotation,
    mechanicIndex: 0,
    currentMechanic: null,
    mechanicData: null,
    hazards: [],

    damageMult: 1,
    speedMult: 1,
    boss: {
      x: 400, y: 280,
      maxHealth: 1000, health: 1000,
      targetId: null,

      // NEW:
      mode: "stand",            // "stand" | "chase" | "teleport"
      speed: 70,                // pixels/sec
      nextMoveDecisionAt: 0,    // timestamp
      nextTeleportAt: 0,        // timestamp
      anim: "idle",             // "idle" | "walk" | "cast" | "teleport"
      animUntil: 0              // timestamp
    },
  };

  raids.set(raidId, raid);
  return raid;
}

function createCustomRaid(player, settings) {
  const raidId = "raid-" + uuid();
  
  // Use provided seed or generate new one
  const seed = settings.seed ? hashSeed(settings.seed) : hashSeed(raidId);
  const rng = mulberry32(seed);

  // Parse settings with defaults
  const bossHealth = settings.bossHealth || 1000;
  const bossDamage = settings.bossDamage || 1.0;
  const bossSpeed = settings.bossSpeed || 1.0;
  const bossMode = settings.bossMode || "stand";
  const attacks = settings.attacks && settings.attacks.length > 0 ? settings.attacks : ["slam", "bigSlam", "beam"];
  const mechanics = settings.mechanics && settings.mechanics.length > 0 ? settings.mechanics : ["movingHazard", "checkerboard", "safeZone"];

  // Create rotation from selected attacks
  const rotation = [];
  for (let i = 0; i < 80; i++) {
    const idx = Math.floor(rng() * attacks.length);
    rotation.push(attacks[idx]);
  }

  // Create mechanic rotation from selected mechanics
  const mechanicRotation = [];
  const mechanicCount = 5; // Fixed count for custom raids
  for (let i = 0; i < mechanicCount; i++) {
    const idx = Math.floor(rng() * mechanics.length);
    mechanicRotation.push(mechanics[idx]);
  }

  const raid = {
    id: raidId,
    seed,
    createdAt: now(),
    leaderId: player.id,
    members: [],
    startedAt: null,
    endedAt: null,

    rotation,
    rotationIndex: 0,
    phase: "idle",
    phaseEndsAt: 0,
    currentAttack: null,
    telegraphs: [],
    mitigationZones: [],
    
    // Mechanics
    mechanicRotation,
    mechanicIndex: 0,
    currentMechanic: null,
    mechanicData: null,
    hazards: [],

    damageMult: bossDamage,
    speedMult: bossSpeed,
    
    boss: {
      x: 400, y: 280,
      maxHealth: bossHealth, 
      health: bossHealth,
      targetId: null,

      mode: bossMode,
      speed: 70 * bossSpeed,
      nextMoveDecisionAt: 0,
      nextTeleportAt: 0,
      anim: "idle",
      animUntil: 0
    },
    
    // Stats tracking
    stats: {},
    
    // Mark as custom raid
    isCustom: true,
    customSettings: settings
  };

  raids.set(raidId, raid);
  console.log(`[CUSTOM RAID] Created ${raidId} with settings:`, {
    seed: settings.seed || 'random',
    bossHealth,
    bossDamage,
    bossSpeed,
    bossMode,
    attacks,
    mechanics
  });
  return raid;
}

function raidApplyScaling(raid) {
  // Skip scaling for custom raids or apply modified scaling
  if (raid.isCustom) {
    const n = Math.max(1, raid.members.length);
    const baseHealth = raid.customSettings.bossHealth || 1000;
    
    // Apply only partial scaling for custom raids (30% instead of 85%)
    const hpMult = 1 + 0.3 * (n - 1);
    raid.boss.maxHealth = Math.round(baseHealth * hpMult);
    raid.boss.health = raid.boss.maxHealth;
    
    // Keep custom damage and speed settings
    // damageMult and speedMult already set during creation
    return;
  }
  
  // Standard scaling for normal raids
  const n = Math.max(1, raid.members.length);

  const hpMult = 1 + 0.85 * (n - 1);
  raid.boss.maxHealth = Math.round(1000 * hpMult);
  raid.boss.health = raid.boss.maxHealth;

  const dmgMult = 1 + 0.25 * Math.sqrt(n - 1);
  raid.damageMult = dmgMult;

  raid.speedMult = 1 + 0.06 * Math.log2(n);
}

function raidStart(raid) {
  raidApplyScaling(raid);

  // Generate mechanic rotation based on seed and raid size
  raid.mechanicRotation = generateMechanicRotation(raid.seed, raid.members.length);
  raid.mechanicIndex = 0;

  // movement personality derived from seed (deterministic per seed) or custom setting
  const rng = mulberry32(raid.seed);

  // For custom raids, use the specified mode, otherwise determine randomly
  if (!raid.isCustom) {
    const roll = rng();
    if (roll < 0.34) raid.boss.mode = "stand";
    else if (roll < 0.67) raid.boss.mode = "chase";
    else raid.boss.mode = "teleport";
  }
  // For custom raids, mode is already set during creation

  // timings (also deterministic but feel natural)
  raid.boss.nextMoveDecisionAt = now() + 1200 + Math.floor(rng() * 1200);
  raid.boss.nextTeleportAt = now() + 2500 + Math.floor(rng() * 2500);

  raid.boss.anim = "idle";
  raid.boss.animUntil = 0;

  raid.startedAt = now();
  raid.rotationIndex = 0;
  raid.phase = "idle";
  raid.phaseEndsAt = now() + 400;
  raid.currentAttack = null;
  raid.telegraphs = [];
  raid.mitigationZones = [];
  
  // Schedule mechanics throughout the raid
  scheduleMechanics(raid);
  raid.nextMechanicIndex = 0;
  
  // Teleport all raid members to raid world
  for (const memberData of raid.members) {
    const memberId = typeof memberData === 'string' ? memberData : memberData.id;
    const p = playersById.get(memberId);
    if (!p) continue;
    
    p.world = raid.id;
    p.x = 100 + Math.random() * 200;
    p.y = 400 + Math.random() * 100;
    p.health = p.maxHealth;
    p.dead = false;
    
    if (p.ws) {
      send(p.ws, { event: "raidJoined", raidId: raid.id, seed: raid.seed });
      send(p.ws, { event: "systemMessage", text: "Raid startet - viel Erfolg!" });
    }
  }
  
  console.log(`[RAID] Starting raid ${raid.id.substring(0, 8)}... with mechanics:`, raid.mechanicRotation);
}

function raidEnd(raid, reason = "ended") {
  raid.endedAt = now();

  for (const pid of raid.members) {
    const p = playersById.get(pid);
    if (!p) continue;
    p.inFight = false;
    p.fightId = null;
    p.world = "city-1";
    p.health = p.maxHealth;
    p.dead = false;
    p.buffs = [];
    p.cooldowns = {};
    send(p.ws, { event: "raidEnded", raidId: raid.id, reason });
  }
  raids.delete(raid.id);
}

function updateMechanics(raid, t) {
  if (!raid.hazards) raid.hazards = [];
  if (!raid.scheduledMechanics) return;

  // Check if next scheduled mechanic should start
  if (raid.nextMechanicIndex < raid.scheduledMechanics.length) {
    const nextMechanic = raid.scheduledMechanics[raid.nextMechanicIndex];
    
    if (t >= nextMechanic.scheduledAt) {
      const mechanicDef = MECHANIC_POOL.find(m => m.key === nextMechanic.key);
      
      if (mechanicDef) {
        raid.currentMechanic = {
          key: nextMechanic.key,
          def: mechanicDef,
          startedAt: t
        };
        raid.nextMechanicIndex++;
        
        // Spawn initial hazards based on mechanic type
        spawnMechanicHazards(raid, mechanicDef, t);
        console.log(`[RAID] Starting mechanic: ${nextMechanic.key} (scheduled at ${Math.round((nextMechanic.scheduledAt - raid.startedAt) / 1000)}s)`);
      }
    }
  }

  // Update existing hazards
  raid.hazards = raid.hazards.filter(hazard => {
    const age = t - hazard.startedAt;
    
    if (age >= hazard.duration) {
      return false; // Remove expired hazard
    }

    // Update movement for moving hazards
    if (hazard.type === "movingHazard") {
      hazard.x += hazard.vx * (50 / 1000); // 50ms between ticks
      hazard.y += hazard.vy * (50 / 1000);
      
      // Bounce off walls (arena bounds: 0-800, 0-600)
      if (hazard.x - hazard.radius < 0 || hazard.x + hazard.radius > 800) {
        hazard.vx *= -1;
        hazard.x = Math.max(hazard.radius, Math.min(800 - hazard.radius, hazard.x));
      }
      if (hazard.y - hazard.radius < 0 || hazard.y + hazard.radius > 600) {
        hazard.vy *= -1;
        hazard.y = Math.max(hazard.radius, Math.min(600 - hazard.radius, hazard.y));
      }
    }

    return true; // Keep hazard
  });

  // Apply damage to players in hazard zones
  const aliveMembers = raid.members
    .map(id => playersById.get(id))
    .filter(p => p && p.inFight && !p.dead && p.health > 0);

  for (const hazard of raid.hazards) {
    // Only damage once per hazard per 500ms
    if (!hazard.lastDamageAt) hazard.lastDamageAt = 0;
    if (t - hazard.lastDamageAt < 500) continue;

    // SafeZone: add warning phase
    if (hazard.type === "safeZone" && hazard.warningUntil && t < hazard.warningUntil) {
      continue; // No damage during warning
    }

    for (const p of aliveMembers) {
      const dx = p.x + 25 - hazard.x;
      const dy = p.y + 25 - hazard.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (hazard.type === "safeZone") {
        // Only damage if OUTSIDE the safe zone (green circle), but inside the danger radius
        if (dist > hazard.safeRadius && dist < hazard.radius) {
          p.health = Math.max(0, p.health - hazard.damage);
          hazard.lastDamageAt = t;
        }
      } else {
        if (dist < hazard.radius) {
          p.health = Math.max(0, p.health - hazard.damage);
          hazard.lastDamageAt = t;
        }
      }
    }
  }
}

function spawnMechanicHazards(raid, mechanicDef, t) {
  if (mechanicDef.key === "movingHazard") {
    // Spawn 2-3 moving hazards at random positions
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = mechanicDef.speed || 120;
      
      raid.hazards.push({
        type: "movingHazard",
        x: 400 + Math.cos(angle) * 150,
        y: 300 + Math.sin(angle) * 150,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: mechanicDef.radius || 80,
        damage: mechanicDef.damage || 25,
        duration: mechanicDef.duration || 4000,
        startedAt: t,
        lastDamageAt: 0
      });
    }
  } else if (mechanicDef.key === "checkerboard") {
    // Spawn checkerboard pattern
    const squareSize = mechanicDef.squareSize || 100;
    for (let x = 0; x < 800; x += squareSize * 2) {
      for (let y = 0; y < 600; y += squareSize * 2) {
        raid.hazards.push({
          type: "checkerboard",
          x: x + squareSize / 2,
          y: y + squareSize / 2,
          squareSize: squareSize,
          radius: squareSize / 2,
          damage: mechanicDef.damage || 30,
          duration: mechanicDef.duration || 6000,
          startedAt: t,
          lastDamageAt: 0
        });
      }
    }
  } else if (mechanicDef.key === "safeZone") {
    // Safe zone at boss center (only outside is dangerous)
    // Add a warning phase: first 2s no damage, then damage for the rest
    const warningTime = 2000; // ms
    raid.hazards.push({
      type: "safeZone",
      x: raid.boss.x + 25,
      y: raid.boss.y + 25,
      safeRadius: mechanicDef.safeRadius || 150,
      radius: 500, // Large danger radius (entire arena is "outside")
      damage: mechanicDef.damage || 35,
      duration: (mechanicDef.duration || 5000) + warningTime,
      startedAt: t,
      lastDamageAt: 0,
      warningUntil: t + warningTime
    });
  }
}


function raidSnapshot(raid) {
  return {
    id: raid.id,
    seed: raid.seed,
    leaderId: raid.leaderId,
    members: raid.members,
    startedAt: raid.startedAt,
    boss: { x: raid.boss.x, y: raid.boss.y, health: raid.boss.health, maxHealth: raid.boss.maxHealth },
    telegraphs: raid.telegraphs,
    hazards: (raid.hazards || []).map(h => ({
      type: h.type,
      x: h.x,
      y: h.y,
      radius: h.radius,
      safeRadius: h.safeRadius,
      squareSize: h.squareSize
    })),
    phase: raid.phase,
    currentAttack: raid.currentAttack ? { key: raid.currentAttack.key, startedAt: raid.currentAttack.startedAt } : null,
    // Add stats for each member (dummy values for now)
    stats: Object.fromEntries((raid.members||[]).map(id => [id, {
      damage: (raid.stats && raid.stats[id] && raid.stats[id].damage) || 0,
      healing: (raid.stats && raid.stats[id] && raid.stats[id].healing) || 0,
      protection: (raid.stats && raid.stats[id] && raid.stats[id].protection) || 0
    }]))
  };
}

function buildTelegraph(raid, def, alivePlayers) {
  if (def.key === "slam" || def.key === "bigSlam") {
    return [{
      type: "circle",
      x: raid.boss.x,
      y: raid.boss.y,
      radius: def.radius,
      until: raid.phaseEndsAt
    }];
  }

  if (def.key === "beam") {
    const target = alivePlayers.find(p => p.id === raid.boss.targetId) || alivePlayers[0];
    const dx = (target.x + 25) - raid.boss.x;
    const dy = (target.y + 25) - raid.boss.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len;

    return [{
      type: "beam",
      x: raid.boss.x,
      y: raid.boss.y,
      nx, ny,
      width: def.width,
      length: def.length,
      until: raid.phaseEndsAt
    }];
  }

  return [];
}

function getPlayerDR(p) {
  const t = now();
  p.buffs = (p.buffs || []).filter(b => b.until > t);
  let dr = 0;
  for (const b of p.buffs) dr = Math.max(dr, b.dr || 0);
  return dr;
}

function getZoneDR(raid, p) {
  const t = now();
  raid.mitigationZones = (raid.mitigationZones || []).filter(z => z.until > t);
  let dr = 0;
  for (const z of raid.mitigationZones) {
    if (distance(p.x + 25, p.y + 25, z.x, z.y) <= z.radius) dr = Math.max(dr, z.dr || 0);
  }
  return dr;
}

function applyRaidDamageOnce(raid, def, alivePlayers) {
  for (const p of alivePlayers) {
    if (p.dead || p.health <= 0) continue;

    const roleMult = (p.role === "tank") ? 0.7 : (p.role === "heal" ? 1.1 : 1.0);
    let hit = false;

    if (def.key === "slam" || def.key === "bigSlam") {
      hit = distance(p.x + 25, p.y + 25, raid.boss.x, raid.boss.y) <= def.radius;
    }

    if (def.key === "beam") {
      const tg = raid.telegraphs?.[0];
      if (!tg) continue;

      const bx = raid.boss.x, by = raid.boss.y;
      const tx = bx + def.length * tg.nx;
      const ty = by + def.length * tg.ny;

      const px = p.x + 25, py = p.y + 25;
      const vx = tx - bx, vy = ty - by;
      const wx = px - bx, wy = py - by;

      const c1 = wx * vx + wy * vy;
      if (c1 <= 0) hit = false;
      else {
        const c2 = vx * vx + vy * vy;
        const b = c1 / c2;
        if (b >= 0 && b <= 1) {
          const projx = bx + b * vx;
          const projy = by + b * vy;
          hit = distance(px, py, projx, projy) <= def.width;
        }
      }
    }

    if (hit) {
      const base = Math.round(def.damage * roleMult * (raid.damageMult || 1));
      const dr = Math.min(0.75, getPlayerDR(p) + getZoneDR(raid, p));
      const dmg = Math.max(1, Math.round(base * (1 - dr)));

      p.health = clamp(p.health - dmg, 0, p.maxHealth);
      send(p.ws, { event: "combatText", text: `-${dmg}`, x: p.x + 25, y: p.y });

      if (p.health <= 0 && !p.dead) {
        p.dead = true;
        send(p.ws, { event: "playerDied" });
      }
    }
  }
}

// Tick raids @ 20Hz
setInterval(() => {
  const t = now();

  for (const raid of raids.values()) {
    if (!raid.startedAt || raid.endedAt) continue;

    // cleanup zones
    raid.mitigationZones = (raid.mitigationZones || []).filter(z => z.until > t);

    // update mechanics and hazards
    updateMechanics(raid, t);

    // victory
    if (raid.boss.health <= 0) {
      raidEnd(raid, "bossDefeated");
      continue;
    }

    // alive members
    const alive = raid.members
      .map(id => playersById.get(id))
      .filter(p => p && p.inFight && !p.dead && p.health > 0);

    if (alive.length === 0) {
      raidEnd(raid, "partyWiped");
      continue;
    }

    // boss target: prefer tank
    const tank = alive.find(p => p.role === "tank");
    raid.boss.targetId = (tank || alive[0]).id;
    updateBossMovement(raid, alive);

    const speed = raid.speedMult || 1;

    if (t >= raid.phaseEndsAt) {
      if (raid.phase === "idle") {
        const key = raid.rotation[raid.rotationIndex % raid.rotation.length];
        raid.rotationIndex++;
        const def = raidAttackDef(key);

        raid.phase = "windup";
        raid.phaseEndsAt = t + Math.round(def.windup / speed);
        raid.currentAttack = { key, startedAt: t };
        raid.telegraphs = buildTelegraph(raid, def, alive);

      } else if (raid.phase === "windup") {
        const def = raidAttackDef(raid.currentAttack.key);

        raid.phase = "active";
        raid.phaseEndsAt = t + Math.round(def.active / speed);
        applyRaidDamageOnce(raid, def, alive);

      } else if (raid.phase === "active") {
        const def = raidAttackDef(raid.currentAttack.key);

        raid.phase = "cooldown";
        raid.phaseEndsAt = t + Math.round(def.cooldown / speed);
        raid.telegraphs = [];

      } else if (raid.phase === "cooldown") {
        raid.phase = "idle";
        raid.phaseEndsAt = t + Math.round(400 / speed);
        raid.currentAttack = null;
      }
    }

    // broadcast raid state
    const snap = raidSnapshot(raid);
    for (const pid of raid.members) {
      const p = playersById.get(pid);
      if (p) send(p.ws, { event: "raidState", raid: snap });
    }
  }
}, 50);

// ---------------------------
// Skill handling (Raid + Duel)
// ---------------------------
function handleSkillCast(caster, msg) {
  const slot = Number(msg.slot);
  const fightId = caster.fightId;
  if (!fightId) return;
  if (caster.dead) return;

  // DUEL
  if (fightId.startsWith("duel-")) {
    const def = getSkillDef(caster, slot, 'duel');
    if (!def) return;
    if (!canCast(caster, def)) return;
    markCast(caster, def);

    const fight = fights.get(fightId);
    if (!fight || fight.endedAt) return;

    const enemyId = fight.players.find(id => id !== caster.id);
    const enemy = playersById.get(enemyId);
    if (!enemy) return;

    // Helper to send VFX to both players in duel
    const vfxToDuel = (shape) => {
      const payload = { event: "skillVfx", shape };
      if (def.effect) {
        payload.effect = def.effect;
      }
      send(caster.ws, payload);
      send(enemy.ws, payload);
    };

    // Helper to calculate damage with armor mitigation
    const calculateDamage = (baseDamage, targetArmor) => {
      return Math.floor(baseDamage * (1 - Math.max(0, Math.min(targetArmor, 0.9))));
    };

    const casterCx = caster.x + 25;
    const casterCy = caster.y + 25;

    // MELEE damage (slots 1-2, close range)
    if (def.type === 'melee') {
      if (distance(caster.x, caster.y, enemy.x, enemy.y) > 100) return;
      const dmg = calculateDamage(def.dmg, enemy.armor);
      enemy.health = clamp(enemy.health - dmg, 0, enemy.maxHealth);
      
      // Show telegraph (cone around caster pointing in direction)
      const nx = (caster.direction === 'left') ? -1 : 1;
      const ny = 0;
      vfxToDuel({ type: "cone", x: casterCx, y: casterCy, nx, ny, length: 100, angle: Math.PI / 2, r: 255, g: 180, b: 80, duration: 200, fadeOut: true });
      
      send(enemy.ws, { event: "combatText", text: `-${dmg}`, x: enemy.x + 25, y: enemy.y });
      send(caster.ws, { event: "combatText", text: `-${dmg}`, x: enemy.x + 25, y: enemy.y });
      if (enemy.health <= 0) endFight(fight, caster.id);
      return;
    }

    // RANGED damage (slots 1-2, any range)
    if (def.type === 'ranged') {
      const dmg = calculateDamage(def.dmg, enemy.armor);
      enemy.health = clamp(enemy.health - dmg, 0, enemy.maxHealth);
      
      // Show telegraph (beam from caster to enemy)
      const dx = enemy.x - caster.x;
      const dy = enemy.y - caster.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      vfxToDuel({ type: "beam", x: casterCx, y: casterCy, nx: dx / len, ny: dy / len, length: len, width: 8, r: 255, g: 90, b: 30, duration: 160, fadeOut: true });
      
      send(enemy.ws, { event: "combatText", text: `-${dmg}`, x: enemy.x + 25, y: enemy.y });
      send(caster.ws, { event: "combatText", text: `-${dmg}`, x: enemy.x + 25, y: enemy.y });
      if (enemy.health <= 0) endFight(fight, caster.id);
      return;
    }

    // HEAL (slot 3 for healer)
    if (def.type === 'heal') {
      const healed = clamp(def.heal, 0, caster.maxHealth - caster.health);
      caster.health = clamp(caster.health + healed, 0, caster.maxHealth);
      
      // Show telegraph (heal pulse on caster)
      vfxToDuel({ type: "circle", x: casterCx, y: casterCy, radius: 50, r: 140, g: 255, b: 140, lineWidth: 3, duration: 320, fadeOut: true });
      
      send(caster.ws, { event: "combatText", text: '+' + healed, x: caster.x + 25, y: caster.y });
      send(enemy.ws, { event: "combatText", text: '+' + healed, x: caster.x + 25, y: caster.y });
      return;
    }

    // AOE HEAL (slot 4 for healer)
    if (def.type === 'aoeHeal') {
      const healed = clamp(def.heal, 0, caster.maxHealth - caster.health);
      caster.health = clamp(caster.health + healed, 0, caster.maxHealth);
      
      // Show telegraph (large heal circle)
      vfxToDuel({ type: "filledCircle", x: casterCx, y: casterCy, radius: 100, r: 140, g: 255, b: 140, alpha: 0.2, duration: 800, fadeOut: false });
      
      send(caster.ws, { event: "combatText", text: '+' + healed, x: caster.x + 25, y: caster.y });
      send(enemy.ws, { event: "combatText", text: '+' + healed, x: caster.x + 25, y: caster.y });
      return;
    }

    // BUFF (slot 3 for tank)
    if (def.type === 'buff') {
      caster.mitigationUntil = now() + def.dur;
      
      // Show telegraph (shield effect on caster)
      vfxToDuel({ type: "ringPulse", x: casterCx, y: casterCy, radius: 40, r: 120, g: 200, b: 255, pulse: 20, duration: def.dur, fadeOut: false });
      
      send(caster.ws, { event: "combatText", text: "SHIELD", x: caster.x + 25, y: caster.y });
      send(enemy.ws, { event: "combatText", text: "SHIELD", x: caster.x + 25, y: caster.y });
      return;
    }

    // AOE ZONE (slot 4 for tank)
    if (def.type === 'aoeZone') {
      caster.mitigationUntil = now() + def.dur;
      
      // Show telegraph (large protection zone)
      vfxToDuel({ type: "filledCircle", x: casterCx, y: casterCy, radius: 120, r: 80, g: 170, b: 255, alpha: 0.15, duration: def.dur, fadeOut: false });
      
      send(caster.ws, { event: "combatText", text: "ZONE", x: caster.x + 25, y: caster.y });
      send(enemy.ws, { event: "combatText", text: "ZONE", x: caster.x + 25, y: caster.y });
      return;
    }

    return;
  }

  // RAID
  if (fightId.startsWith("raid-")) {
    const def = getSkillDef(caster, slot, 'raid');
    if (!def) return;
    if (!canCast(caster, def)) return;
    markCast(caster, def);

    const raid = raids.get(fightId);
    if (!raid || raid.endedAt || !raid.startedAt) return;

    // --- Stats init ---
    if (!raid.stats) raid.stats = {};
    if (!raid.stats[caster.id]) raid.stats[caster.id] = { damage: 0, healing: 0, protection: 0 };

    const members = raid.members.map(id => playersById.get(id)).filter(Boolean);
    const alive = members.filter(p => p.inFight && !p.dead && p.health > 0);

    const vfxToRaid = (shape) => {
      const payload = { event: "skillVfx", shape };
      if (def.effect) {
        payload.effect = def.effect;
      }
      for (const pid of raid.members) {
        const p = playersById.get(pid);
        if (p) send(p.ws, payload);
      }
    };

    const casterCx = caster.x + 25;
    const casterCy = caster.y + 25;

    // facing
    const nx = (caster.direction === "left") ? -1 : 1;
    const ny = 0;

    // ---- Types ----
    if (def.type === "melee") {
      const dist = distance(casterCx, casterCy, raid.boss.x, raid.boss.y);
      if (dist > def.range) {
        send(caster.ws, { event: "combatText", text: "Miss!", x: raid.boss.x, y: raid.boss.y });
        return;
      }
      raid.boss.health = Math.max(0, raid.boss.health - def.dmg);
      raid.stats[caster.id].damage += def.dmg;
      vfxToRaid({ ...def.vfx, type: "cone", x: casterCx, y: casterCy, nx, ny, start: now(), duration: 240, fadeOut: true });
      send(caster.ws, { event: "combatText", text: `boss -${def.dmg}` , x: raid.boss.x, y: raid.boss.y });
      return;
    }

    if (def.type === "aoeCircleAroundPlayer") {
      const dist = distance(casterCx, casterCy, raid.boss.x, raid.boss.y);
      if (dist <= def.radius) {
        raid.boss.health = Math.max(0, raid.boss.health - def.dmg);
        raid.stats[caster.id].damage += def.dmg;
        send(caster.ws, { event: "combatText", text: `boss -${def.dmg}` , x: raid.boss.x, y: raid.boss.y });
      }
      vfxToRaid({ ...def.vfx, x: casterCx, y: casterCy, start: now(), duration: 350, fadeOut: true });
      return;
    }

    if (def.type === "ranged") {
      const dist = distance(casterCx, casterCy, raid.boss.x, raid.boss.y);
      if (dist > def.range) {
        send(caster.ws, { event: "combatText", text: "Miss!", x: raid.boss.x, y: raid.boss.y });
        return;
      }
      raid.boss.health = Math.max(0, raid.boss.health - def.dmg);
      raid.stats[caster.id].damage += def.dmg;
      const dx = raid.boss.x - casterCx;
      const dy = raid.boss.y - casterCy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      vfxToRaid({ ...def.vfx, type: "beam", x: casterCx, y: casterCy, nx: dx / len, ny: dy / len, start: now(), duration: 160, fadeOut: true });
      send(caster.ws, { event: "combatText", text: `boss -${def.dmg}` , x: raid.boss.x, y: raid.boss.y });
      return;
    }

    if (def.type === "aoeCircleAtBoss") {
      raid.boss.health = Math.max(0, raid.boss.health - def.dmg);
      raid.stats[caster.id].damage += def.dmg;
      vfxToRaid({ ...def.vfx, x: raid.boss.x, y: raid.boss.y, start: now(), duration: 650, fadeOut: true });
      send(caster.ws, { event: "combatText", text: `boss -${def.dmg}` , x: raid.boss.x, y: raid.boss.y });
      return;
    }

    if (def.type === "bossHit") {
      const dist = distance(casterCx, casterCy, raid.boss.x, raid.boss.y);
      if (dist > 260) return;
      raid.boss.health = Math.max(0, raid.boss.health - def.dmg);
      raid.stats[caster.id].damage += def.dmg;
      vfxToRaid({ ...def.vfx, x: raid.boss.x, y: raid.boss.y, start: now(), duration: 350, fadeOut: true });
      send(caster.ws, { event: "combatText", text: `boss -${def.dmg}`, x: raid.boss.x, y: raid.boss.y });
      return;
    }

    if (def.type === "bossExecute") {
      const dist = distance(casterCx, casterCy, raid.boss.x, raid.boss.y);
      if (dist > 260) return;
      let dmg = def.dmg;
      const pct = raid.boss.health / raid.boss.maxHealth;
      if (pct <= def.bonusBelow) dmg += def.bonusDmg;
      raid.boss.health = Math.max(0, raid.boss.health - dmg);
      raid.stats[caster.id].damage += dmg;
      vfxToRaid({ ...def.vfx, x: raid.boss.x, y: raid.boss.y, start: now(), duration: 380, fadeOut: true });
      send(caster.ws, { event: "combatText", text: 'boss -' + dmg, x: raid.boss.x, y: raid.boss.y });
      return;
    }

    if (def.type === "selfBuff") {
      caster.buffs = caster.buffs || [];
      caster.buffs.push({ key: def.key, until: now() + def.dur, dr: def.dr });
      raid.stats[caster.id].protection += 1;
      vfxToRaid({ ...def.vfx, x: casterCx, y: casterCy, start: now(), duration: def.dur, fadeOut: false });
      send(caster.ws, { event: "combatText", text: 'SHIELD', x: casterCx, y: caster.y });
      return;
    }

    if (def.type === "aoeMitigation") {
      raid.mitigationZones = raid.mitigationZones || [];
      raid.mitigationZones.push({ key: def.key, x: casterCx, y: casterCy, radius: def.radius, dr: def.dr, until: now() + def.dur });
      raid.stats[caster.id].protection += 1;
      vfxToRaid({ ...def.vfx, x: casterCx, y: casterCy, start: now(), duration: def.dur, fadeOut: false });
      send(caster.ws, { event: "combatText", text: 'PROTECT', x: casterCx, y: caster.y });
      return;
    }

    if (def.type === "healLowestNear") {
      const inRange = alive.filter(p => distance(p.x + 25, p.y + 25, casterCx, casterCy) <= def.radius);
      if (inRange.length === 0) return;
      inRange.sort((a, b) => a.health - b.health);
      const target = inRange[0];
      const healed = clamp(def.heal, 0, target.maxHealth - target.health);
      target.health = clamp(target.health + healed, 0, target.maxHealth);
      raid.stats[caster.id].healing += healed;
      vfxToRaid({ ...def.vfx, x: target.x + 25, y: target.y + 25, start: now(), duration: 320, fadeOut: true });
      send(target.ws, { event: "combatText", text: '+' + healed, x: target.x + 25, y: target.y });
      return;
    }

    if (def.type === "healAoE") {
      const inRange = alive.filter(p => distance(p.x + 25, p.y + 25, casterCx, casterCy) <= def.radius);
      if (inRange.length === 0) return;
      vfxToRaid({ ...def.vfx, x: casterCx, y: casterCy, start: now(), duration: 800, fadeOut: false });
      let totalHealed = 0;
      for (const p of inRange) {
        const healed = clamp(def.heal, 0, p.maxHealth - p.health);
        p.health = clamp(p.health + healed, 0, p.maxHealth);
        totalHealed += healed;
        send(p.ws, { event: "combatText", text: '+' + healed, x: p.x + 25, y: p.y });
      }
      raid.stats[caster.id].healing += totalHealed;
      return;
    }
  }
}

// ---------------------------
// Commands via chat
// ---------------------------
function findPlayerByName(name) {
  const lower = (name || "").toLowerCase();
  for (const p of playersById.values()) {
    if ((p.name || "").toLowerCase() === lower) return p;
  }
  return null;
}

function handleChatCommand(ws, text) {
  const pid = wsToPlayerId.get(ws);
  const me = pid ? playersById.get(pid) : null;
  if (!me) return;

  const parts = text.split(" ").filter(Boolean);
  const cmd = parts[0].toLowerCase();

  if (cmd === "/duel") {
    if (me.inFight) return send(ws, { event: "systemMessage", text: "Du bist bereits in einem Fight." });
    const targetName = parts.slice(1).join(" ");
    const target = findPlayerByName(targetName);
    if (!target) return send(ws, { event: "systemMessage", text: "Spieler '" + targetName + "' nicht gefunden." });
    if (target.inFight) return send(ws, { event: "systemMessage", text: "Der Spieler ist bereits in einem Fight." });
    if (!target.ws || target.ws.readyState !== WebSocket.OPEN) {
      console.log('[DUEL] Cannot send invite to ' + target.name + ': ws=' + (!!target.ws) + ', readyState=' + (target.ws ? target.ws.readyState : 'null'));
      return send(ws, { event: "systemMessage", text: "Spieler ist nicht verbunden oder hat Verbindung unterbrochen." });
    }
    if (target.id === me.id) return;

    duelInvites.set(target.id, { fromPlayerId: me.id, ts: now() });
    console.log('[DUEL] Sending invite from ' + me.name + ' to ' + target.name);
    send(target.ws, { event: "duelInvite", from: me.name, fromId: me.id });
    send(ws, { event: "systemMessage", text: "Duel-Invite an " + target.name + " gesendet. Tippe /accept" });
    return;
  }

  if (cmd === "/accept") {
    if (me.inFight) return;
    const inv = duelInvites.get(me.id);
    if (!inv) return send(ws, { event: "systemMessage", text: "Kein Duel-Invite offen." });
    const from = playersById.get(inv.fromPlayerId);
    duelInvites.delete(me.id);
    if (!from || from.inFight) return send(ws, { event: "systemMessage", text: "Invite ist abgelaufen." });
    if (!from.ws || from.ws.readyState !== WebSocket.OPEN) {
      return send(ws, { event: "systemMessage", text: "Gegner hat Verbindung unterbrochen." });
    }
    createDuelFight(from, me);
    return;
  }

  if (cmd === "/raid") {
    const sub = (parts[1] || "").toLowerCase();

    if (sub === "menu") {
      // Open raid board UI
      send(ws, { event: "raidList", raids: Array.from(raids.values())
        .filter(r => !r.startedAt)
        .map(r => ({ id: r.id, seed: r.seed, leaderId: r.leaderId, members: r.members, createdAt: r.createdAt })) });
      return;
    }

    if (sub === "create") {
      if (me.inFight) return send(ws, { event: "systemMessage", text: "Du bist bereits in einem Fight." });
      const seedArg = parts[2]; // optional
      const raid = createRaid(seedArg ?? uuid());
      raid.leaderId = me.id;

      // auto-join leader
      raid.members.push(me.id);
      me.inFight = true;
      me.fightId = raid.id;
      me.world = raid.id;
      me.health = me.maxHealth;
      me.dead = false;
      me.buffs = [];
      me.cooldowns = {};
      me.x = 400; me.y = 470;

      send(ws, { event: "raidJoined", raidId: raid.id, seed: raid.seed });
      send(ws, { event: "raidState", raid: raidSnapshot(raid) });
      send(ws, { event: "systemMessage", text: "Raid erstellt & gejoint: " + raid.id + ". Jetzt /raid start" });
      return;
    }

    if (sub === "join") {
      if (me.inFight) return send(ws, { event: "systemMessage", text: "Du bist bereits in einem Fight." });
      const raidId = parts[2];
      const raid = raids.get(raidId);
      if (!raid) return send(ws, { event: "systemMessage", text: "Raid nicht gefunden." });
      if (raid.members.includes(me.id)) return;

      raid.members.push(me.id);
      me.inFight = true;
      me.fightId = raid.id;
      me.world = raid.id;
      me.health = me.maxHealth;
      me.dead = false;
      me.buffs = [];
      me.cooldowns = {};

      me.x = 380 + Math.floor(Math.random() * 40);
      me.y = 470 + Math.floor(Math.random() * 30);

      send(ws, { event: "raidJoined", raidId: raid.id, seed: raid.seed });
      send(ws, { event: "raidState", raid: raidSnapshot(raid) });
      send(ws, { event: "systemMessage", text: "Raid gejoint: " + raid.id + ". Leader kann /raid start" });
      return;
    }

    if (sub === "start") {
      const raidId = me.fightId;
      const raid = raidId ? raids.get(raidId) : null;
      if (!raid) return send(ws, { event: "systemMessage", text: "Du bist in keinem Raid." });
      if (raid.leaderId !== me.id) return send(ws, { event: "systemMessage", text: "Nur der Leader kann starten." });
      if (raid.startedAt) return send(ws, { event: "systemMessage", text: "Raid läuft bereits." });

      raidStart(raid);
      broadcast({ event: "systemBroadcast", text: raid.id + " gestartet! (seed=" + raid.seed + ")" });
      return;
    }

    return send(ws, { event: "systemMessage", text: "Commands: /raid menu | /raid create <seed?> | /raid join <raidId> | /raid start" });
  }

  if (cmd === "/leave") {
    if (!me.inFight) return;

    const fid = me.fightId;

    if (fid?.startsWith("duel-")) {
      const fight = fights.get(fid);
      if (fight && !fight.endedAt) {
        const otherId = fight.players.find(x => x !== me.id);
        endFight(fight, otherId || null);
      }
      return;
    }

    if (fid?.startsWith("raid-")) {
      const raid = raids.get(fid);
      if (raid) {
        raid.members = raid.members.filter(x => x !== me.id);
        if (raid.members.length === 0) raids.delete(raid.id);
      }
      me.inFight = false;
      me.fightId = null;
      me.world = "city-1";
      me.health = 100;
      me.dead = false;
      me.buffs = [];
      me.cooldowns = {};
      send(ws, { event: "systemMessage", text: "Du hast den Raid verlassen." });
      return;
    }
  }

  send(ws, { event: "systemMessage", text: "Unbekannter Command." });
}

// ---------------------------
// WS Connection
// ---------------------------
wss.on("connection", function connection(ws) {
  send(ws, { event: "lobbySnapshot", lobby: lobbySnapshot() });

  ws.on("message", function incoming(raw) {
    const msg = safeJsonParse(raw);
    if (!msg) return;

    if (msg.event === "chatMessage") {
      const text = (msg.message || "").trim();
      if (text.startsWith("/")) {
        handleChatCommand(ws, text);
        return;
      }
      broadcast({ event: "chatMessage", from: msg.from, message: msg.message });
      return;
    }

    if (msg.event === "skillCast") {
      const pid = wsToPlayerId.get(ws);
      const me = pid ? playersById.get(pid) : null;
      if (!me) return;
      handleSkillCast(me, msg);
      return;
    }

    if (msg.event === "requestRaidList") {
      // return list of raids that are created but not yet started
      const list = Array.from(raids.values())
        .filter(r => !r.startedAt)
        .map(r => ({ id: r.id, seed: r.seed, leaderId: r.leaderId, members: r.members, createdAt: r.createdAt }));
      send(ws, { event: "raidList", raids: list });
      return;
    }

    if (msg.event === "createCustomRaid") {
      const pid = wsToPlayerId.get(ws);
      const me = pid ? playersById.get(pid) : null;
      if (!me) return;
      
      if (me.inFight) {
        return send(ws, { event: "systemMessage", text: "Du bist bereits in einem Fight." });
      }
      
      const settings = msg.settings || {};
      const raid = createCustomRaid(me, settings);
      
      // Add player to raid
      me.inFight = true;
      me.fightId = raid.id;
      me.dead = false;
      me.health = me.maxHealth;
      
      raid.members.push(me.id);
      raid.leaderId = me.id;
      
      send(ws, { event: "systemMessage", text: "Custom Raid erstellt: " + raid.id });
      
      // Start the raid (this will teleport player and send raidJoined)
      raidStart(raid);
      
      // Send raid state to player
      send(ws, { event: "raidState", raid: raidSnapshot(raid) });
      
      broadcast({
        event: "raidStarted",
        raidId: raid.id,
        members: raid.members
      });
      
      send(ws, { event: "systemMessage", text: "Custom Raid gestartet!" });
      return;
    }

    // Player snapshot (from your client)
    const playerId = msg.id;
    if (!playerId) return;

    wsToPlayerId.set(ws, playerId);

    let p = playersById.get(playerId);
    if (!p) {
      const stats = getPlayerStats(msg.playerClass || "knight", msg.role || "tank");
      p = {
        id: playerId,
        name: msg.name || "unknown-player",
        x: msg.x ?? 400,
        y: msg.y ?? 250,
        world: msg.world || "city-1",
        role: msg.role || "tank",
        playerClass: msg.playerClass || "knight",
        maxHealth: stats.maxHealth,
        health: stats.maxHealth,
        armor: stats.armor,
        inFight: false,
        fightId: null,
        ws,

        state: msg.state || "idle",
        lastState: msg.lastState || "idle",
        direction: msg.direction || "right",

        dead: false,
        buffs: [],
        cooldowns: {}
      };
      playersById.set(playerId, p);
    }

    p.ws = ws;

    // accept state/direction for animation
    p.direction = msg.direction || p.direction || "right";
    p.state = msg.state || p.state || "idle";
    p.lastState = msg.lastState || p.lastState || "idle";

    // allow changing name always (short)
    p.name = (msg.name || p.name).slice(0, 24);

    // only allow role/class change in lobby
    if (!p.inFight) {
      p.role = msg.role || p.role;
      p.playerClass = msg.playerClass || p.playerClass;
    }

    // movement: ignore if dead
    if (!p.dead) {
      p.x = clamp(msg.x ?? p.x, 0, 800 - 50);
      p.y = clamp(msg.y ?? p.y, 0, 600 - 48);
    }
  });

  ws.on("close", function () {
    const pid = wsToPlayerId.get(ws);
    wsToPlayerId.delete(ws);
    if (!pid) return;

    const p = playersById.get(pid);
    playersById.delete(pid);

    // cleanup invites
    for (const [targetId, inv] of duelInvites.entries()) {
      if (targetId === pid || inv.fromPlayerId === pid) duelInvites.delete(targetId);
    }

    broadcast({ event: "connectionClosed", id: pid });

    // if in duel -> other wins
    if (p?.inFight && p.fightId?.startsWith("duel-")) {
      const fight = fights.get(p.fightId);
      if (fight && !fight.endedAt) {
        const otherId = fight.players.find(x => x !== pid);
        endFight(fight, otherId || null);
      }
    }

    // if in raid -> remove member
    if (p?.inFight && p.fightId?.startsWith("raid-")) {
      const raid = raids.get(p.fightId);
      if (raid) {
        raid.members = raid.members.filter(x => x !== pid);
        if (raid.members.length === 0) raids.delete(raid.id);
      }
    }
  });
});

function updateBossMovement(raid, alivePlayers) {
  const t = now();
  if (!raid.startedAt || raid.endedAt) return;
  if (!alivePlayers || alivePlayers.length === 0) return;

  // deterministic rng stream per raid; we advance it via rotationIndex + time buckets
  // (keeps it stable enough but still varied)
  const rng = mulberry32(raid.seed ^ (raid.rotationIndex * 2654435761));

  // choose target (prefer tank)
  const tank = alivePlayers.find(p => p.role === "tank");
  const target = alivePlayers.find(p => p.id === raid.boss.targetId) || tank || alivePlayers[0];
  if (!target) return;

  // if boss is mid "teleport anim", keep anim state
  if (raid.boss.animUntil > t) return;

  // occasionally re-decide behavior (seeded)
  // Skip mode changes for custom raids - they have a fixed mode
  if (!raid.isCustom && t >= raid.boss.nextMoveDecisionAt) {
    const roll = rng();
    if (roll < 0.33) raid.boss.mode = "stand";
    else if (roll < 0.75) raid.boss.mode = "chase";
    else raid.boss.mode = "teleport";

    raid.boss.nextMoveDecisionAt = t + 1200 + Math.floor(rng() * 1600);
  }

  // teleport mode: blink near target every few seconds
  if (raid.boss.mode === "teleport" && t >= raid.boss.nextTeleportAt) {
    const tx = target.x + 25;
    const ty = target.y + 25;

    // random offset around target (safe bounds)
    const angle = rng() * Math.PI * 2;
    const dist = 140 + rng() * 120;
    const nx = Math.cos(angle), ny = Math.sin(angle);

    const newX = clamp(tx + nx * dist, 60, 740);
    const newY = clamp(ty + ny * dist, 60, 540);

    // broadcast teleport vfx to raid
    broadcastRaidVfx(raid, [
      { type:"ringPulse", x: raid.boss.x, y: raid.boss.y, radius: 35, pulse: 45, r:180,g:80,b:255, start:t, duration: 260, fadeOut:true },
      { type:"ringPulse", x: newX, y: newY, radius: 35, pulse: 45, r:180,g:80,b:255, start:t+80, duration: 260, fadeOut:true }
    ]);

    raid.boss.x = newX;
    raid.boss.y = newY;

    raid.boss.anim = "teleport";
    raid.boss.animUntil = t + 280;

    raid.boss.nextTeleportAt = t + 2200 + Math.floor(rng() * 2600);
    return;
  }

  // chase mode: move slowly toward tank/target (but don't overlap)
  if (raid.boss.mode === "chase") {
    const bx = raid.boss.x;
    const by = raid.boss.y;
    const tx = target.x + 25;
    const ty = target.y + 25;

    const dx = tx - bx;
    const dy = ty - by;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;

    // keep some distance so it's readable
    const desired = 140;
    const dist = len;

    if (dist > desired) {
      const step = raid.boss.speed * 0.05; // tick is 50ms
      const ux = dx / len;
      const uy = dy / len;

      raid.boss.x = clamp(bx + ux * step, 60, 740);
      raid.boss.y = clamp(by + uy * step, 60, 540);

      raid.boss.anim = "walk";
    } else {
      raid.boss.anim = "idle";
    }
    return;
  }

  // stand mode
  raid.boss.anim = "idle";
}

function broadcastRaidVfx(raid, shapes) {
  for (const pid of raid.members) {
    const p = playersById.get(pid);
    if (!p) continue;
    for (const shape of shapes) {
      send(p.ws, { event: "skillVfx", shape });
    }
  }
}