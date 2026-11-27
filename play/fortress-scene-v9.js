// 월성 쌓기·수성 게임 v9: 3D 화면. 반달 언덕(월성), 남천, 해자, 블록, 침입군, 화살을 그린다.
import * as T from './vendor/three-full-r169.js';
import {GLTFLoader} from './vendor/GLTFLoader-r169.js';
import {DRACOLoader} from './vendor/DRACOLoader-r169.js';
import {W,H,MAXH,terrainAt,PALACE,isPalace,BLOCKS} from './fortress-rules-v9.js?v=20261127-1';
export const S=2,LH=1.3,HILL_Y=1.0;
const wx=x=>(x-W/2+.5)*S,wz=z=>(z-H/2+.5)*S;
const baseY=(x,z)=>terrainAt(x,z)==='hill'?HILL_Y:0;
const DAY={sky:'#bcd3dc',fog:'#c9d8d6',hemi:1.5,sun:2.4,ground:'#6e7f5e'};
const NIGHT={sky:'#141d33',fog:'#18213a',hemi:.3,sun:.08,ground:'#1b2230'};
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}
const rnd0=s=>()=>(s=(s*16807)%2147483647)/2147483647;
function speckle(c,w,h,n,cols,seed){const r=rnd0(seed);for(let i=0;i<n;i++){c.fillStyle=cols[i%cols.length];c.globalAlpha=.08+r()*.18;c.fillRect(r()*w,r()*h,1+r()*3,1+r()*2)}c.globalAlpha=1}

export function createFortressScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(DAY.sky);scene.fog=new T.Fog(DAY.fog,90,210);
 const camera=new T.PerspectiveCamera(42,1,.5,500);
 const hemi=new T.HemisphereLight('#fff4de',DAY.ground,DAY.hemi);
 const sun=new T.DirectionalLight('#ffedcf',DAY.sun);sun.position.set(-30,60,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:5,far:160});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;
 const moon=new T.DirectionalLight('#9fb4ff',0);moon.position.set(30,50,-30);
 scene.add(hemi,sun,moon);
 const mats=new Map();const mat=(c,o={})=>{const k=c+JSON.stringify(o);if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,roughness:.85,...o}));return mats.get(k)};
 const M=c=>typeof c==='string'?mat(c):c;
 const geoCache=new Map();const g=(k,f)=>{if(!geoCache.has(k))geoCache.set(k,f());return geoCache.get(k)};
 const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m};
 function box(p,w,h,d,x,y,z,c){const m=sh(new T.Mesh(g('b'+w+','+h+','+d,()=>new T.BoxGeometry(w,h,d)),M(c)));m.position.set(x,y,z);p.add(m);return m}
 function cyl(p,rt,rb,h,x,y,z,c,seg=10){const m=sh(new T.Mesh(g('c'+rt+','+rb+','+h+','+seg,()=>new T.CylinderGeometry(rt,rb,h,seg)),M(c)));m.position.set(x,y,z);p.add(m);return m}
 function ball(p,r,x,y,z,c,seg=10){const m=sh(new T.Mesh(g('s'+r+','+seg,()=>new T.SphereGeometry(r,seg,Math.max(6,seg-3))),M(c)));m.position.set(x,y,z);p.add(m);return m}

 // ---------- 재료(텍스처) ----------
 // 월성 성벽은 흙을 켜켜이 다져 쌓은 판축 토성이다. 층마다 흙빛이 조금씩 다르다.
 const earthTex=canvasTex(128,128,(c,w,h)=>{const cols=['#9c7a4c','#a8855a','#8f6f45','#b08f62','#977550'];for(let i=0;i<8;i++){c.fillStyle=cols[i%5];c.fillRect(0,i*16,w,16);c.fillStyle='rgba(60,40,20,.22)';c.fillRect(0,i*16,w,1.5)}speckle(c,w,h,900,['#5a3f22','#d8c39a'],3)});
 const grassTex=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#7f9c58';c.fillRect(0,0,w,h);speckle(c,w,h,1400,['#5f7f3e','#a7bf72','#8aa660'],5)});
 // 석축: 다듬은 화강암 장대석(첨성대·월정교 석재 빛깔)
 const stoneTex=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#6d685d';c.fillRect(0,0,w,h);const r=rnd0(11);for(let row=0;row<4;row++){let x=-(row%2)*20;while(x<w){const bw=34+r()*22,s=168+r()*30|0;c.fillStyle=`rgb(${s+6},${s+2},${s-10})`;c.fillRect(x+2,row*32+2,bw-4,28);x+=bw}}speckle(c,w,h,700,['#3e3a33','#efe8d6'],9)});
 const woodTex=canvasTex(64,64,(c,w,h)=>{c.fillStyle='#6b4428';c.fillRect(0,0,w,h);for(let i=0;i<w;i+=8){c.fillStyle='rgba(30,16,6,.35)';c.fillRect(i,0,1.5,h)}speckle(c,w,h,200,['#3a2412','#9a6a40'],2)});
 const doorTex=canvasTex(64,64,(c,w,h)=>{c.fillStyle='#4f3018';c.fillRect(0,0,w,h);c.fillStyle='#2b1a0d';c.fillRect(w/2-1,0,2,h);c.fillStyle='#262626';for(let y=10;y<h;y+=16)for(let x=6;x<w;x+=12){c.beginPath();c.arc(x,y,2.2,0,7);c.fill()}});
 const tileTex=canvasTex(64,64,(c,w,h)=>{c.fillStyle='#3d4245';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=8){const gr=c.createLinearGradient(x,0,x+8,0);gr.addColorStop(0,'#2c3033');gr.addColorStop(.5,'#6b7174');gr.addColorStop(1,'#2c3033');c.fillStyle=gr;c.fillRect(x+1,0,5,h)}});
 tileTex.wrapS=tileTex.wrapT=T.RepeatWrapping;
 // 황토벽(흰 벽 대신 흙빛)
 const clayTex=canvasTex(64,64,(c,w,h)=>{c.fillStyle='#c49a62';c.fillRect(0,0,w,h);speckle(c,w,h,300,['#8a6538','#e2c290'],4);c.fillStyle='#5b3320';c.fillRect(0,0,w,4);c.fillRect(0,h-6,w,6);c.fillRect(0,0,4,h);c.fillRect(w-4,0,4,h)});
 const waterMat=new T.MeshStandardMaterial({color:'#4f8d93',roughness:.25,metalness:.1,transparent:true,opacity:.92});
 const earthM=new T.MeshStandardMaterial({map:earthTex,roughness:.95});
 const grassM=new T.MeshStandardMaterial({map:grassTex,roughness:.95});
 const stoneM=new T.MeshStandardMaterial({map:stoneTex,roughness:.8});
 const woodM=new T.MeshStandardMaterial({map:woodTex,roughness:.8});
 const doorM=new T.MeshStandardMaterial({map:doorTex,roughness:.7});
 const tileM=new T.MeshStandardMaterial({map:tileTex,roughness:.7,color:'#cfd3d6'});
 const clayM=new T.MeshStandardMaterial({map:clayTex,roughness:.9});
 const pillarC='#6f2e22',ironC='#3b3d40';
 // 밤에 불이 켜지는 창(문살 사이 불빛)
 const winMat=new T.MeshStandardMaterial({color:'#5a3a22',emissive:'#ffb75a',emissiveIntensity:0,roughness:.7});

 // ---------- 땅: 넓은 들, 반달 언덕(월성), 남천 ----------
 const world=new T.Group();scene.add(world);
 const fieldZ=wz(13.5)+S/2,fieldD=fieldZ+130;const field=new T.Mesh(new T.PlaneGeometry(260,fieldD),new T.MeshStandardMaterial({map:grassTex,color:'#c9d3a8',roughness:1}));field.material.map=grassTex.clone();field.material.map.wrapS=field.material.map.wrapT=T.RepeatWrapping;field.material.map.repeat.set(60,fieldD/4.4);field.material.map.needsUpdate=true;field.rotation.x=-Math.PI/2;field.position.set(0,-.02,fieldZ-fieldD/2);field.receiveShadow=true;world.add(field);
 // 놀이판(칸) 바닥: 조금 밝은 흙길빛
 const boardTex=grassTex.clone();boardTex.wrapS=boardTex.wrapT=T.RepeatWrapping;boardTex.repeat.set(W,H-2);boardTex.needsUpdate=true;const board=new T.Mesh(new T.PlaneGeometry(W*S,(H-2)*S),new T.MeshStandardMaterial({map:boardTex,color:'#c3cc98',roughness:1}));board.rotation.x=-Math.PI/2;board.position.set(0,0,wz(6.5));board.receiveShadow=true;world.add(board);
 const hillGrp=new T.Group();world.add(hillGrp);
 const hillTop=new T.MeshStandardMaterial({map:grassTex,color:'#d6e0b4',roughness:.95});
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){if(terrainAt(x,z)!=='hill')continue;const m=new T.Mesh(g('hill',()=>new T.BoxGeometry(S,HILL_Y,S)),[earthM,earthM,hillTop,earthM,earthM,earthM]);m.position.set(wx(x),HILL_Y/2,wz(z));m.receiveShadow=true;m.castShadow=true;hillGrp.add(m)}
 // 남천: 월성 남쪽을 감싸 흐르는 내
 const river=new T.Mesh(new T.PlaneGeometry(260,(H-14)*S+8),new T.MeshStandardMaterial({color:'#3f7f8a',roughness:.3,metalness:.1}));river.rotation.x=-Math.PI/2;river.position.set(0,-.25,(fieldZ+wz(16)+4)/2);world.add(river);
 const southField=new T.Mesh(new T.PlaneGeometry(260,120),field.material);southField.rotation.x=-Math.PI/2;southField.position.set(0,-.02,wz(16)+60+4);southField.receiveShadow=true;world.add(southField);
 const bankN=new T.Mesh(new T.BoxGeometry(260,.5,.6),mat('#8d7b5c'));bankN.position.set(0,-.1,wz(13.5)+S/2);world.add(bankN);
 // 월정교 자리(남천을 건너는 다리, 월성 남서쪽)
 const bridge=new T.Group();world.add(bridge);
 {const bx=wx(4),bz=wz(14.5)+4;box(bridge,4,.5,16,bx,.55,bz,stoneM);for(const s of[-1,1])box(bridge,.35,.6,16,bx+s*1.85,1.05,bz,woodM);for(let i=-2;i<=2;i++)box(bridge,1.4,1.2,1.4,bx,0,bz+i*3.2,stoneM)}
 // 월성 바깥 나무와 첨성대(실제로 월성 북서쪽 약 300m)
 const deco=new T.Group();world.add(deco);
 function pine(x,z,s=1){const t=new T.Group();cyl(t,.18*s,.26*s,2*s,0,1*s,0,'#6b4a32',6);const lc='#4f6e3c';ball(t,1.1*s,0,2.3*s,0,lc,7);ball(t,.85*s,.5*s,2.9*s,.2*s,'#5c7c45',7);ball(t,.7*s,-.4*s,3.3*s,-.2*s,lc,7);t.position.set(x,0,z);deco.add(t);return t}
 const r=rnd0(21);for(let i=0;i<46;i++){const a=r()*Math.PI*2,R=30+r()*28;const x=Math.cos(a)*R*1.25,z=Math.sin(a)*R*.9-6;if(z>12)continue;pine(x,z,.8+r()*.6)}
 const cheom=new T.Group();cheom.position.set(wx(-3.5),0,wz(-3));deco.add(cheom);
 {// 국가유산청 3D가 없을 때 쓰는 간단한 첨성대: 27단 원통 몸체, 우물 정자 머리
  const prof=[];for(let i=0;i<=27;i++){const t=i/27;prof.push(new T.Vector2(1.25-.55*Math.pow(t,1.4)+.08*Math.sin(t*3),i*.15+.5))}
  box(cheom,3.2,.5,3.2,0,.25,0,stoneM);const lathe=sh(new T.Mesh(new T.LatheGeometry(prof,18),stoneM));cheom.add(lathe);
  box(cheom,.6,.5,.06,0,2.6,1.05,'#2a2622');for(const s of[-1,1]){box(cheom,1.7,.25,.22,0,4.7,s*.6,stoneM);box(cheom,.22,.25,1.7,s*.6,4.95,0,stoneM)}}
 cheom.userData.kind='cheomseongdae';

 // ---------- 블록 모양 ----------
 function roof(p,w,d,y,col=tileM,h=.9){
  // 기와 지붕: 처마가 완만하게 들리고 용마루가 있는 우진각·팔작 느낌(납작하지 않게 경사를 준다)
  const geo=g('roof'+w+','+d+','+h,()=>{const ge=new T.BufferGeometry(),hw=w/2,hd=d/2,rw=w*.28,lift=.12;
   const v=[-hw,lift,-hd, hw,lift,-hd, hw,lift,hd, -hw,lift,hd, -rw,h,0, rw,h,0];
   const idx=[0,4,5, 0,5,1, 1,5,2, 2,5,4, 2,4,3, 3,4,0];
   ge.setAttribute('position',new T.Float32BufferAttribute(v,3));ge.setAttribute('uv',new T.Float32BufferAttribute([0,0,w,0,w,d,0,d,w*.3,d/2,w*.7,d/2],2));ge.setIndex(idx);ge.computeVertexNormals();return ge});
  const m=sh(new T.Mesh(geo,col));m.position.y=y;p.add(m);
  box(p,w*.58,.12,.16,0,y+h+.02,0,'#2b2f31');
  // 처마 끝을 살짝 두껍게
  box(p,w,.1,d,0,y+.08,0,'#2d3134');
  return m;
 }
 function archer(p,y,c='#5a3a28'){const a=new T.Group();cyl(a,.13,.17,.45,0,.23,0,'#3c5a6e',7);ball(a,.12,0,.57,0,'#e0b48c',7);cyl(a,.0,.16,.16,0,.71,0,'#2f2f2f',7);a.position.y=y;p.add(a);return a}
 const builders={
  earth(p,top){const m=sh(new T.Mesh(g('lay',()=>new T.BoxGeometry(S,LH,S)),top?[earthM,earthM,grassM,earthM,earthM,earthM]:earthM));m.position.y=LH/2;p.add(m)},
  stone(p,top){const m=sh(new T.Mesh(g('lay',()=>new T.BoxGeometry(S,LH,S)),stoneM));m.position.y=LH/2;p.add(m);if(top){box(p,S,.16,S,0,LH+.06,0,'#9b9483')}},
  gate(p,top){for(const s of[-1,1])box(p,.62,LH,S,s*.69,LH/2,0,stoneM);box(p,S,.22,S,0,LH-.11,0,woodM);const d=box(p,.74,LH-.24,.14,0,(LH-.22)/2,0,doorM);d.scale.set(1,1,1);
   if(top){for(const s of[-1,1])for(const t of[-1,1])cyl(p,.07,.07,.75,s*.7,LH+.37,t*.65,pillarC,6);roof(p,2.15,2.15,LH+.72,tileM,.62)}},
  tower(p){for(const s of[-1,1])for(const t of[-1,1])cyl(p,.09,.11,1.5,s*.7,.75,t*.7,'#5a3a22',6);box(p,1.8,.14,1.8,0,1.5,0,woodM);for(const [x,z,w,d] of[[0,.85,1.8,.08],[0,-.85,1.8,.08],[.85,0,.08,1.8],[-.85,0,.08,1.8]])box(p,w,.32,d,x,1.72,z,woodM);
   archer(p,1.57);for(const s of[-1,1])for(const t of[-1,1])cyl(p,.06,.06,.7,s*.7,1.95,t*.7,'#5a3a22',6);roof(p,2.1,2.1,2.3,tileM,.55)},
  crossbow(p){box(p,1.7,.3,1.7,0,.15,0,woodM);cyl(p,.12,.16,.6,0,.6,0,'#5a3a22',6);const piv=new T.Group();piv.position.y=.95;p.add(piv);piv.name='aim';
   box(piv,.18,.18,1.5,0,0,.1,'#6b4428');const bow=sh(new T.Mesh(g('bow',()=>new T.TorusGeometry(.75,.05,5,14,Math.PI*.8)),M('#4a2e18')));bow.rotation.set(Math.PI/2,0,Math.PI*.1);bow.position.set(0,0,.45);piv.add(bow);box(piv,.06,.06,1.1,0,.06,.0,ironC);archer(p,.3)},
  house(p){box(p,1.75,.18,1.45,0,.09,0,stoneM);const body=sh(new T.Mesh(g('hb',()=>new T.BoxGeometry(1.45,.85,1.1)),[clayM,clayM,clayM,clayM,clayM,clayM]));body.position.y=.6;p.add(body);for(const s of[-1,1])for(const t of[-1,1])cyl(p,.06,.06,.85,s*.7,.6,t*.53,pillarC,6);box(p,.4,.55,.04,0,.48,.56,doorM);for(const s2 of[-1,1])box(p,.28,.22,.04,s2*.45,.7,.56,winMat);roof(p,2.0,1.65,1.02,tileM,.72)}
 };
 // 왕궁(지키는 곳): 석축 기단 위 큰 전각
 const palace=new T.Group();scene.add(palace);
 {const px=(wx(PALACE[0][0])+wx(PALACE[3][0]))/2,pz=(wz(PALACE[0][1])+wz(PALACE[3][1]))/2;palace.position.set(px,HILL_Y,pz);
  box(palace,3.8,.5,3.6,0,.25,0,stoneM);box(palace,3.2,.3,3,0,.65,0,stoneM);
  for(let i=-2;i<=2;i++)for(const t of[-1,1])cyl(palace,.1,.11,1.35,i*.68,1.47,t*1.0,pillarC,8);
  const wall=sh(new T.Mesh(new T.BoxGeometry(2.6,1.2,1.6),clayM));wall.position.y=1.42;palace.add(wall);
  box(palace,.7,.9,.05,0,1.25,.82,doorM);for(const s2 of[-1,1])box(palace,.6,.4,.05,s2*.85,1.45,.82,winMat);roof(palace,4.0,3.0,2.12,tileM,1.25);box(palace,1.2,.2,.2,0,3.5,0,'#2b2f31');
  const flag=new T.Group();flag.position.set(1.7,.5,-1.6);palace.add(flag);cyl(flag,.04,.04,3.2,0,1.6,0,'#5a3a22',5);const fl=new T.Mesh(new T.PlaneGeometry(.9,.6),new T.MeshStandardMaterial({color:'#e6b84a',side:T.DoubleSide}));fl.position.set(.45,2.9,0);flag.add(fl);palace.userData.flag=fl}
 const palaceGlow=new T.PointLight('#ffcf7a',0,14,1.6);palaceGlow.position.set(palace.position.x,HILL_Y+2.2,palace.position.z+1.8);scene.add(palaceGlow);

 // ---------- 칸 쌓기 그리기 ----------
 const cells=new Map(),moats=new Map();const cellRoot=new T.Group();scene.add(cellRoot);
 function buildCell(x,z,stack){
  const grp=new T.Group();grp.position.set(wx(x),baseY(x,z),wz(z));
  stack.forEach((b,i)=>{const lay=new T.Group();lay.position.y=i*LH;builders[b](lay,i===stack.length-1);lay.userData.block=b;grp.add(lay)});
  grp.traverse(o=>{o.userData.cell=[x,z]});return grp;
 }
 function moatMesh(x,z){const grp=new T.Group();grp.position.set(wx(x),0,wz(z));const wm=new T.Mesh(g('mw',()=>new T.PlaneGeometry(S,S)),waterMat);wm.rotation.x=-Math.PI/2;wm.position.y=.04;grp.add(wm);const rim=new T.Mesh(g('mr',()=>new T.PlaneGeometry(S,S)),mat('#6d6450'));rim.rotation.x=-Math.PI/2;rim.position.y=.02;rim.scale.set(1.02,1.02,1);grp.add(rim);grp.traverse(o=>{o.userData.cell=[x,z]});return grp}
 function setPlan(plan){
  const seen=new Set();
  for(const k in plan.stacks){seen.add(k);const sig=plan.stacks[k].join('|'),old=cells.get(k);if(old&&old.sig===sig)continue;if(old)cellRoot.remove(old.grp);const [x,z]=k.split(',').map(Number);const grp=buildCell(x,z,plan.stacks[k]);cellRoot.add(grp);cells.set(k,{sig,grp})}
  for(const [k,v] of cells)if(!seen.has(k)){cellRoot.remove(v.grp);cells.delete(k)}
  for(const k in plan.moat){if(!plan.moat[k]||moats.has(k))continue;const [x,z]=k.split(',').map(Number);const m=moatMesh(x,z);cellRoot.add(m);moats.set(k,m)}
  for(const [k,m] of moats)if(!plan.moat[k]){cellRoot.remove(m);moats.delete(k)}
  shadowDirty=true;
 }
 // 설계도: 아직 안 지은 자리를 반투명하게
 const ghostRoot=new T.Group();scene.add(ghostRoot);const ghostMat=new T.MeshBasicMaterial({color:'#ffe28a',transparent:true,opacity:.28,depthWrite:false});const ghostEdge=new T.LineBasicMaterial({color:'#fff1b8',transparent:true,opacity:.75});const ghostMoat=new T.MeshBasicMaterial({color:'#7fd3e0',transparent:true,opacity:.45,depthWrite:false});
 function setGhost(bp,plan){
  ghostRoot.clear();if(!bp)return;
  for(const k in bp.stacks){const want=bp.stacks[k],got=plan.stacks[k]||[];const [x,z]=k.split(',').map(Number);
   for(let i=0;i<want.length;i++){if(got[i]===want[i])continue;const geo=g('gh',()=>new T.BoxGeometry(S*.96,LH*.96,S*.96));const m=new T.Mesh(geo,want[i]==='gate'?ghostMoat:ghostMat);m.position.set(wx(x),baseY(x,z)+i*LH+LH/2,wz(z));ghostRoot.add(m);const e=new T.LineSegments(g('ghe',()=>new T.EdgesGeometry(geo)),ghostEdge);e.position.copy(m.position);ghostRoot.add(e)}}
  for(const k in bp.moat){if(plan.moat[k])continue;const [x,z]=k.split(',').map(Number);const m=new T.Mesh(g('ghm',()=>new T.PlaneGeometry(S*.9,S*.9)),ghostMoat);m.rotation.x=-Math.PI/2;m.position.set(wx(x),.08,wz(z));ghostRoot.add(m)}
 }
 // 손가락이 가리키는 칸 표시
 const hover=new T.Group();scene.add(hover);
 const hoverBox=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(S,LH,S)),new T.LineBasicMaterial({color:'#fff',transparent:true,opacity:.95,depthTest:false}));hoverBox.renderOrder=9;hover.add(hoverBox);
 const hoverFill=new T.Mesh(new T.BoxGeometry(S,LH,S),new T.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.22,depthWrite:false}));hover.add(hoverFill);hover.visible=false;
 function setHover(x,z,ok,height){if(x==null){hover.visible=false;return}hover.visible=true;hover.position.set(wx(x),baseY(x,z)+height*LH+LH/2,wz(z));const c=ok?'#fff6c8':'#ff7b6b';hoverBox.material.color.set(c);hoverFill.material.color.set(c)}

 // ---------- 침입군 ----------
 const foes=new Map();const foeRoot=new T.Group();scene.add(foeRoot);
 const armor='#3a3534',cloth='#5b2f2a',helm='#4b4d50';
 function soldierBody(p,col=cloth){cyl(p,.16,.22,.55,0,.4,0,col,7);ball(p,.13,0,.8,0,'#d6a47c',7);cyl(p,.02,.17,.2,0,.95,0,helm,7);cyl(p,.06,.06,.25,-.08,.08,0,armor,5);cyl(p,.06,.06,.25,.08,.08,0,armor,5)}
 function torch(p,x,y,z){cyl(p,.03,.03,.5,x,y,z,'#5a3a22',5);const f=new T.Mesh(g('flame',()=>new T.ConeGeometry(.08,.22,6)),new T.MeshBasicMaterial({color:'#ffb347'}));f.position.set(x,y+.33,z);f.name='flame';p.add(f)}
 const foeMake={
  soldier(p){soldierBody(p);cyl(p,.02,.02,1.4,.22,.7,.05,'#6b4a2a',4);const tip=new T.Mesh(g('tip',()=>new T.ConeGeometry(.05,.18,5)),M('#9aa0a4'));tip.position.set(.22,1.47,.05);p.add(tip);torch(p,-.22,.5,.1)},
  ladder(p){soldierBody(p,'#4f3a2a');const l=new T.Group();l.position.set(0,.9,-.15);l.rotation.x=-.5;p.add(l);for(const s of[-1,1])box(l,.05,.05,1.6,s*.2,0,0,'#8a6a40');for(let i=-3;i<=3;i++)box(l,.4,.04,.04,0,0,i*.22,'#8a6a40')},
  rider(p){box(p,.36,.42,.95,0,.55,0,'#6a4a30');for(const s of[-1,1])for(const t of[-1,1])cyl(p,.05,.05,.4,s*.13,.2,t*.35,'#4a3220',4);box(p,.18,.36,.22,0,.85,.5,'#6a4a30');const rd=new T.Group();rd.position.y=.55;p.add(rd);soldierBody(rd,'#4a3d5a');cyl(p,.02,.02,1.3,.25,1.3,.2,'#6b4a2a',4)},
  ram(p){box(p,.95,.18,1.6,0,.4,0,'#6b4428');for(const s of[-1,1])for(const t of[-1,1]){const w=cyl(p,.24,.24,.1,s*.52,.25,t*.55,'#4a3220',10);w.rotation.z=Math.PI/2}
   const rf=sh(new T.Mesh(g('ramroof',()=>new T.CylinderGeometry(.62,.62,1.5,3,1,false)),M('#5a3a22')));rf.rotation.set(Math.PI/2,0,Math.PI/6);rf.position.y=.95;p.add(rf);const log=cyl(p,.15,.15,2,0,.68,.3,'#7a5a38',8);log.rotation.x=Math.PI/2;log.name='log'},
  chief(p){soldierBody(p,'#6a1f1f');p.scale.setScalar(1.45);const pl=new T.Mesh(g('plume',()=>new T.ConeGeometry(.06,.35,6)),M('#c0392b'));pl.position.set(0,1.2,0);p.add(pl);torch(p,-.24,.5,.1)}
 };
 const barBg=new T.MeshBasicMaterial({color:'#1b1b1b',depthTest:false,transparent:true,opacity:.75}),barFg=new T.MeshBasicMaterial({color:'#e25544',depthTest:false});
 function foeBar(p,y){const b=new T.Group();b.position.y=y;const bg=new T.Mesh(g('barbg',()=>new T.PlaneGeometry(.9,.14)),barBg);bg.renderOrder=10;b.add(bg);const fg=new T.Mesh(g('barfg',()=>new T.PlaneGeometry(.84,.09)),barFg);fg.position.z=.001;fg.renderOrder=11;b.add(fg);b.userData.fg=fg;b.name='bar';p.add(b);return b}
 function syncFoes(list,dt,time){
  const live=new Set();
  for(const e of list){live.add(e.id);let f=foes.get(e.id);
   if(!f){const grp=new T.Group();const body=new T.Group();body.scale.setScalar(1.5);grp.add(body);foeMake[e.kind](body);const bar=foeBar(grp,e.kind==='chief'?3.2:e.kind==='ram'?2.4:2.0);grp.userData={body,bar,x:e.x,z:e.z};foeRoot.add(grp);f=grp;foes.set(e.id,f);grp.traverse(o=>{if(o.name==='flame')o.visible=night})}
   const u=f.userData;u.x+=(e.x-u.x)*Math.min(1,dt*12);u.z+=(e.z-u.z)*Math.min(1,dt*12);
   const cx=Math.round(u.x),cz=Math.round(u.z);const ground=(cx>=0&&cz>=0&&cx<W&&cz<H)?baseY(cx,cz):0;
   const tx=(u.x-W/2+.5)*S,tz=(u.z-H/2+.5)*S;
   f.position.set(tx,f.position.y+(ground+(e.kind==='ram'?0:0)-f.position.y)*Math.min(1,dt*8),tz);
   f.rotation.y=e.face;
   const ph=time*9+e.id;u.body.position.y=e.attacking?0:Math.abs(Math.sin(ph))*.08;u.body.rotation.x=e.attacking?Math.sin(time*14+e.id)*.25:0;
   const fg=u.bar.userData.fg,k=Math.max(0,e.hp/e.max);fg.scale.x=k;fg.position.x=-.42*(1-k);u.bar.quaternion.copy(camera.quaternion).premultiply(f.quaternion.clone().invert());
  }
  for(const [id,f] of foes)if(!live.has(id)){dying.push({obj:f,t:0});foes.delete(id)}
 }
 // ---------- 효과: 화살, 무너짐, 쓰러짐 ----------
 const fx=new T.Group();scene.add(fx);const arrows=[],debris=[],dying=[];
 const arrowGeo=new T.CylinderGeometry(.03,.03,.8,4);arrowGeo.rotateX(Math.PI/2);const boltGeo=new T.CylinderGeometry(.07,.07,1.4,5);boltGeo.rotateX(Math.PI/2);
 const arrowMat=new T.MeshBasicMaterial({color:'#3b2a1a'}),boltMat=new T.MeshBasicMaterial({color:'#2a2a2a'});
 function cellTop(x,z,h){const cx=Math.round(x),cz=Math.round(z);const b=(cx>=0&&cz>=0&&cx<W&&cz<H)?baseY(cx,cz):HILL_Y;return b+h*LH}
 function shoot(ev){
  const big=ev.block==='crossbow',m=new T.Mesh(big?boltGeo:arrowGeo,big?boltMat:arrowMat);
  const a=new T.Vector3((ev.from.x-W/2+.5)*S,cellTop(ev.from.x,ev.from.z,ev.block==='palace'?2:ev.from.h)+1.2,(ev.from.z-H/2+.5)*S);
  const b=new T.Vector3((ev.to.x-W/2+.5)*S,cellTop(ev.to.x,ev.to.z,0)+.6,(ev.to.z-H/2+.5)*S);
  fx.add(m);arrows.push({m,a,b,t:0,dur:Math.max(.12,ev.fly),arc:a.distanceTo(b)*.18});
 }
 const debrisGeo=new T.BoxGeometry(.35,.3,.35);
 function burst(x,z,h,color,n=8){for(let i=0;i<n;i++){const m=new T.Mesh(debrisGeo,M(color));m.position.set((x-W/2+.5)*S+(Math.random()-.5)*1.4,cellTop(x,z,h)+Math.random()*.8,(z-H/2+.5)*S+(Math.random()-.5)*1.4);fx.add(m);debris.push({m,v:new T.Vector3((Math.random()-.5)*4,2+Math.random()*3,(Math.random()-.5)*4),t:0})}}
 const BREAK_C={earth:'#9c7a4c',stone:'#bdb6a4',gate:'#5a3a22',tower:'#6b4428',crossbow:'#6b4428',house:'#c49a62'};
 function event(ev){
  if(ev.type==='shoot')shoot(ev);
  else if(ev.type==='break'){const st=cells.get(ev.x+','+ev.z);burst(ev.x,ev.z,st?st.grp.children.length:0,BREAK_C[ev.block]||'#999',10);shake=.35}
  else if(ev.type==='kill')burst(ev.x,ev.z,0,'#5b2f2a',4);
  else if(ev.type==='palaceHit')palaceFlash=.25;
 }
 let shake=0,palaceFlash=0;

 // ---------- 카메라: 한 손가락은 쌓기, 두 손가락·버튼으로 돌리고 당겨 보기 ----------
 const cam={az:0,el:.98,dist:70,tx:0,tz:.5,goalAz:0,goalDist:70};
 // 세로 화면에서는 긴 반월성이 화면을 세로로 채우도록 동쪽에서 바라본다
 function baseAz(){const w=canvas.clientWidth||1,h=canvas.clientHeight||1;return w/h<.8?Math.PI/2:0}
 function fit(){const w=canvas.clientWidth||1,h=canvas.clientHeight||1,asp=w/h,side=baseAz()!==0;const needW=side?30:40,needH=side?38:(H-1)*S*1.0;const vf=camera.fov*Math.PI/180;const hf=Math.atan(Math.tan(vf/2)*asp);const dW=needW/2/Math.tan(hf)*.92;const dH=needH/2/Math.tan(vf/2)*.9+6;return Math.max(30,Math.min(110,Math.max(dW,dH)))}
 function applyCam(){const d=cam.dist;camera.position.set(cam.tx+Math.sin(cam.az)*Math.cos(cam.el)*d,Math.sin(cam.el)*d,cam.tz+Math.cos(cam.az)*Math.cos(cam.el)*d);if(shake>0){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake}camera.lookAt(cam.tx,1,cam.tz);scene.fog.near=d*1.4;scene.fog.far=d*3.2}
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const f=fit();cam.fitDist=f;if(!cam.userZoom){cam.goalDist=f;cam.dist=f}if(!cam.userTurn){cam.goalAz=cam.az=baseAz();cam.tx=baseAz()?2:0;cam.tz=baseAz()?1:.5}}
 new ResizeObserver(resize).observe(canvas);resize();
 const api={
  rotate(d){cam.userTurn=true;cam.goalAz+=d},zoom(k){cam.userZoom=true;cam.goalDist=Math.max(16,Math.min(140,cam.goalDist*k))},
  home(){cam.userZoom=false;cam.userTurn=false;const b=baseAz();cam.goalAz=b+Math.round((cam.goalAz-b)/(Math.PI*2))*Math.PI*2;cam.goalDist=cam.fitDist||fit();cam.tx=b?2:0;cam.tz=b?1:.5},
  twist(dAz,k){cam.userTurn=true;cam.goalAz+=dAz;cam.az+=dAz;if(k){cam.userZoom=true;cam.goalDist=Math.max(16,Math.min(140,cam.goalDist*k));cam.dist=cam.goalDist}},
  pan(dx,dy){const s=cam.dist*.0016;const c=Math.cos(cam.az),sn=Math.sin(cam.az);cam.tx=Math.max(-24,Math.min(24,cam.tx-(dx*c+dy*sn)*s*1.4));cam.tz=Math.max(-18,Math.min(22,cam.tz-(-dx*sn+dy*c)*s*1.4))},
  get azimuth(){return cam.az}
 };
 // 화면 좌표 → 칸
 const ray=new T.Raycaster(),ndc=new T.Vector2();
 api.pick=(clientX,clientY)=>{
  const rc=canvas.getBoundingClientRect();ndc.set((clientX-rc.left)/rc.width*2-1,-(clientY-rc.top)/rc.height*2+1);ray.setFromCamera(ndc,camera);
  const hit=ray.intersectObjects(cellRoot.children,true)[0];
  if(hit&&hit.object.userData.cell){const [x,z]=hit.object.userData.cell;return {x,z,onBlock:true}}
  for(const y of[HILL_Y,0]){const t=(y-ray.ray.origin.y)/ray.ray.direction.y;if(t<0)continue;const p=ray.ray.origin.clone().addScaledVector(ray.ray.direction,t);const x=Math.round(p.x/S+W/2-.5),z=Math.round(p.z/S+H/2-.5);if(x<0||z<0||x>=W||z>=H)continue;if(y===HILL_Y&&terrainAt(x,z)!=='hill')continue;if(y===0&&terrainAt(x,z)==='hill')continue;return {x,z,onBlock:false}}
  return null;
 };
 // ---------- 낮·밤(야경) ----------
 let night=false;const lampLights=[];
 api.setNight=v=>{night=v;const P=v?NIGHT:DAY;scene.background.set(P.sky);scene.fog.color.set(P.fog);hemi.intensity=P.hemi;hemi.groundColor.set(P.ground);sun.intensity=P.sun;moon.intensity=v?.6:0;palaceGlow.intensity=v?60:0;renderer.toneMappingExposure=v?1.1:1.05;winMat.emissiveIntensity=v?2.2:0;
  foeRoot.traverse(o=>{if(o.name==='flame')o.visible=v});shadowDirty=true};
 api.isNight=()=>night;
 // ---------- 국가유산청 3D(첨성대 등) 불러오기: 파일이 있으면 간단한 모형을 바꾼다 ----------
 const loader=new GLTFLoader();{const d=new DRACOLoader();d.setDecoderPath('./vendor/draco/');d.setDecoderConfig({type:'wasm'});loader.setDRACOLoader(d)}
 api.loadLandmark=(url,height)=>new Promise(res=>{loader.load(url,gl=>{const o=gl.scene;const bb=new T.Box3().setFromObject(o),size=bb.getSize(new T.Vector3());const k=height/size.y;o.scale.setScalar(k);const bb2=new T.Box3().setFromObject(o),c=bb2.getCenter(new T.Vector3());o.position.set(-c.x,-bb2.min.y,-c.z);o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});cheom.clear();cheom.add(o);shadowDirty=true;res(true)},undefined,()=>res(false))});

 // ---------- 그리기 반복 ----------
 let last=performance.now(),time=0,shadowDirty=true,frameHook=null,stopped=false;renderer.shadowMap.autoUpdate=false;
 api.onFrame=f=>{frameHook=f};
 function loop(now){if(stopped)return;requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  if(frameHook)frameHook(dt,time);
  cam.az+=(cam.goalAz-cam.az)*Math.min(1,dt*7);cam.dist+=(cam.goalDist-cam.dist)*Math.min(1,dt*7);shake=Math.max(0,shake-dt);applyCam();
  for(let i=arrows.length-1;i>=0;i--){const a=arrows[i];a.t+=dt/a.dur;if(a.t>=1){fx.remove(a.m);arrows.splice(i,1);continue}const p=a.a.clone().lerp(a.b,a.t);p.y+=Math.sin(a.t*Math.PI)*a.arc;const q=a.a.clone().lerp(a.b,Math.min(1,a.t+.05));q.y+=Math.sin(Math.min(1,a.t+.05)*Math.PI)*a.arc;a.m.position.copy(p);a.m.lookAt(q)}
  for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.t+=dt;d.v.y-=12*dt;d.m.position.addScaledVector(d.v,dt);d.m.rotation.x+=dt*5;if(d.m.position.y<0){d.m.position.y=0;d.v.set(0,0,0)}if(d.t>1.4){fx.remove(d.m);debris.splice(i,1)}}
  for(let i=dying.length-1;i>=0;i--){const d=dying[i];d.t+=dt;d.obj.rotation.z=Math.min(1.5,d.t*5);d.obj.position.y-=dt*.6;if(d.t>.8){foeRoot.remove(d.obj);dying.splice(i,1)}}
  if(palace.userData.flag)palace.userData.flag.rotation.y=Math.sin(time*2.2)*.25;
  palaceFlash=Math.max(0,palaceFlash-dt);palace.position.y=HILL_Y+(palaceFlash>0?Math.sin(time*60)*.04:0);
  if(night)foeRoot.traverse(o=>{if(o.name==='flame')o.scale.y=1+Math.sin(time*20+o.id)*.2});
  river.position.x=Math.sin(time*.3)*.4;
  if(shadowDirty){renderer.shadowMap.needsUpdate=true;shadowDirty=false}else if(foes.size&&Math.floor(time*6)!==Math.floor((time-dt)*6))renderer.shadowMap.needsUpdate=true;
  renderer.render(scene,camera)}
 requestAnimationFrame(loop);
 api.aim=(k,x,z)=>{const c=cells.get(k);if(!c)return;c.grp.traverse(o=>{if(o.name==='aim'){o.rotation.y=Math.atan2((x-W/2+.5)*S-c.grp.position.x,(z-H/2+.5)*S-c.grp.position.z)}})};
 Object.assign(api,{setPlan,setGhost,setHover,syncFoes,event,clearFoes(){for(const [,f] of foes)foeRoot.remove(f);foes.clear();fx.clear();arrows.length=0;debris.length=0;dying.length=0},snapshot(){renderer.render(scene,camera);return canvas.toDataURL('image/jpeg',.9)},stop(){stopped=true},renderer,scene,camera,cam});
 return api;
}
