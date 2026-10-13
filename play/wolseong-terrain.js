// A playable interpretation of Wolseong's long crescent hill, viewed from the north.
// NRICH site plan: https://portal.nrich.go.kr/kor/page.do?menuIdx=1158
// This is a landscape sketch, not a measured archaeological reconstruction.
export const TERRAIN_VERSION = 2;
export const coord = (i,j) => ({x:100+i*25,y:260+j*16});
export const cellAt = (x,y) => ({i:Math.round((x-100)/25),j:Math.round((y-260)/16)});
const arc = u => Math.sqrt(Math.max(0,1-u*u));
const north = u => 260+205*arc(u)+8*Math.sin(u*3)*arc(u);
const south = u => 260+70*(1-u*u)+8*Math.sin(u*3)*arc(u);
const basins = [[-.98,-.64],[-.59,-.23],[-.18,.16],[.23,.59],[.64,.98]];
const waterY = u => north(u)+112;
export function zoneAt(i,j){
  if(!Number.isInteger(i)||!Number.isInteger(j)||i<0||i>32||j<0||j>24)return null;
  const p=coord(i,j),u=(p.x-500)/400;
  if(Math.abs(u)<.96&&p.y>south(u)+10&&p.y<north(u)-13)return 'hill';
  if(basins.some(([a,b])=>u>a+.016&&u<b-.016)&&Math.abs(p.y-waterY(u))<13)return 'moat';
  return null;
}
export function canPlace(p,id){const z=zoneAt(p.i,p.j);return z==='hill'||(z==='moat'&&id==='lotus')}
const cells=[];
for(let i=0;i<=32;i++)for(let j=0;j<=24;j++)if(zoneAt(i,j)==='hill')cells.push({i,j});
export function migratePieces(pieces,version){
  const used=new Set();let moved=0;
  const migrated=pieces.map(o=>{
    let desired={i:o.i,j:o.j};
    if(version!==TERRAIN_VERSION){
      const u=(o.i-o.j)/21,p=(o.i+o.j)/36;
      desired=cellAt(500+u*370,south(u)+18+p*Math.max(10,north(u)-south(u)-46));
    }
    let p=desired;
    if(!canPlace(p,o.id)||used.has(p.i+','+p.j))p=cells.filter(a=>!used.has(a.i+','+a.j)).sort((a,b)=>((a.i-desired.i)*25)**2+((a.j-desired.j)*16)**2-((b.i-desired.i)*25)**2-((b.j-desired.j)*16)**2)[0];
    if(!p)return null;
    used.add(p.i+','+p.j);
    if(p.i!==o.i||p.j!==o.j)moved++;
    return {...o,...p};
  }).filter(Boolean);
  return {pieces:migrated,moved};
}
function line(c,points,stroke,width=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=stroke;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke()}
function polygon(c,points,fill){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=fill;c.fill()}
function curve(fn,a=-1,b=1,n=80){return Array.from({length:n+1},(_,i)=>fn(a+(b-a)*i/n))}
const front=curve(u=>({x:500+400*u,y:north(u)}));
const rear=curve(u=>({x:500+400*u,y:south(u)}));
const outline=[...rear,...front.slice().reverse()];
function oval(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
export function drawTerrain(c,night,t){
  // The hill joins a continuous landscape: no floating square plinth.
  const ground=c.createLinearGradient(0,260,0,760);
  ground.addColorStop(0,night?'#3b6058':'#b4c899');ground.addColorStop(1,night?'#284d48':'#d6dfb6');
  c.fillStyle=ground;c.fillRect(-1200,290,3400,1700);
  polygon(c,[{x:-100,y:310},{x:35,y:257},{x:163,y:299},{x:265,y:237},{x:355,y:285},{x:480,y:243},{x:619,y:288},{x:737,y:252},{x:895,y:279},{x:1100,y:229},{x:1100,y:340},{x:-100,y:340}],night?'#3e6058':'#a5bea0');
  // Namcheon is on the south side, behind the hill from this north-facing viewpoint.
  const river=curve(u=>({x:500+640*u,y:240+31*Math.cos(u*2)+7*Math.sin(u*5)}));
  line(c,river,night?'#627b68':'#d6ceae',48);
  line(c,river,night?'#365f68':'#8cb5b1',36);
  line(c,river.map(p=>({x:p.x,y:p.y+8})),night?'#70989360':'#dce7d877',2);
  // Curving footpath and five separated moat pools below the northern earthwork.
  line(c,curve(u=>({x:500+425*u,y:north(u)+165})),night?'#5d6f5c':'#c2be91',20);
  line(c,curve(u=>({x:500+425*u,y:north(u)+165})),night?'#91a08140':'#e6dfb9',11);
  for(const [a,b] of basins){
    const center=curve(u=>({x:500+400*u,y:waterY(u)}),a,b,36);
    line(c,center,night?'#253d39':'#8b9877',47);
    line(c,center,night?'#7b8170':'#d0c6a4',40);
    line(c,center,night?'#295d66':'#6caaa9',30);
    line(c,center.map(p=>({x:p.x,y:p.y-6})),night?'#528681':'#9ac6b8',7);
    for(let k=2;k<34;k+=5){const p=center[k];line(c,[{x:p.x-5,y:p.y+2},{x:p.x+5,y:p.y+1}],night?'#c8d99c70':'#e9f0cf90',1.5)}
    // Small stones read as a bank, not a tall masonry castle wall.
    for(let k=1;k<35;k+=3){const p=center[k];oval(c,p.x,p.y+21,3.7,2,night?'#8a8f72':'#b2ad8d')}
  }
  // Sloped earthwork connects the raised plateau to the moat's ground level.
  const base=curve(u=>({x:500+428*u,y:north(u)+77}));
  const slope=c.createLinearGradient(0,300,0,551);
  slope.addColorStop(0,night?'#5c7752':'#9aaa72');slope.addColorStop(.6,night?'#4a6544':'#819b5e');slope.addColorStop(1,night?'#355246':'#a3b27a');
  polygon(c,[...front,...base.slice().reverse()],slope);
  for(let k=0;k<48;k++){
    const u=-.97+k*.041,top={x:500+400*u,y:north(u)};
    line(c,[{x:top.x+u*8,y:top.y+21},{x:top.x+u*22-3,y:top.y+61}],night?'#76906322':'#cfcc9235',1.7);
  }
  line(c,base,night?'#526c4b':'#9eae78',5);
  const grass=c.createLinearGradient(0,285,0,470);
  grass.addColorStop(0,night?'#66855d':'#c0d394');grass.addColorStop(1,night?'#527749':'#9dbf75');
  polygon(c,outline,grass);
  line(c,front,night?'#8fa67b':'#d1dda0',4);
  line(c,rear,night?'#799476':'#d0d9a2',3);
  c.save();c.beginPath();outline.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
  for(let k=0;k<210;k++){
    const x=90+(k*137)%827,y=300+(k*53)%170;
    oval(c,x,y,1.3,.6,night?'#afbd8330':'#ebefb777');
  }
  // A subtle footpath follows the inside of the earthwork.
  line(c,curve(u=>({x:500+378*u,y:north(u)-24}),-.96,.96),night?'#a5a78240':'#e3d6a272',8);
  c.restore();
  // An access path between pools; buildings remain freely placeable.
  line(c,[{x:568,y:440},{x:572,y:480},{x:579,y:524},{x:584,y:557},{x:587,y:616}],night?'#858b6c':'#cbbb91',13);
  line(c,[{x:568,y:440},{x:572,y:480},{x:579,y:524},{x:584,y:557},{x:587,y:616}],night?'#a5a08080':'#e0d2a8',5);
  for(let k=0;k<11;k++){
    const u=-.88+k*.173,p={x:500+432*u,y:north(u)+155};
    c.fillStyle=night?'#524e3b':'#847a54';c.fillRect(p.x-1.5,p.y-10,3,11);
    oval(c,p.x,p.y-12,3.2,4,night?'#ffe5a4':'#d7c794');
    if(night){const glow=c.createRadialGradient(p.x,p.y-9,1,p.x,p.y-9,33);glow.addColorStop(0,'#ffc76d65');glow.addColorStop(1,'#ffc76d00');oval(c,p.x,p.y-9,33,25,glow)}
  }
}
export function drawTerrainLabels(c,night){
  c.textAlign='center';c.font='500 17px sans-serif';c.fillStyle=night?'#c6d6c3':'#55745e';
  c.fillText('남쪽 · 남천',500,222);
  c.fillText('북쪽 · 언덕 아래 해자',500,659);
  c.font='600 14px sans-serif';c.fillStyle=night?'#adc0a9':'#749174';
  c.fillText('반달 언덕 위에 만드는 나만의 월성',500,688);
}
