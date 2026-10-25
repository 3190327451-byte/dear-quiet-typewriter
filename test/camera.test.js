import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {cameraStops,cameraAt,zoomAfterWheel} from '../src/camera.js';

test('wheel direction, pixel/line/page input and repeated limit hits stay bounded',()=>{
 assert.ok(zoomAfterWheel(.5,-100)>.5);assert.ok(zoomAfterWheel(.5,100)<.5);
 assert.equal(zoomAfterWheel(.5,1,1),zoomAfterWheel(.5,16));
 assert.equal(zoomAfterWheel(.5,1,2,120),zoomAfterWheel(.5,120));
 let zoom=0;for(let i=0;i<300;i++)zoom=zoomAfterWheel(zoom,-1000);assert.equal(zoom,1);
 for(let i=0;i<300;i++)zoom=zoomAfterWheel(zoom,1000);assert.equal(zoom,0);
});
test('zoom keeps the original landscape endpoints and interpolates between them',()=>{
 const stops=cameraStops(1280,720),near=cameraAt(stops,2),far=cameraAt(stops,-1),middle=cameraAt(stops,.5);
 assert.deepEqual(far.position.toArray(),[0,10.5,18.5]);assert.ok(near.position.equals(stops.near.position));
 assert.ok(middle.position.equals(stops.far.position.clone().lerp(stops.near.position,.5)));
});
test('near stop contains full keyboard and writing line on wide and narrow screens',()=>{
 for(const [width,height]of [[1280,720],[844,390],[390,844]]){
  const {near}=cameraStops(width,height),camera=new PerspectiveCamera(near.fov,width/height,.1,100);camera.position.copy(near.position);camera.lookAt(near.look);camera.updateMatrixWorld();
  for(const [x,y,z]of [[-3.25,1.47,.58],[3.25,1.47,.58],[-3.25,.98,3],[3.25,.98,3],[0,.94,3.4],[0,2.8,-1.55]]){
   const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${width}x${height}: ${x},${y},${z}`);
  }
 }
});
test('typing composition anchors the complete keyboard low and gives more height to paper',()=>{
 for(const [width,height]of [[1280,720],[844,390],[390,844]]){
  const {near}=cameraStops(width,height),camera=new PerspectiveCamera(near.fov,width/height,.1,100);camera.position.copy(near.position);camera.lookAt(near.look);camera.updateMatrixWorld();
  const edges=[[-3.3,.89,3.24],[3.3,.89,3.24],[-2.1,.85,3.42],[2.1,.85,3.42]].map(p=>new Vector3(...p).project(camera));
  const lowest=Math.min(...edges.map(p=>p.y));assert.ok(lowest>=-.94&&lowest<=-.90,'lowest key should leave only a small lower margin');
  assert.ok(edges.every(p=>Math.abs(p.x)<.96&&p.y>-.96));
  if(width>height)assert.ok(new Vector3(0,3.1,-1.7).project(camera).y<.5,'paper must have more space above the writing line');
 }
});
