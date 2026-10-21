import { artifacts } from './catalog-v1.js';
const $ = id => document.getElementById(id);
const requested = new URLSearchParams(location.search).get('item');
const id = Object.hasOwn(artifacts, requested) ? requested : 'earrings';
const artifact = artifacts[id];
document.title = `${artifact.title} · 신라 변신 사진관 | 경주트립`;
for (const key of ['title','description','invitation','tip','story','credit']) $(key).textContent=artifact[key];
$('studioTitle').textContent=artifact.title+' 사진관';
artifact.sources.forEach(([label,url])=>{const link=document.createElement('a');link.href=url;link.textContent=label+' ↗';link.target='_blank';link.rel='noopener';$('sourceLinks').append(link);});
const assetRoot=`assets/${id}/`;
const viewer=$('viewer');
viewer.setAttribute('poster',assetRoot+'overlay-v1.png');
viewer.setAttribute('src',assetRoot+'model-v1.glb');
viewer.setAttribute('alt',artifact.title+' 3D 모델');
viewer.addEventListener('load',()=>{$('modelStatus').textContent='3D 준비 완료 · AR은 지원되는 휴대폰에서 열려요.';});
viewer.addEventListener('error',()=>{$('modelStatus').textContent='3D를 불러오지 못했어요. 새로고침해 주세요. 사진 체험은 이용할 수 있어요.';});

const canvas=$('photoCanvas'),ctx=canvas.getContext('2d'),video=$('camera');
let pieces=[],selected=0,stream=null,facing='user',background=null,photoURL=null,resultBlob=null,animation=0,screen='intro',cameraBusy=false,cameraRequest=0;
const overlay=new Image();overlay.src=assetRoot+(artifact.photo||'overlay-v1.png');
overlay.onload=()=>{draw();updateCapture();};overlay.onerror=()=>{$('cameraStatus').textContent='사진 스티커를 불러오지 못했어요. 새로고침해 주세요.';$('capture').disabled=true;};
function reset(){pieces=artifact.pieces.map(p=>({...p,angle:0}));selected=0;renderPieceButtons();syncControls();draw();}
function renderPieceButtons(){
 $('pieceButtons').replaceChildren();pieces.forEach((piece,index)=>{const b=document.createElement('button');b.textContent=piece.name;b.setAttribute('aria-pressed',String(index===selected));b.addEventListener('click',()=>{selected=index;syncControls();draw();});$('pieceButtons').append(b);});
}
function syncControls(){$('size').value=pieces[selected].size;$('angle').value=pieces[selected].angle;Array.from($('pieceButtons').children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));}
function setScreen(next){screen=next;for(const key of ['intro','studio','result'])$(key).hidden=key!==next;window.scrollTo({top:0,behavior:'instant'});if(next==='studio'){drawLoop();$('studioTitle').setAttribute('tabindex','-1');$('studioTitle').focus({preventScroll:true});}else cancelAnimationFrame(animation);}
function stopCamera(){cameraRequest++;stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;$('flipCamera').disabled=true;}
function cover(source,width,height,mirror=false){const scale=Math.max(900/width,1200/height),w=width*scale,h=height*scale;ctx.save();if(mirror){ctx.translate(900,0);ctx.scale(-1,1);}ctx.drawImage(source,(900-w)/2,(1200-h)/2,w,h);ctx.restore();}
function drawGuide(){const grad=ctx.createLinearGradient(0,0,900,1200);grad.addColorStop(0,'#f0e3c8');grad.addColorStop(1,'#d6dbc9');ctx.fillStyle=grad;ctx.fillRect(0,0,900,1200);ctx.fillStyle='#b9b9a775';ctx.beginPath();ctx.ellipse(450,410,145,185,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(450,1060,360,440,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6e7460';ctx.font='22px sans-serif';ctx.textAlign='center';ctx.fillText('얼굴과 몸의 위치를 맞춰 보세요',450,100);}
function draw(includeSelection=true){
 ctx.clearRect(0,0,900,1200);
 if(stream&&video.readyState>=2)cover(video,video.videoWidth,video.videoHeight,facing==='user');
 else if(background)cover(background,background.naturalWidth,background.naturalHeight);
 else drawGuide();
 if(overlay.complete&&overlay.naturalWidth)pieces.forEach((p,index)=>{
  const w=900*p.size,h=w*overlay.naturalHeight/overlay.naturalWidth;
  ctx.save();ctx.translate(p.x*900,p.y*1200);ctx.rotate(p.angle*Math.PI/180);if(p.mirror)ctx.scale(-1,1);ctx.drawImage(overlay,-w/2,-h/2,w,h);
  if(includeSelection&&pieces.length>1&&selected===index){ctx.setLineDash([8,8]);ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);}ctx.restore();
 });
}
function drawLoop(){cancelAnimationFrame(animation);if(screen!=='studio')return;draw();animation=requestAnimationFrame(drawLoop);}
function updateCapture(){const ready=!!background||!!(stream&&video.readyState>=2);$('capture').disabled=!ready||!overlay.complete||!overlay.naturalWidth;$('stageBadge').textContent=stream?'카메라 · 내 기기에서만 처리':background?'내 사진 · 내 기기에서만 처리':'위치 미리보기';}
async function startCamera(){
 if(cameraBusy)return;cameraBusy=true;$('startCamera').disabled=true;$('flipCamera').disabled=true;stopCamera();const request=cameraRequest;
 $('cameraStatus').textContent='카메라를 여는 중이에요. 권한 창이 나오면 허용해 주세요.';
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('unsupported');
  const incoming=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:1600}},audio:false});
  if(request!==cameraRequest||screen!=='studio'){incoming.getTracks().forEach(t=>t.stop());return;}
  stream=incoming;video.srcObject=stream;await video.play();background=null;$('startCamera').textContent='카메라 다시 켜기';$('flipCamera').disabled=false;
  $('cameraStatus').textContent='스티커를 끌어 맞추고 찰칵! 전면 카메라는 거울처럼 보여요.';
 }catch(error){stopCamera();$('cameraStatus').textContent=error.name==='NotAllowedError'?'카메라가 허용되지 않았어요. 브라우저에서 권한을 허용하거나 사진 불러오기를 이용해 주세요.':error.name==='NotFoundError'?'연결된 카메라가 없어요. 사진 불러오기로 체험할 수 있어요.':'카메라를 열지 못했어요. 다른 카메라 앱을 닫고 다시 켜거나 사진 불러오기를 이용해 주세요.';}
 finally{cameraBusy=false;$('startCamera').disabled=false;updateCapture();}
}
$('openPhoto').addEventListener('click',()=>{setScreen('studio');updateCapture();});
$('closePhoto').addEventListener('click',()=>{stopCamera();setScreen('intro');$('openPhoto').focus();});
$('startCamera').addEventListener('click',startCamera);
$('flipCamera').addEventListener('click',()=>{facing=facing==='user'?'environment':'user';startCamera();});
$('photoInput').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(!file.type.startsWith('image/')){$('cameraStatus').textContent='이미지 파일을 골라 주세요.';return;}
 const objectURL=URL.createObjectURL(file),img=new Image();
 try{img.src=objectURL;await img.decode();stopCamera();background=img;$('cameraStatus').textContent='내 사진을 불러왔어요. 스티커를 얼굴·몸에 맞춰 주세요.';draw();updateCapture();}
 catch{$('cameraStatus').textContent='사진을 열지 못했어요. JPG 또는 PNG 사진을 골라 주세요.';}
 finally{URL.revokeObjectURL(objectURL);event.target.value='';}
});
$('size').addEventListener('input',()=>{pieces[selected].size=+$('size').value;draw();});
$('angle').addEventListener('input',()=>{pieces[selected].angle=+$('angle').value;draw();});
$('mirrorPiece').addEventListener('click',()=>{pieces[selected].mirror=!pieces[selected].mirror;draw();});
$('reset').addEventListener('click',reset);

const pointers=new Map();let gesture=null;
function point(event){const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width,y:(event.clientY-r.top)/r.height};}
function makeGesture(){const points=[...pointers.values()],p=pieces[selected];if(points.length===1)gesture={mode:'drag',origin:points[0],x:p.x,y:p.y};else if(points.length>=2){const a=points[0],b=points[1];gesture={mode:'pinch',distance:Math.hypot((b.x-a.x)*900,(b.y-a.y)*1200),angle:Math.atan2((b.y-a.y)*1200,(b.x-a.x)*900),size:p.size,rotation:p.angle};}}
canvas.addEventListener('pointerdown',event=>{event.preventDefault();const pt=point(event);if(!pointers.size){let nearest=selected,best=Infinity;pieces.forEach((p,i)=>{const d=Math.hypot((p.x-pt.x)*900,(p.y-pt.y)*1200);if(d<best){nearest=i;best=d;}});selected=nearest;syncControls();}pointers.set(event.pointerId,pt);canvas.setPointerCapture(event.pointerId);makeGesture();});
canvas.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId)||!gesture)return;event.preventDefault();pointers.set(event.pointerId,point(event));const p=pieces[selected],pts=[...pointers.values()];if(gesture.mode==='drag'&&pts.length===1){p.x=Math.max(-.5,Math.min(1.5,gesture.x+pts[0].x-gesture.origin.x));p.y=Math.max(-.5,Math.min(1.5,gesture.y+pts[0].y-gesture.origin.y));}else if(pts.length>=2&&gesture.distance>0){const a=pts[0],b=pts[1];p.size=Math.max(.12,Math.min(2,gesture.size*Math.hypot((b.x-a.x)*900,(b.y-a.y)*1200)/gesture.distance));p.angle=((gesture.rotation+(Math.atan2((b.y-a.y)*1200,(b.x-a.x)*900)-gesture.angle)*180/Math.PI+540)%360)-180;syncControls();}draw();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);gesture=null;if(pointers.size)makeGesture();});
$('capture').addEventListener('click',async()=>{
 if($('capture').disabled)return;
 $('capture').disabled=true;draw(false);
 ctx.fillStyle='#fffdf4';ctx.fillRect(0,1120,900,80);ctx.textAlign='left';ctx.fillStyle='#394f43';ctx.font='bold 22px sans-serif';ctx.fillText('GYEONGJU TRIP · '+artifact.title,32,1153);ctx.font='17px sans-serif';ctx.fillStyle='#746e61';ctx.fillText('국가유산청 3D 자료 활용 · 체험용 합성 사진',32,1183);
 resultBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));
 if(!resultBlob){$('cameraStatus').textContent='사진 저장 준비에 실패했어요. 다시 시도해 주세요.';updateCapture();return;}
 if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(resultBlob);$('resultImage').src=photoURL;$('save').href=photoURL;$('save').download=`gyeongju-${id}-${Date.now()}.jpg`;$('saveStatus').textContent='';
 // Keep a local still for retakes; release the camera as soon as capture finishes.
 if(stream&&video.readyState>=2){const still=document.createElement('canvas');still.width=900;still.height=1200;const sc=still.getContext('2d'),scale=Math.max(900/video.videoWidth,1200/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale;if(facing==='user'){sc.translate(900,0);sc.scale(-1,1);}sc.drawImage(video,(900-w)/2,(1200-h)/2,w,h);const img=new Image();img.src=still.toDataURL('image/jpeg',.95);await img.decode();background=img;}
 stopCamera();setScreen('result');$('resultTitle').setAttribute('tabindex','-1');$('resultTitle').focus({preventScroll:true});
});
$('share').addEventListener('click',async()=>{if(!resultBlob)return;const file=new File([resultBlob],`gyeongju-${id}.jpg`,{type:'image/jpeg'});try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'경주에서 남긴 나만의 한 장'});}else{$('saveStatus').textContent='이 브라우저는 사진 공유를 지원하지 않아요. 사진 저장을 이용해 주세요.';}}catch(error){if(error.name!=='AbortError')$('saveStatus').textContent='공유하지 못했어요. 사진 저장을 이용해 주세요.';}});
$('retake').addEventListener('click',()=>{setScreen('studio');updateCapture();$('cameraStatus').textContent='사진 위치를 다시 맞추거나 카메라를 다시 켜 주세요.';});
$('finish').addEventListener('click',()=>{location.href=document.querySelector('.backlink').href;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopCamera();cancelAnimationFrame(animation);}else if(screen==='studio'){updateCapture();drawLoop();}});
window.addEventListener('pagehide',()=>{stopCamera();if(photoURL)URL.revokeObjectURL(photoURL);});
reset();
