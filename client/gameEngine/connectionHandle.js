// Dynamically construct WebSocket URL based on current location
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const socketName = `${protocol}//${host}`;
var webSocket = new WebSocket(socketName);

var currentRaidState = null;
var availableRaids = [];

webSocket.onmessage = (message) => {
  var messageData = JSON.parse(message.data);

  if (messageData.event === "connectionClosed") {
    var indexOfObject = otherPlayers.findIndex((obj => obj.id === messageData.id));
    if (indexOfObject !== -1) otherPlayers.splice(indexOfObject, 1);
    return;
  }

  if (messageData.event === "chatMessage") {
    writeMessageToBoard(messageData);
    return;
  }

  if (messageData.event === "systemMessage") {
    writeMessageToBoard({ from: "SYSTEM", message: messageData.text });
    return;
  }

  if (messageData.event === "systemBroadcast") {
    writeMessageToBoard({ from: "SERVER", message: messageData.text });
    return;
  }

  if (messageData.event === "duelInvite") {
    console.log("[DUEL] Received duelInvite from:", messageData.from);
    writeMessageToBoard({ from: "SYSTEM", message: `Duel-Invite von ${messageData.from}. Tippe /accept` });
    // Show duel accept/decline popup
    if (typeof showDuelAcceptPopup === 'function') {
      console.log("[DUEL] Showing popup...");
      showDuelAcceptPopup(messageData.from);
    } else {
      console.error("[DUEL] showDuelAcceptPopup is not defined!");
    }
    return;
  }

  if (messageData.event === "fightStarted") {
    player.inFight = true;
    player.fightId = messageData.fightId;
    player.world = messageData.fightId;
    player.dead = false;
    writeMessageToBoard({ from: "SYSTEM", message: `Fight gestartet: ${messageData.fightId}` });
    return;
  }

  if (messageData.event === "fightEnded") {
    player.inFight = false;
    player.fightId = null;
    player.world = "city-1";
    player.health = player.maxHealth;
    player.dead = false;
    currentRaidState = null;
    writeMessageToBoard({ from: "SYSTEM", message: `Fight beendet. Winner: ${messageData.winnerId}` });
    return;
  }

  if (messageData.event === "raidJoined") {
    player.inFight = true;
    player.fightId = messageData.raidId;
    player.world = messageData.raidId;
    player.dead = false;
    writeMessageToBoard({ from: "SYSTEM", message: `Raid joined: ${messageData.raidId} (seed=${messageData.seed})` });
    if (typeof updateRaidStartButton === 'function') {
      updateRaidStartButton();
    }
    return;
  }

  if (messageData.event === "raidState") {
    currentRaidState = messageData.raid;
    // Sync raidStats to player and otherPlayers for group box
    if (currentRaidState && currentRaidState.stats) {
      // Self
      if (currentRaidState.stats[player.id]) {
        player.raidStats = currentRaidState.stats[player.id];
      }
      // Others
      for (const op of otherPlayers) {
        if (currentRaidState.stats[op.id]) {
          op.raidStats = currentRaidState.stats[op.id];
        }
      }
    }
    window.currentRaidInfo = messageData.raid;
    console.log('✓ raidState empfangen:', messageData.raid);
    console.log('  - leaderId:', messageData.raid.leaderId, 'player.id:', player?.id, 'ist Leader?', messageData.raid.leaderId === player?.id);
    console.log('  - inFight:', player?.inFight, 'fightId:', player?.fightId);
    
    // Show raid start popup for leader if raid hasn't started
    if (player && player.inFight && messageData.raid.leaderId === player.id && !messageData.raid.startedAt) {
      if (typeof showRaidStartPopup === 'function') {
        showRaidStartPopup();
      }
    }
    
    if (typeof updateRaidStartButton === 'function') {
      updateRaidStartButton();
      console.log('✓ updateRaidStartButton aufgerufen');
    } else {
      console.log('✗ updateRaidStartButton nicht definiert!');
    }
    return;
  }

  if (messageData.event === "raidList") {
    window.availableRaids = messageData.raids || [];
    console.log('✓ Raid List empfangen:', window.availableRaids);
    if (typeof showRaidListUI === 'function') {
      showRaidListUI(window.availableRaids);
      if (typeof showRaidUI === 'function') {
        showRaidUI();
        console.log('✓ Raid UI angezeigt');
      }
    } else {
      console.log('✗ showRaidListUI Funktion nicht definiert');
    }
    return;
  }

  if (messageData.event === "raidEnded") {
    player.inFight = false;
    player.fightId = null;
    player.world = "city-1";
    player.health = player.maxHealth;
    player.dead = false;
    currentRaidState = null;
    if (messageData.reason === "bossDefeated") {
      showVictoryOverlay();
    }
    writeMessageToBoard({ from: "SYSTEM", message: `Raid ended: ${messageData.reason}` });
    return;
  }
// --- Victory Overlay ---
function showVictoryOverlay() {
  let overlay = document.getElementById('victoryOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'victoryOverlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.transition = 'opacity 0.7s';
    overlay.innerHTML = `<div style="color: gold; font-size: 4em; font-weight: bold; text-shadow: 2px 2px 16px #000, 0 0 40px gold; animation: popVictory 1.2s cubic-bezier(.2,1.8,.4,1.1);">VICTORY!</div>`;
    document.body.appendChild(overlay);
    // Add keyframes for popVictory
    const style = document.createElement('style');
    style.innerHTML = `@keyframes popVictory { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`;
    document.head.appendChild(style);
  }
  overlay.style.opacity = '1';
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 1200);
  }, 2200);
}

  if (messageData.event === "combatText") {
    fxAddText({
      text: messageData.text,
      x: messageData.x,
      y: messageData.y,
      start: Date.now(),
      duration: 900,
      rise: 35
    });
    return;
  }

  if (messageData.event === "playerDied") {
    player.dead = true;
    fxAddText({ text: "DEAD", x: player.x+25, y: player.y, start: Date.now(), duration: 1200, rise: 10, font:"18px Arial" });
    return;
  }

  if (messageData.event === "skillVfx") {
    const s = messageData.shape;
    fxAddShape({
      ...s,
      start: s.start || Date.now(),
      duration: s.duration || 400
    });
    
    // Handle sprite effects if present
    if (messageData.effect && messageData.effect.sprite) {
      const effect = messageData.effect;
      const spriteName = effect.sprite; // e.g., "fire.orange" or "aura.blue"
      const [effectType, color] = spriteName.split('.');
      
      console.log(`[SPRITE] Loading ${spriteName} (type=${effectType}, color=${color})`);
      
      // Get sprite sheet from effectSprites
      if (effectSprites[effectType] && effectSprites[effectType][color]) {
        const spriteData = effectSprites[effectType][color];
        
        if (spriteData && spriteData.img && spriteData.frameCount) {
          console.log(`[SPRITE] Found sprite data, frameCount=${spriteData.frameCount}`);
          
          fxAddSprite({
            img: spriteData.img,
            frameCount: spriteData.frameCount,
            x: s.x || s.px || 400,
            y: s.y || s.py || 300,
            width: effect.size || 60,
            height: effect.size || 60,
            start: Date.now(),
            duration: effect.duration || 600,
            fadeOut: true,
            alpha: 1
          });
        } else {
          console.warn(`[SPRITE] Sprite data incomplete for ${spriteName}`);
        }
      } else {
        console.warn(`[SPRITE] Effect not found: ${spriteName}. Available effects:`, Object.keys(effectSprites));
      }
    }
    return;
  }

  if (messageData.event === "lobbySnapshot") {
    var lobbyArray = messageData.lobby;

    lobbyArray.forEach(lobbyPlayer => {
      if (lobbyPlayer.id !== player.id) {
        var indexOfObject = otherPlayers.findIndex((obj => obj.id === lobbyPlayer.id));
        if (indexOfObject != -1) {
          otherPlayers[indexOfObject].x = lobbyPlayer.x;
          otherPlayers[indexOfObject].y = lobbyPlayer.y;
          otherPlayers[indexOfObject].state = lobbyPlayer.state;
          otherPlayers[indexOfObject].lastState = lobbyPlayer.lastState;
          otherPlayers[indexOfObject].direction = lobbyPlayer.direction;
          otherPlayers[indexOfObject].name = lobbyPlayer.name;
          otherPlayers[indexOfObject].playerClass = lobbyPlayer.playerClass;
          otherPlayers[indexOfObject].role = lobbyPlayer.role;
          otherPlayers[indexOfObject].world = lobbyPlayer.world;
          otherPlayers[indexOfObject].health = lobbyPlayer.health;
          otherPlayers[indexOfObject].maxHealth = lobbyPlayer.maxHealth || 100;
          otherPlayers[indexOfObject].inFight = lobbyPlayer.inFight;
          otherPlayers[indexOfObject].dead = !!lobbyPlayer.dead;
        } else {
          let newPlayer = new Player;
          newPlayer.id = lobbyPlayer.id;
          newPlayer.name = lobbyPlayer.name;
          newPlayer.x = lobbyPlayer.x;
          newPlayer.y = lobbyPlayer.y;
          newPlayer.playerClass = lobbyPlayer.playerClass;
          newPlayer.role = lobbyPlayer.role;
          newPlayer.world = lobbyPlayer.world;
          newPlayer.health = lobbyPlayer.health;
          newPlayer.maxHealth = lobbyPlayer.maxHealth || 100;
          newPlayer.inFight = lobbyPlayer.inFight;
          newPlayer.state = lobbyPlayer.state || "idle";
          newPlayer.lastState = lobbyPlayer.lastState || "idle";
          newPlayer.direction = lobbyPlayer.direction || "right";
          newPlayer.dead = !!lobbyPlayer.dead;
          otherPlayers.push(newPlayer);
        }
      } else {
        // sync own HP/dead from server truth
        if (typeof lobbyPlayer.health === "number") player.health = lobbyPlayer.health;
        if (typeof lobbyPlayer.maxHealth === "number") player.maxHealth = lobbyPlayer.maxHealth;
        if (typeof lobbyPlayer.dead === "boolean") player.dead = lobbyPlayer.dead;
      }
    });

    return;
  }
};

// send player snapshot
var intervalId = window.setInterval(function(){
  webSocket.send(JSON.stringify(player));
}, 20);

// Handle canvas clicks for raid NPC interaction
window.handleCanvasClick = function(clickX, clickY) {
  console.log('[handleCanvasClick] called with:', { clickX, clickY });
  if (typeof player === 'undefined' || player.world !== 'city-1') {
    console.log('Player not ready or not in city-1');
    return;
  }
  if (!otherPlayers || otherPlayers.length === 0) {
    console.log('No other players');
    return;
  }
  
  // Check if clicked on another player for duel
  for (const otherPlayer of otherPlayers) {
    if (!otherPlayer.name || otherPlayer.name.includes('Raid Leiter') || otherPlayer.id === player.id) continue;
    
    const pX = otherPlayer.x;
    const pY = otherPlayer.y;
    const hitboxX = pX - 15;
    const hitboxY = pY - 20;
    const hitboxW = 50;
    const hitboxH = 50;
    
    if (clickX >= hitboxX && clickX <= (hitboxX + hitboxW) && clickY >= hitboxY && clickY <= (hitboxY + hitboxH)) {
      console.log('✓ Clicked on player:', otherPlayer.name);
      // Show duel challenge popup
      showDuelChallengePopup(otherPlayer);
      return;
    }
  }
  
  // Finde beide Raid Leiter NPCs
  const raidLeiterNpcs = otherPlayers.filter(p => p.name && p.name.startsWith('Raid Leiter'));
  for (const npc of raidLeiterNpcs) {
    const npcX = npc.x, npcY = npc.y;
    const hitboxX = npcX - 10;
    const hitboxY = npcY - 15;
    const hitboxW = 70;
    const hitboxH = 73;
    if (clickX >= hitboxX && clickX <= (hitboxX + hitboxW) && clickY >= hitboxY && clickY <= (hitboxY + hitboxH)) {
      const playerCx = player.x + 25;
      const playerCy = player.y + 25;
      const npcCx = npc.x + 25;
      const npcCy = npc.y + 25;
      const dist = Math.sqrt((playerCx - npcCx) ** 2 + (playerCy - npcCy) ** 2);
      if (dist <= 200) {
        if (npc.name === 'Raid Leiter') {
          // Standard Raid Board
          webSocket.send(JSON.stringify({ event: 'requestRaidList' }));
          const ui = document.getElementById('raidUI');
          if (ui) ui.style.display = 'block';
          console.log('✓ Raid Board sollte geöffnet sein! (Distanz: ' + Math.round(dist) + ' px)');
        } else if (npc.name === 'Raid Leiter 2') {
          // Erweiterte Raid Einstellungen
          if (typeof showAdvancedRaidMenu === 'function') {
            showAdvancedRaidMenu();
          } else {
            alert('Advanced Raid Menü nicht implementiert!');
          }
        }
        return;
      }
    }
  }
  // Beispiel: Prüfe auf Raid Leiter
  if (typeof isRaidLeiterClicked === 'function' && isRaidLeiterClicked(clickX, clickY)) {
    console.log('[handleCanvasClick] Raid Leiter clicked!');
    if (typeof showRaidUI === 'function') showRaidUI();
    return 'raidleiter';
  }
  // Beispiel: Prüfe auf Spieler (Duel)
  if (typeof isPlayerClicked === 'function') {
    const player = isPlayerClicked(clickX, clickY);
    if (player) {
      console.log('[handleCanvasClick] Player clicked for duel:', player);
      if (typeof showDuelChallengePopup === 'function') showDuelChallengePopup(player);
      return 'duel';
    }
  }
  return 'none';
};

