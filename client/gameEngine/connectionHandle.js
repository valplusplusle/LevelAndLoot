var socketName = "ws:127.0.0.1:3005";
var webSocket = new WebSocket(socketName);

var currentRaidState = null; // <= NEW (für render)

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

  // Duel / Fight lifecycle
  if (messageData.event === "duelInvite") {
    writeMessageToBoard({ from: "SYSTEM", message: `Duel-Invite von ${messageData.from}. Tippe /accept` });
    return;
  }

  if (messageData.event === "fightStarted") {
    player.inFight = true;
    player.fightId = messageData.fightId;
    player.world = messageData.fightId;
    writeMessageToBoard({ from: "SYSTEM", message: `Fight gestartet: ${messageData.fightId}` });
    return;
  }

  if (messageData.event === "fightEnded") {
    player.inFight = false;
    player.fightId = null;
    player.world = "city-1";
    player.health = 100;
    currentRaidState = null;
    writeMessageToBoard({ from: "SYSTEM", message: `Fight beendet. Winner: ${messageData.winnerId}` });
    return;
  }

  // Raid
  if (messageData.event === "raidJoined") {
    player.inFight = true;
    player.fightId = messageData.raidId;
    player.world = messageData.raidId;
    writeMessageToBoard({ from: "SYSTEM", message: `Raid joined: ${messageData.raidId} (seed=${messageData.seed})` });
    return;
  }

  if (messageData.event === "raidState") {
    currentRaidState = messageData.raid;
    return;
  }

  if (messageData.event === "raidEnded") {
    player.inFight = false;
    player.fightId = null;
    player.world = "city-1";
    player.health = 100;
    currentRaidState = null;
    writeMessageToBoard({ from: "SYSTEM", message: `Raid ended: ${messageData.reason}` });
    return;
  }

  if (messageData.event === "combatText") {
    // optional: could render floating text later
    return;
  }

  // Lobby Snapshot
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
          otherPlayers[indexOfObject].inFight = lobbyPlayer.inFight;
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
          newPlayer.inFight = lobbyPlayer.inFight;
          otherPlayers.push(newPlayer);
        }
      } else {
        // sync my HP from server truth if we want:
        if (typeof lobbyPlayer.health === "number") player.health = lobbyPlayer.health;
      }
    });

    return;
  }
};

var intervalId = window.setInterval(function () {
  webSocket.send(JSON.stringify(player));
}, 50); // <= 15ms war overkill; 50ms reicht fürs lobby prototyping
