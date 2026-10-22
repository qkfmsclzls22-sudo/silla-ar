import * as T from './vendor/three-full-r169.js';
import {GLTFLoader} from './vendor/GLTFLoader-r169.js';
import {DRACOLoader} from './vendor/DRACOLoader-r169.js';
import {OrbitControls} from './vendor/OrbitControls-r169.js';
import {RoomEnvironment} from './vendor/RoomEnvironment-r169.js';
import {artifactById} from './museum-data-v3.js';

const positions=[[-4,-4],[0,-6],[4,-4],[-4,2],[0,0],[4,2]];
export function createGallery(host,{onSelect,onStatus,onReady}){
 let dirty=true;
 const scene=new T.Scene();scene.background=new T.Color('#19232b');scene.fog=new T.Fog('#19232b',32,65);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.86;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-label','나만의 3D 전시실. 화면을 끌어 둘러보고 진열장을 눌러 주세요.');renderer.domElement.setAttribute('role','img');host.prepend(renderer.domElement);
 const camera=new T.PerspectiveCamera(48,1,.1,90),controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=true;controls.panSpeed=.6;controls.rotateSpeed=.45;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.55;controls.minDistance=3;controls.maxDistance=27;controls.minAzimuthAngle=-1.12;controls.maxAzimuthAngle=1.12;
 const environment=new RoomEnvironment();const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(environment,.03);scene.environment=env.texture;scene.environmentIntensity=.55;environment.dispose();pmrem.dispose();
 scene.add(new T.HemisphereLight(0xe8eef5,0x352618,.55));
 const key=new T.DirectionalLight(0xffedce,1.3);key.position.set(-4,10,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.5,far:35});key.shadow.bias=-.0003;key.shadow.normalBias=.03;scene.add(key);
 const fill=new T.DirectionalLight(0xc8d5e8,.65);fill.position.set(8,6,-8);scene.add(fill);
 const mat=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const wallMat=mat('#182b37'),woodMat=mat('#493426'),darkMat=mat('#11171c'),stoneMat=mat('#252d30'),edgeMat=mat('#90a5a0',.25,.45);
 function box(w,h,d,x,y,z,m,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o;}
 function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
 let seed=381;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const floorMap=canvasTexture(1024,1024,(c,w,h)=>{c.fillStyle='#4d392b';c.fillRect(0,0,w,h);for(let row=0;row<16;row++)for(let col=-1;col<4;col++){const x=col*342+(row%2)*171,y=row*64,v=Math.floor(random()*22);c.fillStyle=`rgb(${112+v},${79+v},${51+v})`;c.fillRect(x+1,y+1,340,62);for(let k=0;k<35;k++){c.strokeStyle=`rgba(36,19,8,${random()*.15})`;const yy=y+random()*62;c.beginPath();c.moveTo(x,yy);c.bezierCurveTo(x+100,yy+3,x+210,yy-2,x+342,yy+random()*3);c.stroke();}}});
 floorMap.wrapS=floorMap.wrapT=T.RepeatWrapping;floorMap.repeat.set(3,5);
 const floor=new T.Mesh(new T.PlaneGeometry(32,48),new T.MeshStandardMaterial({map:floorMap,color:'#b5997b',bumpMap:floorMap,bumpScale:.018,roughness:.4,metalness:.04}));floor.rotation.x=-Math.PI/2;floor.position.z=8;floor.receiveShadow=true;scene.add(floor);
 const baseMap=floorMap.clone();baseMap.repeat.set(1,.7);woodMat.map=baseMap;woodMat.roughness=.58;woodMat.color.set('#948575');
 box(26,7,.3,0,3.5,-12,wallMat);box(.3,7,38,-13,3.5,7,wallMat);box(.3,7,38,13,3.5,7,wallMat);
 box(26,.16,.2,0,.08,-11.8,darkMat);box(.2,.16,38,-12.8,.08,7,darkMat);box(.2,.16,38,12.8,.08,7,darkMat);
 box(26,.2,38,0,7,7,mat('#252a2c'));
 for(let x=-12;x<13;x+=.36)box(.1,.1,32,x,6.85,4,woodMat);
 const lightMat=new T.MeshBasicMaterial({color:'#f3ddaf',toneMapped:false});
 for(let z=-8;z<=8;z+=4)for(let x=-7;x<=7;x+=4.65){box(3.9,.035,2.7,x,6.72,z,lightMat);box(4.1,.14,.09,x,6.64,z-1.4,darkMat);box(4.1,.14,.09,x,6.64,z+1.4,darkMat);box(.09,.14,2.9,x-2.02,6.64,z,darkMat);box(.09,.14,2.9,x+2.02,6.64,z,darkMat);}
 // Shallow wall niches and benches echo the historical gallery's material palette.
 for(const x of [-9.7,9.7]){box(3.1,3.7,.3,x,2.7,-11.65,mat('#121d25'));box(3.2,.1,.9,x,.9,-11.4,woodMat);box(2.9,.04,.25,x,4.48,-11.3,lightMat);}
 box(2.3,5.3,.1,-5.9,3,-11.75,mat('#8a4c2e'));
 for(const x of [-9.5,9.5]){box(2.5,.18,1.15,x,.68,4.5,woodMat);box(.16,.6,.8,x-1,.3,4.5,darkMat);box(.16,.6,.8,x+1,.3,4.5,darkMat);}
 const titleMap=canvasTexture(2048,768,()=>{});const titlePlane=new T.Mesh(new T.PlaneGeometry(8,3),new T.MeshBasicMaterial({map:titleMap,transparent:true,depthWrite:false}));titlePlane.position.set(.6,3.5,-11.78);scene.add(titlePlane);
 function setTitle(title){const c=titleMap.image.getContext('2d');c.clearRect(0,0,2048,768);c.fillStyle='#c5b58d';c.font='32px sans-serif';c.fillText('GYEONGJU  /  MY PRIVATE COLLECTION',90,135);c.fillStyle='#f0ece2';c.font='500 116px "Noto Sans KR", sans-serif';let rows=title.length>12?[title.slice(0,12),title.slice(12)]:[title];rows.forEach((r,i)=>c.fillText(r,90,340+i*150));c.fillStyle='#b4bdc1';c.font='30px "Noto Sans KR", sans-serif';c.fillText('신라의 아름다움, 나의 시선으로',96,680);titleMap.needsUpdate=true;dirty=true;}
 const glassMat=new T.MeshPhysicalMaterial({color:0xcfe3df,transparent:true,opacity:.065,roughness:.12,metalness:.12,side:T.DoubleSide,depthWrite:false});
 const cache=new Map(),slots=[],hitObjects=[];
 const draco=new DRACOLoader();draco.setDecoderPath('./vendor/draco/');draco.setDecoderConfig({type:'wasm'});draco.setWorkerLimit(2);
 const loader=new GLTFLoader();loader.setDRACOLoader(draco);
 async function load(id){if(!cache.has(id))cache.set(id,loader.loadAsync(artifactById[id].model).then(g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g.scene;}).catch(e=>{cache.delete(id);throw e;}));return cache.get(id);}
 positions.forEach(([x,z],i)=>{
  const group=new T.Group();group.position.set(x,0,z);scene.add(group);
  box(2.55,.15,2.35,0,.08,0,darkMat,group);box(2.45,1.02,2.25,0,.65,0,woodMat,group);box(2.57,.08,2.37,0,1.2,0,stoneMat,group);
  const glow=box(2.56,.025,2.36,0,1.15,0,new T.MeshBasicMaterial({color:'#bfa46c'}),group);glow.visible=false;
  box(2.34,.035,2.14,0,1.255,0,mat('#343a36'),group);
  const spot=new T.SpotLight(0xffe5b5,42,12,.4,.8,2);spot.position.set(x-.3,6.6,z+.3);spot.target.position.set(x,1.4,z);scene.add(spot,spot.target);
  const fixture=new T.Mesh(new T.CylinderGeometry(.09,.12,.3,12),darkMat);fixture.position.copy(spot.position);scene.add(fixture);
  const shadeMap=canvasTexture(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(.5,'rgba(0,0,0,.3)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  const shadow=new T.Mesh(new T.PlaneGeometry(4.7,4.5),new T.MeshBasicMaterial({map:shadeMap,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.012,z);scene.add(shadow);
  const glass=box(2.5,2.05,2.3,0,2.27,0,glassMat,group);glass.renderOrder=5;
  const edges=new T.LineSegments(new T.EdgesGeometry(glass.geometry),new T.LineBasicMaterial({color:0xa2c2bb,transparent:true,opacity:.24}));edges.position.copy(glass.position);group.add(edges);
  for(const sx of [-1,1])for(const sz of [-1,1])box(.012,2.05,.012,sx*1.25,2.27,sz*1.15,edgeMat,group);
  const plateMap=canvasTexture(768,192,()=>{});const plate=new T.Mesh(new T.PlaneGeometry(1.85,.46),new T.MeshBasicMaterial({map:plateMap}));plate.position.set(0,.8,1.132);group.add(plate);
  const content=new T.Group();content.position.y=1.28;group.add(content);
  const hit=box(2.6,3.2,2.4,x,1.6,z,new T.MeshBasicMaterial({visible:false}));hit.userData.slot=i;hitObjects.push(hit);
  const marker=document.createElement('button');marker.className='mg-marker';marker.dataset.slot=i;marker.onclick=()=>onSelect(i);host.append(marker);
  slots.push({group,content,plateMap,glow,marker,id:null,revision:0});
 });
 function plate(i,text){const s=slots[i],c=s.plateMap.image.getContext('2d');c.fillStyle='#e6e1d3';c.fillRect(0,0,768,192);c.fillStyle='#202c31';c.font='28px sans-serif';c.fillText(String(i+1).padStart(2,'0'),28,49);c.font='500 35px "Noto Sans KR",sans-serif';c.fillText(text,28,120,700);s.plateMap.needsUpdate=true;}
 async function setCase(i,data){const s=slots[i],rev=++s.revision;s.id=data?.id||null;s.content.clear();dirty=true;s.marker.classList.toggle('filled',!!data);s.marker.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><b>${data?'이야기':'＋ 유물 담기'}</b>`;s.marker.setAttribute('aria-label',`${i+1}번 진열장 · ${data?artifactById[data.id].name:'유물 담기'}`);plate(i,data?artifactById[data.id].name:'나의 선택을 기다리는 자리');
  if(!data){s.marker.classList.remove('loading');onStatus(i,'empty');return;}
  s.marker.classList.add('loading');s.marker.querySelector('b').textContent='불러오는 중';onStatus(i,'loading');
  try{const source=await load(data.id);if(rev!==s.revision)return;const m=source.clone(true);const bounds=new T.Box3().setFromObject(m),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const scale=Math.min(artifactById[data.id].height/size.y,1.95/size.x,1.7/size.z);m.scale.multiplyScalar(scale);m.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);const turn=new T.Group();turn.add(m);turn.rotation.y=T.MathUtils.degToRad(data.rotation||0);s.content.add(turn);dirty=true;s.marker.querySelector('b').textContent='이야기';s.marker.classList.remove('loading');onStatus(i,'ready');
  }catch(e){if(rev!==s.revision)return;s.marker.classList.remove('loading');s.marker.querySelector('b').textContent='다시 불러오기';onStatus(i,'error');console.error('Museum model failed',data.id,e);}
 }
 function rotate(i,degrees){if(slots[i].content.children[0])slots[i].content.children[0].rotation.y=T.MathUtils.degToRad(degrees);dirty=true;}
 let selected=-1,transition=null;
 function move(pos,target){transition={from:camera.position.clone(),fromTarget:controls.target.clone(),to:new T.Vector3(...pos),target:new T.Vector3(...target),start:performance.now()};}
 const mobile=()=>host.clientWidth<700;
 function overview(animate=true){selected=-1;slots.forEach(s=>s.glow.visible=false);const p=mobile()?[3.5,4.5,21]:[10,5.2,15];const t=[0,1.5,-2.8];if(animate)move(p,t);else{camera.position.set(...p);controls.target.set(...t);controls.update();}dirty=true;}
 function focus(i){selected=i;slots.forEach((s,k)=>s.glow.visible=k===i);const [x,z]=positions[i];const dist=mobile()?4.7:5.2;move([x+.8,3.1,z+dist],[x,1.85,z]);dirty=true;}
 function setTheme(name){wallMat.color.set(name==='warm'?'#786e5f':'#182b37');dirty=true;}
 let pointer=null;
 renderer.domElement.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};transition=null;});
 renderer.domElement.addEventListener('pointerup',e=>{if(!pointer||Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>8)return;const r=renderer.domElement.getBoundingClientRect();const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(hitObjects)[0];if(hit)onSelect(hit.object.userData.slot);});
 controls.addEventListener('start',()=>transition=null);
 controls.addEventListener('change',()=>dirty=true);
 function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.fov=w<700?57:48;camera.updateProjectionMatrix();renderer.setSize(w,h);dirty=true;}
 const ro=new ResizeObserver(resize);ro.observe(host);resize();overview(false);
 const v=new T.Vector3();let stopped=false;
 function frame(now){if(stopped)return;if(transition){dirty=true;let t=Math.min(1,(now-transition.start)/720);t=1-Math.pow(1-t,3);camera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.fromTarget,transition.target,t);if(t>=1)transition=null;}controls.target.x=T.MathUtils.clamp(controls.target.x,-7,7);controls.target.z=T.MathUtils.clamp(controls.target.z,-8,5);controls.target.y=T.MathUtils.clamp(controls.target.y,.7,3.2);controls.update();camera.position.x=T.MathUtils.clamp(camera.position.x,-12,12);camera.position.y=T.MathUtils.clamp(camera.position.y,1.6,6.4);camera.position.z=T.MathUtils.clamp(camera.position.z,-10.5,24);camera.lookAt(controls.target);if(dirty){renderer.render(scene,camera);dirty=false;}slots.forEach((s,i)=>{v.set(positions[i][0],.55,positions[i][1]+1.25).project(camera);const x=(v.x*.5+.5)*host.clientWidth,y=(-v.y*.5+.5)*host.clientHeight;const inView=v.z<1&&v.z>-1&&x>30&&x<host.clientWidth-30&&y>70&&y<host.clientHeight-72;s.marker.hidden=!inView||(selected>=0&&selected!==i);s.marker.style.transform=`translate(${x}px,${y}px) translate(-50%,0)`;s.marker.classList.toggle('selected',selected===i);});requestAnimationFrame(frame);}
 requestAnimationFrame(frame);onReady?.();
 function capture(){renderer.render(scene,camera);const out=document.createElement('canvas');out.width=renderer.domElement.width;out.height=renderer.domElement.height;out.getContext('2d').drawImage(renderer.domElement,0,0);return out;}
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onStatus(-1,'contextlost');});
 return {setCase,rotate,focus,overview,setTitle,setTheme,capture,zoom(delta){camera.position.sub(controls.target).multiplyScalar(delta).add(controls.target);controls.update();},dispose(){stopped=true;ro.disconnect();controls.dispose();draco.dispose();scene.traverse(o=>{o.geometry?.dispose();});env.dispose();renderer.dispose();}};
}
