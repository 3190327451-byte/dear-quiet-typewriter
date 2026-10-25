import {validateProject} from './mechanics.js';
import {splitLegacyWork} from './projects.js';
const db=new Promise((resolve,reject)=>{const req=indexedDB.open('dear-desk',1);req.onupgradeneeded=()=>{req.result.createObjectStore('projects',{keyPath:'id'});req.result.createObjectStore('settings');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
export async function put(store,value,key){
 const d=await db;
 return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite'),records=tx.objectStore(store);
  if(store==='projects'){const req=records.get(value.id);req.onsuccess=()=>{records.put(req.result?.deletedAt?{...value,deletedAt:req.result.deletedAt}:value);};}
  else records.put(value,...(key===undefined?[]:[key]));
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
export async function all({trash=false}={}){const d=await db;return new Promise((resolve,reject)=>{const req=d.transaction('projects').objectStore('projects').getAll();req.onsuccess=()=>resolve(req.result.filter(work=>!!work.deletedAt===trash));req.onerror=()=>reject(req.error);});}
async function setDeleted(id,deleted){
 const d=await db;return new Promise((resolve,reject)=>{const tx=d.transaction('projects','readwrite'),records=tx.objectStore('projects'),req=records.get(id);let result;
  req.onsuccess=()=>{result=req.result;if(!result)return;if(deleted)result.deletedAt=new Date().toISOString();else delete result.deletedAt;records.put(result);};
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
export const remove=id=>setDeleted(id,true);
export const restore=id=>setDeleted(id,false);
export async function migrateLegacyWorks(){
 const d=await db;return new Promise((resolve,reject)=>{const tx=d.transaction('projects','readwrite'),records=tx.objectStore('projects'),req=records.getAll();let count=0;
  req.onsuccess=()=>{for(const work of req.result){if(!validateProject(work))continue;const parts=splitLegacyWork(work);if(parts.length>1){for(const part of parts)records.put(part);count++;}}};
  tx.oncomplete=()=>resolve(count);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
export async function settings(){const d=await db;return new Promise(resolve=>{const req=d.transaction('settings').objectStore('settings').get('desk');req.onsuccess=()=>resolve(req.result||{});req.onerror=()=>resolve({});});}
