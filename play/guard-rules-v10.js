// 월성 수호대 v10: 신라 병사·인물·왕을 소환하고 합쳐서, 월성 둘레를 도는 침입군을 막는 디펜스 게임의 규칙.
// 화면 없이 돌아가서 node 로도 시험할 수 있다.
export const BW=380,BH=320;                // 놀이판(논리 좌표)
export const COLS=6,ROWS=3,SLOT=50;
export const GX=(BW-COLS*SLOT)/2,GY=(BH-ROWS*SLOT)/2;
export const LANE={x0:22,y0:22,x1:BW-22,y1:BH-22}; // 적이 도는 길(해자를 낀 성 바깥 길)
export const PERIM=2*((LANE.x1-LANE.x0)+(LANE.y1-LANE.y0));
export const CAP=100;                      // 이만큼 쌓이면 월성이 함락
export const WAVE_T=20,BOSS_T=60;
export const GRADES=[
 {id:1,name:'일반',color:'#d9d2c0',sell:8},
 {id:2,name:'희귀',color:'#5aa0e0',sell:25},
 {id:3,name:'영웅',color:'#a56ee0',sell:70},
 {id:4,name:'전설',color:'#f0b43c',sell:180},
 {id:5,name:'왕',color:'#ff5a4a',sell:500}
];
// kind: single 한 명, splash 둘레까지, pierce 여러 명 꿰뚫기, all 길 위 모두
export const UNITS={
 archer:{name:'궁병',g:1,dmg:11,rate:1.2,range:170,kind:'single',fact:'신라 군사는 활을 잘 쏘았어요. 성벽 위에서 화살로 성을 지켰지요.'},
 spear:{name:'창병',g:1,dmg:24,rate:1,range:115,kind:'single',fact:'창과 방패를 든 보병은 신라 군대의 기본이었어요.'},
 sling:{name:'투석병',g:1,dmg:9,rate:.8,range:150,kind:'splash',area:38,fact:'돌을 던져 여러 적을 한꺼번에 맞혀요. 산성에서는 돌이 중요한 무기였어요.'},
 drum:{name:'고수',g:1,dmg:5,rate:1,range:140,kind:'single',aura:{speed:.15},fact:'북소리로 군사들의 걸음과 공격을 맞췄어요. 옆 칸 병사의 공격이 빨라져요.'},
 crossbow:{name:'쇠뇌병',g:2,dmg:48,rate:.7,range:220,kind:'pierce',pierce:3,fact:'신라 쇠뇌는 아주 멀리 날아가 이웃 나라도 탐냈다고 해요.'},
 rider:{name:'기마궁수',g:2,dmg:19,rate:2,range:170,kind:'single',fact:'말을 타고 달리며 활을 쏘는 날랜 군사예요. 신라 무덤에서 말 탄 사람 모양 토기가 나왔어요.'},
 monk:{name:'승병',g:2,dmg:22,rate:1,range:140,kind:'single',stun:{p:.18,t:.7},fact:'나라가 위험할 때 스님들도 나라를 지켰어요. 가끔 적을 멈춰 세워요.'},
 hwarang:{name:'화랑',g:2,dmg:32,rate:1.6,range:120,kind:'single',fact:'신라의 젊은 인재 모임 화랑도. 몸과 마음을 함께 닦았어요.'},
 gukseon:{name:'국선',g:3,dmg:85,rate:1.8,range:140,kind:'splash',area:32,fact:'화랑들을 이끄는 우두머리를 국선이라 불렀어요.'},
 gujin:{name:'구진천',g:3,dmg:170,rate:.8,range:260,kind:'pierce',pierce:5,fact:'신라의 쇠뇌 장인. 당나라 황제가 그가 만든 쇠뇌를 탐냈다는 기록이 있어요.'},
 general:{name:'장군',g:3,dmg:65,rate:1.2,range:160,kind:'single',aura:{dmg:.2},fact:'군대를 이끄는 장군. 옆 칸 병사들이 더 세게 공격해요.'},
 ilgwan:{name:'천문관',g:3,dmg:42,rate:1,range:200,kind:'splash',area:45,slow:{k:.35,t:1.5},fact:'첨성대에서 하늘을 살피던 관리. 별의 기운으로 적을 느리게 해요.'},
 yusin:{name:'김유신',g:4,dmg:340,rate:1.5,range:175,kind:'splash',area:60,fact:'화랑 출신 장군. 삼국을 하나로 모으는 데 큰 공을 세웠어요.'},
 gwanchang:{name:'관창',g:4,dmg:260,rate:2.6,range:150,kind:'single',crit:.3,fact:'황산벌 싸움에서 용감하게 나선 어린 화랑이에요.'},
 wonhyo:{name:'원효',g:4,dmg:150,rate:1.2,range:230,kind:'splash',area:70,stun:{p:.25,t:1},fact:'모두가 쉽게 부처님 가르침을 알도록 노래하며 다닌 스님이에요.'},
 jinheung:{name:'진흥왕',g:5,dmg:900,rate:1.4,range:240,kind:'splash',area:80,aura:{dmg:.3,all:true},fact:'신라 땅을 크게 넓힌 왕. 순수비를 세워 넓힌 땅을 돌아보았어요. 모든 병사가 더 세져요.'},
 munmu:{name:'문무왕',g:5,dmg:1400,rate:.6,range:999,kind:'all',fact:'삼국 통일을 마무리한 왕. 죽어서 바다의 용이 되어 나라를 지키겠다고 했어요(대왕암).'},
 seondeok:{name:'선덕여왕',g:5,dmg:600,rate:1.2,range:260,kind:'splash',area:90,slow:{k:.5,t:2},aura:{speed:.3,all:true},fact:'신라 첫 여왕. 첨성대를 세웠다고 전해져요. 모든 병사가 빨라져요.'}
};
export const BY_GRADE=g=>Object.keys(UNITS).filter(k=>UNITS[k].g===g);
// 전설 조합법(정해진 셋을 모으면)
export const RECIPES=[
 {id:'yusin',need:['gukseon','general','hwarang']},
 {id:'gwanchang',need:['gukseon','hwarang','rider']},
 {id:'wonhyo',need:['ilgwan','monk','drum']}
];
// 월성과 신라 유물: 다섯 웨이브마다 셋 중 하나를 고른다
export const RELICS={
 mokgan:{name:'월성 해자 목간',fact:'월성 해자 진흙 속에서 글씨 쓴 나무 조각(목간)이 나왔어요. 신라 관청의 기록이에요.',effect:'적을 물리칠 때 금 +1'},
 smile:{name:'얼굴무늬 수막새',fact:'"신라의 미소"라 불리는 기와 끝 장식이에요.',effect:'소환 운 좋아짐(희귀·영웅 확률 증가)'},
 bell:{name:'성덕대왕신종',fact:'아름다운 소리로 유명한 큰 종. 소리가 멀리 퍼져요.',effect:'12초마다 종소리로 모든 적 1초 멈춤'},
 star:{name:'첨성대 별자리',fact:'첨성대는 별을 살피던 건물이에요.',effect:'치명타 15% (피해 2배)'},
 crown:{name:'신라 금관',fact:'나뭇가지와 사슴뿔 모양 장식이 달린 신라 왕의 금관이에요.',effect:'모든 피해 +20%'},
 dogu:{name:'토우',fact:'흙으로 빚은 작은 사람·동물 인형. 신라 사람들의 생활이 담겨 있어요.',effect:'소환 비용 15% 할인'},
 giwa:{name:'월성 기와',fact:'월성에서는 궁궐 지붕을 덮던 기와가 많이 나왔어요.',effect:'성이 버티는 적 수 +20'},
 dice:{name:'주령구',fact:'월지(안압지)에서 나온 14면 주사위. 놀이 벌칙이 새겨져 있어요.',effect:'주령구 굴리면 좋은 결과 확률 증가'}
};
export const SKILLS={
 moat:{name:'해자',cd:30,dur:6,desc:'해자에 물을 채워 모든 적이 6초 동안 아주 느려져요.'},
 drum:{name:'진군 북',cd:40,dur:8,desc:'8초 동안 모든 병사 공격이 50% 빨라져요.'}
};
// 주령구: 14면. 면마다 결과가 다르다(벌칙 면은 꽝)
export const DICE_FACES=[
 {t:'금화',v:'gold'},{t:'금화',v:'gold'},{t:'금화 듬뿍',v:'gold2'},{t:'희귀 병사',v:'g2'},{t:'희귀 병사',v:'g2'},{t:'희귀 병사',v:'g2'},
 {t:'영웅',v:'g3'},{t:'영웅',v:'g3'},{t:'전설!',v:'g4'},{t:'소리 없이 춤추기 (꽝)',v:'none'},{t:'노래 한 곡 부르기 (꽝)',v:'none'},
 {t:'행운석 2개',v:'stone2'},{t:'해자 바로 채우기',v:'moat'},{t:'왕의 부름?',v:'king'}
];

export function rng(seed){let s=(seed>>>0)||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296}}
export const slotXY=i=>({x:GX+(i%COLS+.5)*SLOT,y:GY+(Math.floor(i/COLS)+.5)*SLOT});
export function lanePos(s){
 s=((s%PERIM)+PERIM)%PERIM;const w=LANE.x1-LANE.x0,h=LANE.y1-LANE.y0;
 if(s<w)return {x:LANE.x0+s,y:LANE.y0};s-=w;
 if(s<h)return {x:LANE.x1,y:LANE.y0+s};s-=h;
 if(s<w)return {x:LANE.x1-s,y:LANE.y1};s-=w;
 return {x:LANE.x0,y:LANE.y1-s};
}
export function newGame(seed=Date.now()){
 return {seed,r:rng(seed),t:0,wave:0,waveT:3,gold:100,stones:1,summons:0,slots:Array(COLS*ROWS).fill(null),enemies:[],nextId:1,
  relics:{},skill:{moat:{cd:0,on:0},drum:{cd:0,on:0}},bellT:12,boss:null,over:null,kills:0,events:[],pendingRelic:null,spawnQ:[],seen:{}};
}
export const cap=st=>CAP+(st.relics.giwa||0)*20;
export function summonCost(st){return Math.round((20+st.summons*2)*(1-.15*(st.relics.dogu||0)))}
function rollGrade(st){
 const luck=st.relics.smile||0,r=st.r();
 if(r<.001)return 5;                       // 왕: 0.1%
 if(r<.005)return 4;                       // 전설: 0.4%
 if(r<.04+.02*luck)return 3;
 if(r<.04+.02*luck+.2+.05*luck)return 2;
 return 1;
}
const pick=(st,arr)=>arr[Math.floor(st.r()*arr.length)];
function put(st,id,at){
 let i=at!=null&&st.slots[at]==null?at:st.slots.indexOf(null);
 if(i<0)return -1;
 st.slots[i]={id,cd:0,uid:st.nextId++};st.seen[id]=true;
 st.events.push({type:'unit',i,id,g:UNITS[id].g});return i;
}
export const full=st=>!st.slots.includes(null);
export function summon(st){
 const c=summonCost(st);if(st.over)return 'over';if(st.gold<c)return 'gold';if(full(st))return 'full';
 st.gold-=c;st.summons++;const g=rollGrade(st);const id=pick(st,BY_GRADE(g));return put(st,id)>=0?id:'full';
}
// 합치기: 같은 병사를 모으면 다음 등급 무작위. 일반·희귀는 2명, 영웅·전설은 3명(왕은 아주 귀하게)
export const NEED=g=>g>=3?3:2;
export function mates(st,b){const B=st.slots[b];if(!B)return [];return st.slots.map((s,j)=>s&&s.id===B.id?j:-1).filter(j=>j>=0)}
export function canMerge(st,a,b){const A=st.slots[a],B=st.slots[b];if(a===b||!A||!B||A.id!==B.id)return false;const g=UNITS[A.id].g;return g<5&&mates(st,b).length>=NEED(g)}
export function merge(st,a,b){
 if(!canMerge(st,a,b))return null;const g=UNITS[st.slots[a].id].g;
 const use=[a,b,...mates(st,b).filter(j=>j!==a&&j!==b)].slice(0,NEED(g));
 for(const j of use)st.slots[j]=null;const id=pick(st,BY_GRADE(g+1));put(st,id,b);st.events.push({type:'merge',i:b,g:g+1});return id;
}
export function move(st,a,b){if(st.slots[b]){const t=st.slots[a];st.slots[a]=st.slots[b];st.slots[b]=t}else{st.slots[b]=st.slots[a];st.slots[a]=null}}
export function sell(st,i){const u=st.slots[i];if(!u)return 0;const v=GRADES[UNITS[u.id].g-1].sell;st.gold+=v;st.slots[i]=null;return v}
export function recipeReady(st,rec){const have=st.slots.map(s=>s&&s.id);return rec.need.every(n=>have.includes(n))}
export function craft(st,recId){
 const rec=RECIPES.find(r=>r.id===recId);if(!rec||!recipeReady(st,rec))return false;
 let at=null;for(const n of rec.need){const i=st.slots.findIndex(s=>s&&s.id===n);if(at==null)at=i;st.slots[i]=null}
 put(st,rec.id,at);st.events.push({type:'legend',i:at,id:rec.id});return true;
}
export function rollDice(st){
 if(st.stones<1||st.over)return null;st.stones--;
 const luck=st.relics.dice||0;let face=Math.floor(st.r()*14);
 if(luck&&DICE_FACES[face].v==='none'&&st.r()<.6*luck)face=6; // 주령구 유물: 꽝을 영웅으로
 const f=DICE_FACES[face];let got=null;
 switch(f.v){
  case 'gold':st.gold+=40;break;case 'gold2':st.gold+=100;break;case 'stone2':st.stones+=2;break;
  case 'moat':st.skill.moat.cd=0;break;
  case 'g2':case 'g3':case 'g4':{const gv=f.v==='g4'&&st.r()>.3?'g3':f.v;if(full(st)){st.gold+=gv==='g2'?40:gv==='g3'?120:300;break}got=pick(st,BY_GRADE(+gv[1]));put(st,got);break}
  case 'king':{// 왕의 부름: 12% 확률로 왕, 아니면 금화
   if(st.r()<.12&&!full(st)){got=pick(st,BY_GRADE(5));put(st,got)}else st.gold+=60;break}
 }
 st.events.push({type:'dice',face,got});return {face,got};
}
export function useSkill(st,id){const s=st.skill[id];if(!s||s.cd>0||st.over)return false;s.cd=SKILLS[id].cd;s.on=SKILLS[id].dur;st.events.push({type:'skill',id});return true}
export function relicChoices(st){const ks=Object.keys(RELICS);const out=[];while(out.length<3){const k=pick(st,ks);if(!out.includes(k))out.push(k)}return out}
export function pickRelic(st,k){if(!RELICS[k])return;st.relics[k]=(st.relics[k]||0)+1;st.pendingRelic=null;st.events.push({type:'relic',k})}

function enemyHp(w){return Math.round(32*Math.pow(1.17,w-1)+w*4)}
function startWave(st){
 st.wave++;const w=st.wave;st.waveT=WAVE_T;st.gold+=10;
 if(w%10===0){
  const hp=Math.round(enemyHp(w)*38*(1+w/40));
  st.spawnQ.push({at:st.t+1,kind:'boss',hp,speed:30});st.boss={until:st.t+BOSS_T,w};
  st.events.push({type:'boss',w});
 }else{
  const n=12+Math.floor(w*.5);
  for(let i=0;i<n;i++){
   let kind='foot',hp=enemyHp(w),speed=52+w*.6;
   if(w>=4&&i%4===1){kind='scout';hp*=.7;speed*=1.55}
   if(w>=7&&i%5===3){kind='shield';hp*=2.3;speed*=.8}
   st.spawnQ.push({at:st.t+i*.75,kind,hp:Math.round(hp),speed});
  }
 }
 if(w>1&&(w-1)%5===0&&!st.pendingRelic)st.pendingRelic=relicChoices(st);
 if(w%5===0)st.stones++;
 st.events.push({type:'wave',w});
}
function auraFor(st,i){
 const out={speed:0,dmg:0},c=i%COLS,r=Math.floor(i/COLS);
 st.slots.forEach((s,j)=>{if(!s||j===i)return;const a=UNITS[s.id].aura;if(!a)return;const cj=j%COLS,rj=Math.floor(j/COLS);
  if(a.all||(Math.abs(cj-c)<=1&&Math.abs(rj-r)<=1)){out.speed+=a.speed||0;out.dmg+=a.dmg||0}});
 return out;
}
function hit(st,e,dmg,u,crit){
 if(e.hp<=0)return;let d=dmg;if(crit)d*=2;e.hp-=d;
 if(u.stun&&st.r()<u.stun.p)e.stun=Math.max(e.stun,u.stun.t);
 if(u.slow){e.slowK=Math.max(e.slowK,u.slow.k);e.slowT=Math.max(e.slowT,u.slow.t)}
 if(e.hp<=0){st.kills++;const gold=(e.kind==='boss'?120:e.kind==='shield'?4:3)+(st.relics.mokgan||0);st.gold+=gold;st.events.push({type:'kill',x:e.x,y:e.y,gold,boss:e.kind==='boss'});
  if(e.kind==='boss'){st.stones+=3;st.boss=null;st.events.push({type:'bossDown',w:st.wave})}}
}
export function step(st,dt){
 if(st.over||st.pendingRelic)return st;
 st.t+=dt;st.waveT-=dt;if(st.waveT<=0)startWave(st);
 while(st.spawnQ.length&&st.spawnQ[0].at<=st.t){const s=st.spawnQ.shift();st.enemies.push({id:st.nextId++,kind:s.kind,hp:s.hp,max:s.hp,speed:s.speed,s:st.r()*4,x:LANE.x0,y:LANE.y0,stun:0,slowK:0,slowT:0})}
 for(const k in st.skill){const s=st.skill[k];s.cd=Math.max(0,s.cd-dt);s.on=Math.max(0,s.on-dt)}
 if(st.relics.bell){st.bellT-=dt;if(st.bellT<=0){st.bellT=12;for(const e of st.enemies)e.stun=Math.max(e.stun,1);st.events.push({type:'bell'})}}
 const moatSlow=st.skill.moat.on>0?.75:0;
 for(const e of st.enemies){
  if(e.stun>0){e.stun-=dt}else{let k=1-Math.max(moatSlow,e.slowT>0?e.slowK:0);e.s+=e.speed*k*dt}
  e.slowT=Math.max(0,e.slowT-dt);if(e.slowT<=0)e.slowK=0;
  const p=lanePos(e.s);e.x=p.x;e.y=p.y;
 }
 const dmgMul=1+.2*(st.relics.crown||0),critP=.15*(st.relics.star||0)+0,drum=st.skill.drum.on>0?.5:0;
 st.slots.forEach((s,i)=>{
  if(!s)return;const u=UNITS[s.id],a=auraFor(st,i),p=slotXY(i);
  s.cd-=dt*(1+a.speed+drum);if(s.cd>0)return;
  const inR=st.enemies.filter(e=>e.hp>0&&(u.range>=999||Math.hypot(e.x-p.x,e.y-p.y)<=u.range));
  if(!inR.length){s.cd=0;return}
  s.cd=1/u.rate;
  // 가장 멀리 간 적(또는 보스)을 먼저
  inR.sort((x,y)=>(y.kind==='boss')-(x.kind==='boss')||y.s-x.s);const tgt=inR[0];
  const dmg=u.dmg*(1+a.dmg)*dmgMul,crit=st.r()<critP+(u.crit||0);
  if(u.kind==='single')hit(st,tgt,dmg,u,crit);
  else if(u.kind==='splash'){for(const e of st.enemies)if(Math.hypot(e.x-tgt.x,e.y-tgt.y)<=u.area)hit(st,e,e===tgt?dmg:dmg*.7,u,crit)}
  else if(u.kind==='pierce'){for(const e of inR.slice(0,u.pierce))hit(st,e,dmg,u,crit)}
  else if(u.kind==='all'){for(const e of st.enemies)hit(st,e,dmg,u,crit)}
  st.events.push({type:'shot',i,id:s.id,x:tgt.x,y:tgt.y,kind:u.kind,crit});
 });
 st.enemies=st.enemies.filter(e=>e.hp>0);
 if(st.enemies.length>=cap(st)){st.over='cap';st.events.push({type:'over',why:'cap'})}
 if(st.boss&&st.t>st.boss.until){st.over='boss';st.events.push({type:'over',why:'boss'})}
 return st;
}
// 시험·밸런스용 자동 플레이
export function autoPlay(st,maxT=3000){
 while(!st.over&&st.t<maxT){
  if(st.pendingRelic)pickRelic(st,st.pendingRelic[0]);
  while(summon(st)&&typeof st.slots[0]!=='undefined'&&st.gold>=summonCost(st)&&!full(st)){}
  for(const rec of RECIPES)if(recipeReady(st,rec))craft(st,rec.id);
  for(let a=0;a<st.slots.length;a++)for(let b=a+1;b<st.slots.length;b++)if(canMerge(st,a,b)){merge(st,a,b);break}
  if(full(st)){let worst=-1;st.slots.forEach((s,i)=>{if(s&&UNITS[s.id].g===1&&!st.slots.some((o,j)=>j!==i&&o&&o.id===s.id))worst=i});if(worst>=0&&st.gold>=summonCost(st)+5)sell(st,worst)}
  while(st.stones>0)rollDice(st);
  if(st.enemies.length>25)useSkill(st,'moat');if(st.enemies.length>15)useSkill(st,'drum');
  st.events.length=0;step(st,.1);
 }
 return st;
}
