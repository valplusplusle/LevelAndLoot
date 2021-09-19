
var player = new Player;
var lastTime = (new Date()).getTime();
var currentTime = 0;
var delta = 0;
var otherPlayers = [];

// init player name
document.getElementById('name').value = player.name;

controller = {
  left: false,
  right: false,
  up: false,
  down: false,
  one: false,
  keyListener: function(event) {
    var key_state = event.type == 'keydown' ? true : false
    if (key_state == false && player.state != 'attack1') {player.state = 'idle'}
    if (document.activeElement.id !== "chatinput" && document.activeElement.id !== "name") {
      switch (event.keyCode) {
        case 87:
          controller.up = key_state
          break
        case 83:
          controller.down = key_state
          break
        case 68:
          controller.right = key_state
          break
        case 65:
          controller.left = key_state
          break
  
      }
    }
  },
}

function gameLoop() {
    currentTime = (new Date()).getTime();
    delta = (currentTime - lastTime) / 1000;
    updateData();
    renderData();
    lastTime = currentTime;
    window.requestAnimationFrame(gameLoop)
}

function updateData() {
  if (controller.up) {
    player.y_velocity -= 200 * delta
    if(player.state != 'attack1') {
      player.state = 'run';
    }
  }
  if (controller.down) {
    player.y_velocity += 200 * delta
    if(player.state != 'attack1') {
      player.state = 'run';
    }
  }
  if (controller.left) {
    player.x_velocity -= 200 * delta 
    if(player.state != 'attack1') {
      player.state = 'run';
    }
    player.direction = 'left';
  }
  if (controller.right) {
    player.x_velocity += 200 * delta
    if(player.state != 'attack1') {
      player.state = 'run';
    }
    player.direction = 'right';
  }

  // player.y_velocity += 0.5 //Gravity
  player.x += player.x_velocity
  player.y += player.y_velocity
  player.x_velocity *= 0.5 * delta
  player.y_velocity *= 0.5 * delta


  // bottom wall
  if (player.y > 600 - 48) {
    player.jumping = false
    player.y = 600 - 48
    player.y_velocity = 0
  }

  // top wall
  if (player.y < 0) {
    player.y = 0
    player.y_velocity = 0
  }

  // left wall
  if (player.x <= 0) {
    player.x = 0
    player.x_velocity = 0
  }

  // right wall
  if (player.x >= 800 - 50) {
    player.x = 800 - 50
    player.x_velocity = 0
  }
}

function renderData() {
  context.fillStyle = '#202020'
  //context.fillRect(0, 0, canvas.width, canvas.height)
  renderWorld(player.world);
  player.renderPlayer();
  otherPlayers.forEach(otherPlayer => {
    if(otherPlayer.world == player.world) {
      otherPlayer.renderPlayer();
    }
  });
  renderUI();
}

// key Event listener
window.addEventListener('keydown', controller.keyListener)
window.addEventListener('keyup', controller.keyListener)

document.addEventListener('keydown', function (e) {
  if(e.code == 'Digit1') {
    document.getElementById("skill1").click();
  }
}, false);

// start game loop
window.requestAnimationFrame(gameLoop)