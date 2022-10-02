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
        abstract hp:number
        abstract atk:number
        get HP () {
            return this.hp
        }
        get ATK () {
            return this.atk
        }
        get objRect () {
            return this.rect
        }
        get disappear () {
            return this.deleted
        }
        set disappear (value:Boolean) {
            this.deleted = value
        }
        constructor(protected game:Game){
            this.deleted = false
        }
        abstract update(deltaTime?:number):void
        abstract draw(context:CanvasRenderingContext2D):void
        checkCollisionWith(targect:Rectangle){
            return (
                this.rect.left < targect.right &&
                this.rect.right > targect.left &&
                this.rect.top < targect.bottom &&
                this.rect.bottom > targect.top
            )
        }
        tweakHp(payload:number){
            this.hp += payload
        }
    }
    class Projectile extends GameObj {
        hp = 1
        atk = -1
        constructor(game:Game,location:Coordinate){
            super(game)
            this.size = { width:10, height:10}
            this.location = location
        }
        update(){
            this.location.x += this.speed.x
            this.rect = {
                left:this.location.x,
                right:this.location.x + this.size.width,
                top:this.location.y,
                bottom:this.location.y + this.size.height
            }
            if(this.location.x > this.game.gameSize.width * 0.8 || this.hp <=0 ) this.deleted = true
        }
        draw(context:CanvasRenderingContext2D){
            if(!this.deleted) {
                context.fillStyle = 'yellow'
                context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)
            }
        }
    }
    class Player extends GameObj{
        hp = 100
        atk = 0
        private ammos:Projectile[] = []
        private maxAmmo = 20  //最大彈藥數
        private remainingBullets = 10  //玩家剩餘子彈
        private autoLoadTimer = 0
        private autoLoadAmmos = 1 //自動填充的子彈數量
        private autoLoadInterval = 5000 //自動填充的間格
        private score = 0
        constructor(game:Game) {
            super(game)
            this.size = {width:120,height:150}
            this.location = {x:20,y:100}
            this.speed = {x:5,y:5}
        }
        get playerAmmoArr () {
            return this.ammos
        }
        get getMaxAmmoNum () {
            return this.maxAmmo
        }
        get playerAmmoNum () {
            return this.remainingBullets
        }
        get playerScore () {
            return this.score
        }
        update(deltaTime:number){
            this.rect = {
                left:this.location.x,
                right:this.location.x + this.size.width,
                top:this.location.y,
                bottom:this.location.y + this.size.height
            }
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
        addScore(point:number) {
            this.score += point
        }
    }
    abstract class Enemy extends GameObj {
        abstract killScroe:number
        constructor(game:Game){
            super(game)
        }
        get gainScore () {
            return this.killScroe
        }
        abstract draw(context:CanvasRenderingContext2D):void
        update(deltaTime?:number){
            this.location.x -= this.speed.x
            this.rect = {
                left:this.location.x,
                right:this.location.x + this.size.width,
                top:this.location.y,
                bottom:this.location.y + this.size.height
            }
            if(this.location.x < 0 || this.hp <= 0) this.deleted = true
        }
    }
    class Angular extends Enemy {
        killScroe = 5
        hp = 3
        atk = 10
        constructor(game:Game){
            super(game)
            this.size = {width:50,height:50}
            this.speed = {x:1,y:5}
            this.location = {x:this.game.gameSize.width*0.8,y:Math.random()*(this.game.gameSize.height-this.size.height)}
        }
        draw(context: CanvasRenderingContext2D): void {
            if(!this.deleted) {
                context.fillStyle = 'green'
                context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)
                context.fillStyle = 'black'
                context.font = '10px'
                context.fillText(this.hp.toString(),this.location.x,this.location.y)
            }
        }
    }
    class Layer {}
    class Background { //pull all layer obj together to animate the entire game world

    }  
    class UI { //score、timer、and other infomation
        constructor(private game:Game){}
        draw(context:CanvasRenderingContext2D){
            context.save()
            //顯示玩家得分
            context.fillStyle = 'yellow'
            context.font = 'bold 20px serif'
            context.shadowOffsetX = 2
            context.shadowOffsetY = 2
            context.fillText(`Score:${this.game.getPlayer.playerScore}`,20,60)
            //畫子彈最大數量
            for(let i = 0 ; i <this.game.getPlayer.getMaxAmmoNum ;i++){
                context.fillStyle = 'gray'
                context.fillRect(20+i*6 ,20,5,20)
            }
            //畫剩餘子彈
            for(let i = 0 ; i <this.game.getPlayer.playerAmmoNum ;i++){
                context.fillStyle = 'red'
                context.fillRect(20+i*6 ,20,5,20)
            }
            context.restore()
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
        private winScore:number
        constructor(private size:Size){
            this.ui = new UI(this)
            this.player = new Player(this)
            this.inputHandler = new InputHandler(this)
            this.commandKeys = []
            this.angularEnemys = []
            this.angularBornTimer = 0
            this.angularBornInterval = 1000
            this.winScore = 20
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
            this.angularEnemys.forEach(angular=>{
                angular.update(deltaTime)
                //檢測碰撞
                if(angular.checkCollisionWith(this.player.objRect)){
                    angular.tweakHp(this.player.ATK)
                }
                //子彈也要碰撞檢測
                this.player.playerAmmoArr.forEach(ammo=>{
                    if(ammo.checkCollisionWith(angular.objRect)){
                        ammo.disappear = true
                        angular.tweakHp(ammo.ATK)
                        if(angular.HP <= 0 ){
                            //玩家加分數
                            this.player.addScore(angular.gainScore)
                        }
                    }
                })
            })
            this.angularEnemys = this.angularEnemys.filter(angular=>!angular.disappear)
            this.autoGenrateAngular(deltaTime)
        }
        draw(context:CanvasRenderingContext2D){
            this.ui.draw(context)
            this.player.draw(context)
            this.angularEnemys.forEach(angular=>angular.draw(context))
        }
        autoGenrateAngular(deltaTime:number){
            if(this.player.playerScore >= this.winScore) return
            if(this.angularBornTimer > this.angularBornInterval) {
                this.angularEnemys.push(new Angular(this))
                this.angularBornTimer = 0
            }
            this.angularBornTimer += deltaTime
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