const rows=['1234567890-=','QWERTYUIOP[]',"ASDFGHJKL;'",'ZXCVBNM,./'];
export const SLUG_KEYS=rows.join('');
const shifted='!@#$%^&*()_+{}:"<>?';
const unshifted='1234567890-=[];\',./';
export function keyFor(ch){const i=shifted.indexOf(ch);return i<0?ch.toUpperCase():unshifted[i];}
export function shiftedFor(ch){const i=unshifted.indexOf(ch);return i<0?ch.toUpperCase():shifted[i];}
// Every stroke starts from a fixed rest pose. A new stroke replaces that part's track.
export function strikePhase(t){if(t<=0||t>=1)return 0;return t<.34?Math.sin(t/.34*Math.PI/2):Math.pow(1-(t-.34)/.66,2);}
