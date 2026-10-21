import {$,esc,modal,toast,read,write,pic,saveCanvas} from './ui.js';
import {artifacts as photoArtifacts,legacyItems} from '../heritage/catalog-v2.js?v=20261021-3';
const artifacts=[
 {id:'crown',name:'신라 금관',image:'crown',tag:'빛나는 황금의 나라',q:'금관은 몸의 어느 곳에 쓰던 장식일까요?',answers:['손목','머리','발목'],answer:1,hint:'‘관’은 머리에 쓰는 물건을 뜻해요.',fact:'금관은 신라의 화려한 금속 공예를 보여 주는 유물이에요. 나뭇가지 같은 세움 장식과 달개를 찾아보세요.',ar:'crown/'},
 {id:'smile',name:'얼굴무늬 수막새',image:'smile',tag:'천 년을 건너온 미소',q:'미소 짓는 얼굴의 수막새는 어디에 쓰였을까요?',answers:['지붕 끝','밥상 위','신발 바닥'],answer:0,hint:'비가 오는 날 건물을 지켜 주는 곳을 생각해 보세요.',fact:'수막새는 지붕 끝을 마무리하는 기와예요. 얼굴무늬 수막새는 ‘신라의 미소’로도 사랑받아요.',ar:'smile/'},
 {id:'toou',name:'토우',image:'toou',tag:'흙으로 빚은 이야기',q:'작은 사람이나 동물 모양의 토우는 무엇으로 만들었을까요?',answers:['유리','종이','흙'],answer:2,hint:'도자기와 같은 재료로 빚었어요.',fact:'토우는 흙으로 만든 작은 인물이나 동물 모양이에요. 신라인의 생활과 표현을 살펴볼 수 있어요.',ar:'toou/'},
 {id:'bell',name:'성덕대왕신종',image:'props/bell',tag:'멀리 퍼지는 신라의 울림',q:'성덕대왕신종은 어떤 유물일까요?',answers:['시간을 재는 모래시계','소리를 내는 큰 종','별을 보는 건물'],answer:1,hint:'이 유물의 이름은 ‘종’으로 끝나요.',fact:'성덕대왕신종은 771년에 완성되었어요. 정교한 장식과 오래 여운이 남는 종소리로 유명해요.',note:'놀이용 창작 이미지'},
 {id:'dharani',name:'무구정광대다라니경',image:'dharani',tag:'작은 글자에 담긴 큰 마음',q:'불국사 석가탑에서 발견된 이 유물은 무엇일까요?',answers:['불교 경전','왕의 신발','동물 모양 토기'],answer:0,hint:'작은 글자가 종이 위에 인쇄되어 있어요.',fact:'무구정광대다라니경은 1966년 불국사 석가탑을 해체·수리하는 과정에서 발견된 불교 경전이에요.',ar:'dharani/',note:'전시 복제품 사진'}
];
const newQuizzes=[
 {id:'pensive',tag:'생각에 잠긴 천년의 미소',q:'반가사유상의 오른손은 어디에 살짝 닿아 있나요?',answers:['무릎','뺨','머리 꼭대기'],answer:1,hint:'얼굴 옆에 가볍게 댄 손가락을 찾아보세요.',fact:'반가사유상은 한쪽 다리를 다른 쪽 무릎 위에 올리고 생각에 잠긴 자세예요. 같은 포즈로 기념사진도 남겨 보세요.'},
 {id:'wing',tag:'머리 위로 펼쳐진 금빛 날개',q:'금관총 관식의 양옆 장식은 무엇을 떠올리게 하나요?',answers:['새의 날개','물고기의 지느러미','꽃병'],answer:0,hint:'하늘로 날아오를 듯 양옆이 길게 펼쳐져 있어요.',fact:'금관총 순금 관식은 관모 위에 꽂는 장식품이에요. 새의 부리와 날개를 연상시키는 형태를 살펴보세요.'},
 {id:'earrings',tag:'작은 장식에 담긴 섬세함',q:'이 금귀걸이의 맨 아래 달개는 어떤 모양과 닮았나요?',answers:['하트','별','네모'],answer:0,hint:'아래쪽이 뾰족하고 위쪽이 두 갈래로 둥글어요.',fact:'이 귀걸이는 작은 고리를 이어 만든 샛장식과 하트처럼 보이는 심엽형 달개를 갖고 있어요.'},
 {"id":"king","tag":"금관과 금장으로 왕의 한 장","q":"이 체험에서 왕의 얼굴은 무엇으로 완성하나요?","answers":["내 실제 얼굴","옷에 그린 얼굴","동물 가면"],"answer":0,"hint":"카메라 앞에서 직접 주인공이 되어 보세요.","fact":"공식 관복 자료에 사극에서 영감을 얻은 금장과 장신구를 더했어요. 옷과 금관을 따로 맞춰 내 얼굴로 왕이 되어 보세요."},
 {"id":"queen","tag":"붉은 비단과 금빛 장신구","q":"선덕여왕 포토체험에서 옷과 함께 맞추는 장식은?","answers":["스키 모자","금관","잠수경"],"answer":1,"hint":"신라의 금빛 머리 장식을 떠올려 보세요.","fact":"선덕여왕을 떠올리는 붉은 옷과 금빛 장식의 창작 체험이에요. 국가유산청 복식 자료를 바탕으로 새로 꾸몄어요."},
 {"id":"noble","tag":"청록과 보라의 귀족 옷차림","q":"이 귀족 복식 체험의 머리장식은 어떤 모양인가요?","answers":["꽃","투구","왕관 모양 케이크"],"answer":0,"hint":"꽃잎과 초록빛 장식이 보여요.","fact":"저고리와 치마에 청록·보라 배색, 금장과 꽃 머리장식을 더한 체험용 복식이에요."},
 {"id":"hwarang","tag":"푸른 겉옷과 보랏빛 머리띠","q":"화랑 포토체험에서 이마에 맞추는 것은?","answers":["신발","장갑","머리띠"],"answer":2,"hint":"머리 위에서 자리를 잡는 장식이에요.","fact":"사극 속 화랑의 푸른 겉옷과 보라색 머리띠에서 영감을 얻었어요. 실제 복식의 정밀 복원보다 즐거운 사진 체험을 위한 재창작이에요."}
];
for(const quiz of newQuizzes){const a=photoArtifacts[quiz.id];artifacts.push({...quiz,name:a.title,src:`../heritage/assets/${quiz.id}/${quiz.id==='pensive'?'overlay-v1.png':a.poster||a.photo||'overlay-v1.png'}`,ar:`play/photo.html?item=${quiz.id}`,source:a.sources[0][1],note:'국가유산청 3D 자료 활용 · 공공누리 제1유형 · 체험용 렌더'});}
const sourceFor=a=>a.src||'./assets/'+a.image+'.webp';
const total=artifacts.length;

export async function mountMuseum(root){
 const saved=read('gj-collection',[]);let owned=new Set(Array.isArray(saved)?saved.map(id=>legacyItems[id]||id).filter(id=>artifacts.some(a=>a.id===id)):[]);
 root.innerHTML=`<div class="heading"><div><p class="eyebrow">MUSEUM · TREASURE JOURNAL</p><h1>나의 신라 보물 도감.</h1><p>유물과 복식 ${total}종을 살펴보고, 퀴즈를 풀고, 사진으로 변신해요.</p></div><span class="badge">이 기기에 저장</span></div><div class="museum-stage"><div class="museum-caption"><p class="eyebrow">A LITTLE DISCOVERY</p><h2 id="collection-title">오늘은 유물 탐험가</h2><p id="collection-caption"></p><div class="progress-track" role="progressbar" aria-label="보물 수집 진행" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0"><i id="progress"></i></div><p><strong id="collected"></strong> / ${total}종 수집</p></div></div><div class="artifact-shelf expanded-shelf" id="shelf"></div><section class="card" style="margin-top:18px"><div class="row wrap" style="justify-content:space-between"><div><h2 style="margin-bottom:5px">발견한 보물이 사진 속으로!</h2><p style="margin:0">수집한 카드를 다시 누르면 유물 이야기와 포토체험이 열려요.</p></div><div class="row wrap"><button id="passport" class="primary">내 도감 사진 저장</button><button id="reset-collection">다시 도전</button></div></div></section><p class="small" style="margin:12px 4px">실제 유물과 체험용 창작 복식을 함께 만나는 경주트립 퀴즈예요. 실제 전시 여부와 관람 동선은 현장에서 확인해 주세요.</p>`;
 function render(){
  $('#collected').textContent=owned.size;$('#progress').style.width=owned.size/total*100+'%';$('.progress-track').setAttribute('aria-valuenow',owned.size);
  $('#collection-title').textContent=owned.size===total?'신라 보물 탐험가 완성!':'오늘은 유물 탐험가';$('#collection-caption').textContent=owned.size===total?'모든 보물을 찾았어요. 도감을 저장하고 사진 체험도 즐겨 보세요.':'틀려도 괜찮아요. 힌트를 보며 한 가지씩 발견해요.';
  $('#shelf').innerHTML=artifacts.map(a=>'<button class="artifact '+(owned.has(a.id)?'collected':'')+'" data-artifact="'+a.id+'" aria-label="'+a.name+(owned.has(a.id)?' 수집 완료':' 퀴즈 풀기')+'">'+(owned.has(a.id)?'<i class="stamp">수집 완료</i>':'')+'<img src="'+sourceFor(a)+'" alt="'+a.name+'" loading="lazy"><strong>'+a.name+'</strong><span>'+(owned.has(a.id)?a.tag:'눌러서 보물 찾기')+'</span></button>').join('');
  $('#shelf').querySelectorAll('button').forEach(b=>b.onclick=()=>quiz(artifacts.find(a=>a.id===b.dataset.artifact)));
 }
 function detail(a){
  const ar=a.ar?'../'+a.ar+(a.ar.includes('?')?'&':'?')+'tour=museum':null;
  const d=modal('<p class="eyebrow">COLLECTED · MY TREASURE</p><h2>'+a.name+'</h2><img class="quiz-image" src="'+sourceFor(a)+'" alt="'+a.name+'"><p>'+a.fact+'</p>'+(a.note?'<p class="small">'+a.note+'</p>':'')+(a.source?'<p class="small"><a href="'+a.source+'" target="_blank" rel="noopener">국가유산청 원본 자료 ↗</a></p>':'')+'<div class="stack">'+(ar?'<a class="btn primary" href="'+ar+'">이 보물과 사진 찍기 ↗</a>':'<a class="btn primary" href="./?tour=wolseong">내 월성에 종 놓으러 가기 ↗</a>')+'<button id="keep-collecting">도감으로 돌아가기</button></div>');
  $('#keep-collecting',d).onclick=()=>d.close();
 }
 function quiz(a){
  if(owned.has(a.id)){detail(a);return;}
  const d=modal('<p class="eyebrow">FIND A TREASURE</p><h2>'+a.name+'</h2><img class="quiz-image" src="'+sourceFor(a)+'" alt="'+a.name+'"><p style="font-size:16px;font-weight:700">'+a.q+'</p><div class="quiz-options">'+a.answers.map((s,i)=>'<button data-answer="'+i+'">'+(i+1)+'. '+s+'</button>').join('')+'</div><p id="quiz-feedback" role="status" class="small">천천히 살펴보고 골라 보세요.</p>');
  d.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
   if(Number(b.dataset.answer)!==a.answer){b.classList.add('wrong');$('#quiz-feedback',d).textContent='한 번 더! '+a.hint;return;}
   owned.add(a.id);write('gj-collection',[...owned]);render();b.classList.add('correct');d.querySelectorAll('[data-answer]').forEach(x=>x.disabled=true);$('#quiz-feedback',d).textContent='정답! '+a.fact;
   const next=document.createElement('button');next.className='primary';next.style.marginTop='10px';next.textContent='보물 이야기와 사진 체험 보기';next.onclick=()=>detail(a);d.appendChild(next);
   const keep=document.createElement('button');keep.textContent=owned.size===total?'모든 보물 수집 완료!':'다음 보물 찾기';keep.style.marginTop='10px';keep.onclick=()=>{d.close();toast(a.name+' 수집 완료!');};d.appendChild(keep);
  });
 }
 $('#reset-collection').onclick=()=>{const d=modal('<h2>퀴즈를 다시 시작할까요?</h2><p>이 기기에 저장된 수집 기록이 지워져요.</p><button id="reset-confirm" class="primary">다시 도전하기</button>');$('#reset-confirm',d).onclick=()=>{owned=new Set();write('gj-collection',[]);render();d.close();};};
 $('#passport').onclick=async()=>{
  const button=$('#passport');button.disabled=true;button.textContent='도감을 만드는 중…';
  try{
   const cols=3,rows=Math.ceil(total/cols),canvas=document.createElement('canvas');canvas.width=1080;canvas.height=310+rows*300+100;const c=canvas.getContext('2d');
   c.fillStyle='#f8f2df';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#315b45';c.fillRect(0,0,1080,260);c.fillStyle='#f6dfad';c.textAlign='center';c.font='700 25px sans-serif';c.fillText('GYEONGJU TRIP',540,80);c.font='700 50px sans-serif';c.fillText('나의 신라 보물 도감',540,155);c.font='24px sans-serif';c.fillText(owned.size+' / '+total+'종의 보물을 찾았어요',540,220);
   const images=await Promise.all(artifacts.map(a=>pic(sourceFor(a))));
   artifacts.forEach((a,i)=>{const x=45+(i%cols)*345,y=300+Math.floor(i/cols)*300;c.fillStyle=owned.has(a.id)?'#fffbef':'#e7e6d8';c.beginPath();c.roundRect(x,y,300,275,20);c.fill();const im=images[i];if(im){const ratio=Math.min(245/im.width,175/im.height);c.globalAlpha=owned.has(a.id)?1:.25;c.drawImage(im,x+150-im.width*ratio/2,y+14,im.width*ratio,im.height*ratio);c.globalAlpha=1;}c.fillStyle='#315b45';c.font='700 20px sans-serif';c.fillText(a.name,x+150,y+222);c.font='17px sans-serif';c.fillText(owned.has(a.id)?'수집 완료':'다음 발견을 기다려요',x+150,y+254);});
   c.fillStyle='#687866';c.font='18px sans-serif';c.fillText('경주에서 만난 작은 발견 · 신규 유물·복식 이미지 출처: 국가유산청',540,canvas.height-42);await saveCanvas(canvas,'my-silla-treasures.png');
  }finally{button.disabled=false;button.textContent='내 도감 사진 저장';}
 };
 render();
}
