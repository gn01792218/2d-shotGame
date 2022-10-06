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
    RELOAD = 'r',
    DEBUG = 'd',
}
enum EnemyType {
    NORMAL,
    LUCKY,
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
                        break
                    case KeyBoardCommands.FIRE:  //接收到空白鍵時，叫玩家發射
                        this.game.getPlayer.fire()
                        break
                    case KeyBoardCommands.RELOAD:
                        this.game.getPlayer.reloadAmmo()
                        break
                    case KeyBoardCommands.DEBUG:
                        this.game.getDebug = !this.game.getDebug 
                        break
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
        protected img:HTMLImageElement
        protected imgXFrame = 0 //要畫playerImg的第幾張小圖之左上x
        protected imgYFrame = 0 //要畫playerImg的第幾張小圖之左上y
        protected imgMaxFrame = 39 //playerImg 一行 有多少張小圖
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
            this.img = document.getElementById('projectile') as HTMLImageElement
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
                context.save()
                if(this.game.getDebug) context.strokeRect(this.location.x,this.location.y,this.size.width,this.size.height)
                // context.fillStyle = 'transparent'
                context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)
                context.drawImage(this.img,this.location.x,this.location.y)
                context.restore()
            }
        }
    }
    class Player extends GameObj{
        hp = 100
        atk = -1
        private ammos:Projectile[] = []
        private maxAmmo = 20  //最大彈藥數
        private remainingBullets = 10  //玩家剩餘子彈
        private autoLoadTimer = 0
        private autoLoadAmmos = 1 //自動填充的子彈數量
        private autoLoadInterval = 5000 //自動填充的間格
        private score = 0
        //+成狀態
        private powerUp = false
        private powerUpTimer = 0
        private powerUpLimit = 5000
        constructor(game:Game) {
            super(game)
            this.img = document.getElementById('player') as HTMLImageElement
            this.size = {width:120,height:190}
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
            //角色動畫
            if(this.imgXFrame < this.imgMaxFrame) this.imgXFrame ++
            else this.imgXFrame = 0
            //角色的長方形
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
            //加成效果
            if(this.powerUp) {
                if(this.powerUpTimer < this.powerUpLimit) this.powerUpTimer += deltaTime
                else {
                    this.powerUp = false
                    this.autoLoadInterval = 5000
                    this.imgYFrame = 0
                    this.powerUpTimer = 0
                }
            }
        }
        draw(context:CanvasRenderingContext2D){
            //1.畫自己
            if(this.game.getDebug) context.strokeRect(this.location.x,this.location.y,this.size.width,this.size.height)
            context.fillStyle = 'transparent'
            context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)
            context.drawImage(this.img,this.imgXFrame*this.size.width,this.imgYFrame*this.size.height,this.size.width,this.size.height,
                this.location.x,this.location.y,this.size.width,this.size.height)
            //2.畫子彈
            this.ammos.forEach(ammo=>{
                ammo.draw(context)
            })
        }
        fire(){
            if(this.remainingBullets === 0) return
            //按一下空白鍵就發射一顆
            this.ammos.push(new Projectile(this.game,{x:this.rect.right-5,y:this.rect.top+20})) 
            this.remainingBullets --

            //如果有+成效果會在尾巴同時發射
            if(this.powerUp) this.fireFromTail()
        }
        fireFromTail(){
            this.ammos.push(new Projectile(this.game,{x:this.rect.right-5,y:this.rect.bottom})) 
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
        enterPowerUp(){
            this.powerUp = true
            this.powerUpTimer = 0
            this.autoLoadInterval = 1000
            this.imgYFrame = 1
        }
    }
    abstract class Enemy extends GameObj {
        abstract killScroe:number
        abstract type:EnemyType
        constructor(game:Game){
            super(game)
        }
        get gainScore () {
            return this.killScroe
        }
        update(deltaTime?:number){
            this.location.x -= this.speed.x
            this.rect = {
                left:this.location.x,
                right:this.location.x + this.size.width,
                top:this.location.y,
                bottom:this.location.y + this.size.height
            }
            if(this.location.x < 0 || this.hp <= 0) this.deleted = true
            //角色動畫
            if(this.imgXFrame < this.imgMaxFrame) this.imgXFrame ++
            else this.imgXFrame = 0
        }
        draw(context: CanvasRenderingContext2D): void {
            if(!this.deleted) {
                context.save()
                if(this.game.getDebug) context.strokeRect(this.location.x,this.location.y,this.size.width,this.size.height)
                //畫自己
                context.fillStyle = 'transparent'
                context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)
                context.drawImage(this.img,this.imgXFrame*this.size.width,this.imgYFrame*this.size.height,this.size.width,this.size.height,
                    this.location.x,this.location.y,this.size.width,this.size.height)
                //顯示分數
                context.restore()
                context.fillStyle = 'black'
                context.font = 'bold 16px serif'
                context.fillText(this.hp.toString(),this.location.x,this.location.y)
                context.restore()
            }
        }
    }
    class Angular extends Enemy {
        killScroe = 5
        hp = 5
        atk = -10
        type = EnemyType.NORMAL
        constructor(game:Game){
            super(game)
            this.size = {width:228,height:169}
            this.speed = {x:1.3,y:5}
            this.location = {x:this.game.gameSize.width*0.8,y:Math.random()*(this.game.gameSize.height-this.size.height)}
            this.img = document.getElementById('angler') as HTMLImageElement
            this.imgXFrame = 0
            this.imgYFrame = Math.floor(Math.random()*3)
        }
    }
    class Angular2 extends Enemy {
        killScroe = 5
        hp = 5
        atk = -5
        type = EnemyType.NORMAL
        constructor(game:Game){
            super(game)
            this.size = {width:213,height:165}
            this.speed = {x:1.5      ,y:5}
            this.location = {x:this.game.gameSize.width*0.8,y:Math.random()*(this.game.gameSize.height-this.size.height)}
            this.img = document.getElementById('angler2') as HTMLImageElement
            this.imgXFrame = 0
            this.imgYFrame = Math.floor(Math.random()*2)
        }
    }
    class LuckyFish extends Enemy {
        killScroe = 5
        hp = 5
        atk = -5
        type = EnemyType.LUCKY
        constructor(game:Game){
            super(game)
            this.size = {width:99,height:95}
            this.speed = {x:2.2  ,y:5}
            this.location = {x:this.game.gameSize.width*0.8,y:Math.random()*(this.game.gameSize.height-this.size.height)}
            this.img = document.getElementById('lucky') as HTMLImageElement
            this.imgXFrame = 0
            this.imgYFrame = Math.floor(Math.random()*2)
        }
    }
    class Layer {
        private size:Size = {width:1768,height:500}
        private location:Coordinate = {x:0,y:0}
        constructor(private game:Game, private image:HTMLImageElement,private speedModifier:Speed = {x:1,y:1}){
        }
        update(){
            //重置圖片，造成無限迴圈
            if(this.location.x <= -this.size.width ) this.location.x = 0 
            this.location.x -= this.speedModifier.x * this.game.baseSpeed.x
        }
        draw(context:CanvasRenderingContext2D){
            context.drawImage(this.image,this.location.x,this.location.y)
            //為了圖片不間斷的第二張圖
            context.drawImage(this.image,this.location.x+this.size.width,this.location.y)
        }
    }
    class Background { //pull all layer obj together to animate the entire game world
        private layers:Layer[]
        private layer1:Layer
        private layer2:Layer
        private layer3:Layer
        private layer4:Layer
        constructor(private game:Game){
            let layerImg1 = document.getElementById('layer1') as HTMLImageElement
            let layerImg2 = document.getElementById('layer2') as HTMLImageElement
            let layerImg3 = document.getElementById('layer3') as HTMLImageElement
            let layerImg4 = document.getElementById('layer4') as HTMLImageElement
            this.layer1 = new Layer(this.game,layerImg1,{x:1,y:0})
            this.layer2 = new Layer(this.game,layerImg2,{x:1,y:0})
            this.layer3 = new Layer (this.game,layerImg3,{x:1,y:0})
            this.layer4 = new Layer (this.game,layerImg4,{x:1,y:0})
            this.layers = [this.layer1,this.layer2,this.layer3]
        }
        get getLayer4 () {
            return this.layer4
        }
        update(){
            if(this.game.isGameEnd) return
            this.layers.forEach(layer=>layer.update())
        }
        draw(context:CanvasRenderingContext2D){
            this.layers.forEach(layer=>layer.draw(context))
        }
    }  
    class UI { //score、timer、and other infomation
        constructor(private game:Game){}
        draw(context:CanvasRenderingContext2D){
            context.save()
            //顯示玩家得分
            context.fillStyle = 'yellow'
            context.font = 'bold 20px serif'
            context.shadowColor = 'black'
            context.shadowBlur = 10
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
            //計時器
            context.fillText(`Timer:${this.game. gameTimeCount.toFixed(2)}`,20,100)
            //輸贏顯示
            if(this.game.isGameEnd){
                let msg1:string
                let msg2:string
                context.textAlign = 'center'
                if(this.game.getPlayer.playerScore > this.game.getWiningScore) {
                    msg1 = 'You Win'
                    msg2 = 'Will Done!'
                }else {
                    msg1 = 'You loss'
                    msg2 = 'Try Again'
                    context.fillStyle = 'grey'
                }
                context.font = 'bold 50px serif'
                context.fillText(msg1,this.game.gameSize.width*0.5,this.game.gameSize.height*0.5)
                context.font = 'bold 25px serif'
                context.fillText(msg2,this.game.gameSize.width*0.5,this.game.gameSize.height*0.6)
            }
            context.restore()
        }
    }
    class Game {
        private bg:Background
        private ui:UI
        private player:Player
        private inputHandler:InputHandler
        private commandKeys:string[]
        private enemys:Angular[]
        private angularBornTimer:number //燈籠魚自動生成計時器
        private angularBornInterval:number 
        private gameTimer:number
        private gameTimeLimit:number
        private winScore:number
        private gameEnd:Boolean
        private gameSpeed:Speed //控制遊戲中物件速度的基準
        private debug:Boolean
        constructor(private size:Size){
            this.bg = new Background(this)
            this.ui = new UI(this)
            this.player = new Player(this)
            this.inputHandler = new InputHandler(this)
            this.commandKeys = []
            this.enemys = []
            this.angularBornTimer = 0
            this.angularBornInterval = 1000
            this.gameTimer = 0
            this.gameTimeLimit = 100000
            this.winScore = 20
            this.gameEnd = false
            this.gameSpeed = {x:1,y:1}
            this.debug = true
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
        get gameTimeCount () {
            return this.gameTimer
        }
        get getWiningScore () {
            return this.winScore
        }
        get isGameEnd () {
            return this.gameEnd
        }
        get baseSpeed () {
            return this.gameSpeed
        }
        get getDebug() {
            return this.debug
        }
        set getDebug(valur:Boolean){
            this.debug = valur
        }
        update(deltaTime:number){
            //bg (layer4為了要畫在最前面，所以獨立出來)
            this.bg.update()
            this.bg.getLayer4.update()
             //遊戲結束判斷
            if(this.player.playerScore > this.winScore ||
                this.gameTimer > this.gameTimeLimit) this.gameEnd = true
            //計時
            if(this.gameEnd) return 
            this.gameTimer += deltaTime
            this.player.update(deltaTime)
            this.enemys.forEach(enemy=>{
                enemy.update(deltaTime)
                if(this.player.checkCollisionWith(enemy.objRect)){
                    this.player.addScore(-1)
                }
                //檢測碰撞
                if(enemy.checkCollisionWith(this.player.objRect)){
                    enemy.tweakHp(this.player.ATK)
                    //+乘效果
                    if(enemy.type === EnemyType.LUCKY){
                        this.player.enterPowerUp()
                        enemy.disappear = true
                        return
                    }   
                }
                //子彈也要碰撞檢測
                this.player.playerAmmoArr.forEach(ammo=>{
                    if(ammo.checkCollisionWith(enemy.objRect)){
                        ammo.disappear = true
                        enemy.tweakHp(ammo.ATK)
                        if(enemy.HP <= 0 ){
                            //玩家加分數
                            this.player.addScore(enemy.gainScore)
                            //+乘效果
                            if(enemy.type === EnemyType.LUCKY)this.player.enterPowerUp()
                        }
                    }
                })
            })
            this.enemys = this.enemys.filter(enemy=>!enemy.disappear)
            this.autoGenrateAngular(deltaTime)
        }
        draw(context:CanvasRenderingContext2D){
            this.bg.draw(context)
            this.ui.draw(context)
            this.player.draw(context)
            this.enemys.forEach(angular=>angular.draw(context))
            //讓layer4畫在最上面
            this.bg.getLayer4.draw(context)
        }
        autoGenrateAngular(deltaTime:number){
            let random = Math.random()
            if(this.player.playerScore >= this.winScore) return
            if(this.angularBornTimer > this.angularBornInterval) {
                if(random < 0.8) this.enemys.push(new Angular(this))
                else if(random <0.5) this.enemys.push(new Angular2(this))
                else this.enemys.push(new LuckyFish(this))
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