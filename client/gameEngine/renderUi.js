function renderUI() {
    renderRole();
    renderHealth();
    renderSkillBar();
    renderDuelInfo();
    // Only show new draggable raid group box
    if (typeof showRaidGroupBox === 'function' && player.inFight && player.fightId && player.fightId.startsWith('raid-') && typeof currentRaidState !== 'undefined' && currentRaidState) {
        showRaidGroupBox(currentRaidState, player, otherPlayers);
    } else if (window.raidGroupBox) {
        raidGroupBox.style.display = 'none';
    }
}

function renderRole() {
    if(player.role === 'dd') {
        document.getElementById('roleIcon').style.backgroundImage = "url('./assets/icons/dd.png')";
    }
    if(player.role === 'tank') {
        document.getElementById('roleIcon').style.backgroundImage = "url('./assets/icons/tank.png')";
    }
    if(player.role === 'heal') {
        document.getElementById('roleIcon').style.backgroundImage = "url('./assets/icons/heal.png')";
    }
}

function renderHealth() {
    const maxHealth = player.maxHealth || 100;
    const pct = (player.health / maxHealth) * 100;
    document.getElementById('healthBar').style.width = pct + '%';
    document.getElementById('healthText').innerHTML = `${player.health} / ${maxHealth}`;
}

function renderSkillBar() {
    // Class icons (slots 1 & 2)
    const classIcons = {
        knight: 'url("./assets/icons/knight.png")',
        mage: 'url("./assets/icons/mage.png")',
        archer: 'url("./assets/icons/archer.png")'
    };
    
    // Role icons (slots 3 & 4)
    const roleIcons = {
        tank: 'url("./assets/icons/tank.png")',
        dd: 'url("./assets/icons/dd.png")',
        heal: 'url("./assets/icons/heal.png")'
    };
    
    // Update skill buttons with proper icons and tooltips
    for (let slot = 1; slot <= 4; slot++) {
        const skillEl = document.getElementById(`skill${slot}`);
        if (!skillEl) continue;
        
        const iconEl = skillEl.querySelector('.skillIcon');
        const tooltipEl = skillEl.querySelector('.skillTooltip');
        
        if (slot <= 2) {
            // Class skills
            iconEl.style.backgroundImage = classIcons[player.playerClass] || classIcons.knight;
            tooltipEl.textContent = getSkillTooltip(slot, 'class');
        } else {
            // Role abilities
            iconEl.style.backgroundImage = roleIcons[player.role] || roleIcons.tank;
            tooltipEl.textContent = getSkillTooltip(slot, 'role');
        }
    }
}

function getSkillTooltip(slot, type) {
    const skillDefs = {
        knight: {
            1: { name: 'Slash', type: 'Damage', value: '12 DMG' },
            2: { name: 'Cleave', type: 'Damage', value: '10 DMG (AoE)' }
        },
        mage: {
            1: { name: 'Firebolt', type: 'Damage', value: '13 DMG' },
            2: { name: 'Fire Rain', type: 'Damage', value: '11 DMG (AoE)' }
        },
        archer: {
            1: { name: 'Shot', type: 'Damage', value: '13 DMG' },
            2: { name: 'Arrow Rain', type: 'Damage', value: '10 DMG (AoE)' }
        },
        tank: {
            3: { name: 'Shield Wall', type: 'Defense', value: '55% DR' },
            4: { name: 'Protect Zone', type: 'Defense', value: '40% DR (AoE)' }
        },
        dd: {
            3: { name: 'Burst', type: 'Damage', value: '35 DMG' },
            4: { name: 'Execute', type: 'Damage', value: '32-54 DMG' }
        },
        heal: {
            3: { name: 'Single Heal', type: 'Healing', value: '24 HP' },
            4: { name: 'AOE Heal', type: 'Healing', value: '18 HP (AoE)' }
        }
    };
    
    let skill;
    if (type === 'class') {
        skill = (skillDefs[player.playerClass] || skillDefs.knight)[slot];
    } else {
        skill = (skillDefs[player.role] || skillDefs.tank)[slot];
    }
    
    if (!skill) return '';
    return `${skill.name} - ${skill.type}: ${skill.value}`;
}

// renderRaidMembers removed (old UI)

function renderDuelInfo() {
    const el = document.getElementById('duelInfo');
    if (!el) return;
    el.classList.remove('visible');
    el.innerHTML = '';

    if (!player.inFight || !player.fightId || !player.fightId.startsWith('duel-')) return;

    // find opponent
    const opponent = otherPlayers.find(o => o.world === player.fightId && o.id !== player.id);
    if (!opponent) return;

    el.classList.add('visible');
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    title.textContent = opponent.name || 'Opponent';
    el.appendChild(title);

    const barWrap = document.createElement('div');
    barWrap.style.width = '100%';
    barWrap.style.height = '14px';
    barWrap.style.background = 'rgba(0,0,0,0.6)';
    barWrap.style.border = '1px solid rgba(200,180,100,0.4)';
    barWrap.style.borderRadius = '6px';
    barWrap.style.overflow = 'hidden';

    const inner = document.createElement('div');
    const pct = Math.max(0, Math.min(1, (opponent.health || 0) / (opponent.maxHealth || 100)));
    inner.style.width = `${Math.round(pct * 100)}%`;
    inner.style.height = '100%';
    inner.style.background = pct > 0.5 ? 'linear-gradient(90deg,#66ff66,#ffff66)' : (pct > 0.25 ? 'linear-gradient(90deg,#ffff66,#ffcc66)' : 'linear-gradient(90deg,#ff6666,#cc4444)');

    barWrap.appendChild(inner);
    el.appendChild(barWrap);

    const txt = document.createElement('div');
    txt.style.marginTop = '6px';
    txt.style.fontSize = '12px';
    txt.textContent = `${Math.round(opponent.health||0)} / ${opponent.maxHealth||100}`;
    el.appendChild(txt);
}