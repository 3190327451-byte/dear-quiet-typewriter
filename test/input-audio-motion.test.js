import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,Euler,PerspectiveCamera} from 'three';
import {keyboardToken} from '../src/keyboard.js';
import {Ambience} from '../src/ambience.js';
import {BALL_GLYPHS,BALL_COLUMNS,BALL_ROWS,typeballPose,typeballStroke,BALL_CARRIER_HEIGHT} from '../src/typeball.js';
import {cameraStops,cameraAt} from '../src/camera.js';
import {withdrawalDistance} from '../src/paper-motion.js';

test('physical Latin keys and return survive Process/229 and composition',()=>{
 for(const flag of [{key:'Process',keyCode:229},{key:'Unidentified'},{key:'a',isComposing:true}]){
  assert.equal(keyboardToken({...flag,code:'KeyA'}),'a');
  assert.equal(keyboardToken({...flag,code:'KeyA',shiftKey:true}),'A');
  assert.equal(keyboardToken({...flag,code:'Enter'}),'Enter');
  assert.equal(keyboardToken({...flag,code:'NumpadEnter'}),'Enter');
  assert.equal(keyboardToken({...flag,code:'Backspace'}),'Backspace');
 }
 assert.equal(keyboardToken({key:'Process',code:'KeyA',getModifierState:()=>true}),'A');
 assert.equal(keyboardToken({key:'Process',code:'KeyA',shiftKey:true,getModifierState:()=>true}),'a');
 assert.equal(keyboardToken({key:'Process',code:'Digit1',shiftKey:true}),'!');
 assert.equal(keyboardToken({key:'Process',code:'Space'}),' ');
});
test('ordinary layouts keep their actual character and shortcuts do not type',()=>{
 assert.equal(keyboardToken({key:'z',code:'KeyY'}),'z');
 assert.equal(keyboardToken({key:'é',code:'Digit2'}),'é');
 for(const modifier of ['ctrlKey','metaKey','altKey'])assert.equal(keyboardToken({key:'a',code:'KeyA',[modifier]:true}),null);
 for(const key of ['Tab','ArrowUp','Shift','F1'])assert.equal(keyboardToken({key}),null);
});

function audioHarness(){
 const param=()=>({value:1,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){}});
 const active=new Set(),sources=[],filters=[];let max=0;
 const node=()=>({connect(){return this;},disconnect(){this.disconnected=true;}});
 const c={currentTime:0,createGain:()=>({...node(),gain:param()}),createBufferSource(){const s={...node(),start(){active.add(s);max=Math.max(max,active.size);},stop(){s.stopping=true;},end(){active.delete(s);s.onended?.();}};sources.push(s);return s;},createBiquadFilter(){const f={...node(),frequency:param(),gain:param(),Q:param()};filters.push(f);return f;},createDynamicsCompressor:()=>({...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()})};
 const buffers=new Map([['summer',{duration:22}],['winter',{duration:22}]]),ambience=new Ambience(c,node(),buffers);
 return {ambience,sources,filters,buffers,active,get max(){return max;}};
}
test('scene sounds are serial, including rapid changes and mute during transition',()=>{
 const h=audioHarness(),a=h.ambience;a.set('summer');assert.equal(h.sources.length,1);
 a.set('winter');assert.ok(h.sources[0].stopping);assert.equal(h.sources.length,1);
 a.set('summer');a.set('winter');assert.equal(h.sources.length,1);
 h.sources[0].end();assert.equal(h.sources.length,2);assert.equal(a.current.name,'winter');
 a.set('summer');a.set('summer',false);h.sources[1].end();assert.equal(a.current,null);assert.equal(h.active.size,0);
 a.set('winter');assert.equal(a.current.name,'winter');assert.equal(h.max,1);assert.ok(h.sources[0].disconnected);
});
test('late ambient decoding starts only the latest requested scene',()=>{
 const h=audioHarness(),a=h.ambience;h.buffers.clear();a.set('summer');a.set('winter');
 h.buffers.set('summer',{duration:22});a.sync();assert.equal(h.sources.length,0);
 h.buffers.set('winter',{duration:22});a.sync();assert.equal(a.current.name,'winter');assert.equal(h.sources.length,1);
 assert.ok(h.filters.find(f=>f.type==='highshelf').gain.value<0);assert.equal(h.filters.find(f=>f.type==='lowpass').frequency.value,3800);
});
test('each typeball glyph faces the paper after selection, including case changes',()=>{
 assert.equal(BALL_GLYPHS.length,BALL_COLUMNS*BALL_ROWS);assert.equal(new Set(BALL_GLYPHS).size,BALL_GLYPHS.length);
 for(const ch of BALL_GLYPHS){const p=typeballPose(ch),theta=p.y*Math.PI,phi=(p.column+.5)/BALL_COLUMNS*Math.PI*2;
  const n=new Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)).applyEuler(new Euler(p.tilt,p.rotate,0));
  assert.ok(n.distanceTo(new Vector3(0,0,-1))<1e-9,ch);
 }
 assert.notEqual(typeballPose('A').index,typeballPose('a').index);assert.equal(typeballPose('é').index,typeballPose('e').index);
});
test('withdrawal clears the whole sheet at early and late feed positions',()=>{
 for(const height of [3.767,7.8,8.15])for(const feed of [0,.5,3,7]){
  const center=feed-height/2-.1,distance=withdrawalDistance(height,center);
  assert.ok(center-height/2+distance>=.45-1e-9);assert.ok(distance>0);
 }
});
test('typeball and ribbon retract below new ink at both camera limits',()=>{
 assert.deepEqual(typeballStroke(0),{selection:0,lift:0,travel:0,ribbonLift:0});
 const rest=typeballStroke(1);assert.equal(rest.lift,0);assert.equal(rest.travel,0);assert.equal(rest.ribbonLift,0);
 assert.ok(typeballStroke(.5248).lift>.22,'element must rise to the impression line before retracting');
 for(const [width,height]of [[1280,720],[844,390],[390,844]])for(const zoom of [0,.5,1]){
  const view=cameraAt(cameraStops(width,height),zoom),c=new PerspectiveCamera(view.fov,width/height,.1,100);c.position.copy(view.position);c.lookAt(view.look);c.updateMatrixWorld();
  const ink=new Vector3(0,2.69,-1.53).applyMatrix4(c.matrixWorldInverse),head=new Vector3(0,BALL_CARRIER_HEIGHT+.3,-1.14).applyMatrix4(c.matrixWorldInverse);
  assert.ok(head.y+.205<ink.y-.06,`${width}x${height} / ${zoom}: head silhouette must clear descenders`);
  const ribbon=new Vector3(0,BALL_CARRIER_HEIGHT+.30+.055,-1.4).applyMatrix4(c.matrixWorldInverse);assert.ok(ribbon.y<ink.y-.06);
 }
});
