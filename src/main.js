var KeyBoardCommands;
(function (KeyBoardCommands) {
    KeyBoardCommands["UP"] = "ArrowUp";
    KeyBoardCommands["DOWN"] = "ArrowDown";
    KeyBoardCommands["LEFT"] = "ArrowLeft";
    KeyBoardCommands["RIGHT"] = "ArrowRight";
    KeyBoardCommands["FIRE"] = " ";
    KeyBoardCommands["RELOAD"] = "r";
    KeyBoardCommands["DEBUG"] = "d";
})(KeyBoardCommands || (KeyBoardCommands = {}));
var EnemyType;
(function (EnemyType) {
    EnemyType[EnemyType["NORMAL"] = 0] = "NORMAL";
    EnemyType[EnemyType["LUCKY"] = 1] = "LUCKY";
})(EnemyType || (EnemyType = {}));
//load事件時，渲染出遊戲場景
window.addEventListener('load', function () {
    //canvas setup 
    const canvas = this.document.getElementById('canvas1');
    const ctx = canvas.getContext('2d'); //Drawing Context(built in object that allow us to deal with canvas)
    canvas.width = 1500;
    canvas.height = 500;
    class InputHandler {
        constructor(game) {
            this.game = game;
            window.addEventListener('keydown', (e) => {
                if (this.game.keyBoardCommands.indexOf(e.key) !== -1)
                    return; //避免長按時，一直增加
                switch (e.key) {
                    case KeyBoardCommands.UP:
                    case KeyBoardCommands.DOWN:
                    case KeyBoardCommands.LEFT:
                    case KeyBoardCommands.RIGHT:
                        this.game.keyBoardCommands.push(e.key);
                        break;
                    case KeyBoardCommands.FIRE: //接收到空白鍵時，叫玩家發射
                        this.game.getPlayer.fire();
                        break;
                    case KeyBoardCommands.RELOAD:
                        this.game.getPlayer.reloadAmmo();
                        break;
                    case KeyBoardCommands.DEBUG:
                        this.game.getDebug = !this.game.getDebug;
                        break;
                }
            });
            window.addEventListener('keyup', (e) => {
                switch (e.key) {
                    case KeyBoardCommands.UP:
                    case KeyBoardCommands.DOWN:
                    case KeyBoardCommands.LEFT:
                    case KeyBoardCommands.RIGHT:
                        this.game.keyBoardCommands.splice(this.game.keyBoardCommands.indexOf(e.key), 1);
                }
            });
        }
    }
    class Particle {
    }
    class GameObj {
        constructor(game) {
            this.game = game;
            //初始化傳入一個Game物件，以和main game產生連結，取得資訊、變更屬性
            this.size = { width: 120, height: 150 };
            this.location = { x: 0, y: 0 };
            this.speed = { x: 5, y: 5 };
            this.rect = {
                left: this.location.x,
                right: this.location.x + this.size.width,
                top: this.location.y,
                bottom: this.location.y + this.size.height
            };
            this.imgXFrame = 0; //要畫playerImg的第幾張小圖之左上x
            this.imgYFrame = 0; //要畫playerImg的第幾張小圖之左上y
            this.imgMaxFrame = 39; //playerImg 一行 有多少張小圖
            this.deleted = false;
        }
        get HP() {
            return this.hp;
        }
        get ATK() {
            return this.atk;
        }
        get objRect() {
            return this.rect;
        }
        get disappear() {
            return this.deleted;
        }
        set disappear(value) {
            this.deleted = value;
        }
        checkCollisionWith(targect) {
            return (this.rect.left < targect.right &&
                this.rect.right > targect.left &&
                this.rect.top < targect.bottom &&
                this.rect.bottom > targect.top);
        }
        tweakHp(payload) {
            this.hp += payload;
        }
    }
    class Projectile extends GameObj {
        constructor(game, location) {
            super(game);
            this.hp = 1;
            this.atk = -1;
            this.size = { width: 10, height: 10 };
            this.location = location;
            this.img = document.getElementById('projectile');
        }
        update() {
            this.location.x += this.speed.x;
            this.rect = {
                left: this.location.x,
                right: this.location.x + this.size.width,
                top: this.location.y,
                bottom: this.location.y + this.size.height
            };
            if (this.location.x > this.game.gameSize.width * 0.8 || this.hp <= 0)
                this.deleted = true;
        }
        draw(context) {
            if (!this.deleted) {
                context.save();
                if (this.game.getDebug)
                    context.strokeRect(this.location.x, this.location.y, this.size.width, this.size.height);
                // context.fillStyle = 'transparent'
                context.fillRect(this.location.x, this.location.y, this.size.width, this.size.height);
                context.drawImage(this.img, this.location.x, this.location.y);
                context.restore();
            }
        }
    }
    class Player extends GameObj {
        constructor(game) {
            super(game);
            this.hp = 100;
            this.atk = -1;
            this.ammos = [];
            this.maxAmmo = 20; //最大彈藥數
            this.remainingBullets = 10; //玩家剩餘子彈
            this.autoLoadTimer = 0;
            this.autoLoadAmmos = 1; //自動填充的子彈數量
            this.autoLoadInterval = 5000; //自動填充的間格
            this.score = 0;
            //+成狀態
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 5000;
            this.img = document.getElementById('player');
            this.size = { width: 120, height: 190 };
            this.location = { x: 20, y: 100 };
            this.speed = { x: 5, y: 5 };
        }
        get playerAmmoArr() {
            return this.ammos;
        }
        get getMaxAmmoNum() {
            return this.maxAmmo;
        }
        get playerAmmoNum() {
            return this.remainingBullets;
        }
        get playerScore() {
            return this.score;
        }
        update(deltaTime) {
            //角色動畫
            if (this.imgXFrame < this.imgMaxFrame)
                this.imgXFrame++;
            else
                this.imgXFrame = 0;
            //角色的長方形
            this.rect = {
                left: this.location.x,
                right: this.location.x + this.size.width,
                top: this.location.y,
                bottom: this.location.y + this.size.height
            };
            this.autoReloadAmmo(deltaTime, this.autoLoadAmmos);
            //限制移動範圍
            if (this.location.y <= -this.size.height * 0.5)
                this.location.y = -this.size.height * 0.5;
            else if (this.location.y + this.size.height * 0.5 >= this.game.gameSize.height)
                this.location.y = this.game.gameSize.height - this.size.height * 0.5;
            if (this.game.keyBoardCommands.includes(KeyBoardCommands.DOWN)) {
                this.location.y += this.speed.y;
            }
            if (this.game.keyBoardCommands.includes(KeyBoardCommands.UP)) {
                this.location.y -= this.speed.y;
            }
            if (this.game.keyBoardCommands.includes(KeyBoardCommands.LEFT)) {
                this.location.x -= this.speed.x;
            }
            if (this.game.keyBoardCommands.includes(KeyBoardCommands.RIGHT)) {
                this.location.x += this.speed.x;
            }
            //有子彈的話就要更新
            this.ammos.forEach(ammo => {
                ammo.update();
            });
            //更新子彈陣列(把尚未delete的子彈filter出來，即移除被標示為delete的子彈)
            this.ammos = this.ammos.filter(ammo => !ammo.disappear);
            //加成效果
            if (this.powerUp) {
                if (this.powerUpTimer < this.powerUpLimit)
                    this.powerUpTimer += deltaTime;
                else {
                    this.powerUp = false;
                    this.autoLoadInterval = 5000;
                    this.imgYFrame = 0;
                    this.powerUpTimer = 0;
                }
            }
        }
        draw(context) {
            //1.畫自己
            if (this.game.getDebug)
                context.strokeRect(this.location.x, this.location.y, this.size.width, this.size.height);
            context.fillStyle = 'transparent';
            context.fillRect(this.location.x, this.location.y, this.size.width, this.size.height);
            context.drawImage(this.img, this.imgXFrame * this.size.width, this.imgYFrame * this.size.height, this.size.width, this.size.height, this.location.x, this.location.y, this.size.width, this.size.height);
            //2.畫子彈
            this.ammos.forEach(ammo => {
                ammo.draw(context);
            });
        }
        fire() {
            if (this.remainingBullets === 0)
                return;
            //按一下空白鍵就發射一顆
            this.ammos.push(new Projectile(this.game, { x: this.rect.right - 5, y: this.rect.top + 20 }));
            this.remainingBullets--;
            //如果有+成效果會在尾巴同時發射
            if (this.powerUp)
                this.fireFromTail();
        }
        fireFromTail() {
            this.ammos.push(new Projectile(this.game, { x: this.rect.right - 5, y: this.rect.bottom }));
        }
        reloadAmmo() {
            this.remainingBullets += (20 - this.remainingBullets);
        }
        autoReloadAmmo(deltaTime, autoLoadAmmos) {
            if (this.remainingBullets >= this.maxAmmo)
                return;
            if (this.autoLoadTimer > this.autoLoadInterval) {
                this.remainingBullets += autoLoadAmmos; //增加子彈
                this.autoLoadTimer = 0;
            }
            this.autoLoadTimer += deltaTime;
        }
        addScore(point) {
            this.score += point;
        }
        enterPowerUp() {
            this.powerUp = true;
            this.powerUpTimer = 0;
            this.autoLoadInterval = 1000;
            this.imgYFrame = 1;
        }
    }
    class Enemy extends GameObj {
        constructor(game) {
            super(game);
        }
        get gainScore() {
            return this.killScroe;
        }
        update(deltaTime) {
            this.location.x -= this.speed.x;
            this.rect = {
                left: this.location.x,
                right: this.location.x + this.size.width,
                top: this.location.y,
                bottom: this.location.y + this.size.height
            };
            if (this.location.x < 0 || this.hp <= 0)
                this.deleted = true;
            //角色動畫
            if (this.imgXFrame < this.imgMaxFrame)
                this.imgXFrame++;
            else
                this.imgXFrame = 0;
        }
        draw(context) {
            if (!this.deleted) {
                context.save();
                if (this.game.getDebug)
                    context.strokeRect(this.location.x, this.location.y, this.size.width, this.size.height);
                //畫自己
                context.fillStyle = 'transparent';
                context.fillRect(this.location.x, this.location.y, this.size.width, this.size.height);
                context.drawImage(this.img, this.imgXFrame * this.size.width, this.imgYFrame * this.size.height, this.size.width, this.size.height, this.location.x, this.location.y, this.size.width, this.size.height);
                //顯示分數
                context.restore();
                context.fillStyle = 'black';
                context.font = 'bold 16px serif';
                context.fillText(this.hp.toString(), this.location.x, this.location.y);
                context.restore();
            }
        }
    }
    class Angular extends Enemy {
        constructor(game) {
            super(game);
            this.killScroe = 5;
            this.hp = 5;
            this.atk = -10;
            this.type = EnemyType.NORMAL;
            this.size = { width: 228, height: 169 };
            this.speed = { x: 1.3, y: 5 };
            this.location = { x: this.game.gameSize.width * 0.8, y: Math.random() * (this.game.gameSize.height - this.size.height) };
            this.img = document.getElementById('angler');
            this.imgXFrame = 0;
            this.imgYFrame = Math.floor(Math.random() * 3);
        }
    }
    class Angular2 extends Enemy {
        constructor(game) {
            super(game);
            this.killScroe = 5;
            this.hp = 5;
            this.atk = -5;
            this.type = EnemyType.NORMAL;
            this.size = { width: 213, height: 165 };
            this.speed = { x: 1.5, y: 5 };
            this.location = { x: this.game.gameSize.width * 0.8, y: Math.random() * (this.game.gameSize.height - this.size.height) };
            this.img = document.getElementById('angler2');
            this.imgXFrame = 0;
            this.imgYFrame = Math.floor(Math.random() * 2);
        }
    }
    class LuckyFish extends Enemy {
        constructor(game) {
            super(game);
            this.killScroe = 5;
            this.hp = 5;
            this.atk = -5;
            this.type = EnemyType.LUCKY;
            this.size = { width: 99, height: 95 };
            this.speed = { x: 2.2, y: 5 };
            this.location = { x: this.game.gameSize.width * 0.8, y: Math.random() * (this.game.gameSize.height - this.size.height) };
            this.img = document.getElementById('lucky');
            this.imgXFrame = 0;
            this.imgYFrame = Math.floor(Math.random() * 2);
        }
    }
    class Layer {
        constructor(game, image, speedModifier = { x: 1, y: 1 }) {
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.size = { width: 1768, height: 500 };
            this.location = { x: 0, y: 0 };
        }
        update() {
            //重置圖片，造成無限迴圈
            if (this.location.x <= -this.size.width)
                this.location.x = 0;
            this.location.x -= this.speedModifier.x * this.game.baseSpeed.x;
        }
        draw(context) {
            context.drawImage(this.image, this.location.x, this.location.y);
            //為了圖片不間斷的第二張圖
            context.drawImage(this.image, this.location.x + this.size.width, this.location.y);
        }
    }
    class Background {
        constructor(game) {
            this.game = game;
            let layerImg1 = document.getElementById('layer1');
            let layerImg2 = document.getElementById('layer2');
            let layerImg3 = document.getElementById('layer3');
            let layerImg4 = document.getElementById('layer4');
            this.layer1 = new Layer(this.game, layerImg1, { x: 1, y: 0 });
            this.layer2 = new Layer(this.game, layerImg2, { x: 1, y: 0 });
            this.layer3 = new Layer(this.game, layerImg3, { x: 1, y: 0 });
            this.layer4 = new Layer(this.game, layerImg4, { x: 1, y: 0 });
            this.layers = [this.layer1, this.layer2, this.layer3];
        }
        get getLayer4() {
            return this.layer4;
        }
        update() {
            if (this.game.isGameEnd)
                return;
            this.layers.forEach(layer => layer.update());
        }
        draw(context) {
            this.layers.forEach(layer => layer.draw(context));
        }
    }
    class UI {
        constructor(game) {
            this.game = game;
        }
        draw(context) {
            context.save();
            //顯示玩家得分
            context.fillStyle = 'yellow';
            context.font = 'bold 20px serif';
            context.shadowColor = 'black';
            context.shadowBlur = 10;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.fillText(`Score:${this.game.getPlayer.playerScore}`, 20, 60);
            //畫子彈最大數量
            for (let i = 0; i < this.game.getPlayer.getMaxAmmoNum; i++) {
                context.fillStyle = 'gray';
                context.fillRect(20 + i * 6, 20, 5, 20);
            }
            //畫剩餘子彈
            for (let i = 0; i < this.game.getPlayer.playerAmmoNum; i++) {
                context.fillStyle = 'red';
                context.fillRect(20 + i * 6, 20, 5, 20);
            }
            //計時器
            context.fillText(`Timer:${this.game.gameTimeCount.toFixed(2)}`, 20, 100);
            //輸贏顯示
            if (this.game.isGameEnd) {
                let msg1;
                let msg2;
                context.textAlign = 'center';
                if (this.game.getPlayer.playerScore > this.game.getWiningScore) {
                    msg1 = 'You Win';
                    msg2 = 'Will Done!';
                }
                else {
                    msg1 = 'You loss';
                    msg2 = 'Try Again';
                    context.fillStyle = 'grey';
                }
                context.font = 'bold 70px Bebas Neue';
                context.fillText(msg1, this.game.gameSize.width * 0.5, this.game.gameSize.height * 0.5);
                context.font = 'bold 25px Bebas Neue';
                context.fillText(msg2, this.game.gameSize.width * 0.5, this.game.gameSize.height * 0.6);
            }
            context.restore();
        }
    }
    class Game {
        constructor(size) {
            this.size = size;
            this.bg = new Background(this);
            this.ui = new UI(this);
            this.player = new Player(this);
            this.inputHandler = new InputHandler(this);
            this.commandKeys = [];
            this.enemys = [];
            this.angularBornTimer = 0;
            this.angularBornInterval = 1000;
            this.gameTimer = 0;
            this.gameTimeLimit = 100000;
            this.winScore = 20;
            this.gameEnd = false;
            this.gameSpeed = { x: 1, y: 1 };
            this.debug = true;
        }
        get getPlayer() {
            return this.player;
        }
        get keyBoardCommands() {
            return this.commandKeys;
        }
        get gameSize() {
            return this.size;
        }
        get gameTimeCount() {
            return this.gameTimer;
        }
        get getWiningScore() {
            return this.winScore;
        }
        get isGameEnd() {
            return this.gameEnd;
        }
        get baseSpeed() {
            return this.gameSpeed;
        }
        get getDebug() {
            return this.debug;
        }
        set getDebug(valur) {
            this.debug = valur;
        }
        update(deltaTime) {
            //bg (layer4為了要畫在最前面，所以獨立出來)
            this.bg.update();
            this.bg.getLayer4.update();
            //遊戲結束判斷
            if (this.player.playerScore > this.winScore ||
                this.gameTimer > this.gameTimeLimit)
                this.gameEnd = true;
            //計時
            if (this.gameEnd)
                return;
            this.gameTimer += deltaTime;
            this.player.update(deltaTime);
            this.enemys.forEach(enemy => {
                enemy.update(deltaTime);
                if (this.player.checkCollisionWith(enemy.objRect)) {
                    this.player.addScore(-1);
                }
                //檢測碰撞
                if (enemy.checkCollisionWith(this.player.objRect)) {
                    enemy.tweakHp(this.player.ATK);
                    //+乘效果
                    if (enemy.type === EnemyType.LUCKY) {
                        this.player.enterPowerUp();
                        enemy.disappear = true;
                        return;
                    }
                }
                //子彈也要碰撞檢測
                this.player.playerAmmoArr.forEach(ammo => {
                    if (ammo.checkCollisionWith(enemy.objRect)) {
                        ammo.disappear = true;
                        enemy.tweakHp(ammo.ATK);
                        if (enemy.HP <= 0) {
                            //玩家加分數
                            this.player.addScore(enemy.gainScore);
                            //+乘效果
                            if (enemy.type === EnemyType.LUCKY)
                                this.player.enterPowerUp();
                        }
                    }
                });
            });
            this.enemys = this.enemys.filter(enemy => !enemy.disappear);
            this.autoGenrateAngular(deltaTime);
        }
        draw(context) {
            this.bg.draw(context);
            this.player.draw(context);
            this.enemys.forEach(angular => angular.draw(context));
            this.ui.draw(context);
            //讓layer4畫在最上面
            this.bg.getLayer4.draw(context);
        }
        autoGenrateAngular(deltaTime) {
            let random = Math.random();
            if (this.player.playerScore >= this.winScore)
                return;
            if (this.angularBornTimer > this.angularBornInterval) {
                if (random < 0.8)
                    this.enemys.push(new Angular(this));
                else if (random < 0.5)
                    this.enemys.push(new Angular2(this));
                else
                    this.enemys.push(new LuckyFish(this));
                this.angularBornTimer = 0;
            }
            this.angularBornTimer += deltaTime;
        }
    }
    const mainGame = new Game({ width: canvas.width, height: canvas.height });
    let lastTime = 0; //儲存上一偵的timeSteamp
    animate(0);
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime; //時間增量 : 當偵和上一偵的時間差 ； 電腦越舊數值越高 (render animation 時間越多)
        lastTime = timeStamp; //更新lastTime
        ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, canvas.width, canvas.height);
        mainGame.update(deltaTime); //將時間差傳給update做使用
        mainGame.draw(ctx);
        requestAnimationFrame(animate);
    }
});
