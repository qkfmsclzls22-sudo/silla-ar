import * as T from './vendor/three-r169.js';
export const definitions=[
 {id:'house',name:'기와집',cat:'건물',r:2.3},{id:'cottage',name:'초가집',cat:'건물',r:2.2},
 {id:'palace',name:'동궁 느낌 전각',cat:'건물',r:3.4},{id:'gate',name:'월성 성문',cat:'건물',r:2.8},
 {id:'pagoda',name:'황룡사 구층목탑',cat:'명소',r:3},{id:'observatory',name:'첨성대',cat:'명소',r:1.7},
 {id:'bell',name:'성덕대왕신종',cat:'명소',r:2.3},{id:'wall',name:'성벽',cat:'건물',r:2},
 {id:'guard',name:'신라 병사',cat:'사람',r:.65},{id:'pine',name:'소나무',cat:'자연',r:1.5},
 {id:'deer',name:'사슴',cat:'자연',r:1},{id:'pond',name:'연못',cat:'자연',r:2.6},
 {id:'lotus',name:'가시연꽃',cat:'자연',r:.65},{id:'lantern',name:'소원등',cat:'자연',r:.65},
 {id:'seed',name:'씨앗 화단',cat:'자연',r:1.2},{id:'stone',name:'돌 블록',cat:'블록',r:1},
 {id:'grass',name:'잔디 블록',cat:'블록',r:1},{id:'path',name:'산책길',cat:'블록',r:.8}
];
const palette={roof:'#354f61',edge:'#789198',wood:'#984f3e',cream:'#efe0b5',stone:'#c3b89b',gold:'#d2a151',green:'#507a4a',leaf:'#83a555',trunk:'#79543b',earth:'#a4875d',water:'#66b6b2',pink:'#de88b0',bronze:'#8c8662',light:'#ffe8ac'};
export function createTemplates(){
 const materials=new Map(),templates={};
 const material=color=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.88,flatShading:true}));return materials.get(color)};
 for(const def of definitions){
  const parts=new Map();
  function add(g,color,x=0,y=0,z=0,rx=0,ry=0,rz=0){
   g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);
   const n=g.index?g.toNonIndexed():g;
   if(n!==g)g.dispose();n.deleteAttribute('uv');
   if(!parts.has(color))parts.set(color,[]);parts.get(color).push(n);
  }
  const box=(w,h,d,color,x=0,y=h/2,z=0,ry=0)=>add(new T.BoxGeometry(w,h,d),color,x,y,z,0,ry);
  const cyl=(rt,rb,h,color,x=0,y=h/2,z=0,segments=12)=>add(new T.CylinderGeometry(rt,rb,h,segments),color,x,y,z);
  const ball=(r,color,x,y,z,sx=1,sy=1,sz=1)=>{const g=new T.SphereGeometry(r,8,6);g.scale(sx,sy,sz);add(g,color,x,y,z)};
  function pole(a,b,r,color){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),g=new T.CylinderGeometry(r,r,d.length(),7);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());add(g,color)}
  function roof(w,d,y,h=1,ridge=false,color=palette.roof){
   const rings=[[w,d,y+.25],[w*.72,d*.72,y+.12],[ridge?w*.53:.28,ridge?.20:.28,y+h]],v=[];
   for(const [rw,rd,ry] of rings)for(const [x,z] of [[-1,-1],[1,-1],[1,1],[-1,1]])v.push(x*rw/2,ry,z*rd/2);
   const indices=[];for(let r=0;r<2;r++)for(let k=0;k<4;k++){const a=r*4+k,b=r*4+(k+1)%4,c=(r+1)*4+k,d=(r+1)*4+(k+1)%4;indices.push(a,c,b,b,c,d)}
   indices.push(8,11,9,9,11,10);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();add(g,color);
   box(w,.13,.16,palette.edge,0,y+.18,-d/2);box(w,.13,.16,palette.edge,0,y+.18,d/2);
   box(.16,.13,d,palette.edge,-w/2,y+.18);box(.16,.13,d,palette.edge,w/2,y+.18);
   if(ridge)box(w*.58,.17,.23,palette.edge,0,y+h+.03);
  }
  function building(w,d,h,y=0){
   box(w+.5,.35,d+.5,palette.stone,0,y+.175);box(w,h,d,palette.cream,0,y+.35+h/2);
   for(const x of [-w/2,0,w/2])for(const z of [-d/2,d/2])box(.20,h+.15,.2,palette.wood,x,y+.35+h/2,z);
   for(const z of [-d/2-.02,d/2+.02]){box(w,.19,.12,palette.wood,0,y+.48,z);box(w,.23,.12,palette.wood,0,y+h+.23,z);box(.65,h*.65,.08,palette.wood,0,y+.36+h*.34,z)}
   roof(w+1.3,d+1.3,y+h+.38,Math.min(1.6,w*.35),true);
  }
  switch(def.id){
   case 'house':building(3.5,2.8,1.6);break;
   case 'cottage':{
    box(3.4,.2,2.8,palette.stone);box(3.2,1.6,2.6,palette.cream,0,1);box(.75,1.3,.08,palette.trunk,0,.88,1.34);
    const g=new T.SphereGeometry(1,10,5,0,Math.PI*2,0,Math.PI/2);g.scale(2.25,1.25,1.95);add(g,'#bda46a',0,1.8);box(4.2,.25,3.55,'#bda46a',0,1.78);break;
   }
   case 'palace':building(5.4,3.8,2.6);box(2,.18,1.1,palette.stone,0,.1,2.8);break;
   case 'gate':
    box(2,2.1,2.8,palette.stone,-2,1.05);box(2,2.1,2.8,palette.stone,2,1.05);box(6,.75,2.8,palette.stone,0,2.4);
    building(4.8,2.9,1.4,2.8);break;
   case 'pagoda':{
    box(5.3,.5,5.3,palette.stone);box(4.6,.25,4.6,palette.cream,0,.65);
    for(let n=0;n<9;n++){const w=4.2-n*.34,y=.8+n*1.05;box(w*.7,.68,w*.7,palette.wood,0,y+.34);box(w*.68,.26,w*.68,palette.cream,0,y+.40);roof(w,w,y+.65,.7);}
    cyl(.10,.18,1.7,palette.gold,0,11.2);for(let i=0;i<3;i++)ball(.16-i*.025,palette.gold,0,10.8+i*.38,0);break;
   }
   case 'observatory':{
    box(2.8,.35,2.8,palette.stone);
    for(let n=0;n<13;n++){const t=n/12,r=1.2-.43*Math.sin(t*Math.PI*.8);cyl(r,r+.04,.29,n%2?'#bbaa84':'#c9b792',0,.49+n*.29,0,14)}
    box(.55,.68,.06,'#4e5044',0,2.45,1.0);box(2.3,.24,.42,palette.stone,0,4.12,1.0);box(2.3,.24,.42,palette.stone,0,4.12,-1.0);box(.42,.24,2.3,palette.stone,1.0,4.12);box(.42,.24,2.3,palette.stone,-1.0,4.12);break;
   }
   case 'bell':{
    box(3.6,.25,3.6,palette.stone);for(const x of [-1.5,1.5])for(const z of [-1.5,1.5])box(.25,3.4,.25,palette.wood,x,1.9,z);roof(4.3,4.3,3.65,1.2);
    cyl(.44,.87,1.7,palette.bronze,0,2.15,0,16);cyl(.9,.9,.18,palette.gold,0,1.3,0,16);ball(.44,palette.bronze,0,3.03,0,1,.6,1);break;
   }
   case 'wall':box(4,1.6,.9,palette.stone);for(let n=-1;n<=1;n++)box(.7,.5,1,palette.cream,n*1.5,1.85);break;
   case 'guard':
    box(.52,.80,.4,palette.wood,0,1.1);ball(.28,palette.cream,0,1.83,0);cyl(.28,.34,.21,palette.roof,0,2.04);cyl(.02,.12,.4,palette.gold,0,2.32);
    pole([-.18,.1,0],[-.18,.76,0],.10,palette.roof);pole([.18,.1,0],[.18,.76,0],.10,palette.roof);pole([.33,1.35,0],[.6,1.05,0],.10,palette.wood);pole([.7,0,0],[.7,2.65,0],.04,palette.trunk);add(new T.ConeGeometry(.12,.42,4),palette.edge,.7,2.86);break;
   case 'pine':
    pole([0,0,0],[.24,3.6,.1],.22,palette.trunk);pole([.1,2,0],[-1.1,3.2,.2],.13,palette.trunk);pole([.2,2.7,0],[1.2,3.8,.2],.12,palette.trunk);
    ball(1.25,palette.green,-.95,3.2,0,1,.55,1);ball(1.4,palette.leaf,.9,3.8,0,1,.54,1);ball(1.1,palette.green,.1,4.4,0,1,.48,1);break;
   case 'deer':
    ball(.7,'#b68856',0,1.1,0,1.2,.62,.58);for(const x of [-.55,.55])for(const z of [-.25,.25])pole([x,.1,z],[x,1,z],.085,palette.trunk);
    pole([.6,1.1,0],[.8,1.95,0],.20,'#b68856');ball(.32,'#b68856',.89,2.02,0,1.1,.8,.65);
    for(const z of [-.17,.17]){pole([.8,2.2,z],[.6,2.85,z*2],.04,palette.cream);pole([.68,2.55,z*1.7],[.95,2.72,z*2],.035,palette.cream)}break;
   case 'pond':
    cyl(2.5,2.6,.16,palette.stone,0,.09,0,24);cyl(2.22,2.22,.13,palette.water,0,.2,0,24);
    for(let i=0;i<13;i++){const a=i*Math.PI*2/13;ball(.28,palette.stone,2.35*Math.cos(a),.24,2.35*Math.sin(a),1,.65,.85)}break;
   case 'lotus':
    cyl(.65,.65,.045,palette.leaf,0,.11,0,10);
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ball(.25,palette.pink,.24*Math.cos(a),.30,.24*Math.sin(a),.65,1,.65)}ball(.15,palette.gold,0,.36,0);break;
   case 'lantern':
    pole([0,0,0],[0,2.4,0],.065,palette.trunk);pole([0,2.35,0],[.6,2.35,0],.05,palette.trunk);ball(.4,palette.light,.55,1.95,0,.85,1, .85);cyl(.25,.25,.1,palette.gold,.55,1.56);cyl(.25,.25,.1,palette.gold,.55,2.32);break;
   case 'seed':box(1.8,.18,1.8,palette.earth);for(let x=-.55;x<=.6;x+=.55)for(let z=-.55;z<=.6;z+=.55){pole([x,.1,z],[x,.45,z],.035,palette.green);ball(.19,palette.leaf,x+.09,.44,z,1,.38,.6)}break;
   case 'stone':box(1.8,.8,1.8,palette.stone);break;
   case 'grass':box(1.8,.6,1.8,palette.earth);box(1.85,.18,1.85,palette.leaf,0,.68);break;
   case 'path':box(1.9,.07,1.9,'#dbcda8');break;
  }
  templates[def.id]=[...parts].map(([color,geometries])=>{const geometry=T.mergeGeometries(geometries);geometries.forEach(g=>g.dispose());geometry.computeBoundingSphere();return {geometry,material:material(color)}});
 }
 return {templates,materials,dispose(){for(const parts of Object.values(templates))parts.forEach(p=>p.geometry.dispose());materials.forEach(m=>m.dispose())}};
}
export function templateGroup(parts){const group=new T.Group();for(const p of parts){const m=new T.Mesh(p.geometry,p.material);m.castShadow=true;m.receiveShadow=true;group.add(m)}return group}
