function renderWorld(playerWorld) {
    switch (playerWorld) {
        case "city-1":
          renderCity1();
          break;
        default:
          console.log("No World Found");
    }
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