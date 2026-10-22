import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {artifacts,artifactById,normalizeState,recommendedIds,exhibitionSlots} from '../../museum-data-v3.js';
import {overviewPose,roomCorners} from '../../museum-camera-v1.js';
import {PerspectiveCamera,Vector3} from '../../vendor/three-full-r169.js';
assert.equal(artifacts.length,20);
assert.equal(new Set(artifacts.map(a=>a.id)).size,20);
for(const a of artifacts){
 for(const path of [a.model,a.thumb])assert.ok(existsSync(new URL(path,new URL('../../',import.meta.url))),`${a.id}: missing ${path}`);
 for(const field of ['name','intro','value','story','look','source','storySource','note'])assert.ok(a[field],`${a.id}: missing ${field}`);
 const b=readFileSync(new URL(a.model,new URL('../../',import.meta.url)));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);
}
assert.equal(recommendedIds.length,exhibitionSlots.length);
assert.ok(recommendedIds.every(id=>artifactById[id]));
const old={title:'내 전시',theme:'warm',cases:[{id:'wing',rotation:45,note:'소중한 감상'},null,{id:'pensive',rotation:0,note:''}]};
assert.deepEqual(normalizeState(old).cases.slice(0,3),old.cases);
const results=[];
for(const [width,height] of [[1920,1080],[1280,720],[768,1024],[390,844],[320,568],[844,390]]){
 const pose=overviewPose(width,height),camera=new PerspectiveCamera(pose.fov,width/height,.1,260);
 camera.position.set(...pose.position);camera.lookAt(new Vector3(...pose.target));camera.updateMatrixWorld();
 for(const corner of roomCorners){const p=new Vector3(...corner).project(camera);assert.ok(Math.abs(p.x)<pose.safeX&&Math.abs(p.y)<pose.safeY&&p.z<1,`${width}x${height}: room clipped`);}
 results.push({width,height,distance:Number(pose.distance.toFixed(2))});
}
console.log(JSON.stringify({artifacts:artifacts.length,slots:exhibitionSlots.length,savedExhibitionPreserved:true,fullRoomProjection:results},null,2));
