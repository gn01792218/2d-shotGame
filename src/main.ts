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
    class Projectile {
        private speed:Speed = {x:5,y:5}
        private deleted:Boolean
        constructor(private game:Game,private position:Coordinate,private size:Size){
            this.deleted = false
        }
        get disappear () {
            return this.deleted
        }
        updated(){
            if(this.position.x > this.game.gameSize.width * 0.8) this.deleted = true
            this.position.x += this.speed.x
        }
        draw(context:CanvasRenderingContext2D){
            if(!this.deleted) {
                context.fillStyle = 'yellow'
                context.fillRect(this.position.x,this.position.y,this.size.width,this.size.height)
            }
        }
    }
    class Particle {}
    class Player {
        //初始化傳入一個Game物件，以和main game產生連結，取得資訊、變更屬性
        private size:Size = {width:120,height:150}
        private location:Coordinate = {x:0,y:0}
        private speed:Speed = {x:5,y:5}
        private ammos:Projectile[] = []
        private remainingBullets = 20
        constructor(private game:Game) {
            this.game = game
            this.location.x = 20
            this.location.y = 100
        }
        update(){
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
                ammo.updated()
            })
            //更新子彈陣列(把尚未delete的子彈filter出來)
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
            this.ammos.push(new Projectile(this.game,{x:this.location.x,y:this.location.y},{width:10,height:10})) 
            this.remainingBullets --
        }
        reloadAmmo() {
            this.remainingBullets += (20-this.remainingBullets)
        }
    }
    class Enemy {}
    class Layer {}
    class Background { //pull all layer obj together to animate the entire game world

    }  
    class UI { //score、timer、and other infomation

    }
    class Game {
        private player:Player
        private inputHandler:InputHandler
        private commandKeys:string[]
        constructor(private size:Size){
            this.player = new Player(this)
            this.inputHandler = new InputHandler(this)
            this.commandKeys = []
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
        update(){
            this.player.update()
        }
        draw(context:CanvasRenderingContext2D){
            this.player.draw(context)
        }
    }
    const mainGame = new Game({width:canvas.width,height:canvas.height})
    function animate() {
        ctx?.clearRect(0,0,canvas.width,canvas.height)
        mainGame.update()
        mainGame.draw(ctx)
        requestAnimationFrame(animate)
    }
    animate()
})