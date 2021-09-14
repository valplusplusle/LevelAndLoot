const inputText = document.getElementById("chatinput");

document.addEventListener("keyup", function(event) {
    if (event.key === "Enter" && document.activeElement.id != "chatinput" && document.activeElement.id != "name") {
        document.getElementById("chatinput").focus();
    } else if (event.key === "Enter" && document.activeElement.id === "chatinput") {
        var chatMessage = inputText.value;
        inputText.value = '';
        document.activeElement.blur();
        sendMessage(chatMessage);
    }
});

function sendMessage(chatMessage) {
    chatMessageObject = {
        event: 'chatMessage',
        from: player.name,
        message: chatMessage
    }
    if (chatMessage != "") {
        webSocket.send(JSON.stringify(chatMessageObject));
    }
}

function writeMessageToBoard(messageObject) {
    document.getElementById('chatField').innerHTML += `
        <div>`+messageObject.from+`: `+messageObject.message+`<div>
    `
    updateScroll();
}

function updateScroll(){
    var element = document.getElementById("chatField");
    element.scrollTop = element.scrollHeight;
}