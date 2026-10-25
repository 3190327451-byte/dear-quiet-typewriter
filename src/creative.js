export const TYPEFACES = {
  courier: {name:'Courier', family:'Dear Slug'},
  cutive: {name:'Cutive Mono', family:'Dear Cutive'},
  elite: {name:'Special Elite', family:'Dear Elite'},
};
export const DEFAULT_EFFECTS = {font:'courier',size:3.85,pitch:2.54,ink:.93,variation:.12,drift:.25,tilt:.035,wear:.12};
const clamp=(x,min,max,fallback)=>Number.isFinite(+x)?Math.max(min,Math.min(max,+x)):fallback;
export function effects(value={}) {
  const d=DEFAULT_EFFECTS;
  return {font:TYPEFACES[value.font]?value.font:d.font,size:clamp(value.size,2.6,5.5,d.size),pitch:clamp(value.pitch,1.8,4.2,d.pitch),ink:clamp(value.ink,.3,1,d.ink),variation:clamp(value.variation,0,.6,d.variation),drift:clamp(value.drift,0,1.4,d.drift),tilt:clamp(value.tilt,0,.12,d.tilt),wear:clamp(value.wear,0,.65,d.wear)};
}
export function cursorOffset(p){return Number.isFinite(p.offset)?p.offset:p.col*2.54;}
