var context, controller, player, loop

context = document.querySelector('canvas').getContext('2d')

context.webkitImageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.imageSmoothingEnabled = false;

context.canvas.width = 800
context.canvas.height = 600

context.canvas.style.width = context.canvas.width;
context.canvas.style.height = context.canvas.height;


playerImage = new Image();
playerImage.src = "mainChar16x16.png";

player = {
  height: 16,
  width: 16,
  x: 0,
  x_velocity: 0,
  y: 0,
  y_velocity: 0,
}

controller = {
  left: false,
  right: false,
  up: false,
  keyListener: function(event) {
    var key_state = event.type == 'keydown' ? true : false

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

loop = function() {
  if (controller.up) {
    player.y_velocity -= 0.5
  }
  if (controller.down) {
    player.y_velocity += 0.5
  }
  if (controller.left) {
    player.x_velocity -= 0.5
  }
  if (controller.right) {
    player.x_velocity += 0.5
  }

  // player.y_velocity += 1.5 //Gravity
  player.x += player.x_velocity
  player.y += player.y_velocity
  player.x_velocity *= 0.9
  player.y_velocity *= 0.9 


  // bottom wall
  if (player.y > context.canvas.height - 16) {
    player.y = context.canvas.height - 16
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
  if (player.x >= context.canvas.width - 16) {
    player.x = context.canvas.width - 16
    player.x_velocity = 0
  }

  context.fillStyle = '#202020'
  context.fillRect(0, 0, context.canvas.width, context.canvas.height)
  context.drawImage(playerImage, player.x, player.y);


  window.requestAnimationFrame(loop)
}

window.addEventListener('keydown', controller.keyListener)
window.addEventListener('keyup', controller.keyListener)
window.requestAnimationFrame(loop)

