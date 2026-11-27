// 월성 쌓기·수성 게임 v9: 블록으로 월성을 복원하고 나만의 성을 쌓은 뒤, 수성하기로 침입군을 막는다.
// 한 손가락: 콕 누르면 쌓기, 쭉 그으면 한 줄로 쌓기 · 두 손가락: 돌리기·확대
import {$,esc,modal,toast,read,write} from './ui.js';
import * as R from './fortress-rules-v9.js?v=20261127-1';
import {createFortressScene} from './fortress-scene-v9.js?v=20261127-1';
const SAVE='gj-fortress-v9';
const ICONS={
 earth:'<svg viewBox="0 0 40 40"><rect x="5" y="12" width="30" height="22" rx="2" fill="#a8855a"/><rect x="5" y="12" width="30" height="6" rx="2" fill="#7f9c58"/><path d="M5 23h30M5 28h30" stroke="#7a5a34" stroke-width="1.6"/></svg>',
 stone:'<svg viewBox="0 0 40 40"><rect x="5" y="10" width="30" height="24" rx="2" fill="#6d685d"/><g fill="#c9c1ad"><rect x="7" y="12" width="12" height="6"/><rect x="21" y="12" width="12" height="6"/><rect x="7" y="20" width="7" height="6"/><rect x="16" y="20" width="12" height="6"/><rect x="30" y="20" width="3" height="6"/><rect x="7" y="28" width="12" height="4"/><rect x="21" y="28" width="12" height="4"/></g></svg>',
 gate:'<svg viewBox="0 0 40 40"><path d="M4 13 20 6l16 7z" fill="#3d4245"/><rect x="6" y="13" width="28" height="21" fill="#bdb6a4"/><rect x="13" y="17" width="14" height="17" fill="#5a3a22"/><path d="M20 17v17" stroke="#2b1a0d" stroke-width="1.4"/></svg>',
 tower:'<svg viewBox="0 0 40 40"><path d="M6 12 20 5l14 7z" fill="#3d4245"/><path d="M10 12v22M30 12v22M10 20h20M10 20l20 14M30 20 10 34" stroke="#6b4428" stroke-width="2.4"/><rect x="8" y="17" width="24" height="4" fill="#8a6a40"/><circle cx="20" cy="14.5" r="2.5" fill="#e0b48c"/></svg>',
 crossbow:'<svg viewBox="0 0 40 40"><path d="M7 15q13-12 26 0" fill="none" stroke="#4a2e18" stroke-width="3"/><path d="M20 8v26" stroke="#6b4428" stroke-width="4"/><path d="M7 15h26" stroke="#ddd" stroke-width="1"/><path d="M20 4l-3 5h6z" fill="#3b3d40"/><rect x="11" y="32" width="18" height="4" fill="#6b4428"/></svg>',
 house:'<svg viewBox="0 0 40 40"><path d="M3 20q17-14 34 0z" fill="#3d4245"/><rect x="9" y="20" width="22" height="13" fill="#c49a62"/><rect x="17" y="24" width="6" height="9" fill="#4f3018"/><path d="M9 20v13M31 20v13" stroke="#6f2e22" stroke-width="2"/></svg>',
 moat:'<svg viewBox="0 0 40 40"><rect x="5" y="12" width="30" height="20" rx="4" fill="#4f8d93"/><path d="M9 20q4-3 8 0t8 0 8 0M9 26q4-3 8 0t8 0 8 0" fill="none" stroke="#bfe6ea" stroke-width="1.6"/></svg>'
};
const ENEMY_ICON={soldier:'🗡',ladder:'🪜',rider:'🐎',ram:'🛞',chief:'🚩'};
const clean=(s,n)=>Array.from(String(s||'').replace(/[<>\u0000-\u001f]/g,'').trim()).slice(0,n).join('');

export async function mountWolseong(root){
 document.body.classList.add('fort-page');document.title='월성 쌓기·수성하기 · 경주트립';
 const css=document.createElement('link');css.rel='stylesheet';css.href='./fortress-v9.css?v=20261127-1';await new Promise(r=>{css.onload=r;css.onerror=r;document.head.append(css)});
 const saved=read(SAVE,{})||{};
 let plan=saved.plan&&saved.plan.stacks?sanitize(saved.plan):R.emptyPlan();
 let level=Math.max(1,Math.min(99,saved.level|0||1)),extra=Math.max(0,saved.extra|0),best=saved.best||{level:0,time:0},restored=!!saved.restored,night=!!saved.night,name=clean(saved.name,14)||'나의 월성';
 let selected='earth',tool='build',showBp=saved.showBp!==false,speed=1,battle=null,undo=[];
 const bp=R.blueprint();
 function sanitize(p){const out=R.emptyPlan();for(const k in p.stacks){const [x,z]=k.split(',').map(Number);if(!R.inside(x,z))continue;for(const b of p.stacks[k]){if(R.BLOCKS[b]&&!R.whyNot(out,x,z,b))R.place(out,x,z,b)}}for(const k in p.moat){const [x,z]=k.split(',').map(Number);if(R.inside(x,z)&&!R.whyNot(out,x,z,'moat'))R.place(out,x,z,'moat')}return out}
 const save=()=>write(SAVE,{plan,level,extra,best,restored,night,name,showBp});

 root.innerHTML=`<div class="fort-app">
  <canvas id="fort-canvas" aria-label="월성 3D 놀이판. 블록을 고르고 땅을 눌러 쌓아요. 두 손가락으로 돌리고 확대해요."></canvas>
  <header class="fort-head">
   <a class="fort-mark" href="./?tour=wolseong&mode=classic" id="fort-back">GYEONGJU TRIP<span>월성 쌓기</span></a>
   <button class="fort-pill" id="fort-level" aria-label="레벨 정보"></button>
   <span class="fort-pill fort-budget" id="fort-budget"></span>
   <button class="fort-round" id="fort-night" aria-label="야경으로 바꾸기">☾</button>
   <button class="fort-round" id="fort-help" aria-label="놀이 방법">?</button>
  </header>
  <div class="fort-battlebar" id="fort-battlebar" hidden>
   <div class="fort-timer"><small>남은 시간</small><b id="fort-time">1:00</b></div>
   <div class="fort-hp"><small>왕궁</small><div class="fort-hpbar"><i id="fort-hpfill"></i></div></div>
   <div class="fort-kills"><small>물리친 적</small><b id="fort-kills">0</b></div>
  </div>
  <div class="fort-cam">
   <button id="fort-rl" aria-label="왼쪽으로 돌리기">⟲</button><button id="fort-rr" aria-label="오른쪽으로 돌리기">⟳</button>
   <button id="fort-zi" aria-label="가까이">＋</button><button id="fort-zo" aria-label="멀리">－</button><button id="fort-home" aria-label="처음 화면">⌂</button>
  </div>
  <div class="fort-bp" id="fort-bp"></div>
  <div class="fort-msg" id="fort-msg" role="status" aria-live="polite"></div>
  <footer class="fort-bottom">
   <div class="fort-tools">
    <button data-tool="build" class="on" aria-pressed="true"><span>🔨</span>쌓기</button>
    <button data-tool="erase" aria-pressed="false"><span>⛏</span>부수기</button>
    <button id="fort-undo" disabled><span>↶</span>되돌리기</button>
    <button id="fort-bptoggle" aria-pressed="true"><span>📜</span>설계도</button>
    <button id="fort-go" class="fort-go">⚔ 수성하기</button>
   </div>
   <div class="fort-palette" id="fort-palette" role="listbox" aria-label="블록 고르기"></div>
  </footer>
 </div>`;
 const canvas=$('#fort-canvas');let scene;
 try{scene=createFortressScene(canvas)}catch(e){console.error(e);root.innerHTML='<section class="card"><h2>3D 화면을 열지 못했어요.</h2><p>Safari나 Chrome 최신 버전에서 다시 열어 주세요.</p><button onclick="location.reload()">다시 열기</button></section>';return}
 if(night)scene.setNight(true);
 scene.setPlan(plan);
 // 국가유산청 첨성대 3D(있을 때만)
 // 국가유산청 첨성대 3D 원본을 받아 변환하면 KHS_CHEOM 을 true 로 바꾼다(그 전에는 간단한 모형)
 const KHS_CHEOM=false;
 if(KHS_CHEOM)scene.loadLandmark('./assets/wolseong-v9/cheomseongdae-khs-v1.glb',9.17*0.62);

 // ---------- 화면 글자 ----------
 const budget=()=>R.levelInfo(level).budget+extra;
 function hint(s,bad){const m=$('#fort-msg');m.textContent=s;m.classList.toggle('bad',!!bad);m.classList.add('show');clearTimeout(hint.t);hint.t=setTimeout(()=>m.classList.remove('show'),bad?2600:2200)}
 function renderPalette(){
  $('#fort-palette').innerHTML=R.BLOCK_ORDER.map(id=>{const b=R.BLOCKS[id],locked=b.unlock&&level<b.unlock;return `<button role="option" data-block="${id}" class="${id===selected?'on':''} ${locked?'locked':''}" aria-selected="${id===selected}"><i>${ICONS[id]}</i><b>${b.name}</b><small>${locked?b.unlock+'레벨부터':'🧱'+b.cost}</small></button>`}).join('');
 }
 function update(){
  const used=R.planCost(plan),cap=budget();
  $('#fort-budget').innerHTML=`🧱 <b>${Math.max(0,cap-used)}</b><small>/${cap}</small>`;$('#fort-budget').classList.toggle('low',cap-used<5);
  $('#fort-level').innerHTML=`<b>${level}</b>레벨`;
  const pr=R.blueprintProgress(plan,bp);
  $('#fort-bp').innerHTML=showBp&&!battle?`<b>월성 복원 설계도</b> ${Math.round(pr*100)}%<i style="--p:${pr*100}%"></i>`:'';
  $('#fort-bp').hidden=!(showBp&&!battle);
  $('#fort-undo').disabled=!undo.length;
  $('#fort-bptoggle').setAttribute('aria-pressed',showBp);$('#fort-bptoggle').classList.toggle('on',showBp);
  scene.setGhost(showBp&&!battle?bp:null,plan);
  $('#fort-go').textContent=battle?(speed===1?'⏩ 빠르게':'▶ 보통 속도'):'⚔ 수성하기';
  if(!restored&&pr>=.999){restored=true;save();modal(`<p class="eyebrow">WOLSEONG RESTORED</p><h2>월성 복원 완성!</h2><p>발굴로 밝혀진 월성처럼 반달 언덕 둘레에 흙 성벽을 쌓고, 북쪽에 해자를 파고, 성문 세 곳을 세웠어요.</p><p class="small">이제 망루를 성벽 위에 올리고 수성하기에 도전해 보세요.</p><div class="stack"><button class="primary" id="fort-ok">좋아요!</button></div>`);$('#fort-ok').onclick=()=>$('#dialog').close()}
 }
 renderPalette();update();

 // ---------- 쌓기·부수기 ----------
 const snap=()=>{undo.push(R.clonePlan(plan));if(undo.length>40)undo.shift()};
 function canAfford(id){return R.planCost(plan)+R.BLOCKS[id].cost<=budget()}
 // 한 칸 처리. limit: 그어서 쌓을 때 같은 높이까지만
 function act(x,z,stroke){
  if(tool==='erase'){
   const h=R.stackAt(plan,x,z).length;
   if(stroke.level!=null&&h<stroke.level&&!(h===0&&plan.moat[x+','+z]))return false;
   const b=battle?R.removeDuringBattle(battle,x,z):null;const got=R.removeTop(plan,x,z);
   if(!got)return false;if(stroke.level==null)stroke.level=Math.max(0,h);return true;
  }
  let id=selected;
  if(showBp&&!battle){const want=R.blueprintNext(plan,bp,x,z);if(want)id=want}
  const h=R.stackAt(plan,x,z).length;
  if(stroke.level!=null&&R.BLOCKS[id].kind!=='moat'&&h>stroke.level)return false;
  const why=R.whyNot(plan,x,z,id,level);
  if(why){if(!stroke.any)hint(why,true);return false}
  if(!canAfford(id)){hint('재료가 모자라요. 수성에 성공하면 재료가 늘어나요.',true);stroke.stop=true;return false}
  R.place(plan,x,z,id);if(battle)R.addDuringBattle(battle,x,z,id);
  if(stroke.level==null)stroke.level=h;
  return true;
 }
 function apply(cell,stroke){
  if(!cell||stroke.stop)return;
  const k=cell.x+','+cell.z;if(stroke.done.has(k))return;stroke.done.add(k);
  if(!stroke.snapped){snap();stroke.snapped=true}
  if(act(cell.x,cell.z,stroke)){stroke.any=true;scene.setPlan(battle?battle.live:plan);update();save();if(navigator.vibrate)try{navigator.vibrate(8)}catch{}}
 }
 // ---------- 터치 ----------
 const pts=new Map();let stroke=null,pending=null,gesture=null;
 function startStroke(e){stroke={done:new Set(),level:null,any:false,snapped:false};apply(scene.pick(e.clientX,e.clientY),stroke)}
 function endStroke(){if(stroke&&stroke.snapped&&!stroke.any)undo.pop();stroke=null;update()}
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('pointerdown',e=>{
  canvas.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(e.pointerType==='mouse'&&e.button!==0){gesture={mouse:true,x:e.clientX,y:e.clientY};return}
  if(pts.size===1){pending={e:{clientX:e.clientX,clientY:e.clientY},timer:setTimeout(()=>{if(pending){const p=pending;pending=null;startStroke(p.e)}},110)}}
  else if(pts.size===2){if(pending){clearTimeout(pending.timer);pending=null}if(stroke){endStroke()}const [a,b]=[...pts.values()];gesture={ang:Math.atan2(b.y-a.y,b.x-a.x),dist:Math.hypot(b.x-a.x,b.y-a.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2};scene.setHover(null)}
 });
 canvas.addEventListener('pointermove',e=>{
  if(gesture&&gesture.mouse){scene.twist(-(e.clientX-gesture.x)*.008);gesture.x=e.clientX;return}
  if(!pts.has(e.pointerId)){if(e.pointerType==='mouse')showHover(e);return}
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size>=2&&gesture){const [a,b]=[...pts.values()];const ang=Math.atan2(b.y-a.y,b.x-a.x),dist=Math.hypot(b.x-a.x,b.y-a.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   let da=ang-gesture.ang;if(da>Math.PI)da-=Math.PI*2;if(da<-Math.PI)da+=Math.PI*2;
   scene.twist(-da-(mx-gesture.mx)*.006,gesture.dist/dist);scene.pan(0,(my-gesture.my)*.0);Object.assign(gesture,{ang,dist,mx,my});return}
  if(pending){const dx=e.clientX-pending.e.clientX,dy=e.clientY-pending.e.clientY;if(dx*dx+dy*dy>64){clearTimeout(pending.timer);const p=pending;pending=null;startStroke(p.e)}}
  if(stroke){apply(scene.pick(e.clientX,e.clientY),stroke);showHover(e)}
 });
 const up=e=>{
  pts.delete(e.pointerId);
  if(gesture&&gesture.mouse){gesture=null;return}
  if(pending){clearTimeout(pending.timer);const p=pending;pending=null;startStroke(p.e);endStroke();return}
  if(stroke&&pts.size===0)endStroke();
  if(pts.size<2)gesture=null;
  if(e.pointerType!=='mouse')scene.setHover(null);
 };
 canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')scene.setHover(null)});
 canvas.addEventListener('wheel',e=>{e.preventDefault();scene.zoom(e.deltaY>0?1.1:.9)},{passive:false});
 function showHover(e){const c=scene.pick(e.clientX,e.clientY);if(!c){scene.setHover(null);return}const h=R.stackAt(plan,c.x,c.z).length;if(tool==='erase'){scene.setHover(c.x,c.z,true,Math.max(0,h-1));return}let id=selected;if(showBp&&!battle){const w=R.blueprintNext(plan,bp,c.x,c.z);if(w)id=w}scene.setHover(c.x,c.z,!R.whyNot(plan,c.x,c.z,id,level)&&canAfford(id),id==='moat'?0:h)}

 // ---------- 버튼 ----------
 $('#fort-palette').onclick=e=>{const b=e.target.closest('[data-block]');if(!b)return;const id=b.dataset.block,info=R.BLOCKS[id];if(info.unlock&&level<info.unlock){hint(info.name+'는 '+info.unlock+'레벨에 열려요.',true);return}selected=id;setTool('build');renderPalette();hint(info.name+' · '+info.sub+(info.kind==='top'?' (성벽 위에도 올려요)':''))};
 function setTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('on',b.dataset.tool===t);b.setAttribute('aria-pressed',b.dataset.tool===t)})}
 document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{setTool(b.dataset.tool);hint(tool==='erase'?'부술 블록을 누르거나 쭉 그어요. 재료는 돌려받아요.':R.BLOCKS[selected].name+'를 쌓아요.')});
 $('#fort-undo').onclick=()=>{if(!undo.length)return;if(battle){hint('수성 중에는 되돌릴 수 없어요.',true);return}plan=undo.pop();scene.setPlan(plan);update();save()};
 $('#fort-bptoggle').onclick=()=>{showBp=!showBp;update();save();hint(showBp?'노란 칸이 발굴로 밝혀진 월성 모양이에요. 아무 블록이나 들고 노란 칸을 누르면 설계도대로 쌓여요.':'설계도를 껐어요. 마음대로 쌓아요!')};
 $('#fort-rl').onclick=()=>scene.rotate(Math.PI/4);$('#fort-rr').onclick=()=>scene.rotate(-Math.PI/4);
 $('#fort-zi').onclick=()=>scene.zoom(.8);$('#fort-zo').onclick=()=>scene.zoom(1.25);$('#fort-home').onclick=()=>scene.home();
 $('#fort-night').onclick=()=>{night=!night;scene.setNight(night);$('#fort-night').textContent=night?'☼':'☾';$('#fort-night').setAttribute('aria-label',night?'낮으로 바꾸기':'야경으로 바꾸기');document.body.classList.toggle('fort-night',night);save()};
 if(night){$('#fort-night').textContent='☼';document.body.classList.add('fort-night')}
 $('#fort-help').onclick=help;
 $('#fort-level').onclick=()=>{const info=R.levelInfo(level),kinds=Object.entries(R.ENEMIES).filter(([k,e])=>e.from<=level&&(k!=='chief'||level%5===0));modal(`<p class="eyebrow">LEVEL ${level}</p><h2>${level}레벨 수성</h2><p><b>${R.fmtTime(info.duration)}</b> 동안 왕궁을 지키면 성공이에요.</p><ul class="fort-foes">${kinds.map(([k,e])=>`<li><span>${ENEMY_ICON[k]}</span><b>${e.name}</b><small>${foeNote(k)}</small></li>`).join('')}</ul><p class="small">최고 기록: ${best.level?best.level+'레벨 성공':'아직 없어요'}</p>`)};
 function foeNote(k){return {soldier:'성벽을 창으로 부숴요',ladder:'1층 성벽은 사다리로 넘어요. 2층 이상 쌓아요!',rider:'아주 빨라요',ram:'성벽을 크게 부숴요. 돌벽과 쇠뇌로 막아요',chief:'5레벨마다 나오는 대장'}[k]}
 function help(){modal(`<p class="eyebrow">HOW TO PLAY</p><h2>월성 쌓고 지키기</h2><ol class="fort-how">
  <li><b>블록을 고르고 땅을 콕!</b> 손가락으로 쭉 그으면 한 줄로 쌓여요.</li>
  <li><b>같은 자리를 또 누르면 한 층 더.</b> 3층까지 쌓을 수 있고, 높을수록 튼튼해요.</li>
  <li><b>망루·쇠뇌는 성벽 위에 올리면</b> 더 멀리 쏴요.</li>
  <li><b>📜 설계도를 켜면</b> 발굴로 밝혀진 진짜 월성 모양이 노랗게 보여요. 노란 칸을 누르면 설계도대로 쌓여요.</li>
  <li><b>⚔ 수성하기</b>를 누르면 적이 북·동·서쪽에서 쳐들어와요. 시간이 다 될 때까지 왕궁을 지키면 다음 레벨!</li>
  <li><b>두 손가락</b>으로 돌리고 벌려서 확대해요. ⟲ ⟳ 버튼도 돼요.</li></ol>
  <p class="small">남쪽은 남천이 흘러 적이 건너기 어려워요. 실제 월성도 강과 해자가 자연 방어벽이었어요.</p>
  <div class="stack"><button class="primary" id="fort-start">시작하기</button><a class="btn" href="./?tour=wolseong&mode=classic">예전 3D 월성 꾸미기 ↗</a></div>`);$('#fort-start').onclick=()=>$('#dialog').close()}
 if(!saved.seenHelp){help();write(SAVE,{...read(SAVE,{}),seenHelp:true});saved.seenHelp=true}
 const _save=save;

 // ---------- 수성하기 ----------
 $('#fort-go').onclick=()=>{
  if(battle){speed=speed===1?2:1;update();return}
  const hasWall=Object.keys(plan.stacks).length>0;
  if(!hasWall){hint('먼저 성벽을 조금 쌓아 볼까요? 왕궁(가운데) 둘레를 둘러싸요.',true);return}
  startBattle();
 };
 function startBattle(){
  battle=R.createBattle(plan,level,(Date.now()&0xffff)+level*101);speed=1;
  document.body.classList.add('fort-fighting');$('#fort-battlebar').hidden=false;
  scene.setPlan(battle.live);update();hint(level+'레벨 수성 시작! 적이 북·동·서쪽에서 와요.');
  scene.setHover(null);
 }
 let acc=0;
 scene.onFrame(dt=>{
  if(!battle)return;
  acc+=dt*speed;let changed=false;
  while(acc>=.05&&!battle.over){R.step(battle,.05);acc-=.05;
   for(const ev of battle.events){scene.event(ev);if(ev.type==='break')changed=true;if(ev.type==='shoot'&&ev.block==='crossbow')scene.aim(ev.k,ev.to.x,ev.to.z)}
   battle.events.length=0}
  if(changed)scene.setPlan(battle.live);
  scene.syncFoes(battle.enemies,dt,performance.now()/1000);
  const left=battle.info.duration-battle.t;$('#fort-time').textContent=R.fmtTime(left);$('#fort-time').classList.toggle('soon',left<10);
  const hp=battle.palace/R.PALACE_HP;$('#fort-hpfill').style.width=(hp*100)+'%';$('#fort-hpfill').classList.toggle('low',hp<.35);$('#fort-kills').textContent=battle.kills;
  if(battle.bounty){extra+=battle.bounty;battle.bounty=0;update()}
  if(battle.over)finish();
 });
 function finish(){
  const st=battle;battle=null;speed=1;
  document.body.classList.remove('fort-fighting');$('#fort-battlebar').hidden=true;
  setTimeout(()=>scene.clearFoes(),600);scene.setPlan(plan);
  const survived=st.t,L=level;
  if(st.over==='won'){
   const next=L+1,unlock=Object.values(R.BLOCKS).find(b=>b.unlock===next),newFoe=Object.values(R.ENEMIES).find(e=>e.from===next);
   level=next;if(L>best.level)best={level:L,time:Math.round(survived)};save();renderPalette();update();
   modal(`<p class="eyebrow">LEVEL ${L} CLEAR</p><h2>${L}레벨 수성 성공!</h2><p>왕궁을 <b>${R.fmtTime(survived)}</b> 동안 지켜냈어요. 적 ${st.kills}명을 물리쳤어요.</p>
    <p>다음 ${next}레벨: 적이 더 많고 튼튼해져요.${newFoe?` <b>${newFoe.name}</b> 등장!`:''}${unlock?` 새 블록 <b>${unlock.name}</b>이 열렸어요.`:''}</p>
    <p class="small">재료가 ${R.levelInfo(next).budget+extra-R.planCost(plan)}개 남았어요. 성을 더 튼튼하게 고쳐 볼까요?</p>
    <div class="stack"><button class="primary" id="fort-next">성 고치고 ${next}레벨 도전</button><button id="fort-card">기념 사진 저장</button></div>`);
  }else{
   const prev=best.lostTime||0;best.lostTime=Math.max(prev,Math.round(survived));save();update();
   modal(`<p class="eyebrow">LEVEL ${L}</p><h2>왕궁이 함락됐어요</h2><p><b>${R.fmtTime(survived)}</b> 버텼어요 (목표 ${R.fmtTime(st.info.duration)}). 적 ${st.kills}명을 물리쳤어요.</p>
    <p>${tipFor(st)}</p><p class="small">부서진 성은 다시 원래대로 고쳐 두었어요.</p>
    <div class="stack"><button class="primary" id="fort-next">성 고치고 다시 도전</button><button id="fort-card">기념 사진 저장</button></div>`);
  }
  $('#fort-next').onclick=()=>$('#dialog').close();$('#fort-card').onclick=saveCard;
 }
 function tipFor(st){
  const towers=Object.values(plan.stacks).flat().filter(b=>b==='tower'||b==='crossbow').length;
  if(towers<3)return '💡 망루를 성벽 위에 더 올려 보세요. 화살로 적을 물리쳐야 오래 버텨요.';
  const low=Object.values(plan.stacks).filter(s=>s.length===1).length;
  if(level>=2&&low>6)return '💡 사다리병은 1층 성벽을 넘어요. 북쪽 성벽을 2층 이상으로 쌓아 보세요.';
  if(level>=4)return '💡 충차는 흙벽을 금방 부숴요. 돌벽과 쇠뇌로 막아 보세요.';
  return '💡 해자(물길)를 파면 적이 느려져서 망루가 더 많이 쏠 수 있어요.';
 }
 async function saveCard(){
  const url=scene.snapshot();const img=new Image();img.src=url;await img.decode().catch(()=>{});
  const c=document.createElement('canvas');c.width=1080;c.height=1350;const g=c.getContext('2d');
  g.fillStyle='#1c2a22';g.fillRect(0,0,c.width,c.height);
  const s=Math.max(c.width/img.width,1080/img.height);const w=img.width*s,h=img.height*s;g.drawImage(img,(c.width-w)/2,(1080-h)/2,w,h);
  g.fillStyle='#f6efdc';g.fillRect(0,1080,c.width,270);g.fillStyle='#2b3a30';g.font='800 30px "Noto Sans KR",sans-serif';g.fillText('GYEONGJU TRIP · 월성 쌓기',60,1140);
  g.font='900 64px "Noto Sans KR",sans-serif';g.fillText(name,60,1220);g.font='600 34px "Noto Sans KR",sans-serif';g.fillStyle='#6b5a3a';g.fillText(`${Math.max(1,level-1)}레벨까지 지켜낸 나만의 월성 · 복원 ${Math.round(R.blueprintProgress(plan,bp)*100)}%`,60,1285);
  c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='gyeongju-wolseong-fortress.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)},'image/png');
  toast('기념 사진을 저장했어요.');
 }
 if(new URLSearchParams(location.search).has('debug'))window.__fort={R,scene,get plan(){return plan},set plan(p){plan=p;scene.setPlan(p);update()},get battle(){return battle},start:startBattle,setLevel(l){level=l;renderPalette();update()},bp,get speed(){return speed},set speed(v){speed=v}};
}
