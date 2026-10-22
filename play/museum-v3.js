import {artifacts,artifactById,interiorSource,storageKey,normalizeState} from './museum-data-v3.js';
import {createGallery} from './museum-scene-v3.js';
import {esc,read,write,toast,saveCanvas} from './ui.js';

export async function mountMuseum(main){
 document.body.classList.add('museum-gallery');document.title='나의 신라 전시실 · 경주트립';
 const css=document.createElement('link');css.rel='stylesheet';css.href='./museum-v3.css?v=20261022-1';document.head.append(css);
 const raw=read(storageKey,null);let state=normalizeState(raw);
 const recommended=['wing','pensive','toou','earrings',null,'smile'].map(id=>id?{id,rotation:0,note:''}:null);
 if(!raw)state.cases=structuredClone(recommended);
 let previous=null,selected=-1,gallery,filter='전체',busy=false,lastFocus=null;
 const status=new Map();
 main.innerHTML=`<div class="mg-app">
  <header class="mg-header"><a class="mg-brand" href="../?tour=museum"><span class="mg-seal">慶</span><span>GYEONGJU TRIP<small>나의 신라 전시실</small></span></a><div class="mg-top-actions"><button type="button" data-action="info" aria-label="공간과 유물의 출처">ⓘ <span>안내</span></button><button type="button" data-action="save" class="mg-save">전시 사진 저장 ↗</button></div></header>
  <div class="mg-stage" id="mg-stage"></div>
  <div class="mg-heading"><span class="mg-eyebrow">SILLA, THROUGH MY EYES</span><button class="mg-title" data-action="title"><span></span><small>✎</small></button><p>좋아하는 유물로 채우는 나만의 전시.</p></div>
  <div class="mg-room-tools"><button data-action="overview" aria-label="전시실 전체 보기">⌂<span>전체 보기</span></button><button data-action="zoom-in" aria-label="전시실 확대">＋</button><button data-action="zoom-out" aria-label="전시실 축소">−</button></div>
  <div class="mg-hint" role="status">화면을 끌어 둘러보고, 유리 진열장을 눌러 보세요.</div>
  <nav class="mg-dock" aria-label="전시 꾸미기"><div class="mg-dock-label"><b>나의 컬렉션</b><span id="mg-count"></span></div><div class="mg-slots" aria-label="진열장 바로 선택"></div><button class="mg-edit" data-action="collection">유물 고르기 <span>＋</span></button><button class="mg-settings" data-action="settings" aria-label="전시실 설정">⚙</button></nav>
  <aside class="mg-panel" hidden aria-labelledby="mg-panel-title"><header><div><span class="mg-eyebrow" id="mg-panel-kicker"></span><h2 id="mg-panel-title" tabindex="-1"></h2></div><button data-action="close" aria-label="패널 닫기">×</button></header><div class="mg-panel-body"></div><div class="mg-panel-foot" hidden></div></aside>
 </div>`;
 const app=main.querySelector('.mg-app'),stage=main.querySelector('.mg-stage'),panel=main.querySelector('.mg-panel'),body=main.querySelector('.mg-panel-body'),foot=main.querySelector('.mg-panel-foot'),hint=main.querySelector('.mg-hint');
 function commit(change){previous=structuredClone(state);change();write(storageKey,state);refresh();}
 function refresh(){const undo=main.querySelector('[data-action="undo"]');if(undo)undo.disabled=!previous;main.querySelector('.mg-title span').textContent=state.title;main.querySelector('#mg-count').textContent=`${state.cases.filter(Boolean).length} / 6점`;main.querySelector('.mg-slots').innerHTML=state.cases.map((c,i)=>`<button class="${c?'has-artifact':''} ${i===selected?'active':''}" data-case="${i}" aria-label="${i+1}번 진열장 선택${c?' · '+artifactById[c.id].name:' · 비어 있음'}" title="${c?artifactById[c.id].name:'비어 있는 진열장'}">${c?`<img src="${artifactById[c.id].thumb}" alt="">`:'＋'}<small>${i+1}</small></button>`).join('');gallery?.setTitle(state.title);gallery?.setTheme(state.theme);}
 function openPanel(title,kicker,content,footer=''){
  if(panel.hidden)lastFocus=document.activeElement;panel.hidden=false;app.classList.add('panel-open');main.querySelector('#mg-panel-title').textContent=title;main.querySelector('#mg-panel-kicker').textContent=kicker;body.innerHTML=content;body.scrollTop=0;foot.innerHTML=footer;foot.hidden=!footer;main.querySelector('#mg-panel-title').focus({preventScroll:true});
 }
 function closePanel(){panel.hidden=true;app.classList.remove('panel-open');if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
 function showCatalog(i){selected=i;refresh();gallery?.focus(i);
  const cards=artifacts.filter(a=>filter==='전체'||a.category===filter).map(a=>`<button class="mg-artifact-card" data-pick="${a.id}"><div class="mg-artifact-image"><img src="${a.thumb}" alt="${a.name} 실제 3D 모델 렌더" loading="lazy"><span>3D</span></div><div><small>${a.era}</small><b>${a.name}</b><p>${a.short}</p><em>${state.cases[i]?.id===a.id?'현재 전시 중':'이 자리에 담기 ＋'}</em></div></button>`).join('');
  openPanel('어떤 유물을 담을까요?',`${String(i+1).padStart(2,'0')} / 유리 진열장`,`<div class="mg-filters" aria-label="유물 분류">${['전체','황금','불교미술','생활'].map(x=>`<button data-filter="${x}" aria-pressed="${x===filter}">${x}</button>`).join('')}</div><div class="mg-catalog">${cards}</div><p class="mg-micro">국가유산 디지털 자료 기반 · 전시하기 좋게 크기를 조정했어요.</p>`);
 }
 function showStory(i){selected=i;refresh();gallery.focus(i);const c=state.cases[i],a=artifactById[c.id];
  openPanel(a.name,`${String(i+1).padStart(2,'0')} / MY COLLECTION`,
   `<p class="mg-era">${a.era}</p><p class="mg-intro">${a.intro}</p><div class="mg-story-tabs" role="tablist" aria-label="유물 설명"><button role="tab" aria-selected="true" data-story="value">유물의 가치</button><button role="tab" aria-selected="false" data-story="story">얽힌 이야기</button><button role="tab" aria-selected="false" data-story="look">자세히 보기</button></div><div class="mg-story-content" role="tabpanel"><p>${a.value}</p></div><div class="mg-story-tools"><button data-action="rotate">↻ 유물 돌려 보기</button><button data-action="note">✎ 나의 한 줄</button></div>${c.note?`<blockquote class="mg-note">${esc(c.note)}</blockquote>`:`<p class="mg-question">${a.question}</p>`}<details class="mg-source"><summary>유물 자료와 이야기 출처</summary><p>${a.note}</p><a href="${a.source}" target="_blank" rel="noopener">국가유산 디지털 서비스 ↗</a><a href="${a.storySource}" target="_blank" rel="noopener">박물관 해설 자료 ↗</a></details>`,
   `<button data-action="replace" class="mg-primary">다른 유물로 바꾸기</button><button data-action="move">자리 옮기기</button><button data-action="remove" aria-label="진열장에서 유물 빼기">빼기</button>`);
 }
 function select(i){if(busy)return;if(status.get(i)==='error'){gallery.setCase(i,state.cases[i]);toast('유물을 다시 불러옵니다.');}state.cases[i]?showStory(i):showCatalog(i);}
 function showSettings(){openPanel('나만의 전시로','EXHIBITION SETTINGS',`<p class="mg-intro">좋아하는 분위기와 이름을 정해 보세요.</p><label class="mg-label" for="mg-name">전시 제목</label><input id="mg-name" maxlength="24" value="${esc(state.title)}"><fieldset class="mg-theme"><legend>전시실 분위기</legend><button data-theme="navy" aria-pressed="${state.theme==='navy'}"><i style="background:#233440"></i>깊은 남색</button><button data-theme="warm" aria-pressed="${state.theme==='warm'}"><i style="background:#786e5f"></i>따뜻한 돌빛</button></fieldset><div class="mg-settings-list"><button data-action="recommend">추천 유물 배치하기 <span>↗</span></button><button data-action="undo" ${previous?'':'disabled'}>방금 변경 되돌리기 <span>↶</span></button></div><p class="mg-micro">전시 제목·유물·배치·감상은 이 브라우저에 자동 저장됩니다. 다른 기기와 자동으로 연결되지는 않아요.</p>`,`<button class="mg-primary" data-action="apply-title">전시 제목 적용</button>`);}
 function info(){openPanel('실제 자료에서 시작한 전시','ABOUT THIS GALLERY',`<p class="mg-intro">박물관에서 만난 아름다움을,<br>나의 시선으로 다시 전시해요.</p><h3>공간의 모티프</h3><p>국립경주박물관 신라역사관 공식 실내사진의 짙은 남색 벽, 나무 바닥, 격자 천장 조명과 유리 진열장을 참고했습니다. 이곳은 자유롭게 꾸미는 가상 전시실이며, 실제 박물관의 배치나 현재 전시 목록을 그대로 재현한 공간은 아닙니다.</p><a class="mg-source-link" href="${interiorSource}" target="_blank" rel="noopener">참고한 공식 전시실 보기 ↗</a><h3>유물은 실제 3D 자료로</h3><p>국가유산청 국가유산 디지털 서비스 자료 및 기존 제공 모델을 사용했습니다. 모델을 모바일용으로 가볍게 하고, 비교·감상하기 좋은 크기로 배치했습니다. 모델별 가공 범위와 이야기의 출처는 각 유물 설명에서 확인할 수 있습니다.</p><h3>이렇게 즐겨 보세요</h3><p>① 진열장을 눌러 유물 선택<br>② 전시한 유물을 눌러 이야기 감상<br>③ 제목과 한 줄 감상을 붙이고 사진 저장</p><p class="mg-micro">3D 에셋 출처: 국가유산청 · 해설 참고: 국립경주박물관·국립중앙박물관. 실내사진 파일은 배경으로 사용하지 않았습니다.</p>`);}
 async function save(){if([...status.values()].some(x=>x==='error')){toast('불러오지 못한 유물을 다시 연 뒤 저장해 주세요.');return;}if([...status.values()].some(x=>x==='loading')){toast('유물을 불러온 뒤 사진을 저장할 수 있어요.');return;}const button=main.querySelector('[data-action="save"]');button.disabled=true;try{await document.fonts.ready;const shot=gallery.capture(),c=document.createElement('canvas');const w=1600,h=Math.round(w*shot.height/shot.width);c.width=w;c.height=h+220;const ctx=c.getContext('2d');ctx.fillStyle='#101c24';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(shot,0,0,w,h);ctx.fillStyle='#dcc99d';ctx.font='22px sans-serif';ctx.fillText('GYEONGJU TRIP  /  MY SILLA COLLECTION',64,h+49);ctx.fillStyle='#fff8eb';ctx.font='500 44px "Noto Sans KR",sans-serif';ctx.fillText(state.title,64,h+112,1470);ctx.fillStyle='#bdc5c8';ctx.font='20px "Noto Sans KR",sans-serif';ctx.fillText(`${state.cases.filter(Boolean).length}점의 선택 · 국가유산청 3D 자료 활용 · 국립경주박물관 실내 모티프의 가상 전시`,64,h+167,1470);await saveCanvas(c,'나의-신라-전시실.png');}catch(e){console.error(e);toast('사진을 만들지 못했어요. 다시 시도해 주세요.');}finally{button.disabled=false;}}
 main.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.case!==undefined){select(Number(b.dataset.case));return;}
  if(b.dataset.filter){filter=b.dataset.filter;showCatalog(selected);return;}
  if(b.dataset.pick){const i=selected,id=b.dataset.pick;commit(()=>{state.cases[i]={id,rotation:0,note:''};});gallery.setCase(i,state.cases[i]);showStory(i);toast(`${artifactById[id].name} 전시를 마쳤어요.`);return;}
  if(b.dataset.story){const a=artifactById[state.cases[selected]?.id];if(!a)return;body.querySelectorAll('[data-story]').forEach(x=>x.setAttribute('aria-selected',x===b));body.querySelector('.mg-story-content').innerHTML=`<p>${a[b.dataset.story]}</p>`;return;}
  if(b.dataset.theme){commit(()=>state.theme=b.dataset.theme);body.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',x===b));return;}
  if(b.dataset.move!==undefined){const i=selected,j=Number(b.dataset.move);commit(()=>{[state.cases[i],state.cases[j]]=[state.cases[j],state.cases[i]];});gallery.setCase(i,state.cases[i]);gallery.setCase(j,state.cases[j]);showStory(j);toast('유물의 전시 자리를 바꿨어요.');return;}
  switch(b.dataset.action){
   case 'close':closePanel();break;
   case 'overview':closePanel();selected=-1;refresh();gallery.overview();break;
   case 'zoom-in':gallery.zoom(.82);break;
   case 'zoom-out':gallery.zoom(1.2);break;
   case 'collection':{const empty=state.cases.findIndex(c=>!c);showCatalog(selected>=0?selected:empty>=0?empty:0);break;}
   case 'settings':case 'title':showSettings();break;
   case 'info':info();break;
   case 'save':save();break;
   case 'replace':showCatalog(selected);break;
   case 'rotate':{const i=selected;commit(()=>state.cases[i].rotation=(state.cases[i].rotation+45)%360);gallery.rotate(i,state.cases[i].rotation);break;}
   case 'remove':{const i=selected;commit(()=>state.cases[i]=null);gallery.setCase(i,null);showCatalog(i);toast('진열장을 비웠어요. 설정에서 되돌릴 수 있어요.');break;}
   case 'move':openPanel('어디에 전시할까요?','CHANGE LOCATION',`<p>유물이 있는 자리를 고르면 서로 자리를 바꿔요.</p><div class="mg-move-list">${state.cases.map((c,i)=>i===selected?'':`<button data-move="${i}"><b>${String(i+1).padStart(2,'0')}</b><span>${c?artifactById[c.id].name:'비어 있는 자리'}</span> →</button>`).join('')}</div>`);break;
   case 'note':{const c=state.cases[selected],a=artifactById[c.id];openPanel('유물 옆에 남기는 나의 말',a.name,`<p class="mg-intro">${a.question}</p><label class="mg-label" for="mg-note-input">나의 한 줄 감상</label><textarea id="mg-note-input" maxlength="80" rows="3" placeholder="이 유물을 고른 이유를 남겨 보세요.">${esc(c.note)}</textarea><p class="mg-micro">80자까지 · 이 브라우저에만 저장돼요.</p>`,`<button class="mg-primary" data-action="apply-note">감상 남기기</button>`);break;}
   case 'apply-note':{commit(()=>state.cases[selected].note=body.querySelector('textarea').value.trim().slice(0,80));showStory(selected);break;}
   case 'apply-title':commit(()=>state.title=body.querySelector('#mg-name').value.trim().slice(0,24)||'내가 사랑한 신라');closePanel();toast('전시 제목을 바꿨어요.');break;
   case 'recommend':commit(()=>state.cases=structuredClone(recommended));state.cases.forEach((c,i)=>gallery.setCase(i,c));closePanel();gallery.overview();toast('추천 유물을 배치했어요. 설정에서 되돌릴 수 있어요.');break;
   case 'undo':if(previous){const current=structuredClone(state);state=normalizeState(previous);previous=current;write(storageKey,state);refresh();state.cases.forEach((c,i)=>gallery.setCase(i,c));closePanel();gallery.overview();toast('이전 전시로 되돌렸어요.');}break;
  }
 });
 main.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)closePanel();if(e.target.matches('[role="tab"]')&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tabs=[...body.querySelectorAll('[role="tab"]')],index=tabs.indexOf(e.target),next=tabs[(index+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];next.focus();next.click();}});
 refresh();await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1200))]);
 try{gallery=createGallery(stage,{onSelect:select,onStatus(i,s){if(i<0){busy=true;hint.style.pointerEvents='auto';main.querySelector('.mg-save').disabled=true;hint.innerHTML='화면 연결이 끊겼어요. <button onclick="location.reload()">다시 열기</button>';return;}status.set(i,s);const loading=[...status.values()].filter(x=>x==='loading').length,failed=[...status.values()].filter(x=>x==='error').length;hint.textContent=loading?`실제 3D 유물을 불러오는 중 · ${loading}점`:failed?'불러오지 못한 진열장을 눌러 다시 시도해 주세요.':'화면을 끌어 둘러보고, 유리 진열장을 눌러 보세요.';},onReady(){}});refresh();state.cases.forEach((c,i)=>gallery.setCase(i,c));}
 catch(e){console.error(e);stage.innerHTML='<div class="mg-fallback"><h2>3D 전시실을 열 수 없어요.</h2><p>WebGL을 지원하는 Chrome 또는 Safari에서 다시 열어 주세요. 저장된 전시는 유지됩니다.</p><button onclick="location.reload()">다시 시도</button></div>';main.querySelectorAll('.mg-dock button,.mg-room-tools button,.mg-save').forEach(b=>b.disabled=true);}
 window.addEventListener('pagehide',e=>{if(!e.persisted)gallery?.dispose();});
}
