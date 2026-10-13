import {$,esc,toast,modal,read,write,saveCanvas} from './ui.js';
import {createStage} from './wolseong-stage3d.js';
import {definitions} from './wolseong-models3d.js';
import {VERSION,LIMIT,restorePieces,canPlace,surfaceAt,snap,heightAt} from './wolseong-world3d.js';
const byId=Object.fromEntries(definitions.map(d=>[d.id,d]));
export async function mountWolseong(root){
 const stored=read('gj-wolseong',null);let pieces=restorePieces(stored,definitions);
 let title=typeof stored?.title==='string'?stored.title.slice(0,24):'나의 넓은 월성',night=stored?.night===true;
 let selected='house',category='전체',tool='build',moving=null,undo=[],active=new Map(),gestureUsed=false;
 root.innerHTML=`<div class="heading"><div><p class="eyebrow">WOLSEONG · MY 3D WORLD</p><h1>내 마음대로, 3D 월성.</h1><p>반달 언덕과 넓은 평지에 집·궁궐·탑을 놓아 보세요.</p></div><span class="badge">3D 꾸미기</span></div>
 <div class="game-layout world-builder world-builder-3d"><section class="world"><div class="world-top"><span class="badge" id="world-title"></span><button id="world-night"></button></div>
 <canvas id="map" aria-label="회전과 확대가 가능한 3D 월성. 짧게 눌러 배치하고 끌어서 회전하세요."></canvas>
 <div class="camera-buttons"><button id="zoom-in" aria-label="3D 화면 확대">＋</button><button id="zoom-out" aria-label="3D 화면 축소">−</button><button id="top-view">위에서</button></div>
 <div class="scene-shortcuts"><button id="home-view">전체 보기</button><button id="plain-view">평지 가까이</button></div>
 <div class="world-bottom"><span class="hint-pill" id="build-hint"></span></div></section>
 <aside class="panel"><section class="card"><label for="map-name">내 월성의 이름</label><input id="map-name" class="title-input" maxlength="24" type="text"><p class="small" style="margin:8px 0 0">자동 저장 · <span id="piece-count"></span>/200개 · 언덕과 평지 모두 배치</p></section>
 <section class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="margin:0">무엇을 놓을까요?</h2><button id="piece-info" aria-label="선택한 요소 설명">?</button></div><div id="categories" class="tabs"></div><div id="catalog" class="catalog"></div></section>
 <section class="card"><div class="tool-row" id="tools"><button data-tool="build">＋ 놓기</button><button data-tool="move">옮기기</button><button data-tool="turn">방향</button><button data-tool="delete">지우기</button><button data-tool="view">둘러보기</button><button data-tool="pan">화면 이동</button><button id="undo" disabled>되돌리기</button><button id="grid" aria-pressed="false">격자</button></div><p class="small" style="margin:14px 0 10px">짧게 누르면 배치 · 끌면 회전<br>두 손가락으로 확대·축소와 이동<br>PC: 마우스 휠 확대 · 오른쪽 드래그 이동</p><button id="clear" class="danger">내 월성 비우기</button></section>
 <button id="export" class="primary">3D 월성 사진 저장</button><div class="notice">월성의 반달 지형에서 출발한 상상 놀이예요. 아래 평지에도 자유롭게 마을을 만들 수 있어요. 건물 모형과 배치는 놀이용으로 단순화했어요.</div></aside></div>`;
 const canvas=$('#map');let stage;
 try{stage=createStage(canvas)}catch(e){root.innerHTML='<div class="card"><h2>3D 화면을 열지 못했어요.</h2><p>Safari나 Chrome에서 다시 열어 주세요. 저장한 월성은 유지됩니다.</p><button id="retry-3d" class="primary">다시 열기</button></div>';$('#retry-3d').onclick=()=>location.reload();return}
 const thumbs=stage.thumbnails();$('#map-name').value=title;
 function update(){
  $('#world-title').textContent=title||'나의 월성';$('#piece-count').textContent=pieces.length;$('#world-night').textContent=night?'☀ 낮으로':'☾ 야경으로';$('#world-night').setAttribute('aria-pressed',night);
  const messages={build:selected==='lotus'?'해자·연못 자리에 연꽃 놓기':'언덕이나 아래 평지를 짧게 눌러 '+byId[selected].name+' 놓기',move:moving===null?'옮길 건물을 누른 뒤 새 땅을 눌러 주세요.':'새로 놓을 언덕이나 평지를 눌러 주세요.',turn:'건물을 누르면 90°씩 돌아가요.',delete:'지울 요소를 눌러 주세요.',view:'끌어서 회전 · 두 손가락으로 확대·이동',pan:'끌어서 화면 이동 · 두 손가락으로 확대·축소'};
  $('#build-hint').textContent=messages[tool];$('#tools').querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool));$('#undo').disabled=!undo.length;
 }
 function save(){write('gj-wolseong',{terrainVersion:VERSION,pieces,title,night});update()}
 function rebuild(){stage.setPieces(pieces);stage.select(moving);update()}
 function snapshot(){undo.push(JSON.stringify(pieces));if(undo.length>25)undo.shift()}
 function catalog(){
  $('#catalog').innerHTML=definitions.filter(d=>category==='전체'||category===d.cat).map(d=>'<button class="prop" data-prop="'+d.id+'" aria-pressed="'+(selected===d.id)+'" aria-label="'+d.name+' 선택"><img src="'+thumbs[d.id]+'" alt=""><span>'+d.name+'</span></button>').join('');
  $('#catalog').querySelectorAll('[data-prop]').forEach(b=>b.onclick=()=>{selected=b.dataset.prop;tool='build';moving=null;stage.cameraMode(false);stage.select(null);stage.preview(selected,null);catalog();update()});
 }
 $('#categories').innerHTML=['전체','건물','명소','자연','사람','블록'].map(c=>'<button data-category="'+c+'" class="'+(c===category?'active':'')+'">'+c+'</button>').join('');
 $('#categories').querySelectorAll('button').forEach(b=>b.onclick=()=>{category=b.dataset.category;$('#categories').querySelectorAll('button').forEach(el=>el.classList.toggle('active',el===b));catalog()});
 $('#tools').querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;moving=null;stage.select(null);stage.preview(selected,null);stage.cameraMode(tool==='pan');update()});
 $('#map-name').oninput=e=>{title=e.target.value;save()};$('#world-night').onclick=()=>{night=!night;stage.setNight(night);save()};
 $('#zoom-in').onclick=()=>stage.zoom(.8);$('#zoom-out').onclick=()=>stage.zoom(1.25);$('#home-view').onclick=()=>stage.view();$('#plain-view').onclick=()=>stage.view('plain');$('#top-view').onclick=()=>stage.view('top');
 $('#grid').onclick=()=>$('#grid').setAttribute('aria-pressed',stage.toggleGrid());
 $('#undo').onclick=()=>{if(!undo.length)return;pieces=JSON.parse(undo.pop());moving=null;rebuild();save()};
 $('#clear').onclick=()=>{const d=modal('<h2>빈 월성에서 시작할까요?</h2><p>지금 놓인 요소가 지워져요. 되돌리기로 복구할 수 있어요.</p><button id="confirm-clear" class="primary">내 월성 비우기</button>');$('#confirm-clear',d).onclick=()=>{snapshot();pieces=[];moving=null;rebuild();save();d.close()}};
 $('#piece-info').onclick=()=>modal('<h2>'+esc(byId[selected].name)+'</h2><p>'+({house:'기와집을 여러 채 모아 언덕 아래 마을을 만들어 보세요.',cottage:'기와집과 초가집을 섞어 내 마을의 골목을 꾸며 보세요.',pagoda:'황룡사 구층목탑에서 아이디어를 얻은 9층 놀이 모형이에요. 평지와 언덕 모두 배치할 수 있어요.',palace:'동궁과 월지의 전각에서 아이디어를 얻은 놀이 모형이에요.',lotus:'월성 해자에서 발견된 가시연꽃 씨앗에서 출발한 요소예요. 해자에 직접 놓아 보세요.'}[selected]||'경주를 떠올리며 만든 입체 놀이 모형이에요. 언덕과 넓은 평지에서 자유롭게 꾸며 보세요.')+'</p><p class="small">실제 유물·건축물의 정밀 복원 모형은 아니에요.</p>');
 $('#export').onclick=()=>{stage.preview(selected,null);stage.select(null);stage.render();saveCanvas(canvas,'my-wolseong-3d.png');stage.select(moving)};
 function locationAt(e){const p=stage.pickTerrain(e);return p?{x:snap(p.x),z:snap(p.z)}:null}
 function fits(id,p,ignore=-1){
  if(!p||!canPlace(id,p.x,p.z))return false;
  const r=byId[id].r;
  return !pieces.some((o,i)=>i!==ignore&&!(id==='lotus'&&o.id==='pond')&&!(id==='pond'&&o.id==='lotus')&&Math.hypot(o.x-p.x,o.z-p.z)<(r+byId[o.id].r)*.74);
 }
 function placeHint(p){const s=p&&surfaceAt(p.x,p.z);toast(s==='moat'||s==='river'?'물길에는 연꽃을, 건물은 언덕 위나 넓은 평지에 놓아 주세요.':s==='slope'?'비탈을 조금 벗어나 평평한 땅을 골라 주세요.':'빈 평지나 언덕 위를 골라 주세요.')}
 function tap(e){
  if(tool==='view'||tool==='pan')return;
  if(tool==='build'||(tool==='move'&&moving!==null)){
   const p=locationAt(e),id=tool==='move'?pieces[moving].id:selected;
   if(!fits(id,p,tool==='move'?moving:-1)){placeHint(p);return}
   if(tool==='build'&&pieces.length>=LIMIT){toast('최대 200개까지 놓을 수 있어요.');return}
   snapshot();if(tool==='build')pieces.push({id,x:p.x,z:p.z,rotation:0});else{pieces[moving]={...pieces[moving],x:p.x,z:p.z};moving=null}
   stage.preview(id,null);rebuild();save();return;
  }
  const index=stage.pickObject(e);if(index<0)return;
  if(tool==='move'){moving=index;stage.select(index);update();return}
  snapshot();if(tool==='delete')pieces.splice(index,1);else if(tool==='turn')pieces[index]={...pieces[index],rotation:(pieces[index].rotation+Math.PI/2)%(Math.PI*2)};rebuild();save();
 }
 // Orbit gestures and placement share the surface. Only a short single-pointer tap places.
 canvas.addEventListener('pointerdown',e=>{if(!active.size)gestureUsed=false;active.set(e.pointerId,{x:e.clientX,y:e.clientY,moved:false,time:performance.now()});if(active.size>1)gestureUsed=true});
 canvas.addEventListener('pointermove',e=>{const a=active.get(e.pointerId);if(a&&Math.hypot(e.clientX-a.x,e.clientY-a.y)>7){a.moved=true;gestureUsed=true;stage.preview(selected,null)}if(!active.size&&e.pointerType==='mouse'&&tool==='build'){const p=locationAt(e);stage.preview(selected,p,fits(selected,p))}});
 canvas.addEventListener('pointerup',e=>{const a=active.get(e.pointerId);active.delete(e.pointerId);if(a&&!a.moved&&!gestureUsed&&performance.now()-a.time<700&&e.button===0)tap(e);if(!active.size)gestureUsed=false});
 canvas.addEventListener('pointercancel',e=>{active.delete(e.pointerId);gestureUsed=true;stage.preview(selected,null)});canvas.addEventListener('pointerleave',()=>{if(!active.size)stage.preview(selected,null)});
 canvas.addEventListener('stage-lost',()=>toast('3D 화면을 복구하고 있어요. 계속 멈추면 새로고침해 주세요. 저장한 월성은 유지돼요.'));
 catalog();stage.setPieces(pieces);stage.setNight(night);update();
 if(stored&&stored.terrainVersion!==VERSION){write('gj-wolseong-before-3d-v3',stored);save();toast('만들어 둔 월성을 3D 공간으로 옮겼어요. 아래 평지도 꾸며 보세요.')}
 if(new URLSearchParams(location.search).has('qa'))window.__wolseong3d={stage,getState:()=>({pieces,title,night}),fits};
 addEventListener('pagehide',()=>stage.dispose(),{once:true});addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
}
