// 월성 수호대 v10: 그림(캔버스). 신라 월성 맵, 병사·인물·왕, 침입군을 직접 그린다.
import {BW,BH,COLS,ROWS,SLOT,GX,GY,LANE,UNITS,GRADES} from './guard-rules-v10.js?v=20261127-1';
export const TOP=86,BOT=74,CW=BW,CH=TOP+BH+BOT; // 위: 남산·첨성대·황룡사, 아래: 남천·월정교
const TAU=Math.PI*2;
const rnd0=s=>()=>(s=(s*16807)%2147483647)/2147483647;
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
// 기와지붕(옆에서): 처마가 완만하게 휘어 오르는 한식 지붕
function roof(c,x,y,w,h,col='#3b4246'){c.fillStyle=col;c.beginPath();c.moveTo(x-w/2-4,y+h*.25);c.quadraticCurveTo(x-w/2+w*.08,y+h*.55,x-w/2+w*.2,y+h*.62);c.lineTo(x+w/2-w*.2,y+h*.62);c.quadraticCurveTo(x+w/2-w*.08,y+h*.55,x+w/2+4,y+h*.25);c.lineTo(x+w*.28,y);c.lineTo(x-w*.28,y);c.closePath();c.fill();c.fillStyle='#22282b';c.fillRect(x-w*.3,y-2,w*.6,3)}

// ---------- 배경(한 번 그려 두고 재사용) ----------
export function drawMap(c,night=false){
 const r=rnd0(7);
 // 하늘
 const sky=c.createLinearGradient(0,0,0,TOP);
 if(night){sky.addColorStop(0,'#0e1530');sky.addColorStop(1,'#2a3a5c')}else{sky.addColorStop(0,'#bfd8e2');sky.addColorStop(1,'#eaf0dc')}
 c.fillStyle=sky;c.fillRect(0,0,CW,TOP+10);
 if(night){for(let i=0;i<50;i++){c.fillStyle=`rgba(255,250,220,${.3+r()*.6})`;c.fillRect(r()*CW,r()*TOP*.7,1.3,1.3)}c.fillStyle='#f4ecc8';c.beginPath();c.arc(CW/2+40,20,10,0,TAU);c.fill()}
 // 남산 능선(겹겹이)
 const hills=[[night?'#2c3d4c':'#9fb7a8',.55],[night?'#22323e':'#7f9d86',.75]];
 hills.forEach(([col,k],j)=>{c.fillStyle=col;c.beginPath();c.moveTo(0,TOP);for(let x=0;x<=CW;x+=10){c.lineTo(x,TOP-18*k-14*Math.sin(x/53+j*2)-9*Math.sin(x/23+j)-(j?0:10))}c.lineTo(CW,TOP);c.closePath();c.fill()});
 // 들판
 c.fillStyle=night?'#2f4a35':'#8fb06a';c.fillRect(0,TOP-6,CW,BH+12);
 // 첨성대(왼쪽 위): 술병 모양 몸체 + 우물 정 머리
 {const x=40,b=TOP-4;c.fillStyle=night?'#8f8a78':'#d6c9a6';c.beginPath();c.moveTo(x-12,b);c.bezierCurveTo(x-13,b-14,x-6,b-30,x-6,b-40);c.lineTo(x+6,b-40);c.bezierCurveTo(x+6,b-30,x+13,b-14,x+12,b);c.closePath();c.fill();
  c.strokeStyle=night?'#6c6858':'#b3a682';c.lineWidth=.6;for(let i=1;i<10;i++){c.beginPath();c.moveTo(x-13,b-i*4);c.lineTo(x+13,b-i*4);c.stroke()}
  c.fillStyle='#4a3f30';c.fillRect(x-2.5,b-24,5,5);c.fillStyle=night?'#8f8a78':'#cbbd97';c.fillRect(x-8,b-44,16,4);c.fillRect(x-6,b-46,3,7);c.fillRect(x+3,b-46,3,7);c.fillRect(x-14,b,28,3)}
 // 계림 숲
 for(let i=0;i<7;i++){const x=72+i*11+r()*6,y=TOP-6;c.fillStyle=night?'#1f3326':'#4f7a45';c.beginPath();c.arc(x,y-12-r()*4,8+r()*4,0,TAU);c.fill()}
 // 황룡사 구층목탑(오른쪽 멀리)
 {const x=CW-46,b=TOP-4;c.fillStyle=night?'#3a2a26':'#7c4b39';c.fillRect(x-3,b-64,6,64);for(let i=0;i<9;i++){const w=30-i*2.4,y=b-6-i*6.6;roof(c,x,y-3,w,7,night?'#262b2f':'#3e464a')}c.fillStyle='#c9a64a';c.fillRect(x-.8,b-78,1.6,14)}
 // 궁궐 지붕들(월성 안 멀리)
 // 궁궐 전각들(월성 안, 멀리): 기단·기둥·지붕
 for(const [x,w,h] of [[CW/2-58,46,18],[CW/2+2,56,22],[CW/2+62,40,16]]){const b=TOP-4;c.fillStyle=night?'#4a4438':'#cfc4a4';c.fillRect(x-w/2,b-4,w,4);c.fillStyle=night?'#4a2a22':'#7a3a2c';for(let k=0;k<5;k++)c.fillRect(x-w/2+4+k*(w-8)/4-1,b-h*.5,2,h*.5-4);c.fillStyle=night?'rgba(255,190,110,.55)':'#e8d8b0';c.fillRect(x-w/2+5,b-h*.45,w-10,h*.3);roof(c,x,b-h,w+6,h*.62,night?'#262b2f':'#3e464a')}
 c.save();c.translate(0,TOP);drawBoard(c,night,r);c.restore();
 // 남천과 월정교
 const y0=TOP+BH;const riv=c.createLinearGradient(0,y0,0,CH);riv.addColorStop(0,night?'#203a4a':'#5fa3a8');riv.addColorStop(1,night?'#162a38':'#3f8590');c.fillStyle=riv;c.fillRect(0,y0+10,CW,BOT);
 c.fillStyle=night?'#3a4a3a':'#c2b48a';c.fillRect(0,y0+4,CW,8); // 강둑
 c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=1;for(let i=0;i<14;i++){const x=r()*CW,y=y0+22+r()*(BOT-20);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+8,y-3,x+16,y);c.stroke()}
 {const bx=96;c.fillStyle=night?'#6b6555':'#bfb397';for(let i=0;i<3;i++)c.fillRect(bx-6,y0+18+i*18,12,10);c.fillStyle=night?'#5a3328':'#8c3b2c';c.fillRect(bx-9,y0+8,18,BOT-4);for(let i=0;i<4;i++)roof(c,bx,y0+6+i*17,30,12,night?'#262b2f':'#3e464a');
  if(night){for(let i=0;i<4;i++){const g=c.createRadialGradient(bx+13,y0+16+i*17,0,bx+13,y0+16+i*17,10);g.addColorStop(0,'rgba(255,200,110,.8)');g.addColorStop(1,'rgba(255,200,110,0)');c.fillStyle=g;c.fillRect(bx,y0+4+i*17,26,24)}}}
 c.fillStyle=night?'rgba(255,240,200,.75)':'rgba(40,50,40,.55)';c.font='700 10px "Noto Sans KR",sans-serif';c.fillText('남천 · 월정교',bx2(),CH-10);c.fillText('첨성대',58,TOP-50);c.textAlign='right';c.fillText('황룡사 구층목탑',CW-62,TOP-60);c.textAlign='left';
}
const bx2=()=>128;
function drawBoard(c,night,r){
 // 해자(바깥 물길): 길 바깥쪽 고리
 const L=LANE,lw=24;
 c.fillStyle=night?'#1d3b48':'#5e9ea3';rr(c,L.x0-lw/2-9,L.y0-lw/2-9,L.x1-L.x0+lw+18,L.y1-L.y0+lw+18,16);c.fill();
 for(let i=0;i<22;i++){const t=r(),side=Math.floor(r()*4);let x,y;if(side===0){x=L.x0+t*(L.x1-L.x0);y=L.y0-lw/2-5}else if(side===1){x=L.x1+lw/2+5;y=L.y0+t*(L.y1-L.y0)}else if(side===2){x=L.x0+t*(L.x1-L.x0);y=L.y1+lw/2+5}else{x=L.x0-lw/2-5;y=L.y0+t*(L.y1-L.y0)}
  c.fillStyle=night?'#2f5a3a':'#5f9a54';c.beginPath();c.ellipse(x,y,3.5,2.6,r()*3,0,TAU);c.fill();if(r()<.35){c.fillStyle=night?'#c98aa0':'#f0a6c0';c.beginPath();c.arc(x+1,y-1,1.6,0,TAU);c.fill()}}
 // 성 바깥 길(다진 흙길)
 c.strokeStyle=night?'#6f6248':'#cdb689';c.lineWidth=lw;c.lineJoin='round';c.strokeRect(L.x0,L.y0,L.x1-L.x0,L.y1-L.y0);
 c.strokeStyle=night?'rgba(0,0,0,.18)':'rgba(120,95,55,.25)';c.lineWidth=1;c.setLineDash([3,6]);c.strokeRect(L.x0,L.y0,L.x1-L.x0,L.y1-L.y0);c.setLineDash([]);
 // 토성(흙 성벽): 길 안쪽 둘레
 const ix=L.x0+lw/2+2,iy=L.y0+lw/2+2,iw=L.x1-L.x0-lw-4,ih=L.y1-L.y0-lw-4;
 c.fillStyle=night?'#5a4630':'#a07b4e';rr(c,ix,iy,iw,ih,10);c.fill();
 c.fillStyle=night?'#3b5236':'#7fa25a';rr(c,ix+3,iy+3,iw-6,ih-6,8);c.fill();
 c.strokeStyle=night?'rgba(0,0,0,.25)':'rgba(90,60,30,.3)';c.lineWidth=1;for(let k=1;k<3;k++){rr(c,ix+k*1.2,iy+k*1.2,iw-k*2.4,ih-k*2.4,9);c.stroke()}
 // 궁궐 마당(박석)
 const px=ix+10,py=iy+10,pw=iw-20,ph=ih-20;c.fillStyle=night?'#6d6656':'#d9cfb4';rr(c,px,py,pw,ph,6);c.fill();
 c.strokeStyle=night?'rgba(0,0,0,.18)':'rgba(120,105,80,.22)';c.lineWidth=.7;for(let y=py+9;y<py+ph;y+=9){c.beginPath();c.moveTo(px+2,y);c.lineTo(px+pw-2,y);c.stroke();for(let x=px+((y/9)%2?6:12);x<px+pw;x+=14){c.beginPath();c.moveTo(x,y-9);c.lineTo(x,y);c.stroke()}}
 // 성문 누각(위·아래·양옆 가운데)
 const gates=[[BW/2,iy+2,1],[BW/2,iy+ih-2,1],[ix+2,BH/2,0],[ix+iw-2,BH/2,0]];
 for(const [x,y,h] of gates){c.fillStyle=night?'#4a2a22':'#7a3a2c';if(h){c.fillRect(x-15,y-5,30,10)}else{c.fillRect(x-5,y-13,10,26)}c.save();c.translate(x,y);if(!h)c.rotate(Math.PI/2);roof(c,0,-9,34,13,night?'#262b2f':'#3e464a');c.restore();
  if(night){const g=c.createRadialGradient(x,y,0,x,y,22);g.addColorStop(0,'rgba(255,190,100,.45)');g.addColorStop(1,'rgba(255,190,100,0)');c.fillStyle=g;c.fillRect(x-22,y-22,44,44)}}
 // 병사 자리: 돌 기단
 for(let i=0;i<COLS*ROWS;i++){const x=GX+(i%COLS)*SLOT,y=GY+Math.floor(i/COLS)*SLOT;c.fillStyle='rgba(60,45,25,.22)';rr(c,x+4,y+6,SLOT-8,SLOT-8,8);c.fill();c.fillStyle=night?'#8a8270':'#e9e0c8';rr(c,x+4,y+4,SLOT-8,SLOT-8,8);c.fill();c.strokeStyle=night?'#a49a82':'#c8bb98';c.lineWidth=1.4;rr(c,x+7,y+7,SLOT-14,SLOT-14,6);c.stroke()}
 // 소나무 몇 그루(토성 위)
 for(const [x,y] of [[ix+12,iy+12],[ix+iw-12,iy+12],[ix+12,iy+ih-12],[ix+iw-12,iy+ih-12]]){c.fillStyle=night?'#1f3a28':'#3f6a3a';c.beginPath();c.arc(x,y,7,0,TAU);c.fill();c.fillStyle=night?'#2a4a32':'#55834b';c.beginPath();c.arc(x-2,y-2,4,0,TAU);c.fill()}
}

// ---------- 병사·인물·왕 ----------
const LOOK={
 archer:{robe:'#6b8a5a',hat:'helmet',w:'bow'},spear:{robe:'#8a5a4a',hat:'helmet',w:'spear'},sling:{robe:'#9a8a5a',hat:'band',w:'sling'},drum:{robe:'#7a4a6a',hat:'band',w:'drum'},
 crossbow:{robe:'#4a6a8a',hat:'helmet',w:'crossbow'},rider:{robe:'#5a7a9a',hat:'helmet',w:'bow',horse:true},monk:{robe:'#8a8478',hat:'bald',w:'staff'},hwarang:{robe:'#3f7fae',hat:'feather',w:'sword'},
 gukseon:{robe:'#2f5f9e',hat:'feather',w:'sword',cape:'#c94a4a'},gujin:{robe:'#5a4a3a',hat:'band',w:'crossbow',cape:'#8a6a3a'},general:{robe:'#7a2a2a',hat:'plume',w:'sword',cape:'#3a3a3a'},ilgwan:{robe:'#2f3f6a',hat:'gwan',w:'scroll',stars:true},
 yusin:{robe:'#7a1f1f',hat:'plume',w:'bigsword',cape:'#e0b040'},gwanchang:{robe:'#2f6fae',hat:'feather',w:'spear',cape:'#f0c040'},wonhyo:{robe:'#9a8460',hat:'bald',w:'gourd',halo:true},
 jinheung:{robe:'#6a1a3a',hat:'crown',w:'sword',cape:'#f0c040',aura:'#ffcf4a'},munmu:{robe:'#1a3a6a',hat:'crown',w:'none',cape:'#f0c040',aura:'#5ad0ff',dragon:true},seondeok:{robe:'#8a2a5a',hat:'qcrown',w:'none',cape:'#f0c040',aura:'#ff8ad0',stars:true}
};
export function drawUnit(c,id,x,y,size,t=0,opts={}){
 const u=UNITS[id],g=GRADES[u.g-1],L=LOOK[id],s=size/50;
 c.save();c.translate(x,y);c.scale(s,s);
 // 등급 받침
 if(u.g>=4){const k=1+.06*Math.sin(t*4);const gl=c.createRadialGradient(0,0,8,0,0,30*k);gl.addColorStop(0,L.aura?L.aura+'aa':g.color+'99');gl.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gl;c.fillRect(-32,-32,64,64)}
 const base=c.createRadialGradient(-6,-8,3,0,0,22);base.addColorStop(0,'#fffdf4');base.addColorStop(1,g.color);c.fillStyle=base;c.beginPath();c.arc(0,0,20,0,TAU);c.fill();
 c.lineWidth=u.g>=4?3.2:2.2;c.strokeStyle=u.g===5?'#fff1a8':'rgba(40,30,20,.55)';c.stroke();
 if(u.g===5){c.strokeStyle='#d23a2a';c.lineWidth=1.4;c.beginPath();c.arc(0,0,22.5,0,TAU);c.stroke()}
 if(L.dragon){c.strokeStyle='#3aa0d8';c.lineWidth=3;c.beginPath();for(let a=0;a<5.5;a+=.2){const R=16+2*Math.sin(a*3+t*3);c.lineTo(Math.cos(a+t)*R,Math.sin(a+t)*R)}c.stroke()}
 if(L.halo){c.strokeStyle='#ffe28a';c.lineWidth=2;c.beginPath();c.arc(0,-9,9,0,TAU);c.stroke()}
 if(L.horse){c.fillStyle='#7a5a3a';c.beginPath();c.ellipse(0,11,13,5,0,0,TAU);c.fill();c.fillRect(9,4,4,7);c.fillStyle='#4a3a2a';c.fillRect(-10,13,2,5);c.fillRect(8,13,2,5)}
 if(L.cape){c.fillStyle=L.cape;c.beginPath();c.moveTo(-8,-2);c.lineTo(-12,13);c.lineTo(12,13);c.lineTo(8,-2);c.fill()}
 // 몸·머리
 c.fillStyle=L.robe;c.beginPath();c.moveTo(-8,-2);c.quadraticCurveTo(-10,12,-9,14);c.lineTo(9,14);c.quadraticCurveTo(10,12,8,-2);c.closePath();c.fill();
 c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-1,-1,2,14);
 c.fillStyle='#f1c9a0';c.beginPath();c.arc(0,-8,6.5,0,TAU);c.fill();
 c.fillStyle='#2a1f1a';c.fillRect(-3,-9,1.6,1.6);c.fillRect(1.6,-9,1.6,1.6);
 // 모자·관
 const H=L.hat;
 if(H==='helmet'){c.fillStyle='#4a4e52';c.beginPath();c.arc(0,-10,7,Math.PI,0);c.fill();c.fillRect(-.8,-20,1.6,4)}
 else if(H==='band'){c.fillStyle='#2a2422';c.beginPath();c.arc(0,-11,6.8,Math.PI,0);c.fill();c.fillStyle='#c94a3a';c.fillRect(-7,-11,14,2)}
 else if(H==='bald'){c.fillStyle='#e8bf95';c.beginPath();c.arc(0,-10,6.6,Math.PI,0);c.fill()}
 else if(H==='feather'){c.fillStyle='#2a2422';c.beginPath();c.arc(0,-11,6.8,Math.PI,0);c.fill();c.strokeStyle='#e8e0c0';c.lineWidth=2;c.beginPath();c.moveTo(3,-15);c.quadraticCurveTo(9,-22,6,-26);c.stroke();c.fillStyle='#e05a7a';c.beginPath();c.arc(-3,-15,2,0,TAU);c.fill()}
 else if(H==='plume'){c.fillStyle='#5a5e62';c.beginPath();c.arc(0,-10,7.2,Math.PI,0);c.fill();c.fillStyle='#d23a2a';c.beginPath();c.moveTo(-2,-17);c.quadraticCurveTo(0,-27,5,-24);c.quadraticCurveTo(2,-20,2,-17);c.fill()}
 else if(H==='gwan'){c.fillStyle='#1a1a1a';c.fillRect(-6,-17,12,6);c.fillRect(-3,-21,6,4)}
 else if(H==='crown'||H==='qcrown'){
  if(H==='qcrown'){c.fillStyle='#1a1414';c.beginPath();c.arc(0,-9,7.5,Math.PI*.9,Math.PI*2.1);c.fill()}
  // 신라 금관: 띠 위에 出자 모양 세움장식과 사슴뿔 장식, 달랑거리는 곱은옥
  c.fillStyle='#f2c440';c.fillRect(-7.5,-14,15,3);
  for(const dx of[-5,0,5]){c.fillRect(dx-.9,-23,1.8,9);c.fillRect(dx-2.6,-20,5.2,1.4);c.fillRect(dx-2.6,-17,5.2,1.4)}
  c.fillStyle='#3fae6a';for(const dx of[-6,-2,2,6]){c.beginPath();c.arc(dx,-11,1.1,0,TAU);c.fill()}
  c.fillStyle='#fff6c0';for(const dx of[-5,0,5]){c.beginPath();c.arc(dx,-24,1.2,0,TAU);c.fill()}
 }
 // 무기
 const W=L.w;c.lineCap='round';
 if(W==='bow'){c.strokeStyle='#6b3a1a';c.lineWidth=2;c.beginPath();c.arc(10,2,9,-1.2,1.2);c.stroke();c.strokeStyle='#ddd';c.lineWidth=.7;c.beginPath();c.moveTo(13.3,-6.4);c.lineTo(13.3,10.4);c.stroke()}
 else if(W==='spear'){c.strokeStyle='#6b4a2a';c.lineWidth=1.8;c.beginPath();c.moveTo(11,14);c.lineTo(11,-20);c.stroke();c.fillStyle='#c8cdd0';c.beginPath();c.moveTo(11,-26);c.lineTo(13.5,-19);c.lineTo(8.5,-19);c.fill()}
 else if(W==='sling'){c.strokeStyle='#5a4a2a';c.lineWidth=1.4;c.beginPath();c.moveTo(9,0);c.quadraticCurveTo(16,-10,10,-14);c.stroke();c.fillStyle='#8a8a8a';c.beginPath();c.arc(10,-14,2.6,0,TAU);c.fill()}
 else if(W==='drum'){c.fillStyle='#a0402a';c.beginPath();c.ellipse(11,6,6,7,0,0,TAU);c.fill();c.fillStyle='#f0e0c0';c.beginPath();c.ellipse(11,6,3.5,5,0,0,TAU);c.fill();c.strokeStyle='#5a3a1a';c.lineWidth=1.6;c.beginPath();c.moveTo(-9,2);c.lineTo(-14,-6+Math.sin(t*8)*2);c.stroke()}
 else if(W==='crossbow'){c.strokeStyle='#5a3a1a';c.lineWidth=2.4;c.beginPath();c.moveTo(4,4);c.lineTo(17,-4);c.stroke();c.strokeStyle='#3a2a1a';c.lineWidth=1.8;c.beginPath();c.moveTo(11,-9);c.quadraticCurveTo(16,-1,17,3);c.stroke()}
 else if(W==='staff'){c.strokeStyle='#7a5a3a';c.lineWidth=2;c.beginPath();c.moveTo(11,14);c.lineTo(11,-18);c.stroke();c.fillStyle='#c9a64a';c.beginPath();c.arc(11,-19,2.6,0,TAU);c.fill()}
 else if(W==='sword'||W==='bigsword'){const L2=W==='bigsword'?24:18;c.strokeStyle='#d8dde0';c.lineWidth=W==='bigsword'?3:2;c.beginPath();c.moveTo(10,6);c.lineTo(10+L2*.35,6-L2);c.stroke();c.strokeStyle='#c9a64a';c.lineWidth=2;c.beginPath();c.moveTo(7,5);c.lineTo(13,7);c.stroke();if(W==='bigsword'){c.fillStyle='#f2c440';c.beginPath();c.arc(10,8,2.4,0,TAU);c.fill()}}
 else if(W==='scroll'){c.fillStyle='#efe2bc';c.fillRect(7,-2,9,11);c.fillStyle='#8a5a2a';c.fillRect(6,-3,11,2);c.fillRect(6,8,11,2)}
 else if(W==='gourd'){c.fillStyle='#c9a64a';c.beginPath();c.arc(11,6,4,0,TAU);c.arc(11,0,2.6,0,TAU);c.fill()}
 if(L.stars){c.fillStyle='#fff3a0';for(let i=0;i<3;i++){const a=t*1.5+i*2.1;c.beginPath();c.arc(Math.cos(a)*17,Math.sin(a)*17-2,1.5,0,TAU);c.fill()}}
 c.restore();
 if(opts.label){c.save();c.font='800 9px "Noto Sans KR",sans-serif';c.textAlign='center';const w=c.measureText(u.name).width+8;c.fillStyle=u.g===5?'#b8261c':'rgba(30,26,20,.78)';rr(c,x-w/2,y+size*.36,w,12,6);c.fill();c.fillStyle='#fff';c.fillText(u.name,x,y+size*.36+9);c.restore()}
}
// ---------- 침입군 ----------
export function drawFoe(c,e,t){
 const big=e.kind==='boss',s=big?1.9:e.kind==='shield'?1.15:1;c.save();c.translate(e.x,e.y+TOP);c.scale(s,s);
 const bob=Math.sin(t*10+e.id)*1;
 c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(0,7,7,2.5,0,0,TAU);c.fill();
 if(e.stun>0){c.fillStyle='#fff6a0';for(let i=0;i<3;i++){const a=t*6+i*2.1;c.beginPath();c.arc(Math.cos(a)*6,-12+Math.sin(a)*2,1.4,0,TAU);c.fill()}}
 c.fillStyle=e.kind==='scout'?'#4a3a5a':big?'#2a1a1a':'#5a2a26';c.beginPath();c.moveTo(-5,-2+bob);c.lineTo(-6,7);c.lineTo(6,7);c.lineTo(5,-2+bob);c.fill();
 c.fillStyle='#d9a882';c.beginPath();c.arc(0,-5+bob,4,0,TAU);c.fill();
 c.fillStyle=big?'#1a1a1a':'#3a3a3e';c.beginPath();c.arc(0,-6+bob,4.4,Math.PI,0);c.fill();
 if(big){c.fillStyle='#c03020';c.beginPath();c.moveTo(-4,-9);c.lineTo(-7,-15);c.lineTo(-2,-10);c.moveTo(4,-9);c.lineTo(7,-15);c.lineTo(2,-10);c.fill();c.strokeStyle='#5a3a1a';c.lineWidth=1;c.beginPath();c.moveTo(-8,8);c.lineTo(-8,-18);c.stroke();c.fillStyle='#8a1a1a';c.fillRect(-8,-18,7,5)}
 if(e.kind==='shield'){c.fillStyle='#6a4a2a';rr(c,3,-4,6,10,2);c.fill();c.strokeStyle='#3a2a1a';c.lineWidth=.8;c.stroke()}
 if(e.slowK>0||e.moat){c.fillStyle='rgba(90,180,230,.45)';c.beginPath();c.ellipse(0,6,8,3,0,0,TAU);c.fill()}
 c.restore();
 // 체력
 const w=big?34:16,x=e.x-w/2,y=e.y+TOP-(big?32:15);c.fillStyle='rgba(0,0,0,.55)';c.fillRect(x,y,w,3);c.fillStyle=big?'#ff5a3a':'#e8503a';c.fillRect(x,y,w*Math.max(0,e.hp/e.max),3);
}
export function drawUnitIcon(id,size=64){const cv=document.createElement('canvas');cv.width=cv.height=size*2;const c=cv.getContext('2d');c.scale(2,2);drawUnit(c,id,size/2,size/2-2,size*.9,0);return cv.toDataURL()}
