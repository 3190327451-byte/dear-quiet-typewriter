import {test} from 'node:test';
import assert from 'node:assert/strict';
import {page,strike,backspace,carriageReturn} from '../src/mechanics.js';
import {cursorOffset,effects} from '../src/creative.js';
import {SLUG_KEYS,keyFor,strikePhase} from '../src/motion.js';

test('creative changes only affect future impressions, including after a save',()=>{
 const p=page();strike(p,'a',{font:'courier',ink:.95,drift:0});const first=JSON.stringify(p.marks[0]);
 const saved=JSON.parse(JSON.stringify(p));strike(saved,'B',{font:'cutive',ink:.4,size:5,drift:1});
 assert.equal(JSON.stringify(saved.marks[0]),first);assert.equal(saved.marks[1].font,'cutive');assert.equal(saved.marks[1].size,5);assert.ok(saved.marks[1].alpha<.5);
});
test('variable character spacing backspaces across actual advances and never reflows old ink',()=>{
 const p=page();strike(p,'a',{pitch:2});strike(p,' ',{pitch:4});strike(p,'b',{pitch:3});const marks=JSON.stringify(p.marks);
 assert.equal(cursorOffset(p),9);backspace(p);assert.equal(cursorOffset(p),6);backspace(p);assert.equal(cursorOffset(p),2);assert.equal(JSON.stringify(p.marks),marks);
 carriageReturn(p);assert.equal(cursorOffset(p),0);assert.deepEqual(p.advances,[]);
});
test('old pages without advance history continue at their saved mechanical position',()=>{
 const p=page();p.col=3;strike(p,'x',{pitch:3});assert.ok(Math.abs(cursorOffset(p)-10.62)<1e-8);backspace(p);assert.ok(Math.abs(cursorOffset(p)-7.62)<1e-8);backspace(p);assert.ok(Math.abs(cursorOffset(p)-5.08)<1e-8);
});
test('every shifted character selects its physical key and every stroke returns to rest',()=>{
 for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+{}:"<>?')assert.ok(SLUG_KEYS.includes(keyFor(ch)),ch);
 assert.equal(strikePhase(0),0);assert.equal(strikePhase(1),0);assert.equal(strikePhase(2),0);assert.ok(Math.abs(strikePhase(.34)-1)<.00001);
 assert.equal(effects({ink:100,drift:-1}).ink,1);assert.equal(effects({drift:-1}).drift,0);
});
