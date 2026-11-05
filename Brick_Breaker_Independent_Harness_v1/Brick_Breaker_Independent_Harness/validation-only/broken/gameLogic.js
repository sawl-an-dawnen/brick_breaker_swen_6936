// DELIBERATELY BROKEN VALIDATION FIXTURE. Not an assignment implementation.
export function createInitialState() {
  return {status:'playing',paddle:{x:350,y:460,width:100,height:12,speed:400},
    ball:{x:400,y:440,radius:8,vx:160,vy:-200},
    bricks:Array.from({length:24},(_,i)=>({id:`r${Math.floor(i/8)}c${i%8}`,
      x:45+(i%8)*90,y:60+Math.floor(i/8)*30,width:80,height:20,active:true})),
    score:0,lives:3};
}
export function resetGame(){return createInitialState();}
export function updateGame(s,input={},dt){
  // Mutates input, fails RangeError validation, collision detection, pause, and life rules.
  s.paddle.x+=input.right?10:input.left?-10:0;
  s.ball.x+=s.ball.vx*(Number(dt)||0);
  s.ball.y+=s.ball.vy*(Number(dt)||0);
  return s;
}
