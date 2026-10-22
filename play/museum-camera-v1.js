// Fit every room corner inside the clear portion of the screen, including portrait phones.
export const roomCorners=[-13.2,13.2].flatMap(x=>[0,7.2].flatMap(y=>[-12.2,16.2].map(z=>[x,y,z])));
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const unit=a=>a.map(v=>v/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function overviewPose(width,height){
 const compact=width<700,aspect=width/height,fov=compact?57:48;
 const target=[0,2.2,1.5],direction=unit(compact?[.1,.8,1.5]:[.55,.85,1.5]);
 const right=unit(cross([0,1,0],direction)),up=cross(direction,right);
 const safeX=.86,safeY=compact?.46:.67,tanY=Math.tan(fov*Math.PI/360),tanX=tanY*aspect;
 let distance=0;
 for(const corner of roomCorners){const p=corner.map((v,i)=>v-target[i]),depth=dot(p,direction);distance=Math.max(distance,depth+Math.abs(dot(p,right))/(tanX*safeX),depth+Math.abs(dot(p,up))/(tanY*safeY));}
 distance+=1.5;
 return {position:target.map((v,i)=>v+direction[i]*distance),target,fov,safeX,safeY,distance};
}
