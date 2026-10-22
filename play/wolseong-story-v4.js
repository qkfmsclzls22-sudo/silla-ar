import {inkScene,inkProp} from './ink-scenes-v5.js';
import {read,write} from './ui.js';
import {$,esc,modal,toast,pic,shell,tabs,palette,cover,contain,round,text,ellipse,onPointer,clamp,flash} from './mobile-kit-v4.js';
import {defaults,cleanCharacter,characterOptions,drawCharacter,miniFace} from './character-v4.js';
const props=[['deer','꽃사슴'],['lotus','연꽃'],['pine','소나무'],['lantern','등불'],['palace','작은 궁궐'],['pagoda','돌탑']];
export async function mountWolseong(root){
 const key='gj-wolseong-story-v4',stored=read(key,{});let avatar=cleanCharacter(stored?.avatar),mode='person',category='face',selected=-1,pending=null,dragging=false,moved=false,startPoint=null;
 let figures=Array.isArray(stored?.figures)?stored.figures.filter(v=>v&&['person',...props.map(p=>p[0])].includes(v.type)&&Number.isFinite(v.x)&&Number.isFinite(v.y)).slice(0,18).map(v=>({...v,x:clamp(v.x,50,550),y:clamp(v.y,340,735),size:clamp(Number(v.size)||1,.65,1.5),avatar:cleanCharacter(v.avatar)})):[];
 let title=typeof stored?.title==='string'?stored.title.slice(0,18):'오늘, 월성에서';
 const history=[];
 const stage=shell(root,{tour:'wolseong',title:'월성에 놀러 온 나',kicker:'월성 / 신라에서 만나는 또 다른 나',chip:'나를 닮은 신라인을 만나 보세요'});
 const [wing,earrings]=await Promise.all([pic('../heritage/assets/wing/photo-v1.png'),pic('../heritage/assets/earrings/overlay-v1.png')]);const ornaments={wing,earrings};stage.ready();
 function persist(){write(key,{avatar,figures,title});}
 function checkpoint(){history.push(JSON.stringify(figures));if(history.length>30)history.shift();}
 function controls(){
  tabs($('#mode-tabs'),[['person','나만의 신라인'],['scene','월성 나들이']],mode,id=>{mode=id;pending=null;selected=-1;controls();draw();});
  stage.chip(mode==='person'?'표정부터 옷차림까지, 나답게':`나의 월성 · ${figures.length}/18 조각`);
  $('#stage-actions').innerHTML=mode==='person'?'<button id="shuffle-avatar">마구 섞기 ↻</button><button id="see-scene" style="margin-left:5px">내 월성 →</button>':'<button id="scene-title">장면 이름</button>';
  $('#shuffle-avatar')?.addEventListener('click',()=>{for(const k of ['face','hair','outfit','pose'])avatar[k]=Math.floor(Math.random()*(k==='face'?8:4));avatar.tone=Math.floor(Math.random()*6);persist();controls();draw();});$('#see-scene')?.addEventListener('click',()=>{mode='scene';pending=null;controls();draw();});$('#scene-title')?.addEventListener('click',rename);
  const body=$('#control-body');
  if(mode==='person'){
   body.innerHTML=`<div class="avatar-tabs" role="tablist" aria-label="인물 꾸미기">${[['face','표정'],['hair','머리'],['outfit','옷차림'],['pose','동작']].map(([id,n])=>`<button role="tab" data-category="${id}" aria-selected="${category===id}">${n}</button>`).join('')}</div><div class="avatar-options">${characterOptions[category].map((n,i)=>`<button data-option="${i}" aria-pressed="${avatar[category]===i}">${category==='face'?miniFace(i):`<canvas width="100" height="90" data-mini="${i}" aria-hidden="true"></canvas>`}<span>${n}</span></button>`).join('')}</div>${category==='outfit'?palette(avatar.tone):category==='hair'?`<div class="choice-row palette" aria-label="피부색">${['#f5d7b5','#eac59d','#d7a775','#b98258','#8e6045'].map((t,i)=>`<button data-skin="${i}" style="--tone:${t}" aria-label="피부색 ${i+1}" aria-pressed="${avatar.skin===i}"></button>`).join('')}</div>`:''}<div class="action-row"><button id="place-person" class="primary">내 월성에 등장시키기 →</button></div>`;
   body.querySelectorAll('[data-mini]').forEach(cv=>{const a={...avatar,[category]:+cv.dataset.mini};drawCharacter(cv.getContext('2d'),a,50,84,.32,ornaments);});
   body.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;controls();});body.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{avatar[category]=+b.dataset.option;persist();controls();draw();});body.querySelectorAll('[data-tone]').forEach(b=>b.onclick=()=>{avatar.tone=+b.dataset.tone;persist();controls();draw();});body.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>{avatar.skin=+b.dataset.skin;persist();controls();draw();});$('#place-person').onclick=()=>{if(figures.length>=18){toast('장면이 가득 찼어요. 한 조각을 선택해 빼 주세요.');return;}mode='scene';pending='person';selected=-1;controls();draw();};
   stage.note(avatar.outfit===2?'국가유산청 금제 관식·귀걸이 자료로 금빛 포인트!':'표정, 머리, 옷, 동작을 골라 나만의 신라인을 완성해요.');
  }else{
   body.innerHTML=`<div class="choice-row" aria-label="월성에 놓을 조각">${props.map(([id,n],i)=>`<button class="prop-choice" data-prop="${id}" aria-pressed="${pending===id}"><canvas width="80" height="70" data-mini-prop="${id}" aria-hidden="true"></canvas>${n}</button>`).join('')}</div>${selected>=0?`<label class="tiny-label" for="figure-size">선택한 조각 크기 <input id="figure-size" type="range" min="65" max="150" value="${Math.round(figures[selected].size*100)}"></label>`:`<p class="control-copy" style="margin:0">${pending?'놓고 싶은 잔디를 톡 누르세요.':'인물과 소품을 끌어 옮겨 나만의 풍경을 만드세요.'}</p>`}<div class="action-row">${pending?'<button id="auto-place" class="primary">마당 가운데에 놓기</button>':selected>=0?'<button id="remove-figure" class="subtle-btn">선택한 조각 빼기</button>':'<button id="add-friend" class="primary">새 친구 만들기</button>'}<button id="undo-scene" class="subtle-btn" ${!history.length?'disabled':''}>되돌리기</button></div>`;
   body.querySelectorAll('[data-mini-prop]').forEach(cv=>inkProp(cv.getContext('2d'),cv.dataset.miniProp,40,65,.48));
   body.querySelectorAll('[data-prop]').forEach(b=>b.onclick=()=>{if(figures.length>=18){toast('한 조각을 빼면 더 놓을 수 있어요.');return;}pending=b.dataset.prop;selected=-1;controls();draw();});$('#add-friend')?.addEventListener('click',()=>{mode='person';controls();draw();});$('#auto-place')?.addEventListener('click',()=>place({x:300,y:560}));$('#remove-figure')?.addEventListener('click',()=>{checkpoint();figures.splice(selected,1);selected=-1;persist();controls();draw();});$('#undo-scene').onclick=()=>{if(!history.length)return;figures=JSON.parse(history.pop());selected=-1;pending=null;persist();controls();draw();};
   const slider=$('#figure-size');if(slider){slider.addEventListener('pointerdown',checkpoint,{once:true});slider.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)&&!e.repeat)checkpoint();});slider.oninput=e=>{figures[selected].size=+e.target.value/100;persist();draw();};}
   stage.note(pending?(pending==='person'?'새로운 나의 첫걸음, 잔디 위를 눌러 주세요.':'놓고 싶은 곳을 누르면 풍경이 완성돼요.'):figures.length?'조각을 눌러 선택하고, 끌어서 위치를 바꿔요.':'당신과 친구들이 걸어 들어올 작은 월성.');
  }
 }
 function place(p){if(!pending||figures.length>=18)return;checkpoint();figures.push({type:pending,x:clamp(p.x,50,550),y:clamp(p.y,340,735),size:1,avatar:{...avatar}});pending=null;selected=-1;persist();controls();draw();flash();}
 function rename(){const d=modal(`<p class="eyebrow">A SCENE TO REMEMBER</p><h2>이 장면의 제목</h2><form id="scene-name"><input maxlength="18" aria-label="장면 제목" value="${esc(title)}" required><button class="primary" type="submit" style="margin-top:14px">이름 붙이기</button></form>`);$('#scene-name',d).onsubmit=e=>{e.preventDefault();title=$('input',d).value.trim()||'오늘, 월성에서';persist();d.close();draw();};}
 function draw(c=stage.ctx,exporting=false){
  inkScene(c,'wolseong');
  if(mode==='person'){
   drawCharacter(c,avatar,300,714,2.05,ornaments);
  }else{
   text(c,title,300,102,27,'#3e5c40');text(c,'WOLSEONG · MY LITTLE STORY',300,132,10,'#8e855a');
   if(!figures.length){ellipse(c,300,554,75,15,'#57623a17');text(c,'여기서 우리의 이야기가 시작돼요',300,609,15,'#6c7956');}
   const sorted=figures.map((f,i)=>({...f,index:i})).sort((a,b)=>a.y-b.y);
   for(const f of sorted){const factor=(.72+(f.y-340)/1000)*f.size;if(f.type==='person')drawCharacter(c,f.avatar,f.x,f.y,factor,ornaments);else inkProp(c,f.type,f.x,f.y,factor);
    if(f.index===selected&&!exporting){c.save();c.setLineDash([4,5]);c.strokeStyle='#fffce7';c.lineWidth=3;ellipse(c,f.x,f.y+5,55*factor,13*factor,'#ffffff00');c.stroke();c.restore();}}
   if(pending&&!exporting){c.save();c.setLineDash([5,7]);c.strokeStyle='#5b7c4d';c.lineWidth=2;ellipse(c,300,562,58,17,'#fff9db66');c.stroke();c.restore();text(c,'+',300,555,28,'#5d7652');}
  }
 }
 function hit(p){return figures.map((f,i)=>({f,i})).sort((a,b)=>b.f.y-a.f.y).find(({f})=>{const s=(.72+(f.y-340)/1000)*f.size;return Math.abs(p.x-f.x)<65*s&&p.y<f.y+18&&p.y>f.y-(f.type==='person'?250:145)*s;})?.i??-1;}
 onPointer(stage.canvas,{start:p=>{if(mode!=='scene')return;startPoint=p;moved=false;if(pending)return;selected=hit(p);dragging=selected>=0;if(dragging)checkpoint();controls();draw();},move:p=>{if(!dragging||selected<0)return;if(Math.hypot(p.x-startPoint.x,p.y-startPoint.y)>5)moved=true;const f=figures[selected];f.x=clamp(f.x+p.x-startPoint.x,50,550);f.y=clamp(f.y+p.y-startPoint.y,340,735);startPoint=p;draw();},end:p=>{if(mode!=='scene')return;if(pending)place(p);else if(dragging){persist();controls();}dragging=false;},cancel:()=>{dragging=false;persist();}});
 stage.save(draw);controls();draw();
}
