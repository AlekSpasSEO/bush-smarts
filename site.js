const siteRoot=document.body.dataset.root||'';
const menuButton=document.querySelector('.menu-toggle'),mobileNav=document.querySelector('.mobile-nav');
if(menuButton&&mobileNav){menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));menuButton.setAttribute('aria-label',open?'Open menu':'Close menu');mobileNav.hidden=open});mobileNav.addEventListener('click',event=>{if(event.target.closest('a')){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu')}})}
const dialog=document.querySelector('.search-dialog'),input=document.querySelector('#site-search'),results=document.querySelector('.search-results');
let searchIndex=[],searchLoaded=false;
function searchRender(){
 const q=input.value.trim().toLowerCase(),terms=q.split(/\s+/).filter(Boolean);
 const items=searchIndex.filter(x=>terms.every(term=>`${x.title} ${x.category} ${x.keywords}`.toLowerCase().includes(term))).slice(0,12);
 results.replaceChildren();
 if(!items.length){const p=document.createElement('p');p.className='search-empty';p.textContent=searchLoaded?'No matches. Try a brand, model, or category.':'Loading the product shelf…';results.append(p);return}
 for(const item of items){const a=document.createElement('a');a.href=siteRoot+item.url;const meta=document.createElement('span');meta.textContent=`${item.category} · ${item.type}`;const title=document.createElement('strong');title.textContent=item.title;const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');a.append(meta,title,arrow);results.append(a)}
}
document.querySelectorAll('.search-open').forEach(button=>button.addEventListener('click',async()=>{dialog.showModal();input.focus();searchRender();if(!searchLoaded){try{const response=await fetch(siteRoot+'search-index.json');if(!response.ok)throw Error('Search unavailable');searchIndex=await response.json();searchLoaded=true;searchRender()}catch{results.textContent='Search could not load. Browse the buying guides or product reviews from the menu.'}}}));
document.querySelector('.search-close')?.addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});input?.addEventListener('input',searchRender);
const grid=document.querySelector('[data-filter-grid]');
if(grid){const query=document.querySelector('[data-filter-search]'),category=document.querySelector('[data-filter-category]'),count=document.querySelector('[data-filter-count]'),empty=document.querySelector('.filter-empty');const filter=()=>{const terms=query.value.toLowerCase().trim().split(/\s+/).filter(Boolean),selected=category?.value||'';let n=0;grid.querySelectorAll('.product-card').forEach(card=>{const show=(!selected||card.dataset.category===selected)&&terms.every(t=>card.dataset.text.includes(t));card.hidden=!show;if(show)n++});count.textContent=`${n} review${n===1?'':'s'} shown`;empty.hidden=n!==0};query.addEventListener('input',filter);category?.addEventListener('change',filter);filter()}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const commerceNodes=[...document.querySelectorAll('[data-product-visual],[data-commerce],[data-commerce-inline]')];
const originalMarkup=new Map(commerceNodes.map(node=>[node,node.innerHTML]));
function link(url,text,className=''){const a=document.createElement('a');a.href=url;a.textContent=text;a.className=className;a.target='_blank';a.rel='sponsored noopener noreferrer';return a}
function validAmazon(url){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='www.amazon.com'}catch{return false}}
function validImage(url){try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='m.media-amazon.com'||u.hostname.endsWith('.ssl-images-amazon.com'))}catch{return false}}
function restoreCommerce(){for(const node of commerceNodes)node.innerHTML=originalMarkup.get(node)}
async function loadCommerce(){
 if(!commerceNodes.length)return;
 try{const response=await fetch(siteRoot+'amazon-current.json');if(!response.ok)return;const data=await response.json();const time=Date.parse(data.checkedAt),fresh=()=>Number.isFinite(time)&&Date.now()>=time&&Date.now()-time<86400000;
 if(!fresh())return;
 for(const node of commerceNodes){const id=node.dataset.productVisual||node.dataset.commerce||node.dataset.commerceInline,p=data.products?.[id];if(!p||!validAmazon(p.url))continue;
 if(node.dataset.productVisual&&p.image?.url&&validImage(p.image.url)){const a=link(p.url,'','amazon-product-image');const img=document.createElement('img');img.src=p.image.url;img.alt=p.title;img.loading='lazy';img.width=p.image.width||500;img.height=p.image.height||500;a.append(img);node.replaceChildren(a)}
 if(node.dataset.commerceInline){node.replaceChildren(link(p.url,'Check on Amazon ↗','text-link'));continue}
 if(node.dataset.commerce){const content=document.createElement('div');content.className='amazon-offer';const label=document.createElement('p');label.className='eyebrow';label.textContent='AMAZON LISTING';const title=link(p.url,p.title,'amazon-title');content.append(label,title);
 const rating=Number(p.rating?.displayValue??p.rating?.value??p.rating),ratingCount=Number(p.ratingCount?.displayValue??p.ratingCount);if(Number.isFinite(rating)&&rating>=1&&rating<=5){const stars=document.createElement('p');stars.className='amazon-rating';stars.textContent=`${rating} / 5 on Amazon${Number.isInteger(ratingCount)&&ratingCount>0?` · ${ratingCount.toLocaleString()} ratings`:''}`;content.append(stars)}
 if(p.price?.display){const price=document.createElement('p');price.className='amazon-price';price.textContent=p.price.display;content.append(price)}
 if(p.availability){const availability=document.createElement('p');availability.className='offer-availability';availability.textContent=p.availability;content.append(availability)}
 content.append(link(p.url,'View on Amazon ↗','button button-dark'));const date=document.createElement('p');date.className='offer-time';date.textContent=`Checked ${new Date(time).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'})}`;content.append(date);
 const note=document.createElement('p');note.className='offer-disclaimer';note.textContent='Prices and availability can change. The price and availability shown on Amazon at the time of purchase apply.';content.append(note);node.prepend(content);
 }
 }
 const delay=86400000-(Date.now()-time);setTimeout(restoreCommerce,Math.max(0,delay));
 }catch{/* Editorial content remains available when retail data cannot load. */}
}
loadCommerce();
