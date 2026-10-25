import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const base=new URL(process.argv[2]||'https://dear-quiet-typewriter.pages.dev/');
if(base.protocol!=='https:'||base.hostname!=='dear-quiet-typewriter.pages.dev')throw Error('Use the fixed Dear production address.');
const html=await readFile(new URL('../dist-cloudflare/index.html',import.meta.url),'utf8');
const js=html.match(/src="(\/assets\/[^\"]+\.js)"/)[1],css=html.match(/href="(\/assets\/[^\"]+\.css)"/)[1];
const targets=[['/',/text\/html/],['/write/letter',/text\/html/],[js,/(?:javascript|ecmascript)/],[css,/text\/css/],['/manifest.webmanifest',/(?:json|manifest)/],['/sw.js',/(?:javascript|ecmascript)/],['/icon.svg',/image\/svg/]];
const results=await Promise.all(targets.map(async([path,mime])=>{
 try{const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(30000)}),body=await response.text(),type=response.headers.get('content-type')||'';
 const title=path==='/'||path==='/write/letter'?body.includes('<title>Dear, — A Realistic Online Typewriter</title>'):true;
 const manifest=path==='/manifest.webmanifest'?JSON.parse(body).start_url==='/':true;
 return {path,status:response.status,type,bytes:Buffer.byteLength(body),ok:response.status===200&&mime.test(type)&&title&&manifest};
 }catch(error){return {path,ok:false,error:String(error)};}
}));
const report={url:base.href,checkedAt:new Date().toISOString(),results,ok:results.every(r=>r.ok)};
if(process.argv[3])await writeFile(resolve(process.argv[3]),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
