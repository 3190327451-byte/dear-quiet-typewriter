import {Vector3,PerspectiveCamera,MathUtils} from 'three';
export function cameraStops(width,height){
 const near={look:new Vector3(0,1.3,1),position:new Vector3(),fov:36};
 const direction=new Vector3(0,.43,.903).normalize(),up=new Vector3(0,direction.z,-direction.y),baseLook=near.look.clone(),probe=new PerspectiveCamera(36,width/height,.1,100),corners=[];
 for(const x of[-4.3,4.3])corners.push(new Vector3(x,2.75,-1.65));
 for(const x of[-3.3,3.3])corners.push(new Vector3(x,.89,3.24));
 for(const x of[-3.2,3.2])corners.push(new Vector3(x,1.56,.35));
 const bottom=[...corners.slice(2,4),...[-2.1,2.1].map(x=>new Vector3(x,.85,3.42))];corners.push(...bottom);
 for(const x of[-3,3])corners.push(new Vector3(x,3.1,-1.7));
 let distance=10.2;
 for(let i=0;i<320;i++){
  near.look.copy(baseLook);probe.position.copy(baseLook).addScaledVector(direction,distance);probe.lookAt(near.look);probe.updateMatrixWorld();
  // Anchor the lowest key edge near the frame, allowing the decorative apron to crop.
  const shift=Math.min(...bottom.map(p=>(p.clone().project(probe).y+.92)*-p.clone().applyMatrix4(probe.matrixWorldInverse).z*Math.tan(MathUtils.degToRad(near.fov/2))));
  near.look.addScaledVector(up,shift);probe.position.addScaledVector(up,shift);probe.lookAt(near.look);probe.updateMatrixWorld();
  if(corners.every(p=>{const v=p.clone().project(probe);return Math.abs(v.x)<.93&&v.y<.88&&v.y>-.96;}))break;
  distance+=.14;
 }
 near.position.copy(probe.position);
 const far={look:new Vector3(0,1,0),position:new Vector3(0,10.5,18.5),fov:width<height?49:36};
 const minimumDistance=distance*Math.tan(MathUtils.degToRad(near.fov/2))/Math.tan(MathUtils.degToRad(far.fov/2))*1.35;
 if(width<height&&far.position.distanceTo(far.look)<minimumDistance)far.position.sub(far.look).setLength(minimumDistance).add(far.look);
 return {far,near};
}
export function zoomAfterWheel(current,delta,mode=0,height=720){
 const pixels=delta*(mode===1?16:mode===2?height:1);
 return MathUtils.clamp(current-MathUtils.clamp(pixels,-180,180)/650,0,1);
}
export function cameraAt(stops,value){
 const t=MathUtils.clamp(value,0,1);
 return {position:stops.far.position.clone().lerp(stops.near.position,t),look:stops.far.look.clone().lerp(stops.near.look,t),fov:MathUtils.lerp(stops.far.fov,stops.near.fov,t)};
}
