// Cache images once (prevents flicker)
const cityGroundImg = new Image();
cityGroundImg.src = "./assets/world/city/ground.png";

function renderWorld(playerWorld) {
  switch (playerWorld) {
    case "city-1":
      renderCity1();
      break;
    default:
      renderArena();
  }
}

function renderCity1() {
  if (!cityGroundImg.complete) {
    context.fillStyle = "#1b1b1b";
    context.fillRect(0, 0, 800, 600);
    return;
  }

  for (let y = 0; y <= 600; y += 32) {
    for (let x = 0; x <= 800; x += 32) {
      context.drawImage(cityGroundImg, 928, 544, 64, 64, x, y, 32, 32);
    }
  }
}

function renderArena() {
  context.fillStyle = "#1b1b1b";
  context.fillRect(0, 0, 800, 600);

  context.beginPath();
  context.lineWidth = 4;
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.arc(400, 300, 260, 0, Math.PI * 2);
  context.stroke();
}
