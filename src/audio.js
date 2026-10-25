import {Ambience} from './ambience.js';
// All mechanical sounds are recordings; sources and CC0 licenses are in /audio/LICENSE.txt.
const RECORDINGS = {
  key1: 'key-1.wav', key2: 'key-2.wav', key3: 'key-3.wav',
  key4: 'key-4.wav', key5: 'key-5.wav', space: 'space.wav',
  bell: 'bell.wav', return: 'return.mp3', shift: 'shift.mp3', paper: 'paper.mp3', platen: 'platen.mp3', summer: 'summer-coast-loop.wav', winter: 'winter-fireplace-loop.wav',
};

export class Sound {
  constructor() {
    this.settings = { mechanical: .65, environment: .4, master: .7, mechanicalOn:true, environmentOn:true };
    this.buffers = new Map();
    this.voices = new Set();
    this.loadErrors = [];
    this.lastKey = -1;
    this.winter = false;
    document.addEventListener('visibilitychange',()=>this.update());
    // Fetch before the first key, but create/resume the audio context only from a gesture.
    this.sources = Object.entries(RECORDINGS).map(async ([name, file]) => {
      try {
        const response = await fetch(`${import.meta.env?.BASE_URL || '/'}audio/${file}`);
        if (!response.ok) throw new Error(`${file}: ${response.status}`);
        return { name, bytes: await response.arrayBuffer() };
      } catch (error) {
        this.loadErrors.push({ name, error: String(error) });
        return null;
      }
    });
  }

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ready;
    }
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) return;
    this.ctx = new Audio({ latencyHint: 'interactive' });
    const c = this.ctx;
    if (c.state === 'suspended') c.resume().catch(() => {});
    this.master = c.createGain();
    this.master.gain.value = this.settings.master;
    this.master.connect(c.destination);

    this.mg=c.createGain();this.mg.connect(this.master);
    this.ag=c.createGain();this.ag.connect(this.master);this.ambientBuffers=new Map();this.ambience=new Ambience(c,this.ag,this.ambientBuffers);
    this.update();

    this.ready = Promise.all(this.sources.map(async source => {
      const item = await source;
      if (!item) return;
      try {
        const decoded = await c.decodeAudioData(item.bytes);
        if(item.name==='summer'||item.name==='winter'){
          this.ambientBuffers.set(item.name,decoded);this.update();
        }else this.buffers.set(item.name, this.trim(decoded, item.name));
      } catch (error) {
        this.loadErrors.push({ name: item.name, error: String(error) });
      }
    })).then(()=>this.update());
    return this.ready;
  }

  trim(buffer, kind) {
    // Original recordings include room silence. Remove it so the attack matches the key.
    const data = buffer.getChannelData(0);
    const rate = buffer.sampleRate;
    const peak = data.reduce((p, x) => Math.max(p, Math.abs(x)), 0);
    const threshold = Math.max(.003, peak * .018);
    let first = 0;
    while (first < data.length && Math.abs(data[first]) < threshold) first++;
    first = Math.max(0, first - Math.round(rate * .003));
    let last = data.length - 1;
    while (last > first && Math.abs(data[last]) < threshold * .25) last--;
    last = Math.min(data.length, last + Math.round(rate * .04));
    const maximum = kind === 'shift' ? .6 : kind === 'platen' ? .24 : kind === 'paper' ? 1.35 : 4;
    last = Math.min(last, first + Math.round(rate * maximum));
    const length = Math.max(1, last - first);
    const trimmed = this.ctx.createBuffer(buffer.numberOfChannels, length, rate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const out = trimmed.getChannelData(channel);
      out.set(buffer.getChannelData(channel).subarray(first, first + length));
      const fade = Math.min(Math.round(rate * .008), Math.floor(length / 4));
      for (let i = 0; i < fade; i++) out[length - 1 - i] *= i / fade;
    }
    return trimmed;
  }

  update(winter = this.winter) {
    this.winter=winter;if(!this.ctx)return;
    const t=this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.settings.master,t,.05);
    this.mg.gain.setTargetAtTime(this.settings.mechanicalOn===false?0:this.settings.mechanical,t,.035);
    this.ag.gain.setTargetAtTime(this.settings.environmentOn===false?0:this.settings.environment,t,.08);
    this.ambience.set(winter?'winter':'summer',!document.hidden&&this.settings.environmentOn!==false&&this.settings.environment>0&&this.settings.master>0);
  }

  play(kind = 'key') {
    if (!this.ctx || this.settings.mechanicalOn===false || this.settings.mechanical <= 0) return;
    let name = kind;
    if (kind === 'key') {
      let key = Math.floor(Math.random() * 5);
      if (key === this.lastKey) key = (key + 1) % 5;
      this.lastKey = key;
      name = `key${key + 1}`;
    } else if (kind === 'switch') name = 'space';
    const buffer = this.buffers.get(name);
    if (!buffer) {
      // The first gesture may arrive during decoding. Never replay an old burst of keys.
      const requestedAt = this.ctx.currentTime;
      this.ready?.then(() => {
        if (this.ctx.currentTime - requestedAt < .18 && this.buffers.has(name)) {
          this.playBuffer(name, this.buffers.get(name), kind);
        }
      });
      return;
    }
    this.playBuffer(name, buffer, kind);
  }

  playBuffer(name, buffer, kind) {
    if (this.settings.mechanicalOn===false || this.settings.mechanical <= 0 || this.ctx.state !== 'running') return;
    // Short overlapping releases are natural; cap voices during held/repeated keys.
    if (this.voices.size >= 18) {
      const oldest = this.voices.values().next().value;
      oldest.stop();
      this.voices.delete(oldest);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = kind === 'key' ? .99 + Math.random() * .02 : 1;
    const gain = this.ctx.createGain();
    const level = kind === 'bell' ? .62 : kind === 'paper' ? .6 : kind === 'switch' ? .48 : .88;
    gain.gain.value = level * (kind === 'key' ? .94 + Math.random() * .06 : 1);
    source.connect(gain).connect(this.mg);
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  }
}
