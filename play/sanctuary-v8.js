import {$,esc,modal,toast,read,write,swatches,wireSwatches,shareLink,saveCanvas,colors} from './ui.js';
import {createSanctuaryScene,CUSHIONS,CUSHION_ORDER,SPOTS,LANTERN_SLOTS} from './sanctuary-scene-v8.js?v=20261123-1';
import {SanctuaryRoom} from './sanctuary-room-v8.js?v=20261123-1';
// 불국사 메타버스 소원마당 v8: 아바타로 마당을 걷고, 합장·절·목탁·좌선을 하고, 연등을 달고, 투어 일행(최대 10명)과 함께해요.
const PROFILE='gj-sanctuary-profile-v8',SOLO='gj-sanctuary-wish-v8',STATS='gj-sanctuary-stats-v8',SOUND='gj-sanctuary-sound-v8';
const COLOR_NAMES={coral:'분홍',gold:'노랑',jade:'초록',blue:'파랑',violet:'보라',cream:'아이보리'};
const today=()=>new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const clean=(s,n)=>Array.from(String(s||'').replace(/[<>\u0000-\u001f]/g,'').trim()).slice(0,n).join('');

// ---------- sound ----------
let actx=null,soundOn=read(SOUND,true)!==false;
function audio(){if(!soundOn)return null;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();return actx}catch{return null}}
function moktak(){const a=audio();if(!a)return;const t=a.currentTime;for(const [f,g,d] of [[820,.55,.16],[1640,.12,.06],[410,.25,.12]]){const o=a.createOscillator(),v=a.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.82,t+d);v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(v).connect(a.destination);o.start(t);o.stop(t+d+.02)}}
function bell(){const a=audio();if(!a)return;const t=a.currentTime;for(const [f,g,d] of [[98,.22,7],[196,.1,5],[247,.06,4],[392,.04,3],[523,.025,2]]){const o=a.createOscillator(),v=a.createGain();o.type='sine';o.frequency.value=f;v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(g,t+.04);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v).connect(a.destination);o.start(t);o.stop(t+d)}}
function soft(){const a=audio();if(!a)return;const t=a.currentTime,o=a.createOscillator(),v=a.createGain();o.type='sine';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(90,t+.25);v.gain.setValueAtTime(.18,t);v.gain.exponentialRampToValueAtTime(.0008,t+.3);o.connect(v).connect(a.destination);o.start(t);o.stop(t+.32)}
const buzz=ms=>{try{navigator.vibrate?.(ms)}catch{}};

export async function mountLantern(root){
 document.body.classList.add('sanct-page');document.title='불국사 메타버스 소원마당 · 경주트립';
 const css=document.createElement('link');css.rel='stylesheet';css.href='./sanctuary-v8.css?v=20261123-1';await new Promise(r=>{css.onload=r;css.onerror=r;document.head.append(css)});
 const q=new URLSearchParams(location.search),rawRoom=q.get('room'),roomId=rawRoom&&/^[A-Za-z0-9_-]{3,48}$/.test(rawRoom)?rawRoom:null;
 let profile=read(PROFILE,null);
 let stats=read(STATS,null);if(!stats||stats.date!==today())stats={date:today(),bows:0,toks:0,sit:0,greets:0};
 let soloWish=read(SOLO,null);if(soloWish&&(typeof soloWish.text!=='string'||!Number.isInteger(soloWish.slot)))soloWish=null;
 let room=null,you='me',seats=[],shared={guests:{},lanterns:[]},connected=false,lastPoseSeq=new Map(),pendingSlot=null,mode='free',sitTimer=null,sitStart=0,auto108=null,goal=0,goalCount=0;
 const saveStats=()=>write(STATS,stats);

 root.innerHTML=`<div class="sanct-app">
 <header class="sanct-head"><a class="sanct-mark" href="../?tour=bulguksa#artifact-title">GYEONGJU TRIP <span>불국사 소원마당</span></a><button id="sanct-room" class="sanct-room" aria-live="polite"><i></i><span>혼자 참배 중</span></button><div class="sanct-head-links"><button id="sanct-sound" aria-pressed="${soundOn}" aria-label="소리 켜고 끄기">${soundOn?'🔔':'🔕'}</button><button id="sanct-info" aria-label="체험 안내">?</button></div></header>
 <section class="sanct-stage" aria-label="불국사 마당 3D 공간">
  <canvas id="sanct-canvas" tabindex="0" aria-label="불국사 마당. 바닥을 누르면 걸어가요. 끌어서 둘러보고 두 손가락으로 확대해요. 연등을 누르면 소원을 읽거나 달 수 있어요."></canvas>
  <div class="sanct-spots" role="group" aria-label="빠른 이동">${Object.entries(SPOTS).filter(([k])=>k!=='gate').map(([k,s])=>`<button data-spot="${k}">${s.label}</button>`).join('')}</div>
  <div class="sanct-tools"><button id="sanct-in" aria-label="확대">＋</button><button id="sanct-out" aria-label="축소">−</button><button id="sanct-over" aria-label="마당 전체 보기">⌂</button><button id="sanct-night" aria-pressed="false" aria-label="밤으로 바꾸기">☾</button></div>
  <div id="sanct-hud" class="sanct-hud" hidden></div>
  <p id="sanct-hint" class="sanct-hint">바닥을 누르면 그곳으로 걸어가요</p>
  <div id="sanct-loading" class="sanct-loading">불국사 마당을 여는 중…</div>
 </section>
 <nav class="sanct-dock" aria-label="참배와 연등">
  <button data-act="hapjang"><b>🙏</b><span>합장</span></button>
  <button data-act="bow"><b>🙇</b><span>절하기</span></button>
  <button data-act="moktak"><b>🪵</b><span>목탁</span></button>
  <button data-act="sit"><b>🧘</b><span>고요히 앉기</span></button>
  <button data-act="lantern" class="primary"><b>🪷</b><span>연등 달기</span></button>
  <div class="sanct-dock-sub"><button data-act="invite">일행과 함께하기</button><button data-act="card">오늘의 기념카드</button></div>
 </nav></div>`;
 const canvas=$('#sanct-canvas'),hint=$('#sanct-hint'),hud=$('#sanct-hud');
 const setHint=t=>hint.textContent=t;
 const scene=createSanctuaryScene(canvas,{onTap});
 requestAnimationFrame(()=>$('#sanct-loading').remove());

 // ---------- me ----------
 let me=null;
 function spawnMe(){if(me)scene.removeAvatar(you);me=scene.addAvatar(you,{kind:profile.kind,color:profile.color,name:profile.name,mine:true});me.onBowDone=onMyBow;const last=read('gj-sanctuary-pos-v8',null);scene.place(me,0,29,Math.PI);scene.walk(me,last?.x??0,last?.z??20,{facing:Math.PI});scene.focus(0,24,17)}
 function rekeyMe(id){if(!me||id===you)return;scene.avatars.delete(you);scene.avatars.set(id,me);you=id}
 const myCushion=()=>{const i=Math.max(0,seats.indexOf(you));return CUSHIONS[CUSHION_ORDER[i%CUSHION_ORDER.length]]};
 function walkTo(x,z,opts={}){stopModes();scene.walk(me,x,z,opts);send({type:'move',x:Math.round(x*100)/100,z:Math.round(z*100)/100});try{localStorage.setItem('gj-sanctuary-pos-v8',JSON.stringify({x,z}))}catch{}}
 function toCushion(then){const c=myCushion();const near=Math.hypot(me.pos.x-c.x,me.pos.z-c.z)<.3&&!me.target;if(near){me.facing=Math.PI;then();return}walkTo(c.x,c.z,{facing:Math.PI,onArrive:then});setHint('방석으로 가는 중…')}
 function pose(p){scene.setPose(me,p);send({type:'pose',pose:p})}

 // ---------- actions ----------
 function stopModes(){if(mode==='sit'){stats.sit+=Math.round((Date.now()-sitStart)/1000);saveStats();clearInterval(sitTimer);sitTimer=null}if(auto108){clearInterval(auto108);auto108=null}if(mode!=='free'){mode='free';hud.hidden=true;document.body.classList.remove('sanct-calm')}if(me&&me.pose==='bow')me.bowQueue=0}
 function onMyBow(){stats.bows++;saveStats();moktak();buzz(25);if(mode==='108'){goalCount++;renderHud();if(goalCount>=goal){clearInterval(auto108);auto108=null;scene.emote(me,'🪷');bell();setTimeout(()=>{toast(goal===108?'108배를 모두 마쳤어요. 오늘의 기념카드에 남겨 둘게요.':'절을 모두 마쳤어요.');stopModes();setHint('수고했어요. 기념카드를 만들어 보세요')},400)}}}
 function hapjang(){if(!me)return;stopModes();pose('hapjang');scene.emote(me,'🙏');soft();stats.greets++;saveStats();setHint('두 손을 모아 마음을 가다듬어요')}
 function bowOnce(n=1){toCushion(()=>{scene.setPose(me,'bow',{queue:n-1});send({type:'pose',pose:'bow'});if(n>1){let k=n-1;const iv=setInterval(()=>{if(me.pose!=='bow'||k<=0){clearInterval(iv);return}k--;send({type:'pose',pose:'bow'})},1900)}setHint(n===3?'삼배를 올리는 중이에요':'절을 올리는 중이에요')})}
 function start108(target){toCushion(()=>{mode='108';goal=target;goalCount=0;renderHud();hud.hidden=false;setHint('큰 버튼을 누를 때마다 한 번씩 절해요')})}
 function bow108Tap(){if(!me||me.pose==='bow'&&me.poseT<1.7)return;scene.setPose(me,'bow');send({type:'pose',pose:'bow'})}
 function renderHud(){if(mode==='108'){const pct=Math.min(1,goalCount/goal),C=2*Math.PI*44;hud.innerHTML=`<div class="sanct-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct)}"/></svg><strong>${goalCount}<small>/ ${goal}</small></strong></div><div class="sanct-hud-actions"><button id="h-bow" class="primary">절하기</button><button id="h-auto" aria-pressed="${!!auto108}">${auto108?'자동 멈춤':'자동으로'}</button><button id="h-stop">그만하기</button></div>`;$('#h-bow').onclick=bow108Tap;$('#h-stop').onclick=()=>{stopModes();pose('stand');setHint('언제든 다시 이어서 할 수 있어요')};$('#h-auto').onclick=()=>{if(auto108){clearInterval(auto108);auto108=null}else{bow108Tap();auto108=setInterval(bow108Tap,2000)}renderHud()}}
  else if(mode==='sit'){const s=Math.round((Date.now()-sitStart)/1000);hud.innerHTML=`<div class="sanct-calm-box"><small>고요히 머무는 중</small><strong>${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}</strong><p>숨을 천천히 들이쉬고, 내쉬어요.</p><button id="h-rise">일어나기</button></div>`;$('#h-rise').onclick=()=>{stopModes();pose('stand');setHint('바닥을 누르면 그곳으로 걸어가요')}}}
 function sit(){toCushion(()=>{mode='sit';sitStart=Date.now();pose('sit');document.body.classList.add('sanct-calm');hud.hidden=false;renderHud();bell();let n=0;sitTimer=setInterval(()=>{renderHud();if(++n%30===0)bell()},1000);setHint('')})}
 function tok(){moktak();buzz(15);stats.toks++;saveStats();if(me){scene.emote(me,'똑');}const b=$('[data-act="moktak"]');b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit')}
 function bowMenu(){const d=modal(`<p class="sanct-eyebrow">BOW · 절하기</p><h2>어떻게 절을 올릴까요?</h2><p>대웅전 앞 방석으로 걸어가서 절해요. 오늘 올린 절: <b>${stats.bows}배</b></p><div class="sanct-choice"><button data-n="1">한 번 절하기<small>잠깐 마음만 전해요</small></button><button data-n="3">삼배<small>부처님·가르침·스님께 세 번</small></button><button data-n="108" class="primary">108배 도전<small>한 번씩 누르거나 자동으로</small></button><button data-n="21">21배<small>짧게 도전해요</small></button></div>`);d.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{d.close();const n=+b.dataset.n;if(n>=21)start108(n);else bowOnce(n)})}

 // ---------- lanterns ----------
 const myWish=()=>room?shared.lanterns.find(l=>l.owner===you)||null:soloWish&&{...soloWish,mine:true,name:profile.name};
 const lanternList=()=>room?shared.lanterns.map(l=>({...l,mine:l.owner===you})):soloWish?[{...soloWish,mine:true,name:profile.name}]:[];
 function freeSlot(){const used=new Set(lanternList().filter(l=>!l.mine).map(l=>l.slot));const order=LANTERN_SLOTS.map((s,i)=>i).sort((a,b)=>Math.abs(LANTERN_SLOTS[a].x)+Math.abs(LANTERN_SLOTS[a].z-10)*.6-(Math.abs(LANTERN_SLOTS[b].x)+Math.abs(LANTERN_SLOTS[b].z-10)*.6));return order.find(i=>!used.has(i))??0}
 function lanternForm(slot=null){const cur=myWish();const target=slot??cur?.slot??freeSlot();let color=cur?.color||profile.color||'coral';
  const d=modal(`<p class="sanct-eyebrow">LOTUS LANTERN · 연등 달기</p><h2>${cur?'내 연등 고치기':'연등에 소원을 적어요'}</h2><form id="lf" class="sanct-form"><label>소원 <small><span id="lc">0</span>/40</small><textarea name="text" maxlength="80" rows="3" required placeholder="예) 우리 가족 모두 건강하게">${esc(cur?.text||'')}</textarea></label><div class="sanct-prompts">${['건강하게','여행 또 오자','합격하게 해 주세요','늘 고마워요'].map(p=>`<button type="button" data-p="${p}">${p}</button>`).join('')}</div><p class="sanct-label">연등 색</p>${swatches(color)}<button class="primary" type="submit">${cur?'고친 소원 달기':'이 소원으로 연등 달기'}</button>${room?'<p class="small">이 마당의 일행 모두에게 보여요.</p>':'<p class="small">이 폰에 저장돼요. 일행과 함께하면 서로의 연등이 보여요.</p>'}</form>`);
  const ta=$('textarea',d),cnt=$('#lc',d),upd=()=>cnt.textContent=Array.from(ta.value).length;upd();ta.oninput=upd;d.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{ta.value=b.dataset.p;upd()});wireSwatches(d,c=>color=c);
  $('#lf',d).onsubmit=e=>{e.preventDefault();const text=clean(ta.value,40);if(!text){toast('소원을 한 줄 적어 주세요.');return}d.close();hang({text,color,slot:target})}}
 function hang(w){const s=LANTERN_SLOTS[w.slot];walkTo(s.x,s.z+1.6,{facing:Math.PI,onArrive:()=>{pose('hapjang');scene.emote(me,'🪷');soft();if(room){send({type:'lantern',...w})}else{soloWish={...w,at:Date.now()};write(SOLO,soloWish);scene.setLanterns(lanternList(),{animateSlot:w.slot})}toast('연등을 달았어요. 밤으로 바꾸면 불이 들어와요 ☾');setHint('☾ 버튼으로 밤을 만들어 보세요')}});setHint('연등 줄로 가는 중…')}
 function readWish(w){const d=modal(`<p class="sanct-eyebrow">${w.mine?'MY LANTERN · 내 연등':'LANTERN · 연등'}</p><h2>${esc(w.name||'여행자')}의 소원</h2><blockquote class="sanct-wish" style="--c:${colors[w.color]||'#eee'}">${esc(w.text)}</blockquote>${w.mine?'<div class="stack"><button id="we" class="primary">소원 고치기</button><button id="wr">연등 내리기</button></div>':'<button id="wg" class="primary">합장으로 마음 보태기 🙏</button>'}`);
  if(w.mine){$('#we',d).onclick=()=>{d.close();lanternForm(w.slot)};$('#wr',d).onclick=()=>{d.close();if(room)send({type:'remove'});else{soloWish=null;try{localStorage.removeItem(SOLO)}catch{}scene.setLanterns(lanternList())}toast('연등을 내렸어요.')}}else $('#wg',d).onclick=()=>{d.close();hapjang()}}
 function onTap(e){if(!me)return;if(e.type==='lantern'){if(e.wish)readWish({...e.wish,mine:e.wish.mine});else{const taken=myWish();if(taken){toast('연등은 한 사람에 하나씩 달 수 있어요. 내 연등을 고쳐 볼까요?');readWish(taken)}else lanternForm(e.slot)}return}
  if(e.type==='avatar'){if(e.avatar===me){profileModal();return}hapjang();toast(`${e.avatar.name}님께 합장으로 인사했어요`);return}
  if(e.type==='ground'){e.ripple();walkTo(e.x,e.z);setHint('걷는 중…');setTimeout(()=>{if(!me.target&&mode==='free')setHint('바닥을 누르면 그곳으로 걸어가요')},2500)}}

 // ---------- profile ----------
 function profileModal(first=false){let kind=profile?.kind||'monk',color=profile?.color||'coral';
  const d=modal(`<p class="sanct-eyebrow">BULGUKSA · METAVERSE TEMPLE</p><h2>${first?'불국사 마당에 들어가요':'내 모습 바꾸기'}</h2>${first?'<p>아바타로 마당을 걷고, 대웅전 앞에서 절을 올리고, 연등에 소원을 달아요.</p>':''}<form id="pf" class="sanct-form"><div class="sanct-kinds" role="radiogroup" aria-label="아바타"><button type="button" role="radio" data-k="monk" aria-checked="${kind==='monk'}"><b>👶</b>동자승</button><button type="button" role="radio" data-k="traveler" aria-checked="${kind==='traveler'}"><b>🧢</b>여행자</button></div><label>별명<input name="name" maxlength="12" required value="${esc(profile?.name||'여행자 '+(Math.floor(Math.random()*900)+100))}"></label><p class="sanct-label">내 색 (모자·옷·연등)</p>${swatches(color)}<button class="primary" type="submit">${first?'마당으로 들어가기':'바꾸기'}</button></form>`);
  d.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kind=b.dataset.k;d.querySelectorAll('[data-k]').forEach(x=>x.setAttribute('aria-checked',x===b))});wireSwatches(d,c=>color=c);
  $('#pf',d).onsubmit=e=>{e.preventDefault();const name=clean(new FormData(e.target).get('name'),12)||'여행자';profile={name,kind,color};write(PROFILE,profile);d.close();audio();const pos=me?{x:me.pos.x,z:me.pos.z}:null;if(me){scene.removeAvatar(you);me=scene.addAvatar(you,{...profile,mine:true});me.onBowDone=onMyBow;scene.place(me,pos.x,pos.z)}else spawnMe();send({type:'profile',...profile});if(first)setTimeout(()=>setHint('바닥을 누르면 걸어가요 · 아래 버튼으로 절하고 연등을 달아요'),600)};
  if(first)d.addEventListener('close',()=>{if(!profile){profile={name:'여행자',kind:'monk',color:'coral'};write(PROFILE,profile);spawnMe()}},{once:true})}

 // ---------- room (투어 일행 최대 10명) ----------
 const roomBtn=$('#sanct-room');
 function setRoom(text,state){roomBtn.querySelector('span').textContent=text;roomBtn.dataset.state=state}
 function send(a){if(room&&connected)room.send(JSON.stringify({type:'action',action:a}))}
 function connect(id){room?.close();connected=false;setRoom('일행 마당 연결 중…','wait');const r=new SanctuaryRoom(id);room=r;
  r.onopen=()=>{if(room!==r)return;connected=true;r.send(JSON.stringify({type:'join'}));if(profile)r.send(JSON.stringify({type:'action',action:{type:'profile',...profile}}));if(me)setTimeout(()=>send({type:'move',x:me.pos.x,z:me.pos.z}),300)};
  r.onmessage=ev=>{if(room!==r)return;let m;try{m=JSON.parse(ev.data)}catch{return}if(m.type==='error'){if(!/천천히/.test(m.error))toast(m.error);return}if(m.type==='full'){toast(m.error);leave();return}if(m.type==='state')applyState(m)};
  r.onclose=()=>{if(room!==r)return;connected=false;setRoom('연결 끊김 · 다시 연결','off');shared={guests:{},lanterns:[]};syncGuests();scene.setLanterns(lanternList())}}
 function leave(){room?.close();room=null;connected=false;seats=[];setRoom('혼자 참배 중','solo');syncGuests();scene.setLanterns(lanternList())}
 function applyState(m){if(m.you&&m.you!==you)rekeyMe(m.you);seats=Array.isArray(m.seats)?m.seats:[];shared={guests:m.view?.guests||{},lanterns:m.view?.lanterns||[]};const n=seats.length;setRoom(n>1?`일행 ${n}명 함께`:'일행 마당 · 나 혼자','on');syncGuests();scene.setLanterns(lanternList());
  // 내 연등은 기념카드용으로 폰에도 복사
  const mine=shared.lanterns.find(l=>l.owner===you);if(mine)write(SOLO,{text:mine.text,color:mine.color,slot:mine.slot,at:Date.now()})}
 function syncGuests(){const present=new Set(room?seats.filter(id=>id!==you&&shared.guests[id]):[]);
  for(const id of [...scene.avatars.keys()])if(id!==you&&!present.has(id)){scene.removeAvatar(id);lastPoseSeq.delete(id)}
  for(const id of present){const g=shared.guests[id];let av=scene.avatar(id);if(av&&(av.kind!==g.kind||av.color!==g.color||av.name!==g.name)){scene.removeAvatar(id);av=null}
   if(!av){av=scene.addAvatar(id,{kind:g.kind,color:g.color,name:clean(g.name,12),mine:false});scene.place(av,g.x,g.z,Math.PI);lastPoseSeq.set(id,g.poseSeq||0);scene.emote(av,'🙏');if(g.pose==='sit')scene.setPose(av,'sit');continue}
   const tx=g.x,tz=g.z;if(Math.hypot(av.pos.x-tx,av.pos.z-tz)>.15&&(!av.target||av.target.x!==tx||av.target.z!==tz)){const onC=CUSHIONS.some(c=>Math.abs(c.x-tx)<.01&&Math.abs(c.z-tz)<.01);scene.walk(av,tx,tz,{facing:onC?Math.PI:null})}
   const seq=g.poseSeq||0;if(seq>(lastPoseSeq.get(id)||0)){lastPoseSeq.set(id,seq);const p=g.pose;if(p==='bow'){if(av.pose==='bow'&&av.poseT<1.9)av.bowQueue++;else scene.setPose(av,'bow');}else if(p==='hapjang'){scene.setPose(av,'hapjang');scene.emote(av,'🙏')}else scene.setPose(av,p)}}
  const total=room?seats.reduce((s,id)=>s+(shared.guests[id]?.bows||0),0):0;roomBtn.title=room?`우리 일행이 오늘 함께 올린 절 ${total}배`:''}
 function newRoomId(){const a='abcdefghjkmnpqrstuvwxyz23456789';return 'bg'+Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>a[b%a.length]).join('')}
 function roomUrl(id){const u=new URL(location.href);u.search='';u.searchParams.set('tour','bulguksa');u.searchParams.set('mode','sanctuary');u.searchParams.set('room',id);u.hash='';return u.toString()}
 function invite(){if(!room){const id=newRoomId();history.replaceState(null,'',roomUrl(id));connect(id)}const id=room.room,url=roomUrl(id);
  const d=modal(`<p class="sanct-eyebrow">TOGETHER · 일행과 함께</p><h2>일행을 같은 마당으로 불러요</h2><p>이 링크를 받은 사람은 같은 불국사 마당에 들어와요. 서로의 아바타와 절, 연등이 보여요. <b>최대 10명</b>까지 함께할 수 있어요.</p><input type="text" readonly value="${esc(url)}" aria-label="초대 링크"><div class="stack"><button id="ishare" class="primary">링크 보내기</button>${''}<button id="ileave">혼자 하기로 돌아가기</button></div><p class="small">링크를 처음 연 폰이 마당을 열어요. 그 폰의 화면이 꺼지면 연결이 잠시 끊길 수 있어요.</p>`);
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
  x.fillStyle='#a59c8c';x.font='400 20px "Noto Sans KR",sans-serif';x.fillText('불국사를 단순화한 체험용 3D 공간입니다 · 경주트립',70,H-40);
  saveCanvas(c,'bulguksa-sanctuary-'+stats.date.replace(/\D/g,'')+'.png')}

 // ---------- wiring ----------
 root.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{audio();if(!me){profileModal(true);return}({hapjang,bow:bowMenu,moktak:tok,sit,lantern:()=>{const w=myWish();w?readWish(w):lanternForm()},invite,card}[b.dataset.act])()});
 root.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>{if(!me)return;const s=SPOTS[b.dataset.spot];walkTo(s.x+(Math.random()-.5)*2,s.z,{facing:b.dataset.spot==='lanterns'?Math.PI:Math.PI});setHint(s.label+'(으)로 가는 중…')});
 $('#sanct-in').onclick=()=>scene.zoom(.75);$('#sanct-out').onclick=()=>scene.zoom(1.33);$('#sanct-over').onclick=()=>scene.overview();
 const nightBtn=$('#sanct-night');nightBtn.onclick=()=>{const v=!scene.isNight();scene.setNight(v);nightBtn.setAttribute('aria-pressed',v);nightBtn.textContent=v?'☼':'☾';nightBtn.setAttribute('aria-label',v?'낮으로 바꾸기':'밤으로 바꾸기');document.body.classList.toggle('sanct-night',v)};
 $('#sanct-sound').onclick=e=>{soundOn=!soundOn;write(SOUND,soundOn);e.target.setAttribute('aria-pressed',soundOn);e.target.textContent=soundOn?'🔔':'🔕';if(soundOn)moktak()};
 $('#sanct-info').onclick=()=>modal(`<p class="sanct-eyebrow">ABOUT</p><h2>불국사 메타버스 소원마당</h2><p>대웅전·석가탑·다보탑이 있는 불국사 마당을 <b>단순화해 만든 체험용 3D 공간</b>이에요. 실측 복원이 아니며, 실제 사찰에 등록되는 연등이나 기도가 아니에요.</p><p><b>걷기</b> 바닥을 누르세요. 끌면 둘러보고, 두 손가락으로 확대해요.<br><b>참배</b> 합장 · 절(한 번, 삼배, 21배, 108배) · 목탁 · 고요히 앉기<br><b>연등</b> 한 사람에 하나. 밤이 되면 불이 들어와요.<br><b>일행</b> 초대 링크로 최대 10명이 같은 마당에 모여요. 대화 없이 동작으로만 마음을 나눠요.</p><p class="small">혼자 할 때의 기록과 연등은 이 폰에만 저장돼요.</p><p><a href="./?tour=bulguksa">예전 사진 소원마당 보기 ↗</a></p>`);
 document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(mode==='108'&&(e.key===' '||e.key==='Enter')){e.preventDefault();bow108Tap()}else if(e.key==='m'||e.key==='M')tok()});

 scene.setLanterns(lanternList());
 if(profile){spawnMe();setTimeout(()=>setHint('바닥을 누르면 걸어가요 · 아래 버튼으로 절하고 연등을 달아요'),400)}else profileModal(true);
 if(roomId)connect(roomId);else setRoom('혼자 참배 중','solo');
}
