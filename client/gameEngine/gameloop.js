
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
  keyListener: function (event) {
    var key_state = event.type == 'keydown' ? true : false
    if (key_state == false && player.state != 'attack1') { player.state = 'idle' }
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
    if (player.state != 'attack1') {
      player.state = 'run';
    }
  }
  if (controller.down) {
    player.y_velocity += 200 * delta
    if (player.state != 'attack1') {
      player.state = 'run';
    }
  }
  if (controller.left) {
    player.x_velocity -= 200 * delta
    if (player.state != 'attack1') {
      player.state = 'run';
    }
    player.direction = 'left';
  }
  if (controller.right) {
    player.x_velocity += 200 * delta
    if (player.state != 'attack1') {
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
  // Clear frame (wichtig!)
  context.fillStyle = '#202020';
  context.fillRect(0, 0, 800, 600);

  renderWorld(player.world);

  if (currentRaidState && player.world === currentRaidState.id) {
    renderRaidBoss(currentRaidState);
  }

  otherPlayers.forEach(otherPlayer => {
    if (otherPlayer.world == player.world) otherPlayer.renderPlayer();
  });

  player.renderPlayer();
  renderUI();
}

var bossSprite = new Image();
bossSprite.src = "./assets/knight/knight_sprite_right.png";

function renderRaidBoss(raid) {
  if (!raid || !raid.boss) return;

  const bx = raid.boss.x;
  const by = raid.boss.y;

  // Boss (big rectangle)
  context.fillStyle = "#8b1e1e";
  context.fillRect(bx - 30, by - 30, 60, 60);

  // Boss outline
  context.lineWidth = 3;
  context.strokeStyle = "rgba(0,0,0,0.6)";
  context.strokeRect(bx - 30, by - 30, 60, 60);

  // Boss name
  context.font = "12px Arial";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText("BOSS", bx, by - 40);

  // HP bar (top center)
  const barW = 320;
  const barH = 14;
  const x = 400 - barW / 2;
  const y = 18;

  // background
  context.fillStyle = "rgba(0,0,0,0.7)";
  context.fillRect(x, y, barW, barH);

  // fill
  const pct = raid.boss.health / raid.boss.maxHealth;
  context.fillStyle = "#ff2b2b";
  context.fillRect(x + 2, y + 2, Math.floor((barW - 4) * pct), barH - 4);

  // text
  context.font = "12px Arial";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(`${raid.boss.health} / ${raid.boss.maxHealth}`, 400, y + 12);

  // Telegraphs (falls du sie schon vom Server bekommst)
  (raid.telegraphs || []).forEach(tg => {
    if (tg.type === "circle") {
      context.beginPath();
      context.lineWidth = 4;
      context.strokeStyle = "rgba(255,0,0,0.7)";
      context.arc(tg.x, tg.y, tg.radius, 0, Math.PI * 2);
      context.stroke();
    }

    if (tg.type === "beam") {
      const ex = tg.x + tg.nx * tg.length;
      const ey = tg.y + tg.ny * tg.length;

      context.lineWidth = tg.width * 2;
      context.strokeStyle = "rgba(255,0,0,0.35)";
      context.beginPath();
      context.moveTo(tg.x, tg.y);
      context.lineTo(ex, ey);
      context.stroke();
    }
  });
}

// key Event listener
window.addEventListener('keydown', controller.keyListener)
window.addEventListener('keyup', controller.keyListener)

document.addEventListener('keydown', function (e) {
  if (e.code == 'Digit1') document.getElementById("skill1").click();
  if (e.code == 'Digit2') document.getElementById("skill2").click();
}, false);

// start game loop
window.requestAnimationFrame(gameLoop)

