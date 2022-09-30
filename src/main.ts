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
enum MoveCommand {
    UP = 'ArrowUp',
    DOWN = 'ArrowDown',
    LEFT = 'ArrowLeft',
    RIGHT = 'ArrowRight',
    FIRE = ' '
}
//load事件時，畫出畫布
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
                    case MoveCommand.UP:
                    case MoveCommand.DOWN:
                    case MoveCommand.LEFT:
                    case MoveCommand.RIGHT:
                    case MoveCommand.FIRE:
                        this.game.keyBoardCommands.push(e.key)
                        console.log(this.game.keyBoardCommands)
                }
            })
            window.addEventListener('keyup',(e)=>{
                switch(e.key) {
                    case MoveCommand.UP:
                    case MoveCommand.DOWN:
                    case MoveCommand.LEFT:
                    case MoveCommand.RIGHT:
                    case MoveCommand.FIRE:
                        this.game.keyBoardCommands.splice(this.game.keyBoardCommands.indexOf(e.key),1)
                }
            })
        }
    }
    class Projectile {
        private speed:Speed = {x:10,y:10}
        private deleted:Boolean
        constructor(private game:Game,private position:Coordinate,private size:Size){
            this.deleted = false
        }
        updated(){
            if(this.position.x > this.game.gameSize.width) {
                this.position.x += this.speed.x
            }
        }
        draw(context:CanvasRenderingContext2D){
            context.fillStyle = 'yellow'
            context.fillRect(this.position.x,this.position.y,this.size.width,this.size.height)
        }
    }
    class Particle {}
    class Player {
        //初始化傳入一個Game物件，以和main game產生連結，取得資訊、變更屬性
        private size:Size = {width:120,height:150}
        private location:Coordinate = {x:0,y:0}
        private speed:Speed = {x:5,y:5}
        constructor(private game:Game) {
            this.game = game
            this.location.x = 20
            this.location.y = 100
        }
        update(){
            if(this.game.keyBoardCommands.indexOf(MoveCommand.DOWN)){
                this.location.y -= this.speed.y
            }
            if(this.game.keyBoardCommands.indexOf(MoveCommand.UP)){
                this.location.y += this.speed.y
            }
            if(this.game.keyBoardCommands.indexOf(MoveCommand.LEFT)){
                this.location.x += this.speed.x
            }
            if(this.game.keyBoardCommands.indexOf(MoveCommand.RIGHT)){
                this.location.x -= this.speed.x
            }
        }
        draw(context:CanvasRenderingContext2D){
            context.fillStyle = '#123456'
            context.fillRect(this.location.x,this.location.y,this.size.width,this.size.height)
        }
        fire(){
            //按一下空白鍵就發射一顆
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
        private ammos:number
        constructor(private size:Size){
            this.player = new Player(this)
            this.inputHandler = new InputHandler(this)
            this.commandKeys = []
            this.ammos = 20
        }
        get keyBoardCommands (){
            return this.commandKeys
        }
        get totalAmmos (){
            return this.ammos
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