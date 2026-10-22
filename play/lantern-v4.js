import {inkScene} from './ink-scenes-v5.js';
import {read,write} from './ui.js';
import {$,esc,modal,toast,pic,shell,tabs,palette,tones,coords,cover,ellipse,round,text,wrap,onPointer,clamp,flash} from './mobile-kit-v4.js';
import {stoneFit,cleanLanterns} from './game-rules-v4.js';
const key='gj-bulguksa-v4',slots=Array.from({length:8},(_,i)=>({x:90+i%4*140,y:365+Math.floor(i/4)*195}));
export async function mountLantern(root){
 const stored=read(key,{});let lanterns=cleanLanterns(stored?.lanterns),stones=Array.isArray(stored?.stones)?stored.stones.filter(s=>s&&Number.isFinite(s.x)&&Number.isFinite(s.w)&&s.x>=50&&s.x<=550&&s.w>25&&s.w<240).slice(0,9):[];
 let mode='lantern',night=!!stored?.night,draft=null,stoneX=300,drop=null,raf=0,moved=false;
 const stage=shell(root,{tour:'bulguksa',title:'소원을 담는 마당',kicker:'01 / BULGUKSA · A LITTLE WISH',chip:'불국사에서, 마음 하나'});
 stage.ready();
 const persist=()=>write(key,{lanterns,stones,night});
 function renderTabs(){tabs($('#mode-tabs'),[['lantern','연등 달기'],['stones','돌탑 쌓기']],mode,id=>{mode=id;draft=null;controls();draw();});}
 function controls(){
  renderTabs();$('#stage-actions').innerHTML=`<button id="night-toggle" aria-pressed="${night}">${night?'☀ 낮 풍경':'☾ 밤 풍경'}</button>`;$('#night-toggle').onclick=()=>{night=!night;persist();controls();draw();};
  stage.chip(mode==='lantern'?`나의 소원등 ${lanterns.length} / 8`:`정성으로 쌓은 ${stones.length}개의 돌`);
  if(mode==='lantern'){
   $('#control-body').innerHTML=`<div><h2 class="control-title">${draft?'어느 자리에 달아 볼까요?':lanterns.length?'바람에 살랑, 나의 작은 소원':'소원 하나, 마음이 환해지는 순간'}</h2><p class="control-copy">${draft?'반짝이는 빈자리를 누르면 연등이 매달려요.':'한지 등표에 마음을 적고, 연등 줄에 직접 달아 보세요.'}</p></div><div class="step-pills"><span class="${!draft?'active':''}">01 등표 쓰기</span><span class="${draft?'active':''}">02 자리 고르기</span><span>03 추억 담기</span></div><div class="action-row"><button id="write-wish" class="${draft?'subtle-btn':'primary'}">${draft?'등표 고치기':lanterns.length?'소원등 하나 더':'나의 소원 적기'}</button>${draft?'<button id="auto-hang" class="primary">추천 자리에 달기</button>':lanterns.length?'<button id="view-wishes" class="subtle-btn">내 등표 보기</button>':''}</div>`;
   $('#write-wish').onclick=wishForm;if(draft)$('#auto-hang').onclick=()=>{const empty=slots.findIndex((_,i)=>!lanterns.some(l=>l.slot===i));if(empty>=0)hang(empty);};
   if($('#view-wishes'))$('#view-wishes').onclick=()=>wishDetail(lanterns.at(-1));
   stage.note(draft?'빈 동그라미를 톡! 연등을 매달아 주세요.':lanterns.length?'매달린 등을 누르면 마음을 다시 읽을 수 있어요.':'등표에 담은 마음이 이 마당을 밝혀요.');
  }else{
   const done=stones.length>=9;
   $('#control-body').innerHTML=`<div><h2 class="control-title">${done?'차곡차곡, 아홉 번의 마음':stones.length?'중심을 맞춰, 조금 더 높이':'작은 돌에도 소원을 담아요'}</h2><p class="control-copy">${done?'작은 돌탑이 완성됐어요. 위쪽 저장 버튼으로 간직하세요.':'돌을 좌우로 움직여 아래 돌 위에 살며시 내려놓으세요.'}</p></div>${!done?`<label class="tiny-label" for="stone-position">돌의 위치 <input type="range" id="stone-position" min="65" max="535" value="${stoneX}" aria-label="쌓을 돌의 좌우 위치"></label>`:''}<div class="action-row"><button id="drop-stone" class="primary" ${done?'disabled':''}>${stones.length?'이 자리에 돌 놓기':'첫 번째 돌 놓기'}</button><button id="undo-stone" class="subtle-btn" ${!stones.length?'disabled':''}>한 돌 되돌리기</button></div>`;
   $('#stone-position')?.addEventListener('input',e=>{stoneX=+e.target.value;draw();});$('#drop-stone').onclick=placeStone;$('#undo-stone').onclick=()=>{if(drop)return;stones.pop();persist();controls();draw();};stage.note(done?'소원을 담은 돌탑 완성! 오늘의 마음을 사진으로 남겨요.':'돌을 끌거나 아래 막대로 중심을 맞춰 보세요.');
  }
 }
 function wishForm(){
  if(lanterns.length>=8&&!draft){toast('여덟 개의 소원등이 가득 찼어요. 내 등표 보기에서 하나를 내려 주세요.');return;}
  let tone=draft?.tone??0;
  const d=modal(`<p class="eyebrow">WRITE YOUR LITTLE WISH</p><h2>당신의 마음을 매달아요</h2><form id="wish-form"><div class="wish-paper"><label for="wish-text">소 원 등 표</label><textarea id="wish-text" maxlength="48" rows="3" required placeholder="우리 가족 모두\n건강하고 행복하길">${esc(draft?.text||'')}</textarea><small><span id="wish-count">${draft?.text.length||0}</span> / 48</small><input id="wish-name" maxlength="10" aria-label="등표에 적을 이름" placeholder="마음을 담은 이름" value="${esc(draft?.name||'')}"></div><div class="wish-options">${palette(tone)}</div><p class="save-note" style="text-align:center">내 기기에 간직하는 소원이에요.</p><button class="primary" type="submit">이 마음으로 연등 만들기</button></form>`);
  d.querySelectorAll('[data-tone]').forEach(b=>b.onclick=()=>{tone=+b.dataset.tone;d.querySelectorAll('[data-tone]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
  $('#wish-text',d).oninput=e=>{$('#wish-count',d).textContent=e.target.value.length;};
  $('#wish-form',d).onsubmit=e=>{e.preventDefault();const value=$('#wish-text',d).value.trim();if(!value){$('#wish-text',d).focus();return;}draft={text:value,name:$('#wish-name',d).value.trim()||'여행자',tone};d.close();controls();draw();};
 }
 function hang(slot){
  if(!draft||lanterns.some(l=>l.slot===slot)||drop)return;
  const l={...draft,slot};lanterns.push(l);draft=null;persist();controls();flash();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now();
  const animate=now=>{const t=reduced?1:Math.min(1,(now-start)/650);drop={slot,dy:(1-t)**3*190};draw();if(t<1)raf=requestAnimationFrame(animate);else{drop=null;draw();}};raf=requestAnimationFrame(animate);toast('소원등이 매달렸어요. 마음이 닿기를!');
 }
 function wishDetail(l){if(!l)return;const d=modal(`<p class="eyebrow">MY WISH · BULGUKSA</p><h2>등표에 담아 둔 마음</h2><div class="wish-paper"><label>소 원 등 표</label><p style="white-space:pre-wrap;font-size:18px;line-height:1.8">${esc(l.text)}</p><small>${esc(l.name)}</small></div><div class="action-row"><button id="close-wish" class="primary">마당으로</button><button id="remove-wish" class="subtle-btn">이 등 내리기</button></div><div class="choice-row">${lanterns.map((v,i)=>`<button data-wish-slot="${v.slot}">${i+1}번 등표</button>`).join('')}</div>`);$('#close-wish',d).onclick=()=>d.close();$('#remove-wish',d).onclick=()=>{lanterns=lanterns.filter(v=>v.slot!==l.slot);persist();d.close();controls();draw();};d.querySelectorAll('[data-wish-slot]').forEach(b=>b.onclick=()=>wishDetail(lanterns.find(v=>v.slot===+b.dataset.wishSlot)));}
 function placeStone(){
  if(drop||stones.length>=9)return;const w=stoneWidth(stones.length),fit=stoneFit(stones,stoneX,w),start=performance.now(),target=710-stones.length*39;
  $('#drop-stone').disabled=true;
  const animate=now=>{const t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-start)/420);drop={stone:true,x:stoneX,y:target-95*(1-t)**2,w};draw();if(t<1)raf=requestAnimationFrame(animate);else{drop=null;if(fit){stones.push({x:stoneX,w});persist();flash();controls();stage.note(stones.length===9?'소원 돌탑 완성! 사진으로 간직해 보세요.':`${stones.length}번째 돌이 자리를 잡았어요. 다음 돌도 천천히.`);}else{controls();stage.note('앗, 중심이 벗어났어요! 아래 돌의 가운데로 옮겨 보세요.');toast('아래 돌과 조금 더 겹치도록 옮겨 주세요.');}draw();}};raf=requestAnimationFrame(animate);
 }
 function draw(c=stage.ctx,exporting=false){
  inkScene(c,'bulguksa');if(night){c.fillStyle='#132739ad';c.fillRect(0,0,600,800);for(let i=0;i<23;i++)ellipse(c,(i*173+37)%600,30+(i*47)%130,1,1,'#fff2c5aa');}
  if(mode==='lantern'){
   for(let row=0;row<3;row++){const y=row===0?200:row===1?342:537;c.strokeStyle=night?'#a99972':'#796a49';c.lineWidth=1.6;c.beginPath();c.moveTo(-20,y-27);c.quadraticCurveTo(300,y+25,620,y-27);c.stroke();}
   for(let i=0;i<10;i++)drawLantern(c,15+i*64,205-Math.abs(i-4.5)*3.3,36,tones[i%6],'',night,0);
   if(!lanterns.length&&!draft){drawLantern(c,300,378,140,tones[0],'마음을 담아요',night,0);text(c,'소원이 머무는 자리',300,660,17,night?'#f8e6b6':'#6a5c40');}
   for(const l of lanterns){const p=slots[l.slot];drawLantern(c,p.x,p.y,88,tones[l.tone],l.text,night,drop?.slot===l.slot?drop.dy:0);}
   if(draft&&!exporting)slots.forEach((p,i)=>{if(lanterns.some(l=>l.slot===i))return;c.save();c.setLineDash([5,6]);ellipse(c,p.x,p.y+44,39,44,'#fff4d279');c.strokeStyle='#9b7236';c.lineWidth=2;c.stroke();c.setLineDash([]);text(c,'+',p.x,p.y+52,27,'#795b2d');c.restore();});
  }else{
   ellipse(c,300,739,170,18,'#5747282c');stones.forEach((s,i)=>drawStone(c,s.x,710-i*39,s.w,i));
   if(drop?.stone)drawStone(c,drop.x,drop.y,drop.w,stones.length);
   else if(stones.length<9&&!exporting){const target=710-stones.length*39;c.save();c.setLineDash([4,7]);c.strokeStyle='#6b7e58';c.beginPath();c.moveTo(stoneX,target-65);c.lineTo(stoneX,target+9);c.stroke();c.restore();drawStone(c,stoneX,target-95,stoneWidth(stones.length),stones.length);text(c,'이 돌을 살며시',stoneX,target-137,13,night?'#fff0cc':'#6b623e');}
   if(stones.length===9){text(c,'작은 정성이 모여',300,225,23,night?'#f9e9c3':'#3b513b');text(c,'하나의 소원이 되었어요',300,261,17,night?'#f9e9c3':'#3b513b');}
  }
 }
 onPointer(stage.canvas,{start:p=>{moved=false;if(mode==='stones'&&!drop){stoneX=clamp(p.x,65,535);if($('#stone-position'))$('#stone-position').value=stoneX;draw();}},move:p=>{moved=true;if(mode==='stones'&&!drop){stoneX=clamp(p.x,65,535);if($('#stone-position'))$('#stone-position').value=stoneX;draw();}},end:p=>{if(mode!=='lantern'||moved)return;if(draft){let best=-1,distance=100;slots.forEach((s,i)=>{const d=Math.hypot(p.x-s.x,p.y-(s.y+45));if(d<distance&&!lanterns.some(l=>l.slot===i)){best=i;distance=d;}});if(best>=0)hang(best);}else{const l=lanterns.find(l=>Math.abs(p.x-slots[l.slot].x)<60&&p.y>slots[l.slot].y-10&&p.y<slots[l.slot].y+150);if(l)wishDetail(l);else if(!lanterns.length)wishForm();}}});
 stage.save(draw);controls();draw();window.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
}
function stoneWidth(i){return [208,177,150,128,106,88,74,61,48][i]||48;}
function drawStone(c,x,y,w,i){c.save();c.translate(x,y);const h=43;c.shadowColor='#302d3340';c.shadowBlur=6;c.shadowOffsetY=4;const g=c.createLinearGradient(0,-h,0,8);g.addColorStop(0,['#b5b3a3','#c4baa1','#a6aaa0'][i%3]);g.addColorStop(1,'#6b756c');c.beginPath();c.moveTo(-w*.5,-3);c.bezierCurveTo(-w*.55,-27,-w*.25,-38,-w*.04,-39);c.bezierCurveTo(w*.17,-46,w*.44,-30,w*.49,-11);c.bezierCurveTo(w*.53,3,w*.31,9,0,8);c.bezierCurveTo(-w*.2,10,-w*.46,10,-w*.5,-3);c.fillStyle=g;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle='#5f665b';c.lineWidth=1;c.stroke();for(let k=0;k<34;k++){const sx=((k*47+i*11)%100)/100-.5,sy=((k*19)%29)-27;if(Math.abs(sx)<.43)ellipse(c,sx*w,sy,1.4+(k%3)*.4,.6,k%2?'#e1dbc34d':'#58644e42');}c.beginPath();c.moveTo(-w*.3,-24);c.quadraticCurveTo(0,-40,w*.2,-30);c.strokeStyle='#e4ddbe88';c.stroke();c.restore();}
function drawLantern(c,x,y,size,color,label,night,dy){
 c.save();c.translate(x,y+dy);const k=size/100;c.scale(k,k);if(night){const glow=c.createRadialGradient(0,45,8,0,45,110);glow.addColorStop(0,'#ffeab17a');glow.addColorStop(1,'#ffeab100');c.fillStyle=glow;c.fillRect(-115,-65,230,240);}c.strokeStyle='#7a6443';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-14-dy/k);c.lineTo(0,7);c.stroke();ellipse(c,0,12,10,4,'#7a6648');
 ellipse(c,0,46,47,38,color);c.strokeStyle='#705c43';c.lineWidth=1.1;c.stroke();
 for(const i of [-2,2,-1,1,0]){const px=i*19;c.beginPath();c.moveTo(px,8+Math.abs(i)*6);c.bezierCurveTo(px+23,30,px+19,66,0,83);c.bezierCurveTo(px-19,64,px-23,30,px,8+Math.abs(i)*6);c.fillStyle=color;c.fill();c.strokeStyle='#72563e9c';c.lineWidth=1.2;c.stroke();c.beginPath();c.moveTo(px,16+Math.abs(i)*6);c.quadraticCurveTo(px+2,46,0,77);c.strokeStyle=night?'#ffeec2b3':'#f8e5b96b';c.lineWidth=1;c.stroke();}
 ellipse(c,0,83,12,4,'#c29254');c.strokeStyle='#a24f42';c.beginPath();c.moveTo(0,85);c.lineTo(0,96);c.stroke();c.save();c.rotate(-.045);round(c,-17,96,34,62,2,'#f3e3b7','#b9a172');ellipse(c,0,101,1.5,1.5,'#a88957');c.font='500 7px sans-serif';c.fillStyle='#735a38';c.textAlign='center';wrap(c,label||'평안',0,113,25,10,4);c.restore();c.restore();
}
