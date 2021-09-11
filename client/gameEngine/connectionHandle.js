var socketName = "ws:127.0.0.1:3005";
var webSocket = new WebSocket(socketName);

webSocket.onmessage = (message) => {
    // got all player data
    var lobbyArray = JSON.parse(message.data);
    lobbyArray.forEach(lobbyPlayer => {
        if(lobbyPlayer.id !== player.id) {
            var indexOfObject = otherPlayers.findIndex((obj => obj.id === lobbyPlayer.id));
            if (indexOfObject != -1) {
                otherPlayers[indexOfObject].x = lobbyPlayer.x;
                otherPlayers[indexOfObject].y = lobbyPlayer.y;
                otherPlayers[indexOfObject].state = lobbyPlayer.state;
                otherPlayers[indexOfObject].lastState = lobbyPlayer.lastState;
                otherPlayers[indexOfObject].direction = lobbyPlayer.direction;
            } else {
                let newPlayer = new Player;
                newPlayer.id = lobbyPlayer.id;
                otherPlayers.push(newPlayer)
            }
        }
    });
    console.log(otherPlayers)
};

var intervalId = window.setInterval(function(){
    // send player data every 5 ms
    webSocket.send(JSON.stringify(player));
}, 5);