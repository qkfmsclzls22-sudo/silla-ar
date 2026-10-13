import * as T from './vendor/three-r169.js';
import {makeWorld,groundY,STEP} from './wolseong-world3d.js';
import {createTemplates,templateGroup,definitions} from './wolseong-models3d.js';
export function createStage(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 const scene=new T.Scene();scene.background=new T.Color('#dce8dc');scene.fog=new T.Fog('#dce8dc',145,300);
 const camera=new T.PerspectiveCamera(42,1,.2,450);camera.position.set(53,69,101);
 const controls=new T.OrbitControls(camera,canvas);controls.target.set(0,1,16);controls.minDistance=13;controls.maxDistance=185;controls.maxPolarAngle=Math.PI*.46;controls.minPolarAngle=.12;controls.enableDamping=true;controls.dampingFactor=.12;controls.rotateSpeed=.65;controls.zoomSpeed=.8;controls.panSpeed=.85;controls.screenSpacePanning=false;controls.maxTargetRadius=65;controls.cursor.set(0,1,13);controls.update();
 const hemi=new T.HemisphereLight('#fff7dc','#70856b',2.7);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff1cd',3.2);sun.position.set(-45,80,35);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-75,right:75,top:75,bottom:-75,near:1,far:220});sun.shadow.bias=-.0003;sun.shadow.normalBias=.05;scene.add(sun);
 const {ground,grid,waterMaterial,setLampNight}=makeWorld(scene);const kit=createTemplates();const placed=new T.Group();scene.add(placed);
 const ray=new T.Raycaster(),mouse=new T.Vector2(),matrix=new T.Matrix4(),euler=new T.Euler(),quat=new T.Quaternion(),scale=new T.Vector3(1,1,1);
 const ring=new T.Mesh(new T.TorusGeometry(1,.06,6,36),new T.MeshBasicMaterial({color:'#fff2a6',depthTest:false}));ring.rotation.x=Math.PI/2;ring.renderOrder=5;ring.visible=false;scene.add(ring);
 const selectedRing=ring.clone();selectedRing.material=ring.material.clone();selectedRing.material.color.set('#ffdd72');selectedRing.visible=false;scene.add(selectedRing);
 let pieces=[],dirty=true,frame,stopped=false,ghost=null,ghostId=null,sized=false;
 const controlsChanged=()=>{dirty=true};controls.addEventListener('change',controlsChanged);
 function resize(){const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();if(!sized){view();sized=true}dirty=true}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function clearInstances(){for(const m of [...placed.children]){placed.remove(m);m.dispose()}}
 function setPieces(next){
  pieces=next;clearInstances();
  for(const d of definitions){const indices=pieces.map((p,i)=>p.id===d.id?i:-1).filter(i=>i>=0);if(!indices.length)continue;
   for(const p of kit.templates[d.id]){const inst=new T.InstancedMesh(p.geometry,p.material,indices.length);inst.userData.indices=indices;inst.castShadow=true;inst.receiveShadow=true;
    indices.forEach((index,k)=>{const o=pieces[index];quat.setFromEuler(euler.set(0,o.rotation||0,0));matrix.compose(new T.Vector3(o.x,groundY(o.id,o.x,o.z),o.z),quat,scale);inst.setMatrixAt(k,matrix)});
    inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();placed.add(inst);
   }
  }
  renderer.shadowMap.needsUpdate=true;dirty=true;
 }
 function point(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera)}
 function pickTerrain(e){point(e);return ray.intersectObject(ground,false)[0]?.point||null}
 function pickObject(e){point(e);const h=ray.intersectObjects(placed.children,false)[0];return h?h.object.userData.indices[h.instanceId]:-1}
 function disposeGhost(){if(!ghost)return;scene.remove(ghost);ghost.children.forEach(m=>m.material.dispose());ghost=null}
 function preview(id,p,valid){
  if(!p){if(ghost)ghost.visible=false;ring.visible=false;dirty=true;return}
  if(id!==ghostId||!ghost){disposeGhost();ghostId=id;ghost=templateGroup(kit.templates[id]);ghost.children.forEach(m=>{m.material=m.material.clone();m.material.transparent=true;m.material.opacity=.38;m.material.depthWrite=false;m.castShadow=false});scene.add(ghost)}
  const y=groundY(id,p.x,p.z);ghost.position.set(p.x,y,p.z);ghost.visible=true;
  ring.position.set(p.x,y+.08,p.z);const r=definitions.find(d=>d.id===id).r;ring.scale.setScalar(r);ring.material.color.set(valid?'#fbef9c':'#e17462');ring.visible=true;dirty=true;
 }
 function select(index){const p=pieces[index];selectedRing.visible=!!p;if(p){selectedRing.position.set(p.x,groundY(p.id,p.x,p.z)+.1,p.z);selectedRing.scale.setScalar(definitions.find(d=>d.id===p.id).r+ .15)}dirty=true}
 function setNight(night){
  const bg=night?'#152b42':'#dce8dc';scene.background.set(bg);scene.fog.color.set(bg);hemi.intensity=night?.95:2.7;sun.intensity=night?.7:3.2;sun.color.set(night?'#c1d8ff':'#fff1cd');renderer.toneMappingExposure=night?.95:1.15;
  for(const [color,m] of kit.materials){m.emissive.set(color==='#ffe8ac'&&night?'#ffc662':'#000000');m.emissiveIntensity=night?1.2:0}
  setLampNight(night);waterMaterial.color.set(night?'#397d88':'#69b8b2');renderer.shadowMap.needsUpdate=true;dirty=true;
 }
 function view(which='all'){
  const views={all:[[53,69,101],[0,1,16]],plain:[[37,39,79],[0,0,33]],top:[[0,112,16],[0,0,15.99]]};const [pos,target]=views[which]||views.all;
  controls.enableDamping=false;controls.update();camera.position.set(...pos);controls.target.set(...target);if(which==='all'){const f=Math.max(1,1.12/camera.aspect);camera.position.sub(controls.target).multiplyScalar(f).add(controls.target)}controls.update();controls.enableDamping=true;dirty=true;
 }
 function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,offset.length()*factor)));camera.position.copy(controls.target).add(offset);controls.update();dirty=true}
 function cameraMode(pan){controls.mouseButtons.LEFT=pan?T.MOUSE.PAN:T.MOUSE.ROTATE;controls.touches.ONE=pan?T.TOUCH.PAN:T.TOUCH.ROTATE}
 function render(){renderer.render(scene,camera);dirty=false}
 function thumbnails(){
  const result={};renderer.setPixelRatio(1);renderer.setSize(128,112,false);const s=new T.Scene();s.background=new T.Color('#fbf9f0');s.add(new T.HemisphereLight('#fff6df','#8e9a85',3));const l=new T.DirectionalLight('#fff4d8',3);l.position.set(-6,10,8);s.add(l);const cam=new T.PerspectiveCamera(33,128/112,.1,200);
  const shadows=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;
  for(const d of definitions){const group=templateGroup(kit.templates[d.id]);s.add(group);const b=new T.Box3().setFromObject(group),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());const extent=Math.max(size.y,size.x*.9,size.z*.9);cam.position.copy(center).add(new T.Vector3(1,.75,1.25).normalize().multiplyScalar(extent*2.6));cam.lookAt(center);renderer.render(s,cam);result[d.id]=canvas.toDataURL('image/webp',.78);s.remove(group)}
  renderer.shadowMap.enabled=shadows;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));resize();renderer.shadowMap.needsUpdate=true;return result;
 }
 function loop(){if(stopped)return;frame=requestAnimationFrame(loop);if(document.hidden)return;controls.update();if(dirty)render()}
 frame=requestAnimationFrame(loop);
 const onLost=e=>{e.preventDefault();canvas.dispatchEvent(new CustomEvent('stage-lost'));};canvas.addEventListener('webglcontextlost',onLost);
 const onRestored=()=>{renderer.shadowMap.needsUpdate=true;dirty=true};canvas.addEventListener('webglcontextrestored',onRestored);
 return {canvas,renderer,scene,camera,controls,pickTerrain,pickObject,setPieces,preview,select,setNight,view,zoom,cameraMode,thumbnails,
  toggleGrid(){grid.visible=!grid.visible;dirty=true;return grid.visible},render,
  diagnostics(){return {camera:camera.position.toArray(),target:controls.target.toArray(),pieces:pieces.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}},
  dispose(){stopped=true;cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('change',controlsChanged);controls.dispose();clearInstances();disposeGhost();kit.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const a=Array.isArray(o.material)?o.material:[o.material];a.forEach(m=>m.dispose())}});renderer.dispose();canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored)}
 };
}
