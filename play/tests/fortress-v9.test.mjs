// node play/tests/fortress-v9.test.mjs — 월성 쌓기·수성 규칙 시험
import assert from 'node:assert/strict';
import * as R from '../fortress-rules-v9.js';
const bp=R.blueprint();
assert.ok(R.planCost(bp)<=R.levelInfo(1).budget,'설계도는 1레벨 재료로 지을 수 있어야 한다');
assert.equal(R.blueprintProgress(bp,bp),1);
const p=R.emptyPlan();
assert.equal(R.whyNot(p,10,9,'earth'),'왕궁 자리예요. 왕궁을 둘러싸서 지켜 주세요.');
assert.ok(R.whyNot(p,3,15,'earth'),'남천 위에는 못 짓는다');
R.place(p,5,8,'earth');R.place(p,5,8,'earth');R.place(p,5,8,'tower');
assert.ok(R.whyNot(p,5,8,'earth'),'망루 위에는 못 쌓는다');
assert.equal(R.removeTop(p,5,8),'tower');
assert.ok(R.whyNot(p,1,1,'crossbow',1),'쇠뇌는 2레벨부터');
// 빈 성은 1레벨에서 지고, 설계도+망루는 이긴다
assert.equal(R.simulate(R.emptyPlan(),1,7).over,'lost');
const strong=R.clonePlan(bp);for(const [x,z] of [[10,6],[6,7],[15,7],[3,9],[18,9]])if(!R.whyNot(strong,x,z,'tower'))R.place(strong,x,z,'tower');
assert.equal(R.simulate(strong,1,7).over,'won');
// 같은 성이라도 레벨이 높으면 더 일찍 무너진다
assert.equal(R.simulate(strong,6,7).over,'lost');
console.log('fortress-v9 rules ok');
