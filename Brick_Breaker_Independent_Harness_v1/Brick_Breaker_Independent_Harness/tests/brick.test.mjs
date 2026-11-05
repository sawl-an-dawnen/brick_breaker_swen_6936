import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const target = process.env.BRICK_IMPL;
if (!target) throw new Error('BRICK_IMPL not set: launch tests through runner.mjs --impl PATH');
const api = await import(pathToFileURL(target).href);
const { createInitialState, updateGame, resetGame } = api;
const EPS = 1e-6;

function near(actual, expected, message = '', tolerance = EPS) {
  assert.equal(typeof actual, 'number', `${message}: must be number`);
  assert.ok(Number.isFinite(actual), `${message}: must be finite`);
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected} ± ${tolerance}, received ${actual}`);
}
function clone(value) { return structuredClone(value); }
function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.values(o).forEach(deepFreeze);
    Object.freeze(o);
  }
  return o;
}
function publicProjection(s) {
  return {
    status:s.status, paddle:{...s.paddle}, ball:{...s.ball},
    bricks:s.bricks.map(b => ({...b})),score:s.score,lives:s.lives
  };
}
function noSharedRequiredObjects(a,b) {
  assert.notStrictEqual(a,b);
  assert.notStrictEqual(a.paddle,b.paddle);
  assert.notStrictEqual(a.ball,b.ball);
  assert.notStrictEqual(a.bricks,b.bricks);
  for (let i=0;i<24;i++) assert.notStrictEqual(a.bricks[i],b.bricks[i]);
}
function invariants(s) {
  assert.ok(s && typeof s === 'object' && !Array.isArray(s));
  assert.ok(['playing','paused','won','lost'].includes(s.status));
  assert.ok(s.paddle && typeof s.paddle === 'object');
  assert.ok(s.ball && typeof s.ball === 'object');
  for (const k of ['x','y','width','height','speed']) assert.ok(Number.isFinite(s.paddle[k]),`paddle.${k}`);
  for (const k of ['x','y','radius','vx','vy']) assert.ok(Number.isFinite(s.ball[k]),`ball.${k}`);
  near(s.paddle.y,460); near(s.paddle.width,100); near(s.paddle.height,12); near(s.paddle.speed,400);
  assert.ok(s.paddle.x >= -EPS && s.paddle.x <= 700+EPS);
  near(s.ball.radius,8);
  assert.equal(s.bricks.length,24);
  for (let r=0;r<3;r++) for (let c=0;c<8;c++) {
    const b=s.bricks[r*8+c];
    assert.equal(b.id,`r${r}c${c}`);
    near(b.x,45+c*90); near(b.y,60+r*30); near(b.width,80);near(b.height,20);
    assert.equal(typeof b.active,'boolean');
  }
  assert.ok(Number.isInteger(s.score) && s.score>=0 && s.score%10===0);
  assert.ok(Number.isInteger(s.lives) && s.lives>=0 && s.lives<=3);
  assert.doesNotThrow(()=>JSON.stringify(s));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(s)),s,'state must be JSON-roundtrippable');
}
function fixture(ball, { active = ['r2c7'], score=0, lives=3, paddleX=350, status='playing' } = {}) {
  const s=createInitialState();
  Object.assign(s.ball,ball);
  s.paddle.x=paddleX;s.score=score;s.lives=lives;s.status=status;
  for(const b of s.bricks) b.active=active.includes(b.id);
  return s;
}
function run(s,input={},dt=0.1) {
  const before=clone(s);
  const result=updateGame(s,input,dt);
  assert.deepStrictEqual(s,before,'updateGame mutated supplied input state');
  noSharedRequiredObjects(s,result);
  invariants(result);
  return result;
}
function brick(s,id) { return s.bricks.find(b=>b.id===id); }
function equalGameplay(a,b) {
  assert.deepStrictEqual(publicProjection(a),publicProjection(b));
}

// 28 top-level tests: one identifier per SRS matrix row.
test('BRICK-T01 fresh complete initial states and required exports',()=>{
  for(const f of [createInitialState,updateGame,resetGame]) assert.equal(typeof f,'function');
  const a=createInitialState(),b=createInitialState(); invariants(a);invariants(b);
  assert.equal(a.status,'playing');assert.equal(a.score,0);assert.equal(a.lives,3);
  assert.deepStrictEqual(a.paddle,{x:350,y:460,width:100,height:12,speed:400});
  assert.deepStrictEqual(a.ball,{x:400,y:440,radius:8,vx:160,vy:-200});
  assert.equal(a.bricks.filter(b=>b.active).length,24);
  equalGameplay(a,b);noSharedRequiredObjects(a,b);
});
test('BRICK-T02 brick identifiers, geometry, and row-major ordering',()=>{
  const s=createInitialState();invariants(s);
  for(let r=0;r<3;r++) for(let c=0;c<8;c++) {
    const b=s.bricks[r*8+c];assert.deepStrictEqual(
      {id:b.id,x:b.x,y:b.y,width:b.width,height:b.height,active:b.active},
      {id:`r${r}c${c}`,x:45+c*90,y:60+r*30,width:80,height:20,active:true});
  }
});
test('BRICK-T03 right movement 400 px/s',()=>{
  const s=run(createInitialState(),{right:true},0.1);
  near(s.paddle.x,390);near(s.paddle.y,460);near(s.ball.x,416);near(s.ball.y,420);
});
test('BRICK-T04 left movement 400 px/s',()=>{
  const s=run(createInitialState(),{left:true},0.1);
  near(s.paddle.x,310);
});
test('BRICK-T05 paddle clamps to both boundaries',()=>{
  const a=createInitialState();a.paddle.x=695;near(run(a,{right:true}).paddle.x,700);
  const b=createInitialState();b.paddle.x=5;near(run(b,{left:true}).paddle.x,0);
});
test('BRICK-T06 unobstructed ball displacement',()=>{
  const s=fixture({x:400,y:300,vx:160,vy:-200});const o=run(s,{},0.1);
  near(o.ball.x,416);near(o.ball.y,280);near(o.ball.vx,160);near(o.ball.vy,-200);
});
test('BRICK-T07 left wall overshoot and remaining-time reflection',()=>{
  const o=run(fixture({x:10,y:300,vx:-160,vy:-200}),{},0.05);
  near(o.ball.x,14);near(o.ball.y,290);near(o.ball.vx,160);near(o.ball.vy,-200);
});
test('BRICK-T08 right wall overshoot and remaining-time reflection',()=>{
  const o=run(fixture({x:790,y:300,vx:160,vy:-200}),{},0.05);
  near(o.ball.x,786);near(o.ball.y,290);near(o.ball.vx,-160);near(o.ball.vy,-200);
});
test('BRICK-T09 top wall overshoot and remaining-time reflection',()=>{
  const o=run(fixture({x:400,y:10,vx:160,vy:-200}),{},0.05);
  near(o.ball.x,408);near(o.ball.y,16);near(o.ball.vx,160);near(o.ball.vy,200);
});
test('BRICK-T10 descending paddle contact preserves vx and reverses vy',()=>{
  const o=run(fixture({x:400,y:440,vx:160,vy:200}),{},0.1);
  near(o.ball.x,416);near(o.ball.y,444);near(o.ball.vx,160);near(o.ball.vy,-200);
  assert.equal(o.lives,3);
});
test('BRICK-T11 separating paddle contact does not retrigger',()=>{
  const o=run(fixture({x:400,y:452,vx:160,vy:-200}),{},0.05);
  near(o.ball.x,408);near(o.ball.y,442);near(o.ball.vy,-200);
});
test('BRICK-T12 active brick contact deactivates once and adds 10',()=>{
  const s=fixture({x:85,y:45,vx:0,vy:200},{active:['r0c0','r2c7']});
  const o=run(s,{},0.1);
  assert.equal(brick(o,'r0c0').active,false);assert.equal(brick(o,'r2c7').active,true);
  assert.equal(o.score,10);near(o.ball.vy,-200);near(o.ball.y,39);
});
test('BRICK-T13 inactive brick does not collide or award points',()=>{
  const o=run(fixture({x:85,y:45,vx:0,vy:200}),{},0.1);
  assert.equal(o.score,0);near(o.ball.y,65);near(o.ball.vy,200);
});
test('BRICK-T14 high-speed swept collision prevents tunneling',()=>{
  const s=fixture({x:85,y:30,vx:0,vy:2000},{active:['r0c0','r2c7']});
  const o=run(s,{},0.1);
  assert.equal(brick(o,'r0c0').active,false);assert.equal(o.score,10);
  assert.equal(brick(o,'r2c7').active,true);
  // A wall reflection may follow the brick impact during this long, high-speed step.
});
test('BRICK-T15 bottom exit subtracts one life and resets only ball',()=>{
  const s=fixture({x:400,y:507,vx:0,vy:200},{active:['r0c0','r2c7'],score:50,lives:3,paddleX:210});
  const o=run(s,{},0.01);
  assert.equal(o.lives,2);assert.equal(o.status,'playing');assert.equal(o.score,50);
  near(o.paddle.x,210);assert.deepStrictEqual(o.ball,{x:400,y:440,radius:8,vx:160,vy:-200});
  assert.deepStrictEqual(o.bricks,s.bricks);
});
test('BRICK-T16 third life loss freezes at exit position and marks lost',()=>{
  const o=run(fixture({x:400,y:507,vx:0,vy:200},{lives:1}),{},0.01);
  assert.equal(o.lives,0);assert.equal(o.status,'lost');assert.ok(o.ball.y>508);
  assert.ok(o.ball.y<508.000001,`exit position should not advance entire frame: ${o.ball.y}`);
  near(o.ball.vy,200);
});
test('BRICK-T17 final active brick wins immediately, score 240',()=>{
  const o=run(fixture({x:85,y:45,vx:0,vy:200},{active:['r0c0'],score:230}),{},0.1);
  assert.equal(o.status,'won');assert.equal(o.score,240);
  assert.ok(o.bricks.every(b=>!b.active));near(o.ball.y,52);near(o.ball.vy,-200);
});
test('BRICK-T18 pause toggle stops entire update',()=>{
  const s=createInitialState(),o=run(s,{togglePause:true,right:true},0.1);
  assert.equal(o.status,'paused');assert.deepStrictEqual(o.paddle,s.paddle);
  assert.deepStrictEqual(o.ball,s.ball);assert.deepStrictEqual(o.bricks,s.bricks);
  assert.equal(o.lives,s.lives);assert.equal(o.score,s.score);
});
test('BRICK-T19 resume toggle stops entire update',()=>{
  const s=createInitialState();s.status='paused';
  const o=run(s,{togglePause:true,left:true},0.1);
  assert.equal(o.status,'playing');assert.deepStrictEqual(o.paddle,s.paddle);
  assert.deepStrictEqual(o.ball,s.ball);assert.deepStrictEqual(o.bricks,s.bricks);
});
test('BRICK-T20 paused and terminal states freeze; terminal toggle ignored',()=>{
  for(const status of ['paused','won','lost']) {
    const s=createInitialState();s.status=status;if(status==='lost')s.lives=0;
    const o=run(s,{left:true,right:false},0.1);equalGameplay(s,o);
    if(status!=='paused') equalGameplay(s,run(s,{togglePause:true},0.1));
  }
});
test('BRICK-T21 resetGame restores initial values with independent object graphs',()=>{
  const altered=createInitialState();altered.score=70;altered.lives=1;
  altered.status='paused';altered.ball.x=100;altered.bricks[0].active=false;
  const a=resetGame(),b=resetGame();invariants(a);invariants(b);
  equalGameplay(a,createInitialState());equalGameplay(a,b);
  noSharedRequiredObjects(a,b);noSharedRequiredObjects(a,altered);
});
test('BRICK-T22 same state and input sequence is deterministic',()=>{
  const steps=[ [{right:true},0.09],[{},0.08],[{left:true},0.1],[{},0.07],
    [{togglePause:true},0.06],[{},0.04],[{togglePause:true},0.1],[{},0.1] ];
  function simulate() {let s=createInitialState();for(const [input,dt] of steps)s=run(s,input,dt);return s;}
  assert.deepStrictEqual(simulate(),simulate());
});
test('BRICK-T23 frozen input graph is not mutated and result is fresh',()=>{
  const s=deepFreeze(createInitialState());
  const o=updateGame(s,{right:true},0.1);noSharedRequiredObjects(s,o);
  invariants(o);near(o.paddle.x,390);
  assert.equal(s.paddle.x,350);
  for(const b of s.bricks) assert.equal(b.active,true);
});
test('BRICK-T24 dt rejects invalid values and accepts inclusive endpoints',()=>{
  for(const dt of [-0.001,0.100001,NaN,Infinity,-Infinity,'0.05',null,undefined]) {
    assert.throws(()=>updateGame(createInitialState(),{},dt),RangeError,`dt ${String(dt)}`);
  }
  assert.throws(()=>updateGame(createInitialState(),{}),RangeError,'missing dt');
  invariants(updateGame(createInitialState(),{},0));
  invariants(updateGame(createInitialState(),{},0.1));
});
test('BRICK-T25 simultaneous left and right cancel',()=>{
  near(run(createInitialState(),{left:true,right:true},0.1).paddle.x,350);
});
test('BRICK-T26 dt=0 freezes gameplay even at contact; toggle may change status',()=>{
  const s=createInitialState();const o=run(s,{right:true},0);equalGameplay(o,s);
  const contact=fixture({x:85,y:52,vx:0,vy:200},{active:['r0c0','r2c7']});
  equalGameplay(run(contact,{},0),contact);
  const toggled=run(contact,{togglePause:true},0);
  assert.equal(toggled.status,'paused');
  assert.deepStrictEqual(toggled.ball,contact.ball);
  assert.deepStrictEqual(toggled.bricks,contact.bricks);
  assert.equal(toggled.score,contact.score);assert.equal(toggled.lives,contact.lives);
});
test('BRICK-T27 exact bottom threshold is strict; beyond exits immediately',()=>{
  const exact=fixture({x:400,y:508,vx:0,vy:0},{lives:3});
  const a=run(exact,{},0.1);assert.equal(a.lives,3);near(a.ball.y,508);
  const beyond=fixture({x:400,y:508.00001,vx:0,vy:0},{lives:3});
  const b=run(beyond,{},0.1);assert.equal(b.lives,2);
  assert.deepStrictEqual(b.ball,{x:400,y:440,radius:8,vx:160,vy:-200});
});
test('BRICK-T28 simultaneous wall axes and adjacent-brick corner impacts',()=>{
  // Physically realizable dual-wall contact: both axes must reflect once.
  const wall=run(fixture({x:10,y:10,vx:-200,vy:-200}),{},0.05);
  near(wall.ball.x,16);near(wall.ball.y,16);near(wall.ball.vx,200);near(wall.ball.vy,200);
  // Bricks r0c0 and r0c1 have a 10px gap; an 8px circle can strike
  // their two facing upper corners at the same instant.
  const startY=60-Math.sqrt(8*8-5*5)-4;
  const s=fixture({x:130,y:startY,vx:0,vy:200},
    {active:['r0c0','r0c1','r2c7']});
  const a=run(s,{},0.05),b=run(clone(s),{},0.05);
  assert.equal(brick(a,'r0c0').active,false);
  assert.equal(brick(a,'r0c1').active,false);
  assert.equal(brick(a,'r2c7').active,true);
  assert.equal(a.score,20);
  assert.equal(a.status,'playing');
  assert.deepStrictEqual(a,b,'simultaneous contact must be deterministic');
  near(Math.hypot(a.ball.vx,a.ball.vy),200, 'combined collision speed magnitude');
});
