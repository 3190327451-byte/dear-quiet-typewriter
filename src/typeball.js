// Four rows on an original 96-position element; the digital typefaces are not IBM replicas.
import {strikePhase} from './motion.js';
export const BALL_CARRIER_HEIGHT=2.12;
export function typeballStroke(t){
 if(t<=0||t>=1)return {selection:0,lift:0,travel:0,ribbonLift:0};
 const selection=t<.28?t/.28:t>.8?(1-t)/.2:1,impact=t<.28?0:strikePhase((t-.28)/.72);
 return {selection,lift:impact*.23,travel:-impact*.19,ribbonLift:impact*.32};
}
export const BALL_COLUMNS=24,BALL_ROWS=4;
export const BALL_GLYPHS=Array.from({length:94},(_,i)=>String.fromCharCode(33+i)).join('')+'¢£';
export function typeballPose(character){
 const latin=character.normalize('NFD').replace(/[\u0300-\u036f]/g,''),found=BALL_GLYPHS.indexOf(character),index=found>=0?found:Math.max(0,BALL_GLYPHS.indexOf(latin));
 const row=Math.floor(index/BALL_COLUMNS),column=index%BALL_COLUMNS,y=.29+row*.14;
 return{index,row,column,y,tilt:y*Math.PI-Math.PI/2,rotate:-Math.PI/2-(column+.5)/BALL_COLUMNS*Math.PI*2};
}
