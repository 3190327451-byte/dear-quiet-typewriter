const CACHE_PREFIX='dear-pages-static-',CACHE=CACHE_PREFIX+'__DEAR_VERSION__';
const ASSETS=__DEAR_ASSETS__,ALLOWED=new Set(ASSETS);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(CACHE_PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  // One version of the shell and its assets stays together until the writer accepts an update.
  event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match('/index.html')||fetch(request);})());return;
 }
 if(!ALLOWED.has(url.pathname)||url.search)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(url.pathname)||fetch(request);})());
});
