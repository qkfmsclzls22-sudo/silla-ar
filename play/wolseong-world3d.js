import * as T from './vendor/three-r169.js';
export const VERSION=3, LIMIT=200, STEP=2;
export const bounds={minX:-56,maxX:56,minZ:-33,maxZ:59};
const arc=u=>Math.sqrt(Math.max(0,1-u*u));
export const north=x=>-10+24*arc(x/32);
export const south=x=>-10+10*(1-(x/32)**2);
const ranges=[[-.97,-.64],[-.59,-.23],[-.18,.16],[.23,.59],[.64,.97]];
export function waterAt(x,z){return Math.abs(x)<31&&ranges.some(([a,b])=>x/32>a&&x/32<b)&&Math.abs(z-north(x)-4.8)<1.55}
export function hillDistance(x,z){return Math.abs(x)<32?Math.min(z-south(x),north(x)-z,(32-Math.abs(x))*.7):-1}
export function heightAt(x,z){
  if(z< -23&&z> -28)return -.45;
  if(waterAt(x,z))return -.42;
  const d=Math.max(0,Math.min(1,hillDistance(x,z)/2.8));
  return 4.5*d*d*(3-2*d);
}
export function surfaceAt(x,z){
  if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return 'outside';
  if(waterAt(x,z))return 'moat';
  if(z< -23&&z> -28)return 'river';
  const h=heightAt(x,z);
  return h>4.4?'hill':h>.08?'slope':'plain';
}
export function canPlace(id,x,z){const s=surfaceAt(x,z);return s==='plain'||s==='hill'||(id==='lotus'&&s==='moat')}
export function groundY(id,x,z){return (id==='lotus'&&waterAt(x,z)) ? 0.04 : heightAt(x,z)}
export const snap=n=>Math.round(n/STEP)*STEP;
export function defaultPieces(){return [
  {id:'palace',x:0,z:6,rotation:0},{id:'gate',x:12,z:6,rotation:0},
  {id:'pine',x:-18,z:2,rotation:0},{id:'pine',x:22,z:0,rotation:0},
  {id:'house',x:-20,z:34,rotation:0},{id:'house',x:-12,z:34,rotation:0},
  {id:'pagoda',x:18,z:34,rotation:0},{id:'observatory',x:32,z:28,rotation:0},
  {id:'lotus',x:-10,z:18,rotation:0}
]}
export function restorePieces(stored,defs){
  if(!Array.isArray(stored?.pieces))return defaultPieces();
  const byId=Object.fromEntries(defs.map(d=>[d.id,d]));const result=[];
  const available=[];for(let x=-54;x<=54;x+=2)for(let z=-20;z<=58;z+=2)if(['hill','plain'].includes(surfaceAt(x,z)))available.push({x,z});
  const fits=(id,x,z)=>canPlace(id,x,z)&&!result.some(o=>!(id==='lotus'&&o.id==='pond')&&!(id==='pond'&&o.id==='lotus')&&Math.hypot(o.x-x,o.z-z)<(byId[id].r+byId[o.id].r)*.74);
  for(const old of stored.pieces.slice(0,LIMIT)){
    if(!byId[old.id])continue;
    let x,z;
    if(stored.terrainVersion===VERSION){x=Number(old.x);z=Number(old.z)}
    else if(Number.isFinite(old.i)&&Number.isFinite(old.j)){
      if(stored.terrainVersion===2){
        x=(old.i-16)*2;
        const u=Math.max(-.98,Math.min(.98,x/32));
        const oldSouth=260+70*(1-u*u)+8*Math.sin(u*3)*arc(u);
        const oldNorth=260+205*arc(u)+8*Math.sin(u*3)*arc(u);
        const fraction=Math.max(.22,Math.min(.78,(260+old.j*16-oldSouth)/(oldNorth-oldSouth)));
        z=old.id==='lotus'&&260+old.j*16>oldNorth+50?north(x)+4.8:south(x)+(north(x)-south(x))*fraction;
      }else{x=(old.i-old.j)*1.45;z=south(x)+(north(x)-south(x))*(.25+(old.i+old.j)/72)}
    }else continue;
    if(!Number.isFinite(x)||!Number.isFinite(z))continue;
    x=snap(Math.max(-54,Math.min(54,x)));z=snap(Math.max(-20,Math.min(58,z)));
    if(!fits(old.id,x,z)){
      const p=available.filter(p=>fits(old.id,p.x,p.z)).sort((a,b)=>(a.x-x)**2+(a.z-z)**2-(b.x-x)**2-(b.z-z)**2)[0];
      if(!p)continue;x=p.x;z=p.z;
    }
    result.push({id:old.id,x,z,rotation:stored.terrainVersion===VERSION&&Number.isFinite(old.rotation)?old.rotation:(old.flip?Math.PI:0)});
  }
  return result;
}
function ribbon(a,b,fn,width,y,material){
  const v=[],ind=[],segments=90;
  for(let i=0;i<=segments;i++){const x=a+(b-a)*i/segments,z=fn(x);v.push(x,y,z-width,x,y,z+width);if(i<segments){const n=i*2;ind.push(n,n+2,n+1,n+1,n+2,n+3)}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ind);g.computeVertexNormals();return new T.Mesh(g,material);
}
export function makeWorld(scene){
  const g=new T.PlaneGeometry(120,102,180,153);g.rotateX(-Math.PI/2);g.translate(0,0,13);
  const pos=g.attributes.position,colors=[],base=new T.Color();
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i),h=heightAt(x,z);pos.setY(i,h);
    const noise=(Math.sin(x*2.7+z*4.3)+Math.cos(z*3.1-x))/2;
    base.set(h>4.3?'#a9bd76':h>.1?'#80945d':'#bacb92');base.multiplyScalar(1+noise*.035);colors.push(base.r,base.g,base.b);
  }
  g.computeVertexNormals();g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const ground=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));ground.receiveShadow=true;scene.add(ground);
  const backdrop=new T.Mesh(new T.PlaneGeometry(1800,1800),new T.MeshStandardMaterial({color:'#baca98',roughness:1}));backdrop.rotation.x=-Math.PI/2;backdrop.position.y=-.55;scene.add(backdrop);
  const waterMaterial=new T.MeshStandardMaterial({color:'#69b8b2',roughness:.35,metalness:.08,side:T.DoubleSide});
  const bankMaterial=new T.MeshStandardMaterial({color:'#d8c7a1',roughness:1,side:T.DoubleSide});
  for(const [a,b] of ranges){scene.add(ribbon(a*32,b*32,x=>north(x)+4.8,2.0,-.04,bankMaterial));scene.add(ribbon(a*32,b*32,x=>north(x)+4.8,1.5,.01,waterMaterial))}
  scene.add(ribbon(-150,150,()=>-25.5,2.5,-.06,waterMaterial));
  const pathMat=new T.MeshStandardMaterial({color:'#d9cbb0',roughness:1,side:T.DoubleSide});
  scene.add(ribbon(-31,31,x=>north(x)+8.5,.6,.015,pathMat));
  const approach=new T.Mesh(new T.PlaneGeometry(1.8,28),pathMat);approach.rotation.x=-Math.PI/2;approach.position.set(6.3,.018,35);scene.add(approach);
  // Sparse cell guides follow the real surface; toggled by the visitor.
  const points=[];
  for(let x=-54;x<=54;x+=2)for(let z=-20;z<=58;z+=2)if(['plain','hill'].includes(surfaceAt(x,z))){const y=heightAt(x,z)+.04;points.push(x-.17,y,z,x+.17,y,z,x,y,z-.17,x,y,z+.17)}
  const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(points,3));const grid=new T.LineSegments(gg,new T.LineBasicMaterial({color:'#5d7852',transparent:true,opacity:.28}));grid.visible=false;scene.add(grid);
  const lampPositions=[];for(let x=-28;x<=28;x+=4)lampPositions.push([x,north(x)+9.1]);
  const poleMat=new T.MeshStandardMaterial({color:'#74634c',roughness:1});
  const bulbMat=new T.MeshStandardMaterial({color:'#f6d391',roughness:.7});
  const posts=new T.InstancedMesh(new T.CylinderGeometry(.08,.10,1.2,6),poleMat,lampPositions.length);
  const bulbs=new T.InstancedMesh(new T.SphereGeometry(.22,8,6),bulbMat,lampPositions.length);
  const lm=new T.Matrix4();lampPositions.forEach(([x,z],i)=>{posts.setMatrixAt(i,lm.makeTranslation(x,.6,z));bulbs.setMatrixAt(i,lm.makeTranslation(x,1.25,z))});scene.add(posts,bulbs);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;const gc=glowCanvas.getContext('2d');const gradient=gc.createRadialGradient(32,32,1,32,32,32);gradient.addColorStop(0,'#ffe0a0c0');gradient.addColorStop(.2,'#ffc36350');gradient.addColorStop(1,'#ffc36300');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);
  const glowMat=new T.SpriteMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false});
  const glows=new T.Group();lampPositions.forEach(([x,z])=>{const glow=new T.Sprite(glowMat);glow.position.set(x,1.2,z);glow.scale.set(3,3,3);glows.add(glow)});glows.visible=false;scene.add(glows);
  return {ground,grid,waterMaterial,setLampNight(night){glows.visible=night;bulbMat.emissive.set(night?'#ffc773':'#000000');bulbMat.emissiveIntensity=night?2:0}};
}
