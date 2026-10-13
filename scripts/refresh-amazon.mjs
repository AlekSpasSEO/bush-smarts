import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createAmazonClient,resources} from './amazon-client.mjs';
resources.push('customerReviews.starRating','customerReviews.count');
const flag=n=>{const i=process.argv.indexOf(n);return i<0?null:process.argv[i+1]};
const mappings=JSON.parse(await readFile('content/amazon-matches.json','utf8'));
const client=await createAmazonClient({credentialsPath:flag('--credentials')});
const snapshot={provider:'Amazon Creators API',marketplace:'www.amazon.com',checkedAt:new Date().toISOString(),products:{}};
const problems=[];
export function identityMatches(item,match){
 const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
 const brand=normalize(item.itemInfo?.byLineInfo?.brand?.displayValue),title=normalize(item.itemInfo?.title?.displayValue);
 if(!match.expectedBrands.some(b=>normalize(b)===brand))return false;
 const tokens=match.identity.titleIncludes??[];if(!tokens.every(t=>title.includes(normalize(t))))return false;
 const identifiers=[item.itemInfo?.manufactureInfo?.model?.displayValue,item.itemInfo?.manufactureInfo?.itemPartNumber?.displayValue].map(normalize);
 return !match.identity.model?.length||match.identity.model.some(id=>identifiers.includes(normalize(id)));
}
function saveItem(item,match){
 if(!identityMatches(item,match)){problems.push(`${match.id}: model identity mismatch`);return}
 const listing=item.offersV2?.listings?.find(l=>l.isBuyBoxWinner)??item.offersV2?.listings?.[0];
 const money=listing?.price?.money;
 snapshot.products[match.id]={asin:item.asin,title:item.itemInfo?.title?.displayValue,url:item.detailPageURL,image:item.images?.primary?.large??null,price:money&&!listing.violatesMAP?{amount:money.amount,currency:money.currency,display:money.displayAmount}:null,availability:listing?.availability?.message||null,seller:listing?.merchantInfo?.name??null,rating:item.customerReviews?.starRating??null,ratingCount:item.customerReviews?.count??null};
}
for(let offset=0;offset<mappings.length;offset+=10){
 const group=mappings.slice(offset,offset+10);
 try{
  const payload=await client.get(group.map(m=>m.asin));const items=payload.itemsResult?.items??[];
  for(const match of group){const item=items.find(i=>i.asin===match.asin);if(item)saveItem(item,match);else problems.push(`${match.id}: no current item`)}
 }catch(e){for(const match of group){try{const p=await client.get([match.asin]);const item=p.itemsResult?.items?.find(i=>i.asin===match.asin);if(item)saveItem(item,match);else problems.push(`${match.id}: unavailable`)}catch(err){problems.push(`${match.id}: ${err.message}`)}await new Promise(r=>setTimeout(r,1300))}}
 console.log(`Checked ${Math.min(offset+10,mappings.length)}/${mappings.length} verified identities`);await new Promise(r=>setTimeout(r,1300));
}
if(mappings.length&&!Object.keys(snapshot.products).length)throw Error('No verified Amazon items were returned; refusing an empty retail refresh.');
await mkdir('.local',{recursive:true});await writeFile('.local/amazon-current.json',JSON.stringify(snapshot,null,2));await writeFile('.local/amazon-refresh-report.json',JSON.stringify({matched:Object.keys(snapshot.products).length,requested:mappings.length,ratings:Object.values(snapshot.products).filter(p=>p.rating).length,problems},null,2));
console.log(JSON.stringify({verifiedProducts:Object.keys(snapshot.products).length,ratingsReturned:Object.values(snapshot.products).filter(p=>p.rating).length,problems}));
