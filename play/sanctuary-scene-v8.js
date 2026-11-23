import * as T from './vendor/three-full-r169.js';
import {OrbitControls} from './vendor/OrbitControls-r169.js';
import {colors} from './ui.js';
// Bulguksa-inspired sanctuary courtyard for the v8 metaverse experience.
// A stylised composition (Daeungjeon, Seokgatap, Dabotap, cloisters), not a measured reconstruction.

export const CUSHIONS=Array.from({length:10},(_,i)=>({x:-9+i*2,z:-15.2}));
export const CUSHION_ORDER=[4,5,3,6,2,7,1,8,0,9];
export const SPOTS={hall:{x:0,z:-12,label:'대웅전 앞'},seokgatap:{x:-11,z:-1.5,label:'석가탑'},dabotap:{x:11,z:-1.5,label:'다보탑'},lanterns:{x:0,z:11,label:'연등 줄'},gate:{x:0,z:27,label:'자하문'}};
const STRINGS=[{z:3,n:13},{z:10,n:14},{z:17,n:13}];
export const LANTERN_SLOTS=STRINGS.flatMap(s=>Array.from({length:s.n},(_,i)=>{const t=(i+1)/(s.n+1),x=-25+50*t;return{x,z:s.z,y:7.7-Math.sin(t*Math.PI)*1.6}}));
const OBSTACLES=[{x:-11,z:-6,r:4.4},{x:11,z:-6,r:4.4}];
const BOUND={minX:-29,maxX:29,minZ:-20.5,maxZ:31};
const DAY={sky:'#cfe2e6',fog:'#dce9e4',hemi:2.2,sun:2.6,ground:'#69876e'},NIGHT={sky:'#0b1428',fog:'#111c33',hemi:.3,sun:.08,ground:'#151c2a'};

function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}
function roofGeometry(W,D,H,lift=.9,seg=[30,18]){
 const g=new T.PlaneGeometry(W,D,seg[0],seg[1]);g.rotateX(-Math.PI/2);const p=g.attributes.position,hw=W/2,hd=D/2;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),ax=Math.min(1,Math.abs(x)/hw),az=Math.min(1,Math.abs(z)/hd),t=Math.max(0,Math.min(1,Math.min(hd-Math.abs(z),hw-Math.abs(x))/hd));
  const curve=Math.pow(t,1.55),corner=Math.pow(ax,7)*Math.pow(az,7)*lift,edge=Math.pow(Math.max(ax,az),14)*lift*.22;p.setY(i,H*curve+corner+edge)}
 g.computeVertexNormals();return g}

export function createSanctuaryScene(canvas,{onTap}={}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(DAY.sky);scene.fog=new T.Fog(DAY.fog,90,230);
 const camera=new T.PerspectiveCamera(46,1,.3,600);camera.position.set(0,13,48);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=6;controls.maxDistance=85;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI*.4;controls.enablePan=false;controls.target.set(0,1.4,26);
 const hemi=new T.HemisphereLight('#fff3dc',DAY.ground,DAY.hemi),sun=new T.DirectionalLight('#ffeccc',DAY.sun);sun.position.set(-30,55,28);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:5,far:140});sun.shadow.bias=-.0005;scene.add(hemi,sun);
 const moon=new T.DirectionalLight('#8fa8ff',0);moon.position.set(25,40,-20);scene.add(moon);
 const mats=new Map();const mat=(c,o={})=>{const k=c+JSON.stringify(o);if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,roughness:.82,...o}));return mats.get(k)};
 const shadowy=m=>{m.castShadow=true;m.receiveShadow=true;return m};
 function box(parent,w,h,d,x,y,z,c,o){const m=shadowy(new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='string'?mat(c,o):c));m.position.set(x,y,z);parent.add(m);return m}
 function cyl(parent,rt,rb,h,x,y,z,c,seg=14,o){const m=shadowy(new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg),typeof c==='string'?mat(c,o):c));m.position.set(x,y,z);parent.add(m);return m}
 const glowMats=[];

 // ---------- ground ----------
 const stoneTex=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#d8ccb0';c.fillRect(0,0,w,h);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const s=200+((x*7+y*13)%5)*6;c.fillStyle=`rgb(${s+18},${s+6},${s-22})`;c.fillRect(x*64+2,y*64+2,60,60)}c.globalAlpha=.08;for(let i=0;i<900;i++){c.fillStyle=i%2?'#000':'#fff';c.fillRect(Math.random()*w,Math.random()*h,2,2)}});stoneTex.wrapS=stoneTex.wrapT=T.RepeatWrapping;stoneTex.repeat.set(9,8);
 const grass=new T.Mesh(new T.CircleGeometry(260,48),mat('#8fae84'));grass.rotation.x=-Math.PI/2;grass.position.y=-.06;grass.receiveShadow=true;scene.add(grass);
 const yard=new T.Mesh(new T.PlaneGeometry(64,58),new T.MeshStandardMaterial({map:stoneTex,roughness:.95}));yard.rotation.x=-Math.PI/2;yard.position.set(0,0,5);yard.receiveShadow=true;scene.add(yard);
 box(scene,6,.06,58,0,.03,5,'#e6dcc4');// central path
 const pickable=[yard,grass];

 // ---------- buildings ----------
 const tileTex=canvasTex(256,64,(c,w,h)=>{c.fillStyle='#4c565c';c.fillRect(0,0,w,h);for(let i=0;i<32;i++){c.fillStyle=i%2?'#5b676d':'#3f484d';c.fillRect(i*8,0,5,h)}});tileTex.wrapS=tileTex.wrapT=T.RepeatWrapping;
 const latticeTex=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#e9d7ae';c.fillRect(0,0,w,h);c.strokeStyle='#9b5a3c';c.lineWidth=4;c.strokeRect(2,2,w-4,h-4);c.lineWidth=2;for(let i=1;i<6;i++){c.beginPath();c.moveTo(i*w/6,0);c.lineTo(i*w/6,h);c.moveTo(0,i*h/6);c.lineTo(w,i*h/6);c.stroke()}});
 const windowMat=new T.MeshStandardMaterial({map:latticeTex,roughness:.9,emissive:'#ffb257',emissiveIntensity:0});glowMats.push({m:windowMat,day:0,night:1.1});
 function hall({w,d,x,z,rot=0,colH=3.6,roofH=3.2,base=1.1,walls='front',scale=1}){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;g.scale.setScalar(scale);scene.add(g);
  box(g,w+3,base,d+3,0,base/2,0,'#c9bfa8');box(g,w+3.4,.18,d+3.4,0,base,0,'#b9ae96');
  if(walls==='front'){for(let i=0;i<4;i++)box(g,5,base/4,1.2,0,base*(i+.5)/4,d/2+1.5+(4-i)*.55,'#c4b9a0')}
  const cols=Math.max(2,Math.round(w/3.4));const red=mat('#a8402f');
  for(let i=0;i<=cols;i++){const cx=-w/2+i*w/cols;for(const cz of[-d/2,d/2])cyl(g,.26,.3,colH,cx,base+colH/2,cz,red,10)}
  for(let i=0;i<=1;i++)for(let j=1;j<Math.round(d/3.4);j++)cyl(g,.26,.3,colH,i?w/2:-w/2,base+colH/2,-d/2+j*3.4,red,10);
  if(walls!=='open'){const back=box(g,w,colH,.25,0,base+colH/2,-d/2+.15,'#e7d9b8');back.castShadow=true}
  if(walls==='front'){for(let i=0;i<cols;i++){const p=new T.Mesh(new T.PlaneGeometry(w/cols-.45,colH-.6),windowMat);p.position.set(-w/2+(i+.5)*w/cols,base+(colH-.6)/2+.1,d/2-.05);g.add(p)}box(g,.25,colH,d,-w/2+.12,base+colH/2,0,'#e7d9b8');box(g,.25,colH,d,w/2-.12,base+colH/2,0,'#e7d9b8')}
  // bracket band (dancheong)
  box(g,w+.9,.55,d+.9,0,base+colH+.25,0,'#3f7f6c');box(g,w+1.1,.18,d+1.1,0,base+colH+.6,0,'#b5473a');
  const roofMat=new T.MeshStandardMaterial({map:tileTex.clone(),roughness:.7,side:T.DoubleSide});roofMat.map.repeat.set(w/2.2,1);roofMat.map.needsUpdate=true;
  const roof=shadowy(new T.Mesh(roofGeometry(w+5,d+4.5,roofH,1.1),roofMat));roof.position.y=base+colH+.62;g.add(roof);
  box(g,w*.55,.42,.5,0,base+colH+.62+roofH+.05,0,'#3c4549');
  return g}
 const daeung=hall({w:22,d:10,x:0,z:-28,colH:4.2,roofH:3.9});
 // name board
 const board=canvasTex(256,96,(c,w,h)=>{c.fillStyle='#2c3b52';c.fillRect(0,0,w,h);c.strokeStyle='#d3a94a';c.lineWidth=6;c.strokeRect(5,5,w-10,h-10);c.fillStyle='#f3d27a';c.font='700 54px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('大雄殿',w/2,h/2+3)});
 const bm=new T.Mesh(new T.PlaneGeometry(3.2,1.2),new T.MeshBasicMaterial({map:board}));bm.position.set(0,1.1+4.2+.1,-28+5+.48);scene.add(bm);
 for(let i=0;i<5;i++){hall({w:9.6,d:4.2,x:-36,z:-22+i*11,rot:Math.PI/2,colH:3,roofH:2,walls:'back'});hall({w:9.6,d:4.2,x:36,z:-22+i*11,rot:-Math.PI/2,colH:3,roofH:2,walls:'back'})}
 hall({w:9,d:5,x:0,z:36,rot:Math.PI,colH:3.2,roofH:2.6,walls:'open'});// Jahamun gate
 for(const sx of[-1,1])hall({w:14,d:4.2,x:sx*14,z:36,rot:Math.PI,colH:2.8,roofH:2,walls:'back'});
 for(const sx of[-1,1])hall({w:12,d:4.2,x:sx*20,z:-30,colH:2.8,roofH:2,walls:'back'});
 // front stone stairs / platform toward the gate (Cheongungyo-inspired)
 box(scene,10,.8,4,0,.4,40.5,'#c9bfa8');

 // ---------- pagodas ----------
 const stone=mat('#cbc5b2'),stone2=mat('#d9d3c0');
 function slab(parent,s,y,h=.4,lift=.35){const r=shadowy(new T.Mesh(roofGeometry(s,s,h,lift,[10,10]),stone2));r.position.y=y;parent.add(r);box(parent,s*.82,.22,s*.82,0,y-.1,0,stone)}
 function finial(parent,y,h=2.4){cyl(parent,.09,.12,h,0,y+h/2,0,'#8a8270',8);for(let i=0;i<4;i++)cyl(parent,.32-i*.04,.32-i*.04,.12,0,y+.5+i*.38,0,'#9d9480',10);const b=new T.Mesh(new T.SphereGeometry(.24,12,8),stone);b.position.y=y+h;parent.add(b)}
 const seokga=new T.Group();seokga.position.set(-11,0,-6);scene.add(seokga);
 box(seokga,6.4,.7,6.4,0,.35,0,stone);box(seokga,5,1.4,5,0,1.4,0,stone);box(seokga,5.6,.3,5.6,0,2.25,0,stone2);box(seokga,4.2,1.3,4.2,0,3.05,0,stone);box(seokga,4.8,.3,4.8,0,3.85,0,stone2);
 let sy=4;[[2.6,2.2],[2.1,1.1],[1.8,1]].forEach(([s,h],i)=>{box(seokga,s,h,s,0,sy+h/2,0,stone);sy+=h;slab(seokga,s*1.95-i*.2,sy+.18);sy+=.55});finial(seokga,sy);
 const dabo=new T.Group();dabo.position.set(11,0,-6);scene.add(dabo);
 box(dabo,6.6,1.1,6.6,0,.55,0,stone);for(const[dx,dz,ry]of[[0,3.6,0],[0,-3.6,0],[3.6,0,1],[-3.6,0,1]]){const st=box(dabo,ry?1.2:2,.5,ry?2:1.2,dx,.25,dz,stone2)}
 for(const sx of[-1.9,1.9])for(const sz of[-1.9,1.9])box(dabo,.45,2.4,.45,sx,2.3,sz,stone);box(dabo,.8,2.4,.8,0,2.3,0,stone);
 box(dabo,5.4,.5,5.4,0,3.75,0,stone2);box(dabo,4.3,.35,4.3,0,4.2,0,stone);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const r=box(dabo,3.5,.12,.12,Math.sin(a)*1.75,4.95,Math.cos(a)*1.75,stone2);r.rotation.y=a+Math.PI/2;for(let k=0;k<5;k++)box(dabo,.12,.6,.12,Math.sin(a)*1.75+Math.cos(a)*(k-2)*.85,4.65,Math.cos(a)*1.75-Math.sin(a)*(k-2)*.85,stone)}
 cyl(dabo,1.25,1.35,1.5,0,5.1,0,stone,8);cyl(dabo,1.7,1.25,.35,0,6,0,stone2,8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(dabo,.12,.12,1.2,Math.sin(a)*1.35,6.75,Math.cos(a)*1.35,stone,6)}
 cyl(dabo,1.05,1.1,1.2,0,6.75,0,stone,8);cyl(dabo,1.9,1.1,.32,0,7.5,0,stone2,8);cyl(dabo,.8,.9,.8,0,8.05,0,stone,16);
 const lotusCap=cyl(dabo,1.6,.6,.45,0,8.65,0,stone2,16);const octRoof=shadowy(new T.Mesh(new T.ConeGeometry(2.3,1.1,8),stone2));octRoof.position.y=9.35;dabo.add(octRoof);finial(dabo,9.8,2.2);
 // stone lantern in front of the hall
 const sl=new T.Group();sl.position.set(0,0,-19.5);scene.add(sl);cyl(sl,.7,.8,.4,0,.2,0,stone,8);cyl(sl,.18,.22,1.6,0,1.2,0,stone,8);cyl(sl,.65,.4,.3,0,2.1,0,stone,8);
 const fireMat=new T.MeshStandardMaterial({color:'#efe0c0',emissive:'#ffad4a',emissiveIntensity:.1});glowMats.push({m:fireMat,day:.1,night:2.4});cyl(sl,.45,.45,.75,0,2.62,0,fireMat,8);const slr=new T.Mesh(new T.ConeGeometry(.9,.6,8),stone);slr.position.y=3.3;sl.add(slr);
 // cushions
 const cushionMat=mat('#8d3a3a'),cushionEdge=mat('#d2a24c');
 CUSHIONS.forEach(c=>{const m=shadowy(new T.Mesh(new T.CylinderGeometry(.7,.75,.22,20),cushionMat));m.position.set(c.x,.11,c.z);m.scale.z=.85;scene.add(m);const r=new T.Mesh(new T.TorusGeometry(.55,.04,6,24),cushionEdge);r.rotation.x=Math.PI/2;r.scale.y=.85;r.position.set(c.x,.23,c.z);scene.add(r)});

 // ---------- surroundings ----------
 const pineDark=mat('#3f6a48'),pineMid=mat('#4f7f55'),trunk=mat('#6d4b33');
 function pine(x,z,s=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);g.rotation.y=(x*z)%6;scene.add(g);const t=cyl(g,.22,.38,4.2,0,2.1,0,trunk,7);t.rotation.z=.1;[[1.9,4.4],[1.5,5.4],[1.1,6.3]].forEach(([r,y],i)=>{const m=shadowy(new T.Mesh(new T.SphereGeometry(r,9,6),i%2?pineMid:pineDark));m.scale.y=.5;m.position.set(.25*i,y,0);g.add(m)})}
 for(let i=0;i<34;i++){const a=i/34*Math.PI*2,r=58+((i*37)%17);pine(Math.cos(a)*r,Math.sin(a)*r-6,1.2+((i*13)%7)/10)}
 [[-24,-41],[24,-41],[-8,-42],[9,-43],[-44,40],[44,40],[-30,47],[30,47]].forEach(([x,z],i)=>pine(x,z,1.3+i%3*.2));
 const mtn=[mat('#9bb59c'),mat('#86a58a'),mat('#a9c0a6')];
 [[-70,-120,46,40],[-20,-135,60,52],[40,-125,50,44],[95,-100,40,34],[-110,-85,38,30],[0,-160,80,64]].forEach(([x,z,r,h],i)=>{const m=new T.Mesh(new T.ConeGeometry(r,h,7),mtn[i%3]);m.position.set(x,h/2-3,z);scene.add(m)});
 const starPos=[];for(let i=0;i<300;i++){const a=Math.random()*Math.PI*2,e=Math.random()*.9+.08,r=240;starPos.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r)}
 const stars=new T.Points(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(starPos,3)),new T.PointsMaterial({color:'#fff7dd',size:1.3,transparent:true,opacity:0,fog:false}));scene.add(stars);

 // ---------- lantern strings ----------
 const glowTex=canvasTex(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,235,190,1)');g.addColorStop(.25,'rgba(255,190,110,.55)');g.addColorStop(1,'rgba(255,160,80,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
 const lineMat=new T.LineBasicMaterial({color:'#5a4a3a'});
 STRINGS.forEach(s=>{for(const sx of[-1,1])cyl(scene,.14,.18,9,sx*25,4.5,s.z,'#6f5640',8);const pts=[];for(let i=0;i<=30;i++){const t=i/30;pts.push(-25+50*t,7.7-Math.sin(t*Math.PI)*1.6+.55,s.z)}const l=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(pts.flatMap((v,i,a)=>i%3===0&&i<a.length-3?[a[i],a[i+1],a[i+2],a[i+3],a[i+4],a[i+5]]:[]),3)),lineMat);scene.add(l)});
 const petalGeo=new T.SphereGeometry(.17,10,8);petalGeo.scale(1,1.7,.55);petalGeo.translate(0,.2,0);const coreGeo=new T.SphereGeometry(.42,16,12),leafGeo=new T.TorusGeometry(.36,.09,6,14),tagGeo=new T.PlaneGeometry(.28,.62);
 const tagMat=new T.MeshStandardMaterial({color:'#fbf3dc',side:T.DoubleSide,roughness:1});
 const newLanternMat=()=>new T.MeshStandardMaterial({color:'#f6efe0',roughness:.55,emissive:'#f6efe0',emissiveIntensity:0,transparent:true});
 const slots=LANTERN_SLOTS.map((p,i)=>{const g=new T.Group();g.position.set(p.x,p.y,p.z);g.userData={slot:i,phase:i*.7};scene.add(g);const string=new T.Mesh(new T.CylinderGeometry(.012,.012,.55,4),mat('#5a4a3a'));string.position.y=.28;g.add(string);const body=new T.Group();g.add(body);
  const lm=newLanternMat(),pm2=newLanternMat();const core=new T.Mesh(coreGeo,lm);core.scale.y=.85;core.userData.slot=i;body.add(core);const petals=[];for(let k=0;k<10;k++){const pm=new T.Mesh(petalGeo,pm2);const a=k/10*Math.PI*2;pm.position.set(Math.cos(a)*.28,-.12,Math.sin(a)*.28);pm.rotation.set(Math.sin(a)*.75,0,-Math.cos(a)*.75);pm.userData.slot=i;body.add(pm);petals.push(pm)}
  const leaf=new T.Mesh(leafGeo,mat('#4f8a55'));leaf.rotation.x=Math.PI/2;leaf.position.y=-.32;body.add(leaf);const tag=new T.Mesh(tagGeo,tagMat);tag.position.set(0,-.92,0);tag.visible=false;tag.userData.slot=i;body.add(tag);
  const glow=new T.Sprite(new T.SpriteMaterial({map:glowTex,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,fog:false}));glow.scale.set(3.4,3.4,1);glow.position.y=-.05;body.add(glow);
  const ring=new T.Mesh(new T.TorusGeometry(.62,.05,6,24),new T.MeshBasicMaterial({color:'#ffd56b'}));ring.rotation.x=Math.PI/2;ring.position.y=-.1;ring.visible=false;body.add(ring);
  pickable.push(core,...petals,tag);return{g,body,core,petals,tag,glow,ring,lm,pm:pm2,lit:false,fade:1,wish:null,hang:0}});

 // ---------- avatars ----------
 const skin=mat('#f2cfaf'),cheek=mat('#ef9f93'),eye=new T.MeshBasicMaterial({color:'#2a2220'}),hair=mat('#2b2522');
 const capsule=(r,l)=>{const g=new T.CapsuleGeometry(r,l,4,8);g.translate(0,-l/2-r,0);return g};
 function labelSprite(text,mine){const tex=canvasTex(320,84,(c,w,h)=>{c.font='700 34px "Noto Sans KR",sans-serif';const tw=Math.min(w-20,c.measureText(text).width+40);c.fillStyle=mine?'rgba(124,48,54,.92)':'rgba(255,252,240,.9)';const x=(w-tw)/2;c.beginPath();c.roundRect(x,10,tw,62,31);c.fill();c.fillStyle=mine?'#fff':'#2a3a30';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,43,w-40)});const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(2.6,.68,1);s.renderOrder=5;return s}
 function makeAvatar({kind='monk',color='coral',name='',mine=false}){
  const root=new T.Group(),body=new T.Group(),hips=new T.Group();root.add(body);body.add(hips);hips.position.y=.62;
  const robeColor=kind==='monk'?'#8e8a80':(colors[color]||'#ed8e74'),robe=mat(robeColor),pants=mat(kind==='monk'?'#6f6b62':'#4b5560');
  const legs=[-1,1].map(s=>{const l=new T.Group();l.position.set(s*.13,0,0);const m=shadowy(new T.Mesh(capsule(.1,.36),pants));l.add(m);const shoe=new T.Mesh(new T.SphereGeometry(.12,8,6),mat(kind==='monk'?'#ece6d6':'#3b3530'));shoe.scale.set(1,.6,1.5);shoe.position.set(0,-.58,.05);l.add(shoe);hips.add(l);return l});
  const torso=new T.Group();hips.add(torso);const r=shadowy(new T.Mesh(new T.CylinderGeometry(.26,.42,.82,14),robe));r.position.y=.36;torso.add(r);
  if(kind==='monk'){const sash=new T.Mesh(new T.BoxGeometry(.1,.86,.5),mat('#a0633b'));sash.position.set(.06,.38,.02);sash.rotation.z=-.5;torso.add(sash)}else{const collar=new T.Mesh(new T.TorusGeometry(.2,.05,6,14),mat('#f6efe0'));collar.rotation.x=Math.PI/2;collar.position.y=.76;torso.add(collar)}
  const head=new T.Group();head.position.y=1.12;torso.add(head);const hm=shadowy(new T.Mesh(new T.SphereGeometry(.4,20,16),skin));head.add(hm);
  for(const s of[-1,1]){const e=new T.Mesh(new T.SphereGeometry(.045,8,6),eye);e.position.set(s*.14,.02,.37);head.add(e);const ck=new T.Mesh(new T.SphereGeometry(.06,8,6),cheek);ck.position.set(s*.21,-.1,.32);ck.scale.z=.4;head.add(ck);const ear=new T.Mesh(new T.SphereGeometry(.08,8,6),skin);ear.position.set(s*.39,0,0);head.add(ear)}
  if(kind==='monk'){const shade=new T.Mesh(new T.SphereGeometry(.405,20,12,0,Math.PI*2,0,Math.PI*.42),mat('#d9b89c'));shade.rotation.x=-.25;head.add(shade)}
  else{const hr=new T.Mesh(new T.SphereGeometry(.42,20,12,0,Math.PI*2,0,Math.PI*.5),hair);hr.rotation.x=-.35;head.add(hr);const brim=new T.Mesh(new T.CylinderGeometry(.62,.62,.05,20),mat('#f1e3bf'));brim.position.y=.3;brim.rotation.x=-.12;head.add(brim);const crown=new T.Mesh(new T.CylinderGeometry(.33,.38,.28,16),mat('#f1e3bf'));crown.position.y=.44;crown.rotation.x=-.12;head.add(crown);const band=new T.Mesh(new T.CylinderGeometry(.385,.385,.08,16),mat(colors[color]||'#ed8e74'));band.position.y=.36;band.rotation.x=-.12;head.add(band)}
  const arms=[-1,1].map(s=>{const a=new T.Group();a.position.set(s*.3,.7,0);const m=shadowy(new T.Mesh(capsule(.075,.38),robe));a.add(m);const hand=new T.Mesh(new T.SphereGeometry(.09,8,6),skin);hand.position.y=-.58;a.add(hand);torso.add(a);return a});
  const label=labelSprite(name,mine);label.position.y=2.35;root.add(label);
  const shadow=new T.Mesh(new T.CircleGeometry(.5,16),new T.MeshBasicMaterial({color:'#000',transparent:true,opacity:.16,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;root.add(shadow);
  const ring=new T.Mesh(new T.RingGeometry(.55,.68,24),new T.MeshBasicMaterial({color:'#ffd56b',transparent:true,opacity:mine?.85:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;root.add(ring);
  root.traverse(o=>{if(o.isMesh)o.userData.avatar=true});
  const av={root,kind,color,name,mine,pos:new T.Vector3(0,0,26),target:null,facing:Math.PI,pose:'stand',poseT:0,walkT:0,bowQueue:0,emote:null,setLabel(n){root.remove(label);const l=labelSprite(n,mine);l.position.y=2.35;root.add(l)},
   legs,arms,torso,hips,head,body,dispose(){scene.remove(root)}};
  root.position.copy(av.pos);scene.add(root);return av}
 const lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,seg=(p,a,b)=>Math.max(0,Math.min(1,(p-a)/(b-a)));
 function poseAvatar(av,dt){
  const moving=!!av.target;let L=[0,0],LZ=[0,0],A=[0,0],AZ=[-.12,.12],torsoX=0,drop=0,bob=0,headX=0;
  if(moving){av.walkT+=dt*9;const s=Math.sin(av.walkT);L=[s*.6,-s*.6];A=[-s*.5,s*.5];bob=Math.abs(Math.cos(av.walkT))*.06}
  else if(av.pose==='hapjang'){A=[-1.25,-1.25];AZ=[.55,-.55];headX=.12}
  else if(av.pose==='sit'){drop=-.5;L=[-1.45,-1.45];LZ=[.55,-.55];A=[-.55,-.55];AZ=[.42,-.42];headX=.1}
  else if(av.pose==='bow'){const p=Math.min(1,av.poseT/1.9);const k=ease(seg(p,.12,.36))*(1-ease(seg(p,.78,1)));const down=ease(seg(p,.36,.55))*(1-ease(seg(p,.62,.82)));
   A=[lerp(-1.25,-2.7,down),lerp(-1.25,-2.7,down)];AZ=[lerp(.55,.15,down),lerp(-.55,-.15,down)];if(p<.12||p>.9){A=[-1.25,-1.25];AZ=[.55,-.55]}
   drop=-.42*k;L=[1.5*k,1.5*k];torsoX=1.15*down;headX=.15+.2*down;if(p>=1){av.onBowDone?.(av);if(av.bowQueue>0){av.bowQueue--;av.poseT=0}else if(av.pose==='bow'&&av.poseT>=1.9){av.pose='hapjang';av.poseT=0}}}
  const f=Math.min(1,dt*12);for(let i=0;i<2;i++){av.legs[i].rotation.x=lerp(av.legs[i].rotation.x,L[i],av.pose==='bow'?1:f);av.legs[i].rotation.z=lerp(av.legs[i].rotation.z,LZ[i],f);av.arms[i].rotation.x=lerp(av.arms[i].rotation.x,A[i],av.pose==='bow'?1:f);av.arms[i].rotation.z=lerp(av.arms[i].rotation.z,AZ[i],av.pose==='bow'?1:f)}
  av.torso.rotation.x=av.pose==='bow'?torsoX:lerp(av.torso.rotation.x,torsoX,f);av.head.rotation.x=lerp(av.head.rotation.x,headX,f);av.body.position.y=av.pose==='bow'?drop:lerp(av.body.position.y,drop+bob,f);
 }
 function stepAvatar(av,dt){
  if(av.target){const dx=av.target.x-av.pos.x,dz=av.target.z-av.pos.z,d=Math.hypot(dx,dz),sp=Math.max(7,d/2.2)*dt;if(d<.08){av.pos.x=av.target.x;av.pos.z=av.target.z;const cb=av.onArrive;av.target=null;av.onArrive=null;if(av.arriveFacing!=null)av.facing=av.arriveFacing;cb?.()}else{const m=Math.min(sp,d);av.pos.x+=dx/d*m;av.pos.z+=dz/d*m;av.facing=Math.atan2(dx,dz);for(const o of OBSTACLES){const ox=av.pos.x-o.x,oz=av.pos.z-o.z,od=Math.hypot(ox,oz);if(od<o.r){av.pos.x=o.x+ox/od*o.r;av.pos.z=o.z+oz/od*o.r}}}}
  av.poseT+=dt;let r=av.root.rotation.y,d=av.facing-r;d=Math.atan2(Math.sin(d),Math.cos(d));av.root.rotation.y=r+d*Math.min(1,dt*10);av.root.position.set(av.pos.x,0,av.pos.z);poseAvatar(av,dt);
  if(av.emote){av.emote.t+=dt;const e=av.emote;e.sprite.position.y=2.9+e.t*.5;e.sprite.material.opacity=Math.max(0,1-e.t/1.6);if(e.t>1.6){av.root.remove(e.sprite);av.emote=null}}
 }
 function emote(av,text){if(av.emote)av.root.remove(av.emote.sprite);const tex=canvasTex(160,96,(c,w,h)=>{c.font='800 46px "Noto Sans KR",sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineWidth=8;c.strokeStyle='rgba(60,40,30,.55)';c.strokeText(text,w/2,h/2);c.fillStyle='#fff3c9';c.fillText(text,w/2,h/2)});const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(1.6,.96,1);s.renderOrder=6;av.root.add(s);av.emote={sprite:s,t:0}}

 // ---------- night / lanterns ----------
 let night=false,nightK=0,me=null;const avatars=new Map();
 function setNight(v){night=!!v}
 function applyNight(k){const lerpC=(a,b)=>new T.Color(a).lerp(new T.Color(b),k);scene.background.copy(lerpC(DAY.sky,NIGHT.sky));scene.fog.color.copy(lerpC(DAY.fog,NIGHT.fog));hemi.intensity=lerp(DAY.hemi,NIGHT.hemi,k);hemi.groundColor.copy(lerpC(DAY.ground,NIGHT.ground));sun.intensity=lerp(DAY.sun,NIGHT.sun,k);moon.intensity=.55*k;stars.material.opacity=k;renderer.toneMappingExposure=lerp(1.05,1.25,k);
  glowMats.forEach(g=>g.m.emissiveIntensity=lerp(g.day,g.night,k));slots.forEach(s=>{const e=s.lit?lerp(.05,1.5,k):lerp(0,.3,k);s.lm.emissiveIntensity=e;s.pm.emissiveIntensity=e*.8});slots.forEach(s=>{s.glow.material.opacity=(s.wish?.95:.25)*k})}
 function setLanterns(list,{animateSlot}={}){const by=new Map(list.map(w=>[w.slot,w]));slots.forEach((s,i)=>{const w=by.get(i)||null;const changed=(s.wish?.text+s.wish?.color+s.wish?.mine)!==(w?.text+w?.color+w?.mine);s.wish=w;if(!changed)return;const c=w?colors[w.color]||'#ed8e74':'#f6efe0',pc=new T.Color(c).lerp(new T.Color('#ffffff'),w?.28:0);s.lm.color.set(c);s.lm.emissive.set(c);s.pm.color.copy(pc);s.pm.emissive.copy(pc);s.lit=!!w;s.tag.visible=!!w;s.ring.visible=!!w?.mine;s.body.scale.setScalar(w?1.12:.82);if(i===animateSlot)s.hang=1});applyNight(nightK)}

 // ---------- input ----------
 const ray=new T.Raycaster(),ndc=new T.Vector2();let down=null;
 canvas.addEventListener('pointerdown',e=>{if(e.isPrimary)down={x:e.clientX,y:e.clientY,t:performance.now(),moved:false}});
 canvas.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>9)down.moved=true});
 canvas.addEventListener('pointerup',e=>{if(!down||!e.isPrimary)return;const d=down;down=null;if(d.moved||performance.now()-d.t>650)return;const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
  const avHits=ray.intersectObjects([...avatars.values()].map(a=>a.root),true).filter(h=>h.object.userData.avatar);if(avHits.length){const av=[...avatars.values()].find(a=>{let o=avHits[0].object;while(o){if(o===a.root)return true;o=o.parent}return false});if(av){onTap?.({type:'avatar',avatar:av});return}}
  const hit=ray.intersectObjects(pickable,false)[0];if(!hit)return;if(hit.object.userData.slot!=null){onTap?.({type:'lantern',slot:hit.object.userData.slot,wish:slots[hit.object.userData.slot].wish});return}
  const x=Math.max(BOUND.minX,Math.min(BOUND.maxX,hit.point.x)),z=Math.max(BOUND.minZ,Math.min(BOUND.maxZ,hit.point.z));onTap?.({type:'ground',x,z,ripple:()=>ripple(x,z)})});
 const ripples=[];function ripple(x,z){const m=new T.Mesh(new T.RingGeometry(.3,.45,24),new T.MeshBasicMaterial({color:'#fff6d8',transparent:true,opacity:.9,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.05,z);scene.add(m);ripples.push({m,t:0})}

 // ---------- loop ----------
 let w=0,h=0,last=performance.now(),raf=0,follow=true;const prevTarget=new T.Vector3();
 function resize(){const r=canvas.getBoundingClientRect();if(r.width===w&&r.height===h)return;w=r.width;h=r.height;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.fov=w<h?58:46;camera.updateProjectionMatrix()}
 controls.addEventListener('start',()=>{});
 function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(.1,(now-last)/1000);last=now;resize();
  nightK+=((night?1:0)-nightK)*Math.min(1,dt*2.5);if(Math.abs(nightK-(night?1:0))>.002)applyNight(nightK);
  avatars.forEach(a=>stepAvatar(a,dt));
  const head=me?new T.Vector3(me.pos.x,1.5,me.pos.z):null,seg3=new T.Vector3(),wp=new T.Vector3();if(head)seg3.subVectors(head,camera.position);
  slots.forEach(s=>{if(head){s.g.getWorldPosition(wp);const t=Math.max(0,Math.min(1,wp.clone().sub(camera.position).dot(seg3)/seg3.lengthSq()));const d=wp.distanceTo(camera.position.clone().addScaledVector(seg3,t));const target=d<1.7&&t<.97?.15:1;s.fade+=(target-s.fade)*Math.min(1,dt*8);s.lm.opacity=s.pm.opacity=s.fade;s.lm.depthWrite=s.pm.depthWrite=s.fade>.9;s.tag.visible=!!s.wish&&s.fade>.5}s.body.rotation.z=Math.sin(now/1300+s.g.userData.phase)*.05;if(s.hang>0){s.hang=Math.max(0,s.hang-dt*.9);s.body.position.y=-s.hang*3;s.body.rotation.y=s.hang*6}});
  for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.t+=dt;r.m.scale.setScalar(1+r.t*3);r.m.material.opacity=Math.max(0,.9-r.t*1.4);if(r.t>.7){scene.remove(r.m);ripples.splice(i,1)}}
  if(me&&follow){const tgt=new T.Vector3(me.pos.x,1.4,me.pos.z);const delta=tgt.clone().sub(controls.target).multiplyScalar(Math.min(1,dt*4));controls.target.add(delta);camera.position.add(delta)}
  controls.update();renderer.render(scene,camera)}
 raf=requestAnimationFrame(frame);
 const api={
  scene,camera,controls,renderer,
  addAvatar(id,opts){const a=makeAvatar(opts);avatars.set(id,a);if(opts.mine)me=a;return a},
  removeAvatar(id){const a=avatars.get(id);if(!a)return;a.dispose();avatars.delete(id);if(a===me)me=null},
  avatar:id=>avatars.get(id),avatars,
  walk(av,x,z,{facing=null,onArrive=null}={}){av.target={x,z};av.arriveFacing=facing;av.onArrive=onArrive;if(av.pose!=='stand'){av.pose='stand';av.bowQueue=0}},
  place(av,x,z,facing=Math.PI){av.pos.set(x,0,z);av.facing=facing;av.root.rotation.y=facing;av.root.position.set(x,0,z)},
  setPose(av,pose,{queue=0}={}){av.pose=pose;av.poseT=0;if(pose==='bow')av.bowQueue=queue},
  emote,setNight,setLanterns,ripple,
  isNight:()=>night,
  focus(x,z,dist=18){const off=new T.Vector3(0,.62,.78).setLength(dist);controls.target.set(x,1.4,z);camera.position.copy(controls.target).add(off)},
  overview(){follow=false;controls.target.set(0,2,0);camera.position.set(0,46,62);setTimeout(()=>follow=true,2500)},
  setFollow(v){follow=v},
  zoom(f){const off=camera.position.clone().sub(controls.target);off.multiplyScalar(f);const l=off.length();off.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,l)));camera.position.copy(controls.target).add(off)},
  snapshot(){renderer.render(scene,camera);return canvas},
  destroy(){cancelAnimationFrame(raf);controls.dispose();renderer.dispose()}
 };
 return api;
}
