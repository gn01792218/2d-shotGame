//interface
interface Coordinate {
    x:number,
    y:number
}
interface Speed {
    x:number,
    y:number
}
//load事件時，畫出畫布
window.addEventListener('load',function(){
    //canvas setup 
    const canvas = this.document.getElementById('canvas1') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!;  //Drawing Context(built in object that allow us to deal with canvas)
    canvas.width = 1500
    canvas.height = 500
    
    class InputHandler {}
    class Projectile {}
    class Particle {}
    class Player {
        //初始化傳入一個Game物件，以和main game產生連結，取得資訊、變更屬性
        private width:number
        private height:number
        private location:Coordinate = {x:0,y:0}
        private speed:Speed = {x:0,y:0}
        constructor(private game:Game) {
            this.game = game
            this.width = 120
            this.height = 190
            this.location.x = 20
            this.location.y = 100
            this.speed.y = -1
            this.speed.x = 0
        }
        update(){
            this.location.y += this.speed.y
        }
        draw(context:CanvasRenderingContext2D){
            context.fillRect(this.location.x,this.location.y,this.width,this.height)
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
        constructor(private width:number, private height:number){
            this.player = new Player(this)
            console.log(this.player)
        }
        update(){
            this.player.update()
        }
        draw(context:CanvasRenderingContext2D){
            this.player.draw(context)
        }
    }
    const mainGame = new Game(canvas.width,canvas.height)
    function animate() {
        ctx?.clearRect(0,0,canvas.width,canvas.height)
        mainGame.update()
        mainGame.draw(ctx)
        requestAnimationFrame(animate)
    }
    animate()
})