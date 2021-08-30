
var player = new Player;
var lastTime = (new Date()).getTime();
var currentTime = 0;
var delta = 0;

controller = {
  left: false,
  right: false,
  up: false,
  keyListener: function(event) {
    var key_state = event.type == 'keydown' ? true : false
    if (key_state == false) {player.state = 'idle'}
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
  },
}

function gameLoop() {
    currentTime = (new Date()).getTime();
    delta = (currentTime - lastTime) / 1000;
    console.log(delta)
    updateData();
    renderData();
    lastTime = currentTime;
    window.requestAnimationFrame(gameLoop)
}

function updateData() {
  if (controller.up) {
    player.y_velocity -= 200 * delta
    player.state = 'run';
  }
  if (controller.down) {
    player.y_velocity += 200 * delta
    player.state = 'run';
  }
  if (controller.left) {
    player.x_velocity -= 200 * delta 
    player.state = 'run';
    player.direction = 'left';
  }
  if (controller.right) {
    player.x_velocity += 200 * delta
    player.state = 'run';
    player.direction = 'right';
  }

  // player.y_velocity += 0.5 //Gravity
  player.x += player.x_velocity
  player.y += player.y_velocity
  player.x_velocity *= 0.5 * delta
  player.y_velocity *= 0.5 * delta


  // bottom wall
  if (player.y > context.canvas.height - 48) {
    player.jumping = false
    player.y = context.canvas.height - 48
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
  if (player.x >= context.canvas.width - 50) {
    player.x = context.canvas.width - 50
    player.x_velocity = 0
  }
}

function renderData() {
  context.fillStyle = '#202020'
  context.fillRect(0, 0, context.canvas.width, context.canvas.height)
  player.renderPlayer();
}

// key Event listener
window.addEventListener('keydown', controller.keyListener)
window.addEventListener('keyup', controller.keyListener)


// start game loop
window.requestAnimationFrame(gameLoop)