import {test} from 'node:test';
import assert from 'node:assert/strict';
import {page,project,strike} from '../src/mechanics.js';
import {insertPage,storageKind,finishWork,titleFromInk,fileStem,splitLegacyWork} from '../src/projects.js';

test('ordinary new paper starts an independent work without mutating prior pages',()=>{
 const a=insertPage(project(),page('light'));strike(a.pages[0],'A');
 const before=JSON.stringify(a),b=insertPage(a,page('postcard'));
 assert.notEqual(a.id,b.id);assert.equal(JSON.stringify(a),before);assert.equal(b.pages.length,1);assert.equal(storageKind(b),'postcard');
});
test('only explicit continuation appends to the same work and keeps page order',()=>{
 const a=insertPage(project(),page('light')),first=a.pages[0];
 const b=insertPage(a,page('light'),{continueWork:true});
 assert.equal(a.id,b.id);assert.equal(b.pages.length,2);assert.equal(b.pages[0],first);assert.equal(b.active,1);
 assert.throws(()=>insertPage(a,page('postcard'),{continueWork:true}));
});
test('completion preserves marks and makes subsequent paper independent',()=>{
 const a=insertPage(project(),page('thick'));strike(a.pages[0],'X');const marks=JSON.stringify(a.pages[0].marks);
 finishWork(a);assert.equal(JSON.stringify(a.pages[0].marks),marks);assert.ok(a.completed);assert.ok(a.pages[0].removed);
 const b=insertPage(a,page('thick'),{continueWork:true});assert.notEqual(a.id,b.id);
});
test('old mixed-paper projects remain intact and distinguishable in the drawer',()=>{
 const a=project();a.pages=[page('light'),page('postcard')];assert.equal(storageKind(a),'mixed');assert.equal(a.pages.length,2);
});
test('first-line names retain spaces and file names avoid forbidden characters',()=>{
 const a=insertPage(project(),page());for(const c of 'Dear, you')strike(a.pages[0],c);
 assert.equal(titleFromInk(a),'Dear, you');a.name='a/b:c?';assert.ok(!/[\\/:?]/.test(fileStem(a)));
});
test('legacy migration preserves every page and retains the selected page under its old work id',()=>{
 const work=project();work.pages=[page('light'),page('thick'),page('postcard'),page('light')];work.active=2;work.name='My old work';work.nameEdited=true;
 for(const [i,p]of work.pages.entries())strike(p,String(i));const original=JSON.stringify(work);
 const parts=splitLegacyWork(work);assert.equal(parts.length,3);assert.equal(JSON.stringify(work),original);
 assert.ok(parts.every(p=>storageKind(p)!=='mixed'&&p.name==='My old work'));
 assert.deepEqual(new Set(parts.flatMap(p=>p.pages.map(x=>x.id))),new Set(work.pages.map(p=>p.id)));
 assert.equal(parts.find(p=>p.id===work.id).pages[0].id,work.pages[2].id);
 assert.ok(parts.every(p=>splitLegacyWork(p).length===1));
});
test('migrating deleted legacy works keeps all resulting pieces in the recycle bin',()=>{
 const work=project();work.pages=[page('light'),page('postcard')];work.deletedAt='2026-10-21T00:00:00Z';
 assert.ok(splitLegacyWork(work).every(p=>p.deletedAt===work.deletedAt));
});
