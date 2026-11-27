// 월성 수호대 v10: 신라 병사·인물·왕을 소환하고 합쳐 월성 둘레를 도는 침입군을 막는 디펜스 게임(집에서도 이어 하기)
import {$,modal,toast,read,write} from './ui.js';
import * as G from './guard-rules-v10.js?v=20261127-1';
import {drawMap,drawUnit,drawFoe,drawUnitIcon,TOP,CW,CH} from './guard-art-v10.js?v=20261127-1';
const SAVE='gj-guard-v10';
const TAU=Math.PI*2;
export async function mountWolseong(root){
 document.body.classList.add('gd-page');document.title='월성 수호대 · 경주트립';
 const css=document.createElement('link');css.rel='stylesheet';css.href='./guard-v10.css?v=20261127-1';await new Promise(r=>{css.onload=r;css.onerror=r;document.head.append(css)});
 const meta=Object.assign({best:0,bestKills:0,plays:0,seen:{},relics:{},kings:0,night:true,seenHelp:false},read(SAVE,{})||{});
 const saveMeta=()=>write(SAVE,meta);
 root.innerHTML=`<div class="gd-app">
  <header class="gd-top">
   <a class="gd-mark" href="../?tour=wolseong#artifact-title">GYEONGJU TRIP<span>월성 수호대</span></a>
   <div class="gd-wave"><small>웨이브</small><b id="gd-wave">0</b><i id="gd-next"></i></div>
   <div class="gd-money"><span>🪙 <b id="gd-gold">0</b></span><span title="행운석">💎 <b id="gd-stone">0</b></span></div>
   <button class="gd-icon" id="gd-pause" aria-label="잠시 멈춤">Ⅱ</button>
  </header>
  <div class="gd-cap"><div class="gd-capbar"><i id="gd-capfill"></i></div><span id="gd-captxt">0 / 100</span><span id="gd-boss" hidden></span></div>
  <div class="gd-stage"><canvas id="gd-canvas" aria-label="월성 놀이판. 병사를 눌러 고르고 같은 병사를 눌러 합쳐요."></canvas><div class="gd-banner" id="gd-banner"></div></div>
  <div class="gd-info" id="gd-info"><p>🪙 금화로 <b>소환</b>! 같은 병사를 눌러 <b>합치면</b> 더 센 병사가 나와요. 가장 높은 등급은 <b>신라 왕</b>!</p></div>
  <footer class="gd-dock">
   <div class="gd-row">
    <button class="gd-skill" id="gd-moat"><span>🌊</span>해자<i></i></button>
    <button class="gd-skill" id="gd-drum"><span>🥁</span>진군 북<i></i></button>
    <button class="gd-skill" id="gd-dice"><span>🎲</span>주령구<i id="gd-dicen"></i></button>
    <button class="gd-skill" id="gd-book"><span>📜</span>조합서<i id="gd-bookn"></i></button>
   </div>
   <div class="gd-row">
    <button class="gd-summon" id="gd-summon">소환 <b id="gd-cost">20</b>🪙</button>
    <button class="gd-small" id="gd-speed">▶▶<small>빠르게</small></button>
    <button class="gd-small" id="gd-dex">📖<small>도감</small></button>
   </div>
  </footer>
 </div>`;
 const cv=$('#gd-canvas'),ctx=cv.getContext('2d');
 let st,sel=null,drag=null,speed=1,paused=false,fx=[],mapCache=null,dpr=1,scale=1,ox=0,oy=0,kingsThisGame=0;
 // ---------- 소리(아주 짧게) ----------
 let ac=null;function beep(f,d=.08,type='triangle',v=.08){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch{}}
 const fanfare=()=>[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.25,'square',.06),i*120));
 // ---------- 크기 ----------
 function resize(){const r=cv.parentElement.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);scale=Math.min(r.width/CW,r.height/CH);cv.style.width=CW*scale+'px';cv.style.height=CH*scale+'px';cv.width=Math.round(CW*scale*dpr);cv.height=Math.round(CH*scale*dpr);mapCache=null}
 new ResizeObserver(resize).observe(cv.parentElement);resize();
 function cacheMap(){mapCache=document.createElement('canvas');mapCache.width=cv.width;mapCache.height=cv.height;const c=mapCache.getContext('2d');c.scale(scale*dpr,scale*dpr);drawMap(c,meta.night)}
 // ---------- 새 판 ----------
 function start(){st=G.newGame();sel=null;fx=[];kingsThisGame=0;meta.plays++;saveMeta();paused=false;$('#gd-pause').textContent='Ⅱ';hud();info()}
 // ---------- 화면 글자 ----------
 function hud(){
  $('#gd-wave').textContent=st.wave;$('#gd-next').textContent=st.boss?'보스!':Math.ceil(st.waveT)+'초';
  $('#gd-gold').textContent=st.gold;$('#gd-stone').textContent=st.stones;$('#gd-cost').textContent=G.summonCost(st);
  const cap=G.cap(st),n=st.enemies.length;$('#gd-capfill').style.width=Math.min(100,n/cap*100)+'%';$('#gd-capfill').className=n/cap>.75?'hot':n/cap>.5?'warm':'';$('#gd-captxt').textContent=n+' / '+cap;
  const b=$('#gd-boss');if(st.boss){b.hidden=false;b.textContent='보스 '+Math.max(0,Math.ceil(st.boss.until-st.t))+'초'}else b.hidden=true;
  $('#gd-summon').disabled=st.gold<G.summonCost(st)||G.full(st);
  for(const k of['moat','drum']){const s=st.skill[k],btn=$('#gd-'+k);btn.disabled=s.cd>0;btn.querySelector('i').textContent=s.on>0?'사용 중':s.cd>0?Math.ceil(s.cd)+'초':'준비';btn.classList.toggle('on',s.on>0)}
  $('#gd-dice').disabled=st.stones<1;$('#gd-dicen').textContent='💎1';
  const ready=G.RECIPES.filter(r=>G.recipeReady(st,r)).length;$('#gd-bookn').textContent=ready?'조합 가능!':'전설';$('#gd-book').classList.toggle('glow',ready>0);
 }
 function info(){
  const el=$('#gd-info');
  if(sel==null||!st.slots[sel]){el.innerHTML='<p>🪙 금화로 <b>소환</b>! 같은 병사를 눌러 <b>합치면</b> 더 센 병사가 나와요. 가장 높은 등급은 <b>신라 왕</b>!</p>';return}
  const u=G.UNITS[st.slots[sel].id],gr=G.GRADES[u.g-1],m=G.mates(st,sel).length,need=G.NEED(u.g);
  el.innerHTML=`<div class="gd-sel"><img src="${icon(st.slots[sel].id)}" alt=""><div><b>${u.name}</b> <em style="background:${gr.color}">${gr.name}</em><p>${u.fact}</p><small>${u.g<5?`같은 ${u.name} ${m}/${need} · 모이면 눌러서 합치기`:'최고 등급!'}</small></div><button id="gd-sell">팔기<br><b>${gr.sell}🪙</b></button></div>`;
  $('#gd-sell').onclick=()=>{const v=G.sell(st,sel);sel=null;beep(300);info();hud();float(null,'+'+v+'🪙')};
 }
 const icons={};const icon=id=>icons[id]||(icons[id]=drawUnitIcon(id,72));
 // ---------- 효과 ----------
 function slotPx(i){const p=G.slotXY(i);return {x:p.x,y:p.y+TOP}}
 function float(at,txt,col='#fff'){fx.push({k:'txt',x:at?at.x:CW/2,y:at?at.y:TOP+40,txt,col,t:0,life:1})}
 function banner(html,cls=''){const b=$('#gd-banner');b.className='gd-banner show '+cls;b.innerHTML=html;clearTimeout(banner.t);banner.t=setTimeout(()=>b.className='gd-banner',cls==='king'?2600:1600)}
 function handle(ev){
  if(ev.type==='shot'){const a=slotPx(ev.i);fx.push({k:'shot',ax:a.x,ay:a.y,bx:ev.x,by:ev.y+TOP,kind:ev.kind,crit:ev.crit,id:ev.id,t:0,life:ev.kind==='all'?.6:.18})}
  else if(ev.type==='kill'){float({x:ev.x,y:ev.y+TOP-6},'+'+ev.gold,'#ffe07a');if(ev.boss){banner('<b>보스를 물리쳤어요!</b><small>행운석 +3</small>');beep(880,.3)}}
  else if(ev.type==='unit'){const p=slotPx(ev.i);fx.push({k:'pop',x:p.x,y:p.y,g:ev.g,t:0,life:.5});meta.seen[ev.id]=true;
   if(ev.g===5){kingsThisGame++;meta.kings++;banner(`<img src="${icon(ev.id)}" alt=""><b>왕의 등장! ${G.UNITS[ev.id].name}</b><small>${G.UNITS[ev.id].fact}</small>`,'king');fanfare()}
   else if(ev.g===4){banner(`<img src="${icon(ev.id)}" alt=""><b>전설 ${G.UNITS[ev.id].name}!</b>`,'legend');beep(784,.3,'square',.06)}
   else beep(440+ev.g*120,.08)}
  else if(ev.type==='merge'){const p=slotPx(ev.i);fx.push({k:'ring',x:p.x,y:p.y,g:ev.g,t:0,life:.6})}
  else if(ev.type==='wave'){if(ev.w%10!==0)banner(`<b>${ev.w}번째 웨이브</b>`)}
  else if(ev.type==='boss'){banner(`<b>보스 등장! ${ev.w}웨이브</b><small>60초 안에 물리쳐요</small>`,'boss');beep(150,.5,'sawtooth',.06)}
  else if(ev.type==='skill'){if(ev.id==='moat'){banner('<b>해자에 물을 채웠어요!</b><small>적이 느려져요</small>','moat');beep(260,.4,'sine',.1)}else{banner('<b>진군 북!</b><small>병사 공격이 빨라져요</small>');beep(120,.15,'square',.1);setTimeout(()=>beep(120,.15,'square',.1),180)}}
  else if(ev.type==='bell'){fx.push({k:'bell',t:0,life:1});beep(196,.9,'sine',.07)}
  else if(ev.type==='relic'){meta.relics[ev.k]=true}
  else if(ev.type==='over')over(ev.why);
 }
 // ---------- 그리기 ----------
 let last=performance.now(),time=0;
 function frame(now){
  requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  if(st&&!paused&&!st.over&&!st.pendingRelic){let left=dt*speed;while(left>0){const d=Math.min(.05,left);G.step(st,d);left-=d;for(const ev of st.events)handle(ev);st.events.length=0;if(st.over||st.pendingRelic)break}hud();if(st.pendingRelic)relicPick()}
  if(!mapCache)cacheMap();
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(mapCache,0,0);ctx.setTransform(scale*dpr,0,0,scale*dpr,0,0);
  if(!st)return;
  // 해자 물 차오름
  if(st.skill.moat.on>0){const L=G.LANE,a=Math.min(1,st.skill.moat.on)*.55;ctx.strokeStyle=`rgba(80,170,220,${a})`;ctx.lineWidth=26;ctx.strokeRect(L.x0,L.y0+TOP,L.x1-L.x0,L.y1-L.y0);ctx.strokeStyle=`rgba(220,245,255,${a*.6})`;ctx.lineWidth=1.5;ctx.setLineDash([6,10]);ctx.lineDashOffset=-time*30;ctx.strokeRect(L.x0,L.y0+TOP,L.x1-L.x0,L.y1-L.y0);ctx.setLineDash([])}
  for(const e of st.enemies){e.moat=st.skill.moat.on>0;drawFoe(ctx,e,time)}
  // 고른 병사와 짝꿍
  const mates=sel!=null&&st.slots[sel]?G.mates(st,sel):[];
  if(sel!=null&&st.slots[sel]){const u=G.UNITS[st.slots[sel].id],p=slotPx(sel);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.setLineDash([4,5]);ctx.lineWidth=1.2;if(u.range<900){ctx.beginPath();ctx.arc(p.x,p.y,u.range,0,TAU);ctx.stroke()}ctx.setLineDash([])}
  st.slots.forEach((s,i)=>{if(!s)return;const p=slotPx(i);let x=p.x,y=p.y;if(drag&&drag.i===i&&drag.moved){x=drag.x;y=drag.y}
   if(mates.includes(i)&&mates.length>1){ctx.fillStyle=`rgba(255,230,120,${.35+.25*Math.sin(time*8)})`;ctx.beginPath();ctx.arc(p.x,p.y,24,0,TAU);ctx.fill()}
   if(i===sel){ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,23,0,TAU);ctx.stroke()}
   drawUnit(ctx,s.id,x,y-2,40,time,{label:true})});
  // 효과
  for(let k=fx.length-1;k>=0;k--){const f=fx[k];f.t+=dt;const q=f.t/f.life;if(q>=1){fx.splice(k,1);continue}
   if(f.k==='shot'){const g=G.UNITS[f.id].g;ctx.globalAlpha=1-q;
    if(f.kind==='all'){ctx.strokeStyle='rgba(90,200,255,.8)';ctx.lineWidth=6;ctx.beginPath();ctx.arc(CW/2,TOP+G.BH/2,40+q*260,0,TAU);ctx.stroke()}
    else{ctx.strokeStyle=g>=5?'#ffcf4a':g>=4?'#ffe28a':g>=3?'#d9b8ff':'#fff7dc';ctx.lineWidth=g>=4?3:1.6;const t2=Math.min(1,q*2.2);ctx.beginPath();ctx.moveTo(f.ax+(f.bx-f.ax)*Math.max(0,t2-.35),f.ay+(f.by-f.ay)*Math.max(0,t2-.35));ctx.lineTo(f.ax+(f.bx-f.ax)*t2,f.ay+(f.by-f.ay)*t2);ctx.stroke();
     if(f.kind==='splash'&&q>.4){ctx.fillStyle=g>=4?'rgba(255,200,80,.35)':'rgba(255,240,200,.3)';ctx.beginPath();ctx.arc(f.bx,f.by,(G.UNITS[f.id].area||30)*q,0,TAU);ctx.fill()}
     if(f.crit&&q>.4){ctx.fillStyle='#ff5a3a';ctx.font='900 10px sans-serif';ctx.fillText('치명!',f.bx+4,f.by-8)}}
    ctx.globalAlpha=1}
   else if(f.k==='txt'){ctx.globalAlpha=1-q;ctx.fillStyle=f.col;ctx.font='900 11px "Noto Sans KR",sans-serif';ctx.textAlign='center';ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;ctx.strokeText(f.txt,f.x,f.y-q*18);ctx.fillText(f.txt,f.x,f.y-q*18);ctx.textAlign='left';ctx.globalAlpha=1}
   else if(f.k==='pop'||f.k==='ring'){const col=G.GRADES[f.g-1].color;ctx.strokeStyle=col;ctx.globalAlpha=1-q;ctx.lineWidth=f.k==='ring'?5:3;ctx.beginPath();ctx.arc(f.x,f.y,18+q*(f.g>=4?60:26),0,TAU);ctx.stroke();ctx.globalAlpha=1}
   else if(f.k==='bell'){ctx.strokeStyle=`rgba(255,230,150,${1-q})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(CW/2,TOP+G.BH/2,q*300,0,TAU);ctx.stroke()}
  }
  if(st.skill.drum.on>0){ctx.fillStyle=`rgba(255,120,60,${.08+.05*Math.sin(time*12)})`;ctx.fillRect(G.GX,G.GY+TOP,G.COLS*G.SLOT,G.ROWS*G.SLOT)}
 }
 requestAnimationFrame(frame);
 // ---------- 손가락 ----------
 function toSlot(cx,cy){const r=cv.getBoundingClientRect();const x=(cx-r.left)/scale,y=(cy-r.top)/scale-TOP;const c=Math.floor((x-G.GX)/G.SLOT),w=Math.floor((y-G.GY)/G.SLOT);return {i:c>=0&&c<G.COLS&&w>=0&&w<G.ROWS?w*G.COLS+c:-1,x,y:y+TOP}}
 cv.addEventListener('pointerdown',e=>{if(!st||st.over)return;const p=toSlot(e.clientX,e.clientY);if(p.i<0){sel=null;info();return}cv.setPointerCapture(e.pointerId);drag={i:p.i,sx:e.clientX,sy:e.clientY,x:p.x,y:p.y,moved:false,has:!!st.slots[p.i]}});
 cv.addEventListener('pointermove',e=>{if(!drag||!drag.has)return;const p=toSlot(e.clientX,e.clientY);drag.x=p.x;drag.y=p.y;if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>10)drag.moved=true});
 cv.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;const p=toSlot(e.clientX,e.clientY);
  if(d.moved){if(p.i>=0&&p.i!==d.i)act(d.i,p.i);return}
  tap(d.i)});
 cv.addEventListener('pointercancel',()=>{drag=null});
 function tap(i){
  const s=st.slots[i];
  if(sel==null){if(s){sel=i;beep(600,.04)}info();return}
  if(i===sel){// 같은 자리를 다시 누르면 합치기(짝꿍이 있으면) 아니면 선택 풀기
   const m=G.mates(st,i).filter(j=>j!==i);if(m.length&&G.canMerge(st,m[0],i)){doMerge(m[0],i);return}sel=null;info();return}
  act(sel,i);
 }
 function act(a,b){
  if(G.canMerge(st,a,b)){doMerge(a,b);return}
  const A=st.slots[a],B=st.slots[b];
  if(A&&B&&A.id===B.id){const u=G.UNITS[A.id];toast(u.g>=5?'왕은 더 합칠 수 없어요. 최고 등급이에요!':`${u.name}가 ${G.NEED(u.g)}명 모여야 합쳐져요.`);sel=b;info();return}
  if(A){G.move(st,a,b);sel=st.slots[b]?b:null;beep(500,.04)}else{sel=B?b:null}
  info();
 }
 function doMerge(a,b){const g=G.UNITS[st.slots[a].id].g;G.merge(st,a,b);for(const ev of st.events)handle(ev);st.events.length=0;sel=b;beep(660,.12);setTimeout(()=>beep(880,.12),90);info();hud()}
 // ---------- 버튼 ----------
 $('#gd-summon').onclick=()=>{const r=G.summon(st);if(r==='gold')toast('금화가 모자라요. 적을 물리치면 금화가 생겨요.');else if(r==='full')toast('자리가 꽉 찼어요. 같은 병사를 합치거나 팔아 보세요.');for(const ev of st.events)handle(ev);st.events.length=0;hud()};
 $('#gd-moat').onclick=()=>{G.useSkill(st,'moat');for(const ev of st.events)handle(ev);st.events.length=0;hud()};
 $('#gd-drum').onclick=()=>{G.useSkill(st,'drum');for(const ev of st.events)handle(ev);st.events.length=0;hud()};
 $('#gd-dice').onclick=()=>{
  const r=G.rollDice(st);if(!r){toast('행운석이 필요해요. 보스를 물리치거나 5웨이브마다 생겨요.');return}
  const face=G.DICE_FACES[r.face];paused=true;
  const d=modal(`<p class="eyebrow">JURYEONGGU · 주령구</p><h2>주령구를 굴려요!</h2><div class="gd-dice"><div class="gd-cube" id="gd-cube">?</div></div><p id="gd-dres" class="gd-dres">데굴데굴…</p><p class="small">주령구는 월지(안압지)에서 나온 신라의 14면 주사위예요. 면마다 재미있는 벌칙이 새겨져 있었어요.</p><div class="stack"><button class="primary" id="gd-dok">좋아요</button></div>`);
  const faces=G.DICE_FACES.map(f=>f.t);let n=0;const spin=setInterval(()=>{$('#gd-cube').textContent=faces[n++%14].split(' ')[0];beep(300+n*20,.03)},70);
  setTimeout(()=>{clearInterval(spin);$('#gd-cube').textContent=face.t.split(' (')[0];$('#gd-dres').innerHTML=r.got?`<b>${G.UNITS[r.got].name}</b>${G.UNITS[r.got].g>=5?' 왕이 나왔어요!!':' 소환!'}`:face.v==='none'?'꽝! 벌칙을 해 볼까요? 😆':face.v==='king'?'왕의 부름… 이번엔 금화 60개!':`${face.t}!`;for(const ev of st.events)handle(ev);st.events.length=0;hud()},1100);
  $('#gd-dok').onclick=()=>d.close();d.addEventListener('close',()=>{paused=false},{once:true});
 };
 $('#gd-book').onclick=book;
 function book(){paused=true;const d=modal(`<p class="eyebrow">LEGEND RECIPES</p><h2>전설 조합서</h2><p class="small">정해진 세 병사를 모으면 전설 인물을 부를 수 있어요. 전설 3명을 합치면 <b>신라 왕</b>이 나와요!</p><div class="gd-recipes">${G.RECIPES.map(r=>{const ok=G.recipeReady(st,r);return `<div class="gd-rec ${ok?'ok':''}"><img src="${icon(r.id)}" alt=""><div><b>${G.UNITS[r.id].name}</b><span>${r.need.map(n=>`<em class="${st.slots.some(s=>s&&s.id===n)?'have':''}">${G.UNITS[n].name}</em>`).join(' + ')}</span></div><button data-rec="${r.id}" ${ok?'':'disabled'}>조합</button></div>`}).join('')}</div><div class="stack"><button id="gd-bclose">닫기</button></div>`);
  d.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>{G.craft(st,b.dataset.rec);for(const ev of st.events)handle(ev);st.events.length=0;d.close();hud();info()});
  $('#gd-bclose').onclick=()=>d.close();d.addEventListener('close',()=>{paused=false},{once:true})}
 $('#gd-speed').onclick=()=>{speed=speed===1?2:1;$('#gd-speed').innerHTML=speed===1?'▶▶<small>빠르게</small>':'▶<small>보통</small>'};
 $('#gd-pause').onclick=()=>{paused=!paused;$('#gd-pause').textContent=paused?'▶':'Ⅱ';if(paused)toast('잠시 멈췄어요.')};
 $('#gd-dex').onclick=dex;
 function dex(){paused=true;const grades=[5,4,3,2,1];const d=modal(`<p class="eyebrow">COLLECTION</p><h2>월성 수호대 도감</h2><p class="small">만난 병사·인물 ${Object.keys(meta.seen).length} / ${Object.keys(G.UNITS).length} · 찾은 유물 ${Object.keys(meta.relics).length} / ${Object.keys(G.RELICS).length} · 최고 기록 ${meta.best}웨이브 · 지금까지 만난 왕 ${meta.kings}번</p>
  ${grades.map(g=>`<h3 class="gd-gh" style="--c:${G.GRADES[g-1].color}">${G.GRADES[g-1].name}</h3><div class="gd-dex">${G.BY_GRADE(g).map(id=>meta.seen[id]?`<button data-u="${id}"><img src="${icon(id)}" alt=""><b>${G.UNITS[id].name}</b></button>`:`<button disabled><span>?</span><b>???</b></button>`).join('')}</div>`).join('')}
  <h3 class="gd-gh" style="--c:#8a6a3a">유물</h3><div class="gd-dex">${Object.entries(G.RELICS).map(([k,r])=>meta.relics[k]?`<button data-r="${k}"><span class="gd-relic">${RELIC_ICON[k]}</span><b>${r.name}</b></button>`:`<button disabled><span>?</span><b>???</b></button>`).join('')}</div><p id="gd-dexinfo" class="gd-dexinfo"></p>`);
  d.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const u=G.UNITS[b.dataset.u];$('#gd-dexinfo').innerHTML=`<b>${u.name}</b> (${G.GRADES[u.g-1].name}) ${u.fact}`});
  d.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const r=G.RELICS[b.dataset.r];$('#gd-dexinfo').innerHTML=`<b>${r.name}</b> ${r.fact} <em>${r.effect}</em>`});
  d.addEventListener('close',()=>{paused=false},{once:true})}
 // 유물 그림(직접 그린 작은 SVG)
 const sv=b=>`<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">${b}</svg>`;
 const RELIC_ICON={
  mokgan:sv('<rect x="15" y="3" width="10" height="34" rx="2" fill="#c9a46a" stroke="#7a5a2a"/><path d="M18 8h4M18 12h4M18 16h3M18 21h4M18 25h4M18 30h3" stroke="#2a1f17" stroke-width="1.6"/>'),
  smile:sv('<circle cx="20" cy="20" r="16" fill="#b5a58a" stroke="#6a5a42" stroke-width="2"/><circle cx="14" cy="17" r="2" fill="#4a3a2a"/><circle cx="26" cy="17" r="2" fill="#4a3a2a"/><path d="M12 24q8 7 16 0" fill="none" stroke="#4a3a2a" stroke-width="2.2" stroke-linecap="round"/><path d="M20 19v4" stroke="#4a3a2a" stroke-width="1.6"/>'),
  bell:sv('<path d="M17 4h6v4h-6z" fill="#4a6a58"/><path d="M11 10q9-4 18 0l2 22H9z" fill="#5f8a72" stroke="#34503f"/><path d="M9 32h22" stroke="#34503f" stroke-width="2"/><circle cx="20" cy="22" r="3.5" fill="#d9c27a"/>'),
  star:sv('<path d="M14 37q-2-14 3-24h6q5 10 3 24z" fill="#d6c9a6" stroke="#8a7a5a"/><rect x="15" y="8" width="10" height="3" fill="#b8a982"/><path d="M30 3l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="#ffd75a"/>'),
  crown:sv('<rect x="7" y="26" width="26" height="6" fill="#e9b830"/><g fill="#e9b830"><rect x="11" y="9" width="3" height="18"/><rect x="18.5" y="6" width="3" height="21"/><rect x="26" y="9" width="3" height="18"/><rect x="8" y="14" width="9" height="2.4"/><rect x="8" y="20" width="9" height="2.4"/><rect x="15.5" y="12" width="9" height="2.4"/><rect x="15.5" y="18" width="9" height="2.4"/><rect x="23" y="14" width="9" height="2.4"/><rect x="23" y="20" width="9" height="2.4"/></g><g fill="#3fae6a"><circle cx="10" cy="34" r="1.6"/><circle cx="16" cy="34" r="1.6"/><circle cx="24" cy="34" r="1.6"/><circle cx="30" cy="34" r="1.6"/></g>'),
  dogu:sv('<circle cx="20" cy="10" r="5" fill="#a8774a"/><path d="M14 16h12l2 14h-5l-1 7h-4l-1-7h-5z" fill="#a8774a"/><path d="M14 18l-6 7M26 18l6-5" stroke="#a8774a" stroke-width="3.4" stroke-linecap="round"/><circle cx="18.3" cy="9.5" r=".9" fill="#3a2a1a"/><circle cx="21.7" cy="9.5" r=".9" fill="#3a2a1a"/>'),
  giwa:sv('<path d="M3 26q17-14 34 0z" fill="#4a5054"/><g stroke="#2a2f32" stroke-width="1.4"><path d="M8 24l2-6M14 21l1-7M20 20v-7M26 21l-1-7M32 24l-2-6"/></g><g fill="#8a8f92"><circle cx="7" cy="27" r="2.4"/><circle cx="13.5" cy="27" r="2.4"/><circle cx="20" cy="27" r="2.4"/><circle cx="26.5" cy="27" r="2.4"/><circle cx="33" cy="27" r="2.4"/></g><rect x="6" y="29" width="28" height="6" fill="#7a3a2c"/>'),
  dice:sv('<path d="M20 3l14 8v18l-14 8-14-8V11z" fill="#d9c08a" stroke="#8a6a3a" stroke-width="1.5"/><path d="M6 11l14 8 14-8M20 19v18" fill="none" stroke="#8a6a3a"/><text x="13" y="17" font-size="5" fill="#3a2410">禁</text><text x="22" y="30" font-size="5" fill="#3a2410">歌</text>')
 };
 function relicPick(){
  if(relicPick.open)return;relicPick.open=true;const ch=st.pendingRelic;
  const d=modal(`<p class="eyebrow">EXCAVATION · 발굴</p><h2>유물을 발굴했어요!</h2><p class="small">하나를 골라 이번 판 내내 힘을 얻어요.</p><div class="gd-relics">${ch.map(k=>{const r=G.RELICS[k];return `<button data-k="${k}"><span class="gd-relic">${RELIC_ICON[k]}</span><b>${r.name}</b><em>${r.effect}</em><small>${r.fact}</small>${st.relics[k]?`<i>×${st.relics[k]+1}</i>`:''}</button>`}).join('')}</div>`);
  const close=d.querySelector('.close');if(close)close.style.display='none';
  d.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{G.pickRelic(st,b.dataset.k);for(const ev of st.events)handle(ev);st.events.length=0;relicPick.open=false;d.close();beep(700,.2);hud()});
  d.addEventListener('cancel',e=>e.preventDefault());
 }
 function over(why){
  const best=st.wave>meta.best;if(best){meta.best=st.wave;meta.bestKills=st.kills}saveMeta();
  setTimeout(()=>{const d=modal(`<p class="eyebrow">GAME OVER</p><h2>${why==='boss'?'보스를 막지 못했어요':'월성이 적에게 둘러싸였어요'}</h2><p><b>${st.wave}웨이브</b>까지 지켰어요. 적 ${st.kills}명을 물리쳤어요.${kingsThisGame?` 신라 왕을 ${kingsThisGame}번 불렀어요!`:''}</p><p>${best?'🎉 <b>최고 기록!</b>':'최고 기록: '+meta.best+'웨이브'}</p><p class="small">💡 ${tip(why)}</p><div class="stack"><button class="primary" id="gd-again">다시 지키기</button><button id="gd-card">기록 카드 저장</button></div>`);
   $('#gd-again').onclick=()=>{d.close();start()};$('#gd-card').onclick=card},500);
 }
 function tip(why){if(why==='boss')return '보스가 나오면 해자를 채우고 진군 북을 쳐서 한꺼번에 공격해요.';if(!Object.keys(st.relics).length)return '유물을 고르면 힘이 세져요.';return '같은 병사를 모아 합치면 훨씬 세져요. 조합서도 확인해 보세요.'}
 async function card(){
  const c=document.createElement('canvas');c.width=1080;c.height=1350;const g=c.getContext('2d');
  g.drawImage(cv,0,0,cv.width,cv.height,0,0,1080,1080*cv.height/cv.width);
  g.fillStyle='#1c1712';g.fillRect(0,1080,1080,270);g.fillStyle='#f2c440';g.font='800 30px "Noto Sans KR",sans-serif';g.fillText('GYEONGJU TRIP · 월성 수호대',60,1140);
  g.fillStyle='#fff';g.font='900 72px "Noto Sans KR",sans-serif';g.fillText(st.wave+'웨이브 수호 성공',60,1225);g.font='600 32px "Noto Sans KR",sans-serif';g.fillStyle='#d9cfb4';g.fillText(`적 ${st.kills}명 · 최고 ${meta.best}웨이브${kingsThisGame?' · 신라 왕 등장!':''}`,60,1290);
  c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='wolseong-guard.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)},'image/png');toast('기록 카드를 저장했어요.');
 }
 function help(){paused=true;const d=modal(`<p class="eyebrow">HOW TO PLAY</p><h2>월성 수호대</h2><ol class="gd-how">
  <li><b>🪙 소환</b>을 누르면 신라 병사가 무작위로 나와요.</li>
  <li><b>같은 병사를 눌러 합치면</b> 다음 등급이 나와요. (일반·희귀 2명, 영웅·전설 3명)</li>
  <li>등급: 일반 → 희귀 → 영웅 → 전설 → <b style="color:#d23a2a">신라 왕</b>. 왕은 아주 귀하지만 엄청 세요!</li>
  <li><b>🌊 해자</b>는 적을 느리게, <b>🥁 진군 북</b>은 병사를 빠르게 해요.</li>
  <li><b>🎲 주령구</b>는 행운석으로 굴려요. 전설이나 왕이 나올지도!</li>
  <li>5웨이브마다 <b>유물 발굴</b>, 10웨이브마다 <b>보스</b>. 적이 100명 쌓이면 끝!</li></ol>
  <div class="stack"><button class="primary" id="gd-go">지키러 가기</button></div>`);$('#gd-go').onclick=()=>d.close();d.addEventListener('close',()=>{paused=false;meta.seenHelp=true;saveMeta()},{once:true})}
 start();if(!meta.seenHelp)help();
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&st&&!st.over){paused=true;$('#gd-pause').textContent='▶'}});
 if(new URLSearchParams(location.search).has('debug'))window.__gd={G,get st(){return st},set speed(v){speed=v},meta,start,redraw(){mapCache=null}};
}
