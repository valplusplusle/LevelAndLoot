var context, controller, player, loop

// Setup Canvas
context = document.querySelector('canvas').getContext('2d')
context.canvas.width = 800
context.canvas.height = 600

// calculate screen size
var canvas = document.getElementById('screen')
canvas.style.height = window.innerHeight + 'px';
var variableResolution = (window.innerHeight / 600) * 800
canvas.style.width = variableResolution + 'px';


class Player {
  state = 'idle';
  lastState = 'idle';
  x = 0;
  y = 0;

  sprite = new Image();
  frame = 0;
  
  constructor() {
    this.height = 48,
    this.width = 48,
    this.x_velocity = 0,
    this.y_velocity = 0,
    this.state = 'idle',
    this.jumping = true,
    this.sprite.src = "./assets/dd/dd_sprite.png"
  }

  changeState(newState) {
    this.state = newState;
  }

  updatePlayer() {

  }

  renderPlayer() {
    if (this.lastState != this.state) {this.frame = 0; this.lastState = this.state};
    if (this.frame == 0) {this.frame = Date.now();};
    const timeNow = Date.now();

    if(this.state === 'idle') {
      if(timeNow-this.frame <= 200) {
        context.drawImage(this.sprite, 0, 0, 50, 48, this.x, this.y, 50,48);
      } else if (timeNow-this.frame > 200){
        context.drawImage(this.sprite, 50, 0, 50, 48, this.x, this.y, 50,48);
      }
      if (timeNow-this.frame >= 600) {this.frame = Date.now();}
    }

    if(this.state === 'run') {
      const timeDifference = timeNow-this.frame;
      if(timeDifference <= 100) {
        context.drawImage(this.sprite, 0, 144, 50, 48, this.x, this.y, 50,48);
      } else if (timeDifference > 100 && timeDifference <= 200){
        context.drawImage(this.sprite, 50, 144, 50, 48, this.x, this.y, 50,48);
      } else if (timeDifference > 200 && timeDifference <= 300){
        context.drawImage(this.sprite, 100, 144, 50, 48, this.x, this.y, 50,48);
      } else if (timeDifference > 300 && timeDifference <= 400){
        context.drawImage(this.sprite, 150, 144, 50, 48, this.x, this.y, 50,48);
      } else if (timeDifference > 400 && timeDifference <= 500){
        context.drawImage(this.sprite, 200, 144, 50, 48, this.x, this.y, 50,48);
      } else if (timeDifference > 500 && timeDifference <= 600){
         context.drawImage(this.sprite, 250, 144, 50, 48, this.x, this.y, 50,48);
      }
      if (timeNow-this.frame >= 600) {this.frame = Date.now();}
    }
    
  }
}

var player = new Player;

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
    updateData();
    renderData();
    window.requestAnimationFrame(gameLoop)
}

function updateData() {
  if (controller.up && player.jumping == false) {
    player.y_velocity -= 20
    player.jumping = true
  }
  if (controller.down) {
    player.y_velocity += 0.5
  }
  if (controller.left) {
    player.x_velocity -= 0.5
    player.state = 'run';
  }
  if (controller.right) {
    player.x_velocity += 0.5
    player.state = 'run';
  }

  player.y_velocity += 0.5 //Gravity
  player.x += player.x_velocity
  player.y += player.y_velocity
  player.x_velocity *= 0.5
  player.y_velocity *= 0.5 


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
function gameStart() {
  thisLoop = performance.now();
  window.requestAnimationFrame(gameLoop)
}
gameStart();

