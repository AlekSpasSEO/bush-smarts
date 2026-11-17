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
const matches=JSON.parse(await readFile('content/amazon-matches.json','utf8'));
const byProduct=new Map(all.map(p=>[p.id,p])),byAmazon=new Map();
for(const m of matches){if(!ids.has(m.id)||byAmazon.has(m.id)||!/^[A-Z0-9]{10}$/.test(m.asin)||!m.expectedBrands?.length||!m.identity.titleIncludes?.length)throw Error(`Incomplete or duplicate Amazon identity ${m.id}`);byAmazon.set(m.id,m.asin)}
function checkAmazon(html,id,where){
 const asin=byAmazon.get(id),links=[...html.matchAll(/<a\b[^>]*\bhref="https:\/\/www\.amazon\.com\/[^>]*>/g)];
 if(links.length!==(asin?1:0))throw Error(`Wrong number of Amazon links for ${id}: ${where}`);
 if(asin){const tag=links[0][0];if(!tag.includes(`href="https://www.amazon.com/dp/${asin}?tag=coffeedant03-20"`)||!tag.includes('rel="sponsored noopener noreferrer"')||!html.includes('(paid link)</small>'))throw Error(`Incorrect affiliate destination or disclosure for ${id}: ${where}`)}
 return links.length;
}
function checkSource(html,p,where){
 const source=p.sources.find(s=>s.type==='manufacturer')??p.sources.find(s=>s.type==='manual');
 const url=source?.url.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 const label=source?.type==='manufacturer'?'Manufacturer details':'Product documentation';
 if(!url||!html.includes(`class="text-link maker-link" href="${url}"`)||!html.includes(`>${label} ↗</a>`))throw Error(`Missing or mislabeled product source for ${p.id}: ${where}`);
}
let reviewLinks=0,guideLinks=0,guideSources=0;
for(const p of all){const file=`dist/reviews/${p.id}/index.html`,html=await readFile(file,'utf8');reviewLinks+=checkAmazon(html,p.id,file);checkSource(html,p,file)}
for(const g of groups.flatMap(d=>d.guides)){
 const file=`dist/guides/${g.id}/index.html`,html=await readFile(file,'utf8'),picks=[...html.matchAll(/<section class="listicle-pick">([\s\S]*?)<\/section>/g)];
 if(picks.length!==g.productIds.length)throw Error(`Wrong number of guide picks: ${file}`);
 for(const [i,id]of g.productIds.entries()){const pick=picks[i][1];if(!pick.includes(`href="../../reviews/${id}/"`))throw Error(`Wrong review for guide pick ${id}: ${file}`);guideLinks+=checkAmazon(pick,id,file);if(!byAmazon.has(id)){checkSource(pick,byProduct.get(id),file);guideSources++}}
}
const integrations=JSON.parse(await readFile('content/integrations.json','utf8'));
if(integrations.amazon?.enabled!==true){const snapshot=JSON.parse(await readFile('dist/amazon-current.json','utf8'));if(snapshot.paused!==true||snapshot.checkedAt!==null||Object.keys(snapshot.products).length)throw Error('Amazon data leaked into a paused build')}
console.log(`Validated ${all.length} reviews, ${groups.flatMap(d=>d.guides).length} guides, ${htmlFiles.length} HTML pages, and ${links} internal links. Verified ${reviewLinks} review and ${guideLinks} guide Amazon links, plus ${guideSources} guide source fallbacks.`);
