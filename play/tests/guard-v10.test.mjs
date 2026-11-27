// node play/tests/guard-v10.test.mjs — 월성 수호대 규칙 시험
import assert from 'node:assert/strict';
import * as G from '../guard-rules-v10.js';
const st=G.newGame(42);
assert.equal(st.gold,100);
const id=G.summon(st);assert.ok(G.UNITS[id],'소환하면 병사가 나온다');assert.equal(st.gold,80);
// 같은 일반 병사 둘 → 희귀
st.slots[0]={id:'archer',cd:0};st.slots[1]={id:'archer',cd:0};
assert.ok(G.canMerge(st,0,1));const up=G.merge(st,0,1);assert.equal(G.UNITS[up].g,2);assert.equal(st.slots[0],null);
// 영웅은 3명 필요
st.slots.fill(null);st.slots[0]={id:'general',cd:0};st.slots[1]={id:'general',cd:0};
assert.equal(G.canMerge(st,0,1),false);st.slots[2]={id:'general',cd:0};assert.ok(G.canMerge(st,0,1));assert.equal(G.UNITS[G.merge(st,0,1)].g,4);
// 전설 3명 → 왕, 왕은 더 못 합침
st.slots.fill(null);for(let i=0;i<3;i++)st.slots[i]={id:'yusin',cd:0};const king=G.merge(st,0,1);assert.equal(G.UNITS[king].g,5);
st.slots[5]={id:king,cd:0};assert.equal(G.canMerge(st,5,st.slots.findIndex(s=>s&&s.id===king&&s!==st.slots[5])),false);
// 조합서
st.slots.fill(null);['gukseon','general','hwarang'].forEach((k,i)=>st.slots[i]={id:k,cd:0});assert.ok(G.craft(st,'yusin'));assert.ok(st.slots.some(s=>s&&s.id==='yusin'));
// 해자: 적이 느려진다
const a=G.newGame(1),b=G.newGame(1);a.slots.fill(null);b.slots.fill(null);
for(const s of[a,b]){while(!s.enemies.length)G.step(s,.1)}
G.useSkill(b,'moat');for(let i=0;i<20;i++){G.step(a,.1);G.step(b,.1)}
assert.ok(b.enemies[0].s<a.enemies[0].s,'해자를 쓰면 적이 덜 간다');
// 아무것도 안 하면 결국 진다
const idle=G.newGame(3);let t=0;while(!idle.over&&t<2000){if(idle.pendingRelic)G.pickRelic(idle,idle.pendingRelic[0]);G.step(idle,.1);t+=.1}assert.ok(idle.over);
console.log('guard-v10 rules ok');
