// 월성 쌓기·수성 게임 v9: 화면 없이 돌아가는 게임 규칙(지형, 블록, 설계도, 적 길찾기, 수성 전투, 레벨).
// node 에서도 그대로 불러 시험할 수 있도록 브라우저 기능을 쓰지 않는다.
export const W=22,H=16,MAXH=3;
// 반월성: 남쪽은 남천을 따라 곧고, 북쪽은 반달처럼 둥글게 부푼 언덕(동서 약 890m, 남북 약 260m 비율을 칸에 맞춰 줄임).
const CX=10.5,CZ=12.4,RX=9.6,RZ=7.4;
export const RIVER_Z=14; // z>=14 는 남천
export function terrainAt(x,z){
 if(z>=RIVER_Z)return 'river';
 if(z<=12){const dx=(x-CX)/RX,dz=(z-CZ)/RZ;if(dx*dx+dz*dz<1)return 'hill'}
 return 'ground';
}
export const PALACE=[[10,9],[11,9],[10,10],[11,10]];
export const isPalace=(x,z)=>PALACE.some(p=>p[0]===x&&p[1]===z);
export const BLOCKS={
 earth:{name:'흙벽',sub:'월성 토성',cost:1,hp:50,kind:'wall',icon:'earth'},
 stone:{name:'돌벽',sub:'튼튼한 석축',cost:3,hp:120,kind:'wall',icon:'stone'},
 gate:{name:'성문',sub:'아주 튼튼',cost:4,hp:170,kind:'wall',icon:'gate',max:1},
 tower:{name:'망루',sub:'화살을 쏴요',cost:5,hp:60,kind:'top',icon:'tower',range:3.4,dmg:9,cd:1.0},
 crossbow:{name:'쇠뇌',sub:'큰 화살 한 방',cost:8,hp:50,kind:'top',icon:'crossbow',range:5.2,dmg:42,cd:2.6,unlock:2},
 house:{name:'기와집',sub:'마을 꾸미기',cost:1,hp:30,kind:'top',icon:'house'},
 moat:{name:'해자',sub:'물길 파기',cost:1,hp:0,kind:'moat',icon:'moat'}
};
export const BLOCK_ORDER=['earth','stone','gate','tower','crossbow','house','moat'];
export const ENEMIES={
 soldier:{name:'창병',hp:30,speed:.9,dps:10,bounty:1,from:1},
 ladder:{name:'사다리병',hp:26,speed:1,dps:6,bounty:2,climb:1,from:2},
 rider:{name:'기마병',hp:42,speed:1.75,dps:8,bounty:2,from:3},
 ram:{name:'충차',hp:190,speed:.45,dps:45,bounty:6,from:4},
 chief:{name:'적장',hp:520,speed:.6,dps:30,bounty:20,from:5}
};
export const PALACE_HP=300;
export const levelInfo=L=>({level:L,duration:Math.min(150,60+15*(L-1)),budget:150+40*(L-1),hpMul:1+.5*(L-1)+.04*(L-1)*(L-1),count:10+7*L,reward:25+5*L});
export const fmtTime=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};

const key=(x,z)=>x+','+z;
export const inside=(x,z)=>x>=0&&z>=0&&x<W&&z<H;
export function emptyPlan(){return {stacks:{},moat:{}}}
export function clonePlan(p){const s={};for(const k in p.stacks)s[k]=p.stacks[k].slice();return {stacks:s,moat:{...p.moat}}}
export function stackAt(p,x,z){return p.stacks[key(x,z)]||[]}
export function planCost(p){let c=0;for(const k in p.stacks)for(const b of p.stacks[k])c+=BLOCKS[b].cost;for(const k in p.moat)if(p.moat[k])c+=BLOCKS.moat.cost;return c}
// 블록을 놓을 수 있는지: 이유를 한국어로 돌려준다(null 이면 가능).
export function whyNot(p,x,z,id,level=99){
 const b=BLOCKS[id];if(!b||!inside(x,z))return '여기는 놓을 수 없어요.';
 if(b.unlock&&level<b.unlock)return b.name+'는 '+b.unlock+'레벨부터 쓸 수 있어요.';
 if(isPalace(x,z))return '왕궁 자리예요. 왕궁을 둘러싸서 지켜 주세요.';
 const t=terrainAt(x,z),k=key(x,z),s=p.stacks[k]||[];
 if(t==='river')return '남천 강물 위에는 지을 수 없어요.';
 if(id==='moat'){if(t==='hill')return '해자는 언덕 아래 평지에 파요.';if(s.length)return '블록이 있는 곳은 먼저 부숴 주세요.';if(p.moat[k])return '이미 해자예요.';return null}
 if(p.moat[k])return '해자 물 위에는 쌓을 수 없어요.';
 const top=s[s.length-1];
 if(top&&BLOCKS[top].kind==='top')return BLOCKS[top].name+' 위에는 더 쌓을 수 없어요.';
 if(s.length>=MAXH)return '최대 '+MAXH+'층까지 쌓을 수 있어요.';
 if(id==='gate'&&s.length)return '성문은 땅 위에 바로 세워요.';
 if(s.includes('gate')&&b.kind==='wall')return '성문 위에는 망루나 집만 올려요.';
 return null;
}
export function place(p,x,z,id){
 const k=key(x,z);
 if(id==='moat'){p.moat[k]=true;return}
 (p.stacks[k]||(p.stacks[k]=[])).push(id);
}
// 맨 위 블록 하나(또는 해자)를 없앤다. 없앤 것을 돌려준다.
export function removeTop(p,x,z){
 const k=key(x,z),s=p.stacks[k];
 if(s&&s.length){const b=s.pop();if(!s.length)delete p.stacks[k];return b}
 if(p.moat[k]){delete p.moat[k];return 'moat'}
 return null;
}

// ---------- 월성 복원 설계도 ----------
// 발굴로 확인된 월성의 모습: 언덕 가장자리를 두른 흙 성벽(토성), 북쪽 바깥의 해자, 성문 터.
// 남쪽은 남천과 벼랑이 막아 주어 성벽이 낮다.
export function blueprint(){
 const plan=emptyPlan(),edge=[];
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){
  if(terrainAt(x,z)!=='hill')continue;
  const out=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>terrainAt(x+dx,z+dz)!=='hill');
  if(out)edge.push([x,z]);
 }
 const gates=new Set();
 const pick=(f)=>{let best=null;for(const e of edge){if(!best||f(e)<f(best))best=e}gates.add(key(...best))};
 pick(([x,z])=>z*3+Math.abs(x-10.5));        // 북문
 pick(([x,z])=>x+10*Math.abs(z-9.5));        // 서문
 pick(([x,z])=>(W-1-x)+10*Math.abs(z-9.5));  // 동문
 for(const [x,z] of edge){
  const k=key(x,z);
  if(gates.has(k)){plan.stacks[k]=['gate'];continue}
  plan.stacks[k]=z>=12?['earth']:['earth','earth'];
 }
 // 해자: 북쪽·동쪽·서쪽 성벽 바로 바깥 평지
 for(const [x,z] of edge){
  if(z>=12)continue;
  for(const [dx,dz] of [[0,-1],[-1,0],[1,0],[-1,-1],[1,-1]]){
   const nx=x+dx,nz=z+dz;
   if(inside(nx,nz)&&terrainAt(nx,nz)==='ground'&&nz<=11)plan.moat[key(nx,nz)]=true;
  }
 }
 // 성문 앞은 다리처럼 해자를 비워 둔다
 for(const g of gates){const [x,z]=g.split(',').map(Number);for(const [dx,dz] of [[0,-1],[-1,0],[1,0]])delete plan.moat[key(x+dx,z+dz)]}
 return plan;
}
// 설계도와 얼마나 맞는지(0~1)
export function blueprintProgress(p,bp){
 let need=0,have=0;
 for(const k in bp.stacks){const want=bp.stacks[k],got=p.stacks[k]||[];need+=want.length;for(let i=0;i<want.length;i++)if(got[i]===want[i])have++}
 for(const k in bp.moat){need++;if(p.moat[k])have++}
 return need?have/need:0;
}
// 설계도에서 이 칸에 다음으로 놓을 블록(없으면 null)
export function blueprintNext(p,bp,x,z){
 const k=key(x,z);
 if(bp.moat[k]&&!p.moat[k]&&!(p.stacks[k]||[]).length)return 'moat';
 const want=bp.stacks[k];if(!want)return null;
 const got=p.stacks[k]||[];
 for(let i=0;i<got.length;i++)if(got[i]!==want[i])return null;
 return want[got.length]||null;
}

// ---------- 수성 전투 ----------
function rng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function spawnPlan(L,seed){
 const info=levelInfo(L),r=rng(seed),list=[];
 const kinds=Object.entries(ENEMIES).filter(([,e])=>e.from<=L&&e.from<5).map(([k])=>k);
 for(let i=0;i<info.count;i++){
  const t=2+(info.duration*.82-2)*(i/info.count)+r()*1.2;
  let kind='soldier';const roll=r();
  if(kinds.includes('ram')&&roll<.1)kind='ram';else if(kinds.includes('rider')&&roll<.32)kind='rider';else if(kinds.includes('ladder')&&roll<.55)kind='ladder';
  list.push({t,kind,edge:Math.floor(r()*3),u:r()});
 }
 if(L%5===0)list.push({t:info.duration*.45,kind:'chief',edge:0,u:.5});
 return list.sort((a,b)=>a.t-b.t);
}
function edgeCell(edge,u){
 if(edge===0)return [Math.round(1+u*(W-3)),0];      // 북쪽
 const z=Math.round(u*11);return edge===1?[0,z]:[W-1,z]; // 서쪽, 동쪽
}
export function createBattle(plan,L,seed=L*7919+13){
 const info=levelInfo(L),live=clonePlan(plan);
 const hp={};for(const k in live.stacks)hp[k]=live.stacks[k].map(b=>BLOCKS[b].hp);
 const st={level:L,info,live,hp,t:0,palace:PALACE_HP,enemies:[],shots:[],events:[],kills:0,bounty:0,over:null,spawns:spawnPlan(L,seed),nextId:1,cool:{},fields:null};
 st.fields={walk:flow(st,0),climb:flow(st,1)};
 return st;
}
function stackHp(st,k){return (st.hp[k]||[]).reduce((a,b)=>a+b,0)}
function blocked(st,k,climb){const s=st.live.stacks[k];if(!s||!s.length)return false;if(climb&&s.length<=climb&&!s.includes('gate'))return false;return true}
function enterCost(st,x,z,climb){
 const k=key(x,z),t=terrainAt(x,z);
 let c=t==='river'?7:st.live.moat[k]?3.5:1;
 const s=st.live.stacks[k];
 if(s&&s.length){if(climb&&!blocked(st,k,climb))c+=2.5;else c+=1+stackHp(st,k)/9}
 return c;
}
// 왕궁까지 가는 비용 지도(다익스트라). 성벽은 무너뜨리는 데 걸리는 시간만큼 비싸다.
function flow(st,climb){
 const dist=new Float32Array(W*H).fill(1e9),done=new Uint8Array(W*H),q=[];
 for(const [x,z] of PALACE){dist[z*W+x]=0;q.push([0,x,z])}
 while(q.length){
  let bi=0;for(let i=1;i<q.length;i++)if(q[i][0]<q[bi][0])bi=i;
  const [d,x,z]=q[bi];q[bi]=q[q.length-1];q.pop();
  const i=z*W+x;if(done[i])continue;done[i]=1;
  const here=isPalace(x,z)?0:enterCost(st,x,z,climb);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,nz=z+dz;if(!inside(nx,nz))continue;const j=nz*W+nx;
   const nd=d+here;if(nd<dist[j]){dist[j]=nd;q.push([nd,nx,nz])}
  }
 }
 return dist;
}
function nextCell(st,e){
 const f=e.climb?st.fields.climb:st.fields.walk;
 let best=null,bv=1e9;
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const nx=e.cx+dx,nz=e.cz+dz;if(!inside(nx,nz))continue;
  const v=isPalace(nx,nz)?-1:f[nz*W+nx]+enterCost(st,nx,nz,e.climb);
  if(v<bv){bv=v;best=[nx,nz]}
 }
 return best;
}
function damageCell(st,k,amount){
 const hs=st.hp[k];if(!hs||!hs.length)return;
 hs[hs.length-1]-=amount;
 if(hs[hs.length-1]<=0){
  hs.pop();const b=st.live.stacks[k].pop();
  if(!st.live.stacks[k].length){delete st.live.stacks[k];delete st.hp[k]}
  const [x,z]=k.split(',').map(Number);
  st.events.push({type:'break',x,z,block:b});
  st.fields={walk:flow(st,0),climb:flow(st,1)};
 }else st.events.push({type:'hit',k});
}
export function addDuringBattle(st,x,z,id){
 const k=key(x,z);place(st.live,x,z,id);
 if(id!=='moat'){(st.hp[k]||(st.hp[k]=[])).push(BLOCKS[id].hp)}
 st.fields={walk:flow(st,0),climb:flow(st,1)};
}
export function removeDuringBattle(st,x,z){
 const k=key(x,z),b=removeTop(st.live,x,z);
 if(b&&b!=='moat'&&st.hp[k]){st.hp[k].pop();if(!st.hp[k].length)delete st.hp[k]}
 st.fields={walk:flow(st,0),climb:flow(st,1)};return b;
}
export function shooters(st){
 const list=[];
 for(const k in st.live.stacks){
  const s=st.live.stacks[k],top=s[s.length-1],b=BLOCKS[top];
  if(!b.range)continue;
  const [x,z]=k.split(',').map(Number);
  list.push({k,x,z,h:s.length,block:top,range:b.range+.7*(s.length-1)+(terrainAt(x,z)==='hill'?.5:0),dmg:b.dmg,cd:b.cd});
 }
 list.push({k:'palace',x:10.5,z:9.5,h:1,block:'palace',range:3.6,dmg:8,cd:.9});
 return list;
}
export function step(st,dt){
 if(st.over)return st;
 st.t+=dt;
 while(st.spawns.length&&st.spawns[0].t<=st.t){
  const s=st.spawns.shift(),e0=ENEMIES[s.kind],[cx,cz]=edgeCell(s.edge,s.u);
  const hp=Math.round(e0.hp*st.info.hpMul);
  st.enemies.push({id:st.nextId++,kind:s.kind,hp,max:hp,x:cx,z:cz,cx,cz,speed:e0.speed*(1+.04*(st.level-1)),dps:e0.dps*(1+.15*(st.level-1)),climb:e0.climb||0,bounty:e0.bounty,attacking:false,face:0});
  st.events.push({type:'spawn',kind:s.kind});
 }
 for(const e of st.enemies){
  if(e.hp<=0)continue;
  const n=nextCell(st,e);if(!n)continue;
  const [nx,nz]=n,k=key(nx,nz);
  const pal=isPalace(nx,nz),wall=!pal&&blocked(st,k,e.climb);
  e.face=Math.atan2(nx-e.x,nz-e.z);
  if(pal||wall){
   // 다음 칸 앞에서 공격
   const dx=nx-e.x,dz=nz-e.z,d=Math.hypot(dx,dz);
   if(d>.62){const m=Math.min(d-.6,e.speed*dt);e.x+=dx/d*m;e.z+=dz/d*m;e.attacking=false}
   else{e.attacking=true;if(pal){st.palace-=e.dps*dt;if(Math.random()<dt*2)st.events.push({type:'palaceHit'})}else damageCell(st,k,e.dps*dt)}
  }else{
   e.attacking=false;
   const ck=key(e.cx,e.cz);
   let sp=e.speed;const t=terrainAt(e.cx,e.cz);
   if(t==='river')sp*=.3;else if(st.live.moat[ck])sp*=.4;
   if(st.live.stacks[ck])sp*=.55; // 사다리로 넘는 중
   const dx=nx-e.x,dz=nz-e.z,d=Math.hypot(dx,dz),m=Math.min(d,sp*dt);
   if(d>1e-6){e.x+=dx/d*m;e.z+=dz/d*m}
   if(Math.abs(e.x-e.cx)+Math.abs(e.z-e.cz)>.5){e.cx=nx;e.cz=nz}
  }
 }
 if(st.palace<=0){st.palace=0;st.over='lost';st.events.push({type:'lost'});return st}
 // 망루·쇠뇌·왕궁 궁수
 for(const s of shooters(st)){
  st.cool[s.k]=(st.cool[s.k]||0)-dt;if(st.cool[s.k]>0)continue;
  const f=st.fields.walk;let target=null,tv=1e9;
  for(const e of st.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-s.x,e.z-s.z);if(d>s.range)continue;const v=f[e.cz*W+e.cx]+d*.01;if(v<tv){tv=v;target=e}}
  if(!target)continue;
  st.cool[s.k]=s.cd;
  const fly=Math.hypot(target.x-s.x,target.z-s.z)/14;
  st.shots.push({from:s,to:target.id,t:fly,dmg:s.dmg,block:s.block});
  st.events.push({type:'shoot',k:s.k,from:{x:s.x,z:s.z,h:s.h},to:{x:target.x,z:target.z},fly,block:s.block});
 }
 for(const sh of st.shots){sh.t-=dt;if(sh.t<=0){const e=st.enemies.find(e=>e.id===sh.to);if(e&&e.hp>0){e.hp-=sh.dmg;if(e.hp<=0){st.kills++;st.bounty+=e.bounty;st.events.push({type:'kill',x:e.x,z:e.z,kind:e.kind,bounty:e.bounty})}}}}
 st.shots=st.shots.filter(s=>s.t>0);
 st.enemies=st.enemies.filter(e=>e.hp>0);
 if(st.t>=st.info.duration){st.over='won';st.events.push({type:'won'})}
 return st;
}
// 전체 전투를 빠르게 돌려 본다(시험·밸런스용)
export function simulate(plan,L,seed){const st=createBattle(plan,L,seed);while(!st.over)step(st,.05);return st}
