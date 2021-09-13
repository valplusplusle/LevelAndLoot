var socketName = "ws:127.0.0.1:3005";
var webSocket = new WebSocket(socketName);

webSocket.onmessage = (message) => {
    // got all player data
    var messageData = JSON.parse(message.data);
    if (messageData.event === "connectionClosed") {
        var indexOfObject = otherPlayers.findIndex((obj => obj.id === messageData.id));
        otherPlayers.splice(indexOfObject, 1);
    } else if (messageData.event === "chatMessage") {
        writeMessageToBoard(messageData);
    } else {
        var lobbyArray = messageData;
        lobbyArray.forEach(lobbyPlayer => {
            if(lobbyPlayer.id !== player.id) {
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
                } else {
                    let newPlayer = new Player;
                    newPlayer.id = lobbyPlayer.id;
                    otherPlayers.push(newPlayer)
                }
            }
        });
    }

};

var intervalId = window.setInterval(function(){
    // send player data every 5 ms
    webSocket.send(JSON.stringify(player));
}, 15);