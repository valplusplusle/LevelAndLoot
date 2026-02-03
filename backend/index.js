const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

// ---------------------------
// Helpers
// ---------------------------
function now() { return Date.now(); }

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

// Deterministic RNG (Mulberry32)
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
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function distance(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------
// App + WS
// ---------------------------
const app = express();
app.use(cors());

const httpServer = http.createServer(app);
httpServer.listen(3005, () => console.log("Lobby Server running on :3005"));

const wss = new WebSocket.Server({ server: httpServer });

// ---------------------------
// State
// ---------------------------
/**
 * playersById: id -> {
 *   id, name, x, y, world, role, playerClass, health, inFight, fightId,
 *   ws
 * }
 */
const playersById = new Map();
const wsToPlayerId = new Map();

// duelInvites: targetPlayerId -> { fromPlayerId, ts }
const duelInvites = new Map();

// fights: fightId -> fight object
const fights = new Map();

// raids: raidId -> raid object
const raids = new Map();

// ---------------------------
// Messaging
// ---------------------------
function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

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
      inFight: p.inFight,
      fightId: p.fightId || null,
      state: p.state || "idle",
      lastState: p.lastState || "idle",
      direction: p.direction || "right"
    });
  }
  return arr;
}

// Throttled lobby broadcast (10 Hz)
setInterval(() => {
  broadcast({ event: "lobbySnapshot", lobby: lobbySnapshot() });
}, 20);

// ---------------------------
// Fight Engine (1v1)
// ---------------------------
function createDuelFight(p1, p2) {
  const fightId = "duel-" + uuid();
  const fight = {
    id: fightId,
    type: "duel",
    createdAt: now(),
    players: [p1.id, p2.id],
    startedAt: now(),
    endedAt: null,
    winnerId: null,
    // simple arena center
    arena: { cx: 400, cy: 300, radius: 260 },
  };
  fights.set(fightId, fight);

  // set fight state
  for (const pid of fight.players) {
    const p = playersById.get(pid);
    if (!p) continue;
    p.inFight = true;
    p.fightId = fightId;
    p.health = 100;
    p.world = fightId; // client uses world to render grouping
    // spawn positions
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
    p.health = 100;
    send(p.ws, { event: "fightEnded", fightId: fight.id, winnerId });
  }
  fights.delete(fight.id);
}

// ---------------------------
// Raid Engine
// ---------------------------
const RAID_ATTACK_POOL = [
  { key: "slam", windup: 800, active: 600, cooldown: 600, radius: 120, damage: 18 },
  { key: "bigSlam", windup: 1200, active: 800, cooldown: 800, radius: 170, damage: 28 },
  { key: "beam", windup: 900, active: 900, cooldown: 700, width: 50, length: 330, damage: 22 },
];

function createRaid(seedValue) {
  const raidId = "raid-" + uuid();
  const seed = hashSeed(seedValue ?? raidId);
  const rng = mulberry32(seed);

  // pre-generate rotation (repeatable)
  const rotation = [];
  for (let i = 0; i < 50; i++) {
    const idx = Math.floor(rng() * RAID_ATTACK_POOL.length);
    rotation.push(RAID_ATTACK_POOL[idx].key);
  }

  const raid = {
    id: raidId,
    seed,
    createdAt: now(),
    leaderId: null,
    members: [],          // player ids
    startedAt: null,
    endedAt: null,

    boss: {
      x: 400, y: 280,
      maxHealth: 1000,
      health: 1000,
      targetId: null,
    },

    rotation,
    rotationIndex: 0,
    phase: "idle",        // idle | windup | active | cooldown
    phaseEndsAt: 0,
    currentAttack: null,  // { key, startedAt, ...pattern }
    telegraphs: [],       // array to render on client
  };

  raids.set(raidId, raid);
  return raid;
}

function raidAttackDef(key) {
  return RAID_ATTACK_POOL.find(a => a.key === key);
}

function raidStart(raid) {
  raid.startedAt = now();
  raid.rotationIndex = 0;
  raid.phase = "idle";
  raid.phaseEndsAt = now() + 400;
  raid.currentAttack = null;
  raid.telegraphs = [];
}

function raidEnd(raid, reason = "ended") {
  raid.endedAt = now();

  for (const pid of raid.members) {
    const p = playersById.get(pid);
    if (!p) continue;
    p.inFight = false;
    p.fightId = null;
    p.world = "city-1";
    p.health = 100;
    send(p.ws, { event: "raidEnded", raidId: raid.id, reason });
  }
  raids.delete(raid.id);
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
    phase: raid.phase,
    currentAttack: raid.currentAttack ? { key: raid.currentAttack.key, startedAt: raid.currentAttack.startedAt } : null
  };
}

// Tick raids (20 Hz)
setInterval(() => {
  const t = now();

  for (const raid of raids.values()) {
    if (!raid.startedAt || raid.endedAt) continue;

    // victory/defeat
    if (raid.boss.health <= 0) {
      raidEnd(raid, "bossDefeated");
      continue;
    }

    // pick boss target (prefer tank)
    const alive = raid.members
      .map(id => playersById.get(id))
      .filter(p => p && p.inFight && p.health > 0);

    if (alive.length === 0) {
      raidEnd(raid, "partyWiped");
      continue;
    }

    const tank = alive.find(p => p.role === "tank");
    raid.boss.targetId = (tank || alive[0]).id;

    // phase machine
    if (t >= raid.phaseEndsAt) {
      if (raid.phase === "idle") {
        // select next attack from rotation
        const key = raid.rotation[raid.rotationIndex % raid.rotation.length];
        raid.rotationIndex++;
        const def = raidAttackDef(key);
        raid.phase = "windup";
        raid.phaseEndsAt = t + def.windup;
        raid.currentAttack = { key, startedAt: t };
        // create telegraph now
        raid.telegraphs = buildTelegraph(raid, def, alive);
      } else if (raid.phase === "windup") {
        const def = raidAttackDef(raid.currentAttack.key);
        raid.phase = "active";
        raid.phaseEndsAt = t + def.active;
        // during "active" apply damage periodically (simple: once at start)
        applyRaidDamageOnce(raid, def, alive);
      } else if (raid.phase === "active") {
        const def = raidAttackDef(raid.currentAttack.key);
        raid.phase = "cooldown";
        raid.phaseEndsAt = t + def.cooldown;
        raid.telegraphs = []; // hide after active
      } else if (raid.phase === "cooldown") {
        raid.phase = "idle";
        raid.phaseEndsAt = t + 400;
        raid.currentAttack = null;
      }
    }

    // broadcast raid state to members
    const snap = raidSnapshot(raid);
    for (const pid of raid.members) {
      const p = playersById.get(pid);
      if (p) send(p.ws, { event: "raidState", raid: snap });
    }
  }
}, 50);

function buildTelegraph(raid, def, alivePlayers) {
  // telegraphs are purely visual hints for client
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
    // aim at current target
    const target = alivePlayers.find(p => p.id === raid.boss.targetId) || alivePlayers[0];
    const dx = target.x - raid.boss.x;
    const dy = target.y - raid.boss.y;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
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

function applyRaidDamageOnce(raid, def, alivePlayers) {
  for (const p of alivePlayers) {
    // Tank takes less, DD normal, Heal slightly squishier
    const roleMult = (p.role === "tank") ? 0.7 : (p.role === "heal" ? 1.1 : 1.0);

    let hit = false;

    if (def.key === "slam" || def.key === "bigSlam") {
      hit = distance(p.x, p.y, raid.boss.x, raid.boss.y) <= def.radius;
    }

    if (def.key === "beam") {
      // beam hit test: distance to ray segment <= width
      // ray: boss -> boss + n*length
      const bx = raid.boss.x, by = raid.boss.y;
      const tx = bx + def.length * raid.telegraphs?.[0]?.nx;
      const ty = by + def.length * raid.telegraphs?.[0]?.ny;

      const px = p.x, py = p.y;
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
      const dmg = Math.round(def.damage * roleMult);
      p.health = clamp(p.health - dmg, 0, 100);
      if (p.health <= 0) {
        // optional: keep dead in raid but 0 hp
      }
      send(p.ws, { event: "combatText", text: `-${dmg}`, x: p.x, y: p.y });
    }
  }
}

// ---------------------------
// Skill handling (Server-authoritative damage/heal)
// ---------------------------
function handleSkillCast(caster, payload) {
  const skill = payload.skill || "skill1";
  const fightId = caster.fightId;
  if (!fightId) return;

  // DUEL
  if (fightId.startsWith("duel-")) {
    const fight = fights.get(fightId);
    if (!fight || fight.endedAt) return;

    const enemyId = fight.players.find(id => id !== caster.id);
    const enemy = playersById.get(enemyId);
    if (!enemy) return;

    if (skill === "skill1") {
      // melee-ish: enemy must be near caster
      const inRange = distance(caster.x, caster.y, enemy.x, enemy.y) <= 90;
      if (!inRange) return;

      // role scaling
      const dmgBase = (caster.role === "dd") ? 14 : (caster.role === "tank" ? 9 : 6);
      const dmg = dmgBase;

      enemy.health = clamp(enemy.health - dmg, 0, 100);
      send(enemy.ws, { event: "combatText", text: `-${dmg}`, x: enemy.x, y: enemy.y });
      send(caster.ws, { event: "combatText", text: `hit ${dmg}`, x: caster.x, y: caster.y });

      if (enemy.health <= 0) {
        endFight(fight, caster.id);
      }
    }

    if (skill === "skill2" && caster.role === "heal") {
      // small self heal
      const heal = 12;
      caster.health = clamp(caster.health + heal, 0, 100);
      send(caster.ws, { event: "combatText", text: `+${heal}`, x: caster.x, y: caster.y });
    }
  }

  // RAID
  if (fightId.startsWith("raid-")) {
    const raid = raids.get(fightId);
    if (!raid || raid.endedAt || !raid.startedAt) return;

    if (skill === "skill1") {
      // deal damage to boss if close enough (melee/ranged simplified)
      const dist = distance(caster.x, caster.y, raid.boss.x, raid.boss.y);

      let base = 10;
      if (caster.role === "dd") base = 16;
      if (caster.role === "tank") base = 11;
      if (caster.role === "heal") base = 7;

      // ranged classes can hit from further
      const isRanged = caster.playerClass === "mage" || caster.playerClass === "archer";
      const maxRange = isRanged ? 260 : 90;
      if (dist > maxRange) return;

      raid.boss.health = Math.max(0, raid.boss.health - base);
      send(caster.ws, { event: "combatText", text: `boss -${base}`, x: raid.boss.x, y: raid.boss.y });
    }

    if (skill === "skill2" && caster.role === "heal") {
      // heal lowest ally in raid near you
      const members = raid.members.map(id => playersById.get(id)).filter(Boolean);
      const inRange = members.filter(p => distance(p.x, p.y, caster.x, caster.y) <= 200 && p.health > 0);
      if (inRange.length === 0) return;
      inRange.sort((a,b) => a.health - b.health);
      const target = inRange[0];
      const heal = 18;
      target.health = clamp(target.health + heal, 0, 100);
      send(target.ws, { event: "combatText", text: `+${heal}`, x: target.x, y: target.y });
    }
  }
}

// ---------------------------
// WS Connection
// ---------------------------
wss.on("connection", function connection(ws) {
  // On connect: send current lobby snapshot
  send(ws, { event: "lobbySnapshot", lobby: lobbySnapshot() });

  ws.on("message", function incoming(raw) {
    const msg = safeJsonParse(raw);
    if (!msg) return;

    // CHAT
    if (msg.event === "chatMessage") {
      // commands
      const text = (msg.message || "").trim();
      if (text.startsWith("/")) {
        handleChatCommand(ws, msg.from, text);
        return;
      }
      broadcast({ event: "chatMessage", from: msg.from, message: msg.message });
      return;
    }

    // PLAYER UPDATE (your existing client sends the whole player)
    // We'll treat messages without event as player snapshot
    const playerId = msg.id;
    if (!playerId) return;

    wsToPlayerId.set(ws, playerId);

    let p = playersById.get(playerId);
    if (!p) {
      p = {
        id: playerId,
        name: msg.name || "unknown-player",
        x: msg.x ?? 400,
        y: msg.y ?? 250,
        world: msg.world || "city-1",
        role: msg.role || "tank",
        playerClass: msg.playerClass || "knight",
        health: msg.health ?? 100,
        inFight: !!msg.inFight,
        fightId: msg.fightId || null,
        ws
      };
      playersById.set(playerId, p);
    }

    // update fields we accept from client (position/name/class/role)
    p.ws = ws;
    p.name = (msg.name || p.name).slice(0, 24);
    p.x = clamp(msg.x ?? p.x, 0, 800 - 50);
    p.y = clamp(msg.y ?? p.y, 0, 600 - 48);

    p.direction = msg.direction || p.direction || "right";
    p.state = msg.state || p.state || "idle";
    p.lastState = msg.lastState || p.lastState || "idle";

    // only allow changing class/role in lobby (not in fight)
    if (!p.inFight) {
      p.role = msg.role || p.role;
      p.playerClass = msg.playerClass || p.playerClass;
    }

    // keep server health as truth
    // (ignore msg.health to prevent cheating)
  });

  ws.on("close", function () {
    const pid = wsToPlayerId.get(ws);
    wsToPlayerId.delete(ws);
    if (!pid) return;

    const p = playersById.get(pid);
    playersById.delete(pid);

    // clean invites targeting / originating
    for (const [targetId, inv] of duelInvites.entries()) {
      if (targetId === pid || inv.fromPlayerId === pid) duelInvites.delete(targetId);
    }

    broadcast({ event: "connectionClosed", id: pid });

    // if player was in fight: try to resolve
    if (p?.inFight && p.fightId) {
      const fightId = p.fightId;

      if (fightId.startsWith("duel-")) {
        const fight = fights.get(fightId);
        if (fight && !fight.endedAt) {
          const otherId = fight.players.find(x => x !== pid);
          endFight(fight, otherId || null);
        }
      }

      if (fightId.startsWith("raid-")) {
        const raid = raids.get(fightId);
        if (raid) {
          raid.members = raid.members.filter(x => x !== pid);
          if (raid.members.length === 0) raids.delete(raid.id);
        }
      }
    }
  });
});

// ---------------------------
// Chat Commands
// ---------------------------
function findPlayerByName(name) {
  const lower = name.toLowerCase();
  for (const p of playersById.values()) {
    if ((p.name || "").toLowerCase() === lower) return p;
  }
  return null;
}

function handleChatCommand(ws, fromName, text) {
  const pid = wsToPlayerId.get(ws);
  const me = pid ? playersById.get(pid) : null;

  const parts = text.split(" ").filter(Boolean);
  const cmd = parts[0].toLowerCase();

  if (!me) return;

  if (cmd === "/duel") {
    if (me.inFight) return send(ws, { event: "systemMessage", text: "Du bist bereits in einem Fight." });
    const targetName = parts.slice(1).join(" ");
    const target = findPlayerByName(targetName);
    if (!target) return send(ws, { event: "systemMessage", text: `Spieler '${targetName}' nicht gefunden.` });
    if (target.inFight) return send(ws, { event: "systemMessage", text: "Der Spieler ist bereits in einem Fight." });
    if (target.id === me.id) return;

    duelInvites.set(target.id, { fromPlayerId: me.id, ts: now() });
    send(target.ws, { event: "duelInvite", from: me.name, fromId: me.id });
    send(ws, { event: "systemMessage", text: `Duel-Invite an ${target.name} gesendet. ( /accept )` });
    return;
  }

  if (cmd === "/accept") {
    if (me.inFight) return;
    const inv = duelInvites.get(me.id);
    if (!inv) return send(ws, { event: "systemMessage", text: "Kein Duel-Invite offen." });
    const from = playersById.get(inv.fromPlayerId);
    duelInvites.delete(me.id);
    if (!from || from.inFight) return send(ws, { event: "systemMessage", text: "Invite ist abgelaufen." });

    createDuelFight(from, me);
    return;
  }

  if (cmd === "/raid") {
    const sub = (parts[1] || "").toLowerCase();

    if (sub === "create") {
      if (me.inFight) return send(ws, { event: "systemMessage", text: "Du bist bereits in einem Fight." });
      const seedArg = parts[2]; // optional
      const raid = createRaid(seedArg ?? uuid());
      raid.leaderId = me.id;

      send(ws, { event: "systemMessage", text: `Raid erstellt: ${raid.id} (seed=${raid.seed}). /raid join ${raid.id}` });
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
      me.health = 100;

      // spawn around entrance
      me.x = 380 + Math.floor(Math.random() * 40);
      me.y = 470 + Math.floor(Math.random() * 30);

      broadcast({ event: "systemBroadcast", text: `${me.name} joined ${raid.id}. (${raid.members.length})` });
      send(ws, { event: "raidJoined", raidId: raid.id, seed: raid.seed });
      return;
    }

    if (sub === "start") {
      const raidId = me.fightId;
      const raid = raidId ? raids.get(raidId) : null;
      if (!raid) return send(ws, { event: "systemMessage", text: "Du bist in keinem Raid." });
      if (raid.leaderId !== me.id) return send(ws, { event: "systemMessage", text: "Nur der Leader kann starten." });
      if (raid.startedAt) return send(ws, { event: "systemMessage", text: "Raid läuft bereits." });

      raidStart(raid);
      broadcast({ event: "systemBroadcast", text: `${raid.id} gestartet! (seed=${raid.seed})` });
      return;
    }

    return send(ws, { event: "systemMessage", text: "Commands: /raid create <seed?> | /raid join <raidId> | /raid start" });
  }

  if (cmd === "/leave") {
    if (!me.inFight) return;

    const fid = me.fightId;

    // duel
    if (fid?.startsWith("duel-")) {
      const fight = fights.get(fid);
      if (fight && !fight.endedAt) {
        const otherId = fight.players.find(x => x !== me.id);
        endFight(fight, otherId || null);
      }
      return;
    }

    // raid
    if (fid?.startsWith("raid-")) {
      const raid = raids.get(fid);
      if (raid) {
        raid.members = raid.members.filter(x => x !== me.id);
        send(ws, { event: "systemMessage", text: `Du hast ${raid.id} verlassen.` });
        if (raid.members.length === 0) raids.delete(raid.id);
      }
      me.inFight = false;
      me.fightId = null;
      me.world = "city-1";
      me.health = 100;
      return;
    }
  }

  if (cmd === "/cast") {
    // debug: /cast skill1
    const skill = parts[1] || "skill1";
    handleSkillCast(me, { skill });
    return;
  }

  send(ws, { event: "systemMessage", text: "Unbekannter Command." });
}

// ---------------------------
// External event from client (skillCast)
// ---------------------------
// We accept it via a dedicated message type to keep things clean:
wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    const msg = safeJsonParse(raw);
    if (!msg) return;

    if (msg.event === "skillCast") {
      const pid = wsToPlayerId.get(ws);
      const me = pid ? playersById.get(pid) : null;
      if (!me) return;
      handleSkillCast(me, msg);
    }
  });
});
