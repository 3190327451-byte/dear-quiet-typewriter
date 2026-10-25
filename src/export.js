import {jsPDF} from 'jspdf';
import {renderPaper,download} from './ink.js';
import {FORMATS} from './mechanics.js';
import {fileStem} from './projects.js';
export function printNote(type,zh){const f=FORMATS[type];return zh?['打印小纸条',`${type==='postcard'?'4 × 6 英寸':'A5'}｜${f.gsm}g ${type==='thick'?'暖象牙色厚纸':type==='postcard'?'双面哑光无涂层卡纸':'自然暖白无涂层纸'}`,`${type==='postcard'?'双面短边翻转':'单面彩印'}｜100% 原尺寸`,'不覆膜、不自动调色｜请先试印 1 张']:['A note for the print shop',`${type==='postcard'?'4 × 6 in':'A5'} · ${f.gsm} gsm · ${type==='thick'?'warm ivory':type==='postcard'?'matte uncoated card':'warm-white uncoated'}`,`${type==='postcard'?'Duplex · short-edge flip':'Single-sided colour'} · actual size, 100%`,'No lamination or colour correction · test one first'];}
export async function pdfExport(project,texture,zh,carrier='native'){const first=FORMATS[project.pages[0].type];const size=carrier==='a4'?[210,297]:carrier==='letter'?[215.9,279.4]:[first.w,first.h];let pdf=new jsPDF({unit:'mm',format:size,orientation:size[0]>size[1]?'landscape':'portrait',compress:true});let n=0;for(const p of project.pages){const f=FORMATS[p.type];for(const front of(p.type==='postcard'?[true,false]:[false])){let dims=carrier==='native'?[f.w,f.h]:size;if(n++)pdf.addPage(dims,dims[0]>dims[1]?'landscape':'portrait');let x=(dims[0]-f.w)/2,y=(dims[1]-f.h)/2;let canvas=await renderPaper(p,{texture:front?true:texture,scale:10,front});pdf.addImage(canvas.toDataURL('image/png'),'PNG',x,y,f.w,f.h,undefined,'FAST');if(carrier!=='native'){pdf.setDrawColor(100);pdf.setLineWidth(.15);for(const a of[x,x+f.w])for(const b of[y,y+f.h]){pdf.line(a-4,b,a-1,b);pdf.line(a+1,b,a+4,b);pdf.line(a,b-4,a,b-1);pdf.line(a,b+1,a,b+4);}}}}
pdf.addPage([148,105],'landscape');const c=document.createElement('canvas');c.width=1480;c.height=1050;const g=c.getContext('2d');g.fillStyle='#faf7ec';g.fillRect(0,0,c.width,c.height);g.fillStyle='#494b3f';const lines=printNote(project.pages[0].type,zh);lines.forEach((line,i)=>{g.font=i?'32px system-ui':'44px Georgia';g.fillText(line,100,220+i*130);});pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,148,105);pdf.save(fileStem(project)+'.pdf');}
export function calibration(){const pdf=new jsPDF({unit:'mm',format:'a4'});pdf.setFont('courier');pdf.setFontSize(20);pdf.text('Dear,',25,35);pdf.setFontSize(11);pdf.text('Print at actual size / 100%. Disable fit to page.',25,52);pdf.text('The line below must measure exactly 10 cm.',25,61);pdf.setLineWidth(.3);pdf.line(25,85,125,85);pdf.line(25,82,25,88);pdf.line(125,82,125,88);pdf.text('10 cm',65,98);pdf.save('Dear-10cm-calibration.pdf');}
export async function keepsakeCanvas(p,winter){
 const back=await renderPaper(p,{scale:12});
 const c=document.createElement('canvas');c.width=p.type==='postcard'?3200:2400;c.height=2000;
 const g=c.getContext('2d');g.fillStyle=winter?'#493b2e':'#755039';g.fillRect(0,0,c.width,c.height);
 for(let i=0;i<1500;i++){g.strokeStyle=`rgba(23,14,9,${.025+Math.random()*.04})`;g.beginPath();g.moveTo(0,i*1.4);g.bezierCurveTo(700,i*1.4-2,2200,i*1.4+3,c.width,i*1.4);g.stroke();}
 function lay(canvas,x,y,w,h,angle=0){g.save();g.translate(x,y);g.rotate(angle);g.shadowColor='#20150d80';g.shadowBlur=42;g.shadowOffsetX=10;g.shadowOffsetY=24;g.drawImage(canvas,-w/2,-h/2,w,h);g.restore();}
 if(p.type==='postcard'){
   const front=await renderPaper(p,{scale:12,front:true});
   // One keepsake containing both complete faces, neither stretched nor cropped.
   lay(front,840,1000,1400,1400*front.height/front.width,-.012);
   lay(back,2360,1000,1400,1400*back.height/back.width,.012);
 }else {let h=1660,w=h*back.width/back.height;lay(back,1200,1000,w,h);}
 return c;
}
export async function keepsake(p,winter,work){const c=await keepsakeCanvas(p,winter);return new Promise((res,rej)=>c.toBlob(b=>{if(!b){rej(Error('Image export failed'));return;}download(b,(work?fileStem(work):'Dear-keepsake')+'.png');res();},'image/png'));}
