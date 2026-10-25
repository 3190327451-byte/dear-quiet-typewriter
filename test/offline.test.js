import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const template=await readFile(new URL('../deploy/cloudflare-sw.js',import.meta.url),'utf8');
function worker(){
 const events={},deleted=[],added=[],shell={body:'Dear offline shell'},cached=new Map([['/index.html',shell],['/assets/app.js',{body:'app'}]]);let claimed=0,skipped=0;
 const context={URL,Set,self:{location:{origin:'https://dear.example'},clients:{async claim(){claimed++;}},async skipWaiting(){skipped++;},addEventListener(name,fn){events[name]=fn;}},caches:{async open(){return {async addAll(paths){added.push(...paths);},async match(path){return cached.get(path);}};},async keys(){return ['dear-pages-static-old','dear-pages-static-test','unrelated-cache'];},async delete(name){deleted.push(name);}},fetch:async()=>{throw Error('Offline network');}};
 runInNewContext(template.replace('__DEAR_VERSION__','test').replace('__DEAR_ASSETS__',JSON.stringify(['/index.html','/assets/app.js'])),context);
 return {events,deleted,added,shell,get claimed(){return claimed;},get skipped(){return skipped;}};
}
test('offline cache contains static assets only and activation removes only older app versions',async()=>{
 const w=worker();let work;w.events.install({waitUntil(p){work=p;}});await work;assert.deepEqual(w.added,['/index.html','/assets/app.js']);assert.equal(w.skipped,0);
 w.events.activate({waitUntil(p){work=p;}});await work;assert.deepEqual(w.deleted,['dear-pages-static-old']);assert.equal(w.claimed,1);
});
test('deep navigations and static resources work with a completely unavailable origin',async()=>{
 const w=worker();let response;w.events.fetch({request:{method:'GET',url:'https://dear.example/write/letter',mode:'navigate'},respondWith(p){response=p;}});assert.equal(await response,w.shell);
 w.events.fetch({request:{method:'GET',url:'https://dear.example/assets/app.js',mode:'cors'},respondWith(p){response=p;}});assert.equal((await response).body,'app');
});
test('private writes and unlisted or external resources never enter Cache Storage',()=>{
 const w=worker();for(const [url,method]of [['https://dear.example/my-photo.jpg','GET'],['https://dear.example/write','POST'],['https://elsewhere.example/assets/app.js','GET'],['https://dear.example/assets/app.js?private=1','GET']]){let intercepted=false;w.events.fetch({request:{method,url,mode:'cors'},respondWith(){intercepted=true;}});assert.equal(intercepted,false,url);}
});
test('an update activates early only after explicit save-and-refresh message',async()=>{
 const w=worker();assert.equal(w.skipped,0);let work;w.events.message({data:{type:'SKIP_WAITING'},waitUntil(p){work=p;}});await work;assert.equal(w.skipped,1);
});
