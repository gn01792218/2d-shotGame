var MoveCommand;
(function (MoveCommand) {
    MoveCommand["UP"] = "ArrowUp";
    MoveCommand["DOWN"] = "ArrowDown";
    MoveCommand["LEFT"] = "ArrowLeft";
    MoveCommand["RIGHT"] = "ArrowRight";
})(MoveCommand || (MoveCommand = {}));
//load事件時，畫出畫布
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
                    case MoveCommand.UP:
                    case MoveCommand.DOWN:
                    case MoveCommand.LEFT:
                    case MoveCommand.RIGHT:
                        this.game.keyBoardCommands.push(e.key);
                        console.log(this.game.keyBoardCommands);
                        break;
                }
            });
            window.addEventListener('keyup', (e) => {
                switch (e.key) {
                    case MoveCommand.UP:
                    case MoveCommand.DOWN:
                    case MoveCommand.LEFT:
                    case MoveCommand.RIGHT:
                        this.game.keyBoardCommands.splice(this.game.keyBoardCommands.indexOf(e.key), 1);
                        break;
                }
            });
        }
    }
    class Projectile {
    }
    class Particle {
    }
    class Player {
        constructor(game) {
            this.game = game;
            this.location = { x: 0, y: 0 };
            this.speed = { x: 5, y: 5 };
            this.game = game;
            this.width = 120;
            this.height = 190;
            this.location.x = 20;
            this.location.y = 100;
        }
        update() {
            if (this.game.keyBoardCommands.indexOf(MoveCommand.DOWN)) {
                this.location.y -= this.speed.y;
            }
            if (this.game.keyBoardCommands.indexOf(MoveCommand.UP)) {
                this.location.y += this.speed.y;
            }
            if (this.game.keyBoardCommands.indexOf(MoveCommand.LEFT)) {
                this.location.x += this.speed.x;
            }
            if (this.game.keyBoardCommands.indexOf(MoveCommand.RIGHT)) {
                this.location.x -= this.speed.x;
            }
        }
        draw(context) {
            context.fillRect(this.location.x, this.location.y, this.width, this.height);
        }
    }
    class Enemy {
    }
    class Layer {
    }
    class Background {
    }
    class UI {
    }
    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.inputHandler = new InputHandler(this);
            this.keys = [];
        }
        get keyBoardCommands() {
            return this.keys;
        }
        update() {
            this.player.update();
        }
        draw(context) {
            this.player.draw(context);
        }
    }
    const mainGame = new Game(canvas.width, canvas.height);
    function animate() {
        ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, canvas.width, canvas.height);
        mainGame.update();
        mainGame.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate();
});
