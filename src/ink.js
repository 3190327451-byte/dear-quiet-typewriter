import {FORMATS,random} from './mechanics.js';
import {TYPEFACES} from './creative.js';
import {resolveFont} from './fonts.js';
const images=new Map();
export function loadImage(src){if(!images.has(src))images.set(src,new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>{images.delete(src);rej(Error('Image unavailable'));};i.src=src;}));return images.get(src);}
export async function renderStock(type,scale=2){return renderPaper({type,marks:[],stamps:[]},{scale});}
export async function renderPaper(p,{texture=true,scale=6,front=false}={}){
 const faces=new Set(p.marks.map(m=>m.inkVersion===3?TYPEFACES[m.font]?.family:m.inkVersion===2?'Dear Slug':null).filter(Boolean));
 const resolved=new Map(await Promise.all([...faces].map(async f=>[f,await resolveFont(f)])));
 const f=FORMATS[p.type],c=document.createElement('canvas');c.width=Math.round(f.w*scale);c.height=Math.round(f.h*scale);const g=c.getContext('2d');g.scale(scale,scale);
 if(texture){g.fillStyle=f.color;g.fillRect(0,0,f.w,f.h);for(let i=0;i<12000;i++){g.fillStyle=`rgba(99,83,59,${random(i*31)*.035})`;g.fillRect(random(i*11)*f.w,random(i*23)*f.h,.08+random(i)*.3,.12);}if(p.type==='thick'){g.strokeStyle='#897b5b08';g.lineWidth=.06;for(let y=0;y<f.h;y+=.6){g.beginPath();g.moveTo(0,y);g.lineTo(f.w,y);g.stroke();}}}
 if(front&&p.photo){await image(g,p.photo,0,0,f.w,f.h);return c;}
 if(p.type==='postcard'){g.strokeStyle='#8d88766b';g.lineWidth=.2;g.beginPath();g.moveTo(f.w*.56,14);g.lineTo(f.w*.56,f.h-12);for(let y=52;y<90;y+=9){g.moveTo(f.w*.62,y);g.lineTo(f.w-10,y);}g.stroke();g.setLineDash([1,1]);g.strokeRect(f.w-29,8,21,26);g.setLineDash([]);}
 // Distress is applied to each ink impression, never punched through the paper itself.
 const tile=document.createElement('canvas');
 for(const m of p.marks){
  const size=m.size||3.85,family=m.inkVersion===3?TYPEFACES[m.font]?.family||'Dear Slug':m.inkVersion===2?'Dear Slug':'Courier New';
  tile.width=Math.ceil(size*2.2*scale);tile.height=Math.ceil(size*2*scale);const q=tile.getContext('2d');q.scale(scale,scale);q.translate(.5,size*1.4);
  q.font=`400 ${size}px "${resolved.get(family)||family}", monospace`;q.textBaseline='alphabetic';q.fillStyle=m.red?'#69251f':'#171a17';q.globalAlpha=m.alpha;q.fillText(m.ch,0,0);
  if(m.inkVersion>=2){q.strokeStyle=q.fillStyle;q.lineWidth=.025*m.weight;q.strokeText(m.ch,0,0);}
  if(m.double){q.globalAlpha=.14;q.fillText(m.ch,.16,.07);}
  const wear=m.inkVersion===3?m.wear:.12;q.globalCompositeOperation='destination-out';q.globalAlpha=wear;
  for(let i=0;i<3+Math.floor(wear*10);i++)q.fillRect(random(m.seed+i*21)*size*.6,-random(m.seed+i*43)*size*.75,.12+(m.defect||0)*.08,.08);
  g.save();g.translate(m.x,m.y);g.rotate(m.angle);g.drawImage(tile,-.5,-size*1.4,tile.width/scale,tile.height/scale);g.restore();
 }
 for(const s of p.stamps||[]){g.save();g.translate(s.x,s.y);g.rotate(s.angle||0);
  if(s.kind==='postmark'){g.strokeStyle=`rgba(51,55,52,${s.alpha||.6})`;g.lineWidth=.4;g.beginPath();g.arc(0,0,10,0,Math.PI*2);g.stroke();g.beginPath();g.arc(0,0,8,0,Math.PI*2);g.stroke();g.font='2px Georgia';g.textAlign='center';g.fillStyle=g.strokeStyle;g.fillText('DEAR POST',0,-2);g.font='1.8px monospace';g.fillText(s.date,0,3);for(let j=0;j<4;j++){g.beginPath();g.moveTo(7,j*2-4);g.bezierCurveTo(14,j*2-7,17,j*2,27,j*2-3);g.stroke();}}
  else if(s.kind==='date'){g.fillStyle='#64584b99';g.font='2.5px monospace';g.fillText(s.date,0,0);}
  else {g.fillStyle='#faf5e7';const sw=21,sh=s.animal!==undefined?21:s.ratio?21/s.ratio:26;g.fillRect(-1,-1,sw+2,sh+2);g.strokeStyle='#bbb2a0';g.setLineDash([.7,.6]);g.strokeRect(-.6,-.6,sw+1.2,sh+1.2);g.setLineDash([]);
   if(s.animal!==undefined){const atlas=await loadImage(s.edition===2?'/art/animal-stamps-v2.png':'/art/animal-stamps.png');const cw=atlas.width/4,ch=atlas.height/2;g.drawImage(atlas,(s.animal%4)*cw,Math.floor(s.animal/4)*ch,cw,ch,-1,-1,sw+2,sh+2);}
   else if(s.image)await image(g,s.image,0,0,sw,sh);
   else {g.fillStyle=['#5c796d','#9f6350','#48697a','#a68c51','#7f7390','#647666','#a47679','#446f72'][s.index%8];g.fillRect(0,0,21,26);g.strokeStyle='#eee9d3';g.lineWidth=.25;g.strokeRect(1.5,1.5,18,23);g.beginPath();const k=s.index%8;for(let j=0;j<14;j++){let a=j/14*Math.PI*2;g.moveTo(10,13);g.quadraticCurveTo(10+Math.cos(a)*9,13+Math.sin(a)*7,10+Math.cos(a)*4,13+Math.sin(a)*4);}g.stroke();g.font='2px Georgia';g.textAlign='center';g.fillStyle='#f6efd7';g.fillText(['TIDELAND','NIGHT GARDEN','WIND POST','SOLSTICE','MOON LETTER','FERN HOUSE','FIRST LIGHT','SLOW MAIL'][k],10.5,5);g.fillText('DEAR POST · 08',10.5,23);}
  }g.restore();
 }return c;
}
async function image(g,src,x,y,w,h){g.drawImage(await loadImage(src),x,y,w,h);}
export function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
