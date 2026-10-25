// End the old scene before starting the new one, including during rapid toggles.
export class Ambience {
 constructor(context,destination,buffers){this.ctx=context;this.destination=destination;this.buffers=buffers;this.current=null;this.desired=null;}
 set(name,enabled=true){this.desired=enabled?name:null;this.sync();}
 sync(){
  const old=this.current,c=this.ctx,t=c.currentTime;
  if(old){
   if(old.ending||old.name===this.desired)return;
   old.ending=true;old.gain.gain.cancelScheduledValues(t);old.gain.gain.setValueAtTime(old.gain.gain.value,t);old.gain.gain.linearRampToValueAtTime(0,t+.045);old.source.stop(t+.05);return;
  }
  const name=this.desired,buffer=this.buffers.get(name);if(!buffer)return;
  const source=c.createBufferSource(),gain=c.createGain(),nodes=[source,gain];source.buffer=buffer;source.loop=true;
  let tail=source;
  if(name==='winter'){
   const shelf=c.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=1800;shelf.gain.value=-8;tail.connect(shelf);tail=shelf;nodes.push(shelf);
   const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=3800;low.Q.value=.55;tail.connect(low);tail=low;nodes.push(low);
   const soft=c.createDynamicsCompressor();soft.threshold.value=-20;soft.knee.value=12;soft.ratio.value=2;soft.attack.value=.004;soft.release.value=.12;tail.connect(soft);tail=soft;nodes.push(soft);
  }
  tail.connect(gain).connect(this.destination);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(1,t+.18);
  const voice={name,source,gain,nodes,ending:false};this.current=voice;
  source.onended=()=>{nodes.forEach(n=>n.disconnect());if(this.current===voice)this.current=null;this.sync();};
  source.start(t,Math.random()*buffer.duration);
 }
}
