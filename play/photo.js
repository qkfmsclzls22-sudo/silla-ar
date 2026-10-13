import {$,toast,pic,point,modal} from './ui.js';
const canvas=$('#photo'),c=canvas.getContext('2d'),video=$('#camera');
let head=null,stream=null,facing='environment',mirrored=false,ready=false,mode='start';
let pos={x:450,y:530},width=380,animation,last=0,opening=false,generation=0;
let pointers=new Map(),dragStart=null,pinch=null,photoURL=null,photoFile=null,captureId=0;
const toggle=(id,show)=>$(id).classList.toggle('hidden',!show);
function settings(show){toggle('#face-settings',show);$('#adjust-head').setAttribute('aria-expanded',String(show))}
function setMode(next){
  mode=next;document.body.dataset.mode=next;
  toggle('#camera-cover',next==='start');toggle('#live-controls',next==='live');
  toggle('#review-controls',next==='review');toggle('#start-note',next==='start');
  if(next!=='live')settings(false);
  pointers.clear();dragStart=pinch=null;
  fitFrame();
}
function fitFrame(){
  const r=$('.viewfinder').getBoundingClientRect(),w=Math.min(r.width,r.height*.75);
  $('.photo-frame').style.setProperty('--frame-width',w+'px');
  $('.photo-frame').style.setProperty('--frame-height',w/.75+'px');
}
new ResizeObserver(fitFrame).observe($('.viewfinder'));
function fitViewport(){document.body.style.setProperty('--camera-height',(window.visualViewport?.height||innerHeight)+'px');fitFrame()}
window.visualViewport?.addEventListener('resize',fitViewport);addEventListener('resize',fitViewport);fitViewport();
function stop(){
  generation++;stream?.getTracks().forEach(t=>t.stop());stream=null;ready=false;video.srcObject=null;
  $('#switch-camera').disabled=true;$('#capture').disabled=true;
}
async function start(){
  if(opening)return;
  opening=true;stop();const request=generation;setMode('start');
  $('#start-camera').disabled=true;$('#camera-message').textContent='카메라를 여는 중이에요…';
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('unsupported');
    const next=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:1280}}});
    if(request!==generation||document.hidden){next.getTracks().forEach(t=>t.stop());return}
    stream=next;video.srcObject=stream;await video.play();
    if(request!==generation||document.hidden)return;
    ready=true;mirrored=facing==='user';$('#toggle-mirror').setAttribute('aria-pressed',String(mirrored));
    $('#switch-camera').disabled=false;$('#capture').disabled=!head;setMode('live');
    if(!head)toast('불상 이미지를 불러오지 못했어요. 새로고침해 주세요.');
  }catch(e){
    if(request!==generation)return;
    stop();setMode('start');
    $('#camera-message').textContent=e.name==='NotAllowedError'?'카메라 권한이 꺼져 있어요. 주소창의 사이트 설정에서 카메라를 허용한 뒤 다시 눌러 주세요.':e.name==='NotFoundError'?'연결된 카메라를 찾지 못했어요. 스마트폰에서 열어 주세요.':'카메라를 열지 못했어요. 다른 카메라 앱을 닫고 Safari 또는 Chrome에서 다시 시도해 주세요.';
  }finally{opening=false;$('#start-camera').disabled=false}
}
$('#start-camera').onclick=start;
$('#switch-camera').onclick=()=>{facing=facing==='environment'?'user':'environment';start()};
$('#adjust-head').onclick=()=>settings($('#face-settings').classList.contains('hidden'));
$('#close-settings').onclick=()=>{settings(false);$('#adjust-head').focus({preventScroll:true})};
$('#head-size').oninput=e=>width=Number(e.target.value);
$('#reset-head').onclick=()=>{pos={x:450,y:530};width=380;$('#head-size').value=String(width)};
$('#toggle-mirror').onclick=()=>{mirrored=!mirrored;$('#toggle-mirror').setAttribute('aria-pressed',String(mirrored))};
$('#photo-info').onclick=()=>modal('<h2>불상의 미소로 한 장</h2><p>사진 찍기를 누르면 불상 얼굴이 바로 나타나요. 얼굴을 끌어 옮기고 두 손가락으로 크기를 맞춘 뒤 흰색 버튼을 누르세요.</p><p>촬영 후 같은 화면에서 저장하거나 다시 찍을 수 있어요. 아이폰은 저장 메뉴에서 <strong>이미지 저장</strong>을 선택해 주세요. 사진을 길게 눌러 저장할 수도 있어요.</p><p class="small">신라 불상에서 영감을 얻은 창작 포토필터예요. 석굴암 본존불의 실제 3D 스캔이 아니에요. 카메라 영상과 사진은 서버로 보내지 않아요.</p>');
function clearPhoto(){captureId++;if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;photoFile=null;$('#photo-result').removeAttribute('src');$('#download-photo').removeAttribute('href');toggle('#photo-result',false);toggle('#photo',true)}
function canSharePhoto(){try{return !!(photoFile&&navigator.share&&navigator.canShare?.({files:[photoFile]}))}catch{return false}}
$('#capture').onclick=()=>{
  if(!ready||mode!=='live'||!head||!video.videoWidth)return;
  draw(performance.now(),true);clearPhoto();const id=captureId;
  const still=document.createElement('canvas');still.width=900;still.height=1200;still.getContext('2d').drawImage(canvas,0,0);
  setMode('review');stop();$('#save-photo').disabled=true;toggle('#download-photo',false);
  $('#review-status').textContent='마음에 드는 한 장을 저장하세요.';$('#save-help').textContent='사진을 준비하고 있어요…';
  $('#shutter-flash').classList.remove('flash');void $('#shutter-flash').offsetWidth;$('#shutter-flash').classList.add('flash');
  $('#retake').focus({preventScroll:true});
  still.toBlob(blob=>{
    if(id!==captureId||mode!=='review')return;
    if(!blob){$('#save-help').textContent='사진을 만들지 못했어요. 다시 찍기를 눌러 주세요.';return}
    photoURL=URL.createObjectURL(blob);photoFile=new File([blob],'gyeongju-buddha-smile.png',{type:'image/png'});
    const result=$('#photo-result');result.onload=()=>{if(id===captureId){toggle('#photo-result',true);toggle('#photo',false)}};result.src=photoURL;
    $('#download-photo').href=photoURL;$('#save-photo').disabled=false;
    $('#save-help').textContent=canSharePhoto()?'아이폰은 저장 메뉴에서 ‘이미지 저장’을 선택해 주세요.':'사진을 길게 눌러 저장하거나 저장 버튼으로 내려받으세요.';
  },'image/png');
};
$('#save-photo').onclick=async()=>{
  if(!photoFile||mode!=='review')return;
  if(canSharePhoto()){
    const id=captureId;
    // The PNG is already prepared: invoke native sharing during this tap's activation.
    try{await navigator.share({files:[photoFile]})}
    catch(e){
      if(id!==captureId||mode!=='review')return;
      if(e.name!=='AbortError'){
        $('#save-help').textContent='사진을 길게 눌러 저장하거나 ‘파일로 저장’을 눌러 주세요.';
        toggle('#download-photo',true);
      }
    }
  }else{
    $('#download-photo').click();
    $('#save-help').textContent='다운로드를 요청했어요. 사진을 길게 눌러 저장할 수도 있어요.';
    toggle('#download-photo',true);
  }
};
$('#retake').onclick=()=>{clearPhoto();start()};
const limit=()=>{pos.x=Math.max(0,Math.min(900,pos.x));pos.y=Math.max(0,Math.min(1200,pos.y));width=Math.max(120,Math.min(780,width));$('#head-size').value=String(width)};
function distance(){const a=[...pointers.values()];return a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0}
canvas.onpointerdown=e=>{if(mode!=='live'||!ready)return;canvas.setPointerCapture(e.pointerId);const p=point(e,canvas);pointers.set(e.pointerId,p);if(pointers.size===1)dragStart={x:p.x,y:p.y,pos:{...pos}};if(pointers.size===2)pinch={distance:distance(),width}};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const p=point(e,canvas);pointers.set(e.pointerId,p);if(pointers.size>=2&&pinch)width=pinch.width*distance()/Math.max(1,pinch.distance);else if(dragStart)pos={x:dragStart.pos.x+p.x-dragStart.x,y:dragStart.pos.y+p.y-dragStart.y};limit()};
function release(e){pointers.delete(e.pointerId);pinch=dragStart=null;if(pointers.size===1){const p=[...pointers.values()][0];dragStart={x:p.x,y:p.y,pos:{...pos}}}}
canvas.onpointerup=release;canvas.onpointercancel=release;canvas.onlostpointercapture=release;
function draw(t,force=false){
  if(mode==='review'||(!force&&(document.hidden||t-last<33)))return;last=t;
  c.fillStyle='#263c35';c.fillRect(0,0,900,1200);
  if(ready&&video.videoWidth){const vw=video.videoWidth,vh=video.videoHeight,scale=Math.max(900/vw,1200/vh),w=vw*scale,h=vh*scale;c.save();if(mirrored){c.translate(900,0);c.scale(-1,1)}c.drawImage(video,(900-w)/2,(1200-h)/2,w,h);c.restore()}
  if(ready&&head){const h=width*head.height/head.width;c.drawImage(head,pos.x-width/2,pos.y-h/2,width,h)}
  if(ready){c.fillStyle='#17362b80';c.fillRect(0,1137,900,63);c.fillStyle='#fff5dd';c.textAlign='center';c.font='600 21px sans-serif';c.fillText('경주트립 · 불상의 미소',450,1177)}
}
function loop(t){draw(t);animation=requestAnimationFrame(loop)}
pic('./assets/buddha.webp').then(image=>{head=image;$('#capture').disabled=!head||!ready});
animation=requestAnimationFrame(loop);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&(stream||opening)){stop();if(mode!=='review'){setMode('start');$('#camera-message').textContent='사진 찍기를 누르면 바로 다시 시작해요.'}}
});
addEventListener('pagehide',()=>{stop();cancelAnimationFrame(animation)});
addEventListener('pageshow',e=>{if(e.persisted){animation=requestAnimationFrame(loop);fitViewport();if(mode!=='review')setMode('start')}});
