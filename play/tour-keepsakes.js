import {$,esc,modal,read,write,saveCanvas,colors,swatches,wireSwatches} from './ui.js';

function wrapText(c,text,x,y,width,lineHeight){
 let line='';for(const char of Array.from(text)){if(char==='\n'||c.measureText(line+char).width>width){c.fillText(line,x,y);y+=lineHeight;line=char==='\n'?'':char;}else line+=char;}if(line)c.fillText(line,x,y);return y;
}
export function openWishPostcard(own,profile={}){
 const saved=read('gj-wish-postcard',{});let color=colors[saved.color]?saved.color:'gold';
 const text=typeof own?.text==='string'?own.text:typeof saved.text==='string'?saved.text:'';
 const name=typeof saved.name==='string'?saved.name:profile.name||'경주 여행자';
 const d=modal('<p class="eyebrow">MY WISH POSTCARD</p><h2>소원을 한 장에 담아요</h2><p>공유 마당에 올리지 않는 나만의 엽서예요. 연결을 기다리는 동안에도 만들 수 있어요.</p><form id="postcard-form" class="stack"><div><label for="postcard-name">엽서에 넣을 이름</label><input id="postcard-name" type="text" maxlength="12" value="'+esc(name)+'" required></div><div><label for="postcard-wish">오늘의 소원 · 60자</label><textarea id="postcard-wish" maxlength="60" required placeholder="경주에서 마음에 담은 소원을 적어 주세요">'+esc(text)+'</textarea></div><div class="row wrap wish-prompts"><button type="button" data-wish="우리 가족 모두 건강하고 행복하기">가족</button><button type="button" data-wish="오늘의 작은 도전이 내일의 꿈으로 이어지길">꿈</button><button type="button" data-wish="함께한 이 여행을 오래도록 기억하기">여행</button></div><div><label>내 소원등 색깔</label>'+swatches(color)+'</div><button class="primary" type="submit">소원 엽서 만들기</button><p class="small">내용은 이 기기에 저장돼요. 사진 저장·공유는 완성 후 직접 선택할 수 있어요.</p></form>');
 wireSwatches(d,v=>color=v);d.querySelectorAll('[data-wish]').forEach(b=>b.onclick=()=>{$('#postcard-wish',d).value=b.dataset.wish;});
 $('#postcard-form',d).onsubmit=async e=>{
  e.preventDefault();const name=$('#postcard-name',d).value.trim().slice(0,12),wish=$('#postcard-wish',d).value.trim().slice(0,60);if(!name||!wish)return;
  write('gj-wish-postcard',{name,text:wish,color});d.close();
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');
  const g=c.createLinearGradient(0,0,0,1350);g.addColorStop(0,'#183a3c');g.addColorStop(1,'#325848');c.fillStyle=g;c.fillRect(0,0,1080,1350);
  c.fillStyle='#f4ddb0';c.beginPath();c.arc(860,190,67,0,Math.PI*2);c.fill();c.fillStyle='#183a3c';c.beginPath();c.arc(885,170,62,0,Math.PI*2);c.fill();
  for(const [x,y] of [[90,165],[185,270],[930,370],[810,90],[140,1050],[970,990],[180,110],[880,1160]]){c.fillStyle='#f5deaa';c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();}
  c.strokeStyle='#b39a6b';c.lineWidth=3;c.beginPath();c.moveTo(540,0);c.lineTo(540,250);c.stroke();
  const glow=c.createRadialGradient(540,365,20,540,365,220);glow.addColorStop(0,colors[color]+'99');glow.addColorStop(1,colors[color]+'00');c.fillStyle=glow;c.fillRect(300,140,480,470);
  c.fillStyle=colors[color];c.beginPath();c.ellipse(540,360,110,130,0,0,Math.PI*2);c.fill();c.strokeStyle='#fff6';c.lineWidth=3;for(const rx of [40,78]){c.beginPath();c.ellipse(540,360,rx,130,0,0,Math.PI*2);c.stroke();}c.fillStyle='#987548';c.fillRect(500,227,80,14);c.fillRect(500,478,80,14);c.strokeStyle='#e4c885';c.beginPath();c.moveTo(540,490);c.lineTo(540,550);c.stroke();
  c.fillStyle='#f6e3b9';c.textAlign='center';c.font='700 25px sans-serif';c.fillText('GYEONGJU TRIP · 불국사 투어',540,635);c.font='700 55px sans-serif';c.fillText('소원 하나, 빛 하나.',540,722);
  c.font='500 44px sans-serif';c.fillStyle='#fff9e9';wrapText(c,wish,540,830,800,66);
  c.font='24px sans-serif';c.fillStyle='#e7d4b1';c.fillText(name+'의 소원',540,1180);c.font='20px sans-serif';c.fillText('경주에서 마음에 담은 오늘',540,1240);c.font='16px sans-serif';c.fillText('나만의 여행 엽서 · 체험용 일러스트',540,1290);
  await saveCanvas(canvas,'gyeongju-wish-postcard.png');
 };
}

export async function saveCityCard(source,title,completed,total){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');
 c.fillStyle='#f9f1dc';c.fillRect(0,0,1080,1350);c.fillStyle='#244c40';c.fillRect(0,0,1080,248);c.textAlign='center';c.fillStyle='#f4dfab';c.font='700 25px sans-serif';c.fillText('GYEONGJU TRIP · WOLSEONG',540,80);c.font='700 50px sans-serif';c.fillText(completed===total?'나도 월성 건축가!':'나의 월성 건축 기록',540,155);c.font='24px sans-serif';c.fillText('오늘의 건축 미션 '+completed+' / '+total,540,210);
 const ratio=Math.min(960/source.width,760/source.height),w=source.width*ratio,h=source.height*ratio;c.drawImage(source,(1080-w)/2,285+(760-h)/2,w,h);
 c.fillStyle='#315b45';c.font='700 36px sans-serif';wrapText(c,title||'나의 월성',540,1130,920,48);c.font='22px sans-serif';c.fillText('내가 꾸민 월성, 오늘의 건축 기록을 남겨요.',540,1235);c.font='17px sans-serif';c.fillStyle='#7c806c';c.fillText('월성에서 출발한 상상 놀이 · 실제 복원도가 아닙니다.',540,1290);
 await saveCanvas(canvas,'gyeongju-wolseong-builder.png');
}
