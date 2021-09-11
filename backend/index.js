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

wss.on('connection', function connection(ws) {

  

  ws.send(JSON.stringify(lobbyArray));

  ws.on('message', function incoming(message) {
    let msg = JSON.parse(message);
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
  });

  ws.on('close', function () {
    console.log('connection closed handle closing')
    objIndex = lobbyArray.findIndex((obj => obj.id === ws.id));
    lobbyArray.splice(objIndex, 1);
  })
});