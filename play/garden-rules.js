// Six pure rules functions. Identity and rate limits are enforced by Room.
export const meta = { game: "경주트립 · 소원의 마당", minPlayers: 1, maxPlayers: 10 };
const COLORS = ["coral","gold","jade","blue","violet","cream"];
const textOK = (v,n) => typeof v === "string" && v.trim().length > 0 && v.length <= n && !/[<>\u0000-\u001f]/.test(v);
export function setup() { return { version:1, seq:0, guests:{}, lanterns:[], chat:[] }; }
export function validateAction(s,id,a) {
  const no = error => ({ok:false,error});
  if (!a || typeof a !== "object" || Array.isArray(a)) return no("올바른 동작이 아니에요.");
  if (a.type === "profile") return textOK(a.name,12) && COLORS.includes(a.color) ? {ok:true} : no("별명은 12자 이내로 적어주세요.");
  if (!s.guests[id]) return no("먼저 별명을 정해주세요.");
  if (a.type === "move") return Number.isFinite(a.x) && Number.isFinite(a.y) && a.x >= .08 && a.x <= .92 && a.y >= .55 && a.y <= .94 ? {ok:true} : no("마당 안을 눌러주세요.");
  if (a.type === "chat") return textOK(a.text,80) ? {ok:true} : no("대화는 80자 이내로 적어주세요.");
  if (a.type === "lantern") {
    if (!textOK(a.text,60) || !COLORS.includes(a.color)) return no("소원은 60자 이내로 적어주세요.");
    if (!Number.isInteger(a.slot) || a.slot<0 || a.slot>=40) return no("등을 걸 자리를 골라주세요.");
    if (s.lanterns.some(l=>l.slot===a.slot && l.owner!==id)) return no("다른 등과 겹쳤어요. 다른 자리를 골라주세요.");
    return {ok:true};
  }
  if (a.type === "remove") return s.lanterns.some(l=>l.owner===id) ? {ok:true} : no("아직 걸어둔 등이 없어요.");
  return no("지원하지 않는 동작이에요.");
}
export function applyAction(s,id,a) {
  const n={...s,seq:s.seq+1};
  if(a.type==="profile") {
    const guest={...s.guests[id],name:a.name.trim(),color:a.color,x:s.guests[id]?.x??.5,y:s.guests[id]?.y??.82};
    const entries=Object.entries({...s.guests,[id]:guest});
    n.guests=Object.fromEntries(entries.slice(-100));
  }
  if(a.type==="move") n.guests={...s.guests,[id]:{...s.guests[id],x:a.x,y:a.y}};
  if(a.type==="chat") n.chat=[...s.chat,{id:n.seq,name:s.guests[id].name,color:s.guests[id].color,text:a.text.trim()}].slice(-30);
  if(a.type==="lantern") n.lanterns=[...s.lanterns.filter(l=>l.owner!==id),{id:n.seq,owner:id,name:s.guests[id].name,text:a.text.trim(),color:a.color,slot:a.slot}];
  if(a.type==="remove") n.lanterns=s.lanterns.filter(l=>l.owner!==id);
  return n;
}
export function isGameOver() { return {over:false}; }
export function viewFor(s,id) {
  return {version:s.version,seq:s.seq,guests:s.guests,lanterns:s.lanterns.map(l=>({...l,mine:l.owner===id})),chat:s.chat};
}
