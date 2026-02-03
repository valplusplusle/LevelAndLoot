class Player {
    state = 'idle';
    lastState = 'idle';

    inFight = false;
    lastAttack = Date.now();
    attackObjects = [];
    healObjects = [];
    blockObjects = [];

    world = "city-1" //Maps where the player could be

    direction = 'right'
    name = 'unknown-player'

    health = 100;

    playerClass = 'knight' // classes: knight, warrior, archer, mage
    role = 'tank' // roles: tank, dd, heal

    x = 400;
    y = 250;

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
        context.fillText('<' + this.name + '>', this.x + 25, this.y);

        // shadow
        context.fillStyle = "#000000";
        context.beginPath();
        context.ellipse(this.x + 24.5, this.y + 44, 13, 3, 0, 0, Math.PI * 2, false);
        context.fill();

        // Init animation timer on state change
        if (this.lastState != this.state) { this.frame = 0; this.lastState = this.state };
        if (this.frame == 0) { this.frame = Date.now(); };
        const timeNow = Date.now();
        const timeDifference = timeNow - this.frame;

        // cooldown
        if (player.id == this.id) {
            var cooldownNow = (Date.now() - this.lastAttack)
            if (cooldownNow < 2000) {
                cooldownNow = cooldownNow / 20;
                document.getElementById('actionBar').style.width = cooldownNow + '%'
            }
        }

        // check direction and player class
        if (this.playerClass === 'warrior') {
            if (this.direction === 'right') {
                this.sprite.src = "./assets/warrior/warrior_sprite_right.png"
            }
            if (this.direction === 'left') {
                this.sprite.src = "./assets/warrior/warrior_sprite_left.png"
            }
        }

        if (this.playerClass === 'mage') {
            if (this.direction === 'right') {
                this.sprite.src = "./assets/mage/mage_sprite_right.png"
            }
            if (this.direction === 'left') {
                this.sprite.src = "./assets/mage/mage_sprite_left.png"
            }
        }

        if (this.playerClass === 'knight') {
            if (this.direction === 'right') {
                this.sprite.src = "./assets/knight/knight_sprite_right.png"
            }
            if (this.direction === 'left') {
                this.sprite.src = "./assets/knight/knight_sprite_left.png"
            }
        }

        if (this.playerClass === 'archer') {
            if (this.direction === 'right') {
                this.sprite.src = "./assets/archer/archer_sprite_right.png"
            }
            if (this.direction === 'left') {
                this.sprite.src = "./assets/archer/archer_sprite_left.png"
            }
        }

        // idle animaiton
        if (this.state === 'idle') {
            if (this.direction === 'right') {
                if (timeDifference <= 200) {
                    context.drawImage(this.sprite, 0, 0, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 200) {
                    context.drawImage(this.sprite, 50, 0, 50, 48, this.x, this.y, 50, 48);
                }
                if (timeDifference >= 600) { this.frame = Date.now(); }
            }
            if (this.direction === 'left') {
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
            if (this.direction === 'right') {
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
            if (this.direction === 'left') {
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

        // attack 1
        if (this.state === 'attack1') {
            if (this.direction === 'right') {
                if (timeDifference <= 100) {
                    context.drawImage(this.sprite, 15, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 100 && timeDifference <= 200) {
                    context.drawImage(this.sprite, 115, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 200 && timeDifference <= 300) {
                    context.drawImage(this.sprite, 215, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 300 && timeDifference <= 400) {
                    context.drawImage(this.sprite, 315, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 400 && timeDifference <= 500) {
                    context.drawImage(this.sprite, 415, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 500 && timeDifference <= 600) {
                    context.drawImage(this.sprite, 515, 354, 50, 48, this.x, this.y, 50, 48);
                }
                if (timeDifference >= 600) { this.frame = Date.now(); this.changeState('idle'); }
            }
            if (this.direction === 'left') {
                if (timeDifference <= 100) {
                    context.drawImage(this.sprite, 530, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 100 && timeDifference <= 200) {
                    context.drawImage(this.sprite, 430, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 200 && timeDifference <= 300) {
                    context.drawImage(this.sprite, 330, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 300 && timeDifference <= 400) {
                    context.drawImage(this.sprite, 230, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 400 && timeDifference <= 500) {
                    context.drawImage(this.sprite, 130, 354, 50, 48, this.x, this.y, 50, 48);
                } else if (timeDifference > 500 && timeDifference <= 600) {
                    context.drawImage(this.sprite, 30, 354, 50, 48, this.x, this.y, 50, 48);
                }
                if (timeDifference >= 600) { this.frame = Date.now(); this.changeState('idle'); }
            }
        }

        // damage field indicator for development
        if (this.attackObjects.length > 0) {
            this.attackObjects.forEach((attack, index) => {
                if ((Date.now() - attack.attackTimestamp) <= attack.attackDuration) {
                    context.beginPath();
                    context.lineWidth = "6";
                    context.strokeStyle = "red";
                    context.rect(attack.damagePlayerX - 25, attack.damagePlayerY - 25, attack.damageFieldSize, attack.damageFieldSize);
                    context.stroke();
                } else {
                    this.attackObjects.splice(index, 1);
                }
            });
        }
    }

    attackSkill1() {
        if (this.playerClass == 'knight') {
            if ((Date.now() - this.lastAttack) >= 2000) {
                this.lastAttack = Date.now();
                this.changeState('attack1');
                var attackObject = {
                    attackName: 'knight1',
                    attackTimestamp: this.lastAttack,
                    attackDuration: 1000,
                    damagePlayerX: player.x,
                    damagePlayerY: player.y,
                    damageFieldSize: 100,
                    damage: 10
                }
                this.attackObjects.push(attackObject);
                webSocket.send(JSON.stringify({ event: "skillCast", skill: "skill1" }));
            }
        }
        if (this.playerClass == 'archer') {
            if ((Date.now() - this.lastAttack) >= 2000) {
                this.lastAttack = Date.now();
                this.changeState('attack1');
                var attackObject = {
                    attackName: 'knight1',
                    attackTimestamp: this.lastAttack,
                    attackDuration: 1000,
                    damagePlayerX: player.x,
                    damagePlayerY: player.y,
                    damageFieldSize: 100,
                    damage: 10
                }
                this.attackObjects.push(attackObject);
                webSocket.send(JSON.stringify({ event: "skillCast", skill: "skill1" }));
            }
        }
        if (this.playerClass == 'mage') {
            if ((Date.now() - this.lastAttack) >= 2000) {
                this.lastAttack = Date.now();
                this.changeState('attack1');
                var attackObject = {
                    attackName: 'mage1',
                    attackTimestamp: this.lastAttack,
                    attackDuration: 1000,
                    damagePlayerX: player.x,
                    damagePlayerY: player.y,
                    damageFieldSize: 100,
                    damage: 10
                }
                this.attackObjects.push(attackObject);
                webSocket.send(JSON.stringify({ event: "skillCast", skill: "skill1" }));
            }
        }

    }

    attackSkill2() {
        // healer utility
        if ((Date.now() - this.lastAttack) >= 2000) {
            this.lastAttack = Date.now();
            this.changeState('attack1');
            webSocket.send(JSON.stringify({ event: "skillCast", skill: "skill2" }));
        }

    }
}