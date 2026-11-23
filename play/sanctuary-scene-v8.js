import * as T from './vendor/three-full-r169.js';
import {OrbitControls} from './vendor/OrbitControls-r169.js';
import {GLTFLoader} from './vendor/GLTFLoader-r169.js';
import {DRACOLoader} from './vendor/DRACOLoader-r169.js';
import {RoomEnvironment} from './vendor/RoomEnvironment-r169.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils-r169.js';
import {colors} from './ui.js';
// 불국사 메타버스 소원마당 3D 공간 (v8 rev.2)
// 청운교·백운교 돌계단 → 자하문 → 석가탑·다보탑 마당 → 대웅전 법당 안까지 걸어 들어가는 단순화 모형. 실측 복원이 아님.
// 법당 불상(경주 불국사 금동아미타여래좌상)과 다보탑은 국가유산청 3D 데이터(공공누리 제1유형)를 가볍게 줄인 GLB를 불러온다.
// 범영루 법고, 좌경루 목어·운판, 석가탑과 건물은 직접 만든 단순화 모형이다.

export const HALL={w:26,d:16,front:-23,back:-39,floor:1.5,colH:5.4,roofH:4.8};
const TERR_Z=40,STAIR_END=54,LOW=-7,STAIR_HALF=3.6;
export const BOW_T=2.3;
export const CUSHIONS=Array.from({length:10},(_,i)=>({x:-6+(i%5)*3,z:i<5?-29.8:-27}));
export const CUSHION_ORDER=[2,1,3,0,4,7,6,8,5,9];
// 불전사물: 실제 불국사처럼 자하문 서쪽 범영루에 법고, 동쪽 좌경루에 목어와 운판을 둔다
export const INSTRUMENTS={drum:{x:-13.6,z:37.35,stand:{x:-13.6,z:35.95},label:'법고',place:'범영루'},fish:{x:11.35,z:37.35,stand:{x:11.35,z:36.05},label:'목어',place:'좌경루'},cloud:{x:15.85,z:37.35,stand:{x:15.85,z:36.15},label:'운판',place:'좌경루'}};
export const SPOTS={hall:{x:0,z:-25.6,label:'법당 안'},seokgatap:{x:-11,z:1.5,label:'석가탑'},dabotap:{x:11,z:2.6,label:'다보탑'},lanterns:{x:0,z:13,label:'연등 줄'},drum:{...INSTRUMENTS.drum.stand,label:'법고',inst:'drum'},fish:{...INSTRUMENTS.fish.stand,label:'목어',inst:'fish'},cloud:{...INSTRUMENTS.cloud.stand,label:'운판',inst:'cloud'},stairs:{x:0,z:60,label:'청운교 아래'}};
const STRINGS=[{z:6,n:13},{z:12.5,n:14},{z:19,n:13}];
export const LANTERN_SLOTS=STRINGS.flatMap(s=>Array.from({length:s.n},(_,i)=>{const t=(i+1)/(s.n+1);return{x:-25+50*t,z:s.z,y:8.3-Math.sin(t*Math.PI)*1.3}}));
const OBSTACLES=[{x:-11,z:-5,r:4.6},{x:11,z:-5,r:6},{x:0,z:-13,r:1.3}];
const REG={hall:{x:[-11.6,11.6],z:[-34.2,-24]},yard:{x:[-29.5,29.5],z:[-20,36.4]},stairs:{x:[-2,2],z:[37,53.8]},plaza:{x:[-34,34],z:[54.4,70]}};
const ORDER=['plaza','stairs','yard','hall'];
const LINKS=[[{x:0,z:54.2}],[{x:0,z:36.8}],[{x:0,z:-19.6},{x:0,z:-24.4}]];
const DAY={sky:'#cfe3ea',fog:'#dbe8e6',hemi:2.1,sun:2.7,ground:'#6c8a70'},NIGHT={sky:'#0b1428',fog:'#111c33',hemi:.42,sun:.08,ground:'#1a2233'};

export function heightAt(x,z){
 if(z<=-21&&z>=-41.2&&Math.abs(x)<=15)return HALL.floor;
 if(z>-21&&z<-18&&Math.abs(x)<=4.6)return HALL.floor*(1-(z+21)/3);
 if(z>TERR_Z){if(z>=STAIR_END||Math.abs(x)>STAIR_HALF)return LOW;return LOW*(z-TERR_Z)/(STAIR_END-TERR_Z)}
 return 0}
export function regionOf(x,z){
 if(z<HALL.front-.6&&z>HALL.back&&Math.abs(x)<HALL.w/2)return'hall';
 if(z>36.9){if(Math.abs(x)<=STAIR_HALF&&z<STAIR_END)return'stairs';return z>TERR_Z?'plaza':'yard'}
 return'yard'}
export function clampTo(x,z){const reg=regionOf(x,z),r=REG[reg];x=Math.max(r.x[0],Math.min(r.x[1],x));z=Math.max(r.z[0],Math.min(r.z[1],z));
 // 탑이나 석등 자리를 누르면 그 바로 앞까지만 간다
 if(reg==='yard')for(const o of OBSTACLES){let dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz);if(d<o.r+.15){if(d<.01){dx=0;dz=1;d=1}x=o.x+dx/d*(o.r+.15);z=o.z+dz/d*(o.r+.15)}}
 return{x,z}}
// 가는 길이 탑이나 석등을 지나면 옆으로 돌아가는 지점을 끼워 넣는다
function avoid(fx,fz,pts){const out=[];let ax=fx,az=fz;for(const p of pts){for(const o of OBSTACLES){const dx=p.x-ax,dz=p.z-az,L2=dx*dx+dz*dz;if(L2<.01)continue;const t=((o.x-ax)*dx+(o.z-az)*dz)/L2;if(t<=.02||t>=.98)continue;let nx=ax+dx*t-o.x,nz=az+dz*t-o.z,d=Math.hypot(nx,nz);if(d>=o.r+.3)continue;if(d<.05){const L=Math.sqrt(L2);nx=-dz/L;nz=dx/L;d=1}const w={x:o.x+nx/d*(o.r+.8),z:o.z+nz/d*(o.r+.8)};out.push(w);ax=w.x;az=w.z}out.push(p);ax=p.x;az=p.z}return out}
function route(fx,fz,tx,tz){const a=ORDER.indexOf(regionOf(fx,fz)),b=ORDER.indexOf(regionOf(tx,tz)),pts=[];
 if(a<b)for(let i=a;i<b;i++)pts.push(...LINKS[i]);else for(let i=a-1;i>=b;i--)pts.push(...[...LINKS[i]].reverse());
 // 이미 통로 위에 있으면 지나온 지점으로 되돌아가지 않는다
 while(pts.length>1){const p0=pts[0],p1=pts[1];if(Math.abs(fx-p0.x)<4.8&&Math.hypot(fx-p1.x,fz-p1.z)<Math.hypot(p0.x-p1.x,p0.z-p1.z))pts.shift();else break}
 pts.push({x:tx,z:tz});return avoid(fx,fz,pts)}

function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}
const rep=(t,x,y)=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(x,y);return t};
function roofY(x,z,hw,hd,H,lift){const ax=Math.min(1,Math.abs(x)/hw),az=Math.min(1,Math.abs(z)/hd),t=Math.max(0,Math.min(1,Math.min(hd-Math.abs(z),hw-Math.abs(x))/hd));
 return H*Math.pow(t,1.5)+Math.pow(ax,7)*Math.pow(az,7)*lift+Math.pow(Math.max(ax,az),14)*lift*.22}
function roofGeometry(W,D,H,lift=.9,seg=[30,18]){
 const g=new T.PlaneGeometry(W,D,seg[0],seg[1]);g.rotateX(-Math.PI/2);const p=g.attributes.position,hw=W/2,hd=D/2;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,roofY(x,z,hw,hd,H,lift))}
 g.computeVertexNormals();return g}

export function createSanctuaryScene(canvas,{onTap,onRegion}={}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(DAY.sky);scene.fog=new T.Fog(DAY.fog,110,260);
 const camera=new T.PerspectiveCamera(46,1,.3,700);camera.position.set(0,2,82);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=4.5;controls.maxDistance=95;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI*.435;controls.enablePan=false;controls.target.set(0,LOW+1.4,60);
 const hemi=new T.HemisphereLight('#fff3dc',DAY.ground,DAY.hemi),sun=new T.DirectionalLight('#ffeccc',DAY.sun);sun.position.set(-38,70,46);sun.target.position.set(0,0,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-62,right:62,top:70,bottom:-70,near:5,far:220});sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(hemi,sun,sun.target);
 const moon=new T.DirectionalLight('#8fa8ff',0);moon.position.set(25,40,-20);scene.add(moon);
 const mats=new Map();const mat=(c,o={})=>{const k=c+JSON.stringify(o);if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,roughness:.82,...o}));return mats.get(k)};
 const shadowy=m=>{m.castShadow=true;m.receiveShadow=true;return m};
 const M=c=>typeof c==='string'?mat(c):c;
 function box(parent,w,h,d,x,y,z,c){const m=shadowy(new T.Mesh(new T.BoxGeometry(w,h,d),M(c)));m.position.set(x,y,z);parent.add(m);return m}
 function cyl(parent,rt,rb,h,x,y,z,c,seg=14){const m=shadowy(new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg),M(c)));m.position.set(x,y,z);parent.add(m);return m}
 function ball(parent,r,x,y,z,c,sx=1,sy=1,sz=1,seg=14){const m=shadowy(new T.Mesh(new T.SphereGeometry(r,seg,Math.max(6,seg-4)),M(c)));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m}
 function plane(parent,w,h,x,y,z,material,ry=0,rx=0){const m=new T.Mesh(new T.PlaneGeometry(w,h),material);m.position.set(x,y,z);m.rotation.set(rx,ry,0);m.receiveShadow=true;parent.add(m);return m}
 const glowMats=[],pickable=[];
 let api=null,env=null;try{env=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture}catch(e){console.warn(e)}
 const gltfLoader=new GLTFLoader();{const d=new DRACOLoader();d.setDecoderPath('./vendor/draco/');d.setDecoderConfig({type:'wasm'});gltfLoader.setDRACOLoader(d)}

 // ---------- textures ----------
 const noise=(c,w,h,a=.07,n=900)=>{c.globalAlpha=a;for(let i=0;i<n;i++){c.fillStyle=i%2?'#000':'#fff';c.fillRect(Math.random()*w,Math.random()*h,2,2)}c.globalAlpha=1};
 const stoneTex=rep(canvasTex(512,512,(c,w,h)=>{c.fillStyle='#d6cab0';c.fillRect(0,0,w,h);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const s=198+((x*7+y*13)%5)*6;c.fillStyle=`rgb(${s+18},${s+6},${s-22})`;c.fillRect(x*64+2,y*64+2,60,60)}noise(c,w,h)}),9,8.5);
 const tileTex=canvasTex(256,64,(c,w,h)=>{c.fillStyle='#474f55';c.fillRect(0,0,w,h);for(let i=0;i<32;i++){c.fillStyle=i%2?'#59646a':'#3b4348';c.fillRect(i*8,0,5,h)}c.fillStyle='rgba(0,0,0,.18)';for(let y=0;y<h;y+=16)c.fillRect(0,y,w,2)});tileTex.wrapS=tileTex.wrapT=T.RepeatWrapping;
 const latticeTex=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#ead9b2';c.fillRect(0,0,w,h);c.strokeStyle='#8c4a34';c.lineWidth=5;c.strokeRect(3,3,w-6,h-6);c.lineWidth=2;for(let i=1;i<8;i++){c.beginPath();c.moveTo(i*w/8,0);c.lineTo(i*w/8,h);c.moveTo(0,i*h/8);c.lineTo(w,i*h/8);c.stroke()}c.fillStyle='#8c4a34';c.fillRect(0,h*.78,w,h*.22);c.strokeStyle='#5d2f22';c.strokeRect(8,h*.8,w-16,h*.16)});
 const dancheongTex=canvasTex(256,64,(c,w,h)=>{c.fillStyle='#2f7361';c.fillRect(0,0,w,h);c.fillStyle='#b8402f';c.fillRect(0,0,w,9);c.fillRect(0,h-9,w,9);c.fillStyle='#e8c35a';c.fillRect(0,9,w,3);c.fillRect(0,h-12,w,3);for(let i=0;i<4;i++){const x=i*64+32;[['#1f4f8a',22],['#f1ede0',17],['#d9534a',12],['#f0c74e',6]].forEach(([col,r])=>{c.fillStyle=col;c.beginPath();c.arc(x,h/2,r,0,Math.PI*2);c.fill()});c.fillStyle='#f1ede0';c.fillRect(i*64-1,14,3,h-28)}});dancheongTex.wrapS=dancheongTex.wrapT=T.RepeatWrapping;
 const woodTex=rep(canvasTex(256,256,(c,w,h)=>{for(let i=0;i<8;i++){const s=((i*37)%5)*5;c.fillStyle=`rgb(${150+s},${108+s},${66+s})`;c.fillRect(0,i*32,w,32);c.fillStyle='rgba(60,35,15,.5)';c.fillRect(0,i*32,w,2);c.fillRect((i*71)%w,i*32,2,32)}noise(c,w,h,.05)}),5,3.2);
 const ceilTex=rep(canvasTex(128,128,(c,w,h)=>{c.fillStyle='#2c6a58';c.fillRect(0,0,w,h);c.strokeStyle='#a8392b';c.lineWidth=12;c.strokeRect(0,0,w,h);c.strokeStyle='#e7c15a';c.lineWidth=2;c.strokeRect(9,9,w-18,h-18);[['#f3efe2',34],['#e58a9a',27],['#f6d8dd',17],['#f0c64c',8]].forEach(([col,r])=>{c.fillStyle=col;c.beginPath();c.arc(w/2,h/2,r,0,Math.PI*2);c.fill()});c.strokeStyle='#b9475c';c.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(w/2+Math.cos(a)*9,h/2+Math.sin(a)*9);c.lineTo(w/2+Math.cos(a)*32,h/2+Math.sin(a)*32);c.stroke()}}),HALL.w/2.6,HALL.d/2.6);
 const wallTex=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#dcc99c';c.fillRect(0,0,w,h);noise(c,w,h,.05,500);c.fillStyle='#7c3a29';c.fillRect(0,h*.74,w,h*.26);c.fillStyle='#2f7361';c.fillRect(0,0,w,16);c.fillStyle='#b8402f';c.fillRect(0,16,w,6);c.strokeStyle='#5a2a1d';c.lineWidth=3;c.strokeRect(10,h*.77,w-20,h*.2)});
 const tangkaTex=canvasTex(1024,384,(c,w,h)=>{c.fillStyle='#8a2c22';c.fillRect(0,0,w,h);c.strokeStyle='#e2b94e';c.lineWidth=14;c.strokeRect(7,7,w-14,h-14);c.strokeStyle='#2f6f5c';c.lineWidth=6;c.strokeRect(22,22,w-44,h-44);
  const fig=(x,y,r,robe)=>{c.fillStyle='rgba(240,200,90,.9)';c.beginPath();c.arc(x,y,r*1.5,0,Math.PI*2);c.fill();c.fillStyle='#2f6f5c';c.beginPath();c.arc(x,y,r*1.22,0,Math.PI*2);c.fill();c.fillStyle=robe;c.beginPath();c.ellipse(x,y+r*1.9,r*1.25,r*1.5,0,0,Math.PI*2);c.fill();c.fillStyle='#f0d0a0';c.beginPath();c.arc(x,y,r*.85,0,Math.PI*2);c.fill();c.fillStyle='#26334f';c.beginPath();c.arc(x,y-r*.35,r*.82,Math.PI,0);c.fill()};
  for(let i=0;i<12;i++){fig(70+i*80.5,86,22,['#c9872e','#3b62a0','#b9463a'][i%3]);fig(110+i*74,250,26,['#3b62a0','#b9463a','#c9872e'][i%3])}
  c.fillStyle='rgba(138,44,34,.96)';c.beginPath();c.ellipse(w/2,h/2+10,150,170,0,0,Math.PI*2);c.fill();const g=c.createRadialGradient(w/2,h/2,10,w/2,h/2,150);g.addColorStop(0,'#f6dd8a');g.addColorStop(.55,'#d79a35');g.addColorStop(.6,'#2f6f5c');g.addColorStop(.72,'#e2b94e');g.addColorStop(1,'#b33c2c');c.fillStyle=g;c.beginPath();c.ellipse(w/2,h/2+6,128,150,0,0,Math.PI*2);c.fill()});
 const altarTex=rep(canvasTex(256,128,(c,w,h)=>{c.fillStyle='#9a3024';c.fillRect(0,0,w,h);c.strokeStyle='#e2b94e';c.lineWidth=5;c.strokeRect(6,6,w-12,h-12);for(let i=0;i<4;i++){const x=32+i*64;c.fillStyle='#2f6f5c';c.fillRect(x-24,22,48,h-44);[['#f1ede0',20],['#e58a9a',15],['#f0c64c',6]].forEach(([col,r])=>{c.fillStyle=col;c.beginPath();c.arc(x,h/2,r,0,Math.PI*2);c.fill()})}}),3,1);
 const terraceTex=rep(canvasTex(512,256,(c,w,h)=>{c.fillStyle='#b5ad99';c.fillRect(0,0,w,h);let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<70;i++){const x=rnd()*w,y=h*.52+rnd()*h*.48,rx=18+rnd()*26,ry=12+rnd()*16,s=150+rnd()*45|0;c.fillStyle=`rgb(${s+12},${s+6},${s-10})`;c.beginPath();c.ellipse(x,y,rx,ry,rnd(),0,Math.PI*2);c.fill();c.strokeStyle='rgba(60,55,45,.55)';c.lineWidth=2;c.stroke()}
  for(let i=0;i<8;i++){const s=178+((i*5)%4)*8;c.fillStyle=`rgb(${s+10},${s+4},${s-12})`;c.fillRect(i*64+10,22,48,h*.5-34);c.strokeStyle='rgba(70,62,50,.5)';c.strokeRect(i*64+10,22,48,h*.5-34)}
  c.fillStyle='#cfc7b2';c.fillRect(0,0,w,18);c.fillRect(0,h*.5-12,w,18);for(let i=0;i<8;i++)c.fillRect(i*64,0,12,h*.5);c.fillStyle='rgba(50,45,35,.35)';c.fillRect(0,18,w,3);c.fillRect(0,h*.5+6,w,3);noise(c,w,h,.06,1200)}),1,1);
 const glowTex=canvasTex(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});

 // ---------- ground: 위 마당(y=0)과 아래 광장(y=-7) ----------
 const grassHi=new T.Mesh(new T.PlaneGeometry(520,300),mat('#8fae84'));grassHi.rotation.x=-Math.PI/2;grassHi.position.set(0,-.06,TERR_Z-150);grassHi.receiveShadow=true;scene.add(grassHi);
 const grassLo=new T.Mesh(new T.PlaneGeometry(520,240),mat('#93b088'));grassLo.rotation.x=-Math.PI/2;grassLo.position.set(0,LOW-.04,TERR_Z+120);grassLo.receiveShadow=true;scene.add(grassLo);
 const plazaMesh=new T.Mesh(new T.PlaneGeometry(84,24),mat('#d4c7a6'));plazaMesh.rotation.x=-Math.PI/2;plazaMesh.position.set(0,LOW,TERR_Z+13.6);plazaMesh.receiveShadow=true;scene.add(plazaMesh);
 const yard=new T.Mesh(new T.PlaneGeometry(66,63),new T.MeshStandardMaterial({map:stoneTex,roughness:.95}));yard.rotation.x=-Math.PI/2;yard.position.set(0,0,8.5);yard.receiveShadow=true;scene.add(yard);
 box(scene,6,.06,57,0,.03,9.5,'#e6dcc4');
 pickable.push(yard,grassHi,grassLo,plazaMesh);

 // ---------- 석축과 청운교·백운교 ----------
 const terraceMat=new T.MeshStandardMaterial({map:terraceTex,roughness:.95});
 {const g=new T.BoxGeometry(260,7,1.4);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*18);const m=shadowy(new T.Mesh(g,terraceMat));m.position.set(0,LOW/2,TERR_Z+.7);scene.add(m)}
 box(scene,260,.35,2.2,0,.12,TERR_Z+.5,'#cbc3ad');
 const stepMat=mat('#cfc6b0'),railMat=mat('#bdb49e');
 for(let i=0;i<14;i++){const top=-(i+.5)*.5+.12;const s=box(scene,STAIR_HALF*2,7+top,1.02,0,(LOW+top)/2,TERR_Z+.5+i,stepMat);pickable.push(s)}
 for(const sx of[-1,1]){const len=Math.hypot(14,7);const r=box(scene,.5,1.1,len+.6,sx*(STAIR_HALF+.25),LOW/2+.75,TERR_Z+7,railMat);r.rotation.x=Math.atan2(7,14);
  const wall=box(scene,.5,3.6,14,sx*(STAIR_HALF+.25),LOW+1.8,TERR_Z+7,stepMat);
  for(let i=0;i<=4;i++){const z=TERR_Z+.3+i*3.45,y=LOW*(i*3.45)/14;box(scene,.62,1.9,.62,sx*(STAIR_HALF+.25),y+.75,z,railMat);ball(scene,.36,sx*(STAIR_HALF+.25),y+1.85,z,railMat,1,.8,1,10)}}

 // ---------- 건물 공통 ----------
 const windowMat=new T.MeshStandardMaterial({map:latticeTex,roughness:.9,emissive:'#ffb257',emissiveIntensity:0});glowMats.push({m:windowMat,day:0,night:.9});
 const redCol='#a63d2c';
 function roofParts(g,W,D,H,y,lift,roofMat,ridgeM){const hw=W/2,hd=D/2;const roof=shadowy(new T.Mesh(roofGeometry(W,D,H,lift),roofMat));roof.position.y=y;g.add(roof);
  // 용마루·내림마루는 조각이 많아서 한 덩어리로 합쳐 그린다
  const parts=[],o=new T.Object3D(),add=(w,h,d,x,yy,z,rz=0,look=null)=>{o.position.set(x,yy,z);o.rotation.set(0,0,rz);if(look)o.lookAt(look);o.updateMatrix();parts.push(new T.BoxGeometry(w,h,d).applyMatrix4(o.matrix))};
  const rl=Math.max(1.2,W-D);add(rl+.8,.5,.55,0,y+H+.12,0);
  for(const sx of[-1,1]){add(.55,.95,.6,sx*(rl/2+.4),y+H+.4,0,-sx*.25);
   for(const sz of[-1,1]){const N=6,p=t=>{const x=sx*(rl/2+(hw-rl/2)*t),z=sz*hd*t;return new T.Vector3(x,y+roofY(x*.999,z*.999,hw,hd,H,lift)+.16,z)};for(let i=0;i<N;i++){const a=p(i/N),b=p((i+1)/N),len=a.distanceTo(b),m=a.clone().add(b).multiplyScalar(.5);add(.36,.3,len+.05,m.x,m.y,m.z,0,b)}}}
  g.add(shadowy(new T.Mesh(mergeGeometries(parts),ridgeM)));return roof}
 function band(g,w,d,y,scale=1){const m=new T.MeshStandardMaterial({map:dancheongTex.clone(),roughness:.8});m.map.repeat.set(Math.max(2,Math.round(w/2.4)),1);m.map.needsUpdate=true;const b=shadowy(new T.Mesh(new T.BoxGeometry(w+.9,.7*scale,d+.9),m));b.position.y=y+.35*scale;g.add(b);return m}
 function hall({w,d,x,z,rot=0,colH=3.6,roofH=3.2,base=1.1,walls='front',cols}){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);g.updateMatrixWorld(true);
  box(g,w+3,base,d+3,0,base/2,0,'#c9bfa8');box(g,w+3.4,.16,d+3.4,0,base,0,'#b9ae96');
  const n=cols||Math.max(2,Math.round(w/3.4));
  for(let i=0;i<=n;i++){const cx=-w/2+i*w/n;for(const cz of[-d/2,d/2])cyl(g,.26,.3,colH,cx,base+colH/2,cz,redCol,10)}
  if(walls!=='open')box(g,w,colH,.25,0,base+colH/2,-d/2+.15,'#e7d9b8');
  if(walls==='front'){for(let i=0;i<n;i++){const p=new T.Mesh(new T.PlaneGeometry(w/n-.5,colH-.5),windowMat);p.position.set(-w/2+(i+.5)*w/n,base+(colH-.5)/2+.1,d/2-.05);g.add(p)}box(g,.25,colH,d,-w/2+.12,base+colH/2,0,'#e7d9b8');box(g,.25,colH,d,w/2-.12,base+colH/2,0,'#e7d9b8')}
  band(g,w,d,base+colH,.8);box(g,w+1.3,.16,d+1.3,0,base+colH+.64,0,'#b5473a');
  const roofMat=new T.MeshStandardMaterial({map:tileTex.clone(),roughness:.7,side:T.DoubleSide});roofMat.map.repeat.set(w/2.2,1);roofMat.map.needsUpdate=true;
  roofParts(g,w+4.6,d+4.2,roofH,base+colH+.74,1,roofMat,mat('#353c40'));return g}
 // 회랑, 자하문, 좌우 누각
 for(let i=0;i<7;i++){const z=-34+i*11.7;hall({w:11,d:4.2,x:-36.5,z,rot:Math.PI/2,colH:3,roofH:2,walls:'back'});hall({w:11,d:4.2,x:36.5,z,rot:-Math.PI/2,colH:3,roofH:2,walls:'back'})}
 hall({w:14,d:5,x:0,z:37.3,rot:Math.PI,colH:3.6,roofH:2.9,base:.14,walls:'open',cols:3});
 for(const sx of[-1,1]){hall({w:9,d:4.6,x:sx*13.6,z:37.6,rot:Math.PI,colH:4.5,roofH:2.5,base:.16,walls:'open',cols:sx<0?3:2});hall({w:10,d:4.2,x:sx*25.6,z:37.6,rot:Math.PI,colH:2.9,roofH:2,base:.16,walls:'back'});hall({w:9,d:6,x:sx*27,z:-31,colH:3,roofH:2.3,walls:'front'})}
 const nameBoard=(text)=>canvasTex(256,96,(c,w,h)=>{c.fillStyle='#2c3b52';c.fillRect(0,0,w,h);c.strokeStyle='#d3a94a';c.lineWidth=6;c.strokeRect(5,5,w-10,h-10);c.fillStyle='#f3d27a';c.font='700 54px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+3)});
 {const b=new T.Mesh(new T.PlaneGeometry(2.6,1),new T.MeshBasicMaterial({map:nameBoard('紫霞門')}));b.position.set(0,4.2,40.25);scene.add(b)}
 for(const[x,t]of[[-13.6,'泛影樓'],[13.6,'左經樓']])for(const[z,ry]of[[40.3,0],[34.9,Math.PI]]){const b=new T.Mesh(new T.PlaneGeometry(2.3,.9),new T.MeshBasicMaterial({map:nameBoard(t)}));b.position.set(x,5.05,z);b.rotation.y=ry;scene.add(b)}
 // 누각을 받치는 돌기둥(석축 바깥쪽)
 for(const cx of[-13.6,13.6])for(const dx of[-3.3,0,3.3]){box(scene,1.5,.7,1.1,cx+dx,LOW+.35,42,'#bdb49e');box(scene,1.05,5.4,.8,cx+dx,LOW+3.4,41.9,'#cfc6b0');box(scene,1.7,.5,1.2,cx+dx,LOW+6.35,42,'#bdb49e');box(scene,2.2,.4,1.5,cx+dx,LOW+6.8,42.05,'#cbc3ad')}

 // ---------- 대웅전: 겉(ext)은 안에 들어가면 투명해지고(그림자는 유지), 안(inn)은 항상 그린다 ----------
 const F=HALL.floor,HW=HALL.w/2,HD=HALL.d,HZ=(HALL.front+HALL.back)/2,ceilY=F+HALL.colH;
 box(scene,HALL.w+4,F-.16,HD+4,0,(F-.16)/2,HZ,'#c9bfa8');const slab=box(scene,HALL.w+4.4,.16,HD+4.4,0,F-.08,HZ,'#b9ae96');pickable.push(slab);
 for(let i=0;i<5;i++){const s=box(scene,9.2,F*(5-i)/5,.62,0,F*(5-i)/10,-20.7+i*.6,'#c4b9a0');pickable.push(s)}
 for(const sx of[-1,1]){const r=box(scene,.5,.5,3.4,sx*4.85,F/2+.3,-19.5,'#b9ae96');r.rotation.x=Math.atan2(F,3)}
 const ext=new T.Group(),inn=new T.Group(),ceilGroup=new T.Group();scene.add(ext,inn);inn.add(ceilGroup);
 const extMats=new Set();
 {const E=m=>{extMats.add(m);return m},eMat=(c,o={})=>E(new T.MeshStandardMaterial({color:c,roughness:.82,...o}));
  const colM=eMat(redCol),wallE=eMat('#e7d9b8'),hallWin=E(new T.MeshStandardMaterial({map:latticeTex,roughness:.9,emissive:'#ffb257',emissiveIntensity:0}));glowMats.push({m:hallWin,day:0,night:.9});
  for(let i=0;i<=5;i++){const cx=-HW+i*HALL.w/5;for(const cz of[HALL.front,HALL.back])cyl(ext,.34,.4,HALL.colH,cx,F+HALL.colH/2,cz,colM,12)}
  for(const sx of[-1,1])for(let j=1;j<3;j++)cyl(ext,.34,.4,HALL.colH,sx*HW,F+HALL.colH/2,HALL.front-j*HD/3,colM,12);
  box(ext,HALL.w,HALL.colH,.3,0,F+HALL.colH/2,HALL.back,wallE);for(const sx of[-1,1])box(ext,.3,HALL.colH,HD,sx*HW,F+HALL.colH/2,HZ,wallE);
  const bay=HALL.w/5,doorH=4;
  for(const i of[0,4]){const p=new T.Mesh(new T.PlaneGeometry(bay-.7,HALL.colH-.4),hallWin);p.position.set(-HW+(i+.5)*bay,F+(HALL.colH-.4)/2+.1,HALL.front+.02);ext.add(p)}
  const lintel=new T.Mesh(new T.PlaneGeometry(bay*3,HALL.colH-doorH),hallWin);lintel.position.set(0,F+doorH+(HALL.colH-doorH)/2,HALL.front+.02);ext.add(lintel);box(ext,bay*3+.3,.22,.4,0,F+doorH,HALL.front,colM);
  const leafM=E(new T.MeshStandardMaterial({map:latticeTex,roughness:.9,side:T.DoubleSide}));
  for(const dx of[-1.5,-.5,.5,1.5]){const leaf=new T.Mesh(new T.PlaneGeometry(1.5,doorH-.1),leafM);leaf.position.set(dx*bay+(dx<0?.42:-.42),F+doorH/2,HALL.front+.78);leaf.rotation.y=Math.PI/2;leaf.castShadow=true;ext.add(leaf)}
  E(band(ext,HALL.w,HD,ceilY,1.15));box(ext,HALL.w+1.5,.2,HD+1.5,0,ceilY+.9,0+HZ,eMat('#b5473a'));ext.children[ext.children.length-2].position.z=HZ;
  const roofMat=E(new T.MeshStandardMaterial({map:tileTex.clone(),roughness:.7,side:T.DoubleSide}));roofMat.map.repeat.set(HALL.w/2.2,1);roofMat.map.needsUpdate=true;
  const rg=new T.Group();rg.position.z=HZ;ext.add(rg);rg.updateMatrixWorld(true);roofParts(rg,HALL.w+7,HD+6.4,HALL.roofH,ceilY+1,1.35,roofMat,eMat('#353c40'));
  const b=new T.Mesh(new T.PlaneGeometry(3.6,1.35),E(new T.MeshBasicMaterial({map:nameBoard('大雄殿')})));b.position.set(0,ceilY+.5,HALL.front+.75);ext.add(b)}
 // 법당 안
 const hallFloor=plane(inn,HALL.w-.4,HD-.4,0,F+.012,HZ,new T.MeshStandardMaterial({map:woodTex,roughness:.6}),0,-Math.PI/2);pickable.push(hallFloor);
 const wallM=new T.MeshStandardMaterial({map:wallTex,roughness:.9});
 plane(inn,HALL.w-.3,HALL.colH,0,F+HALL.colH/2,HALL.back+.2,wallM);
 plane(inn,HD-.3,HALL.colH,-HW+.2,F+HALL.colH/2,HZ,wallM,Math.PI/2);plane(inn,HD-.3,HALL.colH,HW-.2,F+HALL.colH/2,HZ,wallM,-Math.PI/2);
 {const bay=HALL.w/5,inWin=new T.MeshStandardMaterial({map:latticeTex,roughness:.9,emissive:'#fff1cf',emissiveIntensity:.25});glowMats.push({m:inWin,day:.28,night:0});
  for(const i of[0,4])plane(inn,bay,HALL.colH,-HW+(i+.5)*bay,F+HALL.colH/2,HALL.front-.2,inWin,Math.PI);plane(inn,bay*3,HALL.colH-4,0,F+4+(HALL.colH-4)/2,HALL.front-.2,inWin,Math.PI)}
 plane(ceilGroup,HALL.w-.3,HD-.3,0,ceilY,HZ,new T.MeshStandardMaterial({map:ceilTex,roughness:.85}),0,Math.PI/2);
 for(const bz of[-27.5,-33])box(ceilGroup,HALL.w-.6,.55,.6,0,ceilY-.3,bz,'#8f3a2b').castShadow=false;
 for(const cx of[-7.8,7.8])for(const cz of[-26.6,-34.6])cyl(inn,.36,.4,HALL.colH,cx,F+HALL.colH/2,cz,redCol,12);
 // 불단(수미단)
 const altarZ=-36.4,altarTop=F+1.75;
 box(inn,15,.45,4.2,0,F+.22,altarZ,'#5d2a20');box(inn,14.2,1,3.7,0,F+.95,altarZ,new T.MeshStandardMaterial({map:altarTex,roughness:.75}));box(inn,15,.3,4.2,0,F+1.6,altarZ,'#d2a443');
 plane(inn,13.6,4.6,0,altarTop+2.55,HALL.back+.26,new T.MeshStandardMaterial({map:tangkaTex,roughness:.85,emissive:'#3a1608',emissiveIntensity:.35}));
 const goldMat=new T.MeshStandardMaterial({color:'#e6b84c',metalness:.55,roughness:.34,emissive:'#6e4a12',emissiveIntensity:.5});
 const haloMat=new T.MeshStandardMaterial({color:'#e2b94e',metalness:.4,roughness:.4,emissive:'#7a5310',emissiveIntensity:.7,side:T.DoubleSide});
 const lotusPink=mat('#e9a3ad',{roughness:.6}),hairM=mat('#232a3c',{roughness:.6});
 function lotusSeat(g,r){cyl(g,r*.82,r*.6,.28,0,.14,0,goldMat,18);for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const p=ball(g,.3*r,Math.cos(a)*r*.86,.36,Math.sin(a)*r*.86,lotusPink,.8,.55,.42,8);p.rotation.y=-a+Math.PI/2;p.castShadow=false}cyl(g,r*.9,r*.86,.14,0,.5,0,goldMat,18)}
 function primBuddha(x,z,s,crown){const g=new T.Group();g.position.set(x,altarTop,z);g.scale.setScalar(s);inn.add(g);lotusSeat(g,1.15);const fig=new T.Group();g.add(fig);
  ball(fig,.98,0,.86,.06,goldMat,1.25,.36,.9);ball(fig,.62,0,1.55,0,goldMat,1,1.12,.78);for(const sx of[-1,1]){ball(fig,.27,sx*.6,1.55,.06,goldMat,1,1.9,1.1);ball(fig,.2,sx*.5,1.02,.5,goldMat,1.3,.7,1.2)}
  ball(fig,.2,0,.98,.62,goldMat,1.5,.55,1);cyl(fig,.16,.2,.2,0,2.2,0,goldMat,10);ball(fig,.37,0,2.52,0,goldMat,.95,1.05,.95,18);for(const sx of[-1,1])ball(fig,.09,sx*.36,2.47,0,goldMat,.6,1.8,.9,8);
  if(crown){cyl(fig,.4,.36,.3,0,2.9,0,goldMat,12);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const c=new T.Mesh(new T.ConeGeometry(.08,.3,6),goldMat);c.position.set(Math.cos(a)*.36,3.15,Math.sin(a)*.36);fig.add(c)}}
  else{const h=new T.Mesh(new T.SphereGeometry(.385,18,10,0,Math.PI*2,0,Math.PI*.5),hairM);h.position.y=2.56;h.rotation.x=-.2;fig.add(h);ball(fig,.17,0,2.93,-.02,hairM,1,.9,1,10)}
  for(const sx of[-1,1]){const e=new T.Mesh(new T.BoxGeometry(.13,.025,.02),new T.MeshBasicMaterial({color:'#3a2a12'}));e.position.set(sx*.14,2.55,.345);fig.add(e)}
  const halo=new T.Mesh(new T.CircleGeometry(1.25,28),haloMat);halo.scale.set(1,1.35,1);halo.position.set(0,2,-.72);g.add(halo);g.userData.fig=fig;return g}
 const centerBuddha=primBuddha(0,altarZ,1.32,false);primBuddha(-4.9,altarZ+.1,.92,true);primBuddha(4.9,altarZ+.1,.92,true);
 // 닫집(불상 위 지붕 장식)
 {const cg=new T.Group();cg.position.set(0,ceilY-1.25,altarZ+.2);ceilGroup.add(cg);box(cg,7,.5,3.4,0,.9,0,'#8f3a2b').castShadow=false;const m=new T.MeshStandardMaterial({map:dancheongTex.clone(),roughness:.8});m.map.repeat.set(4,1);const b=new T.Mesh(new T.BoxGeometry(7.4,.6,3.8),m);b.position.y=.4;cg.add(b);for(let i=0;i<9;i++){const t=new T.Mesh(new T.ConeGeometry(.18,.5,6),goldMat);t.rotation.x=Math.PI;t.position.set(-3.4+i*.85,-.1,1.9);cg.add(t)}}
 // 촛대·향로·공양물·불전함
 const flameMat=new T.SpriteMaterial({map:glowTex,color:'#ffc66b',transparent:true,depthWrite:false,blending:T.AdditiveBlending});const flames=[];
 for(const sx of[-1,1]){cyl(inn,.1,.2,.5,sx*2.9,altarTop+.25,altarZ+1.6,goldMat,10);cyl(inn,.06,.06,.45,sx*2.9,altarTop+.7,altarZ+1.6,'#f4efe0',8);const f=new T.Sprite(flameMat);f.scale.set(.75,.95,1);f.position.set(sx*2.9,altarTop+1.08,altarZ+1.6);inn.add(f);flames.push(f);
  cyl(inn,.22,.14,.5,sx*6.6,altarTop+.25,altarZ+1.55,'#3f6a8a',12);for(let i=0;i<5;i++)ball(inn,.17,sx*6.6+Math.cos(i*1.26)*.2,altarTop+.72+((i*7)%3)*.08,altarZ+1.55+Math.sin(i*1.26)*.2,lotusPink,1,1,1,8)}
 cyl(inn,.42,.26,.34,0,altarTop+.17,altarZ+1.7,'#6d5a3a',14);for(let i=0;i<3;i++)cyl(inn,.012,.012,.6,-.1+i*.1,altarTop+.62,altarZ+1.7,'#8a5a3a',4);
 box(inn,3.2,.9,1.1,0,F+.45,altarZ+3.3,'#6b3324');box(inn,3.4,.1,1.3,0,F+.95,altarZ+3.3,'#d2a443');
 const hallLights=[-1,1].map(sx=>{const l=new T.PointLight('#ffc27a',30,34,1.7);l.position.set(sx*6,F+3.7,-31.5);inn.add(l);return l});
 const altarLight=new T.PointLight('#ffd89a',22,18,1.6);altarLight.position.set(0,altarTop+2.4,altarZ+2.6);inn.add(altarLight);
 // 방석
 const cushionMat=mat('#8a8f9c'),cushionEdge=mat('#5d6270');
 CUSHIONS.forEach(c=>{const m=new T.Mesh(new T.CylinderGeometry(.72,.76,.1,20),cushionMat);m.position.set(c.x,F+.06,c.z);m.scale.z=.9;m.receiveShadow=true;inn.add(m);const r=new T.Mesh(new T.TorusGeometry(.6,.03,6,24),cushionEdge);r.rotation.x=Math.PI/2;r.scale.y=.9;r.position.set(c.x,F+.115,c.z);inn.add(r)});
 // 천장 연등
 {const xs=[],cols=['#f08a9b','#f5c84b','#7fc59b','#7fb3e6','#c59be0','#f2f0e6','#ef6b5a'];for(let ix=0;ix<9;ix++)for(let iz=0;iz<5;iz++)xs.push([-10+ix*2.5,-26.4-iz*1.85]);
  const im=new T.InstancedMesh(new T.SphereGeometry(.3,12,9),new T.MeshBasicMaterial({color:'#ffffff'}),xs.length);const d=new T.Object3D(),col=new T.Color();xs.forEach(([x,z],i)=>{d.position.set(x,ceilY-.5-((i*5)%3)*.1,z);d.scale.set(1,.88,1);d.updateMatrix();im.setMatrixAt(i,d.matrix);im.setColorAt(i,col.set(cols[(i*3)%cols.length]))});im.instanceColor.needsUpdate=true;ceilGroup.add(im);
  const tg=new T.InstancedMesh(new T.BoxGeometry(.12,.34,.01),new T.MeshBasicMaterial({color:'#fbf3dc'}),xs.length);xs.forEach(([x,z],i)=>{d.position.set(x,ceilY-1-((i*5)%3)*.1,z);d.scale.set(1,1,1);d.updateMatrix();tg.setMatrixAt(i,d.matrix)});ceilGroup.add(tg)}
 // 국가유산청 3D 불상 (경주 불국사 금동아미타여래좌상)
 try{goldMat.envMap=env;goldMat.envMapIntensity=.9;goldMat.needsUpdate=true;haloMat.envMap=env;haloMat.needsUpdate=true;
  gltfLoader.load('./assets/museum-v4/amitabha-v1.glb',gltf=>{const m=gltf.scene,bb=new T.Box3().setFromObject(m),size=bb.getSize(new T.Vector3()),c=bb.getCenter(new T.Vector3());const g=new T.Group();m.position.set(-c.x,-bb.min.y,-c.z);g.add(m);g.scale.setScalar(2.62/size.y);g.position.set(0,.52,.05);
   m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.material.envMap=env;o.material.envMapIntensity=1.15;o.material.emissive=new T.Color('#4a330e');o.material.emissiveIntensity=.6;o.material.needsUpdate=true}});
   centerBuddha.userData.fig.visible=false;centerBuddha.add(g);api?.onBuddha?.()},undefined,e=>console.warn('불상 모델을 불러오지 못했어요',e))}catch(e){console.warn(e)}

 // ---------- 탑·석등 ----------
 const graniteTex=rep(canvasTex(256,256,(c,w,h)=>{c.fillStyle='#b9b4a7';c.fillRect(0,0,w,h);let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;for(let i=0;i<2600;i++){const v=110+rnd()*120|0;c.fillStyle=`rgba(${v},${v-4},${v-14},${.18+rnd()*.3})`;c.fillRect(rnd()*w,rnd()*h,1+rnd()*2.4,1+rnd()*2.4)}for(let i=0;i<16;i++){const x=rnd()*w,g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(70,66,58,.28)');g.addColorStop(1,'rgba(70,66,58,0)');c.fillStyle=g;c.fillRect(x,0,3+rnd()*9,h*(.3+rnd()*.7))}for(let i=0;i<9;i++){c.fillStyle=`rgba(${150+rnd()*40|0},${150+rnd()*30|0},${110+rnd()*30|0},.16)`;c.beginPath();c.ellipse(rnd()*w,rnd()*h,8+rnd()*22,5+rnd()*12,rnd()*3,0,Math.PI*2);c.fill()}}),1,1);
 const stone=new T.MeshStandardMaterial({map:graniteTex,color:'#e9e4d6',roughness:.96}),stone2=new T.MeshStandardMaterial({map:graniteTex,color:'#f6f1e3',roughness:.96});
 function slabRoof(parent,s,y,h=.4,lift=.35){const r=shadowy(new T.Mesh(roofGeometry(s,s,h,lift,[10,10]),stone2));r.position.y=y;parent.add(r);box(parent,s*.82,.2,s*.82,0,y-.1,0,stone);box(parent,s*.71,.16,s*.71,0,y-.28,0,stone2);box(parent,s*.61,.14,s*.61,0,y-.43,0,stone)}
 function finial(parent,y,h=2.4){cyl(parent,.09,.12,h,0,y+h/2,0,'#8a8270',8);for(let i=0;i<4;i++)cyl(parent,.32-i*.04,.32-i*.04,.12,0,y+.5+i*.38,0,'#9d9480',10);ball(parent,.24,0,y+h,0,stone)}
 const seokga=new T.Group();seokga.position.set(-11,0,-5);scene.add(seokga);
 box(seokga,6.4,.7,6.4,0,.35,0,stone);box(seokga,5,1.4,5,0,1.4,0,stone);box(seokga,5.6,.3,5.6,0,2.25,0,stone2);box(seokga,4.2,1.3,4.2,0,3.05,0,stone);for(const cx of[-1,0,1])for(const cz of[-1,0,1])if(cx||cz){box(seokga,.3,1.3,.3,cx*2.02,3.05,cz*2.02,stone2);box(seokga,.32,1.4,.32,cx*2.42,1.4,cz*2.42,stone2)}box(seokga,4.8,.3,4.8,0,3.85,0,stone2);
 {let sy=4;[[2.6,2.2],[2.1,1.1],[1.8,1]].forEach(([s,h],i)=>{box(seokga,s,h,s,0,sy+h/2,0,stone);for(const cx of[-1,1])for(const cz of[-1,1])box(seokga,.22,h,.22,cx*(s/2-.08),sy+h/2,cz*(s/2-.08),stone2);sy+=h;slabRoof(seokga,s*1.95-i*.2,sy+.18);sy+=.55});finial(seokga,sy)}
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ball(scene,.42,-11+Math.cos(a)*4.6,.12,-5+Math.sin(a)*4.6,stone2,1,.35,1,10)}
 const dabo=new T.Group();dabo.position.set(11,0,-5);scene.add(dabo);
 const daboProc=new T.Group();dabo.add(daboProc);const DABO_H=12.3;
 {const d=daboProc;box(d,6.6,1.1,6.6,0,.55,0,stone);for(const[dx,dz,ry]of[[0,3.6,0],[0,-3.6,0],[3.6,0,1],[-3.6,0,1]])box(d,ry?1.2:2,.5,ry?2:1.2,dx,.25,dz,stone2);
  for(const sx of[-1.9,1.9])for(const sz of[-1.9,1.9])box(d,.45,2.4,.45,sx,2.3,sz,stone);box(d,.8,2.4,.8,0,2.3,0,stone);box(d,5.4,.5,5.4,0,3.75,0,stone2);box(d,4.3,.35,4.3,0,4.2,0,stone);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;const r=box(d,3.5,.12,.12,Math.sin(a)*1.75,4.95,Math.cos(a)*1.75,stone2);r.rotation.y=a+Math.PI/2;for(let k=0;k<5;k++)box(d,.12,.6,.12,Math.sin(a)*1.75+Math.cos(a)*(k-2)*.85,4.65,Math.cos(a)*1.75-Math.sin(a)*(k-2)*.85,stone)}
  cyl(d,1.25,1.35,1.5,0,5.1,0,stone,8);cyl(d,1.7,1.25,.35,0,6,0,stone2,8);for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(d,.12,.12,1.2,Math.sin(a)*1.35,6.75,Math.cos(a)*1.35,stone,6)}
  cyl(d,1.05,1.1,1.2,0,6.75,0,stone,8);cyl(d,1.9,1.1,.32,0,7.5,0,stone2,8);cyl(d,.8,.9,.8,0,8.05,0,stone,16);cyl(d,1.6,.6,.45,0,8.65,0,stone2,16);const o=shadowy(new T.Mesh(new T.ConeGeometry(2.3,1.1,8),stone2));o.position.y=9.35;d.add(o);finial(d,9.8,2.2)}
 const sl=new T.Group();sl.position.set(0,0,-13);scene.add(sl);cyl(sl,.7,.8,.4,0,.2,0,stone,8);cyl(sl,.18,.22,1.6,0,1.2,0,stone,8);cyl(sl,.65,.4,.3,0,2.1,0,stone,8);
 const fireMat=new T.MeshStandardMaterial({color:'#efe0c0',emissive:'#ffad4a',emissiveIntensity:.1});glowMats.push({m:fireMat,day:.1,night:2.4});cyl(sl,.45,.45,.75,0,2.62,0,fireMat,8);{const r=shadowy(new T.Mesh(new T.ConeGeometry(.9,.6,8),stone));r.position.y=3.3;sl.add(r)}

 // 국가유산청 3D 데이터(경주 불국사 다보탑)를 휴대폰용으로 줄인 모델. 불러오지 못하면 위의 단순 모형을 그대로 둔다.
 gltfLoader.load('./assets/bulguksa-v8/dabotap-khs-v1.glb',gltf=>{const m=gltf.scene,bb=new T.Box3().setFromObject(m),size=bb.getSize(new T.Vector3()),c=bb.getCenter(new T.Vector3()),g=new T.Group();m.position.set(-c.x,-bb.min.y,-c.z);g.add(m);g.scale.setScalar(DABO_H/size.y);
  m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=.95;o.material.metalness=0}}});daboProc.visible=false;dabo.add(g);api?.onDabotap?.()},undefined,()=>{});

 // ---------- 불전사물: 법고(범영루), 목어·운판(좌경루) ----------
 const instr={},BEAM_Y=4.45,frameM=mat('#7a3b26'),ropeM=mat('#cdb98e');
 for(const cx of[-13.6,13.6])box(scene,8.7,.3,.3,cx,BEAM_Y+.15,37.35,'#8f3a2b');
 const pick=(g,id)=>g.traverse(o=>{if(o.isMesh){o.userData.inst=id;pickable.push(o)}});
 {// 법고: 받침틀 위에 올린 큰 북
  const I=INSTRUMENTS.drum,g=new T.Group();g.position.set(I.x,.16,I.z);scene.add(g);
  for(const sx of[-1,1]){for(const sz of[-1,1]){const leg=box(g,.22,1.35,.22,sx*1.0,.68,sz*.5,frameM);leg.rotation.z=sx*.2}box(g,.2,.2,1.3,sx*.88,1.12,0,frameM);box(g,.2,.2,1.3,sx*1.12,.2,0,frameM)}
  box(g,2.5,.18,.2,0,.2,-.55,frameM);box(g,2.5,.18,.2,0,.2,.55,frameM);
  const drum=new T.Group();drum.position.y=2.02;g.add(drum);const R=1.16,LEN=1.46;
  const bodyTex=canvasTex(512,128,(c,w,h)=>{c.fillStyle='#a3342a';c.fillRect(0,0,w,h);c.fillStyle='#2f7361';c.fillRect(0,h*.34,w,h*.32);c.fillStyle='#e8c35a';c.fillRect(0,h*.31,w,4);c.fillRect(0,h*.66,w,4);for(let i=0;i<8;i++){const x=i*64+32;[['#1f4f8a',17],['#f1ede0',12],['#d9534a',8],['#f0c74e',3.5]].forEach(([col,r])=>{c.fillStyle=col;c.beginPath();c.arc(x,h/2,r,0,Math.PI*2);c.fill()})}c.fillStyle='#e6bd55';for(let i=0;i<32;i++)for(const y of[11,h-11]){c.beginPath();c.arc(i*16+8,y,4.5,0,Math.PI*2);c.fill()}});
  const body=shadowy(new T.Mesh(new T.CylinderGeometry(R,R,LEN,30,1,true),new T.MeshStandardMaterial({map:bodyTex,roughness:.6,side:T.DoubleSide})));body.rotation.x=Math.PI/2;body.rotation.y=Math.PI/2;drum.add(body);
  const headTex=canvasTex(256,256,(c,w,h)=>{const gr=c.createRadialGradient(w/2,h/2,8,w/2,h/2,w/2);gr.addColorStop(0,'#f4e8c8');gr.addColorStop(.72,'#ead8ac');gr.addColorStop(1,'#c7a566');c.fillStyle=gr;c.beginPath();c.arc(w/2,h/2,w/2,0,Math.PI*2);c.fill();
   const cols=['#c8402f','#2f5f9a','#e3b53a'],r=50;c.save();c.translate(w/2,h/2);for(let i=0;i<3;i++){c.fillStyle=cols[i];c.beginPath();c.moveTo(0,0);c.arc(0,0,r,i*2.0944,(i+1)*2.0944);c.closePath();c.fill()}for(let i=0;i<3;i++){const a=i*2.0944;c.fillStyle=cols[i];c.beginPath();c.arc(Math.cos(a)*r/2,Math.sin(a)*r/2,r/2,0,Math.PI*2);c.fill()}c.strokeStyle='rgba(90,60,30,.5)';c.lineWidth=2;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.restore();
   c.strokeStyle='rgba(120,80,40,.35)';c.lineWidth=3;c.beginPath();c.arc(w/2,h/2,w/2-10,0,Math.PI*2);c.stroke()});
  const headM=new T.MeshStandardMaterial({map:headTex,roughness:.78});const head=new T.Mesh(new T.CircleGeometry(R-.03,36),headM);head.position.z=-LEN/2-.004;head.rotation.y=Math.PI;drum.add(head);const head2=new T.Mesh(new T.CircleGeometry(R-.03,36),headM);head2.position.z=LEN/2+.004;drum.add(head2);
  for(const sz of[-1,1]){const rim=shadowy(new T.Mesh(new T.TorusGeometry(R,.055,8,36),mat('#5d2a20')));rim.position.z=sz*LEN/2;drum.add(rim)}
  instr.drum={g,part:drum,head,amp:0,t:9,delay:0};pick(g,'drum')}
 {// 목어: 들보에 매단 나무 물고기(용머리)
  const I=INSTRUMENTS.fish,H=BEAM_Y-2.55,g=new T.Group();g.position.set(I.x,BEAM_Y,I.z);scene.add(g);const sw=new T.Group();g.add(sw);
  for(const dx of[-.7,.75]){const r=new T.Mesh(new T.CylinderGeometry(.022,.022,H-.3,5),ropeM);r.position.set(dx,-(H-.3)/2,0);sw.add(r)}
  const f=new T.Group();f.position.y=-H;sw.add(f);
  const scaleTex=canvasTex(256,128,(c,w,h)=>{c.fillStyle='#2b7480';c.fillRect(0,0,w,h);for(let y=0;y<10;y++)for(let x=0;x<18;x++){const cx=x*16+(y%2?8:0),cy=y*14-2;c.fillStyle=['#3f97a2','#2a6c78','#4aa79c'][(x+y)%3];c.beginPath();c.arc(cx,cy,9,0,Math.PI);c.fill();c.strokeStyle='#e7c15a';c.lineWidth=1.3;c.beginPath();c.arc(cx,cy,9,0,Math.PI);c.stroke()}});
  const fishM=new T.MeshStandardMaterial({map:scaleTex,roughness:.55}),redM=mat('#c8402f',{roughness:.55}),goldM=mat('#e3b53a',{roughness:.5}),whiteM=mat('#f4efe0'),darkM=new T.MeshBasicMaterial({color:'#2a1a12'});
  const body=shadowy(new T.Mesh(new T.SphereGeometry(1,26,16),fishM));body.scale.set(1.3,.42,.36);f.add(body);
  ball(f,.4,-1.18,.04,0,mat('#3f97a2',{roughness:.5}),1.15,1,.92,16);
  {const up=box(f,.62,.15,.5,-1.62,.13,0,'#3f97a2');up.rotation.z=.2;const lo=box(f,.56,.13,.44,-1.58,-.2,0,'#3f97a2');lo.rotation.z=-.32;const mouth=box(f,.42,.2,.34,-1.5,-.03,0,redM);mouth.castShadow=false;ball(f,.14,-1.74,-.04,0,mat('#e23b2e',{roughness:.3,emissive:'#5a0f0a',emissiveIntensity:.5}),1,1,1,12)}
  for(const sz of[-1,1]){ball(f,.11,-1.3,.2,sz*.3,whiteM,1,1,.6,10);const pu=new T.Mesh(new T.SphereGeometry(.05,8,6),darkM);pu.position.set(-1.33,.2,sz*.36);f.add(pu);const horn=new T.Mesh(new T.ConeGeometry(.07,.5,6),goldM);horn.position.set(-.98,.5,sz*.16);horn.rotation.z=-.9;f.add(horn);const wh=new T.Mesh(new T.CylinderGeometry(.015,.015,.6,4),goldM);wh.position.set(-1.9,.02,sz*.22);wh.rotation.z=1.2;wh.rotation.y=sz*.5;f.add(wh);const fin=new T.Mesh(new T.ConeGeometry(.16,.5,6),redM);fin.scale.z=.3;fin.position.set(-.45,-.3,sz*.3);fin.rotation.set(sz*.9,0,-2.4);f.add(fin)}
  for(let i=0;i<8;i++){const fin=new T.Mesh(new T.ConeGeometry(.12,.34-(i>5?.1:0),5),redM);fin.scale.z=.35;fin.position.set(-.75+i*.22,.43-Math.pow((i-3.2)/4.2,2)*.2,0);fin.rotation.z=-.5;f.add(fin)}
  for(const s of[-1,1]){const t=new T.Mesh(new T.ConeGeometry(.3,.85,8),s>0?redM:goldM);t.scale.z=.22;t.position.set(1.55,s*.22,0);t.rotation.z=Math.PI/2+s*.55;f.add(t);t.castShadow=true}
  box(f,1.5,.06,.16,.05,-.41,0,new T.MeshBasicMaterial({color:'#24160e'})).castShadow=false;
  instr.fish={g,part:sw,amp:0,t:9,delay:0};pick(g,'fish')}
 {// 운판: 구름 모양 청동 판
  const I=INSTRUMENTS.cloud,H=1.25,g=new T.Group();g.position.set(I.x,BEAM_Y,I.z);scene.add(g);const sw=new T.Group();g.add(sw);
  for(const dx of[-.38,.38]){const r=new T.Mesh(new T.CylinderGeometry(.02,.02,H,5),ropeM);r.position.set(dx,-H/2,0);sw.add(r)}
  const sh=new T.Shape();sh.moveTo(0,-.6);sh.bezierCurveTo(.3,-.66,.52,-.52,.62,-.34);sh.bezierCurveTo(1,-.44,1.06,.02,.74,.08);sh.bezierCurveTo(.96,.34,.62,.56,.4,.42);sh.bezierCurveTo(.3,.7,-.3,.7,-.4,.42);sh.bezierCurveTo(-.62,.56,-.96,.34,-.74,.08);sh.bezierCurveTo(-1.06,.02,-1,-.44,-.62,-.34);sh.bezierCurveTo(-.52,-.52,-.3,-.66,0,-.6);
  const geo=new T.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2,curveSegments:12});geo.translate(0,0,-.03);
  const bronze=new T.MeshStandardMaterial({color:'#a08048',metalness:.78,roughness:.4,envMap:env,envMapIntensity:1}),bronzeD=new T.MeshStandardMaterial({color:'#6f5a30',metalness:.7,roughness:.5,envMap:env});
  const plate=shadowy(new T.Mesh(geo,bronze));plate.position.y=-H-.58;sw.add(plate);
  for(const sz of[-1,1]){const ring=new T.Mesh(new T.TorusGeometry(.2,.03,6,20),bronzeD);ring.position.set(0,-H-.62,sz*.055);sw.add(ring);for(const[dx,dy]of[[-.5,-.2],[.5,-.2]]){const k=new T.Mesh(new T.SphereGeometry(.09,10,8),bronzeD);k.scale.z=.4;k.position.set(dx,-H-.58+dy,sz*.055);sw.add(k)}}
  for(const dx of[-.38,.38]){const loop=new T.Mesh(new T.TorusGeometry(.06,.018,5,10),bronzeD);loop.position.set(dx,-H+.02,0);sw.add(loop)}
  instr.cloud={g,part:sw,amp:0,t:9,delay:0};pick(g,'cloud')}

 // ---------- 나무(소나무·단풍)와 산 ----------
 const pineDark=mat('#3f6a48'),pineMid=mat('#4f7f55'),trunk=mat('#6d4b33'),maples=['#c8452c','#e07b2e','#e8b33a','#b93a2a'].map(c=>mat(c));
 function tree(x,z,s=1,kind=0){const y=z>TERR_Z+.4?LOW:0;const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s);g.rotation.y=(x*z)%6;scene.add(g);
  if(kind===0){const t=cyl(g,.22,.38,4.2,0,2.1,0,trunk,7);t.rotation.z=.1;[[1.9,4.4],[1.5,5.4],[1.1,6.3]].forEach(([r,yy],i)=>ball(g,r,.25*i,yy,0,i%2?pineMid:pineDark,1,.5,1,9))}
  else{cyl(g,.2,.34,2.6,0,1.3,0,trunk,7);const m=maples[(kind-1)%maples.length],m2=maples[kind%maples.length];ball(g,1.9,0,3.7,0,m,1,.8,1,9);ball(g,1.3,1.1,3.2,.4,m2,1,.8,1,8);ball(g,1.2,-1,3.3,-.5,m,1,.8,1,8);ball(g,1,.2,4.7,.1,m2,1,.8,1,8)}}
 for(let i=0;i<46;i++){const a=i/46*Math.PI*2,r=60+((i*37)%19),x=Math.cos(a)*r,z=Math.sin(a)*r-2;if(Math.abs(x)<15&&z>38)continue;tree(x,z,1.3+((i*13)%7)/10,i%3===0?1+(i%4):0)}
 [[-24,-46,0],[24,-46,0],[-8,-48,2],[9,-49,0],[-46,44,1],[46,44,3],[-14,58,2],[15,57,1],[-25,63,0],[26,62,4],[-34,56,3],[35,55,0],[-20,70,1],[21,71,2],[-28.5,33,2],[28.5,33,1],[-45,10,0],[45,-8,3]].forEach(([x,z,k],i)=>tree(x,z,1.15+i%3*.18,k));
 const mtn=[mat('#9bb59c'),mat('#86a58a'),mat('#a9c0a6')];
 [[-70,-130,46,40],[-20,-150,60,54],[40,-140,50,46],[95,-115,40,34],[-110,-100,38,30],[0,-180,90,70],[150,-60,40,30],[-150,-40,44,32]].forEach(([x,z,r,h],i)=>{const m=new T.Mesh(new T.ConeGeometry(r,h,7),mtn[i%3]);m.position.set(x,h/2-3,z);scene.add(m)});
 const starPos=[];for(let i=0;i<320;i++){const a=Math.random()*Math.PI*2,e=Math.random()*.9+.08,r=300;starPos.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r)}
 const stars=new T.Points(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(starPos,3)),new T.PointsMaterial({color:'#fff7dd',size:1.5,transparent:true,opacity:0,fog:false}));scene.add(stars);

 // ---------- 마당 연등 줄 ----------
 const lineMat=new T.LineBasicMaterial({color:'#5a4a3a'});
 STRINGS.forEach(s=>{for(const sx of[-1,1])cyl(scene,.14,.18,9.7,sx*25,4.85,s.z,'#6f5640',8);const pts=[];for(let i=0;i<30;i++){for(const t of[i/30,(i+1)/30])pts.push(-25+50*t,8.3-Math.sin(t*Math.PI)*1.3+.6,s.z)}scene.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(pts,3)),lineMat))});
 const petalGeo=new T.SphereGeometry(.2,10,8);petalGeo.scale(1,1.65,.5);petalGeo.translate(0,.22,0);const coreGeo=new T.SphereGeometry(.4,16,12),calyxGeo=new T.ConeGeometry(.2,.22,10),poolGeo=new T.CircleGeometry(2.6,24);
 const petalsGeo=(()=>{const gs=[],o=new T.Object3D();o.rotation.order='YXZ';for(let ring=0;ring<2;ring++)for(let k=0;k<9;k++){const a=(k+ring*.5)/9*Math.PI*2,r=ring?.26:.34;o.position.set(Math.cos(a)*r,ring?-.02:-.2,Math.sin(a)*r);o.rotation.set(ring?.42:.8,-a+Math.PI/2,0);o.updateMatrix();gs.push(petalGeo.clone().applyMatrix4(o.matrix))}return mergeGeometries(gs)})();
 const calyxM=mat('#4f8a55'),FONT='"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
 function tagTexture(text,name,color){return canvasTex(256,704,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#fbf4df';c.beginPath();c.roundRect(8,8,w-16,h-16,18);c.fill();c.fillStyle=color;c.beginPath();c.roundRect(8,8,w-16,46,[18,18,0,0]);c.fill();c.fillStyle='#fbf4df';c.beginPath();c.arc(w/2,31,8,0,Math.PI*2);c.fill();c.strokeStyle='rgba(120,90,50,.45)';c.lineWidth=3;c.beginPath();c.roundRect(8,8,w-16,h-16,18);c.stroke();
  const chars=Array.from(text),top=74,bottom=h-92,availH=bottom-top;let f=76,rows=1,cols=1;for(;f>=38;f-=2){rows=Math.max(1,Math.floor(availH/(f*1.06)));cols=Math.ceil(chars.length/rows);if(cols*f*1.2<=w-36)break}
  rows=Math.min(rows,Math.ceil(chars.length/cols));c.fillStyle='#33291f';c.font=`700 ${f}px ${FONT}`;c.textAlign='center';c.textBaseline='middle';const colW=f*1.2,totalW=cols*colW,y0=top+(availH-rows*f*1.06)/2+f*.53;
  chars.forEach((ch,i)=>{const col=Math.floor(i/rows),row=i%rows;c.fillText(ch,w/2+totalW/2-colW/2-col*colW,y0+row*f*1.06)});
  c.fillStyle='rgba(120,90,50,.5)';c.fillRect(34,h-88,w-68,2);c.fillStyle='#7c3036';c.font=`700 30px ${FONT}`;c.fillText(name,w/2,h-52,w-44)})}
 const slots=LANTERN_SLOTS.map((p,i)=>{const g=new T.Group();g.position.set(p.x,p.y,p.z);g.userData={slot:i,phase:i*.7};scene.add(g);const string=new T.Mesh(new T.CylinderGeometry(.012,.012,.6,4),mat('#5a4a3a'));string.position.y=.42;g.add(string);const body=new T.Group();g.add(body);
  const lm=new T.MeshStandardMaterial({color:'#f6efe0',roughness:.55,emissive:'#f6efe0',emissiveIntensity:0,transparent:true}),pm=new T.MeshStandardMaterial({color:'#f6dfe0',roughness:.55,emissive:'#f6dfe0',emissiveIntensity:0,transparent:true});
  const core=new T.Mesh(coreGeo,lm);core.scale.y=.9;core.userData.slot=i;body.add(core);const petals=[];
  {const q=new T.Mesh(petalsGeo,pm);q.userData.slot=i;body.add(q);petals.push(q)}
  const calyx=new T.Mesh(calyxGeo,calyxM);calyx.rotation.x=Math.PI;calyx.position.y=-.42;body.add(calyx);
  const tassel=new T.Mesh(new T.CylinderGeometry(.03,.05,.5,6),mat('#d9534a'));tassel.position.y=-.8;body.add(tassel);
  const tag=new T.Sprite(new T.SpriteMaterial({transparent:true,depthWrite:false}));tag.center.set(.5,1);tag.scale.set(1.05,2.9,1);tag.position.y=-.6;tag.visible=false;tag.userData.slot=i;body.add(tag);
  const glow=new T.Sprite(new T.SpriteMaterial({map:glowTex,transparent:true,opacity:0,depthWrite:false,fog:false}));glow.scale.set(3.9,3.9,1);glow.position.y=-.05;body.add(glow);
  const pool=new T.Mesh(poolGeo,new T.MeshBasicMaterial({map:glowTex,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));pool.rotation.x=-Math.PI/2;pool.position.set(p.x,.07,p.z);pool.visible=false;scene.add(pool);
  pickable.push(core,...petals,tag);return{g,body,core,petals,tag,tassel,glow,pool,lm,pm,lit:false,fade:1,wish:null,hang:0,key:''}});

 // ---------- 아바타 (팔은 간단한 IK, 다리는 관절 2개) ----------
 const skin=mat('#f2cfaf'),cheek=mat('#ef9f93'),eyeM=new T.MeshBasicMaterial({color:'#2a2220'}),hairA=mat('#2b2522'),woodM=mat('#9a6a3c',{roughness:.5}),woodD=mat('#6f4826',{roughness:.6});
 const DOWN=new T.Vector3(0,-1,0),v1=new T.Vector3(),v2=new T.Vector3(),v3=new T.Vector3(),v4=new T.Vector3(),v5=new T.Vector3();
 const capDown=(r,l)=>{const g=new T.CapsuleGeometry(r,l,4,8);g.translate(0,-l/2,0);return g};
 function labelSprite(text,mine){const tex=canvasTex(320,84,(c,w,h)=>{c.font=`700 34px ${FONT}`;const tw=Math.min(w-20,c.measureText(text).width+40);c.fillStyle=mine?'rgba(124,48,54,.92)':'rgba(255,252,240,.9)';const x=(w-tw)/2;c.beginPath();c.roundRect(x,10,tw,62,31);c.fill();c.fillStyle=mine?'#fff':'#2a3a30';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,43,w-40)});const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(2.6,.68,1);s.renderOrder=5;return s}
 function makeAvatar({kind='monk',color='coral',name='',mine=false}){
  const root=new T.Group(),body=new T.Group(),hips=new T.Group();root.add(body);body.add(hips);hips.position.y=.66;
  const robeC=kind==='monk'?'#8f8b82':(colors[color]||'#ed8e74'),robe=mat(robeC),pants=mat(kind==='monk'?'#77736a':'#4b5560'),shoeM=mat(kind==='monk'?'#ece6d6':'#3b3530');
  const legs=[-1,1].map(s=>{const yaw=new T.Group();yaw.position.set(s*.13,0,0);hips.add(yaw);const pitch=new T.Group();yaw.add(pitch);pitch.add(shadowy(new T.Mesh(capDown(.105,.28),pants)));const roll=new T.Group();pitch.add(roll);const knee=new T.Group();knee.position.y=-.28;roll.add(knee);knee.add(shadowy(new T.Mesh(capDown(.09,.26),pants)));const shoe=new T.Mesh(new T.SphereGeometry(.115,8,6),shoeM);shoe.scale.set(1,.6,1.5);shoe.position.set(0,-.3,.05);knee.add(shoe);return{s,yaw,pitch,roll,knee,c:{yaw:0,pitch:0,roll:0,bend:0}}});
  const torso=new T.Group();hips.add(torso);const r=shadowy(new T.Mesh(new T.CylinderGeometry(.25,.4,.82,14),robe));r.position.y=.36;torso.add(r);
  if(kind==='monk'){const sash=new T.Mesh(new T.BoxGeometry(.1,.86,.5),mat('#a0633b'));sash.position.set(.06,.38,.02);sash.rotation.z=-.5;torso.add(sash)}else{const collar=new T.Mesh(new T.TorusGeometry(.2,.05,6,14),mat('#f6efe0'));collar.rotation.x=Math.PI/2;collar.position.y=.76;torso.add(collar)}
  const head=new T.Group();head.position.y=1.12;torso.add(head);head.add(shadowy(new T.Mesh(new T.SphereGeometry(.4,20,16),skin)));
  for(const s of[-1,1]){const e=new T.Mesh(new T.SphereGeometry(.045,8,6),eyeM);e.position.set(s*.14,.02,.37);head.add(e);const ck=new T.Mesh(new T.SphereGeometry(.06,8,6),cheek);ck.position.set(s*.21,-.1,.32);ck.scale.z=.4;head.add(ck);const ear=new T.Mesh(new T.SphereGeometry(.08,8,6),skin);ear.position.set(s*.39,0,0);head.add(ear)}
  {const mouth=new T.Mesh(new T.BoxGeometry(.09,.02,.02),eyeM);mouth.position.set(0,-.13,.385);head.add(mouth)}
  if(kind==='monk'){const shade=new T.Mesh(new T.SphereGeometry(.405,20,12,0,Math.PI*2,0,Math.PI*.42),mat('#d9b89c'));shade.rotation.x=-.25;head.add(shade)}
  else{const hr=new T.Mesh(new T.SphereGeometry(.42,20,12,0,Math.PI*2,0,Math.PI*.5),hairA);hr.rotation.x=-.35;head.add(hr);const brim=new T.Mesh(new T.CylinderGeometry(.62,.62,.05,20),mat('#f1e3bf'));brim.position.y=.3;brim.rotation.x=-.12;head.add(brim);const crown=new T.Mesh(new T.CylinderGeometry(.33,.38,.28,16),mat('#f1e3bf'));crown.position.y=.44;crown.rotation.x=-.12;head.add(crown);const bandM=new T.Mesh(new T.CylinderGeometry(.385,.385,.08,16),mat(colors[color]||'#ed8e74'));bandM.position.y=.36;bandM.rotation.x=-.12;head.add(bandM)}
  const arms=[-1,1].map(s=>{const upper=shadowy(new T.Mesh(capDown(.078,.3),robe)),fore=shadowy(new T.Mesh(capDown(.07,.28),robe)),hand=new T.Mesh(new T.SphereGeometry(.085,10,8),skin);hand.scale.set(.6,1.05,.95);torso.add(upper,fore,hand);return{s,P:new T.Vector3(s*.3,.72,0),L1:.3,L2:.28,upper,fore,hand,cur:new T.Vector3(s*.37,.16,.03),pole:new T.Vector3(0,-.2,-1)}});
  // 목탁과 채
  const mok=new T.Group();mok.visible=false;torso.add(mok);{const b=new T.Mesh(new T.SphereGeometry(.13,14,10),woodM);b.scale.set(1.1,.95,.9);mok.add(b);const slit=new T.Mesh(new T.BoxGeometry(.2,.02,.2),woodD);slit.position.set(.02,-.02,.03);mok.add(slit);const h=new T.Mesh(new T.TorusGeometry(.08,.025,6,12,Math.PI),woodM);h.position.set(-.12,0,0);h.rotation.z=Math.PI/2;mok.add(h)}
  const mkStick=()=>{const g=new T.Group();g.visible=false;torso.add(g);const s=new T.Mesh(new T.CylinderGeometry(.014,.014,.26,6),woodD);s.position.y=.13;g.add(s);const t=new T.Mesh(new T.SphereGeometry(.035,8,6),woodM);t.position.y=.27;g.add(t);return g},stick=mkStick(),stick2=mkStick();
  const label=labelSprite(name,mine);label.position.y=2.5;root.add(label);
  const shadow=new T.Mesh(new T.CircleGeometry(.5,16),new T.MeshBasicMaterial({color:'#000',transparent:true,opacity:.16,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.03;root.add(shadow);
  if(mine){const ring=new T.Mesh(new T.RingGeometry(.55,.68,24),new T.MeshBasicMaterial({color:'#ffd56b',transparent:true,opacity:.85,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;root.add(ring)}
  root.traverse(o=>{if(o.isMesh)o.userData.avatar=true});
  const av={root,kind,color,name,mine,pos:new T.Vector3(0,0,26),y:0,path:[],facing:Math.PI,pose:'stand',poseT:0,walkT:0,bowQueue:0,halfBow:false,tokT:9,hitT:9,hitHand:1,inst:null,emote:null,legs,arms,torso,hips,head,body,mok,stick,stick2,label,cur:{torsoX:0,headX:0,drop:0},dispose(){scene.remove(root)}};
  root.position.copy(av.pos);scene.add(root);return av}
 const lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,seg=(p,a,b)=>Math.max(0,Math.min(1,(p-a)/(b-a)));
 function solveArm(a){const H=v1.copy(a.cur),d0=v2.subVectors(H,a.P);let d=d0.length();const max=a.L1+a.L2-.004;if(d>max){d0.setLength(max);H.copy(a.P).add(d0);d=max}if(d<.05)d=.05;
  const dir=v3.copy(d0).normalize(),A=(a.L1*a.L1-a.L2*a.L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,a.L1*a.L1-A*A));const perp=v4.copy(a.pole).addScaledVector(dir,-a.pole.dot(dir));if(perp.lengthSq()<1e-5)perp.set(0,0,-1);perp.normalize();
  const E=v5.copy(a.P).addScaledVector(dir,A).addScaledVector(perp,h);a.upper.position.copy(a.P);a.upper.quaternion.setFromUnitVectors(DOWN,v2.subVectors(E,a.P).normalize());a.fore.position.copy(E);a.fore.quaternion.setFromUnitVectors(DOWN,v2.subVectors(H,E).normalize());a.hand.position.copy(H);a.hand.quaternion.copy(a.fore.quaternion)}
 const want={arm:[new T.Vector3(),new T.Vector3()],pole:[new T.Vector3(),new T.Vector3()]};
 function poseAvatar(av,dt){
  const moving=av.path.length>0;let torsoX=0,headX=0,drop=0,bob=0,showMok=false,hit=-1;const L=[{yaw:0,pitch:0,roll:0,bend:0},{yaw:0,pitch:0,roll:0,bend:0}];
  const setArm=(i,x,y,z,px,py,pz)=>{want.arm[i].set(x,y,z);want.pole[i].set(px,py,pz)};
  const hap=i=>{const s=av.arms[i].s;setArm(i,s*.04,.6,.31,s,-.55,-.15)};
  for(let i=0;i<2;i++){const s=av.arms[i].s;setArm(i,s*.37,.16,.03,0,-.2,-1)}
  if(moving){av.walkT+=dt*10;for(let i=0;i<2;i++){const sw=Math.sin(av.walkT+(i?Math.PI:0));L[i].pitch=-sw*.6;L[i].bend=Math.max(0,sw)*.9+.1;const s=av.arms[i].s;setArm(i,s*.37,.2+Math.abs(sw)*.03,-sw*.2,0,-.2,-1)}bob=Math.abs(Math.cos(av.walkT))*.05}
  else if(av.pose==='hapjang'){hap(0);hap(1);headX=.12;if(av.halfBow&&av.poseT<1.5){const k=Math.sin(Math.PI*av.poseT/1.5);torsoX=.5*k;headX=.12+.2*k}}
  else if(av.pose==='sit'){drop=-.5;for(let i=0;i<2;i++){const s=av.legs[i].s;L[i]={yaw:s*.55,pitch:-1.5,roll:s*1.3,bend:2.25};setArm(i,s*.07,.2,.34,s,-.2,.2)}headX=.08;torsoX=.03+Math.sin(av.poseT*1.1)*.012}
  else if(av.pose==='moktak'){showMok=true;av.tokT+=dt;const hit=av.tokT<.22?Math.sin(Math.PI*av.tokT/.22):0;setArm(0,-.1,.5,.36,-1,-.6,0);setArm(1,.12-.08*hit,.72-.2*hit,.36,1,-.3,-.2);headX=.1}
  else if(av.pose==='strike'){av.hitT+=dt;hit=av.hitT<.34?Math.sin(Math.PI*av.hitT/.34):0;const both=av.inst==='drum';for(let i=0;i<2;i++){const s=av.arms[i].s,a=i===av.hitHand?hit:0;if(both||i===1)setArm(i,s*(.2-.04*a),.98-.38*a,.18+.37*a,s,-.3,-.45)}torsoX=.05+.13*hit;headX=-.06}
  else if(av.pose==='bow'){const p=Math.min(1,av.poseT/BOW_T),k=ease(seg(p,.1,.32))*(1-ease(seg(p,.76,.98))),down=ease(seg(p,.3,.5))*(1-ease(seg(p,.6,.8)));
   for(let i=0;i<2;i++){const s=av.arms[i].s;setArm(i,lerp(s*.04,s*.24,down),lerp(.6,.82,down),lerp(.31,.5,down),s,lerp(-.55,-.2,down),-.15);L[i].pitch=-1.45*k;L[i].bend=2.55*k}
   drop=-.42*k;torsoX=.16*k+1.22*down+.3*Math.sin(Math.PI*seg(p,0,.1))*(1-k);headX=.12+.22*down;
   if(p>=1){av.onBowDone?.(av);if(av.bowQueue>0){av.bowQueue--;av.poseT=0}else if(av.pose==='bow'&&av.poseT>=BOW_T){av.pose='hapjang';av.halfBow=false;av.poseT=0}}}
  const f=Math.min(1,dt*14),c=av.cur;c.torsoX=lerp(c.torsoX,torsoX,f);c.headX=lerp(c.headX,headX,f);c.drop=lerp(c.drop,drop+bob,f);
  av.torso.rotation.x=c.torsoX;av.head.rotation.x=c.headX;av.body.position.y=c.drop;
  for(let i=0;i<2;i++){const lg=av.legs[i],wl=L[i],lc=lg.c;lc.yaw=lerp(lc.yaw,wl.yaw,f);lc.pitch=lerp(lc.pitch,wl.pitch,f);lc.roll=lerp(lc.roll,wl.roll,f);lc.bend=lerp(lc.bend,wl.bend,f);lg.yaw.rotation.y=lc.yaw;lg.pitch.rotation.x=lc.pitch;lg.roll.rotation.y=lc.roll;lg.knee.rotation.x=lc.bend;
   const a=av.arms[i];a.cur.lerp(want.arm[i],f);a.pole.lerp(want.pole[i],f);solveArm(a)}
  av.mok.visible=showMok;av.stick.visible=showMok||hit>=0;av.stick2.visible=hit>=0&&av.inst==='drum';
  if(showMok){av.mok.position.copy(av.arms[0].hand.position);av.mok.position.x+=.04;av.mok.position.y+=.1;av.mok.position.z+=.06;av.stick.scale.setScalar(1);av.stick.position.copy(av.arms[1].hand.position);av.stick.rotation.set(1.2,0,.9)}
  else if(hit>=0){const pair=[[av.stick,1],[av.stick2,0]];for(const[st,i]of pair){st.scale.setScalar(1.9);st.position.copy(av.arms[i].hand.position);st.rotation.set(.3+1.05*(i===av.hitHand?hit:0),0,0)}}
 }
 function stepAvatar(av,dt){
  if(av.path.length){const sx0=av.pos.x,sz0=av.pos.z;let rem=0,px=av.pos.x,pz=av.pos.z;for(const p of av.path){rem+=Math.hypot(p.x-px,p.z-pz);px=p.x;pz=p.z}let move=Math.max(7.5,rem/2.4)*dt;
   while(move>0&&av.path.length){const t=av.path[0],dx=t.x-av.pos.x,dz=t.z-av.pos.z,d=Math.hypot(dx,dz);if(d<=move+.02){av.pos.x=t.x;av.pos.z=t.z;move-=d;av.path.shift();if(d>.01)av.facing=Math.atan2(dx,dz)}else{av.pos.x+=dx/d*move;av.pos.z+=dz/d*move;av.facing=Math.atan2(dx,dz);move=0}}
   if(regionOf(av.pos.x,av.pos.z)==='yard')for(const o of OBSTACLES){const ox=av.pos.x-o.x,oz=av.pos.z-o.z,od=Math.hypot(ox,oz);if(od<o.r&&od>.001){av.pos.x=o.x+ox/od*o.r;av.pos.z=o.z+oz/od*o.r}}
   // 어딘가에 걸려 제자리걸음을 하면 그 자리에서 멈춘다
   if(av.path.length){const moved=Math.hypot(av.pos.x-sx0,av.pos.z-sz0);av.stuckT=moved<dt*1.5?(av.stuckT||0)+dt:0;if(av.stuckT>.9){av.path=[];av.stuckT=0}}
   if(!av.path.length){av.stuckT=0;const cb=av.onArrive;av.onArrive=null;if(av.arriveFacing!=null)av.facing=av.arriveFacing;cb?.()}}
  av.poseT+=dt;const r=av.root.rotation.y;let d=av.facing-r;d=Math.atan2(Math.sin(d),Math.cos(d));av.root.rotation.y=r+d*Math.min(1,dt*10);
  const ty=heightAt(av.pos.x,av.pos.z);av.y+=(ty-av.y)*Math.min(1,dt*14);av.root.position.set(av.pos.x,av.y,av.pos.z);poseAvatar(av,dt);
  {const ls=Math.max(.4,Math.min(1,camera.position.distanceTo(av.root.position)/15));av.label.scale.set(2.6*ls,.68*ls,1);av.label.position.y=2.5-(1-ls)*.3}
  if(av.emote){av.emote.t+=dt;const e=av.emote;e.sprite.position.y=3+e.t*.5;e.sprite.material.opacity=Math.max(0,1-e.t/1.6);if(e.t>1.6){av.root.remove(e.sprite);av.emote=null}}
 }
 function emote(av,text){if(av.emote)av.root.remove(av.emote.sprite);const tex=canvasTex(160,96,(c,w,h)=>{c.font=`800 46px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=8;c.strokeStyle='rgba(60,40,30,.55)';c.strokeText(text,w/2,h/2);c.fillStyle='#fff3c9';c.fillText(text,w/2,h/2)});const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(1.6,.96,1);s.renderOrder=6;av.root.add(s);av.emote={sprite:s,t:0}}

 // ---------- 낮·밤, 법당 안 조명 ----------
 let night=false,nightK=0,insideK=0,me=null,myRegion=null,ghost=false;const avatars=new Map(),cA=new T.Color(),cB=new T.Color();
 const mix=(a,b,k)=>cA.set(a).lerp(cB.set(b),k);
 function applyLights(){const k=nightK,i=insideK;scene.background.copy(mix(DAY.sky,NIGHT.sky,k));scene.fog.color.copy(mix(DAY.fog,NIGHT.fog,k));hemi.intensity=lerp(DAY.hemi,NIGHT.hemi,k)*(1-.42*i);hemi.groundColor.copy(mix(DAY.ground,NIGHT.ground,k));sun.intensity=lerp(DAY.sun,NIGHT.sun,k);moon.intensity=.55*k;stars.material.opacity=k;renderer.toneMappingExposure=lerp(1.05,1.22,k);
  glowMats.forEach(g=>g.m.emissiveIntensity=lerp(g.day,g.night,k));hallLights.forEach(l=>l.intensity=lerp(26,44,Math.max(k,i*.5)));altarLight.intensity=lerp(20,34,k);
  slots.forEach(s=>{const e=s.lit?lerp(.5,1.05,k):lerp(0,.14,k);s.lm.emissiveIntensity=e;s.pm.emissiveIntensity=e*.7;s.tag.material.color.copy(mix('#ffffff','#e3d2ae',k))})}
 function setLanterns(list,{animateSlot}={}){const by=new Map(list.map(w=>[w.slot,w]));slots.forEach((s,i)=>{const w=by.get(i)||null,key=w?[w.text,w.color,w.name,w.mine].join('|'):'';if(key===s.key)return;s.key=key;s.wish=w;
   const c=w?colors[w.color]||'#ed8e74':'#f6efe0';s.lm.color.set(c);s.lm.emissive.set(c);cA.set(c).lerp(cB.set('#ffffff'),.18);if(!w)cA.set('#f6dfe0');s.pm.color.copy(cA);s.pm.emissive.copy(cA);s.lit=!!w;s.body.scale.setScalar(w?1.3:.85);s.tassel.visible=!w;
   if(s.tag.material.map){s.tag.material.map.dispose();s.tag.material.map=null}if(w)s.tag.material.map=tagTexture(w.text,w.name||'여행자',c);s.tag.material.needsUpdate=true;s.tag.visible=!!w;
   s.glow.material.color.set(c).lerp(cB.set('#ffe08a'),.55);s.pool.material.color.set(c).lerp(cB.set('#ffe9b0'),.4);s.pool.visible=!!w;if(i===animateSlot)s.hang=1});applyLights()}

 // ---------- 입력 ----------
 const ray=new T.Raycaster(),ndc=new T.Vector2();let down=null;
 canvas.addEventListener('pointerdown',e=>{if(e.isPrimary)down={x:e.clientX,y:e.clientY,t:performance.now(),moved:false}});
 canvas.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>9)down.moved=true});
 canvas.addEventListener('pointerup',e=>{if(!down||!e.isPrimary)return;const d=down;down=null;if(d.moved||performance.now()-d.t>650)return;const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
  const avHits=ray.intersectObjects([...avatars.values()].map(a=>a.root),true).filter(h=>h.object.userData.avatar);if(avHits.length){const av=[...avatars.values()].find(a=>{let o=avHits[0].object;while(o){if(o===a.root)return true;o=o.parent}return false});if(av){onTap?.({type:'avatar',avatar:av});return}}
  const hit=ray.intersectObjects(pickable.filter(o=>o.visible),false)[0];if(!hit)return;if(hit.object.userData.inst){onTap?.({type:'instrument',id:hit.object.userData.inst});return}if(hit.object.userData.slot!=null){onTap?.({type:'lantern',slot:hit.object.userData.slot,wish:slots[hit.object.userData.slot].wish});return}
  const p=clampTo(hit.point.x,hit.point.z);onTap?.({type:'ground',x:p.x,z:p.z,ripple:()=>ripple(p.x,p.z)})});
 const ripples=[];function ripple(x,z){const m=new T.Mesh(new T.RingGeometry(.3,.45,24),new T.MeshBasicMaterial({color:'#fff6d8',transparent:true,opacity:.9,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,heightAt(x,z)+.08,z);scene.add(m);ripples.push({m,t:0})}

 // ---------- 카메라 연출 ----------
 let shot=null,follow=true;const sph=new T.Spherical(),off=new T.Vector3(),tgt=new T.Vector3();
 const curSph=()=>sph.setFromVector3(off.copy(camera.position).sub(controls.target));
 function startShot({az=null,polar=null,dist=null,hold=0,back=false,point=null}={}){const s=curSph(),base=me?me.facing:Math.PI,home=shot?(shot.ret||{theta:shot.theta,phi:shot.phi,r:shot.r}):{theta:s.theta,phi:s.phi,r:s.radius};shot={theta:az==null?s.theta:base+az,phi:polar??s.phi,r:dist??s.radius,t:0,hold,point,ret:back?home:null}}
 controls.addEventListener('start',()=>{shot=null});

 // ---------- loop ----------
 let w=0,h=0,last=performance.now(),raf=0;
 function resize(){const r=canvas.getBoundingClientRect();if(r.width===w&&r.height===h)return;w=r.width;h=r.height;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.fov=w<h?58:46;camera.updateProjectionMatrix()}
 function setGhost(v){if(v===ghost)return;ghost=v;extMats.forEach(m=>{m.colorWrite=!v;m.depthWrite=!v})}
 function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(.1,(now-last)/1000);last=now;resize();
  avatars.forEach(a=>stepAvatar(a,dt));
  let inside=false;if(me){const reg=regionOf(me.pos.x,me.pos.z);inside=me.pos.z<HALL.front+1.2&&Math.abs(me.pos.x)<HW&&me.pos.z>HALL.back;if(reg!==myRegion){const prev=myRegion;myRegion=reg;if(prev){if(reg==='hall')startShot({az:Math.PI,polar:1.37,dist:8});else if(prev==='hall')startShot({polar:1.0,dist:17});else if(reg==='stairs')startShot({polar:1.38,dist:9});else if(reg==='yard')startShot({polar:1.2,dist:11.5});else if(reg==='plaza')startShot({polar:1.3,dist:17})}onRegion?.(reg,prev)}}
  setGhost(inside);ceilGroup.visible=!inside||camera.position.y<ceilY-.05;
  const nk=nightK+((night?1:0)-nightK)*Math.min(1,dt*2.5),ik=insideK+((inside?1:0)-insideK)*Math.min(1,dt*3);if(Math.abs(nk-nightK)>.0005||Math.abs(ik-insideK)>.0005){nightK=nk;insideK=ik;applyLights()}
  const hasHead=!!me;if(hasHead){v1.set(me.pos.x,me.y+1.5,me.pos.z);v2.subVectors(v1,camera.position)}
  slots.forEach(s=>{if(hasHead){s.g.getWorldPosition(v3);const t=Math.max(0,Math.min(1,v4.subVectors(v3,camera.position).dot(v2)/v2.lengthSq()));const d=v3.distanceTo(v4.copy(camera.position).addScaledVector(v2,t));const target=d<1.6&&t<.97&&t>.02?.15:1;s.fade+=(target-s.fade)*Math.min(1,dt*8);s.lm.opacity=s.pm.opacity=s.fade;s.lm.depthWrite=s.pm.depthWrite=s.fade>.9;s.tag.material.opacity=s.fade}
   const fl=.92+.08*Math.sin(now/170+s.g.userData.phase*3);s.glow.material.opacity=(s.lit?lerp(.62,.9,nightK):.14*nightK)*fl*s.fade;s.pool.material.opacity=lerp(.2,.6,nightK)*fl;
   s.body.rotation.z=Math.sin(now/1300+s.g.userData.phase)*.05;if(s.hang>0){s.hang=Math.max(0,s.hang-dt*.9);s.body.position.y=-s.hang*3;s.body.rotation.y=s.hang*6}});
  for(const k in instr){const it=instr[k];if(it.delay>0){it.delay-=dt;if(it.delay<=0){it.amp=1;it.t=0}}if(it.amp>.003){it.t+=dt;it.amp*=Math.exp(-dt*(k==='drum'?4.5:k==='fish'?1.5:1.1));const a=it.amp;if(k==='drum'){it.part.position.z=.04*a*Math.sin(it.t*46);const sc=1+.03*a*Math.sin(it.t*60);it.head.scale.set(sc,sc,1)}else if(k==='fish'){it.part.rotation.x=.13*a*Math.sin(it.t*4.6);it.part.rotation.z=.04*a*Math.sin(it.t*6.4)}else it.part.rotation.x=.3*a*Math.sin(it.t*5.8)}}
  flames.forEach((f,i)=>{const k=.9+.14*Math.sin(now/90+i*2)+.06*Math.sin(now/37);f.scale.set(.75*k,.95*k,1)});
  for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.t+=dt;r.m.scale.setScalar(1+r.t*3);r.m.material.opacity=Math.max(0,.9-r.t*1.4);if(r.t>.7){scene.remove(r.m);ripples.splice(i,1)}}
  if(me&&follow){if(shot?.point)tgt.copy(shot.point);else tgt.set(me.pos.x,me.y+1.4,me.pos.z);const delta=tgt.sub(controls.target).multiplyScalar(Math.min(1,dt*4.5));controls.target.add(delta);camera.position.add(delta)}
  if(shot){shot.t+=dt;const s=curSph(),kk=Math.min(1,dt*4.2);let dth=shot.theta-s.theta;dth=Math.atan2(Math.sin(dth),Math.cos(dth));s.theta+=dth*kk;s.phi+=(shot.phi-s.phi)*kk;s.radius+=(shot.r-s.radius)*kk;s.phi=Math.max(controls.minPolarAngle,Math.min(controls.maxPolarAngle,s.phi));camera.position.copy(controls.target).add(off.setFromSpherical(s));
   if(shot.t>1.2+shot.hold)shot=shot.ret?{...shot.ret,t:0,hold:0,point:null,ret:null}:null}
  controls.update();renderer.render(scene,camera)}
 raf=requestAnimationFrame(frame);
 api={
  scene,camera,controls,renderer,avatars,
  addAvatar(id,opts){const a=makeAvatar(opts);avatars.set(id,a);if(opts.mine){me=a;myRegion=null}return a},
  removeAvatar(id){const a=avatars.get(id);if(!a)return;a.dispose();avatars.delete(id);if(a===me)me=null},
  avatar:id=>avatars.get(id),
  walk(av,x,z,{facing=null,onArrive=null}={}){const p=clampTo(x,z);av.path=route(av.pos.x,av.pos.z,p.x,p.z);av.arriveFacing=facing;av.onArrive=onArrive;if(av.pose!=='stand'){av.pose='stand';av.bowQueue=0}return p},
  place(av,x,z,facing=Math.PI){const p=clampTo(x,z);av.pos.set(p.x,0,p.z);av.path=[];av.y=heightAt(p.x,p.z);av.facing=facing;av.root.rotation.y=facing;av.root.position.set(p.x,av.y,p.z)},
  setPose(av,pose,{queue=0,halfBow=false}={}){av.path=[];av.pose=pose;av.poseT=0;av.halfBow=halfBow;if(pose==='bow')av.bowQueue=queue},
  tok(av){if(av.pose!=='moktak'){av.path=[];av.pose='moktak';av.poseT=0}av.tokT=0},
  strike(av,id){if(av.pose!=='strike'){av.path=[];av.pose='strike';av.poseT=0;av.hitHand=1}else av.hitHand=id==='drum'?1-av.hitHand:1;av.inst=id;av.hitT=0;const it=instr[id];if(it)it.delay=.13},
  emote,setLanterns,ripple,shot:startShot,
  setNight(v){night=!!v},isNight:()=>night,
  regionOf:av=>regionOf(av.pos.x,av.pos.z),
  lookAtLantern(slot,hold=3.2){const p=LANTERN_SLOTS[slot];startShot({az:Math.PI,polar:1.36,dist:10.5,hold,back:true,point:new T.Vector3(p.x,p.y-2.6,p.z)})},
  snapCamera({az=Math.PI,polar=1.15,dist=16}={}){if(!me)return;controls.target.set(me.pos.x,me.y+1.4,me.pos.z);sph.set(dist,polar,me.facing+az);camera.position.copy(controls.target).add(off.setFromSpherical(sph))},
  overview(){shot=null;follow=false;controls.target.set(0,0,14);camera.position.set(-34,34,104);setTimeout(()=>follow=true,3200)},
  zoom(f){shot=null;const o=camera.position.clone().sub(controls.target);o.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,o.length()*f)));camera.position.copy(controls.target).add(o)},
  setDabotapModel(obj){daboProc.visible=false;dabo.add(obj)},
  snapshot(){renderer.render(scene,camera);return canvas},
  destroy(){cancelAnimationFrame(raf);controls.dispose();renderer.dispose()}
 };
 applyLights();
 return api;
}
