import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
const keys=['leaf-blowers','robot-mowers','diy-sheds','roofing-products'];
const groups=await Promise.all(keys.map(async k=>JSON.parse(await readFile(`research/${k}.json`,'utf8'))));
const all=groups.flatMap(d=>d.products),ids=new Set(all.map(p=>p.id));
if(all.length<50||all.length>70||ids.size!==all.length)throw Error('Expected 50–70 distinct product reviews');
for(const d of groups){
 if(d.category.labels.length!==5||d.guides.length<2||d.guides.length>4)throw Error(`Category structure invalid: ${d.category.id}`);
 const labels=new Set(d.category.labels.map(l=>l.id));
 for(const p of d.products){if(!p.sources?.length||!p.sections?.length||!p.pros?.length||!p.cons?.length)throw Error(`Incomplete review ${p.id}`);if(p.labels.some(l=>!labels.has(l)))throw Error(`Unknown label on ${p.id}`);for(const s of p.sources)if(!/^https:\/\//.test(s.url))throw Error(`Invalid source ${p.id}`)}
 for(const g of d.guides)for(const id of g.productIds)if(!d.products.some(p=>p.id===id))throw Error(`Missing/cross-category review ${id} in ${g.id}`);
 for(const p of d.products)if(!d.guides.some(g=>g.productIds.includes(p.id)))throw Error(`Review ${p.id} absent from all lists`);
}
const htmlFiles=[];async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())await walk(f);else if(f.endsWith('.html'))htmlFiles.push(f)}}await walk('dist');
let links=0;for(const file of htmlFiles){const html=await readFile(file,'utf8');const pageIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);if(new Set(pageIds).size!==pageIds.length)throw Error(`Duplicate DOM ID: ${file}`);for(const [,ref]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(https?:|mailto:|data:)/.test(ref))continue;const [target,anchor]=ref.split('#');const resolved=path.resolve(path.dirname(file),target||'.');let destination=target?resolved:path.resolve(file);if(target){const info=await stat(resolved).catch(()=>null);if(!info)throw Error(`Broken link ${file}: ${ref}`);if(info.isDirectory())destination=path.join(resolved,'index.html')}
 if(anchor&&destination.endsWith('.html')){const body=await readFile(destination,'utf8');if(!body.includes(`id="${anchor}"`))throw Error(`Broken anchor ${file}: ${ref}`)}links++}}
const matches=JSON.parse(await readFile('content/amazon-matches.json','utf8'));for(const m of matches){if(!ids.has(m.id)||!/^[A-Z0-9]{10}$/.test(m.asin)||!m.expectedBrands?.length||!m.identity.titleIncludes?.length)throw Error(`Incomplete Amazon identity ${m.id}`)}
console.log(`Validated ${all.length} reviews, ${groups.flatMap(d=>d.guides).length} guides, ${htmlFiles.length} HTML pages, ${links} internal links, and ${matches.length} Amazon identities.`);
