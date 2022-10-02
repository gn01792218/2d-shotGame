var KeyBoardCommands;
(function (KeyBoardCommands) {
    KeyBoardCommands["UP"] = "ArrowUp";
    KeyBoardCommands["DOWN"] = "ArrowDown";
    KeyBoardCommands["LEFT"] = "ArrowLeft";
    KeyBoardCommands["RIGHT"] = "ArrowRight";
    KeyBoardCommands["FIRE"] = " ";
    KeyBoardCommands["RELOAD"] = "r";
})(KeyBoardCommands || (KeyBoardCommands = {}));
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
                        console.log(this.game.keyBoardCommands);
                        break;
                    case KeyBoardCommands.FIRE: //接收到空白鍵時，叫玩家發射
                        this.game.getPlayer.fire();
                        break;
                    case KeyBoardCommands.RELOAD:
                        this.game.getPlayer.reloadAmmo();
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
    class Projectile {
        constructor(game, position, size) {
            this.game = game;
            this.position = position;
            this.size = size;
            this.speed = { x: 5, y: 5 };
            this.deleted = false;
        }
        get disappear() {
            return this.deleted;
        }
        updated() {
            this.position.x += this.speed.x;
            if (this.position.x > this.game.gameSize.width * 0.8)
                this.deleted = true;
        }
        draw(context) {
            if (!this.deleted) {
                context.fillStyle = 'yellow';
                context.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
            }
        }
    }
    class Particle {
    }
    class Player {
        constructor(game) {
            this.game = game;
            //初始化傳入一個Game物件，以和main game產生連結，取得資訊、變更屬性
            this.size = { width: 120, height: 150 };
            this.location = { x: 0, y: 0 };
            this.speed = { x: 5, y: 5 };
            this.ammos = [];
            this.maxAmmo = 20; //最大彈藥數
            this.remainingBullets = 10; //玩家剩餘子彈
            this.autoLoadTimer = 0;
            this.autoLoadAmmos = 1; //自動填充的子彈數量
            this.autoLoadInterval = 5000; //自動填充的間格
            this.game = game;
            this.location.x = 20;
            this.location.y = 100;
        }
        get getMaxAmmo() {
            return this.maxAmmo;
        }
        get playerAmmos() {
            return this.remainingBullets;
        }
        update(deltaTime) {
            this.autoReloadAmmo(deltaTime, this.autoLoadAmmos);
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
            if (this.ammos.length < 1)
                return;
            this.ammos.forEach(ammo => {
                ammo.updated();
            });
            //更新子彈陣列(把尚未delete的子彈filter出來，即移除被標示為delete的子彈)
            this.ammos = this.ammos.filter(ammo => !ammo.disappear);
        }
        draw(context) {
            //1.畫自己
            context.fillStyle = '#123456';
            context.fillRect(this.location.x, this.location.y, this.size.width, this.size.height);
            //2.畫子彈
            this.ammos.forEach(ammo => {
                ammo.draw(context);
            });
        }
        fire() {
            if (this.remainingBullets === 0)
                return;
            //按一下空白鍵就發射一顆
            this.ammos.push(new Projectile(this.game, { x: this.location.x, y: this.location.y }, { width: 10, height: 10 }));
            this.remainingBullets--;
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
    }
    class Enemy {
    }
    class Layer {
    }
    class Background {
    }
    class UI {
        constructor(game) {
            this.game = game;
        }
        draw(context) {
            //畫子彈最大數量
            for (let i = 0; i < this.game.getPlayer.getMaxAmmo; i++) {
                context.fillStyle = 'gray';
                context.fillRect(20 + i * 6, 20, 5, 20);
            }
            //畫剩餘子彈
            for (let i = 0; i < this.game.getPlayer.playerAmmos; i++) {
                context.fillStyle = 'red';
                context.fillRect(20 + i * 6, 20, 5, 20);
            }
        }
    }
    class Game {
        constructor(size) {
            this.size = size;
            this.ui = new UI(this);
            this.player = new Player(this);
            this.inputHandler = new InputHandler(this);
            this.commandKeys = [];
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
        update(deltaTime) {
            this.player.update(deltaTime);
        }
        draw(context) {
            this.ui.draw(context);
            this.player.draw(context);
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
