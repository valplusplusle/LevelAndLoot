var socketName = "ws:127.0.0.1:3005";
var webSocket = new WebSocket(socketName);

webSocket.onmessage = (message) => {
    console.log('got a message');
    console.log(message.data);
    console.log(JSON.stringify(player));
    webSocket.send(JSON.stringify(player));
};