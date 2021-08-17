var context, controller, player, loop

context = document.querySelector('canvas').getContext('2d')

context.webkitImageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.imageSmoothingEnabled = false;

context.canvas.width = 256
context.canvas.height = 224

context.canvas.style.height = context.canvas.height;
context.canvas.style.width = context.canvas.width;

playerImage = new Image();
playerImage.src = "mainChar16x16.png";

player = {
  height: 16,
  width: 16,
  jumping: true,
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
  if (controller.up && player.jumping == false) {
    player.y_velocity -= 20
    player.jumping = true
  }
  if (controller.left) {
    player.x_velocity -= 0.5
  }
  if (controller.right) {
    player.x_velocity += 0.5
  }

  player.y_velocity += 1.5 //Gravity
  player.x += player.x_velocity
  player.y += player.y_velocity
  player.x_velocity *= 0.9
  player.y_velocity *= 0.9 

  if (player.y > 224 - 16 - 0) {
    player.jumping = false
    player.y = 224 - 16 - 0
    player.y_velocity = 0
  }

  if (player.x <= 0) {
    player.x = 0
    player.x_velocity = 0
  }

  if (player.x >= 256 - 16) {
    player.x = 256 - 16
    player.x_velocity = 0
  }

  context.fillStyle = '#202020'
  context.fillRect(0, 0, 256, 224)
  context.drawImage(playerImage, player.x, player.y);


  window.requestAnimationFrame(loop)
}

window.addEventListener('keydown', controller.keyListener)
window.addEventListener('keyup', controller.keyListener)
window.requestAnimationFrame(loop)

