function renderWorld(playerWorld) {
  switch (playerWorld) {
    case "city-1":
      renderCity1();
      break;
    default:
      renderArena(); // NEW
  }
}

function renderArena() {
  // simple tile-less background
  context.fillStyle = "#1b1b1b";
  context.fillRect(0, 0, 800, 600);

  // arena circle hint
  context.beginPath();
  context.lineWidth = "4";
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.arc(400, 300, 260, 0, Math.PI * 2);
  context.stroke();
}

function renderCity1() {
    var worldSprite1 = new Image();
    worldSprite1.src = "./assets/world/city/ground.png"

    // draw ground
    for (let indexY = 0; indexY <= 600; indexY = indexY + 32) {
        for (let indexX = 0; indexX <= 800; indexX = indexX + 32) {
            context.drawImage(worldSprite1, 928, 544, 64, 64, indexX, indexY, 32, 32);
        }
    }    
}

function renderRaid(raid) {
  // boss body
  context.fillStyle = "#7a1c1c";
  context.beginPath();
  context.arc(raid.boss.x, raid.boss.y, 28, 0, Math.PI * 2);
  context.fill();

  // boss hp bar
  const w = 220, h = 10;
  const x = raid.boss.x - w/2, y = raid.boss.y - 50;
  context.fillStyle = "#000000";
  context.fillRect(x, y, w, h);
  const pct = raid.boss.health / raid.boss.maxHealth;
  context.fillStyle = "#ff0000";
  context.fillRect(x, y, Math.floor(w * pct), h);

  // telegraphs
  (raid.telegraphs || []).forEach(tg => {
    if (tg.type === "circle") {
      context.beginPath();
      context.lineWidth = "4";
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
