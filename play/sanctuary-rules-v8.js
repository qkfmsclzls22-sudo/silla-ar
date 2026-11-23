// Pure rules for the shared Bulguksa sanctuary room (v8). Identity and rate limits are enforced by the room host.
export const meta={game:'경주트립 · 불국사 메타버스 소원마당',minPlayers:1,maxPlayers:10};
export const COLORS=['coral','gold','jade','blue','violet','cream'];
export const KINDS=['monk','traveler'];
export const POSES=['stand','hapjang','bow','sit'];
export const SLOT_COUNT=40;
export const BOUNDS={minX:-30,maxX:30,minZ:-21,maxZ:32};
const textOK=(v,n)=>typeof v==='string'&&v.trim().length>0&&Array.from(v).length<=n&&!/[<>\u0000-\u001f]/.test(v);
const num=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
export function setup(){return{version:8,seq:0,guests:{},lanterns:[]}}
export function validateAction(s,id,a){
 const no=error=>({ok:false,error});
 if(!a||typeof a!=='object'||Array.isArray(a))return no('올바른 동작이 아니에요.');
 if(a.type==='profile')return textOK(a.name,12)&&COLORS.includes(a.color)&&KINDS.includes(a.kind)?{ok:true}:no('별명은 12자 이내로 적어 주세요.');
 if(!s.guests[id])return no('먼저 별명을 정해 주세요.');
 if(a.type==='move')return num(a.x,BOUNDS.minX,BOUNDS.maxX)&&num(a.z,BOUNDS.minZ,BOUNDS.maxZ)?{ok:true}:no('마당 안을 눌러 주세요.');
 if(a.type==='pose')return POSES.includes(a.pose)?{ok:true}:no('지원하지 않는 동작이에요.');
 if(a.type==='lantern'){
  if(!textOK(a.text,40)||!COLORS.includes(a.color))return no('소원은 40자 이내로 적어 주세요.');
  if(!Number.isInteger(a.slot)||a.slot<0||a.slot>=SLOT_COUNT)return no('등을 걸 자리를 골라 주세요.');
  if(s.lanterns.some(l=>l.slot===a.slot&&l.owner!==id))return no('다른 분이 먼저 단 자리예요. 다른 등을 골라 주세요.');
  return{ok:true};
 }
 if(a.type==='remove')return s.lanterns.some(l=>l.owner===id)?{ok:true}:no('아직 단 연등이 없어요.');
 return no('지원하지 않는 동작이에요.');
}
export function applyAction(s,id,a){
 const n={...s,seq:s.seq+1},g=s.guests[id];
 if(a.type==='profile'){const guest={x:0,z:26,pose:'stand',poseSeq:0,bows:0,...g,name:a.name.trim(),color:a.color,kind:a.kind};n.guests=Object.fromEntries(Object.entries({...s.guests,[id]:guest}).slice(-60))}
 if(a.type==='move')n.guests={...s.guests,[id]:{...g,x:a.x,z:a.z,pose:'stand'}};
 if(a.type==='pose')n.guests={...s.guests,[id]:{...g,pose:a.pose,poseSeq:(g.poseSeq||0)+1,bows:Math.min(99999,(g.bows||0)+(a.pose==='bow'?1:0))}};
 if(a.type==='lantern')n.lanterns=[...s.lanterns.filter(l=>l.owner!==id),{id:n.seq,owner:id,name:g.name,text:a.text.trim(),color:a.color,slot:a.slot}];
 if(a.type==='remove')n.lanterns=s.lanterns.filter(l=>l.owner!==id);
 return n;
}
export function isGameOver(){return{over:false}}
export function viewFor(s,id){return{version:s.version,seq:s.seq,guests:s.guests,lanterns:s.lanterns.map(l=>({...l,mine:l.owner===id}))}}
