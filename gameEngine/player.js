class Player {
    state = 'idle';
    lastState = 'idle';
    x = 400;
    y = 550;
  
    sprite = new Image();
    frame = 0;
    
    constructor() {
      this.height = 48,
      this.width = 48,
      this.x_velocity = 0,
      this.y_velocity = 0,
      this.state = 'idle',

      this.sprite.src = "./assets/dd/dd_sprite_right.png"
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
        } else if (timeDifference > 500 && timeDifference < 600){
            context.drawImage(this.sprite, 250, 144, 50, 48, this.x, this.y, 50,48);
        }
        if (timeNow-this.frame >= 500) {this.frame = Date.now();}
      }
      
    }
  }