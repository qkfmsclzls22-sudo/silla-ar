import {inkScene} from './ink-scenes-v5.js';
import {read,write} from './ui.js';
import {artifacts} from '../heritage/catalog-v3.js?v=20261022-1';
import {$,esc,modal,toast,pic,shell,tabs,cover,contain,round,ellipse,text,onPointer,clamp,flash} from './mobile-kit-v4.js';
import {brushCells,uniqueIds} from './game-rules-v4.js';
const finds=[
 {id:'crown',name:'신라 금관',tag:'나뭇가지에 맺힌 금빛',src:'../assets/artifacts/crown-overlay-v4.png',fact:'위로 뻗은 나뭇가지 모양 장식과 작은 달개를 찾아보세요. 신라 금속 공예의 섬세함을 보여 줍니다.',credit:'경주트립 보유 금관 3D 자료 · 정면 렌더',link:'../crown/?tour=museum'},
 {id:'smile',name:'얼굴무늬 수막새',tag:'천 년을 건너온 미소',src:'../assets/artifacts/smile-overlay-v4.png',fact:'수막새는 지붕 끝을 마무리하는 기와예요. 살짝 올라간 입꼬리 덕분에 ‘신라의 미소’로 사랑받습니다.',credit:'경주트립 보유 수막새 3D 자료 · 정면 렌더',link:'../smile/?tour=museum'},
 {id:'toou',name:'작은 흙 인형, 토우',tag:'손끝으로 빚은 이야기',src:'../assets/artifacts/toou-overlay-v3.png',fact:'흙으로 사람이나 동물을 작게 빚은 것을 토우라고 해요. 신라인이 바라본 생활과 동물의 모습을 만나 보세요.',credit:'경주트립 보유 토우 자료 · 체험용 렌더',link:'../toou/?tour=museum'},
 {id:'wing',name:'금제 날개 관식',tag:'머리 위로 펼쳐진 날개',src:'../heritage/assets/wing/photo-v1.png',fact:'금관총 순금 관식은 관모 위에 꽂는 장식이에요. 새의 날개처럼 양옆으로 넓게 펼쳐진 모양을 살펴보세요.',credit:'국가유산청 · 금관총 순금 관식 3D 자료 / 공공누리 제1유형',source:artifacts.wing.sources[0][1],link:'./photo.html?item=wing&tour=museum'},
 {id:'earrings',name:'신라 금귀걸이',tag:'작은 고리 속 장인의 손길',src:'../heritage/assets/earrings/overlay-v1.png',fact:'작은 고리가 서로 이어지고, 맨 아래에는 나뭇잎처럼 생긴 달개가 달려 있어요. 확대해서 세공을 관찰해 보세요.',credit:'국가유산청 · 금귀걸이 108(다운로드명 007) / 공공누리 제1유형',source:artifacts.earrings.sources[0][1],link:'./photo.html?item=earrings&tour=museum'},
 {id:'dharani',name:'무구정광대다라니경',tag:'작은 글자에 담긴 큰 마음',src:'./assets/dharani.webp',fact:'1966년 불국사 석가탑을 해체·수리하다 발견한 불교 경전이에요. 이 체험에서는 전시 복제품 사진으로 만납니다.',credit:'Naturehead, Dharani sutra.jpg, 2011 · 전시 복제품 / 퍼블릭 도메인',source:'https://commons.wikimedia.org/wiki/File:Dharani_sutra.jpg',link:'../dharani/?tour=museum'}
];
export async function mountMuseum(root){
 const key='gj-excavation-v4',stored=read(key,{});let owned=new Set(uniqueIds(stored?.owned,finds.map(a=>a.id))),roomName=typeof stored?.name==='string'?stored.name.slice(0,18):'나의 경주 컬렉션';
 let mode='dig',selected=Math.max(0,finds.findIndex(a=>!owned.has(a.id))),progress=0,cells=new Set(),brush=30,autoStep=0,lastPoint=null;
 const stage=shell(root,{tour:'museum',title:'신라 발굴단',kicker:'02 / MUSEUM · HIDDEN TREASURES',chip:'모래 아래, 어떤 이야기가 있을까?'});
 const images=await Promise.all(finds.map(a=>pic(a.src)));stage.ready();
 const sand=document.createElement('canvas');sand.width=600;sand.height=800;const sc=sand.getContext('2d');
 function persist(){write(key,{owned:[...owned],name:roomName});}
 function freshSand(){cells=new Set();progress=0;autoStep=0;sc.clearRect(0,0,600,800);sc.save();round(sc,110,317,380,330,25,'#c59a61');sc.clip();const g=sc.createRadialGradient(300,445,20,300,445,300);g.addColorStop(0,'#dcba80');g.addColorStop(1,'#a7794c');sc.fillStyle=g;sc.fillRect(110,317,380,330);for(let i=0;i<5600;i++){sc.fillStyle=i%2?'#fff1c42a':'#503e2825';const x=110+(i*137.53)%380,y=317+(i*97.31)%330;sc.fillRect(x,y,i%4===0?2:1,1);}sc.restore();}
 function controls(){
  tabs($('#mode-tabs'),[['dig','유물 발굴'],['collection',`나의 전시실 ${owned.size}/6`]],mode,id=>{mode=id;controls();draw();});stage.chip(mode==='dig'?`발굴 구역 ${String(selected+1).padStart(2,'0')} · ${owned.size}/6 수집`:`나의 전시실 · ${owned.size}개의 발견`);
  $('#stage-actions').innerHTML=mode==='collection'?'<button id="rename-gallery">전시실 이름</button>':'<span class="stage-chip">체험용 가상 발굴</span>';$('#rename-gallery')?.addEventListener('click',rename);
  const body=$('#control-body');
  if(mode==='dig'){
   const collected=owned.has(finds[selected].id);
   body.innerHTML=`<div class="stat-line"><span id="dig-status">${collected?'발견한 유물이에요':progress>=65?'유물의 윤곽이 드러났어요!':'손가락으로 모래를 살살 털어 주세요'}</span><strong id="dig-percent">${collected?100:progress}%</strong></div><div class="meter" role="progressbar" aria-label="모래를 털어낸 면적" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${collected?100:progress}"><i style="width:${collected?100:progress}%"></i></div><div class="choice-row" aria-label="발굴 구역 선택">${finds.map((a,i)=>`<button data-site="${i}" aria-pressed="${i===selected}" aria-label="${i+1}번 발굴 구역${owned.has(a.id)?', 수집 완료':''}">${owned.has(a.id)?'✓ ':''}${String(i+1).padStart(2,'0')} 구역</button>`).join('')}</div><div class="action-row"><button id="dig-action" class="primary">${collected?'유물 자세히 보기':progress>=65?'조심히 꺼내서 수집하기':'브러시로 한 번 털기'}</button><button id="brush-size" class="subtle-btn" aria-pressed="${brush===46}">${brush===46?'넓은 솔':'고운 솔'}</button></div>`;
   body.querySelectorAll('[data-site]').forEach(b=>b.onclick=()=>{selected=+b.dataset.site;freshSand();controls();draw();});$('#brush-size').onclick=()=>{brush=brush===30?46:30;controls();};$('#dig-action').onclick=()=>{if(collected)detail(selected);else if(progress>=65)collect();else{for(let n=0;n<5;n++){const index=(autoStep++)%49;erase({x:128+(index%7)*54,y:337+Math.floor(index/7)*48},38);}updateProgress();draw();}};
   stage.note(collected?'찾아낸 유물의 작은 무늬까지 살펴보세요.':progress>=65?'발견! 아래 버튼으로 조심히 꺼내 주세요.':'가운데 흙을 문질러 보세요. 유물이 숨어 있어요.');
  }else{
   body.innerHTML=`<div><h2 class="control-title">${owned.size===6?'여섯 개의 발견, 나만의 전시':'발견할수록 빛나는 나의 전시실'}</h2><p class="control-copy">수집한 유물을 눌러 이야기를 읽고, 위쪽 저장 버튼으로 전시를 간직해요.</p></div><div class="collection-grid">${finds.map((a,i)=>`<button data-find="${i}" class="${owned.has(a.id)?'':'locked'}" aria-label="${owned.has(a.id)?a.name:'아직 발견하지 않은 '+(i+1)+'번 유물'}">${owned.has(a.id)?`<img src="${a.src}" alt=""><strong>${a.name}</strong>`:`<span>?</span><strong>${i+1}번 발견</strong>`}</button>`).join('')}</div>`;
   body.querySelectorAll('[data-find]').forEach(b=>b.onclick=()=>{const i=+b.dataset.find;if(owned.has(finds[i].id))detail(i);else{selected=i;mode='dig';freshSand();controls();draw();}});stage.note(owned.size?'선반 위의 유물을 톡! 다음 이야기로 이어져요.':'여섯 개의 빈자리가 당신의 발견을 기다려요.');
  }
 }
 function erase(p,r=brush){if(p.x<90||p.x>510||p.y<297||p.y>667)return;sc.save();sc.globalCompositeOperation='destination-out';sc.beginPath();sc.arc(p.x,p.y,r,0,Math.PI*2);sc.fill();sc.restore();progress=brushCells(cells,(p.x-110)/380,(p.y-317)/330,r/380,30,30,r/330);}
 function updateProgress(){if(!$('#dig-percent'))return;$('#dig-percent').textContent=progress+'%';$('.meter').setAttribute('aria-valuenow',progress);$('.meter i').style.width=progress+'%';if(progress>=65&&$('#dig-action').textContent!=='조심히 꺼내서 수집하기'){controls();flash();}}
 function collect(){const a=finds[selected];if(progress<65||owned.has(a.id))return;owned.add(a.id);persist();controls();draw();flash();detail(selected,true);}
 function detail(i,fresh=false){
  const a=finds[i],next=finds.findIndex(v=>!owned.has(v.id));
  const d=modal(`<p class="eyebrow">${fresh?'NEW DISCOVERY':'MY COLLECTION'} · ${String(i+1).padStart(2,'0')}</p><h2>${a.name}</h2><img class="discovery-image" src="${a.src}" alt="${a.name}"><p style="text-align:center;font-weight:700">${a.tag}</p><div class="discovery-fact">${a.fact}</div><p class="save-note">${a.credit}</p><div class="action-row"><button id="next-dig" class="primary">${fresh&&next>=0?'다음 보물 발굴하기':'내 전시실에 놓기'}</button><a class="btn subtle-btn" href="${a.link}">AR로 만나기 ↗</a></div>${a.source?`<p><a class="small-link" href="${a.source}" target="_blank" rel="noopener">원본 자료 보기 ↗</a></p>`:''}`);
  $('#next-dig',d).onclick=()=>{d.close();if(fresh&&next>=0){selected=next;mode='dig';freshSand();}else mode='collection';controls();draw();};
 }
 function rename(){const d=modal(`<h2>내 전시실의 이름은?</h2><form id="gallery-name"><input maxlength="18" aria-label="전시실 이름" required value="${esc(roomName)}"><button class="primary" style="margin-top:14px" type="submit">이 이름으로 열기</button></form>`);$('#gallery-name',d).onsubmit=e=>{e.preventDefault();roomName=$('input',d).value.trim()||'나의 경주 컬렉션';persist();d.close();draw();};}
 function draw(c=stage.ctx,exporting=false){
  if(mode==='dig'){
   inkScene(c,'excavation');const a=finds[selected],collected=owned.has(a.id);round(c,106,313,388,338,28,'#a07d4c','#8a6a42');round(c,112,319,376,326,22,'#ead9ad');c.save();c.shadowColor='#3b2d3045';c.shadowBlur=12;c.shadowOffsetY=8;contain(c,images[selected],137,344,326,268);c.restore();if(!collected){c.drawImage(sand,0,0);if(progress<3){text(c,'여기를 살살 문질러 보세요',300,465,17,'#fef1cb');text(c,'천 년의 이야기가 잠들어 있어요',300,497,12,'#f5dfb4');}}
   round(c,229,681,142,34,2,'#f3e6bf','#ad8f59');text(c,'EXCAVATION · '+String(selected+1).padStart(2,'0'),300,704,10,'#6f6140');if(collected)text(c,a.name,300,282,23,'#3e4b36');
  }else{
   c.fillStyle='#eee5cc';c.fillRect(0,0,600,800);const g=c.createLinearGradient(0,0,0,800);g.addColorStop(0,'#f8f2df');g.addColorStop(1,'#d9c8a0');c.fillStyle=g;c.fillRect(0,0,600,800);for(let x=35;x<600;x+=88){c.strokeStyle='#9f98701c';c.beginPath();c.moveTo(x,0);c.lineTo(x,800);c.stroke();}
   text(c,'THE LITTLE GYEONGJU MUSEUM',300,103,12,'#9b8051');text(c,roomName,300,144,27,'#37513d');text(c,`${owned.size}개의 발견이 모인 나만의 작은 박물관`,300,179,12,'#7f7d61');
   finds.forEach((a,i)=>{const x=45+i%2*270,y=220+Math.floor(i/2)*174;round(c,x,y,240,146,[70,70,6,6],'#f8efd7','#c1b38a');c.save();c.shadowBlur=14;c.shadowColor='#5b442a26';round(c,x+8,y+119,224,13,2,'#b6a078');c.restore();if(owned.has(a.id)){contain(c,images[i],x+30,y+10,180,108);text(c,a.name,x+120,y+158,11,'#526147');}else{text(c,'?',x+120,y+86,34,'#c3bb9a');text(c,'다음 발견을 기다리는 자리',x+120,y+158,10,'#8e9479');}});
   text(c,'모든 발견은 작은 호기심에서 시작됩니다.',300,779,11,'#727c61');
  }
 }
 onPointer(stage.canvas,{start:p=>{lastPoint=p;if(mode==='dig'&&!owned.has(finds[selected].id)){erase(p);updateProgress();draw();}},move:p=>{if(mode!=='dig'||owned.has(finds[selected].id))return;const previous=lastPoint||p,steps=Math.max(1,Math.ceil(Math.hypot(p.x-previous.x,p.y-previous.y)/12));for(let i=1;i<=steps;i++)erase({x:previous.x+(p.x-previous.x)*i/steps,y:previous.y+(p.y-previous.y)*i/steps});lastPoint=p;updateProgress();draw();},end:p=>{lastPoint=null;if(mode==='collection'){const col=Math.floor((p.x-30)/270),row=Math.floor((p.y-220)/174),i=row*2+col;if(col>=0&&col<2&&row>=0&&row<3&&owned.has(finds[i].id))detail(i);}},cancel:()=>{lastPoint=null;}});
 freshSand();controls();draw();stage.save(draw);
}
