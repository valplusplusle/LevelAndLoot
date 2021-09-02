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
        console.log('got a message')
        console.log(message)
        ws.send(JSON.stringify(lobbyArray));
    });
    
    ws.on('close', function(){
      console.log('connection closed handle closing')
    })
});