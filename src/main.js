//load事件時，畫出畫布
window.addEventListener('load', function () {
    //canvas setup 
    var canvas = this.document.getElementById('canvas1');
    var ctx = canvas.getContext('2d'); //Drawing Context(built in object that allow us to deal with canvas)
    canvas.width = 1500;
    canvas.height = 500;
    var InputHandler = /** @class */ (function () {
        function InputHandler() {
        }
        return InputHandler;
    }());
    var Projectile = /** @class */ (function () {
        function Projectile() {
        }
        return Projectile;
    }());
    var Particle = /** @class */ (function () {
        function Particle() {
        }
        return Particle;
    }());
    var Player = /** @class */ (function () {
        function Player(game) {
            this.game = game;
            this.location = { x: 0, y: 0 };
            this.speed = { x: 0, y: 0 };
            this.game = game;
            this.width = 120;
            this.height = 190;
            this.location.x = 20;
            this.location.y = 100;
            this.speed.y = -1;
            this.speed.x = 0;
        }
        Player.prototype.update = function () {
            this.location.y += this.speed.y;
        };
        Player.prototype.draw = function (context) {
            context.fillRect(this.location.x, this.location.y, this.width, this.height);
        };
        return Player;
    }());
    var Enemy = /** @class */ (function () {
        function Enemy() {
        }
        return Enemy;
    }());
    var Layer = /** @class */ (function () {
        function Layer() {
        }
        return Layer;
    }());
    var Background = /** @class */ (function () {
        function Background() {
        }
        return Background;
    }());
    var UI = /** @class */ (function () {
        function UI() {
        }
        return UI;
    }());
    var Game = /** @class */ (function () {
        function Game(width, height) {
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            console.log(this.player);
        }
        Game.prototype.update = function () {
            this.player.update();
        };
        Game.prototype.draw = function (context) {
            this.player.draw(context);
        };
        return Game;
    }());
    var mainGame = new Game(canvas.width, canvas.height);
    function animate() {
        ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, canvas.width, canvas.height);
        mainGame.update();
        mainGame.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate();
});
