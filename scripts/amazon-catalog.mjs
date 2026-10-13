import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createAmazonClient,normalizeItem,resources} from './amazon-client.mjs';
const flag=n=>{const i=process.argv.indexOf(n);return i<0?null:process.argv[i+1]};
const queryFile=flag('--queries');
if(!queryFile)throw Error('Pass --queries with a JSON array of {id,query}.');
const output=flag('--output')||'.local/amazon-candidates.json';
const queries=JSON.parse(await readFile(queryFile,'utf8'));
const partnerTag=process.env.AMAZON_ASSOCIATE_TAG||'coffeedant03-20';
const client=await createAmazonClient({credentialsPath:flag('--credentials'),partnerTag});
let result={provider:'Amazon Creators API',marketplace:'www.amazon.com',partnerTag,checkedAt:new Date().toISOString(),queries:{}};
if(process.argv.includes('--resume'))try{result=JSON.parse(await readFile(output,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
await mkdir('.local',{recursive:true});
for(const entry of queries){
 if(result.queries[entry.id])continue;
 try{
  const payload=await client.search(entry.query);
  const items=(payload.searchResult?.items??[]).map(item=>({...normalizeItem(item),customerReviews:item.customerReviews??null}));
  result.queries[entry.id]={query:entry.query,checkedAt:new Date().toISOString(),items,errors:payload.errors??[]};
  console.log(`${entry.id}: ${items.length} candidate listings`);
 }catch(e){console.error(`${entry.id}: ${e.message}`);result.queries[entry.id]={query:entry.query,error:e.message,items:[]}}
 await writeFile(output,JSON.stringify(result,null,2));
 await new Promise(r=>setTimeout(r,1350));
}
console.log('Saved candidate evidence locally. Exact model and kit matching is required before publication.');
