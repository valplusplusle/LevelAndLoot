// Draggable raid group box UI
// Usage: call showRaidGroupBox(raidState, player, otherPlayers)

let raidGroupBox = null;
let raidGroupBoxHeader = null;
let isDraggingRaidBox = false;
let dragOffsetX = 0;
let dragOffsetY = 0;


function showRaidGroupBox(raidState, player, otherPlayers) {
    if (!raidGroupBox) {
        raidGroupBox = document.createElement('div');
        raidGroupBox.id = 'raidGroupBox';
        raidGroupBox.innerHTML = `
            <div id="raidGroupBoxHeader">RAID GRUPPE <span id="raidGroupBoxClose" style="float:right;cursor:pointer;">✕</span></div>
            <div id="raidGroupMembers"></div>
        `;
        document.body.appendChild(raidGroupBox);
        raidGroupBoxHeader = document.getElementById('raidGroupBoxHeader');
        // Drag events
        raidGroupBoxHeader.onmousedown = function(e) {
            isDraggingRaidBox = true;
            dragOffsetX = e.clientX - raidGroupBox.offsetLeft;
            dragOffsetY = e.clientY - raidGroupBox.offsetTop;
            document.body.style.userSelect = 'none';
        };
        document.onmousemove = function(e) {
            if (isDraggingRaidBox) {
                raidGroupBox.style.left = (e.clientX - dragOffsetX) + 'px';
                raidGroupBox.style.top = (e.clientY - dragOffsetY) + 'px';
            }
        };
        document.onmouseup = function() {
            isDraggingRaidBox = false;
            document.body.style.userSelect = '';
        };
        document.getElementById('raidGroupBoxClose').onclick = function() {
            raidGroupBox.style.display = 'none';
        };

        // Default spawn: right side, below skillbar, above chat/joystick
        // Try to avoid overlap with skillbar (bottom right), chat (bottom left), charInfo (top left)
        // Place at right: 32px from right, top: 120px (below skillbar)
        raidGroupBox.style.left = (window.innerWidth - 320) + 'px';
        raidGroupBox.style.top = '120px';
        raidGroupBox._defaulted = true;
        // On first drag, remove _defaulted
        raidGroupBoxHeader.addEventListener('mousedown', function() {
            raidGroupBox._defaulted = false;
        });
    }
    raidGroupBox.style.display = 'block';
    raidGroupBox.style.position = 'fixed';
    raidGroupBox.style.zIndex = 10010;
    raidGroupBox.style.minWidth = '260px';
    raidGroupBox.style.background = 'linear-gradient(180deg,rgba(30,20,20,0.97),rgba(10,10,10,0.97))';
    raidGroupBox.style.border = '2px solid #a44';
    raidGroupBox.style.borderRadius = '8px';
    raidGroupBox.style.boxShadow = '0 4px 18px #000a';
    raidGroupBox.style.color = '#ffe';
    raidGroupBox.style.fontFamily = 'Arial,sans-serif';
    raidGroupBox.style.fontSize = '14px';
    raidGroupBox.style.pointerEvents = 'auto';
    raidGroupBox.style.userSelect = 'none';
    raidGroupBox.style.maxHeight = '340px';
    raidGroupBox.style.overflowY = 'auto';

    // If window resized and box is still at default, reposition
    if (raidGroupBox._defaulted) {
        raidGroupBox.style.left = (window.innerWidth - 320) + 'px';
        raidGroupBox.style.top = '120px';
    }
    window.addEventListener('resize', function() {
        if (raidGroupBox && raidGroupBox._defaulted) {
            raidGroupBox.style.left = (window.innerWidth - 320) + 'px';
            raidGroupBox.style.top = '120px';
        }
    });

    // Render members
    const membersDiv = document.getElementById('raidGroupMembers');
    membersDiv.innerHTML = '';
    if (!raidState || !raidState.members) return;
    raidState.members.forEach(id => {
        let pObj = (id === player.id) ? player : (otherPlayers.find(o => o.id === id) || null);
        const name = (pObj && pObj.name) ? pObj.name : id.substring(0,6);
        const hp = pObj ? (pObj.health || 0) : 0;
        const mhp = pObj ? (pObj.maxHealth || 100) : 100;
        const pct = Math.max(0, Math.min(1, hp / mhp));
        const dmg = pObj && pObj.raidStats ? pObj.raidStats.damage : 0;
        const heal = pObj && pObj.raidStats ? pObj.raidStats.healing : 0;
        const prot = pObj && pObj.raidStats ? pObj.raidStats.protection : 0;
        const memberDiv = document.createElement('div');
        memberDiv.className = 'raidGroupMember';
        memberDiv.style.display = 'flex';
        memberDiv.style.alignItems = 'center';
        memberDiv.style.gap = '8px';
        memberDiv.style.marginBottom = '6px';
        // Name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.style.width = '90px';
        nameSpan.style.overflow = 'hidden';
        nameSpan.style.textOverflow = 'ellipsis';
        nameSpan.style.whiteSpace = 'nowrap';
        // Health bar
        const barWrap = document.createElement('div');
        barWrap.style.width = '70px';
        barWrap.style.height = '10px';
        barWrap.style.background = '#300';
        barWrap.style.border = '1px solid #a44';
        barWrap.style.borderRadius = '4px';
        barWrap.style.position = 'relative';
        const barInner = document.createElement('div');
        barInner.style.height = '100%';
        barInner.style.width = Math.round(pct*100) + '%';
        barInner.style.background = 'linear-gradient(90deg,#e44,#a22)';
        barInner.style.borderRadius = '3px';
        barInner.style.transition = 'width 0.2s';
        barWrap.appendChild(barInner);
        // Stats
        const statsSpan = document.createElement('span');
        statsSpan.textContent = `🗡${dmg} 💚${heal} 🛡${prot}`;
        statsSpan.style.fontSize = '12px';
        statsSpan.style.marginLeft = '6px';
        memberDiv.appendChild(nameSpan);
        memberDiv.appendChild(barWrap);
        memberDiv.appendChild(statsSpan);
        membersDiv.appendChild(memberDiv);
    });
}

// Optionally, call this from your main UI update/render loop:
// showRaidGroupBox(currentRaidState, player, otherPlayers);
