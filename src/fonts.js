// A failed or stalled font must never stop an impression or a canvas preview.
export function createFontResolver(fonts,{timeout=1500,retryAfter=10000,now=Date.now}={}){
 const cache=new Map();
 function load(family){
  const saved=cache.get(family);if(saved&&(!saved.failed||now()-saved.started<retryAfter))return saved.promise;
  const entry={started:now(),failed:false};
  entry.promise=new Promise(resolve=>{
   let finished=false;const finish=ok=>{if(finished)return;finished=true;clearTimeout(timer);entry.failed=!ok;resolve(ok);};
   const timer=setTimeout(()=>finish(false),timeout);
   Promise.resolve().then(()=>fonts?.load(`400 16px "${family}"`)).then(faces=>finish(!!faces?.length),()=>finish(false));
  });cache.set(family,entry);return entry.promise;
 }
 return async family=>{
  if(await load(family))return family;
  if(family!=='Dear Slug'&&await load('Dear Slug'))return 'Dear Slug';
  return 'monospace';
 };
}
export const resolveFont=createFontResolver(typeof document==='undefined'?null:document.fonts);
