import {build} from 'vite';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..'),out=join(root,'dist-cloudflare');
await build({root,mode:'cloudflare',build:{outDir:out,emptyOutDir:true}});
const icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#684431"/><path fill="#f8f5e9" d="M146 78h220v180H146z"/><path stroke="#8c7962" stroke-width="8" d="M180 126h146M180 158h122M180 190h137"/><path fill="#a94e2d" d="M102 232h308l30 178H72z"/><rect x="88" y="223" width="336" height="36" rx="12" fill="#292e29"/><g fill="#eadbb9"><path d="M115 286h44v30h-44zm59 0h44v30h-44zm59 0h44v30h-44zm59 0h44v30h-44zm59 0h44v30h-44zM128 332h44v30h-44zm59 0h44v30h-44zm59 0h44v30h-44zm59 0h44v30h-44zm59 0h31v30h-31zM148 379h216v17H148z"/></g></svg>';
await writeFile(join(out,'icon.svg'),icon);
await writeFile(join(out,'manifest.webmanifest'),JSON.stringify({id:'/',name:'Dear, — A Realistic Online Typewriter',short_name:'Dear,',description:'A quiet typewriter. Your writing stays on this device.',start_url:'/',scope:'/',display:'standalone',background_color:'#684431',theme_color:'#a94e2d',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},null,2));
const html=await readFile(join(out,'index.html'),'utf8');
await writeFile(join(out,'index.html'),html.replace('</head>','<link rel="manifest" href="/manifest.webmanifest"><link rel="icon" type="image/svg+xml" href="/icon.svg"></head>'));
async function files(dir,prefix=''){const list=[];for(const item of await readdir(dir,{withFileTypes:true})){const rel=prefix+item.name;if(item.isDirectory())list.push(...await files(join(dir,item.name),rel+'/'));else list.push(rel);}return list;}
const assets=(await files(out)).sort();
for(const file of assets)if(file.split('/').some(p=>p.startsWith('.'))||/\.(?:db|sqlite|toml|map)$/i.test(file)||/^qa/.test(file))throw Error('Unexpected private or development file in deployment: '+file);
const template=await readFile(join(root,'deploy/cloudflare-sw.js'),'utf8'),hash=createHash('sha256').update(template);
for(const file of assets)hash.update(file).update(await readFile(join(out,file)));
const version=hash.digest('hex').slice(0,16);
await writeFile(join(out,'sw.js'),template.replace('__DEAR_VERSION__',version).replace('__DEAR_ASSETS__',JSON.stringify(assets.map(p=>'/'+p))));
await writeFile(join(out,'_redirects'),'/* /index.html 200\n');
await writeFile(join(out,'_headers'),'/sw.js\n  Cache-Control: no-cache\n  Service-Worker-Allowed: /\n/index.html\n  Cache-Control: no-cache\n/manifest.webmanifest\n  Cache-Control: no-cache\n');
console.log(`Cloudflare build: ${assets.length} cached static files; version ${version}; output ${out}`);
