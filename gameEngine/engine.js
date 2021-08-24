var context, controller, player, loop

//Setup Canvas
context = document.querySelector('canvas').getContext('2d')
context.canvas.width = 800
context.canvas.height = 600

var canvas = document.getElementById('screen')


canvas.style.height = window.innerHeight + 'px';

var test = (window.innerHeight / 600) * 800
console.log(test)
canvas.style.width = test + 'px';


class Player {
  state = 'idle';
  x = 0;
  y = 0;

  idleImage1 = new Image();
  idleImage2 = new Image();
  
  constructor() {
    this.height = 16,
    this.width = 16,
    this.x_velocity = 0,
    this.y_velocity = 0,
    this.state = 'idle'

    this.idleImage1.src = "./assets/dd/idle1_1.png";
    this.idleImage2.src = "./assets/dd/idle1_2.png";
  }

  changeState(newState) {
    this.state = newState;
  }

  updatePlayer() {

  }

  renderPlayer() {
    context.drawImage(this.idleImage1, this.x, this.y);
  }
}

var player = new Player;

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

function gameLoop() {
    updateData();
    renderData();
    window.requestAnimationFrame(gameLoop)
}

function updateData() {
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
function gameStart() {
  thisLoop = performance.now();
  window.requestAnimationFrame(gameLoop)
}
gameStart();

