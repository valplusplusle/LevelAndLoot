var express = require("express");
var cors = require('cors');
var http = require('http');
const WebSocket = require('ws');

// server definition
var app = express();
app.use(cors());

// create http server
const httpServer = http.createServer(app);
httpServer.listen(3005, () => {
  console.log('Lobby Server running');
});

// create ws server
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
  server: httpServer
});

// main game connections
const lobbyArray = [];

wss.broadcast = function broadcast(msg) {
  wss.clients.forEach(function each(client) {
      client.send(msg);
   });
};

wss.on('connection', function connection(ws) {
  // senc actual lobby on connection opening
  ws.send(JSON.stringify(lobbyArray));

  ws.on('message', function incoming(message) {
    let msg = JSON.parse(message);

    if (msg.event === "chatMessage") {
      wss.broadcast(JSON.stringify(msg));
    } else {
      ws.id = msg.id;

      if (lobbyArray.length > 0) {
        const checkLobbyArray = obj => obj.id === msg.id;

        // check if player object is already in lobby
        if (lobbyArray.some(checkLobbyArray)) {
          // if true, update the object
          objIndex = lobbyArray.findIndex((obj => obj.id === msg.id));
          lobbyArray[objIndex] = msg;
        } else {
          // else add new player
          lobbyArray.push(msg);
        }
      } else {
        // if no player is online add as first player
        lobbyArray.push(msg);
      }
      // send lobby as anwser on each update
      ws.send(JSON.stringify(lobbyArray));
    }
  });

  ws.on('close', function () {
    // connection closed handling
    objIndex = lobbyArray.findIndex((obj => obj.id === ws.id));
    lobbyArray.splice(objIndex, 1);
    var data = {
      event: "connectionClosed",
      id: ws.id
    }
    wss.broadcast(JSON.stringify(data));
  })
});