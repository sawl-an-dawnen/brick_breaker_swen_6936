// VALIDATION-ONLY REFERENCE FIXTURE. Never provide to development AIs before CP-02.
// Independent test-calibration implementation, NOT an assignment deliverable.
const R=8, TIME_EPS=1e-9, GEOM_EPS=1e-10;
export function createInitialState() {
  const bricks=[];
  for(let r=0;r<3;r++) for(let c=0;c<8;c++)
    bricks.push({id:`r${r}c${c}`,x:45+90*c,y:60+30*r,width:80,height:20,active:true});
  return {status:'playing',paddle:{x:350,y:460,width:100,height:12,speed:400},
    ball:{x:400,y:440,radius:R,vx:160,vy:-200},bricks,score:0,lives:3};
}
export function resetGame() {return createInitialState();}
function copy(s) {return structuredClone(s);}
function candidateRect(ball,rect,limit,kind,idx=0) {
  const {x,y,vx,vy,radius:r}=ball;
  const left=rect.x,right=rect.x+rect.width,top=rect.y,bottom=rect.y+rect.height;
  const hits=[];
  const add=(t,nx,ny)=>{
    if(t < -GEOM_EPS || t > limit+GEOM_EPS) return;
    if(vx*nx+vy*ny >= -GEOM_EPS) return;
    hits.push({t:Math.max(0,t),nx,ny,kind,idx});
  };
  if(vx>0) {
    const t=(left-r-x)/vx, cy=y+vy*t;
    if(cy>=top-GEOM_EPS&&cy<=bottom+GEOM_EPS) add(t,-1,0);
  } else if(vx<0) {
    const t=(right+r-x)/vx,cy=y+vy*t;
    if(cy>=top-GEOM_EPS&&cy<=bottom+GEOM_EPS) add(t,1,0);
  }
  if(vy>0) {
    const t=(top-r-y)/vy,cx=x+vx*t;
    if(cx>=left-GEOM_EPS&&cx<=right+GEOM_EPS) add(t,0,-1);
  } else if(vy<0) {
    const t=(bottom+r-y)/vy,cx=x+vx*t;
    if(cx>=left-GEOM_EPS&&cx<=right+GEOM_EPS) add(t,0,1);
  }
  const a=vx*vx+vy*vy;
  if(a>0) for(const [cx,cy,sx,sy] of [
    [left,top,-1,-1],[right,top,1,-1],[left,bottom,-1,1],[right,bottom,1,1]
  ]) {
    const dx=x-cx,dy=y-cy,b=2*(dx*vx+dy*vy),cc=dx*dx+dy*dy-r*r;
    const disc=b*b-4*a*cc;
    if(disc<0) continue;
    for(const t of [(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)]) {
      const nx0=x+vx*t-cx,ny0=y+vy*t-cy;
      if(nx0*sx < -GEOM_EPS || ny0*sy < -GEOM_EPS) continue;
      const nlen=Math.hypot(nx0,ny0);
      if(nlen>GEOM_EPS) add(t,nx0/nlen,ny0/nlen);
    }
  }
  // Face/corner multiple descriptions of the same contact are deduplicated.
  hits.sort((a,b)=>a.t-b.t);
  return hits.length ? hits[0] : null;
}
function contacts(b,s,limit) {
  const found=[];
  const add=(t,nx,ny,kind,idx=0)=>{
    if(t>=-GEOM_EPS&&t<=limit+GEOM_EPS&&b.vx*nx+b.vy*ny < -GEOM_EPS)
      found.push({t:Math.max(0,t),nx,ny,kind,idx});
  };
  if(b.vx<0)add((b.radius-b.x)/b.vx,1,0,'wall');
  if(b.vx>0)add((800-b.radius-b.x)/b.vx,-1,0,'wall');
  if(b.vy<0)add((b.radius-b.y)/b.vy,0,1,'wall');
  if(b.vy>0) {
    const hit=candidateRect(b,s.paddle,limit,'paddle');
    if(hit) found.push(hit);
  }
  for(let i=0;i<s.bricks.length;i++) if(s.bricks[i].active){
    const hit=candidateRect(b,s.bricks[i],limit,'brick',i);
    if(hit) found.push(hit);
  }
  return found;
}
function exitLife(s) {
  s.lives-=1;
  if(s.lives===0) s.status='lost';
  else Object.assign(s.ball,{x:400,y:440,vx:160,vy:-200});
}
export function updateGame(state,input={},dt) {
  if(typeof dt!=='number'||!Number.isFinite(dt)||dt<0||dt>0.1) throw new RangeError('dt must be finite and in [0, 0.1]');
  const s=copy(state);input??={};
  if(s.status==='won'||s.status==='lost')return s;
  if(input.togglePause) {s.status=s.status==='paused'?'playing':'paused';return s;}
  if(s.status==='paused'||dt===0)return s;
  const dir=Number(!!input.right)-Number(!!input.left);
  s.paddle.x=Math.max(0,Math.min(700,s.paddle.x+400*dir*dt));
  let remain=dt;
  const b=s.ball;
  if(b.y-b.radius>500){exitLife(s);return s;}
  // Loop continues until consumed; precision guard prevents nonprogress at zero-time contacts.
  for(let iteration=0;remain>0 && iteration<2000;iteration++) {
    const found=contacts(b,s,remain);
    let tExit=Infinity;
    if(b.vy>0) {
      if(b.y>=500+b.radius) tExit=0;
      else tExit=(500+b.radius-b.y)/b.vy;
    }
    const sorted=found.sort((a,c)=>a.t-c.t);
    const tContact=sorted.length?sorted[0].t:Infinity;
    if(tExit<=remain && tExit<tContact-TIME_EPS) {
      b.x+=b.vx*tExit;b.y+=b.vy*tExit;
      // strict bottom threshold: smallest representable value beyond equality
      b.y=508+Number.EPSILON*512;
      exitLife(s);return s;
    }
    if(tContact>remain || !Number.isFinite(tContact)) {
      b.x+=b.vx*remain;b.y+=b.vy*remain;remain=0;break;
    }
    b.x+=b.vx*tContact;b.y+=b.vy*tContact;remain=Math.max(0,remain-tContact);
    const batch=sorted.filter(h=>Math.abs(h.t-tContact)<=TIME_EPS);
    batch.sort((a,c)=>({wall:0,paddle:1,brick:2}[a.kind]-{wall:0,paddle:1,brick:2}[c.kind]) || a.idx-c.idx);
    const hitBricks=new Set(batch.filter(h=>h.kind==='brick').map(h=>h.idx));
    for(const idx of hitBricks) if(s.bricks[idx].active){s.bricks[idx].active=false;s.score+=10;}
    const cleared=s.bricks.every(br=>!br.active);
    const paddle=batch.some(h=>h.kind==='paddle');
    if(paddle){b.vy=-Math.abs(b.vy);}
    else {
      const xAxis=batch.some(h=>Math.abs(h.nx)===1&&h.ny===0);
      const yAxis=batch.some(h=>Math.abs(h.ny)===1&&h.nx===0);
      if(xAxis)b.vx=-b.vx;
      if(yAxis)b.vy=-b.vy;
      for(const h of batch) if(Math.abs(h.nx)!==1&&Math.abs(h.ny)!==1){
        const dot=b.vx*h.nx+b.vy*h.ny;
        b.vx-=2*dot*h.nx;b.vy-=2*dot*h.ny;
      }
    }
    if(cleared){s.status='won';return s;}
    // Consume no artificial time; separating contact detection must prevent repeated events.
    if(tContact===0 && remain>0 && iteration>1900) throw Error('no collision progress');
  }
  return s;
}
