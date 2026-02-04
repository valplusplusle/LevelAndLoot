class Player {
  state = 'idle';
  lastState = 'idle';

  inFight = false;
  lastAttack = Date.now();

  world = "city-1";
  direction = 'right'
  name = 'unknown-player'

  health = 100;
  maxHealth = 100;
  dead = false;

  playerClass = 'knight'
  role = 'tank'

  x = 400;
  y = 250;

  sprite = new Image();
  frame = 0;

  id = '';

  constructor() {
    this.height = 48;
    this.width = 48;
    this.x_velocity = 0;
    this.y_velocity = 0;
    this.state = 'idle';
    this.sprite.src = '';
    this.id = uuidv4();
  }

  changeState(newState) { this.state = newState; }

  castSkill(slot) {
    if (this.dead) return;

    // local animation + bar
    if ((Date.now() - this.lastAttack) < 250) {
      // Skill failed (cooldown): shake button
      const btn = document.getElementById('skill'+slot);
      if (btn) {
        btn.classList.add('skill-fail');
        setTimeout(()=>btn.classList.remove('skill-fail'), 180);
      }
      return;
    }
    this.lastAttack = Date.now();
    this.changeState('attack1');

    webSocket.send(JSON.stringify({ event: "skillCast", slot }));
  }

  renderPlayer() {
    // name render
    context.font = "10px Arial";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.fillText('<'+this.name+'>', this.x+25, this.y);

    // minimalist health bar (just below name, thin, only red, no text)
    try {
      const hpPct = Math.max(0, Math.min(1, (this.health || 0) / (this.maxHealth || 100)));
      const barW = 28;
      const barH = 2;
      const bx = this.x + 11;
      const by = this.y + 4; // 4px below name

      // background (very subtle, almost invisible)
      context.fillStyle = "rgba(0,0,0,0.25)";
      context.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

      // health fill (solid red)
      const healthW = Math.max(0, Math.floor(barW * hpPct));
      context.fillStyle = "#d90000";
      context.fillRect(bx, by, healthW, barH);
      // no border, no text
    } catch (e) {
      // ignore rendering errors
    }

    // shadow
    context.fillStyle = "#000000";
    context.beginPath();
    context.ellipse(this.x+24.5, this.y+44, 13, 3, 0, 0, Math.PI*2, false);
    context.fill();

    // Init animation timer on state change
    if (this.lastState != this.state) { this.frame = 0; this.lastState = this.state };
    if (this.frame == 0) { this.frame = Date.now(); };
    const timeNow = Date.now();
    const timeDifference = timeNow - this.frame;

    // cooldown bar (local)
    if(player.id == this.id) {
      var cooldownNow = (Date.now() - this.lastAttack)
      if (cooldownNow < 1000) {
        cooldownNow = cooldownNow/10;
        document.getElementById('actionBar').style.width = cooldownNow + '%'
      } else {
        document.getElementById('actionBar').style.width = '100%';
      }
    }

    // choose sprite sheet based on class+direction
    if(this.playerClass === 'warrior') {
      this.sprite.src = (this.direction === 'right')
        ? "./assets/warrior/warrior_sprite_right.png"
        : "./assets/warrior/warrior_sprite_left.png";
    }
    if(this.playerClass === 'mage') {
      this.sprite.src = (this.direction === 'right')
        ? "./assets/mage/mage_sprite_right.png"
        : "./assets/mage/mage_sprite_left.png";
    }
    if(this.playerClass === 'knight') {
      this.sprite.src = (this.direction === 'right')
        ? "./assets/knight/knight_sprite_right.png"
        : "./assets/knight/knight_sprite_left.png";
    }
    if(this.playerClass === 'archer') {
      this.sprite.src = (this.direction === 'right')
        ? "./assets/archer/archer_sprite_right.png"
        : "./assets/archer/archer_sprite_left.png";
    }

    // dead overlay
    if (this.dead) {
      context.fillStyle = "rgba(0,0,0,0.35)";
      context.fillRect(this.x, this.y, 50, 48);
    }

    // idle animation
    if (this.state === 'idle') {
      if(this.direction === 'right') {
        if (timeDifference <= 200) context.drawImage(this.sprite, 0, 0, 50, 48, this.x, this.y, 50, 48);
        else context.drawImage(this.sprite, 50, 0, 50, 48, this.x, this.y, 50, 48);
        if (timeDifference >= 600) this.frame = Date.now();
      }
      if(this.direction === 'left') {
        if (timeDifference <= 200) context.drawImage(this.sprite, 500, 0, 50, 48, this.x, this.y, 50, 48);
        else context.drawImage(this.sprite, 550, 0, 50, 48, this.x, this.y, 50, 48);
        if (timeDifference >= 600) this.frame = Date.now();
      }
    }

    // run animation
    if (this.state === 'run') {
      if(this.direction === 'right') {
        if (timeDifference <= 100) context.drawImage(this.sprite, 0, 144, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 200) context.drawImage(this.sprite, 50, 144, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 300) context.drawImage(this.sprite, 100, 144, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 400) context.drawImage(this.sprite, 150, 144, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 500) context.drawImage(this.sprite, 200, 144, 50, 48, this.x, this.y, 50, 48);
        else context.drawImage(this.sprite, 250, 144, 50, 48, this.x, this.y, 50, 48);
      }
      if(this.direction === 'left') {
        if (timeDifference <= 100) context.drawImage(this.sprite, 300, 144, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 200) context.drawImage(this.sprite, 350, 144, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 300) context.drawImage(this.sprite, 400, 144, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 400) context.drawImage(this.sprite, 450, 144, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 500) context.drawImage(this.sprite, 500, 144, 50, 48, this.x, this.y, 50, 48);
        else context.drawImage(this.sprite, 550, 144, 50, 48, this.x, this.y, 50, 48);
      }
      if (timeDifference >= 500) this.frame = Date.now();
    }

    // attack1 animation (used for any cast)
    if (this.state === 'attack1') {
      if(this.direction === 'right') {
        if (timeDifference <= 100) context.drawImage(this.sprite, 15, 354, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 200) context.drawImage(this.sprite, 115, 354, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 300) context.drawImage(this.sprite, 215, 354, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 400) context.drawImage(this.sprite, 315, 354, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 500) context.drawImage(this.sprite, 415, 354, 50, 48, this.x, this.y, 50, 48);
        else context.drawImage(this.sprite, 515, 354, 50, 48, this.x, this.y, 50, 48);
        if (timeDifference >= 600) { this.frame = Date.now(); this.changeState('idle');}
      }
      if(this.direction === 'left') {
        if (timeDifference <= 100) context.drawImage(this.sprite, 530, 354, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 200) context.drawImage(this.sprite, 430, 354, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 300) context.drawImage(this.sprite, 330, 354, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 400) context.drawImage(this.sprite, 230, 354, 50, 48, this.x, this.y, 50, 48);
        else if (timeDifference <= 500) context.drawImage(this.sprite, 130, 354, 50, 48, this.x, this.y, 50, 48);
        else context.drawImage(this.sprite, 30, 354, 50, 48, this.x, this.y, 50, 48);
        if (timeDifference >= 600) { this.frame = Date.now(); this.changeState('idle');}
      }
    }
  }
}
