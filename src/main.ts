//interface
interface Size {
    width:number,
    height:number
}
interface Coordinate {
    x:number,
    y:number
}
interface Speed {
    x:number,
    y:number
}
interface Rectangle {
    left:number,
    right:number,
    top:number,
    bottom:number
}
enum KeyBoardCommands {
    UP = 'ArrowUp',
    DOWN = 'ArrowDown',
    LEFT = 'ArrowLeft',
    RIGHT = 'ArrowRight',
    FIRE = ' ',
    RELOAD = 'r'
}
//load事件時，渲染出遊戲場景
window.addEventListener('load',function(){
    //canvas setup 
    const canvas = this.document.getElementById('canvas1') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!;  //Drawing Context(built in object that allow us to deal with canvas)
    canvas.width = 1500
    canvas.height = 500
    
    class InputHandler {
        constructor(private game:Game){
            window.addEventListener('keydown',(e)=>{
                if(this.game.keyBoardCommands.indexOf(e.key) !== -1) return  //避免長按時，一直增加
                switch(e.key) {
                    case KeyBoardCommands.UP:
                    case KeyBoardCommands.DOWN:
                    case KeyBoardCommands.LEFT:
                    case KeyBoardCommands.RIGHT:
                        this.game.keyBoardCommands.push(e.key)
                        console.log(this.game.keyBoardCommands)
                        break
                    case KeyBoardCommands.FIRE:  //接收到空白鍵時，叫玩家發射
                        this.game.getPlayer.fire()
                        break
                    case KeyBoardCommands.RELOAD:
                        this.game.getPlayer.reloadAmmo()
                }
            })
            window.addEventListener('keyup',(e)=>{
                switch(e.key) {
                    case KeyBoardCommands.UP:
                    case KeyBoardCommands.DOWN:
                    case KeyBoardCommands.LEFT:
                    case KeyBoardCommands.RIGHT:
                        this.game.keyBoardCommands.splice(this.game.keyBoardCommands.indexOf(e.key),1)
                }
            })
        }
    }
    class Particle {}
    abstract class GameObj {
        //初始化傳入一個Game物件，以和main game產生連結，取得資訊、變更屬性
        protected size:Size = {width:120,height:150}
        protected location:Coordinate = {x:0,y:0}
        protected speed:Speed = {x:5,y:5}
        protected deleted:Boolean
        protected rect:Rectangle = {
            left:this.location.x,
            right:this.location.x + this.size.width,
            top:this.location.y,
            bottom:this.location.y + this.size.height
        }
        get roleRect () {
            return this.rect
        }
        get disappear () {
            return this.deleted
        }
        constructor(protected game:Game){
            this.deleted = false
        }
        abstract update(deltaTime?:number):void
        abstract draw(context:CanvasRenderingContext2D):void
    }
    class Projectile extends GameObj{
        constructor(game:Game,location:Coordinate){
            super(game)
            this.size = { width:10, height:10}
            this.location = location
        }
        get disappear () {
            return this.deleted
        }
        update(){
            this.location.x += this.speed.x
            if(this.location.x > this.game.gameSize.width * 0.8) this.deleted = true
        }
        draw(context:CanvasRenderingContext2D){
            if(!this.deleted) {
                context.fillStyle = 'yellow'
                context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)
            }
        }
    }
    class Player extends GameObj{
        private ammos:Projectile[] = []
        private maxAmmo = 20  //最大彈藥數
        private remainingBullets = 10  //玩家剩餘子彈
        private autoLoadTimer = 0
        private autoLoadAmmos = 1 //自動填充的子彈數量
        private autoLoadInterval = 5000 //自動填充的間格
        constructor(game:Game) {
            super(game)
            this.size = {width:120,height:150}
            this.location = {x:20,y:100}
            this.speed = {x:5,y:5}
        }
        get getMaxAmmo () {
            return this.maxAmmo
        }
        get playerAmmos () {
            return this.remainingBullets
        }
        update(deltaTime:number){
            this.autoReloadAmmo(deltaTime,this.autoLoadAmmos)
            if(this.game.keyBoardCommands.includes(KeyBoardCommands.DOWN)){
                this.location.y += this.speed.y
            }
            if(this.game.keyBoardCommands.includes(KeyBoardCommands.UP)){
                this.location.y -= this.speed.y
            }
            if(this.game.keyBoardCommands.includes(KeyBoardCommands.LEFT)){
                this.location.x -= this.speed.x
            }
            if(this.game.keyBoardCommands.includes(KeyBoardCommands.RIGHT)){
                this.location.x += this.speed.x
            }
            //有子彈的話就要更新
            if(this.ammos.length<1) return
            this.ammos.forEach(ammo=>{
                ammo.update()
            })
            //更新子彈陣列(把尚未delete的子彈filter出來，即移除被標示為delete的子彈)
            this.ammos = this.ammos.filter(ammo=>!ammo.disappear)
        }
        draw(context:CanvasRenderingContext2D){
            //1.畫自己
            context.fillStyle = '#123456'
            context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)

            //2.畫子彈
            this.ammos.forEach(ammo=>{
                ammo.draw(context)
            })
        }
        fire(){
            if(this.remainingBullets === 0) return
            //按一下空白鍵就發射一顆
            this.ammos.push(new Projectile(this.game,{x:this.location.x,y:this.location.y})) 
            this.remainingBullets --
        }
        reloadAmmo() {
            this.remainingBullets += (20-this.remainingBullets)
        }
        autoReloadAmmo(deltaTime:number,autoLoadAmmos:number) {
            if(this.remainingBullets >= this.maxAmmo) return 
            if(this.autoLoadTimer > this.autoLoadInterval) {
                this.remainingBullets += autoLoadAmmos  //增加子彈
                this.autoLoadTimer = 0
            }
            this.autoLoadTimer += deltaTime
        }
    }
    abstract class Enemy extends GameObj {
        constructor(game:Game){
            super(game)
        }
        update(deltaTime?:number){
            this.location.x -= this.speed.x
            if(this.location.x < 0) this.deleted = true
        }
        abstract draw(context:CanvasRenderingContext2D):void
    }
    class Angular extends Enemy {
        constructor(game:Game){
            super(game)
            this.size = {width:50,height:50}
            this.speed = {x:2,y:5}
            this.location = {x:this.game.gameSize.width*0.8,y:Math.random()*(this.game.gameSize.height-this.size.height)}
        }
        draw(context: CanvasRenderingContext2D): void {
            if(!this.deleted) {
                context.fillStyle = 'green'
                context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)
            }
        }
    }
    class Layer {}
    class Background { //pull all layer obj together to animate the entire game world

    }  
    class UI { //score、timer、and other infomation
        constructor(private game:Game){}
        draw(context:CanvasRenderingContext2D){
            //畫子彈最大數量
            for(let i = 0 ; i <this.game.getPlayer.getMaxAmmo ;i++){
                context.fillStyle = 'gray'
                context.fillRect(20+i*6 ,20,5,20)
            }
            //畫剩餘子彈
            for(let i = 0 ; i <this.game.getPlayer.playerAmmos ;i++){
                context.fillStyle = 'red'
                context.fillRect(20+i*6 ,20,5,20)
            }
        }
    }
    class Game {
        private ui:UI
        private player:Player
        private inputHandler:InputHandler
        private commandKeys:string[]
        private angularEnemys:Angular[]
        private angularBornTimer:number //燈籠魚自動生成計時器
        private angularBornInterval:number 
        constructor(private size:Size){
            this.ui = new UI(this)
            this.player = new Player(this)
            this.inputHandler = new InputHandler(this)
            this.commandKeys = []
            this.angularEnemys = []
            this.angularBornTimer = 0
            this.angularBornInterval = 1000
        }
        get getPlayer () {
            return this.player
        }
        get keyBoardCommands (){
            return this.commandKeys
        }
        get gameSize () {
            return this.size
        }
        update(deltaTime:number){
            this.player.update(deltaTime)
            this.angularEnemys.forEach(angular=>angular.update(deltaTime))
            this.angularEnemys = this.angularEnemys.filter(angular=>!angular.disappear)
            this.autoGenrateAngular(deltaTime)
        }
        draw(context:CanvasRenderingContext2D){
            this.ui.draw(context)
            this.player.draw(context)
            this.angularEnemys.forEach(angular=>angular.draw(context))
        }
        autoGenrateAngular(deltaTime:number){
            if(this.angularBornTimer > this.angularBornInterval) {
                this.angularEnemys.push(new Angular(this))
                this.angularBornTimer = 0
            }
            this.angularBornTimer += deltaTime
        }
        checkCollision(rect1:Rectangle,rect2:Rectangle){
            return (
                rect1.right > rect2.left &&
                rect1.left < rect2.right &&
                rect1.top > rect2.bottom &&
                rect1.bottom < rect2.top
            )
        }
    }
    const mainGame = new Game({width:canvas.width,height:canvas.height})
    let lastTime = 0 //儲存上一偵的timeSteamp

    animate(0)
    function animate(timeStamp:number) { //這裡的timeStamp 將來在requestAnimationFrame中會自動傳入
        const deltaTime = timeStamp - lastTime //時間增量 : 當偵和上一偵的時間差 ； 電腦越舊數值越高 (render animation 時間越多)
        lastTime = timeStamp //更新lastTime
        ctx?.clearRect(0,0,canvas.width,canvas.height)
        mainGame.update(deltaTime)  //將時間差傳給update做使用
        mainGame.draw(ctx)
        requestAnimationFrame(animate)
    }
})