import {renderPaper,renderStock} from './ink.js';

export async function putAway(sheet,{target,zh=false,onSound=()=>{}}={}) {
 const overlay=document.createElement('div');overlay.id='ceremony';overlay.dataset.stage='preparing';overlay.dataset.face=sheet.type==='postcard'?'written':'paper';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',zh?'收好作品':'Put away your work');
 overlay.innerHTML=`<span class="ceremony-status" role="status">${zh?'准备收纳…':'Preparing…'}</span>`;document.body.append(overlay);
 try{
 const [back,photo,blank]=await Promise.all([
  renderPaper(sheet,{scale:5}).then(c=>c.toDataURL()),
  sheet.type==='postcard'?renderPaper(sheet,{scale:5,front:true}).then(c=>c.toDataURL()):null,
  sheet.type==='light'?renderStock('light',5).then(c=>c.toDataURL()):null,
 ]);
 // Decode CSS backgrounds before starting the animation clock.
 await Promise.all([...new Set([back,photo,blank].filter(Boolean))].map(async src=>{const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Ceremony image unavailable'));image.src=src;});await img.decode?.();}));
 const front=back,reverse=photo||back;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let skipped=false;
 overlay.innerHTML=`<button class="ceremony-skip" aria-label="${zh?'略过动画':'Skip animation'}">↘</button><div class="ceremony-stage ${sheet.type}"><div class="archive-box"><div class="box-inside"></div><div class="box-lid"></div><div class="box-front"></div></div><div class="envelope"><div class="envelope-back"></div><div class="envelope-flap"></div><div class="envelope-pocket"></div></div><div class="finished-sheet"><div class="sheet-face sheet-front" style="background-image:url('${front}')"></div><div class="sheet-face sheet-back" style="background-image:url('${reverse}')"></div>${sheet.type==='light'?`<div class="fold-top" style="background-image:url('${back}')"></div><div class="fold-bottom" style="background-image:url('${back}')"></div>`:''}</div></div>`;
 overlay.querySelector('button').focus();
 const stage=overlay.querySelector('.ceremony-stage'),paper=overlay.querySelector('.finished-sheet');const stageScale=Math.min(1,(innerWidth-36)/(sheet.type==='postcard'?580:400),(innerHeight-40)/520);stage.style.transform='scale('+stageScale+')';
 const skip=()=>{skipped=true;overlay.getAnimations({subtree:true}).forEach(a=>a.finish());};
 overlay.querySelector('button').onclick=skip;const key=e=>{if(e.key==='Escape'){e.stopPropagation();skip();}};addEventListener('keydown',key,true);
 const animate=async(el,frames,ms,delay=0)=>{if(skipped)return;const a=el.animate(frames,{duration:reduced?Math.min(220,ms):ms,delay:reduced?Math.min(300,delay):delay,easing:'cubic-bezier(.25,.65,.3,1)',fill:'forwards'});await a.finished;};
 try{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  overlay.dataset.stage='presenting';
  await animate(paper,[{opacity:0,transform:'translateY(36px)'},{opacity:1,transform:'translateY(0)'}],450);
  overlay.dataset.stage='presented';
  if(sheet.type==='light'){
   overlay.dataset.stage='folding';
   onSound('paper');
   const fold=overlay.querySelector('.fold-top');
   await animate(fold,[{transform:'rotateX(0)'},{transform:'rotateX(-90deg)'}],475,350);
   fold.style.backgroundImage=`url('${blank}')`;
   await animate(fold,[{transform:'rotateX(-90deg)'},{transform:'rotateX(-180deg)'}],475);
   await animate(paper,[{transform:'translateY(0)'},{transform:'translateY(-76px)'}],450);
   overlay.dataset.stage='envelope';await animate(overlay.querySelector('.envelope'),[{opacity:0,transform:'translateY(65px)'},{opacity:1,transform:'translateY(0)'}],500);
   onSound('paper');await animate(paper,[{transform:'translateY(-76px) scale(1)'},{transform:'translateY(74px) scale(.87)',opacity:1},{transform:'translateY(104px) scale(.87)',opacity:0}],850);
   await animate(overlay.querySelector('.envelope-flap'),[{transform:'rotateX(180deg)'},{transform:'rotateX(0)'}],600);
  }else if(sheet.type==='thick'){
   overlay.dataset.stage='box';
   await animate(overlay.querySelector('.archive-box'),[{opacity:0,transform:'translateY(80px)'},{opacity:1,transform:'translateY(32px)'}],550,300);
   await animate(overlay.querySelector('.box-lid'),[{transform:'rotateX(0)'},{transform:'rotateX(112deg)'}],650);
   onSound('paper');await animate(paper,[{transform:'translateY(0) scale(1)'},{transform:'translateY(20px) scale(.82)'},{transform:'translateY(68px) scale(.82)',opacity:0}],1100);
   await animate(overlay.querySelector('.box-lid'),[{transform:'rotateX(112deg)'},{transform:'rotateX(0)'}],650);
  }else{
   overlay.dataset.face='written';
   await animate(paper,[{transform:'rotateY(0)'},{transform:'rotateY(90deg)'}],550,900);
   paper.querySelector('.sheet-front').style.display='none';
   paper.querySelector('.sheet-back').style.display='block';
   await animate(paper,[{transform:'rotateY(-90deg)'},{transform:'rotateY(0)'}],550);
   overlay.dataset.face='photo';
   overlay.dataset.stage='photo';
   await animate(paper,[{transform:'rotateY(0)'},{transform:'rotateY(0)'}],1000);
  }
  const rect=stage.getBoundingClientRect(),dest=target?.getBoundingClientRect();
  const dx=dest?dest.left+dest.width/2-(rect.left+rect.width/2):innerWidth*.27,dy=dest?dest.top+dest.height/2-(rect.top+rect.height/2):innerHeight*.2;
  overlay.dataset.stage='storing';onSound('switch');await animate(stage,[{transform:'translate(0,0) scale('+stageScale+')',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.08)`,opacity:.1}],800);
 }finally{removeEventListener('keydown',key,true);target?.focus({preventScroll:true});}
 }finally{overlay.remove();}
}
