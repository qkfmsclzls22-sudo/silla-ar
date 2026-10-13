function buildEarring(){
 const p=[],n=[],idx=[];const PI=Math.PI;
 function surface(nu,nv,fn){const off=p.length/3;for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){let u=i/nu,v=j/nv,q=fn(u,v),h=0.00001,a=fn(u+h,v),b=fn(u,v+h),s=a.map((x,k)=>x-q[k]),t=b.map((x,k)=>x-q[k]),nn=[s[1]*t[2]-s[2]*t[1],s[2]*t[0]-s[0]*t[2],s[0]*t[1]-s[1]*t[0]],len=Math.hypot(...nn)||1;p.push(...q);n.push(...nn.map(x=>x/len));}for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){let a=off+i*(nv+1)+j,b=a+nv+1;idx.push(a,b,a+1,b,b+1,a+1);}}
 function torus(x,y,z,R,r,tilt=0){surface(40,10,(u,v)=>{let a=u*2*PI,b=v*2*PI,xx=(R+r*Math.cos(b))*Math.cos(a),yy=(R+r*Math.cos(b))*Math.sin(a),zz=r*Math.sin(b);return[x+xx,y+yy*Math.cos(tilt)-zz*Math.sin(tilt),z+yy*Math.sin(tilt)+zz*Math.cos(tilt)]})}
 function bead(x,y,z,r){surface(8,6,(u,v)=>{let a=u*2*PI,b=.001+(1-v)*(PI-.002);return[x+r*Math.sin(b)*Math.cos(a),y+r*Math.cos(b),z+r*Math.sin(b)*Math.sin(a)]})}
 function leaf(x,y,z,w,h,rot){surface(20,12,(u,v)=>{let a=u*2*PI,b=.001+v*(PI-.002),yy=-h*(1-Math.cos(b))*.5,xx=w*Math.sin(b)*(.72+.28*Math.cos(b))*Math.cos(a),zz=.0012*Math.sin(b)*Math.sin(a);return[x+xx*Math.cos(rot)-yy*Math.sin(rot),y+xx*Math.sin(rot)+yy*Math.cos(rot),z+zz]})}
 torus(0,.027,0,.010,.0028);
 torus(0,.011,0,.0038,.00085,.45);
 torus(0,.003,0,.0058,.0011);
 for(let i=0;i<18;i++){let a=i/18*PI*2;bead(.010*Math.cos(a),.027+.010*Math.sin(a),.00265,.0006)}
 for(let i=0;i<5;i++){let x=(i-2)*.004;let y=-.002-Math.abs(i-2)*.001;torus(x,y,0,.0018,.0005);leaf(x,y-.0015,.001,.0031,.015,(i-2)*.18)}
 torus(0,-.019,0,.0023,.00055);
 leaf(0,-.021,.001,.0068,.022,0);
 for(let i=0;i<6;i++)bead(0,-.023-i*.0028,.0023,.00045);
 const arrays=[new Float32Array(p),new Float32Array(n),new Uint32Array(idx)];
 let length=arrays.reduce((s,a)=>s+a.byteLength,0),bin=new Uint8Array(length),off=0,views=[];
 for(const a of arrays){bin.set(new Uint8Array(a.buffer),off);views.push({buffer:0,byteOffset:off,byteLength:a.byteLength});off+=a.byteLength}
 const mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
 p.forEach((x,i)=>{mins[i%3]=Math.min(mins[i%3],x);maxs[i%3]=Math.max(maxs[i%3],x)});
 const gltf={asset:{version:"2.0",generator:"Gyeongju Trip procedural earring prototype v1",copyright:"Original procedural design; inspired by Silla ornaments; not an artifact scan."},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:"Silla-inspired gold earring prototype"}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2,material:0}]}],materials:[{name:"Warm hammered gold",pbrMetallicRoughness:{baseColorFactor:[1,.66,.20,1],metallicFactor:.92,roughnessFactor:.29},doubleSided:true}],buffers:[{byteLength:length}],bufferViews:views,accessors:[{bufferView:0,componentType:5126,count:p.length/3,type:"VEC3",min:mins,max:maxs},{bufferView:1,componentType:5126,count:n.length/3,type:"VEC3"},{bufferView:2,componentType:5125,count:idx.length,type:"SCALAR"}]};
 const json=JSON.stringify(gltf);const jbytes=Array.from(json).map(c=>c.charCodeAt(0)),jlen=Math.ceil(jbytes.length/4)*4;const out=new Uint8Array(12+8+jlen+8+bin.length),dv=new DataView(out.buffer);dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,out.length,true);dv.setUint32(12,jlen,true);dv.setUint32(16,0x4e4f534a,true);out.fill(32,20,20+jlen);out.set(jbytes,20);dv.setUint32(20+jlen,bin.length,true);dv.setUint32(24+jlen,0x004e4942,true);out.set(bin,28+jlen);
 const table="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";let base64="";for(let i=0;i<out.length;i+=3){const a=out[i],b=out[i+1]||0,c=out[i+2]||0,q=(a<<16)|(b<<8)|c;base64+=table[(q>>>18)&63]+table[(q>>>12)&63]+(i+1<out.length?table[(q>>>6)&63]:"=")+(i+2<out.length?table[q&63]:"=")}
 if(idx.some(i=>i>=p.length/3)||p.some(x=>!Number.isFinite(x)))throw Error("Invalid mesh");
 return {base64,bytes:out.length,vertices:p.length/3,triangles:idx.length/3,bounds:[mins,maxs]};
}
const fs=require('fs'); fs.writeFileSync('earring-prototype-v1.glb',Buffer.from(buildEarring().base64,'base64'));
