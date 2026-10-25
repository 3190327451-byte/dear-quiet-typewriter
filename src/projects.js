import {project} from './mechanics.js';

export function insertPage(previous, sheet, {continueWork=false}={}) {
  // Choosing paper starts a new work. Only the explicit continuation path reuses it.
  const work=continueWork && previous && !previous.completed ? previous : project();
  if(continueWork && work.pages.length && sheet.type!==work.pages[0].type) throw Error('A continuation must use the same paper.');
  work.pages.forEach(p=>p.removed=true);
  work.pages.push(sheet);work.active=work.pages.length-1;work.kind=work.pages[0].type;
  return work;
}
export function storageKind(work) {
  const types=new Set(work.pages.map(p=>p.type));
  return types.size===1 ? [...types][0] : 'mixed';
}
export function splitLegacyWork(work) {
  if(storageKind(work)!=='mixed')return [work];
  const selected=work.pages[work.active||0],selectedType=selected?.type||work.pages[0]?.type;
  return [...new Set(work.pages.map(p=>p.type))].map(kind=>{
    const pages=work.pages.filter(p=>p.type===kind);
    const result={...work,id:kind===selectedType?work.id:crypto.randomUUID(),pages,kind,active:Math.max(0,pages.findIndex(p=>p.id===selected?.id))};
    if(!work.nameEdited)result.name=titleFromInk(result,work.name||'Untitled');
    return result;
  });
}
export function titleFromInk(work,fallback='Untitled') {
  const p=work.pages[0];if(!p)return fallback;
  const line=[];
  for(const m of p.marks.filter(m=>m.y<23))line[Math.max(0,Math.round((m.x-p.left)/2.54))]=m.ch;
  return Array.from({length:line.length},(_,i)=>line[i]||' ').join('').trim().slice(0,60)||fallback;
}
export function finishWork(work) {
  work.completed=true;work.finishedAt=new Date().toISOString();
  work.pages.forEach(p=>p.removed=true);return work;
}
export function fileStem(work) {
  return 'Dear-'+(work.name||'letter').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').trim().slice(0,45)+'-'+work.date.slice(0,10);
}
