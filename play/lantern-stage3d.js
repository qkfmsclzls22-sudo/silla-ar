import * as T from './vendor/three-r169.js';
import {createTemplates,templateGroup} from './wolseong-models3d.js';
import {colors} from './ui.js';
// A playful courtyard inspired by Bulguksa, not a measured reconstruction.
export function createLanternStage(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene();scene.background=new T.Color('#d9e8df');scene.fog=new T.Fog('#d9e8df',170,340);
 const camera=new T.PerspectiveCamera(45,1,.2,500);const controls=new T.OrbitControls(camera,canvas);controls.target.set(0,0,0);controls.enableDamping=true;controls.minDistance=12;controls.maxDistance=240;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.47;controls.screenSpacePanning=false;controls.maxTargetRadius=100;controls.cursor.set(0,0,0);
 const hemi=new T.HemisphereLight('#fff2d7','#69876e',2.5),sun=new T.DirectionalLight('#fff0ce',3);sun.position.set(-35,70,30);scene.add(hemi,sun);
 const mats=new Map(),kit=createTemplates();const material=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return mats.get(c)};
 function box(parent,w,h,d,x,y,z,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);parent.add(m);return m}
 function ball(parent,r,x,y,z,c){const m=new T.Mesh(new T.SphereGeometry(r,12,8),material(c));m.position.set(x,y,z);parent.add(m);return m}
 function template(id,x,z,scale=1,rotation=0){const g=templateGroup(kit.templates[id]);g.position.set(x,0,z);g.scale.setScalar(scale);g.rotation.y=rotation;scene.add(g);return g}
 const ground=box(scene,180,.4,150,0,-.3,10,'#94b28c');box(scene,94,.14,85,0,-.02,-7,'#d6c7a6');box(scene,16,.08,60,0,.08,48,'#c7bca5');
 for(let i=-4;i<=4;i++)box(scene,.08,.02,82,i*10,.07,-7,'#bdb397');
 for(let i=-4;i<=4;i++)box(scene,90,.02,.08,0,.07,i*10-7,'#bdb397');
 template('palace',0,-36,4);for(let i=0;i<8;i++){template('palace',-44,-34+i*9,1.55,Math.PI/2);template('palace',44,-34+i*9,1.55,Math.PI/2)}
 template('gate',0,40,2.6);template('palace',-24,40,2);template('palace',24,40,2);
 function pagoda(x,z,ornate){const g=new T.Group();g.position.set(x,0,z);scene.add(g);const stone='#c4c3ad';box(g,9,1,9,0,.5,0,stone);box(g,7,1,7,0,1.5,0,'#d9d5bf');if(!ornate){for(let i=0;i<3;i++){let w=5.4-i*.9,y=2+i*2.6;box(g,w*.62,1.8,w*.62,0,y+.9,0,stone);box(g,w,.35,w,0,y+1.9,0,'#e2dec9');const roof=new T.Mesh(new T.CylinderGeometry(w*.36,w*.72,.85,4),material('#b6b7a3'));roof.rotation.y=Math.PI/4;roof.position.y=y+2.35;g.add(roof)}}else{for(const a of [-2,2])for(const b of [-2,2])box(g,.7,3.8,.7,a,3.8,b,stone);box(g,6,.5,6,0,5.8,0,'#e0dcc4');for(let i=0;i<3;i++){const m=new T.Mesh(new T.CylinderGeometry(2-i*.4,2.5-i*.45,1,8),material(stone));m.position.y=6.5+i*1.3;g.add(m)}for(let i=0;i<4;i++){box(g,3+i, .3,1.5,0,1.6-i*.3,4+i*.7)}}for(let i=0;i<4;i++)ball(g,.5-i*.08,0,10+i*.65,0,stone)}
 pagoda(-19,-10,false);pagoda(19,-10,true);
 for(let i=0;i<28;i++){const a=i*2.399;const x=Math.cos(a)*(58+i%3*8),z=Math.sin(a)*58+7;if(Math.abs(x)<15&&z>35)continue;template('pine',x,z,2+i%3*.4)}
 for(let i=0;i<9;i++){const h=12+(i%3)*6;const m=new T.Mesh(new T.ConeGeometry(25,h,7),material(i%2?'#799c83':'#8baa8d'));m.position.set(-100+i*25,h/2,-85-(i%2)*5);scene.add(m)}
 const slotPosition=i=>new T.Vector3(-33+(i%10)*7.33,7-Math.sin((i%10)*Math.PI/9)*1.1,-22+Math.floor(i/10)*16);
 for(let r=0;r<4;r++){const points=Array.from({length:10},(_,c)=>slotPosition(r*10+c));const line=new T.LineSegments(new T.BufferGeometry().setFromPoints(points.flatMap((p,i)=>i<points.length-1?[p,points[i+1]]:[])),new T.LineBasicMaterial({color:'#796241'}));scene.add(line);for(const x of [-36,36])box(scene,.32,8,.32,x,4,-22+r*16,'#816a4a')}
 const lanterns=new T.Group(),avatars=new T.Group(),markers=new T.Group();scene.add(lanterns,avatars,markers);const picks=[];
 const markerMat=new T.MeshBasicMaterial({color:'#ffda76',transparent:true,opacity:.7});const markerGeometry=new T.SphereGeometry(1.1,12,8);
 for(let i=0;i<40;i++){const m=new T.Mesh(markerGeometry,markerMat);m.position.copy(slotPosition(i));m.userData.slot=i;markers.add(m)}markers.visible=false;
 function label(text){const c=document.createElement('canvas');c.width=512;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#fff8dc';ctx.fillRect(0,0,512,80);ctx.fillStyle='#254537';ctx.textAlign='center';ctx.font='bold 32px sans-serif';ctx.fillText(text,256,52,490);const map=new T.CanvasTexture(c);const s=new T.Sprite(new T.SpriteMaterial({map,depthTest:false}));s.scale.set(7,1.1,1);return s}
 function clear(g){for(const o of [...g.children]){o.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material&&!mats.has(m.material.color?.getStyle())){if(m.material.map){m.material.map.dispose();m.material.dispose()}if(m.userData.ownMaterial)m.material.dispose()}});g.remove(o)}}
 let dirty=true;controls.addEventListener('change',()=>dirty=true);
 let last='',night=false,draft=false;
 function sync(state,you,placing){const key=JSON.stringify([state.lanterns,state.guests,you,placing]);if(key===last)return;last=key;dirty=true;draft=placing;markers.visible=placing;markers.children.forEach((m,i)=>m.visible=!state.lanterns.some(l=>l.slot===i&&!l.mine));clear(lanterns);clear(avatars);picks.length=0;
  for(const l of state.lanterns){const g=new T.Group();g.position.copy(slotPosition(l.slot));const mat=new T.MeshStandardMaterial({color:colors[l.color]||'#efc769',roughness:.6,emissive:colors[l.color]||'#efc769',emissiveIntensity:night?1.7:.08});const m=new T.Mesh(new T.SphereGeometry(.95,16,12),mat);m.scale.y=1.3;m.position.y=-1.3;m.userData={lantern:l,ownMaterial:true};g.add(m);picks.push(m);box(g,.7,.18,.7,0,-.2,0,'#9e793b');box(g,.65,.16,.65,0,-2.5,0,'#9e793b');box(g,.07,1,.07,0,-3.1,0,'#f6dc8c');if(l.mine){const s=label('내 소원등');s.position.y=-4;g.add(s)}lanterns.add(g)}
  for(const [id,a] of Object.entries(state.guests)){const g=new T.Group();g.position.set((a.x-.5)*150,0,(a.y-.55)/.39*68-28);box(g,1.3,2.2,.9,0,1.7,0,colors[a.color]||'#ed8e74');ball(g,.72,0,3.4,0,'#f4ceb0');box(g,.4,.75,.5,-.35,.38,0,'#51473b');box(g,.4,.75,.5,.35,.38,0,'#51473b');const s=label((id===you?'나 · ':'')+a.name);s.position.y=5;g.add(s);avatars.add(g)}
 }
 function setNight(value){night=value;dirty=true;scene.background.set(value?'#152c46':'#d9e8df');scene.fog.color.copy(scene.background);hemi.intensity=value?.75:2.5;sun.intensity=value?.5:3;lanterns.traverse(o=>{if(o.userData.ownMaterial)o.material.emissiveIntensity=value?1.7:.08})}
 const ray=new T.Raycaster(),mouse=new T.Vector2();function pick(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(mouse,camera);scene.updateMatrixWorld(true);const hit=ray.intersectObjects(draft?markers.children.filter(m=>m.visible):picks,false)[0];if(hit)return draft?{slot:hit.object.userData.slot}:{lantern:hit.object.userData.lantern};const floor=ray.intersectObject(ground)[0];return floor?{point:floor.point}:null}
 function view(){controls.enableDamping=false;controls.target.set(0,0,1);const f=Math.max(1,1/camera.aspect);camera.position.set(63*f,74*f,105*f);controls.update();controls.enableDamping=true}
 function zoom(f){const v=camera.position.clone().sub(controls.target);v.setLength(Math.max(12,Math.min(240,v.length()*f)));camera.position.copy(controls.target).add(v);controls.update()}
 let pan=false;function togglePan(){pan=!pan;controls.mouseButtons.LEFT=pan?T.MOUSE.PAN:T.MOUSE.ROTATE;controls.touches.ONE=pan?T.TOUCH.PAN:T.TOUCH.ROTATE;return pan}
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();dirty=true}const ro=new ResizeObserver(resize);ro.observe(canvas);resize();view();
 let frame,stopped=false;function render(){renderer.render(scene,camera);dirty=false}function loop(){if(stopped)return;frame=requestAnimationFrame(loop);if(document.hidden)return;controls.update();if(dirty)render()}loop();
 return {sync,setNight,pick,view,zoom,togglePan,render,camera,controls,slotPosition,scene,renderer,dispose(){stopped=true;cancelAnimationFrame(frame);ro.disconnect();controls.dispose();clear(lanterns);clear(avatars);scene.traverse(o=>{o.geometry?.dispose()});markerMat.dispose();mats.forEach(m=>m.dispose());kit.dispose();renderer.dispose()}};
}
