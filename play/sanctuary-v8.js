import {$,esc,modal,toast,read,write,swatches,wireSwatches,shareLink,saveCanvas,colors} from './ui.js';
import {createSanctuaryScene,CUSHIONS,CUSHION_ORDER,SPOTS,LANTERN_SLOTS,INSTRUMENTS,BOW_T} from './sanctuary-scene-v8.js?v=20261123-2';
import {SanctuaryRoom} from './sanctuary-room-v8.js?v=20261123-2';
// 불국사 메타버스 소원마당 v8 rev.2: 아바타로 청운교·백운교를 올라 대웅전 법당 안까지 들어가고,
// 합장·큰절·목탁·좌선을 실제 동작으로 하고, 범영루 법고와 좌경루 목어·운판을 치고, 불 켜진 연등에 소원 글씨를 달고, 투어 일행(최대 10명)과 함께해요.
const PROFILE='gj-sanctuary-profile-v8',SOLO='gj-sanctuary-wish-v8',STATS='gj-sanctuary-stats-v8',SOUND='gj-sanctuary-sound-v8',SOUNDTIP='gj-sanctuary-soundtip-v8';
const today=()=>new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const clean=(s,n)=>Array.from(String(s||'').replace(/[<>\u0000-\u001f]/g,'').trim()).slice(0,n).join('');
const r2=v=>Math.round(v*100)/100;
const MOKTAK_ICON='<svg viewBox="0 0 48 48" width="27" height="27" aria-hidden="true"><path d="M14 21c-9-2-11 13 0 12" fill="none" stroke="#a9662f" stroke-width="5.5" stroke-linecap="round"/><ellipse cx="28" cy="27" rx="15.5" ry="14" fill="#c98444" stroke="#8a4f22" stroke-width="1.6"/><path d="M43 28.5H27" stroke="#55300f" stroke-width="3" stroke-linecap="round"/><circle cx="25.5" cy="28.5" r="3.6" fill="#55300f"/><path d="M17.5 21.5c2.5-5 7.5-7.6 12.5-7.4" fill="none" stroke="#f3cf9f" stroke-width="2.4" stroke-linecap="round"/><path d="M43 3 33.5 11.5" stroke="#7a4a22" stroke-width="3.2" stroke-linecap="round"/><circle cx="32.5" cy="12.5" r="4" fill="#e0a868" stroke="#8a4f22" stroke-width="1.2"/></svg>';

// ---------- sound ----------
// 소리는 파일 없이 미리 계산한 파형으로 낸다. 아이폰은 무음 스위치가 Web Audio를 막아서 <audio> 태그로 재생한다.
const SR=22050,TAU=Math.PI*2,IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let actx=null,master=null,unlocked=false,soundOn=read(SOUND,true)!==false;const bank={};
function render(dur,fn,peak){const n=Math.floor(dur*SR),a=new Float32Array(n);let m=0;for(let i=0;i<n;i++){a[i]=fn(i/SR);m=Math.max(m,Math.abs(a[i]))}const k=peak/(m||1),fade=Math.min(n,500);for(let i=0;i<n;i++)a[i]*=k;for(let i=0;i<fade;i++)a[n-1-i]*=i/fade;return a}
const WAVES={
 // 목탁: 속이 빈 나무를 두드리는 짧고 또렷한 소리
 moktak:()=>render(.45,t=>{const gl=1+.07*Math.exp(-t/.012);return Math.sin(TAU*540*gl*t)*Math.exp(-t/.075)+.55*Math.sin(TAU*815*gl*t)*Math.exp(-t/.045)+.3*Math.sin(TAU*1390*t)*Math.exp(-t/.02)+.22*Math.sin(TAU*270*t)*Math.exp(-t/.09)+(Math.random()*2-1)*.6*Math.exp(-t/.0035)},.97),
 bell:()=>render(6.5,t=>Math.min(1,t/.012)*(Math.sin(TAU*98*t)*Math.exp(-t/1.9)+.55*Math.sin(TAU*196.6*t)*Math.exp(-t/1.5)+.36*Math.sin(TAU*247*t)*Math.exp(-t/1.1)+.26*Math.sin(TAU*393*t)*Math.exp(-t/.8)+.14*Math.sin(TAU*524*t)*Math.exp(-t/.5))*(1+.06*Math.sin(TAU*1.7*t)),.62),
 soft:()=>render(.4,t=>Math.sin(TAU*(190-150*t)*t)*Math.exp(-t/.09)*Math.min(1,t/.004),.42),
 // 법고: 낮게 울리는 큰 북. 휴대폰 스피커에서도 들리도록 배음을 섞는다
 drum:()=>render(1.3,t=>{const gl=1+.35*Math.exp(-t/.03);return Math.sin(TAU*74*gl*t)*Math.exp(-t/.36)+.7*Math.sin(TAU*148*gl*t)*Math.exp(-t/.26)+.45*Math.sin(TAU*226*t)*Math.exp(-t/.17)+.3*Math.sin(TAU*318*t)*Math.exp(-t/.1)+(Math.random()*2-1)*.5*Math.exp(-t/.012)},.97),
 // 목어: 목탁보다 크고 낮은 속 빈 나무 소리
 fish:()=>render(.6,t=>{const gl=1+.05*Math.exp(-t/.015);return Math.sin(TAU*318*gl*t)*Math.exp(-t/.11)+.6*Math.sin(TAU*482*gl*t)*Math.exp(-t/.075)+.32*Math.sin(TAU*806*t)*Math.exp(-t/.035)+.2*Math.sin(TAU*159*t)*Math.exp(-t/.12)+(Math.random()*2-1)*.55*Math.exp(-t/.005)},.97),
 // 운판: 맑게 퍼지는 쇠 소리
 cloud:()=>render(2.6,t=>Math.min(1,t/.003)*(Math.sin(TAU*523*t)*Math.exp(-t/.9)+.7*Math.sin(TAU*1207*t)*Math.exp(-t/.7)+.5*Math.sin(TAU*1733*t)*Math.exp(-t/.5)+.35*Math.sin(TAU*2489*t)*Math.exp(-t/.33)+.22*Math.sin(TAU*3151*t)*Math.exp(-t/.2)+.3*Math.sin(TAU*529*t)*Math.exp(-t/.9)+(Math.random()*2-1)*.3*Math.exp(-t/.004)),.8)
};
function wavUrl(a){const n=a.length,b=new DataView(new ArrayBuffer(44+n*2)),w=(o,s)=>{for(let i=0;i<s.length;i++)b.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');b.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);b.setUint32(24,SR,true);b.setUint32(28,SR*2,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,'data');b.setUint32(40,n*2,true);for(let i=0;i<n;i++)b.setInt16(44+i*2,Math.max(-1,Math.min(1,a[i]))*32767,true);return URL.createObjectURL(new Blob([b],{type:'audio/wav'}))}
const wave=name=>bank[name]||(bank[name]={data:WAVES[name](),buf:null,tags:null,i:0});
// 사용자가 누른 순간에 불러서 소리를 연다
function audio(){if(!soundOn)return false;
 try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback'}catch{}
 if(IOS){if(!unlocked){unlocked=true;for(const name of Object.keys(WAVES)){const s=wave(name),url=wavUrl(s.data);s.tags=Array.from({length:name==='moktak'?4:2},()=>{const el=new Audio(url);el.preload='auto';return el});for(const el of s.tags){el.muted=true;el.play()?.then(()=>{if(!el._used){el.pause();el.currentTime=0;el.muted=false}}).catch(()=>{el.muted=false})}}}return true}
 try{if(!actx){actx=new (window.AudioContext||window.webkitAudioContext)();master=actx.createDynamicsCompressor();master.connect(actx.destination)}if(actx.state==='suspended')actx.resume();return true}catch{return false}}
function play(name,vol=1){if(!audio())return;const s=wave(name);
 if(IOS){if(vol<.6||!s.tags)return;const el=s.tags[s.i++%s.tags.length];try{el._used=true;el.muted=false;el.currentTime=0;el.play()?.catch(()=>{})}catch{}return}
 try{if(!s.buf){s.buf=actx.createBuffer(1,s.data.length,SR);s.buf.getChannelData(0).set(s.data)}const src=actx.createBufferSource(),g=actx.createGain();src.buffer=s.buf;g.gain.value=vol;src.connect(g).connect(master);src.start()}catch{}}
const moktak=(v=1)=>play('moktak',v),bell=()=>play('bell'),soft=()=>play('soft');
const buzz=ms=>{try{navigator.vibrate?.(ms)}catch{}};
const INST_INFO={drum:{hit:'둥!',verb:'북 치기',desc:'법고는 땅 위에 사는 생명을 깨우는 큰 북이에요. 양손으로 번갈아 쳐요.'},fish:{hit:'딱!',verb:'목어 치기',desc:'목어는 물속 생명을 깨우는 나무 물고기예요. 늘 눈을 뜨고 있는 물고기처럼 깨어 있으라는 뜻이에요.'},cloud:{hit:'땡!',verb:'운판 치기',desc:'운판은 하늘을 나는 생명을 깨우는 구름 모양 청동 판이에요.'}};

export async function mountLantern(root){
 document.body.classList.add('sanct-page');document.title='불국사 메타버스 소원마당 · 경주트립';
 const css=document.createElement('link');css.rel='stylesheet';css.href='./sanctuary-v8.css?v=20261123-2';await new Promise(r=>{css.onload=r;css.onerror=r;document.head.append(css)});
 const q=new URLSearchParams(location.search),rawRoom=q.get('room'),roomId=rawRoom&&/^[A-Za-z0-9_-]{3,48}$/.test(rawRoom)?rawRoom:null;
 let profile=read(PROFILE,null);
 let stats=read(STATS,null);if(!stats||stats.date!==today())stats={date:today(),bows:0,toks:0,sit:0,greets:0};
 let soloWish=read(SOLO,null);if(soloWish&&(typeof soloWish.text!=='string'||!Number.isInteger(soloWish.slot)||soloWish.slot>=LANTERN_SLOTS.length))soloWish=null;
 let room=null,you='me',seats=[],shared={guests:{},lanterns:[]},connected=false,lastPoseSeq=new Map(),pendingSlot=null,mode='free',sitTimer=null,sitStart=0,auto108=null,bowSync=null,goal=0,goalCount=0,myDest=null,hintTimer=null,inst=null;
 const saveStats=()=>write(STATS,stats);
 const DEFAULT_HINT='바닥을 누르면 걸어가요 · 대웅전 안에도 들어갈 수 있어요';

 root.innerHTML=`<div class="sanct-app">
 <header class="sanct-head"><a class="sanct-mark" href="../?tour=bulguksa#artifact-title">GYEONGJU TRIP <span>불국사 소원마당</span></a><button id="sanct-room" class="sanct-room" aria-live="polite"><i></i><span>혼자 참배 중</span></button><div class="sanct-head-links"><button id="sanct-sound" aria-pressed="${soundOn}" aria-label="소리 켜고 끄기">${soundOn?'🔔':'🔕'}</button><button id="sanct-info" aria-label="체험 안내">?</button></div></header>
 <section class="sanct-stage" aria-label="불국사 3D 공간">
  <canvas id="sanct-canvas" tabindex="0" aria-label="불국사 마당과 대웅전. 바닥을 누르면 걸어가요. 끌어서 둘러보고 두 손가락으로 확대해요. 연등을 누르면 소원을 읽거나 달 수 있어요."></canvas>
  <div class="sanct-spots" role="group" aria-label="빠른 이동">${Object.entries(SPOTS).map(([k,s])=>`<button data-spot="${k}">${s.label}</button>`).join('')}</div>
  <div class="sanct-tools"><button id="sanct-in" aria-label="확대">＋</button><button id="sanct-out" aria-label="축소">−</button><button id="sanct-over" aria-label="불국사 전체 보기">⌂</button><button id="sanct-night" aria-pressed="false" aria-label="밤으로 바꾸기">☾</button></div>
  <div id="sanct-hud" class="sanct-hud" hidden></div>
  <p id="sanct-hint" class="sanct-hint">바닥을 누르면 그곳으로 걸어가요</p>
  <div id="sanct-loading" class="sanct-loading">불국사 마당을 여는 중…</div>
 </section>
 <nav class="sanct-dock" aria-label="참배와 연등">
  <button data-act="hapjang"><b>🙏</b><span>합장</span></button>
  <button data-act="bow"><b>🙇</b><span>절하기</span></button>
  <button data-act="moktak"><b>${MOKTAK_ICON}</b><span>목탁</span></button>
  <button data-act="sit"><b>🧘</b><span>고요히 앉기</span></button>
  <button data-act="lantern" class="primary"><b>🪷</b><span>연등 달기</span></button>
  <div class="sanct-dock-sub"><button data-act="invite">일행과 함께하기</button><button data-act="card">오늘의 기념카드</button></div>
 </nav></div>`;
 const canvas=$('#sanct-canvas'),hint=$('#sanct-hint'),hud=$('#sanct-hud');
 function setHint(t,then=null,ms=3600){clearTimeout(hintTimer);hint.textContent=t;if(then!=null)hintTimer=setTimeout(()=>{if(mode==='free'&&hint.textContent===t)hint.textContent=then},ms)}
 const scene=createSanctuaryScene(canvas,{onTap,onRegion});
 requestAnimationFrame(()=>$('#sanct-loading').remove());

 // ---------- me ----------
 let me=null;
 function spawnMe(){if(me)scene.removeAvatar(you);me=scene.addAvatar(you,{kind:profile.kind,color:profile.color,name:profile.name,mine:true});me.onBowDone=onMyBow;scene.place(me,0,63,Math.PI);scene.snapCamera({az:Math.PI,polar:1.3,dist:19});myDest={x:0,z:18};
  setHint('청운교·백운교를 올라 대웅전 마당으로 들어가요');
  setTimeout(()=>{if(me&&!me.path.length&&mode==='free'&&scene.regionOf(me)==='plaza')walkTo(0,18,{facing:Math.PI})},1500)}
 function rekeyMe(id){if(!me||id===you)return;scene.avatars.delete(you);scene.avatars.set(id,me);you=id}
 const myCushion=()=>{const i=Math.max(0,seats.indexOf(you));return CUSHIONS[CUSHION_ORDER[i%CUSHION_ORDER.length]]};
 function walkTo(x,z,opts={}){stopModes();const p=scene.walk(me,x,z,opts);myDest=p;send({type:'move',x:r2(p.x),z:r2(p.z)});return p}
 // 부처님 쪽(마당에서는 대웅전 불단 방향)을 바라보는 각도
 const faceOf=av=>scene.regionOf(av)==='yard'?Math.atan2(-av.pos.x,-36.4-av.pos.z):Math.PI;
 function halt(){if(me.path.length){const p=scene.walk(me,me.pos.x,me.pos.z);myDest=p;send({type:'move',x:r2(p.x),z:r2(p.z)})}}
 // 지금 선 자리에서 동작을 시작한다. 법당 안에서는 가까운 방석에 맞춰 선다. cushion=true면 법당 내 방석까지 걸어간다.
 function settle(then,cushion=false){
  const go=c=>{if(Math.hypot(me.pos.x-c.x,me.pos.z-c.z)<.25&&!me.path.length){me.facing=Math.PI;then();return}walkTo(c.x,c.z,{facing:Math.PI,onArrive:then});setHint(cushion?'법당 방석으로 가는 중…':'방석에 서는 중…')};
  if(cushion){go(myCushion());return}
  if(scene.regionOf(me)==='hall'&&!me.path.length){const c=CUSHIONS.reduce((b,c)=>Math.hypot(c.x-me.pos.x,c.z-me.pos.z)<Math.hypot(b.x-me.pos.x,b.z-me.pos.z)?c:b);if(Math.hypot(c.x-me.pos.x,c.z-me.pos.z)<1.7){go(c);return}}
  stopModes();halt();me.facing=faceOf(me);then()}
 function pose(p,opts){scene.setPose(me,p,opts);send({type:'pose',pose:p})}
 // 동작이 잘 보이도록 카메라를 잠깐 앞·옆으로 돌린다
 function view(hold,back=true,kind='front'){const inHall=scene.regionOf(me)==='hall',side=me.pos.x>0?1:-1;
  // 법당 안에서는 부처님이 함께 보이도록 뒤쪽 옆에서, 합장·목탁은 손이 보이도록 옆에서 본다
  if(inHall)scene.shot(kind==='bow'?{az:Math.PI-side*.95,polar:1.3,dist:6.4,hold,back}:{az:side*1.7,polar:1.34,dist:5,hold,back});
  else scene.shot({az:side*(kind==='bow'?1.15:.8),polar:1.3,dist:kind==='bow'?7.4:6.8,hold,back})}

 // ---------- actions ----------
 function stopModes(){if(mode==='sit'){stats.sit+=Math.round((Date.now()-sitStart)/1000);saveStats();clearInterval(sitTimer);sitTimer=null}if(auto108){clearInterval(auto108);auto108=null}clearInterval(bowSync);bowSync=null;if(mode!=='free'){mode='free';inst=null;hud.hidden=true;hud.dataset.kind='';document.body.classList.remove('sanct-calm')}if(me&&me.pose==='bow')me.bowQueue=0}
 function onMyBow(){stats.bows++;saveStats();moktak(.85);buzz(25);if(mode==='108'){goalCount++;renderHud();if(goalCount>=goal){clearInterval(auto108);auto108=null;scene.emote(me,'🪷');bell();setTimeout(()=>{toast(goal===108?'108배를 모두 마쳤어요. 오늘의 기념카드에 남겨 둘게요.':'절을 모두 마쳤어요.');stopModes();setHint('수고했어요. 기념카드를 만들어 보세요')},400)}}}
 function hapjang(target=null){if(!me)return;stopModes();halt();me.facing=target?Math.atan2(target.pos.x-me.pos.x,target.pos.z-me.pos.z):faceOf(me);pose('hapjang',{halfBow:true});view(1.5);soft();stats.greets++;saveStats();setHint('두 손을 모으고 허리 숙여 인사해요',DEFAULT_HINT,5000)}
 function bowOnce(n=1,cushion=false){settle(()=>{scene.setPose(me,'bow',{queue:n-1});send({type:'pose',pose:'bow'});view(BOW_T*n-.7,true,'bow');if(n>1){let k=n-1;bowSync=setInterval(()=>{if(me.pose!=='bow'||k<=0){clearInterval(bowSync);bowSync=null;return}k--;send({type:'pose',pose:'bow'})},BOW_T*1000)}setHint(n===3?'삼배를 올리는 중이에요':'절을 올리는 중이에요',DEFAULT_HINT,BOW_T*n*1000+2500)},cushion)}
 function start108(target,cushion=false){settle(()=>{mode='108';goal=target;goalCount=0;scene.setPose(me,'hapjang');renderHud();hud.hidden=false;view(0,false,'bow');setHint('큰 버튼을 누를 때마다 한 번씩 절해요')},cushion)}
 function bow108Tap(){if(!me||mode!=='108'||me.pose==='bow'&&me.poseT<BOW_T-.2)return;scene.setPose(me,'bow');send({type:'pose',pose:'bow'})}
 // 버튼을 누르는 도중에 다시 그려져서 누름이 사라지지 않도록, 틀은 한 번만 만들고 숫자만 바꾼다
 function renderHud(){const C=2*Math.PI*44,kind=mode+(inst||'')+(mode==='108'?goal:'');
  if(hud.dataset.kind!==kind){hud.dataset.kind=kind;
   if(mode==='108'){hud.innerHTML=`<div class="sanct-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" class="bg"/><circle id="h-fg" cx="50" cy="50" r="44" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><strong><span id="h-n">0</span><small>/ ${goal}</small></strong></div><div class="sanct-hud-actions"><button id="h-bow" class="primary">절하기</button><button id="h-auto" aria-pressed="false">자동으로</button><button id="h-stop">그만하기</button></div>`;$('#h-bow').onclick=bow108Tap;$('#h-stop').onclick=()=>{stopModes();pose('stand');setHint('언제든 다시 이어서 할 수 있어요',DEFAULT_HINT)};$('#h-auto').onclick=()=>{if(auto108){clearInterval(auto108);auto108=null}else{bow108Tap();auto108=setInterval(bow108Tap,BOW_T*1000+150)}renderHud()}}
   else if(mode==='sit'){hud.innerHTML=`<div class="sanct-calm-box"><small>고요히 머무는 중</small><strong id="h-time">00:00</strong><p>숨을 천천히 들이쉬고, 내쉬어요.</p><button id="h-rise">일어나기</button></div>`;$('#h-rise').onclick=()=>{stopModes();pose('stand');setHint(DEFAULT_HINT)}}
   else if(mode==='inst'){const it=INSTRUMENTS[inst],info=INST_INFO[inst];hud.innerHTML=`<div class="sanct-inst-box"><small>${it.place} · ${it.label}</small><p>${info.desc}</p><div class="sanct-inst-actions"><button id="h-hit" class="primary">${info.verb}</button><button id="h-stop">그만하기</button></div></div>`;$('#h-hit').onclick=strike;$('#h-stop').onclick=()=>{stopModes();pose('stand');setHint(DEFAULT_HINT)}}}
  if(mode==='108'){$('#h-n').textContent=goalCount;$('#h-fg').style.strokeDashoffset=C*(1-Math.min(1,goalCount/goal));const a=$('#h-auto');a.setAttribute('aria-pressed',!!auto108);a.textContent=auto108?'자동 멈춤':'자동으로'}
  else if(mode==='sit'){const t=Math.round((Date.now()-sitStart)/1000);$('#h-time').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}}
 // ---------- 불전사물 (법고·목어·운판) ----------
 function strike(){if(!me||mode!=='inst')return;const id=inst;scene.strike(me,id);send({type:'pose',pose:id});setTimeout(()=>{play(id);buzz(id==='drum'?35:18)},120);scene.emote(me,INST_INFO[id].hit);stats.hits=(stats.hits||0)+1;saveStats()}
 function goInstrument(id){const it=INSTRUMENTS[id];if(!it||!me)return;if(mode==='inst'&&inst===id&&!me.path.length){strike();return}
  const begin=()=>{mode='inst';inst=id;me.facing=0;renderHud();hud.hidden=false;scene.shot({az:Math.PI+(id==='drum'?-.55:.55),polar:1.2,dist:7.6});setHint(`${it.label}를 누르거나 아래 버튼으로 쳐 보세요`);strike();
   if(soundOn&&!read(SOUNDTIP,false)){write(SOUNDTIP,true);toast('소리가 안 들리면 휴대폰의 미디어 음량을 올려 주세요 🔔')}};
  if(Math.hypot(me.pos.x-it.stand.x,me.pos.z-it.stand.z)<.3&&!me.path.length){stopModes();begin();return}
  walkTo(it.stand.x,it.stand.z,{facing:0,onArrive:begin});setHint(`${it.place} ${it.label} 앞으로 가는 중…`)}
 function sit(){settle(()=>{mode='sit';sitStart=Date.now();pose('sit');document.body.classList.add('sanct-calm');hud.hidden=false;renderHud();bell();view(0,false,'bow');let n=0;sitTimer=setInterval(()=>{renderHud();if(++n%30===0)bell()},1000);setHint('')})}
 function tok(){if(!me)return;moktak();buzz(15);stats.toks++;saveStats();scene.emote(me,'똑');
  if(mode==='free'){const first=me.pose!=='moktak';if(first){halt();me.facing=faceOf(me)}scene.tok(me);send({type:'pose',pose:'moktak'});view(2.6);if(first)setHint('누를 때마다 목탁을 한 번씩 쳐요',DEFAULT_HINT,6000)}
  if(soundOn&&!read(SOUNDTIP,false)){write(SOUNDTIP,true);toast('소리가 안 들리면 휴대폰의 미디어 음량을 올려 주세요 🔔')}
  const b=$('[data-act="moktak"]');b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit')}
 function bowMenu(){let where='here';
  const d=modal(`<p class="sanct-eyebrow">BOW · 절하기</p><h2>어떻게 절을 올릴까요?</h2><div class="sanct-seg" role="radiogroup" aria-label="절할 자리"><button type="button" role="radio" data-w="here" aria-checked="true">지금 이 자리에서</button><button type="button" role="radio" data-w="hall" aria-checked="false">법당 방석으로 가서</button></div><p class="small">부처님 쪽을 보고 큰절을 올려요. 오늘 올린 절: <b>${stats.bows}배</b></p><div class="sanct-choice"><button data-n="1">한 번 절하기<small>잠깐 마음만 전해요</small></button><button data-n="3">삼배<small>부처님·가르침·스님께 세 번</small></button><button data-n="108" class="primary">108배 도전<small>한 번씩 누르거나 자동으로</small></button><button data-n="21">21배<small>짧게 도전해요</small></button></div>`);
  d.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{where=b.dataset.w;d.querySelectorAll('[data-w]').forEach(x=>x.setAttribute('aria-checked',x===b))});
  d.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{d.close();const n=+b.dataset.n,c=where==='hall';if(n>=21)start108(n,c);else bowOnce(n,c)})}

 // ---------- lanterns ----------
 const myWish=()=>room?shared.lanterns.find(l=>l.owner===you)||null:soloWish&&{...soloWish,mine:true,name:profile.name};
 const lanternList=()=>room?shared.lanterns.map(l=>({...l,mine:l.owner===you})):soloWish?[{...soloWish,mine:true,name:profile?.name}]:[];
 function freeSlot(){const used=new Set(lanternList().filter(l=>!l.mine).map(l=>l.slot));const cost=i=>Math.abs(LANTERN_SLOTS[i].x)+Math.abs(LANTERN_SLOTS[i].z-12.5)*.6;const order=LANTERN_SLOTS.map((s,i)=>i).sort((a,b)=>cost(a)-cost(b));return order.find(i=>!used.has(i))??0}
 function lanternForm(slot=null){const cur=myWish();const target=slot??cur?.slot??freeSlot();let color=cur?.color||profile.color||'coral';
  const d=modal(`<p class="sanct-eyebrow">LOTUS LANTERN · 연등 달기</p><h2>${cur?'내 연등 고치기':'연등에 소원을 적어요'}</h2><form id="lf" class="sanct-form"><label>소원 <small><span id="lc">0</span>/40</small><textarea name="text" maxlength="80" rows="3" required placeholder="예) 우리 가족 모두 건강하게">${esc(cur?.text||'')}</textarea></label><div class="sanct-prompts">${['건강하게','여행 또 오자','합격하게 해 주세요','늘 고마워요'].map(p=>`<button type="button" data-p="${p}">${p}</button>`).join('')}</div><p class="sanct-label">연등 색</p>${swatches(color)}<button class="primary" type="submit">${cur?'고친 소원 달기':'이 소원으로 연등 달기'}</button>${room?'<p class="small">등에 불이 켜지고, 소원 글씨가 등 아래에 달려요. 이 마당의 일행 모두에게 보여요.</p>':'<p class="small">등에 불이 켜지고, 소원 글씨가 등 아래에 달려요. 이 폰에 저장돼요.</p>'}</form>`);
  const ta=$('textarea',d),cnt=$('#lc',d),upd=()=>cnt.textContent=Array.from(ta.value).length;upd();ta.oninput=upd;d.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{ta.value=b.dataset.p;upd()});wireSwatches(d,c=>color=c);
  $('#lf',d).onsubmit=e=>{e.preventDefault();const text=clean(ta.value,40);if(!text){toast('소원을 한 줄 적어 주세요.');return}d.close();hang({text,color,slot:target})}}
 function hang(w){const s=LANTERN_SLOTS[w.slot];walkTo(s.x,s.z+1.9,{facing:Math.PI,onArrive:()=>{pose('hapjang',{halfBow:true});soft();if(room){pendingSlot=w.slot;send({type:'lantern',...w})}else{soloWish={...w,at:Date.now()};write(SOLO,soloWish);scene.setLanterns(lanternList(),{animateSlot:w.slot})}scene.lookAtLantern(w.slot,3.6);toast('연등에 불이 켜졌어요. 등 아래에 소원이 달렸어요.');setHint('☾ 버튼으로 밤을 만들면 더 환해요',DEFAULT_HINT,7000)}});setHint('연등 줄로 가는 중…')}
 function readWish(w){const d=modal(`<p class="sanct-eyebrow">${w.mine?'MY LANTERN · 내 연등':'LANTERN · 연등'}</p><h2>${esc(w.name||'여행자')}의 소원</h2><blockquote class="sanct-wish" style="--c:${colors[w.color]||'#eee'}">${esc(w.text)}</blockquote>${w.mine?'<div class="stack"><button id="wl" class="primary">내 연등 보러 가기</button><button id="we">소원 고치기</button><button id="wr">연등 내리기</button></div>':'<button id="wg" class="primary">합장으로 마음 보태기 🙏</button>'}`);
  if(w.mine){$('#wl',d).onclick=()=>{d.close();const s=LANTERN_SLOTS[w.slot];walkTo(s.x,s.z+1.9,{facing:Math.PI,onArrive:()=>scene.lookAtLantern(w.slot,3.6)});setHint('내 연등으로 가는 중…',DEFAULT_HINT,7000)};$('#we',d).onclick=()=>{d.close();lanternForm(w.slot)};$('#wr',d).onclick=()=>{d.close();if(room)send({type:'remove'});else{soloWish=null;try{localStorage.removeItem(SOLO)}catch{}scene.setLanterns(lanternList())}toast('연등을 내렸어요.')}}else $('#wg',d).onclick=()=>{d.close();hapjang()}}
 function onTap(e){if(!me)return;if(e.type==='lantern'){if(e.wish)readWish({...e.wish,mine:e.wish.mine});else{const taken=myWish();if(taken){toast('연등은 한 사람에 하나씩 달 수 있어요. 내 연등을 고쳐 볼까요?');readWish(taken)}else lanternForm(e.slot)}return}
  if(e.type==='instrument'){audio();goInstrument(e.id);return}
  if(e.type==='avatar'){if(e.avatar===me){profileModal();return}hapjang(e.avatar);toast(`${e.avatar.name}님께 합장으로 인사했어요`);return}
  if(e.type==='ground'){e.ripple();walkTo(e.x,e.z);setHint('걷는 중…',DEFAULT_HINT,2600)}}
 function onRegion(reg,prev){if(!prev||mode!=='free')return;const t={hall:'대웅전 법당 안이에요. 절하기를 눌러 보세요',yard:prev==='hall'?'대웅전 앞마당으로 나왔어요':'자하문을 지나 대웅전 앞마당이에요',stairs:prev==='plaza'?'청운교·백운교를 오르는 중이에요':'청운교·백운교를 내려가요',plaza:'청운교·백운교 아래예요. 위를 올려다보세요'}[reg];if(t)setHint(t,DEFAULT_HINT,5200)}

 // ---------- profile ----------
 function profileModal(first=false){let kind=profile?.kind||'monk',color=profile?.color||'coral';
  const d=modal(`<p class="sanct-eyebrow">BULGUKSA · METAVERSE TEMPLE</p><h2>${first?'불국사 마당에 들어가요':'내 모습 바꾸기'}</h2>${first?'<p>아바타로 청운교·백운교를 올라 대웅전 법당 안에서 절을 올리고, 연등에 소원을 달아요.</p>':''}<form id="pf" class="sanct-form"><div class="sanct-kinds" role="radiogroup" aria-label="아바타"><button type="button" role="radio" data-k="monk" aria-checked="${kind==='monk'}"><b>👶</b>동자승</button><button type="button" role="radio" data-k="traveler" aria-checked="${kind==='traveler'}"><b>🧢</b>여행자</button></div><label>별명<input name="name" maxlength="12" required value="${esc(profile?.name||'여행자 '+(Math.floor(Math.random()*900)+100))}"></label><p class="sanct-label">내 색 (모자·옷·연등)</p>${swatches(color)}<button class="primary" type="submit">${first?'불국사로 들어가기':'바꾸기'}</button></form>`);
  d.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kind=b.dataset.k;d.querySelectorAll('[data-k]').forEach(x=>x.setAttribute('aria-checked',x===b))});wireSwatches(d,c=>color=c);
  $('#pf',d).onsubmit=e=>{e.preventDefault();const name=clean(new FormData(e.target).get('name'),12)||'여행자';profile={name,kind,color};write(PROFILE,profile);d.close();audio();if(me){stopModes();const pos={x:me.pos.x,z:me.pos.z,f:me.facing};scene.removeAvatar(you);me=scene.addAvatar(you,{...profile,mine:true});me.onBowDone=onMyBow;scene.place(me,pos.x,pos.z,pos.f)}else spawnMe();send({type:'profile',...profile});scene.setLanterns(lanternList())};
  if(first)d.addEventListener('close',()=>{if(!profile){profile={name:'여행자',kind:'monk',color:'coral'};write(PROFILE,profile);spawnMe()}},{once:true})}

 // ---------- room (투어 일행 최대 10명) ----------
 const roomBtn=$('#sanct-room');
 function setRoom(text,state){roomBtn.querySelector('span').textContent=text;roomBtn.dataset.state=state}
 function send(a){if(room&&connected)room.send(JSON.stringify({type:'action',action:a}))}
 function connect(id){room?.close();connected=false;setRoom('일행 마당 연결 중…','wait');const r=new SanctuaryRoom(id);room=r;
  r.onopen=()=>{if(room!==r)return;connected=true;r.send(JSON.stringify({type:'join'}));if(profile)r.send(JSON.stringify({type:'action',action:{type:'profile',...profile}}));if(me)setTimeout(()=>{const p=myDest||me.pos;send({type:'move',x:r2(p.x),z:r2(p.z)})},300)};
  r.onmessage=ev=>{if(room!==r)return;let m;try{m=JSON.parse(ev.data)}catch{return}if(m.type==='error'){if(!/천천히/.test(m.error))toast(m.error);return}if(m.type==='full'){toast(m.error);leave();return}if(m.type==='state')applyState(m)};
  r.onclose=()=>{if(room!==r)return;connected=false;setRoom('연결 끊김 · 다시 연결','off');shared={guests:{},lanterns:[]};syncGuests();scene.setLanterns(lanternList())}}
 function leave(){room?.close();room=null;connected=false;seats=[];setRoom('혼자 참배 중','solo');syncGuests();scene.setLanterns(lanternList())}
 function applyState(m){if(m.you&&m.you!==you)rekeyMe(m.you);seats=Array.isArray(m.seats)?m.seats:[];shared={guests:m.view?.guests||{},lanterns:m.view?.lanterns||[]};const n=seats.length;setRoom(n>1?`일행 ${n}명 함께`:'일행 마당 · 나 혼자','on');syncGuests();
  const mine=shared.lanterns.find(l=>l.owner===you),anim=mine&&mine.slot===pendingSlot?pendingSlot:undefined;if(anim!=null)pendingSlot=null;scene.setLanterns(lanternList(),{animateSlot:anim});
  // 내 연등은 기념카드용으로 폰에도 복사
  if(mine)write(SOLO,{text:mine.text,color:mine.color,slot:mine.slot,at:Date.now()})}
 function remotePose(av,p){if(p==='bow'){if(av.pose==='bow'&&av.poseT<BOW_T-.15)av.bowQueue++;else{av.facing=faceOf(av);scene.setPose(av,'bow')}}else if(p==='hapjang'){scene.setPose(av,'hapjang',{halfBow:true})}else if(p==='moktak'){if(av.pose!=='moktak')av.facing=faceOf(av);scene.tok(av);scene.emote(av,'똑');moktak(.35)}else if(INSTRUMENTS[p]){av.facing=0;scene.strike(av,p);scene.emote(av,INST_INFO[p].hit);setTimeout(()=>play(p,.45),120)}else{if(p==='sit')av.facing=faceOf(av);scene.setPose(av,p)}}
 function syncGuests(){const present=new Set(room?seats.filter(id=>id!==you&&shared.guests[id]):[]);
  for(const id of [...scene.avatars.keys()])if(id!==you&&!present.has(id)){scene.removeAvatar(id);lastPoseSeq.delete(id)}
  for(const id of present){const g=shared.guests[id];let av=scene.avatar(id);if(av&&(av.kind!==g.kind||av.color!==g.color||av.name!==clean(g.name,12))){scene.removeAvatar(id);av=null}
   if(!av){av=scene.addAvatar(id,{kind:g.kind,color:g.color,name:clean(g.name,12),mine:false});scene.place(av,g.x,g.z,Math.PI);av.dest={x:g.x,z:g.z};lastPoseSeq.set(id,g.poseSeq||0);if(g.pose==='sit')scene.setPose(av,'sit');else scene.setPose(av,'hapjang',{halfBow:true});continue}
   const tx=g.x,tz=g.z;if(!av.dest||av.dest.x!==tx||av.dest.z!==tz){av.dest={x:tx,z:tz};if(Math.hypot(av.pos.x-tx,av.pos.z-tz)>.15){const onC=CUSHIONS.some(c=>Math.abs(c.x-tx)<.01&&Math.abs(c.z-tz)<.01);scene.walk(av,tx,tz,{facing:onC?Math.PI:null})}}
   const seq=g.poseSeq||0;if(seq>(lastPoseSeq.get(id)||0)){lastPoseSeq.set(id,seq);const p=g.pose;if(av.path.length)av.onArrive=()=>remotePose(av,p);else remotePose(av,p)}}
  const total=room?seats.reduce((s,id)=>s+(shared.guests[id]?.bows||0),0):0;roomBtn.title=room?`우리 일행이 오늘 함께 올린 절 ${total}배`:''}
 function newRoomId(){const a='abcdefghjkmnpqrstuvwxyz23456789';return 'bg'+Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>a[b%a.length]).join('')}
 function roomUrl(id){const u=new URL(location.href);u.search='';u.searchParams.set('tour','bulguksa');u.searchParams.set('mode','sanctuary');u.searchParams.set('room',id);u.hash='';return u.toString()}
 function invite(){if(!room){const id=newRoomId();history.replaceState(null,'',roomUrl(id));connect(id)}const id=room.room,url=roomUrl(id);
  const d=modal(`<p class="sanct-eyebrow">TOGETHER · 일행과 함께</p><h2>일행을 같은 마당으로 불러요</h2><p>이 링크를 받은 사람은 같은 불국사에 들어와요. 서로의 아바타와 절, 연등이 보여요. <b>최대 10명</b>까지 함께할 수 있어요.</p><input type="text" readonly value="${esc(url)}" aria-label="초대 링크"><div class="stack"><button id="ishare" class="primary">링크 보내기</button><button id="ileave">혼자 하기로 돌아가기</button></div><p class="small">링크를 처음 연 폰이 마당을 열어요. 그 폰의 화면이 꺼지면 연결이 잠시 끊길 수 있어요.</p>`);
  $('#ishare',d).onclick=()=>shareLink(url);$('#ileave',d).onclick=()=>{d.close();history.replaceState(null,'',location.pathname+'?tour=bulguksa&mode=sanctuary');leave();toast('혼자 참배하는 마당으로 돌아왔어요.')}}
 roomBtn.onclick=()=>{if(roomBtn.dataset.state==='off'&&room)connect(room.room);else invite()};

 // ---------- keepsake card ----------
 async function card(){const shot=scene.snapshot(),W=1080,H=1440,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#f6efe0';x.fillRect(0,0,W,H);const ih=880,sr=shot.width/shot.height,dr=W/ih;let sw=shot.width,sh=shot.height,sx=0,sy=0;if(sr>dr){sw=sh*dr;sx=(shot.width-sw)/2}else{sh=sw/dr;sy=(shot.height-sh)/2}x.drawImage(shot,sx,sy,sw,sh,0,0,W,ih);
  const gr=x.createLinearGradient(0,ih-220,0,ih);gr.addColorStop(0,'rgba(246,239,224,0)');gr.addColorStop(1,'#f6efe0');x.fillStyle=gr;x.fillRect(0,ih-220,W,220);
  x.fillStyle='#7c3036';x.font='700 30px "Noto Sans KR",sans-serif';x.fillText('GYEONGJU TRIP · 불국사 소원마당',70,ih+20);x.fillStyle='#2e3a32';x.font='800 64px "Noto Sans KR",sans-serif';x.fillText(profile.name+'의 오늘',70,ih+105);
  x.font='500 30px "Noto Sans KR",sans-serif';x.fillStyle='#6b6358';x.fillText(stats.date,70,ih+155);
  const items=[[stats.bows+'배','올린 절'],[stats.toks+'번','목탁'],[Math.round(stats.sit/60)+'분','고요히 앉기']];items.forEach(([v,l],i)=>{const bx=70+i*320;x.fillStyle='#fffaf0';x.beginPath();x.roundRect(bx,ih+190,290,140,26);x.fill();x.fillStyle='#7c3036';x.font='800 54px "Noto Sans KR",sans-serif';x.fillText(v,bx+28,ih+268);x.fillStyle='#6b6358';x.font='500 26px "Noto Sans KR",sans-serif';x.fillText(l,bx+28,ih+310)});
  const w=myWish();x.fillStyle='#2e3a32';x.font='700 34px "Noto Sans KR",sans-serif';if(w){x.fillStyle=colors[w.color]||'#ed8e74';x.beginPath();x.arc(92,ih+402,18,0,Math.PI*2);x.fill();x.fillStyle='#2e3a32';x.fillText('“'+w.text+'”',126,ih+414,W-200)}else{x.fillStyle='#8a8172';x.font='500 30px "Noto Sans KR",sans-serif';x.fillText('다음엔 연등에 소원도 달아 보세요',70,ih+414)}
  if(room&&seats.length>1){const total=seats.reduce((s,id)=>s+(shared.guests[id]?.bows||0),0);x.fillStyle='#4f7f55';x.font='600 28px "Noto Sans KR",sans-serif';x.fillText(`일행 ${seats.length}명과 함께 ${total}배`,70,ih+470)}
  x.fillStyle='#a59c8c';x.font='400 20px "Noto Sans KR",sans-serif';x.fillText('불국사를 단순화한 체험용 3D 공간입니다 · 법당 불상 3D 자료: 국가유산청 · 경주트립',70,H-40,W-140);
  saveCanvas(c,'bulguksa-sanctuary-'+stats.date.replace(/\D/g,'')+'.png')}

 // ---------- wiring ----------
 root.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{audio();if(!me){profileModal(true);return}({hapjang:()=>hapjang(),bow:bowMenu,moktak:tok,sit,lantern:()=>{const w=myWish();w?readWish(w):lanternForm()},invite,card}[b.dataset.act])()});
 root.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>{if(!me)return;const k=b.dataset.spot,s=SPOTS[k];if(s.inst){audio();goInstrument(s.inst);return}walkTo(s.x+(k==='hall'?0:(Math.random()-.5)*2),s.z,{facing:Math.PI,onArrive:k==='stairs'?()=>scene.shot({az:Math.PI,polar:1.3,dist:19}):null});setHint(s.label+'(으)로 가는 중…',DEFAULT_HINT,5200)});
 $('#sanct-in').onclick=()=>scene.zoom(.75);$('#sanct-out').onclick=()=>scene.zoom(1.33);$('#sanct-over').onclick=()=>scene.overview();
 const nightBtn=$('#sanct-night');nightBtn.onclick=()=>{const v=!scene.isNight();scene.setNight(v);nightBtn.setAttribute('aria-pressed',v);nightBtn.textContent=v?'☼':'☾';nightBtn.setAttribute('aria-label',v?'낮으로 바꾸기':'밤으로 바꾸기');document.body.classList.toggle('sanct-night',v)};
 $('#sanct-sound').onclick=e=>{soundOn=!soundOn;write(SOUND,soundOn);e.target.setAttribute('aria-pressed',soundOn);e.target.textContent=soundOn?'🔔':'🔕';if(soundOn)moktak()};
 $('#sanct-info').onclick=()=>modal(`<p class="sanct-eyebrow">ABOUT</p><h2>불국사 메타버스 소원마당</h2><p>청운교·백운교, 자하문, 범영루·좌경루, 석가탑·다보탑, 대웅전이 있는 불국사를 <b>단순화해 만든 체험용 3D 공간</b>이에요. 실측 복원이 아니며, 실제 사찰에 등록되는 연등이나 기도가 아니에요.</p><p><b>걷기</b> 바닥을 누르세요. 대웅전을 누르면 법당 안으로 들어가요. 끌면 둘러보고, 두 손가락으로 확대해요.<br><b>참배</b> 합장 · 큰절(한 번, 삼배, 21배, 108배) · 목탁 · 고요히 앉기. 선 자리에서 바로 할 수 있어요.<br><b>사물</b> 자하문 옆 범영루의 법고, 좌경루의 목어와 운판을 눌러서 쳐 볼 수 있어요.<br><b>연등</b> 한 사람에 하나. 등에 불이 켜지고 소원 글씨가 달려요.<br><b>일행</b> 초대 링크로 최대 10명이 같은 마당에 모여요. 대화 없이 동작으로만 마음을 나눠요.<br><b>소리</b> 안 들리면 위의 🔔와 휴대폰 미디어 음량을 확인해 주세요.</p><p class="small">법당 가운데 불상은 국가유산청이 공개한 3D 데이터(국보 「경주 불국사 금동아미타여래좌상」, 공공누리 제1유형)를 가볍게 가공해 썼어요. 실제로는 불국사 극락전에 모셔진 불상이에요. 다보탑도 국가유산청 3D 데이터(국보 「경주 불국사 다보탑」, 공공데이터포털 제공, 공공누리 제1유형)를 가볍게 줄여 썼어요. 그 밖의 건물과 석가탑, 법고·목어·운판은 직접 만든 단순화 모형이에요.</p><p class="small">혼자 할 때의 기록과 연등은 이 폰에만 저장돼요.</p><p><a href="./?tour=bulguksa">예전 사진 소원마당 보기 ↗</a></p>`);
 document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(mode==='108'&&(e.key===' '||e.key==='Enter')){e.preventDefault();bow108Tap()}else if(e.key==='m'||e.key==='M'){audio();tok()}});

 if(q.has('debug'))window.__sanct={scene,get me(){return me},get mode(){return mode}};
 scene.setLanterns(lanternList());
 if(profile)spawnMe();else profileModal(true);
 // 첫 화면이 그려진 뒤에 일행 마당에 연결한다(느린 폰에서 연결 시간이 화면 준비에 먹히지 않도록)
 if(roomId){setRoom('일행 마당 연결 중…','wait');let n=0;const tick=()=>{if(++n>=3)connect(roomId);else requestAnimationFrame(tick)};requestAnimationFrame(tick)}else setRoom('혼자 참배 중','solo');
}
