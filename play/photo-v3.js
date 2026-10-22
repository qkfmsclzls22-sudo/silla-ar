import {$,toast,pic,point,modal,esc} from './ui.js';
import {artifacts,legacyItems} from '../heritage/catalog-v3.js?v=20261022-1';
const params=new URLSearchParams(location.search),requested=params.get('item')||'buddha',id=legacyItems[requested]||requested;
const base={
 toou:{title:'터번 쓴 토우',invitation:'토우와 함께 한 장',tip:'토우를 원하는 위치로 옮겨 함께 사진을 남겨 보세요.',image:'../assets/artifacts/toou-overlay-v3.png',pieces:[{name:'토우',x:.65,y:.64,size:.50}],view:'../toou/',story:'토우의 실제 3D 모델을 평면으로 렌더링한 사진 체험이에요.',credit:'경주트립 문화유산 자료 활용'},
 buddha:{title:'불상의 미소',invitation:'불상의 미소로 한 장',tip:'불상 얼굴을 내 얼굴에 맞춰 보세요.',image:'./assets/buddha.webp',pieces:[{name:'불상 얼굴',x:.5,y:.44,size:.43}],story:'신라 불상에서 영감을 얻은 창작 얼굴 포토필터예요.',credit:'경주트립 창작 포토필터'},
 crown:{title:'신라 금관',invitation:'신라 금관 써보기',tip:'금관의 아래쪽을 이마에 맞춰 주세요.',image:'../assets/artifacts/crown-overlay-v4.png',pieces:[{name:'금관',x:.5,y:.23,size:.62}],view:'../crown/',story:'신라 금관의 모습을 평면 이미지로 착용하는 포토체험이에요.',credit:'국가유산청 자료 활용'},
 smile:{title:'얼굴무늬 수막새',invitation:'천년의 미소로 찰칵',tip:'수막새의 얼굴을 내 얼굴에 맞춰 보세요.',image:'../assets/artifacts/smile-overlay-v4.png',pieces:[{name:'수막새',x:.5,y:.43,size:.52}],view:'../smile/',story:'얼굴무늬 수막새의 미소를 내 얼굴에 맞춰 남기는 한 장이에요.',credit:'국가유산청 자료 활용'},
};
const item=artifacts[id]?{...artifacts[id],image:`../heritage/assets/${id}/${artifacts[id].photo||'overlay-v1.png'}`,poster:`../heritage/assets/${id}/${artifacts[id].poster||artifacts[id].photo||'overlay-v1.png'}`,view:`../heritage/?item=${id}`}:(base[id]||base.buddha);
const safeId=artifacts[id]||base[id]?id:'buddha';
document.title=item.title+' · 경주트립 포토체험';$('#camera-title').textContent=item.title;$('#camera-invitation').textContent=item.invitation;$('#camera-message').textContent=item.tip;$('#start-note').textContent=item.title+' · 나의 한 장';$('.camera-cover img').src=item.poster||item.image;$('.camera-cover img').alt=item.title+' 사진 체험';$('#photo-result').alt=item.title+' 촬영 사진. 길게 눌러 저장할 수 있어요.';
$('.camera-screen').setAttribute('aria-label',item.title+' 포토 카메라');$('#photo').setAttribute('aria-label',item.title+' 사진 미리보기. 끌어서 위치, 두 손가락으로 크기와 각도를 맞추세요.');
const tour=['bulguksa','museum','wolseong'].includes(params.get('tour'))?params.get('tour'):null;
if(item.view){const u=new URL(item.view,location.href);if(tour)u.searchParams.set('tour',tour);$('#view-3d').href=u.href;}else $('#view-3d').classList.add('hidden');
const canvas=$('#photo'),c=canvas.getContext('2d'),video=$('#camera');
let layers=[],selected=0,stream=null,facing='environment',mirrored=false,ready=false,mode='start',background=null;
let animation,last=0,opening=false,generation=0,photoURL=null,photoFile=null,captureId=0;
let pointers=new Map(),dragStart=null,pinch=null;
const toggle=(id,show)=>$(id).classList.toggle('hidden',!show);
function settings(show){toggle('#face-settings',show);$('#adjust-head').setAttribute('aria-expanded',String(show))}
function setMode(next){mode=next;document.body.dataset.mode=next;toggle('#camera-cover',next==='start');toggle('#live-controls',next==='live');toggle('#review-controls',next==='review');toggle('#start-note',next==='start');if(next!=='live')settings(false);pointers.clear();dragStart=pinch=null;fitFrame();}
function fitFrame(){const r=$('.viewfinder').getBoundingClientRect(),w=Math.min(r.width,r.height*.75);$('.photo-frame').style.setProperty('--frame-width',w+'px');$('.photo-frame').style.setProperty('--frame-height',w/.75+'px')}
new ResizeObserver(fitFrame).observe($('.viewfinder'));
function fitViewport(){document.body.style.setProperty('--camera-height',(window.visualViewport?.height||innerHeight)+'px');fitFrame()}
window.visualViewport?.addEventListener('resize',fitViewport);addEventListener('resize',fitViewport);fitViewport();
function stop(){generation++;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;ready=!!background;$('#switch-camera').disabled=true;$('#capture').disabled=true}
function refresh(){ready=!!background||!!(stream&&video.videoWidth);$('#capture').disabled=!ready||layers.length!==item.pieces.length;$('#switch-camera').disabled=opening;sync()}
async function start(){
 if(opening)return;opening=true;stop();background=null;ready=false;const request=generation;setMode('start');$('#start-camera').disabled=true;$('#camera-message').textContent='카메라를 여는 중이에요…';
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('unsupported');
  const next=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:1600}}});
  if(request!==generation||document.hidden){next.getTracks().forEach(t=>t.stop());return}
  stream=next;video.srcObject=stream;await video.play();if(request!==generation||document.hidden)return;
  mirrored=facing==='user';setMode('live');refresh();
 }catch(e){if(request!==generation)return;stop();setMode('start');$('#camera-message').textContent=e.name==='NotAllowedError'?'카메라를 허용하거나 사진 불러오기로 체험해 주세요.':e.name==='NotFoundError'?'연결된 카메라가 없어요. 사진 불러오기로 체험할 수 있어요.':'카메라를 열지 못했어요. 사진을 불러오거나 휴대폰 Safari·Chrome에서 열어 주세요.'}
 finally{opening=false;$('#start-camera').disabled=false;if(mode==='live')refresh()}
}
$('#start-camera').onclick=start;$('#switch-camera').onclick=()=>{facing=facing==='environment'?'user':'environment';start()};
$('#photo-input').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file),img=new Image();
 try{img.src=url;await img.decode();stop();background=img;mirrored=false;setMode('live');refresh();}
 catch{toast('이 사진을 열지 못했어요. JPG 또는 PNG 파일을 골라 주세요.')}
 finally{URL.revokeObjectURL(url);e.target.value=''}
};
function sync(){const l=layers[selected];if(!l)return;$('#head-size').value=l.size*900;$('#piece-angle').value=l.angle;$('#toggle-mirror').setAttribute('aria-pressed',String(mirrored));$('#piece-options').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)))}
function reset(){layers.forEach((l,i)=>Object.assign(l,{...item.pieces[i],angle:0}));selected=0;sync()}
$('#adjust-head').onclick=()=>settings($('#face-settings').classList.contains('hidden'));$('#close-settings').onclick=()=>settings(false);
$('#head-size').oninput=e=>{if(layers[selected])layers[selected].size=Number(e.target.value)/900};$('#piece-angle').oninput=e=>{if(layers[selected])layers[selected].angle=Number(e.target.value)};
$('#reset-head').onclick=reset;$('#toggle-mirror').onclick=()=>{mirrored=!mirrored;sync()};
$('#photo-info').onclick=()=>modal('<h2>'+esc(item.title)+'</h2><p>'+esc(item.tip)+'</p><p>끌어서 위치를 맞추고, 두 손가락으로 크기와 각도를 조절하세요. 흰색 버튼으로 촬영한 뒤 같은 화면에서 저장할 수 있어요.</p><p>'+esc(item.story)+'</p><p class="small">'+esc(item.credit)+'<br>카메라 영상과 사진은 이 기기 안에서만 처리돼요.</p>');
function clearPhoto(){captureId++;if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;photoFile=null;$('#photo-result').removeAttribute('src');$('#download-photo').removeAttribute('href');toggle('#photo-result',false);toggle('#photo',true)}
function canSharePhoto(){try{return !!((navigator.maxTouchPoints>0||/Android|iPhone|iPad/i.test(navigator.userAgent))&&photoFile&&navigator.share&&navigator.canShare?.({files:[photoFile]}))}catch{return false}}
$('#capture').onclick=()=>{
 if(!ready||mode!=='live'||$('#capture').disabled)return;
 draw(performance.now(),true);clearPhoto();const token=captureId;const still=document.createElement('canvas');still.width=900;still.height=1200;still.getContext('2d').drawImage(canvas,0,0);
 setMode('review');stop();$('#save-photo').disabled=true;toggle('#download-photo',false);$('#review-status').textContent='마음에 드는 한 장을 저장하세요.';$('#save-help').textContent='사진을 준비하고 있어요…';$('#shutter-flash').classList.remove('flash');void $('#shutter-flash').offsetWidth;$('#shutter-flash').classList.add('flash');
 still.toBlob(blob=>{if(token!==captureId||mode!=='review')return;if(!blob){$('#save-help').textContent='사진을 만들지 못했어요. 다시 찍기를 눌러 주세요.';return}
 photoURL=URL.createObjectURL(blob);photoFile=new File([blob],`gyeongju-${safeId}.png`,{type:'image/png'});const result=$('#photo-result');result.onload=()=>{if(token===captureId){toggle('#photo-result',true);toggle('#photo',false)}};result.src=photoURL;$('#download-photo').href=photoURL;$('#download-photo').download=photoFile.name;$('#save-photo').disabled=false;$('#save-help').textContent=canSharePhoto()?'저장 메뉴에서 ‘이미지 저장’을 선택해 주세요.':'사진을 길게 누르거나 저장 버튼으로 내려받으세요.';
 },'image/png');
};
$('#save-photo').onclick=async()=>{if(!photoFile||mode!=='review')return;if(canSharePhoto()){try{await navigator.share({files:[photoFile]})}catch(e){if(e.name!=='AbortError'){toggle('#download-photo',true);$('#save-help').textContent='사진을 길게 누르거나 파일로 저장을 눌러 주세요.'}}}else{$('#download-photo').click();toggle('#download-photo',true);$('#save-help').textContent='다운로드를 요청했어요. 사진을 길게 눌러 저장할 수도 있어요.'}};
$('#retake').onclick=()=>{clearPhoto();if(background){setMode('live');refresh()}else start()};
const limit=()=>{const l=layers[selected];if(!l)return;l.x=Math.max(-.5,Math.min(1.5,l.x));l.y=Math.max(-.5,Math.min(1.5,l.y));l.size=Math.max(.09,Math.min(2,l.size));sync()};
function gesture(){const p=[...pointers.values()],l=layers[selected];if(!l)return;if(p.length===1)dragStart={p:p[0],x:l.x,y:l.y};else if(p.length>=2){dragStart=null;pinch={distance:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),r:Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x),size:l.size,angle:l.angle}}}
canvas.onpointerdown=e=>{if(mode!=='live'||!ready||!layers.length)return;e.preventDefault();const p=point(e,canvas);if(!pointers.size&&layers.length>1){let best=Infinity;layers.forEach((l,i)=>{const d=Math.hypot(l.x*900-p.x,l.y*1200-p.y);if(d<best){best=d;selected=i}});sync()}canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,p);gesture()};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();pointers.set(e.pointerId,point(e,canvas));const p=[...pointers.values()],l=layers[selected];if(p.length>=2&&pinch){l.size=pinch.size*Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)/Math.max(1,pinch.distance);l.angle=((pinch.angle+(Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x)-pinch.r)*180/Math.PI+540)%360)-180}else if(dragStart){l.x=dragStart.x+(p[0].x-dragStart.p.x)/900;l.y=dragStart.y+(p[0].y-dragStart.p.y)/1200}limit()};
function release(e){pointers.delete(e.pointerId);pinch=dragStart=null;gesture()}canvas.onpointerup=release;canvas.onpointercancel=release;canvas.onlostpointercapture=release;
function draw(t,force=false){
 if(mode==='review'||(!force&&(document.hidden||t-last<33)))return;last=t;c.fillStyle='#263c35';c.fillRect(0,0,900,1200);
 const bg=background||(stream&&video.videoWidth?video:null);if(bg){const vw=bg.videoWidth||bg.naturalWidth,vh=bg.videoHeight||bg.naturalHeight,s=Math.max(900/vw,1200/vh);c.save();if(mirrored){c.translate(900,0);c.scale(-1,1)}c.drawImage(bg,(900-vw*s)/2,(1200-vh*s)/2,vw*s,vh*s);c.restore()}
 if(ready)for(const l of layers){const w=900*l.size,h=w*l.img.height/l.img.width;c.save();c.translate(l.x*900,l.y*1200);c.rotate(l.angle*Math.PI/180);if(l.mirror)c.scale(-1,1);c.drawImage(l.img,-w/2,-h/2,w,h);c.restore()}
 if(ready){c.fillStyle='#17362b99';c.fillRect(0,1118,900,82);c.fillStyle='#fff5dd';c.textAlign='center';c.font='600 22px sans-serif';c.fillText('경주트립 · '+item.title,450,1151);c.font='15px sans-serif';c.fillText(item.creative?'국가유산청 복식 자료 활용 · 사극에서 영감을 받은 창작 체험':safeId==='buddha'?'경주트립 창작 얼굴 포토체험':'국가유산청 자료 활용 · 기념사진 체험',450,1180)}
}
function loop(t){draw(t);animation=requestAnimationFrame(loop)}
Promise.all(item.pieces.map(async p=>{const img=await pic(p.image?`../heritage/assets/${safeId}/${p.image}`:item.image);return img?{...p,img,angle:0}:null})).then(result=>{if(result.some(l=>!l)){toast('체험 이미지를 불러오지 못했어요. 새로고침해 주세요.');return}layers=result;$('#piece-options').replaceChildren();layers.forEach((l,i)=>{const b=document.createElement('button');b.textContent=l.name;b.onclick=()=>{selected=i;sync()};$('#piece-options').append(b)});refresh()});
animation=requestAnimationFrame(loop);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(stream||opening)){stop();if(mode!=='review'){setMode('start');$('#camera-message').textContent='사진 찍기를 눌러 다시 시작해 주세요.'}}});
addEventListener('pagehide',()=>{stop();cancelAnimationFrame(animation)});addEventListener('pageshow',e=>{if(e.persisted){animation=requestAnimationFrame(loop);fitViewport();if(mode!=='review'){setMode('start')}}});
