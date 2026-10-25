import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFontResolver} from '../src/fonts.js';

test('rejected font falls back and repeated impressions share the same load',async()=>{
 const calls=[];const resolve=createFontResolver({load:async query=>{calls.push(query);if(query.includes('Dear Elite'))throw Error('network');return [{}];}});
 assert.deepEqual(await Promise.all([resolve('Dear Elite'),resolve('Dear Elite')]),['Dear Slug','Dear Slug']);
 assert.equal(calls.length,2);
});
test('stalled or missing fonts settle on a usable system face',async()=>{
 const resolve=createFontResolver({load:()=>new Promise(()=>{})},{timeout:10});
 assert.equal(await resolve('Dear Slug'),'monospace');
 assert.equal(await createFontResolver(null)('Dear Slug'),'monospace');
});
test('failed fonts are retried later without changing saved typeface choices',async()=>{
 let time=0,ready=false,calls=0;const resolve=createFontResolver({load:async()=>{calls++;return ready?[{}]:[];}},{retryAfter:10,now:()=>time});
 assert.equal(await resolve('Dear Elite'),'monospace');assert.equal(calls,2);
 ready=true;time=11;assert.equal(await resolve('Dear Elite'),'Dear Elite');assert.equal(calls,3);
});
