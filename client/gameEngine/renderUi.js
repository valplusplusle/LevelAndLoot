function renderUI() {
    renderRole();
    renderHealth();
    renderSkillBar();
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
    document.getElementById('healthBar').style.width = player.health + '%';
    document.getElementById('healthText').innerHTML = player.health + '%';
}

function renderSkillBar() {
    
}