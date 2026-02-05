// Raid lobby UI + interaction

// Track current raid info for leader button
window.currentRaidInfo = null;
var lastRaidStartPopupId = null; // Prevent duplicate popups

function showRaidListUI(raids) {
  const container = document.getElementById('raidList');
  if (!container) return;
  container.innerHTML = '';

  if (!raids || raids.length === 0) {
    container.innerHTML = '<div class="raidNoEntries">Keine offenen Raids<br/>Gründe einen neuen!</div>';
    return;
  }

  raids.forEach(r => {
    const row = document.createElement('div');
    row.className = 'raidListEntry';

    const left = document.createElement('div');
    left.className = 'raidListText';
    left.innerText = `${r.id}\n${(r.members||[]).length} Spieler`;
    left.style.whiteSpace = 'pre-wrap';

    const joinBtn = document.createElement('button');
    joinBtn.className = 'raidListBtn';
    joinBtn.innerText = 'Beitreten';
    joinBtn.onclick = function(e) {
      e.stopPropagation();
      try { webSocket.send(JSON.stringify({ event: 'chatMessage', from: player.name, message: '/raid join ' + r.id })); } catch (e) {}
      const ui = document.getElementById('raidUI'); if (ui) ui.classList.remove('visible');
    };

    row.appendChild(left);
    row.appendChild(joinBtn);
    container.appendChild(row);
  });
}

function showRaidUI() {
  const ui = document.getElementById('raidUI');
  if (ui) {
    ui.classList.add('visible');
    if (typeof updateRaidStartButton === 'function') {
      updateRaidStartButton();
    }
    if (typeof updateRaidStats === 'function') {
      updateRaidStats();
    }
  }
}

// Show raid member stats (damage, healing, protection)
function updateRaidStats() {
  const statsDiv = document.getElementById('raidStats');
  if (!statsDiv) return;
  // Example: get stats from currentRaidInfo (should be synced from server)
  const raid = window.currentRaidInfo;
  if (!raid || !raid.members || !raid.stats) {
    statsDiv.style.display = 'none';
    return;
  }
  statsDiv.style.display = 'block';
  let html = '<table style="width:100%;border-collapse:collapse;font-size:13px;text-align:center;background:rgba(30,30,40,0.95);color:#ffe;border-radius:6px;overflow:hidden;">';
  html += '<tr style="background:rgba(200,180,100,0.12);font-weight:bold;"><td>Name</td><td>Schaden</td><td>Heilung</td><td>Schutz</td></tr>';
  raid.members.forEach(m => {
    const s = (raid.stats && raid.stats[m.id]) || {damage:0,healing:0,protection:0};
    html += `<tr><td>${m.name}</td><td style="color:#ff6666;">${s.damage||0}</td><td style="color:#66ff99;">${s.healing||0}</td><td style="color:#66aaff;">${s.protection||0}</td></tr>`;
  });
  html += '</table>';
  statsDiv.innerHTML = html;
}

function hideRaidUI() {
  const ui = document.getElementById('raidUI');
  if (ui) {
    ui.classList.remove('visible');
  }
}

function updateRaidStartButton() {
  const startBtn = document.getElementById('startRaidBtn');
  if (!startBtn) {
    console.log('✗ Start Button Element nicht gefunden!');
    return;
  }
  
  console.log('🔍 updateRaidStartButton aufgerufen');
  console.log('  - player.inFight:', player?.inFight);
  console.log('  - player.fightId:', player?.fightId);
  console.log('  - currentRaidInfo:', window.currentRaidInfo);
  
  // Only show if player is in a raid that hasn't started
  if (player && player.inFight && player.fightId && player.fightId.startsWith('raid-')) {
    console.log('  ✓ Player ist im Raid');
    // Check if player is raid leader
    if (typeof window.currentRaidInfo !== 'undefined' && window.currentRaidInfo && window.currentRaidInfo.leaderId === player.id) {
      console.log('  ✓ Player ist LEADER -> zeige Button');
      startBtn.style.display = 'block';
    } else {
      console.log('  ✗ Player ist nicht Leader:', window.currentRaidInfo?.leaderId, 'vs', player.id);
      startBtn.style.display = 'none';
    }
  } else {
    console.log('  ✗ Player nicht im Raid oder fehlerhafte Bedingung');
    startBtn.style.display = 'none';
  }
}

window.addEventListener('load', function() {
  const createBtn = document.getElementById('createRaidBtn');
  const closeBtn = document.getElementById('closeRaidBtn');
  const closeXBtn = document.getElementById('raidUIClose');
  const startBtn = document.getElementById('startRaidBtn');
  
  if (createBtn) createBtn.addEventListener('click', function() {
    try { webSocket.send(JSON.stringify({ event: 'chatMessage', from: player.name, message: '/raid create' })); } catch (e) {}
    hideRaidUI();
  });
  
  if (closeBtn) closeBtn.addEventListener('click', hideRaidUI);
  if (closeXBtn) closeXBtn.addEventListener('click', hideRaidUI);
  
  if (startBtn) startBtn.addEventListener('click', function() {
    try { webSocket.send(JSON.stringify({ event: 'chatMessage', from: player.name, message: '/raid start' })); } catch (e) {}
    hideRaidUI();
  });
  
  // Make window draggable
  makeWindowDraggable('raidUI', 'raidUIHeader');
});

// Drag functionality
function makeWindowDraggable(windowId, handleId) {
  const window = document.getElementById(windowId);
  const handle = document.getElementById(handleId);
  
  if (!window || !handle) return;
  
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  handle.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    const newTop = window.offsetTop - pos2;
    const newLeft = window.offsetLeft - pos1;
    
    // Keep window in viewport
    const maxTop = window.parentElement.clientHeight - window.clientHeight;
    const maxLeft = window.parentElement.clientWidth - window.clientWidth;
    
    window.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
    window.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
    window.style.transform = 'none';
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Duel challenge popup
window.showDuelChallengePopup = function(targetPlayer) {
  // Create popup element
  const popup = document.createElement('div');
  popup.id = 'duelChallengePopup';
  popup.style.cssText = `
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(10,10,20,0.95) 100%);
    border: 2px solid rgba(200,180,100,0.6);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(0,0,0,0.8);
    color: #e0d5b7;
    z-index: 10000;
    text-align: center;
    min-width: 300px;
  `;
  
  const title = document.createElement('div');
  title.style.cssText = 'font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #ffcc66;';
  title.textContent = `Duel herausfordern?`;
  
  const playerName = document.createElement('div');
  playerName.style.cssText = 'font-size: 14px; margin-bottom: 15px; color: #a0d0ff;';
  playerName.textContent = targetPlayer.name;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';
  
  const challengeBtn = document.createElement('button');
  challengeBtn.textContent = '⚔️ Herausfordern';
  challengeBtn.style.cssText = `
    background: linear-gradient(180deg, rgba(200,100,100,0.5) 0%, rgba(180,80,80,0.4) 100%);
    border: 1px solid rgba(200,100,100,0.6);
    color: #ff9999;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 3px;
    font-weight: bold;
    transition: all 0.2s;
  `;
  challengeBtn.onmouseover = function() {
    this.style.boxShadow = '0 0 10px rgba(200,100,100,0.4)';
  };
  challengeBtn.onmouseout = function() {
    this.style.boxShadow = 'none';
  };
  challengeBtn.onclick = function() {
    webSocket.send(JSON.stringify({
      event: 'chatMessage',
      from: player.name,
      message: `/duel ${targetPlayer.name}`
    }));
    popup.remove();
  };
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Abbrechen';
  cancelBtn.style.cssText = `
    background: linear-gradient(180deg, rgba(100,100,100,0.5) 0%, rgba(80,80,80,0.4) 100%);
    border: 1px solid rgba(100,100,100,0.6);
    color: #a0a0a0;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 3px;
    font-weight: bold;
    transition: all 0.2s;
  `;
  cancelBtn.onmouseover = function() {
    this.style.boxShadow = '0 0 10px rgba(100,100,100,0.4)';
  };
  cancelBtn.onmouseout = function() {
    this.style.boxShadow = 'none';
  };
  cancelBtn.onclick = function() {
    popup.remove();
  };
  
  buttonContainer.appendChild(challengeBtn);
  buttonContainer.appendChild(cancelBtn);
  
  popup.appendChild(title);
  popup.appendChild(playerName);
  popup.appendChild(buttonContainer);
  document.body.appendChild(popup);
};

// Duel accept/decline popup
window.showDuelAcceptPopup = function(fromPlayerName) {
  // Remove any existing duel accept popup
  const existingPopup = document.getElementById('duelAcceptPopup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Create popup element
  const popup = document.createElement('div');
  popup.id = 'duelAcceptPopup';
  popup.style.cssText = `
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(10,10,20,0.95) 100%);
    border: 2px solid rgba(200,180,100,0.6);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(0,0,0,0.8);
    color: #e0d5b7;
    z-index: 10001;
    text-align: center;
    min-width: 300px;
  `;
  
  const title = document.createElement('div');
  title.style.cssText = 'font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #ffcc66;';
  title.textContent = `Duell-Herausforderung`;
  
  const playerName = document.createElement('div');
  playerName.style.cssText = 'font-size: 14px; margin-bottom: 15px; color: #a0d0ff;';
  playerName.textContent = `${fromPlayerName} fordert dich heraus!`;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';
  
  const acceptBtn = document.createElement('button');
  acceptBtn.textContent = '⚔️ Akzeptieren';
  acceptBtn.style.cssText = `
    background: linear-gradient(180deg, rgba(100,180,100,0.5) 0%, rgba(80,150,80,0.4) 100%);
    border: 1px solid rgba(100,180,100,0.6);
    color: #a0ffa0;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 3px;
    font-weight: bold;
    transition: all 0.2s;
  `;
  acceptBtn.onmouseover = function() {
    this.style.boxShadow = '0 0 10px rgba(100,180,100,0.4)';
  };
  acceptBtn.onmouseout = function() {
    this.style.boxShadow = 'none';
  };
  acceptBtn.onclick = function() {
    webSocket.send(JSON.stringify({
      event: 'chatMessage',
      from: player.name,
      message: `/accept`
    }));
    popup.remove();
  };
  
  const declineBtn = document.createElement('button');
  declineBtn.textContent = 'Ablehnen';
  declineBtn.style.cssText = `
    background: linear-gradient(180deg, rgba(100,100,100,0.5) 0%, rgba(80,80,80,0.4) 100%);
    border: 1px solid rgba(100,100,100,0.6);
    color: #a0a0a0;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 3px;
    font-weight: bold;
    transition: all 0.2s;
  `;
  declineBtn.onmouseover = function() {
    this.style.boxShadow = '0 0 10px rgba(100,100,100,0.4)';
  };
  declineBtn.onmouseout = function() {
    this.style.boxShadow = 'none';
  };
  declineBtn.onclick = function() {
    popup.remove();
  };
  
  buttonContainer.appendChild(acceptBtn);
  buttonContainer.appendChild(declineBtn);
  
  popup.appendChild(title);
  popup.appendChild(playerName);
  popup.appendChild(buttonContainer);
  document.body.appendChild(popup);
};

// Raid start popup for leader
window.showRaidStartPopup = function() {
  // Prevent multiple popups for same raid
  if (window.currentRaidInfo && lastRaidStartPopupId === window.currentRaidInfo.id) {
    return;
  }
  
  if (window.currentRaidInfo) {
    lastRaidStartPopupId = window.currentRaidInfo.id;
  }
  
  // Create popup element
  const popup = document.createElement('div');
  popup.id = 'raidStartPopup';
  popup.style.cssText = `
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(10,10,20,0.95) 100%);
    border: 2px solid rgba(200,180,100,0.6);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(0,0,0,0.8);
    color: #e0d5b7;
    z-index: 10002;
    text-align: center;
    min-width: 300px;
  `;
  
  const title = document.createElement('div');
  title.style.cssText = 'font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #ffcc66;';
  title.textContent = `Raid Starten`;
  
  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; margin-bottom: 15px; color: #a0a0a0;';
  desc.textContent = `Du bist der Leader. Starte den Raid wenn alle Spieler bereit sind!`;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';
  
  const startBtn = document.createElement('button');
  startBtn.textContent = '⚡ Raid Starten';
  startBtn.style.cssText = `
    background: linear-gradient(180deg, rgba(255,100,0,0.6) 0%, rgba(200,80,0,0.5) 100%);
    border: 1px solid rgba(255,150,0,0.7);
    color: #ffcc66;
    padding: 10px 20px;
    cursor: pointer;
    border-radius: 3px;
    font-weight: bold;
    font-size: 14px;
    transition: all 0.2s;
  `;
  startBtn.onmouseover = function() {
    this.style.boxShadow = '0 0 15px rgba(255,150,0,0.6)';
  };
  startBtn.onmouseout = function() {
    this.style.boxShadow = 'none';
  };
  startBtn.onclick = function() {
    webSocket.send(JSON.stringify({
      event: 'chatMessage',
      from: player.name,
      message: `/raid start`
    }));
    popup.remove();
  };
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Abbrechen';
  cancelBtn.style.cssText = `
    background: linear-gradient(180deg, rgba(100,100,100,0.5) 0%, rgba(80,80,80,0.4) 100%);
    border: 1px solid rgba(100,100,100,0.6);
    color: #a0a0a0;
    padding: 10px 20px;
    cursor: pointer;
    border-radius: 3px;
    font-weight: bold;
    font-size: 14px;
    transition: all 0.2s;
  `;
  cancelBtn.onmouseover = function() {
    this.style.boxShadow = '0 0 10px rgba(100,100,100,0.4)';
  };
  cancelBtn.onmouseout = function() {
    this.style.boxShadow = 'none';
  };
  cancelBtn.onclick = function() {
    popup.remove();
  };
  
  buttonContainer.appendChild(startBtn);
  buttonContainer.appendChild(cancelBtn);
  
  popup.appendChild(title);
  popup.appendChild(desc);
  popup.appendChild(buttonContainer);
  document.body.appendChild(popup);
};

window.showAdvancedRaidMenu = function() {
  const ui = document.getElementById('customRaidUI');
  if (!ui) return;
  
  ui.style.display = 'block';
  
  // Make draggable
  makeWindowDraggable('customRaidUI', 'customRaidHeader');
};

// Initialize Custom Raid Settings UI
window.addEventListener('load', function() {
  const customUI = document.getElementById('customRaidUI');
  if (!customUI) return;
  
  // Slider updates
  const bossHealthSlider = document.getElementById('bossHealth');
  const bossHealthValue = document.getElementById('bossHealthValue');
  const bossDamageSlider = document.getElementById('bossDamage');
  const bossDamageValue = document.getElementById('bossDamageValue');
  const bossSpeedSlider = document.getElementById('bossSpeed');
  const bossSpeedValue = document.getElementById('bossSpeedValue');
  
  if (bossHealthSlider) {
    bossHealthSlider.addEventListener('input', function() {
      bossHealthValue.textContent = this.value;
    });
  }
  
  if (bossDamageSlider) {
    bossDamageSlider.addEventListener('input', function() {
      bossDamageValue.textContent = parseFloat(this.value).toFixed(1) + 'x';
    });
  }
  
  if (bossSpeedSlider) {
    bossSpeedSlider.addEventListener('input', function() {
      bossSpeedValue.textContent = parseFloat(this.value).toFixed(1) + 'x';
    });
  }
  
  // Boss Mode Button Selection
  let selectedMode = 'stand';
  document.querySelectorAll('.bossModeBtn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bossModeBtn').forEach(b => {
        b.style.background = 'rgba(100,100,100,0.4)';
        b.style.borderColor = 'rgba(150,150,150,0.5)';
        b.style.color = '#d0d0d0';
      });
      this.style.background = 'rgba(200,180,100,0.5)';
      this.style.borderColor = 'rgba(200,180,100,0.8)';
      this.style.color = '#ffcc66';
      selectedMode = this.dataset.mode;
    });
  });
  
  // Set default mode as selected
  const defaultModeBtn = document.querySelector('.bossModeBtn[data-mode="stand"]');
  if (defaultModeBtn) {
    defaultModeBtn.style.background = 'rgba(200,180,100,0.5)';
    defaultModeBtn.style.borderColor = 'rgba(200,180,100,0.8)';
    defaultModeBtn.style.color = '#ffcc66';
  }
  
  // Create Custom Raid Button
  const createBtn = document.getElementById('createCustomRaidBtn');
  if (createBtn) {
    createBtn.addEventListener('click', function() {
      // Gather settings
      const seedInput = document.getElementById('raidSeed');
      const settings = {
        seed: seedInput && seedInput.value.trim() ? seedInput.value.trim() : null,
        bossHealth: parseInt(bossHealthSlider.value),
        bossDamage: parseFloat(bossDamageSlider.value),
        bossSpeed: parseFloat(bossSpeedSlider.value),
        bossMode: selectedMode,
        attacks: [],
        mechanics: []
      };
      
      // Get selected attacks
      document.querySelectorAll('.attackCheckbox:checked').forEach(cb => {
        settings.attacks.push(cb.dataset.attack);
      });
      
      // Get selected mechanics
      document.querySelectorAll('.mechanicCheckbox:checked').forEach(cb => {
        settings.mechanics.push(cb.dataset.mechanic);
      });
      
      // Validate
      if (settings.attacks.length === 0) {
        alert('Bitte mindestens eine Attacke auswählen!');
        return;
      }
      
      // Send to server
      try {
        webSocket.send(JSON.stringify({
          event: 'createCustomRaid',
          from: player.name,
          settings: settings
        }));
      } catch (e) {
        console.error('Failed to send custom raid settings:', e);
      }
      
      // Close UI
      customUI.style.display = 'none';
    });
  }
  
  // Cancel Button
  const cancelBtn = document.getElementById('cancelCustomRaidBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      customUI.style.display = 'none';
    });
  }
  
  // Close Button (X)
  const closeBtn = document.getElementById('customRaidClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      customUI.style.display = 'none';
    });
  }
});
