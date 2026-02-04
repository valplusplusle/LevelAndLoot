  // Ensure UI stays visible in fullscreen
  function updateFullscreenClass() {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      document.body.classList.add('fullscreen');
    } else {
      document.body.classList.remove('fullscreen');
    }
  }
  document.addEventListener('fullscreenchange', updateFullscreenClass);
  document.addEventListener('webkitfullscreenchange', updateFullscreenClass);
  document.addEventListener('msfullscreenchange', updateFullscreenClass);
// --- Mobile Controls & Fullscreen ---
function isMobileLandscape() {
  return window.innerWidth < 900 && window.innerWidth > window.innerHeight;
}

function setupMobileControls() {
  const fsBtn = document.getElementById('fullscreenBtn');
  const chatBtn = document.getElementById('chatToggleBtn');
  const chatDiv = document.getElementById('chat');
  const joystick = document.getElementById('joystickContainer');
  const mobileSkills = document.getElementById('mobileSkills');

  function updateVisibility() {
    // Hide chat by default, only show if toggled
    chatDiv.style.display = 'none';
    // Fullscreen button always visible
    fsBtn.style.display = 'block';
    // Joystick only on mobile landscape
    if (isMobileLandscape()) {
      joystick.style.display = 'block';
      mobileSkills.style.display = 'none';
    } else {
      joystick.style.display = 'none';
      mobileSkills.style.display = 'none';
    }
    // Chat button always visible
    chatBtn.style.display = 'block';
    // Hide role/class selection in raid or duel
    const playerMenu = document.getElementById('playerMenu');
    if (playerMenu) {
      if (player.inFight) playerMenu.style.display = 'none';
      else playerMenu.style.display = '';
    }
  }
  window.addEventListener('resize', updateVisibility);
  updateVisibility();

  // Fullscreen logic
  fsBtn.onclick = function() {
    // Try to fullscreen the canvas for best mobile compatibility
    const canvas = document.querySelector('canvas');
    const el = canvas || document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } else {
      try {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
        else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen(); // iOS fallback
      } catch (e) {
        console.log('Fullscreen error:', e);
      }
    }
  };

  // Chat toggle
  chatBtn.onclick = function() {
    if (chatDiv.style.display === 'none') chatDiv.style.display = '';
    else chatDiv.style.display = 'none';
  };
// Also hide playerMenu (role/class) in raid/duel on desktop
function updatePlayerMenuVisibility() {
  const playerMenu = document.getElementById('playerMenu');
  if (playerMenu) {
    if (player.inFight) playerMenu.style.display = 'none';
    else playerMenu.style.display = '';
  }
}
setInterval(updatePlayerMenuVisibility, 500);

  // Joystick logic (pointer events for Chrome, touch for Safari)
  let joyActive = false, joyStart = {x:0,y:0}, joyCur = {x:0,y:0};
  const stick = document.getElementById('joystickStick');
  function joyStartFn(x, y) {
    joyActive = true;
    joyStart = { x, y };
    joyCur = { ...joyStart };
    stick.style.left = (joyStart.x-20)+"px";
    stick.style.top = (joyStart.y-20)+"px";
  }
  function joyMoveFn(x, y) {
    if (!joyActive) return;
    joyCur = { x, y };
    let dx = joyCur.x - joyStart.x, dy = joyCur.y - joyStart.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const maxDist = 40;
    if (dist > maxDist) {
      dx = dx * maxDist / dist;
      dy = dy * maxDist / dist;
    }
    stick.style.left = (joyStart.x+dx-20)+"px";
    stick.style.top = (joyStart.y+dy-20)+"px";
    controller.up = dy < -15;
    controller.down = dy > 15;
    controller.left = dx < -15;
    controller.right = dx > 15;
  }
  function joyEndFn() {
    joyActive = false;
    stick.style.left = '35px';
    stick.style.top = '35px';
    controller.up = controller.down = controller.left = controller.right = false;
    // Set player to idle if not attacking
    if (player.state !== 'attack1') player.state = 'idle';
  }
  // Pointer events (Chrome, Android, most modern browsers)
  joystick.addEventListener('pointerdown', function(e) {
    const rect = joystick.getBoundingClientRect();
    joyStartFn(e.clientX - rect.left, e.clientY - rect.top);
    e.preventDefault();
  }, {passive:false});
  joystick.addEventListener('pointermove', function(e) {
    if (!joyActive) return;
    const rect = joystick.getBoundingClientRect();
    joyMoveFn(e.clientX - rect.left, e.clientY - rect.top);
    e.preventDefault();
  }, {passive:false});
  joystick.addEventListener('pointerup', function(e) {
    joyEndFn();
    e.preventDefault();
  }, {passive:false});
  joystick.addEventListener('pointercancel', function(e) {
    joyEndFn();
    e.preventDefault();
  }, {passive:false});
  // Touch events (Safari, fallback)
  joystick.addEventListener('touchstart', function(e) {
    const t = e.touches[0];
    const rect = joystick.getBoundingClientRect();
    joyStartFn(t.clientX - rect.left, t.clientY - rect.top);
    e.preventDefault();
  }, {passive:false});
  joystick.addEventListener('touchmove', function(e) {
    if (!joyActive) return;
    const t = e.touches[0];
    const rect = joystick.getBoundingClientRect();
    joyMoveFn(t.clientX - rect.left, t.clientY - rect.top);
    e.preventDefault();
  }, {passive:false});
  joystick.addEventListener('touchend', function(e) {
    joyEndFn();
    e.preventDefault();
  }, {passive:false});


  // Mobile skill buttons: ontouchstart (Safari), onclick (Chrome/Android)
  Array.from(document.getElementsByClassName('mobileSkillBtn')).forEach(btn => {
    btn.ontouchstart = function(e) {
      const skill = parseInt(btn.getAttribute('data-skill'));
      player.castSkill(skill);
      btn.classList.add('active');
      setTimeout(()=>btn.classList.remove('active'), 200);
      e.preventDefault();
    };
    btn.onclick = function(e) {
      const skill = parseInt(btn.getAttribute('data-skill'));
      player.castSkill(skill);
      btn.classList.add('active');
      setTimeout(()=>btn.classList.remove('active'), 200);
      e.preventDefault();
    };
  });
}

window.addEventListener('DOMContentLoaded', setupMobileControls);

// --- Player name management with custom popup ---
function showNamePopup(onSet) {
  let modal = document.getElementById('namePopup');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'namePopup';
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.55)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div style="background: #23272e; border-radius: 16px; box-shadow: 0 4px 32px #000a; padding: 36px 32px 28px 32px; min-width: 320px; display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 1.5em; color: #fff; margin-bottom: 18px; font-weight: bold;">Spielername wählen</div>
        <input id="nameInputField" type="text" maxlength="18" style="font-size: 1.2em; padding: 8px 12px; border-radius: 8px; border: none; outline: none; margin-bottom: 18px; width: 220px; text-align: center;" placeholder="Dein Name..." autofocus />
        <button id="nameInputBtn" style="font-size: 1.1em; padding: 7px 28px; border-radius: 8px; border: none; background: #4caf50; color: #fff; font-weight: bold; cursor: pointer;">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  setTimeout(() => { document.getElementById('nameInputField').focus(); }, 100);
  document.getElementById('nameInputBtn').onclick = function() {
    const val = document.getElementById('nameInputField').value.trim();
    if (val.length >= 2) {
      modal.style.display = 'none';
      if (onSet) onSet(val);
    } else {
      document.getElementById('nameInputField').style.border = '2px solid #e74c3c';
      setTimeout(() => { document.getElementById('nameInputField').style.border = ''; }, 800);
    }
  };
  document.getElementById('nameInputField').onkeydown = function(e) {
    if (e.key === 'Enter') document.getElementById('nameInputBtn').click();
  };
}

let savedName = localStorage.getItem('playerName');
var player = new Player;
if (savedName && savedName.length > 1) {
  player.name = savedName;
} else if (player.name === 'unknown-player' || !player.name) {
  showNamePopup(function(name) {
    player.name = name;
    localStorage.setItem('playerName', name);
    document.getElementById('name').value = name;
  });
}

var lastTime = (new Date()).getTime();
var currentTime = 0;
var delta = 0;
var otherPlayers = [];

// Load boss sprite image
var bossImage = new Image();
bossImage.src = './assets/boss1/golem_1.png';
bossImage.onload = function() {
  console.log('✓ Boss sprite loaded');
};
bossImage.onerror = function() {
  console.log('✗ Boss sprite failed to load, using fallback');
};

// Boss sprite sheet configuration (768x640, 6 frames x 5 rows = 128x128 per frame)
const BOSS_SPRITE_CONFIG = {
  frameWidth: 128,
  frameHeight: 128,
  sheetWidth: 768,
  sheetHeight: 640,
  framesPerRow: 6,
  // Row 0: Idle (6 frames)
  // Row 1: Walk (6 frames)
  // Row 2: Death (6 frames)
  // Row 3: Attack (6 frames)
  // Row 4: Unused
  states: {
    idle: { row: 0, frames: 6, duration: 120 },
    walk: { row: 1, frames: 6, duration: 120 },
    death: { row: 2, frames: 6, duration: 150 },
    attack: { row: 3, frames: 6, duration: 100 }
  }
};

// Boss animation state tracker
var bossAnimationState = {
  currentState: 'idle',
  currentFrame: 0,
  stateTime: 0,
  lastAttackTime: 0
};

// init player name
document.getElementById('name').value = player.name;
// keep localStorage in sync if name is changed via UI
document.getElementById('name').addEventListener('change', function(e) {
  player.name = e.target.value;
  localStorage.setItem('playerName', player.name);
});

controller = {
  left: false,
  right: false,
  up: false,
  down: false,
  keyListener: function(event) {
    var key_state = event.type == 'keydown' ? true : false
    if (key_state == false && player.state != 'attack1') {player.state = 'idle'}
    if (document.activeElement.id !== "chatinput" && document.activeElement.id !== "name") {
      switch (event.keyCode) {
        case 87: controller.up = key_state; break;   // W
        case 83: controller.down = key_state; break; // S
        case 68: controller.right = key_state; break; // D
        case 65: controller.left = key_state; break; // A
      }
    }
  },
}

function gameLoop() {
  currentTime = (new Date()).getTime();
  delta = (currentTime - lastTime) / 1000;
  updateData();
  renderData();
  updateSkillCooldownUI();
  lastTime = currentTime;
  window.requestAnimationFrame(gameLoop)
}

// --- Skill Cooldown Overlay ---
function updateSkillCooldownUI() {
  // Only for local player
  const cooldown = 250; // ms, must match castSkill logic
  for (let i = 1; i <= 4; ++i) {
    const btn = document.getElementById('skill'+i);
    if (!btn) continue;
    let overlay = btn.querySelector('.cooldownOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'cooldownOverlay';
      btn.appendChild(overlay);
    }
    const timeSince = Date.now() - player.lastAttack;
    if (timeSince < cooldown) {
      btn.classList.add('cooldown');
      overlay.style.display = 'flex';
      overlay.textContent = Math.ceil((cooldown - timeSince)/100) / 10 + 's';
    } else {
      btn.classList.remove('cooldown');
      overlay.style.display = 'none';
      overlay.textContent = '';
    }
  }
}
function updateData() {
  if (player.dead) {
    player.x_velocity = 0;
    player.y_velocity = 0;
    return;
  }

  if (controller.up) {
    player.y_velocity -= 200 * delta
    if(player.state != 'attack1') player.state = 'run';
  }
  if (controller.down) {
    player.y_velocity += 200 * delta
    if(player.state != 'attack1') player.state = 'run';
  }
  if (controller.left) {
    player.x_velocity -= 200 * delta
    if(player.state != 'attack1') player.state = 'run';
    player.direction = 'left';
  }
  if (controller.right) {
    player.x_velocity += 200 * delta
    if(player.state != 'attack1') player.state = 'run';
    player.direction = 'right';
  }

  player.x += player.x_velocity
  player.y += player.y_velocity
  player.x_velocity *= 0.5 * delta
  player.y_velocity *= 0.5 * delta

  if (player.y > 600 - 48) { player.y = 600 - 48; player.y_velocity = 0; }
  if (player.y < 0) { player.y = 0; player.y_velocity = 0; }
  if (player.x <= 0) { player.x = 0; player.x_velocity = 0; }
  if (player.x >= 800 - 50) { player.x = 800 - 50; player.x_velocity = 0; }
}

function renderRaidBoss(raid) {
  if (!raid || !raid.boss) return;

  const bx = raid.boss.x;
  const by = raid.boss.y;

  // Update boss animation state based on raid phase
  let newState = 'idle';
  if (raid.currentAttack) {
    newState = 'attack';
  } else if (raid.boss.health < raid.boss.maxHealth * 0.3) {
    // Could use hurt state if health is low
  }
  
  // Update animation frame
  if (bossAnimationState.currentState !== newState) {
    bossAnimationState.currentState = newState;
    bossAnimationState.currentFrame = 0;
    bossAnimationState.stateTime = 0;
  }
  
  const stateConfig = BOSS_SPRITE_CONFIG.states[newState];
  bossAnimationState.stateTime += delta * 1000; // Convert to ms
  
  // Calculate which frame to show
  if (stateConfig) {
    const frameDuration = stateConfig.duration;
    const frameIndex = Math.floor((bossAnimationState.stateTime / frameDuration) % stateConfig.frames);
    bossAnimationState.currentFrame = frameIndex;
  }

  // Draw boss sprite from sheet
  if (bossImage && bossImage.complete && bossImage.naturalHeight !== 0) {
    // Calculate source rectangle from sprite sheet
    const stateConfig = BOSS_SPRITE_CONFIG.states[bossAnimationState.currentState];
    const frameIndex = bossAnimationState.currentFrame;
    const srcX = frameIndex * BOSS_SPRITE_CONFIG.frameWidth;
    const srcY = stateConfig.row * BOSS_SPRITE_CONFIG.frameHeight;
    
    // Draw the sprite frame scaled up (128x128 source to 160x160 display)
    const displayWidth = 160;
    const displayHeight = 160;
    context.drawImage(
      bossImage,
      srcX, srcY, BOSS_SPRITE_CONFIG.frameWidth, BOSS_SPRITE_CONFIG.frameHeight,
      bx - displayWidth/2, by - displayHeight/2, displayWidth, displayHeight
    );
  } else {
    // Fallback: draw red rectangle if image not loaded
    context.fillStyle = "#8b1e1e";
    context.fillRect(bx - 40, by - 40, 80, 80);
    context.lineWidth = 3;
    context.strokeStyle = "rgba(0,0,0,0.6)";
    context.strokeRect(bx - 40, by - 40, 80, 80);
  }

  // boss hp bar - EPIC VERSION
  const barW = 500, barH = 32;
  const x = 400 - barW/2, y = 12;

  // Dark background with glow
  context.fillStyle = "rgba(0,0,0,0.9)";
  context.fillRect(x - 2, y - 2, barW + 4, barH + 4);
  
  context.shadowColor = "rgba(200,0,0,0.8)";
  context.shadowBlur = 15;
  context.fillStyle = "rgba(40,0,0,0.8)";
  context.fillRect(x, y, barW, barH);
  context.shadowColor = "transparent";
  context.shadowBlur = 0;

  // Border
  context.lineWidth = 2;
  context.strokeStyle = "rgba(255,0,0,0.6)";
  context.strokeRect(x, y, barW, barH);

  // Health bar with gradient
  const pct = raid.boss.health / raid.boss.maxHealth;
  const healthW = Math.floor((barW - 4) * pct);
  
  // Glow effect
  context.shadowColor = "rgba(255,50,0,0.8)";
  context.shadowBlur = 10;
  const gradient = context.createLinearGradient(x + 2, y + 2, x + 2, y + barH - 2);
  gradient.addColorStop(0, "#ff4444");
  gradient.addColorStop(0.5, "#ff0000");
  gradient.addColorStop(1, "#cc0000");
  context.fillStyle = gradient;
  context.fillRect(x + 2, y + 2, healthW, barH - 4);
  context.shadowColor = "transparent";
  context.shadowBlur = 0;

  // Health text
  context.font = "bold 14px Arial";
  context.fillStyle = "#ffff99";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.strokeStyle = "rgba(0,0,0,0.8)";
  context.lineWidth = 3;
  context.strokeText(`${raid.boss.health} / ${raid.boss.maxHealth}`, 400, y + barH/2);
  context.fillText(`${raid.boss.health} / ${raid.boss.maxHealth}`, 400, y + barH/2);

  // telegraphs from server
  (raid.telegraphs || []).forEach(tg => {
    if (tg.type === "circle") {
      context.beginPath();
      context.lineWidth = 4;
      context.strokeStyle = "rgba(255,0,0,0.7)";
      context.arc(tg.x, tg.y, tg.radius, 0, Math.PI*2);
      context.stroke();
    }
    if (tg.type === "beam") {
      const ex = tg.x + tg.nx * tg.length;
      const ey = tg.y + tg.ny * tg.length;
      context.lineWidth = tg.width * 2;
      context.strokeStyle = "rgba(255,0,0,0.35)";
      context.beginPath();
      context.moveTo(tg.x, tg.y);
      context.lineTo(ex, ey);
      context.stroke();
    }
  });

  // hazards from mechanics
  (raid.hazards || []).forEach(hazard => {
    if (hazard.type === "movingHazard") {
      // Red circle for moving hazards
      context.beginPath();
      context.lineWidth = 3;
      context.strokeStyle = "rgba(255,100,0,0.8)";
      context.fillStyle = "rgba(255,100,0,0.15)";
      context.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI*2);
      context.fill();
      context.stroke();
    } else if (hazard.type === "checkerboard") {
      // Checkerboard pattern - dark red squares
      context.fillStyle = "rgba(200,0,0,0.4)";
      context.fillRect(
        hazard.x - hazard.squareSize / 2,
        hazard.y - hazard.squareSize / 2,
        hazard.squareSize,
        hazard.squareSize
      );
      context.strokeStyle = "rgba(255,0,0,0.6)";
      context.lineWidth = 2;
      context.strokeRect(
        hazard.x - hazard.squareSize / 2,
        hazard.y - hazard.squareSize / 2,
        hazard.squareSize,
        hazard.squareSize
      );
    } else if (hazard.type === "safeZone") {
      // Safe zone - green circle in center, red danger outside
      context.beginPath();
      context.lineWidth = 2;
      context.strokeStyle = "rgba(0,255,0,0.9)";
      context.arc(hazard.x, hazard.y, hazard.safeRadius, 0, Math.PI*2);
      context.stroke();
      
      // Stronger red overlay for danger area
      context.fillStyle = "rgba(200,0,0,0.22)";
      context.beginPath();
      context.arc(hazard.x, hazard.y, 300, 0, Math.PI*2);
      context.fill();
      // Clear safe zone area (cutout)
      context.save();
      context.globalCompositeOperation = 'destination-out';
      context.beginPath();
      context.arc(hazard.x, hazard.y, hazard.safeRadius, 0, Math.PI*2);
      context.fill();
      context.restore();
      // Hinweistext
      context.save();
      context.font = "bold 20px Arial";
      context.fillStyle = "#fff";
      context.textAlign = "center";
      context.shadowColor = "#000";
      context.shadowBlur = 6;
      context.fillText("Nur im grünen Kreis bist du sicher!", 400, 60);
      context.restore();
    }
  });
}

function renderData() {
  // Clear frame
  context.fillStyle = '#202020';
  context.fillRect(0, 0, 800, 600);

  renderWorld(player.world);

  // Raid boss overlay
  if (typeof currentRaidState !== "undefined" && currentRaidState && player.world === currentRaidState.id) {
    renderRaidBoss(currentRaidState);
  }

  // VFX
  fxRenderAndUpdate();

  // players
  otherPlayers.forEach(otherPlayer => {
    if(otherPlayer.world == player.world) {
      otherPlayer.renderPlayer();
      // Show spell effect if just cast
      if (otherPlayer.lastAttack && Date.now() - otherPlayer.lastAttack < 400) {
        // Large, bright effect
        fxAddShape({
          type: 'filledCircle',
          x: otherPlayer.x+25, y: otherPlayer.y+24,
          radius: 38,
          r: 255, g: 220, b: 40,
          alpha: 0.45,
          start: Date.now(),
          duration: 220,
          fadeOut: true
        });
        // Name popup
        fxAddText({
          text: `${otherPlayer.name} cast!`,
          x: otherPlayer.x+25, y: otherPlayer.y-18,
          duration: 350,
          rise: 18,
          font: 'bold 16px Arial',
          start: Date.now()
        });
        // Prevent repeat
        otherPlayer.lastAttack = 0;
      }
    }
  });

  // Render NPC overhead indicator (pulsing ?)
  otherPlayers.forEach(p => {
    if (p.world === player.world && p.name && p.name.includes('Raid Leiter')) {
      const pulse = Math.abs(Math.sin(Date.now() * 0.003)) * 0.5 + 0.5;
      context.font = "bold " + (16 + pulse * 4) + "px Arial";
      context.fillStyle = "rgba(255,255,0," + (0.5 + pulse * 0.5) + ")";
      context.textAlign = "center";
      context.fillText('?', p.x + 25, p.y - 15 - pulse * 5);
    }
  });

  player.renderPlayer();

  renderUI();
}

// key listeners
window.addEventListener('keydown', controller.keyListener)
window.addEventListener('keyup', controller.keyListener)

document.addEventListener('keydown', function (e) {
  if(e.code == 'Digit1') document.getElementById("skill1").click();
  if(e.code == 'Digit2') document.getElementById("skill2").click();
  if(e.code == 'Digit3') document.getElementById("skill3").click();
  if(e.code == 'Digit4') document.getElementById("skill4").click();
}, false);

// start
window.requestAnimationFrame(gameLoop)
