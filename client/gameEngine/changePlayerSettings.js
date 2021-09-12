function changeClass(playerClass) {
    if(player.inFight === false) {
        player.playerClass = playerClass;
    }
}

function changeRole(playerRole) {
    if(player.inFight === false) {
        player.role = playerRole;
    }
}

function changePlayerName() {
    player.name = document.getElementById('name').value;
}