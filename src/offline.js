import './offline.css';

export function setupOffline({flush}){
 document.body.classList.add('offline-enabled');const output=document.querySelector('#saved');let ready=false,pending=false,error=false,reloading=false,waiting=null,lastSaved;
 try{lastSaved=localStorage.getItem('dear:last-saved');}catch{}
 const zh=()=>document.documentElement.lang.startsWith('zh');
 const text=(en,cn)=>zh()?cn:en;
 function render(){
  let label=error?text('Could not save · please back up','保存失败，请导出备份'):pending?text('Saving…','正在保存…'):lastSaved?text('Saved on this device','已保存在本机'):text('Writing stays on this device','作品保存在本机');
  if(lastSaved&&!pending&&!error)label+=' · '+new Date(lastSaved).toLocaleTimeString(zh()?'zh-CN':'en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  label+=' · '+(!navigator.onLine?text('Offline','离线使用中'):ready?text('Ready offline','可离线使用'):text('Preparing offline…','正在准备离线资源…'));
  output.textContent=label;
 }
 const save=async()=>{try{return await flush();}catch{error=true;pending=false;render();return false;}};
 function updatePrompt(worker){
  waiting=worker;if(document.querySelector('#update-notice'))return;
  const notice=document.createElement('div');notice.id='update-notice';notice.setAttribute('role','status');const label=document.createElement('span'),button=document.createElement('button');
  label.textContent=text('An update is ready','新版本已就绪');button.textContent=text('Save and refresh','保存并刷新');notice.append(label,button);document.body.append(notice);
  button.onclick=async()=>{button.disabled=true;if(await save()===false){button.disabled=false;return;}reloading=true;waiting.postMessage({type:'SKIP_WAITING'});};
 }
 if('serviceWorker'in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.reload();});
  navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(reg=>{
   if(reg.waiting&&navigator.serviceWorker.controller)updatePrompt(reg.waiting);
   reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)updatePrompt(worker);});});
   addEventListener('online',()=>reg.update().catch(()=>{}));
   document.addEventListener('visibilitychange',()=>{if(!document.hidden&&navigator.onLine)reg.update().catch(()=>{});});
  }).catch(()=>{output.dataset.offlineError='true';render();});
  navigator.serviceWorker.ready.then(()=>{ready=true;render();});
 }
 addEventListener('online',render);addEventListener('offline',render);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});addEventListener('pagehide',()=>{save();});
 render();
 return {pending(){pending=true;error=false;render();},saved(){pending=false;error=false;lastSaved=new Date().toISOString();try{localStorage.setItem('dear:last-saved',lastSaved);}catch{}render();},failed(){pending=false;error=true;render();}};
}
