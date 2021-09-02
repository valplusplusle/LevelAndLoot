class Player {
    state = 'idle';
    lastState = 'idle';

    direction = 'right'
    name = 'foobarbaz'

    playerClass = 'knight' // classes: knight, warrior, archer, mage
    role = 'tank' // roles: tank, dd, heal

    x = 400;
    y = 550;

    sprite = new Image();
    frame = 0;

    id = '';

    constructor() {
        this.height = 48,
        this.width = 48,
        this.x_velocity = 0,
        this.y_velocity = 0,
        this.state = 'idle',
        this.sprite.src = ''
        this.id = uuidv4();
    }

    changeState(newState) {
        this.state = newState;
    }

    updatePlayerPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    renderPlayer() {
        // name render
        context.font = "10px Arial";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText('<'+this.name+'>', this.x+25, this.y);

        // Init animation timer on state change
        if (this.lastState != this.state) { this.frame = 0; this.lastState = this.state };
        if (this.frame == 0) { this.frame = Date.now(); };
        const timeNow = Date.now();
        const timeDifference = timeNow - this.frame;

        // check direction and player class
        if(this.playerClass === 'warrior') {
            if(this.direction === 'right') {
                this.sprite.src = "./assets/warrior/warrior_sprite_right.png"
            }
            if(this.direction === 'left') { 
                this.sprite.src = "./assets/warrior/warrior_sprite_left.png"
            }
        }

        if(this.playerClass === 'mage') {
            if(this.direction === 'right') {
                this.sprite.src = "./assets/mage/mage_sprite_right.png"
            }
            if(this.direction === 'left') { 
                this.sprite.src = "./assets/mage/mage_sprite_left.png"
            }
        }

        if(this.playerClass === 'knight') {
            if(this.direction === 'right') {
                this.sprite.src = "./assets/knight/knight_sprite_right.png"
            }
            if(this.direction === 'left') { 
                this.sprite.src = "./assets/knight/knight_sprite_left.png"
            }
        }

        if(this.playerClass === 'archer') {
            if(this.direction === 'right') {
                this.sprite.src = "./assets/archer/archer_sprite_right.png"
            }
            if(this.direction === 'left') { 
                this.sprite.src = "./assets/archer/archer_sprite_left.png"
            }
        }

        // idle animaiton
        if (this.state === 'idle') {
            if(this.direction === 'right') {
                if (timeDifference <= 200) {
                    context.drawImage(this.sprite, 0, 0, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 200) {
                    context.drawImage(this.sprite, 50, 0, 50, 48, this.x, this.y, 50, 48);
                }
                if (timeDifference >= 600) { this.frame = Date.now(); }
            }
            if(this.direction === 'left') {
                if (timeDifference <= 200) {
                    context.drawImage(this.sprite, 500, 0, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 200) {
                    context.drawImage(this.sprite, 550, 0, 50, 48, this.x, this.y, 50, 48);
                }
                if (timeDifference >= 600) { this.frame = Date.now(); }
            }
        }

        // run animation
        if (this.state === 'run') {
            if(this.direction === 'right') {
                if (timeDifference <= 100) {
                    context.drawImage(this.sprite, 0, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 100 && timeDifference <= 200) {
                    context.drawImage(this.sprite, 50, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 200 && timeDifference <= 300) {
                    context.drawImage(this.sprite, 100, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 300 && timeDifference <= 400) {
                    context.drawImage(this.sprite, 150, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 400 && timeDifference <= 500) {
                    context.drawImage(this.sprite, 200, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 500 && timeDifference < 600) {
                    context.drawImage(this.sprite, 250, 144, 50, 48, this.x, this.y, 50, 48);
                }
            }
            if(this.direction === 'left') {
                if (timeDifference <= 100) {
                    context.drawImage(this.sprite, 300, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 100 && timeDifference <= 200) {
                    context.drawImage(this.sprite, 350, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 200 && timeDifference <= 300) {
                    context.drawImage(this.sprite, 400, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 300 && timeDifference <= 400) {
                    context.drawImage(this.sprite, 450, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 400 && timeDifference <= 500) {
                    context.drawImage(this.sprite, 500, 144, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 500 && timeDifference < 600) {
                    context.drawImage(this.sprite, 550, 144, 50, 48, this.x, this.y, 50, 48);
                }
            }
            if (timeDifference >= 500) { this.frame = Date.now(); }
        }
    }
}