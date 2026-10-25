const plain={Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",Backquote:'`',Comma:',',Period:'.',Slash:'/',Space:' ',NumpadDecimal:'.',NumpadAdd:'+',NumpadSubtract:'-',NumpadMultiply:'*',NumpadDivide:'/'};
const shifted={Minus:'_',Equal:'+',BracketLeft:'{',BracketRight:'}',Backslash:'|',Semicolon:':',Quote:'"',Backquote:'~',Comma:'<',Period:'>',Slash:'?'};
export const isTypeCharacter=value=>typeof value==='string'&&value.length===1&&/^[\u0020-\u007e\u00c0-\u024f]$/.test(value);
export function keyboardToken(event){
 if(event.ctrlKey||event.metaKey||event.altKey)return null;
 if(event.key==='Enter'||event.code==='Enter'||event.code==='NumpadEnter')return 'Enter';
 if(event.key==='Backspace'||event.code==='Backspace')return 'Backspace';
 if(!event.isComposing&&isTypeCharacter(event.key))return event.key;
 // A Latin mechanical keyboard still works while the OS input method reports Process/229.
 if(!event.isComposing&&event.key!=='Process'&&event.key!=='Unidentified'&&event.keyCode!==229)return null;
 const code=event.code||'';
 if(/^Key[A-Z]$/.test(code)){const upper=!!event.shiftKey!==!!event.getModifierState?.('CapsLock');return upper?code.slice(3):code.slice(3).toLowerCase();}
 if(/^Digit[0-9]$/.test(code)){const digit=code.slice(5);return event.shiftKey?')!@#$%^&*('[+digit]:digit;}
 if(/^Numpad[0-9]$/.test(code))return code.slice(6);
 return event.shiftKey&&shifted[code]||plain[code]||null;
}
